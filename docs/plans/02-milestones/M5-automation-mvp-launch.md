# M5 — Automation MVP + Reports + Pilot launch

> **Last updated:** 2026-05-02 (Day 6 — pre-kickoff snapshot)
> **Authority:** Summary view. Binding spec:
> `../../../QA Nexus/PM1/PM1_milestone/M5/Milestone_M5_Automation_Basic_Reports_MVP_Launch.md` (v1.0 with v8.1 banner).

---

## Goal

Reports Studio + Executive Dashboard + Agents UI + Settings & Audit + **8-user pilot
Day-0 launch**.

- **Reports Studio (F23)** — 4 PM1 templates (PDF/Excel/HTML export). Inline SVG charts
  (line/bar) — NO heavy charting library, just hand-crafted SVG paths.
- **QA Value Dashboard (F24)** — AI benefit analytics with 4 hero metrics + provenance
  footnotes on every claim.
- **Executive Dashboard (F25)** — "Prove mode" with ivory canvas (#FAFAF8) — the ONLY
  frame that flips workspace chrome's main-area palette from dark to light.
- **Agents (F26)** — 3 agent cards (A1/A2/A4) + autonomy ladder + 6 guardrail toggles +
  4-run eval table + 5 recent decisions + guardrail events log. F26m1 button enables
  per-agent model assignment.
- **Settings & Audit (F28)** — 6 PM1 tabs + 2 PM3+ preview tabs. Audit Log tab shows
  HMAC-SHA256 chain integrity ≥99.95%. F28m1 button adds new LLM providers.
- **Pilot launch (Day-0 = M5 Day 1)** — Yogesh Admin bootstraps via F28m1 + F26m1 → A1
  end-to-end works → invite Akshay → 6 QA Engineers in batch → all 8 active by Day 7.

**Window:** 2026-07-27 → 2026-08-16 (3 weeks)
**Status:** NOT STARTED

---

## Frames in scope

| Frame | File                                        | Owner | Status                                     |
| ----- | ------------------------------------------- | ----- | ------------------------------------------ |
| F23   | F23 Reports Studio                          | FE    | NOT STARTED                                |
| F24   | F24 QA Value Dashboard                      | FE    | NOT STARTED                                |
| F25   | F25 Executive Dashboard (Prove mode, ivory) | FE    | NOT STARTED — note Prove-mode palette flip |
| F26   | F26 Agents                                  | FE    | likely ported during M1; refinement here   |
| F26m1 | F26m1 Agent Model Assignment                | FE    | likely ported during M1; refinement here   |
| F28   | F28 Settings & Audit                        | FE    | NOT STARTED                                |
| F28m1 | F28m1 LLM Provider Configuration            | FE    | likely ported during M1; refinement here   |

---

## Tasks (high-level)

### BE

| Task     | Description                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------- |
| MS5-T001 | Reports Studio template engine: 4 templates (PDF via puppeteer; Excel via exceljs; HTML inline SVG) |
| MS5-T002 | Inline SVG chart helpers (no charting lib): line + bar + pie                                        |
| MS5-T003 | F24 QA Value metrics aggregation (4 hero metrics + provenance footnotes)                            |
| MS5-T004 | F28 Audit Log tab: HMAC chain verification endpoint + UI integrity badge                            |
| MS5-T005 | F28 Integrations Health tab (Render + Neon + R2 + Resend + Grafana + Better Stack + Slack status)   |
| MS5-T006 | F28 Data Retention tab (cron policy: keep audit_log forever; KB chunks 90 days; etc.)               |
| MS5-T007 | Pilot launch acceptance gate runner (script that exercises the 10 launch-readiness criteria)        |

### FE

| Task     | Description                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------- |
| MS5-FE01 | F23 Reports Studio shell + template selector + export-format chooser                               |
| MS5-FE02 | F24 QA Value Dashboard (4 hero metrics + provenance footnotes UI)                                  |
| MS5-FE03 | F25 Executive Dashboard with Prove-mode palette flip (Framer Motion transition)                    |
| MS5-FE04 | F26 + F26m1 refinement (4-run eval table + 5 recent decisions live; M1 likely shipped shells only) |
| MS5-FE05 | F28 + F28m1 refinement (6 tabs wired; M1 likely shipped F28 shell + F28m1 working)                 |
| MS5-FE06 | Pilot launch dashboard (Yogesh-only view of 8-user activation status, latency, error rate)         |

---

## Acceptance criteria (locked v2.1, pilot launch criteria from PM1_PRD §20)

| AC        | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| MS5-AC001 | All 4 Reports Studio templates export cleanly to PDF, Excel, HTML                                                     |
| MS5-AC002 | F24 hero metrics render with provenance footnotes (claim → row count → query)                                         |
| MS5-AC003 | F25 Prove-mode palette flip animates without layout shift                                                             |
| MS5-AC004 | F28 HMAC chain integrity endpoint returns ≥99.95% on Iksula seed data                                                 |
| MS5-AC005 | All 41 frames render correctly at locked design tokens (PM1 GA gate GA-1)                                             |
| MS5-AC006 | 3 agents pass eval golden sets (A1 ≥80%, A2 ≥60% TP <5% FP, A4 ≥70% top-2)                                            |
| MS5-AC007 | **Monthly cost = $0** confirmed by Yogesh checking Render + Neon + Cloudflare + Resend dashboards (PM1 GA gate GA-11) |
| MS5-AC008 | **6 of 8 pilot users complete the end-to-end flow without engineer intervention** (PM1 GA gate GA-10)                 |
| MS5-AC009 | UptimeRobot reports 100% uptime for 7 consecutive days prior to pilot launch                                          |
| MS5-AC010 | Better Stack reports 0 ERROR-level logs for 24h prior to launch                                                       |

---

## Pilot launch readiness checklist (Day-0)

(Same as `01-pm1-execution-plan.md` "Pilot launch readiness criteria" — repeated here
because M5 owns the actual gate sweep.)

1. ☐ F28m1 LLM Provider Config: Yogesh pastes Groq + Gemini API keys; Save.
2. ☐ F26m1 Agent Model Assignment: per-agent model assigned (3 agents × 3 paths = 9 cells).
3. ☐ First end-to-end A1 generation succeeds (Yogesh as Admin).
4. ☐ Akshay invited via F27m1 → magic-link → first sign-in → confirmed Lead role.
5. ☐ 6 QA Engineers invited in batch via F27 → all 6 first-sign-in within 24h.
6. ☐ Anchor project Iksula Returns (key `RET`) created in F09 → Jira OAuth connected
   in F11a/b/c → 12 projects visible.
7. ☐ Sample upload: `return_policy_v2.xlsx` ingested → KB search returns hit.
8. ☐ UptimeRobot 100% for 7 consecutive days.
9. ☐ Better Stack 0 ERROR-level logs for 24h.
10. ☐ Render + Neon + Cloudflare + Resend dashboards all show $0 spend.

---

## Dependencies

**Needs from M4:**

- A4 RCA producing data (F22 Defect Detail reads it)
- Live Run + Defect tables populated (Reports Studio reads them)
- Jira 2-way stable (Reports show Jira-linked defects)

**Hands forward to M6:**

- Pilot data (4 weeks of soak between M5 close and GA target 2026-09-21)
- Reports Studio working for first 4 templates (M6 adds remaining)
- Pilot acceptance findings → M6 polish backlog

---

## Risks

| #   | Risk                                                                                              | Mitigation                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| R1  | Pilot users hit unexpected edge cases that block their daily work                                 | Yogesh + Akshay on hot-standby Day-0 through Day-7; followups filed within 1hr; hotfix branch always ready        |
| R2  | Better Stack ERROR signal during pilot pings Slack at unsociable hours                            | Quiet-hours rule on Slack channel (10 PM – 10 AM IST muted); incidents reviewed at 10 AM standup                  |
| R3  | F25 Prove-mode palette flip introduces a layout shift on first transition                         | Pre-render both palettes server-side; CSS-only transition; verify with Lighthouse CLS <0.1                        |
| R4  | Cost gate breach (e.g., R2 unexpected egress, Neon CU-hour overrun)                               | Daily Yogesh dashboard check; followup `(m)` quota alert (M1) provides hourly signal; Render budget cap = $0 hard |
| R5  | UptimeRobot keep-alive insufficient if Render Free has unannounced maintenance                    | Better Stack uptime monitor as 2nd opinion; Slack alert on >10 min gap                                            |
| R6  | Cold-start UX disruption if a pilot user hits API after 5-min UptimeRobot gap                     | Already mitigated by 5-min keep-alive; spot-check during pilot to confirm                                         |
| R7  | 8 users × 12hr × 7 days × 3 weeks = 2016 user-hours generates more audit_log volume than expected | Sanity-check Neon storage at end of M5 Week 1; if >50% of 0.5 GB cap, file urgent followup                        |

---

## Notes / decisions log (will fill during M5)

_Empty until M5 Day 1 (2026-07-27)._

---

## Drift items

| #     | Item                                                                                            | Action                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| M5-D1 | M5 binding file references self-hosted vision in v1.0 task list (banner overrides).             | No edit needed.                                                                                             |
| M5-D2 | "Higher Authority unconfirmed" placeholder in M5 binding file — Iksula 8-user roster now FINAL. | M5 binding file mentions placeholder. Live state has 8 named users. Banner-equivalent: see CLAUDE.md canon. |

---

## Cross-references

- Binding milestone file: `../../../QA Nexus/PM1/PM1_milestone/M5/Milestone_M5_Automation_Basic_Reports_MVP_Launch.md`
- Launch checklist canon: `../../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` §20
- Reports Studio template canon: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §6 (EP-016)
- Acceptance gates canon: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §10
- Locked frames: `F23`, `F24`, `F25`, `F26`, `F26m1`, `F28`, `F28m1` in `../../../QA Nexus/PM1/PM1_UI_v2/`
- Iksula 8-user canon: `../../../CLAUDE.md` § "Iksula data canon"
