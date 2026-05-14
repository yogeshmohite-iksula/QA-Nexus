# Milestone M4 — Runs, Defects & Jira (v2)

> **STATUS:** ACTIVE — M4 kickoff Day-18 Thu 2026-05-14.
> **Predecessor:** M3 closed 2026-05-13 (tag `m3-closed-2026-05-13` → `a98797b`).
> **Successor:** M5 (Hardening + Pilot Cutover, target 2026-05-20).
>
> This v2 doc supersedes the v1.0 `Milestone_M4_Runs_Defects_Jira.md` (Apr 25 draft, ~530 lines). Only the v2.1 amendment block (lines 3-16 of v1) remains binding; the rest of v1 referenced banned tooling (Hatchet, Ollama, LangGraph, Langfuse, Unleash, Doppler, Oracle, Vercel, MSW) and is fully superseded here.
>
> **Authored:** Day-17 PM 2026-05-13 (scratch) → promoted Day-18 AM 2026-05-14 (this file).

---

## 1. Headline + binding spec refs

- **Milestone:** **M4 — Runs, Defects & Jira (2-way sync + Sherlock A4 RCA agent)**
- **Sprint:** Sprint 42 of PM1 (continuation per CLAUDE.md "Iksula data canon")
- **Duration:** **3 days compressed + Sun reserve** — Day-18 Thu May 14 → Day-20 Sat May 16; Day-21 Sun May 17 = reserve / slip-buffer
- **Compression rationale:** M3 absorbed +1 day (Day-16 quota block + 5-fix BetterAuth chain). M4 restores the original 18-week PM1 schedule via 3-day compression. Sun reserve is explicit, not implicit — if Day-20 EOD signals slip, M4 close moves to Sun PM, not Mon AM (M5 kickoff must stay Mon May 18).
- **Binding refs:**
  - `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` v8.1 §12.3 (Runs, Defects + Jira surface)
  - `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` v2.1 §3.6 (TB-009 test_runs), §3.7 (TB-010 run_results), §3.8 (TB-011 defects), §3.9 (TB-012 defect_attachments), §3.10 (TB-013 jira_sync_log)
  - v1.0 `Milestone_M4_Runs_Defects_Jira.md` v2.1 amendment block (lines 3-16) — ONLY binding portion of v1 doc
  - `docs/milestones/m3-close-report.md` — M3 predecessor handoff
  - `docs/retros/2026-05-13-m3-retro.md` — M2+M3 retro (action items 1-5 folded into M4 ACs below)

---

## 2. Day-by-day breakdown (3-day compressed + Sun reserve)

### Day-18 (Thu 2026-05-14) — full day, M4 kickoff

**MAIN:**

- Merge M3 close PRs #141 / #142 / #143 (DONE ~08:00 IST)
- Push tag `m3-closed-2026-05-13` → `a98797b` (DONE)
- Promote M4 v2 plan: `.claude/scratch/m4-v2-plan-skeleton.md` → this file
- Commit parallel mirror to `~/Claude Cowork Workspace/AI Based QA Platform/` (two-folder workflow)
- Open PR `docs(m4): M4 v2 plan (Runs/Defects/Jira, 3-day compressed + Sun reserve) [M4 kickoff]`
- File followup `(bq)` raw-body webhook middleware design
- EOD Day-18 report (canonical `docs/eod-reports/2026-05-14-day-18.md`)

**BE+1:**

- ADR-015 Sherlock prompt strategy (gpt-oss-120b primary / gpt-oss-20b L1-fast / Gemini Flash fallback; OpenTelemetry tracing; `Promise.all` parallel — NOT LangGraph)
- TB-009 `test_runs` + TB-010 `run_results` Prisma migration (0005 raw SQL pattern per Day-13 protocol)
- Run service Pattern A scaffold: `POST /api/projects/:projectId/runs` returns 501 with NotImplementedError + audit row
- Defect service Pattern A scaffold: `POST /api/projects/:projectId/defects` returns 501 + audit row
- M4 close-gate test sweep `@M4-CLOSE-GATE` authoring (≥30 assertions, scaffolded Day-1 — NOT deferred per M3 retro action item 1)
- WebSocket gateway scaffold (`@nestjs/websockets` + `ws` single-instance, NO Redis pub/sub)
- Jira REST API v3 client scaffold (OAuth 2.0 3LO discovery + token exchange; API token fallback for MVP if Yogesh confirms)

