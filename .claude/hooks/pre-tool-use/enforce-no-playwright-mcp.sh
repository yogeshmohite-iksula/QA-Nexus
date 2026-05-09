#!/usr/bin/env bash
# enforce-no-playwright-mcp.sh
#
# Blocks any tool call to the Playwright MCP server.
# Per docs/lessons-learned/2026-05-09-playwright-cli-vs-mcp-decision.md,
# Playwright MCP is ~4-4.6x more token-expensive than the Playwright CLI
# (per Microsoft benchmarks). All E2E work must use the CLI via:
#   pnpm --filter @qa-nexus/e2e exec playwright test
# Save: ~85K tokens per E2E session vs MCP-driven equivalent.
#
# Hook input: JSON on stdin with .tool_name field.
# Hook contract: exit 0 = allow, exit 2 = block (per Claude Code hook spec).
#
# Wire-point: PreToolUse * (project .claude/settings.json).

set -euo pipefail

# Read hook payload from stdin.
PAYLOAD=$(cat)

# Extract tool_name (works with or without jq; falls back to grep).
if command -v jq >/dev/null 2>&1; then
  TOOL_NAME=$(printf '%s' "$PAYLOAD" | jq -r '.tool_name // empty')
else
  TOOL_NAME=$(printf '%s' "$PAYLOAD" | grep -oE '"tool_name"[[:space:]]*:[[:space:]]*"[^"]+"' | sed -E 's/.*"([^"]+)"$/\1/')
fi

# Block any mcp__playwright__* tool call.
if [[ "$TOOL_NAME" =~ ^mcp__playwright__ ]]; then
  cat >&2 <<EOF
🚫 Playwright MCP is BANNED on this project.

Tool blocked: $TOOL_NAME

Use the Playwright CLI instead — ~4.6x more token-efficient:
  pnpm --filter @qa-nexus/e2e exec playwright test
  pnpm --filter @qa-nexus/e2e exec playwright codegen <url>
  pnpm --filter @qa-nexus/e2e exec playwright show-report

Reference: docs/lessons-learned/2026-05-09-playwright-cli-vs-mcp-decision.md
Hook source: .claude/hooks/pre-tool-use/enforce-no-playwright-mcp.sh
EOF
  exit 2
fi

# Allow everything else.
exit 0
