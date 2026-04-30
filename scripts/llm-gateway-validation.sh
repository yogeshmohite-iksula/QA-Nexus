#!/usr/bin/env bash
# QA Nexus PM1 — live LLM gateway validation script.
#
# Purpose: end-to-end smoke + benchmark of the deployed LLM gateway,
# fired manually once Yogesh provisions Render + sets GROQ_API_KEY +
# GEMINI_API_KEY in Render env vars.
#
# Spec: Day-4 noon brief Block 1 + Block 2 (deferred from Day 4 because
# Render deploy was not live during the work window).
#
# What it covers:
#   (a) Happy path — Groq primary, single completion, <2s budget.
#   (b) Force Gemini fallback — set LLM_PRIMARY_PROVIDER=__forcefail__ in
#       Render BEFORE running, OR temporarily revoke GROQ_API_KEY.
#   (c) Long-context route — synthesises a >30k-char prompt, expects
#       providerName=long-context-route's-provider.
#   (d) Sequential latency — 10 calls, prints p50/p95.
#   (e) A1 Scribe smoke — POST /agents/a1/generate, verifies shape.
#
# Required env (set in your shell before running):
#   API_BASE        e.g. https://qa-nexus-api.onrender.com   (default: localhost:3001)
#   COOKIE          better-auth.session_token=...            (your Admin session)
#
# Output: writes a markdown report to
#   docs/observability/llm-gateway-validation-$(date +%F).md
#
# Re-runnable: idempotent. Each run appends a timestamped section.

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3001}"
COOKIE="${COOKIE:-}"
REPORT="docs/observability/llm-gateway-validation-$(date +%F).md"
NOW="$(date -u +%FT%TZ)"

if [[ -z "$COOKIE" ]]; then
  echo "ERROR: COOKIE env var is required (your better-auth session)." >&2
  echo "Get one by logging in via the FE then DevTools → Application → Cookies → better-auth.session_token" >&2
  exit 1
fi

mkdir -p "$(dirname "$REPORT")"
echo "Writing report to: $REPORT"
echo "API base:          $API_BASE"
echo

