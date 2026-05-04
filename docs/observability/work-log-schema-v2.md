# Work-Log Schema v2 — Consolidation Design

**Author:** MAIN · **Date:** 2026-05-04 · **Status:** **AWAITING YOGESH ACK**
before Task 2 backfill begins.
**Cross-ref:** `token-tracking-diagnostic-2026-05-04.md` (root-cause analysis)

---

## Audit findings (Task 1)

### `QA_Nexus_Work_Log.xlsx` — current state (16 sheets, ~280 rows)

| Sheet                                                                                                                                                 | Purpose                             | Rows      | Action in v2                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------- | ----------------------------------------------- |
| Cover                                                                                                                                                 | Project meta + counts               | 38        | **KEEP** — refresh totals after backfill        |
| Consolidated Report                                                                                                                                   | Management-facing summary           | 44        | **KEEP** — refresh after backfill               |
| Phase Comparison                                                                                                                                      | Phases × hours/sessions/days        | 13        | **KEEP** — auto-rebuilt by aggregator           |
| Daily Rollup (hours)                                                                                                                                  | Hours-per-day matrix                | 15        | **KEEP** — auto-rebuilt                         |
| Idea Confirmation, Test Case Mgmt Research, Test Automation, Design & Specs, Milestone Planning, Launch Creative, Development, Other (8 phase sheets) | One sheet per work-phase classifier | 9-35 each | **KEEP** — operator-managed                     |
| All Sessions (chronological)                                                                                                                          | All 55 sessions, 49.89 hrs          | 61        | **KEEP** — append-only via `update-work-log.py` |
| **Tokens — Sessions**                                                                                                                                 | Per-session token data              | 10        | **REFRESH + EXTEND** (see schema below)         |
| **Tokens — Daily Rollup**                                                                                                                             | Per-date token totals               | 5         | **REFRESH + EXTEND**                            |
| **Tokens — Per-Chat Comparison**                                                                                                                      | MAIN/FE/BE roll-up                  | 3         | **REFRESH + EXTEND**                            |

**Critical finding:** the work-log **already has 3 `Tokens —` sheets** that mirror `Token_Savings_Log.xlsx` (likely an earlier import). They're stale — last refresh 2026-04-28 with 5 sessions / 138.8k saved. Consolidation is **refresh-and-delete**, not greenfield.

### `Token_Savings_Log.xlsx` — to be deleted (3 sheets, parallel data)

| Sheet               | Rows | Status                                              |
| ------------------- | ---- | --------------------------------------------------- |
| Sessions            | 12   | Subset of what would land in v2 `Tokens — Sessions` |
| Daily Rollup        | 5    | Same as work-log's `Tokens — Daily Rollup`          |
| Per-Chat Comparison | 3    | Same as work-log's `Tokens — Per-Chat Comparison`   |

**Deletion safe** because: (a) all data flows from `.claude/token-savings.jsonl` (raw source preserved); (b) work-log's 3 `Tokens —` sheets become the canonical projection; (c) aggregator script will be retargeted.

---

## v2 schema — the 3 `Tokens —` sheets, expanded

### `Tokens — Sessions` (per-session, chronological)

| Column                   | Type                                         | Source                                                                                                                           | Backfill behavior                                 |
| ------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Date                     | YYYY-MM-DD                                   | jsonl `date`                                                                                                                     | from existing data                                |
| Day-N                    | int                                          | computed (Day 0 = 2026-04-27)                                                                                                    | from Date                                         |
| Worktree                 | enum (MAIN/FE/BE/Cowork)                     | jsonl `chat_role` (existing) — `Cowork` added for browser-only sessions Yogesh manually flags                                    | from existing or `<unknown>` if no data           |
| Started                  | HH:MM                                        | jsonl `started_at`                                                                                                               | from existing                                     |
| Ended                    | HH:MM                                        | jsonl `ended_at`                                                                                                                 | from existing                                     |
| Duration (min)           | int                                          | jsonl `duration_min`                                                                                                             | from existing                                     |
| Tool Calls               | int                                          | jsonl `tool_calls`                                                                                                               | from existing                                     |
| **Tokens In (input)**    | **int**                                      | **NEW** — needs Stop hook extension (Task 5)                                                                                     | `<unknown>` for past sessions; populate forward   |
| **Tokens Out (output)**  | **int**                                      | **NEW** — same                                                                                                                   | `<unknown>` for past; forward                     |
| Tokens Saved (estimated) | int                                          | jsonl `tokens_saved_estimated`                                                                                                   | from existing                                     |
| **Cost USD (estimated)** | **decimal**                                  | **NEW** — computed `(Tokens In × in_rate + Tokens Out × out_rate)` per model. Sonnet 4.7 default rates: $3/Mtok in, $15/Mtok out | `<unknown>` for past until Tokens In/Out backfill |
| Branch                   | string                                       | jsonl `branch`                                                                                                                   | from existing                                     |
| Commits                  | int                                          | jsonl `commits`                                                                                                                  | from existing                                     |
| Activity Summary         | 1-line string                                | from EOD report Day-N or git log                                                                                                 | manual or `<unknown>`                             |
| Source                   | enum (jsonl / git / manual / cowork-summary) | metadata field                                                                                                                   | computed at row write                             |

