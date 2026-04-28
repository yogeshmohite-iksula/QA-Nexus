# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) +
[Conventional Commits](https://www.conventionalcommits.org/) types.

The `[Unreleased]` section is the build journal. The `@changelog-updater`
subagent (planned in P1.2) will keep this file in sync; until then, manual
updates land here at the end of every working day.

---

## [Unreleased]

### Added — Day 2 stretch evening (2026-04-28)

- **`feat(api)`** — **MS0-T025 Health endpoint** — public unauthenticated `GET /health` returns subsystem readouts (db/embedding/llm/r2/quota) for UptimeRobot's 5-min ping + Render's deploy-time health-check. DB ping with 2s timeout; embedding ping reads `EmbeddingService.status()`; quota = `pg_database_size()` vs Neon's 512 MB free tier (currently 1.78%). LLM + R2 marked `deferred` with notes pointing to MS0-T023/T013. HTTP semantics: 200 if all required up + quota ≤ 90%, 503 if any required down or quota > 90%. Curl-verified.
- **`feat(api)`** — **MS0-T024 Embedding service** via `@xenova/transformers` (in-process WASM). New `EmbeddingService.embed(text)` returns 1024-dim Float32Array, eager-loads at NestJS bootstrap, exposes `.isWarm()` + `.status()` for /health. Two dev-only Admin-gated probes: `GET /embedding/test` + `GET /embedding/cosine`. Cold load 38s (HF download), warm 1.7s, per-embed warm latency 19-31ms (well under CLAUDE.md's "~50ms" target). Cosine sanity: `('test case','test scenario')=0.80` vs `('test case','fox')=0.46`. **ADR-003** documents the model choice — PM1 ships with `Xenova/bge-large-en-v1.5` instead of Qwen3-Embedding-0.6B because Xenova hasn't ONNX-converted Qwen3 yet; same dim, same schema, hot-swap via `EMBEDDING_MODEL_ID` env var when Xenova ships it. CLAUDE.md + PM1_PRD + PM1_ERD updated with implementation notes pointing to ADR-003.
- **`feat(web)`** — **MS0-T030.e F08a Home** QA Engineer landing page with Iksula canon (Pattern A deferred routing) — squash-merged via PR #8 at `57c95b4`. Three roles (QA Engineer / Lead / Stakeholder) supported; Akshay as Lead, Yogesh as Admin, 6 named QA Engineers per `IKSULA_CONTEXT.md`. RWD verified at 320 + 1440 (305 KB / 255 KB PNGs).
- **`feat(web)`** — **MS0-T030.f F08b QA Lead Home** + **MS0-T030.g F08c Empty Project Home** (Pattern A deferred) — squash-merged via PR #9 at `4c9dd0f`. F08b = QA Lead's approvals queue + outcome board; F08c = onboarding empty-project state for new workspaces. 4 PNGs: rwd-home-{empty,lead}-{320,1440}.png (170-319 KB).
- **`docs(followups)`** — Filed (g) Stakeholder Home design ambiguity — no locked HTML frame exists for "Stakeholder Home"; F07c skip routing implies F08b sharing OR F24 fallback. Two candidate resolutions documented; engineering recommendation = option 2 (deprecate concept, route Stakeholder skip → F24 directly). Owner: PM + Yogesh + designer review at design freeze.
- **`feat(observability)`** — Per-chat token-savings tracking infrastructure — see `feat(observability)` entry below; landed during stretch session block 4-5.

### Changed — Day 2 stretch evening

- **`chore(security)`** — Root `package.json` gained `pnpm.onlyBuiltDependencies` allowlist (sharp, prisma, @nestjs/core, unrs-resolver) — pnpm 10's default-block of install scripts was preventing sharp's libvips binary from being downloaded, which `@xenova/transformers` needs at runtime. Documented as a security trade-off in `docs/SECURITY.md` → "Dependency hygiene"; future additions require ADR + Yogesh sign-off.
- **`fix(api)`** — Restored runtime imports for `AppService` + `AuthService` in `app.controller.ts` and `auth.controller.ts` (lint-staged had auto-converted them to `import type` in a prior session, silently breaking Nest DI at runtime; the eslint override merged in `07c97ea` now prevents future drift).

### Fixed — Day 2 evening (2026-04-28)

- **`chore(deps)`** — Pinned Zod to 3.x via `pnpm.overrides` in root `package.json` (this commit). Closes followup (f) — the dual-zod (3.25.76 + 4.3.6) state that surfaced post-BE-merge when `better-auth` transitively pulled Zod 4. Both `apps/web` and `apps/api` typechecks now exit 0. Required clearing `tsconfig.tsbuildinfo` caches in both apps (TS incremental cache had stale Zod 4 type resolutions). Documented mitigation in `STACK_LEARNINGS.md` for future workspace-wide dep upgrades.

### Added — Day 2 (2026-04-28)

- **`feat(skill-features)`** — Memory System v1.3 — 4 curated logs (`5dcdb38`): `CLAUDE_DECISIONS.md` (decisions tied to ADRs), `STACK_LEARNINGS.md` (8 gotchas: zod/resolvers, hook regex boundary, static-export redirect, Grammarly hydration, CI bootstrap, Prisma shadow-DB, gitleaks paths-vs-regexes, WCAG tap targets), `IKSULA_CONTEXT.md` (8-user roster, anchor project RET, ID patterns, sample files), `PM1_PATTERNS.md` (Pattern A deferred routing, Pattern B visual confirmation gate, Pattern C full RWD, Pattern D audit log, Pattern E shared schemas).
- **`docs(skill-features)`** — Status Line + `/changelog-add` slash command + `docs/STATUS.md` project-at-a-glance (`945c3ef`). Status line renders Model | Branch | ctx% | Cost | Duration with color-coded ctx (yellow ≥50%, red ≥75%) per CLAUDE.md compact rule.
- **`chore(infra)`** — Closed 3 Day-1 followups in one commit (`742982c`):
  - `.claude/hooks/session-start/sync-hooks.sh` — auto-syncs `.claude/hooks/` from `origin/main` on every chat start (closes followup b / P1.17 worktree drift).
  - `docs/architecture/adr-002-prisma-raw-split.md` — formalizes the `prisma/migrations/` vs `prisma/raw/` convention with idempotent-by-default contract (closes followup a).
  - `pnpm db:apply-raw` script in root + `prisma:apply-raw` in `apps/api` (closes followup e bonus).
- **`feat(skill-features)`** — Husky pre-push CHANGELOG guard (this commit). Blocks pushes where any commit touches `apps/**/src/` or `packages/**/src/` without a matching `docs/CHANGELOG.md` edit somewhere in the push range. Permissive: only requires CHANGELOG to be touched ONCE in the range, not per-commit. Bypass via `--no-verify` (intentional friction).
- **`feat(skill-features)`** — `.claude/memory/RETROS.md` seed file for per-session and per-milestone retrospectives. Format documented; first entry seeded with Day 2 reflection.
- **`docs(eod)`** — Day 2 EOD report + Tech-project-forge skill alignment audit (this commit). Skill drift check: zero. Conformance lifted 89% → 96% (+7 pts) with SessionStart hook + STATUS.md + pre-push CHANGELOG guard + Status Line. Token-savings: ~43,800 tokens saved Day 2; ~50,250 cumulative across Days 0–2.

---

## [0.1.0] — 2026-04-27 (Day 1 milestone marker)

> **Symbolic milestone, not a release tag.** Day 1 closed the audit-driven scaffolding push (skill conformance 18% → 89%), shipped Prisma + RLS + 8-user seed, and the F07 Founder Onboarding wizard. Captured as a Keep-a-Changelog release section so anyone joining mid-stream can see "what shipped on Day 1" at a glance. Numbered release tagging starts at `[0.1.0-m0]` at end of M0 (target Day 10) per the convention below.

### Added — Database (BE PR #4, `a6644c1`)

- **`feat(db)`** — Prisma schema for TB-001..TB-021: 23 models + 18 enums covering users, projects, requirements, test cases, defects, runs, audit log, embeddings. Pgvector + HNSW indexes on embedding columns.
- **`feat(db)`** — Hand-written `apps/api/prisma/raw/init_rls_hnsw.sql`: enables `pgvector`, declares all RLS policies for the 23 tables, creates HNSW indexes for embeddings.
- **`feat(db)`** — Idempotent 8-user pilot seed at `apps/api/prisma/seed.ts`: Akshay Panchal (Lead), Yogesh Mohite (Admin), 6 named QA Engineers per CLAUDE.md Iksula data canon.

### Added — Frontend (FE PR #5, `711fa00`)

- **`feat(web)`** — F07 Founder Onboarding 3-step wizard at `/onboarding/`: organization details → invite team → confirm. Pattern A deferred routing (no `fetch` / `useMutation` / `axios` in onboarding components — routing is intent-only until backend wires up at MS0-T021). Implements PM1_UI_v2 F07 frame.

### Added — Conformance + workflow

- **89% Tech-project-forge skill conformance** (25/28 eval.json assertions met) — up from 18% baseline. Three remaining are justified deviations or P2 deferrals.
- **Worktree-based parallel-chat workflow proven** — 3 chats × 6+ commits each, merged with 1 minor MILESTONES.md conflict + 1 CI hotfix batch.
- **5 PRs squash-merged on Day 1**: PR #1 (BE security/CI/rules), PR #2 (FE RWD/rules/UI commands), PR #3 (baseline-CI hotfix), PR #4 (BE Prisma+RLS+seed), PR #5 (FE F07 wizard).

### Added — Memory + audit (Day 1, 2026-04-27)

- **`feat(hooks)`** — `inject-memory.sh` PreToolUse `*` hook (`dd1c8a3`). Auto-prepends `.claude/memory/memory.md` to every tool call so future Claude sessions on any machine see project memory without depending on user-session memory. Lifts eval.json assertion 24.
- **`docs(memory)`** — Seeded `.claude/memory/` system with 7 files from PM1 blueprint (`de66034`): `memory.md` (index), `general.md` (8-user roster, locked stack, R1–R4 risky assumptions), `domain/{architecture,bugs,api}.md`, `tools/{database,stack}.md`. Hard guard `! grep -rq '\${' .claude/memory/` passes. Lifts eval.json assertion 23.
- **`docs(audit)`** — Tech-project-forge skill alignment audit (read-only) at `docs/audits/2026-04-27-skill-alignment-audit.md`. Projected eval score: 5/28 today → 11/28 after P0 → 24/28 after P0+P1 → 27/28 after P0+P1+P2 (DESIGN.md justified deviation).

### Added — Auth surface (Day 0, 2026-04-26)

- **`feat(web)`** — F06c Reset Password React port at `/sign-in/forgot/` (`e0fda46`). Mode B forgot-flow landing: hero "Reset your password" + recipient email in mono + Strong-state strength card (4/4 with green s4) + AMBER pulse + 58-min expiry warning + "Back to sign in" link. RWD per Rule 12 verified at 320 / 1440. **Component change:** `PasswordStrengthCard` extended to derive segment + label color from `level` prop (Strong → green, Good → teal, Fair → amber, Weak → red); F06b "Good" rendering unchanged.
- **`docs(deploy)`** — F06c LIVE-URL screenshots from production (`4b05c74`).
- **`feat(web)`** — F06b Set Password React port at `/set-password/` (in `a2005cb`). Mode A invite landing: Welcome + 2 password fields with eye toggle + Good-state strength card + neutral 24-hour expiry indicator. Auth-surface duplicate brand mark omitted on desktop per Yogesh override; mobile-only BrandMark above form on `< lg`.
- **`feat(web)`** — F06 Sign In React port at `/sign-in/` (`9ccfdfd`). Two-panel layout, teal "Authenticate" CTA, violet "Contact Site Admin" admin-escalation link.
- **`feat(web)`** — Full RWD refactor of F06 + F06b (`a2005cb`). Removed `w-[1600px]` + `w-[800px]` fixed widths; introduced `flex min-h-screen flex-col lg:flex-row` + `flex-1` panels + `hidden lg:flex` brand panel + mobile-only BrandMark + hero typography scale `40px → 56px (xl:)`. NO horizontal scroll at any viewport ≥ 320 px (verified at 320 / 768 / 1024 / 1440 / 1920). Established **CLAUDE.md Hard Rule 12** (full RWD on every ported frame) + **Hard Rule 13** (visual confirmation gate before commit). Also includes Grammarly hydration false-positive fix (`suppressHydrationWarning` on `<body>`).

### Added — Deploy + infrastructure (Day 0, 2026-04-26)

- **`ops(deploy)`** — Cloudflare Pages wired for `apps/web` (`be9f3be`). Production at https://qa-nexus-web.pages.dev/ — $0/month free tier, Direct Upload mode. `next.config.ts` set to `output: 'export'` + `trailingSlash: true` + `images.unoptimized: true`. Root `/` redirect refactored to client-side useEffect (static export compat). `apps/web/wrangler.toml` + `pnpm deploy:web` script + `docs/deploy/cloudflare-pages.md` runbook. Commitlint type-enum extended to allow `ops`. Closes **MS0-T010** + **MS0-AC001**.
- **`docs(milestone)`** — `MS0-T034` RWD enforcement hook added to M0 v8 backlog (`bfe44dc`). P1, 4h, DevOps. Will block `w-[≥200px]` + `max-w-[1600px]` patterns in `apps/web/**` so the next 38 frame ports can't regress on Rule 12.

### Added — Backend scaffold (Day 0, 2026-04-26)

- **`feat(api)`** — NestJS 10 scaffold in `apps/api` (`0a1abcf`). Closes **MS0-T003**.

### Added — Frontend scaffold + hardening (Day 0, 2026-04-26)

- **`feat(hooks)`** — `enforce-pm1-stack.sh` upgraded with version-pin enforcement (`661249c`). Reads STDIN + parses package.json + compares each dep major against `.claude/locked-deps.json`, exits 2 on mismatch. Catches Next 16 / React 18 / Tailwind 3 etc. drift at scaffold time, not dry-run time. Closes **MS0-T033**.
- **`chore(stack)`** — Pin Next.js to `^15` + ESLint 9 flat config + PM1 design tokens (`4159a2a`). Locked-deps.json source of truth: next 15, react 19, tailwindcss 4, @nestjs/\* 10, prisma 5, node ≥ 20.

### Added — Initial scaffold (Day 0, 2026-04-26)

- **`chore`** — Monorepo root scaffold + binding specs (`79c77aa`). pnpm workspaces, apps/web, apps/api, packages/shared layout. Husky 9 + lint-staged + commitlint wired. PM1_PRD v8.1 + PM1_ERD v2.1 + Milestone_M0_Setup_v8.md + 41 locked HTML frames in place. CLAUDE.md with 11 hard rules (rules 12 + 13 added later in `a2005cb`). 5 PM1-custom hooks + 6 MCPs + Tech-project-forge-skill v1.4 installed and audited. Closes **MS0-T001** + **MS0-T006**.

---

## Notes for future contributors

This `[Unreleased]` section will roll into a numbered release at the end of each milestone:

- `[0.1.0-m0]` — at end of M0 (target Day 10). Will gather all infrastructure + auth-surface entries above.
- `[0.2.0-m1]` — at end of M1 (Users & Roles + RBAC + magic links).
- `[0.3.0-m2]` — at end of M2 (Docs + KB).
- ... through `[1.0.0]` at GA (M6, target 2026-09-21).

The `pre-push` git hook (P2.7) will eventually block pushes that change `apps/**` without a `[Unreleased]` bump. Until that hook lands, the convention is **manual: end-of-day, append the day's commits to `[Unreleased]`**.
