#!/bin/bash
# PreToolUse Edit|Write — block files containing high-entropy provider keys
# or PEM private-key blocks before they ever land in the working tree.
#
# Spec: P1.5 of docs/audits/2026-04-27-skill-alignment-audit.md
#       (Tech-project-forge-skill v1.4 Step 2.6 + 2.15 — `check-secrets`).
# Pairs with: .gitleaks.toml (CI scan, same patterns) + docs/SECURITY.md.
# Reads STDIN per Claude Code hook contract (matches block-dangerous.sh /
# audit-log.sh STDIN patch).
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
# Edit passes diff via .new_string; Write passes full body via .content.
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty' 2>/dev/null)

# ─────────────────────────────────────────────────────────────────────
# Path allowlist — files allowed to contain pattern-matching strings
# ─────────────────────────────────────────────────────────────────────
case "$FILE_PATH" in
  *.env.example|*.env.example.*) exit 0 ;;
  */docs/audits/*)               exit 0 ;;
  */.claude/memory/*)            exit 0 ;;
  */docs/SECURITY.md)            exit 0 ;;
  */.gitleaks.toml)              exit 0 ;;
  */.claude/hooks/pre-tool-use/check-secrets.sh) exit 0 ;;
  */.github/workflows/*.yml)     exit 0 ;;  # GH Actions reference secret names
esac

# Generic placeholder values that are always safe even outside allowlisted paths.
PLACEHOLDER_RE='<your-[a-z\-]+>|REPLACE_ME|REPLACE-ME|EXAMPLE_KEY|<.*placeholder.*>|gsk_fake|AIzaSyEXAMPLE'

VIOLATIONS=""

check_pattern() {
  local label="$1" regex="$2"
  local hits
  hits=$(echo "$CONTENT" | grep -nE "$regex" | grep -vE "$PLACEHOLDER_RE" || true)
  if [ -n "$hits" ]; then
    VIOLATIONS+="$label
$hits

"
  fi
}

# Provider-specific key patterns
check_pattern "Groq API key (gsk_…)"                'GROQ_API_KEY[[:space:]]*=[[:space:]]*"?gsk_[A-Za-z0-9]{20,}'
check_pattern "Google AI / Gemini key (AIza…)"      '(GEMINI_API_KEY|GOOGLE_API_KEY)[[:space:]]*=[[:space:]]*"?AIza[A-Za-z0-9_\-]{35,}'
check_pattern "Cloudflare API token"                'CLOUDFLARE_API_TOKEN[[:space:]]*=[[:space:]]*"?[A-Za-z0-9_\-]{40,}'
check_pattern "BetterAuth secret (32+ char base64)" 'BETTERAUTH_SECRET[[:space:]]*=[[:space:]]*"?[A-Za-z0-9+/=]{32,}'
check_pattern "Resend API key (re_…)"               'RESEND_API_KEY[[:space:]]*=[[:space:]]*"?re_[A-Za-z0-9_]{20,}'
check_pattern "PEM private-key block"               '^-----BEGIN [A-Z ]*PRIVATE KEY-----'

if [ -n "$VIOLATIONS" ]; then
  cat >&2 <<EOF
🚨 check-secrets.sh BLOCKED edit to: $FILE_PATH

$VIOLATIONS
Secrets MUST NOT be committed. To proceed:
  1. Remove the secret from the file content
  2. Place the real value in your local .env (already in .gitignore)
  3. If a real key was already exposed, rotate immediately:
       see docs/SECURITY.md → "Per-provider secret rotation"
  4. For .env.example placeholders, use literals: <your-key-here> or REPLACE_ME

Allowlisted paths: .env.example, docs/audits/**, .claude/memory/**,
                   docs/SECURITY.md, .gitleaks.toml,
                   .claude/hooks/pre-tool-use/check-secrets.sh,
                   .github/workflows/**
EOF
  exit 2
fi
exit 0
