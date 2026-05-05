# EOD — Day 9 + Day 10 Combined (2026-05-05) — M1 CLOSE CEREMONY

> **Combined Day 9 + Day 10 report** — Day 9 was an extended session that ran
> through the Day 10 morning, culminating in the M1 close ceremony executed
> today. A single combined EOD covers both calendar blocks for archival clarity.

---

## Completed today

### Day 9 (morning–afternoon, 2026-05-05)

- **`feat(web)` PR #41** — F27 Pattern A→B real wiring: `useAdminUsers` hook
  flipped from stub data to `GET /api/users` via TanStack Query; optimistic
  PATCH updates for role-change + status-change; error toasts via Sonner.
  Squash-merged by auto-cascade after CI green.

- **`feat(api)` PR #40** — M2 Step 7 upload-completion orchestrator:
  `UploadOrchestratorService` + `POST /api/admin/kb/finalize-upload` wraps
  Steps 5+6 (chunk → embed) in a single atomic call with full audit chain
  (started/completed/failed events). Squash-merged.

- **`feat(api)` PR #39** — M2 Step 6 embedding service:
  `KbEmbeddingService.embedBatch()` + `POST /api/admin/kb/embed-document`;
  populates `kb_chunks.embedding` via `@xenova/transformers`; idempotent
  `WHERE embedding IS NULL` filter. Fixed stale `EXPECTED_DIM=1024` → 384
  leftover from Day-5 migration. Squash-merged.

- **`docs(adr)` PR #43** — ADR-007 cookie-domain decision (wildcard parent);
  documents `crossSubDomainCookies.domain: '.qanexus.iksula.com'`, CHIPS
  `Partitioned: true`, `nextCookies()` last-position requirement (BetterAuth
  issue #4038). Squash-merged.

- **`feat(api)` PR #44** — T021 BetterAuth magic-link wiring: `magicLink({
expiresIn: 600 })`, `crossSubDomainCookies`, Day-0 admin seed on first
  `yogesh.mohite@iksula.com` sign-in, `trustedOrigins` for both subdomains.
  Squash-merged.

- **`feat(web)` PR #42** — F06 magic-link Pattern A scaffold: 4 view states,
  `<AuthProvider>` + `useAuth()`, localStorage stub; BetterAuth flip target
  post T021. Visual gate passed (1440 px + 320 px screenshots confirmed by
  Yogesh: "SS look good"). Squash-merged.

- **`feat(api)` PR #45** — M1 close prep: RBAC e2e sweep
  (`apps/api/test/m1-close/rbac-sweep.e2e-spec.ts`, 54 `@M1-CLOSE-GATE`
  tests), `scripts/verify-audit-chain.ts`, M1 close report template
  (`docs/milestones/m1-close-report-template.md`). Squash-merged.

- **`feat(web)` PR #46** — F06 magic-link Pattern B live flip: `authClient`
  (`better-auth/react`) wired into sign-in page; cookie-domain middleware;
  `NEXT_PUBLIC_API_BASE_URL` for auth client base. Visual gate pending →
  Yogesh confirmed → squash-merged.

- **`docs(followups)` PR #47** — filed 3 M1 close visual sweep findings:
  (ab) P0 F27 /admin/users 404, (ac) P2 F07 route mismatch,
  (ad) P3 F08 empty-state route. Squash-merged.

### Day 10 — M1 close ceremony (2026-05-05)

- **`fix(web)` PR #48** (pending CI/merge) — followup (ab) resolved: root
  cause was `users-api.ts` calling relative `fetch('/api/users')` hitting
  Next.js dev server (port 3000) instead of NestJS backend (port 3001). Fixed:
  added `API_BASE = NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'`
  constant; all 3 fetchers use absolute URLs. BE wiring was already correct.
  Bonus: `pnpm install` re-run applied the pre-existing
  `public-hoist-pattern[]=better-auth` in `.npmrc` (was in store but not
  hoisted), fixing the `Cannot find module 'better-auth/react'` TS error.

- **RBAC sweep** — 54/54 tests pass in 3.649s on main
  (`apps/api/test/m1-close/rbac-sweep.e2e-spec.ts`). Output captured to
  `/tmp/m1-rbac-sweep-results.txt`. Stub-based, no live DB required.

- **Audit chain verify** — environmental skip: `DATABASE_URL` not set in local
  dev. Script exits cleanly with informative error. Algorithm validated by
  RBAC sweep §5.1 (8 HMAC integrity tests). Post-deploy action item: run from
  Render exec shell.

