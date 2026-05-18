// QA Nexus PM1 — TestRunsController smoke test (Day-20 post-cascade).
//
// Originally a 501 stub-contract spec from Day-19 P0 #2 (PR #157).
// Day-20 cascade rebase: stub controller was superseded by PR #172 (née #149)
// real impl. The 17-test state-machine coverage lives in `test-runs.service.spec.ts`.
//
// This file = thin "controller-wiring smoke": confirms the controller class
// instantiates cleanly with mocked deps. Mock pattern: jest.mock at module
// boundary on AuthService (transitively pulls better-auth ESM which breaks
// jest's CJS transformer — same workaround as Day-17 #138/#139 specs).

jest.mock('../../auth/auth.service', () => ({
  AuthService: class FakeAuthService {
    resolveSession = jest.fn();
  },
}));
jest.mock('../../auth/rbac/roles.guard', () => ({
  RolesGuard: class FakeRolesGuard {
    canActivate = () => true;
  },
}));

import { TestRunsController } from '../test-runs.controller';
import { TestRunsService } from '../test-runs.service';
import { AuthService } from '../../auth/auth.service';

describe('TestRunsController (wiring smoke — Day-20 cascade)', () => {
  it('instantiates with TestRunsService + AuthService injected', () => {
    const testRuns = {
      transition: jest.fn(),
      allowedTransitionsFrom: jest.fn(() => []),
    } as unknown as TestRunsService;
    const auth = { resolveSession: jest.fn() } as unknown as AuthService;
    const ctrl = new TestRunsController(testRuns, auth);
    expect(ctrl).toBeDefined();
    expect(ctrl).toBeInstanceOf(TestRunsController);
  });
});
