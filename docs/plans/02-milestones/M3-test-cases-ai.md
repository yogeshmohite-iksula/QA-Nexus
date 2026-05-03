# M3 — Test Cases + A1 Generation + A2 Dedup

> **Last updated:** 2026-05-02 (Day 6 — pre-kickoff snapshot)
> **Authority:** Summary view. Binding spec:
> `../../../QA Nexus/PM1/PM1_milestone/M3/Milestone_M3_Test_Cases_AI.md` (v1.0 with v8.1 banner).

---

## Goal

Ship the two flagship AI agents:

- **A1 Test Case Generator** — Groq `gpt-oss-120b` primary (500 tok/s, 131K ctx, 1k RPD
  free). Generates test cases from requirements + KB context. ≥80% A1 cases auto-approved
  at confidence ≥80%. Latency p95 <10s.
- **A2 Duplicate Detector** — pure embedding cosine similarity (NO LLM call). p50 <80ms.
  <5% false-positive rate, ≥60% true-positive rate.

Plus the test-case authoring surface: TipTap editor + bulk import + library views.

**Window:** 2026-06-15 → 2026-07-05 (3 weeks)
**Status:** NOT STARTED

---

## Frames in scope

| Frame | File                                               | Owner | Status      |
| ----- | -------------------------------------------------- | ----- | ----------- |
| F14m2 | F14m2 Link Test Case Modal                         | FE    | NOT STARTED |
| F14m3 | F14m3 Convert to Jira Story Modal                  | FE    | NOT STARTED |
| F16a  | F16a Method Chooser (manual / A1 / bulk import)    | FE    | NOT STARTED |
| F16b  | F16b A1 Generate (with confidence + accept/reject) | FE    | NOT STARTED |
| F16c  | F16c Bulk Import                                   | FE    | NOT STARTED |
| F17   | F17 Test Case Library                              | FE    | NOT STARTED |

---

## Tasks (high-level)

### BE

| Task     | Description                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------- |
| MS3-T001 | TB-007 `test_case` + TB-008 `test_step` tables (PM1_ERD v2.1 §5)                                   |
| MS3-T002 | A1 service: prompt assembly (req + KB context) → Groq call → parse → confidence-score → save       |
| MS3-T003 | A1 routing rules: `prompt_tokens > 100K → llama-4-scout` long-ctx; `429/503 → Gemini fallback`     |
| MS3-T004 | A1 inline-async pattern: client gets 202 + `runId`; WebSocket `agent_run.complete` event on finish |
| MS3-T005 | A2 service: embed candidate test case → cosine search against existing → return top-3 + score      |
| MS3-T006 | A2 dedup at write-time: when test case being saved, check A2 first; show modal if dup detected     |
| MS3-T007 | DeepEval golden-set runner on Colab Free (engineering-only, never blocks prod)                     |
| MS3-T008 | TB-019 `llm_provider` + TB-020 `llm_provider_model` + TB-021 `agent_model_assignment` tables       |
| MS3-T009 | TipTap-compatible test-case representation (rich-text steps, attachments via R2 presigned URLs)    |
| MS3-T010 | Bulk import endpoint (CSV/Excel parser → row-by-row save → batch A2 dedup pass)                    |

### FE

| Task     | Description                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------- |
| MS3-FE01 | F16a Method Chooser (3 entry paths)                                                               |
| MS3-FE02 | F16b A1 Generate (request form → loading state → confidence-scored results → accept/reject UI)    |
| MS3-FE03 | F16c Bulk Import (drag-drop CSV/Excel → preview → import → A2 dedup report)                       |
| MS3-FE04 | F17 Test Case Library (list + filter + bulk actions + dedup-flag indicator)                       |
| MS3-FE05 | F14m2 Link Test Case Modal (link existing TC to a requirement)                                    |
| MS3-FE06 | F14m3 Convert to Jira Story Modal (push selected TC back to Jira via OAuth — partial; full at M4) |
| MS3-FE07 | TipTap editor integration for test-case body                                                      |

---

## Acceptance criteria (locked v2.1)

| AC        | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| MS3-AC001 | A1 latency p95 <10s on 30-req golden set                                                        |
| MS3-AC002 | A1 ≥80% golden-set match (PM1 GA gate GA-2)                                                     |
| MS3-AC003 | A2 latency p50 <80ms, p95 <500ms                                                                |
| MS3-AC004 | A2 ≥60% true-positive rate, <5% false-positive rate (PM1 GA gate GA-3) on 102-pair set          |
| MS3-AC005 | F16b shows confidence per generated TC; ≥80% confidence auto-approves                           |
| MS3-AC006 | A1 routing: 131K-ctx prompt routes to gpt-oss-120b; >100K routes to llama-4-scout               |
| MS3-AC007 | Groq 429/503 → Gemini fallback works (or Groq gpt-oss-20b if Gemini RPD too low — see R1 below) |
| MS3-AC008 | Bulk import 100 rows → A2 dedup pass completes in <30s                                          |
| MS3-AC009 | Audit log captures every A1 generation + every A2 dedup decision                                |
| MS3-AC010 | DeepEval Colab notebook runs end-to-end against golden sets (`apps/api/test/golden-sets/`)      |

