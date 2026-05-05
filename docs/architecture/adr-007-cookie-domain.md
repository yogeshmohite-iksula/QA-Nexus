# ADR-007: Cookie domain — wildcard parent over exact-domain for cross-subdomain BetterAuth sessions

- **Status:** Accepted
- **Date:** 2026-05-05
- **Deciders:** Yogesh Mohite (Admin), BE chat
- **Related:** MS0-T021 (BetterAuth magic-link wiring) · ADR-008 (email transport — Gmail SMTP) · `apps/api/src/auth/auth.config.ts` · `apps/web` runtime cookie consumer · BetterAuth issue #4038 (Next.js App Router cookie writes via `nextCookies()` plugin) · BetterAuth magic-link plugin docs (https://better-auth.com/docs/plugins/magic-link)
- **Supersedes:** none
- **Superseded by:** none

---

## Context

PM1 deploys two domains under one parent zone:

- **`app.qanexus.iksula.com`** — Cloudflare Pages (Next.js 15 App Router static export of `apps/web`).
- **`api.qanexus.iksula.com`** — Render Free dyno (NestJS 10 service from `apps/api`).

The pilot UX requires: a user clicks the magic-link in Gmail, lands on the API
callback (`api.qanexus.iksula.com/auth/callback`), gets a session cookie set,
then navigates to `app.qanexus.iksula.com/...` and is recognized as
authenticated. **The browser must send the same session cookie to BOTH
subdomains.**

BetterAuth's session-cookie management offers two mutually-exclusive strategies:

### Strategy A — exact-domain cookies (BetterAuth default)

Cookie `Domain=api.qanexus.iksula.com` set by the API. Sent ONLY to
requests targeting `api.qanexus.iksula.com`. The frontend at
`app.qanexus.iksula.com` would NOT see the cookie at all.

To make the FE work under this model, every browser-to-API call from
`app.qanexus.iksula.com` would need:

- `credentials: 'include'` on every `fetch()` (or TanStack Query default override).
- Server-side CORS responses with `Access-Control-Allow-Credentials: true` + `Access-Control-Allow-Origin: https://app.qanexus.iksula.com` (NOT a wildcard — credentialed requests reject `*`).
- Strict CORS preflight handling on every state-changing endpoint.

The cookie still wouldn't be visible to FE-side route guards (Next.js
middleware) without an additional API round-trip to validate the session.

### Strategy B — wildcard parent-domain cookies (what we chose)

Cookie `Domain=.qanexus.iksula.com` set by the API. **The leading dot
makes the browser send it to `*.qanexus.iksula.com`** — both
`api.` and `app.` see the same session cookie. Next.js middleware on
`app.qanexus.iksula.com` can read the cookie directly and short-circuit
unauthenticated requests at the edge without an API hop.

BetterAuth supports this via the `advanced.crossSubDomainCookies` config
introduced in v1.2:

```ts
advanced: {
  crossSubDomainCookies: { enabled: true, domain: '.qanexus.iksula.com' },
}
```

### Browser constraints (post-2023 third-party-cookie phase-out)

Chrome 118+ (Sept 2023) restricts cross-site cookies via the **CHIPS**
("Cookies Having Independent Partitioned State") spec. To keep wildcard
parent-domain cookies working under CHIPS, the cookie MUST carry the
`Partitioned` attribute. BetterAuth surfaces this as
`defaultCookieAttributes.partitioned: true` in the same `advanced` block.

`SameSite=Lax` (NOT `Strict`) is required for the magic-link callback flow:
the user clicks an email link → browser navigates to
`api.qanexus.iksula.com/auth/callback` from a Gmail referer →
`SameSite=Strict` would block the cookie set on that response.

## Decision

Use **Strategy B (wildcard parent-domain cookies)** with the following
exact `auth.config.ts` advanced block:

```ts
advanced: {
  crossSubDomainCookies: {
    enabled: true,
    domain: '.qanexus.iksula.com',
  },
  defaultCookieAttributes: {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    partitioned: true,
  },
  useSecureCookies: true,
},
trustedOrigins: [
  'https://app.qanexus.iksula.com',
  'https://api.qanexus.iksula.com',
],
```

