// QA Nexus PM1 — DefectsController spec.
//
// Day-19 P0 #2 (#157): stub-contract tests for 5 endpoints.
// Day-20 P1 (this PR): POST :id/rca becomes functional (calls Sherlock
//                       orchestrator). Tests cover happy + 2 sad paths +
//                       retains stub-contract for other 4 endpoints + GET :id/rca.

import { Test } from '@nestjs/testing';
import { DefectsController } from '../defects.controller';
import { SherlockOrchestratorService } from '../../agents/sherlock-orchestrator/sherlock-orchestrator.service';

const TEST_DEFECT_ID = '11111111-2222-3333-4444-555555555555';

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

describe('DefectsController', () => {
  let ctrl: DefectsController;
  let sherlockRunRca: jest.Mock;

  beforeEach(async () => {
    sherlockRunRca = jest.fn();
    const moduleRef = await Test.createTestingModule({
      controllers: [DefectsController],
      providers: [
        {
          provide: SherlockOrchestratorService,
          useValue: { runRca: sherlockRunRca },
        },
      ],
    }).compile();
    ctrl = moduleRef.get(DefectsController);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('POST /api/defects/:id/rca — functional Day-20', () => {
    const validBody = {
      stackTrace: 'TypeError: Cannot read properties of null',
      failureMessage: 'Refund failed for order RET-1042',
      component: 'apps/api/src/refunds',
    };

    it('returns 200 + orchestrator result inline (happy path)', async () => {
      sherlockRunRca.mockResolvedValueOnce({
        runId: 'run-uuid-1',
        status: 'completed',
        okAgentCount: 3,
        hypotheses: [
          {
            agent: 'code',
            category: 'code-bug',
            hypothesis: 'Null deref ten chars ok',
            confidence: 0.85,
            evidence: [],
          },
        ],
      });
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(TEST_DEFECT_ID, validBody, res as never);
      expect(captured.status).toBe(200);
      const body = captured.body as {
        runId: string;
        status: string;
        hypotheses: unknown[];
      };
      expect(body.runId).toBe('run-uuid-1');
      expect(body.status).toBe('completed');
      expect(body.hypotheses).toHaveLength(1);
      expect(sherlockRunRca).toHaveBeenCalledWith(
        expect.objectContaining({
          defectId: TEST_DEFECT_ID,
          stackTrace: validBody.stackTrace,
          failureMessage: validBody.failureMessage,
          component: validBody.component,
        }),
      );
    });

    it('returns 400 when defect ID path param is not a UUID', async () => {
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca('not-a-uuid', validBody, res as never);
      expect(captured.status).toBe(400);
      expect((captured.body as { error: string }).error).toBe(
        'InvalidDefectId',
      );
      expect(sherlockRunRca).not.toHaveBeenCalled();
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
      expect(sherlockRunRca).not.toHaveBeenCalled();
    });

    it('propagates degraded status from orchestrator', async () => {
      sherlockRunRca.mockResolvedValueOnce({
        runId: 'run-uuid-2',
        status: 'degraded',
        okAgentCount: 0,
        hypotheses: [],
      });
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(TEST_DEFECT_ID, validBody, res as never);
      expect(captured.status).toBe(200);
      expect((captured.body as { status: string }).status).toBe('degraded');
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
