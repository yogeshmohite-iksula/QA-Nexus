# Lessons Learned — M1 Close Day (2026-05-05)

> **Context:** Day 9+10 of Sprint 42. M1 — Users, Roles, Auth & Audit —
> closed today with 47 PRs, 358 tests, 21/41 frames ported, RBAC sweep
> 54/54. These 7 lessons are extracted from the hardest moments of the
> sprint for permanent record and mitigation in M2.

---

## 1. CHANGELOG cascade pattern

**Observation:** PR #42 hit merge conflicts 3 times in succession because
every `docs/CHANGELOG.md`-touching PR that merged invalidated all in-flight
PRs that also touched `CHANGELOG.md`. In one batch (PRs #39–#44 landing
the same morning), MAIN had to rebase and force-push 4 branches in sequence
before the cascade settled. The rebase process itself triggered a stuck
`git rebase --continue` state (all conflicts resolved, but git refused to
proceed) that required a manual workaround (`git commit -F
.git/rebase-merge/message` followed by `find .git/rebase-merge -type f
-delete && rmdir .git/rebase-merge`).

**Root cause:** Single linear `CHANGELOG.md` with one `[Unreleased]` section
creates a hot lock-contention point during any batch of parallel PRs. Every
PR that touches the file changes the same lines near the top, producing
guaranteed conflicts for all peers.

**Future mitigation (M2):**

- File a followup for changelog-fragment approach: each PR writes a small
  file to `docs/changelog-fragments/<PR#>-<type>.md` instead of editing
  `CHANGELOG.md` directly. A merge-time script (`scripts/squash-changelog.ts`)
  concatenates fragments into the `[Unreleased]` section when a PR merges
  to main. Eliminates all cascade conflicts — fragments never collide.
- Intermediate stop-gap: split `[Unreleased]` into `### BE`, `### FE`,
  `### Docs` subsections so BE and FE PRs edit different lines (~80% conflict
  reduction).
- Tag: `[m1-followup]` `changelog-fragment-approach`

---

## 2. pnpm 10 + `better-auth` subpath exports require explicit hoist

**Observation:** After adding `better-auth` to `apps/web`, `tsc --noEmit`
threw `Cannot find module 'better-auth/react'` and `Cannot find module
'better-auth/client/plugins'` even though the package was installed. The
`.npmrc` fix (`public-hoist-pattern[]=better-auth`) was added to the repo
but `pnpm install` was never re-run, so the hoist never took effect. The
error persisted and blocked the pre-push typecheck gate on PR #48, requiring
a manual `CI=true pnpm install --frozen-lockfile` to apply the hoist.

**Root cause:** pnpm 10's strict isolation deduplicated `better-auth` into
`node_modules/.pnpm/better-auth@1.2.12/` (the virtual store), not the
workspace root `node_modules/`. TypeScript's module resolver walks standard
`node_modules/` paths and does NOT traverse `.pnpm/` internals for subpath
exports (e.g., `better-auth/react`, `better-auth/client/plugins`). The
`public-hoist-pattern` directive in `.npmrc` causes pnpm to symlink the
package to the workspace root `node_modules/`, making it visible to `tsc`.

**Future mitigation (M2):**

- After any `.npmrc` change, immediately run `CI=true pnpm install
--frozen-lockfile` and commit the result as a separate chore commit
  before other PRs pile up.
- Add a pre-push check: `ls node_modules/better-auth` — fail fast if not
  present. Alert: "Run `CI=true pnpm install --frozen-lockfile`."
- Document in `docs/architecture/pnpm-hoisting-guide.md` for new packages
  that use subpath exports (Zod, BetterAuth, Radix UI all need this).
- Tag: `[m1-followup]` `pnpm-hoist-verification`

---

## 3. BetterAuth `signIn.magicLink()` returns `{ data, error }` — does NOT throw

**Observation:** Early implementations of the magic-link sign-in form wrapped
`authClient.signIn.magicLink()` in a `try/catch` block. This pattern
silently ate API errors (e.g., rate-limit exceeded, invalid email domain,
server unreachable) — the `catch` block never fired. The sign-in form
appeared to submit successfully but no email was sent and no visual feedback
was shown to the user.

