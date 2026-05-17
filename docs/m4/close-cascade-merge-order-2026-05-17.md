# M4 Close — Cascade Merge Order Brief

> **Filed:** Day-20 Sun 2026-05-17 15:30 IST · Day-20 P2 deliverable
> **M4 close target:** 21:00 IST tonight (Sun May 17 reserve day — already activated by Day-19 slip)
> **Tag at close:** `m4-closed-2026-05-17`

---

## TL;DR (operator-facing)

**Cascade is in healthy shape.** Of 6 cascade PRs, 1 is MERGEABLE/CLEAN as-is, 3 conflict on **`docs/CHANGELOG.md` only** (trivial rebase, ~5 min each), 1 needs FE+1 promote (F20 today), 1 needs BE+1 promote (Sherlock orchestrator today).

**Critical action by 18:30 IST:** BE+1 rebases #148 + #161 + #162 to resolve CHANGELOG conflicts. NO code conflicts on any branch — only the `[Unreleased]` section collisions from concurrent main updates.

**Critical action by 18:00 IST:** FE+1 promotes F20 React port PR after visual gate passes (~17:30 IST per Day-20 P3 coordination).

---

## Cascade merge order

Merge sequence (top → bottom) to minimize re-conflict cascade:

| #   | PR                              | Title                                                                                                                        | State                  | Conflicts                                       | Notes                                                   |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| 1   | **#149**                        | feat(api): TestRun service skeleton + state machine (M4 TASK 3 P3)                                                           | **MERGEABLE/CLEAN** ✅ | none                                            | Squash-merge as-is. Most-conflict-free → first to land. |
| 2   | **#148**                        | feat(api): WebSocket gateway for real-time run events (M4 TASK 2)                                                            | CONFLICTING/DIRTY ⚠️   | `docs/CHANGELOG.md` only                        | BE+1 rebase: ~5 min                                     |
| 3   | **#161**                        | feat(api): Sherlock RCA agent #1 (code-agent on gpt-oss-120b) [M4 TASK A4]                                                   | CONFLICTING/DIRTY ⚠️   | `docs/CHANGELOG.md` only                        | BE+1 rebase: ~5 min                                     |
| 4   | **#162**                        | feat(api): Jira webhook receiver with HMAC-SHA256 signature validation [M4 TASK A6]                                          | CONFLICTING/DIRTY ⚠️   | `docs/CHANGELOG.md` only                        | BE+1 rebase: ~5 min                                     |
| 5   | **(new)** Sherlock orchestrator | BE+1 promotes today; combines #161 + remaining 3 agents (data/env/flake) + merge algorithm + Promise.all fan-out per ADR-019 | _not yet opened_       | TBD                                             | BE+1 ETA before close                                   |
| 6   | **(new)** F20 React port        | FE+1 today; first production use of skill v2.1.2 + AdminShell `data-canonical-section` attrs                                 | _not yet opened_       | TBD (likely CHANGELOG.md after #161/#162 merge) | FE+1 ETA ~17:30 IST after visual gate                   |

**Why this order:**

- **#149 first** — clean, no conflicts, sets a clean baseline. Subsequent rebases of #148/#161/#162 land on top of #149.
- **#148 second** — WebSocket gateway is a prerequisite for the Sherlock orchestrator's `defect.sherlock_ready` + `defect.needs_review` event emission (M4 v2 plan §4.7 WebSocket event taxonomy).
- **#161 third** — Sherlock code-agent is the first of 4 Sherlock agents. Sets the canonical pattern that the orchestrator PR (#5) consumes.
- **#162 fourth** — Jira webhook receiver is independent but ships in cascade. Schema migration 0004 (already on main via #144) supports its writes.
- **#5 fifth** — Sherlock orchestrator depends on #148 (event emission) + #161 (one agent pattern). Promote AFTER all four prior PRs land.
- **#6 last** — F20 React port consumes BE endpoints from #149/#148/#161/#162. Merging last keeps FE re-rebase scope minimal if a BE PR slips.

**Docs PRs DEFER to Day-21 docs merge wave** (NOT in this cascade):

- #140 BE Day-17 EOD
- #151 Day-18 progress log (consolidating with Day-19)
- #164 MAIN Day-19 EOD report
- #165 BE Day-19 EOD report

---

## Per-PR conflict diagnosis

### #149 TestRun service — ✅ MERGEABLE/CLEAN

- No action required. Squash-merge.
- Last branch commit: `95406c4 feat(api): test-run service skeleton (m4 p3)`
- 781+ / 0- across 6 files

### #148 WebSocket gateway — ⚠️ CHANGELOG-only conflict

- **Conflict file (1):** `docs/CHANGELOG.md` (`[Unreleased]` collision with #156/#158/#163/#160/#157 landings)
- **Resolution:** BE+1 runs `git fetch origin && git rebase origin/main`. Conflict will be at top of CHANGELOG `[Unreleased]` section. Keep #148's entry below the most-recent main entries (chronological newest-first), drop conflict markers, `git add docs/CHANGELOG.md`, `git rebase --continue`, `git push --force-with-lease`. ~5 minutes.
- 598+ / 26- across 4 files
- Last branch commit: `d8e13e2 feat(api): websocket gateway channels (m4 p2)`

### #161 Sherlock RCA agent #1 — ⚠️ CHANGELOG-only conflict

- **Conflict file (1):** `docs/CHANGELOG.md`
- **Resolution:** Same recipe as #148. ~5 minutes.
- 581+ / 0- across 6 files
- Last branch commit: `9c31dba feat(api): sherlock rca agent #1 (code-agent on gpt-oss-120b) [m4 task a4]`
- ADR-019 ratified Day-19 (already on main) — this PR implements MS4-T016 per the ADR.

### #162 Jira webhook receiver — ⚠️ CHANGELOG-only conflict

- **Conflict file (1):** `docs/CHANGELOG.md`
- **Resolution:** Same recipe as #148. ~5 minutes.
- 1010+ / 59- across 12 files (largest cascade PR)
- Last branch commit: `2f4197e feat(api): jira webhook receiver with hmac-sha256 signature validation [m4 task a6]`
- Followup `(bq)` raw-body webhook middleware: verify implementation matches design from Day-18.

---

## CHANGELOG rebase recipe (paste-ready for BE+1)

For each of #148 / #161 / #162, on the PR's branch:

```bash
git fetch origin
git rebase origin/main
# Open docs/CHANGELOG.md in $EDITOR — conflict will be at the top under `## [Unreleased]`
# Keep BOTH entries: main's recent additions ABOVE, your PR's entry BELOW
# Remove the three <<<<<<< / ======= / >>>>>>> marker lines
git add docs/CHANGELOG.md
GIT_EDITOR=true git rebase --continue
git push --force-with-lease
```

Verify mergeable after force-push: `gh pr view <N> --json mergeable,mergeStateStatus`.

If MERGEABLE/CLEAN within 30 seconds → ready for cascade merge. If still CONFLICTING, ping me — likely a second collision from a parallel merge in the cascade.

---

## Pre-merge CI green check

Before each merge:

```bash
gh pr checks <N>
```

All cascade PRs should show green or "no required checks" status. CI failures BLOCK the cascade — investigate root cause before merging.

---

## M4 close ceremony order (after cascade)

After all 6 PRs land:

1. **18:30-19:00 IST** — BE+1 + FE+1 final smoke against staging deployment
2. **19:00-19:30 IST** — MAIN authors `docs/milestones/m4-close-report.md` + announcement + retro
3. **19:30-20:30 IST** — Yogesh review + amendments
4. **20:30-21:00 IST** — Tag push: `git tag m4-closed-2026-05-17 <main-HEAD-after-cascade>` + `git push origin m4-closed-2026-05-17`
5. **21:00 IST** — M4 CLOSED

Day-21 docs wave (separate from M4 close cascade): #140 + #151 + #164 + #165 merge after M4 close to keep cascade signal clean.

---

## Risks + mitigations

| Risk                                                                                                              | Likelihood                                           | Mitigation                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE+1 rebase introduces fresh code conflict on a later PR (e.g. #162 touches `schema.prisma` after #161's changes) | Low (no code overlap detected)                       | If surfaces during rebase, BE+1 pauses + escalates. ~10 min added per affected PR.                                                                                          |
| F20 visual gate fails at 17:30 IST → FE+1 needs re-port iteration                                                 | Medium (Day-18 F20 was highest violation rate 10.1%) | Sun reserve already activated; iterate same-branch; M4 close pushes to 22:00 if needed.                                                                                     |
| Sherlock orchestrator PR doesn't open today                                                                       | Medium                                               | Acceptable scope cut: M4 ships with #161 (one agent only, MS4-T016 partial); orchestrator + 3 other agents become M5 Day-1 priority. Document scope cut in M4 close report. |
| Sherlock corpus eval (AC042 ≥40%) can't run today (no orchestrator)                                               | High if orchestrator slips                           | AC042 measurement protocol becomes M5 Day-1 close-gate. Document deferral in M4 close report §AC summary.                                                                   |
| GitHub merge wave slows mid-cascade due to required checks recomputing per merge                                  | Medium                                               | Allow 2-3 min between merges for GitHub to re-evaluate mergeable status on remaining PRs.                                                                                   |

---

## Cross-references

- M4 v2 plan: `QA Nexus/PM1/PM1_milestone/M4/Milestone_M4_Runs_Defects_Jira_v2.md`
- ADR-019 Sherlock prompt strategy: `docs/architecture/adr-019-sherlock-prompt-strategy.md`
- Day-19 EOD report (P3 brief commitment): `docs/eod-reports/2026-05-15-day-19-main.md` §4 Tomorrow
- CLAUDE.md Hard Rule 18 amendments Parts 1+2+3 (skill v2.1.2 landed via #158)
- Frame-port skill at `.claude/skills/frame-port/` — used by FE+1 for F20 today

---

_Authored 15:30 IST Sun 2026-05-17 (Day-20). Standing pattern for future milestone closes — fork to `docs/m{N}/close-cascade-merge-order-YYYY-MM-DD.md` per close ceremony._
