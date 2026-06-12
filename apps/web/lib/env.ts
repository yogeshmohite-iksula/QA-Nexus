// FE env-var helpers — single source of truth for the FE/API origin pair.
//
// Day-16 (2026-05-11): added `getAppBaseURL()` to mirror the
// `apps/web/lib/auth/client.ts` API-baseURL fallback pattern from
// PR #122. Same Cloudflare Pages × Next.js 15 `NEXT_PUBLIC_*` env-var
// injection bug applies — values set in the Pages dashboard don't
// always bake into the JS bundle. Defense-in-depth: hardcoded prod
// URL as fallback when the env var resolves to undefined/empty.
//
// Resolution order (both helpers):
//   1. process.env.NEXT_PUBLIC_*_BASE_URL — preferred when injected
//   2. hardcoded prod URL — fallback for Cloudflare quirk + production
//      reliability (no Cloudflare config dependency)
//   3. http://localhost:300X — dev fallback when NODE_ENV !== 'production'
//
// Tracked by followup `(be)` — Cloudflare Pages × Next.js 15 env-var
// injection investigation, M5.

const APP_PROD_URL = 'https://qa-nexus-web.pages.dev';
const APP_DEV_URL = 'http://localhost:3000';
const API_PROD_URL = 'https://qa-nexus-api.onrender.com';
const API_DEV_URL = 'http://localhost:3001';

/**
 * Returns the FE origin (where the React app is served).
 *
 * Used by cross-origin redirects (e.g. `signIn.magicLink({ callbackURL })`)
 * where BetterAuth needs an ABSOLUTE URL because the verify redirect runs
 * on the API origin (qa-nexus-api.onrender.com) and a relative path would
 * resolve to the wrong domain — landing the user on the API origin's 404
 * page instead of the FE's /home route (M3 close blocker, 2026-05-11).
 *
 * Refs: BetterAuth GH #6104, #7406.
 */
export function getAppBaseURL(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  // Production fallback — covers the Cloudflare Pages env-var injection
  // bug (PR #122 sister pattern for the API baseURL).
  if (process.env.NODE_ENV === 'production') {
    return APP_PROD_URL;
  }
  // Dev fallback — Next.js default port.
  return APP_DEV_URL;
}

/**
 * Returns the API origin (NestJS on Render) — the single source of truth for
 * every `/api/*` + `/auth/*` data fetch.
 *
 * 46th RC (2026-06-12 live shake-down): six api files used
 * `NEXT_PUBLIC_API_BASE_URL ?? localhost:3001` with NO production tier — when
 * Cloudflare Pages drops the env var (the PR #122 injection quirk), the
 * PRODUCTION bundle called http://localhost:3001 and the canned fallback
 * silently masked the broken wire. This helper applies the same 3-tier
 * resolution as `getAppBaseURL()` / `lib/auth/client.ts`: env var →
 * hardcoded prod origin → localhost dev. In a production build Next.js
 * inlines `NODE_ENV`, so the localhost branch is dead-code-eliminated —
 * a prod bundle can never resolve to localhost.
 */
export function getApiBaseURL(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return API_PROD_URL;
  }
  return API_DEV_URL;
}
