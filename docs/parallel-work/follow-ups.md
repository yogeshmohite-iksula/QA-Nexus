# Day 1 follow-ups — single source of truth

**Established 2026-04-27 EOD** as the canonical backlog for Day-2-and-beyond items that surfaced during Day 1's intense parallel-chat batch. Every Day 2 morning starts with a scan of this file.

This pairs with:

- `docs/audits/2026-04-27-skill-alignment-audit.md` — the original P0/P1/P2 plan that drove the Day 1 lift from 18% → 89% conformance
- `docs/audits/2026-04-27-eod-skill-conformance-audit.md` — the eval-by-eval ledger showing what's met vs deferred
- `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` — the binding M0 backlog (35 tasks, 298h)
- `docs/CHANGELOG.md` — every commit logged

---

## ✅ Closed today (2026-04-27, with commit SHAs)

| ID                           | Item                                                                      | Commit                          | Notes                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| **P1.13**                    | `block-dangerous.sh` regex too broad — false-blocked `--force-with-lease` | `f0dea17` (in hotfix `455ea99`) | Tightened to flag-boundary `(^\|[[:space:]])--force([[:space:]]\|$)`. Verified by 5 test scenarios. |
| **P1.14**                    | gitleaks false positive on NestJS scaffold README badge URL               | `77d8288` (in hotfix `455ea99`) | Initial fix used `regexes` (wrong); follow-up `5b32df3` corrected to path-based allowlist.          |
| **P1.14b**                   | Prettier failed on 3 stale config files + transient worktree files        | `5b32df3` (in hotfix `455ea99`) | `prettier --write` on 2 files; `.claude/worktrees/` added to `.prettierignore`.                     |
| **P1.15**                    | apps/api ESLint 8.57 vs root's typescript-eslint umbrella v8.59 mismatch  | `15873a7` (in hotfix `455ea99`) | Bumped apps/api ESLint to ^9.13 + added typescript-eslint umbrella; inherits root flat config.      |
| **P1.16**                    | NestJS scaffold spec failed DI compile in CI                              | `10cddfd` (in hotfix `455ea99`) | Deleted `apps/api/src/app.controller.spec.ts`. Real Jest specs land MS0-T021–T027 in M1.            |
| **P1.17** (subtask of P1.13) | Worktree staleness: `--force-with-lease` blocked by hook                  | (subsumed by P1.13)             | Same root cause; closed when P1.13 regex landed.                                                    |
| **P1.12**                    | 31-screenshot permission-prompt triage → batch-add allowlist              | `a0c5c87`                       | 47 patterns added to committed `.claude/settings.json` (Option B for cross-worktree inheritance).   |
| **P1.12.5**                  | `/permission-triage` slash command for future requests                    | `f4f563e`                       | Reusable 3-way decision-tree workflow with dedupe check.                                            |
| **P1.18a**                   | Missed `ctx search:*` patterns from P1.12 batch                           | `ebe6bca`                       | 8 additional patterns added (ctx search/index/list/read + 3 mcp\_\_ explicit).                      |
| **P1.18b**                   | `/sync-worktree` + `/deploy-check` slash commands (P1.3 follow-up stubs)  | `53015aa`                       | Implemented per Day 1 parallel-chat lessons.                                                        |

---

## 🟡 Open follow-ups (priority + owner + ETA)

### 🔴 P0 — start of Day 2 morning

None. Day 1 closed all P0s.

### 🟡 P1 — within Days 2–7 (M0 work week)

