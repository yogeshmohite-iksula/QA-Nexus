// QA Nexus PM1 — CuratorService (A2 / Duplicate Detection).
//
// Spec: M3 Day-13 TASK BE-3 (PR #97 scaffold) + Day-14 TASK B+2 real
// pgvector cosine impl. ADR-014 locks thresholds + index params + the
// embedding-model decision (Path C: pin bge-small/384-dim for pilot).
//
// Day-15-and-onward swap point now ACTIVE — service embeds the source
// case via `EmbeddingService.embed()` (bge-small 384-dim per ADR-003
// amendment) and runs a real pgvector HNSW cosine search against the
// project's other test_cases.
//
// Pipeline (ONLINE path, default):
//   1. assertCaseWorkspace → 404 cross-workspace OR cross-project
//   2. Audit `curator_dedupe_check_started` (PII guard: case_key only)
//   3. Fast-path: if project has 0 OTHER cases → return verdict='clear'
//   4. Build embed-input: title + preconditions + stepsJson concat
//   5. Embed via EmbeddingService.embed() → 384-dim Float32Array
//   6. Raw SQL via prisma.$queryRawUnsafe — pgvector cosine via `<=>`
//      operator (matches the cosine-ops HNSW index from Day-5
//      migration 0002_vector_384_dim.sql); excludes source case +
//      deprecated cases + null-embedding rows
//   7. Apply thresholds (ADR-014 §1): drop <flag, mark [flag,block)
//      as 'flag', mark >=block as 'block'
//   8. Sort similarity DESC, cap at topK (already SQL-ordered, but
//      slice in case the SQL fetch limit > topK)
//   9. Compute overall verdict from highest match (ADR-014 §1)
//   10. Audit `curator_dedupe_check_completed` with real metadata
//   11. Return { testCaseId, verdict, matches, thresholds, ...,
//                stubbed: false }
//
// Pipeline (OFFLINE path, when EmbeddingService.deferred=true OR
// CURATOR_OFFLINE=1 env var set):
//   - Replaces steps 4-6 with `generateCannedMatches()` Pattern A
//     fallback from PR #97. Sets `stubbed: true`. Same audit + wire
//     shape as ONLINE so FE doesn't need to branch.
//
// PII discipline (binding — pinned by curator.service.spec.ts):
//   - audit payload carries `case_keys` + `match_case_keys` + counts only
//   - NEVER candidate case titles (titles can leak business intent)
//   - NEVER raw embedding vectors
//   - NEVER source case body text (title/preconditions/steps)

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmbeddingService } from '../embedding/embedding.service';
import type {
  CuratorCheckRequest,
  CuratorCheckResponse,
  CuratorMatch,
  CuratorVerdict,
} from '@qa-nexus/shared';
import type { ActorContext } from './test-cases.service';

/// Offline-mode constants — used when EmbeddingService.deferred=true
/// or CURATOR_OFFLINE=1 emits canned matches without a pgvector call.
const STUB_CANDIDATES_SCANNED = 47;
const STUB_DURATION_MS = 38;

/// Hard ceiling on raw SQL fetch — keeps result row materialization
/// bounded even if topK request is large or similarity distribution
/// is flat. We fetch a few extra (topK × 2 capped at this) so the
/// app-side threshold filter has headroom; final response is then
/// sliced to topK.
const RAW_SQL_FETCH_CEILING = 50;

/// Shape of one row returned by the raw cosine SQL query. Fields
/// match the SELECT list 1:1.
interface RawCuratorMatchRow {
  id: string;
  key: string;
  title: string;
  similarity: number;
}

@Injectable()
export class CuratorService {
  private readonly logger = new Logger(CuratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly embedder: EmbeddingService,
  ) {}

