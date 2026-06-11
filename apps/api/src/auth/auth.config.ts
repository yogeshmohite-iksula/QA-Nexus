// BetterAuth instance for QA Nexus PM1 — magic-link only, Prisma adapter,
// Postgres tables prefixed `auth_*` to avoid clashing with TB-002 `users`.
//
// Spec: MS0-T021 (Day-9 wiring) + ADR-007 (cookie-domain wildcard parent).
//
// CRITICAL pieces (all enforced here):
//   1. `nextCookies()` plugin — Next.js 15 App Router REQUIREMENT. Without
//      it, auth functions invoked from Server Actions silently fail to set
//      cookies. See BetterAuth issue #4038.
//   2. `crossSubDomainCookies` — share session cookie across `app.` + `api.`
//      subdomains under `.qanexus.iksula.com` parent zone. See ADR-007.
//   3. `defaultCookieAttributes.partitioned: true` — CHIPS-compliant for
//      Chrome 118+ wildcard parent-domain cookies.
//   4. `magicLink.expiresIn: 60 * 10` — 10-minute TTL matches FE copy in
//      F06 Sign In + industry standard for unauthenticated callbacks.
//      Corporate Gmail latency (~5s observed at Iksula) leaves comfortable
//      margin within the window.
//   5. Localhost dev guard — `Domain` attribute with leading dot is
//      invalid on `localhost` per RFC 6265, so we skip the wildcard +
//      flip `useSecureCookies` off when `BETTER_AUTH_URL` points at
//      a non-HTTPS host.

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession, magicLink } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import type { PrismaClient } from '@prisma/client';
import type { EmailService } from '../email/email.service';

export type AuthInstance = ReturnType<typeof buildAuth>;

/** Cookie config: three deployment topologies, driven by `BETTER_AUTH_URL`.
 *  Returns crossSubDomain + the Secure flag + the SameSite policy together,
 *  because all three move as a unit per topology:
 *    1. Local dev (http)            → host-only, no Secure, SameSite=Lax.
 *    2. Shared-parent zone (https,  → wildcard parent cookie, Secure,
 *       host under .qanexus.iksula.com   SameSite=Lax (requests are same-site).
 *       or BETTER_AUTH_COOKIE_DOMAIN set)
 *    3. Cross-site pilot (https,    → HOST-ONLY cookie (no Domain), Secure,
 *       host NOT under that zone —      SameSite=None, Partitioned (CHIPS).
 *       e.g. pages.dev FE + onrender.com API)
 *  P0-001 fix (2026-06-07): topology 3 previously fell through to a
 *  Domain=.qanexus.iksula.com + SameSite=Lax cookie, which the browser
 *  rejected (Domain ≠ origin host) and would not send cross-site. See
 *  docs/pilot-prep/2026-06-07-p0-001-cookie-cors-root-cause-be.md. */
function resolveCookieConfig(baseUrl: string): {
  crossSubDomain: { enabled: boolean; domain?: string };
  useSecure: boolean;
  sameSite: 'lax' | 'none';
} {
  const isHttps = baseUrl.startsWith('https://');
  if (!isHttps) {
    // (1) Local dev — host-only, no Secure, SameSite=Lax (FE+API both
    // localhost → same-site, Lax is correct + safest).
    return {
      crossSubDomain: { enabled: false },
      useSecure: false,
      sameSite: 'lax',
    };
  }
  let host = '';
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    // Malformed URL — treat as cross-site (safest: host-only + SameSite=None).
    host = '';
  }
  const explicitDomain = process.env.BETTER_AUTH_COOKIE_DOMAIN;
  if (explicitDomain || host.endsWith('.qanexus.iksula.com')) {
    // (2) Shared-parent zone — FE + API are sibling subdomains of one
    // registrable domain, so a wildcard parent cookie + SameSite=Lax works.
    return {
      crossSubDomain: {
        enabled: true,
        domain: explicitDomain || '.qanexus.iksula.com',
      },
      useSecure: true,
      sameSite: 'lax',
    };
  }
  // (3) Cross-site pilot — FE (pages.dev) + API (onrender.com) are DIFFERENT
  // registrable domains. A Domain attribute would be rejected and SameSite=Lax
  // would not be sent on cross-site fetch. Host-only cookie (no Domain) +
  // SameSite=None; Secure; Partitioned (CHIPS). P0-001 fix.
  return {
    crossSubDomain: { enabled: false },
    useSecure: true,
    sameSite: 'none',
  };
}

