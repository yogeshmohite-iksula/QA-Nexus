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

| Field                       | Planned                  | Actual (as of 2026-05-02 Day 6, pre-Sunday-close)                                                                                                                           |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Window                      | 2026-04-27 → 2026-05-10  | 2026-04-27 → **2026-05-03** (closing 7 days early)                                                                                                                          |
| Tasks closed                | 35 of 35                 | ~32 of 35 confirmed code-side (91%); 3 deferred → M1                                                                                                                        |
| Hours burned                | 298 estimated            | ~278 burned (~93%)                                                                                                                                                          |
| Acceptance gates passed     | 19 PASS / 0 FAIL         | **15 PASS / 2 AUTO / 2 DEFERRED / 0 FAIL** (intentional handoffs to M1)                                                                                                     |
| Frames ported               | 0 (M0 was "shells only") | **12 of 41 frames RWD-clean** (F06+F06b+F06c+F07+F08-F13)                                                                                                                   |
| ADRs added                  | 4 expected               | **6 ADRs** (002, 003, 004, 006, 007 forthcoming, 009) + ADR-003 amendment                                                                                                   |
| Followups filed             | (no estimate)            | **18 entries (a-r)** — 6 closed, 12 open                                                                                                                                    |
| Hotfixes during Mn          | 0 expected               | **5-stage Render boot regression chain Day-4 evening** (logger / LLM / sharp dup-key / sharp pin / memory guard)                                                            |
| Pre-push gates              | 1 (CHANGELOG)            | **3 gates** added Day-5 (typecheck / frozen-lockfile / CHANGELOG)                                                                                                           |
| Monthly cost                | $0                       | **$0** confirmed                                                                                                                                                            |
| Drift count                 | 0                        | **6 drift items surfaced** (D1-D6 in `01-pm1-execution-plan.md`)                                                                                                            |
| Spec amendments recommended | 0                        | **2** — bge-large→bge-small in PM1_PRD §6 / PM1_ERD §3 (rides with MS0-T017+AC008 amendment)                                                                                |
| Notes                       | —                        | M0 ran ahead of plan; visual-confirmation gate (Rule 13) and RWD rule (Rule 12) both established mid-Mn after F06 + F06b iterations exposed gaps in automation-only checks. |

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

_Placeholder — fill at M3 close (target 2026-07-05). At this close, A/B-test bge-small vs Qwen3-Embedding-0.6B-ONNX per drift D6._

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
