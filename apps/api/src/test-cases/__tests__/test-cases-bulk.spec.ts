// QA Nexus PM1 — TestCasesService bulk operations spec.
//
// Spec: M3 Day-13 TASK BE-2. Tests bulkLink + bulkArchive — both
// follow the same per-row-outcome pattern: linked/archived[] +
// failed[] with typed reasons.
//
// Coverage targets (6+ per task spec):
//   1. bulkLink happy path → all linked (created)
//   2. bulkLink mixed project → cross_project in failed[]
//   3. bulkLink already-linked → outcome='existed' (idempotent)
//   4. bulkLink missing testCaseId → not_found in failed[]
//   5. bulkLink cross-workspace → cross_workspace in failed[]
//   6. bulkLink emits ONE audit row per call (PII-safe payload)
//   7. bulkLink cross-workspace project → 404
//   8. bulkLink cross-project requirement → 404 (precondition fails the whole call)
//   9. bulkArchive happy path → all archived
//   10. bulkArchive mixed project → cross_project in failed[]
//   11. bulkArchive emits ONE audit row per call (PII-safe payload)
//   12. PII guard — case titles NEVER in audit (case_keys only)

jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { TestCasesService, type ActorContext } from '../test-cases.service';

const FAKE_ACTOR: ActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
  role: 'Admin',
};

const PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const OTHER_PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-c0000000c000';
const REQ_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const TC_1 = 'dddddddd-dddd-4ddd-8ddd-d00000000001';
const TC_2 = 'dddddddd-dddd-4ddd-8ddd-d00000000002';
const TC_3 = 'dddddddd-dddd-4ddd-8ddd-d00000000003';

interface MockOpts {
  /// Test cases that exist (mapped by ID). Default: TC_1, TC_2, TC_3
  /// in PROJECT_ID + actor's workspace.
  existingCases?: Array<{
    id: string;
    projectId: string;
    workspaceId: string;
    key?: string;
    title?: string;
  }>;
  /// Existing testCaseLink rows (the (testCaseId, requirementId) pairs).
  existingLinks?: Array<{ testCaseId: string; requirementId: string }>;
  /// Whether the project lookup succeeds (workspace match).
  projectFound?: boolean;
  projectWorkspaceId?: string;
  /// Whether the requirement is in PROJECT_ID. Default true.
  requirementInProject?: boolean;
}

