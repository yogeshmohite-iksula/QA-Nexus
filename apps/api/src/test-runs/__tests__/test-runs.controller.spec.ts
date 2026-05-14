// QA Nexus PM1 — TestRunsController smoke test.
//
// Originally a 501 stub-contract spec from Day-19 P0 #2 (PR #157).
// Day-20 cascade rebase: the stub controller was superseded by PR #149's
// real impl (TestRunsService + AuthService injected). The 17-test coverage
// for state machine + audit + WS emit lives in `test-runs.service.spec.ts`.
//
// This file now serves as a thin "controller-wiring smoke": confirms the
// controller class instantiates cleanly with mocked deps so that any future
// constructor-shape drift surfaces here BEFORE jest tries to load the
// service spec. Minimal coverage by design.

import { Test } from '@nestjs/testing';
import { TestRunsController } from '../test-runs.controller';
import { TestRunsService } from '../test-runs.service';
import { AuthService } from '../../auth/auth.service';

describe('TestRunsController (wiring smoke — Day-20 cascade)', () => {
  let ctrl: TestRunsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestRunsController],
      providers: [
        {
          provide: TestRunsService,
          useValue: {
            transition: jest.fn(),
            allowedTransitionsFrom: jest.fn(() => []),
          },
        },
        {
          provide: AuthService,
          useValue: { resolveSession: jest.fn() },
        },
      ],
    }).compile();
    ctrl = moduleRef.get(TestRunsController);
  });

  it('instantiates with TestRunsService + AuthService injected', () => {
    expect(ctrl).toBeDefined();
    expect(ctrl).toBeInstanceOf(TestRunsController);
  });
});
