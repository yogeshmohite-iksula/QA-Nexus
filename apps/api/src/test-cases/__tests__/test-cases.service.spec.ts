// QA Nexus PM1 — TestCasesService real CRUD spec.
//
// Spec: M3 Day-13 TASK 1. Replaces the 501-stub controller spec
// from PR #75 (M3-BE-02). Tests the service layer directly with
// a Prisma mock — same pattern as KbDocumentsService.spec from
// M2 Day-11 PR #60.
//
// Coverage targets (15+ per task spec):
//   1. create() happy path → DB insert + audit row + 0 links
//   2. create() with linkedRequirementIds → TestCaseLink rows in tx
//   3. create() unique-key collision → 409 ConflictException
//   4. create() linkedRequirementIds cross-project → 404
//   5. create() cross-workspace project → 404
//   6. list() returns paginated rows + linkCount
//   7. list() filter by priority/status/format/q/hasLinks
//   8. list() cross-workspace → 404
//   9. detail() returns full shape with links + suite memberships
//   10. detail() cross-workspace → 404
//   11. update() partial patch + linkedRequirementIds delta in tx
//   12. update() cross-workspace → 404
//   13. archive() flips status to deprecated + audit
//   14. archive() cross-workspace → 404
//   15. PII guard — audit payload omits title/preconditions/steps
//   16. linkRequirement happy path
//   17. linkRequirement idempotent existed
//   18. unlinkRequirement 404 when no link
//   19. assertWriteRole rejects Stakeholder
//   20. coverageForRequirement happy path

// Stub the auth.service module so jest doesn't try to load better-auth.
jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import 'reflect-metadata';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TestCasesService, type ActorContext } from '../test-cases.service';
import { Prisma } from '@prisma/client';

const FAKE_ACTOR: ActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
  role: 'Admin',
};

const PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CASE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const REQ_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const NOW = new Date('2026-05-08T08:00:00.000Z');

interface MockOpts {
  projectFound?: boolean;
  projectWorkspaceId?: string;
  caseFound?: boolean;
  caseProjectId?: string;
  caseProjectWorkspaceId?: string;
  requirementCount?: number; // for linkedRequirementIds count check
  existingLink?: boolean;
  uniqueViolation?: boolean;
}

function makeService(opts: MockOpts = {}) {
  const projectFound = opts.projectFound ?? true;
  const projectWsId = opts.projectWorkspaceId ?? FAKE_ACTOR.workspaceId;
  const caseFound = opts.caseFound ?? true;
  const caseProjectId = opts.caseProjectId ?? PROJECT_ID;
  const caseProjectWsId = opts.caseProjectWorkspaceId ?? FAKE_ACTOR.workspaceId;

  const txMock = {
    testCase: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        if (opts.uniqueViolation) {
          const e = new Prisma.PrismaClientKnownRequestError(
            'Unique constraint violation',
            { code: 'P2002', clientVersion: '5.0.0' },
          );
          throw e;
        }
        return {
          ...data,
          id: CASE_ID,
          createdAt: NOW,
          updatedAt: NOW,
        };
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => ({
        id: where.id,
        projectId: caseProjectId,
        key: 'TC-RET-001',
        priority: data.priority ?? 'P1',
        status: data.status ?? 'manual_draft',
        ...data,
      })),
    },
    testCaseLink: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  const prisma = {
    project: {
      findUnique: jest
        .fn()
        .mockResolvedValue(projectFound ? { workspaceId: projectWsId } : null),
    },
    requirement: {
      count: jest.fn().mockResolvedValue(opts.requirementCount ?? 0),
      findUnique: jest
        .fn()
        .mockResolvedValue(
          caseFound ? { projectId: caseProjectId, key: 'REQ-RET-001' } : null,
        ),
    },
    testCase: {
      findUnique: jest.fn().mockResolvedValue(
        caseFound
          ? {
              projectId: caseProjectId,
              key: 'TC-RET-001',
              project: { workspaceId: caseProjectWsId },
              id: CASE_ID,
              title: 'Sample',
              preconditions: '',
              stepsJson: [],
              expectedResult: 'OK',
              priority: 'P1',
              status: 'manual_draft',
              format: 'step',
              gherkin: null,
              generatedByAgent: null,
              sourceChunkIds: null,
              rationale: null,
              confidenceScore: null,
              aiProvenanceJson: null,
              createdBy: FAKE_ACTOR.actorId,
              createdAt: NOW,
              updatedAt: NOW,
              requirementLinks: [],
              suiteMembers: [],
              _count: { requirementLinks: 0 },
            }
          : null,
      ),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest
        .fn()
        .mockResolvedValue({ id: CASE_ID, status: 'deprecated' }),
    },
    testCaseLink: {
      findUnique: jest
        .fn()
        .mockResolvedValue(opts.existingLink ? { testCaseId: CASE_ID } : null),
      create: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(txMock)),
  };

  const audit = {
    write: jest.fn().mockResolvedValue({ id: 'audit-1', thisHash: 'h' }),
  };

  const svc = new TestCasesService(prisma as any, audit as any);
  return { svc, prisma, audit, txMock };
}