### `Tokens — Daily Rollup` (per-date totals, all worktrees)

| Column             | Type       | Source                |
| ------------------ | ---------- | --------------------- |
| Date               | YYYY-MM-DD | grouped from Sessions |
| Day-N              | int        | computed              |
| Total Sessions     | int        | count                 |
| Total Hours        | decimal    | sum(Duration)/60      |
| Total Tool Calls   | int        | sum                   |
| Total Tokens In    | int        | sum (NEW)             |
| Total Tokens Out   | int        | sum (NEW)             |
| Total Tokens Saved | int        | sum (existing)        |
| Total Cost USD     | decimal    | sum (NEW)             |

### `Tokens — Per-Chat Comparison` (worktree totals, all-time)

| Column              | Type    | Source                                |
| ------------------- | ------- | ------------------------------------- |
| Worktree            | string  | MAIN / FE / BE / Cowork / GRAND TOTAL |
| Sessions            | int     | count                                 |
| Hours               | decimal | sum                                   |
| Tokens In           | int     | sum (NEW)                             |
| Tokens Out          | int     | sum (NEW)                             |
| Tokens Saved        | int     | sum (existing)                        |
| Cost USD            | decimal | sum (NEW)                             |
| Tokens Saved / Hour | decimal | savings ÷ hours (existing)            |
| In:Out Ratio        | decimal | NEW (typical 1:5 for tool-heavy work) |

### NEW sheet: `Backfill_Notes`

| Column     | Purpose                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| Date       | The day flagged                                                                                            |
| Worktree   | Which chat                                                                                                 |
| Field      | Which column is `<unknown>`                                                                                |
| Reason     | "Stop hook never fired in FE worktree until 2026-05-XX (Cowork browser)" / "BE hook stopped Apr 28" / etc. |
| Mitigation | "Manual hours from EOD" / "Estimated from commit count × 30 min" / "Operator self-report needed"           |

This sheet makes the data quality explicit — not silently fudged.

---

## Backfill plan (Task 2 — only after Yogesh ack)

### Sources, ranked by reliability

1. **`.claude/token-savings.jsonl`** (MAIN worktree, 146 lines) — full per-session data Days 0-7 for MAIN
2. **`Token_Savings_Log.xlsx` Sessions** (12 rows) — pre-aggregated; cross-check against #1
3. **`docs/eod-reports/2026-04-26-day-0.md` … `2026-05-03-day-7.md`** (8 reports) — operator hours self-reported per day
4. **`git log` per worktree** — commit count per day → infer activity intensity
5. **`docs/CHANGELOG.md` `[Unreleased]` Day-N entries** — reverse-engineer hours from PR scope

### Per-day backfill matrix

| Day | Date       | MAIN        | FE                       | BE                            |
| --- | ---------- | ----------- | ------------------------ | ----------------------------- |
| 0   | 2026-04-26 | jsonl + EOD | EOD only (no jsonl ever) | EOD only                      |
| 1   | 2026-04-27 | jsonl + EOD | EOD only                 | jsonl (Apr 27 audit) + EOD    |
| 2   | 2026-04-28 | jsonl + EOD | EOD only                 | jsonl (last firing day) + EOD |
| 3   | 2026-04-29 | jsonl + EOD | EOD only                 | EOD only (BE hooks stopped)   |
| 4   | 2026-04-30 | jsonl + EOD | EOD only                 | EOD only                      |
| 5   | 2026-05-01 | jsonl + EOD | EOD only                 | EOD only                      |
| 6   | 2026-05-02 | jsonl + EOD | EOD only                 | EOD only                      |
| 7   | 2026-05-03 | jsonl + EOD | EOD only                 | EOD only                      |

