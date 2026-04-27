#!/bin/bash
# PostToolUse Bash — print a token-savings summary after every `git push`
# and persist the per-session row to .claude/token-savings.jsonl so the
# Stop hook can roll up cumulative totals.
#
# Spec: P1.11 / MS0-T035 of docs/audits/2026-04-27-skill-alignment-audit.md.
# Wired with matcher "Bash"; the script gates internally on ^git push so
# every other Bash call returns immediately.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)

# Only fire for git push commands. (Matcher narrows to Bash; this narrows
# further to the push subcommand without needing a regex matcher.)
if ! echo "$COMMAND" | grep -qE '^[[:space:]]*git[[:space:]]+push'; then
  exit 0
fi

# Need a session id to scope counters. If absent (older Claude Code
# versions), bail silently rather than emit garbage.
[ -z "$SESSION_ID" ] && exit 0

AUDIT=".claude/audit.jsonl"
PRELOADS=".claude/preloads.jsonl"
SAVINGS=".claude/token-savings.jsonl"
mkdir -p .claude

# Constants — see brief P1.11 PART 1 step (c).
MEMORY_INJECT_TOKENS=150
CONTEXT_PRELOAD_TOKENS=1200
SKILL_ACTIVATION_TOKENS=400
PRICE_PER_TOKEN=0.000003

# Counters scoped to this session_id.
MEMORY_INJECTS=0
if [ -f "$AUDIT" ]; then
  # Each PostToolUse audit entry == one PreToolUse * fire (inject-memory.sh
  # is wired with matcher *). Count = exact number of inject-memory fires.
  MEMORY_INJECTS=$(grep -c "\"session_id\":\"$SESSION_ID\"" "$AUDIT" 2>/dev/null || echo 0)
fi

CONTEXT_PRELOADS=0
if [ -f "$PRELOADS" ]; then
  CONTEXT_PRELOADS=$(grep -c "\"session_id\":\"$SESSION_ID\"" "$PRELOADS" 2>/dev/null || echo 0)
fi

SKILL_ACTIVATIONS=0
if [ -f "$AUDIT" ]; then
  # Tool calls with tool=="Skill" represent skill activations.
  SKILL_ACTIVATIONS=$(grep "\"session_id\":\"$SESSION_ID\"" "$AUDIT" 2>/dev/null | grep -c '"tool":"Skill"' || echo 0)
fi

# Estimated tokens saved this session.
MEM_SAVED=$((MEMORY_INJECTS * MEMORY_INJECT_TOKENS))
PRE_SAVED=$((CONTEXT_PRELOADS * CONTEXT_PRELOAD_TOKENS))
SKL_SAVED=$((SKILL_ACTIVATIONS * SKILL_ACTIVATION_TOKENS))
TOTAL=$((MEM_SAVED + PRE_SAVED + SKL_SAVED))

# Pull prior cumulative from last line of token-savings.jsonl.
PRIOR=0
if [ -f "$SAVINGS" ] && [ -s "$SAVINGS" ]; then
  PRIOR=$(tail -n 1 "$SAVINGS" | jq -r '.cumulative // 0' 2>/dev/null || echo 0)
  [ -z "$PRIOR" ] && PRIOR=0
fi
CUM=$((PRIOR + TOTAL))

# Bash has no float math; use awk for the dollars estimate.
DOLLARS=$(awk -v c="$CUM" -v p="$PRICE_PER_TOKEN" 'BEGIN { printf "%.4f", c * p }')

DATE=$(date -u +%Y-%m-%d)

# Append the per-session row.
echo "{\"date\":\"$DATE\",\"session_id\":\"$SESSION_ID\",\"memory_injects\":$MEMORY_INJECTS,\"context_preloads\":$CONTEXT_PRELOADS,\"skill_activations\":$SKILL_ACTIVATIONS,\"tokens_saved_est\":$TOTAL,\"cumulative\":$CUM}" >> "$SAVINGS"

# Print the summary block.
cat <<EOF

📊 Token Savings (this push)
  Memory injects:    ${MEMORY_INJECTS} × ~150  = ${MEM_SAVED} tokens
  Context preloads:  ${CONTEXT_PRELOADS} × 1,200 = ${PRE_SAVED} tokens
  Skill activations: ${SKILL_ACTIVATIONS} × 400   = ${SKL_SAVED} tokens
  ──────────────────────────────────────
  This session:      ~${TOTAL} tokens saved
  Cumulative:        ~${CUM} tokens saved (~\$${DOLLARS} at API pricing)

EOF
exit 0