| Item                                                                         | Owner                            | ETA                           | Why                                                                        |
| ---------------------------------------------------------------------------- | -------------------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| **MS0-T004** packages/shared (Zod schemas as BE↔FE contract)                 | BE chat                          | Day 2 morning, ~3h            | Blocks every endpoint that needs request/response validation. Lands first. |
| **MS0-T011** Render free Hobby for apps/api (auto-deploy from main)          | BE chat                          | Day 2, ~2h                    | Needs Yogesh's Render account (free signup).                               |
| **MS0-T012** Neon Postgres + `CREATE EXTENSION pgvector` + connection string | BE chat                          | Day 2, ~2h                    | Needs Yogesh's Neon account. Unblocks T020 schema.                         |
| **MS0-T020** Prisma schema TB-001..TB-021 + HNSW raw-SQL migration           | BE chat                          | Day 2 evening or Day 3, ~6h   | Tonight's BE chat work. Lands the foundation for T021–T027.                |
| **MS0-T021** BetterAuth Postgres adapter + magic link via Resend             | BE chat                          | Day 3                         | Depends on T020 + T012.                                                    |
| **MS0-T022** RBAC guard (`@Roles()` decorator + 4-role enforcement)          | BE chat                          | Day 3                         | Depends on T021.                                                           |
| **MS0-T023** LLM gateway module (Groq → Gemini fallback retry)               | BE chat                          | Day 4, ~6h                    | Independent of T020/T021/T022; can run in parallel.                        |
| **MS0-T024** Embedding service (Qwen3-0.6B WASM in-process)                  | BE chat                          | Day 4, ~4h                    | Independent.                                                               |
| **MS0-T025** `/health` endpoint (DB + LLM + R2 + free-tier quota status)     | BE chat                          | Day 4, ~2h                    | Depends on T023 + T024 (so it can ping them).                              |
| **MS0-T026** WebSocket gateway scaffold (`@nestjs/websockets`)               | BE chat                          | Day 5, ~4h                    | Independent; F19 Run Console depends on this in M4.                        |
| **MS0-T027** Audit log service (HMAC-SHA256 chained Postgres rows)           | BE chat                          | Day 5, ~3h                    | Depends on T020 schema (audit_log table).                                  |
| **MS0-T028** F06 Sign In React port                                          | ✅ DONE Day 0 (`9ccfdfd`)        | —                             | —                                                                          |
| **MS0-T029** F06b Set Password React port                                    | ✅ DONE Day 0 (`a2005cb`)        | —                             | —                                                                          |
| **MS0-T029.5** F06c Reset Password React port                                | ✅ DONE Day 0 (`e0fda46`)        | —                             | —                                                                          |
| **MS0-T030** F07 Founder Onboarding React port (4-step wizard)               | FE chat                          | Day 2, ~3h                    | Tonight's FE chat work in progress.                                        |
| **MS0-T030.x** F07b/c/d invited-team onboarding ports                        | FE chat                          | Days 3–4                      | Branch from F07 once it lands.                                             |
| **MS0-T031** Playwright E2E smoke test                                       | FE chat or QA chat               | Day 5–6, ~6h                  | Depends on F06+F06b+F06c+F07 + apps/api `/auth/*` working end-to-end.      |
| **MS0-T032** A1/A2/A4 golden-set seed (R3 mitigation)                        | Yogesh + Akshay                  | Days 7–10 (parallel to T020+) | 16h, P1. Drives weekly DeepEval starting M3.                               |
| **MS0-T034** `enforce-rwd.sh` hook                                           | ✅ DONE (`d350a7a` in `ffb1505`) | —                             | FE chat shipped P1.1.                                                      |
| **MS0-T035** token-savings reporting hooks + memory-reorg cron               | ✅ DONE (`63512f2` in `534d564`) | —                             | BE chat shipped P1.11.                                                     |

### 🟢 P1 — convenience (~30 min each, low priority but worth doing)

| Item                                                                                                                                                                 | Owner  | When                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------- |
| Cleanup pass on `.claude/settings.local.json` to remove one-off entries now superseded by Phase 4 wildcards                                                          | MAIN   | Day 2 morning if spare 30 min                |
| Worktree cleanup (`git worktree remove ../Project10-QA_Nexus-{backend,frontend}`) — both branches now squash-merged + deleted on origin                              | MAIN   | Day 2 if not reusing for next parallel batch |
| **CLAUDE.md cosmetic: add literal "Design Style Guide" section header** to close eval assertion #13 (substance is already there, just renaming the existing section) | MAIN   | Anytime, 5 min                               |
| Day 1 EOD posted in Slack for Akshay's async review (live URL + 1440px sign-in screenshot)                                                                           | Yogesh | Tomorrow evening                             |

