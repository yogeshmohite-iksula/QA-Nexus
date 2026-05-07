// QA Nexus PM1 — KbDocumentsService.createForUpload spec.
//
// Spec: M2 Day-12 (al) — closes the F12 upload-pipeline gap.
//   POST /api/projects/:projectId/kb/documents
//
// Coverage targets (8 minimum per task spec):
//   1. Happy path → returns documentId + presignedUrl + r2Key + expiresAt
//   2. Cross-workspace project → 404
//   3. Oversize file (> 50 MB) → 400
//   4. KbDocument row created (title=fileName, templateKind=fileType)
//   5. R2 key follows {projectId}/{documentId}/<rest> convention
//   6. Audit log entry: kb_document_create_initiated
//   7. PII guard: filename NOT in audit payload (only length + extension)
//   8. R2Service called with the right contentType + filename + prefix
//   9. Zod refusal: invalid mimeType (not in registered list)
//   10. Zod refusal: oversize file caught at Zod layer too
//   11. RBAC @Roles metadata: POST = Admin/Lead/QAEng (write)
//   12. RBAC @Roles metadata: finalize-upload widened to Admin/Lead/QAEng

// Stub the auth.service module so jest doesn't try to load better-auth.
jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { KbDocumentsService, type ActorContext } from '../kb-documents.service';
import { KbDocumentsController } from '../kb-documents.controller';
import { UploadOrchestratorController } from '../upload-orchestrator.controller';
import {
  Role,
  CreateKbDocumentRequest,
  KB_UPLOAD_MAX_BYTES,
} from '@qa-nexus/shared';

const FAKE_ACTOR: ActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
};

const PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function makeService(
  opts: {
    projectFound?: boolean;
    projectWorkspaceId?: string;
    presignedResult?: {
      url: string;
      downloadUrl: string;
      key: string;
      expiresAt: string;
    };
    presignedThrows?: Error;
  } = {},
) {
  const projectFound = opts.projectFound ?? true;
  const projectWorkspaceId = opts.projectWorkspaceId ?? FAKE_ACTOR.workspaceId;
  const prisma = {
    project: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          projectFound ? { workspaceId: projectWorkspaceId } : null,
        ),
    },
    kbDocument: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const audit = {
    write: jest.fn().mockResolvedValue({ id: 'audit-1', thisHash: 'h' }),
  };
  /// Mock R2Service.presignedUpload — echo back the prefix passed in
  /// so r2Key contains the projectId/documentId pair the service
  /// generated. Mirrors the real R2Service shape:
  ///   key = `<prefix>/<YYYY-MM-DD>/<uuid>-<sanitized-filename>`
  const r2 = {
    presignedUpload: opts.presignedThrows
      ? jest.fn().mockRejectedValue(opts.presignedThrows)
      : jest.fn().mockImplementation(
          async (args: {
            contentType: string;
            filename: string;
            prefix?: string;
          }) =>
            opts.presignedResult ?? {
              url: 'https://r2.example/PUT/abc',
              downloadUrl: 'https://r2.example/GET/abc',
              key: `${args.prefix ?? 'uploads'}/2026-05-08/inner-uuid-${args.filename}`,
              expiresAt: '2026-05-08T11:30:00.000Z',
            },
        ),
  };

  const svc = new KbDocumentsService(prisma as any, audit as any, r2 as any);
  return { svc, prisma, audit, r2 };
}

const VALID_INPUT = {
  projectId: PROJECT_ID,
  fileName: 'return_policy_v2.xlsx',
  fileSize: 1024 * 200, // 200 KB
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileType: 'xlsx' as const,
};