  /// Resolve the source test case + assert it's in the actor's
  /// workspace. Cross-workspace OR cross-project caseId → 404.
  /// Also returns the case body fields needed for embed-input
  /// construction (title + preconditions + stepsJson).
  private async assertCaseWorkspace(
    projectId: string,
    caseId: string,
    ctx: ActorContext,
  ): Promise<{
    key: string;
    projectKey: string;
    title: string;
    preconditions: string;
    stepsJson: unknown;
  }> {
    const tc = await this.prisma.testCase.findUnique({
      where: { id: caseId },
      select: {
        projectId: true,
        key: true,
        title: true,
        preconditions: true,
        stepsJson: true,
        project: { select: { workspaceId: true, key: true } },
      },
    });
    if (
      !tc ||
      tc.projectId !== projectId ||
      tc.project.workspaceId !== ctx.workspaceId
    ) {
      throw new NotFoundException(
        `test case ${caseId} not found in this project`,
      );
    }
    return {
      key: tc.key,
      projectKey: tc.project.key,
      title: tc.title,
      preconditions: tc.preconditions,
      stepsJson: tc.stepsJson,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CHECK
  // ─────────────────────────────────────────────────────────────────

  async check(
    projectId: string,
    caseId: string,
    input: CuratorCheckRequest,
    ctx: ActorContext,
  ): Promise<CuratorCheckResponse> {
    const tc = await this.assertCaseWorkspace(projectId, caseId, ctx);
    const t0 = Date.now();

    // Audit: dedupe check started.
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'curator_check',
      entityId: caseId,
      action: 'curator_dedupe_check_started',
      payload: {
        project_id: projectId,
        test_case_id: caseId,
        workspace_id: ctx.workspaceId,
        case_key: tc.key,
        threshold_flag: input.thresholdFlag,
        threshold_block: input.thresholdBlock,
        top_k: input.topK,
        actor_email: ctx.actorEmail,
      },
    });

    // ────────────────────────────────────────────────────────────────
    // Online vs offline branch (ADR-014 §"Implementation plan").
    // ────────────────────────────────────────────────────────────────
    const offline = process.env.CURATOR_OFFLINE === '1';
    let allMatches: Array<Omit<CuratorMatch, 'verdict'>>;
    let candidatesScanned: number;
    let skippedNullEmbeddings = 0;
    let durationMs: number;
    let stubbed: boolean;

    if (offline || this.embedder.deferred) {
      // Offline / deferred-embedder path — emit canned matches.
      const reason = offline
        ? 'CURATOR_OFFLINE=1'
        : `embedding service deferred: ${this.embedder.deferredReason ?? 'unknown'}`;
      this.logger.log(`curator offline path engaged: ${reason}`);
      allMatches = this.generateCannedMatches(caseId, tc.projectKey);
      candidatesScanned = STUB_CANDIDATES_SCANNED;
      durationMs = STUB_DURATION_MS;
      stubbed = true;
    } else {
      // ONLINE path — real pgvector cosine search.
      const result = await this.pgvectorCosineSearch(
        projectId,
        caseId,
        tc,
        input.topK,
      );
      allMatches = result.matches;
      candidatesScanned = result.candidatesScanned;
      skippedNullEmbeddings = result.skippedNullEmbeddings;
      durationMs = result.durationMs;
      stubbed = false;
    }

    // Apply thresholds: drop < flag, mark [flag, block) as 'flag',
    // mark >= block as 'block'. (ADR-014 §1)
    const surfaced: CuratorMatch[] = [];
    for (const m of allMatches) {
      if (m.similarity < input.thresholdFlag) continue;
      const verdict = m.similarity >= input.thresholdBlock ? 'block' : 'flag';
      surfaced.push({ ...m, verdict });
    }

    // Sort by similarity DESC + cap at topK.
    surfaced.sort((a, b) => b.similarity - a.similarity);
    const matches = surfaced.slice(0, input.topK);

    // Overall verdict derived from highest match (ADR-014 §1).
    const highestSimilarity = matches[0]?.similarity ?? 0;
    let verdict: CuratorVerdict = 'clear';
    if (highestSimilarity >= input.thresholdBlock) {
      verdict = 'block';
    } else if (highestSimilarity >= input.thresholdFlag) {
      verdict = 'flag';
    }

    // Audit: dedupe check completed.
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'curator_check',
      entityId: caseId,
      action: 'curator_dedupe_check_completed',
      payload: {
        project_id: projectId,
        test_case_id: caseId,
        workspace_id: ctx.workspaceId,
        case_key: tc.key,
        verdict,
        highest_similarity: highestSimilarity,
        matches_returned: matches.length,
        // PII guard: we record the keys of matches, NEVER titles.
        match_case_keys: matches.map((m) => m.candidateCaseKey),
        candidates_scanned: candidatesScanned,
        // ADR-014 §8 — backlog observability for un-embedded cases.
        skipped_null_embeddings: skippedNullEmbeddings,
        duration_ms: durationMs,
        stubbed,
        actor_email: ctx.actorEmail,
      },
    });

    // Belt-and-suspenders: log total elapsed (audit captured search-only
    // duration; this catches embed + audit overhead too).
    const totalMs = Date.now() - t0;
    if (totalMs > 500) {
      this.logger.warn(
        `curator check slow: case_key=${tc.key} totalMs=${totalMs} ` +
          `searchMs=${durationMs} candidates=${candidatesScanned} stubbed=${stubbed}`,
      );
    }

    return {
      ok: true,
      testCaseId: caseId,
      verdict,
      highestSimilarity,
      matches,
      thresholds: {
        flag: input.thresholdFlag,
        block: input.thresholdBlock,
      },
      searchMetadata: {
        candidatesScanned,
        durationMs,
      },
      stubbed,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // ONLINE — real pgvector cosine search (ADR-014 §"Implementation plan")
  // ─────────────────────────────────────────────────────────────────

  private async pgvectorCosineSearch(
    projectId: string,
    sourceCaseId: string,
    tc: { title: string; preconditions: string; stepsJson: unknown },
    topK: number,
  ): Promise<{
    matches: Array<Omit<CuratorMatch, 'verdict'>>;
    candidatesScanned: number;
    skippedNullEmbeddings: number;
    durationMs: number;
  }> {
    const searchT0 = Date.now();

    // ADR-014 §8 — empty-corpus fast-path. Skip embed + SQL if no
    // candidates exist; saves ~50ms + a Xenova WASM bridge crossing.
    const candidateCount = await this.prisma.testCase.count({
      where: {
        projectId,
        id: { not: sourceCaseId },
        status: { not: 'deprecated' },
      },
    });
    if (candidateCount === 0) {
      return {
        matches: [],
        candidatesScanned: 0,
        skippedNullEmbeddings: 0,
        durationMs: Date.now() - searchT0,
      };
    }

    // Count of un-embedded candidates that would otherwise be in scope —
    // exposed in audit metadata for backlog observability per ADR-014 §8.
    // Raw SQL because Prisma's typed WHERE can't reference the
    // `Unsupported("vector(384)")` column (same constraint that forces
    // the cosine search itself to be raw).
    const skippedNullRows = await this.prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `
      SELECT COUNT(*)::bigint AS count
      FROM test_cases c
      WHERE c.project_id = $1::uuid
        AND c.id        != $2::uuid
        AND c.status    != 'deprecated'
        AND c.embedding IS NULL
      `,
      projectId,
      sourceCaseId,
    );
    const skippedNullEmbeddings = Number(skippedNullRows[0]?.count ?? 0n);

    // Build the embed-input from the source case body. ADR-014 §8 +
    // §"Implementation plan" — concat title + preconditions + steps.
    const stepsConcat = this.serializeStepsForEmbed(tc.stepsJson);
    const embedInput =
      `${tc.title}\n${tc.preconditions}\n${stepsConcat}`.trim();

    // Embed via the global EmbeddingService (bge-small 384-dim).
    // EmbeddingService waits for model load on first call (~7s cold,
    // ~50ms warm). Smoke-tested Day-14 TASK B2.4.
    const queryVector = await this.embedder.embed(embedInput);

    // pgvector literal `[v1,v2,...,v384]` — same pattern KbSearchService
    // uses for chunk-search (M2 PR #57).
    const literal = `[${Array.from(queryVector).join(',')}]`;

    // Fetch a few extra so app-side threshold filter has headroom; SQL
    // already orders by similarity DESC via the cosine-ops HNSW index.
    const fetchLimit = Math.min(topK * 2, RAW_SQL_FETCH_CEILING);

    // Raw SQL — pgvector `<=>` is the cosine-distance operator. The
    // `test_cases_embedding_hnsw_idx` (cosine-ops, m=16, ef_construction=64)
    // from Day-5 migration 0002_vector_384_dim.sql accelerates the ORDER BY.
    // Similarity = 1 - distance.
    const rows = await this.prisma.$queryRawUnsafe<RawCuratorMatchRow[]>(
      `
      SELECT
        c.id        AS id,
        c.key       AS key,
        c.title     AS title,
        1 - (c.embedding <=> $1::vector) AS similarity
      FROM test_cases c
      WHERE c.project_id  = $2::uuid
        AND c.id          != $3::uuid
        AND c.embedding   IS NOT NULL
        AND c.status      != 'deprecated'
      ORDER BY c.embedding <=> $1::vector
      LIMIT $4
      `,
      literal,
      projectId,
      sourceCaseId,
      fetchLimit,
    );

    // Map raw rows → CuratorMatch shape (without verdict — set by
    // the caller's threshold loop). Tie-break: SQL already sorted by
    // similarity ASC of distance (= DESC of similarity); no further sort
    // needed at this layer (stable per ADR-014 §4 — created_at DESC
    // tie-break is a Day-15+ refinement, NOT in this Day-14 cut).
    const matches = rows.map((r) => ({
      candidateCaseId: r.id,
      candidateCaseKey: r.key,
      candidateCaseTitle: r.title,
      // pgvector returns Decimal/numeric on cosine distance (pg-types
      // casts to JS number for vector ops, but defense-in-depth here).
      similarity: roundTo(Number(r.similarity), 4),
    }));

    return {
      matches,
      // candidatesScanned = the unfiltered set the search ran against
      // (ADR-014 §8 audit metadata). Excludes deprecated + source.
      candidatesScanned: candidateCount - skippedNullEmbeddings,
      skippedNullEmbeddings,
      durationMs: Date.now() - searchT0,
    };
  }

  /// Serialize stepsJson to a flat string for embedding. Handles
  /// the canonical stepsJson shape (array of {order, action, expected})
  /// + degrades gracefully on null/undefined/malformed input. NEVER
  /// throws — defense in depth, the embed input must always be valid.
  private serializeStepsForEmbed(stepsJson: unknown): string {
    if (!Array.isArray(stepsJson)) return '';
    return stepsJson
      .map((s: unknown) => {
        if (typeof s !== 'object' || s === null) return '';
        const o = s as Record<string, unknown>;
        const action = typeof o.action === 'string' ? o.action : '';
        const expected = typeof o.expected === 'string' ? o.expected : '';
        return `${action} ${expected}`.trim();
      })
      .filter((s) => s.length > 0)
      .join('\n');
  }

  // ─────────────────────────────────────────────────────────────────
  // OFFLINE — Pattern A canned-matches generator (preserved from #97).
  //
  // Fired when EmbeddingService.deferred=true (no model loaded — e.g.,
  // local dev without the 33MB bge-small download) OR CURATOR_OFFLINE=1
  // env var set explicitly. Same wire shape as ONLINE path so FE
  // doesn't branch.
  // ─────────────────────────────────────────────────────────────────

  private generateCannedMatches(
    caseId: string,
    projectKey: string,
  ): Array<Omit<CuratorMatch, 'verdict'>> {
    const hash = createHash('sha256').update(caseId).digest('hex');
    const hexInt = parseInt(hash.slice(0, 4), 16);
    const baseSim = 0.5 + (hexInt / 65535) * 0.5; // 0.5..1.0

    return [
      {
        candidateCaseId: `${hash.slice(0, 8)}-aaaa-4aaa-8aaa-${hash.slice(8, 20)}`,
        candidateCaseKey: `TC-${projectKey}-001`,
        candidateCaseTitle:
          'Refund initiated within 7 days lands in customer account',
        similarity: roundTo(baseSim, 3),
      },
      {
        candidateCaseId: `${hash.slice(0, 8)}-bbbb-4bbb-8bbb-${hash.slice(8, 20)}`,
        candidateCaseKey: `TC-${projectKey}-002`,
        candidateCaseTitle: 'Refund within 7 days credits customer wallet',
        similarity: roundTo(Math.max(0, baseSim - 0.05), 3),
      },
      {
        candidateCaseId: `${hash.slice(0, 8)}-cccc-4ccc-8ccc-${hash.slice(8, 20)}`,
        candidateCaseKey: `TC-${projectKey}-003`,
        candidateCaseTitle: 'Refund processed successfully end-to-end',
        similarity: roundTo(Math.max(0, baseSim - 0.15), 3),
      },
    ];
  }
}

/// Round to N decimal places. Used to keep similarity scores readable
/// in the wire payload + stable across JSON serialization round-trips.
function roundTo(n: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(n * factor) / factor;
}
