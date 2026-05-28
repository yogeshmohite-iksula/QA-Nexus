# feedback — eval gates: run a 1-defect smoke BEFORE the binding eval (Day-28 2026-05-27)

> Day-28's AC042 binding eval FAILED on the first run with top-2 **0.0%** — not
> because Sherlock was wrong, but because all 4 agents returned `[]` (zero
> hypotheses) on a Zod schema-bridge mismatch. The fix was localized in **4 Groq
> calls** via a 1-defect smoke instead of burning the full 50-defect / ~200-call /
> ~60-min binding run. Codifying the pattern.

## The pattern

For any LLM eval gate over a corpus of N cases:

1. **Smoke first** — run the harness against **1 case** with raw-output +
   validation-error dumping ON. Cost: ~one round-trip per agent (4 calls for
   Sherlock's 4 agents), ~30 s.
2. **Read the raw model output + the validation result.** Schema / prompt / parse
   bridge issues show up here immediately.
3. **Only then run the binding eval** over all N cases (~200 calls / ~60 min for
   N = 50 × 4 agents).

A binding eval that returns a degraded aggregate (0% / NaN calibration) tells you
_something_ is broken but not _what_. The smoke tells you _what_ in 1/50th the time
and Groq budget.

## The specific Day-28 signal

**A schema-bridge failure presents as a zero-hypothesis DEGRADED state, not a
calibration miss.** When top-2 is 0.0% AND calibration is n/a (no predictions to
score), suspect the parse / validation layer (agents returning `[]`), NOT the model's
reasoning. Day-28 root cause:

- `openai/gpt-oss-120b` emitted `evidence` as a single string; the Zod schema required
  `z.array(z.string())` → `safeParse` failed → agents returned `[]` per the
  never-throws contract (ADR-019 §6).
- The model also omitted the `agent` field (each service re-tags in the caller) →
  another `safeParse` failure.

Both were invisible at the aggregate level — only the 1-defect raw dump showed
`evidence: "…"` (string) + the Zod `.format()` error.

## Implementation note (what's actually on main)

The Day-28 smoke ran via **transient env flags** in `apps/api/test/ac042-eval.ts`
(`AC042_LIMIT=1` to cap the corpus + `AC042_DIAG=1` to dump raw `asJson` + Zod errors).
**These flags are NOT on `main`** — the #213 rebase took #201's canonical harness
(which has no limit flag), so the convenience was diagnostic-only and was not retained.

**Future-improvement (M6 candidate):** bake a permanent `--limit <n>` / `--sample` /
`--debug` flag into every eval harness so the smoke-first workflow is a first-class,
repeatable capability rather than a throwaway local edit.

## Generalizes to

Any future eval gate — Composer output quality, Curator dedup precision, future agent
additions. Smoke 1 case, read raw output, then commit the Groq budget to the full run.

## Cross-references

- ADR-019 §6 — Sherlock never-throws contract (agents return `[]` on any failure; this
  is what masks bridge errors at the aggregate level).
- `apps/api/test/ac042-eval.ts` — the harness (full-corpus on main; smoke flags were
  transient).
- `feedback_ac042_provenance_llm_assist.md` — corpus provenance for the same gate.
- `docs/CHANGELOG.md` Day-28 "Fixed" entry — the schema bridge + Plan A2 calibration fix.

---

_Entry Day-28 2026-05-27 (BE+1)._
