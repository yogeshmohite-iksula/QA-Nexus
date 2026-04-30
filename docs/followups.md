# Followups — top-level engineering backlog

---

## [2026-04-30] (k) Live LLM gateway + A1 Scribe validation — DEFERRED to Render-deploy day

**Symptom:** Day-4 noon brief Block 1 (live `/llm/test` happy + fallback + long-context + benchmark) and Block 2 (A1 Scribe real-LLM smoke) require a reachable API origin with `GROQ_API_KEY` + `GEMINI_API_KEY` set. At Day-4 morning start, `https://qa-nexus-api.onrender.com/health` returned 404 — Render slot exists but no app bound. Yogesh hasn't completed provisioning yet.

**Decision:** package the entire validation as a single re-runnable script (`scripts/llm-gateway-validation.sh`) so the moment Yogesh signals "Render is up + keys set" the BE chat fires it in one command and commits the report.

**Owner:** BE chat — fires on Yogesh's signal. Estimated wall time: ~30s. Cost: ~12 Groq RPD (0.8% of daily quota).

**Pre-work landed today** (Day-4 PR):

- `scripts/llm-gateway-validation.sh` — covers blocks (a)-(e) with `set -euo pipefail` + idempotent markdown-append output to `docs/observability/llm-gateway-validation-YYYY-MM-DD.md`.
- `docs/observability/llm-gateway-validation-2026-04-30.md` — placeholder explaining deferral + how to run when keys land.

**Closes:** Day-4 noon brief Blocks 1 + 2.

---

## [2026-04-29] (j) CI must run on push to main, not just on PRs — OBSERVABILITY HOLE — **CLOSED 2026-04-30**

**Resolution:** Day-4 morning, ~10 min. Added `push: branches: [main]` trigger to `.github/workflows/ci.yml` and `.github/workflows/e2e.yml`. The e2e workflow keeps the same path filter on the push trigger so pure docs/config pushes still skip. Verified by pushing this very commit and watching CI fire on the push event.

**Symptom:** Day-3 evening seed-centralization scaffold (commit `6385e25`) and the T031 e2e workspace scaffold were pushed directly to `main` and broke 3 of 7 CI jobs (typecheck, test, build). The breakage went undetected until PR #11 opened the next morning, blocking the entire Day-3 stretch merge cascade (PRs #11/#12/#13). Hotfix landed in this PR.

**Root cause:** `.github/workflows/ci.yml` triggers only on `pull_request: branches: [main]`. Direct-to-main commits — which happen for trivial doc/fix changes that don't warrant a PR — are never validated by CI. Any regression in such a commit lurks until the next PR is opened, then surfaces as "PR #N is failing CI for reasons unrelated to its diff" and blocks merges until the regression is found.

**Risk:** every direct-to-main commit is a silent landmine. Worse: the engineer who pushed direct-to-main isn't the one who hits the failure — the next PR author is. Trust in CI suffers ("CI is flaky / not my code's fault").

**Decision (Day-4 morning P1, ~10 min):**

1. **`.github/workflows/ci.yml`** — add `push: branches: [main]` alongside the existing `pull_request` trigger:
   ```yaml
   on:
     pull_request:
       branches: [main]
     push:
       branches: [main]
   ```
