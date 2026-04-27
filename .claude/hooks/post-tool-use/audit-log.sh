#!/bin/bash
# PostToolUse * — append one JSONL line per tool call for debug/replay.
# Source: tech-project-forge v1.4 — patched to read STDIN per Claude Code
# hook contract (skill template's $1 invocation didn't fire).
# 2026-04-27 (P1.11): added session_id field so report-token-savings.sh
# can scope counters to the current session.
LOG=".claude/audit.jsonl"
mkdir -p .claude
INPUT=$(cat)
TS=$(date -u +%FT%TZ)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // {}' 2>/dev/null | head -c 500 | tr '\n' ' ' | sed 's/"/\\"/g')
echo "{\"ts\":\"$TS\",\"event\":\"PostToolUse\",\"session_id\":\"$SESSION_ID\",\"tool\":\"$TOOL_NAME\",\"input\":\"$TOOL_INPUT\"}" >> "$LOG"
exit 0
