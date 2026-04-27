---
description: Read .claude/token-savings.jsonl (created by token-savings hook, MS0-T035) and print last-7-days + cumulative summary + recommendation
---

PM1-custom command. Depends on `.claude/token-savings.jsonl` produced by the
`token-savings.sh` hook in the BE chat's P1.11 work (queued as MS0-T035 in
the M0 backlog after this command lands).

If the hook hasn't been built yet, this command reports gracefully:
"Token savings hook not yet wired (MS0-T035 pending) — re-run after BE chat lands P1.11."

## Process

1. **Check that `.claude/token-savings.jsonl` exists:**

   ```bash
   if [ ! -f .claude/token-savings.jsonl ]; then
     echo "Token savings hook not yet wired (MS0-T035 pending)."
     echo "Run /token-savings again after BE chat lands P1.11."
     exit 0
   fi
   ```

2. **Parse the JSONL.** Each line schema (per planned MS0-T035 hook contract):

   ```json
   {"ts":"YYYY-MM-DDTHH:MM:SSZ","session":"<session-id>","action":"memory-inject","tokens_saved":1234,"avg_per_call":56,"calls":N}
   ```

3. **Compute three windows:**
   - **Last 7 days:** entries where `ts` ≥ `now - 7d`. Group by date.
   - **Total this week:** sum of `tokens_saved` over last 7 days.
   - **Cumulative all-time:** sum across the entire file.

4. **Cost estimate** (Claude Sonnet 4.6 input pricing, conservative):
   - Input: $3 / 1M tokens
   - Cumulative dollar saved = `cumulative_tokens / 1_000_000 * 3`

5. **Active memory entries** — count files in `.claude/memory/` × line count
   per file. Surface as a hint of memory growth pressure.

6. **Recommendation logic:**
   - `healthy` — cumulative growth still increasing week-over-week (memory
     still gaining novel context).
   - `consider /reorganize-memory — cumulative growth plateauing` — if
     cumulative growth this week is < 10% of last week's growth (signal
     that memory has saturated; cleanup will compress without losing value).
   - `urgent — memory file > 200 lines` — if any single file in
     `.claude/memory/` exceeds 200 lines (skill spec hard limit).

7. **Print the formatted summary:**

   ```
   Last 7 days:
     2026-04-21: ~12,400 tokens saved (8 sessions)
     2026-04-22: ~11,800 tokens saved (6 sessions)
     2026-04-23: ~9,200 tokens saved (5 sessions)
     ...

   Total this week:    ~67,500 tokens saved
   Cumulative all-time: ~245,000 tokens saved (~$0.74)
   Avg per session:    ~1,650 tokens saved per session
   Active memory entries: 7 files, 612 lines (largest: general.md @ 95 lines)

   Recommendation: healthy
   ```

   (Numbers above are illustrative — real values come from the JSONL.)

## Hard Rules

- **NEVER write to `.claude/token-savings.jsonl`** from this command — that
  file is OWNED by the `token-savings.sh` hook (MS0-T035). Read-only.
- **NEVER pretend the hook ran when it hasn't** — if the file is missing,
  say so explicitly + reference MS0-T035.
- **NEVER infer dollar values for non-Sonnet 4.6 models** — pricing varies
  per model; we standardize on Sonnet 4.6 input cost as the conservative
  estimate. If multi-model pricing matters later, add a `model` field to
  the JSONL schema.
- **ALWAYS round token counts to 100s** in display (precision is meaningless;
  helps Yogesh skim).
- **NEVER suggest reorganization just because cumulative is growing** — only
  flag when growth rate is plateauing (memory saturated).

## Cross-references

- Hook that produces the JSONL: `.claude/hooks/post-tool-use/token-savings.sh`
  (queued as MS0-T035, BE chat owns it in P1.11).
- Memory system this measures the value of: `.claude/memory/` (P0.1).
- Pairs with `/reorganize-memory` (above) when recommendation suggests cleanup.
