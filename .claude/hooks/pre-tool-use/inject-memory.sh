#!/bin/bash
# PreToolUse * — auto-prepend the project memory index to every tool call.
# Source: tech-project-forge v1.4 Step 2.17 (Connelly / Huryn pattern).
#
# This makes every Claude session opening this repo on any machine
# automatically see the binding context (general / architecture / bugs / api /
# database / stack memory) without depending on user-session memory at
# ~/.claude/projects/<repo>/memory/ which is private to a specific install.
#
# Pairs with .claude/memory/memory.md (the @-import index that points at
# all 6 memory files). Also pairs with /compound-learnings + /reorganize-memory
# slash commands (P1.3) which append to and clean up the memory files.

MEMORY_INDEX=".claude/memory/memory.md"

if [ -f "$MEMORY_INDEX" ]; then
  echo "=== PROJECT MEMORY ==="
  cat "$MEMORY_INDEX"
  echo "====================="
fi

exit 0
