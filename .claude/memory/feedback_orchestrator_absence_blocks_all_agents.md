# Orchestrator absence blocks all agents (single-session-blocker friction class)

**Filed:** 2026-05-24 Sun ~16:30 IST (after Fri+Sat 2-day gap; first M5-cycle observation of this failure mode)
**Category:** Multi-agent build pacing · single-human-orchestrator dependency
**Severity:** Medium — does not corrupt state, but freezes throughput entirely for the duration of the gap
**Cross-refs:** `.claude/scratch/m5-friday-close-plan.md` (Day-24 plan that assumed Fri Day-25 close) · `.claude/memory/feedback_session_resume_state_verification.md` (resume-pulse pattern — works only when orchestrator returns)

---

## Observation

The QA Nexus PM1 build runs on a 3-agent design (MAIN orchestrator + BE+1 + FE+1) with **one human (Yogesh) routing between them**. When the human steps away for an extended period (here: Fri 2026-05-22 + Sat 2026-05-23, 2 full days), **all three agents go idle simultaneously**:

- **MAIN** cannot self-trigger the next priority queue without the human's "kickoff" prompt. The skill-mandatory workflows (Hard Rule 18), the ratification meetings (ADR-020 / ADR-021 / ADR-022 cadence), and the daily-EOD ceremony all require the human to issue the start signal.
- **BE+1** has open PRs (#194 + #195 + #189 cascade ready, AC042 corpus eval queued, ADR-020 wire-up FINAL 8 events queued) but cannot independently merge them — `gh pr merge` is the human's action because Yogesh holds the Admin RBAC + the GitHub Actions secret-bearing identity.
- **FE+1** has F19 [PARTIAL] PR #198 + F23 + F26 + F28 queued. The human's approval is needed at Step 3 spec.json review + Step 6 visual gate — the binding Rule 13 visual confirmation gate. Without those, FE+1 cannot ship a frame.

The cumulative effect: the **2-day gap consumed the entire Saturday-reserve allowance** baked into the two-tier M5 close definition (`m5-friday-close-plan.md` §"Sat 2026-05-23 + Sun 2026-05-24 — RESERVE"). The reserve was sized for "AC042 fixes or any slipped frame," NOT for "orchestrator unavailable."

## Why this is a NEW friction class (not a sub-case of existing ones)

The existing friction memos cover:

- `feedback_branch_lineage_drama.md` — git-state recovery patterns (Class 1-4)
- `feedback_parallel_chat_routing_paste_drift.md` — single-human × N-window paste-misroutes
- `feedback_session_resume_state_verification.md` — resume-pulse to verify state on session resume
- `feedback_jira_webhook_20s_budget.md` — webhook latency budget pattern

**None of these address the gap-pattern:** the build halts entirely because the human is the conductor. The friction is **structural**, not technical. The agents are perfectly capable of working, but **none of them can issue work to themselves or to peers** — the architecture is human-in-the-loop by design (Hard Rule 11: "When in doubt, ask Yogesh — never guess"; Hard Rule 13: visual confirmation gate; Hard Rule 14-18: skill-mandatory workflows with human approval gates).

## Implications for milestone planning

1. **Sat-Sun reserve is for slippage, not for orchestrator absence.** M5 close plan §Risk register added 5 risks (bundle quality, FE+1 5-frame load, AC042 corpus, memory-file conflict, memory-file disk-wipe). None of them was "orchestrator unavailable." That was a planning omission.
2. **Multi-day gap shifts the close calendar 1-for-1.** Fri close + 2-day gap = Mon close. No catch-up day exists because every priority queue depends on human-routed approval.
3. **Future milestone plans should call out the human-availability assumption explicitly.** E.g., M6 close plan: "Yogesh availability assumed Mon-Fri 10:00-22:00 IST. Multi-day absences must be flagged ≥48 hr ahead so the plan can compress or shift; treat absence as a 1-for-1 calendar slip, not a buffer burn."

## Mitigations (for future occurrences)

**Cannot remove** — the human-in-the-loop architecture is intentional ($0/mo cost gate + binding security + Hard Rules 11/13/18 = human approval is the trust model). Self-running agents would require either an unattended-approval policy (regressing trust) OR a delegate-human (not feasible at 8-user pilot scale).

**Can mitigate:**

1. **Pre-flag gaps ≥48 hr in advance** via the EOD report. Day-24 EOD did NOT flag Fri-Sat absence; if it had, MAIN could have re-cast the plan to "M5 close shifts to Mon" instead of "Fri close + 2-day reserve burn."
2. **Pre-stage agent-side work that doesn't need human approval.** BE+1 can run unit tests, write internal docs, refactor non-shipped code — anything pre-PR. FE+1 can pre-extract spec.json for future frames, scaffold canned-data.ts files, set up screenshot capture scripts. These don't require approval; they unblock the FIRST hours after the orchestrator returns.
3. **MAIN's pre-stage scaffold pattern (validated 3× already) covers some of this:** pre-drafted Day-25/26 morning briefs, pre-drafted close report skeletons. The pattern doesn't unblock the build during the gap, but it eliminates startup-cost when the gap ends.

## Mark for retro

If this pattern recurs (a second multi-day gap in M5 or M6), upgrade severity from Medium to **High**. The pilot is 18-week timeline; one 2-day gap consumes ~1.3% of total time, which is tolerable. Three or four 2-day gaps would push the milestone calendar out by 2-3 weeks, which becomes a project-level concern.

For M6 planning specifically: add an explicit "Human availability calendar" section at the front of each milestone plan, listing committed work days + known gaps. The plan compresses or shifts based on calendar, not on optimism.

## Cross-references

- `m5-friday-close-plan.md` — the plan that this friction class invalidated mid-cycle
- `feedback_session_resume_state_verification.md` — the pattern that handles resume-after-gap (works once orchestrator returns)
- Kickoff §5 — daily EOD cadence (assumed daily presence; doesn't address multi-day gaps)
- Hard Rules 11 / 13 / 14 / 15 / 16 / 17 / 18 — all human-in-the-loop gates that the orchestrator must clear

---

_Filed Sun 2026-05-24 ~16:30 IST as part of P1c. New friction class — does not amend any existing memo. Cross-reference only._
