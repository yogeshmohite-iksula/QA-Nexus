# project — M5 CORE milestone CLOSED (2026-05-27, Day-28 Wed) — BE record

> M5 CORE closed on Day-28 Wed. Tag `m5-closed-2026-05-27`, ceremony commit `45ed5a8`.
> This is the BE+1 record of what closed the milestone; MAIN owns the cross-cutting
> close report (`docs(changelog): close m5 core milestone`).

## The gate that closed it: AC042

M5 CORE's binding close gate was **AC042** — Sherlock RCA must hit **top-2 ≥ 40%** AND
**confidence calibration ≥ 0.8** on the 50-defect golden corpus (ADR-019 + M4 plan
§4.5). Final binding run:

| Metric      | Result     | Gate  | Verdict |
| ----------- | ---------- | ----- | ------- |
| top-2 hit   | **64.0%**  | ≥ 40% | PASS    |
| calibration | **1.00**   | ≥ 0.8 | PASS    |
| crashes     | **0 / 50** | —     | clean   |

Trajectory: Day-27 **0%** (Zod schema-bridge FAIL) → Day-28 schema-only **54% / 0.57**
(overconfident) → Day-28 schema + Plan A2 **64% / 1.00**.

## BE PRs that shipped for M5 close (all merged)

- **#213** `fix(be)` — Sherlock schema bridge + Plan A2 calibration (the gate fix;
  merge `8de2b30`).
- **#201** `feat(api)` — AC042 eval harness (corpus-size-agnostic; canonical home of
  `ac042-eval.ts` + the `ac042:eval` script).
- **#211** `feat(be)` — Codex-labeled AC042 corpus (50 cases; ground truth via
  `port-cpi-corpus.mjs` + `apply-cpi-labels.mjs`).
- **#206** `chore(api)` — `.env.example` sync (21 missing var declarations;
  deploy-readiness).
- **#202** `docs(eod)` — Day-25 BE EOD.

## Carry into M6 (BE)

1. **`agent-eval` skill** — backend mirror of the frame-port skill: scaffold the harness
   (with a permanent `--limit`/`--debug` smoke mode) → smoke → binding eval →
   GREEN/AMBER/RED band on the gate thresholds.
2. **AC042 corpus governance** — explicit `groundTruthSource` provenance flag per case;
   re-label a stratified sample with pure-human ground truth post-pilot.
3. **Permanent smoke flag** in `ac042-eval.ts` (the Day-28 `AC042_LIMIT` was transient
   and not retained — #201's canonical harness has none).

## Cross-references

- `feedback_eval_gate_smoke_first.md` · `feedback_ac042_provenance_llm_assist.md` ·
  `feedback_skill_v2.2_first_use.md` (BE footnote).
- ADR-019 (Sherlock RCA) · ADR-022 §5.9 (LLM-assist reserve allowance).
- Release: https://github.com/yogeshmohite-iksula/QA-Nexus/releases/tag/m5-closed-2026-05-27
- `docs/eod-reports/2026-05-27-day-28-wed-be.md` — the Day-28 BE EOD.

---

_BE+1 milestone record, Day-28 2026-05-27. MAIN's `docs(changelog): close m5 core
milestone` (`45ed5a8`) is the authoritative cross-cutting close._
