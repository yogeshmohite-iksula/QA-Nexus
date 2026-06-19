// QA Nexus PM1 — TestRunsService.list (Day-32 /home runs read API).
//
// Unit-tests the list path against a mocked PrismaService. Same upstream-
// module mocking as test-runs.service.spec.ts — the RealtimeGateway transitive
// import would otherwise pull `ws` into a plain unit test.

jest.mock('../../realtime/realtime.gateway', () => ({
  RealtimeGateway: class {},
}));
jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));
jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('../../audit/audit.service', () => ({ AuditService: class {} }));

import { TestRunsService } from '../test-runs.service';
import type { TestRunListQuery } from '@qa-nexus/shared';

const actor = {
  appUserId: '11111111-1111-4111-8111-111111111111',
  workspaceId: '22222222-2222-4222-8222-222222222222',
};
const OTHER_WS = '99999999-9999-4999-8999-999999999999';
const PROJECT_ID = '44444444-4444-4444-8444-444444444444';

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    projectId: PROJECT_ID,
    name: 'Returns Regression Suite — sprint 42',
    status: 'running',
    triggeredBy: 'manual',
    startedAt: new Date('2026-06-19T09:00:00Z'),
    completedAt: null,
    environment: 'staging',
    project: { id: PROJECT_ID, key: 'RET', name: 'Iksula Returns' },
    triggeredByUser: { id: actor.appUserId, displayName: 'Yogesh Mohite' },
    results: [
      { status: 'passed' },
      { status: 'passed' },
      { status: 'failed' },
      { status: 'blocked' },
    ],
    ...overrides,
  };
}

/** Query object as it looks AFTER Zod parse (defaults applied). */
function q(overrides: Record<string, unknown> = {}): TestRunListQuery {
  return {
    sort: 'started_at_desc',
    page: 1,
    pageSize: 20,
    ...overrides,
  } as unknown as TestRunListQuery;
}

describe('TestRunsService.list — /home runs read API (Day-32)', () => {
  let mockPrisma: {
    $transaction: jest.Mock;
    testRun: { findMany: jest.Mock; count: jest.Mock };
  };
  let svc: TestRunsService;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((arr: Promise<unknown>[]) => Promise.all(arr)),
      testRun: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    svc = new TestRunsService(
      mockPrisma as never,
      { write: jest.fn() } as never,
      { emitTestRunProgress: jest.fn() } as never,
    );
  });

  it('maps a row to the wire shape + tallies case counts from results', async () => {
    mockPrisma.testRun.findMany.mockResolvedValue([makeRow()]);
    mockPrisma.testRun.count.mockResolvedValue(1);

    const out = await svc.list(q(), actor);

    expect(out.total).toBe(1);
    expect(out.page).toBe(1);
    expect(out.pageSize).toBe(20);
    expect(out.testRuns).toHaveLength(1);
    const item = out.testRuns[0];
    expect(item.project.key).toBe('RET'); // projectKey is project.key
    expect(item.status).toBe('running');
    expect(item.trigger).toBe('manual');
    expect(item.startedAt).toBe('2026-06-19T09:00:00.000Z');
    expect(item.completedAt).toBeNull();
    expect(item.totalCases).toBe(4);
    expect(item.passedCases).toBe(2);
    expect(item.failedCases).toBe(1);
    expect(item.triggeredBy).toEqual({
      id: actor.appUserId,
      displayName: 'Yogesh Mohite',
    });
  });

  it('always scopes the where-clause to the caller workspace (tenant isolation)', async () => {
    await svc.list(q(), actor);
    const arg = mockPrisma.testRun.findMany.mock.calls[0][0];
    expect(arg.where.project.workspaceId).toBe(actor.workspaceId);
    expect(arg.where.project.workspaceId).not.toBe(OTHER_WS);
  });

  it('applies the status filter (ACTIVE_RUNS use case)', async () => {
    await svc.list(q({ status: 'running' }), actor);
    const arg = mockPrisma.testRun.findMany.mock.calls[0][0];
    expect(arg.where.status).toBe('running');
  });

  it('applies the projectId filter within the workspace', async () => {
    await svc.list(q({ projectId: PROJECT_ID }), actor);
    const arg = mockPrisma.testRun.findMany.mock.calls[0][0];
    expect(arg.where.project.id).toBe(PROJECT_ID);
    expect(arg.where.project.workspaceId).toBe(actor.workspaceId);
  });

  it('sorts started_at desc nulls-last (RECENT_RUNS) + offset-paginates', async () => {
    await svc.list(q({ page: 3, pageSize: 10 }), actor);
    const arg = mockPrisma.testRun.findMany.mock.calls[0][0];
    expect(arg.orderBy).toEqual({ startedAt: { sort: 'desc', nulls: 'last' } });
    expect(arg.skip).toBe(20); // (3 - 1) * 10
    expect(arg.take).toBe(10);
  });

  it('returns an empty list cleanly (no runs seeded yet)', async () => {
    const out = await svc.list(q(), actor);
    expect(out.testRuns).toEqual([]);
    expect(out.total).toBe(0);
  });

  it('maps a webhook/cron run (no human triggerer) → triggeredBy null', async () => {
    mockPrisma.testRun.findMany.mockResolvedValue([
      makeRow({ triggeredBy: 'cron', triggeredByUser: null, results: [] }),
    ]);
    mockPrisma.testRun.count.mockResolvedValue(1);
    const out = await svc.list(q(), actor);
    expect(out.testRuns[0].triggeredBy).toBeNull();
    expect(out.testRuns[0].trigger).toBe('cron');
    expect(out.testRuns[0].totalCases).toBe(0);
    expect(out.testRuns[0].passedCases).toBe(0);
  });
});
