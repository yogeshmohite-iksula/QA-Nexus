// QA Nexus PM1 — CuratorService (A2 / Duplicate Detection).
//
// Spec: M3 Day-13 TASK BE-3 (stretch). Pattern A scaffold — returns
// canned similarity scores. Day-16 swaps the service body to call
// pgvector cosine search against the project's existing test_case
// embeddings (per ADR-014, lands Day-15).
//
// Why Pattern A first:
//   - F14m2 Composer review modal needs the Curator ⓘ near-dup
//     banner this week. FE+1 wants a stable wire shape to design
//     against before Day-16's real pgvector query lands.
//   - Real pgvector HNSW cosine search requires the test_case
//     embedding column to be populated (Day-15+ work after Composer
//     starts inserting cases).
//   - Locking the contract NOW (canned matches, audit row written)
//     lets FE flip from `stubbed: true` → `stubbed: false` with zero
//     downstream changes when Day-16 lands.
//
// Pipeline (Pattern A):
//   1. assertCaseWorkspace → 404 cross-workspace caseId (no leak)
//   2. Audit `curator_dedupe_check_started`
//   3. Generate canned matches against 2-3 fictional candidates
//      (deterministic from caseId hash so tests are stable)
//   4. Apply thresholds: drop < flag, mark [flag, block) as 'flag',
//      mark >= block as 'block'
//   5. Sort by similarity DESC, cap at topK
//   6. Compute overall verdict from highest match
//   7. Audit `curator_dedupe_check_completed`
//   8. Return { testCaseId, verdict, matches, thresholds, ... stubbed: true }
//
// PII discipline: audit payload carries case_keys + counts only.
// NEVER case titles (titles can leak business intent).

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  CuratorCheckRequest,
  CuratorCheckResponse,
  CuratorMatch,
  CuratorVerdict,
} from '@qa-nexus/shared';
import type { ActorContext } from './test-cases.service';

/// Day-16 swap target. Centralized so the Day-16 PR has a single
/// search-and-replace point. Mirrors ComposerService's
/// COMPOSER_LLM_PROVIDER constant pattern from PR #93.
const STUB_CANDIDATES_SCANNED = 47; // realistic for an Iksula project mid-M3
const STUB_DURATION_MS = 38; // pgvector HNSW typically 20-50ms

@Injectable()
export class CuratorService {
  private readonly logger = new Logger(CuratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /// Resolve the source test case + assert it's in the actor's
  /// workspace. Cross-workspace OR cross-project caseId → 404.
  private async assertCaseWorkspace(
    projectId: string,
    caseId: string,
    ctx: ActorContext,
  ): Promise<{ key: string; projectKey: string }> {
    const tc = await this.prisma.testCase.findUnique({
      where: { id: caseId },
      select: {
        projectId: true,
        key: true,
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
    return { key: tc.key, projectKey: tc.project.key };
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
    // Pattern A scaffold — Day-16 swap point.
    // ────────────────────────────────────────────────────────────────
    // Day-16 will: embed the source case via EmbeddingService.embed()
    // (using the case's title + preconditions + stepsJson concatenated),
    // run raw SQL against `test_cases` with a pgvector HNSW cosine
    // similarity search like:
    //   SELECT c.id, c.key, c.title,
    //          1 - (c.embedding <=> $1::vector) AS similarity
    //   FROM test_cases c
    //   WHERE c.project_id = $2::uuid
    //     AND c.id != $3::uuid              -- exclude the source
    //     AND c.embedding IS NOT NULL
    //     AND c.status != 'deprecated'      -- skip archived
    //   ORDER BY c.embedding <=> $1::vector
    //   LIMIT $4
    // Apply thresholds in app code, return matches.
    //
    // Today's Pattern A returns canned matches derived deterministically
    // from a hash of (caseId) so tests are stable + the FE can demo
    // the banner UX without seeded test data.
    const allMatches = this.generateCannedMatches(caseId, tc.projectKey);

    // Apply thresholds: drop < flag, mark [flag, block) as 'flag',
    // mark >= block as 'block'.
    const surfaced: CuratorMatch[] = [];
    for (const m of allMatches) {
      if (m.similarity < input.thresholdFlag) continue;
      const verdict = m.similarity >= input.thresholdBlock ? 'block' : 'flag';
      surfaced.push({ ...m, verdict });
    }

    // Sort by similarity DESC + cap at topK.
    surfaced.sort((a, b) => b.similarity - a.similarity);
    const matches = surfaced.slice(0, input.topK);

    // Overall verdict derived from highest match.
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
        candidates_scanned: STUB_CANDIDATES_SCANNED,
        duration_ms: STUB_DURATION_MS,
        stubbed: true, // Day-16 flips this off
        actor_email: ctx.actorEmail,
      },
    });

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
        candidatesScanned: STUB_CANDIDATES_SCANNED,
        durationMs: STUB_DURATION_MS,
      },
      stubbed: true,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Pattern A canned-matches generator
  //
  // Returns 3 fictional candidate matches with similarity scores
  // derived deterministically from a hash of the source caseId. The
  // first 4 hex digits of the hash become a number in [0, 65535],
  // mapped to a similarity score in [0, 1] — same caseId always
  // produces same matches (stable for tests, demo-friendly for FE).
  //
  // Day-16 deletes this method.
  // ─────────────────────────────────────────────────────────────────

  private generateCannedMatches(
    caseId: string,
    projectKey: string,
  ): Array<Omit<CuratorMatch, 'verdict'>> {
    // Three fictional candidates with offsets from the base similarity.
    // Deterministic per caseId so test snapshots are stable.
    const hash = createHash('sha256').update(caseId).digest('hex');
    // First 4 hex digits → [0, 65535] → scale to [0.5, 1.0] window.
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
