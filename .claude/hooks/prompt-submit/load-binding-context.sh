#!/bin/bash
# UserPromptSubmit * — prepend PM1 binding context to every Claude session.
# Spec: kickoff §1.4. Reminds Claude what's binding before each user prompt.
# 2026-04-27 (P1.11): also append a session-scoped marker to
# .claude/preloads.jsonl so report-token-savings.sh can count fires.
INPUT=$(cat 2>/dev/null || true)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)
if [ -n "$SESSION_ID" ]; then
  mkdir -p .claude
  echo "{\"ts\":\"$(date -u +%FT%TZ)\",\"event\":\"context_preload\",\"session_id\":\"$SESSION_ID\"}" >> .claude/preloads.jsonl
fi
cat <<'NOTE'
=== PM1 BINDING CONTEXT (load-binding-context hook) ===
- BINDING SPECS: PM1_PRD v8.1 + PM1_ERD v2.1 (in QA Nexus/PM1/)
- DESIGN: PM1_UI_v2/UI Files/01_SYSTEM.md (teal=system, violet=AI, no MD3, no tertiary)
- M0 BACKLOG: PM1_milestone/M0/Milestone_M0_Setup_v8.md (31 tasks, 19 acceptance gates)
- 41 LOCKED FRAMES in PM1_UI_v2/{frame  html view, frames - claude code build (PM1 v2.6-v2.8)}/ — never modify
- COST GATE: $0/month total infra (free-OSS only); add NOTHING from kickoff §6 ban list
- PROJECT-LEVEL PRD/ERD (in QA Nexus/PRD, QA Nexus/ERD) describe PM2-PM4 vision — NOT binding for PM1
========================================================
NOTE
exit 0
