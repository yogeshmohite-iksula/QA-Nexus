# BINDING RULE — Chained-base PR cascade resolution

**Type:** feedback · **Filed:** Thu Day-3 2026-06-04 · **First observed:** Thu Day-3 AM merge wave

## Rule

When a parent PR squash-merges and downstream PRs go DIRTY/CONFLICTING, the resolution is mechanical: temp-branch + rebase against new main + take-ours (`--ours` = main's version) for any add/add or modify/modify conflicts on files that were also in the parent's squash. Never force-push to a worktree-locked branch directly; always use the temp-branch pattern.

## Why this exists

Thu Jun 4 Day-3 AM morning merge wave. 3 of 4 open PRs (#226, #229, #230) went CONFLICTING after Wed's #227 merge advanced main. Each carried commits that #227 had already squashed, so the rebase replay produced add/add conflicts on files that were already authoritative on main. Take-ours resolved every conflict because main HAS the squashed version.

The pattern repeats whenever an agent pulls from another agent's branch BEFORE that branch squash-merges. The agent's pull captures pre-squash commits; squash collapses them; the downstream PR replay then conflicts on the same files.

**Day-3 specifics:**

- **#229 (F26 port):** 5 commits rebased; 2 dropped as upstream (my canned-data + R-002 update from #227); 3 FE commits replayed clean. Zero real conflicts.
- **#226 (Day-2 AM status):** `docs/pilot/risks.md` conflict — HEAD (main) had the RATIFIED R-002 version; incoming had the older "proposed" version. Take-ours (main = truth).
- **#230 (FE Day-2 EOD):** 6 commits; 13 conflicts across 3 rebase steps — canned-data.ts + 10 TSX component files. ALL were shared-history (FE+1 pulled my semantic exports + the F26 port before squash-merge collapsed them on main). Take-ours for every one. 1 additional commit dropped as upstream.

## How to apply

When a downstream PR shows CONFLICTING after a parent merges:

1. Identify the parent PR (likely just-merged with squash)
2. Identify which files in the downstream PR were in the parent's squash
3. `cd` to a clean working dir (NOT the worktree where the downstream branch is checked out)
4. `git fetch origin`
5. If branch is worktree-locked: `git branch -f tmp/resolve-<N> origin/<branch>` + `git checkout tmp/resolve-<N>`
6. If branch is free: `git checkout <branch>` directly
7. `git rebase origin/main`
8. For each conflict on a shared-history file: `git checkout --ours <file>` + `git add <file>`
9. `GIT_EDITOR=true git rebase --continue`
10. Repeat steps 8-9 for each rebase step until "Successfully rebased"
11. `git push --force-with-lease origin [tmp/resolve-<N>:]<branch>`
12. Re-poll: `gh pr view <N> --json mergeable`
13. `gh pr merge <N> --squash`
14. Cleanup: `git branch -D tmp/resolve-<N>` (if used)

**Key insight:** the take-ours decision is safe ONLY when the conflicted file's authoritative version is already on main (i.e., the parent squash landed it). If the downstream PR has UNIQUE changes to the same file that aren't on main, use true-union instead.

## Cross-references

- `feedback_worktree_locked_merge_pattern.md` (the foundational temp-branch + force-with-lease pattern)
- `feedback_chained_base_squash_gotcha.md` (Day-20 — why chained PRs don't survive squash-merge cleanly)
- Day-2 AM 4-PR merge wave (first application — #221→#222→#223→#224 catalogue union)
- Day-3 AM 4-PR merge wave (#228→#229→#226→#230 — this file's precedent)
