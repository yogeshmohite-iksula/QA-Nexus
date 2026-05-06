// QA Nexus PM1 — KB chunk-search controller.
//
// Spec: Day-8 Step 4 (contract scaffold) + Day-11 TASK 2 (real pgvector
// HNSW search via KbSearchService).
//
// Endpoints:
//   POST /api/projects/:projectId/kb/search          (Admin/Lead/QAEng/Stake)
//   GET  /api/projects/:projectId/kb/chunks/:chunkId (Admin/Lead/QAEng/Stake)
//
// HISTORY:
//   - Step 4 (PR #30): wired the contract returning fixture chunks
//     scored by a keyword heuristic; `stubbed: true` on every response.
//   - Day-11 TASK 2 (this PR): flipped to real pgvector(384) HNSW
//     similarity search via KbSearchService. `stubbed: false` now.
//     FE wire shape unchanged — Zod KbSearchResponse / ChunkDetailResponse
//     identical pre/post swap; FE banner reads `stubbed` flag.

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  Role,
  KbSearchRequest,
  type KbSearchResponse,
  type ChunkDetailResponse,
  type ChunkDetail,
  type ChunkSourceAttribution,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { KbSearchService, type ActorContext } from './kb-search.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/projects/:projectId/kb')
@UseGuards(RolesGuard)
export class KbController {
  constructor(
    private readonly searcher: KbSearchService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  private async actorOf(req: Request): Promise<ActorContext> {
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException(
        'session disappeared between guard and handler',
      );
    }
    return {
      workspaceId: session.appUser.workspaceId,
      actorId: session.appUser.id,
      actorEmail: session.appUser.email,
    };
  }

