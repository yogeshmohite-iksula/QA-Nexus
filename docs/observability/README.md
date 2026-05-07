# Observability — convention notes

Single source of truth for the work-log + session-stream pair. Established 2026-04-30 (Day-4 EOD), redesigned to "Professional" layout 2026-05-06 (Day-11), correlation hook landed 2026-05-07 (Day-12).

## Files in this directory

| File                                        | Source                                    | Purpose                                                                                                                                            |
| ------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QA_Nexus_Work_Log.xlsx`                    | Authored manually + auto-extended         | Master work-log Excel — All Sessions, per-phase sheets, Daily Rollup, Token Sessions/Rollup/Comparison, Cover, Backfill_Notes, Consolidated Report |
| `sessions-stream.jsonl`                     | Auto-appended by Stop hook (per worktree) | Append-only stream of one JSONL line per session end. Source of truth for the "Parallel Work (FE+BE)" column                                       |
| `QA_Nexus_Work_Log.xlsx.archive-2026-05-06` | Pre-Professional snapshot                 | Kept 1 week as safety net post-Day-11 swap; can be deleted after 2026-05-13                                                                        |
| `work-log-schema-v2.md`                     | Manual                                    | Schema reference for the Professional xlsx layout                                                                                                  |
| `token-tracking.md`                         | Manual                                    | Token-savings tracking convention (paired with `.claude/token-savings.jsonl`)                                                                      |
| `token-tracking-diagnostic-2026-05-04.md`   | Day-8 audit                               | Diagnostic of pre-aggregator gap                                                                                                                   |
| `llm-gateway-validation-2026-04-30.md`      | Day-4 manual run                          | LLM gateway validation log                                                                                                                         |

## Parallel-work correlation flow (Day-12 TASK 3)

```
┌─────────────────────────────────────────────────────────────────┐
│  Per worktree (MAIN, FE, BE) on session end:                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ .claude/hooks/stop/log-session-summary.sh              │     │
│  │   reads .claude/audit.jsonl for current session_id     │     │
│  │   detects worktree from $PWD path segment              │     │
│  │   appends 1 line to sessions-stream.jsonl              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Periodically (manual today; cron-able post-M2):                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ python3 scripts/correlate-parallel-work.py             │     │
│  │     --date 2026-05-07                                  │     │
│  │   reads sessions-stream.jsonl for that date            │     │
│  │   for each MAIN row in All Sessions sheet:             │     │
│  │     find FE/BE entries with >50% time overlap          │     │
│  │     populate col J "Parallel Work (FE+BE)"             │     │
│  │   saves xlsx in place (preserves styling)              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### sessions-stream.jsonl format

One JSON object per line, append-only. Required keys:

```json
{
  "worktree": "MAIN", // MAIN | FE | BE
  "date": "2026-05-07",
  "start": "10:00", // HH:MM 24h
  "end": "16:39", // HH:MM 24h
  "summary": "1-line description of what got done",
  "prs": ["#67", "#68"]
}
```

Optional `"auto": true` flag when produced by the Stop hook (not manual).

### Correlation algorithm

For each MAIN row in `All Sessions` on the target date:

1. Parse `Timing` cell (col D) into `(start_min, end_min)`.
2. For each candidate FE/BE row from sessions-stream on the same date:
   - Compute `overlap = max(0, min(end1, end2) - max(start1, start2))`
   - Compute `ratio = overlap / min(duration_main, duration_candidate)`
   - Keep candidates where `ratio > 0.5`
3. Pick the **single best** match per worktree (max overlap minutes).
4. Build cell value: `"FE: <FE summary>; BE: <BE summary>"` (drop one if no match).
5. Per-worktree summary capped at 200 chars; total cell capped at 500 chars.
6. Idempotent — overwrites existing col J value with new combined summary.

### When to run

- **Manually**: `python3 scripts/correlate-parallel-work.py --date YYYY-MM-DD` at end of day after all 3 worktrees finish their sessions.
- **Day-12 stopgap**: MAIN session runs the script as part of EOD prep. FE+1 + BE+1 each ensure they have ≥1 sessions-stream line for the day before signing off.
- **Future (post-M2)**: cron the script to run at 23:00 IST nightly for that day's date. Skip if Daily Rollup sheet's date already has col J populated.

## How to add a new work-log row

```bash
python3 scripts/update-work-log.py \
  --date 2026-05-07 --day Thursday \
  --start "10:00 AM" --end "5:30 PM" --hours 7.5 \
  --files 12 --phase "Development" \
  --theme "Short tag for the row" \
  --what "Narrative paragraph going into the 'What I Did' column"
```

The script writes to BOTH the per-phase sheet AND the chronological "All Sessions" sheet (col J left blank — populated later by `correlate-parallel-work.py`). GRAND TOTAL `=SUM(...)` formulas auto-extend on insert.

## Cross-references

- `scripts/update-work-log.py` — append a session row
- `scripts/correlate-parallel-work.py` — populate col J (this Day-12 PR)
- `.claude/hooks/stop/log-session-summary.sh` — append to sessions-stream
- `.claude/hooks/post-tool-use/audit-log.sh` — fine-grained audit (different cadence)
- `docs/observability/work-log-schema-v2.md` — Professional layout schema
- Day-11 EOD `docs/eod-reports/2026-05-06-day-11.md` — addendum that requested this correlation