**Root cause:** BetterAuth's client SDK follows a Result pattern (similar to
Rust's `Result<T, E>` or Go's multi-return). `signIn.magicLink()` returns
`Promise<{ data: MagicLinkResult | null; error: BetterAuthClientError | null }>`.
It never rejects the promise. A bare `try/catch` wrapping an async call that
never throws is a no-op for error handling.

**Future mitigation (M2+):**

- **Canonical pattern** for all BetterAuth client calls:
  ```ts
  const { data, error } = await authClient.signIn.magicLink({
    email,
    callbackURL,
  });
  if (error) {
    // branch on error.code: 'USER_NOT_FOUND' | 'RATE_LIMIT_EXCEEDED' | ...
    setErrorState(error.message ?? 'Unknown error');
    return;
  }
  // success path
  ```
- Add an ESLint rule or comment in `lib/auth/client.ts` at the point of
  `createAuthClient(...)`: `// NOTE: BetterAuth calls return { data, error } —
never throw. Always destructure and branch on error.`
- Tag: `[m1-followup]` `betterauth-result-pattern`

---

## 4. BetterAuth `errorCallbackURL` is a plugin config, NOT a client `signIn` param

**Observation:** TypeScript threw `TS2561: Object literal may only specify
known properties, and 'errorCallbackURL' does not exist in type
'MagicLinkSignInOptions'` when passing `errorCallbackURL` to
`authClient.signIn.magicLink({ ..., errorCallbackURL: '/sign-in?error=expired' })`.
This was a distraction during the Pattern A→B flip PR (#46) and cost ~20 min.

**Root cause:** `errorCallbackURL` is a **server-side** configuration option
set inside `magicLink({ errorCallbackURL: '...' })` in the BetterAuth server
plugin declaration (in `auth.config.ts`). On the client side, `signIn.magicLink()`
only accepts `{ email, callbackURL, fetchOptions? }`. The confusingly similar
naming (`errorCallbackURL` vs `callbackURL`) made it look like a parallel
client option.

**Future mitigation (M2+):**

- When integrating a new BetterAuth plugin, read the server plugin docs AND
  the client plugin docs separately — they are intentionally asymmetric.
- Add a comment in `apps/api/src/auth/auth.config.ts` next to the
  `magicLink({ errorCallbackURL })` declaration:
  ```ts
  // errorCallbackURL is SERVER-SIDE ONLY — not available on the client
  // signIn.magicLink() call. Client receives only { callbackURL }.
  ```
- Tag: `[m1-followup]` `betterauth-api-surface-asymmetry`

---

## 5. F27 `/admin/users` 404 was a FE URL bug, not a BE wiring bug

**Observation:** The M1 close visual sweep filed followup (ab) as "GET
`/api/users` → 404" with root-cause hypothesis 1 being "UsersController
not wired into AppModule." After investigation, the BE wiring was perfectly
correct (`UsersController` in `UsersModule.controllers[]`, `UsersModule` in
`AppModule.imports[]`). The actual root cause was `apps/web/lib/api/users-api.ts`
calling `fetch('/api/users', ...)` with a **relative URL**, which in local
dev routed to the Next.js dev server (port 3000) instead of the NestJS backend
(port 3001). Since Next.js `output: 'export'` disallows `rewrites`, there
was no proxy to forward the call to the backend.

**Root cause:** The fetcher was written as if the FE and BE shared an origin
(or as if Next.js would proxy `/api/*` via rewrites), which is true for
Next.js-with-server deployments but not for `output: 'export'` static sites.
The correct pattern — already used in `lib/auth/client.ts` — is to prefix
with `NEXT_PUBLIC_API_BASE_URL`.

**Future mitigation (M2):**

- **Rule:** any `fetch()` call in `apps/web/lib/api/` that hits the NestJS
  backend MUST use `${process.env.NEXT_PUBLIC_API_BASE_URL}/…` prefix.
  Relative URLs are only valid for Next.js API routes (deprecated for PM1).
- Add an ESLint custom rule or comment in the lib/api directory header:
  ```ts
  // ALL fetchers in this directory MUST use API_BASE prefix.
  // See lib/auth/client.ts for the canonical pattern.
  // Relative /api/* URLs hit Next.js dev server, NOT NestJS.
  ```
- When filing a "404" followup, always check both FE URL construction AND BE
  route registration before assuming BE is at fault.
- Tag: `[m1-followup]` `fe-absolute-url-discipline`

---

## 6. Pre-handoff CI verification discipline catches real bugs before MAIN

**Observation:** In the FE+1 chat session, the agent caught two bugs
before declaring a PR "done" and signaling MAIN for merge:

1. A missing Suspense boundary around `useSearchParams()` (Next.js 15 +
   `output: 'export'` requires `Suspense` wrapping for any hook that reads
   search params at build time — otherwise the static export build fails).
2. A wrong package name `@better-auth/react` (does not exist) vs the correct
   `better-auth/react` subpath export.

Both would have caused CI failures and rebases if they reached MAIN's
auto-cascade queue.

**Root cause:** The FE+1 agent was diligent about running `pnpm typecheck +
pnpm build` locally before declaring done, even when linting passed.
Typecheck catches import errors. Build catches Next.js static-export
incompatibilities that only surface at bundle time (Suspense boundaries,
`useSearchParams` dynamic rendering).

**Future mitigation (M2):**

- **Mandatory pre-handoff gate for FE+1:** run `pnpm --filter @qa-nexus/web
build` (full static export build) in addition to typecheck + lint. The full
  build catches Suspense, dynamic import, and `output: 'export'` violations
  that `tsc --noEmit` misses.
- Add to the M2 FE+1 session kickoff: "Always run full build before raising
  PR ready signal to MAIN."
- Document in CLAUDE.md rule addendum: "FE+1 must run `pnpm build` (not just
  typecheck) before signaling MAIN."
