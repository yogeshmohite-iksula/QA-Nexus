#!/bin/bash
# PreToolUse Edit|Write — enforce PM1 locked design palette in apps/web/**/*.{ts,tsx,css}
# Spec: kickoff §1.4. Whitelist from PM1_UI_v2/UI Files/01_SYSTEM.md §3.1.

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // .tool_input.replacement // empty' 2>/dev/null)

# Only enforce on apps/web frontend code
case "$FILE" in
  */apps/web/*.ts|*/apps/web/*.tsx|*/apps/web/*.css|*/apps/web/**/*.ts|*/apps/web/**/*.tsx|*/apps/web/**/*.css) ;;
  *) exit 0 ;;
esac

VIOLATIONS=""

# Block forbidden Tailwind color classes
if echo "$CONTENT" | grep -nE '\b(bg|text|border|ring|from|to|via)-(orange|yellow|pink|cyan|rose|amber|lime|emerald|sky|indigo|fuchsia|violet|purple|blue|green|red|teal|gray|zinc|stone|slate|neutral)-[0-9]+\b' >/dev/null 2>&1; then
  HITS=$(echo "$CONTENT" | grep -nE '\b(bg|text|border|ring|from|to|via)-(orange|yellow|pink|cyan|rose|amber|lime|emerald|sky|indigo|fuchsia|violet|purple|blue|green|red|teal|gray|zinc|stone|slate|neutral)-[0-9]+\b')
  VIOLATIONS+="Forbidden Tailwind color class (must use locked CSS vars or arbitrary value with hex from whitelist):\n$HITS\n"
fi

# Block Material Design 3 tokens
if echo "$CONTENT" | grep -nE '(primary-container|on-primary|surface-tint|surface-bright|surface-container|tertiary-container|on-tertiary|inverse-surface|inverse-primary|surface-variant)' >/dev/null 2>&1; then
  HITS=$(echo "$CONTENT" | grep -nE '(primary-container|on-primary|surface-tint|surface-bright|surface-container|tertiary-container|on-tertiary|inverse-surface|inverse-primary|surface-variant)')
  VIOLATIONS+="Forbidden Material Design 3 token (PM1 design system bans MD3):\n$HITS\n"
fi

# Block hex colors not in the locked whitelist
WHITELIST='#0B0F17|#111827|#1A2233|#232C3F|#2A3347|#3B4660|#F1F5F9|#C7D0DC|#8A94A6|#94A3B8|#2DD4BF|#003732|#A78BFA|#C4B5FD|#34D399|#F87171|#FBBF24|#60A5FA|#FAFAF8'
HEX_HITS=$(echo "$CONTENT" | grep -niE '#[0-9a-f]{6}\b' | grep -viE "$WHITELIST" || true)
if [ -n "$HEX_HITS" ]; then
  VIOLATIONS+="Hex color outside PM1 design-token whitelist:\n$HEX_HITS\nWhitelist: $WHITELIST\n"
fi

if [ -n "$VIOLATIONS" ]; then
  printf "PM1 design-token violation in %s\n%s\nReference: PM1_UI_v2/UI Files/01_SYSTEM.md §3.1, §3.2\n" "$FILE" "$VIOLATIONS" >&2
  exit 2
fi
exit 0
