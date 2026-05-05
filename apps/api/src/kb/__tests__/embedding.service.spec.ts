// QA Nexus PM1 — KbEmbeddingService unit tests (Day-8 Step 6).
//
// Strategy: stub PrismaService + AuditService + EmbeddingService —
// no real DB writes, no real WASM model load. Pins:
//   - 384-dim vector enforcement
//   - Idempotent no-op when all chunks already embedded
//   - Cross-workspace document → 404
//   - Audit row written on every call (incl. no-op)
//   - Determinism contract: same input text → same vector (mocked, but
//     pinned via the embedder mock returning identical Float32Array)
//   - Batch dispatch: embedBatch called once for N chunks (not N times)

jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KbEmbeddingService } from '../embedding.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'admin-1',
  actorEmail: 'yogesh.mohite@iksula.com',
};

const DOC_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_WS_DOC_ID = '22222222-2222-2222-2222-222222222222';
const NO_PROJECT_DOC_ID = '33333333-3333-3333-3333-333333333333';
const MISSING_DOC_ID = '99999999-9999-9999-9999-999999999999';

function makeFloat32(seed: number, len = 384): Float32Array {
  const arr = new Float32Array(len);
  for (let i = 0; i < len; i++) arr[i] = (seed + i) / 1000;
  return arr;
}

function makePrisma() {
  return {
    kbDocument: {
      findUnique: jest
        .fn()
        .mockImplementation(({ where }: { where: { id: string } }) => {
          if (where.id === DOC_ID) {
            return Promise.resolve({
              id: DOC_ID,
              project: { workspaceId: 'ws-1' },
            });
          }
          if (where.id === OTHER_WS_DOC_ID) {
            return Promise.resolve({
              id: OTHER_WS_DOC_ID,
              project: { workspaceId: 'ws-2' },
            });
          }
          if (where.id === NO_PROJECT_DOC_ID) {
            return Promise.resolve({
              id: NO_PROJECT_DOC_ID,
              project: null,
            });
          }
          return Promise.resolve(null);
        }),
    },
    kbChunk: {
      count: jest.fn().mockResolvedValue(3),
    },
    $queryRawUnsafe: jest.fn(),
    $transaction: jest
      .fn()
      .mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          $executeRawUnsafe: jest.fn().mockResolvedValue(1),
        };
        return await fn(tx);
      }),
  };
}

function makeAudit() {
  return { write: jest.fn().mockResolvedValue(undefined) };
}

function makeEmbedder(
  opts: { vectors?: Float32Array[]; throwOnEmbed?: Error } = {},
) {
  return {
    embedBatch: jest.fn().mockImplementation((texts: string[]) => {
      if (opts.throwOnEmbed) return Promise.reject(opts.throwOnEmbed);
      const out = opts.vectors ?? texts.map((_, i) => makeFloat32(i));
      return Promise.resolve(out);
    }),
    embed: jest.fn(),
    status: jest.fn().mockReturnValue({
      warm: true,
      modelId: 'Xenova/bge-small-en-v1.5',
      loadStartedAt: 1000,
      loadCompletedAt: 1500,
      loadDurationMs: 500,
      deferred: false,
      deferredReason: null,
    }),
  };
}

