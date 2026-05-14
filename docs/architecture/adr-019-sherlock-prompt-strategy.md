# ADR-019: Sherlock A4 RCA prompt strategy + parallel multi-agent fan-out

- **Status:** Draft (Day-18 PM 2026-05-14 — to be ratified Day-19 AM before BE+1 starts MS4-T016)
- **Date:** 2026-05-14
- **Deciders:** Yogesh Mohite (Admin), BE+1 (implementer), MAIN (planner)
- **Related:** M4 v2 plan §4.5 (AC042 measurement protocol) · ADR-012 (KB RAG prompt strategy — sibling pattern) · ADR-015 (runtime LLM config bridge) · MS4-T001 (this ADR) · MS4-T016 (Sherlock Pattern B implementation) · MS4-AC042 (≥40% top-2 hit rate gate)
- **Numbering note:** M4 v2 plan task table previously labeled this work "ADR-015" — that ADR number was already taken by `adr-015-runtime-llm-config-bridge.md`. Renumbered to ADR-019 (next free; 013, 016, 017 also free but 019 chosen for cleanness vs reserved gaps). M4 v2 plan §3 + cross-references will be patched in the same PR as this ADR's ratification.
- **Supersedes:** none
- **Superseded by:** none

---

## Context

M4 ships **Sherlock** — the A4 Root Cause Analysis agent that takes a failed test-run-result (`run_result` row) + context, returns a ranked array of up to 5 RCA candidates, each with `category` + `detail` + `confidence`, and emits a `defect.sherlock_ready` WebSocket event when the `Promise.all` resolves.

Three coupled decisions need locking before MS4-T016 lands Day-19:

1. **Prompt structure** — system prompt, how the failure context is framed, how candidates must be emitted (JSON shape + ranking semantics + confidence calibration).
2. **Multi-agent fan-out** — how many parallel LLM calls per defect, what each agent specializes in, how candidate lists merge.
3. **Default sampling parameters** — temperature, max output tokens, retry chain triggers.

Constraints binding the choice:

- **Hard Rule 1 ($0/month)** — Groq + Gemini free tiers only. No OpenAI direct calls "to improve quality".
- **CLAUDE.md "Locked tech stack"** — primary `openai/gpt-oss-120b` via Groq (500 tok/s, 131K ctx, 1k RPD), L1-fast `openai/gpt-oss-20b` (14.4k RPD), fallback `gemini-2.5-flash`.
- **Stack lock §7 of M4 v2** — parallel via `Promise.all` (NOT LangGraph, NOT Hatchet, NOT Temporal).
- **AC042 = ≥40% top-2 hit rate** on 50-defect golden corpus (§4.5 of M4 v2 plan). Vanilla single-call top-1 is ~11% per Yogesh research note — multi-agent fan-out is what unlocks the ≥40% top-2 target.
- **Confidence calibration sub-gate** — for any candidate Sherlock returns with `confidence ≥ 0.8`, top-1 category MUST match ground-truth `rootCauseCategory`. Informational in M4, hard gate in M5 if pilot users report acting on wrong high-confidence RCAs.
- **F22 "needs human review" affordance** (M4 v2 §4.6) — when `topCandidate.confidence < 0.5`, amber banner fires + Jira create disabled. The prompt must therefore produce honest confidence scores, NOT inflated ones.
- **OpenTelemetry mandate** — every LLM call wrapped in a span emitting provider / model / prompt-bytes / response-bytes / latency-ms / outcome / candidate-count attributes. Spans aggregate up to a parent `sherlock.rca` span.

## Decision

### 1. Multi-agent fan-out structure

Four parallel agents, each calling the LLM once with a specialized system prompt. All four resolve via `Promise.all`; results merge into the final ranked candidate list.

