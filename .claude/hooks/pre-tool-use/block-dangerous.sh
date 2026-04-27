#!/bin/bash
# PreToolUse Bash — block destructive commands.
# Source: Tech-project-forge-skill v1.4 (Step 2.6) — patched to read STDIN
# per Claude Code hook contract (skill template's $1 invocation didn't fire).
#
# 2026-04-27 (P1.13): tightened the `--force` regex from a bare substring
# match to a flag-boundary match so it no longer false-positives on
# `--force-with-lease`, `--force-if-includes`, and arbitrary text strings
# that happen to contain the literal `--force`. The boundary regex
# `(^|[[:space:]])--force([[:space:]]|$)` requires `--force` to be a
# standalone token (preceded + followed by whitespace or string boundary).
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
if echo "$COMMAND" | grep -qE 'rm -rf|drop database|force push|(^|[[:space:]])--force([[:space:]]|$)|DROP TABLE|TRUNCATE'; then
  echo "Blocked dangerous command: $COMMAND" >&2
  exit 2
fi
exit 0