describe('KbEmbeddingService', () => {
  describe('embedDocument — happy path', () => {
    it('embeds NULL-embedding chunks and writes audit', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder();
      prisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'c1', chunk_text: 'chunk one text', chunk_index: 0 },
        { id: 'c2', chunk_text: 'chunk two text', chunk_index: 1 },
        { id: 'c3', chunk_text: 'chunk three text', chunk_index: 2 },
      ]);

      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );
      const result = await svc.embedDocument(DOC_ID, ctx);

      expect(result).toEqual({
        documentId: DOC_ID,
        embeddedCount: 3,
        totalChunks: 3,
        alreadyEmbedded: 0,
      });
      // embedBatch called ONCE for all 3 chunks (not 3 separate calls)
      expect(embedder.embedBatch).toHaveBeenCalledTimes(1);
      expect(embedder.embedBatch).toHaveBeenCalledWith([
        'chunk one text',
        'chunk two text',
        'chunk three text',
      ]);
      // audit written
      expect(audit.write).toHaveBeenCalledTimes(1);
      const auditCall = audit.write.mock.calls[0][0];
      expect(auditCall.action).toBe('kb_chunks_embedded');
      expect(auditCall.payload.embedded_count).toBe(3);
      expect(auditCall.payload.actor_email).toBe('yogesh.mohite@iksula.com');
      expect(auditCall.payload.embedder_status.modelId).toBe(
        'Xenova/bge-small-en-v1.5',
      );
    });

    it('handles partially-embedded document (only embeds NULL chunks)', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder();
      prisma.kbChunk.count.mockResolvedValue(5);
      prisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'c4', chunk_text: 'fourth chunk', chunk_index: 3 },
        { id: 'c5', chunk_text: 'fifth chunk', chunk_index: 4 },
      ]);

      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );
      const result = await svc.embedDocument(DOC_ID, ctx);

      expect(result.embeddedCount).toBe(2);
      expect(result.totalChunks).toBe(5);
      expect(result.alreadyEmbedded).toBe(3);
      expect(embedder.embedBatch).toHaveBeenCalledWith([
        'fourth chunk',
        'fifth chunk',
      ]);
    });
  });

  describe('embedDocument — idempotent no-op', () => {
    it('returns embeddedCount=0 when all chunks already embedded', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder();
      prisma.kbChunk.count.mockResolvedValue(8);
      prisma.$queryRawUnsafe.mockResolvedValue([]); // 0 NULL-embedding chunks

      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );
      const result = await svc.embedDocument(DOC_ID, ctx);

      expect(result).toEqual({
        documentId: DOC_ID,
        embeddedCount: 0,
        totalChunks: 8,
        alreadyEmbedded: 8,
      });
      // embedder NOT called for no-op
      expect(embedder.embedBatch).not.toHaveBeenCalled();
      // but audit IS still written (forensics — record the noop call)
      expect(audit.write).toHaveBeenCalledTimes(1);
      expect(audit.write.mock.calls[0][0].payload.noop).toBe(true);
    });
  });

  describe('embedDocument — error paths', () => {
    it('throws 404 when document does not exist', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await expect(svc.embedDocument(MISSING_DOC_ID, ctx)).rejects.toThrow(
        NotFoundException,
      );
      expect(embedder.embedBatch).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('throws 404 on cross-workspace document (no leak)', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await expect(svc.embedDocument(OTHER_WS_DOC_ID, ctx)).rejects.toThrow(
        NotFoundException,
      );
      expect(embedder.embedBatch).not.toHaveBeenCalled();
    });

    it('throws 404 when document has no project (defensive)', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await expect(svc.embedDocument(NO_PROJECT_DOC_ID, ctx)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 400 when document has no chunks (chunking not run)', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder();
      prisma.kbChunk.count.mockResolvedValue(0);

      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );
      await expect(svc.embedDocument(DOC_ID, ctx)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when embedder returns wrong-dim vector', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      // 256-dim instead of 384 — schema's vector(384) would reject
      const embedder = makeEmbedder({
        vectors: [new Float32Array(256), new Float32Array(384)],
      });
      prisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'c1', chunk_text: 'a', chunk_index: 0 },
        { id: 'c2', chunk_text: 'b', chunk_index: 1 },
      ]);

      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );
      await expect(svc.embedDocument(DOC_ID, ctx)).rejects.toThrow(
        /dim mismatch/,
      );
    });

    it('propagates embedder ServiceUnavailableException upward', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder({
        throwOnEmbed: new Error('embedding model unavailable: deferred mode'),
      });
      prisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'c1', chunk_text: 'a', chunk_index: 0 },
      ]);

      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );
      await expect(svc.embedDocument(DOC_ID, ctx)).rejects.toThrow(
        /embedding model unavailable/,
      );
      // audit NOT written when embed fails (we don't audit incomplete writes)
      expect(audit.write).not.toHaveBeenCalled();
    });
  });

  describe('embedDocument — security (no PII / no vector-leak in audit)', () => {
    it('audit payload omits chunk_text + raw vectors', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const embedder = makeEmbedder();
      prisma.$queryRawUnsafe.mockResolvedValue([
        {
          id: 'c1',
          chunk_text: 'sensitive policy detail leaked into chunk',
          chunk_index: 0,
        },
      ]);

      const svc = new KbEmbeddingService(
        prisma as never,
        audit as never,
        embedder as never,
      );
      await svc.embedDocument(DOC_ID, ctx);

      const auditPayload = audit.write.mock.calls[0][0].payload;
      const auditStr = JSON.stringify(auditPayload);
      expect(auditStr).not.toMatch(/sensitive policy detail/);
      expect(auditStr).not.toMatch(/Float32Array/);
      // counts + actor only
      expect(auditPayload).toHaveProperty('embedded_count');
      expect(auditPayload).toHaveProperty('total_chunks');
      expect(auditPayload).toHaveProperty('actor_email');
    });
  });
});
