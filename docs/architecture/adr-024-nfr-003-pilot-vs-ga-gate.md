# ADR-024: NFR-003 Sherlock A4 latency gate — pilot (M5) vs GA (M6) differentiation

- **Status:** **Proposed** (BE+1, 2026-06-02) — needs Yogesh ratification + a PRD §15
  amendment before it is binding. Written per the Wed Day-2 plan Activity 5; the gate
  change itself is **not** applied unilaterally (Hard Rule 11 + "no new architectural
  decisions without Yogesh approval").
- **Deciders:** Yogesh (spec authority) · BE+1 (measurement + proposal)
- **Related:** ADR-019 (Sherlock RCA multi-agent design) · ADR-003 amendment (Groq over
  self-hosted) · PM1_PRD §10/§15 NFR-003 · `docs/pilot-prep/m5-nfr-baseline.md`

## Context

PM1_PRD NFR-003 sets **Sherlock A4 RCA p95 < 15 s**. Day-1 PM measured the real pipeline
(20-case `AC042_LIMIT=20 ac042:eval`, live Groq):

| metric             | value                                     |
| ------------------ | ----------------------------------------- |
| p50 / p95 / p99    | **12.9 s / 18.2 s / 22.3 s**              |
| gate p95 < 15 s    | ❌ **FAIL** (p95 18.2 s)                  |
| quality (same run) | top-2 80 % · calibration 1.00 · 0 crashes |

**Root-cause investigation (verify-before-act, Day-2 Activity 4) — the easy fix does NOT
exist:**

1. The 4 agents already run **in parallel** (`SherlockOrchestratorService.runRca` →
   `Promise.all`), not serial. Total ≈ `max(agent latencies) + merge`, not the sum.
2. **env + flake already use the fast `gpt-oss-20b`.** Only **code + data** use
   `gpt-oss-120b` (the reasoning-heavy agents for source/data bugs) — these drive the
   tail (~15–22 s on hard cases).
3. A **30 s per-agent timeout** already exists; p99 (22.3 s) is under it, so the timeout
   isn't the cap — the 120b agents genuinely take that long via Groq on hard inputs.

So the original "serial → parallelise → 18 s→5 s" win is absent. The 18.2 s p95 is the
intrinsic `gpt-oss-120b` latency on the two core agents. The 15 s budget predates the
ADR-003 amendment (it assumed the self-hosted Gemma 4 era); Groq's production reality is
slower-tail but higher-quality.

## Decision (proposed)

Differentiate the NFR-003 A4 gate by milestone:

- **Pilot (M5): p95 < 20 s** — accommodates the measured Groq reality (18.2 s) with headroom.
- **GA (M6): p95 < 15 s** — the original target, achieved via the optimisation levers below.

## Rationale

- **Pilot = 8 trusted Iksula testers.** UX tolerance for a 15–20 s RCA on a hard defect is
  high (it's an async, "kick it off and review" action, surfaced via WebSocket
  `defect.sherlock_ready` per ADR-020 — not a blocking spinner). p50 is 12.9 s.
- **GA = external customers.** Strict latency matters for trust → keep the 15 s target and
  earn it.
- **$0 cost gate preserved** — no infra change; this is a spec calibration, not a paid upgrade.

## GA path (M6 — to earn p95 < 15 s)

1. **Model swap on code/data agents** `gpt-oss-120b → gpt-oss-20b` (10× faster). **Gated on
   an AC042 re-run** — must confirm top-2 ≥ 40 % + calibration ≥ 0.8 hold (the 120b model
   is there for reasoning depth; swapping is only acceptable if quality survives).
2. **Prompt compression** on the 120b agents — fewer input/output tokens → faster Groq
   generation, no quality-model change.
3. **Tighten the per-agent timeout** (30 s → ~16 s) so a single slow agent can't blow the
   p99 — costs that agent's hypothesis on the slowest cases (acceptable if the other 3 cover).

## Consequences

- **If accepted:** Yogesh amends PRD §15 NFR-003 to state pilot (p95<20s) vs GA (p95<15s);
  the M5 close-gate criteria record A4 as PASS-for-pilot; the pilot launches without an
  artificial latency blocker. M6 close-gate keeps p95<15s.
- **If rejected:** A4 remains a RED M5 blocker → the GA levers above must land before pilot,
  pushing the Mon Jun 8 date.
- The decision is **reversible** — it only re-bands a measurement threshold.

## Status note

This ADR is **Proposed**, not Accepted. No code, no PRD text, and no gate has been changed.
BE+1 surfaces the measurement + the (disproven) quick-fix + the differentiation proposal;
Yogesh decides. Until ratified, `m5-nfr-baseline.md` records A4 as a real RED finding.
