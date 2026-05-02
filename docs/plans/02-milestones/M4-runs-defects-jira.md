# M4 — Test Runs, Defects, A4 RCA & Jira 2-way sync

> **Last updated:** 2026-05-02 (Day 6 — pre-kickoff snapshot)
> **Authority:** Summary view. Binding spec:
> `../../../QA Nexus/PM1/PM1_milestone/M4/Milestone_M4_Runs_Defects_Jira.md` (v1.0 with v8.1 banner).

---

## Goal

Live test execution + defect lifecycle + 5-Layer RCA + bidirectional Jira sync.

- **Test Runs** — F19 Run Console live state via WebSocket (4-zone layout, pulsing
  live pill via Framer Motion). State machine: `Queued → Running → Passed/Failed/Blocked/Aborted`.
  Failed → Defected (auto-creates defect via EP-011).
- **Defects** — F21 Defects Hub + F22 Defect Detail with A4 RCA accordion.
  State machine: `New → Triaged → In-Progress / Blocked → Resolved → Verified → Closed`
  (with Reopened branch). A4 RCA fires on Triaged.
- **A4 5-Layer RCA** — parallel Groq calls for L2 Env, L3 Config, L4 Code; gpt-oss-20b
  fast for L1 Stack; Gemini (or gpt-oss-20b — see R1) for fallback. All 5 layers run
  in `Promise.all`. Confidence canon: L1=90% L2=80% L3=60% L4=50% L5=40%.
  Latency p95 <15s.
- **Jira 2-way** — OAuth 2.0 3LO ONLY. Inbound webhooks HMAC-SHA256 verified.
  Status mapping in `jira_status_map`. Sync events written to audit_log.

**Window:** 2026-07-06 → 2026-07-26 (3 weeks)
**Status:** NOT STARTED

---

## Frames in scope

| Frame | File                                               | Owner | Status      |
| ----- | -------------------------------------------------- | ----- | ----------- |
| F18   | F18 Test Suites                                    | FE    | NOT STARTED |
| F18m1 | F18m1 Edit Suite Modal                             | FE    | NOT STARTED |
| F19   | F19 Run Console (live state, 4-zone, pulsing pill) | FE    | NOT STARTED |
| F20   | F20 Run Results                                    | FE    | NOT STARTED |
| F21   | F21 Defects Hub                                    | FE    | NOT STARTED |
| F22   | F22 Defect Detail (A4 RCA accordion)               | FE    | NOT STARTED |

---

## Tasks (high-level)

### BE

| Task     | Description                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------- |
| MS4-T001 | TB-009 `test_suite` + TB-010 `test_run` + TB-011 `test_step_result` tables                           |
| MS4-T002 | TB-012 `defect` + TB-013 `defect_event` (state machine) + TB-014 `rca_layer` tables                  |
| MS4-T003 | Test Run state machine + transitions + audit_log integration                                         |
| MS4-T004 | Defect state machine + transitions + audit_log integration                                           |
| MS4-T005 | A4 RCA service: parallel `Promise.all` of 5 LLM calls; merge results; write 5 `rca_layer` rows       |
| MS4-T006 | WebSocket events: `test_run.progress` (per-step result), `defect.rca_ready` (when 5 layers complete) |
| MS4-T007 | Jira OAuth 2.0 3LO (login flow, token refresh, encrypted storage in Render env vars)                 |
| MS4-T008 | Inbound Jira webhook receiver: HMAC-SHA256 verify → status map lookup → write defect_event           |
| MS4-T009 | Outbound Jira sync: defect creation → Jira issue create; status change → Jira transition             |
| MS4-T010 | EP-013 + EP-014 evidence upload (presigned R2 URLs from defect detail page)                          |
| MS4-T011 | EP-011 auto-defect creation on Failed test step                                                      |

### FE

| Task     | Description                                                                           |
| -------- | ------------------------------------------------------------------------------------- |
| MS4-FE01 | F18 Test Suites + F18m1 Edit Modal                                                    |
| MS4-FE02 | F19 Run Console (4-zone layout + Framer Motion pulsing pill + WebSocket live updates) |
| MS4-FE03 | F20 Run Results (post-run summary + per-step drilldown + evidence viewer)             |
| MS4-FE04 | F21 Defects Hub (filter by state + severity + assignee)                               |
| MS4-FE05 | F22 Defect Detail (A4 RCA accordion: 5 layers expanded with confidence + reasoning)   |
| MS4-FE06 | Jira OAuth Connect button + status badge                                              |
| MS4-FE07 | Direct browser→R2 evidence upload (reusing F12 presigned-URL pattern)                 |

---

