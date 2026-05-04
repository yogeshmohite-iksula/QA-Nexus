# Token-tracking + work-log automation — diagnostic + recommendation

**Author:** MAIN · **Date:** 2026-05-04 · **Trigger:** Yogesh asked why
`QA_Nexus_Work_Log.xlsx` only shows MAIN tokens.

---

## TL;DR

- **The xlsx Yogesh is looking at is the WRONG file for token data.** Two separate Excel artifacts exist in `docs/observability/`:
  - `QA_Nexus_Work_Log.xlsx` → manual hours/work entries via `scripts/update-work-log.py` (operator-driven; no token data at all).
  - `Token_Savings_Log.xlsx` → built by `scripts/aggregate-token-savings.py` from per-worktree `.claude/token-savings.jsonl`. **This file did not exist until today** (the script created it on first run).
- **FE worktree hooks are NOT firing at all** → no `.claude/audit.jsonl`, no `.claude/token-savings.jsonl`. Most likely cause: the FE Claude Code session isn't loading project-level `.claude/settings.json` (Cowork browser? wrong cwd? trust-grant missing?).
- **BE worktree hooks fired through Apr 28 (Day 2) then stopped.** `audit.jsonl` shows last write 6 days ago. Possibly the BE session was restarted in a way that broke settings.json loading.
- **No automation triggers the aggregator** — `/eod-tokens` is a manual slash command. I missed running it last night during EOD ceremony.

**Net effect:** today's `Token_Savings_Log.xlsx` shows **only MAIN data** (7 sessions / 19.3 hr / 434k tokens estimated saved across 3 days). FE + BE contributions are zero in the rollup.

---

## Bug A — FE worktree hooks not firing

| Probe                                                          | Result                                                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `.claude/hooks/stop/log-token-savings.sh` present + executable | ✅ Yes, identical content to MAIN                                    |
| `.claude/settings.json` references the hook                    | ✅ Yes, with relative path `.claude/hooks/stop/log-token-savings.sh` |
| `.claude/audit.jsonl` exists                                   | ❌ **No file** — confirms PreToolUse audit-log hook never fired      |
| `.claude/token-savings.jsonl` exists                           | ❌ No file — confirms Stop hook never fired                          |

**Diagnosis:** the FE Claude Code session is not loading project-level `.claude/settings.json`. Three plausible causes:

1. FE chat is run via Claude Cowork (browser) — the browser interface does NOT honor local `.claude/` config. Hooks fundamentally cannot fire from there. Only `claude` CLI sessions trigger hooks.
2. FE chat is started from the wrong cwd (e.g. user's home directory) — settings.json discovery walks up from cwd to find the nearest `.claude/`. If FE chat's cwd isn't inside `Project10-QA_Nexus-frontend/`, it won't find that worktree's settings.
3. FE Claude Code session doesn't have the project-level trust grant for hooks. Hooks require explicit "allow this project to run hooks" approval per session.

**Action to confirm:** ask FE+1 to run `pwd` in their session + report whether they're using `claude` CLI or Cowork browser.

---

## Bug B — BE worktree hooks fired through Apr 28 then stopped

| Probe                                | Result                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| `.claude/audit.jsonl` exists         | ✅ Yes, **but last write 2026-04-28 14:33** (6 days ago, Day 2) |
| `.claude/token-savings.jsonl` exists | ❌ No file — Stop hook never wrote a row even on Apr 28         |
| Hook script + settings.json present  | ✅ Yes, both present + chmod 755                                |

**Diagnosis:** BE chat fired hooks during Days 1-2 but stopped after Apr 28. Likely the BE chat was restarted in a way that broke settings.json loading (similar root cause to Bug A — switched to Cowork browser, or cwd drift after a reboot).

Even when audit.jsonl WAS being written (Apr 27-28), the Stop hook's `log-token-savings.jsonl` write never landed — possibly because:

- Stop hook runs at session END, and the BE chat sessions weren't cleanly closed (kill -9, browser-close)
- The Stop hook's `[ -z "$session_id" ] && exit 0` guard returns early if Claude Code's stdin payload doesn't include `session_id` (Cowork doesn't pass this)

---

## Bug C — Two Excel artifacts, no shared schema

| File                     | Source                                                 | Contents                                                | Last update                                                        |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `QA_Nexus_Work_Log.xlsx` | `scripts/update-work-log.py` (manual operator entry)   | Date · day · phase · theme · what + hours/files columns | 2026-05-03 20:59 (last night, MAIN only)                           |
| `Token_Savings_Log.xlsx` | `scripts/aggregate-token-savings.py` (auto-aggregator) | Sessions · Daily Rollup · Per-Chat Compare sheets       | **2026-05-04 (just created today by my dry-run)** — first run ever |

