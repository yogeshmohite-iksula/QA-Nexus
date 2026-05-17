// QA Nexus PM1 — JiraSyncController spec.
//
// Day-19 P0 #2 (PR #157): stub-contract tests for 3 endpoints.
// Day-19 P2 (this PR):    webhook stub → functional. Tests now cover
//                          HMAC verify happy/sad paths + Zod validation
//                          + audit-call assertions. connect/sync stay
//                          stub-contract tested.
//
// Mock pattern: NestJS DI useValue for JiraSyncService — zero real audit
// or DB hits. Mirrors A1Scribe + Sherlock test discipline.

import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import { JiraSyncController } from '../jira-sync.controller';
import { JiraSyncService } from '../jira-sync.service';

const TEST_SECRET = 'unit-test-shared-secret';

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

function fakeReq(
  rawBody: Buffer | unknown,
  headers: Record<string, string> = {},
) {
  return {
    body: rawBody,
    headers,
  };
}

function signBody(body: string, secret: string = TEST_SECRET): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

describe('JiraSyncController', () => {
  let ctrl: JiraSyncController;
  let recordReceived: jest.Mock;
  let recordInvalid: jest.Mock;
  const ORIGINAL_SECRET_ENV = process.env.JIRA_WEBHOOK_SECRET;

  beforeEach(async () => {
    recordReceived = jest.fn();
    recordInvalid = jest.fn();
    process.env.JIRA_WEBHOOK_SECRET = TEST_SECRET;

    const moduleRef = await Test.createTestingModule({
      controllers: [JiraSyncController],
      providers: [
        {
          provide: JiraSyncService,
          useValue: {
            recordWebhookReceived: recordReceived,
            recordWebhookSignatureInvalid: recordInvalid,
          },
        },
      ],
    }).compile();
    ctrl = moduleRef.get(JiraSyncController);
  });

  afterEach(() => {
    if (ORIGINAL_SECRET_ENV === undefined) {
      delete process.env.JIRA_WEBHOOK_SECRET;
    } else {
      process.env.JIRA_WEBHOOK_SECRET = ORIGINAL_SECRET_ENV;
    }
  });

  describe('POST /api/jira/webhook — happy path', () => {
    it('returns 200 + audit-records when signature is valid', () => {
      const body = JSON.stringify({
        webhookEvent: 'jira:issue_created',
        issue: { id: '10001', key: 'RET-42' },
      });
      const buf = Buffer.from(body, 'utf8');
      const { res, captured } = fakeRes();
      const req = fakeReq(buf, { 'x-hub-signature': signBody(body) });

      ctrl.webhook(req as never, res as never);

      expect(captured.status).toBe(200);
      expect(captured.body).toEqual({
        ack: true,
        eventType: 'jira:issue_created',
        issueKey: 'RET-42',
      });
      expect(recordReceived).toHaveBeenCalledTimes(1);
      expect(recordInvalid).not.toHaveBeenCalled();
    });

    it('handles event without an issue ref (system event)', () => {
      const body = JSON.stringify({ webhookEvent: 'jira:user_created' });
      const buf = Buffer.from(body, 'utf8');
      const { res, captured } = fakeRes();
      const req = fakeReq(buf, { 'x-hub-signature': signBody(body) });

      ctrl.webhook(req as never, res as never);

      expect(captured.status).toBe(200);
      const respBody = captured.body as { issueKey: string | null };
      expect(respBody.issueKey).toBeNull();
      expect(recordReceived).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/jira/webhook — signature failures', () => {
    it('returns 401 + audit-records invalid when signature mismatches', () => {
      const body = JSON.stringify({ webhookEvent: 'jira:issue_created' });
      const buf = Buffer.from(body, 'utf8');
      const { res, captured } = fakeRes();
      const req = fakeReq(buf, {
        'x-hub-signature': signBody(body, 'attacker-secret'),
      });

      ctrl.webhook(req as never, res as never);

      expect(captured.status).toBe(401);
      expect(captured.body).toEqual({
        error: 'InvalidSignature',
        reason: 'signature_mismatch',
      });
      expect(recordInvalid).toHaveBeenCalledWith('signature_mismatch');
      expect(recordReceived).not.toHaveBeenCalled();
    });

    it('returns 401 when X-Hub-Signature header is missing', () => {
      const body = JSON.stringify({ webhookEvent: 'jira:issue_created' });
      const { res, captured } = fakeRes();
      const req = fakeReq(Buffer.from(body), {});

      ctrl.webhook(req as never, res as never);

      expect(captured.status).toBe(401);
      expect(recordInvalid).toHaveBeenCalledWith('missing_header');
    });

    it('returns 401 when JIRA_WEBHOOK_SECRET env is unset (fail-closed)', () => {
      delete process.env.JIRA_WEBHOOK_SECRET;
      const body = JSON.stringify({ webhookEvent: 'jira:issue_created' });
      const { res, captured } = fakeRes();
      const req = fakeReq(Buffer.from(body), {
        'x-hub-signature': signBody(body),
      });

      ctrl.webhook(req as never, res as never);

      expect(captured.status).toBe(401);
      expect(recordInvalid).toHaveBeenCalledWith('secret_missing');
    });
  });

  describe('POST /api/jira/webhook — body shape failures', () => {
    it('returns 400 when raw body is missing (middleware mis-mounted)', () => {
      const { res, captured } = fakeRes();
      // Body parsed as object instead of Buffer = the failure mode.
      const req = fakeReq(
        { webhookEvent: 'x' },
        {
          'x-hub-signature': 'sha256=' + 'a'.repeat(64),
        },
      );

      ctrl.webhook(req as never, res as never);

      expect(captured.status).toBe(400);
      const body = captured.body as { error: string };
      expect(body.error).toBe('RawBodyMissing');
      expect(recordReceived).not.toHaveBeenCalled();
      expect(recordInvalid).not.toHaveBeenCalled();
    });

    it('returns 400 when body is valid HMAC but invalid JSON', () => {
      const body = 'not json at all';
      const buf = Buffer.from(body, 'utf8');
      const { res, captured } = fakeRes();
      const req = fakeReq(buf, { 'x-hub-signature': signBody(body) });

      ctrl.webhook(req as never, res as never);

      expect(captured.status).toBe(400);
      const respBody = captured.body as { error: string };
      expect(respBody.error).toBe('InvalidJson');
    });

    it('returns 400 when payload fails Zod validation', () => {
      const body = JSON.stringify({ wrongKey: 'no-webhookEvent-field' });
      const buf = Buffer.from(body, 'utf8');
      const { res, captured } = fakeRes();
      const req = fakeReq(buf, { 'x-hub-signature': signBody(body) });

      ctrl.webhook(req as never, res as never);

      expect(captured.status).toBe(400);
      const respBody = captured.body as { error: string };
      expect(respBody.error).toBe('PayloadValidationFailed');
    });
  });

  describe('connect/sync — still 501 stubs (Day-20 wiring)', () => {
    it.each([
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
});