**FE+1:**

- F19 Run Console real wiring (already Pattern A from M3 close, now subscribe to `/api/projects/:projectId/runs/:runId/stream` WebSocket — Pattern A returns canned event-stream)
- F20 Run Results Pattern A scaffold (per-test-case status drill-down, canned data)
- F21 Defects Hub Pattern A scaffold (canned list)
- AdminShell canonical realignment carryover from M3 close (verify F19 React canonical = F15 v2 shell tokens — per Hard Rule 14 Day-17 amendment)

### Day-19 (Fri 2026-05-15) — full day

**BE+1:**

- Run service real impl: lifecycle `pending → running → passed/failed/blocked`, idempotent state transitions, audit row per transition
- Run results real impl: per-test-case status + timing + screenshots/logs URL refs (R2 presigned)
- Defect service real impl: CRUD + status workflow + Jira link field
- **Sherlock A4 RCA agent Pattern B** (real LLM call, golden-corpus evaluation):
  - Primary: `openai/gpt-oss-120b` via Groq
  - L1-fast: `openai/gpt-oss-20b` via Groq
  - Fallback: `gemini-2.5-flash`
  - Parallel multi-agent via `Promise.all` (NOT LangGraph, NOT Hatchet)
  - OpenTelemetry span per LLM call (provider / model / latency / token-in / token-out / outcome)
  - Confidence score in response payload (`0.0..1.0`)
- Jira webhook receiver (HMAC-SHA256 verify with raw-body middleware — see R002)
- Run-to-defect auto-link: first failed `run_result` triggers defect draft

**FE+1:**

- F20 Run Results real wiring (live drill-down)
- F21 Defects Hub real wiring (filter / sort / drilldown)
- F22 Defect Detail Pattern A scaffold
- F22 Defect Detail Pattern B (real Jira link + Sherlock RCA panel)
- **F22 "needs human review" UI affordance** for any Sherlock RCA with `confidence < 0.5` — amber banner + "Sherlock is unsure — please verify the root cause" + disable-auto-Jira-create + manual override button. Per Day-18 user directive.

### Day-20 (Sat 2026-05-16) — M4 close day

**BE+1:**

- M4 close-gate test sweep `@M4-CLOSE-GATE` polished (authored Day-18, finalized Day-20)
- Audit chain HMAC verification for all run / defect / jira_sync_log events
- Run-defect-Jira E2E integration test (1 failed run → 1 defect → 1 Jira ticket → status sync back)
- Render staging smoke (if Yogesh provisions; carries from M3 followup)

**FE+1:**

- F18 Test Suites Pattern A + B
- F18m1 Edit Suite Modal
- F19 / F20 / F21 / F22 visual gates (320 + 1440 per Rule 13)
- RWD verification sweep across M4 routes

**MAIN:**

- M4 close ceremony (close report + announcement + retro)
- Tag `m4-closed-2026-05-16` push
- M5 kickoff prep
- EOD Day-20 report

### Day-21 (Sun 2026-05-17) — reserve / slip-buffer

**Activation rule:** If Day-20 18:00 IST signals slip (M4 close-gate sweep <100% pass OR Sherlock corpus <40% accuracy OR visual gate fail on any F19/F20/F21/F22), M4 close pushes to Sun PM. M5 kickoff stays Mon May 18 AM regardless.

**Sun reserve scope (in priority order):**

1. Sherlock corpus re-eval if accuracy <40% on first run (prompt iteration, NOT model swap)
2. Visual gate retries on M4 frames
3. M4 close-gate sweep fixes
4. M4 close ceremony if slipped

**NOT permitted on Sun:** new scope, new ADRs, new dependencies. Sun is fix-only.

---

## 3. Tasks (MS4-T001..T042)

### BE tasks

