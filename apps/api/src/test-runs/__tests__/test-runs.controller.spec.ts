// QA Nexus PM1 — Day-19 P0 #2 stub-contract test for TestRunsController.
//
// Pins the 501 stub shape so we know if the controller drifts before
// PR #149 lands the full implementation.

import { TestRunsController } from '../test-runs.controller';

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

describe('TestRunsController (M4 STUB — Day-19 P0 #2)', () => {
  const ctrl = new TestRunsController();

  it.each([
    [
      'start',
      (c: TestRunsController, r: ReturnType<typeof fakeRes>['res']) =>
        c.start('id-1', r as never),
    ],
    [
      'result',
      (c: TestRunsController, r: ReturnType<typeof fakeRes>['res']) =>
        c.report('id-1', r as never),
    ],
    [
      'abort',
      (c: TestRunsController, r: ReturnType<typeof fakeRes>['res']) =>
        c.abort('id-1', r as never),
    ],
  ])(
    '%s returns 501 with x-m4-stub header + landingPr=149',
    (_name, invoke) => {
      const { res, captured } = fakeRes();
      invoke(ctrl, res as never);
      expect(captured.status).toBe(501);
      expect(captured.headers['x-m4-stub']).toBe('true');
      const body = captured.body as {
        m4Stub: boolean;
        landingPr: number;
        error: string;
      };
      expect(body.m4Stub).toBe(true);
      expect(body.landingPr).toBe(149);
      expect(body.error).toBe('NotImplemented');
    },
  );
});
