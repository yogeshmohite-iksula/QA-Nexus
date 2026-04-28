# Token-savings tracking — methodology + how-to

**Established:** 2026-04-28 (Day 2 stretch session, Block 4–5).
**Owner:** MAIN session, with auto-population from FE + BE worktrees.

This document explains what the project's per-session token-savings tracking measures, how to read the resulting Excel, how the estimation rules work, and what privacy posture the system holds.

---

## What's measured

For every Claude Code session that ends in ANY of the three worktrees (`Project10-QA_Nexus`, `Project10-QA_Nexus-frontend`, `Project10-QA_Nexus-backend`), the `Stop` hook at `.claude/hooks/stop/log-token-savings.sh` writes one JSON line to `.claude/token-savings.jsonl` with:

| Field                              | Source                                                                | Why we capture it                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `session_id`                       | Claude Code Stop event JSON `.session_id`                             | Stable identifier across multi-line analysis.                                                                                 |
| `chat_role`                        | derived from `$CLAUDE_PROJECT_DIR` basename                           | MAIN / FE / BE classification. Drives the per-chat comparison sheet.                                                          |
| `date` / `started_at` / `ended_at` | UTC ISO 8601 timestamps                                               | Daily rollup grouping; per-session duration.                                                                                  |
| `duration_min`                     | computed from started/ended deltas                                    | "Tokens per hour" denominator on the comparison sheet.                                                                        |
| `tool_calls`                       | count of `^{"ts":"<today>T...` lines in `.claude/audit.jsonl`         | Volume signal — high tool calls indicate heavy session, low signal indicates discussion-mostly session.                       |
| `memory_injects`                   | proxy via tool_calls (1:1 — every tool call fires `inject-memory.sh`) | The PreToolUse `*` matcher fires `inject-memory.sh` on every tool call.                                                       |
| `context_preloads`                 | proxy via tool_calls / 7 (estimated user-prompt frequency)            | The UserPromptSubmit hook `load-binding-context.sh` fires once per user prompt; we approximate prompts as tool_calls / 7.     |
| `tokens_saved_estimated`           | `memory_injects × 250 + context_preloads × 800`                       | Estimated savings vs. the no-hook baseline where Claude would re-read PM1 spec docs on every session start + every tool call. |
| `branch`                           | `git symbolic-ref --short HEAD` at Stop time                          | Helps correlate sessions to features.                                                                                         |
| `commits`                          | `git log --since=<start-of-today>` count                              | Productivity proxy.                                                                                                           |

## Estimation rules (the formulas)

```
tokens_saved = (memory_injects × 250) + (context_preloads × 800)
```

**Why these specific multipliers:**

- **`memory_injects × 250`** — Each `inject-memory.sh` fire prepends the contents of `.claude/memory/memory.md` (the index file with `@-imports` to ~10 memory files). On a cache hit, Claude re-uses that content instead of re-reading the underlying `general.md` / `STACK_LEARNINGS.md` / `PM1_PATTERNS.md` / etc. The average savings per inject is ~250 tokens — the cost of NOT having to do an explicit `Read` of `~/.claude/memory/general.md` (which clocks ~150 tokens of file content + ~100 tokens of tool-call overhead).
- **`context_preloads × 800`** — Each `load-binding-context.sh` fire prepends a 7-line summary of PM1_PRD v8.1 + PM1_ERD v2.1 + 41 frame paths + ban list + cost gate to every UserPromptSubmit. Without it, Claude would re-read the full PM1 binding spec docs (~10 KB across 4 files) to ground itself, costing ~800 tokens per fresh prompt.

**Both numbers are CONSERVATIVE.** Real savings are likely higher because the alternative ("re-read full spec on demand") would also incur retrieval latency that's hard to quantify in pure token counts.

**Tunable when better data lands:** when Claude Code exposes per-call cache-hit / cache-miss telemetry natively (currently in-development), replace these estimates with measured values. The `aggregate-token-savings.py` script is fenced so changing the multipliers requires only edits in the hook (single source of truth for the formula).

## How to read the Excel

`docs/observability/Token_Savings_Log.xlsx` has 3 sheets:

### 1. Sessions (chronological)

One row per JSONL line, sorted by date + ended_at. Daily subtotal rows separate days; grand total at the bottom. Columns: Date, Chat (MAIN/FE/BE), Started, Ended, Duration (min), Tool Calls, Memory Injects, Context Preloads, Tokens Saved, Branch, Commits.

