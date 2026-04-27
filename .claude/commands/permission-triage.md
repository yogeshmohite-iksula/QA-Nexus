---
description: Triage a Claude Code permission request via the 3-way decision tree (auto-allow / strictly deny / manual approve). Generates the exact JSON line + dedupe check.
---

PM1 reusable workflow for managing future permission requests, distilled from
the P1.12 31-screenshot batch triage on 2026-04-27. Use this command whenever:

- Claude flashes a new "Allow Claude to ..." prompt mid-session, AND
- You're not sure whether to `Always allow` (and persist the rule) or
  `Allow once` (one-off), AND
- You want a recorded decision in `docs/audits/` for future audit traceability.

## Usage

Paste the permission request as text, or describe what's being asked:

```
/permission-triage Allow Claude to run `gh secret set CLOUDFLARE_API_TOKEN`
```

Or paste a screenshot — Claude reads images natively, no OCR needed:

```
/permission-triage [attach screenshot]
```

## What I'll do

### Step 1 — Extract the request

Identify:

- **Tool** (Bash / Edit / Write / Read / mcp\_\_... / etc.)
- **Pattern** (the command string or file path being requested)
- **Context** (which subsystem touches it: apps/web, apps/api, .claude/,
  docs/, git, gh, pnpm, etc.)

### Step 2 — Apply the 3-way decision tree

```
✅ AUTO-ALLOW (add to .claude/settings.json `permissions.allow`)
   ALL of these must be true:
     • Safe (no destructive intent, no secret exposure)
     • Repeatable (will likely come up again in normal dev work)
     • Project-scoped (doesn't affect anything outside this repo)
     • Already common in normal Node/pnpm/git/gh workflow

❌ STRICTLY DENY (add to .claude/settings.json `permissions.deny`)
   ANY of these triggers deny:
     • Destructive (rm -rf, drop database, force-push to main)
     • Edits locked files (PM1_UI_v2/**, .env*, secrets/**)
     • Bypasses safety (--no-verify, --skip-hooks)
     • Repo-level destruction (gh repo delete, git reset --hard)

👤 MANUAL APPROVE EACH TIME (do NOT add to settings)
   • Sensitive (touches secrets, credentials, env files)
   • Network calls to unknown endpoints (curl arbitrary URLs)
   • One-off operations (script you run once, not recurring)
   • Anything that feels safer with a human eyeball each time
```

### Step 3 — Dedupe check

Before suggesting an addition, I will:

1. Read `.claude/settings.json` to see if the pattern is already in
   `permissions.allow` or `permissions.deny` (committed, team-wide).
2. Read `.claude/settings.local.json` to check personal overrides
   (gitignored, per-machine).
3. If the exact pattern OR a covering wildcard is already present, **skip
   the addition** and report "already covered by `<pattern>`".

Example dedupes (live as of P1.12):

- `Bash(gh pr create:*)` → covered by `Bash(gh pr:*)`
- `Bash(git push origin:*)` → covered by `Bash(git push:*)`
- `Edit(.claude/hooks/pre-tool-use/foo.sh)` → covered by `Edit(.claude/hooks/**)`

### Step 4 — Output the structured triage

```
## Permission triage

Request:    <verbatim from prompt or screenshot>
Tool:       <Bash | Edit | Write | etc.>
Pattern:    <distilled regex-suitable form>
Context:    <subsystem touched>

Decision:   ✅ Auto-allow | ❌ Deny | 👤 Manual

Reason:     <1-2 lines on why this decision>

Dedupe:     <"new" | "already covered by <existing pattern>">

JSON line to add (if Auto-allow or Deny):
  "<Tool>(<pattern>)"

Place it in:
  .claude/settings.json -> permissions.<allow|deny> array

Audit-doc entry (if you want to log this decision):
  docs/audits/<date>-permission-triage.md
```

### Step 5 — Apply with consent

I will NOT auto-edit `.claude/settings.json` — that's a team-wide config
change. After I show you the proposed JSON line, ask "apply?" (yes / no).

On `yes`:

1. Edit `.claude/settings.json` adding the pattern to the right array.
2. Validate JSON parses (`jq -e .`).
3. Commit:
   ```
   chore(settings): allow <pattern> via /permission-triage (<short reason>)
   ```
4. Push.

On `no`: leave the file alone; the triage report goes to chat only (no
file write).

## Hard rules

- **NEVER auto-allow** anything in Group C (sensitive). When in doubt,
  default to manual approve.
- **NEVER deny** something that isn't clearly destructive. False denies
  cripple workflow more than false allows leak risk.
- **ALWAYS dedupe** against `.claude/settings.json` allow + deny + the
  per-machine `.claude/settings.local.json` allow before suggesting
  additions.
- **ALWAYS include the dedupe report** in the output, even if the answer
  is "new" — Yogesh wants to see the check happened.
- **NEVER edit `.claude/settings.json` without explicit approval** — that
  file is committed and propagates to all worktrees + future contributors.
  `.claude/settings.local.json` (gitignored, per-machine) is also off-limits
  without approval.

## Cross-references

- `docs/audits/2026-04-27-permission-triage.md` — original 31-screenshot
  batch triage that established the 3-way decision tree
- `.claude/settings.json` — current allow + deny lists (committed)
- `.claude/settings.local.json` — personal overrides (gitignored, optional)
- `.claude/hooks/pre-tool-use/check-secrets.sh` — runtime secret-scan
  paired with these permission gates
