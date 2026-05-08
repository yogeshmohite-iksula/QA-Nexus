// QA Nexus PM1 — RequirementsService real CRUD spec.
//
// Spec: M3 Day-13 TASK 2. Replaces the 501-stub controller spec
// from PR #77 (M3-BE-03). Tests the service layer directly with
// a Prisma mock — same pattern as TestCasesService.spec.
//
// Coverage targets (12+ per task spec):
//   1. create() happy path → DB insert + audit row
//   2. create() unique-key collision → 409
//   3. create() cross-workspace project → 404
//   4. list() returns paginated rows + linkedTestCaseCount
//   5. list() filters apply to where clause
//   6. list() cross-workspace → 404
//   7. detail() returns full shape
//   8. detail() cross-workspace → 404
//   9. detail() cross-project → 404
//   10. update() partial patch
//   11. update() cross-workspace → 404
//   12. archive() flips status to 'archived' + audit
//   13. archive() cross-workspace → 404
//   14. PII guard — audit payload omits title/description
//   15. assertWriteRole rejects Stakeholder

// Stub the auth.service module so jest doesn't try to load better-auth.
jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import 'reflect-metadata';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  RequirementsService,
  type ActorContext,
} from '../requirements.service';
import { Prisma } from '@prisma/client';

const FAKE_ACTOR: ActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
  role: 'Admin',
};

const PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const REQ_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const NOW = new Date('2026-05-08T08:00:00.000Z');

interface MockOpts {
  projectFound?: boolean;
  projectWorkspaceId?: string;
  reqFound?: boolean;
  reqProjectId?: string;
  reqWorkspaceId?: string;
  uniqueViolation?: boolean;
}

function makeService(opts: MockOpts = {}) {
  const projectFound = opts.projectFound ?? true;
  const projectWsId = opts.projectWorkspaceId ?? FAKE_ACTOR.workspaceId;
  const reqFound = opts.reqFound ?? true;
  const reqProjectId = opts.reqProjectId ?? PROJECT_ID;
  const reqWsId = opts.reqWorkspaceId ?? FAKE_ACTOR.workspaceId;

  const baseReqRow = {
    id: REQ_ID,
    projectId: PROJECT_ID,
    key: 'REQ-RET-001',
    title: 'Refund flow',
    description: 'Customer can request a refund.',
    priority: 'P1',
    status: 'draft',
    source: 'manual',
    sourceRef: null,
    epicKey: null,
    sprint: null,
    createdBy: FAKE_ACTOR.actorId,
    createdAt: NOW,
    updatedAt: NOW,
    _count: { testCaseLinks: 0 },
  };

  const prisma = {
    project: {
      findUnique: jest
        .fn()
        .mockResolvedValue(projectFound ? { workspaceId: projectWsId } : null),
    },
    requirement: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        if (opts.uniqueViolation) {
          throw new Prisma.PrismaClientKnownRequestError(
            'Unique constraint violation',
            { code: 'P2002', clientVersion: '5.0.0' },
          );
        }
        return {
          ...baseReqRow,
          ...data,
          id: REQ_ID,
          createdAt: NOW,
          updatedAt: NOW,
        };
      }),
      findUnique: jest.fn().mockResolvedValue(
        reqFound
          ? {
              ...baseReqRow,
              projectId: reqProjectId,
              project: { workspaceId: reqWsId },
            }
          : null,
      ),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockImplementation(async ({ where, data }) => ({
        ...baseReqRow,
        id: where.id,
        ...data,
      })),
    },
  };

  const audit = {
    write: jest.fn().mockResolvedValue({ id: 'audit-1', thisHash: 'h' }),
  };

   
  const svc = new RequirementsService(prisma as any, audit as any);
  return { svc, prisma, audit };
}

const VALID_CREATE_INPUT = {
  key: 'REQ-RET-001',
  title: 'Refund flow',
  description: 'Customer can request a refund within 7 days.',
  priority: 'P1' as const,
  source: 'manual' as const,
};

