// QA Nexus PM1 — KbSearchService unit tests (Day-11 TASK 2).
//
// Strategy: stub PrismaService + AuditService + EmbeddingService —
// no real DB writes, no real WASM model load. Pins:
//   - Embed call invoked once per search (no caching at this layer)
//   - Raw SQL `$queryRawUnsafe` called with correct param order
//     (vector literal, projectId, workspaceId, limit, [optional sourceFiles])
//   - Workspace isolation enforced via WHERE workspace_id clause
//     (asserted by inspecting the SQL string)
//   - Audit row written with PII-redacted payload (query LENGTH +
//     token count ONLY, never the query text)
//   - Embedder failure → ServiceUnavailableException + audit failure row
//   - Wrong dim from embedder → throw (catches model-swap regressions)
//   - minRelevanceScore filter applied post-query
//   - Source-file filter passed through to SQL
//   - Empty result set → 200 OK with empty chunks
//   - Cosine similarity clamped to [0, 1] (handles FP drift on
//     near-orthogonal vectors)

jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import { ServiceUnavailableException } from '@nestjs/common';
import { KbSearchService } from '../kb-search.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'user-1',
  actorEmail: 'kishor.kadam@iksula.com',
};

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';

function makeFloat32(seed: number, len = 384): Float32Array {
  const arr = new Float32Array(len);
  for (let i = 0; i < len; i++) arr[i] = (seed + i) / 1000;
  return arr;
}

function makePrisma(rows: unknown[] = []) {
  return {
    $queryRawUnsafe: jest.fn().mockResolvedValue(rows),
  };
}

function makeAudit() {
  return { write: jest.fn().mockResolvedValue(undefined) };
}

function makeEmbedder(
  opts: { vector?: Float32Array; throwOnEmbed?: Error } = {},
) {
  return {
    embed: jest.fn().mockImplementation(() => {
      if (opts.throwOnEmbed) return Promise.reject(opts.throwOnEmbed);
      return Promise.resolve(opts.vector ?? makeFloat32(0));
    }),
    embedBatch: jest.fn(),
    status: jest.fn(),
  };
}

const SAMPLE_HIT = {
  chunk_id: 'c1',
  document_id: 'doc-1',
  document_title: 'return_policy_v2.xlsx',
  chunk_text: 'Refund eligibility window is 30 days from purchase.',
  chunk_index: 0,
  metadata_json: { pageNo: null, lineRange: [1, 5] },
  similarity: 0.87,
};

