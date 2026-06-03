# Day-1 Baseline Bug Catalogue — Tue 2026-06-02 (FE)

Pilot push Mon Jun 8. Baseline verification of `apps/web` at `origin/main` = `a635fff`.
Severity: **P0** = blocks pilot delivery / security · **P1** = pilot-impacting, fix before deploy ·
**P2** = dev-experience / cosmetic · **P3** = info / nice-to-have.

---

## Yogesh rulings (2026-06-02 ~17:00 IST)

FE+1 baseline surfaced 3 P1 findings; Yogesh ruled on each. (Detailed baseline evidence in Activities 1-5 below.)

### BUG-001 — Project slug convention split

- **Ruling:** FIX tonight. Standardize on name-slug (`iksula-returns`) across all 10 project sub-routes.
- **Reasoning:** User-readable URLs, REST-friendly, matches PRD canonical naming "Iksula Returns".
- **Implementation:** New `lib/project-slug.ts` helper (`slugFromName` + `projectFromSlug` + `getProjectStaticParams`). 6 files refactor (kb / imports / upload / sources + Jira step pages). Shipped in PR #224.
- **Owner:** FE+1, `fix/web-bug-001-bug-005-slug-and-f22-320px`.

### BUG-003 — Client-side admin guard

- **Ruling:** ACCEPT FOR PILOT, defer server-side enforcement to MS0-T021 (M6 scope).
- **Reasoning:** 8-user trusted internal pilot. Admin HTML flash <100ms before JS redirect is low-risk for the known team.
- **Mitigation:** `docs/pilot/risks.md` R-001 + honor-system note in pilot training doc.
- **Owner:** Yogesh (pilot risks + training); BE+1 server-side enforcement post-pilot (M6).

### BUG-005 — F22 Defect Detail horizontal scroll at 320px

- **Ruling:** APPROVED to fix tonight. Yogesh visual gate before commit.
- **Reasoning:** Hard Rule 12 RWD binding on all pilot-facing pages. F22 is a core pilot screen.
- **Implementation:** SherlockRca `<pre>` scroll-box (`min-w-0 max-w-full overflow-x-auto`) + header `flex-wrap`. Shipped in PR #224.
- **Owner:** FE+1, same branch as BUG-001.

---

## Activity 1 — Baseline gates: ✅ PASS

| Gate                 | Result                                                         |
| -------------------- | -------------------------------------------------------------- |
| `pnpm install`       | ✅ Done                                                        |
| `apps/web` typecheck | ✅ `tsc --noEmit` exit 0, **0 errors**                         |
| `apps/web` lint      | ✅ exit 0, **0 errors / 3 pre-existing warnings**              |
| `apps/web` build     | ✅ `next build` exit 0 (static export, all routes prerendered) |

3 lint warnings are pre-existing (admin-shell `useEffect` deps · requirements-list `useEffect` deps · settings-audit-page.canned-data auto-gen `eslint-disable`). All warnings, no errors. **No P0/P1 from A1.**

---

## Activity 2 — Route render sweep: 26/33 clean + 1 root-cause P1

Headless Playwright sweep of 33 concrete URLs (dynamic params substituted: slug=`iksula-returns`, defect=`DEF-RET-2104`, run=`RUN-RET-2026-04-25-002`). Pass = HTTP <400 + no uncaught `pageerror` + no console error other than the expected `localhost:3001` API fetch (BE API not running this session — expected, FE-only baseline).

- **26 routes — CLEAN** (200, render, no real errors).
- **4 routes — API-down console noise only** (kb/imports list pages fetch `:3001` — expected without BE; render fine).
- **6 routes — HTTP 500 in dev** → all one root cause = **BUG-001** below.
- **1 false alarm:** `/projects/iksula-returns/defects/D-2104` initially flagged 500 — wrong test id. The built defect id is `DEF-RET-2104`; `…/defects/DEF-RET-2104/` returns **200**. Not a bug.
- **1 info item:** root `/` returns 200 with empty body (textLen 0) — likely a redirect/landing shell. **BUG-002 (P3)** — verify intended.

### BUG-001 — Project sub-route slug-convention SPLIT (P1, pre-deploy)

