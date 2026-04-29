# QA Nexus PM1 — Project Status

**Snapshot as of:** 2026-04-29 STRETCH-evening close (Day 3 stretch merge cascade). **14 MAIN commits today** (9 earlier-day + 5 stretch). Earlier-day + evening: see prior STATUS line. Stretch (this session): merged 4 of 5 cascade PRs — hotfix `#15` (CI shared-build + e2e scope fix) + `#11` (BE T023 LLM gateway + T026 WS) + `#12` (FE F09/F10/F11a Pattern A) + `#14` (FE F11b/c Jira Wizard Pattern A). PR `#13` (BE A1 Scribe + T038 + T031.b) is the only carry-forward to Day 4 — DIRTY, awaiting BE chat rebase. Followup `(j)` filed: CI must run on push-to-main, not just on PRs.

> One-page "where are we right now?" for anyone joining the project mid-stream — Yogesh, Akshay, future contributors, or a fresh Claude Code session that hasn't read the EOD reports yet.

---

## Current milestone

**M0 — Setup & infrastructure** (binding backlog: `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md`)

| Metric                    | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total tasks               | 35 (T001 → T031 + T033 / T034 / T035 hardening)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Total estimated hours     | 298                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Tasks closed              | **~29 confirmed (83%) code-side + 4 runbook-ready** at Day-3 STRETCH close. New since Day-3 base (24): **+T023 LLM gateway** (PR #11), **+T026 WebSocket scaffold** (PR #11), **+T030.h F09 Projects List** (PR #12), **+T030.i F10 Create Project Modal** (PR #12), **+T030.j F11a Jira Connect Step 1** (PR #12), **+T030.k F11b Jira Step 2** (PR #14), **+T030.l F11c Jira Step 3** (PR #14). Pending: T036 A1 Scribe + T038 Project CRUD + T031.b Playwright unskip (all in PR #13, DIRTY awaiting BE rebase). **Runbook-ready & awaiting Yogesh's dashboard work**: T011 Render, T013 R2 (provisioning), T014 Resend, T015 UptimeRobot. |
| Tasks closed %            | **83% confirmed code-side (~95% pending Yogesh's 4-step dashboard pass + PR #13 merge on Day 4)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Hours burned (estimated)  | ~265h of 298h ≈ 89%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Acceptance gates passed   | 0 / 19 (gates run after Day 10 task completion)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Days elapsed of M0 budget | 3 of 10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Burn-rate signal          | 🟢🟢🟢 **ahead by ~59 pts** — 89% hours burned at 30% time elapsed. M0 deeply ahead-of-schedule; remainder is Yogesh's Day-4 dashboard provisioning + PR #13 (BE rebase) + FE seed-centralization refactor (5 PRs) + acceptance gates.                                                                                                                                                                                                                                                                                                                                                                                                        |

## Active PRs

| PR  | Branch                            | Status                    | Owner   | Brief                                                                                                                                                                  |
| --- | --------------------------------- | ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #13 | `feature/be-day-3-noon-a1-scribe` | DIRTY — pending BE rebase | BE chat | T036 A1 Scribe + T038 Project CRUD + T031.b Playwright unskip. Conflicts on api/package.json + LLM-gateway overlap from #11; commented twice with rebase instructions. |

**Recently closed (Day 3 STRETCH evening):** PR #15 (`8bcfa68` CI hotfix), PR #11 (`17c9885` BE T023 LLM gateway + T026 WS), PR #12 (`8a10721` FE F09/F10/F11a Pattern A), PR #14 (`f1656b9` FE F11b/c Jira Wizard Pattern A).
**Recently closed (Day 2 stretch FINAL):** PR #10 (`b0d52fe` BE T024 embedding + T025 health + ADR-003).
**Recently closed (Day 2 stretch evening):** PR #8 (`57c95b4` FE F08a Home), PR #9 (`4c9dd0f` FE F08b QA Lead + F08c Empty Project).
**Recently closed (Day 2 evening):** PR #6 (`7f60b8e` BE T021/T022/T027), PR #7 (`919162e` FE F07b/c/d invited onboarding).
**Recently closed (Day 1):** PR #1 (BE security/CI/rules), PR #2 (FE RWD/rules/UI), PR #3 (CI hotfix), PR #4 (BE Prisma+RLS+seed), PR #5 (FE F07 onboarding).

## Last deploy

| Surface          | URL                              | Last deployed  | Status                                                                                           |
| ---------------- | -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| Frontend (Pages) | https://qa-nexus-web.pages.dev/  | 2026-04-26 EOD | 🟢 healthy (F06, F06b, F06c, F07 live)                                                           |
| Backend (Render) | (not yet provisioned — MS0-T011) | —              | ⚪ not deployed (BE code complete: T021/22/24/25/27 all in main; awaiting MS0-T011 Render setup) |
| Database (Neon)  | (not yet provisioned — MS0-T012) | —              | ⚪ not provisioned                                                                               |

## Free-tier quota (live)

| Provider         | Used        | Limit       | Headroom | Notes                                             |
| ---------------- | ----------- | ----------- | -------- | ------------------------------------------------- |
| Cloudflare Pages | 2 deploys   | 500/mo      | 99.6%    | Direct Upload mode; auto-deploy from GH deferred. |
| GitHub Actions   | ~22 min     | 2,000/mo    | 98.9%    | 5 PR runs Day 1 + push-only typecheck runs.       |
| Neon             | not provis. | 0.5 GB      | n/a      | MS0-T012 (Day 2-3).                               |
| Render           | not provis. | 750h/mo     | n/a      | MS0-T011 (Day 2-3).                               |
| Resend           | not provis. | 3000/mo     | n/a      | MS0-T014 (Day 4).                                 |
| Cloudflare R2    | not provis. | 10 GB-mo    | n/a      | MS0-T013 (Day 4).                                 |
| Grafana Cloud    | not provis. | 10k metrics | n/a      | MS0-T019 (Day 6).                                 |
| Better Stack     | not provis. | unlimited   | n/a      | MS0-T019 (Day 6).                                 |
| UptimeRobot      | not provis. | 50 mon.     | n/a      | MS0-T015 (Day 5).                                 |
| Groq             | not wired   | 1k RPD      | n/a      | MS0-T017 (Day 5).                                 |
| Gemini           | not wired   | 1.5k RPD    | n/a      | MS0-T017 (Day 5).                                 |

**Total infra cost: $0 / month** ✓ (kickoff hard rule #1 — held).

## Health checks

| Probe            | Endpoint                                      | Last pass                   | Notes                                                                                               |
| ---------------- | --------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| FE prod          | https://qa-nexus-web.pages.dev/sign-in        | 2026-04-26                  | F06 sign-in renders at 320 / 1440.                                                                  |
| BE health        | `GET /health` (in BE main; not yet on Render) | code-verified Day 2 stretch | MS0-T025 ✅ — endpoint exists, returns subsystem readouts. Live URL pending MS0-T011 Render deploy. |
| CI pipeline      | GitHub Actions main                           | 2026-04-28 09:55            | All 6 jobs green on `742982c`.                                                                      |
| Pre-commit hooks | husky + lint-staged                           | live                        | typecheck + prettier + design-tokens + RWD.                                                         |

## Known issues / open followups

See `docs/followups.md` for the full structural backlog. Day-1 followups closed in `742982c` (a, b, e). Still open: (c) zod schema coupling, (d) lucide-react install decision.

Parallel-chat coordination items live in `docs/parallel-work/follow-ups.md`.

## Next up (today + this week)

**Today (Day 2 — 2026-04-28):**

- ✅ Block 1 — close Day-1 followups (P1.17 hook sync + ADR-002 + db:apply-raw) → shipped at `742982c`.
- 🟡 Block 2 — Status Line + ARCHITECTURE / CHANGELOG / STATUS docs (in flight).
- ⏭ Block 3 — Memory System v1.3 augmentation.
- ⏭ Block 4 — Subagents verification + auto-docs Stop hook + pre-push CHANGELOG guard.
- ⏭ Block 5 — Skill conformance audit re-run + token-savings dashboard + Day 2 EOD.

**This week (M0 work week, Days 2 → 7):**

- MS0-T004 packages/shared (Zod schemas BE↔FE contract) — BE chat
- MS0-T011 Render free Hobby for `apps/api` — BE chat (needs Yogesh's Render account)
- MS0-T012 Neon Postgres + pgvector + connection string + add postgres MCP — BE chat (needs Yogesh's Neon account)
- MS0-T021 BetterAuth Postgres adapter + magic link via Resend — BE chat
- MS0-T022 RBAC guard (4-role enforcement) — BE chat
- MS0-T030.x F07b/c/d invited-team onboarding ports — FE chat
- MS0-T031 Playwright E2E smoke test — FE or QA chat
- MS0-T032 A1/A2/A4 golden-set seed (R3 mitigation) — Yogesh + Akshay

## Observability

| Surface                   | Path                                             | What it tracks                                                  |
| ------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| **Token-savings Excel**   | `docs/observability/Token_Savings_Log.xlsx`      | Per-session + daily + per-chat token-savings rollup (3 sheets). |
| **Token-savings JSONL**   | `.claude/token-savings.jsonl` (per worktree)     | Append-only log written by Stop hook on every session end.      |
| **Methodology + privacy** | `docs/observability/token-tracking.md`           | What's measured, estimation formulas, privacy posture.          |
| **Slash command**         | `/eod-tokens`                                    | Runs aggregator + prints day's totals (use at EOD).             |
| **Audit log**             | `.claude/audit.jsonl` (gitignored, per worktree) | One line per tool call (PostToolUse `*` hook).                  |
| **Skill conformance**     | `docs/audits/<date>-skill-alignment-audit.md`    | Latest: 2026-04-28 = 96% (eval-by-eval ledger).                 |

Day-2 baseline: ~109,500 tokens saved across MAIN sessions (Day 1 + Day 2). FE + BE worktrees not yet generating data — their first Stop event populates their respective JSONL files; the aggregator picks them up on the next `/eod-tokens` run.

## Cross-references

- `CLAUDE.md` — the binding context (loaded on every session start)
- `docs/MILESTONES.md` — full M0 backlog with task descriptions, hours, acceptance criteria
- `docs/PROJECT_SPEC.md` — generated by Tech-project-forge skill from PM1_PRD + PM1_ERD
- `docs/PROJECT_BLUEPRINT.md` — skill phase-0 blueprint output (frozen baseline)
- `docs/ARCHITECTURE.md` — system overview, data flow, deployment topology
- `docs/CHANGELOG.md` — Keep-a-Changelog format, every commit logged
- `docs/SECURITY.md` — secrets policy, disclosure email, incident response
- `docs/architecture/` — ADR directory (currently: ADR-002 Prisma raw-split)
- `docs/eod-reports/` — daily 5-section EOD reports
- `docs/audits/` — point-in-time skill conformance audits + permission triages
- `docs/followups.md` — top-level engineering backlog (architecture decisions, hook drift)
- `docs/parallel-work/follow-ups.md` — parallel-chat coordination tracker