function makeService(opts: MockOpts = {}) {
  const projectFound = opts.projectFound ?? true;
  const projectWsId = opts.projectWorkspaceId ?? FAKE_ACTOR.workspaceId;
  const requirementInProject = opts.requirementInProject ?? true;

  const defaultCases = [
    {
      id: TC_1,
      projectId: PROJECT_ID,
      workspaceId: FAKE_ACTOR.workspaceId,
      key: 'TC-RET-001',
      title: 'Refund happy path Customer XYZ $50000',
    },
    {
      id: TC_2,
      projectId: PROJECT_ID,
      workspaceId: FAKE_ACTOR.workspaceId,
      key: 'TC-RET-002',
      title: 'Refund validation SECRET_TITLE_PHRASE',
    },
    {
      id: TC_3,
      projectId: PROJECT_ID,
      workspaceId: FAKE_ACTOR.workspaceId,
      key: 'TC-RET-003',
      title: 'Refund cross-workspace guard',
    },
  ];
  const cases = opts.existingCases ?? defaultCases;

  const prisma = {
    project: {
      findUnique: jest
        .fn()
        .mockResolvedValue(projectFound ? { workspaceId: projectWsId } : null),
    },
    requirement: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          requirementInProject
            ? { projectId: PROJECT_ID, key: 'REQ-RET-247' }
            : { projectId: OTHER_PROJECT_ID, key: 'REQ-OTH-001' },
        ),
    },
    testCase: {
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        const ids: string[] = where.id?.in ?? [];
        return cases
          .filter((c) => ids.includes(c.id))
          .map((c) => ({
            id: c.id,
            projectId: c.projectId,
            key: c.key ?? `TC-${c.id.slice(0, 6)}`,
            project: { workspaceId: c.workspaceId },
          }));
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    testCaseLink: {
      findMany: jest.fn().mockImplementation(async () => {
        return opts.existingLinks ?? [];
      }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const audit = {
    write: jest.fn().mockResolvedValue({ id: 'audit-1', thisHash: 'h' }),
  };

  const svc = new TestCasesService(prisma as any, audit as any);
  return { svc, prisma, audit };
}

describe('[@M3-BE-2] TestCasesService.bulkLink', () => {
  it('happy path → all linked with outcome=created', async () => {
    const { svc, prisma } = makeService();
    const result = await svc.bulkLink(
      PROJECT_ID,
      REQ_ID,
      [TC_1, TC_2, TC_3],
      FAKE_ACTOR,
    );
    expect(result.failed).toHaveLength(0);
    expect(result.linked).toHaveLength(3);
    expect(result.linked.every((l) => l.outcome === 'created')).toBe(true);
    // One bulk INSERT, not 3 separate ones.
    expect(prisma.testCaseLink.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.testCaseLink.createMany.mock.calls[0][0].data).toHaveLength(
      3,
    );
  });

  it('idempotent — already-linked cases return outcome=existed (no insert)', async () => {
    const { svc, prisma } = makeService({
      existingLinks: [
        { testCaseId: TC_1, requirementId: REQ_ID },
        { testCaseId: TC_2, requirementId: REQ_ID },
      ],
    });
    const result = await svc.bulkLink(
      PROJECT_ID,
      REQ_ID,
      [TC_1, TC_2, TC_3],
      FAKE_ACTOR,
    );
    expect(result.linked).toHaveLength(3);
    expect(result.linked.find((l) => l.testCaseId === TC_1)?.outcome).toBe(
      'existed',
    );
    expect(result.linked.find((l) => l.testCaseId === TC_2)?.outcome).toBe(
      'existed',
    );
    expect(result.linked.find((l) => l.testCaseId === TC_3)?.outcome).toBe(
      'created',
    );
    // Only 1 row inserted (TC_3) — others were idempotent no-ops.
    expect(prisma.testCaseLink.createMany.mock.calls[0][0].data).toHaveLength(
      1,
    );
  });

  it('missing testCaseId → not_found in failed[]', async () => {
    const { svc } = makeService({
      existingCases: [
        {
          id: TC_1,
          projectId: PROJECT_ID,
          workspaceId: FAKE_ACTOR.workspaceId,
          key: 'TC-RET-001',
        },
        // TC_2 deliberately omitted.
        {
          id: TC_3,
          projectId: PROJECT_ID,
          workspaceId: FAKE_ACTOR.workspaceId,
          key: 'TC-RET-003',
        },
      ],
    });
    const result = await svc.bulkLink(
      PROJECT_ID,
      REQ_ID,
      [TC_1, TC_2, TC_3],
      FAKE_ACTOR,
    );
    expect(result.linked).toHaveLength(2);
    expect(result.failed).toEqual([{ testCaseId: TC_2, reason: 'not_found' }]);
  });

  it('cross-project testCaseId → cross_project in failed[]', async () => {
    const { svc } = makeService({
      existingCases: [
        {
          id: TC_1,
          projectId: PROJECT_ID,
          workspaceId: FAKE_ACTOR.workspaceId,
          key: 'TC-RET-001',
        },
        {
          id: TC_2,
          projectId: OTHER_PROJECT_ID, // different project, same workspace
          workspaceId: FAKE_ACTOR.workspaceId,
          key: 'TC-OTH-002',
        },
      ],
    });
    const result = await svc.bulkLink(
      PROJECT_ID,
      REQ_ID,
      [TC_1, TC_2],
      FAKE_ACTOR,
    );
    expect(result.linked).toHaveLength(1);
    expect(result.failed).toEqual([
      { testCaseId: TC_2, reason: 'cross_project' },
    ]);
  });

  it('cross-workspace testCaseId → cross_workspace in failed[]', async () => {
    const { svc } = makeService({
      existingCases: [
        {
          id: TC_1,
          projectId: PROJECT_ID,
          workspaceId: 'different-ws-id',
          key: 'TC-RET-001',
        },
      ],
    });
    const result = await svc.bulkLink(PROJECT_ID, REQ_ID, [TC_1], FAKE_ACTOR);
    expect(result.linked).toHaveLength(0);
    expect(result.failed).toEqual([
      { testCaseId: TC_1, reason: 'cross_workspace' },
    ]);
  });

  it('cross-workspace project → 404 (precondition fails the whole call)', async () => {
    const { svc } = makeService({ projectWorkspaceId: 'different-ws' });
    await expect(
      svc.bulkLink(PROJECT_ID, REQ_ID, [TC_1], FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cross-project requirement → 404 (precondition)', async () => {
    const { svc } = makeService({ requirementInProject: false });
    await expect(
      svc.bulkLink(PROJECT_ID, REQ_ID, [TC_1], FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('emits ONE audit row per call with PII-safe payload', async () => {
    const { svc, audit } = makeService();
    await svc.bulkLink(PROJECT_ID, REQ_ID, [TC_1, TC_2], FAKE_ACTOR);
    expect(audit.write).toHaveBeenCalledTimes(1);
    const call = audit.write.mock.calls[0][0];
    expect(call.action).toBe('test_cases_bulk_linked');
    expect(call.entityType).toBe('test_case_link');
    expect(call.payload.requested_count).toBe(2);
    expect(call.payload.created_count).toBe(2);
    expect(call.payload.case_keys_linked).toEqual(['TC-RET-001', 'TC-RET-002']);
    // PII guard — case titles never leak.
    const auditStr = JSON.stringify(call);
    expect(auditStr).not.toContain('Customer XYZ');
    expect(auditStr).not.toContain('50000');
    expect(auditStr).not.toContain('SECRET_TITLE_PHRASE');
  });
});

describe('[@M3-BE-2] TestCasesService.bulkArchive', () => {
  it('happy path → all archived', async () => {
    const { svc, prisma } = makeService();
    const result = await svc.bulkArchive(
      PROJECT_ID,
      [TC_1, TC_2, TC_3],
      FAKE_ACTOR,
    );
    expect(result.failed).toHaveLength(0);
    expect(result.archived).toHaveLength(3);
    // ONE updateMany, not 3 separate updates.
    expect(prisma.testCase.updateMany).toHaveBeenCalledTimes(1);
    expect(
      prisma.testCase.updateMany.mock.calls[0][0].where.id.in,
    ).toHaveLength(3);
    expect(prisma.testCase.updateMany.mock.calls[0][0].data.status).toBe(
      'deprecated',
    );
  });

  it('mixed project → cross_project in failed[]', async () => {
    const { svc } = makeService({
      existingCases: [
        {
          id: TC_1,
          projectId: PROJECT_ID,
          workspaceId: FAKE_ACTOR.workspaceId,
          key: 'TC-RET-001',
        },
        {
          id: TC_2,
          projectId: OTHER_PROJECT_ID,
          workspaceId: FAKE_ACTOR.workspaceId,
          key: 'TC-OTH-002',
        },
        {
          id: TC_3,
          projectId: PROJECT_ID,
          workspaceId: FAKE_ACTOR.workspaceId,
          key: 'TC-RET-003',
        },
      ],
    });
    const result = await svc.bulkArchive(
      PROJECT_ID,
      [TC_1, TC_2, TC_3],
      FAKE_ACTOR,
    );
    expect(result.archived).toHaveLength(2);
    expect(result.failed).toEqual([
      { testCaseId: TC_2, reason: 'cross_project' },
    ]);
  });

  it('emits ONE audit row per call with PII-safe payload', async () => {
    const { svc, audit } = makeService();
    await svc.bulkArchive(PROJECT_ID, [TC_1, TC_2], FAKE_ACTOR);
    expect(audit.write).toHaveBeenCalledTimes(1);
    const call = audit.write.mock.calls[0][0];
    expect(call.action).toBe('test_cases_bulk_archived');
    expect(call.payload.requested_count).toBe(2);
    expect(call.payload.archived_count).toBe(2);
    expect(call.payload.case_keys_archived).toEqual([
      'TC-RET-001',
      'TC-RET-002',
    ]);
    // PII guard — case titles never leak.
    const auditStr = JSON.stringify(call);
    expect(auditStr).not.toContain('Customer XYZ');
    expect(auditStr).not.toContain('50000');
    expect(auditStr).not.toContain('SECRET_TITLE_PHRASE');
  });

  it('cross-workspace project → 404', async () => {
    const { svc } = makeService({ projectWorkspaceId: 'different-ws' });
    await expect(
      svc.bulkArchive(PROJECT_ID, [TC_1], FAKE_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
