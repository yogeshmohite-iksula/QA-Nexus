// QA Nexus PM1 — Day-18 P3 / #149 — TestRunsService tests.
//
// Strategy: unit-test the service against mocked PrismaService +
// AuditService + RealtimeGateway. Exercise the state-machine
// (ALLOWED_TRANSITIONS), audit-write contract, and WS-emit contract.
//
// 8+ tests per the brief:
//   State machine:
//     1. start: queued → running succeeds, stamps startedAt
//     2. start: from running → ConflictException (state guard)
//     3. start: from passed → ConflictException (terminal)
//     4. report: running → passed, stamps completedAt
//     5. report: running → failed
//     6. report: running → blocked
//     7. report: from queued → ConflictException (must go through running)
//     8. abort: running → aborted, stamps completedAt
//     9. abort: from queued → ConflictException
//    10. transition on missing runId → NotFoundException
//   Audit + WS:
//    11. start writes audit row with from/to status + transitioned_at
//    12. report writes audit row with `transition:running->passed` action
//    13. abort writes audit row with entityType='test_run'
//    14. each transition calls gateway.emitTestRunProgress(runId, ...)
//    15. WS emit failure is swallowed (audit + state are already canonical)
//   Static helper:
//    16. allowedTransitionsFrom('running') matches ERD §3.10

