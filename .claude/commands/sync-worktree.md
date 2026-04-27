---
description: Refresh the current worktree against origin/main — fetch + pull/rebase + reinstall + typecheck. For parallel-chat workflow.
---

PM1 reusable workflow for keeping worktrees in sync with `origin/main`. Battle-tested during the Day 1 parallel-chat batch (3 worktrees × 2 rebases each — both BE + FE chats had to re-rebase after the hotfix PR landed).

## When to use

- **Tomorrow morning** (or any morning): drain pending main commits into your worktree before starting new work
- **After a peer worktree merges** (e.g., MAIN tells FE "BE merged, please rebase")
- **Before opening a PR** — ensures CI runs against the latest base
- **After landing a stack-touching commit** (locked-deps.json, hooks, etc.) so the working tree matches what hooks expect

## Process

### 1. Identify branch + worktree

```bash
export PATH="$HOME/homebrew/bin:$PATH"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
WORKTREE=$(pwd)
echo "Worktree: $WORKTREE"
echo "Branch:   $BRANCH"
```

### 2. Fetch (always safe; never modifies working tree)

```bash
git fetch origin --prune
```

The `--prune` removes refs to remote branches that have been deleted (e.g., feature/\* branches GH cleaned up after squash-merge).

### 3. Sync strategy depends on branch

#### If on `main`:

```bash
git pull --ff-only origin main
```

`--ff-only` refuses to merge — if local main has diverged from origin (rare; would only happen if I committed directly to main here), abort and surface so Yogesh can decide. Safer than `git pull` which would auto-merge.

#### If on a feature branch (e.g., `feature/f07-founder-onboarding`):

```bash
git rebase origin/main
```

**Most likely conflict point: `.claude/settings.json`.** When both main and the feature branch added permission rules. Resolution: **keep BOTH halves of the conflict** — the JSON allows duplicate entries (Claude Code dedups internally) and a non-destructive merge is always safer than picking one side.

**Other plausible conflict points:**

- `docs/MILESTONES.md` — both added an MS0-T### entry
- `docs/CHANGELOG.md` — both appended to `[Unreleased]`
- `apps/web/components/auth/*` — both touched a shared component

For all of these: prefer **manual resolution**. NEVER auto-resolve with `--ours` or `--theirs` blindly. If unsure: `git rebase --abort` and ask Yogesh.

### 4. Reinstall after rebase (lockfile may have changed)

```bash
pnpm install
```

If `pnpm-lock.yaml` is unchanged from the rebase, this is a no-op (~5s). If it changed (e.g., main added a dep), this resolves the new graph (~30s).

### 5. Typecheck to confirm clean state

```bash
pnpm -r typecheck
```

If this fails after rebase, the rebase introduced a TS regression — likely a type signature changed on main while the feature branch was using the old version. Fix at the call site, NOT by reverting the rebase.

### 6. (Feature branch only) push with consent

If `BRANCH != main`:

```
ASK USER:
"Rebase complete locally. Push to origin/$BRANCH with `--force-with-lease`?
This is the standard rebase-then-push flow.
[yes / no / abort]"
```

On `yes`:

```bash
git push --force-with-lease origin "$BRANCH"
```

(`block-dangerous.sh` line 7 was tightened in P1.13 — the flag-boundary regex now allows `--force-with-lease` while still blocking bare `--force`. If the hook still blocks, file it as a separate bug.)

### 7. Final state report

Print:

```
✓ /sync-worktree complete

  Worktree:        <path>
  Branch:          <branch>
  Local HEAD:      <short-sha> "<commit subject>"
  origin/<branch>: <short-sha> (in sync) | (X commits ahead, Y behind)
  Last fetch:      <timestamp>
  Lockfile:        unchanged | updated (N packages added/removed)
  Typecheck:       PASS | FAIL — <error summary>

Next steps:
  - <if behind>: Run /sync-worktree again or pull manually
  - <if ahead + feature>: Open PR with /commit-push-pr
  - <if main>: Continue with feature work
```

## Hard rules

- **NEVER `git reset --hard`** to "clean up" the working tree — local uncommitted work would be lost. Stash first if needed (`git stash push -m "/sync-worktree pre-rebase"`).
- **NEVER auto-resolve conflicts with `--ours` / `--theirs`** without explicit approval — too risky for files like settings.json or MILESTONES.md.
- **NEVER push to `main`** from this command — main updates go via `/commit-push-pr` + GH PR + squash-merge.
- **NEVER `--force` (without `-with-lease`)** — bare force overwrites whatever's on remote without checking. The lease form refuses if remote moved unexpectedly.
- **ALWAYS run typecheck after rebase** — the most common silent regression.
- **ALWAYS ask before push** — the user owns the commit-to-public boundary.

## Cross-references

- `docs/parallel-work/follow-ups.md` — known rebase patterns + conflict-resolution recipes
- `.claude/hooks/pre-tool-use/block-dangerous.sh` — P1.13-tightened regex; should NOT block `--force-with-lease` anymore
- `/commit-push-pr` — sibling command for opening PRs after sync completes
- `.claude/memory/domain/bugs.md` — bug catalog including the original P1.13 force-with-lease block
