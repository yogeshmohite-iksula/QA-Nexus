# P0-001 Pattern-B Wire — Execution Prep (Sun 2026-06-07, standby)

**Gated on:** BE+1 `feat/api-p0-001-cross-site-cookie-fix` merged + Render deployed.
**Goal:** identity comes from the real BetterAuth session, not the hardcoded persona.

---

## Verified facts (NOT the brief's P.4/P.5 — those are inaccurate, like the API paths were)

| Brief claimed                                              | Reality (verified)                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `import { useSession } from '@better-auth/react'`          | `authClient.useSession()` — method on the client (`lib/auth/client.ts`), already used in `sign-in/page.tsx`   |
| `GET /auth/session` → `{ authenticated, user, expiresAt }` | BetterAuth `useSession()` → `{ data: { user, session } \| null, isPending, error }`; `data.user` is the shape |
| catalog §5                                                 | **No §5 exists** — catalog is §1-4 + auth preamble only                                                       |

- `authClient`: `basePath: '/auth'`, `baseURL` = onrender API. Hits `…/auth/get-session`.
- **BetterAuth `data.user` carries app fields** (BE `auth.service.ts:31-43` additionalFields): `id, email, displayName, role (UserRole), organizationalLabel`. → shell can render name + role + Admin badge straight from the session. **No separate `/api/users/:id` fetch needed.** ✅

---

## Persona overrides to remove (13 routes; 2 harmful)

Harmful (non-yogesh): `home/page.tsx:42` (kishor), `home/lead-admin/page.tsx:40` (akshay).
Other 11 → yogesh (cosmetically fine but still Pattern-A): projects, projects/[slug]/{imports,upload}, admin/{settings, settings/providers, agents, agents/provider-setup, agents/model-assignment, users, users/invite}, home/empty.

No `RoleSwitcher`/`forcedUserId` consumers (only the dev-only `useSetCurrentUser` in the context).

---

## Design decision — dev/CI fallback vs prod redirect (IMPORTANT)

Naive "no session → redirect to /sign-in" **breaks dev + the 12 e2e smoke tests** (no session in dev/CI → every page redirects → tests fail, dev can't preview). So:

`CurrentUserProvider` (session-driven, with dev fallback):

1. `const s = authClient.useSession()`.
2. `isPending` → keep a skeleton/last-known (don't flash).
3. `s.data?.user` → map → provide (PROD happy path).
4. resolved `null`:
   - **prod** (`process.env.NODE_ENV === 'production'`) → unauthenticated; let `AdminGuard` redirect to `/sign-in` (verify AdminGuard already does this when wiring).
   - **dev/CI** → fall back to a seed persona (Yogesh, Admin) so preview + smoke still render.

`initialUserId` prop is retained ONLY as the dev/CI fallback seed (default Yogesh) — the harmful kishor/akshay values get removed so dev fallback is consistent. In prod the prop is ignored (session wins).

Adapter: BetterAuth user → app `UserPublic` is near-1:1 (fields already match). Map `name`↔`displayName` if BetterAuth also returns core `name`.

---

## Execution plan (when BE+1 lands)

1. Branch `feat/web-p0-001-pattern-b-session-wire` off origin/main (post BE merge).
2. `lib/auth/use-current-user.ts` — wrap `authClient.useSession()` → `{ user, isLoading, isAuthenticated }`.
3. `CurrentUserContext` — session-first + dev-fallback (above). Remove kishor/akshay; keep yogesh as dev seed.
4. `fetch-with-fallback.ts` already sends `credentials: 'include'` ✅ (verify other direct fetches).
5. Shell `UserMenu` + rail-foot — skeleton while `isLoading`.
6. Verify: dev sign-in (post BE fix) → `data.user.displayName === 'Yogesh Mohite'` → pill "Yogesh M. · ADMIN"; smoke 12/12 still green (dev fallback, no redirect).
7. Stopgap branch ready (kishor→yogesh 1-liner) if the proper wire doesn't verify by 21:00.

**Cross-origin gating:** none of this shows a real per-user identity until BE+1's cookie fix makes `…/auth/get-session` return the user cross-site from pages.dev. That's the prerequisite — verify it live before claiming P0-001 closed.