**Symptom (dev):** these 6 routes 500 in `pnpm dev` when requested with the `iksula-returns` slug:
`/projects/[slug]/{kb, imports, upload, sources/jira, sources/jira/step-2, sources/jira/step-3}` —
error: `Page "…" is missing param "…" in "generateStaticParams()", which is required with "output: export"`.

**Root cause — TWO conflicting slug conventions coexist in the app:**

| Convention                | Routes                                                    | `generateStaticParams()` emits                                                     | Reachable slug                                                                   |
| ------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **A — lowercased key**    | kb · imports · upload · sources/jira[/step-2/step-3]      | `projects.map(p => ({ slug: p.key.toLowerCase() }))` → `ret, cart, pay, auth, ops` | `/projects/ret/kb` ✅ · `/projects/iksula-returns/kb` ❌ 404                     |
| **B — name-slug literal** | defects · defects/[id] · reports · results · runs/[runId] | `[{ slug: 'iksula-returns' }]` (hardcoded)                                         | `/projects/iksula-returns/defects` ✅ · `/projects/ret/defects` ❌ 404 (in prod) |

The Convention-A pages also **resolve** the slug via `projects.find(p => p.key.toLowerCase() === slug)` — so even if `generateStaticParams` emitted `iksula-returns`, the handler's `find()` would miss → `notFound()`. **Both layers** (params + resolver) encode Convention A.

The live **AdminShell KB nav** builds `kbHref = /projects/${projectKeyLower}/kb` (`projectKeyLower` = `ret`) → links to **Convention A** (`ret`). So KB works end-to-end in the live app. The kb page's own comment ("slug = lowercased key, matches the URL convention everywhere else") was **true at followup (y)** but is now **stale** — defects/reports/results/runs later standardized on Convention B (`iksula-returns`).

**Impact:**

