// Unit tests for HMAC-SHA256 webhook signature verifier.
//
// Pure-function test — no NestJS, no DI. Tests cover the 4 enumerated
// VerifyFailReason buckets + happy path + length-edge-case.

import { createHmac } from 'node:crypto';
import { verifyHmacSha256 } from '../hmac-verifier';

const SECRET = 'test-secret-do-not-use-in-prod';

function signed(body: string, secret: string = SECRET): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

describe('verifyHmacSha256', () => {
  it('verifies a correctly-signed payload', () => {
    const body =
      '{"webhookEvent":"jira:issue_created","issue":{"id":"1","key":"RET-42"}}';
    const result = verifyHmacSha256(
      Buffer.from(body, 'utf8'),
      signed(body),
      SECRET,
    );
    expect(result).toEqual({ ok: true });
  });

  it('returns secret_missing when secret is empty', () => {
    const body = '{"webhookEvent":"x"}';
    const result = verifyHmacSha256(Buffer.from(body), signed(body), '');
    expect(result).toEqual({ ok: false, reason: 'secret_missing' });
  });

  it('returns missing_header when X-Hub-Signature is undefined', () => {
    const body = '{"webhookEvent":"x"}';
    const result = verifyHmacSha256(Buffer.from(body), undefined, SECRET);
    expect(result).toEqual({ ok: false, reason: 'missing_header' });
  });

  it('returns missing_header when X-Hub-Signature is empty string', () => {
    const body = '{"webhookEvent":"x"}';
    const result = verifyHmacSha256(Buffer.from(body), '', SECRET);
    expect(result).toEqual({ ok: false, reason: 'missing_header' });
  });

  it('returns malformed_header when signature lacks sha256= prefix', () => {
    const body = '{"webhookEvent":"x"}';
    const result = verifyHmacSha256(Buffer.from(body), 'a'.repeat(64), SECRET);
    expect(result).toEqual({ ok: false, reason: 'malformed_header' });
  });

  it('returns malformed_header when hex part is too short', () => {
    const body = '{"webhookEvent":"x"}';
    const result = verifyHmacSha256(
      Buffer.from(body),
      'sha256=' + 'a'.repeat(63),
      SECRET,
    );
    expect(result).toEqual({ ok: false, reason: 'malformed_header' });
  });

  it('returns malformed_header when hex part contains non-hex chars', () => {
    const body = '{"webhookEvent":"x"}';
    const result = verifyHmacSha256(
      Buffer.from(body),
      'sha256=' + 'g'.repeat(64),
      SECRET,
    );
    expect(result).toEqual({ ok: false, reason: 'malformed_header' });
  });

  it('returns signature_mismatch when secret is wrong', () => {
    const body = '{"webhookEvent":"x"}';
    const wrongSig = signed(body, 'attacker-secret');
    const result = verifyHmacSha256(Buffer.from(body), wrongSig, SECRET);
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' });
  });

  it('returns signature_mismatch when body is tampered post-sign', () => {
    const body = '{"webhookEvent":"x"}';
    const sig = signed(body); // signed with original body
    const tampered = '{"webhookEvent":"y"}'; // sneaky alteration
    const result = verifyHmacSha256(Buffer.from(tampered), sig, SECRET);
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' });
  });

  it('case-insensitive on the sha256 prefix', () => {
    const body = '{"webhookEvent":"x"}';
    const sig = signed(body).replace(/^sha256/, 'SHA256');
    const result = verifyHmacSha256(Buffer.from(body), sig, SECRET);
    expect(result).toEqual({ ok: true });
  });
});
