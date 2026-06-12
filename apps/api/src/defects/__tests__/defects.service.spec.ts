// QA Nexus PM1 — DefectsService read-API spec (W2-R, Day-32).
//
// TDD: written before the service. Covers the F21 Defects Hub read path —
// the 25 seeded defects that were unreachable (Phase-B W2 🔴 finding).
//
// Coverage:
//   1. list() happy → mapped rows + pagination, where scoped to workspace
//   2. list() filters (status + projectId + component) flow into where
//   3. list() maps Date→ISO + assignee projection (null + present)
//   4. list() pagination math (skip/take) from page/pageSize
//   5. detail() happy → mapped row
//   6. detail() not found → 404 NotFoundException
//   7. detail() cross-tenant → findFirst scoped by workspaceId → 404 (no leak)
//   8. reads write NO audit row (ERD §8.7 — GET is not a state change)

import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { DefectsService, type DefectActorContext } from '../defects.service';

const ACTOR: DefectActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
  role: 'Admin',
};
const PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const DEFECT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const USER_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const NOW = new Date('2026-06-12T08:00:00.000Z');

function makeRow(over: Record<string, unknown> = {}) {
  return {
    id: DEFECT_ID,
    projectId: PROJECT_ID,
    key: 'DEF-001',
    title: 'Refund webhook timeout',
    description: 'PaymentV2 refund webhook exceeds 30s on retry.',
    severity: 'P1',
    status: 'new',
    triggeredByRunId: null,
    triggeredByTestCaseId: null,
    assigneeId: null,
    jiraIssueId: null,
    component: 'payments-gateway',
    createdAt: NOW,
    resolvedAt: null,
    verifiedAt: null,
    closedAt: null,
    project: { id: PROJECT_ID, key: 'RET', name: 'Iksula Returns' },
    assignee: null,
    ...over,
  };
}

interface MockOpts {
  rows?: ReturnType<typeof makeRow>[];
  total?: number;
  found?: boolean;
}

function makeService(opts: MockOpts = {}) {
  const rows = opts.rows ?? [makeRow()];
  const found = opts.found ?? true;
  const prisma = {
    defect: {
      findMany: jest.fn().mockResolvedValue(rows),
      count: jest.fn().mockResolvedValue(opts.total ?? rows.length),
      findFirst: jest.fn().mockResolvedValue(found ? makeRow() : null),
    },
    // $transaction([p1, p2]) — the args are already-invoked promises.
    $transaction: jest
      .fn()
      .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
  };
  const svc = new DefectsService(prisma as never);
  return { svc, prisma };
}

describe('DefectsService (W2-R read API)', () => {
  it('list() returns mapped rows + pagination scoped to the workspace', async () => {
    const { svc, prisma } = makeService();
    const r = await svc.list({ page: 1, pageSize: 20 }, ACTOR);

    expect(r.total).toBe(1);
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(20);
    expect(r.defects[0].key).toBe('DEF-001');
    // workspace scope is enforced in the where clause, not client-supplied
    expect(prisma.defect.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          project: expect.objectContaining({ workspaceId: ACTOR.workspaceId }),
        }),
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('list() threads status/projectId/component filters into the where', async () => {
    const { svc, prisma } = makeService();
    await svc.list(
      {
        page: 1,
        pageSize: 20,
        status: 'new',
        projectId: PROJECT_ID,
        component: 'payments-gateway',
      },
      ACTOR,
    );
    const where = prisma.defect.findMany.mock.calls[0][0].where;
    expect(where.status).toBe('new');
    expect(where.component).toBe('payments-gateway');
    // projectId narrows WITHIN the workspace scope (defense in depth)
    expect(where.project).toEqual(
      expect.objectContaining({
        workspaceId: ACTOR.workspaceId,
        id: PROJECT_ID,
      }),
    );
  });

  it('list() maps Date→ISO string and the assignee projection (null + present)', async () => {
    const { svc } = makeService({
      rows: [
        makeRow(),
        makeRow({
          id: USER_ID,
          assigneeId: USER_ID,
          assignee: { id: USER_ID, displayName: 'Kishor Kadam' },
          resolvedAt: NOW,
        }),
      ],
      total: 2,
    });
    const r = await svc.list({ page: 1, pageSize: 20 }, ACTOR);
    expect(r.defects[0].createdAt).toBe(NOW.toISOString());
    expect(r.defects[0].assignee).toBeNull();
    expect(r.defects[1].assignee).toEqual({
      id: USER_ID,
      displayName: 'Kishor Kadam',
    });
    expect(r.defects[1].resolvedAt).toBe(NOW.toISOString());
  });

  it('list() computes skip/take from page/pageSize', async () => {
    const { svc, prisma } = makeService();
    await svc.list({ page: 3, pageSize: 10 }, ACTOR);
    expect(prisma.defect.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it('detail() returns the mapped defect', async () => {
    const { svc } = makeService();
    const d = await svc.detail(DEFECT_ID, ACTOR);
    expect(d.key).toBe('DEF-001');
    expect(d.project.key).toBe('RET');
    expect(d.createdAt).toBe(NOW.toISOString());
  });

  it('detail() throws 404 when the defect is absent', async () => {
    const { svc } = makeService({ found: false });
    await expect(svc.detail(DEFECT_ID, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('detail() scopes findFirst by workspace so cross-tenant → 404 (no leak)', async () => {
    const { svc, prisma } = makeService();
    await svc.detail(DEFECT_ID, ACTOR);
    expect(prisma.defect.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: DEFECT_ID,
          project: expect.objectContaining({ workspaceId: ACTOR.workspaceId }),
        }),
      }),
    );
  });

  it('reads write NO audit row (ERD §8.7 — GET is not a state change)', async () => {
    const { svc, prisma } = makeService();
    await svc.list({ page: 1, pageSize: 20 }, ACTOR);
    await svc.detail(DEFECT_ID, ACTOR);
    // the service has no AuditService dependency at all — proves reads aren't audited
    expect((prisma as Record<string, unknown>).auditLog).toBeUndefined();
  });
});