| Task     | Title                                                           | Owner | Day        |
| -------- | --------------------------------------------------------------- | ----- | ---------- |
| MS4-T001 | ADR-015 Sherlock prompt strategy                                | BE+1  | 18         |
| MS4-T002 | TB-009 + TB-010 Prisma migration 0005 (raw SQL)                 | BE+1  | 18         |
| MS4-T003 | TB-011 + TB-012 + TB-013 Prisma migration 0006 (raw SQL)        | BE+1  | 18         |
| MS4-T004 | Run service Pattern A scaffold (501)                            | BE+1  | 18         |
| MS4-T005 | Run service real impl + lifecycle state machine                 | BE+1  | 19         |
| MS4-T006 | Run results real impl (per-test-case + R2 presigned attachment) | BE+1  | 19         |
| MS4-T007 | Defect service Pattern A scaffold (501)                         | BE+1  | 18         |
| MS4-T008 | Defect service real impl + status workflow                      | BE+1  | 19         |
| MS4-T009 | WebSocket gateway scaffold (`@nestjs/websockets` + `ws`)        | BE+1  | 18         |
| MS4-T010 | WebSocket reconnect-on-dyno-wake handler                        | BE+1  | 19         |
| MS4-T011 | Jira REST API v3 client scaffold (OAuth 2.0 3LO + token MVP)    | BE+1  | 18         |
| MS4-T012 | Jira webhook receiver (raw-body middleware + HMAC verify)       | BE+1  | 19         |
| MS4-T013 | Jira webhook idempotency layer (event-id dedup table)           | BE+1  | 19         |
| MS4-T014 | Run-to-defect auto-link                                         | BE+1  | 19         |
| MS4-T015 | Sherlock A4 RCA agent Pattern A scaffold                        | BE+1  | 18         |
| MS4-T016 | Sherlock A4 RCA Pattern B (real LLM + Promise.all parallel)     | BE+1  | 19         |
| MS4-T017 | Sherlock retry chain (gpt-oss-120b → gpt-oss-20b → Gemini)      | BE+1  | 19         |
| MS4-T018 | Sherlock OpenTelemetry span emission                            | BE+1  | 19         |
| MS4-T019 | Sherlock 50-defect golden corpus eval harness                   | BE+1  | 19         |
| MS4-T020 | Confidence score in Sherlock response (`0.0..1.0`)              | BE+1  | 19         |
| MS4-T021 | Audit chain extension for run / defect / jira_sync events       | BE+1  | 20         |
| MS4-T022 | Run notification email (Resend)                                 | BE+1  | 19         |
| MS4-T023 | M4 close-gate test sweep `@M4-CLOSE-GATE` (Day-18 → Day-20)     | BE+1  | 18 → 20    |
| MS4-T024 | R2 CORS config + presigned URL XHR-progress wiring              | BE+1  | 19         |
| MS4-T025 | Render staging smoke (if Yogesh provisions)                     | BE+1  | 20         |
| MS4-T026 | Run-defect-Jira E2E integration test                            | BE+1  | 20         |

### FE tasks

| Task     | Title                                                          | Owner | Day |
| -------- | -------------------------------------------------------------- | ----- | --- |
| MS4-T027 | F19 Run Console real wiring + WebSocket subscription           | FE+1  | 18  |
| MS4-T028 | F20 Run Results Pattern A scaffold                             | FE+1  | 18  |
| MS4-T029 | F20 Run Results real wiring                                    | FE+1  | 19  |
| MS4-T030 | F21 Defects Hub Pattern A scaffold                             | FE+1  | 18  |
| MS4-T031 | F21 Defects Hub real wiring (filter/sort/drilldown)            | FE+1  | 19  |
| MS4-T032 | F22 Defect Detail Pattern A scaffold                           | FE+1  | 19  |
| MS4-T033 | F22 Defect Detail Pattern B (Jira link + Sherlock RCA panel)   | FE+1  | 19  |
| MS4-T034 | F22 "needs human review" affordance (confidence <0.5 amber UI) | FE+1  | 19  |
| MS4-T035 | F18 Test Suites Pattern A + B                                  | FE+1  | 20  |
| MS4-T036 | F18m1 Edit Suite Modal                                         | FE+1  | 20  |
| MS4-T037 | AdminShell canonical realignment verify (F19 React = F15 v2)   | FE+1  | 18  |
| MS4-T038 | RWD verification sweep (M4 routes at 320/768/1024/1440)        | FE+1  | 20  |
| MS4-T039 | F19/F20/F21/F22 visual gates (Rule 13)                         | FE+1  | each day |

