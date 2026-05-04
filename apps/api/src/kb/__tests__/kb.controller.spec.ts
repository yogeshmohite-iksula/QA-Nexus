// Stub the auth.service module so jest doesn't try to load better-auth
// (ESM-only package) when RolesGuard's transitive imports resolve.
// Same trick used in project-roles.guard.spec.ts (Day-5).
jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

// Unit tests for KbController — Day-8 Step 4 (M2 contract scaffold).
//
// Strategy: instantiate the controller directly + override the
// RolesGuard via Test.createTestingModule. No real RBAC checks here
// (those are pinned by Day-6 invitations + project-members suites);
// these tests verify the wire-shape contract + stub-disclosure flag +
// keyword heuristic + sort/filter/pagination + 404 path.

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KbController } from '../kb.controller';
import { RolesGuard } from '../../auth/rbac/roles.guard';

describe('KbController (M2 stub scaffold)', () => {
  let controller: KbController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [KbController],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(KbController);
  });

  describe('search()', () => {
    it('happy path — returns chunks + stubbed=true + tookMs ≥ 0', async () => {
      const out = await controller.search('proj-RET', { query: 'refund' });
      expect(out.ok).toBe(true);
      expect(out.stubbed).toBe(true);
      expect(out.chunks.length).toBeGreaterThan(0);
      expect(out.total).toBeGreaterThan(0);
      expect(out.tookMs).toBeGreaterThanOrEqual(0);
      expect(out.nextCursor).toBeDefined();
    });

    it('every chunk has the contract shape (no embedding leak)', async () => {
      const out = await controller.search('proj-RET', { query: 'return' });
      for (const c of out.chunks) {
        expect(c).toHaveProperty('chunkId');
        expect(c).toHaveProperty('sourceFileId');
        expect(c).toHaveProperty('sourceFileName');
        expect(c).toHaveProperty('chunkText');
        expect(c).toHaveProperty('chunkIndex');
        expect(c).toHaveProperty('source');
        expect(c).toHaveProperty('relevanceScore');
        expect(c).toHaveProperty('preview');
        // The 384-dim vector embedding is server-side only — must NEVER
        // appear on the wire.
        expect(c).not.toHaveProperty('embedding');
        expect(JSON.stringify(c)).not.toContain('embedding');
      }
    });

    it('keyword heuristic boosts relevance for matching tokens', async () => {
      // "refund" appears in chunks RET_0002, RET_0003 — they should rank near top.
      const out = await controller.search('proj-RET', {
        query: 'refund processing window',
      });
      // Top result's score is bumped above its base of 0.71 (RET_0003 base).
      expect(out.chunks[0].relevanceScore).toBeGreaterThan(0.7);
      // Sorted by relevance desc when sort=relevance (default).
      for (let i = 1; i < out.chunks.length; i++) {
        expect(out.chunks[i].relevanceScore!).toBeLessThanOrEqual(
          out.chunks[i - 1].relevanceScore!,
        );
      }
    });

    it('filters.minRelevanceScore drops low-confidence hits', async () => {
      const out = await controller.search('proj-RET', {
        query: 'admin', // weak match — most chunks land mid/low
        filters: { minRelevanceScore: 0.5 },
      });
      for (const c of out.chunks) {
        expect(c.relevanceScore!).toBeGreaterThanOrEqual(0.5);
      }
    });

    it('filters.sourceFileIds restricts to specified files', async () => {
      const realId = '11111111-1111-1111-1111-111111111111';
      const fakeId = '99999999-9999-9999-9999-999999999999';
      // Real-only → returns chunks
      const real = await controller.search('proj-RET', {
        query: 'returns',
        filters: { sourceFileIds: [realId] },
      });
      expect(real.chunks.length).toBeGreaterThan(0);
      // Fake-only → empty
      const fake = await controller.search('proj-RET', {
        query: 'returns',
        filters: { sourceFileIds: [fakeId] },
      });
      expect(fake.chunks).toHaveLength(0);
      expect(fake.total).toBe(0);
    });

    it('sort=recency reverses by chunkIndex (highest first)', async () => {
      const out = await controller.search('proj-RET', {
        query: 'returns',
        sort: 'recency',
      });
      for (let i = 1; i < out.chunks.length; i++) {
        expect(out.chunks[i].chunkIndex).toBeLessThan(
          out.chunks[i - 1].chunkIndex,
        );
      }
    });

    it('cursor pagination — page 2 picks up where page 1 ends', async () => {
      const page1 = await controller.search('proj-RET', {
        query: 'returns',
        page: { limit: 3 },
      });
      expect(page1.chunks).toHaveLength(3);
      expect(page1.nextCursor).not.toBeNull();

      const page2 = await controller.search('proj-RET', {
        query: 'returns',
        page: { limit: 3, cursor: page1.nextCursor! },
      });
      expect(page2.chunks).toHaveLength(3);
      // No overlap with page 1.
      const page1Ids = new Set(page1.chunks.map((c) => c.chunkId));
      for (const c of page2.chunks) {
        expect(page1Ids.has(c.chunkId)).toBe(false);
      }
    });

    it('last page — nextCursor is null', async () => {
      // Demo set has 8 chunks; limit=20 returns all + nextCursor null.
      const out = await controller.search('proj-RET', {
        query: 'returns',
        page: { limit: 20 },
      });
      expect(out.chunks.length).toBe(8);
      expect(out.nextCursor).toBeNull();
    });

    it('Zod rejects empty query (parser-side guard)', async () => {
      await expect(
        controller.search('proj-RET', { query: '' }),
      ).rejects.toThrow(); // ZodError
    });
  });

  describe('detail()', () => {
    const KNOWN_CHUNK_ID = '22222222-2222-2222-2222-000000000003';

    it('happy path — returns chunk + neighbour pointers + stubbed=true', async () => {
      const out = await controller.detail('proj-RET', KNOWN_CHUNK_ID);
      expect(out.ok).toBe(true);
      expect(out.stubbed).toBe(true);
      expect(out.chunk.chunkId).toBe(KNOWN_CHUNK_ID);
      // relevanceScore MUST be null on detail endpoint (no query was issued).
      expect(out.chunk.relevanceScore).toBeNull();
      expect(out.chunk.neighbourPreviousChunkId).toBe(
        '22222222-2222-2222-2222-000000000002',
      );
      expect(out.chunk.neighbourNextChunkId).toBe(
        '22222222-2222-2222-2222-000000000004',
      );
    });

    it('first chunk has null previous neighbour', async () => {
      const out = await controller.detail(
        'proj-RET',
        '22222222-2222-2222-2222-000000000001',
      );
      expect(out.chunk.neighbourPreviousChunkId).toBeNull();
      expect(out.chunk.neighbourNextChunkId).toBe(
        '22222222-2222-2222-2222-000000000002',
      );
    });

    it('last chunk has null next neighbour', async () => {
      const out = await controller.detail(
        'proj-RET',
        '22222222-2222-2222-2222-000000000008',
      );
      expect(out.chunk.neighbourNextChunkId).toBeNull();
    });

    it('unknown chunkId → 404', async () => {
      await expect(
        controller.detail('proj-RET', 'nope-not-a-real-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
