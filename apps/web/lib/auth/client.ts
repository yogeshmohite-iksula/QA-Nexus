// BetterAuth client — Pattern B target for the magic-link sign-in flow.
//
// Wired in pre-prep on Day-9 (2026-05-05) ahead of BE T021 land. Once
// T021 + ADR-007 ship, the sign-in page (PR #42) flips its deferred
// `console.info('pattern-a:deferred:sign-in:send-magic-link', ...)`
// stub to:
//
//   await authClient.signIn.magicLink({
//     email,
//     callbackURL: '/home',
//     errorCallbackURL: '/sign-in?error=expired',
//   });
//
// Verify route is owned by BetterAuth at `/auth/magic-link/verify`
// (no custom FE page — the link auto-authenticates + redirects via
// `callbackURL`). Magic-link expiry is locked to 10 minutes; BE T021
// must align `magicLink({ expiresIn: 60 * 10 })` to keep FE/BE copy
// in sync (action item per CHANGELOG Day-9 entry).
//
// `baseURL` resolution order (post-followup `(be)`, 2026-05-10):
//
//  1. process.env.NEXT_PUBLIC_API_BASE_URL — preferred when it bakes
//     correctly. Set per-env (local dev / staging / prod) so dev hits
//     localhost:3001 and staging/prod hit their own Render origins.
//
//  2. 'https://qa-nexus-api.onrender.com' — production fallback. Used
//     when the env var fails to inject at Cloudflare Pages build time
//     (verified Day-15: var was set as Plaintext in Variables and
//     Secrets, deployment succeeded, but the bundle still referenced
//     same-origin instead of the API origin). Likely Cloudflare Pages
//     × Next.js framework integration quirk; tracked in followup `(be)`
//     for proper M5 investigation. Hardcoded prod URL is the bridge
//     until the env-var injection is reliable.
//
// Original `!` non-null assertion (Day-9) was the desired behaviour
// when env-var injection was assumed reliable — it failed the build
// loudly if missing. Day-15 reality: Cloudflare Pages built fine but
// the value didn't bake into the JS bundle, so the silent fallback
// to same-origin was happening at RUNTIME — exactly the failure mode
// the `!` was meant to prevent. The string fallback below catches
// both build-time and run-time variants of the same problem.
//
// `basePath`: '/auth' aligns the BetterAuth client with BE's canonical
// mount basePath (per Render boot log: `BetterAuth initialised
// (basePath=/auth)`). BetterAuth client defaults to `/api/auth` which
// caused 404 on production magic-link sign-in (Day-15 cross-FE E2E).
// Closes audit followup `(bc)`.

import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://qa-nexus-api.onrender.com',
  basePath: '/auth',
  plugins: [magicLinkClient()],
});