| Agent         | Role                                                                                        | Model          | Why                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| `agent.code`  | Inspect stack trace + error message; propose code-bug / dependency-version / race-condition | `gpt-oss-120b` | 131K ctx fits long stack traces; primary quality                        |
| `agent.data`  | Inspect input fixtures / DB state if cited; propose data-bug / data-format-mismatch         | `gpt-oss-120b` | Same model; different system prompt forces specialization               |
| `agent.env`   | Inspect environment / config / auth context; propose env-config / auth-permissions          | `gpt-oss-20b`  | Cheaper; env-class causes are typically pattern-matched on log keywords |
| `agent.flake` | Inspect retry history + timing; propose flaky-network / race-condition / payment-gateway    | `gpt-oss-20b`  | Cheaper; flake detection is shallow reasoning                           |

**Merge algorithm (deterministic, no LLM call):**

1. Collect all 4 agents' candidate lists (each up to 3 candidates).
2. Group candidates by `category`.
3. For each `category`, take the highest individual `confidence` reported.
4. Apply ensemble boost: `+0.05` per duplicate agent that surfaced the same category (capped at `+0.15`). Rationale: cross-agent agreement is a calibration signal.
5. Sort by final confidence descending. Take top 5.
6. Cap final confidence at `0.95` (no agent ever reports certainty).

**Why 4 not 5:** the L1-L5 "5-layer RCA" canon in the original M4 plan was vendor-marketing-speak that doesn't map to clean Groq RPD budget. Four agents = 4 calls × 50 defects = 200 calls during AC042 eval. With `gpt-oss-120b` 1k RPD primary + `gpt-oss-20b` 14.4k RPD secondary, 200 calls comfortably fits a single eval run.

### 2. Per-agent system prompt skeleton

All four agents share this scaffold, with the `{{ROLE_SPECIFIC_INSTRUCTIONS}}` block swapped per role:

```text
You are Sherlock, the Root Cause Analysis agent for QA Nexus. Your job is to
analyze a failed test run-result and propose ranked root-cause candidates.

You are running as one of FOUR parallel specialist agents. Your role this call:
{{ROLE_SPECIFIC_INSTRUCTIONS}}

Rules:
1. Output ONLY valid JSON. No prose, no markdown fences, no preamble.
2. Schema:
   {
     "candidates": [
       {
         "category": "<one of: code-bug, data-bug, env-config, flaky-network,
                            auth-permissions, dependency-version, ui-regression,
                            race-condition, payment-gateway, other>",
         "detail": "<1-2 sentence specific cause with file:line citation if known>",
         "confidence": <float 0.0..1.0, MUST be honest>,
         "evidence": "<one-line citation from the input — what made you pick this>"
       }
     ]
   }
3. Return AT MOST 3 candidates. Fewer is better than padded.
4. Confidence calibration:
   - 0.9+ = "I would bet on this with the user's reputation"
   - 0.7-0.9 = "Strong hunch, would investigate this first"
   - 0.5-0.7 = "Plausible, mention but verify"
   - <0.5 = "Speculative, the human reviewer should not act on this alone"
   DO NOT inflate. Wrong-high-confidence is worse than right-low-confidence.
5. If your role does not apply (e.g. agent.env reading a pure code stack
   trace with no env signals), return an EMPTY candidates array.
   This is correct behavior, not a failure.
```

**Role-specific instructions per agent:**

- `agent.code`: "Focus on stack traces, error messages, and code-level signals (line numbers, function names, library mismatches). Categories you should consider FIRST: code-bug, dependency-version, race-condition."
- `agent.data`: "Focus on input data, fixture state, DB query patterns, and data-format mismatches. Categories you should consider FIRST: data-bug, payment-gateway (when amount/currency is involved)."
- `agent.env`: "Focus on environment variables, config differences, auth tokens, and permission errors. Categories you should consider FIRST: env-config, auth-permissions."
- `agent.flake`: "Focus on retry history, timing, network signals, and intermittent failure patterns. Categories you should consider FIRST: flaky-network, race-condition, payment-gateway (when 3DS or webhook timing is involved)."

### 3. User message shape (per agent, identical)

