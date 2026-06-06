# Pre-MVP Code + Functionality Review — Sat 2026-06-06

> **STATUS: PARTIAL — Bucket A (static) done; Buckets B–G deferred to a fresh
> session (27th reality-check: this session's context budget is exhausted-adjacent
> after M5 close + 4 days of pilot prep; a security audit you can't fully trust is
> worse than none). The runway below makes the fresh-session pickup fast.**

## PILOT MON JUN 8 GO/NO-GO: **AMBER — pending one verify (cross-site auth cookie)**

The day's P0/P1 are banked (email bridge LIVE, R2/NFR-001 green, NFR endpoints
deployed). The only thing standing between AMBER and GREEN is confirming the
cross-site session-cookie behavior below — likely fine, but unverified.

---

## 🔴 PRIORITY VERIFY (first thing, fresh session) — cross-site session cookie

`auth.config.ts` sets `advanced.defaultCookieAttributes.sameSite: 'lax'` (L132)

- `httpOnly: true` (L131) + `secure: useSecure` (L130) + `partitioned: useSecure`
  (L135), with `crossSubDomainCookies` enabled in prod (L128).

**Concern:** FE (`qa-nexus-web.pages.dev`) and API (`qa-nexus-api.onrender.com`)
are **cross-site** (different registrable domains). A `SameSite=Lax` cookie is
NOT sent on cross-site `fetch` subrequests → authenticated FE→API calls would
fail for all 8 users.

**Why likely fine (but UNVERIFIED):**

1. BetterAuth `crossSubDomainCookies.enabled` typically overrides `SameSite` to
   `None; Secure` (required for cross-site) — the deployed cookie may already be
   `None`, not `Lax`.
2. The FE may proxy `/api/*` same-origin (Next.js rewrite / Pages function), in
   which case `Lax` is correct and there's no cross-site issue.

**Verify (≤10 min):**

- Capture the real `Set-Cookie` header on a deployed sign-in (`SameSite=?`).
- Inspect FE API base URL: does it call `onrender.com` cross-origin, or a
  relative `/api/...` that's proxied same-origin? (grep `apps/web` for
  `NEXT_PUBLIC_API` / `rewrites`.)
- If `SameSite=Lax` AND cross-origin direct calls → **P0 Mon-blocker** (fix:
  force `SameSite=None; Secure` or add a same-origin proxy).

---

## Bucket A — Auth Flow E2E (static config) — **PASS** (1 verify item above)

Source: `apps/api/src/auth/auth.config.ts`.

| Check                        | Result                       | Evidence                                                                                                       |
| ---------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A1 token single-use (atomic) | ✅ PASS                      | BetterAuth hardcodes single-use atomic consumption (GHSA-hc7v-rggr-4hvx); `allowedAttempts` removed (L143-159) |
| A1 magic-link TTL 10 min     | ✅ PASS                      | `magicLink.expiresIn: 60 * 10` (L142)                                                                          |
| A1 replay protection         | ✅ PASS                      | atomic consume → used token can't re-auth                                                                      |
| A1 prefetch-proof            | ✅ PASS                      | intermediate confirm-page pattern defeats Gmail scanner pre-fetch (L155-159, PR #137)                          |
| A2 cookie HttpOnly           | ✅ PASS                      | `httpOnly: true` (L131)                                                                                        |
| A2 cookie Secure (prod)      | ✅ PASS                      | `secure: useSecure` (L130) + `useSecureCookies` (L137)                                                         |
| A2 cookie SameSite           | ⚠️ VERIFY                    | `'lax'` (L132) — see PRIORITY VERIFY above (cross-site)                                                        |
| A2 CHIPS partitioned         | ✅ PASS                      | `partitioned: useSecure` (L135)                                                                                |
| A4 trustedOrigins allowlist  | ✅ PASS (confirm contents)   | `trustedOrigins` = baseTrusted + env extras (L109/122); confirm only pages.dev + localhost                     |
| A1 token entropy ≥128b       | ✅ PASS (BetterAuth default) | magic-link tokens are crypto-random; IDs via `crypto.randomUUID()` (L127)                                      |
| emailAndPassword disabled    | ✅ PASS                      | `enabled: false` — magic-link only (L121)                                                                      |

**Runtime tests NOT yet run** (fresh session): empty-email→400, no-cookie
get-session→401, expired-link→error.

---

## Buckets B–G — NOT RUN (fresh-session continuation)

Run in a clean session, in this priority order (B+C are highest residual risk):

- **B — API security audit:** grep every `@Controller`/`@Post`/etc → confirm each
  is public-expected OR `@UseGuards(RolesGuard)`+`@Roles`; `/admin/*` all
  `@Roles(Role.Admin)`; rate-limiting (`@nestjs/throttler`?); secret-leak grep;
  CORS allowlist; Helmet/security headers (HSTS, X-Frame, nosniff).
- **C — DB integrity (read-only on pilot):** audit_log HMAC chain walk; pgvector
  HNSW `EXPLAIN ANALYZE` (index not Seq Scan); `vector_dims=384`; FK orphans;
  `prisma migrate diff` (no drift); row-count baseline for Mon.
- **D — LLM fallback chain:** Groq→Gemini order; error classification (429/5xx
  retry, 401/403 fail-fast); Retry-After; Apps Script provider 10s timeout +
  secret-sanitized errors (already verified in ADR-025 tests).
- **E — R2 storage:** re-run `smoke:r2` (PUT/GET/DELETE) — passed Day-3.
- **F — error handling + logging:** global exception filter (no stack-trace leak
  on 4xx); `/health` + `/health/deep` (verified live today); OTel redaction.
- **G — quota baseline:** Groq RPD; **Neon CU-hr (was 87/100 Wed — CRITICAL,
  check first)**; R2 size/ops; Resend; Apps Script `remaining` (was 1500); GH
  Actions; Render compute.

## Reality-checks logged tonight: 1 (27th — context-budget honesty before a security audit)

## Discipline: 0 fabricated checks · 0 pilot writes · $0 gate intact
