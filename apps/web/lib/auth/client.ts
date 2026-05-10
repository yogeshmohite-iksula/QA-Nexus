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
// `baseURL`: process.env.NEXT_PUBLIC_API_BASE_URL is set per-env in
// Cloudflare Pages — local dev defaults to http://localhost:3001 (BE
// NestJS port). The `!` non-null assertion is safe because the env var
// is required at build-time; the build will fail loudly if missing,
// which is the desired behaviour (vs silent runtime crash).
//
// `basePath`: '/auth' aligns the BetterAuth client with BE's canonical
// mount basePath (per Render boot log: `BetterAuth initialised
// (basePath=/auth)`). BetterAuth client defaults to `/api/auth` which
// caused 404 on production magic-link sign-in (Day-15 cross-FE E2E).
// Closes audit followup `(bc)`.

import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL!,
  basePath: '/auth',
  plugins: [magicLinkClient()],
});
