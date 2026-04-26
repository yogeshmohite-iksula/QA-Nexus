#!/bin/bash
# PostToolUse * — append one JSONL line per tool call for debug/replay.
# Source: tech-project-forge v1.4 — patched to read STDIN per Claude Code
# hook contract (skill template's $1 invocation didn't fire).
LOG=".claude/audit.jsonl"
mkdir -p .claude
INPUT=$(cat)
TS=$(date -u +%FT%TZ)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null)
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // {}' 2>/dev/null | head -c 500 | tr '\n' ' ' | sed 's/"/\\"/g')
echo "{\"ts\":\"$TS\",\"event\":\"PostToolUse\",\"tool\":\"$TOOL_NAME\",\"input\":\"$TOOL_INPUT\"}" >> "$LOG"
exit 0