2. **`.github/workflows/e2e.yml`** — same change (e2e workflow currently only triggers on PR paths).
3. **Branch protection** — already requires CI green to merge to main, so this change has no merge-blocking impact for direct pushes (they're already on main); the value is detection latency: regressions surface within ~5 min of `git push origin main` instead of hours later when the next PR opens.
4. **Concurrency** — keep `concurrency.cancel-in-progress: true` so a rapid sequence of direct pushes doesn't queue stale runs.

**Followup-of-followup:** consider a `direct-to-main-policy.md` rule in `.claude/rules/` documenting which kinds of changes are OK to push direct (docs typo, comment-only, EOD reports) vs which require a PR (anything touching `apps/**/src` or `packages/**/src`, any CI/workflow file, any `.claude/hooks/`). The pre-push CHANGELOG guard already partially enforces this for source code; extending it to workflows + hooks would close the loop.

**Owner:** MAIN (Day-4 morning, batched with seed-centralization Phase-5 review).

---

## [2026-04-29] (i) Centralize demo seed data + decouple UI from hardcoded names — **CLOSED 2026-04-30**

**Resolution:** seed-centralization landed in two PRs, then refined post-merge:

- **PR #16** (Day-3 stretch FINAL evening, `089a999`) — F08a + F08b + F08c migrated. Surfaced the "view-fixtures-vs-identity" insight: data.ts files stay as VIEW-ONLY fixture stores; only ENTITY IDENTITY exports (SIGNED_IN_USER, ACTIVE_PROJECT) move to context providers. View fixtures get replaced by future M2/M3/M4 endpoints (run results, defect lists, agent activity feeds), NOT by user/project APIs the contexts swap to. Captured as ADR-006 Refinement section.
- **PR #17** (Day-4 morning, `22927a5`) — F09 + F10 (Projects List + Create Project Modal) migrated following the refined pattern. 8 RWD pre/post screenshots committed (320 + 1440 × projects-list + projects-create); pre/post deltas ~1% confirming pixel-near-identical output. All 5 originally-spec'd components now using `useCurrentUser` / `useActiveProject` / `useTeamRoster` for entity identity.

**Owner:** MAIN scaffolding (Day-3 evening, ADR-006 + 3-layer architecture) + FE chat per-component refactors (PR #16 + PR #17).

---

## [2026-04-29] (i) [historical] Centralize demo seed data + decouple UI from hardcoded names — DAY-4 MORNING P1

**Symptom:** F08a (`apps/web/components/home/data.ts`), F08b (`apps/web/components/home-lead/data.ts`), F08c (`apps/web/components/home-empty/data.ts`), F09 (Projects List), F10 (Sprint Board) all have inline `data.ts` files with hardcoded references to the 8 named Iksula pilot users (Akshay, Yogesh, Kishor, Nitin, Nadim, Govind, Mohanraj, Sagar) and the 5 Iksula projects (RET, CART, PAY, AUTH, OPS). The data is correct per IKSULA_CONTEXT.md but **architecturally wrong**: stub data lives in component files instead of a single source.

**Risk:** when **F27 Admin user-management** lands (M1) or **F28 Project CRUD** lands (M2), Admin can create new users + projects via the UI. Every component with an inline `data.ts` will need a source-code change to display the new entries — breaks the "Admin creates users → UI shows them" contract. This is the primary "demo-seed-rot" anti-pattern that bites every product when the seed survives past the M0 demo gate.

**Decision (made Day-3 evening):** centralize NOW, before more components copy the same anti-pattern. Clean separation of concerns:

- **MAIN owns:** `packages/shared/src/seed-types.ts` (typed contracts) + `apps/web/lib/demo-seed.ts` (single source) + `apps/web/lib/contexts/*` (React context providers `useCurrentUser`, `useProject`, `useTeamRoster`) + the migration runbook.
- **FE owns:** the per-component refactor — replace `import { ... } from './data'` with `useTeamRoster()` etc, delete the per-component `data.ts` files.

**Phases (this Day-3 evening session):**

1. **Phase 3(a):** `packages/shared/src/seed-types.ts` — typed interfaces for User, Project, TestCase, Defect, RunResult, AgentActivity, Approval. Each interface matches what the BE API will return when T021 + endpoints land. Barrel-exported.
2. **Phase 3(b):** `apps/web/lib/demo-seed.ts` — SINGLE source of all stub data. Header explicitly marks as DEMO + lists what BE endpoint replaces each array.
3. **Phase 4 (TBD per spec — Yogesh's message truncated):** likely React context providers + ADR-006 + migration runbook for FE.

**Day-4 morning protocol:** FE chat reads `docs/refactor/seed-centralization-migration.md`, refactors components one by one. Each FE PR closes one component (F08a → F08b → F08c → F09 → F10). MAIN reviews each PR for "no new inline data.ts" + "all usage via context hooks".

**ADR target:** `docs/architecture/adr-006-seed-data-centralization.md` — accepted, alternatives considered (per-component data.ts → status quo, BE-mock-server → over-engineered for PM1, Storybook fixtures → wrong tool, MSW → relies on HTTP we don't have yet). Filed as part of Phase 3 below.

**Owner:** MAIN (scaffolding tonight, Phases 3-4) + FE chat (refactor Day-4 morning).

**ETA:** ~1.5-2 hr scaffolding (this session) + ~1.5 hr FE refactor (Day-4 morning).

**Cross-references:**

- `apps/web/components/home/data.ts`, `apps/web/components/home-lead/data.ts`, `apps/web/components/home-empty/data.ts` — the per-component anti-pattern instances to migrate
- `IKSULA_CONTEXT.md` — the 8-user / 5-project canon that the seed must remain consistent with
- `PM1_PATTERNS.md` Pattern A — the deferred-routing ancestor pattern this builds on
- ADR-002 (Prisma raw split) — analogous "shared infrastructure has implicit version coupling" pattern

---

## [2026-04-29] (h) Zod 3 / Zod 4 ecosystem migration — DAY 7-8 STRATEGIC

**Symptom:** within 24 hours, **two** packages auto-resolved to versions requiring Zod 4:

1. **Day 2 evening:** `@hookform/resolvers/zod` started pulling in Zod 4 internals via the `$ZodTypeInternals` shape (followup f, fixed via root `pnpm.overrides.zod = "^3.25.76"`).
2. **Day 3:** `better-auth ^1.2.0` resolved up to `1.6.9` which uses `z.coerce.boolean().meta(...)` — a Zod 4 method — and crashed boot. BE chat patch-pinned to `~1.2.0` (Day-3 BE worktree CHANGELOG entry).
   - **BE-specific detail:** also dropped the `metadata` arg from `magicLink.sendMagicLink` callback in `apps/api/src/auth/auth.config.ts` (added in better-auth 1.4+; not in 1.2.x signature).

**Trend:** the Zod 3 → 4 migration is sweeping the JS/TS ecosystem in Q2 2026. Every week we delay, more transitive deps will force tactical pins. Each pin is ~15 min of investigation + commit + audit; the friction compounds.

**Recommendation:** schedule an **atomic Zod 4 migration as a Day 7-8 task** (after M0 hosting deploys land but before M1 endpoint expansion). One focused day:

- Bump root `pnpm.overrides.zod` to `^4.x` + remove the override entirely (let upstreams resolve naturally).
- Update `packages/shared/src/schemas/*` to Zod 4 syntax (largely back-compat; main breaks are `.strip()` removal + new `.meta()` method shape).
- Update `apps/api`'s `ZodValidationPipe` to use `result.error.issues` shape changes (Zod 4 renamed some fields).
- Update `apps/web`'s `zodResolver` import to `@hookform/resolvers/zod@^4.x`.
- Update `.claude/locked-deps.json` paired-major lock from `{ zod: "3", "@hookform/resolvers": "3" }` to `{ zod: "4", "@hookform/resolvers": "4" }`.
- Smoke-test BE auth + FE form validation + R2 upload Zod schemas + LLM gateway request schemas (from BE T023).
- 1 focused day beats accumulating 2-3 weeks of tactical pins.

**Owner:** BE chat (lead — touches the most surface) + FE chat (apps/web schemas).

**ETA:** ~1 day (Day 7 or Day 8 — slot when no other major M0 work is in flight).

**Closes:** alongside this migration, `STACK_LEARNINGS.md` `[ZOD]` + `[ZOD][TS]` entries get a "MIGRATION COMPLETE" addendum and the followup (c) zod-resolvers coupling note becomes historical context.

**Cross-references:**

- followup (c) — original zod-resolvers coupling prediction (Day 1 evening)
- followup (f) — first materialization (Day 2 evening, fixed via override)
- BE worktree CHANGELOG (Day 3) — second materialization with better-auth
- `STACK_LEARNINGS.md` `[ZOD]` and `[ZOD][TS]` entries
- `.claude/locked-deps.json` — paired-major lock (currently zod=3)
- root `package.json` `pnpm.overrides.zod` — the existing pin

---

## [2026-04-28] (g) Stakeholder Home — no locked frame, design ambiguity

**Identified during:** Day-2 stretch session, FE F08b port.

**Symptom:** The FE chat's brief described a "Stakeholder Home" frame, but **no such locked HTML exists in `PM1_UI_v2/`** (neither in `frame  html view/` nor in `frames - claude code build (PM1 v2.6-v2.8)/`). F07c's "Skip → F08b" routing assumes Stakeholder uses the same dashboard frame as Lead with role-gated content. Alternative interpretation: Stakeholder lands on F24 (QA Value Dashboard) directly, since they're a read-only/exec persona who'd prefer a value-summary view over a queue/board.

**Two candidate resolutions (pick ONE Day 3+ after design review):**

1. **Lock a new F08d Stakeholder Home frame.** Use F08b as the starting point; prune to read-only widgets (no "Take" actions, no inline edit, drop the My Queue card or replace with "Recently Reviewed"). Designer + Yogesh own the frame creation. Once locked, FE re-routes F07c Skip → `/home/stakeholder/`. Adds ~1 frame to the 41-frame inventory (now 42).
2. **Deprecate the "Stakeholder Home" concept.** Update F07c routing to land Stakeholders on F24 (QA Value Dashboard) directly — that frame already exists, already locked, already read-only by design. No new frame needed; just a routing tweak. Costs nothing in design budget but means Stakeholders lose the "today's status" lens until they navigate to the workspace's project-board view.

**Recommendation (engineering perspective):** option (2) is the lower-risk path — F24 already exists, already locked, designed for the exec persona. Option (1) re-opens the design-freeze door, which is risky 8 days into a 10-day M0. But this is a UX call, not engineering's to make alone.

**Owner:** PM (this chat) + Yogesh. Designer review to confirm intent.

**When:** after PM1 design freeze review (post-M0 review window, target Day 10–11).

**Action items if option (2) chosen:**

- Update F07c routing constant: `STAKEHOLDER_NEXT = '/value-dashboard'` (or whatever F24's route is) instead of `/home/stakeholder/`.
- Update PM1_PRD §<wherever Stakeholder onboarding flow is documented> to clarify "Stakeholder skips home" if PRD currently implies a Stakeholder home.
- Update `IKSULA_CONTEXT.md` memory note: "no Stakeholder users in pilot — reserved for future PM2/PM3" already explains why this is low-priority for PM1.

**Action items if option (1) chosen:**

- Designer creates `F08d Stakeholder Home.html` in `PM1_UI_v2/frame  html view/`.
- Frame inventory updates from 41 → 42 across CLAUDE.md + skill audit + binding-context hook.
- FE chat ports F08d as MS0-T030.f (or post-M0 if past freeze).

**Cross-references:**

- `PM1_UI_v2/frame  html view/F07c Invited - Stakeholder.html` — the source of the routing question
- `PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F08b ...` — the QA-Engineer home that Stakeholder might or might not share
- `PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F24 QA Value Dashboard.html` — the alternative-2 landing target
- `IKSULA_CONTEXT.md` § "Stakeholder role" — context that pilot has no Stakeholders, lowering urgency

---

## [2026-04-28] (f) P0 Day-3 morning — zod 3 ↔ zod 4 dual-install after BE PR #6 merge ✅ CLOSED 2026-04-28 EVENING

**Closed by:** root `package.json` `pnpm.overrides.zod = "^3.25.76"` (Day-2 stretch session, Block 1). Option 1 from the candidate list applied. **Plus a discovered gotcha:** clearing `apps/web/tsconfig.tsbuildinfo` and `apps/api/.tsbuildinfo` was REQUIRED — TypeScript's incremental compilation cache had stale Zod 4 type resolutions even after the lockfile re-resolved. Without the cache clear, typecheck kept showing `$ZodTypeInternals` errors despite only zod@3.25.76 being symlinked into apps/web/node_modules/zod. Documented in `STACK_LEARNINGS.md` `[ZOD]` entry as a recovery step for future workspace-wide dep changes.

Both typechecks now exit 0. better-auth runtime smoke-test deferred to Day 3 BE chat (the override forces better-auth to use Zod 3 at runtime; need to verify it doesn't actually depend on Zod 4 features).

---

## [2026-04-28] (f) [original] P0 Day-3 morning — zod 3 ↔ zod 4 dual-install after BE PR #6 merge

**Symptom:** post-merge of BE PR #6 (`7f60b8e`) which introduced `better-auth` dep, `pnpm install` resolves TWO Zod versions in `node_modules/.pnpm/`:

- `zod@3.25.76` (declared by packages/shared 3.23.8, apps/api 3.23.8, apps/web 3.25.76)
- `zod@4.3.6` (transitively pulled in by `better-auth`)

`pnpm typecheck` then fails on apps/web with: `Type 'ZodObject<...>' is missing the following properties from type 'ZodType<any, any, $ZodTypeInternals<any, any>>': def, type, toJSONSchema, check, and 18 more.` — Zod 4's internal type signature is incompatible with the `@hookform/resolvers/zod` import path apps/web uses.

**Why CI didn't catch it:** each PR was tested in isolation. BE PR #6 (zod 3.23 + better-auth → transitive zod 4) passed because BE doesn't use Zod for FE forms. FE PR #7 (zod 3.25 only) passed because no better-auth in scope. Combined dep graph post-merge surfaces the conflict.

**This is the materialized form of followup (c)** — the zod-resolvers paired-major lock we predicted yesterday. Confirmation came faster than expected (Day 2 evening, not "MS0-T004 landing").

**Fix candidates (pick ONE Day 3 morning, ~1h):**

1. **Pin Zod to v3 at the root level via `pnpm.overrides`.** Add to root `package.json`:

   ```json
   "pnpm": { "overrides": { "zod": "^3.25.76" } }
   ```

   This forces every transitive dep (including better-auth) to resolve to Zod 3. Risk: better-auth may break at runtime if it actually uses Zod 4 features. **Investigate before applying.**

2. **Upgrade everything to Zod 4 simultaneously.** Bump packages/shared + apps/api + apps/web to `zod ^4.3.6` AND `@hookform/resolvers ^4.x` (which supports Zod 4). Risk: larger blast radius; need to verify Zod 4 schema syntax is back-compat with our schemas.

3. **Pin better-auth to a version that uses Zod 3.** Check better-auth changelog for the version before they adopted Zod 4. May force pinning to an older better-auth (security risk if old version has CVEs).

**Recommended:** option 1 (pnpm.overrides Zod 3) as the fastest unblock; revisit option 2 if better-auth runtime breaks. Land the paired-major lock in `.claude/locked-deps.json` AT THE SAME TIME.

**Owner:** BE chat, Day-3 morning, BEFORE any other backend work.

**ETA:** ~1h (option 1 = 5 min change + smoke-test BE auth flow + smoke-test FE form validation; if better-auth breaks, escalate to option 2 ~3h).

**Closes followup (c) when shipped** (the paired-major lock makes this re-occur at a clear gate, not silently).

---

Canonical log for engineering followups (architecture decisions, hook drift, deferred installs). **Distinct from `docs/parallel-work/follow-ups.md`** — that one tracks parallel-chat-coordination items (rebases, merge conflicts); this one tracks structural / architectural decisions that need ADRs or implementation slots.

Convention: append at top with `[YYYY-MM-DD]` header. Cross-link to commit SHAs and ADR docs when they land.

---

## [2026-04-27] (a) ADR-002 — Prisma migrations vs `prisma/raw/` split ✅ CLOSED 2026-04-28

**Closed by:** `docs/architecture/adr-002-prisma-raw-split.md` (this commit). Three open questions resolved: (1) raw applied manually with human gate, formalized via `pnpm db:apply-raw`; (2) tracking via git history + idempotency contract; (3) idempotent-by-default rule. Pairs with closure of bonus (e) below.

---

## [2026-04-27] (a) [original] ADR-002 — Prisma migrations vs `prisma/raw/` split

**Context:** During MS0-T020, hand-written infra migrations (RLS policies, HNSW indexes, pgvector extension, audit-log triggers) couldn't live in Prisma's `migrations/` directory because Prisma's shadow-DB validator applies migrations in lex order. The original file `0_init_rls_hnsw/migration.sql` was failing because it referenced tables that hadn't been created yet by Prisma's auto-generated init migration.

**Resolution applied (in `e4869bb` → squashed to `a6644c1`):** relocated the file from `apps/api/prisma/migrations/0_init_rls_hnsw/` to `apps/api/prisma/raw/init_rls_hnsw.sql`. Applied via `prisma db execute --file prisma/raw/init_rls_hnsw.sql --schema prisma/schema.prisma` (manual one-shot during MS0-T020.5).

**Decision needed for ADR:** formalize the split convention as project policy:

- `apps/api/prisma/migrations/<timestamp>_*/` — Prisma-managed schema migrations (auto-generated by `prisma migrate dev`, applied by `prisma migrate deploy` in CI)
- `apps/api/prisma/raw/*.sql` — hand-written infra (RLS, HNSW, extensions, triggers, functions). Applied via `prisma db execute` with explicit human approval.

**Open questions to resolve in the ADR:**

1. How is `prisma/raw/` applied in CI? Currently no `db:apply-raw` script exists in `apps/api/package.json` (only `prisma:*` scripts). Add one + wire into the deploy workflow? Or keep it manual to enforce human approval on RLS changes?
2. How is the "applied" state tracked? Prisma tracks its own migrations in `_prisma_migrations` table; raw SQL has no equivalent. Add a `_raw_migrations` table with file hash + applied_at? Or trust git history?
3. Re-apply semantics: are `prisma/raw/*.sql` files idempotent (use `IF NOT EXISTS` everywhere) or one-shot (track applied state)? The current `init_rls_hnsw.sql` mixes both.

**Owner:** BE chat tomorrow morning, BEFORE T021 BetterAuth (because BetterAuth's session/account/verification tables also need RLS policies that follow this pattern).

**Output:** `docs/architecture/adr-002-prisma-raw-split.md` (new dir; ADR-001 doesn't exist yet — that one would be "Postgres + Prisma over alternatives", which we never formally documented but is implicit in the locked stack).

**ETA:** ~45 min (read existing raw SQL + draft ADR sections + cross-link to PM1_ERD §3 for the table inventory + commit).

---

## [2026-04-27] (b) P1.17 — Worktree hook drift, structural fix ✅ CLOSED 2026-04-28

**Closed by:** `.claude/hooks/session-start/sync-hooks.sh` (this commit). Picked option (i) from the original three candidates: SessionStart hook auto-syncs `.claude/hooks/` from `origin/main` on every chat start. Non-blocking; respects local uncommitted hook edits (skips auto-sync if `git diff -- .claude/hooks/` is dirty). Wired in `.claude/settings.json` under `hooks.SessionStart`.

---

## [2026-04-27] (b) [original] P1.17 — Worktree hook drift, structural fix

**Symptom:** Each new disposable Claude worktree starts off whatever SHA the parent process happened to be on, NOT the latest `origin/main`. This means new worktrees may not have the latest `.claude/hooks/` updates (e.g., `block-dangerous.sh` regex fix from P1.13 took 2 iterations to land in FE worktree because of stale hook).

**Specific failure mode observed Day 1:** FE chat's first force-push attempt was blocked by the OLD `block-dangerous.sh` (which didn't have the P1.13 flag-boundary regex yet), even though the fix had landed on main 30 minutes earlier. Yogesh had to manually push.

**Fix candidates (pick ONE):**

| #       | Approach                                                                                                                                                                                                                                                                      | Pros                           | Cons                                                                                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **i**   | SessionStart hook that runs `git -C "$CLAUDE_PROJECT_DIR" fetch origin main && git checkout origin/main -- .claude/hooks/` before any tool call                                                                                                                               | Automatic; transparent to user | Risky — silently overwrites local hook changes the user may want; `git checkout origin/main -- .claude/hooks/` mid-session is confusing if they have uncommitted hook edits |
| **ii**  | Documentation only — every worktree creation MUST be from `origin/main`, not local `HEAD`. Update `scripts/refresh-worktrees.sh` to enforce this when creating new worktrees                                                                                                  | Simple; no surprise behavior   | Requires discipline; the gap reappears whenever someone forgets                                                                                                             |
| **iii** | Pre-flight check at the start of each Claude session that compares `.claude/hooks/` SHA against `origin/main:.claude/hooks/`. If drift detected, prompt "Update hooks from origin/main? [yes / no]". Implement as a SessionStart hook that exits 0 (info only, doesn't block) | User opt-in; visible           | Adds friction at session start; adds a hook that runs `git fetch` (network call) on every session                                                                           |

**Recommendation (my read):** option **iii**. Visible + opt-in + non-blocking. Can be a 30-line bash script.

**Owner:** MAIN, Day-2 morning. Pick one approach, implement, commit, push.

**ETA:** ~45 min (script + test + commit; or 5 min if option ii — just a doc edit).

---

## [2026-04-27] (c) Zod schema coupling — `packages/shared` ↔ `@hookform/resolvers/zod`

**Context:** Surfaced during FE PR #5 (F07 Founder Onboarding) review. The 3-step wizard uses `react-hook-form` + `@hookform/resolvers/zod` to validate fields against `LoginRequestSchema`-style Zod schemas. Once `MS0-T004` lands `packages/shared` as the canonical Zod-schema home (BE↔FE contract per `apps/api` Rule "Every endpoint must have a corresponding Zod schema in `packages/shared`"), the FE will import those same schemas instead of the local copies it carries today.

**The coupling risk:** `@hookform/resolvers/zod` peer-depends on a specific Zod major. If `packages/shared` upgrades Zod (e.g., 3.x → 4.x) without the FE simultaneously bumping `@hookform/resolvers`, the `zodResolver(schema)` call type-checks against a stale resolver shape and either (a) blows up at runtime with `zod.ZodError is not a constructor`-class issues, or (b) silently passes type validation but mis-parses fields. Tested today: works at Zod 3.23 + resolvers 3.9 (current), but no CI gate enforces the pairing.

**Sub-bullet — actions to land alongside `MS0-T004`:**

- Pin Zod in **root** `package.json` as a single `dependencies` entry (not in apps/web + apps/api + packages/shared independently). pnpm hoists, but explicit root pin is the contract.
- Add Zod and `@hookform/resolvers` to `.claude/locked-deps.json` as a **paired-major** entry: `{ "zod": "3", "@hookform/resolvers": "3" }`. Update `enforce-pm1-stack.sh` to fail the Edit if one moves without the other.
- Document in `apps/api/README.md` (or new `packages/shared/README.md` when created): "Zod major bumps require coordinated PR across api + web + shared + hookform/resolvers. No standalone Zod upgrade PRs."
- Add a 1-line CI assertion in `.github/workflows/ci.yml`: `node -e "const z=require('zod/package.json').version.split('.')[0]; const r=require('@hookform/resolvers/package.json').peerDependencies.zod; if (!r.includes(z)) process.exit(1)"`

**Owner:** BE chat (paired with `MS0-T004` packages/shared landing) + FE chat (verify `LoginRequestSchema`, `OnboardingStep1Schema`, etc. import from `@qa-nexus/shared` not local files).

**ETA:** ~30 min once `MS0-T004` is in flight (5 min per task above; no new code, just contract + lock).

**Cross-link:** see follow-up (a) ADR-002 — same "shared infrastructure has implicit version coupling" pattern as Prisma's `prisma/raw/` ↔ Prisma client major.

---

## [2026-04-27] (d) Lucide-react install decision

**Context:** F06 / F06b / F06c / F07 all use inline SVGs for icons (eye toggle, arrow, checkmark, X). Each is ~5-15 lines of JSX. The skill default was to install `lucide-react` and use `<EyeIcon />` etc.; PM1 deferred this on Day 0 to avoid premature optimization.

**Question:** at what point does inline-SVG accumulation justify installing lucide-react?

**Defer decision until F08 batch (Day 3+).** By then we'll have:

- F06 + F06b + F06c + F07 + F07b + F07c + F07d + F08 + F08a + F08b + F08c = 11 frames worth of icon usage data.
- Concrete numbers: how many distinct icons? How many duplicated inline SVGs?
- Bundle-size impact: `lucide-react` is tree-shakeable, so only used icons bloat the bundle.

**Decision criteria:**

- If we hit ≥15 distinct icons or ≥5 duplicated SVGs across frames → install `lucide-react`
- If <15 icons + low duplication → continue inline (smaller bundle, no dep)

**Owner:** FE chat at F08 kickoff (probably Day 3 or 4).

**No action tonight.** Just dockets the decision so we don't forget.

---

## [2026-04-27] (e) Bonus: missing `db:apply-raw` script — surfaced during PR #4 review ✅ CLOSED 2026-04-28

**Closed by:** `apps/api/package.json` `prisma:apply-raw` script + root `package.json` `db:apply-raw` proxy (this commit). Also referenced in ADR-002 §Decision and §Cross-references. Engineers can now run `pnpm db:apply-raw` from the repo root.

---

## [2026-04-27] (e) [original] Bonus: missing `db:apply-raw` script — surfaced during PR #4 review

**Context:** BE chat's PR #4 added `apps/api/prisma/raw/init_rls_hnsw.sql` but did NOT add a `db:apply-raw` script in `apps/api/package.json`. Currently the file must be applied via the verbose `prisma db execute --file prisma/raw/init_rls_hnsw.sql --schema prisma/schema.prisma` command from the README/commit message.

**Fix:** add to `apps/api/package.json` `scripts`:

```json
"prisma:apply-raw": "prisma db execute --file prisma/raw/init_rls_hnsw.sql --schema prisma/schema.prisma"
```

And to root `package.json` `scripts`:

```json
"db:apply-raw": "pnpm --filter api prisma:apply-raw"
```

This pairs with the (a) ADR above — once the ADR formalizes the split, this script is the executable shorthand. **Land both together** in tomorrow's BE chat.

**Owner:** BE chat, paired with (a) ADR-002.

**ETA:** ~5 min (just the script wiring).

---

## Cross-references

- `docs/parallel-work/follow-ups.md` — parallel-chat coordination items (Day 1 P1.13/14/15/16 closures + Days 2–7 task pipeline)
- `docs/audits/2026-04-27-skill-alignment-audit.md` — original P0/P1/P2 plan
- `docs/audits/2026-04-27-eod-skill-conformance-audit.md` — eval-by-eval ledger
- `docs/audits/2026-04-27-permission-triage.md` — permission decision-tree origin
- `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3 — canonical entity inventory (TB-001..TB-021)
- `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` — M0 backlog (35 tasks, 298h)
