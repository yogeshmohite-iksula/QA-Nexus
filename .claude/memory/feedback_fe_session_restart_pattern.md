# FE+1 session restart pattern (Day-23 codified 2026-05-20)

> Day-21 + 22 + 23 accumulated ~12-15 hr of FE+1 session-outage debugging. Day-23's fresh-session restart succeeded first try in a new Claude Code instance. Codified protocol going forward: **RESTART, not RESUME**.

## Outage history

| Day    | Failure mode                                                                                          | Duration | Root cause                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| Day-21 | Session got into hung-state mid-port; tool calls timed out                                            | ~4 hr    | Long-running context with stale connections to Playwright MCP                                                  |
| Day-22 | Session compacted twice; lost mid-port state both times                                               | ~5 hr    | Compaction dropped active editing context; couldn't reconstruct file states                                    |
| Day-23 | Session killed twice (dev server crashes); resumed via SessionStart hook with `<continue_from>` block | ~3-4 hr  | Background dev server killed, harness reconnected to last-state; F22 re-port executed cleanly in fresh session |

## Pattern that works (Day-23 verified)

1. **Open new terminal** (clean shell environment, no stale state)
2. **Change directory** to the `-frontend` git worktree: `cd /Users/yogeshmohite/AI_Tester_Project/Project10-QA_Nexus-frontend`
3. **Launch Claude Code fresh** (`claude` command — new session ID, fresh context window)
4. **Paste parked brief** from `.claude/scratch/` (Yogesh's morning brief or mid-day status paste)
5. **Verify worktree state** before any edits (`git status`, `git log --oneline -5`, check if dev server is running on :3000)
6. **Resume from a known checkpoint** (the last completed step in the brief), NOT from a "remember where we were" assumption

## Anti-pattern (avoid)

- ❌ **Resuming a long-running session** via SessionStart `<continue_from>` if it's been hung >1 hour — restart cleaner
- ❌ **Manually reconstructing state** from compacted session knowledge — re-read the brief instead
- ❌ **Keeping stale dev servers running** across sessions — kill + restart cleanly when starting fresh

## Trigger conditions for RESTART (vs RESUME)

Restart when:

- Tool calls timing out repeatedly
- Compaction has dropped >1 hour of context
- Background tasks killed by harness or by hand
- Yogesh's brief contains "fresh session" or "restart" directive
- Day boundary (new IST date) — always start fresh on Day-N+1

Resume when:

- Same-day continuation < 1 hour gap
- All tool calls responding normally
- Background tasks still tracked by harness
- Yogesh hasn't pinged a "stop and re-paste" trigger

## Worktree state assertions for fresh session

After RESTART, verify these before any work:

- `git branch --show-current` matches the brief's named branch
- `git rev-list --left-right --count origin/main...HEAD` matches the brief's commit state (e.g. "0 0" = no commits, "0 N" = N commits ahead)
- `git status --short` shows expected staged/unstaged files only (alert on unexpected untracked files — often other agents' work in flight)
- `pnpm install` if `.next/` or `node_modules/` look stale (catches BE+1's pg-listen-style pre-push-blocker before push time)
- Background dev server: kill any stale `next dev` process before starting new one

## Day-23 verified workflow

```
# Open new terminal
$ cd /Users/yogeshmohite/AI_Tester_Project/Project10-QA_Nexus-frontend
$ claude

# In Claude Code, paste Yogesh's parked brief
# Verify state:
#   git branch --show-current             → feat/web-f22-defect-detail-bundle-port
#   git rev-list --left-right --count origin/main...HEAD → 0 0 (no commits yet)
#   git status --short                    → F22 files untracked, F23 files (BE+1) also untracked but NOT mine

# Then execute the brief steps, fresh.
```

## Day-24+ protocol

**Default = RESTART.** Each FE+1 work session on a new IST day opens a fresh Claude Code instance per worktree. The `<continue_from>` block in SessionStart should NOT be relied on across day boundaries.

If the brief explicitly says "resume from yesterday's session" — verify the session was clean at shutdown (no in-flight tool calls, no pending compaction). Otherwise restart even on explicit resume directives.

## Cross-references

- `feedback_claude_design_bundle_first_use.md` — Day-23 work that succeeded via fresh-session restart
- Day-21 + 22 session outage notes (filed in retros)
- Multi-day-22 outage triggered the consolidation of this pattern
