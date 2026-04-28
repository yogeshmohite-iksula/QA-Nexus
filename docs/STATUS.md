# QA Nexus PM1 — Project Status

**Snapshot as of:** 2026-04-28 (Day 2, mid-morning IST). Re-generated at the end of every working day; intermediate updates allowed when major events land. The `/whats-next` slash command (planned) will eventually auto-rebuild this file.

> One-page "where are we right now?" for anyone joining the project mid-stream — Yogesh, Akshay, future contributors, or a fresh Claude Code session that hasn't read the EOD reports yet.

---

## Current milestone

**M0 — Setup & infrastructure** (binding backlog: `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md`)

| Metric                    | Value                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Total tasks               | 35 (T001 → T031 + T033 / T034 / T035 hardening)                                                                                             |
| Total estimated hours     | 298                                                                                                                                         |
| Tasks closed              | 9 (T001, T003, T006, T010, T020, T020.5, T028, T029, T029.5, T030, T033, T034, T035)                                                        |
| Tasks closed %            | ~26% by count                                                                                                                               |
| Hours burned (estimated)  | ~96h of 298h ≈ 32%                                                                                                                          |
| Acceptance gates passed   | 0 / 19 (gates run after Day 10 task completion)                                                                                             |
| Days elapsed of M0 budget | 2 of 10                                                                                                                                     |
| Burn-rate signal          | 🟢 on track (~32% hours burned at day-2-of-10 = 20% time elapsed; ahead by ~12 pts because Day 1 was unusually heavy on parallel-chat lift) |

## Active PRs

| PR  | Branch      | Status | Owner | Brief                                                   |
| --- | ----------- | ------ | ----- | ------------------------------------------------------- |
| —   | (none open) | —      | —     | Day 2 morning — MAIN session running solo on followups. |

**Recently closed (Day 1):** PR #1 (BE security/CI/rules), PR #2 (FE RWD/rules/UI), PR #3 (CI hotfix), PR #4 (BE Prisma+RLS+seed), PR #5 (FE F07 onboarding).

## Last deploy

| Surface          | URL                              | Last deployed  | Status                                 |
| ---------------- | -------------------------------- | -------------- | -------------------------------------- |
| Frontend (Pages) | https://qa-nexus-web.pages.dev/  | 2026-04-26 EOD | 🟢 healthy (F06, F06b, F06c, F07 live) |
| Backend (Render) | (not yet provisioned — MS0-T011) | —              | ⚪ not deployed                        |
| Database (Neon)  | (not yet provisioned — MS0-T012) | —              | ⚪ not provisioned                     |

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

| Probe            | Endpoint                               | Last pass        | Notes                                       |
| ---------------- | -------------------------------------- | ---------------- | ------------------------------------------- |
| FE prod          | https://qa-nexus-web.pages.dev/sign-in | 2026-04-26       | F06 sign-in renders at 320 / 1440.          |
| BE health        | (not yet exposed)                      | —                | MS0-T025 lands the `/health` endpoint.      |
| CI pipeline      | GitHub Actions main                    | 2026-04-28 09:55 | All 6 jobs green on `742982c`.              |
| Pre-commit hooks | husky + lint-staged                    | live             | typecheck + prettier + design-tokens + RWD. |

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
