#!/bin/bash
# Claude Code status line — Model | Branch | Context% | Cost | Duration
#
# Per https://docs.claude.com/en/docs/claude-code/statusline, this script
# receives a JSON object on stdin describing the current session and prints
# ONE line to stdout that becomes the status bar.
#
# Wired in .claude/settings.json under "statusLine".

input=$(cat)

# Extract fields with jq; fall back gracefully if a field is missing.
model=$(echo "$input" | jq -r '.model.display_name // .model.id // "Claude"' 2>/dev/null)
ctx_used=$(echo "$input" | jq -r '.context.tokens_used // 0' 2>/dev/null)
ctx_max=$(echo "$input" | jq -r '.context.tokens_max // 200000' 2>/dev/null)
cost_usd=$(echo "$input" | jq -r '.cost.total_usd // 0' 2>/dev/null)
duration_ms=$(echo "$input" | jq -r '.session.duration_ms // 0' 2>/dev/null)
project_dir=$(echo "$input" | jq -r '.workspace.cwd // .cwd // "."' 2>/dev/null)

# Compute context % (clamped to one decimal)
ctx_pct="0.0"
if [ "$ctx_max" -gt 0 ] 2>/dev/null; then
  ctx_pct=$(awk "BEGIN { printf \"%.1f\", ($ctx_used / $ctx_max) * 100 }")
fi

# Compute duration as Hh Mm or Mm Ss
dur_min=$((duration_ms / 60000))
dur_hr=$((dur_min / 60))
dur_min_rem=$((dur_min % 60))
if [ $dur_hr -gt 0 ]; then
  dur="${dur_hr}h${dur_min_rem}m"
else
  dur_sec=$(((duration_ms / 1000) % 60))
  if [ $dur_min -gt 0 ]; then
    dur="${dur_min}m"
  else
    dur="${dur_sec}s"
  fi
fi

# Format cost ($X.XX or sub-dollar as ¢)
cost=$(awk "BEGIN {
  c = $cost_usd
  if (c >= 1) printf \"\$%.2f\", c
  else printf \"%d¢\", c * 100
}")

# Pull current git branch (cheap; cached by git)
branch="—"
if [ -d "$project_dir/.git" ] || git -C "$project_dir" rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git -C "$project_dir" symbolic-ref --short HEAD 2>/dev/null || echo "detached")
fi

# Color hint when context is high (CLAUDE.md says don't exceed 50%)
ctx_color=""
ctx_reset=""
ctx_int=${ctx_pct%.*}
if [ "$ctx_int" -ge 50 ] 2>/dev/null; then
  ctx_color=$'\033[33m'  # yellow
  ctx_reset=$'\033[0m'
fi
if [ "$ctx_int" -ge 75 ] 2>/dev/null; then
  ctx_color=$'\033[31m'  # red
fi

printf "%s │ ⎇ %s │ ${ctx_color}ctx %s%%${ctx_reset} │ %s │ %s" \
  "$model" "$branch" "$ctx_pct" "$cost" "$dur"
