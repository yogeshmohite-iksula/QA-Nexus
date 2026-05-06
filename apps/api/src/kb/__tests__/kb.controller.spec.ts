// Stub the auth.service module so jest doesn't try to load better-auth
// (ESM-only package) when RolesGuard's transitive imports resolve.
jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

// Unit tests for KbController — Day-11 TASK 2 (real pgvector flip).
//
// Strategy: stub KbSearchService + AuthService + PrismaService —
// no real DB, no real WASM model load. Per-service behavior pinned in
// kb-search.service.spec.ts (KbSearchService unit tests).
//
// What this spec covers:
//   - Controller wires KbSearchService input correctly (projectId,
//     query, limit, filters)
//   - Response shape matches Zod KbSearchResponse contract
//   - `stubbed: false` on every response (post-Day-11 flip)
//   - Sort overrides (recency / source_file) re-sort the K hits
//   - Cursor pagination preserves the Step-4 base64(offset) format
//   - Detail endpoint enforces workspace check (cross-workspace 404)

import { NotFoundException } from '@nestjs/common';
import { KbController } from '../kb.controller';

const HEADERS_REQ = { headers: {} } as never;

const ACTOR_CTX = {
  workspaceId: 'ws-1',
  actorId: 'user-1',
  actorEmail: 'kishor.kadam@iksula.com',
};
const APP_USER = {
  id: ACTOR_CTX.actorId,
  email: ACTOR_CTX.actorEmail,
  workspaceId: ACTOR_CTX.workspaceId,
};

function makeAuthService() {
  return {
    resolveSession: jest.fn().mockResolvedValue({
      authUser: { id: 'auth-1', email: ACTOR_CTX.actorEmail, name: 'Kishor' },
      appUser: APP_USER,
      expiresAt: '2026-05-13T12:00:00.000Z',
    }),
  };
}

function fakeChunk(idx: number) {
  return {
    chunkId: `chunk-${idx}`,
    sourceFileId: 'doc-1',
    sourceFileName: 'return_policy_v2.xlsx',
    chunkText: `chunk text ${idx}`,
    chunkIndex: idx,
    source: { pageNo: null, lineRange: [idx, idx + 5] as [number, number] },
    relevanceScore: 0.9 - idx * 0.1,
    preview: `chunk text ${idx}`,
    metadataJson: {},
  };
}

function makeSearcher(chunks = [fakeChunk(0), fakeChunk(1), fakeChunk(2)]) {
  return {
    search: jest.fn().mockResolvedValue({ chunks, total: chunks.length }),
  };
}

