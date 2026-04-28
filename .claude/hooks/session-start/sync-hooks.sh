#!/bin/bash
# SessionStart hook — auto-sync .claude/hooks/ from origin/main
#
# Closes followups.md (b) P1.17 — worktree hook drift.
#
# Symptom this fixes: each new disposable Claude worktree starts off
# whatever SHA the parent process happened to be on, NOT the latest
# origin/main. New worktrees may not have the latest .claude/hooks/
# updates (e.g., block-dangerous.sh regex fix from P1.13 took 2
# iterations to land in FE worktree because of stale hook).
#
# Behavior: on every Claude Code session start, fetch origin/main
# silently, then `git checkout origin/main -- .claude/hooks/` so the
# hooks tree always matches what's on main. NON-BLOCKING — exits 0
# even if the fetch/checkout fails (e.g., offline, detached HEAD,
# uncommitted hook edits the user wants to keep).
#
# Per the followups doc, this is option (i). Risks acknowledged:
# silently overwrites local hook changes the user has uncommitted.
# Mitigation: only touches .claude/hooks/, not .claude/settings.json
# or memory/agents/commands. If you're hand-editing a hook locally,
# either (a) commit it before opening a new chat, or (b) suppress
# this hook by `chmod -x` on this script.
#
# Wired in .claude/settings.json under hooks.SessionStart.

set +e  # never block session start

# Only run inside the project repo (skip if hook fires outside it)
[ -z "$CLAUDE_PROJECT_DIR" ] && exit 0
[ ! -d "$CLAUDE_PROJECT_DIR/.git" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Skip if we're not on a regular branch (detached HEAD, rebase mid-flight, etc.)
git symbolic-ref -q HEAD >/dev/null 2>&1 || exit 0

# Skip if user has uncommitted changes inside .claude/hooks/ — refuse to clobber
if ! git diff --quiet -- .claude/hooks/ 2>/dev/null; then
  echo "[sync-hooks] uncommitted changes in .claude/hooks/ — skipping auto-sync to preserve local edits" >&2
  exit 0
fi

# Fetch + checkout (silent, non-fatal)
git fetch origin main --quiet 2>/dev/null
git checkout origin/main -- .claude/hooks/ 2>/dev/null

exit 0
