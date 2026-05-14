# Plan vs actual — living delivery log

> **Last updated:** 2026-05-02 (Day 6 — initial scaffold + M0 baseline row)
> **Cadence:** One row per milestone close. Append-only — never edit a closed row.

---

## Revision history

| Date       | Author       | Change                                                  |
| ---------- | ------------ | ------------------------------------------------------- |
| 2026-05-02 | MAIN (Day 6) | Initial scaffold. M0 row pre-filled from Day-6 actuals. |

---

## Per-milestone rows

### M0 — Setup & infrastructure

| Field                       | Planned                  | Actual (FINAL 2026-05-03 — M0 CLOSED)                                                                                                                                                 |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Window                      | 2026-04-27 → 2026-05-10  | 2026-04-27 → **2026-05-03** (closed 7 days early on planned spec; close ceremony ran ~6 hr into Day 8 due to CI Postgres deficit unmasking — see M0 completion report §1)             |
| Tasks closed                | 35 of 35                 | ~32 of 35 confirmed code-side (91%); 3 deferred → M1                                                                                                                                  |
| Hours burned                | 298 estimated            | ~278 burned (~93%)                                                                                                                                                                    |
| Acceptance gates passed     | 19 PASS / 0 FAIL         | **17 PASS / 0 FAIL / 2 DEFERRED to M1.5** (15 unconditional + 2 footnoted: AC009 24h obs window completed; AC012 manual workflow_dispatch SUCCESS — first scheduled cron drift noted) |
| Frames ported               | 0 (M0 was "shells only") | **12 of 41 frames RWD-clean** (F06+F06b+F06c+F07+F08-F13)                                                                                                                             |
| ADRs added                  | 4 expected               | **6 ADRs** (002, 003, 004, 006, 007 forthcoming, 009) + ADR-003 amendment                                                                                                             |
| Followups filed             | (no estimate)            | **18 entries (a-r)** — 6 closed, 12 open                                                                                                                                              |
| Hotfixes during Mn          | 0 expected               | **5-stage Render boot regression chain Day-4 evening** (logger / LLM / sharp dup-key / sharp pin / memory guard)                                                                      |
| Pre-push gates              | 1 (CHANGELOG)            | **3 gates** added Day-5 (typecheck / frozen-lockfile / CHANGELOG)                                                                                                                     |
| Monthly cost                | $0                       | **$0** confirmed                                                                                                                                                                      |
| Drift count                 | 0                        | **6 drift items surfaced** (D1-D6 in `01-pm1-execution-plan.md`)                                                                                                                      |
| Spec amendments recommended | 0                        | **2** — bge-large→bge-small in PM1_PRD §6 / PM1_ERD §3 (rides with MS0-T017+AC008 amendment)                                                                                          |
| Notes                       | —                        | M0 ran ahead of plan; visual-confirmation gate (Rule 13) and RWD rule (Rule 12) both established mid-Mn after F06 + F06b iterations exposed gaps in automation-only checks.           |

### M1 — Users, Roles & RBAC

| Field                    | Planned                        | Actual         |
| ------------------------ | ------------------------------ | -------------- |
| Window                   | 2026-05-11 → 2026-05-24        | _TBD at close_ |
| Tasks closed             | _TBD_                          | _TBD_          |
| Hours burned             | _TBD_                          | _TBD_          |
| Acceptance gates passed  | 13 PASS / 0 FAIL               | _TBD_          |
| Frames ported            | 6                              | _TBD_          |
| ADRs added               | 1 (ADR-007 telemetry pipeline) | _TBD_          |
| Followups filed / closed | (p)(q)(r) discharge planned    | _TBD_          |
| Monthly cost             | $0                             | _TBD_          |
| Drift count              | 1 (D5 quota alert system)      | _TBD_          |
| Notes                    | _TBD_                          | _TBD_          |

### M2 — Test Documents & Knowledge Base

_Placeholder — fill at M2 close (target 2026-06-14)._

### M3 — Test Cases + A1 + A2

**✅ CLOSED 2026-05-13 — 52 PRs across 6 calendar days / ~3.6 working days.**

- **Plan window:** 2026-06-15 → 2026-07-05 (21 days originally)
- **Actual window:** 2026-05-08 (Day-13) → 2026-05-13 (Day-17) — **+1 day over compressed Tue May 12 target** (5.8× compression vs original 21-day plan)
- **Compression driver:** Day-13 PM kickoff post-M2; Day-15 record 15-PR day; Day-17 4-PR magic-link Gmail prefetch saga absorbed 1 extra day vs target
- **Tag:** `m3-closed-2026-05-13` at SHA `a98797b` (#139 — auth-chain-complete commit)
- **Close report:** `docs/milestones/m3-close-report.md`
- **Carry-overs to M4+:** A/B-test bge-small vs Qwen3-Embedding-0.6B-ONNX per drift D6 → followup `(au)`; F16c Pattern B → followup `(ay)`; Path C bridge removal when F26 v2 ships → followup `(az)`

### M4 — Test Runs + Defects + A4 + Jira

_Placeholder — fill at M4 close (target 2026-07-26)._

### M5 — Automation MVP + Reports + Pilot launch

_Placeholder — fill at M5 close (target 2026-08-16). Pilot Day-0 readiness checklist runs at M5 Day 1._

### M6 — Full Reports Suite + GA

_Placeholder — fill at M6 close (target 2026-09-21). All 12 GA gates measured here._

---

## Cross-references

- `00-project-overview.md` — whole-project view
- `01-pm1-execution-plan.md` — PM1 execution detail + drift D1-D6
- `02-milestones/Mn-*.md` — per-Mn plans
- `03-drift-checklist.md` — Mn-close template
- `../STATUS.md` — daily snapshot
- `../followups.md` — open + closed