```text
FAILED RUN-RESULT CONTEXT
=========================
Test case: {{testCaseId}} — {{testCaseTitle}}
Run ID: {{runId}}
Step that failed: #{{stepNumber}} — {{stepLabel}}
Duration: {{durationMs}}ms
Environment: {{environment}}

ERROR MESSAGE
=============
{{errorMessage}}

STACK TRACE (if any)
====================
{{stackTraceOrNone}}

PRIOR HISTORY (last 5 runs of this test case)
=============================================
{{historyTableOrNone}}

ADDITIONAL CONTEXT (KB chunks or related defects, top 3)
========================================================
{{kbContextOrNone}}
```

### 4. Sampling parameters

- `temperature: 0.2` — low but not zero. Some diversity helps the merge step have non-collapsed candidates across agents.
- `max_tokens: 1024` — generous enough for 3 candidates with detail, tight enough to fail-fast on rambling outputs.
- `response_format: { type: "json_object" }` — Groq supports OpenAI-compat JSON mode for the `gpt-oss-*` models. Forces well-formed JSON; falls back to regex-extract on the rare malformed response (with a single retry).

### 5. Retry chain (per individual agent call)

```
primary call (gpt-oss-120b or gpt-oss-20b based on agent role)
   ↓ on 429/503/timeout >15s
secondary call (same model, single retry with 1s jitter)
   ↓ still failing
fallback (gemini-2.5-flash, same prompt + JSON parsing)
   ↓ still failing
agent returns { candidates: [] } + emits OTel span with outcome=fallback_exhausted
```

Aggregate-level rule: Sherlock service tolerates up to **2 of 4 agents** returning empty / errored. If 3+ agents fail, the whole RCA returns `{ candidates: [], topConfidence: 0, status: "degraded" }` — F22 then displays a separate "Sherlock degraded — manual investigation required" state (NOT the amber low-confidence banner; this is a different UX path).

### 6. OpenTelemetry shape

```
sherlock.rca (span)
├─ attributes: { defectId, runResultId, agentCount: 4, mergedCandidateCount, topConfidence, status }
├─ sherlock.agent.code (span)
│   └─ attributes: { provider, model, latency_ms, prompt_bytes, response_bytes, candidate_count, retry_count, outcome }
├─ sherlock.agent.data (span)
├─ sherlock.agent.env (span)
└─ sherlock.agent.flake (span)
```

Aggregation: parent `sherlock.rca` span ends only after all 4 children resolve (or 2-of-4-tolerance kicks in). Total latency for AC042 measurement is `sherlock.rca.duration_ms`.

## Consequences

**Positive:**

- AC042 ≥40% top-2 hit rate becomes achievable: cross-agent ensemble lift typically adds 15-30 pts over single-call top-1 (per the Yogesh research note citing 11% vanilla → 64% multi-agent in similar workflows).
- Honest confidence calibration (rule 4 of system prompt) means F22's `<0.5` banner trigger fires meaningfully — not on artificially deflated nor inflated scores.
- Parallel `Promise.all` keeps total latency near the slowest single call (~3-5s), not 4× sequential.
- Each agent's specialized system prompt is short — fits well within `gpt-oss-20b`'s context cleanly, avoiding the 131K ctx scaling problem.
- OpenTelemetry per-agent spans let us see WHICH agent is failing in production (e.g. `agent.flake` repeatedly returning empty for environment-only failures is a calibration miss).

**Negative:**

- 4 calls/defect quadruples Groq RPD consumption vs single-call. Mitigated by: 2 of 4 calls go to `gpt-oss-20b` (14.4k RPD), leaving primary 1k RPD untouched for KB RAG + A1 generation. Pilot of 8 users × 12hr/day × ~20 runs/user/day × 0.3 defect-rate = ~50 Sherlock invocations/day = 200 LLM calls/day. Well within budget.
- Merge algorithm is deterministic but heuristic. If two agents both confidently propose conflicting categories with similar evidence, merge picks higher confidence — which is fine 90% of the time but produces occasional non-intuitive rankings. Acceptable for M4; iterate post-pilot.
- Confidence calibration relies on the prompt being respected. We don't have a calibration-curve sweep yet (that's M5 work after pilot data accrues). Initial calibration sub-gate is informational, not enforcing.

