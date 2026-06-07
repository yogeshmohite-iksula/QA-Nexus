# P0-001 root cause — cross-site cookie + CORS (BE) · 2026-06-07

**Symptom (Yogesh, fresh incognito):** magic-link sign-in succeeds (200), but `/home`
shows hardcoded "Kishor K. · QA ENGINEER"; **zero** cookies on `qa-nexus-web.pages.dev`;
**zero** calls to a session endpoint.

**Verdict: NOT stale-deploy. Three real backend bugs**, all from ONE mismatch — the auth
config targets a **shared-parent-domain** deployment (`*.qanexus.iksula.com`) that doesn't
exist yet, but the live pilot is **cross-site**: FE `qa-nexus-web.pages.dev` + API
`qa-nexus-api.onrender.com` are **different registrable domains**.

---

## Bug 1 (PRIMARY) — cookie `Domain=.qanexus.iksula.com` → browser rejects it

`apps/api/src/auth/auth.config.ts` `resolveCookieDomain()` (L35-63): `domain` defaults to
`'.qanexus.iksula.com'` and is **never reset** when the host isn't under that zone — the
`else if (host.endsWith('.qanexus.iksula.com'))` is false for `qa-nexus-api.onrender.com`,
so the default stands. Result: `crossSubDomainCookies = { enabled: true, domain: '.qanexus.iksula.com' }`
→ Set-Cookie carries `Domain=.qanexus.iksula.com`. Per RFC 6265 the browser **rejects** a
cookie whose `Domain` doesn't match the response origin (`onrender.com`) → **cookie never
stored** → no session → FE shows its hardcoded fallback identity. **This is the headline cause.**

> Diagnostic for Yogesh: open DevTools while viewing **`https://qa-nexus-api.onrender.com`**
> (Application → Cookies). If there's no cookie even there, Domain-reject is confirmed.
> Also confirm `BETTER_AUTH_COOKIE_DOMAIN` is unset/wrong in Render env.

## Bug 2 — cookie `SameSite=Lax` → not sent cross-site even if stored

`auth.config.ts` L132 `sameSite: 'lax'`. `pages.dev → onrender.com` is a cross-site request;
a `Lax` cookie is **not** attached to cross-site `fetch`. Needs `SameSite=None; Secure`
(+ `Partitioned` for Chrome CHIPS). Secondary blocker — bites the moment Bug 1 is fixed.

## Bug 3 — no CORS on `/api/*` → Option-B fetches blocked

`apps/api/src/main.ts`: explicit Express CORS is installed **only** for `/auth/*` (L104-126,
origin allowlist already includes `qa-nexus-web.pages.dev` ✅, `credentials:true` ✅). The
`/api/*` surface (projects/users/audit/llm) has **no CORS** → cross-origin browser calls from
pages.dev are blocked (no `Access-Control-Allow-Origin`). Blocks Option B even after auth works.

---

## The 3 asks, answered

### Ask 1 — session/identity endpoint: `GET /auth/session` (NOT `/api/auth/get-session`)

- `apps/api/src/auth/auth.controller.ts:193` `@Controller('auth')` → full path **`/auth/session`**.
  No `/api` prefix (no `setGlobalPrefix`; API controllers hardcode `api/` in their path, auth doesn't).
- Auth: cookie-based; returns `{ authenticated:false }` when no valid session (no 401).
- **Response (authenticated):**
  ```json
  {
    "authenticated": true,
    "user": {
      "id": "<uuid>",
      "workspaceId": "26d25198-…",
      "email": "yogesh.mohite@iksula.com",
      "displayName": "Yogesh Mohite",
      "role": "Admin",
      "organizationalLabel": "Sr QA",
      "activatedAt": "…",
      "lastLoginAt": "…",
      "createdAt": "…"
    },
    "authUserId": "<uuid>",
    "expiresAt": "2026-06-14T…Z"
  }
  ```
- **Response (anon):** `{ "authenticated": false }`.
- Identity fields the FE wants: `user.displayName` + `user.role` (our TB-002 names — **not** `name`).
  `user` = `session.appUser` (the app User), **not** BetterAuth's raw `/auth/get-session` authUser
  (that one has only id/email/name/image, no role).

### Ask 2 — Set-Cookie attributes (current prod, `BETTER_AUTH_URL=https://…onrender.com`)

| attr          | current value                | correct for cross-site |
| ------------- | ---------------------------- | ---------------------- |
| `Secure`      | `true` ✅                    | true                   |
| `HttpOnly`    | `true` ✅                    | true                   |
| `SameSite`    | **`Lax`** ❌                 | **`None`**             |
| `Partitioned` | `true` ✅                    | true                   |
| `Domain`      | **`.qanexus.iksula.com`** ❌ | **(omit — host-only)** |
| `Path`        | `/` ✅                       | /                      |

### Ask 3 — CORS

- `/auth/*`: ✅ correct — origin allowlist (incl. pages.dev + preview-hash regex), `credentials:true`,
  `allowedHeaders:['Content-Type','Cookie','Authorization']`, methods GET/POST/OPTIONS/PATCH/PUT/DELETE.
- `/api/*`: ❌ **missing entirely.** Must add the same CORS (credentials + origin allowlist).

---

## Proposed fix (Option A — make the cross-site pilot work · ~20 lines BE · needs Yogesh GO)

**A1 — `auth.config.ts` `resolveCookieDomain()`:** when the host is NOT under `.qanexus.iksula.com`
(i.e. onrender.com), return `crossSubDomain: { enabled: false }` (host-only cookie, no Domain) and a
new `crossSite: true` flag. Then in `defaultCookieAttributes`: `sameSite: crossSite ? 'none' : 'lax'`
(keep `secure:true`, `partitioned:true`).

**A2 — `main.ts`:** reuse `isAuthCorsOriginAllowed` + the same `cors({...credentials:true})` for the
`/api` surface — `expressApp.use('/api/*', cors({ origin: <same fn>, credentials:true, … }))`,
installed before the body parsers.

**A3 — FE+1 (necessary, not sufficient):** every `fetch` to the API uses `credentials:'include'`,
and identity comes from `GET /auth/session` (`user.displayName`/`user.role`), removing the hardcoded
"Kishor K." fallback.

**Security note:** `SameSite=None` widens cross-site cookie sending — mitigated by BetterAuth's
`trustedOrigins` CSRF list (pages.dev is in it) + `Partitioned` (CHIPS). Acceptable for the pilot.

**Alternatives (post-pilot hardening, NOT by Mon):** Option B — same-origin via a Next proxy/rewrite
(needs a running Next server, not static Pages export). Option C — put FE+API under
`*.qanexus.iksula.com` custom domains (the config's intended design; `SameSite=Lax` + crossSubDomain
then work as-is). Recommend A for Mon, C as the proper fix later.

**Deploy:** A1+A2 require an API redeploy on Render. No DB/migration impact. No `.env` change needed
unless `BETTER_AUTH_COOKIE_DOMAIN` is currently set (must be unset/empty).
