// QA Nexus PM1 — UploadOrchestratorService unit tests (Day-8 Step 7).
//
// Strategy: stub ChunkingService + KbEmbeddingService + R2Service +
// AuditService — no real DB, no WASM model, no network. Pins:
//   - Happy path: r2.getObject → chunk → embed → audit completed
//   - Audit chain: started + completed pair on success
//   - Failure stages: r2_fetch / chunking / embedding all audit failed
//   - Embedding failure surfaces as 500 (chunks valid, embedding retryable)
//   - Cross-workspace document → 404 (delegated to chunking/embedding)
//   - Audit failure does NOT mask the original error
//   - totalDurationMs measured + non-negative

jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UploadOrchestratorService } from '../upload-orchestrator.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'admin-1',
  actorEmail: 'yogesh.mohite@iksula.com',
};

const DOC_ID = '11111111-1111-1111-1111-111111111111';
const FILE_NAME = 'return_policy_v2.xlsx';
const R2_KEY = 'projects/RET/uploads/return_policy_v2.xlsx';

function makeChunking(opts: { result?: unknown; error?: Error } = {}) {
  return {
    chunkDocument: jest.fn().mockImplementation(() => {
      if (opts.error) return Promise.reject(opts.error);
      return Promise.resolve(
        opts.result ?? {
          documentId: DOC_ID,
          format: 'xlsx',
          chunkCount: 8,
          firstChunkPreview: 'Section\tTitle\tContent\nFirst row of return p',
        },
      );
    }),
  };
}

function makeEmbedder(opts: { result?: unknown; error?: Error } = {}) {
  return {
    embedDocument: jest.fn().mockImplementation(() => {
      if (opts.error) return Promise.reject(opts.error);
      return Promise.resolve(
        opts.result ?? {
          documentId: DOC_ID,
          embeddedCount: 8,
          totalChunks: 8,
          alreadyEmbedded: 0,
        },
      );
    }),
  };
}

function makeR2(opts: { error?: Error } = {}) {
  return {
    getObject: jest.fn().mockImplementation(() => {
      if (opts.error) return Promise.reject(opts.error);
      return Promise.resolve(Buffer.from('fake xlsx bytes'));
    }),
  };
}

function makeAudit(opts: { writeError?: Error } = {}) {
  return {
    write: jest.fn().mockImplementation(() => {
      if (opts.writeError) return Promise.reject(opts.writeError);
      return Promise.resolve(undefined);
    }),
  };
}