  /**
   * REAL pgvector(384) HNSW similarity search via KbSearchService.
   * Wire shape unchanged from the Step-4 stub — FE Zod contract is
   * stable. `stubbed: false` flips the FE demo banner off.
   *
   * Sort + filter + cursor pagination behavior:
   *   - sort=relevance        → cosine similarity DESC (default; HNSW order)
   *   - sort=recency          → reverse chunkIndex (post-search re-sort)
   *   - sort=source_file      → lexicographic by sourceFileName (post-search re-sort)
   *   - filters.minRelevanceScore → KbSearchService applies pre-return
   *   - filters.sourceFileIds → KbSearchService applies in WHERE clause
   *   - page.cursor + limit   → Step-4 base64(offset) format preserved
   *                              (M3 swap to (similarity, chunkId) tuple
   *                              cursor when search hits >100k chunks)
   *
   * Workspace isolation: KbSearchService.search() JOIN-filters by
   * `kb_documents.workspace_id = ctx.workspaceId` so cross-workspace
   * chunks NEVER reach the response. No 404 path needed.
   */
  @Post('search')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async search(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<KbSearchResponse> {
    const t0 = Date.now();
    const input = KbSearchRequest.parse(body);
    const ctx = await this.actorOf(req);

    const { chunks: hits, total } = await this.searcher.search(
      {
        projectId,
        query: input.query,
        limit: input.page.limit,
        sourceFileIds: input.filters.sourceFileIds,
        minRelevanceScore: input.filters.minRelevanceScore,
      },
      ctx,
    );

    // Apply post-search sort overrides. Default `relevance` is HNSW
    // order (no-op); `recency` + `source_file` re-sort the K returned
    // hits in-memory (cheap at K ≤ 100).
    let sorted = hits;
    if (input.sort === 'recency') {
      sorted = [...hits].sort((a, b) => b.chunkIndex - a.chunkIndex);
    } else if (input.sort === 'source_file') {
      sorted = [...hits].sort((a, b) =>
        a.sourceFileName.localeCompare(b.sourceFileName),
      );
    }

    // Cursor pagination — preserved from Step-4 contract. The cursor
    // encodes the offset into the sorted hits array. Real M3 swap will
    // use a (similarity, chunkId) tuple cursor for stability across
    // concurrent inserts.
    const { cursor, limit } = input.page;
    const offset = cursor
      ? Math.max(0, parseInt(Buffer.from(cursor, 'base64').toString(), 10) || 0)
      : 0;
    const slice = sorted.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor =
      nextOffset < sorted.length
        ? Buffer.from(String(nextOffset)).toString('base64')
        : null;

    return {
      ok: true,
      chunks: slice,
      total,
      tookMs: Date.now() - t0,
      nextCursor,
      stubbed: false,
    };
  }

  /**
   * REAL chunk detail. Reads from `kb_chunks` JOIN `kb_documents` with
   * workspace check enforced. Cross-workspace chunkId → 404 (no leak,
   * no 403 — both leak existence). Same `stubbed: false` flip.
   *
   * Neighbour pointers (previous/next chunk in the same document by
   * chunkIndex) are fetched in a second round-trip; cheap because
   * `(documentId, chunkIndex)` is unique-indexed.
   */
  @Get('chunks/:chunkId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async detail(
    @Param('projectId') projectId: string,
    @Param('chunkId') chunkId: string,
    @Req() req: Request,
  ): Promise<ChunkDetailResponse> {
    const ctx = await this.actorOf(req);

    const row = await this.prisma.kbChunk.findUnique({
      where: { id: chunkId },
      select: {
        id: true,
        documentId: true,
        chunkText: true,
        chunkIndex: true,
        metadataJson: true,
        document: {
          select: { id: true, title: true, projectId: true },
        },
      },
    });
    if (!row) {
      throw new NotFoundException(`chunk ${chunkId} not found`);
    }

    // Workspace + project isolation. Cross-workspace OR cross-project
    // → 404 (existence leak avoided). Workspace check needs a second
    // lookup since KbDocument.workspaceId isn't on the immediate row;
    // we fetch the project to confirm both project + workspace match.
    if (row.document.projectId !== projectId) {
      throw new NotFoundException(`chunk ${chunkId} not found`);
    }
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    if (!project || project.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`chunk ${chunkId} not found`);
    }

    // Neighbour pointers — cheap thanks to (documentId, chunkIndex) unique idx.
    const [prev, next] = await Promise.all([
      this.prisma.kbChunk.findFirst({
        where: {
          documentId: row.documentId,
          chunkIndex: { lt: row.chunkIndex },
        },
        orderBy: { chunkIndex: 'desc' },
        select: { id: true },
      }),
      this.prisma.kbChunk.findFirst({
        where: {
          documentId: row.documentId,
          chunkIndex: { gt: row.chunkIndex },
        },
        orderBy: { chunkIndex: 'asc' },
        select: { id: true },
      }),
    ]);

    const meta = (row.metadataJson ?? {}) as Record<string, unknown>;
    const pageNo = typeof meta.pageNo === 'number' ? meta.pageNo : null;
    const lineRange =
      Array.isArray(meta.lineRange) &&
      meta.lineRange.length === 2 &&
      typeof meta.lineRange[0] === 'number' &&
      typeof meta.lineRange[1] === 'number'
        ? ([meta.lineRange[0], meta.lineRange[1]] as [number, number])
        : ([0, 0] as [number, number]);
    const source: ChunkSourceAttribution = { pageNo, lineRange };

    const chunk: ChunkDetail = {
      chunkId: row.id,
      sourceFileId: row.documentId,
      sourceFileName: row.document.title,
      chunkText: row.chunkText,
      chunkIndex: row.chunkIndex,
      source,
      relevanceScore: null, // detail endpoint never has a query → no score
      preview: row.chunkText.slice(0, 240),
      metadataJson: meta,
      neighbourPreviousChunkId: prev?.id ?? null,
      neighbourNextChunkId: next?.id ?? null,
    };

    return {
      ok: true,
      chunk,
      stubbed: false,
    };
  }
}
