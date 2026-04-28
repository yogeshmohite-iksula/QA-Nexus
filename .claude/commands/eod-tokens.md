---
description: Aggregate today's token savings across all 3 chats (MAIN + FE + BE) and update the Excel.
---

# /eod-tokens — daily token-savings rollup

Walks `.claude/token-savings.jsonl` in MAIN + FE + BE worktrees, builds the 3-sheet Excel at `docs/observability/Token_Savings_Log.xlsx`, and prints the day's totals as a markdown table.

## What this command does

1. **Run the aggregator:** `python3 scripts/aggregate-token-savings.py`
2. **Print today's daily rollup** as a markdown table (date · sessions · hours · tokens saved).
3. **Cross-link** to the Excel for downstream review.

## Output format

```
Date         Sessions  Hours  Tokens Saved
----------   --------  -----  ------------
2026-04-28   5         3.2    52,400
2026-04-27   3         2.1    28,750
GRAND TOTAL  8         5.3    81,150
```

## When to use

- End of every working day, BEFORE the EOD report commit. The token-savings number lands in the EOD report's "Token savings dashboard" section.
- After any session that involved a lot of tool calls (>50) — verify the per-session log captured correctly.
- Before sharing skill ROI numbers with Iksula leadership — Excel is the artifact you screenshot.

## When NOT to use

- Mid-session — the Stop hook hasn't fired yet, so the current session won't be in the log.
- For real-time tracking during deep work — wait for natural session ends.

## Privacy posture

This command never reads prompt content. It only counts:

- tool calls (from `.claude/audit.jsonl`)
- hook fires (memory-inject + context-preload)
- duration (timestamp deltas)
- branch + commit count

No model output, no prompt text, no PII. Safe to share the Excel externally.

## Cross-references

- `.claude/hooks/stop/log-token-savings.sh` — populates the JSONL on every Stop event
- `scripts/aggregate-token-savings.py` — the aggregator this command runs
- `docs/observability/token-tracking.md` — full methodology + estimation rules
- `docs/observability/Token_Savings_Log.xlsx` — the artifact this command updates
- `/token-savings` — older command that just prints last-7-days summary from the JSONL (lighter weight)

## Hard rules

- **NEVER edit the JSONL files manually.** They're append-only logs from Stop hooks.
- **NEVER commit `Token_Savings_Log.xlsx`** with prompt content extracted — that defeats the privacy posture. The Excel is regenerated from JSONL on every run.
- **NEVER manually inflate numbers** to look better — the estimation formula in `log-token-savings.sh` is conservative and tunable. If it underestimates, refine the formula and re-aggregate, never edit values directly.
