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

// AuthService imports better-auth (ESM); mock the module boundary so this spec
// can provide it as a DI token without jest's CJS transform choking — same
// reasoning as the sherlock mock above (#259 better-auth/plugins precedent).
jest.mock('../../auth/auth.service', () => ({
  AuthService: class FakeAuthService {},
}));

import { Test } from '@nestjs/testing';
import { Role } from '@qa-nexus/shared';
import { DefectsController } from '../defects.controller';
import { SherlockOrchestratorService } from '../../agents/sherlock-orchestrator/sherlock-orchestrator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthService } from '../../auth/auth.service';
import { ROLES_KEY } from '../../auth/rbac/roles.decorator';

const TEST_DEFECT_ID = '11111111-2222-3333-4444-555555555555';
const TEST_WORKSPACE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const TEST_ACTOR_ID = '99999999-8888-7777-6666-555555555555';

/** Minimal Express-like request carrying a session cookie (AuthService is
 *  mocked, so the header content is irrelevant — only the shape matters). */
function fakeReq(): { headers: Record<string, string> } {
  return { headers: { cookie: 'better-auth.session_token=test' } };
}

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
  let resolveSession: jest.Mock;

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
    resolveSession = jest.fn().mockResolvedValue({
      authUser: {
        id: 'auth-1',
        email: 'akshay.panchal@iksula.com',
        name: 'Akshay',
      },
      appUser: {
        id: TEST_ACTOR_ID,
        email: 'akshay.panchal@iksula.com',
        displayName: 'Akshay Panchal',
        role: 'Lead',
        workspaceId: TEST_WORKSPACE_ID,
        organizationalLabel: 'QA Lead',
      },
      expiresAt: '2026-07-01T00:00:00.000Z',
    });

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
        {
          provide: AuthService,
          useValue: { resolveSession },
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

    // P1 (Day-32 audit §P1): this endpoint was anonymous — anyone with a defect
    // UUID could trigger the Sherlock LLM fan-out (Groq quota burn) + write
    // actorId:null audit rows. This asserts the RBAC decorators are present;
    // it FAILS before the guard is added (metadata undefined) and PASSES after.
    it('is RBAC-guarded — @Roles(Admin,Lead,QAEngineer) + RolesGuard', () => {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        DefectsController.prototype.kickoffRca,
      );
      expect(roles).toEqual([Role.Admin, Role.Lead, Role.QAEngineer]);
      // @UseGuards stores the guard classes under Nest's GUARDS_METADATA key.
      const guards = Reflect.getMetadata(
        '__guards__',
        DefectsController.prototype.kickoffRca,
      ) as Array<{ name: string }> | undefined;
      expect(guards?.some((g) => g.name === 'RolesGuard')).toBe(true);
    });

    it('returns 404 when the actor is in a different workspace (tenant isolation)', async () => {
      resolveSession.mockResolvedValueOnce({
        authUser: { id: 'auth-2', email: 'x@other.com', name: 'X' },
        appUser: {
          id: 'other-actor',
          email: 'x@other.com',
          displayName: 'Other',
          role: 'Lead',
          workspaceId: 'ffffffff-0000-0000-0000-000000000000',
          organizationalLabel: null,
        },
        expiresAt: '2026-07-01T00:00:00.000Z',
      });
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(
        TEST_DEFECT_ID,
        validBody,
        fakeReq() as never,
        res as never,
      );
      expect(captured.status).toBe(404);
      expect((captured.body as { error: string }).error).toBe('DefectNotFound');
      expect(auditWrite).not.toHaveBeenCalled();
      expect(runAndPersist).not.toHaveBeenCalled();
    });

    it('returns 202 + { runId, accepted, wsChannel } (happy path)', async () => {
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(
        TEST_DEFECT_ID,
        validBody,
        fakeReq() as never,
        res as never,
      );
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
      await ctrl.kickoffRca(
        TEST_DEFECT_ID,
        validBody,
        fakeReq() as never,
        res as never,
      );
      expect(auditWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: TEST_WORKSPACE_ID,
          actorId: TEST_ACTOR_ID,
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
      await ctrl.kickoffRca(
        TEST_DEFECT_ID,
        validBody,
        fakeReq() as never,
        res as never,
      );
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
          actorId: TEST_ACTOR_ID,
        }),
      );
    });

    it('returns 404 when defect not found', async () => {
      defectFindUnique.mockResolvedValueOnce(null);
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(
        TEST_DEFECT_ID,
        validBody,
        fakeReq() as never,
        res as never,
      );
      expect(captured.status).toBe(404);
      expect((captured.body as { error: string }).error).toBe('DefectNotFound');
      expect(auditWrite).not.toHaveBeenCalled();
      expect(runAndPersist).not.toHaveBeenCalled();
    });

    it('returns 400 when defect ID path param is not a UUID', async () => {
      const { res, captured } = fakeRes();
      await ctrl.kickoffRca(
        'not-a-uuid',
        validBody,
        fakeReq() as never,
        res as never,
      );
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
        fakeReq() as never,
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
      await ctrl.kickoffRca(
        TEST_DEFECT_ID,
        validBody,
        fakeReq() as never,
        res as never,
      );
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
