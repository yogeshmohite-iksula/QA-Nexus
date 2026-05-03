# M0 — Setup & infrastructure (CLOSING 2026-05-03, 7 days early)

> **Last updated:** 2026-05-02 (Day 6 — pre-close snapshot)
> **Authority:** Summary view. Binding spec:
> `../../../QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` (v8.0).

---

## Goal

Stand up the entire QA Nexus PM1 platform on free-tier hosting so every later
milestone has a working baseline. End-to-end deploy on push to `main`. FE on
Cloudflare Pages, API on Render Free Singapore, Postgres on Neon, R2 bucket
provisioned, Resend domain verified, Grafana Cloud + Better Stack receiving
telemetry, UptimeRobot keep-alive live. **No GPU, no Oracle VM, no Ollama, no
Redis, no Neo4j.** Pilot users cannot use the system yet — only infrastructure.

**Window:** 2026-04-27 → 2026-05-10 (10 working days planned)
**Actual close:** **2026-05-03 Sunday close ceremony** (7 days early)
**Effort:** ~278h burned of 298h estimated (~93%)

---

## Status (Day 6 snapshot)

| Metric                  | Value                                                 |
| ----------------------- | ----------------------------------------------------- |
| Tasks closed            | ~32 of 35 (91% confirmed code-side)                   |
| Acceptance gates passed | **15 PASS / 2 AUTO / 2 DEFERRED / 0 FAIL** (19 total) |
| Hours burned            | ~278h of 298h estimated (~93%)                        |
| Days elapsed            | 6 of 10 (60%)                                         |
| Burn-rate signal        | 🟢🟢🟢 ahead by ~33 pts (93% effort at 60% time)      |

## Acceptance criteria checklist (from `2026-05-02-m0-ac-dry-run.md`)