### MAIN / Yogesh tasks

| Task     | Title                                              | Owner  | Day      |
| -------- | -------------------------------------------------- | ------ | -------- |
| MS4-T040 | Jira sandbox setup (iksula.atlassian.net OAuth/token) | Yogesh | 18       |
| MS4-T041 | UptimeRobot keep-alive 5min → 4min on /health         | Yogesh | 18       |
| MS4-T042 | Render staging dashboard (carried from M3)            | Yogesh | 18       |

### M3 retro action items folded into M4 (per `docs/retros/2026-05-13-m3-retro.md`)

| Retro action                                                              | Folded into                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1. Close-gate test sweep authored Day-1, NOT deferred                     | MS4-T023 + MS4-AC025                                   |
| 2. Pre-push prod-boot smoke gate (followup `(bk)`)                        | Gate added via separate PR Day-18 PM (not M4 scope)    |
| 3. Auth chain regression test in CI                                       | MS4-AC031 (new)                                        |
| 4. Visual diff-probe at 320/768/1024/1440 before coding fixes (Rule 16)   | MS4-T039 enforces; embedded in FE+1 workflow           |
| 5. Multi-worktree hook whitelist sync                                     | Out-of-band Day-18 AM; not M4-tracked                  |

---

## 4. Acceptance criteria (MS4-AC001..AC042)

### Core (BE/FE feature acceptance)

| AC         | Title                                                                       | Gate                                                 |
| ---------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| MS4-AC001  | Run service CRUD endpoints functional (create / list / get / update)        | jest BE                                              |
| MS4-AC002  | Run results recorded per test-case with timing + status                     | jest BE                                              |
| MS4-AC003  | Run lifecycle state machine: pending → running → passed/failed/blocked      | jest BE                                              |
| MS4-AC004  | WebSocket `/runs/:runId/stream` broadcasts state changes within 500ms       | jest BE + Playwright                                 |
| MS4-AC005  | WebSocket reconnect on dyno wake (UptimeRobot 4-min ping)                   | manual smoke                                         |
| MS4-AC006  | Defect service CRUD + status workflow (open / triage / fixed / closed)      | jest BE                                              |
| MS4-AC007  | Jira 2-way sync (defect → Jira create + Jira → defect update)               | jest BE + sandbox smoke                              |
| MS4-AC008  | Jira webhook HMAC-SHA256 verify rejects forged payloads                     | jest BE                                              |
| MS4-AC009  | Jira webhook idempotency: replayed event-id is no-op                        | jest BE                                              |
| MS4-AC010  | Jira rate-limit handling: 429 retry-after backoff                           | jest BE                                              |
| MS4-AC011  | Run-to-defect auto-link creates draft on first failed run-result            | jest BE                                              |
| MS4-AC012  | F19 Run Console real-time updates via WebSocket                             | Playwright                                           |
| MS4-AC013  | F20 Run Results drill-down to per-test-case detail                          | Playwright                                           |
| MS4-AC014  | F21 Defects Hub filter by status/severity/assignee                          | Playwright                                           |
| MS4-AC015  | F22 Defect Detail shows Jira link + sync status                             | Playwright                                           |
| MS4-AC016  | F22 "needs human review" amber banner appears when Sherlock confidence <0.5 | Playwright (mock low-confidence response)            |
| MS4-AC017  | F22 disables auto-Jira-create when confidence <0.5                          | jest BE + Playwright                                 |
| MS4-AC018  | F18 Test Suites CRUD + run-from-suite action                                | jest BE + Playwright                                 |
| MS4-AC019  | F18m1 Edit Suite Modal saves suite definition                               | Playwright                                           |
| MS4-AC020  | AdminShell canonical realignment (no shell-internal drift F19/F20/F21/F22)  | manual diff-probe per Rule 16                        |
| MS4-AC021  | RWD sweep at 320/768/1024/1440 across M4 routes                             | Playwright multi-viewport                            |

