# Worktree-locked branch merge/conflict-resolution pattern

**Type:** feedback · **Filed:** 2026-06-03 (Day-2 AM, pilot push) · **First use:** Wed Day-2 4-PR merge wave

## The problem

When a PR's source branch is checked out in a **sibling git worktree** (e.g. `docs/fe-day-1-pilot-push` is checked out in `Project10-QA_Nexus-frontend`, `docs/be-day-1-pilot-push` in `Project10-QA_Nexus-backend`), the main worktree **cannot** `gh pr checkout <N>` or `git checkout <that-branch>` — git refuses:

```
fatal: '<branch>' is already used by worktree at '<path>'
```

This blocks the normal "checkout → rebase → resolve conflict → push" flow MAIN uses to union-resolve add/add catalogue conflicts during a merge wave.

## The pattern (validated Day-2 AM, zero data loss)

Resolve on a **differently-named temp branch**, then `--force-with-lease` to the original remote ref:

```bash
# 1. temp branch tracking the worktree-locked remote (different LOCAL name → no collision)
git branch -f tmp/<pr>-resolve origin/<locked-branch>
git checkout tmp/<pr>-resolve

# 2. rebase onto main → surfaces the conflict
git rebase origin/main
#    resolve (UNION for complementary content; --ours for already-upstream shared commits)
git add <file>; GIT_EDITOR=true git rebase --continue

# 3. force-with-lease to the ORIGINAL remote ref (updates origin, not the local worktree checkout)
git push --force-with-lease origin tmp/<pr>-resolve:<locked-branch>

# 4. standard merge proceeds (re-poll mergeable; UNSTABLE = CI re-running, non-blocking)
gh pr merge <pr> --squash

# 5. cleanup
git branch -D tmp/<pr>-resolve
```

**Used Day-2 AM for PR #222 (FE worktree-locked) + PR #223 (BE worktree-locked).** Both had add/add catalogue conflicts; both union-resolved (FE frontend baseline + Yogesh rulings + BE backend F-1..F-8), all 3 contributions preserved.

## Why force-with-lease to a worktree-locked remote is safe here

- The push updates `origin/<branch>`; the sibling worktree's LOCAL copy just goes behind → they re-sync via `git pull` on their next session (normal).
- `--force-with-lease` (not `--force`) aborts if origin moved unexpectedly — protects against clobbering a concurrent push.
- Only do this for **done/EOD-doc branches** (not branches the other agent is actively committing to). Day-1 EOD branches were done; FE/BE were on different (F26 port / NFR) branches.

## Gotchas hit Day-2 AM

- **`gh pr checkout` fails silently-ish** (`exit status 128`) when worktree-locked — easy to miss in a `&&` chain. Verify `git branch --show-current` after.
- **Shared-history conflicts** when PR-B branched off PR-A's branch: every shared commit replays as a conflict. Take `--ours` (main) for already-upstream shared commits; true-UNION only on the genuinely divergent file.
- **Shell-concat unions fail the prettier pre-push gate** — `prettier --write` the unioned file + add a format commit on top (squash-merge erases it). **Never `--no-verify`.**

## Cross-references

- `.claude/memory/feedback_branch_lineage_drama.md` (sibling — branch-state recovery patterns)
- M5 #193/#207 memory-file + xlsx union conflicts (same union discipline, non-worktree-locked)
- Day-2 AM 4-PR merge wave: #221 → #222 → #223 → #224 (main `a635fff → 41e3653`)