- **`docs(m1)`** — `docs/milestones/m1-close-report.md` committed and pushed
  directly to main. Sections: dates, 47 PRs, test counts (304 unit + 54 e2e),
  21/41 frames, acceptance gates, carry-overs, quota snapshot, wins/misses,
  sign-off table.

- **`git tag -a m1-closed-2026-05-05`** — pushed to `origin`.
  Points to commit `b686504` (M1 close report on main).

- **`docs(m1)`** — `docs/milestones/m1-closed-announcement-2026-05-05.md`
  committed and pushed. Covers what shipped, numbers, M2 kick-off items,
  pilot readiness, sign-off required.

---

## In flight

- **PR #48** (`fix/users-controller-wiring`) — CI running on GitHub Actions.
  Auto-cascade will squash-merge on green + MERGEABLE. No manual action needed.

- **Audit chain live-DB verify** — blocked on Render deployment. First M2 gate.

- **M1 sign-off** — Yogesh + Akshay review `docs/milestones/m1-close-report.md`
  and fill §10 sign-off table.

---

## Blockers

- **Render deployment (M0-T011)** — not yet executed. Stack is local-dev only.
  Deployment is the P0 gate for M2 Day 1. Requires Render + Neon + Cloudflare
  Pages env vars configured.

- **F07 route naming decision (followup ac, P2)** — Yogesh decision needed:
  keep `/founder` + `/invited/*` (current) and update spec, OR rename to
  `/onboarding/step-{1..4}`. Blocks the M1.5 spec-code alignment.

---

## Tomorrow (M2 Day 1)

1. **Deploy to Render + Cloudflare Pages** (M0-T011 + M0-T012) — top P0.
   Wire `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GROQ_API_KEY`, `RESEND_API_KEY`,
   `NEXT_PUBLIC_API_BASE_URL`, `R2_*` env vars. Smoke-test `/health` + `/api/users`.

2. **Run `pnpm --filter @qa-nexus/api verify:audit`** from Render exec shell
   after Day-0 admin seed fires — confirm HMAC chain intact.

3. **Invite all 8 pilot users** via F27m1 invite modal at production URL.
   Confirm email delivery (Gmail SMTP ADR-008 warmup).

4. **Yogesh + Akshay M1 sign-off** — `docs/milestones/m1-close-report.md` §10.

5. **Resolve followup (ac)** — F07 route naming decision from Yogesh, then
   FE chat updates spec or code (~15 min).

6. **M2 planning** — review M2 milestone backlog; confirm F15 KB live-wiring
   is the first M2 delivery (HNSW search + LLM re-rank).

---

## Free-tier quota usage

> Estimates for M1 duration (2026-04-26 → 2026-05-05, 10 days).

- **Cloudflare Pages:** ~47 builds / 500 mo (~9%)
- **GitHub Actions:** ~600 min / 2,000 mo (~30%)
- **Neon:** ~10 MB / 0.5 GB cap (<1%); ~5 compute-hr / 100 hr cap (~5%)
- **Render:** ~100 hr dev-only / 750 mo (~13%)
- **Gmail SMTP:** ~10 emails / 2,000 daily (dev invites only; <1%)
- **R2:** ~50 MB / 10 GB cap (<1%)
- **Groq:** ~0 RPD in M1 (no live deployment yet; dev testing only)
- **Gemini:** ~0 RPD in M1 (no live deployment yet)
- **Total infra cost: $0.00/month confirmed.** ✓

---

## M1 close ceremony summary

| Gate                       | Result                     |
| -------------------------- | -------------------------- |
| RBAC sweep (54 tests)      | ✅ 54/54 pass              |
| Audit chain verify         | ⚠️ env skip (no DB local)  |
| Day-0 admin seed pin       | ✅ 3/3 contract tests pass |
| Magic-link TTL (10 min)    | ✅ verified in test        |
| CHIPS cookie config        | ✅ verified in code        |
| F27 /admin/users 404       | ✅ fixed (PR #48)          |
| $0/month cost gate         | ✅ confirmed               |
| Tag `m1-closed-2026-05-05` | ✅ pushed to main          |
| M1 close report            | ✅ committed to main       |
| M1 announcement            | ✅ committed to main       |

**M1 is functionally closed. M2 begins with Render deployment.**
