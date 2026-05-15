// QA Nexus PM1 — Day-19 P0 #2 stub-contract test for JiraSyncController.

import { JiraSyncController } from '../jira-sync.controller';

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

describe('JiraSyncController (M4 STUB — Day-19 P0 #2)', () => {
  const ctrl = new JiraSyncController();

  it.each([
    [
      'webhook',
      (c: JiraSyncController, r: ReturnType<typeof fakeRes>['res']) =>
        c.webhook({}, r as never),
    ],
    [
      'connect',
      (c: JiraSyncController, r: ReturnType<typeof fakeRes>['res']) =>
        c.connect('slug-1', {}, r as never),
    ],
    [
      'sync',
      (c: JiraSyncController, r: ReturnType<typeof fakeRes>['res']) =>
        c.sync('slug-1', {}, r as never),
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