- Tag: `[m1-followup]` `fe-build-gate-discipline`

---

## 7. Sonnet vs Opus task-routing for MAIN

**Observation:** MAIN ran on Sonnet for the bulk of the Day-9 cascade (PRs
#39–#47) and all of the Day-10 M1 close ceremony (Tasks 1–7). Sonnet handled
the mechanical work cleanly: rebase chains, CHANGELOG updates, ceremony
scripts (RBAC sweep, audit verify), report template fills, tag pushes, PR
descriptions. Speed was noticeably higher than Opus for these tasks. However,
Sonnet showed hesitation on the one judgment-heavy item in the session:
identifying that the actual root cause of the F27 404 was the FE URL, not
the BE wiring. A second read of the followup description was needed before
the correct diagnosis clicked.

**Root cause:** Sonnet is optimized for instruction-following and is
excellent at multi-step procedural tasks (rebase, fill-template, run-test,
commit, push). It is somewhat slower on adversarial root-cause analysis where
the given hypothesis (BE wiring) is wrong and the actual fix requires
independently reversing the assumption.

**Future mitigation (M2):**

- **Routing heuristic:**
  - Opus → ADR decisions, architecture trade-off analysis, debug root-cause
    hunts where the problem statement itself may be wrong, new-feature design.
  - Sonnet → ceremony scripts, rebase cascades, template fills, CHANGELOG
    updates, PR descriptions, EOD reports, routine commit/push sequences.
- When MAIN is on Sonnet and receives a followup with a strong hypothesis
  ("root cause is X"), explicitly verify the hypothesis before acting: read
  the referenced files, confirm or refute, then act. Don't optimise toward
  the given hypothesis as ground truth.
- Consider a CLAUDE.md addition: "If the task is a judgment call (ADR,
  architectural decision, root-cause investigation), prefer Opus. If the task
  is procedural (ceremony, rebase, report), Sonnet is cost-efficient."
- Tag: `[m1-followup]` `model-routing-heuristic`

---

## Cross-references

- `docs/milestones/m1-close-report.md` — §9 Notable Misses (higher-altitude view)
- `docs/followups.md` — items (ab), (ac), (z), (aa) referenced above
- `docs/eod-reports/2026-05-05-day-9-and-10-combined.md` — session context
- `docs/CHANGELOG.md` — cascade conflicts visible in rebases of PRs #39–#44
- `apps/web/lib/api/users-api.ts` — lesson 5 fix (PR #48)
- `apps/web/lib/auth/client.ts` — canonical `NEXT_PUBLIC_API_BASE_URL` pattern

---

_Captured by MAIN session (Claude Code) · M1 close ceremony · 2026-05-05_