# --- helpers ---
curl_post() {
  local path="$1"
  local body="$2"
  local t0
  t0=$(date +%s%N)
  local out
  out=$(curl -sS -X POST "$API_BASE$path" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIE" \
    -d "$body" \
    -w '\nHTTP_STATUS:%{http_code}')
  local t1
  t1=$(date +%s%N)
  local elapsed_ms=$(( (t1 - t0) / 1000000 ))
  local status
  status=$(echo "$out" | tail -1 | sed 's/HTTP_STATUS://')
  local body_only
  body_only=$(echo "$out" | sed '$d')
  echo "$elapsed_ms|$status|$body_only"
}

# --- preamble in report ---
{
  echo
  echo "## Run @ $NOW"
  echo
  echo "API base: \`$API_BASE\`"
  echo
} >> "$REPORT"

# --- (a) Happy path ---
echo "─── (a) Happy path: POST /llm/test 'What is 2+2?' ───"
RES=$(curl_post /llm/test '{"prompt":"What is 2+2? Reply with just the number."}')
ELAPSED=$(echo "$RES" | cut -d'|' -f1)
STATUS=$(echo "$RES" | cut -d'|' -f2)
BODY=$(echo "$RES" | cut -d'|' -f3-)
echo "status=$STATUS  elapsed_ms=$ELAPSED"
PROVIDER=$(echo "$BODY" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("result",{}).get("providerName","?"))' 2>/dev/null || echo '?')
FALLBACK=$(echo "$BODY" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("result",{}).get("fallbackUsed","?"))' 2>/dev/null || echo '?')
{
  echo "### (a) Happy path — primary provider"
  echo
  echo "- HTTP status: \`$STATUS\`"
  echo "- Latency: ${ELAPSED}ms (budget: <2000ms for short prompts)"
  echo "- providerName: \`$PROVIDER\`"
  echo "- fallbackUsed: \`$FALLBACK\`"
  echo
  if (( ELAPSED < 2000 )) && [[ "$STATUS" == "200" ]]; then
    echo "RESULT: ✅ PASS"
  else
    echo "RESULT: ❌ FAIL — investigate"
  fi
  echo
} >> "$REPORT"

# --- (b) Fallback path ---
echo "─── (b) Fallback: requires LLM_PRIMARY_PROVIDER temporarily broken ───"
echo "    SKIP this section unless you've intentionally broken primary."
{
  echo "### (b) Fallback — Gemini secondary"
  echo
  echo "Run manually: in Render dashboard temporarily set GROQ_API_KEY=__broken__ ,"
  echo "wait for redeploy, re-run this script, then restore."
  echo
  echo "Expected: fallbackUsed=true, providerName=gemini, route_reason=secondary_after_primary_failure."
  echo
} >> "$REPORT"

# --- (c) Long context ---
echo "─── (c) Long-context route (≥30k chars) ───"
LONG_PROMPT=$(python3 -c 'import sys; sys.stdout.write(("the quick brown fox " * 2000) + " what is the longest word in this text?")')
LONG_BODY=$(python3 -c 'import json,sys; print(json.dumps({"prompt": sys.stdin.read()}))' <<< "$LONG_PROMPT")
RES=$(curl_post /llm/test "$LONG_BODY")
ELAPSED=$(echo "$RES" | cut -d'|' -f1)
STATUS=$(echo "$RES" | cut -d'|' -f2)
BODY=$(echo "$RES" | cut -d'|' -f3-)
ROUTE=$(echo "$BODY" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("result",{}).get("routeReason","?"))' 2>/dev/null || echo '?')
PROVIDER=$(echo "$BODY" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("result",{}).get("providerName","?"))' 2>/dev/null || echo '?')
{
  echo "### (c) Long-context route"
  echo
  echo "- Prompt size: ~40k chars / ~10k tokens (over default 30k threshold)"
  echo "- HTTP status: \`$STATUS\`"
  echo "- Latency: ${ELAPSED}ms"
  echo "- routeReason: \`$ROUTE\` (expected: \`long_context\`)"
  echo "- providerName: \`$PROVIDER\` (expected: long-context provider per LLM_LONG_CONTEXT_PROVIDER)"
  echo
} >> "$REPORT"

# --- (d) Sequential latency ---
echo "─── (d) 10× sequential happy-path; p50/p95 ───"
LATENCIES=()
for i in $(seq 1 10); do
  RES=$(curl_post /llm/test '{"prompt":"Reply with the word OK and nothing else."}')
  E=$(echo "$RES" | cut -d'|' -f1)
  LATENCIES+=("$E")
  echo "  call $i: ${E}ms"
done
P50=$(printf '%s\n' "${LATENCIES[@]}" | sort -n | awk 'NR==5')
P95=$(printf '%s\n' "${LATENCIES[@]}" | sort -n | awk 'NR==10')
{
  echo "### (d) Sequential latency benchmark (10 calls)"
  echo
  echo "- All latencies (ms): ${LATENCIES[*]}"
  echo "- p50: ${P50}ms"
  echo "- p95: ${P95}ms"
  echo "- Budget: p50 <1000ms, p95 <2000ms for short-reply prompts"
  echo
} >> "$REPORT"

# --- (e) A1 Scribe smoke ---
echo "─── (e) A1 Scribe smoke: POST /agents/a1/generate ───"
SCRIBE_BODY=$(cat <<'JSON'
{
  "projectKey": "RET",
  "requirement": "As an Iksula Returns customer, I want to request a partial refund on multi-item orders so that I can keep some items without losing the full order discount.",
  "count": 3
}
JSON
)
RES=$(curl_post /agents/a1/generate "$SCRIBE_BODY")
ELAPSED=$(echo "$RES" | cut -d'|' -f1)
STATUS=$(echo "$RES" | cut -d'|' -f2)
BODY=$(echo "$RES" | cut -d'|' -f3-)
TC_COUNT=$(echo "$BODY" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(len(d.get("testCases",[])))' 2>/dev/null || echo '0')
PROVIDER=$(echo "$BODY" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("llm",{}).get("providerName","?"))' 2>/dev/null || echo '?')
{
  echo "### (e) A1 Scribe smoke (real LLM)"
  echo
  echo "- Endpoint: POST /agents/a1/generate"
  echo "- HTTP status: \`$STATUS\`"
  echo "- Latency: ${ELAPSED}ms (budget <5000ms for 3 BDD test cases)"
  echo "- testCases.length: \`$TC_COUNT\` (expected: 3)"
  echo "- llm.providerName: \`$PROVIDER\`"
  echo
  if [[ "$STATUS" == "200" ]] && (( TC_COUNT >= 1 )); then
    echo "RESULT: ✅ PASS"
  else
    echo "RESULT: ❌ FAIL — investigate response body in script run output"
  fi
  echo
  echo "First test case (truncated 500 chars):"
  echo
  echo '```json'
  echo "$BODY" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps(d.get("testCases",[{}])[0], indent=2)[:500])' 2>/dev/null || echo "(could not parse)"
  echo '```'
  echo
} >> "$REPORT"

echo
echo "═══════════════════════════════════════════════════════════"
echo "Report appended to: $REPORT"
echo "═══════════════════════════════════════════════════════════"
echo
echo "Next step (Block 1 finalisation): commit the report:"
echo "  git add $REPORT"
echo "  git commit -m 'docs(observability): live LLM gateway + A1 Scribe validation against deployed Render API'"
echo "  git push"