- **Dev (today's verification):** the live app nav reaches each page via the slug that page builds, so most navigation works in `pnpm dev`. The 6 "500s" only occur when the **`iksula-returns` slug is forced** onto Convention-A pages (e.g. a deep link / hand-typed URL / cross-convention link).
- **Production static export (Jun 8 deploy):** each page only ships HTML for the slugs its `generateStaticParams` emits. If ANY nav link emits the _other_ convention's slug, that route **404s in production**. This is a latent pilot-blocking risk for the anchor project the moment a cross-convention link exists.

**Why NOT fixed today (Hard Rule 11):** picking the winning convention (`ret` vs `iksula-returns`) is an **app-wide architectural decision** affecting `generateStaticParams` + slug resolvers + every nav href across ~10 routes. Two self-consistent conventions exist; choosing one unilaterally risks breaking the other set. Flagged for Yogesh's ruling.

**Recommended fix (pending Yogesh approval):** standardize on **one** slug. Given the brief, F09/F10 nav, and `slugFromName('Iksula Returns')` → `iksula-returns`, **Convention B (`iksula-returns`)** is the likely canonical. Then:

1. Change the 6 Convention-A `generateStaticParams` to `[{ slug: 'iksula-returns' }]` (+ other projects if their sub-pages are in pilot scope).
2. Change their resolvers from `p.key.toLowerCase() === slug` to a name-slug match (or a shared `slugForProject()` helper).
3. Set AdminShell `projectKeyLower` (rename → `projectSlug`) to emit `iksula-returns`.
4. Rebuild; re-sweep all `/projects/iksula-returns/*` at one slug.

A shared `lib/project-slug.ts` (single `slugForProject(project)` + `projectFromSlug(slug)`) would prevent recurrence. **Owner: Yogesh decision → FE+1 implements.**

### BUG-002 — root `/` empty body (P3, info)

`/` returns HTTP 200 with `textLen=0`. Likely an intentional redirect/landing shell (no visible content server-rendered). Verify it routes correctly (→ `/sign-in` or `/home`) in a real browser. Not blocking.

---

## Activity 3 — RBAC verification: guard logic ✅ correct · full matrix NOT testable in Pattern A

**AdminGuard (`components/admin/admin-guard.tsx`) — logic verified by code review: ✅ correct.**
`allowed = me.role === 'Admin'`; non-Admin → `console.info('pattern-a:deferred:rbac-redirect')` + `router.replace('/home?error=admin-required')` + renders a "Admin access required. Redirecting…" placeholder (no admin-surface flash). Gates all `/admin/*` via the route wrap chain (`CurrentUserProvider` → `AdminGuard` → page).

**Full 4-persona "sign in as each role" matrix is NOT executable in FE-only Pattern A:**

- No BE auth backend (BetterAuth + middleware lands MS0-T021).
- **No role-switcher UI is mounted** — `setUser` exists in `CurrentUserContext` as "DEMO ONLY" but is wired to no visible control.
- Routes hardcode a fixed seed user: **7× `yogesh` (Admin)**, 1× `kishor` (QA Engineer, the QA-home variant), 1× `akshay` (Lead, the lead-home variant). There is no way to traverse the whole app as a chosen persona.

→ **True persona RBAC verification is gated on MS0-T021.** Re-run this activity once BE auth + server middleware land.

### BUG-003 — `/admin/*` RBAC is client-side only; admin content ships in the static bundle (P1, security, pilot-gating)

Because the app is `output: export` (Cloudflare Pages static), `/admin/settings` and `/admin/users` are **prerendered at build time as the seeded Admin (Yogesh)** → the static HTML **contains the full admin content** (audit log, users, settings). The AdminGuard is a **client-side** fence that redirects _after_ hydration. A non-admin pilot user (6 QA Engineers + Stakeholder) can read the admin HTML by viewing the raw network response or disabling JS — the redirect happens too late, the bytes already shipped.

This is a **documented, intentional Pattern-A deferral** (the guard's own header: "Server-side guard lands when MS0-T021 BetterAuth + middleware land"), **not a regression**. But for the **Jun 8 pilot** it's a real exposure: F28 audit log surfaces sensitive workspace activity. **Decision needed (Yogesh/MAIN): must MS0-T021 server middleware land before pilot deploy, or is the 8-user trusted-pilot risk acceptable?** FE+1 cannot close this client-side (the export model precludes edge session checks).

### BUG-004 — `/home` does not surface `?error=admin-required` (P3, UX)

AdminGuard redirects rejected users to `/home?error=admin-required`, but the home page does not read that param or show a toast. Sonner is now in the locked stack → a 1-line follow-up. Redirect itself works; only the explanation is missing.

## Activity 4 — Mobile @320px: 9/10 clean · 1 P1 RWD overflow

Headless Playwright @320×568 (DPR 2) on the top 10 routes. Checked: horizontal scroll (`scrollWidth > innerWidth`), hamburger presence on app routes.

| Route                                                      | H-scroll          | Hamburger                      | Verdict        |
| ---------------------------------------------------------- | ----------------- | ------------------------------ | -------------- |
| /sign-in/                                                  | none              | n/a (auth, no shell — correct) | ✅             |
| /home/ · /projects/ · /test-cases/ · /test-cases/generate/ | none              | yes                            | ✅             |
| /projects/iksula-returns/defects/                          | none              | yes                            | ✅             |
| **/projects/iksula-returns/defects/DEF-RET-2104/ (F22)**   | **YES (411>320)** | yes                            | ⚠️ **BUG-005** |
| /projects/iksula-returns/runs/RUN-RET-2026-04-25-002/      | none              | yes                            | ✅             |
| /dashboard/executive/ · /admin/settings/                   | none              | yes                            | ✅             |

### BUG-005 — F22 Defect Detail horizontal scroll at 320px (P1, RWD / Hard Rule 12)

`/projects/iksula-returns/defects/DEF-RET-2104/` overflows to **411px** at a 320px viewport. Two culprits (measured):

1. **Sherlock RCA stack-trace / error spans don't wrap or scroll** — widest offenders:
   - `<span> w=531` — `"TimeoutException: webhook handler ack ex…"`
   - `<span> w=429` — `"at RefundService.ts:241:18  ← Sherlock root-cause candidate"`
     These code/stack-trace lines render on one line and push page width to 531px. **Fix:** wrap the Sherlock RCA code block in `overflow-x-auto` (scroll inside the block) and/or `break-words` / `whitespace-pre-wrap` so it never pushes the page.
2. **Defect header meta-action row** — `<div class="flex shrink-0 flex-wrap items-center gap-2">` ("P0 · In progress · Jira RET-3392 · Edit"), width 395–411px. It's `flex-wrap` but `shrink-0` + the 44px icon button keep it from fitting. **Fix:** drop `shrink-0` (or `min-w-0` the children) so the cluster truly wraps at 320px.

Both are pure mobile-layout fixes (no desktop change). **F22 is a recently Rule-13-gated frame → layout edits should pass Yogesh's visual gate.** Cataloguing as P1; FE+1 will fix on approval (small, isolated). Not a render/crash — content is all present, just overflows.

## Activity 5 — Cross-browser: Chromium ✅ · WebKit/Firefox → manual Mac pass recommended

5 routes (/sign-in, /home, /test-cases, /dashboard/executive, /admin/settings) at 1440px:

- **Chromium — ✅ all 5 clean** (200, no horizontal scroll, body heights sane: sign-in 900 · home 1445 · test-cases 900 · exec-dashboard 2246 · settings 1376).
- **WebKit (Safari engine) + Firefox — not run:** Playwright browser executables for webkit/firefox are not installed in the headless FE env (only chromium). Rather than a heavy mid-baseline `playwright install`, the authoritative check is **real Safari 17 + Firefox 121 on Yogesh's Mac** (the actual pilot targets). **Recommended:** Yogesh runs the 5-route manual pass on Safari + Firefox before Jun 8, watching for SYS-17 scrollbar variance + font fallbacks. No Chromium-specific risks observed that would predict cross-engine breakage.

---

## Summary — Day-1 baseline

| Activity                 | Result                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| A1 Baseline gates        | ✅ install + typecheck(0 err) + lint(0 err) + build all PASS                                                          |
| A2 Route sweep (33 URLs) | ✅ 26 clean + 1 root-cause **P1 (BUG-001)** + 1 info (BUG-002) · defect-detail false alarm cleared                    |
| A3 RBAC                  | ✅ AdminGuard logic correct · full matrix gated on MS0-T021 · **P1 (BUG-003)** client-only admin fence · P3 (BUG-004) |
| A4 Mobile @320           | ✅ 9/10 clean · **P1 (BUG-005)** F22 320px h-scroll                                                                   |
| A5 Cross-browser         | ✅ Chromium clean · WebKit/Firefox → Yogesh manual Mac pass                                                           |

**Bugs:** P1 ×3 (BUG-001 slug-split · BUG-003 client-only RBAC · BUG-005 F22 mobile overflow) · P3 ×2.
**No P0.** No crashes, no missing routes, build is green. The 3 P1s are all **pre-deploy** items for the Jun 8 pilot, none block today's dev verification.

**Decisions needed from Yogesh/MAIN:**

1. **BUG-001** — pick one app-wide project-slug convention (`ret` vs `iksula-returns`); FE+1 implements (Rule 11 — don't guess).
2. **BUG-003** — must MS0-T021 server auth middleware land before pilot deploy, or accept the 8-user trusted-pilot risk for client-only `/admin` gating?
3. **BUG-005** — approve the F22 mobile-overflow fix (touches a Rule-13-gated frame).

## Activity 5 — Cross-browser: _(pending)_

---

**Cross-refs:** skill v2.2 (`.claude/skills/frame-port/`) · ADR-022 §5.9 · Hard Rule 11 (ask-don't-guess) · `apps/web/next.config` `output: export` (Cloudflare Pages static host).

---

# BE+1 Backend Baseline (PR #223 — appended at Wed merge-wave union)

> BE+1 findings from Day-1 baseline integrity + integration-health verification.
> MAIN was to create this file; it was absent at session start, so BE+1 created it.
> Severity: **P0** (blocks pilot, fix today) · **P1** (fix before Jun 8) ·
> **P2** (plan/env issue, decision needed) · **P3** (doc/cosmetic, no functional risk).

Repo state at verification: `origin/main` HEAD `a635fff` · worktree `-backend` · clean.

---

## Activity 1 — Baseline integrity: ✅ PASS (no P0)

| Gate                         | Result                                                                      |
| ---------------------------- | --------------------------------------------------------------------------- |
| `pnpm install` (frozen-lock) | ✅ EXIT 0                                                                   |
| `@qa-nexus/api` typecheck    | ✅ EXIT 0                                                                   |
| `@qa-nexus/api` lint         | ✅ EXIT 0                                                                   |
| `@qa-nexus/api` build        | ✅ EXIT 0                                                                   |
| `@qa-nexus/api` unit suite   | ✅ **59 suites / 689 tests pass, 0 fail** (37s, mocked Prisma — no DB/Groq) |
| API boot (`nest start`)      | ✅ started on :3001, 0 TS errors                                            |
| Prisma → Postgres            | ✅ `Prisma connected to Postgres` at boot                                   |

node v24.13.1 · pnpm 10.33.2. **Baseline is clean — green light to proceed.**

---

## Activity 2 — Integration health (via `/health/deep`, zero Groq burn)

The efficient path: `GET http://localhost:3001/health/deep` returns per-provider
health in one call. The LLM check reads **in-memory provider state** (does NOT
actively ping → no free-tier burn). Result (HTTP 200):

| Integration   | Status        | Detail                                                                    |
| ------------- | ------------- | ------------------------------------------------------------------------- |
| **Neon DB**   | ✅ up         | latency 1244 ms (scale-to-zero cold start); **9.51 MB = 1.86%** of 512 MB |
| **Groq**      | ✅ configured | key present (56c); status "unknown" = not yet exercised this boot         |
| **Gemini**    | ⚠️ key absent | configured in code; `GEMINI_API_KEY=REPLACE_ME` locally                   |
| **R2**        | ⚠️ deferred   | `R2_ACCESS_KEY_ID/SECRET/ENDPOINT not set` locally                        |
| **Embedding** | ✅ up + warm  | `Xenova/bge-small-en-v1.5`, load 1179 ms (see F-1)                        |
| **OTel**      | ℹ️ deferred   | Grafana/Better Stack OTLP are Render-only env (expected)                  |

DB + Groq + Embedding are GREEN locally. Gemini/R2 are placeholder/absent locally —
**expected** per Hard Rule 6 (real keys live only in Render). See F-4 for the consequence.

---

## Findings

### F-1 — [P3 doc-drift] Embedding model docs say bge-large/1024, system runs bge-small/384

**✅ CLOSED Day-1 PM** — executed followup `(ae)`: PM1_PRD + PM1_ERD notes + CLAUDE.md locked-stack updated to bge-small/384; `(ae)` marked resolved. (`.claude/rules/api.md` drift folded into `(ae)` follow-through.)

- **Observed:** `/health/deep` → `embedding.model_id = Xenova/bge-small-en-v1.5` (384-dim).
- **Docs say otherwise:** CLAUDE.md locked-stack + `docs/architecture/adr-003-embedding-model.md` body recommend `Xenova/bge-large-en-v1.5` (1024-dim).
- **Reality is internally CONSISTENT (no bug):** `schema.prisma:432` column is `Unsupported("vector(384)")`; Day-5 migration `0002_vector_384_dim.sql` resized to 384; curator + KB-search both emit/consume 384-dim. The "Path C: pin bge-small/384-dim for pilot" decision (noted in `curator.service.ts:5`) overrode ADR-003's original 1024 choice. Model dim (384) == column dim (384) → **no runtime mismatch, no pilot risk.**
- **Action (NOT today):** doc-sync PR — update CLAUDE.md locked-stack line + ADR-003 recommendation to reflect the 384-dim bge-small pilot pin. Pure documentation hygiene.

### F-2 — [P2 plan-bug] `ac042:smoke` script does not exist + would violate the no-Groq-burn rule

**✅ CLOSED Day-1 PM** — built `scripts/ac042-smoke.mjs` (`--case`/`--debug`/`--no-burn`) + `ac042:smoke` pnpm script + permanent `AC042_CASE`/`AC042_DEBUG` harness capability (retro §6.8). `--no-burn` tested; live path wired (runs Wed w/ Groq budget).

- Activity 2.1 calls `pnpm --filter @qa-nexus/api ac042:smoke`. **No such script.** `apps/api/package.json` has only `ac042:eval` (full 50-defect binding run, ~200 Groq calls) + `test:smoke` (jest e2e).
- Running `ac042:eval` would burn ~200 RPD — directly contradicts today's "**NO eval harness runs that burn Groq RPD**" rule.
- **Recommendation:** integration health is already proven via `/health/deep` (zero burn) + the Day-28 AC042 PASS (top-2 64% / cal 1.00) already validated Groq end-to-end. If a live Groq round-trip is still wanted, do **one** call, not a 200-call eval.

### F-3 — [P2 plan-bug] Health-endpoint path in brief is wrong

- Brief: `curl http://localhost:3000/api/health`. **Incorrect** — port 3000 is the web app, and the API has **no `/api` global prefix** (`main.ts` confirmed). Correct:
  - `http://localhost:3001/health` — liveness (status/version, no probes, by design)
  - `http://localhost:3001/health/deep` — integration health (DB + R2 + LLM snapshot + quota)

### F-4 — [P2 env-blocker, DECISION NEEDED] Local env cannot run Gemini / Resend / R2 live tests

- Local `apps/api/.env`: `GEMINI_API_KEY` + `RESEND_API_KEY` = `REPLACE_ME` (10c); **no R2 keys at all**. (Groq 56c ✓, DATABASE_URL 123c ✓, BETTER_AUTH_SECRET 44c ✓.)
- This is **expected** per Hard Rule 6 / security.md — real provider keys live only in Render env vars, never local.
- **Consequence:** Activities 2.2 (Gemini fallback), 2.3 (Resend email), 2.4 (R2 upload) are **not runnable in this local worktree as-is.**
- **Decision for Yogesh:** run these against the **deployed Render app** (has all keys), OR paste temp local keys, OR defer live-provider tests to the deployed-smoke pass.

### F-5 — [P2 harness-block] Activity 2.2 Gemini-fallback method is blocked 3 ways

- Method (set `GROQ_API_KEY` invalid in `.env` → trigger fallback) is blocked by: (a) `.env` Edit/Write is **harness-denied** (security.md deny block); (b) `GEMINI_API_KEY` is a placeholder locally so the fallback target can't succeed; (c) corrupting the hard-won Groq key risks repeating the Days-25–27 key saga.
- **Recommendation:** verify fallback via the deployed app OR a provider-mocked integration test — never by mutating the live `.env`.

### F-6 — [P3 possible-gap] No FE provider-setup / F28m1 component found in `apps/web/src`

- Searched `*provider*`, `*f28m1*`, `*llm-setup*` paths under `apps/web/src` → no match. API side has `llm.controller.ts @Get('providers')` (ops/dev endpoint) only.
- Activity 3 (F28m1 Day-0 provider-setup modal) may target a screen **not yet built** (F26 Agents UI was a Tier-2 carry per the M5 close record; F28m1 may be pending too).
- **Action:** FE+1 confirm whether F28m1 exists. If not, Activity 3 defers.

### F-7 — [P3 info, GOOD NEWS] Local auth IS feasible despite Resend placeholder

- `auth.controller.ts:112` returns _"Magic link sent (check inbox; in dev, see console for stubbed link)."_ → **in dev the magic link is stubbed to the console/log, not emailed.** So `RESEND_API_KEY=REPLACE_ME` does **not** block local login.
- **Refines F-4:** the local blocker is narrower than "can't authenticate" — authenticated UI flows (F28m1 render, RBAC redirects, per-role gates) ARE locally feasible via console-stubbed link + seeded users. Only the live provider **round-trips** (real Resend email delivery, R2 upload, Gemini fallback) need real keys → those defer per F-4.
- **Caveat for Activity 4 full matrix:** Day-0 seed creates ONE admin (Yogesh). Lead / QA Engineer / Stakeholder users need seeding before the full 4-role matrix can be driven live. RBAC per-role **logic** is already verified at unit level (`project-roles.guard.spec.ts` PASS, in the 689-test suite).

### F-8 — [P2 worktree-hygiene] Inherited locked-frame deletions sitting in the `-backend` worktree

- `git status` in the `-backend` worktree shows **5 unstaged deletions of LOCKED frames** (Hard Rule 3): `F26 Agents.html`, `F26m1 Agent Model Assignment.html`, `F27 Users and Roles.html`, `F27m1 Invite User Modal.html`, `F28m1 LLM Provider Configuration.html` (all in `frames - claude code build (PM1 v2.6-v2.8)/`).
- These are **tracked in HEAD `a635fff`** but **missing from this worktree's disk** — they bled in from FE's `chore/web-f28-v1-frame-delete` v1-supersede work (visible in the shared stash list). This is the **cross-worktree pollination** risk logged in the M5 retro (lesson #5).
- **Risk:** a careless `git add -A` / `git commit -am` here would commit locked-frame deletions = Hard Rule 3 violation. BE+1 committed Day-1 docs **by explicit path only** to avoid this.
- **Action (FE/Yogesh own this):** decide whether F26/F27/F28m1 v1 frames are intentionally being superseded (then land the deletion via the proper FE PR with v2s) or restore them. Not BE's domain to commit either way.

---

## Decisions taken autonomously (interactive prompt was unavailable)

The Day-1 plan had two forks that needed a call; the interactive question failed to
deliver, so per the brief's own "make the reasonable call and keep going" posture +
binding rules, BE+1 decided:

1. **Skip the live Groq round-trip** (Activity 2.1). Honors today's explicit "NO Groq
   RPD burn" rule. `ac042:smoke` doesn't exist (F-2); a real `ac042:eval` burns ~200
   RPD. Groq is already proven: config via `/health/deep` + the Day-28 AC042 PASS
   (top-2 64% / cal 1.00) exercised it end-to-end. **0 Groq RPD spent today.**
2. **Defer live Resend / R2 / Gemini round-trips** to a deployed-smoke pass (F-4). Local
   `.env` lacks those keys; `.env` is Edit/Write-harness-blocked; fabricating keys
   violates security.md. `/health/deep` already confirms config wiring. **Reversible** —
   if you provide the deployed API URL or paste local keys, I run them immediately.

If either call is wrong, redirect and I'll execute the alternative.

---

## GREEN (verified working, no action)

- **G-1 RBAC code + runtime guard:** 65 routes carry `@Roles(`/`@ProjectRoles(`; role enum `{Admin, Lead, QAEngineer, Stakeholder}` in `packages/shared/src/auth/role.enum.ts` — **exactly matches PM1 ERD §3**. **Runtime-verified**: unauthenticated GET on `/api/projects/:id/test-cases`, `/api/projects/:id/requirements`, `/llm/providers` all return **401** (auth guard fires before role check) — **no bypass**. (Per-_role_ differentiation — Admin vs Lead vs QA vs Stakeholder — still needs authenticated sessions = Activity 4 live, pending env per F-4.)
- **G-2 DB quota:** Neon 9.51 MB / 512 MB = **1.86%**. Ample headroom.
- **G-3 Embedding:** model warm in 1179 ms, 384-dim, consistent with schema.

---

## Activity 5 — Day-1 quota snapshot (partial; dashboards need Yogesh)

| Provider   | Measured                                                         | Source                                        |
| ---------- | ---------------------------------------------------------------- | --------------------------------------------- |
| Neon       | 9.51 MB storage (1.86% of 512 MB)                                | `/health/deep` ✅                             |
| Groq       | **0 RPD today** (no calls made)                                  | budget preserved per "do NOT" rule            |
| GH Actions | ≥100 CI runs since 2026-05-26 (M5 close week); minutes _pending_ | billing API 404 (token scope) → **dashboard** |
| Resend     | _pending_                                                        | needs Resend dashboard (Yogesh)               |
| R2         | _pending_                                                        | needs CF dashboard (Yogesh)                   |

Neon **CU-hr** (compute-hours, distinct from the 9.51 MB storage above), GH-Actions
minutes, Resend email count, R2 GB all need provider dashboards (Yogesh access).

Neon **CU-hr** (compute), GH-Actions minutes, Resend email count, R2 storage GB all
require provider dashboards — captured at EOD with Yogesh's dashboard access.

---

_BE+1 Day-1, 2026-06-02. Activities 1+2 done autonomously (baseline GREEN, integration
health via /health/deep). Activities 2.2–2.4 + 3 + 4-live gated on F-4 decision._