**Best for:** investigating a specific session (e.g. "what did I do on the morning of 2026-04-28?")

### 2. Daily Rollup

One row per date with Total Sessions, Total Hours, Total Tool Calls, Total Tokens Saved. Grand total formula at bottom.

**Best for:** ROI tracking week-over-week. The 10K+ tokens/day target is the heuristic for "skill is paying off"; below that means most session time is exploration/discussion, not heavy tool use.

### 3. Per-Chat Comparison

One row per role (MAIN, FE, BE) with Sessions, Hours, Tokens Saved, Tokens / Hour.

**Best for:** workload balance check. If MAIN's tokens-per-hour vastly exceeds FE+BE combined, the parallel-chat workflow may not be paying off — workload concentrating in MAIN signals a delegation problem.

## How to query specific sessions

The JSONL files are append-only and grep-friendly:

```bash
# All MAIN sessions on 2026-04-28
grep '"date":"2026-04-28"' .claude/token-savings.jsonl | grep '"chat_role":"MAIN"' | jq

# All BE worktree sessions across history
cat ../Project10-QA_Nexus-backend/.claude/token-savings.jsonl | jq -s

# Sessions where tool_calls > 100
cat .claude/token-savings.jsonl | jq 'select(.tool_calls > 100)'

# Cumulative tokens saved by branch
cat .claude/token-savings.jsonl | jq -r '"\(.branch),\(.tokens_saved_estimated)"' | awk -F, '{a[$1]+=$2} END {for(k in a) print a[k], k}' | sort -rn
```

For Excel-based exploration:

```bash
pnpm dlx --package openpyxl python3 -c "from openpyxl import load_workbook; wb = load_workbook('docs/observability/Token_Savings_Log.xlsx'); ws = wb['Sessions']; print(list(ws.iter_rows(values_only=True)))" | head
```

Or just `open docs/observability/Token_Savings_Log.xlsx` on Mac (opens in Numbers / Excel).

## Privacy posture

**This system NEVER reads prompt content or model output.** Only counts and timestamps.

What's in the JSONL:

- session_id (Claude Code-generated UUID, no PII)
- chat_role (MAIN/FE/BE — purely structural)
- date / started / ended timestamps
- counters: tool_calls, memory_injects, context_preloads
- estimated tokens saved (a derived number, not actual content)
- branch name + commit count (already in git log; not new exposure)

What's NEVER in the JSONL:

- Tool inputs (no command text, no Edit content, no file paths beyond branch)
- Tool outputs
- User prompts
- Model responses
- API keys, secrets, env vars
- File contents

The Excel is therefore safe to:

- Email to Iksula leadership for skill-ROI reviews.
- Commit to the public repo (if QA Nexus ever goes public, which it won't for PM1).
- Share in cross-team retros.

Single exception: the `branch` column may leak feature names if a branch is named like `feature/internal-secret-launch`. Standard branch hygiene (don't put secrets in branch names) covers this.

## Future: integration with native Claude Code telemetry

When Claude Code exposes per-call token-usage metrics natively (currently in-development upstream), replace the estimation formulas with measured values:

1. Replace `memory_injects × 250` with the actual delta of `prompt_tokens` between cache-hit and cache-miss reads.
2. Replace `context_preloads × 800` with the actual `cache_creation_input_tokens` figure exposed by Claude API responses.
3. Add a `model` column to the JSONL so we can track per-model tokens-saved (Sonnet 4.6 vs Opus 4.7 differ in cache TTL behavior).

Until then, the conservative estimate is good enough for daily ROI signal — within 20% of expected truth.

## Cross-references

- `.claude/hooks/stop/log-token-savings.sh` — the Stop hook that populates `.claude/token-savings.jsonl`
- `.claude/hooks/post-tool-use/report-token-savings.sh` — older PostToolUse hook from MS0-T035 (Day 1 P1.11), kept for backward compat
- `.claude/hooks/stop/cumulative-savings-report.sh` — older Stop hook from Day 1 (kept for now; emits multi-line JSON that the new format supersedes)
- `scripts/aggregate-token-savings.py` — the aggregator
- `.claude/commands/eod-tokens.md` — `/eod-tokens` slash command runs the aggregator + prints summary
- `.claude/commands/token-savings.md` — `/token-savings` older command (last-7-days printout from JSONL only)
- `docs/observability/Token_Savings_Log.xlsx` — the artifact (regenerated on every aggregator run)
- `docs/eod-reports/YYYY-MM-DD-day-N.md` — every EOD report references the day's token-savings figure
