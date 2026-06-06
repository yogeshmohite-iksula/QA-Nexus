# BINDING RULE — Multi-worktree git working-tree drift

**Type:** feedback · **Filed:** Sat Day-3+4 2026-06-06 · **First observed:** Sat Day-3+4 ~12:30 IST (BE+1 26th reality-check) · Replayed Sat ~12:55 IST on MAIN worktree

## Rule

When multiple git worktrees share underlying `.git` resources (single repo, multiple linked worktrees via `git worktree add`), the working tree state can drift between worktrees independently of commits. **Symptom:** files showing as deleted (`D` status) in one worktree's `git status` while origin/main still has them and another worktree's working tree still has them on disk.

**Mitigation pattern (in order):**

1. **Always use explicit-path `git add`** (`git add <file>` not `git add .` / `git add -A`), so drift never reaches a commit.
2. **Verify origin/main truth:** `git ls-tree origin/main -- '<path>'` to confirm files are safe upstream.
3. **Clear local drift:** `git restore '<path>'` (singular or multiple paths) to bring the working tree back in sync with HEAD.
4. **Branch creation should reuse main HEAD explicitly:** `git checkout -b <new-branch> origin/main` (not `git checkout -b <new-branch>`) to avoid inheriting drifted state from whatever branch was previously checked out in this worktree.

## Why this exists

Sat Jun 6 ~12:30 IST. BE+1 26th reality-check: 5 locked PM1_UI_v2 HTML frames (`F26 Agents.html`, `F26m1 Agent Model Assignment.html`, `F27 Users and Roles.html`, `F27m1 Invite User Modal.html`, `F28m1 LLM Provider Configuration.html`) showed `D` (deleted) status in BE+1 worktree's `git status` — caused by cross-worktree `.git` churn during FE+1's frame work. The files still existed on disk in FE+1's worktree AND on `origin/main`. Yogesh ran `git restore '<path>'` against the 5 paths and the BE+1 working tree returned to clean. PR #238 used explicit-path staging so the spurious deletions never reached the PR.

**Same hazard replayed on MAIN worktree Sat ~12:55 IST** — after `git pull` to fetch #238's merge into local main, the same 5 frames showed `D` status on MAIN worktree. Recipe worked identically: `git restore "QA Nexus/PM1/PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/<frame>.html"` cleared the drift cleanly. Confirms the pattern is cross-worktree, not BE-specific.

**Related near-miss Sat ~18:30 IST (10th pattern candidate):** MAIN worktree branch creation `git checkout -b docs/main-day-3-4-evening origin/main` silently put the working tree on FE+1's existing checked-out branch `feat/web-f27m1-invite-user-port` instead — the new branch ref was created BUT `HEAD` ended up pointing at FE+1's branch (worktree-locked behavior). A subsequent commit accidentally landed on FE+1's branch. Recovery: cherry-pick to the intended branch + branch-pointer reset of FE+1's branch back to clean main (FE+1's actual work-in-progress was uncommitted in their worktree's index, so reset was safe). Same `.git` resource-sharing root cause.

## How to apply

**Before any commit in a multi-worktree repo:**

1. Verify current branch + worktree match expectations: `git status` + `git branch --show-current` + `pwd`
2. Inspect working tree state: `git status --short` (use `--short` to keep output small)
3. If any locked-frame paths show `D` / `M` unexpectedly:
   - Confirm origin truth: `git ls-tree origin/main -- '<path>' | head -3`
   - If safe upstream: `git restore '<path>'` (one or many)
4. Stage with explicit paths: `git add <intended-files>` — NEVER `git add .` / `git add -A` in a multi-worktree repo
5. Commit + verify HEAD: `git log --oneline -2` to confirm the new commit landed on the expected branch
6. If wrong branch: cherry-pick to the intended branch + reset the wrong branch back to its prior tip

**After every `git pull` in any worktree:** re-run step 2-3 above before any further git operation. The pull surfaces cross-worktree drift that was previously latent.

## Cross-references

- `feedback_worktree_locked_merge_pattern.md` (foundational pattern — temp-branch + force-with-lease for worktree-locked branches)
- `feedback_multi_worktree_env_discipline.md` (sibling — `.env` file misroute hazard, same multi-worktree class)
- `feedback_multi_worktree_chat_misroute.md` (sibling — chat instance misroute, same class)
- `feedback_chained_base_cascade_resolution.md` (cousin — chained-base drift from squash-merges)
- BE+1 25th reality-check (chat misroute, 8th pattern)
- BE+1 26th reality-check (Sat 2026-06-06 — primary precedent for this pattern)
- MAIN replay Sat 12:55 IST + branch-creation drift Sat 18:30 IST (cross-worktree confirmation)