### Sherlock A4 RCA agent

| AC         | Title                                                                       | Gate                                                 |
| ---------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| MS4-AC022  | Sherlock Pattern A scaffold returns canned RCA + confidence=0.7             | jest BE                                              |
| MS4-AC023  | Sherlock Pattern B calls real LLM with OpenTelemetry trace span             | jest BE + trace inspection                           |
| MS4-AC024  | Sherlock retry chain: gpt-oss-120b → gpt-oss-20b → gemini-2.5-flash         | jest BE (force-fail primary, assert fallback)        |
| MS4-AC025  | Sherlock parallel agent calls via `Promise.all` (NOT LangGraph)             | code review + grep ban                               |
| MS4-AC026  | Sherlock returns confidence score `0.0..1.0` in every response              | jest BE schema check                                 |
| MS4-AC042  | **A4 RCA accuracy ≥40% on 50-defect golden corpus**                         | corpus harness (`scripts/eval-sherlock.ts`)          |

### Audit, ops, close-gate

| AC         | Title                                                                       | Gate                                                 |
| ---------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| MS4-AC027  | Audit chain HMAC-SHA256 valid for all run/defect/jira_sync_log events       | jest BE chain-verify util                            |
| MS4-AC028  | Run notification email delivers via Resend within 30s of completion         | manual smoke + Resend dashboard                      |
| MS4-AC029  | Render scale-to-zero handled (UptimeRobot 4-min keep-alive)                 | UptimeRobot uptime report                            |
| MS4-AC030  | M4 close-gate test sweep tagged `@M4-CLOSE-GATE` (≥30 assertions)           | jest BE                                              |
| MS4-AC031  | Auth chain regression test in CI (M3 retro action item 3)                   | Playwright in CI                                     |
| MS4-AC032  | M4 close-gate sweep passes 100% in CI                                       | GitHub Actions                                       |
| MS4-AC033  | All M4 frames (F18, F19, F20, F21, F22) visual-gated at 320 + 1440          | Rule 13 screenshots                                  |
| MS4-AC034  | Iksula sandbox connection verified (iksula.atlassian.net OAuth or token)    | manual sandbox smoke                                 |
| MS4-AC035  | Run-defect-Jira E2E integration test passes                                 | jest BE                                              |
| MS4-AC036  | M4 tag `m4-closed-2026-05-16` (or Sun reserve `-17`) pushed at close        | git ls-remote verify                                 |
| MS4-AC037  | Day-18/19/20 EOD reports filed in `docs/eod-reports/`                       | repo check                                           |
| MS4-AC038  | $0/month free-tier quota unbreached (Groq RPD, Resend, R2, Neon)            | manual quota check                                   |
| MS4-AC039  | No new banned-list dependencies introduced                                  | enforce-pm1-stack hook clean                         |
| MS4-AC040  | No design-token drift (enforce-design-tokens hook clean across M4 PRs)      | hook log review                                      |
| MS4-AC041  | Two-folder workflow: `~/Claude Cowork Workspace/...` mirror updated         | manual mirror check                                  |

---

## 5. Risk register (R001-R004 research-backed + legacy P1/P2)

### R001 — WebSocket lifetime under Render Free scale-to-zero

- **Severity:** P1 (highest M4 risk)
- **Trigger:** Render Free Hobby idles dynos at 15min no-request. WebSocket connections terminate on idle. Pilot is 12hr/day so dyno wakes/sleeps repeatedly within a workday.
- **Impact:** Run Console real-time updates die silently between connections; FE shows stale data.
- **Mitigation:**
  1. UptimeRobot keep-alive interval `5min → 4min` on `/health` (MS4-T041)
  2. WebSocket client reconnect on `close` with exponential backoff (MS4-T010)
  3. FE detects stale connection (no event >60s) → polls `/runs/:id` once, then reconnects
- **Owner:** BE+1 (server) + FE+1 (client reconnect logic)
- **Acceptance:** MS4-AC005

### R002 — Jira webhook HMAC verification needs raw request body

