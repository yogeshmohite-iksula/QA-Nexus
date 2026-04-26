#!/bin/bash
# PreToolUse Edit|Write to package.json or pnpm-lock.yaml — enforce PM1 stack.
# Spec: kickoff §1.4. Ban list from PM1_PRD §12.3 + kickoff §6.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty' 2>/dev/null)

case "$FILE" in
  */package.json|*/pnpm-lock.yaml) ;;
  *) exit 0 ;;
esac

BANNED='bullmq|ioredis|@redis/|^redis$|"redis"|@neo4j/|neo4j-driver|^ollama$|"ollama"|@vercel/postgres|^langchain$|"langchain"|langsmith|^mui$|@mui/|chakra-ui|@chakra-ui/|^mantine$|@mantine/|daisyui|material-tailwind|fastify'
BAN_HITS=$(echo "$CONTENT" | grep -nE "\"($BANNED)\"" || true)
if [ -n "$BAN_HITS" ]; then
  printf "PM1 stack violation — banned dependency in %s:\n%s\nBan list (PM1_PRD §12.3 + kickoff §6): bullmq, ioredis, redis, @redis/*, neo4j-driver, ollama, langchain, langsmith, mui, chakra-ui, mantine, daisyui, material-tailwind, fastify\n" "$FILE" "$BAN_HITS" >&2
  exit 2
fi
exit 0