// IMPORTANT: TestRunsService transitively imports RealtimeGateway →
// AuthService → auth.config.ts → `better-auth` (ESM). Jest's CJS
// transformer can't load the ESM-only better-auth dist. Same pattern
// as realtime.gateway.spec.ts (Day-18 #148): mock the upstream modules
// at the module boundary so the better-auth chain never evaluates.
jest.mock('../../realtime/realtime.gateway', () => ({
  RealtimeGateway: class {},
}));
jest.mock('../../auth/auth.service', () => ({
  AuthService: class {},
}));
jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class {},
}));
jest.mock('../../audit/audit.service', () => ({
  AuditService: class {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { TestRunsService, ALLOWED_TRANSITIONS } from '../test-runs.service';

const actor = {
  appUserId: '11111111-1111-4111-8111-111111111111',
  workspaceId: '22222222-2222-4222-8222-222222222222',
};

const RUN_ID = '33333333-3333-4333-8333-333333333333';

function makeRun(status: string, overrides: Record<string, unknown> = {}) {
  return {
    id: RUN_ID,
    projectId: '44444444-4444-4444-8444-444444444444',
    status,
    startedAt: null,
    completedAt: null,
    name: 'Iksula Returns RET sprint 42',
    environment: 'staging',
    triggeredBy: 'manual',
    triggeredByUserId: actor.appUserId,
    suiteId: null,
    ...overrides,
  };
}

describe('TestRunsService — M4 P3 #149', () => {
  let mockPrisma: {
    testRun: { findUnique: jest.Mock; update: jest.Mock };
  };
  let mockAudit: { write: jest.Mock };
  let mockGateway: { emitTestRunProgress: jest.Mock };
  let svc: TestRunsService;

  beforeEach(() => {
    mockPrisma = {
      testRun: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    mockAudit = { write: jest.fn().mockResolvedValue(undefined) };
    mockGateway = { emitTestRunProgress: jest.fn().mockReturnValue(0) };
    svc = new TestRunsService(
      mockPrisma as never,
      mockAudit as never,
      mockGateway as never,
    );
  });

  // ──────────────────────────────────────────────────────────────────
  // State machine — start()
  // ──────────────────────────────────────────────────────────────────
  describe('start — queued → running', () => {
    it('succeeds when status=queued; stamps startedAt; returns updated row', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('queued'));
      const stampedAt = new Date('2026-05-14T14:00:00Z');
      mockPrisma.testRun.update.mockResolvedValue(
        makeRun('running', { startedAt: stampedAt }),
      );
      const out = await svc.start(RUN_ID, actor);
      expect(out.status).toBe('running');
      expect(out.startedAt).toEqual(stampedAt);

      // The update call must set status=running AND stamp startedAt.
      const updateArg = mockPrisma.testRun.update.mock.calls[0][0];
      expect(updateArg.where).toEqual({ id: RUN_ID });
      expect(updateArg.data.status).toBe('running');
      expect(updateArg.data.startedAt).toBeInstanceOf(Date);
      // completedAt is NOT stamped on start (terminal only).
      expect('completedAt' in updateArg.data).toBe(false);
    });

    it('rejects ConflictException when status=running (re-start)', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('running'));
      await expect(svc.start(RUN_ID, actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockPrisma.testRun.update).not.toHaveBeenCalled();
      expect(mockAudit.write).not.toHaveBeenCalled();
      expect(mockGateway.emitTestRunProgress).not.toHaveBeenCalled();
    });

    it('rejects ConflictException when status=passed (terminal — no outbound)', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('passed'));
      await expect(svc.start(RUN_ID, actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // State machine — report()
  // ──────────────────────────────────────────────────────────────────
  describe('report — running → passed | failed | blocked', () => {
    it('running → passed succeeds; stamps completedAt', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('running'));
      const stampedAt = new Date('2026-05-14T14:30:00Z');
      mockPrisma.testRun.update.mockResolvedValue(
        makeRun('passed', {
          startedAt: new Date('2026-05-14T14:00:00Z'),
          completedAt: stampedAt,
        }),
      );
      const out = await svc.report(RUN_ID, { status: 'passed' }, actor);
      expect(out.status).toBe('passed');
      expect(out.completedAt).toEqual(stampedAt);

      const updateArg = mockPrisma.testRun.update.mock.calls[0][0];
      expect(updateArg.data.status).toBe('passed');
      expect(updateArg.data.completedAt).toBeInstanceOf(Date);
    });

    it('running → failed succeeds', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('running'));
      mockPrisma.testRun.update.mockResolvedValue(makeRun('failed'));
      const out = await svc.report(RUN_ID, { status: 'failed' }, actor);
      expect(out.status).toBe('failed');
    });

    it('running → blocked succeeds', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('running'));
      mockPrisma.testRun.update.mockResolvedValue(makeRun('blocked'));
      const out = await svc.report(RUN_ID, { status: 'blocked' }, actor);
      expect(out.status).toBe('blocked');
    });

    it('queued → passed rejects (must transition through running first)', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('queued'));
      await expect(
        svc.report(RUN_ID, { status: 'passed' }, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // State machine — abort()
  // ──────────────────────────────────────────────────────────────────
  describe('abort — running → aborted', () => {
    it('running → aborted succeeds; stamps completedAt', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('running'));
      const stampedAt = new Date('2026-05-14T15:00:00Z');
      mockPrisma.testRun.update.mockResolvedValue(
        makeRun('aborted', { completedAt: stampedAt }),
      );
      const out = await svc.abort(RUN_ID, actor);
      expect(out.status).toBe('aborted');
      expect(out.completedAt).toEqual(stampedAt);
    });

    it('queued → aborted rejects (can only abort a running run)', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('queued'));
      await expect(svc.abort(RUN_ID, actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Missing run → 404
  // ──────────────────────────────────────────────────────────────────
  describe('missing run', () => {
    it('throws NotFoundException when run does not exist', async () => {
      mockPrisma.testRun.findUnique.mockResolvedValue(null);
      await expect(svc.start(RUN_ID, actor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockPrisma.testRun.update).not.toHaveBeenCalled();
      expect(mockAudit.write).not.toHaveBeenCalled();
      expect(mockGateway.emitTestRunProgress).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Audit + WS contracts
  // ──────────────────────────────────────────────────────────────────
  describe('audit + WS emit contracts (Hard Rule 7)', () => {
    beforeEach(() => {
      mockPrisma.testRun.findUnique.mockResolvedValue(makeRun('running'));
      mockPrisma.testRun.update.mockResolvedValue(makeRun('passed'));
    });

    it('audit.write called with entityType=test_run, action=transition:from->to', async () => {
      await svc.report(RUN_ID, { status: 'passed' }, actor);
      expect(mockAudit.write).toHaveBeenCalledTimes(1);
      const auditCall = mockAudit.write.mock.calls[0][0];
      expect(auditCall.workspaceId).toBe(actor.workspaceId);
      expect(auditCall.actorId).toBe(actor.appUserId);
      expect(auditCall.entityType).toBe('test_run');
      expect(auditCall.entityId).toBe(RUN_ID);
      expect(auditCall.action).toBe('transition:running->passed');
      expect(auditCall.payload.from_status).toBe('running');
      expect(auditCall.payload.to_status).toBe('passed');
      expect(typeof auditCall.payload.transitioned_at).toBe('string');
    });

    it('gateway.emitTestRunProgress called with runId + status payload', async () => {
      await svc.report(RUN_ID, { status: 'passed' }, actor);
      expect(mockGateway.emitTestRunProgress).toHaveBeenCalledTimes(1);
      const [runId, payload] = mockGateway.emitTestRunProgress.mock.calls[0];
      expect(runId).toBe(RUN_ID);
      expect(payload.status).toBe('passed');
    });

    it('WS emit failure is SWALLOWED (audit + state stay canonical)', async () => {
      mockGateway.emitTestRunProgress.mockImplementation(() => {
        throw new Error('ws fanout boom');
      });
      // Should NOT throw — service treats WS as best-effort.
      const out = await svc.report(RUN_ID, { status: 'passed' }, actor);
      expect(out.status).toBe('passed');
      // Audit was still written before the throw.
      expect(mockAudit.write).toHaveBeenCalledTimes(1);
    });

    it('audit.write FAILURE propagates (run state already updated but FE is notified via error)', async () => {
      mockAudit.write.mockRejectedValue(new Error('audit chain broken'));
      await expect(
        svc.report(RUN_ID, { status: 'passed' }, actor),
      ).rejects.toThrow(/audit chain broken/);
      // WS emit must NOT fire when audit failed (ordering: audit before emit).
      expect(mockGateway.emitTestRunProgress).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Static helper — exposes the canon table
  // ──────────────────────────────────────────────────────────────────
  describe('ALLOWED_TRANSITIONS (ERD §3.10 canon)', () => {
    it('queued → running only', () => {
      const allowed = TestRunsService.allowedTransitionsFrom('queued');
      expect(allowed).toEqual(['running']);
    });

    it('running → passed | failed | blocked | aborted', () => {
      const allowed = new Set(
        TestRunsService.allowedTransitionsFrom('running'),
      );
      expect(allowed).toEqual(
        new Set(['passed', 'failed', 'blocked', 'aborted']),
      );
    });

    it('passed / failed / blocked / aborted are terminal', () => {
      for (const terminal of [
        'passed',
        'failed',
        'blocked',
        'aborted',
      ] as const) {
        const allowed = ALLOWED_TRANSITIONS[terminal];
        expect(allowed.size).toBe(0);
      }
    });
  });
});
