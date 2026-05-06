// QA Nexus PM1 — KbSearchService.
//
// Spec: M2 Step 8 (Day-11 TASK 2). Replaces the Step-4 stub in
// `kb.controller.ts` with real pgvector(384) HNSW similarity search.
//
// Architecture:
//   - Embedder: low-level `EmbeddingService` (bge-small-en-v1.5, 384-dim)
//     embeds the query text. Single embed call per search; no caching
//     yet (M3 may add an LRU at the FE if perceived latency demands).
//   - Search: raw SQL `SELECT ... FROM kb_chunks JOIN kb_documents
//     ON ... WHERE document.projectId = $1 AND document.workspaceId = $2
//     ORDER BY embedding <=> $3 LIMIT $4`. Prisma's typed client can't
//     reference the `Unsupported("vector(384)")` column in WHERE/ORDER BY
//     clauses — raw SQL is the only path. The HNSW index on
//     kb_chunks.embedding (apps/api/prisma/raw/migrations/0002) makes
//     this O(log N) instead of O(N).
//   - Workspace isolation: enforced by JOIN-then-WHERE — chunks for
//     projects in OTHER workspaces are filtered out at the DB level
//     (no leak via 200/empty), no need for a 404 path.
//   - Audit: synchronous `kb_search_performed` row per call. PII guard:
//     payload carries `query_length` + `query_token_count` ONLY (never
//     the query text — search queries can leak business intent).
//
// Idempotency: search is read-only; the audit row tracks each call but
// the chunks aren't mutated.

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmbeddingService } from '../embedding/embedding.service';
import type { Chunk, ChunkSourceAttribution } from '@qa-nexus/shared';

const EXPECTED_DIM = 384;

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

export interface SearchInput {
  projectId: string;
  query: string;
  limit: number;
  /** Optional: restrict search to specific source files (KbDocument.id). */
  sourceFileIds?: string[];
  /** Optional: minimum cosine similarity (0..1) to filter low-confidence hits. */
  minRelevanceScore?: number;
}

export interface SearchResult {
  chunks: Chunk[];
  /** Total matches BEFORE the LIMIT was applied. Approximated as
   *  `chunks.length` for now — pgvector HNSW doesn't expose a cheap
   *  "total candidates" count, and a separate COUNT(*) query would
   *  defeat the index. Replace with pre-LIMIT subquery in M3 if FE
   *  requires accurate "1-20 of 247" pagination. */
  total: number;
}

interface RawHitRow {
  chunk_id: string;
  document_id: string;
  document_title: string;
  chunk_text: string;
  chunk_index: number;
  metadata_json: Record<string, unknown> | null;
  // Cosine similarity = 1 - (embedding <=> query_vector). pgvector's
  // `<=>` operator returns cosine DISTANCE in [0, 2]; we invert to
  // similarity in [-1, 1] then clamp to [0, 1] for FE display.
  similarity: number;
}

@Injectable()
export class KbSearchService {
  private readonly logger = new Logger(KbSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly embedder: EmbeddingService,
  ) {}

  /**
   * Search chunks within a project via pgvector HNSW similarity.
   *
   * @returns Top-N chunks ranked by cosine similarity, plus total
   *   (currently equals chunks.length — see SearchResult.total comment).
   *
   * Throws:
   *   - `ServiceUnavailableException` if the embedding model is in
   *     deferred mode (e.g. sharp binary missing on Render Linux x64
   *     before the Day-4 hotfix landed). FE shows "search temporarily
   *     unavailable" + advises retry in 1 min.
   */
  async search(input: SearchInput, ctx: ActorContext): Promise<SearchResult> {
    // 1. Embed the query. Single call; failure short-circuits the
    // whole search (no point hitting the DB without a vector).
    let queryVector: Float32Array;
    try {
      queryVector = await this.embedder.embed(input.query);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `KbSearch embed failure for projectId=${input.projectId}: ${reason}`,
      );
      // Audit the FAILED search so forensics can correlate.
      await this.auditSearchFailure(input, ctx, 'embedding', reason);
      throw new ServiceUnavailableException(
        `query embedding failed: ${reason}`,
      );
    }
    if (queryVector.length !== EXPECTED_DIM) {
      throw new Error(
        `query vector dim mismatch: expected ${EXPECTED_DIM}, got ${queryVector.length}`,
      );
    }

    // 2. Build the pgvector literal `[v1,v2,...,v384]` string.
    const literal = `[${Array.from(queryVector).join(',')}]`;

    // 3. Optional source-file filter — string-of-UUIDs ARRAY for the
    // `= ANY` clause. Empty/undefined skips the filter entirely.
    const sourceFileFilter =
      input.sourceFileIds && input.sourceFileIds.length > 0
        ? input.sourceFileIds
        : null;

