// QA Nexus PM1 — Single redaction config used by BOTH OTel trace
// exporter AND OTel logs exporter. Single source of truth so we don't
// have to remember to update two configs when a new sensitive key
// surfaces in incident review.
//
// Spec: T019 (M0 backlog) + docs/SECURITY.md "Logging" section.
// Design call: per Day-4 morning Yogesh decision — "Path 2" pure-OTel
// pipeline (no pino) so api.md rule "no third-party logger transports"
// stays intact.

/**
 * Sensitive attribute / log-attribute / header keys whose VALUES must
 * be replaced with `REDACTED` before any data leaves the process.
 *
 * Match is case-insensitive substring. Add new patterns here whenever
 * incident review reveals a key that should never have been exported.
 *
 * Categories:
 *   - HTTP headers (auth tokens, cookies, API keys)
 *   - Auth payload fields (passwords, session tokens)
 *   - Better-auth specific (session_token cookie, BetterAuth secrets)
 *   - Audit-log payload bodies (may contain user-supplied data)
 *   - Generic LLM / API key shapes
 */
export const SENSITIVE_KEYS: readonly string[] = [
  // HTTP request/response headers
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-session-token',

  // Generic credential fields
  'password',
  'passwordhash',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'session_token',
  'secret',
  'api_key',
  'apikey',
  'private_key',
  'privatekey',

  // BetterAuth-specific
  'betterauth.session',
  'better-auth.session_token',
  'betterauth_secret',

  // Provider-specific
  'groq_api_key',
  'gemini_api_key',
  'cloudflare_api_token',
  'resend_api_key',
  'r2_access_key_id',
  'r2_secret_access_key',
  'better_stack_otlp_auth',
  'grafana_cloud_otlp_auth',

  // Audit-log payload bodies (PM1_ERD §3.13: payload may contain
  // user input that we don't want to ship to telemetry verbatim;
  // the audit log itself is the source of truth, OTel is best-effort
  // observability). Both the full path and the shorter nested-key
  // forms — `redactAttributes` recurses by own-key so nested keys
  // see the shorter form `payload.body`.
  'audit_log.payload.body',
  'audit_log.row_payload',
  'payload.body',
  'row_payload',
];

/**
 * Returns true if the attribute key matches any sensitive pattern
 * (case-insensitive substring).
 */
export function isSensitiveKey(key: string): boolean {
  if (!key) return false;
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((pattern) =>
    lower.includes(pattern.toLowerCase()),
  );
}

/**
 * Recursively redact a record's values where keys match
 * `isSensitiveKey`. Non-sensitive keys are kept verbatim. Used by both
 * the trace SpanProcessor (via `attributeValueLengthLimit` workaround)
 * and the LogRecordProcessor (via `LogRecord.attributes` rewrite).
 *
 * Returns a NEW object — does not mutate the input. Important because
 * the same attribute object may be observed by multiple exporters.
 */
export function redactAttributes(
  attrs: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!attrs || typeof attrs !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (isSensitiveKey(key)) {
      out[key] = 'REDACTED';
      continue;
    }
    // Recurse into nested objects (but not arrays / Buffers / typed
    // arrays — those are values, not attribute containers).
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof Map) &&
      !(value instanceof Set) &&
      !ArrayBuffer.isView(value as ArrayBufferView)
    ) {
      out[key] = redactAttributes(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}