## Acceptance criteria (locked v2.1)

| AC        | Description                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| MS4-AC001 | Test Run state machine: Queued → Running → Passed/Failed observed end-to-end in F19     |
| MS4-AC002 | Defect state machine: all 6 states + Reopened branch transitions log to audit_log       |
| MS4-AC003 | A4 latency p50 <8s, p95 <15s on 50-defect golden set (PM1 GA gate GA-7)                 |
| MS4-AC004 | A4 top-2 RCA accuracy ≥70% on 50-defect golden set (PM1 GA gate GA-4)                   |
| MS4-AC005 | Jira OAuth 2.0 3LO login → 12 Iksula projects visible in F11                            |
| MS4-AC006 | Inbound Jira webhook with bad HMAC returns 401 + writes audit_log denial                |
| MS4-AC007 | Defect created in QA Nexus → matching Jira issue created within 5s                      |
| MS4-AC008 | Status change in Jira → matching defect_event written within 30s (webhook latency)      |
| MS4-AC009 | Evidence upload (50 MB video) succeeds via presigned R2 URL (no buffering through dyno) |
| MS4-AC010 | F19 pulsing pill animates smoothly (60fps) on mid-tier mobile (verified in DevTools)    |

---

## Dependencies

**Needs from M3:**

- A1 + A2 working end-to-end (so test cases exist to run)
- Test case library populated
- WebSocket gateway proven (already exists from T026)
- Audit log capturing every agent decision

**Hands forward to M5:**

- Live Run + Defect tables populated (Reports Studio reads these)
- Jira 2-way sync stable (Reports show Jira-linked defects)
- A4 RCA producing data for F22 + Reports

---

## Risks

| #   | Risk                                                                                      | Mitigation                                                                                                            |
| --- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| R1  | **Gemini fallback may be reduced to 250 RPD (Dec 2025 cut)** — A4 needs reliable fallback | If confirmed in M3 (R1 there), A4 fallback also swaps to Groq `gpt-oss-20b` (14.4k RPD).                              |
| R2  | A4 5-parallel Groq calls may exceed 30 RPM limit                                          | Throttle at most 5 concurrent A4 runs; queue overflow in DB; if 30 RPM hit, sequential fallback (still <30s p95)      |
| R3  | OAuth 2.0 3LO requires `iksula.atlassian.net` admin approval                              | M4 Day 1 task: confirm admin can approve OAuth app; have backup PAT-based dev path for testing                        |
| R4  | Inbound webhook receiver behind Render Free 15-min cold-start could miss events           | UptimeRobot keep-alive prevents cold-start; Jira retries failed webhooks 3× over 5 min                                |
| R5  | Evidence file size cap (R2 free 10 GB / 1M Class-A writes)                                | Followup `(m)` quota alert (M1 deliverable) provides warning at 80%; cap individual file at 100 MB in F12 client-side |
| R6  | A4 confidence canon (L1=90% etc.) may not match real distributions on Iksula data         | Tune from golden-set results in DeepEval Colab; expose layer thresholds in F26m1 advanced settings                    |
| R7  | WebSocket reconnect storms if Render Free dyno restarts                                   | Exponential backoff + last-event-ID resume + audit_log replay for missed events                                       |

---

## Notes / decisions log (will fill during M4)

_Empty until M4 Day 1 (2026-07-06)._

---

## Drift items

| #     | Item                                                                                    | Action                                                                         |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| M4-D1 | M4 binding file references self-hosted vision in v1.0 task list (banner overrides).     | No edit needed — v8.1 banner explicitly redirects to PM1_PRD/PM1_ERD for tech. |
| M4-D2 | A4 latency budget 30s in M4 binding file, but spec was revised to <15s in PM1_ERD v2.1. | Spec version banner overrides; live budget is <15s p95.                        |
| M4-D3 | Gemini fallback assumption stale (R1 above).                                            | Resolved at M3 (verify Gemini dashboard); A4 inherits the resolution.          |

---

## Cross-references

- Binding milestone file: `../../../QA Nexus/PM1/PM1_milestone/M4/Milestone_M4_Runs_Defects_Jira.md`
- A4 sequence diagram: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3.6
- Jira 2-way sequence: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3.7
- State machines (defect + run): `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3.9 + §3.10
- A4 spec: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §7
- Locked frames: `F18`, `F18m1`, `F19`, `F20`, `F21`, `F22` in `../../../QA Nexus/PM1/PM1_UI_v2/`
- Golden sets: `apps/api/test/golden-sets/` (75 A4 root-cause-tagged, 62 valid)
- ADR-005 (R2 storage / presigned URLs): `../../architecture/adr-005-r2-storage.md`