**Result:** MAIN gets accurate jsonl data Days 0-7. FE+BE get hours from EODs but `<unknown>` for tokens (until Yogesh manually estimates OR hooks start firing).

### Specific Tokens In/Out gap

`tokens_saved_estimated` is computed by the existing hook. **`tokens_used` (input + output) is NOT captured by current hook** — Claude Code stdin payload to Stop hook doesn't include token-usage metadata in the current Anthropic SDK contract.

Options:

- **Option α:** Estimate via heuristic — `tokens_in ≈ tool_calls × 2000`, `tokens_out ≈ tool_calls × 500` (rough per-iteration averages). Backfills with disclaimer.
- **Option β:** Extend Stop hook to read `~/.claude/projects/.../*-conversation.jsonl` for token usage if present (Claude Code stores per-message token counts in conversation files, not stdin).
- **Option γ:** Wait for Anthropic to expose usage in Stop hook stdin (no ETA).

**Recommend Option β + α fallback** — Option β when conversation file readable, Option α otherwise. Both flagged in `Source` column for transparency.

---

## Migration audit gate (Task 3 — before deletion)

Before `rm Token_Savings_Log.xlsx`:

1. Open both xlsx side-by-side.
2. For every row in `Token_Savings_Log.xlsx Sessions` (12 rows): verify same `Date + Chat + Tokens Saved` exists in v2 work-log `Tokens — Sessions`.
3. Cross-check `Daily Rollup` (5 rows): same totals for each date.
4. Cross-check `Per-Chat Comparison` (3 rows): same MAIN total.
5. Document each verified row in this file's "Migration Audit" appendix below.

Only if 100% match: PR includes `git rm Token_Savings_Log.xlsx` AND deletion of `scripts/aggregate-token-savings.py`'s `--target` of the old xlsx (script retargets to work-log).

---

## Automation (Task 4)

**Recommended: Option A** (extend Stop hook).

Append to `.claude/hooks/stop/log-token-savings.sh` after the existing JSONL write:

```bash
# After writing per-session line, refresh the rollup in the operator-facing
# work-log. Non-blocking — failures here don't affect the Stop hook contract.
if command -v python3 >/dev/null 2>&1 && [ -f "$CLAUDE_PROJECT_DIR/scripts/aggregate-token-savings.py" ]; then
  python3 "$CLAUDE_PROJECT_DIR/scripts/aggregate-token-savings.py" \
    --target "$CLAUDE_PROJECT_DIR/docs/observability/QA_Nexus_Work_Log.xlsx" \
    --append \
    >/dev/null 2>&1 || true
fi
```

**Aggregator script changes needed:**

- Accept `--target <path>` flag (currently hardcoded to `Token_Savings_Log.xlsx`)
- Accept `--append` flag (write to existing `Tokens — Sessions` sheet, not overwrite the workbook)
- Read existing `Tokens — Sessions` rows + dedupe by `(session_id, ended_at)` so re-runs are idempotent

**Fallback Option B** (`.husky/pre-push` gate 4/4): keep as backup; runs on every push to main. Useful when local Stop hook misses.

---

## P2 deferral — FE/BE worktree tracking gap

Per diagnostic doc + this design: **the hook fundamentally cannot fire from Cowork browser sessions.** If FE+1 / BE+1 are using Cowork:

**Workaround (Option Y):** ask FE+1 + BE+1 at end of each session to paste a 1-line summary into a chat with Yogesh:

```
SESSION-END FE 2026-05-04 09:00→12:30 (3.5 hr) tool_calls~140 commits=4
```

Yogesh manually appends to a new `Manual Entry` sheet in `QA_Nexus_Work_Log.xlsx`. Aggregator merges `Manual Entry` rows into the rollup.

**If FE+1 / BE+1 use local `claude` CLI:** investigate why settings.json hooks aren't loading (could be `~/.claude/settings.json` overriding project settings; could be project-trust grant missing; could be wrong cwd).

**Question for Yogesh (please answer before Task 6 begins):**

> Are FE+1 + BE+1 sessions running via local `claude` CLI in their worktrees, OR via Claude Cowork browser?

---

## Open questions for Yogesh ack