function makePrisma() {
  return {
    kbChunk: {
      findUnique: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    project: {
      findUnique: jest.fn(),
    },
  };
}

describe('KbController (M2 real pgvector flip — Day-11 TASK 2)', () => {
  describe('search()', () => {
    it('flips stubbed=false and returns chunks from KbSearchService', async () => {
      const searcher = makeSearcher();
      const auth = makeAuthService();
      const prisma = makePrisma();
      const controller = new KbController(
        searcher as never,
        auth as never,
        prisma as never,
      );

      const out = await controller.search(
        'proj-RET',
        { query: 'refund' },
        HEADERS_REQ,
      );

      expect(out.stubbed).toBe(false); // Day-11 flip
      expect(out.ok).toBe(true);
      expect(out.chunks).toHaveLength(3);
      expect(out.total).toBe(3);
      expect(out.tookMs).toBeGreaterThanOrEqual(0);

      // KbSearchService.search invoked with correct input
      expect(searcher.search).toHaveBeenCalledTimes(1);
      const callArgs = searcher.search.mock.calls[0];
      expect(callArgs[0].projectId).toBe('proj-RET');
      expect(callArgs[0].query).toBe('refund');
      expect(callArgs[0].limit).toBe(20); // Zod default
      expect(callArgs[1].workspaceId).toBe(ACTOR_CTX.workspaceId);
      expect(callArgs[1].actorEmail).toBe(ACTOR_CTX.actorEmail);
    });

    it('passes filters through to KbSearchService', async () => {
      const searcher = makeSearcher();
      const auth = makeAuthService();
      const prisma = makePrisma();
      const controller = new KbController(
        searcher as never,
        auth as never,
        prisma as never,
      );

      await controller.search(
        'proj-RET',
        {
          query: 'refund',
          filters: {
            sourceFileIds: [
              '11111111-1111-1111-1111-111111111111',
              '22222222-2222-2222-2222-222222222222',
            ],
            minRelevanceScore: 0.5,
          },
        },
        HEADERS_REQ,
      );

      const callArgs = searcher.search.mock.calls[0][0];
      expect(callArgs.sourceFileIds).toEqual([
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ]);
      expect(callArgs.minRelevanceScore).toBe(0.5);
    });

    it('every chunk has the contract shape (no embedding leak)', async () => {
      const searcher = makeSearcher();
      const auth = makeAuthService();
      const prisma = makePrisma();
      const controller = new KbController(
        searcher as never,
        auth as never,
        prisma as never,
      );

      const out = await controller.search(
        'proj-RET',
        { query: 'return' },
        HEADERS_REQ,
      );
      for (const c of out.chunks) {
        expect(c).toHaveProperty('chunkId');
        expect(c).toHaveProperty('sourceFileId');
        expect(c).toHaveProperty('sourceFileName');
        expect(c).toHaveProperty('chunkText');
        expect(c).toHaveProperty('relevanceScore');
        // The 384-dim vector embedding is server-side only — must NEVER
        // appear on the wire.
        expect(c).not.toHaveProperty('embedding');
        expect(JSON.stringify(c)).not.toContain('"embedding"');
      }
    });

    it('sort=recency re-sorts hits by chunkIndex DESC', async () => {
      const chunks = [fakeChunk(2), fakeChunk(0), fakeChunk(1)];
      const searcher = makeSearcher(chunks);
      const auth = makeAuthService();
      const prisma = makePrisma();
      const controller = new KbController(
        searcher as never,
        auth as never,
        prisma as never,
      );

      const out = await controller.search(
        'proj-RET',
        { query: 'q', sort: 'recency' },
        HEADERS_REQ,
      );
      expect(out.chunks.map((c) => c.chunkIndex)).toEqual([2, 1, 0]);
    });

    it('cursor pagination preserves Step-4 base64(offset) contract', async () => {
      const chunks = Array.from({ length: 5 }, (_, i) => fakeChunk(i));
      const searcher = makeSearcher(chunks);
      const auth = makeAuthService();
      const prisma = makePrisma();
      const controller = new KbController(
        searcher as never,
        auth as never,
        prisma as never,
      );

      const out = await controller.search(
        'proj-RET',
        { query: 'q', page: { limit: 2 } },
        HEADERS_REQ,
      );
      expect(out.chunks).toHaveLength(2);
      expect(out.nextCursor).not.toBeNull();
      // base64(offset=2) → "Mg=="
      expect(Buffer.from(out.nextCursor!, 'base64').toString()).toBe('2');
    });

    it('Zod rejects empty query (min(1))', async () => {
      const searcher = makeSearcher();
      const auth = makeAuthService();
      const prisma = makePrisma();
      const controller = new KbController(
        searcher as never,
        auth as never,
        prisma as never,
      );

      await expect(
        controller.search('proj-RET', { query: '' }, HEADERS_REQ),
      ).rejects.toThrow();
    });
  });

  describe('detail()', () => {
    const CHUNK_ID = '11111111-2222-3333-4444-555555555555';
    const PROJECT_ID = 'proj-RET';

    function setupRow(opts: {
      project: { workspaceId: string } | null;
      chunkProjectId: string;
    }) {
      const prisma = makePrisma();
      prisma.kbChunk.findUnique.mockResolvedValue({
        id: CHUNK_ID,
        documentId: 'doc-1',
        chunkText: 'hello world',
        chunkIndex: 0,
        metadataJson: { pageNo: 1, lineRange: [10, 20] },
        document: {
          id: 'doc-1',
          title: 'return_policy_v2.xlsx',
          projectId: opts.chunkProjectId,
        },
      });
      prisma.project.findUnique.mockResolvedValue(opts.project);
      return prisma;
    }

    it('returns chunk with stubbed=false + neighbour pointers null', async () => {
      const prisma = setupRow({
        project: { workspaceId: ACTOR_CTX.workspaceId },
        chunkProjectId: PROJECT_ID,
      });
      const controller = new KbController(
        makeSearcher() as never,
        makeAuthService() as never,
        prisma as never,
      );

      const out = await controller.detail(PROJECT_ID, CHUNK_ID, HEADERS_REQ);
      expect(out.stubbed).toBe(false);
      expect(out.chunk.chunkId).toBe(CHUNK_ID);
      expect(out.chunk.relevanceScore).toBeNull();
      expect(out.chunk.neighbourPreviousChunkId).toBeNull();
      expect(out.chunk.neighbourNextChunkId).toBeNull();
      expect(out.chunk.source).toEqual({ pageNo: 1, lineRange: [10, 20] });
    });

    it('throws 404 when chunk does not exist', async () => {
      const prisma = makePrisma();
      prisma.kbChunk.findUnique.mockResolvedValue(null);
      const controller = new KbController(
        makeSearcher() as never,
        makeAuthService() as never,
        prisma as never,
      );

      await expect(
        controller.detail(PROJECT_ID, CHUNK_ID, HEADERS_REQ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when chunk belongs to a different project (no leak)', async () => {
      const prisma = setupRow({
        project: { workspaceId: ACTOR_CTX.workspaceId },
        chunkProjectId: 'proj-DIFFERENT',
      });
      const controller = new KbController(
        makeSearcher() as never,
        makeAuthService() as never,
        prisma as never,
      );

      await expect(
        controller.detail(PROJECT_ID, CHUNK_ID, HEADERS_REQ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when project belongs to a different workspace (no leak)', async () => {
      const prisma = setupRow({
        project: { workspaceId: 'ws-OTHER' },
        chunkProjectId: PROJECT_ID,
      });
      const controller = new KbController(
        makeSearcher() as never,
        makeAuthService() as never,
        prisma as never,
      );

      await expect(
        controller.detail(PROJECT_ID, CHUNK_ID, HEADERS_REQ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
