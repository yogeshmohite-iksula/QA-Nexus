#!/bin/bash
# Stop hook — append a one-line session-summary to sessions-stream.jsonl for
# parallel-work correlation in the All Sessions xlsx column J.
#
# Spec: Day-11 addendum TASK 6 / Day-12 TASK 3 — `feat(observability):
# correlate FE+BE work into MAIN session rows`.
#
# Worktree detection — branch on the first path segment of $PWD that
# matches the project root. Convention:
#   Project10-QA_Nexus            → MAIN
#   Project10-QA_Nexus-frontend   → FE
#   Project10-QA_Nexus-backend    → BE
#
# Reads .claude/audit.jsonl for the current session (matched on session_id
# from stdin per Claude Code Stop hook contract) to derive: start time
# (earliest `ts` entry), files touched (unique file paths in tool_input),
# pr count (number of `gh pr` Bash invocations).
#
# NON-BLOCKING: always exits 0; the JSONL append is informational only.

set -e

INPUT=$(cat 2>/dev/null || true)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null || echo "")

# --- worktree detection ---
CWD=$(pwd)
case "$CWD" in
  *Project10-QA_Nexus-frontend*)   WORKTREE="FE" ;;
  *Project10-QA_Nexus-backend*)    WORKTREE="BE" ;;
  *Project10-QA_Nexus*)            WORKTREE="MAIN" ;;
  *)                               WORKTREE="UNKNOWN" ;;
esac

# --- timestamps ---
TODAY=$(date '+%Y-%m-%d')
END=$(date '+%H:%M')
START="$END"  # fallback — overwrite if we can find first audit entry

LOG=".claude/audit.jsonl"
if [ -f "$LOG" ] && [ -n "$SESSION_ID" ]; then
  FIRST_TS=$(grep -m1 "\"session_id\":\"$SESSION_ID\"" "$LOG" 2>/dev/null | jq -r '.ts // empty' 2>/dev/null || echo "")
  if [ -n "$FIRST_TS" ]; then
    # macOS BSD date (works on Yogesh's Mac); GNU date users would need
    # -d instead of -j -f. Suppress errors if format mismatches.
    PARSED=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$FIRST_TS" '+%H:%M' 2>/dev/null || \
             date -d "$FIRST_TS" '+%H:%M' 2>/dev/null || echo "")
    [ -n "$PARSED" ] && START="$PARSED"
  fi
fi

# --- summary metrics from audit.jsonl ---
FILE_COUNT=0
PR_COUNT=0
if [ -f "$LOG" ] && [ -n "$SESSION_ID" ]; then
  FILE_COUNT=$(grep "\"session_id\":\"$SESSION_ID\"" "$LOG" 2>/dev/null | grep -o '"file_path":"[^"]*"' | sort -u | wc -l | tr -d ' ' || echo 0)
  PR_COUNT=$(grep "\"session_id\":\"$SESSION_ID\"" "$LOG" 2>/dev/null | grep -c 'gh pr' || echo 0)
fi

SUMMARY="Auto-logged session: ~${FILE_COUNT} files, ~${PR_COUNT} gh-pr ops. Edit this line at EOD for real summary."

# --- append to sessions-stream.jsonl ---
SS="docs/observability/sessions-stream.jsonl"
mkdir -p "$(dirname "$SS")"

# Build JSON safely with jq if available; fall back to printf.
if command -v jq >/dev/null 2>&1; then
  ENTRY=$(jq -nc \
    --arg w "$WORKTREE" \
    --arg d "$TODAY" \
    --arg s "$START" \
    --arg e "$END" \
    --arg sm "$SUMMARY" \
    '{worktree: $w, date: $d, start: $s, end: $e, summary: $sm, prs: [], auto: true}' 2>/dev/null || echo "")
else
  ENTRY="{\"worktree\":\"$WORKTREE\",\"date\":\"$TODAY\",\"start\":\"$START\",\"end\":\"$END\",\"summary\":\"$SUMMARY\",\"prs\":[],\"auto\":true}"
fi

if [ -n "$ENTRY" ]; then
  echo "$ENTRY" >> "$SS"
fi

exit 0
