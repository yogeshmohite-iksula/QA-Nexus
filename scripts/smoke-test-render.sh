#!/usr/bin/env bash
# QA Nexus PM1 — post-deploy smoke test for Render staging.
#
# Spec: ADR-011 (M2 staging deployment) + this PR.
#
# Runs after every Render deploy of `qa-nexus-api-staging`. Exits non-zero
# on any failure so MAIN/Yogesh can grep for "FAIL" in CI logs (or visual
# inspection) and roll back the deploy if needed.
#
# Usage:
#   ./scripts/smoke-test-render.sh
#   ./scripts/smoke-test-render.sh https://qa-nexus-api-staging.onrender.com
#   API_URL=https://api.qanexus.iksula.com ./scripts/smoke-test-render.sh
#
# Default URL: https://qa-nexus-api-staging.onrender.com
# Override via $1 or $API_URL.
#
# Checks performed:
#   1. /health returns 200 + JSON parses + status field present
#   2. /health.db.status === "up"
#   3. /health.embedding.status !== "down" (deferred is OK if model
#      didn't load yet)
#   4. /llm/* path returns 501 OR 401 (gateway in deferred mode is
#      expected pre-F26)
#   5. /api/auth/sign-in/magic-link with a test email returns
#      a non-5xx (400/200 both fine — proves the route is wired)
#   6. /api/users requires auth (401, NOT 500)
#   7. Response time on /health < 5s (catches cold-start regressions
#      that would be invisible to UptimeRobot)
#
# Exit codes:
#   0 = all checks pass
#   1 = one or more checks fail (details printed to stderr)
#   2 = misconfiguration (missing curl/jq, malformed URL)

set -uo pipefail

API_URL="${1:-${API_URL:-https://qa-nexus-api-staging.onrender.com}}"
PASS=0
FAIL=0
START_TIME=$(date +%s)

if ! command -v curl >/dev/null; then
  echo "✗ curl not found — install curl + retry" >&2
  exit 2
fi
if ! command -v jq >/dev/null; then
  echo "✗ jq not found — install jq + retry" >&2
  exit 2
fi

echo "→ Smoke testing $API_URL"
echo

# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────

check() {
  local name="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name (expected: $expected, actual: $actual)" >&2
    FAIL=$((FAIL + 1))
  fi
}

check_in() {
  local name="$1"
  local actual="$2"
  shift 2
  for v in "$@"; do
    if [[ "$actual" == "$v" ]]; then
      echo "  ✓ $name (got $actual, expected one of: $*)"
      PASS=$((PASS + 1))
      return
    fi
  done
  echo "  ✗ $name (expected one of: $*, actual: $actual)" >&2
  FAIL=$((FAIL + 1))
}

check_lt() {
  local name="$1"
  local actual="$2"
  local threshold="$3"
  if (( actual < threshold )); then
    echo "  ✓ $name ($actual < $threshold)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name ($actual >= $threshold)" >&2
    FAIL=$((FAIL + 1))
  fi
}

# ──────────────────────────────────────────────────────────────────
# Check 1: /health returns 200 + parseable JSON
# ──────────────────────────────────────────────────────────────────

echo "[1/7] GET /health"
HEALTH_START=$(date +%s%3N)
HEALTH_BODY=$(curl -sS -m 10 -o /tmp/qa-nexus-health.json -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")
HEALTH_END=$(date +%s%3N)
HEALTH_MS=$((HEALTH_END - HEALTH_START))
check "/health HTTP 200" "$HEALTH_BODY" "200"

if [[ -s /tmp/qa-nexus-health.json ]]; then
  STATUS=$(jq -r '.status // "missing"' /tmp/qa-nexus-health.json 2>/dev/null || echo "parse-error")
  check_in "/health.status valid" "$STATUS" "ok" "degraded"
else
  echo "  ✗ /health body empty" >&2
  FAIL=$((FAIL + 1))
fi
echo

# ──────────────────────────────────────────────────────────────────
# Check 2: DB subsystem up
# ──────────────────────────────────────────────────────────────────

echo "[2/7] /health.db"
if [[ -s /tmp/qa-nexus-health.json ]]; then
  DB_STATUS=$(jq -r '.db.status // "missing"' /tmp/qa-nexus-health.json 2>/dev/null || echo "parse-error")
  check "/health.db.status === up" "$DB_STATUS" "up"
else
  echo "  ✗ skipped (no health body)" >&2
  FAIL=$((FAIL + 1))
fi
echo

# ──────────────────────────────────────────────────────────────────
# Check 3: Embedding subsystem (deferred is OK pre-warm-up)
# ──────────────────────────────────────────────────────────────────

echo "[3/7] /health.embedding"
if [[ -s /tmp/qa-nexus-health.json ]]; then
  EMB_STATUS=$(jq -r '.embedding.status // "missing"' /tmp/qa-nexus-health.json 2>/dev/null || echo "parse-error")
  check_in "/health.embedding.status NOT down" "$EMB_STATUS" "up" "deferred"
else
  echo "  ✗ skipped (no health body)" >&2
  FAIL=$((FAIL + 1))
fi
echo

# ──────────────────────────────────────────────────────────────────
# Check 4: LLM gateway responds (501 deferred OR 401 unauth = OK,
# 5xx = NOT OK)
# ──────────────────────────────────────────────────────────────────

echo "[4/7] LLM gateway alive (path responds with non-5xx)"
LLM_CODE=$(curl -sS -m 10 -o /dev/null -w "%{http_code}" "$API_URL/llm/health" 2>/dev/null || echo "000")
# 404 is also fine — /llm/health may not be a real route; we just want
# to confirm the dyno isn't 5xx-ing.
check_in "/llm/health returns non-5xx" "$LLM_CODE" "200" "401" "404" "501"
echo

# ──────────────────────────────────────────────────────────────────
# Check 5: Magic-link route is wired (POST returns non-5xx)
# ──────────────────────────────────────────────────────────────────

echo "[5/7] POST /api/auth/sign-in/magic-link wired"
MAGIC_CODE=$(curl -sS -m 15 -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/auth/sign-in/magic-link" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-test@iksula.com","callbackURL":"/"}' 2>/dev/null || echo "000")
# 200/400/422/429 all prove the route is mounted + reachable.
# 5xx = the new deploy broke BetterAuth wiring.
check_in "POST /api/auth/sign-in/magic-link non-5xx" "$MAGIC_CODE" "200" "400" "401" "422" "429"
echo

# ──────────────────────────────────────────────────────────────────
# Check 6: RBAC guard active on /api/users (no-auth = 401)
# ──────────────────────────────────────────────────────────────────

echo "[6/7] RBAC guard active on /api/users (no-auth = 401)"
USERS_CODE=$(curl -sS -m 10 -o /dev/null -w "%{http_code}" "$API_URL/api/users" 2>/dev/null || echo "000")
check_in "/api/users no-auth returns 401/403" "$USERS_CODE" "401" "403"
echo

# ──────────────────────────────────────────────────────────────────
# Check 7: Response time sanity (cold-start regression check)
# ──────────────────────────────────────────────────────────────────

echo "[7/7] /health response time sanity"
check_lt "/health < 5000 ms" "$HEALTH_MS" 5000
echo

# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
echo "─────────────────────────────────────────"
echo "Smoke test complete in ${ELAPSED}s"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
echo "─────────────────────────────────────────"

if (( FAIL > 0 )); then
  echo "✗ SMOKE TEST FAILED — review failures above" >&2
  echo "  Health body saved at /tmp/qa-nexus-health.json for forensics" >&2
  exit 1
fi

echo "✓ All smoke checks passed"
exit 0
