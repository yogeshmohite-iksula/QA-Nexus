# BINDING RULE — When metadata feels off, audit the artifact

**Type:** feedback · **Filed:** Thu night 2026-06-11 · **First observed:** Thu 2026-06-11 — Yogesh's Excel-staleness question → cascade that exposed 3 P0 launch-blockers

## Rule

When the user questions **metadata** — a stale tracking file, a log gap, an odd filename, a date that doesn't line up, a count that feels wrong — the instinct usually traces to a **deeper artifact-integrity concern**, not the metadata itself. Treat the metadata question as a **trigger for a focused audit pass**, not a bookkeeping chore to dispatch. **Do NOT dismiss it as "just bookkeeping."**

## Why this exists

Thu Jun 11. Yogesh noticed the work-log Excel + token-tracking + chat-history archive had been **stale since Day 8 (May 5)** — a metadata observation about bookkeeping files. The naïve response would have been "I'll just backfill the 36 missing rows and move on."

Instead the metadata question detonated a chain:

1. **MAIN principled stop** — reading `work-log-schema-v2.md` to do the backfill revealed the token-in/out data was _never captured_ (hook limitation) + the schema was still "AWAITING YOGESH ACK." MAIN STOPPED rather than improvise 36 days × 3 agents of invented numbers (`docs/pilot-prep/2026-06-11-thu-backfill-scope-decision.md`).
2. **That stop surfaced the real question** — "why are our books stale, and what _else_ have we not been tracking honestly?" — which is an artifact-integrity question, not a bookkeeping one.
3. **BE+1 full conformance audit (Day-32)** triggered (PR #261).
4. **FE+1 per-role + click-sweep audit** triggered.
5. **Result: 3 P0 launch-blockers exposed** — signed-out users seeing Admin, inert invite UI, `/home/lead-admin` nav trap — caught **before** 8 pilot users hit them. **Fri Jun 12 launch HELD** (→ Mon Jun 15 min, pending Fri triage).

The metadata question ("why is the spreadsheet old?") was the visible tip of "our app has untested role/auth surfaces." A stale tracking file and an untested auth boundary share a root cause: **work happened faster than verification, and the gaps don't announce themselves — they show up as drifted metadata first.**

## How to apply

1. **When the user flags metadata** (logs, tracking files, naming, dates, counts, "this feels stale"): pause before "just fixing" it.
2. **Ask: what artifact does this metadata describe, and is THAT artifact sound?** Stale work-log → is the _work_ tracked + verified? Odd filename → is the _thing it names_ canonical? Missing log line → did the _operation it records_ actually run correctly?
3. **Run a focused audit pass** on the underlying artifact, not just the metadata surface.
4. **If improvising the metadata fix would require inventing data** → STOP + signal (this is also the `never improvise tracking data` discipline). The need-to-invent is itself a signal that the artifact has an integrity gap.
5. **Surface the deeper concern to the user**, don't silently patch the surface.

## Numbering note (Rule 11 — surface, don't decide)

The Thu brief named this "the 17th safety pattern"; the repo's `memory.md` feedback list currently sequences to ~14 (P0-001 closure cascade was the most recent). The discrepancy is real and **not silently reconciled here** — the canonical renumber belongs in the NEW MANDATE Phase B3 ("compile every safety pattern triggered"), where the full 1-N sequence gets rebuilt from source. This file is named by content (`feedback_metadata_audit_reveals_artifact_issues.md`) per the brief; the exact ordinal is flagged for reconciliation, not asserted.

## Cross-references

- `docs/pilot-prep/2026-06-11-thu-backfill-scope-decision.md` — the principled STOP that started the cascade
- `feedback_chained_base_cascade_resolution.md` + `feedback_p0_001_closure_cascade.md` — sibling Thu patterns
- the `never improvise tracking data` discipline (this session, repeated) — a metadata fix that requires invention is a red flag, not a chore
- BE+1 Day-32 conformance audit (PR #261) + FE+1 per-role/click-sweep audit — the artifact audits this metadata question triggered
- NEW MANDATE Phase B3 — where the safety-pattern ledger gets canonically renumbered

_Authored Thu night 2026-06-11. The metadata question that looked like "the spreadsheet is old" was actually "the app has untested surfaces" — and catching that before 8 users did is the whole point._
