// QA Nexus PM1 — HMAC-SHA256 webhook signature verifier.
//
// Spec: followup `(bq)` 2026-05-14 + Day-19 P2 brief + ADR-019-aligned
// raw-body design doc at `docs/architecture/webhook-raw-body.md`.
//
// Pure function — no DI, no logger, no side effects. Reusable from
// future webhook receivers (Slack, GitHub, Stripe-style — all use
// `X-Hub-Signature: sha256=<hex>` or `<algo>=<hex>` family).
//
// Constant-time compare via `crypto.timingSafeEqual` — defense against
// timing-attack signature-recovery (BREACH-class side-channel).

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Result of verify — outcome enum so callers can branch on cause. */
export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: VerifyFailReason };

export type VerifyFailReason =
  | 'missing_header' // X-Hub-Signature header absent or empty
  | 'malformed_header' // header doesn't match `sha256=<64-hex>` pattern
  | 'signature_mismatch' // header decoded OK, HMAC compute disagrees
  | 'secret_missing'; // env var not set — fail-closed

/**
 * Verify a Jira webhook (Atlassian "Webhook" feature) signature against
 * the raw request body bytes.
 *
 * Header format per Atlassian docs:
 *   X-Hub-Signature: sha256=<64-char-lowercase-hex>
 *
 * @param rawBody  request body as Buffer (NOT JSON-parsed). Required —
 *                 raw-body middleware must be installed on the route
 *                 BEFORE the global JSON body-parser.
 * @param signatureHeader  value of X-Hub-Signature header (or undefined).
 * @param secret  shared secret configured both here (env JIRA_WEBHOOK_SECRET)
 *                and on the Atlassian side when registering the webhook.
 *                Empty string = secret_missing fail.
 */
export function verifyHmacSha256(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): VerifyResult {
  if (typeof secret !== 'string' || secret.length === 0) {
    return { ok: false, reason: 'secret_missing' };
  }
  if (typeof signatureHeader !== 'string' || signatureHeader.length === 0) {
    return { ok: false, reason: 'missing_header' };
  }
  // Expect `sha256=<hex>` — case-insensitive prefix, lowercase hex body.
  const match = /^sha256=([0-9a-f]{64})$/i.exec(signatureHeader.trim());
  if (!match) {
    return { ok: false, reason: 'malformed_header' };
  }
  const providedHex = match[1].toLowerCase();
  const computedHex = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // Both buffers are exactly 32 bytes (64 hex chars decoded). Constant-time
  // compare on the raw bytes — timingSafeEqual throws on length mismatch
  // which can't happen here because the regex above pinned 64 chars.
  const providedBuf = Buffer.from(providedHex, 'hex');
  const computedBuf = Buffer.from(computedHex, 'hex');
  if (providedBuf.length !== computedBuf.length) {
    return { ok: false, reason: 'signature_mismatch' };
  }
  const equal = timingSafeEqual(providedBuf, computedBuf);
  return equal ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
}