describe('[@M3-BE-CRUD] RequirementsService.create', () => {
  it('happy path → DB insert + audit row', async () => {
    const { svc, prisma, audit } = makeService();
    await svc.create(PROJECT_ID, VALID_CREATE_INPUT, FAKE_ACTOR);

    expect(prisma.requirement.create).toHaveBeenCalledTimes(1);
    expect(audit.write).toHaveBeenCalledTimes(1);
    const auditCall = audit.write.mock.calls[0][0];
    expect(auditCall.action).toBe('requirement_created');
    expect(auditCall.entityType).toBe('requirement');
    expect(auditCall.payload.req_key).toBe('REQ-RET-001');
    expect(auditCall.payload.source).toBe('manual');
  });

  it('unique-key collision → 409 ConflictException', async () => {
    const { svc } = makeService({ uniqueViolation: true });
    await expect(
      svc.create(PROJECT_ID, VALID_CREATE_INPUT, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('cross-workspace project → 404', async () => {
    const { svc } = makeService({ projectWorkspaceId: 'different-ws' });
    await expect(
      svc.create(PROJECT_ID, VALID_CREATE_INPUT, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('[@M3-BE-CRUD] RequirementsService.list', () => {
  it('returns paginated rows with linkedTestCaseCount', async () => {
    const { svc, prisma } = makeService();
    (prisma.requirement.findMany as jest.Mock).mockResolvedValue([
      {
        id: REQ_ID,
        projectId: PROJECT_ID,
        key: 'REQ-RET-001',
        title: 'Refund flow',
        priority: 'P1',
        status: 'active',
        source: 'manual',
        sourceRef: null,
        epicKey: null,
        sprint: null,
        createdBy: FAKE_ACTOR.actorId,
        createdAt: NOW,
        updatedAt: NOW,
        _count: { testCaseLinks: 5 },
      },
    ]);
    (prisma.requirement.count as jest.Mock).mockResolvedValue(1);

    const result = await svc.list(
      PROJECT_ID,
      { page: 1, pageSize: 20 },
      FAKE_ACTOR,
    );
    expect(result.requirements).toHaveLength(1);
    expect(result.requirements[0].linkedTestCaseCount).toBe(5);
    expect(result.total).toBe(1);
  });

  it('applies priority + status + source + sprint + q filters', async () => {
    const { svc, prisma } = makeService();
    await svc.list(
      PROJECT_ID,
      {
        page: 1,
        pageSize: 20,
        priority: ['P0', 'P1'],
        status: ['active', 'done'],
        source: 'jira',
        sprint: 'Sprint-42',
        q: 'refund',
      },
      FAKE_ACTOR,
    );
    const args = (prisma.requirement.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.priority.in).toEqual(['P0', 'P1']);
    expect(args.where.status.in).toEqual(['active', 'done']);
    expect(args.where.source).toBe('jira');
    expect(args.where.sprint).toBe('Sprint-42');
    expect(args.where.title).toEqual({
      contains: 'refund',
      mode: 'insensitive',
    });
  });

  it('cross-workspace project → 404', async () => {
    const { svc } = makeService({ projectWorkspaceId: 'different-ws' });
    await expect(
      svc.list(PROJECT_ID, { page: 1, pageSize: 20 }, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('[@M3-BE-CRUD] RequirementsService.detail', () => {
  it('returns full shape with description', async () => {
    const { svc } = makeService();
    const result = await svc.detail(PROJECT_ID, REQ_ID, FAKE_ACTOR);
    expect(result.id).toBe(REQ_ID);
    expect(result.description).toBe('Customer can request a refund.');
  });

  it('cross-workspace requirement → 404', async () => {
    const { svc } = makeService({ reqWorkspaceId: 'different-ws' });
    await expect(
      svc.detail(PROJECT_ID, REQ_ID, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cross-project requirement → 404', async () => {
    const { svc } = makeService({
      reqProjectId: 'different-project-id',
    });
    await expect(
      svc.detail(PROJECT_ID, REQ_ID, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('[@M3-BE-CRUD] RequirementsService.update', () => {
  it('partial patch updates only provided fields', async () => {
    const { svc, prisma } = makeService();
    await svc.update(
      PROJECT_ID,
      REQ_ID,
      { title: 'Renamed', priority: 'P0' },
      FAKE_ACTOR,
    );
    const updateArgs = (prisma.requirement.update as jest.Mock).mock
      .calls[0][0];
    expect(updateArgs.data.title).toBe('Renamed');
    expect(updateArgs.data.priority).toBe('P0');
    expect(updateArgs.data.description).toBeUndefined();
    expect(updateArgs.data.epicKey).toBeUndefined();
  });

  it('cross-workspace requirement → 404', async () => {
    const { svc } = makeService({ reqWorkspaceId: 'different-ws' });
    await expect(
      svc.update(PROJECT_ID, REQ_ID, { title: 'X' }, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('[@M3-BE-CRUD] RequirementsService.archive (soft delete)', () => {
  it("flips status to 'archived' + emits audit", async () => {
    const { svc, prisma, audit } = makeService();
    await svc.archive(PROJECT_ID, REQ_ID, FAKE_ACTOR);
    const updateArgs = (prisma.requirement.update as jest.Mock).mock
      .calls[0][0];
    expect(updateArgs.data.status).toBe('archived');
    expect(audit.write).toHaveBeenCalledTimes(1);
    expect(audit.write.mock.calls[0][0].action).toBe('requirement_archived');
  });

  it('cross-workspace requirement → 404', async () => {
    const { svc } = makeService({ reqWorkspaceId: 'different-ws' });
    await expect(
      svc.archive(PROJECT_ID, REQ_ID, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('[@M3-BE-CRUD] PII redaction guard', () => {
  it('audit payload omits title + description text', async () => {
    const { svc, audit } = makeService();
    const sensitive = {
      ...VALID_CREATE_INPUT,
      title: 'Refund Customer XYZ for $50000 SECRET_TITLE_PHRASE',
      description: 'SECRET_DESCRIPTION_BODY containing customer PII',
    };
    await svc.create(PROJECT_ID, sensitive, FAKE_ACTOR);
    const auditStr = JSON.stringify(audit.write.mock.calls[0][0]);
    expect(auditStr).not.toContain('Customer XYZ');
    expect(auditStr).not.toContain('50000');
    expect(auditStr).not.toContain('SECRET_TITLE_PHRASE');
    expect(auditStr).not.toContain('SECRET_DESCRIPTION_BODY');
    // But length metadata IS present:
    expect(auditStr).toContain('title_length');
    expect(auditStr).toContain('description_length');
  });
});

describe('[@M3-BE-CRUD] RequirementsService.assertWriteRole', () => {
  it('allows Admin/Lead/QAEngineer', () => {
    const { svc } = makeService();
    expect(() =>
      svc.assertWriteRole({ ...FAKE_ACTOR, role: 'Admin' }),
    ).not.toThrow();
    expect(() =>
      svc.assertWriteRole({ ...FAKE_ACTOR, role: 'Lead' }),
    ).not.toThrow();
    expect(() =>
      svc.assertWriteRole({ ...FAKE_ACTOR, role: 'QAEngineer' }),
    ).not.toThrow();
  });

  it('rejects Stakeholder with 403 ForbiddenException', () => {
    const { svc } = makeService();
    expect(() =>
      svc.assertWriteRole({ ...FAKE_ACTOR, role: 'Stakeholder' }),
    ).toThrow(ForbiddenException);
  });
});