export function buildAuth(prisma: PrismaClient, email: EmailService) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET missing or too short (need ≥32 chars).',
    );
  }
  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001';
  const { crossSubDomain, useSecure, sameSite } = resolveCookieConfig(baseUrl);

  // Trusted origins for CORS + CSRF — BetterAuth handles its own preflight
  // checks via this list (we deliberately do NOT call app.enableCors() in
  // main.ts — letting BetterAuth own the /auth/* surface keeps the policy
  // single-sourced).
  //
  // Production list includes:
  //   - https://app.qanexus.iksula.com  (canonical app subdomain — future)
  //   - https://api.qanexus.iksula.com  (canonical api subdomain — future)
  //   - https://qa-nexus-web.pages.dev  (Cloudflare Pages prod alias — TODAY)
  //
  // Cloudflare Pages preview-deployment hashes (e.g.
  // https://89c44180.qa-nexus-web.pages.dev) are NOT in the default list —
  // operators wanting to test a preview build can append via the
  // AUTH_TRUSTED_ORIGINS env var (comma-separated). Day-15 P0 fix per
  // followup (bd) — magic-link was 405-then-CORS-blocked because the
  // pages.dev alias was missing.
  //
  // Local dev gets localhost too so Next.js dev server can call the API.
  const baseTrusted = useSecure
    ? [
        'https://app.qanexus.iksula.com',
        'https://api.qanexus.iksula.com',
        'https://qa-nexus-web.pages.dev',
      ]
    : ['http://localhost:3000', 'http://localhost:3001'];

  // Optional env-var override for additional origins (preview hashes,
  // staging aliases, etc.). Comma-separated. Trimmed + filtered to
  // non-empty entries. Appended to the base list (does NOT replace).
  const envExtras = (process.env.AUTH_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const trustedOrigins = [...baseTrusted, ...envExtras];

  return betterAuth({
    secret,
    baseURL: baseUrl,
    basePath: '/auth',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    // Map BetterAuth's internal model names to our prefixed Postgres tables.
    user: { modelName: 'authUser' },
    session: { modelName: 'authSession' },
    account: { modelName: 'authAccount' },
    verification: { modelName: 'authVerification' },
    emailAndPassword: { enabled: false }, // PM1 = magic-link only
    trustedOrigins,
    advanced: {
      // Our auth_* tables use Postgres UUID columns (@db.Uuid in schema.prisma).
      // BetterAuth defaults to nanoid-style IDs which Postgres rejects as
      // invalid UUIDs. Override to crypto.randomUUID() so inserts succeed.
      generateId: () => globalThis.crypto.randomUUID(),
      crossSubDomainCookies: crossSubDomain,
      defaultCookieAttributes: {
        secure: useSecure,
        httpOnly: true,
        // P0-001 fix (2026-06-07): SameSite=None for the cross-site pilot
        // (pages.dev FE ↔ onrender.com API); 'lax' for the shared-parent zone
        // or localhost. Computed per deployment topology in resolveCookieConfig().
        sameSite,
        // CHIPS partitioning — required for cross-site (SameSite=None) cookies
        // in Chrome 118+; a harmless no-op under SameSite=Lax. Secure only.
        partitioned: useSecure,
      },
      useSecureCookies: useSecure,
    },
    plugins: [
      magicLink({
        // 10-minute TTL — see ADR-007 + Day-9 morning decision.
        expiresIn: 60 * 10,
        // NOTE — Day-17 P0 #130 attempted `allowedAttempts: 3` to survive
        // Gmail's email-security scanner pre-fetch (which consumes the
        // single-use token before the real user click → ?error=
        // INVALID_TOKEN). After bumping to better-auth 1.6.11 (#130 →
        // #132), the runtime warning surfaced:
        //   "[better-auth/magic-link] `allowedAttempts` is ignored:
        //    tokens are consumed atomically on the first verification
        //    call (GHSA-hc7v-rggr-4hvx). Any value other than `1` has
        //    no effect; remove the option to silence this warning."
        // BetterAuth hardcoded single-use atomic consumption as part of
        // the GHSA-hc7v-rggr-4hvx security fix — concurrent verification
        // requests could otherwise mint multiple sessions from one
        // token. The intermediate-confirm-page pattern (FE renders
        // /verify-magic-link with a "Confirm Sign In" button that
        // POSTs the token only on real user click) is the canonical
        // prefetch-proof solution — see followup (bk) / PR #137. NOT
        // re-introducing allowedAttempts here.
        sendMagicLink: async ({ email: to, url, token }) => {
          // Day-17 intermediate-confirm-page pattern (followup (bk),
          // PR #137 + PR #139 URL-prefix fix).
          // BA emits its default `url` pointing at `<API_BASE>/auth/magic-
          // link/verify?token=...&callbackURL=...` — that's the URL a Gmail
          // scanner pre-fetch would consume. We discard it and build our
          // own FE-rooted URL preserving the same token + callbackURL.
          // The FE page at /verify-magic-link renders a "Confirm
          // Sign In" button; the token is only POSTed to BA's verify
          // endpoint on the real user's click — scanner prefetch is
          // harmless.
          //
          // NOTE — URL path is `/verify-magic-link` (NOT `/auth/verify-
          // magic-link`). The FE route lives at
          //   apps/web/src/app/(auth)/verify-magic-link/page.tsx
          // Per Next.js App Router docs, parenthesized segments are
          // route GROUPS — they organize files but DO NOT appear in
          // the URL path. So `(auth)` is stripped at routing time and
          // the page mounts at `/verify-magic-link`. PR #137 incorrectly
          // assumed the URL would include the `/auth/` segment, causing
          // a 404 on real Gmail clicks. PR #139 (this commit) drops
          // the `/auth/` prefix to match the FE convention. Ref:
          //   https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
          //
          // FRONTEND_BASE_URL soft-fallback to the production Cloudflare
          // Pages alias — matches PR #122 + #129 baseURL precedent.
          // Followup (be) tracks the proper Cloudflare env-var baking
          // fix.
          const frontendBaseUrl =
            process.env.FRONTEND_BASE_URL ?? 'https://qa-nexus-web.pages.dev';
          const cleanBase = frontendBaseUrl.replace(/\/$/, '');
          // Preserve callbackURL from BA's default url so user's intended
          // landing destination survives the redirect.
          let callbackURL = '/home';
          try {
            const cb = new URL(url).searchParams.get('callbackURL');
            if (cb) callbackURL = cb;
          } catch {
            // Default '/home' if BA's url is malformed (shouldn't happen).
          }
          const verifyUrl =
            `${cleanBase}/verify-magic-link` +
            `?token=${encodeURIComponent(token)}` +
            `&callbackURL=${encodeURIComponent(callbackURL)}`;
          // Use EmailService.sendMagicLink (ADR-018 Resend transport).
          // expiresAt is human-readable ("in 10 minutes") — used in body
          // copy, not for actual expiry validation (BetterAuth handles
          // that server-side via verification.expiresAt).
          await email.sendMagicLink({
            to,
            magicLinkUrl: verifyUrl,
            expiresAt: 'in 10 minutes',
          });
        },
      }),
      // P0-001 follow-up (2026-06-07): the FE reads BetterAuth's native
      // /auth/get-session, which returns the `auth_user` row (name/email/image)
      // — but role/displayName/organizationalLabel live on the SEPARATE TB-002
      // `users` table (auth_* tables are intentionally distinct — see header).
      // `additionalFields` can't help (those columns aren't on auth_user); this
      // customSession `after` hook joins TB-002 by email and merges the app
      // fields into the get-session response, so the FE renders the real role +
      // name with NO FE change + NO schema migration. One indexed findUnique
      // per session read — negligible at pilot scale. customSession runs BEFORE
      // nextCookies (which must stay last). See
      // docs/pilot-prep/2026-06-07-p0-001-cookie-cors-root-cause-be.md.
      customSession(async ({ user, session }) => {
        const appUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            role: true,
            displayName: true,
            organizationalLabel: true,
            workspaceId: true,
          },
        });
        return {
          session,
          user: {
            ...user,
            role: appUser?.role ?? null,
            displayName: appUser?.displayName ?? null,
            organizationalLabel: appUser?.organizationalLabel ?? null,
            appUserId: appUser?.id ?? null,
            workspaceId: appUser?.workspaceId ?? null,
          },
        };
      }),
      // CRITICAL: nextCookies() must be the LAST plugin per BetterAuth docs
      // — it wraps the response chain to push cookies through Next.js
      // Server Actions (App Router). Without it, sign-in cookies set on
      // the magic-link callback do NOT reach the browser when the FE is
      // a Next.js 15 App Router app. See BetterAuth issue #4038.
      nextCookies(),
    ],
  });
}
