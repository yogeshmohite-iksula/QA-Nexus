# M4 Close Retro — Sun 2026-05-17

> **Milestone:** M4 — Runs / Defects / Jira / Sherlock RCA / Frame-port skill
> **Window:** Day-18 Thu 2026-05-14 → Day-20 Sun 2026-05-17 (3-day compressed + Sun reserve activated)
> **Closed:** 19:00 IST Day-20 (ahead of 21:00 target)
> **Tag:** `m4-closed-2026-05-17`
> **Predecessor:** `m3-closed-2026-05-13`
> **Author:** MAIN — consolidates inputs from FE+1 + BE+1 EOD reports + cascade observations.

---

## 1. M4 by the numbers

| Metric                         | Value                  | Note                                                                                                               |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Cascade PRs merged Day-20**  | 6 substantive + 2 docs | #148 / #172 (re-#149) / #161 / #162 / #173 (re-#168) / #169 + #166 + #167                                          |
| **Cascade wall time**          | ~30 min                | 18:30 → 19:00 IST                                                                                                  |
| **Squash gotcha incidents**    | 2                      | #149 → #172, #168 → #173 (chained-base + squash auto-closed children)                                              |
| **Jest tests at close**        | 543/543                | All green on post-cascade main                                                                                     |
| **F20 visual gate rounds**     | 5 (R1-R5)              | All within skill workflow iterate-after-probe loop                                                                 |
| **Day-19 Hard Rule 11 fires**  | 4                      | BE+1 false-merge check · FE+1 false-merge check · FE+1 coordinator-inversion catch · FE+1 SUGGESTED FIX correction |
| **Day-20 Hard Rule 11 fires**  | 0                      | Smooth-execution day — Day-19's 4 fires bought this                                                                |
| **Skill iterations Day-18-19** | 6                      | v1 polish → v2 → v2.1 → v2.1.1 → v2.1.2 → Amendment Part 3                                                         |
| **Skill iterations Day-20**    | 0                      | v2.1.2 + AdminShell attrs held across F21 + F20                                                                    |
| **Kimi CRIT closed**           | 1                      | #155 BetterAuth FE↔BE alignment                                                                                    |
| **Kimi HIGH closed**           | 1                      | #157 AppModule M4 module-import gap                                                                                |
| **Kimi HIGH deferred**         | 4                      | → Day-21/22 hardening per `docs/STATUS.md`                                                                         |
| **M4 ACs landed**              | 30 of 42               | 12 deferred to M5 with explicit landing dates                                                                      |
| **F22 + F18 scope cuts**       | 2 frames + AC016/017   | Sun reserve burned Day-19 slip recovery                                                                            |
| **Cost gate**                  | $0/mo held             | Neon flat 81-82/100 throughout close week                                                                          |

## 2. What worked

