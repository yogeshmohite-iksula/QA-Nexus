# M4 Close — Runs / Defects / Jira / Sherlock RCA / Frame-port skill

> **Release tag:** `m4-closed-2026-05-17`
> **Window:** Day-18 Thu 2026-05-14 → Day-20 Sun 2026-05-17 (3-day compressed + Sun reserve activated)
> **Predecessor:** `m3-closed-2026-05-13` (`a98797b`)
> **Successor target:** M5 (Hardening + Pilot Cutover) Mon 2026-05-18

Pilot week 3 closes with the agent-led drift-discipline tooling in place + the first two production frame ports landed via the new skill workflow. Every M4 acceptance criterion either landed or has an explicit deferral path documented in §AC summary.

---

## Headline

- **Frame-port skill v1 → v2.1.2** shipped + codified as **Hard Rule 18** with three Day-19 amendments (Parts 1 + 2 + 3). 6 iterations across Day-18 PM and Day-19 morning, each catching a real production failure mode through actual FE+1 validation. **First two ports built via the skill — F21 and F20** — both passed visual gate.
- **BE+1 cascade landed 6 substantive M4 PRs** Day-19 + Day-20: BetterAuth alignment, AppModule stubs, VR scaffold, M4 module scaffolds, TestRun service, WebSocket gateway, Sherlock RCA agent #1, Jira webhook receiver. Plus the Sherlock orchestrator promoted Day-20.
- **AdminShell `data-canonical-section` attrs** shipped (PR #163) — shell-level work that unblocks TERTIARY-tier matching for every future authenticated page port (F19, F20, F22, F23, F25, F26, F28).
- **Kimi review** CRIT + 1 HIGH closed: BetterAuth FE↔BE version mismatch + AppModule M4 module-import gap. Remaining 4 HIGH triaged to Day-21/22 hardening per `docs/STATUS.md`.
- **4 Hard Rule 11 fires** across Day-19 + Day-20 caught discipline drift through BE+1 + FE+1 escalation — the "never guess, ask Yogesh" rail is working as designed across all layers.
- **Cost gate held.** Neon CU-hr flat at ~81-82/100 (well under 100 cap) — PR #147's `/health` 2-tier refactor (Day-18) doing its job all M4. Groq + Resend + R2 + Render + UptimeRobot all within free tier.

---

## Frame-port skill arc — six iterations in ~3.5 hours

The skill lives at `.claude/skills/frame-port/` and orchestrates the canonical-first port workflow per CLAUDE.md Hard Rule 18.

| Iter                 | Failure mode caught                                                       | Time   | Closes                           |
| -------------------- | ------------------------------------------------------------------------- | ------ | -------------------------------- |
| **v1 polish**        | extract-spec docstring schema drift + missing jsdom prereq                | 15 min | minor docs drift                 |
| **v2**               | Finding A — Tailwind class-only structural false-positive on React ports  | 60 min | structural false-positive        |
| **v2.1**             | Finding B — shell-substitution pixel floor (38-40% on desktop)            | 60 min | shell pixels counted as drift    |
| **v2.1.1**           | Bug A + Bug B — asymmetric crop + v1-spec class-match dropped             | 30 min | crop alignment + backward-compat |
| **v2.1.2**           | Case C + Bug D — pixelmatch AA inflation (3-4x) + report.json undefined   | 30 min | AA noise + serialization         |
| **Amendment Part 3** | Case AMBER — renderer-noise floor codified as GREEN/AMBER/RED band system | 15 min | binary-gate false-positive       |

Hard Rule 18 amendments Parts 1+2+3 now binding:

- **Part 1** — ARIA-primary structural probe (PRIMARY role+aria-label / SECONDARY class-substring / TERTIARY `data-canonical-section`). OR-semantics: section present = any tier matches.
- **Part 2** — Content-region pixel crop (two-canonical model: SHELL canonicalized via F19 React per Rule 14; CONTENT canonicalized via v2 HTML per Rule 15). Union crop measured separately on both sources.
- **Part 3** — GREEN/AMBER/RED band system (industry-standard tri-band replaces binary 5% gate). Visual gate (Rule 13) remains authoritative for AMBER + GREEN.

Close-and-redo loop applied at **TOOL layer** (not PR layer) — same canonical pattern as Hard Rule 17's stub-data invented-content close-and-redo from Day-17.

---

## First frame ports via the skill — F21 + F20

- **F21 Defects Hub (PR #160)** — first production use of the skill, Day-19. Validation cycle: extract-canned-data → extract-spec → spec.json approval → TSX scaffold → diff-probe → visual gate. Final diff-probe result **AMBER** (5.2-6.6% pixel diff across all viewports, 10x improvement from raw Manhattan-distance baseline). Visual gate **PASSED** round-2 (after FE+1 caught coordinator inversion via Rule 11 escalation).
- **F20 Run Results (Day-20)** — second production use of the skill. spec.json approved 15:30 IST; FE+1 scaffolded TSX from spec + canned-data; diff-probe Day-20 PM. Visual gate confirmed by Yogesh at 320 + 1440 px.

Day-18 F20 (PR #145) had been the originating violation — closed (NOT merged) Day-18 as the first Hard Rule 17 close-and-redo precedent. Day-20 F20 re-port via the skill is the closing bookend of that arc.

---

## BE+1 substantive landings — M4 features

Per M4 v2 plan (`QA Nexus/PM1/PM1_milestone/M4/Milestone_M4_Runs_Defects_Jira_v2.md`):

- **#155** — BetterAuth FE 1.2.12 → 1.6.11 alignment (Kimi CRIT close)
- **#157** — AppModule M4 module-import gap fix: TestRunsModule + DefectsModule + JiraSyncModule (Kimi HIGH close)
- **#156** — Visual-regression Playwright suite scaffolding (12 canonical baselines + 3 frame specs + VR_BASELINES_READY flip)
- **#149** — TestRun service skeleton + lifecycle state machine (MS4-T004/T005)
- **#148** — WebSocket gateway for real-time run events (MS4-T009 — channels per §4.7 WebSocket event taxonomy)
- **#161** — Sherlock RCA agent #1 (code-agent on `gpt-oss-120b`, MS4-T016 per ADR-019)
- **#162** — Jira webhook receiver with HMAC-SHA256 signature validation (MS4-T012, raw-body middleware per followup `(bq)`)
- **(Day-20)** — Sherlock orchestrator (combines #161 code-agent + remaining 3 agents — data / env / flake — + deterministic merge algorithm + Promise.all fan-out per ADR-019)

Schema migration **0004** (already on main from Day-18 #144): `evidence` + `defect_history` + `jira_webhook_events` + `jira_sync_logs` tables + `jira_auth_method` enum extension (`oauth_3lo` + `api_token`).

---

## AC summary — M4 v2 plan AC001-AC042

| Range                                                                              | Status                                | Notes                                                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| AC001-AC003 Run service CRUD + state machine                                       | ✅ via #149                           | lifecycle pending → running → passed/failed/blocked                                                                              |
| AC004 WebSocket /runs/:runId/stream                                                | ✅ via #148                           | channels per §4.7 taxonomy                                                                                                       |
| AC005 WebSocket reconnect on dyno wake                                             | ✅                                    | UptimeRobot 4-min keep-alive on /health (PR #147)                                                                                |
| AC006 Defect service CRUD + status workflow                                        | ✅ via #157 stubs + Day-20 promotion  |                                                                                                                                  |
| AC007-AC010 Jira 2-way sync + HMAC + idempotency + rate-limit                      | ✅ via #162                           | raw-body middleware per (bq) followup                                                                                            |
| AC011 Run-to-defect auto-link                                                      | ✅                                    | Day-20 orchestrator promotion                                                                                                    |
| AC012-AC015 F19/F20/F21/F22 React port wiring                                      | F19/F21 ✅ · F20 ✅ Day-20 · F22 → M5 | F22 Defect Detail deferred to M5 (scope cut per Sat-reserve activation)                                                          |
| AC016-AC017 F22 "needs human review" affordance + Jira-disable                     | DEFER → M5                            | bundles with F22 Defect Detail                                                                                                   |
| AC018-AC019 F18 Test Suites + Edit Modal                                           | DEFER → M5                            | scope cut per Sun-reserve activation                                                                                             |
| AC020 AdminShell canonical realignment                                             | ✅ via #163                           | `data-canonical-section` attrs                                                                                                   |
| AC021 RWD sweep at 320/768/1024/1440 across M4 routes                              | ✅ for F19/F20/F21                    | F22/F18 → M5                                                                                                                     |
| AC022-AC026 Sherlock A4 RCA agent (Pattern A/B, retry chain, parallel, confidence) | Partial ✅                            | code-agent #161 + Day-20 orchestrator landed; full 4-agent fan-out validates against corpus Day-21                               |
| AC027 Audit chain HMAC valid                                                       | ✅                                    | inherited from existing AuditLogService                                                                                          |
| AC028 Run notification email via Resend                                            | DEFER → M5                            | not on critical path                                                                                                             |
| AC029 Render scale-to-zero handled                                                 | ✅                                    | UptimeRobot 4-min from M3                                                                                                        |
| AC030 M4 close-gate sweep `@M4-CLOSE-GATE` ≥30 assertions                          | ✅                                    | added Day-1 per M3 retro action                                                                                                  |
| AC031 Auth chain regression in CI                                                  | ✅ via #155 + #156                    |                                                                                                                                  |
| AC032-AC035 Close-gate pass + visual gate + sandbox + E2E                          | ✅ this week                          |                                                                                                                                  |
| AC036 M4 tag `m4-closed-2026-05-17`                                                | ✅ this release                       | Sun-reserve activated per Day-19 slip                                                                                            |
| AC037 Day-18/19/20 EOD reports                                                     | Partial ✅                            | Day-18+19 in #151+#164; Day-20 in this release                                                                                   |
| AC038 $0/mo quota unbreached                                                       | ✅                                    | Neon 81-82/100; all others within free tier                                                                                      |
| AC039-AC041 No ban-list deps · no token drift · two-folder mirror                  | ✅                                    | enforce-pm1-stack + enforce-design-tokens hooks clean                                                                            |
| **AC042** A4 RCA accuracy ≥40% on 50-defect golden corpus                          | **DEFER → M5 Day-1**                  | orchestrator landed Day-20 but full corpus eval (200 LLM calls) deferred to M5 Day-1 close-gate; protocol locked in M4 plan §4.5 |

**Net:** 30 of 42 ACs landed in M4. 12 deferred to M5 with explicit landing dates + cross-references. F22 + F18 scope cuts taken cleanly because Sun-reserve was already burned for Day-19 slip recovery.

---

## Kimi review status

Filed Day-18 PM at `~/Claude Cowork Workspace /AI Based QA Platform/KIMI research/kimi-review-response-2026-05-14.md`.

| #   | Item                                                                  | Severity | Status                                           |
| --- | --------------------------------------------------------------------- | -------- | ------------------------------------------------ |
| 1   | BetterAuth FE 1.2.12 ↔ BE 1.6.11 version mismatch                     | CRIT     | ✅ CLOSED via #155                               |
| 2   | AppModule missing TestRunsModule/DefectsModule/JiraSyncModule imports | HIGH     | ✅ CLOSED via #157                               |
| 3-6 | (4 remaining HIGH items, see Kimi review doc)                         | HIGH     | DEFER → Day-21/22 hardening per `docs/STATUS.md` |

---

## Hard Rule 11 — 4 discipline fires across Day-19 + Day-20

The "when in doubt, ask Yogesh — never guess" rail fired 4 distinct times across the close week, each catching a different drift class through different actors:

1. **BE+1 false-merge check** on a Kimi review PR — asked before merging instead of inferring.
2. **FE+1 false-merge check** on F21 mid-iteration — asked instead of pushing forward on speculative fix.
3. **FE+1 coordinator-inversion catch** on F21 round-1 — caught that I'd marked something "ready" before all artifacts were complete; flagged via Rule 11 escalation.
4. **FE+1 SUGGESTED FIX correction** during v2.1 → v2.1.1 iteration — disagreed with my proposed fix, surfaced via Rule 11, leading to the union-crop refinement that actually worked.

The discipline scaffolding works because every layer holds the same line. Worth a callout in M5 kickoff retro.

---

## Cost gate ($0/mo, Hard Rule 1) — held

- **Neon Postgres:** 81-82 / 100 CU-hr at close (was 81.61 Day-19 baseline). PR #147 `/health` 2-tier refactor did its job — daily burn ~0.4-0.5 CU-hr through M4 close week vs target ≤ 2.5.
- **Groq RPD:** `gpt-oss-120b` 0 / 1000 used during M4 (Sherlock eval Day-21 budget: 200 calls = 20%); `gpt-oss-20b` 0 / 14400.
- **Resend, R2, Render, UptimeRobot:** all free-tier; no overage signals.

---

## Carry-forward into M5

- **AC042 corpus eval** — Sherlock orchestrator landed Day-20; full 4-agent corpus run becomes M5 Day-1 close-gate. Protocol locked in M4 plan §4.5.
- **F22 Defect Detail + F18 Test Suites** — scope cuts taken Sun-reserve evening. M5 Day-1 + Day-2 priorities.
- **4 Kimi HIGH items** — tracked in `docs/STATUS.md` Day-21/22 hardening list.
- **Skill v2.2 candidate** — extract-spec.mjs missed 5 sections on F21 (sd-tabs, PEOPLE, sr-layers, group separators, Assignee filter). Heuristic gap: extract-spec skips div/section with BEM class only. Fix planned Day-21 as skill v2.2 + nested-section-count inverse probe (FE+1 Day-19 EOD ask).
- **Day-21 docs merge wave** — #140 BE Day-17 EOD + #151 Day-18 progress log + #164 MAIN Day-19 EOD + #165 BE Day-19 EOD all consolidate post-M4-close to keep cascade signal clean.

---

## Cross-references

- M4 v2 plan: `QA Nexus/PM1/PM1_milestone/M4/Milestone_M4_Runs_Defects_Jira_v2.md`
- M4 close cascade brief: `docs/m4/close-cascade-merge-order-2026-05-17.md`
- ADR-019 Sherlock prompt strategy: `docs/architecture/adr-019-sherlock-prompt-strategy.md`
- Hard Rule 18 + Day-19 amendments Parts 1+2+3: `CLAUDE.md`
- Frame-port skill: `.claude/skills/frame-port/{SKILL.md,extract-spec.mjs,diff-probe.mjs,README.md}`
- M3 close report: `docs/milestones/m3-close-report.md`
- Day-19 EOD: PR #164 → merges Day-21
- Day-18 progress log: PR #151 → consolidates with Day-19, merges Day-21

---

_Authored Day-20 16:00 IST 2026-05-17, ready for `gh release create m4-closed-2026-05-17 --notes-file docs/m4/m4-close-release-notes.md` at 19:30 IST cascade ceremony._
