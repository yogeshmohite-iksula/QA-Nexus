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
import { magicLink } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import type { PrismaClient } from '@prisma/client';
import type { EmailService } from '../email/email.service';

export type AuthInstance = ReturnType<typeof buildAuth>;

/** Cookie-domain config: production zone (`.qanexus.iksula.com`) vs dev
 *  (no Domain attribute, no Secure). Driven by `BETTER_AUTH_URL` —
 *  if it starts with `https://`, treat as prod-style; else dev. */
function resolveCookieDomain(baseUrl: string): {
  crossSubDomain: { enabled: boolean; domain?: string };
  useSecure: boolean;
} {
  const isHttps = baseUrl.startsWith('https://');
  if (!isHttps) {
    // Local dev — no wildcard domain, no secure flag.
    return { crossSubDomain: { enabled: false }, useSecure: false };
  }
  // Prod / staging — wildcard parent + secure cookies.
  // Derived from BETTER_AUTH_URL host, falling back to the canonical zone.
  let domain = '.qanexus.iksula.com';
  try {
    const host = new URL(baseUrl).hostname;
    // If we're on `api.qanexus.iksula.com`, parent is `.qanexus.iksula.com`.
    // For a future zone swap, env var BETTER_AUTH_COOKIE_DOMAIN can override.
    if (process.env.BETTER_AUTH_COOKIE_DOMAIN) {
      domain = process.env.BETTER_AUTH_COOKIE_DOMAIN;
    } else if (host.endsWith('.qanexus.iksula.com')) {
      domain = '.qanexus.iksula.com';
    }
  } catch {
    // Malformed URL — fall through to default zone.
  }
  return {
    crossSubDomain: { enabled: true, domain },
    useSecure: true,
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
  const { crossSubDomain, useSecure } = resolveCookieDomain(baseUrl);

  // Trusted origins for CORS + CSRF — both subdomains under the parent zone.
  // Local dev gets localhost too so Next.js dev server can call the API.
  const trustedOrigins = useSecure
    ? ['https://app.qanexus.iksula.com', 'https://api.qanexus.iksula.com']
    : ['http://localhost:3000', 'http://localhost:3001'];

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
        sameSite: 'lax',
        // CHIPS partitioning — required for wildcard parent-domain cookies
        // in Chrome 118+. No effect on browsers that don't support it.
        partitioned: useSecure, // partitioned only meaningful with Secure
      },
      useSecureCookies: useSecure,
    },
    plugins: [
      magicLink({
        // 10-minute TTL — see ADR-007 + Day-9 morning decision.
        expiresIn: 60 * 10,
        sendMagicLink: async ({ email: to, url }) => {
          // Use EmailService.sendMagicLink (Day-8 ADR-008 transport).
          // expiresAt is human-readable ("in 10 minutes") — used in body
          // copy, not for actual expiry validation (BetterAuth handles
          // that server-side via verification.expiresAt).
          await email.sendMagicLink({
            to,
            magicLinkUrl: url,
            expiresAt: 'in 10 minutes',
          });
        },
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
