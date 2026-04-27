#!/bin/bash
# Stop hook — print the cumulative token-savings footer at session end,
# rolling up everything ever recorded in .claude/token-savings.jsonl.
#
# Spec: P1.11 / MS0-T035 of docs/audits/2026-04-27-skill-alignment-audit.md.
# Non-blocking, exit 0. Runs after audit-log.sh on the Stop event chain.
INPUT=$(cat 2>/dev/null || true)

SAVINGS=".claude/token-savings.jsonl"

# No data yet → nothing to report.
if [ ! -f "$SAVINGS" ] || [ ! -s "$SAVINGS" ]; then
  exit 0
fi

PRICE_PER_TOKEN=0.000003

# Last line carries the latest cumulative; default 0 if malformed.
CUM=$(tail -n 1 "$SAVINGS" | jq -r '.cumulative // 0' 2>/dev/null || echo 0)
[ -z "$CUM" ] && CUM=0

# Distinct session count.
SESSIONS=$(jq -r '.session_id' "$SAVINGS" 2>/dev/null | sort -u | wc -l | tr -d ' ')
[ -z "$SESSIONS" ] && SESSIONS=0

DOLLARS=$(awk -v c="$CUM" -v p="$PRICE_PER_TOKEN" 'BEGIN { printf "%.4f", c * p }')

cat <<EOF

📈 Cumulative since project start: ${CUM} tokens saved across ${SESSIONS} session(s) (~\$${DOLLARS}). Run /reorganize-memory weekly to keep compounding.

EOF
exit 0
