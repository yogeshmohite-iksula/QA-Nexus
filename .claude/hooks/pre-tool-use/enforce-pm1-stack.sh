#!/bin/bash
# PreToolUse Edit|Write to package.json or pnpm-lock.yaml — enforce PM1 stack.
# Spec: kickoff §1.4 (ban list) + MS0-T033 2026-04-26 (version-pin enforcement).
# Ban list from PM1_PRD §12.3 + kickoff §6.
# Locked majors from .claude/locked-deps.json (single source of truth).

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty' 2>/dev/null)

case "$FILE" in
  */package.json|*/pnpm-lock.yaml) ;;
  *) exit 0 ;;
esac

# ─────────────────────────────────────────────────────────────────
# 1. BAN LIST CHECK (fires on package.json AND pnpm-lock.yaml)
# ─────────────────────────────────────────────────────────────────
BANNED='bullmq|ioredis|@redis/|^redis$|"redis"|@neo4j/|neo4j-driver|^ollama$|"ollama"|@vercel/postgres|^langchain$|"langchain"|langsmith|^mui$|@mui/|chakra-ui|@chakra-ui/|^mantine$|@mantine/|daisyui|material-tailwind|fastify'
BAN_HITS=$(echo "$CONTENT" | grep -nE "\"($BANNED)\"" || true)
if [ -n "$BAN_HITS" ]; then
  printf "PM1 stack violation — banned dependency in %s:\n%s\nBan list (PM1_PRD §12.3 + kickoff §6): bullmq, ioredis, redis, @redis/*, neo4j-driver, ollama, langchain, langsmith, mui, chakra-ui, mantine, daisyui, material-tailwind, fastify\n" "$FILE" "$BAN_HITS" >&2
  exit 2
fi

# ─────────────────────────────────────────────────────────────────
# 2. VERSION-PIN ENFORCEMENT (MS0-T033, package.json only)
#    Lockfile version mismatches are too noisy; only enforce on the
#    declarative file.
# ─────────────────────────────────────────────────────────────────
case "$FILE" in
  */package.json) ;;
  *) exit 0 ;;
esac

# Resolve repo root (where .claude/ lives) by walking up from $FILE
LOCKED_DEPS=""
DIR=$(dirname "$FILE" 2>/dev/null)
while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do
  if [ -f "$DIR/.claude/locked-deps.json" ]; then
    LOCKED_DEPS="$DIR/.claude/locked-deps.json"
    break
  fi
  DIR=$(dirname "$DIR")
done

if [ -z "$LOCKED_DEPS" ] || [ ! -f "$LOCKED_DEPS" ]; then
  echo "PM1 stack: WARN — locked-deps.json not found; version-pin enforcement skipped on $FILE" >&2
  exit 0
fi

# Merge .dependencies + .devDependencies + .peerDependencies into one map
DEPS_JSON=$(echo "$CONTENT" | jq -c '(.dependencies // {}) + (.devDependencies // {}) + (.peerDependencies // {})' 2>/dev/null)
if [ -z "$DEPS_JSON" ] || [ "$DEPS_JSON" = "null" ]; then
  # Empty / unparseable package.json — skip gracefully
  exit 0
fi

VIOLATIONS=""

# Iterate locked entries
while IFS= read -r pkg; do
  if [ "$pkg" = "_comment" ] || [ "$pkg" = "_version" ]; then
    continue
  fi

  if [ "$pkg" = "node" ]; then
    # Special case: engines.node
    ENGINES_NODE=$(echo "$CONTENT" | jq -r '.engines.node // empty' 2>/dev/null)
    if [ -n "$ENGINES_NODE" ]; then
      LOCKED_NODE=$(jq -r '.node' "$LOCKED_DEPS")
      # Accept "20", "20.x", "^20", "~20", ">=20", ">=20.0.0", "20.0.0" — anything pinning to LOCKED_NODE major
      if ! echo "$ENGINES_NODE" | grep -qE "(^|[^0-9])${LOCKED_NODE}([^0-9]|$)"; then
        VIOLATIONS+="❌ BLOCKED: engines.node=\"$ENGINES_NODE\" does NOT match locked Node major $LOCKED_NODE. See PM1_PRD §12.3.\n"
      fi
    fi
    continue
  fi

  FOUND_VERSION=$(echo "$DEPS_JSON" | jq -r --arg p "$pkg" '.[$p] // empty')
  if [ -z "$FOUND_VERSION" ] || [ "$FOUND_VERSION" = "null" ]; then
    continue  # Package not present in this package.json; skip
  fi

  # Strip leading ^/~/=/v/space and grab the first numeric chunk
  FOUND_MAJOR=$(echo "$FOUND_VERSION" | sed -E 's/^[[:space:]]*[\^~=v>]+[[:space:]]*//' | sed -E 's/^([0-9]+).*/\1/')
  LOCKED_MAJOR=$(jq -r --arg p "$pkg" '.[$p]' "$LOCKED_DEPS")

  if [ -z "$FOUND_MAJOR" ] || ! echo "$FOUND_MAJOR" | grep -qE '^[0-9]+$'; then
    # Couldn't parse a major from this version string (e.g. "next" or "latest" tag) — warn but allow
    printf "PM1 stack: WARN — could not parse major from %s@%s (allowed; consider pinning explicitly)\n" "$pkg" "$FOUND_VERSION" >&2
    continue
  fi

  if [ "$FOUND_MAJOR" != "$LOCKED_MAJOR" ]; then
    VIOLATIONS+="❌ BLOCKED: ${pkg}@${FOUND_VERSION} (major ${FOUND_MAJOR}) violates locked major ${LOCKED_MAJOR}. See PM1_PRD §12.3 + .claude/locked-deps.json.\n"
  fi
done < <(jq -r 'keys[]' "$LOCKED_DEPS")

if [ -n "$VIOLATIONS" ]; then
  printf "PM1 stack — version-pin violations in %s:\n" "$FILE" >&2
  printf "%b" "$VIOLATIONS" >&2
  exit 2
fi
exit 0
