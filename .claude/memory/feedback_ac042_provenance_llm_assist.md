# feedback — AC042 corpus provenance: LLM-assisted labeling precedent (Day-28 2026-05-27)

> The AC042 binding eval that closed the M5 CORE gate ran against a golden corpus
> whose ground-truth labels were **LLM-generated (Codex) + human spot-checked
> (Yogesh)**, not pure-human-authored. First time a PM1 acceptance gate used
> LLM-assisted ground truth. Codifying the precedent + the governance follow-up.

## What happened

- AC042 (Sherlock RCA top-2 hit-rate ≥ 40% AND confidence calibration ≥ 0.8 on a
  50-defect golden corpus) is the M5 CORE close gate.
- Corpus composition: 5 hand-authored seed cases (`def-001`…`def-005`) + 45 cases
  mechanically ported from the CUMI/PIM post-mortem dataset
  (`scripts/port-cpi-corpus.mjs`, PR #204) with **Codex-generated** `groundTruth`
  labels (rootCauseCategory + acceptableAlternatives + confidence), promoted via
  `scripts/apply-cpi-labels.mjs` (PR #211).
- Yogesh spot-checked the labels, focusing on the 6 sub-0.70-confidence cases. The
  remaining labels were accepted as Codex-authored.
- Net: the Day-28 AC042 PASS (top-2 64.0% / cal 1.00) measures **LLM-Sherlock vs
  LLM-Codex agreement** with partial human validation — NOT agreement against
  pure-human ground truth.

## Why this is acceptable (ADR-022 §5.9 reserve precedent)

ADR-022 §5.9 established the "reserve allowance" pattern: an LLM-assisted artifact is
acceptable for a gate IF (a) a human spot-checks a risk-weighted sample (here: the
lowest-confidence labels) AND (b) the provenance is recorded so the gate's strength
is not overstated. AC042's corpus follows this exactly.

## The honest caveat

Top-2 64% against LLM-authored labels is weaker evidence than 64% against pure-human
labels — two LLMs can share blind spots (e.g., both over-attributing to env-config
because the stack traces mention env vars). The gate PASSED, but the measurement is
"two independent LLM judgements agree on top-2 64% of the time," not "Sherlock matches
human RCA 64% of the time."

## Governance follow-up (M6+)

1. **Every eval run carries an explicit provenance flag** —
   `groundTruthSource: "human" | "llm-assisted" | "llm-only"` per case — so a gate's
   evidentiary weight is legible at a glance.
2. **Re-label a stratified sample with pure-human ground truth** post-pilot; re-run
   AC042 against it for a human-anchored number.
3. **Track inter-labeler disagreement** — where Codex and human diverged in the
   spot-check, log it; clusters reveal corpus weak spots.

## Cross-references

- `apps/api/test/golden-sets/sherlock-rca/results-2026-05-27.json` — binding-eval
  evidence (force-added; normally gitignored).
- `scripts/port-cpi-corpus.mjs` (PR #204) + `scripts/apply-cpi-labels.mjs` (PR #211)
  — the corpus pipeline.
- ADR-022 §5.9 — reserve-allowance / spot-check precedent.
- ADR-019 — Sherlock multi-agent RCA design (the system under test).
- `feedback_eval_gate_smoke_first.md` — the smoke-before-binding-eval pattern used to
  debug the Day-28 FAIL.

---

_Entry Day-28 2026-05-27 (BE+1). Promote a one-line governance item to general.md once
the M6 corpus-governance review is scheduled._
