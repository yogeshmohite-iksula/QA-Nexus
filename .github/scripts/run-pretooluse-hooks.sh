#!/bin/bash
# Drives the project's PreToolUse Edit|Write hooks against PR-changed files
# in CI as a "dry run" — synthesises a Write tool_input payload per file and
# pipes it to each applicable hook. Aggregates exit codes; non-zero from any
# hook fails the job.
#
# Spec: hook-validation job in .github/workflows/ci.yml (P1.7 of the
#       2026-04-27 skill-alignment audit).
#
# Hooks invoked:
#   - check-secrets.sh         → all changed files
#   - enforce-design-tokens.sh → apps/web/**/*.{ts,tsx,css}
#   - enforce-pm1-stack.sh     → package.json (any depth) + pnpm-lock.yaml
set -euo pipefail

# Resolve PR base (defaults to main on push to main).
BASE="${GITHUB_BASE_REF:-main}"

# List PR-changed files (Added / Copied / Modified / Renamed / TypeChanged).
# Fall back to HEAD~1..HEAD when origin/$BASE isn't available locally.
if git rev-parse --verify "origin/$BASE" >/dev/null 2>&1; then
  CHANGED=$(git diff --name-only --diff-filter=ACMRT "origin/$BASE...HEAD")
else
  CHANGED=$(git diff --name-only --diff-filter=ACMRT HEAD~1 HEAD 2>/dev/null || true)
fi

if [ -z "$CHANGED" ]; then
  echo "No files changed; nothing to validate."
  exit 0
fi

COUNT=$(echo "$CHANGED" | wc -l | tr -d ' ')
echo "Validating $COUNT changed file(s) against PreToolUse Edit|Write hooks…"
echo

FAIL=0

run_hook() {
  local hook="$1" file="$2"
  [ -x "$hook" ] || { echo "  ⚠ skipping $hook (missing or not executable)"; return 0; }
  [ -f "$file" ] || return 0  # file deleted in this PR — skip

  local payload
  payload=$(jq -n --arg fp "$file" --rawfile c "$file" '{tool_input:{file_path:$fp,content:$c}}')

  if echo "$payload" | bash "$hook"; then
    : # pass
  else
    local rc=$?
    echo "  ✗ $hook failed (exit=$rc) on $file"
    FAIL=1
  fi
}

while IFS= read -r f; do
  [ -z "$f" ] && continue

  # Skip .env files defensively — should never be in repo, but if one
  # slipped in we don't want to splat its content back into logs.
  case "$f" in
    *.env|*.env.local|*.env.*.local) continue ;;
  esac

  # check-secrets.sh runs against every changed file
  run_hook .claude/hooks/pre-tool-use/check-secrets.sh "$f"

  # enforce-design-tokens.sh — apps/web frontend code only
  if [[ "$f" == apps/web/* ]] && [[ "$f" == *.ts || "$f" == *.tsx || "$f" == *.css ]]; then
    run_hook .claude/hooks/pre-tool-use/enforce-design-tokens.sh "$f"
  fi

  # enforce-pm1-stack.sh — package manifests + lockfile
  if [[ "$f" == package.json || "$f" == */package.json || "$f" == pnpm-lock.yaml ]]; then
    run_hook .claude/hooks/pre-tool-use/enforce-pm1-stack.sh "$f"
  fi
done <<< "$CHANGED"

if [ $FAIL -ne 0 ]; then
  echo
  echo "❌ One or more PreToolUse hooks failed against changed files."
  exit 1
fi

echo
echo "✅ All applicable PreToolUse Edit|Write hooks passed."
