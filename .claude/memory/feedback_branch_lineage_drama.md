# feedback — branch-lineage drama (Day-22 retro candidate, 2026-05-19)

**Status:** **M5 retro candidate.** Single biggest session-time leak of Day-22 (~30% of MAIN session, similar reported by BE+1 chat).

## TL;DR

Multi-agent sessions (MAIN + BE+1 + FE+1 + multiple background agents) operate on the **same shared local repo working tree**. Each agent independently runs `git checkout`, `git stash`, `git commit`. None of them coordinate. The result is a thrashing sequence of branch switches, stashed/unstashed WIP, and commits landing on the wrong branch — costing each agent significant recovery time per incident.

**Workaround that worked Day-22:** `cat > /tmp/file && git checkout -B <branch> origin/main && cp /tmp/file <path> && git add + commit` (the "cat-heredoc workaround"). This bypasses the in-place file modifications that get tangled with other agents' stashes.

**Invariant that should have prevented all incidents:** every branch creation must `branch-from-origin/main-HEAD` (not from current local HEAD). Today's drift incidents ALL traced to commits landing on the wrong local-HEAD because background agents had moved local HEAD between my `git checkout -b` and my `git commit`.

## The 4 incident classes observed Day-22

### Class 1 — silent branch reset under foot

Background agent does `git reset --hard origin/main` on my active branch while I'm editing.

Example: 12:08:33 — `89a5550 HEAD@{...}: reset: moving to origin/main` in reflog. My commit `b924e1b` (ADR-020 ratification) was 3 minutes old; the reset dropped it from the branch tip silently. Recovery: identify in reflog, cherry-pick, force-push.

### Class 2 — wrong-branch commit hijack

I run `git add docs/architecture/adr-021-reports-backend.md && git commit -m "..."`. Simultaneously, a background BE+1 agent has staged 4 apps/api files. My commit aggregates everything into one commit with the WRONG message (whichever agent's commit-msg ran).

Example: commit `fa444a4 fix(api): xlsx → exceljs swap` includes BOTH my ADR-021 file AND BE+1's xlsx swap files. My intended commit message was lost. Recovery: cat-heredoc workaround on a fresh branch.

### Class 3 — stash drift across branches

I run `git stash push -m "wip-A"` on branch A. Background agent does `git checkout B`. My stash now belongs to "On B: wip-A". When I `git stash pop`, the stash applies to branch B, not branch A.

Day-22 observed: stash@{0}: WIP on feat/api-sherlock-orchestrator-hardening-da (background-agent branch) instead of my intended `feat/main-skill-v2.2-bem-section-detection`.

### Class 4 — uncommitted-WIP leakage

Background agent commits a half-finished file (xlsx-parser.ts edited to use exceljs, but package.json still references xlsx). Pre-push typecheck fails on MY push because the typecheck runs over the whole workspace. Cost: 5-10 min stashing + restoring to push my unrelated docs change.

## The cat-heredoc workaround (Class 1 + 2 recovery)

```bash
# 1. Save the in-progress file content to /tmp
cp docs/architecture/adr-021-reports-backend.md /tmp/adr-021-backup.md

# 2. Fresh branch from origin/main HEAD (the always-correct base)
git fetch origin --quiet
git checkout -b docs/main-adr-021-reports-backend-clean origin/main

# 3. Restore the file from /tmp
cp /tmp/adr-021-backup.md docs/architecture/adr-021-reports-backend.md

# 4. Commit + push (this branch's HEAD is now clean + reproducible)
git add docs/architecture/adr-021-reports-backend.md
git commit -m "<msg>"
git push -u origin docs/main-adr-021-reports-backend-clean:docs/main-adr-021-reports-backend
```

This bypasses ALL background-agent interference because the branch is freshly created in MY shell, with the file content I control via /tmp.

## The branch-from-origin-HEAD invariant (Day-23+ proposal)

Codify: every `git checkout -b <new-branch>` MUST be sourced from `origin/main` (after a `git fetch`), NEVER from local HEAD. The reason: local HEAD is the shared mutable state that gets thrashed by background agents; `origin/main` is the only single-source-of-truth that all agents have to fetch from explicitly.

**Enforcement options:**

1. **Pre-tool-use hook on Bash:** intercept `git checkout -b` calls + force `--no-track origin/main` if user provided no source. Cheap; targeted.
2. **Skill in `.claude/skills/branch-discipline/`:** wraps `git checkout -b` with the fetch + origin/main pattern. Opt-in; explicit.
3. **Documentation only:** add to CLAUDE.md as a section. Lowest-friction; relies on adherence.

**Recommended:** option 1 + a CLAUDE.md note documenting why.

## Cost tally (Day-22 observed)

| Time  | Incident                                       | Recovery cost |
| ----- | ---------------------------------------------- | ------------- |
| 12:08 | Class 1 — branch reset on ADR-020 ratification | ~10 min       |
| 12:14 | Class 2 — wrong-branch commit on ADR-021       | ~8 min        |
| 12:16 | Class 4 — xlsx WIP blocks docs push            | ~5 min        |
| 12:20 | Class 1 again — branch reset on ADR-021        | ~7 min        |

**Total Day-22 recovery cost: ~30 min** out of a 6.5-hour compressed session = ~8% of session time. (BE+1 reported similar ratio in their Day-22 EOD.)

## Cross-references

- `feedback_session_resume_state_verification.md` — sibling memory; resume-state pulse is the prevention; this memory is the recovery cost
- `feedback_chained_base_squash_gotcha.md` (Day-20) — earlier instance of branch lineage class issues, different failure mode
- M5 retro candidate: pre-tool-use hook `assert HEAD == origin/main HEAD before any Edit/Write commits`
- Day-23 brief P3 — "ADR-022 candidate decision" needs to factor this in; if branch drama recurs Day-23, postpone ADR-022 and prioritize the hook

## M5 retro talking points

1. Cost is real + repeatable (not a one-off)
2. Cat-heredoc workaround proves the cost is ~8 min per incident, not 0
3. Branch-from-origin-HEAD invariant is enforceable via a Bash pre-tool-use hook (cheapest mitigation)
4. The cost falls on EVERY agent (not just MAIN), so M5 retro should surface it as a multi-agent-coord issue, not a personal-discipline issue

---

_Entry Day-22 2026-05-19 ~17:30 IST. Promote to RETROS.md at M5 close. M5 retro has at least 3 candidates filed this week (changeset-per-PR, branch-from-origin-HEAD hook, BG-agent coord)._
