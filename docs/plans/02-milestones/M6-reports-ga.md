# M6 — Full Reports Suite + GA

> **Last updated:** 2026-05-02 (Day 6 — pre-kickoff snapshot)
> **Authority:** Summary view. Binding spec:
> `../../../QA Nexus/PM1/PM1_milestone/M6/Milestone_M6_Full_Reports_GA.md` (v1.0 with v8.1 banner).
>
> **Note:** This file is included per drift item from `01-pm1-execution-plan.md`
> (binding spec has 7 milestones M0-M6; original brief listed only M0-M5). If
> deferring M6 plan to M5 close is preferred, **delete this file** and add a stub
> in `01-pm1-execution-plan.md` noting M6 plan will be authored at M5 close.

---

## Goal

GA-readiness sweep. All 41 frames polished, all 12 acceptance gates pass, pilot
soak findings triaged and shipped, full reports suite complete.

**Window:** 2026-08-17 → 2026-09-21 (~5 weeks, includes 4-week pilot soak)
**GA target:** **2026-09-21** (LOCKED)
**Status:** NOT STARTED

---

## Frames in scope

No new frame ports — all 41 are live by M5 close. M6 is **polish + soak + gate sweep**.

| Activity                                                                       | Owner           |
| ------------------------------------------------------------------------------ | --------------- |
| Pilot soak findings triage + hotfix backlog                                    | Yogesh + Akshay |
| Full Reports Studio polish (4 templates × 4 priority levels × 3 release types) | FE + BE         |
| 12 acceptance gates measurement + sign-off                                     | Yogesh          |
| GA-readiness audit (skill + code + AC + SECURITY)                              | MAIN            |
| Final ADR pass (close out anything still open from M0-M5)                      | Yogesh + MAIN   |

---

## Tasks (high-level)

### BE + FE polish

| Task     | Description                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MS6-T001 | Reports Studio: each of 4 templates tested across all 4 priority levels (P0/P1/P2/P3) and all 3 release types (PaymentV2, Returns, Mobile App) — 48 combinations |
| MS6-T002 | Pilot soak findings backlog discharged (cap: 5 hotfixes, 10 polish items)                                                                                        |
| MS6-T003 | Final ADR pass — any new patterns shipped Days 84-126 documented                                                                                                 |
| MS6-T004 | Performance regression sweep — re-measure NFR-001/002/003 against M3+M4 baseline                                                                                 |
| MS6-T005 | Audit log full-chain integrity verification (90-day window of pilot data)                                                                                        |
| MS6-T006 | Cost gate audit — full Render + Neon + Cloudflare + Resend + Better Stack + Grafana review                                                                       |
| MS6-T007 | SECURITY.md final pass — disclosure email confirmed, rotation schedule documented                                                                                |
| MS6-T008 | GA tag + release notes + CHANGELOG cut + customer-facing changelog page                                                                                          |

---

## Acceptance criteria — the 12 binding GA gates (PM1_ERD v2.1 §10)

| Gate  | Description                                                                                                | Owner           |
| ----- | ---------------------------------------------------------------------------------------------------------- | --------------- |
| GA-1  | 41 of 41 UI frames render at locked design tokens (no MD3 drift, no tertiary, no missing project switcher) | FE              |
| GA-2  | A1 eval ≥80% golden-set match                                                                              | BE + DeepEval   |
| GA-3  | A2 eval <5% FP, ≥60% TP                                                                                    | BE + DeepEval   |
| GA-4  | A4 eval top-2 RCA accuracy ≥70% on 50-defect golden set                                                    | BE + DeepEval   |
| GA-5  | NFR-001 page load p50 <1.5s, p95 <3s                                                                       | FE + Render     |
| GA-6  | NFR-002 API latency p50 <200ms, p95 <500ms (excluding LLM calls)                                           | BE + Render     |
| GA-7  | NFR-003 agent latency: A1 <10s, A2 <500ms, A4 <15s p95 (revised v2.1 from 30s)                             | BE + Groq       |
| GA-8  | NFR-014 RBAC all 4 roles correctly gated                                                                   | BE + audit-log  |
| GA-9  | HMAC audit chain integrity ≥99.95%                                                                         | BE + audit-log  |
| GA-10 | Pilot acceptance: 6 of 8 pilot users complete end-to-end flow without engineer intervention                | Yogesh + Akshay |
| GA-11 | Cost gate: monthly infrastructure spend = **$0** confirmed by SRE                                          | Yogesh          |
| GA-12 | Backup pipeline (weekly `pg_dump` to R2) functional + restore-from-backup tested                           | BE + Cloudflare |

---

## Dependencies

**Needs from M5:**

- All 41 frames live
- 8-user pilot active for ≥4 weeks before GA
- Reports Studio working for 4 templates (M6 expands to 48 combinations)
- All 3 agents (A1/A2/A4) live and producing data
- Audit log accumulating ≥90 days of data

**Hands forward to PM2 / customer-facing release:**

- Validated free-tier $0/month pilot proof
- Full ADR + pattern docs library
- Pilot soak findings → PM2 backlog

---

## Risks

| #   | Risk                                                                  | Mitigation                                                                                                                                    |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Pilot soak surfaces a P0 architectural issue requiring rework         | M6 has 5 weeks; budget 1 week for rework if needed; if rework >2 weeks, delay GA by 2 weeks                                                   |
| R2  | NFR-001/002/003 regression vs M3+M4 baseline                          | Measurement gate at M6 Day 7 (early); fix-in-sprint if regression >10%                                                                        |
| R3  | Cost gate breach during 4-week soak (e.g., R2 unexpected egress)      | Followup `(m)` quota alert (M1) provides daily signal; weekly cost review with Yogesh                                                         |
| R4  | Render Free unannounced maintenance breaks pilot uptime (GA-10)       | Better Stack 2nd-opinion uptime monitor; if Render Free has >0.5% downtime in 4-week soak, evaluate Render Starter $7/mo (would breach GA-11) |
| R5  | Audit chain integrity drops below 99.95% during 90-day window         | Daily integrity check cron; if drift detected, root-cause within 24hr; chain replay tooling ready                                             |
| R6  | DeepEval golden sets stale by M6 if pilot data reveals new edge cases | Re-run T032 generator at M6 Day 1; refresh golden sets if pilot surfaces ≥5 new patterns                                                      |

---

## Notes / decisions log (will fill during M6)

_Empty until M6 Day 1 (2026-08-17)._

---

## Drift items

_None at scaffold time. Will fill as M0-M5 closes surface drift to be addressed in M6._

---

## Cross-references

- Binding milestone file: `../../../QA Nexus/PM1/PM1_milestone/M6/Milestone_M6_Full_Reports_GA.md`
- 12 GA gates canon: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §10
- NFR canon: `../../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` §10
- Launch checklist canon: `../../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` §20
- Roadmap: `../../../QA Nexus/PROJECT_ROADMAP.md` (v1.1)
