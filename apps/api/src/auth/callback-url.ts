// Day-21 Kimi-K2 HIGH triage (a) — open-redirect protection on /auth/callback.
//
// BetterAuth's magic-link verifier accepts a `callbackURL` query param and
// redirects there after setting the session cookie. Without validation,
// an attacker can mint a magic link with `?callbackURL=https://evil.com`
// and trick a user into landing on attacker-controlled origin AFTER they've
// authenticated — a textbook open-redirect → phishing chain (the evil page
// looks legit because the user IS logged in to our app).
//
// Fix: validate `callbackURL` against a per-deployment allowlist of trusted
// origins. Defined via env var `TRUSTED_CALLBACK_ORIGINS` (CSV of
// `<protocol>://<host>[:<port>]` entries, no paths). Relative paths (starting
// with `/` but NOT `//` which is protocol-relative) are always allowed since
// they're same-origin. Anything else falls back to `/home`.
//
// Defense-in-depth: validation happens at TWO points:
//   1. sign-up + sign-in body parse (intake — don't even mint a magic link
//      pointing at an untrusted origin)
//   2. callback handler redirect (in case an attacker crafted the magic-link
//      verify URL directly, bypassing sign-up/sign-in)

const DEFAULT_DEV_ORIGINS = ['http://localhost:3000'];

/** Parse `TRUSTED_CALLBACK_ORIGINS` CSV into a Set of normalized origins.
 *  Each entry MUST be a full origin (scheme + host + optional port). Throws
 *  at boot if a malformed entry is encountered — fail-fast is correct here
 *  because a bad allowlist would silently rewrite legitimate redirects. */
export function parseTrustedOrigins(raw: string | undefined): Set<string> {
  const csv = (raw ?? '').trim();
  if (!csv) {
    return new Set(DEFAULT_DEV_ORIGINS);
  }
  const out = new Set<string>();
  for (const entry of csv.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error(
        `TRUSTED_CALLBACK_ORIGINS: invalid entry "${trimmed}" — must be a full origin (scheme + host).`,
      );
    }
    // Normalize: strip path/query/fragment; keep only origin.
    out.add(parsed.origin);
  }
  if (out.size === 0) return new Set(DEFAULT_DEV_ORIGINS);
  return out;
}

/** Validate a user-provided callbackURL against the allowlist.
 *
 *  Rules:
 *    - undefined / empty → OK (no redirect requested; controller will use
 *      default like /home).
 *    - Relative path (starts with `/` but NOT `//`) → OK (same-origin).
 *    - Absolute URL whose origin is in `trustedOrigins` → OK.
 *    - Anything else → FAIL.
 *
 *  Returns `true` if the URL is safe to use; `false` otherwise. Callers
 *  decide the fallback (reject vs rewrite to /home). */
export function isTrustedCallbackUrl(
  url: string | undefined,
  trustedOrigins: Set<string>,
): boolean {
  if (!url) return true;
  // Protocol-relative URLs (//evil.com/x) are NEVER same-origin — reject.
  if (url.startsWith('//')) return false;
  // Same-origin relative path. Must START with '/' but not '//'.
  if (url.startsWith('/')) return true;
  // Absolute — must parse + match allowlist origin.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return trustedOrigins.has(parsed.origin);
}
