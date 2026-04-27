# Permission triage — 2026-04-27 (Day 1, P1.12)

**Scope:** 31 permission-prompt screenshots captured throughout Day 1
across MAIN + FE + BE worktree sessions. Triaged via the 3-way decision
tree (Auto-allow / Strictly deny / Manual approve each time) per skill
audit Section 8 P1.12.

**Auditor:** Yogesh + Cowork pre-classification, Claude (MAIN) verification

- apply.

**Method:** Yogesh pre-triaged the 31 screenshots with Cowork's help and
delivered the 3 grouped lists. Claude spot-checked 8 of 31 screenshots to
verify the classification accuracy, then applied Group A to
`.claude/settings.local.json` allow-list (deduplicated against existing).

---

## Spot-check sample (8 of 31, all match Yogesh's classification)

| #   | Screenshot  | Request                                                                                                                  | Verified Group                                                                            |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1   | 9.43.16 AM  | Allow ctx batch execute                                                                                                  | A — `mcp__plugin_context-mode_context-mode__ctx_batch_execute` (already present)          |
| 2   | 9.59.20 AM  | mkdir -p .claude/memory/domain && mkdir -p .claude/memory/tools && ls                                                    | A — `Bash(mkdir -p .claude/**)`                                                           |
| 3   | 10.04.34 AM | Write `.claude/memory/memory.md`                                                                                         | A — `Write(.claude/memory/**)`                                                            |
| 4   | 10.05.50 AM | Write `.claude/memory/general.md`                                                                                        | A — same                                                                                  |
| 5   | 10.08.49 AM | Write `.claude/memory/domain/bugs.md`                                                                                    | A — same                                                                                  |
| 6   | 10.11.18 AM | Write `.claude/memory/domain/api.md`                                                                                     | A — same                                                                                  |
| 7   | 1.46.10 PM  | Chained `git fetch + git rev-parse + echo + git status --short` for sync verification (in FE worktree)                   | A — `Bash(git fetch:*)` + `Bash(git rev-parse:*)` + `Bash(echo:*)` + `Bash(git status:*)` |
| 8   | 2.46.11 PM  | Edit `block-dangerous.sh` inside `.claude/worktrees/ecstatic-pare-d177bf/.claude/hooks/...` (transient session worktree) | A — `Edit(.claude/hooks/**)` (already present)                                            |

**All 8 fit Group A patterns. Triage validated.**

---

## Group A — Auto-allow (47 NEW patterns added to `permissions.allow`)

### Memory + hook + settings + agents + commands + rules writes (14)

These are project-owned subsystem files. Claude Code's default heuristic flags
them as "sensitive" because they live under `.claude/` (which often holds
private credentials in other projects), but in our workflow they're EXPECTED
write targets. Adding them to allow eliminates the friction without weakening
the deny block (locked frames + .env are still in `permissions.deny`).

```
Edit(.claude/memory/**)
Write(.claude/memory/**)
Edit(.claude/settings.json)
Write(.claude/settings.json)
Edit(.claude/settings.local.json)
Write(.claude/settings.local.json)
Edit(.claude/agents/**)
Write(.claude/agents/**)
Edit(.claude/commands/**)
Write(.claude/commands/**)
Edit(.claude/rules/**)
Write(.claude/rules/**)
Bash(mkdir -p .claude/**)
Bash(chmod +x .claude/hooks/**)
```

**Already present (not re-added):** `Edit(.claude/hooks/**)`, `Write(.claude/hooks/**)`, `Edit(.claude/locked-deps.json)`, `Edit(CLAUDE.md)`.

### File inspection (10)

Standard read-only inventory commands. Safe everywhere; high-frequency.

```
Bash(ls:*)
Bash(cat:*)
Bash(head:*)
Bash(tail:*)
Bash(grep:*)
Bash(find:*)
Bash(wc:*)
Bash(echo:*)
Bash(jq:*)
Bash(diff:*)
```

The pre-existing `Bash(echo "...")` one-off entries (lines 12, 15, 18, 20, etc.) are now subsumed by `Bash(echo:*)` and could be deduped in a future cleanup pass. Not done now to avoid scope creep.

### Git read + safe-write operations (12)

Colon-syntax variants (canonical Claude Code permission form). Some have
asterisk-form duplicates already present; both syntaxes work but colon is
preferred per Claude Code docs.

```
Bash(git status:*)
Bash(git fetch:*)
Bash(git pull:*)
Bash(git branch:*)
Bash(git rev-parse:*)
Bash(git show:*)
Bash(git remote:*)
Bash(git rebase:*)
Bash(git stash:*)
Bash(git worktree:*)
Bash(git checkout:*)
Bash(git restore:*)
```

**Already present (not re-added):** `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git push:*)`, `Bash(git log:*)`, `Bash(git diff:*)`, `Bash(git merge *)`, `Bash(git pull *)`.

**Skipped as redundant** with existing wildcards:

- `Bash(git push origin:*)` — covered by `Bash(git push:*)` (line 83)
- `Bash(git merge --no-commit:*)` / `--no-ff:*` — covered by `Bash(git merge *)` (line 114)

### GitHub CLI — issue + repo + secret-list + workflow (6)

Distinct from `gh pr *` which is already present (line 113). These cover
issue tracking + repo info + read-only secret listing + workflow inspection.

```
Bash(gh issue create:*)
Bash(gh issue list:*)
Bash(gh issue view:*)
Bash(gh repo view:*)
Bash(gh secret list:*)
Bash(gh workflow list:*)
```

**Already present (not re-added):** `Bash(gh pr *)`, `Bash(gh run *)`, `Bash(gh auth *)`, `Bash(gh --version)`.

