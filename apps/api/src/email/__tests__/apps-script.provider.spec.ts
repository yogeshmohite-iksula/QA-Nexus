// Unit tests for AppsScriptEmailProvider (ADR-025) — fully isolated (global
// fetch mocked; no real HTTP). Pins: body shape + secret, success parsing,
// graceful failure on ok:false / non-2xx / throw, secret redaction, and the
// not-configured short-circuit.

import { AppsScriptEmailProvider } from '../providers/apps-script.provider';

const SECRET = 'a'.repeat(64);
const URL_ = 'https://script.google.com/macros/s/AKfABC/exec';
const ARGS = {
  to: 'akshay.panchal@iksula.com',
  subject: 'QA Nexus bridge smoke',
  html: '<p>hi</p>',
  text: 'hi',
};

function mockFetch(status: number, json: unknown): jest.Mock {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(json),
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('AppsScriptEmailProvider (ADR-025)', () => {
  const ORIG_ENV = { ...process.env };
  const ORIG_FETCH = global.fetch;
  beforeEach(() => {
    process.env.APPS_SCRIPT_EMAIL_URL = URL_;
    process.env.APPS_SCRIPT_EMAIL_SECRET = SECRET;
    delete process.env.APPS_SCRIPT_FROM_NAME;
    delete process.env.APPS_SCRIPT_REPLY_TO;
  });
  afterEach(() => {
    process.env = { ...ORIG_ENV };
    global.fetch = ORIG_FETCH;
  });

  it('isReady() is false when URL or SECRET is missing', () => {
    delete process.env.APPS_SCRIPT_EMAIL_URL;
    expect(new AppsScriptEmailProvider().isReady()).toBe(false);
  });

  it('POSTs the correct body shape (secret + defaults) and parses success', async () => {
    const fetchFn = mockFetch(200, { ok: true, remaining: 1499 });
    const res = await new AppsScriptEmailProvider().send(ARGS);
    expect(res.error).toBeUndefined();
    expect(res.messageId).toBe('apps-script-ok-1499');

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(URL_);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      secret: SECRET,
      to: ARGS.to,
      subject: ARGS.subject,
      htmlBody: ARGS.html,
      textBody: ARGS.text,
      fromName: 'QA Nexus',
      replyTo: 'yogesh.mohite@iksula.com',
    });
  });

  it('returns { error } (no throw) when the Web App responds ok:false', async () => {
    mockFetch(200, { ok: false, error: 'quota exceeded' });
    const res = await new AppsScriptEmailProvider().send(ARGS);
    expect(res.messageId).toMatch(/^failed-/);
    expect(res.error).toBe('quota exceeded');
  });

  it('returns { error } on non-2xx HTTP', async () => {
    mockFetch(500, { ok: false, error: 'boom' });
    const res = await new AppsScriptEmailProvider().send(ARGS);
    expect(res.messageId).toMatch(/^failed-/);
    expect(res.error).toBeDefined();
  });

  it('sanitizes the shared secret out of thrown error messages', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(
        new Error(`connect failed for secret=${SECRET}`),
      ) as unknown as typeof fetch;
    const res = await new AppsScriptEmailProvider().send(ARGS);
    expect(res.error).toBeDefined();
    expect(res.error).not.toContain(SECRET);
    expect(res.error).toContain('<redacted>');
  });

  it('not configured → error without firing fetch', async () => {
    delete process.env.APPS_SCRIPT_EMAIL_SECRET;
    const fetchFn = jest.fn();
    global.fetch = fetchFn as unknown as typeof fetch;
    const res = await new AppsScriptEmailProvider().send(ARGS);
    expect(res.messageId).toMatch(/^failed-/);
    expect(res.error).toMatch(/not configured/);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