- **Discipline scaffolding paid off on lag.** Day-19's 4 Hard Rule 11 fires (false-merge checks, coordinator-inversion catch, SUGGESTED FIX correction) bought Day-20's smooth execution. Rule 11 doesn't fire on its day-of impact; it pays forward.
- **Scratch → promote pattern (BE+1 Sherlock orchestrator).** BE+1 staged the orchestrator in scratch, validated against #161 chained-base, then promoted with 543/543 jest pass. No mid-cascade authoring.
- **Pre-drafted release notes + EOD reports (MAIN).** The Day-19 EOD template + Day-20 EOD pre-draft + M4 release notes file all authored 4-6h before their consumption window. The tag ceremony at 19:00 IST ran `gh release create --notes-file` with zero authoring pressure.
- **Skill production-validated across 2 frames (F21 + F20).** Pattern is stable for the 6 remaining authenticated frames (F19, F22, F23, F25, F26, F28). Close-and-redo at TOOL layer is now one-shot per close week, not per-frame.
- **Cascade brief (PR #166) caught all conflicts in advance.** `gh pr diff --name-only` ∩ `git diff $merge_base origin/main` pre-check Day-20 15:00 IST surfaced that all 3 dirty PRs conflicted on `docs/CHANGELOG.md` only. BE+1 ran the paste-ready rebase recipe; total CHANGELOG-rebase time ~5 min × 3 = 15 min.
- **Two-canonical model held under production.** Day-19 amendment Part 2 (SHELL via F19 React canonical / CONTENT via v2 HTML canonical) absorbed F21 + F20 cleanly with no model amendments needed Day-20.

## 3. What hurt

- **Chained-base + squash gotcha hit 3 times during cascade** (counted by separate retry attempts; 2 distinct PRs affected: #149 and #168). When the chained-base parent is squash-merged, GitHub auto-closes the child PR because the base branch ref no longer points to a commit reachable from main. Resolution was fast (re-open as new PR retargeted to main), but added ~5 min × 2 = 10 min to the cascade. Captured as `feedback_chained_base_squash_gotcha.md` memory + flagged in PR #166 brief.
- **CHANGELOG conflicts compounded across the cascade.** Each merge bumped the [Unreleased] section, forcing subsequent PRs to rebase. 3 separate rebase cycles for #148/#161/#162. Not blocking but accumulated friction. M5 mitigation candidate: per-PR CHANGELOG files merged at close (Keep-a-Changelog ChangeFlow pattern).
- **Visual gate at 5 rounds suggests skill v2.2 needs designer-precision validation pre-human-gate.** F20 took R1-R5 to PASS — all within skill workflow but each round was a 3-5 min FE+1 round-trip + 3-5 min Yogesh review. Skill v2.2 nested-section-count inverse probe could pre-catch ~50% of these by surfacing structural deltas before human review.
- **Day-19 plan slip — Sun reserve burned.** M4 close was supposed to land Sat May 16 per Day-18 kickoff brief. Slipped Day-19 due to skill arc taking 3.5h instead of estimated 1h. Sun reserve absorbed the slip cleanly. Lesson: skill-iteration time is hard to estimate; budget 4-5x for first-iteration skill work.

## 4. What's next — Day-21 priority queue

- **P0 — Skill v2.2 (extract-spec + nested-section-count) before F19/F22 re-ports.** 90-135 min. See `docs/audits/2026-05-17-day-20-skill-audit-m4-close.md` §6 for sequence.
- **P1 — Day-21 docs cascade merge wave.** Remaining HOLD PRs flow Monday: #140 + #151 + #164 + #165 + #170 (Day-20 EOD MAIN) + expected BE+1 + FE+1 Day-20 EODs + the M4 wrap-up bundle PR containing this retro + skill audit + Day-21 brief + CHANGELOG version bump.
- **P2 — F19 + F22 re-ports via skill v2.2.** F19 canonical-shell exemplar (minimal expected drift). F22 largest port (RCA accordion + `needs human review` affordance per M4 v2 §4.6) — first production use of the needs-review affordance with real Sherlock confidence scores.
- **P3 — Followup `(da)` hardening (DB + async/WS + audit).** BE+1 implements `sherlock_runs` DB writes + per-agent audit-log rows + queue-backed retry via `@nestjs/schedule`.
- **P4 — Kimi HIGH triage (4 remaining items).** Per `docs/STATUS.md` Day-21/22 hardening list.
- **P5 — `xlsx` + `pdf-parse` CVE replacements.** Tracked separately; bundle with `(da)` PR or stand-alone.
- **P6 — M5 kickoff: Jira sync wire-up using QNT seed.** Synchronous orchestrator + Jira webhook receiver land Day-20; Day-21 wires them end-to-end against the seeded Jira test data.

## 5. Followup tracking — incorporate (da) (db) (dc) (dd) from BE+1

These followups were captured during M4 cascade work by BE+1:

- **(da)** — Sherlock orchestrator scope cuts: DB persistence + per-agent audit-log rows + queue-backed retry. Day-21 implementation.
- **(db) / (dc) / (dd)** — TBD per BE+1's Day-20 EOD (when it lands as PR sibling to #170). MAIN to update `docs/STATUS.md` Day-21 hardening list once BE+1 EOD merges.

## 6. M5 readiness

- **30 of 42 M4 ACs landed** + 12 deferred to M5 with explicit landing dates. Per M4 close release notes §AC summary.
- **F22 + F18 scope cuts** taken cleanly Sun reserve. M5 Day-1 + Day-2 priorities.
- **AC042 (Sherlock RCA accuracy ≥40%)** corpus eval runs Day-21 against synchronous orchestrator (no DB cost, no async dependency). 200 LLM calls = 20% of `gpt-oss-120b` 1k RPD.
- **Kimi review:** 1 CRIT + 1 HIGH closed; 4 HIGH on Day-21/22 hardening list.
- **Skill v2.2 + Hard Rule 18 Part 4** likely Day-21 → unblocks the 6 remaining frame ports cleanly.

## 7. Cross-references

- M4 close release notes: `docs/m4/m4-close-release-notes.md`
- M4 close cascade brief: `docs/m4/close-cascade-merge-order-2026-05-17.md`
- Skill audit Day-20: `docs/audits/2026-05-17-day-20-skill-audit-m4-close.md`
- Day-20 EOD MAIN: `docs/eod-reports/2026-05-17-day-20-main.md` (PR #170)
- Tag on GitHub: `m4-closed-2026-05-17`
- CLAUDE.md Hard Rule 18 + Day-19 amendments Parts 1+2+3
- Memory: `feedback_skill_audit_cadence.md` (audit cadence) · `feedback_chained_base_squash_gotcha.md` (Day-20 lesson)
- M3 close retro: `docs/retros/2026-05-13-m3-retro.md`

---

_Filed Day-20 ~21:30 IST post-cascade + post-tag, consolidating MAIN observations from the close week. BE+1 + FE+1 retro inputs to be folded in via PR comments once their Day-20 EODs land Day-21._
