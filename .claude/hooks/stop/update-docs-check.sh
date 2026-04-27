#!/bin/bash
# Stop hook — nudge to update docs when src changed without a doc bump.
# Spec: P1.6 of docs/audits/2026-04-27-skill-alignment-audit.md
#       (Tech-project-forge-skill v1.4 Step 2.6 — `update-docs-check`).
# NON-BLOCKING: always exits 0; the warning is informational only.
# Reads stdin per Claude Code hook contract (consume to avoid SIGPIPE).
INPUT=$(cat 2>/dev/null || true)

# Compare the most recent commit (HEAD~1..HEAD) by file paths.
# Skip silently if HEAD~1 doesn't exist (initial commit / shallow clone).
if ! git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
  exit 0
fi

CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null)

# Nothing in last commit (or git unavailable) — bail quietly.
[ -z "$CHANGED" ] && exit 0

APP_CHANGED=$(echo "$CHANGED" | grep -E '^apps/(api|web)/' || true)
DOC_CHANGED=$(echo "$CHANGED" | grep -E '^docs/(ARCHITECTURE\.md|CHANGELOG\.md)$' || true)

if [ -n "$APP_CHANGED" ] && [ -z "$DOC_CHANGED" ]; then
  # ANSI yellow heads-up. Falls back to plain text on terminals without
  # colour support; Claude Code's hook output handles ANSI sequences.
  YELLOW='\033[33m'
  RESET='\033[0m'
  printf "${YELLOW}⚠  update-docs-check: apps/api or apps/web changed in HEAD without\n" >&2
  printf "   a matching docs/ARCHITECTURE.md or docs/CHANGELOG.md update.\n" >&2
  printf "   Consider running /update-docs (or editing by hand) before the next commit.${RESET}\n" >&2
  printf "\n" >&2
  printf "   Source files changed in HEAD:\n" >&2
  echo "$APP_CHANGED" | head -10 | sed 's/^/     · /' >&2
fi

exit 0
