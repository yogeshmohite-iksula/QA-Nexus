#!/bin/bash
# PreToolUse Edit|Write — enforce CLAUDE.md Rule 12 (full responsive web design)
# in apps/web/**/*.{ts,tsx,css,scss}.
# Spec: MS0-T034 (committed bfe44dc, implemented 2026-04-27).
# Reference: CLAUDE.md Rule 12 + PM1_PRD §10 NFR-001 (responsive for daily use)
#            + 01_SYSTEM.md §4.4 (1600x1024 is canvas size, NOT mandated width).
#
# Blocks:
#   1. w-[Xpx]     where X >= 200    (fixed widths on layout containers)
#   2. max-w-[1600px]                 (canvas-width anti-pattern, explicit)
#   3. h-[Xpx]     where X >= 200    (fixed heights on layout containers)
#
# Allows (semantic widths fine):
#   - max-w-{md,lg,xl,2xl,3xl,4xl,...}  (Tailwind named tokens)
#   - max-w-[480px|640px|768px]         (form / reading widths)
#   - w-{fit,full,auto,screen}          (content-driven widths)
#   - min-w-[Xpx], max-h-[Xpx]          (NOT in spec — out of scope)
#
# The w-/h- regexes use a leading [^a-zA-Z0-9_-] guard so they do NOT
# false-match max-w-[Xpx] / lg:max-w-[Xpx] / min-w-[Xpx].

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // .tool_input.replacement // empty' 2>/dev/null)

# Only enforce on apps/web frontend code
case "$FILE" in
  */apps/web/*.ts|*/apps/web/*.tsx|*/apps/web/*.css|*/apps/web/*.scss|*/apps/web/**/*.ts|*/apps/web/**/*.tsx|*/apps/web/**/*.css|*/apps/web/**/*.scss) ;;
  *) exit 0 ;;
esac

VIOLATIONS=""

# 1. Fixed widths: w-[Xpx] where X is 4+ digits starting with 1, OR 3+ digits
#    starting with 2-9 (i.e. >= 200, excluding 100..199 which is fine for
#    icons/avatars/buttons). Leading [^a-zA-Z0-9_-] excludes max-w-/min-w-.
HITS=$(printf '%s' "$CONTENT" | grep -nE '[^a-zA-Z0-9_-]w-\[(1[0-9]{3,}|[2-9][0-9]{2,})px\]' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS+="Fixed width >=200px (w-[Xpx]) on layout container — use w-full / max-w-{md|lg|xl|2xl} / max-w-[480px|640px|768px] (form+reading widths) instead:
$HITS

"
fi

# 2. Canvas-width anti-pattern (explicit literal — locked frames are 1600x1024
#    DESIGN canvases, not layout widths). Catches max-w-[1600px] and
#    lg:max-w-[1600px] etc.
HITS=$(printf '%s' "$CONTENT" | grep -nE 'max-w-\[1600px\]' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS+="Canvas-width anti-pattern (max-w-[1600px]) — the 41 locked HTML frames are 1600x1024 design REFERENCES, NOT layout widths (CLAUDE.md Rule 12 + 01_SYSTEM.md §4.4). Use max-w-screen-2xl or remove the cap:
$HITS

"
fi

# 3. Fixed heights: same pattern as widths. Catches h-[1024px] which Rule 12
#    explicitly calls out (use min-h-screen instead).
HITS=$(printf '%s' "$CONTENT" | grep -nE '[^a-zA-Z0-9_-]h-\[(1[0-9]{3,}|[2-9][0-9]{2,})px\]' || true)
if [ -n "$HITS" ]; then
  VIOLATIONS+="Fixed height >=200px (h-[Xpx]) on layout container — Rule 12 prohibits h-[1024px] explicitly (form falls below fold on 770-900px viewports per F06 incident 2026-04-26). Use min-h-screen / h-full / aspect-* instead:
$HITS

"
fi

if [ -n "$VIOLATIONS" ]; then
  printf "PM1 RWD violation in %s

%sReference: CLAUDE.md Rule 12 (full responsive web design) + PM1_PRD §10 NFR-001 strengthened addendum + 01_SYSTEM.md §4.4 (Canvas 1600x1024 desktop primary, NOT mandated width).
" "$FILE" "$VIOLATIONS" >&2
  exit 2
fi
exit 0
