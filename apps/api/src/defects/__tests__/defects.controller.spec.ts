// QA Nexus PM1 — DefectsController spec.
//
// Day-19 P0 #2 (#157): stub-contract tests for 5 endpoints.
// Day-20 P1 (#173): POST :id/rca becomes functional (sync 200+inline).
// Day-21 P0 (this PR, followup `(da)`): POST :id/rca flips to async
//   202+WS pattern. Spec covers happy + 3 sad paths + retains stub-contract
//   for other 4 endpoints + GET :id/rca.
//
// jest.mock at module boundary on sherlock-orchestrator service path —
// the real orchestrator imports RealtimeGateway → AuthService → better-auth
// (ESM) which jest's CJS transformer can't load. Same Day-17 #138/#139
// pattern + #174 fix-forward precedent.

jest.mock(
  '../../agents/sherlock-orchestrator/sherlock-orchestrator.service',
  () => ({
    SherlockOrchestratorService: class FakeOrchestrator {
      runRca = jest.fn();
      runAndPersist = jest.fn();
    },
  }),
);

import { Test } from '@nestjs/testing';
import { DefectsController } from '../defects.controller';
import { SherlockOrchestratorService } from '../../agents/sherlock-orchestrator/sherlock-orchestrator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const TEST_DEFECT_ID = '11111111-2222-3333-4444-555555555555';
const TEST_WORKSPACE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function fakeRes() {
  const captured: {
    status?: number;
    headers: Record<string, string>;
    body?: unknown;
  } = {
    headers: {},
  };
  const res = {
    status: (code: number) => {
      captured.status = code;
      return res;
    },
    header: (name: string, value: string) => {
      captured.headers[name.toLowerCase()] = value;
      return res;
    },
    json: (body: unknown) => {
      captured.body = body;
      return res;
    },
  };
  return { res, captured };
}

/** Wait for setImmediate-queued microtasks to drain so we can assert
 *  the orchestrator was invoked AFTER the 202 response was returned. */