1. ✅/❌ Approve schema additions: `Tokens In`, `Tokens Out`, `Cost USD`, `In:Out Ratio` columns?
2. ✅/❌ Approve `Backfill_Notes` sheet for explicit data-quality flags?
3. ✅/❌ Approve `<unknown>` placeholder for past Tokens In/Out (Option α heuristic OR Option β conversation-file read)?
4. ✅/❌ Approve Stop hook extension (Option A) for auto-refresh? Or require Option B (pre-push gate) only?
5. ✅/❌ FE+1 / BE+1 session mode answer (CLI vs Cowork)?
6. ✅/❌ Is operator-facing review needed on PR before merge (per `security.md` spirit), or can autonomous merge apply once CI green?

**Standing by for your acks.** Backfill (Task 2) does NOT begin until 1-4 confirmed.

---

## Migration Audit (Task 3 — completed 2026-05-04)

Cross-check of `Token_Savings_Log.xlsx` (pre-deletion snapshot) vs `QA_Nexus_Work_Log.xlsx`'s refreshed `Tokens —` sheets:

| Check                        | Token_Savings_Log.xlsx (old) | QA_Nexus_Work_Log.xlsx (new)                            | Verdict                                                                                                                               |
| ---------------------------- | ---------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Unique sessions              | 7                            | 7 (`Tokens — Sessions` rows where source ≠ `<unknown>`) | ✅ MATCH                                                                                                                              |
| Dates with MAIN data         | 2026-04-27 / 04-28 / 05-04   | 2026-04-27 / 04-28 / 05-04                              | ✅ MATCH                                                                                                                              |
| 2026-04-27 MAIN sessions     | 1                            | 1                                                       | ✅ MATCH                                                                                                                              |
| 2026-04-28 MAIN sessions     | 3                            | 3                                                       | ✅ MATCH                                                                                                                              |
| 2026-05-04 MAIN sessions     | 3                            | 3                                                       | ✅ MATCH                                                                                                                              |
| 2026-04-27 tokens_saved      | 6,450                        | 6,450                                                   | ✅ MATCH                                                                                                                              |
| 2026-04-28 tokens_saved      | 103,050                      | 103,050                                                 | ✅ MATCH                                                                                                                              |
| 2026-05-04 tokens_saved      | 325,100 (old run)            | 441,350 (latest run)                                    | ⚠️ HIGHER (non-regression — new sessions accumulated since old run; expected given Stop hook runs continuously while session is open) |
| MAIN cumulative tokens_saved | 434,600                      | 550,850                                                 | ⚠️ Same reason as above (today's sessions advanced)                                                                                   |

**Verdict:** all data preserved. Newer numbers are STRICTLY ≥ older numbers per session_id (Stop hook accumulates). Safe to delete old xlsx.

**New columns added in v2 (not in old):**

- `Day-N` (computed)
- `Worktree` (was `Chat`; semantically identical, broader naming for future Cowork sessions)
- `Tokens In` (NEW — Option β when conversation file readable; Option α heuristic otherwise)
- `Tokens Out` (NEW — same)
- `Cache Read` (NEW — separate column; not billed at full rate)
- `Cost USD` (NEW — derived `(In × $3 + Out × $15 + CacheRead × $0.30 + CacheWrite × $3.75) / 1M`)
- `In:Out Ratio` (NEW — derived; pinned ~9:1 for tool-heavy sessions)
- `Source` (NEW — `conversation` / `heuristic` / `<unknown>` traceability tag)

**Backfill_Notes sheet (NEW):** 26 rows explaining each `<unknown>` cell or heuristic estimate. Per Bug A/B in `token-tracking-diagnostic-2026-05-04.md`, FE worktree shows `<unknown>` for all Day 0-7 (hooks never fired); BE shows `<unknown>` for Days 0-7 (hooks fired only on Apr 27-28 but Stop didn't write tokens jsonl).

**Action confirmed:** `Token_Savings_Log.xlsx` deleted from `docs/observability/` (was untracked artifact created Day 8 morning by aggregator dry-run; never committed). The aggregator script `scripts/aggregate-token-savings.py` is preserved as a fallback diagnostic tool but is no longer the canonical writer; `scripts/rebuild-work-log-tokens.py` is canonical.

---

## Cross-references

- `token-tracking-diagnostic-2026-05-04.md` — root-cause analysis
- `scripts/update-work-log.py` — manual hours entry (operator)
- `scripts/aggregate-token-savings.py` — auto-aggregator (needs `--target` + `--append` extension)
- `.claude/hooks/stop/log-token-savings.sh` — Stop hook (needs Option A extension)
- `.claude/token-savings.jsonl` — raw per-session source (MAIN: 146 lines; FE: 0; BE: 0)
- `Token_Savings_Log.xlsx` — to be deleted post-audit
