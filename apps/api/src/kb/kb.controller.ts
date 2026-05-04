// QA Nexus PM1 — KB chunk-search controller (M2 contract scaffold).
//
// Spec: Day-8 Step 4 — wire shape locked NOW so FE can implement F19
// search box + F30 KB browser against a stable contract while BE still
// returns demo `return_policy_v2.xlsx` fixtures.
//
// Endpoints:
//   POST /api/projects/:projectId/kb/search          (Admin/Lead/QAEng/Stake)
//   GET  /api/projects/:projectId/kb/chunks/:chunkId (Admin/Lead/QAEng/Stake)
//
// STUB DISCLAIMER: every response carries `stubbed: true`. M2 swap
// replaces controller body with EmbeddingService.embed(query) →
// vector(384) HNSW search → optional LLMGateway re-rank, returning the
// SAME wire shape with `stubbed: false`. FE banner can read this flag.

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  Role,
  KbSearchRequest,
  type KbSearchResponse,
  type ChunkDetailResponse,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { DEMO_CHUNKS, DEMO_CHUNK_BY_ID, toChunkDetail } from './kb.fixtures';

@Controller('api/projects/:projectId/kb')
@UseGuards(RolesGuard)
export class KbController {
  /**
   * STUB. Returns the demo-fixture chunks scored by a trivial keyword
   * heuristic so a query like "refund" surfaces the relevant chunks
   * higher than a query like "shipping". Final M2 implementation
   * replaces this with pgvector HNSW search.
   *
   * Sort + filter + cursor pagination wired with the production-shape
   * semantics so the FE doesn't need to refactor at M2 swap time:
   *   - sort=relevance        → preserves stub keyword-match ranking
   *   - sort=recency          → reverse chunkIndex (most recent = highest idx)
   *   - sort=source_file      → stable lexicographic by sourceFileName
   *   - filters.minRelevanceScore → applied AFTER ranking
   *   - filters.sourceFileIds → applied as set membership
   *   - page.cursor + limit   → opaque base64(offset) for now (M2: real cursor)
   */
  @Post('search')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async search(
    @Param('projectId') _projectId: string,
    @Body() body: unknown,
  ): Promise<KbSearchResponse> {
    const t0 = Date.now();
    const input = KbSearchRequest.parse(body);

    // Trivial keyword-overlap heuristic so the demo "feels real".
    // Any token in the query that appears in the chunk text bumps the
    // base relevance by +0.05; clamped to [0,1].
    const queryTokens = input.query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3);

    let scored = DEMO_CHUNKS.map((c) => {
      const text = c.chunkText.toLowerCase();
      const hits = queryTokens.reduce(
        (n, t) => (text.includes(t) ? n + 1 : n),
        0,
      );
      const adjustedScore = Math.min(1, c.relevanceScore! + hits * 0.05);
      return { ...c, relevanceScore: adjustedScore };
    });

    // Filters
    const f = input.filters;
    if (f.sourceFileIds && f.sourceFileIds.length > 0) {
      const set = new Set(f.sourceFileIds);
      scored = scored.filter((c) => set.has(c.sourceFileId));
    }
    if (f.minRelevanceScore !== undefined) {
      scored = scored.filter(
        (c) => (c.relevanceScore ?? 0) >= f.minRelevanceScore!,
      );
    }
    // templateKind filter: stub fixtures don't carry templateKind on
    // the chunk side (it lives on KbDocument). M2 will join.

    // Sort
    if (input.sort === 'relevance') {
      scored.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    } else if (input.sort === 'recency') {
      scored.sort((a, b) => b.chunkIndex - a.chunkIndex);
    } else {
      scored.sort((a, b) => a.sourceFileName.localeCompare(b.sourceFileName));
    }

    // Cursor pagination: cursor encodes the offset (real M2 will use
    // (relevance, chunkId) tuple). limit is hard-bounded by Zod (1..100).
    const { cursor, limit } = input.page;
    const offset = cursor
      ? Math.max(0, parseInt(Buffer.from(cursor, 'base64').toString(), 10) || 0)
      : 0;
    const slice = scored.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor =
      nextOffset < scored.length
        ? Buffer.from(String(nextOffset)).toString('base64')
        : null;

    return {
      ok: true,
      chunks: slice,
      total: scored.length,
      tookMs: Date.now() - t0,
      nextCursor,
      stubbed: true,
    };
  }

  /**
   * STUB. Detail endpoint resolves a chunkId to its full text +
   * neighbour pointers. M2 swap reads from kb_chunks JOIN kb_documents.
   */
  @Get('chunks/:chunkId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async detail(
    @Param('projectId') _projectId: string,
    @Param('chunkId') chunkId: string,
  ): Promise<ChunkDetailResponse> {
    const c = DEMO_CHUNK_BY_ID.get(chunkId);
    if (!c) {
      throw new NotFoundException(`chunk ${chunkId} not found`);
    }
    return {
      ok: true,
      chunk: toChunkDetail(c),
      stubbed: true,
    };
  }
}
