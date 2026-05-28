# M5 Retrospective

> **Status:** SKELETON — to be filled in the M5 retro session **Thu Day-29 2026-05-28 ~10:00 IST**. Do NOT fill the retro analysis here pre-session; this is the agenda + evidence scaffold. The team (Yogesh + MAIN + BE+1 + FE+1) fills the discussion sections live.
> **Facilitator:** Yogesh. **Evidence:** `docs/m5/m5-close-report.md` · `docs/m5/m5-token-usage-summary.md` · per-day EOD reports Day-15→Day-28 · `.claude/memory/feedback_*` entries.

---

## 1. M5 timeline + scope

- **Start:** Day-15 2026-05-10 (M4 closed Day-12/14 2026-05-17 → M5 ramp)
- **Planned close:** Fri Day-25 2026-05-22
- **Actual close:** Wed Day-28 2026-05-27 (~15:00 IST) — **5-day slip** (Fri → Mon → Wed)
- **Slip driver:** orchestrator-absence (Fri+Sat+Mon = 3 calendar days) + AC042 FAIL-then-fix (1 day)

## 2. What shipped ✅

- **4 binding frames:** F19 Run Console (#198) · F22 Defect Detail (#192) · F23 Reports Studio (#203) · F25 Executive Dashboard (#197)
- **F28 Settings & Audit (#214)** — Tier-2 bonus, shipped same-day as close
- **3 ADRs ratified + impl LIVE:** ADR-020 Jira sync · ADR-021 Reports backend · ADR-022 Frontend Bundle workflow
- **AC042 Sherlock RCA corpus eval PASS:** top-2 64% / calibration 1.00 / 0 crashes / n=50
- **Tag:** `m5-closed-2026-05-27`; 28 PRs merged in close cascade

## 3. What didn't ship (carries to Day-29)

- **F26 Agents** — bundle redesign pending Yogesh Claude Design session
- **F27 Users & Roles** — inclusion decision pending (still v1)
- _[team: any other carries?]_

## 4. Cost-gate compliance (Hard Rule 1)

- ✅ $0/month held across M5. Detail: `docs/m5/m5-token-usage-summary.md`.
- Peak resource: Groq ~424/1000 RPD (Day-28, 42% of ceiling).
- _[team: any cost-gate near-misses to flag for M6?]_

## 5. Top friction (discuss + assign owners)

- **F-1 Orchestrator-absence (DOMINANT):** single-human routing → 3 calendar days lost on multi-day gaps. Memory: `feedback_orchestrator_absence_blocks_all_agents.md`. _[discuss: pre-flag gaps ≥48hr? agent-side pre-stage work?]_
- **F-2 AC042 schema-bridge surprise:** full-corpus eval burned on a Zod bug a smoke would've caught. _[discuss: smoke-first eval gates]_
- **F-3 Branch-name collision** (Day-27 `bb4fe51` cross-worktree). _[discuss: explicit push refspec / pre-branch-create hook]_
- **F-4 Binary xlsx merge conflicts** (Day-28 #207). _[discuss: regen-from-source in ceremonies]_
- **F-5 Runbook-ahead-of-reality (×2):** AC042 numbers + "already closed" framing both preceded actual git state. _[discuss: verify-before-act as standing protocol — it worked]_

## 6. Top wins (discuss + codify)

- **W-1 skill v2.2 BEM detection + nested-count probe** — worked across F22/F23 ports.
- **W-2 Plan A2 calibration pattern** — Zod loosen + prompt nudge closed AC042 in <1 day.
- **W-3 ADR-022 §5.9 reserve-allowance precedent** — enabled LLM-assisted corpus labeling under documented trade-off.
- **W-4 Pre-stage scaffold pattern (5×)** — ratification playbook + ceremony prep + EOD skeleton + CHANGELOG additions + mergeability pre-check; each compressed execution-time when the signal fired.
- **W-5 Verify-before-act discipline** — caught 2 fabrication risks before irreversible action.

## 7. Decisions for M6 (ratify in session)

- [ ] Smoke-first eval gates (`pnpm ac042:smoke` before binding eval)
- [ ] LLM-assist provenance flag on every corpus eval run (M6 corpus-governance ADR)
- [ ] Work-log regen-from-source in close ceremonies (no binary diff merges)
- [ ] Human-availability calendar at the front of each milestone plan
- [ ] _[team: pre-branch-create collision hook?]_

## 8. Action items + owners

| #                   | Action | Owner | Due |
| ------------------- | ------ | ----- | --- |
| _[fill in session]_ |        |       |     |

---

_Skeleton authored Day-28 2026-05-27 post-close. Fill §5-§8 discussion + action items live in the Thu Day-29 retro. Evidence pre-linked in §0 header._