---

## Dependencies

**Needs from M2:**

- KB document table populated (A1 reads context)
- F14 Requirements wired (A1 reads requirements as input)
- 12 doc templates available (A1's "Generate from Test Plan" flow)
- Embedding service warm in dyno (A2 uses same model)
- Golden sets committed (✅ done Day 6, T032 commit `75630f3`):
  - 30 A1 requirements
  - 102 A2 dup pairs
  - 75 A4 root-cause-tagged (62 valid)

**Hands forward to M4:**

- A1 + A2 working end-to-end
- TB-019/020/021 LLM provider tables populated via F28m1 + F26m1 (M1)
- WebSocket gateway proven (already exists from T026, PR #11)
- Test case library populated for run-from-test-case flow

---

## Risks

| #   | Risk                                                                                                                                                 | Mitigation                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Gemini 2.5 Flash free RPD may have been cut from 1500 → 250/day** (Dec 2025 50-80% reduction across Google free models, per May 2026 web research) | M3 Day 1 task: verify against Google AI Studio dashboard. **If confirmed:** migrate fallback to Groq `gpt-oss-20b` (14.4k RPD) — more capacity than Gemini ever offered. Update F26m1 default fallback selection. |
| R2  | A1 latency budget (<10s p95) tight if Groq slows or 131K-ctx prompts dominate                                                                        | Cache common context blocks (KB chunks, doc templates); use `llama-4-scout` for >100K-token prompts (10M ctx, faster on long inputs)                                                                              |
| R3  | A2 false-positive rate >5% on Iksula-specific terminology (e.g., RET vs RET-)                                                                        | Tune threshold via golden-set sweep before M3 close; expose threshold in F26m1 as advanced setting                                                                                                                |
| R4  | DeepEval Colab Free runtime limits (12hr session, 80GB disk)                                                                                         | Golden sets are small (30+102+62=194 cases); single eval run <10 min                                                                                                                                              |
| R5  | A1 prompt-injection risk if KB ingests untrusted external docs                                                                                       | Pilot scope: only Iksula-owned docs; add prompt-injection eval in PM2                                                                                                                                             |
| R6  | Bulk-import row count >1000 may exceed Render Free dyno timeout (60s)                                                                                | Cap bulk import at 500 rows; show explicit error above; chunk into batches client-side                                                                                                                            |

---

## Notes / decisions log (will fill during M3)

_Empty until M3 Day 1 (2026-06-15)._

---

## Drift items

| #     | Item                                                                                                                                                           | Action                                                                                                                                                                                                                                                                                  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M3-D1 | M3 binding file cites `Qwen3-Embedding-0.6B (1024-dim)` for A2. Live state: bge-small (384-dim).                                                               | Banner at top of binding file overrides; no edit needed.                                                                                                                                                                                                                                |
| M3-D2 | **NEW (May 2026 web research):** `onnx-community/Qwen3-Embedding-0.6B-ONNX` + Transformers.js 3.6.0 ship Qwen3 support.                                        | **Plan recommendation:** at M3 close, A/B-test bge-small vs Qwen3-Embedding-0.6B-ONNX on Iksula data. Decision rule: if Qwen3 fits Render Free 512 MB budget AND A2 TPR improves ≥3 pts, migrate via env var `EMBEDDING_MODEL_ID` swap. Followup `(l)` (embedding eval) is the harness. |
| M3-D3 | A1 latency budget 30s in M3 binding file, but spec was revised to <10s in PM1_ERD v2.1 §10 (Groq's LPU is much faster than self-hosted Gemma assumed in v1.0). | Spec version banner overrides; live budget is <10s.                                                                                                                                                                                                                                     |
| M3-D4 | Gemini fallback assumption (1500 RPD) may be stale after Dec 2025 cut. **R1 above tracks this**.                                                               | M3 Day 1: verify Gemini dashboard. If ≤250 RPD, swap fallback to Groq `gpt-oss-20b`.                                                                                                                                                                                                    |

---

## Cross-references

- Binding milestone file: `../../../QA Nexus/PM1/PM1_milestone/M3/Milestone_M3_Test_Cases_AI.md`
- A1 sequence diagram: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3.5
- A2 spec: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §7
- Agent orchestration canon: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3.12
- LLM provider tables: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §5 (TB-019/020/021)
- Locked frames: `F14m2`, `F14m3`, `F16a`, `F16b`, `F16c`, `F17` in `../../../QA Nexus/PM1/PM1_UI_v2/`
- Golden sets: `apps/api/test/golden-sets/` (committed Day 6, `75630f3`)
- Followup `(l)` (embedding eval): `../../followups.md` (l)
- ADR-003 + amendment: `../../architecture/adr-003-embedding-model.md`
