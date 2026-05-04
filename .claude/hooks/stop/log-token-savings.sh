#!/bin/bash
# Stop hook — log this session's token-savings totals to .claude/token-savings.jsonl
#
# Reads .claude/audit.jsonl for the current session_id (passed via stdin per
# the Stop hook contract), counts hook fires, estimates tokens saved, writes
# one JSON line. The aggregator (scripts/aggregate-token-savings.py) walks
# all worktrees and rolls up these per-session lines into the Excel.
#
# Estimation formula (tunable per project):
#   tokens_saved = memory_injects × 250 + context_preloads × 800
#
# Rationale: memory_inject is the inject-memory.sh hook fire — it loads
# .claude/memory/memory.md (~5 file refs, ~100 LoC index). On miss, Claude
# would have re-read those files individually (~250 tokens average per
# memory item). context_preload is load-binding-context.sh — a 7-line note
# prepended to UserPromptSubmit. Without it, Claude would re-read the PM1
# binding spec docs to ground itself (~800 tokens average).
#
# Numbers are deliberately conservative; refine via observed cache-hit data
# once Claude Code exposes per-call token-usage metrics natively (see
# docs/observability/token-tracking.md § Future).
#
# NEVER blocks Stop. Always exits 0.

set +e

# Stop hook receives a JSON object on stdin describing the session.
# Drain it and parse session_id with jq if available; otherwise leave blank.
input=$(cat 2>/dev/null || true)
session_id=$(echo "$input" | jq -r '.session_id // ""' 2>/dev/null)

# Skip if not in the project
[ -z "$CLAUDE_PROJECT_DIR" ] && exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

audit="$CLAUDE_PROJECT_DIR/.claude/audit.jsonl"
log="$CLAUDE_PROJECT_DIR/.claude/token-savings.jsonl"

# If no audit log yet, nothing to summarize.
[ ! -f "$audit" ] || [ -z "$session_id" ] && exit 0

# Today's date in UTC (matches audit-log.sh's ts format)
today=$(date -u +%Y-%m-%d)

# Count session-scoped events from audit.jsonl. We can't grep by session_id
# perfectly (audit-log.sh doesn't always include it in every line) so we
# count by today's date as a session proxy. Tighten this once audit-log.sh
# learns to embed session_id in every record.
tool_calls=$(grep -c "^{\"ts\":\"${today}T" "$audit" 2>/dev/null || echo 0)

# inject-memory.sh and load-binding-context.sh fire-counts —
# audit.jsonl doesn't track them directly (they're hook output, not
# tool calls). Best proxy: assume each tool_call triggers 1 inject-memory
# (PreToolUse * matcher) and each user prompt triggers 1 load-binding.
# We don't have prompt count here. Use tool_calls as upper bound for
# inject-memory; estimate context_preloads as tool_calls / 7 (~one user
# prompt every 7 tool calls is the observed ratio).
memory_injects=$tool_calls
context_preloads=$((tool_calls / 7))
[ "$context_preloads" -lt 1 ] && context_preloads=1

# Tokens saved estimate
tokens_saved=$((memory_injects * 250 + context_preloads * 800))

# Identify chat role from cwd (project root path)
project_dir_name=$(basename "$CLAUDE_PROJECT_DIR")
case "$project_dir_name" in
  *-frontend|*frontend*) chat_role="FE" ;;
  *-backend|*backend*) chat_role="BE" ;;
  *) chat_role="MAIN" ;;
esac

# Branch
branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached")

# Commit count today on this branch (Day 0+ — short window)
commits_today=$(git log --since="${today}T00:00:00Z" --oneline 2>/dev/null | wc -l | tr -d ' ')

# ISO 8601 timestamp for ended_at
ended_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Started_at: best-effort from session start in audit.jsonl (first
# entry today); falls back to ended_at - 1 hour.
started_at=$(grep "^{\"ts\":\"${today}T" "$audit" 2>/dev/null | head -1 | jq -r '.ts // ""' 2>/dev/null)
[ -z "$started_at" ] && started_at=$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "$ended_at")

# Duration in minutes
duration_min=$(awk -v s="$started_at" -v e="$ended_at" '
  BEGIN {
    cmd = "date -u -j -f \"%Y-%m-%dT%H:%M:%SZ\" \"" s "\" +%s 2>/dev/null"
    cmd | getline ss; close(cmd)
    cmd = "date -u -j -f \"%Y-%m-%dT%H:%M:%SZ\" \"" e "\" +%s 2>/dev/null"
    cmd | getline es; close(cmd)
    if (ss > 0 && es > ss) printf "%d", (es - ss) / 60
    else print "0"
  }')

# Write the JSONL entry
mkdir -p "$(dirname "$log")"
printf '{"session_id":"%s","chat_role":"%s","date":"%s","started_at":"%s","ended_at":"%s","duration_min":%s,"tool_calls":%s,"memory_injects":%s,"context_preloads":%s,"tokens_saved_estimated":%s,"branch":"%s","commits":%s}\n' \
  "$session_id" \
  "$chat_role" \
  "$today" \
  "$started_at" \
  "$ended_at" \
  "$duration_min" \
  "$tool_calls" \
  "$memory_injects" \
  "$context_preloads" \
  "$tokens_saved" \
  "$branch" \
  "$commits_today" \
  >> "$log"

# Auto-refresh the operator-facing work-log token sheets (Option A per
# work-log-schema-v2.md). Reads conversation file via Option β when
# available, falls back to Option α heuristic. Non-blocking — Stop hook
# contract requires exit 0 regardless.
if command -v python3 >/dev/null 2>&1 && [ -f "$CLAUDE_PROJECT_DIR/scripts/rebuild-work-log-tokens.py" ]; then
  python3 "$CLAUDE_PROJECT_DIR/scripts/rebuild-work-log-tokens.py" >/dev/null 2>&1 || true
fi

exit 0