The work-log Yogesh sees has zero token columns. The token-savings xlsx has zero hours-context columns. They're two parallel systems.

---

## Bug D — No automation fires the aggregator

- `/eod-tokens` slash command is the only documented invocation path
- `update-work-log.py` doesn't call the aggregator
- No cron, no Stop-hook chain to auto-rebuild the Excel
- I missed `/eod-tokens` last night during EOD ceremony

---

## Recommended action plan

Ranked by impact + effort.

### Fix 1 — Surface the FE/BE hook gap (~10 min ask, then unknown effort)

Ask FE+1 + BE+1: are you running `claude` CLI in the worktree, or Cowork browser? If Cowork: hooks don't fire there period — need a different telemetry path (manual entry only, OR a separate worker that polls Cowork's API if exposed).

### Fix 2 — Auto-trigger aggregator on push to main (~20 min, low risk)

Append to `.husky/pre-push` after the existing 3 gates:

```bash
echo "→ pre-push gate 4/4 (informational): rebuild token-savings Excel"
python3 scripts/aggregate-token-savings.py 2>/dev/null || echo "  (skipped — openpyxl not installed; non-blocking)"
```

This rebuilds `Token_Savings_Log.xlsx` on every push (which is roughly EOD frequency for active days). Stays informational (won't block push). Captures MAIN data reliably; FE/BE fill in once Bug 1 is resolved.

### Fix 3 — Merge token data INTO QA_Nexus_Work_Log.xlsx (~1-2 hr)

Extend `update-work-log.py` to pull the day's totals from `Token_Savings_Log.xlsx` and write a `tokens_saved` column. Then the operator-facing work-log Yogesh actually opens shows BOTH hours + tokens in one place. Two-column add to the schema; aggregator runs as side-effect of `update-work-log.py`.

### Fix 4 — Backfill FE/BE history for Days 1-7 (manual)

The Stop hook can't reconstruct past sessions if it never fired. Best Yogesh can do:

- Estimate FE/BE hours/day from EOD reports + commits + CHANGELOG entries
- Manually enter rows via `update-work-log.py --date <X> --start <Y> --end <Z> --hours <H> --files <F> --phase <P> --theme <T> --what <W>` for FE+1 and BE+1
- OR ask FE+1 + BE+1 to enter their own retrospective rows

### Fix 5 — Document the two systems in CLAUDE.md / observability README

So nobody confuses them again. ~10 min addition to `docs/observability/README.md` (if it exists, otherwise create).

---

## Recommendation: pick Fix 1 + Fix 2 + Fix 5 tonight; Fix 3 + Fix 4 next week

- **Fix 1** unblocks everything — without FE/BE hooks firing, there's nothing to aggregate
- **Fix 2** ensures we never miss the rollup again
- **Fix 5** prevents future "why is this xlsx empty?" questions
- **Fix 3** is the polish (single-source operator view) — non-urgent
- **Fix 4** is honest history backfill — can wait until M1 close ceremony

---

## What I am NOT doing without your sign-off

- Modifying any worktree's `.claude/settings.json` or `.claude/hooks/`
- Editing `QA_Nexus_Work_Log.xlsx` (your operator-facing artifact; backfill needs your hours estimates per agent)
- Adding a `pre-push` gate (touches husky config; could affect every dev push)
- Running aggregator now to update Token_Savings_Log.xlsx (already did once via dry-run — file exists at `docs/observability/Token_Savings_Log.xlsx` with today's data)

**Standing by for your decision on which fixes to apply.**

---

## Cross-references

- `.claude/hooks/stop/log-token-savings.sh` — the per-session Stop hook
- `.claude/hooks/post-tool-use/report-token-savings.sh` — also exists; likely runs after each tool call
- `scripts/aggregate-token-savings.py` — the multi-worktree rollup
- `scripts/update-work-log.py` — the manual hours entry (separate concern)
- `.claude/commands/eod-tokens.md` — the manual slash-command trigger
- `.claude/commands/token-savings.md` — read-only reporter
- `Token_Savings_Log.xlsx` (just created today by the aggregator dry-run) — 7 sessions / 19.3 hr / 434,600 tokens estimated saved across 3 days, **all MAIN**
- `QA_Nexus_Work_Log.xlsx` — operator-facing hours log; MAIN-only entries; no token columns