describe('[@m2-blocker] [@al] KbDocumentsService.createForUpload', () => {
  describe('happy path', () => {
    it('returns documentId + presignedUploadUrl + r2Key + expiresAt', async () => {
      const { svc } = makeService();
      const result = await svc.createForUpload(VALID_INPUT, FAKE_ACTOR);
      expect(result.documentId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.presignedUploadUrl).toMatch(/^https?:\/\//);
      expect(result.r2Key).toContain(PROJECT_ID);
      expect(result.r2Key).toContain(result.documentId);
      expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('persists a KbDocument row with title=fileName, templateKind=fileType, authorId=actor', async () => {
      const { svc, prisma } = makeService();
      const result = await svc.createForUpload(VALID_INPUT, FAKE_ACTOR);
      expect(prisma.kbDocument.create).toHaveBeenCalledTimes(1);
      const args = prisma.kbDocument.create.mock.calls[0][0];
      expect(args.data.id).toBe(result.documentId);
      expect(args.data.projectId).toBe(PROJECT_ID);
      expect(args.data.title).toBe(VALID_INPUT.fileName);
      expect(args.data.templateKind).toBe('xlsx');
      expect(args.data.bodyMd).toBe('');
      expect(args.data.authorId).toBe(FAKE_ACTOR.actorId);
      expect(args.data.pinned).toBe(false);
    });

    it('calls R2Service.presignedUpload with prefix={projectId}/{documentId}', async () => {
      const { svc, r2 } = makeService();
      const result = await svc.createForUpload(VALID_INPUT, FAKE_ACTOR);
      expect(r2.presignedUpload).toHaveBeenCalledTimes(1);
      const args = r2.presignedUpload.mock.calls[0][0];
      expect(args.contentType).toBe(VALID_INPUT.mimeType);
      expect(args.filename).toBe(VALID_INPUT.fileName);
      expect(args.prefix).toBe(`${PROJECT_ID}/${result.documentId}`);
    });
  });

  describe('audit log — PII redaction guards', () => {
    it("emits 'kb_document_create_initiated' with file_name_length + extension (NOT raw filename)", async () => {
      const { svc, audit } = makeService();
      const sensitive = 'Customer XYZ Refund Policy 50000.pdf';
      await svc.createForUpload(
        {
          ...VALID_INPUT,
          fileName: sensitive,
          fileType: 'pdf',
          mimeType: 'application/pdf',
        },
        FAKE_ACTOR,
      );
      expect(audit.write).toHaveBeenCalledTimes(1);
      const auditCall = audit.write.mock.calls[0][0];
      expect(auditCall.action).toBe('kb_document_create_initiated');
      expect(auditCall.entityType).toBe('kb_document');
      expect(auditCall.payload.file_name_length).toBe(sensitive.length);
      expect(auditCall.payload.file_name_extension).toBe('pdf');
      expect(auditCall.payload.file_size_bytes).toBe(VALID_INPUT.fileSize);
      expect(auditCall.payload.mime_type).toBe('application/pdf');
      expect(auditCall.payload.actor_email).toBe(FAKE_ACTOR.actorEmail);

      // PII guard: nothing identifying the customer leaks into the audit payload.
      const payloadStr = JSON.stringify(auditCall);
      expect(payloadStr).not.toContain('Customer XYZ');
      expect(payloadStr).not.toContain('Refund Policy');
      // file_name_length carries the raw size (37) so the digit string '37'
      // can appear; '50000' is the only filename-body number we guard against.
      expect(payloadStr).not.toContain('50000');
    });
  });

  describe('error paths', () => {
    it('cross-workspace project → 404 NotFoundException', async () => {
      const { svc } = makeService({ projectWorkspaceId: 'different-ws-id' });
      await expect(
        svc.createForUpload(VALID_INPUT, FAKE_ACTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('missing project → 404 NotFoundException', async () => {
      const { svc } = makeService({ projectFound: false });
      await expect(
        svc.createForUpload(VALID_INPUT, FAKE_ACTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('oversize file (> 50 MB) → 400 BadRequestException at the service layer', async () => {
      const { svc, prisma, r2, audit } = makeService();
      await expect(
        svc.createForUpload(
          { ...VALID_INPUT, fileSize: KB_UPLOAD_MAX_BYTES + 1 },
          FAKE_ACTOR,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      // No R2 call, no DB write, no audit row when validation fails.
      expect(r2.presignedUpload).not.toHaveBeenCalled();
      expect(prisma.kbDocument.create).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });
  });
});

describe('[@m2-blocker] [@al] CreateKbDocumentRequest Zod schema', () => {
  it('rejects mimeType that does not match fileType', () => {
    const result = CreateKbDocumentRequest.safeParse({
      ...VALID_INPUT,
      mimeType: 'text/plain', // not valid for fileType=xlsx
    });
    expect(result.success).toBe(false);
  });

  it('rejects oversize file at Zod layer (defense in depth)', () => {
    const result = CreateKbDocumentRequest.safeParse({
      ...VALID_INPUT,
      fileSize: KB_UPLOAD_MAX_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fileType', () => {
    const result = CreateKbDocumentRequest.safeParse({
      ...VALID_INPUT,
      fileType: 'exe' as unknown as 'pdf',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed mimeType (not the canonical type/subtype shape)', () => {
    const result = CreateKbDocumentRequest.safeParse({
      ...VALID_INPUT,
      mimeType: 'NOT-A-MIME-TYPE',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 6 declared fileTypes with their canonical mimeType', () => {
    const cases = [
      { fileType: 'pdf', mimeType: 'application/pdf' },
      {
        fileType: 'docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      { fileType: 'md', mimeType: 'text/markdown' },
      { fileType: 'txt', mimeType: 'text/plain' },
      {
        fileType: 'xlsx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      { fileType: 'csv', mimeType: 'text/csv' },
    ] as const;
    for (const c of cases) {
      const result = CreateKbDocumentRequest.safeParse({
        ...VALID_INPUT,
        fileType: c.fileType,
        mimeType: c.mimeType,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('[@m2-blocker] [@al] RBAC matrix', () => {
  function rolesOn(target: object, method: string): unknown {
    return Reflect.getMetadata('qa-nexus:rbac:roles', (target as any)[method]);
  }

  it('POST /api/projects/:projectId/kb/documents — Admin/Lead/QAEng (write)', () => {
    expect(rolesOn(KbDocumentsController.prototype, 'create')).toEqual([
      Role.Admin,
      Role.Lead,
      Role.QAEngineer,
    ]);
  });

  it('finalize-upload widened to Admin/Lead/QAEng (matches create endpoint RBAC)', () => {
    expect(
      rolesOn(UploadOrchestratorController.prototype, 'finalizeUpload'),
    ).toEqual([Role.Admin, Role.Lead, Role.QAEngineer]);
  });
});