- **Severity:** P1
- **Trigger:** Jira posts JSON to webhook URL with an `X-Hub-Signature` header containing HMAC-SHA256 of the **raw bytes** of the request body. NestJS / Express's `bodyParser.json()` consumes the stream and stringifies to an object; recomputing HMAC over `JSON.stringify(req.body)` produces a different byte sequence than what Jira signed (whitespace, key ordering, unicode escape differences). Result: every webhook fails HMAC verify in production.
- **Impact:** All inbound Jira → defect updates rejected as forged. 2-way sync half-broken.
- **Mitigation:**
  1. Mount **raw-body middleware** on the webhook route specifically: `app.use('/webhooks/jira', express.raw({ type: 'application/json' }))`
  2. Compute HMAC over `req.body` (Buffer) BEFORE JSON.parse
  3. Keep default JSON body-parser for all other routes (don't swap globally)
  4. File followup `(bq)` for the middleware design pattern doc
- **Owner:** BE+1
- **Acceptance:** MS4-AC008

### R003 — R2 CORS + XHR upload progress for defect attachments

- **Severity:** P2
- **Trigger:** Defect attachments (screenshots, log files, video) bypass Render's 512MB dyno via R2 presigned URL direct upload. Two gotchas: (a) R2 requires CORS allow-list config per-bucket for browser PUT; (b) `fetch()` does not expose upload progress events — for files >5MB users see a frozen UI. Native XHR's `upload.onprogress` is needed.
- **Impact:** Without CORS the browser PUT errors with CORS preflight failure; without XHR progress the user UX is broken for large attachments.
- **Mitigation:**
  1. R2 bucket CORS config script committed at `apps/api/scripts/r2-cors-config.sh` with `AllowedOrigins: [https://qa-nexus.pages.dev, http://localhost:3000]` and `AllowedMethods: [PUT, GET, HEAD]`
  2. FE upload helper uses `XMLHttpRequest` (not `fetch`) for files >2MB to expose `upload.onprogress`
  3. Progress callback wired to F22 attachment row's progress bar
- **Owner:** BE+1 (CORS config) + FE+1 (XHR helper)
- **Acceptance:** MS4-AC013 + MS4-T024

### R004 — Jira webhook retry idempotency

- **Severity:** P2
- **Trigger:** Jira retries webhook deliveries on non-2xx responses with up to ~3 retries over ~5 min. If our handler is slow or partially fails after writing to DB but before returning 200, we get duplicate inserts (defect updated twice, audit row chain breaks).
- **Impact:** Duplicate defect updates; audit chain HMAC reverification fails (chain forked); user sees defect history with duplicate identical entries.
- **Mitigation:**
  1. Jira sends `x-atlassian-webhook-identifier` header (or `webhookEvent` + `issue.id` + `timestamp` composite key)
  2. `jira_sync_log` table has a UNIQUE INDEX on `(provider_event_id, project_id)`
  3. Webhook handler ALWAYS inserts the log row FIRST (`INSERT ... ON CONFLICT DO NOTHING RETURNING id`); if no row returned, return 200 and skip processing (duplicate)
  4. Only write to `defects` table after log row insert succeeds
- **Owner:** BE+1
- **Acceptance:** MS4-AC009

### Legacy risks (carried from skeleton)

| Risk                                                                     | Severity | Mitigation                                                                                              |
| ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------- |
| A4 RCA accuracy below 40% target (vanilla ~11% vs multi-agent ~64%)      | P1       | AC042 target set ≥40% per Yogesh decision; Sun reserve allocated for prompt iteration if first run miss |
| 3-day compression overrun (M3 went +1 day; same risk for M4)             | P1       | Sun Day-21 reserve; scope drops listed in §6 if Day-19 EOD signals slip                                  |
| BetterAuth re-regression after 1.6.11 bump                               | P2       | Render staging dashboard (MS4-T042) for pre-deploy smoke once Yogesh provisions                          |
| Jira OAuth 2.0 3LO complexity vs MVP timeline                            | P2       | API token fallback for MVP (Yogesh confirms Day-18); OAuth post-M4                                       |

---

## 6. Scope cuts vs v1.0 (deferred to M5 or later)

- Defect comments (was MS4-T037 v1; defer to M5)
- Auto-assign defect by area (was MS4-T040 v1; defer to M5)
- Dashboard charts (was MS4-T048-T052 v1; defer to M6 reports)
- RCA feedback loop / thumbs-up-down (was MS4-T044 v1; defer to M5)
- Chunk upload for defect attachments >100MB (was MS4-T036 v1; defer to M5 if needed — pilot files are <50MB)
- 2-min poll fallback for webhook (was MS4-T029 v1; webhook-only for MVP)
- Full docs portal (was MS4-T055-T060 v1; partial in M4 close report only)
- Defect SLA timer (not in v1; not in M4 either — defer to M6 reports)
- Bulk defect actions (not in v1; defer to M5 if pilot demands)

---

## 7. Tech stack locks (per v2.1 amendment + CLAUDE.md)

| Concern                  | M4 choice                                            | NOT                              |
| ------------------------ | ---------------------------------------------------- | -------------------------------- |
| Workflow orchestration   | Pure TypeScript `Promise.all`                        | LangGraph, Hatchet, Temporal     |
| LLM observability        | OpenTelemetry trace spans                            | Langfuse, LangSmith              |
| LLM primary (Sherlock)   | `openai/gpt-oss-120b` via Groq                       | Ollama, vLLM, self-host          |
| LLM L1-fast              | `openai/gpt-oss-20b` via Groq                        | self-host                        |
| LLM fallback             | `gemini-2.5-flash`                                   | OpenAI direct                    |
| Feature flags            | env var + DB row (LLM provider config bridge)        | Unleash, LaunchDarkly            |
| Secrets                  | Render env vars + GitHub Secrets                     | Doppler, Vault                   |
| Database                 | Postgres 15 + pgvector on Neon Free                  | Oracle, Supabase                 |
| Hosting (web)            | Cloudflare Pages Free                                | Vercel, Netlify                  |
| Hosting (api)            | Render Free Hobby                                    | AWS Lambda, Fly.io               |
| Storage                  | Cloudflare R2 presigned-URL direct upload            | Render-dyno buffering, S3 direct |
| Jira                     | REST API v3 direct + OAuth 2.0 3LO (or API token MVP) | Jira MCP, Forge app              |
| WebSocket                | `@nestjs/websockets` + `ws` single-instance          | Redis pub/sub, Socket.io fanout  |
| Iksula sandbox           | `iksula.atlassian.net` live                          | MSW mock, Postman mock           |
| Email                    | Resend free                                          | SendGrid, AWS SES                |
| Editor (defect notes)    | TipTap (already in M3)                               | Quill, Slate, Draft.js           |

---

## 8. Cross-references

- `Milestone_M4_Runs_Defects_Jira.md` v1.0 (Apr 25) — superseded by this v2; only v2.1 amendment block (lines 3-16) still binding
- `docs/milestones/m3-close-report.md` — predecessor handoff
- `docs/retros/2026-05-13-m3-retro.md` — M2+M3 retro (actions 1-5 folded into MS4-T023 / new gate / MS4-AC031 / MS4-T039 / out-of-band)
- `docs/audits/2026-05-13-skill-alignment-audit.md` — Day-17 audit (P1 pre-push smoke gap → followup `(bk)`)
- `CLAUDE.md` Hard Rules 14 (Day-17 amendment — AdminShell canonical = F19 React) + 15 (FE port source-of-truth) + 16 (canonical-first port workflow)
- `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` v8.1 §12.3
- `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` v2.1 §3.6-3.10
- `docs/followups.md` `(bq)` raw-body webhook middleware design (filed Day-18 AM)
- `~/Claude Cowork Workspace/AI Based QA Platform/` — parallel mirror (two-folder workflow)

---

_Promoted Day-18 AM 2026-05-14 from `.claude/scratch/m4-v2-plan-skeleton.md`. AC042=≥40% locked per Yogesh Day-18 directive. "Needs human review" UI affordance for confidence <0.5 locked per same directive (MS4-T034 + MS4-AC016 + MS4-AC017)._
