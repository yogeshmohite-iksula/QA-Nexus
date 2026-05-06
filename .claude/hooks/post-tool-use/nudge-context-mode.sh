#!/bin/bash
# PostToolUse Bash — soft nudge to use context-mode plugin when Bash output
# is large + matches gh/git/jest/pnpm/find patterns where ctx_execute or
# ctx_batch_execute would have saved 80-98% tokens.
#
# Spec: Day-11 Task 7 (Context Mode discipline) — see CLAUDE.md
# §"Token discipline".
#
# NON-BLOCKING: always exits 0; the nudge goes to stderr only (never blocks
# the tool result from reaching Claude). Reads stdin per Claude Code hook
# contract (consume to avoid SIGPIPE).

INPUT=$(cat 2>/dev/null || true)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)

# Only nudge on Bash tool calls.
if [ "$TOOL" != "Bash" ]; then
  exit 0
fi

CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
OUTPUT=$(echo "$INPUT" | jq -r '.tool_response.output // .tool_response.stdout // empty' 2>/dev/null)

# Bail if no output info available.
if [ -z "$OUTPUT" ]; then
  exit 0
fi

# Count lines in output. Use printf to avoid wc edge cases on no-trailing-newline.
LINES=$(printf '%s' "$OUTPUT" | awk 'END{print NR}')

# Threshold: 20 lines per CLAUDE.md §"Token discipline".
if [ "${LINES:-0}" -le 20 ]; then
  exit 0
fi

# Only nudge for commands that have known ctx alternatives (gh/git/jest/pnpm/find).
# Use case-insensitive match against the first word of the command.
case "$CMD" in
  gh\ *|*\ gh\ *|git\ *|*\ git\ *|jest\ *|*\ jest\ *|pnpm\ *|*\ pnpm\ *|find\ *|*\ find\ *|*node_modules*jest*|*node_modules*.bin*)
    echo "💡 ctx-nudge: Bash output was $LINES lines. Consider mcp__plugin_context-mode_context-mode__ctx_execute or ctx_batch_execute next time — keeps raw data in sandbox, returns only summary." >&2
    ;;
esac

exit 0