    // 4. Run the search. JOIN guarantees we only see chunks whose
    // parent document belongs to BOTH the requested project AND the
    // actor's workspace — cross-workspace data is filtered server-side.
    // pgvector's `<=>` is the cosine-distance operator; the HNSW index
    // declared in 0002_vector_384_dim.sql accelerates the ORDER BY.
    const rows = await this.prisma.$queryRawUnsafe<RawHitRow[]>(
      `
      SELECT
        c.id              AS chunk_id,
        c.document_id     AS document_id,
        d.title           AS document_title,
        c.chunk_text      AS chunk_text,
        c.chunk_index     AS chunk_index,
        c.metadata_json   AS metadata_json,
        1 - (c.embedding <=> $1::vector) AS similarity
      FROM kb_chunks c
      JOIN kb_documents d ON d.id = c.document_id
      WHERE d.project_id  = $2::uuid
        AND d.workspace_id = $3::uuid
        AND c.embedding IS NOT NULL
        ${sourceFileFilter ? 'AND d.id = ANY($5::uuid[])' : ''}
      ORDER BY c.embedding <=> $1::vector
      LIMIT $4
      `,
      literal,
      input.projectId,
      ctx.workspaceId,
      input.limit,
      ...(sourceFileFilter ? [sourceFileFilter] : []),
    );

    // 5. Apply the optional minRelevanceScore filter post-query.
    // pgvector's `<=>` doesn't surface a clean "WHERE similarity >= X"
    // path without breaking the HNSW index — pre-filter in app layer
    // instead. M3 may add a stored-procedure for this if it matters.
    let filtered = rows;
    if (input.minRelevanceScore !== undefined) {
      filtered = rows.filter((r) => r.similarity >= input.minRelevanceScore!);
    }

    // 6. Map raw rows to Zod-shaped Chunk records.
    const chunks: Chunk[] = filtered.map((r) => {
      const meta = (r.metadata_json ?? {}) as Record<string, unknown>;
      const pageNo = typeof meta.pageNo === 'number' ? meta.pageNo : null;
      const lineRange =
        Array.isArray(meta.lineRange) &&
        meta.lineRange.length === 2 &&
        typeof meta.lineRange[0] === 'number' &&
        typeof meta.lineRange[1] === 'number'
          ? ([meta.lineRange[0], meta.lineRange[1]] as [number, number])
          : ([0, 0] as [number, number]);
      const source: ChunkSourceAttribution = { pageNo, lineRange };
      // Clamp similarity to [0, 1] — pgvector's `<=>` can return
      // slightly-negative values for orthogonal vectors due to FP drift.
      const relevance = Math.max(0, Math.min(1, r.similarity));
      const preview = r.chunk_text.slice(0, 240);
      return {
        chunkId: r.chunk_id,
        sourceFileId: r.document_id,
        sourceFileName: r.document_title,
        chunkText: r.chunk_text,
        chunkIndex: r.chunk_index,
        source,
        relevanceScore: relevance,
        preview,
        metadataJson: meta,
      };
    });

    // 7. Audit the search. PII guard: NEVER log the query text.
    // Capture only length + token count + result count + actor.
    const tokenCount = input.query.trim().split(/\s+/).filter(Boolean).length;
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'kb_search',
      entityId: input.projectId,
      action: 'kb_search_performed',
      payload: {
        project_id: input.projectId,
        query_length: input.query.length,
        query_token_count: tokenCount,
        result_count: chunks.length,
        limit: input.limit,
        source_file_filter_count: input.sourceFileIds?.length ?? 0,
        min_relevance_score: input.minRelevanceScore ?? null,
        actor_email: ctx.actorEmail,
      },
    });

    return { chunks, total: chunks.length };
  }

  /** Internal: write a failure-stage audit row for a search that never
   *  produced results (e.g. embedding model deferred). Best-effort —
   *  audit-write failure does NOT mask the original error. */
  private async auditSearchFailure(
    input: SearchInput,
    ctx: ActorContext,
    stage: 'embedding' | 'query',
    reason: string,
  ): Promise<void> {
    try {
      await this.audit.write({
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        entityType: 'kb_search',
        entityId: input.projectId,
        action: 'kb_search_failed',
        payload: {
          project_id: input.projectId,
          query_length: input.query.length,
          stage,
          reason: reason.slice(0, 500),
          actor_email: ctx.actorEmail,
        },
      });
    } catch (auditErr) {
      this.logger.error(
        `audit write for kb_search_failed itself failed: ` +
          `${auditErr instanceof Error ? auditErr.message : String(auditErr)}. ` +
          `Original failure stage=${stage} reason=${reason.slice(0, 200)}`,
      );
    }
  }
}
