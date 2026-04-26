#!/bin/bash
# PreToolUse Bash — block destructive commands.
# Source: Tech-project-forge-skill v1.4 (Step 2.6) — patched to read STDIN
# per Claude Code hook contract (skill template's $1 invocation didn't fire).
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
if echo "$COMMAND" | grep -qE 'rm -rf|drop database|force push|--force|DROP TABLE|TRUNCATE'; then
  echo "Blocked dangerous command: $COMMAND" >&2
  exit 2
fi
exit 0