async function flushSetImmediate(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('DefectsController', () => {
  let ctrl: DefectsController;
  let runAndPersist: jest.Mock;
  let runRca: jest.Mock;
  let defectFindUnique: jest.Mock;
  let auditWrite: jest.Mock;

  beforeEach(async () => {
    runAndPersist = jest.fn().mockResolvedValue({
      rcaReportId: 'rca-report-id-1',
      status: 'completed',
      topHypothesis: 'mock top hypothesis',
      okAgentCount: 3,
      durationMs: 1234,
    });
    runRca = jest.fn();
    defectFindUnique = jest.fn().mockResolvedValue({
      project: { workspaceId: TEST_WORKSPACE_ID },
    });
    auditWrite = jest.fn().mockResolvedValue({ id: 'audit-1', thisHash: 'h' });

    const moduleRef = await Test.createTestingModule({
      controllers: [DefectsController],
      providers: [
        {
          provide: SherlockOrchestratorService,
          useValue: { runRca, runAndPersist },
        },
        {
          provide: PrismaService,
          useValue: { defect: { findUnique: defectFindUnique } },
        },
        {
          provide: AuditService,
          useValue: { write: auditWrite },
        },
      ],
    }).compile();
    ctrl = moduleRef.get(DefectsController);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('POST /api/defects/:id/rca — Day-21 async 202+WS pattern', () => {
    const validBody = {
      stackTrace: 'TypeError: Cannot read properties of null',
      failureMessage: 'Refund failed for order RET-1042',
      component: 'apps/api/src/refunds',
    };

    it('returns 202 + { runId, accepted, wsChannel } (happy path)', async () => {
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(TEST_DEFECT_ID, validBody, res as never);
      expect(captured.status).toBe(202);
      const body = captured.body as {
        defectId: string;
        runId: string;
        accepted: boolean;
        wsChannel: string;
      };
      expect(body.defectId).toBe(TEST_DEFECT_ID);
      expect(body.runId).toMatch(/^[0-9a-f]{8}-/);
      expect(body.accepted).toBe(true);
      expect(body.wsChannel).toBe(`rca.complete.${body.runId}`);
    });

    it('writes rca_kicked_off audit row SYNCHRONOUSLY before returning 202', async () => {
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(TEST_DEFECT_ID, validBody, res as never);
      expect(auditWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: TEST_WORKSPACE_ID,
          entityType: 'defect',
          entityId: TEST_DEFECT_ID,
          action: 'rca_kicked_off',
        }),
      );
      // Audit row was written BEFORE 202 was sent.
      expect(captured.status).toBe(202);
    });

    it('spawns orchestrator.runAndPersist via setImmediate (NOT inline-awaited)', async () => {
      const { res } = fakeRes();
      await ctrl.kickoffRca(TEST_DEFECT_ID, validBody, res as never);
      // Not invoked yet — setImmediate hasn't fired
      expect(runAndPersist).not.toHaveBeenCalled();
      await flushSetImmediate();
      expect(runAndPersist).toHaveBeenCalledWith(
        expect.objectContaining({
          defectId: TEST_DEFECT_ID,
          stackTrace: validBody.stackTrace,
        }),
        expect.objectContaining({
          workspaceId: TEST_WORKSPACE_ID,
          actorId: null,
        }),
      );
    });

    it('returns 404 when defect not found', async () => {
      defectFindUnique.mockResolvedValueOnce(null);
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(TEST_DEFECT_ID, validBody, res as never);
      expect(captured.status).toBe(404);
      expect((captured.body as { error: string }).error).toBe('DefectNotFound');
      expect(auditWrite).not.toHaveBeenCalled();
      expect(runAndPersist).not.toHaveBeenCalled();
    });

    it('returns 400 when defect ID path param is not a UUID', async () => {
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca('not-a-uuid', validBody, res as never);
      expect(captured.status).toBe(400);
      expect((captured.body as { error: string }).error).toBe(
        'InvalidDefectId',
      );
      expect(defectFindUnique).not.toHaveBeenCalled();
      expect(auditWrite).not.toHaveBeenCalled();
      expect(runAndPersist).not.toHaveBeenCalled();
    });

    it('returns 400 when request body fails Zod validation', async () => {
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(
        TEST_DEFECT_ID,
        { stackTrace: '', failureMessage: 'm', component: 'c' },
        res as never,
      );
      expect(captured.status).toBe(400);
      expect((captured.body as { error: string }).error).toBe(
        'InvalidRequestBody',
      );
      expect(defectFindUnique).not.toHaveBeenCalled();
      expect(auditWrite).not.toHaveBeenCalled();
      expect(runAndPersist).not.toHaveBeenCalled();
    });

    it('logs error but does NOT crash when runAndPersist rejects (response already sent)', async () => {
      runAndPersist.mockRejectedValueOnce(new Error('orchestrator boom'));
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(TEST_DEFECT_ID, validBody, res as never);
      expect(captured.status).toBe(202);
      // Drain setImmediate; the orchestrator's reject is caught and logged.
      await flushSetImmediate();
      // Promise rejection → .catch handler should run without throwing.
      // (Jest would otherwise log unhandled rejection.)
      expect(runAndPersist).toHaveBeenCalled();
    });
  });

  describe('still 501 stubs (other endpoints — Day-21+ landing)', () => {
    it.each([
      [
        'create',
        (c: DefectsController, r: ReturnType<typeof fakeRes>['res']) =>
          c.create({}, r as never),
      ],
      [
        'detail',
        (c: DefectsController, r: ReturnType<typeof fakeRes>['res']) =>
          c.detail('id-1', r as never),
      ],
      [
        'rca (GET — fetch, not kickoff)',
        (c: DefectsController, r: ReturnType<typeof fakeRes>['res']) =>
          c.rca('id-1', r as never),
      ],
      [
        'pushToJira',
        (c: DefectsController, r: ReturnType<typeof fakeRes>['res']) =>
          c.pushToJira('id-1', {}, r as never),
      ],
      [
        'setStatus',
        (c: DefectsController, r: ReturnType<typeof fakeRes>['res']) =>
          c.setStatus('id-1', {}, r as never),
      ],
    ])('%s returns 501 with x-m4-stub header', (_name, invoke) => {
      const { res, captured } = fakeRes();
      invoke(ctrl, res as never);
      expect(captured.status).toBe(501);
      expect(captured.headers['x-m4-stub']).toBe('true');
      const body = captured.body as {
        m4Stub: boolean;
        error: string;
        op: string;
      };
      expect(body.m4Stub).toBe(true);
      expect(body.error).toBe('NotImplemented');
      expect(typeof body.op).toBe('string');
    });
  });
});
