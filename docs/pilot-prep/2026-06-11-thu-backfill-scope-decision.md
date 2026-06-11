# Thu 2026-06-11 — Books-Backfill Scope Decision (Phases 2-5)

> **Author:** MAIN · **Status:** Phase 1 SHIPPED (PR #260). **Phases 2-3 STOPPED pending Yogesh acks** per the brief's binding rule "STOP and signal — never improvise tracking data." Phase 4 flagged. Phase 5 ready on confirm.

## Why Phases 2-3 stopped (not improvised)

I read `work-log-schema-v2.md` (the mandatory schema ref) before touching any xlsx. Three hard blockers surfaced:

### 1. Token In/Out was never captured — can't be backfilled from real data

The schema is explicit (lines 52-55, 128-138): **`tokens_used` (input + output) is NOT captured by the Stop hook** — the Claude Code stdin payload doesn't carry token-usage metadata. The raw jsonl source has **MAIN: 146 lines, FE: 0, BE: 0**. So:

- **MAIN** has real per-session data for Days 0-7 only.
- **FE + BE** have ZERO token data for the entire project (hooks never fired in those worktrees).
- Days 9 → Jun 11 token-in/out for any agent = **does not exist**. Backfilling it = inventing numbers, which the brief forbids ("never improvise tracking data" + "per-row data must be traceable").

**Distinction the brief conflated:** EOD reports DO carry the _product's_ free-tier LLM quota (Groq/Gemini RPD for Composer/Curator/Sherlock). They do NOT carry _Claude Code dev-session_ token-in/out for MAIN/FE/BE. Two different meters.

### 2. Schema v2 is still "AWAITING YOGESH ACK"

`work-log-schema-v2.md` line 3 + lines 205-210 — **6 open questions never answered**:

1. Approve `Tokens In/Out`, `Cost USD`, `In:Out Ratio` columns?
2. Approve `Backfill_Notes` sheet for explicit data-quality flags?
3. Approve `<unknown>` placeholder for past Tokens In/Out (Option α heuristic vs Option β conversation-file read)?
4. Approve Stop-hook extension (Option A) vs pre-push gate (Option B) for auto-refresh?
5. **Are FE+1 / BE+1 sessions local `claude` CLI or Cowork browser?** (determines whether their tracking is even recoverable)
6. Operator review on PR before merge, or autonomous-merge-on-green?

Backfill (Task 2) was explicitly gated: "does NOT begin until 1-4 confirmed."

### 3. The 16-sheet workbook has auto-rebuilt pivots

`Phase Comparison`, `Daily Rollup (hours)`, the 3 `Tokens —` sheets are **auto-rebuilt by the aggregator** (`scripts/update-work-log.py` / `aggregate-token-savings.py`), which dedupes by `(session_id, ended_at)` for idempotency. Hand-appending rows via the xlsx skill would desync the pivots + break aggregator idempotency. The canonical writers are the scripts, not manual edits.

## What IS cleanly backfillable (the honest scope)

From the EOD reports (traceable source), per-day rows for **hours / day-N / PRs-shipped / reality-checks / milestones / blockers / product-quota** are sound. EOD coverage confirmed for: Days 20-28 (M5) + pilot Days 1-2 + Sat Day-3-4 + Sun + Thu (today). Days 9-19 (M3/M4) EOD coverage needs a per-day inventory — some days are per-agent-only or absent.

**What's NOT backfillable without inventing:** Claude Code token-in/out for any agent/day beyond MAIN Days 0-7.

## Recommended path (Yogesh's call — answer at Fri 8 AM or post-launch)

1. **Answer the 6 schema acks** above (esp. #3 token-handling + #5 FE/BE session mode).
2. **Use the canonical scripts**, not hand-edits: run `scripts/update-work-log.py` to append hours/activity rows from EODs; leave token-in/out as `<unknown>` per the schema's own design (Backfill_Notes sheet makes it explicit, not fudged).
3. **MAIN Days 0-7 token data** is the only real token backfill; everything else is `<unknown>` by honest design.
4. Defer the full run to **post-launch** (Sat) — it's bookkeeping, not a Fri-launch blocker, and doing it right needs your acks.

## Phase 4 (chat archive) — flagged, not blindly executed

The MAIN session transcript lives at `~/.claude/projects/<proj>/<id>.jsonl`. **Hold:** raw transcripts may contain session payloads. Per Hard Rule 6 (no session tokens / cookies / secrets in tracked files), I will not copy a raw transcript into the archive without confirming it's scrubbed OR that the archive folder is gitignored + local-only. The `feedback_daily_chat_backup_rule.md` rule referenced in the brief isn't in `.claude/memory/` — please confirm its location/intent. FE/BE transcripts: not accessible from MAIN's worktree → Sat cleanup per the brief.

## Phase 5 (Sat verify task) — ready on confirm

Reframed: since the backfill is ack-gated, the Sat Jun 13 09:00 task should be **"complete the work-log + token backfill after Yogesh's schema acks + add Fri Day-1 pilot retro rows"**, not "verify rows landed." I'll create it once you confirm you want it scheduled (or you may prefer to drive the backfill interactively post-launch).

---

_Authored Thu 2026-06-11. This is the verify-before-act / never-fabricate discipline held all session, applied to the books. Phase 1 (launch-critical docs) shipped clean in PR #260; Phases 2-3 correctly paused rather than inventing 36 days × 3 agents of token data that was never captured._