Plus the **`nextCookies()` plugin** from `better-auth/next-js` (CRITICAL
for Next.js 15 App Router — without it, auth functions invoked from
Server Actions silently fail to set cookies; see BetterAuth issue #4038).

The companion magic-link config sets **`expiresIn: 60 * 10`** (10 minutes)
matching FE copy in F06 Sign In and industry-standard windows for
unauthenticated callbacks. Corporate Gmail latency (~5s observed at
Iksula) leaves comfortable margin within the 10-minute window.

## Consequences

### Positive

- **Single sign-on across `app.` and `api.` subdomains** with zero
  per-fetch `credentials: 'include'` boilerplate on the FE.
- **Next.js middleware can read the session cookie directly** — auth
  redirects happen at the edge, no API round-trip.
- **CHIPS-compliant** via `Partitioned: true` — works in Chrome 118+,
  Firefox 116+, Safari 17+ without third-party-cookie warnings.
- **Magic-link flow is robust to email-referer SameSite restrictions**
  (`Lax` allows the cross-site GET that lands on `/auth/callback`).
- **`nextCookies()` plugin closes the App-Router cookie-set silent-fail
  gap** that bit dozens of projects per BetterAuth issue tracker.
- **`useSecureCookies: true` + `secure: true`** double-pinned so the
  cookie is HTTPS-only — the Render free tier auto-enforces HTTPS, and
  Cloudflare Pages does too, so there's no plaintext path.
- **`httpOnly: true`** prevents JavaScript access to the session token,
  closing XSS-token-theft vectors.

### Negative

- **Couples session cookies to the `qanexus.iksula.com` zone.** Any
  future deployment to a different parent (e.g. `qa.iksula.com` for a
  larger pilot) requires an env-var swap on `crossSubDomainCookies.domain`
  - a new ADR. Tracked in followup `(aa)` (next slot).
- **CHIPS partitioning means the cookie storage is keyed by top-level
  site.** A user signing in from `iksula.atlassian.net`-embedded iframes
  (e.g. a Jira app) would NOT share the session cookie with
  `app.qanexus.iksula.com`. PM1 doesn't ship embedded surfaces, so this
  is non-binding today; revisit if PM2 ships a Jira embed.
- **Local dev requires `BETTER_AUTH_URL=http://localhost:3001`** + a
  conditional in `auth.config.ts` to disable the wildcard domain on
  localhost (`localhost` cookies don't accept a `Domain` attribute with
  a leading dot per RFC 6265). The `useSecureCookies` flag also flips
  off in dev so cookies work over plain HTTP.
- **Wildcard parent-domain cookies are visible to ALL subdomains** under
  `qanexus.iksula.com`. If we ever stand up a third subdomain (e.g.
  `metrics.qanexus.iksula.com` for Grafana), it WILL see the session
  cookie. Mitigation: only use that zone for first-party, audited
  services. Documented in `docs/SECURITY.md` under "Cookie domain
  trust boundary".

### Mitigation plan

1. **Pin BetterAuth to `~1.2.0`** (current; magic-link plugin signature
   stable). Major-version upgrade requires manual review of
   `crossSubDomainCookies` API + the `nextCookies()` plugin shape.
2. **Test the cross-subdomain flow in CI** (T021's test suite — cookie
   attributes verified via response header inspection + a
   second-subdomain request that confirms the cookie is sent).
3. **Document the trust boundary in `docs/SECURITY.md`** — every
   subdomain under `qanexus.iksula.com` is in the session-cookie trust
   zone.
4. **Track in `docs/followups.md`** under entry `(aa)` (next available
   slot when filed): "Parent-zone migration plan if pilot expands
   beyond `qanexus.iksula.com`".

## Alternatives considered

### A. Exact-domain cookies + per-fetch `credentials: 'include'`

- **Pros:** Smallest cookie blast radius (only `api.` sees it); no
  parent-zone coupling.
- **Cons:** FE must opt-in `credentials` on EVERY browser-to-API call;
  Next.js middleware cannot read the session cookie (must round-trip
  to API to validate); CORS preflight latency added to every
  state-changing call; high boilerplate burden across the FE codebase.
- **Verdict:** Rejected — operational complexity outweighs the
  marginal trust-boundary benefit at PM1 pilot scale (8 internal users,
  one parent zone).

### B. JWT in `Authorization` header (no cookie at all)

- **Pros:** Stateless, fully cross-origin-friendly, no Domain
  attribute concerns.
- **Cons:** BetterAuth's session model is cookie-first; bolting JWT
  on top would require a custom plugin or fork. Magic-link flow
  fundamentally needs a server-set cookie at the callback step
  (browser navigation, no JS to capture a JWT response). XSS-token-theft
  vector reopens (JS can read `localStorage` JWTs).
- **Verdict:** Rejected — incompatible with BetterAuth's design + adds
  XSS attack surface.

### C. Separate session per subdomain

- **Pros:** Full isolation; Strategy A's exact-domain default applied
  twice.
- **Cons:** User would need to sign in TWICE (once for `app.`, once for
  `api.`). UX rejection by Yogesh in Day-9 morning brief.
- **Verdict:** Rejected on UX grounds.

### D. CDN-edge worker that proxies API requests through `app.`

- **Pros:** Same-origin everything; no cross-domain cookie problem.
- **Cons:** Adds a Cloudflare Worker hop on every API call (free tier
  100k req/day — PM1 estimated 5k/day so within budget, but adds
  operational complexity); breaks direct `api.qanexus.iksula.com`
  access for ops/debug; conflicts with the future R2 presigned-URL
  pattern (ADR-005) which assumes direct browser → R2 paths.
- **Verdict:** Deferred to PM2 if cookie-domain strategy needs to
  change.

## Cross-references

- `apps/api/src/auth/auth.config.ts` — implementation site (T021 PR
  will add `crossSubDomainCookies` + `defaultCookieAttributes` +
  `nextCookies()` plugin)
- `apps/web/middleware.ts` — Next.js edge cookie reader (T021's FE-side
  consumer; reads `better-auth.session_token` from
  `*.qanexus.iksula.com` zone)
- `docs/architecture/adr-008-email-service-gmail-smtp.md` — sister ADR
  for the magic-link email transport
- `docs/SECURITY.md` — cookie domain trust boundary (will be amended
  in the T021 PR)
- BetterAuth issue #4038 — Next.js App Router `nextCookies()` plugin
  requirement
- BetterAuth magic-link plugin docs — https://better-auth.com/docs/plugins/magic-link
- CHIPS spec — https://developer.chrome.com/docs/privacy-security/chips