describe('UploadOrchestratorService', () => {
  describe('finalize — happy path', () => {
    it('runs r2.getObject → chunk → embed → audit (started + completed)', async () => {
      const chunking = makeChunking();
      const embedder = makeEmbedder();
      const r2 = makeR2();
      const audit = makeAudit();

      const svc = new UploadOrchestratorService(
        chunking as never,
        embedder as never,
        r2 as never,
        audit as never,
      );

      const result = await svc.finalize(DOC_ID, FILE_NAME, R2_KEY, ctx);

      expect(result.documentId).toBe(DOC_ID);
      expect(result.chunking.chunkCount).toBe(8);
      expect(result.embedding.embeddedCount).toBe(8);
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);

      // Call sequence: r2 → chunking → embedding
      expect(r2.getObject).toHaveBeenCalledWith(R2_KEY);
      expect(chunking.chunkDocument).toHaveBeenCalledWith(
        DOC_ID,
        FILE_NAME,
        expect.any(Buffer),
        expect.objectContaining({ workspaceId: 'ws-1' }),
      );
      expect(embedder.embedDocument).toHaveBeenCalledWith(
        DOC_ID,
        expect.objectContaining({ workspaceId: 'ws-1' }),
      );

      // Audit chain: orchestration_started + orchestration_completed
      expect(audit.write).toHaveBeenCalledTimes(2);
      const startedCall = audit.write.mock.calls[0][0];
      const completedCall = audit.write.mock.calls[1][0];
      expect(startedCall.action).toBe('kb_document_orchestration_started');
      expect(startedCall.payload.r2_key).toBe(R2_KEY);
      expect(completedCall.action).toBe('kb_document_orchestration_completed');
      expect(completedCall.payload.chunk_count).toBe(8);
      expect(completedCall.payload.embedded_count).toBe(8);
      expect(completedCall.payload.total_duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('finalize — failure stages', () => {
    it('audits stage=r2_fetch and throws 404 when R2 fetch fails', async () => {
      const chunking = makeChunking();
      const embedder = makeEmbedder();
      const r2 = makeR2({ error: new Error('NoSuchKey') });
      const audit = makeAudit();

      const svc = new UploadOrchestratorService(
        chunking as never,
        embedder as never,
        r2 as never,
        audit as never,
      );

      await expect(
        svc.finalize(DOC_ID, FILE_NAME, R2_KEY, ctx),
      ).rejects.toThrow(NotFoundException);

      // chunking + embedding NEVER called — short-circuit at R2
      expect(chunking.chunkDocument).not.toHaveBeenCalled();
      expect(embedder.embedDocument).not.toHaveBeenCalled();

      // Audit: started + failed (NOT completed)
      const failedCall = audit.write.mock.calls.find(
        (c) => c[0].action === 'kb_document_orchestration_failed',
      );
      expect(failedCall).toBeDefined();
      expect(failedCall![0].payload.stage).toBe('r2_fetch');
      expect(failedCall![0].payload.reason).toBe('NoSuchKey');
    });

    it('audits stage=chunking and re-throws when chunking fails', async () => {
      const chunking = makeChunking({
        error: new BadRequestException('unsupported file format: foo.zip'),
      });
      const embedder = makeEmbedder();
      const r2 = makeR2();
      const audit = makeAudit();

      const svc = new UploadOrchestratorService(
        chunking as never,
        embedder as never,
        r2 as never,
        audit as never,
      );

      await expect(
        svc.finalize(DOC_ID, FILE_NAME, R2_KEY, ctx),
      ).rejects.toThrow(BadRequestException);

      // R2 + chunking called; embedding NOT called
      expect(r2.getObject).toHaveBeenCalled();
      expect(chunking.chunkDocument).toHaveBeenCalled();
      expect(embedder.embedDocument).not.toHaveBeenCalled();

      const failedCall = audit.write.mock.calls.find(
        (c) => c[0].action === 'kb_document_orchestration_failed',
      );
      expect(failedCall).toBeDefined();
      expect(failedCall![0].payload.stage).toBe('chunking');
      expect(failedCall![0].payload.reason).toMatch(/unsupported file format/);
    });

    it('audits stage=chunking and re-throws 404 on cross-workspace document', async () => {
      const chunking = makeChunking({
        error: new NotFoundException(`document ${DOC_ID} not found`),
      });
      const embedder = makeEmbedder();
      const r2 = makeR2();
      const audit = makeAudit();

      const svc = new UploadOrchestratorService(
        chunking as never,
        embedder as never,
        r2 as never,
        audit as never,
      );

      await expect(
        svc.finalize(DOC_ID, FILE_NAME, R2_KEY, ctx),
      ).rejects.toThrow(NotFoundException);

      const failedCall = audit.write.mock.calls.find(
        (c) => c[0].action === 'kb_document_orchestration_failed',
      );
      expect(failedCall![0].payload.stage).toBe('chunking');
    });

    it('audits stage=embedding and wraps as 500 when embedding fails after chunking', async () => {
      const chunking = makeChunking();
      const embedder = makeEmbedder({
        error: new Error('embedding model unavailable: deferred mode'),
      });
      const r2 = makeR2();
      const audit = makeAudit();

      const svc = new UploadOrchestratorService(
        chunking as never,
        embedder as never,
        r2 as never,
        audit as never,
      );

      await expect(
        svc.finalize(DOC_ID, FILE_NAME, R2_KEY, ctx),
      ).rejects.toThrow(InternalServerErrorException);

      // All three pre-failure stages ran
      expect(r2.getObject).toHaveBeenCalled();
      expect(chunking.chunkDocument).toHaveBeenCalled();
      expect(embedder.embedDocument).toHaveBeenCalled();

      const failedCall = audit.write.mock.calls.find(
        (c) => c[0].action === 'kb_document_orchestration_failed',
      );
      expect(failedCall![0].payload.stage).toBe('embedding');
      expect(failedCall![0].payload.reason).toMatch(
        /embedding model unavailable/,
      );
    });
  });

  describe('finalize — audit truncation + audit-failure resilience', () => {
    it('truncates failure reason to 500 chars in audit payload', async () => {
      const longReason = 'x'.repeat(2000);
      const chunking = makeChunking({ error: new Error(longReason) });
      const embedder = makeEmbedder();
      const r2 = makeR2();
      const audit = makeAudit();

      const svc = new UploadOrchestratorService(
        chunking as never,
        embedder as never,
        r2 as never,
        audit as never,
      );

      await expect(
        svc.finalize(DOC_ID, FILE_NAME, R2_KEY, ctx),
      ).rejects.toThrow();

      const failedCall = audit.write.mock.calls.find(
        (c) => c[0].action === 'kb_document_orchestration_failed',
      );
      expect(failedCall![0].payload.reason).toHaveLength(500);
    });

    it('does NOT mask original error when audit write itself fails', async () => {
      const chunking = makeChunking({
        error: new BadRequestException('unsupported format'),
      });
      const embedder = makeEmbedder();
      const r2 = makeR2();
      // First write (started) succeeds, second write (failed) throws
      const audit = {
        write: jest
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('audit_log table locked')),
      };

      const svc = new UploadOrchestratorService(
        chunking as never,
        embedder as never,
        r2 as never,
        audit as never,
      );

      // Original error (BadRequest from chunking) should still propagate,
      // NOT the audit-write error
      await expect(
        svc.finalize(DOC_ID, FILE_NAME, R2_KEY, ctx),
      ).rejects.toThrow(/unsupported format/);
    });
  });

  describe('finalize — security (audit payload bounded)', () => {
    it('orchestration audit rows do NOT include raw file bytes or chunk text', async () => {
      const chunking = makeChunking();
      const embedder = makeEmbedder();
      const r2 = makeR2();
      const audit = makeAudit();

      const svc = new UploadOrchestratorService(
        chunking as never,
        embedder as never,
        r2 as never,
        audit as never,
      );

      await svc.finalize(DOC_ID, FILE_NAME, R2_KEY, ctx);

      for (const call of audit.write.mock.calls) {
        const payloadStr = JSON.stringify(call[0].payload);
        expect(payloadStr).not.toMatch(/fake xlsx bytes/);
        expect(payloadStr).not.toMatch(/Float32Array/);
        // file NAME is fine in audit (already in chunking audit row);
        // file CONTENTS must not appear
      }
    });
  });
});