**Followups generated:**

- (br/bs/bt) reserved — will file calibration-curve harness as M5 followup once pilot data exists
- M5: revisit ensemble-boost coefficient (currently `+0.05` per duplicate agent, capped `+0.15`) once we have 200+ real Sherlock runs to tune against

## Alternatives considered

1. **Single-call with chain-of-thought** — rejected. Top-1 accuracy was ~11% in Yogesh's research note. Won't clear AC042.
2. **LangGraph 5-layer L1-L5 sequential** — rejected. (a) LangGraph is on the M4 §7 ban list. (b) Sequential 5-call latency would blow the 15s p95 budget. (c) Each layer's prompt would need careful state-handoff design — overkill for 4-day window.
3. **Self-consistency sampling (single agent, N=5 samples, vote)** — rejected. Same model + same prompt + same temperature produces correlated samples; ensemble lift is small (~5-10 pts) vs cross-agent specialization (~15-30 pts).
4. **Hatchet / Temporal workflow orchestration** — rejected. On the M4 §7 ban list. `Promise.all` covers the fan-out need at zero infra cost.
5. **Tool-use / function-calling to query KB during reasoning** — rejected for M4. Adds 2-3 round-trip latency per agent. Punt to M5 if pilot data shows RCA quality is gated on KB lookup quality vs reasoning quality.
6. **Dynamic agent count (decide-then-fan-out)** — rejected. Adds a planner-LLM call that doesn't pay for itself at 50-defect-corpus scale. Reconsider in M6 if observed misfire patterns suggest some defect classes need 6 agents.

## Implementation checklist for MS4-T016

- [ ] `apps/api/src/sherlock/sherlock.service.ts` — orchestrator with `Promise.all`
- [ ] `apps/api/src/sherlock/agents/code-agent.ts` — `agent.code` implementation
- [ ] `apps/api/src/sherlock/agents/data-agent.ts` — `agent.data` implementation
- [ ] `apps/api/src/sherlock/agents/env-agent.ts` — `agent.env` implementation
- [ ] `apps/api/src/sherlock/agents/flake-agent.ts` — `agent.flake` implementation
- [ ] `apps/api/src/sherlock/merge.ts` — deterministic merge algorithm + ensemble boost
- [ ] `apps/api/src/sherlock/sherlock.controller.ts` — `POST /api/projects/:projectId/defects/:defectId/sherlock`
- [ ] `apps/api/src/sherlock/sherlock.gateway.ts` — emits `defect.sherlock_ready` + `defect.needs_review` WebSocket events
- [ ] `apps/api/test/sherlock/merge.test.ts` — unit test the merge algorithm
- [ ] `scripts/eval-sherlock.ts` — harness reading `apps/api/test/golden-sets/sherlock-rca/def-*.json` + writing results report
- [ ] OpenTelemetry spans wired per §6 of this ADR
- [ ] M4 close-gate sweep includes ≥3 Sherlock-specific assertions tagged `@M4-CLOSE-GATE`

## Cross-references

- M4 v2 plan §4.5 (AC042 measurement protocol) — this ADR's prompts must produce candidates that pass §4.5 scoring
- M4 v2 plan §4.6 (needs-human-review affordance) — `confidence < 0.5` is the trigger; this ADR's calibration rule 4 must produce honest scores
- M4 v2 plan §4.7 (WebSocket event taxonomy) — `defect.sherlock_ready` + `defect.needs_review` are emitted by the orchestrator built per this ADR
- CLAUDE.md "Locked tech stack" — Groq + Gemini-only LLM choice locks the model assignments
- `docs/architecture/adr-012-kb-rag-prompt-strategy.md` — sibling pattern; same JSON-only response + same retry-chain design
- `apps/api/test/golden-sets/sherlock-rca/` — corpus this ADR's outputs are scored against (see `README.md` in that folder)