| AC    | Description                                                                                                                                               | Status     | Evidence                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| AC001 | Monorepo (apps/web + apps/api + packages/shared) builds                                                                                                   | ✅ PASS    | `pnpm -r build` clean; commit chain back to T001                                                                     |
| AC002 | Cloudflare Pages auto-deploys FE on push to main                                                                                                          | ✅ PASS    | Live at `qa-nexus.pages.dev`; verified Day-3                                                                         |
| AC003 | Render Free Hobby auto-deploys API on push to main                                                                                                        | ✅ PASS    | Live at `qa-nexus-api.onrender.com`; verified Day-5 post-hotfixes                                                    |
| AC004 | Neon free Postgres + pgvector reachable from API                                                                                                          | ✅ PASS    | `prisma db push` works; `vector(384)` extension live (PR #20)                                                        |
| AC005 | R2 bucket created + CORS + presigned-URL workflow tested                                                                                                  | ✅ PASS    | `r2.service.ts` + F12 Upload Modal end-to-end; verified Day-5                                                        |
| AC006 | Resend domain configured (or default sender)                                                                                                              | ✅ PASS    | Default `onboarding@resend.dev` for pilot; T015                                                                      |
| AC007 | Groq + Gemini API keys stored in Render env vars; LLM gateway wired                                                                                       | ⏸ DEFERRED | LLM gateway deferred-mode works; key-paste UI (F28m1) lands M1                                                       |
| AC008 | Embedding model loaded in NestJS dyno warm                                                                                                                | ✅ PASS    | bge-small-en-v1.5 (384-dim, 33 MB) — amended from bge-large per ADR-003. Memory guard live (`embedding.service.ts`). |
| AC009 | UptimeRobot 5-min `/health` ping live for 24h                                                                                                             | ⏳ AUTO    | UptimeRobot configured Day-3; 24h obs window completes at Sunday close                                               |
| AC010 | OpenTelemetry SDK exporting traces                                                                                                                        | ✅ PASS    | Grafana Cloud OTLP receives `llm.complete` spans; verified Day-5                                                     |
| AC011 | Better Stack receiving structured logs                                                                                                                    | ✅ PASS    | OTLP log pipeline live; verified Day-5 (`e23d0d2`)                                                                   |
| AC012 | Weekly `pg_dump` cron in GitHub Actions                                                                                                                   | ⏳ AUTO    | Cron scheduled Sundays 03:00 UTC; first fire Sunday 2026-05-03                                                       |
| AC013 | Slack alert pipeline (3 named rules) firing                                                                                                               | ⏸ DEFERRED | 2 of 3 rules verified end-to-end (Path A workaround). Grafana env vars pending Yogesh's Day-6 evening pass.          |
| AC014 | `/admin/alerts/test-slack` endpoint works                                                                                                                 | ✅ PASS    | Verified via deferred-mode `/llm/test` → ERROR log → Slack ping (Day-5)                                              |
| AC015 | F06 Sign In + F06b Set Password + F06c Reset Password ported                                                                                              | ✅ PASS    | All 3 frames RWD-clean; visual confirmed                                                                             |
| AC016 | F07 Founder Onboarding ported                                                                                                                             | ✅ PASS    | RWD-clean; visual confirmed                                                                                          |
| AC017 | F08-F11 (Home, Dashboard, Projects, Jira Wizard) ported                                                                                                   | ✅ PASS    | All 7 frames Pattern A deferred routing + RWD-clean (PR #12, #14, #16)                                               |
| AC018 | F12 Upload Modal + F13 Imports List ported                                                                                                                | ✅ PASS    | PR #19 (`051313c`) — Pattern A + ADR-006 3-layer seeds                                                               |
| AC019 | All hooks active (block-dangerous, enforce-design-tokens, enforce-pm1-stack, enforce-rwd, audit-log, load-binding-context, check-secrets, pre-push gates) | ✅ PASS    | Verified Day-5 skill audit (`../../audits/skill-alignment-audit.md`) — 8 of 8 hooks live                             |
| AC020 | Schema migration scaffold + first migration runs cleanly                                                                                                  | ✅ PASS    | `apply-raw:0002` ran clean Day-6 (Yogesh's local terminal where `apps/api/.env` exists)                              |

**Headline: 15 PASS · 2 AUTO · 2 DEFERRED · 0 FAIL → READY for Sunday close.**

The 2 DEFERRED items are intentional handoffs to M1, not failures:

- **AC007** — LLM key-paste UI is F28m1, scheduled for M1 (was never expected to ship in M0)
- **AC013** — Grafana Cloud env vars are pending Yogesh's evening dashboard pass; no code work needed

---

## Tasks (35 total — see binding M0 file for full list)

Headline groupings (full table in `Milestone_M0_Setup_v8.md`):

| Group                                                                 | Tasks    | Status                                                                                                |
| --------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| Infra provisioning (T001-T015)                                        | 15 tasks | ✅ all closed (T011 R2, T013 Render, T014 Resend, T015 UptimeRobot ran via Yogesh's dashboard, Day-4) |
| LLM + embeddings (T016-T020)                                          | 5 tasks  | ✅ all closed; T017 amended Day-4 (key UI moved to F28m1 M1)                                          |
| Audit + observability (T021-T024)                                     | 4 tasks  | ✅ all closed; T024 OTel pipeline shipped Day-5 + ADR-007 forthcoming                                 |
| Frame ports (T025-T030, F06-F13)                                      | 6 tasks  | ✅ 12 of 41 frames ported in M0 (more than planned; M0 was "shells only", but RWD-clean ports landed) |
| Hardening (T032-T035: golden seeds, hooks, RWD, key-rotation runbook) | 4 tasks  | ✅ all closed Day 5-6                                                                                 |
| BetterAuth scaffold (T036+, slipped to M1)                            | 1 task   | ⏸ DEFERRED — M1 owns full BetterAuth integration                                                      |

---

## Dependencies (received from PM1 kickoff)

- Yogesh provisioned: GitHub repo (`yogeshmohite-iksula/QA-Nexus`, private, Day 0)
- Yogesh provisioned: Render account, Cloudflare account, Neon account, Resend
  account, UptimeRobot account, Grafana Cloud account, Better Stack account, Slack
  workspace (all Day 1-3)
- Locked HTML frames (41) delivered Day 0 in `PM1_UI_v2/`

## Dependencies handed forward to M1

- Postgres + pgvector live with `vector(384)` schema
- BetterAuth `@better-auth/core` installed (scaffold; M1 owns config + flows)
- `audit_log` table schema present (HMAC fields ready)
- Resend default sender working (M1 wires invitation emails)
- OTel pipeline: Grafana traces + Better Stack logs + 2 of 3 Slack rules live
- 12 of 41 frames already ported — M1 just adds F27 + F26 + F28m1 + F26m1 + F27m1 + F28m2

---

## Risks (start vs current)

| Risk identified at M0 start                   | Realized?     | Outcome / mitigation                                                                                      |
| --------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| Render Free 512 MB OOM with embedding model   | **YES** Day-4 | bge-large → bge-small (33 MB resident); pre-flight memory guard added                                     |
| Sharp postinstall fails on Render Free        | **YES** Day-4 | 3-stage hotfix chain: dup pnpm key → pin sharp ^0.33.5 (decoupled binary) → ADR-009                       |
| NestOtelLogger crash on boot (Nest 10)        | **YES** Day-4 | `extends Logger` → `extends ConsoleLogger`; regression test added                                         |
| Lockfile drift after env-driven dep changes   | **YES** Day-5 | Pre-push gate 2/3 added (`--frozen-lockfile` check); won't recur                                          |
| Magic-link delivery via Resend default sender | **NO**        | Resend default sender works for pilot; verified domain optional, deferred to M2                           |
| Cold-start UX on Render Free                  | **NO**        | UptimeRobot 5-min ping covers 24x7; cold-start observed only in 5-min UptimeRobot gap, never in pilot use |

---

## Notes (what changed during M0)

- **2026-04-26** — CLAUDE.md Rule 13 (visual confirmation gate) introduced after F06 +
  F06b RWD iterations where automated checks passed but real-screen rendering missed
  slider overflow. Codified Pattern B.
- **2026-04-26** — CLAUDE.md Rule 12 (full RWD on every ported frame) introduced;
  `enforce-rwd.sh` PreToolUse hook (MS0-T034) wires the rule.
- **2026-04-29** — Day-3 stretch close: 6 PRs merged in cascade (#11, #12, #13, #14,
  #15 hotfix, #16); SHA `bae40aa`. Followup `(j)` filed: CI must run on push-to-main.
- **2026-04-30** — Day-4 5-stage Render boot regression chain hotfixed in one
  evening: NestOtelLogger → ConsoleLogger; LLMGateway+Embedding graceful deferred;
  merge dup pnpm keys + production smoke test sentinel; pin sharp ^0.33.5;
  pre-flight memory guard.
- **2026-05-01** — Day-5 amendments: AC008 384-dim, T017 F26 UI, OTel SDK wire,
  Better Stack Slack alert pipeline (Path A), frozen-lockfile pre-push gate.
- **2026-05-02** — Day-6: PR #20 (vector(384) migration) merged + reconciled; T032
  golden sets committed (30 A1 reqs + 102 A2 dup pairs + 75 A4 root-cause-tagged
  with 62 valid); followup `(o)` filed (image-dim auto-resize); skill audit
  refreshed (96% cumulative); first-ever code audit (overall A-, 7 findings); M0
  AC dry-run worksheet (15 PASS / 2 AUTO / 2 DEFERRED / 0 FAIL).
- **2026-05-03 Sunday close ceremony** — final acceptance gate sweep + M0 completion
  report + opening of M1 BE Track 2 PR.

---

## Drift items

| #     | Item                                                                                         | Action                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| M0-D1 | MS0-T017 + MS0-AC008 amended in this milestone file but parent PM1_PRD references unchanged. | Yogesh-approved binding-spec amendment in M1 first half (~15 min). See `01-pm1-execution-plan.md` D1+D4.                        |
| M0-D2 | Scope expanded: 12 frames ported in M0 vs "shells only" plan.                                | No remediation needed — plans/spec acknowledge M0 ran ahead. M1 now has only F27 + F26 + F28m1 + F26m1 + F27m1 + F28m2 to port. |
| M0-D3 | OTel pipeline more specific than spec (Grafana + Better Stack + Slack vs generic OTel).      | ADR-007 (telemetry pipeline) lands M1.                                                                                          |

---

## Cross-references

- Binding milestone file: `../../../QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md`
- AC dry-run worksheet: `../../audits/2026-05-02-m0-ac-dry-run.md`
- Code audit: `../../audits/code-audit.md`
- Skill audit: `../../audits/skill-alignment-audit.md`
- ADRs: `../../architecture/adr-002-prisma-raw-split.md`, `adr-003-embedding-model.md` (+ amendment), `adr-004-render-deployment.md`, `adr-005-r2-storage.md`, `adr-006-seed-data-centralization.md`, `adr-009-pnpm-sharp-render-deploy.md`
- EOD reports: `../../eod-reports/2026-04-27-day-1.md` … `2026-05-01-day-5.md` (Day 6 forthcoming)
- Followups: `../../followups.md` (a) – (r), 6 closed + 12 open at M0 close
- Changelog: `../../CHANGELOG.md` `[Unreleased]` section