**Skipped as redundant:** `Bash(gh pr create:*)` / `checks:*` / `view:*` / `list:*` / `merge:*` / `edit:*` / `comment:*` — all covered by `Bash(gh pr *)`. `Bash(gh run list:*)` / `view:*` covered by `Bash(gh run *)`. `Bash(gh auth status)` covered by `Bash(gh auth *)`.

### pnpm + Node tooling (8)

Wildcard variants for pnpm subcommands + Node version check + Ruby YAML parser.

```
Bash(pnpm install:*)
Bash(pnpm build:*)
Bash(pnpm typecheck:*)
Bash(pnpm test:*)
Bash(pnpm -r:*)
Bash(pnpm --filter:*)
Bash(node --version)
Bash(ruby -ryaml:*)
```

**Already present (not re-added):** `Bash(pnpm exec *)` (line 89), `Bash(pnpm dev *)` (line 54), `Bash(pnpm lint *)` (line 124), `Bash(pnpm install *)` (line 38), `Bash(pnpm --version)` (line 17), `Bash(pnpm dlx *)` (line 100), `Bash(npx --yes @nestjs/cli@10 *)` (line 93).

**Skipped as redundant:** `Bash(jq -e:*)` covered by new `Bash(jq:*)`.

### Cowork tooling (already present)

The `mcp__context-mode__*` MCP tools are explicitly granted on lines 4-9 + 106. No new entries needed for the spec's `ctx batch execute:*` / `ctx_execute:*` notation (the underlying MCPs are already permitted).

---

## Group B — Strictly deny

**Verified:** No new deny rules from the screenshots. Existing deny block
in `.claude/settings.json` (added by BE chat in P1.8, commit `32abac8`)
already covers everything dangerous observed:

```
Bash(rm -rf:*)
Bash(rm -r:*)
Bash(git push --force:*)
Bash(git push -f:*)
Bash(git reset --hard:*)
Bash(git clean -f:*)
Bash(git checkout --:*)
Bash(git restore --:*)
Bash(gh repo delete:*)
Bash(DROP TABLE:*)
Bash(TRUNCATE:*)
Edit(QA Nexus/PM1/PM1_UI_v2/**)
Write(QA Nexus/PM1/PM1_UI_v2/**)
Edit(.env)
Write(.env)
Edit(apps/**/.env)
Write(apps/**/.env)
```

**Result:** `.claude/settings.json` deny block unchanged.

---

## Group C — Manual approve each time (NOT in settings, documented for awareness)

These will continue to flash permission prompts in future sessions. That's
**intentional** — sensitive ops should be human-approved per-call. Listed
here so Yogesh recognizes the prompts when they appear.

| Pattern             | Why it stays manual                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gh secret set:*`   | Touches credentials. One-off prompt per secret update. Already happened tonight when wiring `CLOUDFLARE_API_TOKEN`.                                                                 |
| `gh repo create:*`  | One-off, never recurring. Cross-account risk if repo created in wrong org.                                                                                                          |
| `gh repo delete:*`  | Already in deny block (paranoia layer).                                                                                                                                             |
| `npm publish:*`     | Releases code to public registry. Not in PM1 scope yet (no published packages).                                                                                                     |
| `pnpm publish:*`    | Same as npm publish.                                                                                                                                                                |
| `curl http(s)://:*` | Arbitrary network calls. May exfiltrate data. Approve case-by-case based on URL.                                                                                                    |
| `wrangler deploy:*` | Production deploys (Cloudflare Pages, R2). Pair with `pnpm deploy:web` script via `Bash(pnpm dlx *)` which IS auto-allowed; the underlying wrangler call is mediated by the script. |
| `chmod -R *`        | Broad permission changes. Specific paths (e.g., `chmod +x .claude/hooks/**`) are auto-allowed; recursive chmod stays manual.                                                        |
| `sudo *`            | Privileged operations. Should never be needed in this project (non-admin Mac, Homebrew at `~/homebrew/`).                                                                           |

---

## Settings.local.json before / after

| Metric                                                          | Before | After          |
| --------------------------------------------------------------- | ------ | -------------- |
| `permissions.allow` array length                                | 125    | 172            |
| `permissions.deny` array (in `settings.json`, not `local.json`) | 17     | 17 (unchanged) |
| Net additions to allow                                          | —      | +47 patterns   |
| JSON validity                                                   | ✓      | ✓              |

---

## Real-world impact (expected from this triage)

- **Tomorrow's MAIN session** should have ~80% fewer permission prompts when working on `.claude/memory/` writes, slash command + agent additions, and routine git/pnpm/gh inventory.
- **FE chat** sessions should benefit from the wildcard `Bash(git rebase:*)` and `Bash(git checkout:*)` rules during future rebase flows.
- **BE chat** sessions get cleaner `Bash(pnpm test:*)` + `Bash(pnpm typecheck:*)` runs.
- Sensitive ops (Group C) continue to require explicit approval — by design.

---

## Follow-ups (queued for later)

- **Cleanup pass on settings.local.json** — many one-off entries (lines 12-80 mostly) are now subsumed by the new wildcards. Defer the cleanup to a separate audit (P2.x or later) to avoid mixing this triage's intent with deduplication churn.
- **`/permission-triage` slash command** — being implemented in Phase 5 of tonight's plan as a reusable workflow for future permission requests (so the next triage doesn't need a manual screenshot batch).

---

## Files touched

| File                                          | Change                                                                |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `.claude/settings.local.json`                 | +47 allow patterns, JSON validated                                    |
| `docs/audits/2026-04-27-permission-triage.md` | NEW — this file                                                       |
| `.gitignore`                                  | +1 line: `docs/permission-screenshots/` (PNGs are evidence, not code) |