const VALID_CREATE_INPUT = {
  key: 'TC-RET-100',
  title: 'Skeleton smoke test',
  preconditions: '',
  stepsJson: [],
  expectedResult: 'OK',
  priority: 'P1' as const,
  status: 'manual_draft' as const,
  linkedRequirementIds: [],
  format: 'step' as const,
  gherkin: null,
  generatedByAgent: null,
  sourceChunkIds: null,
  rationale: null,
};

describe('[@M3-BE-CRUD] TestCasesService.create', () => {
  it('happy path → DB insert + audit row + 0 links', async () => {
    const { svc, prisma, audit, txMock } = makeService();
    await svc.create(PROJECT_ID, VALID_CREATE_INPUT, FAKE_ACTOR);

    expect(txMock.testCase.create).toHaveBeenCalledTimes(1);
    expect(txMock.testCaseLink.createMany).not.toHaveBeenCalled();
    expect(audit.write).toHaveBeenCalledTimes(1);
    const auditCall = audit.write.mock.calls[0][0];
    expect(auditCall.action).toBe('test_case_created');
    expect(auditCall.entityType).toBe('test_case');
    expect(auditCall.payload.case_key).toBe('TC-RET-100');
    expect(auditCall.payload.linked_requirement_count).toBe(0);
    // detail() re-fetch
    expect(prisma.testCase.findUnique).toHaveBeenCalled();
  });

  it('with linkedRequirementIds → TestCaseLink rows in transaction', async () => {
    const { svc, txMock } = makeService({ requirementCount: 1 });
    await svc.create(
      PROJECT_ID,
      { ...VALID_CREATE_INPUT, linkedRequirementIds: [REQ_ID] },
      FAKE_ACTOR,
    );
    expect(txMock.testCaseLink.createMany).toHaveBeenCalledTimes(1);
    expect(txMock.testCaseLink.createMany.mock.calls[0][0].data).toEqual([
      { testCaseId: CASE_ID, requirementId: REQ_ID },
    ]);
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

  it('linkedRequirementIds cross-project → 404 (count mismatch)', async () => {
    // Caller passes 2 requirement IDs, but project has only 1 of them.
    const { svc } = makeService({ requirementCount: 1 });
    await expect(
      svc.create(
        PROJECT_ID,
        {
          ...VALID_CREATE_INPUT,
          linkedRequirementIds: [
            REQ_ID,
            'ffffffff-ffff-4fff-8fff-ffffffffffff',
          ],
        },
        FAKE_ACTOR,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('[@M3-BE-CRUD] TestCasesService.list', () => {
  it('returns paginated rows with linkCount', async () => {
    const { svc, prisma } = makeService();
    (prisma.testCase.findMany as jest.Mock).mockResolvedValue([
      {
        id: CASE_ID,
        projectId: PROJECT_ID,
        key: 'TC-RET-001',
        title: 'Test',
        priority: 'P1',
        status: 'manual_draft',
        format: 'step',
        generatedByAgent: null,
        confidenceScore: null,
        createdBy: FAKE_ACTOR.actorId,
        createdAt: NOW,
        updatedAt: NOW,
        _count: { requirementLinks: 3 },
      },
    ]);
    (prisma.testCase.count as jest.Mock).mockResolvedValue(1);

    const result = await svc.list(
      PROJECT_ID,
      { page: 1, pageSize: 20 },
      FAKE_ACTOR,
    );
    expect(result.testCases).toHaveLength(1);
    expect(result.testCases[0].linkCount).toBe(3);
    expect(result.total).toBe(1);
  });

  it('applies priority + status + format + hasLinks + q filters to where clause', async () => {
    const { svc, prisma } = makeService();
    await svc.list(
      PROJECT_ID,
      {
        page: 1,
        pageSize: 20,
        priority: ['P0', 'P1'],
        status: ['manual_draft', 'reviewed'],
        format: 'gherkin',
        hasLinks: true,
        q: 'login',
      },
      FAKE_ACTOR,
    );
    const args = (prisma.testCase.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.priority.in).toEqual(['P0', 'P1']);
    expect(args.where.status.in).toEqual(['manual_draft', 'reviewed']);
    expect(args.where.format).toBe('gherkin');
    expect(args.where.requirementLinks).toEqual({ some: {} });
    expect(args.where.title).toEqual({
      contains: 'login',
      mode: 'insensitive',
    });
  });

  it('hasLinks=false filters to cases with zero links', async () => {
    const { svc, prisma } = makeService();
    await svc.list(
      PROJECT_ID,
      { page: 1, pageSize: 20, hasLinks: false },
      FAKE_ACTOR,
    );
    const args = (prisma.testCase.findMany as jest.Mock).mock.calls[0][0];
    expect(args.where.requirementLinks).toEqual({ none: {} });
  });

  it('cross-workspace project → 404', async () => {
    const { svc } = makeService({ projectWorkspaceId: 'different-ws' });
    await expect(
      svc.list(PROJECT_ID, { page: 1, pageSize: 20 }, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('[@M3-BE-CRUD] TestCasesService.detail', () => {
  it('returns full shape with links + suite memberships', async () => {
    const { svc, prisma } = makeService();
    (prisma.testCase.findUnique as jest.Mock).mockResolvedValueOnce({
      projectId: PROJECT_ID,
      key: 'TC-RET-001',
      project: { workspaceId: FAKE_ACTOR.workspaceId },
    });
    (prisma.testCase.findUnique as jest.Mock).mockResolvedValueOnce({
      id: CASE_ID,
      projectId: PROJECT_ID,
      key: 'TC-RET-001',
      title: 'Sample',
      preconditions: 'Logged in',
      stepsJson: [{ order: 1, action: 'click', expected: 'opens' }],
      expectedResult: 'OK',
      priority: 'P1',
      status: 'manual_draft',
      format: 'step',
      gherkin: null,
      generatedByAgent: null,
      sourceChunkIds: null,
      rationale: null,
      confidenceScore: null,
      aiProvenanceJson: null,
      createdBy: FAKE_ACTOR.actorId,
      createdAt: NOW,
      updatedAt: NOW,
      requirementLinks: [
        {
          requirement: {
            id: REQ_ID,
            key: 'REQ-RET-001',
            title: 'Refund flow',
            priority: 'P1',
            status: 'active',
          },
        },
      ],
      suiteMembers: [{ suite: { id: 'suite-1', name: 'Smoke' } }],
    });

    const result = await svc.detail(CASE_ID, FAKE_ACTOR);
    expect(result.links).toHaveLength(1);
    expect(result.links[0].key).toBe('REQ-RET-001');
    expect(result.suiteMemberships).toHaveLength(1);
    expect(result.suiteMemberships[0].name).toBe('Smoke');
  });

  it('cross-workspace caseId → 404', async () => {
    const { svc } = makeService({ caseProjectWorkspaceId: 'different-ws' });
    await expect(svc.detail(CASE_ID, FAKE_ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('[@M3-BE-CRUD] TestCasesService.update', () => {
  it('partial patch updates only provided fields', async () => {
    const { svc, txMock } = makeService();
    await svc.update(CASE_ID, { title: 'Renamed', priority: 'P0' }, FAKE_ACTOR);
    const updateArgs = txMock.testCase.update.mock.calls[0][0];
    expect(updateArgs.data.title).toBe('Renamed');
    expect(updateArgs.data.priority).toBe('P0');
    expect(updateArgs.data.preconditions).toBeUndefined();
    expect(updateArgs.data.expectedResult).toBeUndefined();
  });

  it('linkedRequirementIds delta replaces full link set in tx', async () => {
    const { svc, txMock } = makeService({ requirementCount: 2 });
    await svc.update(
      CASE_ID,
      {
        linkedRequirementIds: [REQ_ID, 'ffffffff-ffff-4fff-8fff-ffffffffffff'],
      },
      FAKE_ACTOR,
    );
    expect(txMock.testCaseLink.deleteMany).toHaveBeenCalledTimes(1);
    expect(txMock.testCaseLink.createMany).toHaveBeenCalledTimes(1);
    expect(txMock.testCaseLink.createMany.mock.calls[0][0].data).toHaveLength(
      2,
    );
  });

  it('cross-workspace caseId → 404', async () => {
    const { svc } = makeService({ caseProjectWorkspaceId: 'different-ws' });
    await expect(
      svc.update(CASE_ID, { title: 'X' }, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('[@M3-BE-CRUD] TestCasesService.archive (soft delete)', () => {
  it('flips status to deprecated + emits audit', async () => {
    const { svc, prisma, audit } = makeService();
    await svc.archive(CASE_ID, FAKE_ACTOR);
    const updateArgs = (prisma.testCase.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.status).toBe('deprecated');
    expect(audit.write).toHaveBeenCalledTimes(1);
    expect(audit.write.mock.calls[0][0].action).toBe('test_case_archived');
  });

  it('cross-workspace caseId → 404', async () => {
    const { svc } = makeService({ caseProjectWorkspaceId: 'different-ws' });
    await expect(svc.archive(CASE_ID, FAKE_ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('[@M3-BE-CRUD] PII redaction guards', () => {
  it('audit payload omits title/preconditions/steps/gherkin/rationale text', async () => {
    const { svc, audit } = makeService();
    const sensitive = {
      ...VALID_CREATE_INPUT,
      title: 'Verify Customer XYZ refund of $50000',
      preconditions: 'SECRET_PRE_TEXT',
      expectedResult: 'SECRET_EXPECTED_TEXT',
      stepsJson: [
        { order: 1, action: 'SECRET_STEP_ACTION', expected: 'SECRET_EXP' },
      ],
      format: 'gherkin' as const,
      gherkin: 'Given SECRET_GHERKIN_BODY\nWhen X\nThen Y',
      rationale: 'SECRET_RATIONALE_REASON',
    };
    await svc.create(PROJECT_ID, sensitive, FAKE_ACTOR);
    const auditStr = JSON.stringify(audit.write.mock.calls[0][0]);
    expect(auditStr).not.toContain('Customer XYZ');
    expect(auditStr).not.toContain('50000');
    expect(auditStr).not.toContain('SECRET_PRE_TEXT');
    expect(auditStr).not.toContain('SECRET_EXPECTED_TEXT');
    expect(auditStr).not.toContain('SECRET_STEP_ACTION');
    expect(auditStr).not.toContain('SECRET_GHERKIN_BODY');
    expect(auditStr).not.toContain('SECRET_RATIONALE_REASON');
    // But length/count metadata IS present:
    expect(auditStr).toContain('title_length');
    expect(auditStr).toContain('steps_count');
  });
});

describe('[@M3-BE-CRUD] RTM linking', () => {
  it('linkRequirement happy path → outcome=created + audit', async () => {
    const { svc, prisma, audit } = makeService({ existingLink: false });
    const result = await svc.linkRequirement(CASE_ID, REQ_ID, FAKE_ACTOR);
    expect(result.outcome).toBe('created');
    expect(prisma.testCaseLink.create).toHaveBeenCalled();
    expect(audit.write).toHaveBeenCalledTimes(1);
    expect(audit.write.mock.calls[0][0].action).toBe(
      'test_case_linked_to_requirement',
    );
  });

  it('linkRequirement idempotent → outcome=existed + NO audit', async () => {
    const { svc, prisma, audit } = makeService({ existingLink: true });
    const result = await svc.linkRequirement(CASE_ID, REQ_ID, FAKE_ACTOR);
    expect(result.outcome).toBe('existed');
    expect(prisma.testCaseLink.create).not.toHaveBeenCalled();
    expect(audit.write).not.toHaveBeenCalled();
  });

  it('unlinkRequirement → audit + 200', async () => {
    const { svc, audit } = makeService();
    await svc.unlinkRequirement(CASE_ID, REQ_ID, FAKE_ACTOR);
    expect(audit.write).toHaveBeenCalledTimes(1);
    expect(audit.write.mock.calls[0][0].action).toBe(
      'test_case_unlinked_from_requirement',
    );
  });

  it('unlinkRequirement when no link exists → 404', async () => {
    const { svc, prisma } = makeService();
    (prisma.testCaseLink.deleteMany as jest.Mock).mockResolvedValueOnce({
      count: 0,
    });
    await expect(
      svc.unlinkRequirement(CASE_ID, REQ_ID, FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('coverageForRequirement returns linked test cases', async () => {
    const { svc, prisma } = makeService();
    (prisma.requirement.findUnique as jest.Mock).mockResolvedValueOnce({
      id: REQ_ID,
      project: { workspaceId: FAKE_ACTOR.workspaceId },
    });
    (prisma.testCaseLink.findMany as jest.Mock).mockResolvedValueOnce([
      {
        testCase: {
          id: CASE_ID,
          key: 'TC-RET-001',
          title: 'X',
          priority: 'P1',
          status: 'manual_draft',
          format: 'step',
        },
      },
    ]);
    const result = await svc.coverageForRequirement(REQ_ID, FAKE_ACTOR);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('TC-RET-001');
  });
});

describe('[@M3-BE-CRUD] assertWriteRole', () => {
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