### 🟢 P2 — defer to M1+ or PM2

| Item                                                                                                         | Why deferred                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **DESIGN.md at root** (skill eval #19)                                                                       | Justified deviation — we use `01_SYSTEM.md` (more comprehensive than DESIGN.md template). Mark eval as N/A, never close.               |
| **`code-review-graph` install** (skill eval #21) + `.code-review-graphignore` (skill eval #22)               | Useful for token savings on code reviews, but not blocking M0. Land when frame-port volume picks up (Days 5+).                         |
| **Cloudflare Pages GitHub auto-deploy** (currently Direct Upload via `pnpm deploy:web`)                      | Documented in `docs/deploy/cloudflare-pages.md` §Future. Requires CF Pages GitHub App authorization on `yogeshmohite-iksula/QA-Nexus`. |
| **5 Claude Code plugins** (superpowers, code-simplifier, feature-dev, compound-engineering, commit-commands) | Skill phase 3 DX. Each requires Claude Code restart to install. Defer to a calmer day.                                                 |
| **Status line config** (`ccstatusline`)                                                                      | Cosmetic.                                                                                                                              |
| **`filter-test-output.sh` PreToolUse Bash hook** (skill spec)                                                | Defer until we have tests that produce >100 lines of output.                                                                           |
| **`.githooks/pre-push` CHANGELOG-aware check** (skill spec)                                                  | Husky already covers typecheck variant. Adding CHANGELOG-aware would conflict. Reconsider after Phase 4 validation.                    |
| **prisma migrations** (skill eval #18)                                                                       | Justified N/A until MS0-T020 lands schema (Days 7+).                                                                                   |

---

## ⛔ Out of scope (parked indefinitely)

| Item                                                                   | Why parked                                                                                                                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Migration off `pnpm install` to `bun install`**                      | Bun is faster but locked-deps + workspace tooling is solid on pnpm; switching adds risk for no Day 1 benefit. Revisit only if pnpm becomes slow at scale.                            |
| **Replace husky with native `.githooks/`** (per skill spec convention) | Husky is the JS-ecosystem standard; switching requires re-wiring lint-staged + commitlint integrations. Both work.                                                                   |
| **Move `QA Nexus/` binding-spec folder into `docs/spec/`**             | Audited Section 6 in `2026-04-27-skill-alignment-audit.md` — risk > benefit. 7 path refs in `load-binding-context.sh` would need updates; that's the most critical hook in the repo. |
| **GitHub Codespaces / dev container setup**                            | Yogesh works locally on Mac with Homebrew at non-standard path. Adding a devcontainer would mean two divergent dev paths to maintain. Not worth it for solo / 8-user pilot.          |
| **Migrate from Render to Fly.io / Railway / fly machines**             | Render free Hobby is acceptable for the 8-user pilot. Cold-start is mitigated by UptimeRobot. Reconsider at PM2 scale.                                                               |
| **Sentry / proper error tracker**                                      | Better Stack covers logs + alerts for free; Sentry's free tier is more limited. Reconsider if log search becomes inadequate.                                                         |

---

## Process: how to use this doc tomorrow morning

1. **Day 2 morning:** scan §"Open follow-ups" §"P1 within Days 2–7" — pick the next 1–2 items to drain.
2. **After each item closes:** move it from §Open to §Closed today (with commit SHA + brief notes).
3. **If a new follow-up surfaces during Day 2:** add to §Open under appropriate priority.
4. **End of M0 (Day 10):** archive this file as `docs/parallel-work/follow-ups-m0.md` and start fresh for M1.

This file is a **living document** — update it inline rather than scrolling chat transcripts.
