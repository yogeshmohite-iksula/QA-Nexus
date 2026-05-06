// QA Nexus PM1 — KbDocumentsService unit tests (Day-11 TASK 4).
//
// Strategy: stub PrismaService + AuditService + R2Service. Pins:
//   - List: paginated, project-scoped, workspace check enforced
//   - List: cross-workspace project → 404 (no leak)
//   - Detail: returns doc + most-recent K chunks
//   - Detail: cross-project chunkId → 404
//   - Delete: R2 lookup via audit_log → R2 delete → DB delete → audit
//   - Delete: cross-workspace 404
//   - Delete: doc never chunked → R2 delete skipped, DB still proceeds
//   - Delete: R2 failure → 500 + DB row PRESERVED (Yogesh ordering)
//   - PII guard: title text NEVER in audit (only title_length)

jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { KbDocumentsService } from '../kb-documents.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'user-1',
  actorEmail: 'akshay.panchal@iksula.com',
};

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const PROJECT_OTHER = '22222222-2222-2222-2222-222222222222';
const DOC_ID = '33333333-3333-3333-3333-333333333333';
const R2_KEY = 'projects/RET/uploads/SENSITIVE_FILENAME_DO_NOT_LEAK.pdf';

function makePrisma(
  opts: {
    project?: { workspaceId: string } | null;
    projectOther?: { workspaceId: string } | null;
    doc?: {
      id: string;
      projectId: string;
      title: string;
      chunkCount?: number;
    } | null;
    docDetail?: unknown;
    list?: unknown[];
    listCount?: number;
    lastChunkAudit?: { payload: Record<string, unknown> } | null;
    deleteThrows?: Error;
  } = {},
) {
  return {
    project: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === PROJECT_ID) {
          return Promise.resolve(
            opts.project === undefined ? { workspaceId: 'ws-1' } : opts.project,
          );
        }
        if (where.id === PROJECT_OTHER) {
          return Promise.resolve(
            opts.projectOther === undefined
              ? { workspaceId: 'ws-OTHER' }
              : opts.projectOther,
          );
        }
        return Promise.resolve(null);
      }),
    },
    kbDocument: {
      findMany: jest.fn().mockResolvedValue(opts.list ?? []),
      count: jest.fn().mockResolvedValue(opts.listCount ?? 0),
      findUnique: jest.fn().mockImplementation(({ where, select }) => {
        if (where.id === DOC_ID) {
          // Detail mode includes full chunks; service-list mode includes _count
          if (opts.docDetail !== undefined && select?.bodyMd) {
            return Promise.resolve(opts.docDetail);
          }
          if (opts.doc === undefined) {
            return Promise.resolve({
              id: DOC_ID,
              projectId: PROJECT_ID,
              title: R2_KEY, // worst case — title contains PII
              _count: { chunks: 8 },
            });
          }
          if (opts.doc === null) return Promise.resolve(null);
          return Promise.resolve({
            ...opts.doc,
            _count: { chunks: opts.doc.chunkCount ?? 0 },
          });
        }
        return Promise.resolve(null);
      }),
      delete: jest.fn().mockImplementation(() => {
        if (opts.deleteThrows) return Promise.reject(opts.deleteThrows);
        return Promise.resolve({ id: DOC_ID });
      }),
    },
    auditLog: {
      findFirst: jest
        .fn()
        .mockResolvedValue(
          opts.lastChunkAudit === undefined
            ? { payload: { r2_key: R2_KEY } }
            : opts.lastChunkAudit,
        ),
    },
  };
}

function makeAudit() {
  return { write: jest.fn().mockResolvedValue(undefined) };
}

function makeR2(opts: { deleteThrows?: Error } = {}) {
  return {
    deleteObject: jest.fn().mockImplementation(() => {
      if (opts.deleteThrows) return Promise.reject(opts.deleteThrows);
      return Promise.resolve(undefined);
    }),
    getObject: jest.fn(),
  };
}

