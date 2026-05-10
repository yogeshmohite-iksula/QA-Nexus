// QA Nexus PM1 — AES-256-GCM helper for LLM provider API-key column.
//
// Spec: ADR-015 (M3-close runtime LLM config bridge — Path C). Used by:
//   1. apps/api/scripts/seed-llm-provider.ts (encrypts plaintext key
//      from CLI input → stores in TB-019 llm_providers.api_key_encrypted)
//   2. apps/api/src/llm/llm-gateway.service.ts (decrypts at boot when
//      DB-fallback path engages — env-first, DB-second)
//   3. Future F26 v2 React UI (M5) — same encrypt path; the seed script
//      becomes the admin's CLI escape hatch + this helper stays canonical.
//
// Format on the wire (single TEXT column):
//   <iv_b64url>.<authtag_b64url>.<ciphertext_b64url>
// Three dot-separated base64url segments — keeps the column human-readable
// in psql + survives JSON round-trips without escaping.
//
// Key derivation: SHA-256(BETTER_AUTH_SECRET) → 32 bytes for AES-256-GCM.
// IV is 12 bytes random per encrypt (GCM canonical). Auth tag is 16 bytes.
//
// AAD (additional authenticated data) is INTENTIONALLY OMITTED in v1 to
// keep the API simple; F26 v2 OR an `(az)`-tagged refactor can add
// AAD = workspaceId + providerKind to bind ciphertext to its row context
// (defends against row-swap attacks). Tracked in followup `(az)`.

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ALGO = 'aes-256-gcm' as const;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;

/**
 * Derive a 32-byte AES key from the seed string via SHA-256. The seed
 * is `BETTER_AUTH_SECRET` in production; tests can pass any non-empty
 * string. Throws on empty/missing seed (defense in depth — calling
 * code MUST resolve env first).
 */
export function deriveKey(seed: string): Buffer {
  if (typeof seed !== 'string' || seed.length === 0) {
    throw new Error(
      'deriveKey: seed must be a non-empty string (typically BETTER_AUTH_SECRET).',
    );
  }
  return createHash('sha256')
    .update(seed, 'utf8')
    .digest()
    .subarray(0, KEY_BYTES);
}

/**
 * Encrypt a plaintext string with AES-256-GCM under the supplied seed.
 * Returns the canonical `<iv>.<authtag>.<ciphertext>` triplet (base64url).
 *
 * Each call generates a fresh random IV — same plaintext + same seed
 * produces a DIFFERENT ciphertext every call. This is the GCM contract
 * (IV reuse with same key = catastrophic failure of confidentiality).
 */
export function encryptApiKey(plaintext: string, seed: string): string {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('encryptApiKey: plaintext must be a non-empty string.');
  }
  const key = deriveKey(seed);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  if (authTag.length !== AUTH_TAG_BYTES) {
    // Should never happen with aes-256-gcm; defensive guard.
    throw new Error(
      `encryptApiKey: unexpected authTag length ${authTag.length}, expected ${AUTH_TAG_BYTES}`,
    );
  }
  return [
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

/**
 * Decrypt a `<iv>.<authtag>.<ciphertext>` triplet back to plaintext.
 * Throws on:
 *   - malformed input (wrong segment count, bad base64)
 *   - tampered ciphertext (auth-tag verification fails — GCM property)
 *   - wrong seed (auth-tag verification fails)
 *
 * Callers should let the exception bubble; failed decrypt is a
 * security-critical event that must NOT silently fall through to
 * a default value.
 */
export function decryptApiKey(triplet: string, seed: string): string {
  if (typeof triplet !== 'string' || triplet.length === 0) {
    throw new Error('decryptApiKey: triplet must be a non-empty string.');
  }
  const parts = triplet.split('.');
  if (parts.length !== 3) {
    throw new Error(
      `decryptApiKey: malformed input — expected 3 dot-separated segments, got ${parts.length}.`,
    );
  }
  const [ivB64, authTagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, 'base64url');
  const authTag = Buffer.from(authTagB64, 'base64url');
  const ct = Buffer.from(ctB64, 'base64url');
  if (iv.length !== IV_BYTES) {
    throw new Error(
      `decryptApiKey: malformed IV — expected ${IV_BYTES} bytes, got ${iv.length}.`,
    );
  }
  if (authTag.length !== AUTH_TAG_BYTES) {
    throw new Error(
      `decryptApiKey: malformed authTag — expected ${AUTH_TAG_BYTES} bytes, got ${authTag.length}.`,
    );
  }
  const key = deriveKey(seed);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  // .final() throws on auth-tag mismatch (tampered ciphertext OR wrong key).
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * Map `providerKind` (Prisma enum value) → process.env var name that the
 * concrete provider class reads in its constructor. Used by the gateway
 * DB-fallback path (`LLMGatewayService.readConfig`) to inject the
 * decrypted key BEFORE the provider is lazily constructed by
 * `getProvider()`.
 *
 * Keep in sync with `apps/api/src/llm/providers/<name>.provider.ts`
 * constructors. New providers MUST be added here when their adapter
 * lands.
 */
export function envVarForProviderKind(kind: string): string {
  switch (kind) {
    case 'groq':
      return 'GROQ_API_KEY';
    case 'gemini':
      return 'GEMINI_API_KEY';
    default:
      // Conservative default — every other provider in the enum
      // (openai/anthropic/kimi/mistral/together/fireworks/openrouter/
      // cerebras/custom_oai) follows the `<KIND>_API_KEY` convention.
      return `${kind.toUpperCase()}_API_KEY`;
  }
}
