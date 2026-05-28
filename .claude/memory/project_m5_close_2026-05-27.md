---
name: project-m5-close-2026-05-27
description: M5 CORE milestone closure record
metadata:
  type: project
---

# M5 CORE — Iksula QA Pilot Frame Closure — 2026-05-27

## Close ceremony

- Tag: `m5-closed-2026-05-27` cut at 16:15:42 IST
- Close commit: `45ed5a8` ("docs(changelog): close m5 core milestone 2026-05-27")
- Release: https://github.com/yogeshmohite-iksula/QA-Nexus/releases/tag/m5-closed-2026-05-27
- Total PRs merged: 28 in cascade (10 Phase A + 17 Phase B + 1 schema-fix #213)

## Binding deliverables shipped

- Frames: F19 Run Console · F22 Defect Detail · F23 Reports Studio · F25 Executive Dashboard
- F28 Settings & Audit (Tier-2 bonus, shipped same day, #214)
- ADRs: ADR-020 Jira sync · ADR-021 Reports backend · ADR-022 Frontend bundle workflow
- AC042 PASS: top-2 64% / calibration 1.00 / crashes 0/50 / corpus n=50

## Tier-2 carries to Day-29

- F26 Agents (bundle redesign pending Claude Design)
- F27 Users & Roles (decision pending)

## Key lessons captured for M5 retro

1. Orchestrator-absence cost: 3 calendar days lost (Fri+Sat+Mon) — mitigation pattern needed
2. AC042 schema-bridge fix: smoke-first eval pattern (1-defect smoke before 200-call binding eval)
3. Plan A2 calibration nudge: generalizable LLM overconfidence remedy
4. LLM-assisted labeling provenance: ADR-022 §5.9 reserve allowance precedent
5. Branch-name collision: worktree cross-pollination at harness layer (M6 hook candidate)
6. Cascade-conflict resolution: xlsx binary + memory union patterns (Risk-4, #207)
7. Verify-before-act: refused fabricated AC042 numbers (Day-27) + false "already closed" framing (Day-28) — both caught by origin re-poll before irreversible action

## BE perspective addendum

- **Gate that closed it (AC042):** Sherlock RCA top-2 ≥ 40% AND calibration ≥ 0.8 on the 50-defect golden corpus (ADR-019 + M4 plan §4.5). Final binding run: top-2 **64.0%** (PASS) · calibration **1.00** (PASS) · crashes **0/50** (clean).
- **Trajectory:** Day-27 **0%** (Zod schema-bridge FAIL) → Day-28 schema-only **54% / 0.57** (overconfident) → Day-28 schema + Plan A2 **64% / 1.00** (PASS).
- **5 BE PRs merged:** #201 (AC042 harness — canonical home of `ac042-eval.ts` + `ac042:eval` script) · #211 (Codex-labeled corpus, 50 cases via `port-cpi-corpus.mjs` + `apply-cpi-labels.mjs`) · #213 (schema bridge + Plan A2 calibration — the gate fix, merge `8de2b30`) · #206 (`.env.example` sync, 21 vars) · #202 (Day-25 BE EOD).
- **Schema fix:** `sherlock-code/schemas.ts` (shared across 4 agents) — evidence union + agent optional.
- **Prompt fix:** 4 agent system prompts per ADR-019 §2 calibration band amendment.
- **Cumulative Day-28 Groq:** ~424/1000 RPD (~58% headroom retained).
- **BE carry into M6:** (1) `agent-eval` skill (backend mirror of frame-port: scaffold harness w/ permanent `--limit`/`--debug` smoke → smoke → binding eval → GREEN/AMBER/RED band); (2) AC042 corpus governance (explicit `groundTruthSource` provenance flag per case; re-label stratified sample w/ pure-human ground truth post-pilot); (3) permanent smoke flag in `ac042-eval.ts` (Day-28 `AC042_LIMIT` was transient, not retained).

## Cross-references

- `docs/m5/m5-close-report.md` · `docs/m5/m5-token-usage-summary.md` · `docs/m5/m5-retro.md` (skeleton, Day-29)
- `.claude/memory/feedback_orchestrator_absence_blocks_all_agents.md` (dominant friction)
- `.claude/memory/feedback_eval_gate_smoke_first.md` · `.claude/memory/feedback_ac042_provenance_llm_assist.md` (BE Day-28 lessons)
- ADR-019 (Sherlock RCA) · ADR-022 §5.9 (LLM-assist reserve allowance)
- `docs/CHANGELOG.md` `[M5 CORE] - 2026-05-27`
- PRs: #213 (schema-fix) · #208 (ADR-022) · #214 (F28) · #218 (Day-28 MAIN EOD) · #219 (m5-followup) · #220 (Day-28 BE EOD) · #216 (FE skill retro) · #217 (F28 v1 delete)
- `docs/eod-reports/2026-05-27-day-28-wed-be.md` — Day-28 BE EOD

---

_Union record (Day-28 2026-05-27): MAIN cross-cutting close structure (#219) + BE+1 perspective addendum (#220). MAIN's `docs(changelog): close m5 core milestone` (`45ed5a8`) is the authoritative cross-cutting close._