describe('KbSearchService — Day-11 TASK 2', () => {
  describe('search() — happy path', () => {
    it('embeds the query, runs raw SQL, returns shaped chunks', async () => {
      const prisma = makePrisma([SAMPLE_HIT]);
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      const result = await svc.search(
        { projectId: PROJECT_ID, query: 'refund window', limit: 10 },
        ctx,
      );

      expect(embedder.embed).toHaveBeenCalledTimes(1);
      expect(embedder.embed).toHaveBeenCalledWith('refund window');

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
      const sqlCall = prisma.$queryRawUnsafe.mock.calls[0];
      const sql = sqlCall[0];
      expect(sql).toMatch(/FROM kb_chunks c/i);
      expect(sql).toMatch(/JOIN kb_documents d/i);
      expect(sql).toMatch(/d\.workspace_id = \$3::uuid/i);
      expect(sql).toMatch(/c\.embedding <=> \$1::vector/i);
      expect(sql).toMatch(/LIMIT \$4/i);

      // Param order: [vector_literal, projectId, workspaceId, limit]
      expect(sqlCall[1]).toMatch(/^\[/); // pgvector literal starts with [
      expect(sqlCall[2]).toBe(PROJECT_ID);
      expect(sqlCall[3]).toBe(ctx.workspaceId);
      expect(sqlCall[4]).toBe(10);

      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].chunkId).toBe('c1');
      expect(result.chunks[0].sourceFileId).toBe('doc-1');
      expect(result.chunks[0].sourceFileName).toBe('return_policy_v2.xlsx');
      expect(result.chunks[0].relevanceScore).toBeCloseTo(0.87, 2);
      expect(result.chunks[0]).not.toHaveProperty('embedding');
    });

    it('audit payload has query LENGTH + token count, NOT query text', async () => {
      const prisma = makePrisma([SAMPLE_HIT]);
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await svc.search(
        {
          projectId: PROJECT_ID,
          query: 'sensitive customer refund detail',
          limit: 10,
        },
        ctx,
      );

      const auditCall = audit.write.mock.calls[0][0];
      expect(auditCall.action).toBe('kb_search_performed');
      expect(auditCall.payload.query_length).toBe(32); // "sensitive customer refund detail"
      expect(auditCall.payload.query_token_count).toBe(4);
      expect(auditCall.payload.result_count).toBe(1);
      // PII guard: query text MUST NEVER appear in the audit payload
      const auditStr = JSON.stringify(auditCall.payload);
      expect(auditStr).not.toContain('sensitive');
      expect(auditStr).not.toContain('customer');
      expect(auditStr).not.toContain('refund');
    });

    it('empty result set returns 200 with empty chunks', async () => {
      const prisma = makePrisma([]); // no hits
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      const result = await svc.search(
        { projectId: PROJECT_ID, query: 'no-such-content', limit: 10 },
        ctx,
      );
      expect(result.chunks).toEqual([]);
      expect(result.total).toBe(0);
      // Audit STILL written even on empty results (forensics)
      expect(audit.write).toHaveBeenCalledTimes(1);
      expect(audit.write.mock.calls[0][0].payload.result_count).toBe(0);
    });

    it('clamps similarity to [0, 1] (handles FP drift)', async () => {
      const prisma = makePrisma([
        { ...SAMPLE_HIT, similarity: 1.0001 }, // above 1 from FP drift
        { ...SAMPLE_HIT, chunk_id: 'c2', similarity: -0.0003 }, // below 0
      ]);
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      const result = await svc.search(
        { projectId: PROJECT_ID, query: 'q', limit: 10 },
        ctx,
      );
      expect(result.chunks[0].relevanceScore).toBe(1);
      expect(result.chunks[1].relevanceScore).toBe(0);
    });
  });

  describe('search() — filters', () => {
    it('passes sourceFileIds to SQL via $5::uuid[] param', async () => {
      const prisma = makePrisma([SAMPLE_HIT]);
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await svc.search(
        {
          projectId: PROJECT_ID,
          query: 'q',
          limit: 10,
          sourceFileIds: ['doc-1', 'doc-2'],
        },
        ctx,
      );
      const sqlCall = prisma.$queryRawUnsafe.mock.calls[0];
      expect(sqlCall[0]).toMatch(/d\.id = ANY\(\$5::uuid\[\]\)/i);
      expect(sqlCall[5]).toEqual(['doc-1', 'doc-2']);
    });

    it('omits sourceFileIds clause when filter is empty', async () => {
      const prisma = makePrisma([SAMPLE_HIT]);
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await svc.search(
        { projectId: PROJECT_ID, query: 'q', limit: 10, sourceFileIds: [] },
        ctx,
      );
      const sqlCall = prisma.$queryRawUnsafe.mock.calls[0];
      expect(sqlCall[0]).not.toMatch(/d\.id = ANY/i);
      expect(sqlCall.length).toBe(5); // no $5 param
    });

    it('applies minRelevanceScore filter post-query', async () => {
      const prisma = makePrisma([
        { ...SAMPLE_HIT, similarity: 0.9 },
        { ...SAMPLE_HIT, chunk_id: 'c2', similarity: 0.4 },
        { ...SAMPLE_HIT, chunk_id: 'c3', similarity: 0.2 },
      ]);
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      const result = await svc.search(
        {
          projectId: PROJECT_ID,
          query: 'q',
          limit: 10,
          minRelevanceScore: 0.5,
        },
        ctx,
      );
      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].chunkId).toBe('c1');
    });
  });

  describe('search() — error paths', () => {
    it('throws ServiceUnavailableException when embedder fails', async () => {
      const prisma = makePrisma([]);
      const audit = makeAudit();
      const embedder = makeEmbedder({
        throwOnEmbed: new Error('embedding model unavailable: deferred mode'),
      });
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await expect(
        svc.search({ projectId: PROJECT_ID, query: 'q', limit: 10 }, ctx),
      ).rejects.toThrow(ServiceUnavailableException);

      // Audit failure row written
      const failedCall = audit.write.mock.calls.find(
        (c) => c[0].action === 'kb_search_failed',
      );
      expect(failedCall).toBeDefined();
      expect(failedCall![0].payload.stage).toBe('embedding');
      // PII guard preserved on the failure row too
      expect(JSON.stringify(failedCall![0].payload)).not.toContain('"q"');

      // Raw SQL never called when embed fails
      expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('throws when embedder returns wrong-dim vector (catches model swap regressions)', async () => {
      const prisma = makePrisma([]);
      const audit = makeAudit();
      const embedder = makeEmbedder({ vector: makeFloat32(0, 256) }); // wrong dim
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await expect(
        svc.search({ projectId: PROJECT_ID, query: 'q', limit: 10 }, ctx),
      ).rejects.toThrow(/dim mismatch/);
      expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('search() — workspace isolation', () => {
    it('SQL query enforces workspace_id check (no leak)', async () => {
      const prisma = makePrisma([]);
      const audit = makeAudit();
      const embedder = makeEmbedder();
      const svc = new KbSearchService(
        prisma as never,
        audit as never,
        embedder as never,
      );

      await svc.search(
        { projectId: PROJECT_ID, query: 'q', limit: 10 },
        { ...ctx, workspaceId: 'ws-OTHER' },
      );
      const sqlCall = prisma.$queryRawUnsafe.mock.calls[0];
      // Workspace ID is the 3rd param + the SQL has the WHERE clause
      expect(sqlCall[3]).toBe('ws-OTHER');
      expect(sqlCall[0]).toMatch(/d\.workspace_id = \$3::uuid/i);
    });
  });
});
