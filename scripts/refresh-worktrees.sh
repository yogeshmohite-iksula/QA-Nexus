#!/bin/bash
# refresh-worktrees.sh — pull latest main into each worktree + reinstall deps.
#
# Run from main repo root: ./scripts/refresh-worktrees.sh
#
# Saves the 3-sequence morning ritual (cd worktree → git fetch → git pull/rebase
# → pnpm install ×3 worktrees ≈ 3 minutes manual) by doing it all in one shot.
#
# Established 2026-04-27 EOD per Day 2 prep (Task 8 in the late-session batch).
#
# Behavior per worktree:
#   - main:               git pull --ff-only origin main (safe; never auto-merges)
#   - feature/* branches: skipped — use /sync-worktree slash command instead
#                         (it handles rebase + conflict resolution + push consent)
#
# After running, each worktree is up to date on its current branch and
# `node_modules/` reflects the latest `pnpm-lock.yaml`. Typecheck not run here
# — that's the responsibility of /deploy-check or the pre-push hook.

set -e

# Yogesh's machine: Homebrew at non-standard path (~/homebrew/bin/), not
# /opt/homebrew/bin/ or /usr/local/bin/. Sub-shells need this PATH prefix
# because they don't source ~/.zprofile (zsh-only) or ~/.bashrc (bash login).
export PATH="$HOME/homebrew/bin:$PATH"

WORKTREES=(
  "$HOME/AI_Tester_Project/Project10-QA_Nexus"
  "$HOME/AI_Tester_Project/Project10-QA_Nexus-frontend"
  "$HOME/AI_Tester_Project/Project10-QA_Nexus-backend"
)

REFRESHED=0
SKIPPED=0
ERRORS=0

for worktree in "${WORKTREES[@]}"; do
  if [ ! -d "$worktree" ]; then
    echo "⚠ Skipping $worktree (does not exist — worktree was removed?)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  Refreshing: $worktree"
  echo "═══════════════════════════════════════════════════════════════"

  cd "$worktree"

  branch=$(git rev-parse --abbrev-ref HEAD)
  echo "  Branch: $branch"

  # Always fetch (safe — never modifies working tree)
  git fetch origin --prune --quiet
  echo "  ✓ Fetched origin (pruned stale refs)"

  if [[ "$branch" == "main" ]]; then
    # Fast-forward only — refuse to merge if local diverged from origin
    if git pull --ff-only origin main; then
      echo "  ✓ Pulled origin/main (fast-forward)"
    else
      echo "  ✗ git pull --ff-only failed — local main diverged from origin?"
      echo "    Run /sync-worktree manually to investigate."
      ERRORS=$((ERRORS + 1))
      continue
    fi
  else
    echo "  ⚠ On feature branch '$branch' — auto-rebase NOT performed."
    echo "    Run /sync-worktree from inside this worktree to rebase + push."
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Reinstall deps in case lockfile changed during the pull
  if pnpm install --silent; then
    echo "  ✓ pnpm install (deps in sync with lockfile)"
  else
    echo "  ✗ pnpm install failed — check error above"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  REFRESHED=$((REFRESHED + 1))
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  refresh-worktrees.sh — summary"
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ Refreshed: $REFRESHED"
echo "  ⚠ Skipped:   $SKIPPED  (feature branches — use /sync-worktree)"
echo "  ✗ Errors:    $ERRORS"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo "  Exit 1 — fix errors above before proceeding."
  exit 1
fi

echo "  All worktrees on main are in sync with origin/main."
echo "  For feature branches, run /sync-worktree from inside each worktree."
echo ""
exit 0