describe('KbDocumentsService — Day-11 TASK 4', () => {
  describe('list()', () => {
    it('returns paginated documents + total + workspace-scoped', async () => {
      const prisma = makePrisma({
        list: [
          {
            id: 'd1',
            projectId: PROJECT_ID,
            title: 'doc 1',
            templateKind: 'requirement',
            pinned: true,
            authorId: 'u1',
            createdAt: new Date('2026-05-01'),
            updatedAt: new Date('2026-05-01'),
            _count: { chunks: 5 },
          },
        ],
        listCount: 7,
      });
      const svc = new KbDocumentsService(
        prisma as never,
        makeAudit() as never,
        makeR2() as never,
      );

      const result = await svc.list({ projectId: PROJECT_ID }, ctx);
      expect(result.total).toBe(7);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20); // default
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].chunkCount).toBe(5);
      expect(result.documents[0].pinned).toBe(true);

      // Workspace check happened (project.findUnique called)
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        select: { workspaceId: true },
      });
    });

    it('throws 404 when project belongs to a different workspace (no leak)', async () => {
      const prisma = makePrisma({
        project: { workspaceId: 'ws-OTHER' }, // not actor's workspace
      });
      const svc = new KbDocumentsService(
        prisma as never,
        makeAudit() as never,
        makeR2() as never,
      );

      await expect(svc.list({ projectId: PROJECT_ID }, ctx)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.kbDocument.findMany).not.toHaveBeenCalled();
    });

    it('clamps pageSize > 100 to 100', async () => {
      const prisma = makePrisma();
      const svc = new KbDocumentsService(
        prisma as never,
        makeAudit() as never,
        makeR2() as never,
      );

      const result = await svc.list(
        { projectId: PROJECT_ID, pageSize: 9999 },
        ctx,
      );
      expect(result.pageSize).toBe(100);
      expect(prisma.kbDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('detail()', () => {
    it('returns doc with most-recent K chunks', async () => {
      const prisma = makePrisma({
        docDetail: {
          id: DOC_ID,
          projectId: PROJECT_ID,
          title: 'return_policy_v2.xlsx',
          bodyMd: 'doc body',
          templateKind: 'requirement',
          pinned: false,
          authorId: 'u1',
          createdAt: new Date('2026-05-01'),
          updatedAt: new Date('2026-05-01'),
          chunks: [
            { id: 'c0', chunkIndex: 0, chunkText: 'chunk 0', metadataJson: {} },
            { id: 'c1', chunkIndex: 1, chunkText: 'chunk 1', metadataJson: {} },
          ],
          _count: { chunks: 8 },
        },
      });
      const svc = new KbDocumentsService(
        prisma as never,
        makeAudit() as never,
        makeR2() as never,
      );

      const detail = await svc.detail(PROJECT_ID, DOC_ID, undefined, ctx);
      expect(detail.id).toBe(DOC_ID);
      expect(detail.bodyMd).toBe('doc body');
      expect(detail.chunkCount).toBe(8);
      expect(detail.chunks).toHaveLength(2);
    });

    it('throws 404 when doc belongs to a different project (no leak)', async () => {
      const prisma = makePrisma({
        docDetail: {
          id: DOC_ID,
          projectId: PROJECT_OTHER, // wrong project
          title: 't',
          bodyMd: 'b',
          templateKind: 'r',
          pinned: false,
          authorId: 'u1',
          createdAt: new Date(),
          updatedAt: new Date(),
          chunks: [],
          _count: { chunks: 0 },
        },
      });
      const svc = new KbDocumentsService(
        prisma as never,
        makeAudit() as never,
        makeR2() as never,
      );

      await expect(
        svc.detail(PROJECT_ID, DOC_ID, undefined, ctx),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete() — happy path', () => {
    it('R2 first → DB delete → audit (chunks cascade via FK)', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const r2 = makeR2();
      const svc = new KbDocumentsService(
        prisma as never,
        audit as never,
        r2 as never,
      );

      const result = await svc.delete(PROJECT_ID, DOC_ID, ctx);

      // R2 lookup happened via audit_log
      expect(prisma.auditLog.findFirst).toHaveBeenCalledWith({
        where: {
          workspaceId: 'ws-1',
          entityType: 'kb_document',
          entityId: DOC_ID,
          action: 'kb_chunks_generated',
        },
        orderBy: { createdAt: 'desc' },
        select: { payload: true },
      });
      // R2 delete called BEFORE DB delete
      expect(r2.deleteObject).toHaveBeenCalledWith(R2_KEY);
      const r2Order = r2.deleteObject.mock.invocationCallOrder[0];
      const dbOrder = prisma.kbDocument.delete.mock.invocationCallOrder[0];
      expect(r2Order).toBeLessThan(dbOrder);

      // DB delete called once
      expect(prisma.kbDocument.delete).toHaveBeenCalledWith({
        where: { id: DOC_ID },
      });

      // Audit row written
      const auditCall = audit.write.mock.calls[0][0];
      expect(auditCall.action).toBe('kb_document_deleted');
      expect(auditCall.payload.chunk_count_at_delete).toBe(8);
      expect(auditCall.payload.r2_delete_attempted).toBe(true);
      expect(auditCall.payload.r2_delete_succeeded).toBe(true);

      expect(result.r2DeleteSucceeded).toBe(true);
      expect(result.chunkCountAtDelete).toBe(8);
    });

    it('skips R2 delete when no kb_chunks_generated audit row exists (doc never chunked)', async () => {
      const prisma = makePrisma({ lastChunkAudit: null });
      const audit = makeAudit();
      const r2 = makeR2();
      const svc = new KbDocumentsService(
        prisma as never,
        audit as never,
        r2 as never,
      );

      const result = await svc.delete(PROJECT_ID, DOC_ID, ctx);
      expect(r2.deleteObject).not.toHaveBeenCalled();
      expect(prisma.kbDocument.delete).toHaveBeenCalled();
      expect(result.r2DeleteAttempted).toBe(false);
      expect(result.r2DeleteSucceeded).toBe(false);

      const auditCall = audit.write.mock.calls[0][0];
      expect(auditCall.payload.r2_delete_attempted).toBe(false);
    });
  });

  describe('delete() — error paths', () => {
    it('throws 404 when doc does not exist', async () => {
      const prisma = makePrisma({ doc: null });
      const audit = makeAudit();
      const r2 = makeR2();
      const svc = new KbDocumentsService(
        prisma as never,
        audit as never,
        r2 as never,
      );

      await expect(svc.delete(PROJECT_ID, DOC_ID, ctx)).rejects.toThrow(
        NotFoundException,
      );
      expect(r2.deleteObject).not.toHaveBeenCalled();
      expect(prisma.kbDocument.delete).not.toHaveBeenCalled();
    });

    it('throws 404 cross-workspace (no leak)', async () => {
      const prisma = makePrisma({ project: { workspaceId: 'ws-OTHER' } });
      const audit = makeAudit();
      const r2 = makeR2();
      const svc = new KbDocumentsService(
        prisma as never,
        audit as never,
        r2 as never,
      );

      await expect(svc.delete(PROJECT_ID, DOC_ID, ctx)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('R2 delete failure → 500 + DB row PRESERVED (Yogesh ordering)', async () => {
      const prisma = makePrisma();
      const audit = makeAudit();
      const r2 = makeR2({
        deleteThrows: new Error('R2 NoSuchKey or transient network error'),
      });
      const svc = new KbDocumentsService(
        prisma as never,
        audit as never,
        r2 as never,
      );

      await expect(svc.delete(PROJECT_ID, DOC_ID, ctx)).rejects.toThrow(
        InternalServerErrorException,
      );
      // CRITICAL: DB delete NEVER called when R2 fails
      expect(prisma.kbDocument.delete).not.toHaveBeenCalled();

      // Failure audit row written with stage='r2'
      const failedCall = audit.write.mock.calls.find(
        (c) => c[0].action === 'kb_document_delete_failed',
      );
      expect(failedCall).toBeDefined();
      expect(failedCall![0].payload.stage).toBe('r2');
      expect(failedCall![0].payload.reason).toMatch(/NoSuchKey/);
    });
  });

  describe('delete() — security (PII guard)', () => {
    it('audit payload omits title text (filenames may contain customer PII)', async () => {
      const prisma = makePrisma({
        doc: {
          id: DOC_ID,
          projectId: PROJECT_ID,
          title: 'Customer XYZ Refund Policy 50000.pdf',
          chunkCount: 3,
        },
      });
      const audit = makeAudit();
      const r2 = makeR2();
      const svc = new KbDocumentsService(
        prisma as never,
        audit as never,
        r2 as never,
      );

      await svc.delete(PROJECT_ID, DOC_ID, ctx);

      const auditCall = audit.write.mock.calls[0][0];
      const payloadStr = JSON.stringify(auditCall.payload);
      // PII guard: title text MUST NEVER appear in audit
      expect(payloadStr).not.toContain('Customer XYZ');
      expect(payloadStr).not.toContain('Refund Policy');
      expect(payloadStr).not.toContain('50000');
      // But title_LENGTH does (forensics)
      expect(auditCall.payload.title_length).toBe(
        'Customer XYZ Refund Policy 50000.pdf'.length,
      );
    });
  });
});
