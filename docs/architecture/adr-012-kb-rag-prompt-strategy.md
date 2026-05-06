# ADR-012: KB RAG prompt strategy + citation format

- **Status:** Accepted
- **Date:** 2026-05-06
- **Deciders:** Yogesh Mohite (Admin), BE chat
- **Related:** M2 TASK 3 (this PR) · ADR-003 (embedding model bge-small-en-v1.5) · MS0-T023 (LLMGateway provider abstraction) · `apps/api/src/kb/kb-search.service.ts` (Step 8 chunk-search) · `apps/api/src/llm/llm-gateway.service.ts` · CLAUDE.md "Locked tech stack" (Groq primary, Gemini fallback)
- **Supersedes:** none
- **Superseded by:** none

---

## Context

M2 TASK 3 ships `POST /api/projects/:projectId/kb/answer` — the RAG
question-answering pipeline that turns a user's natural-language
question + retrieved chunks into a cited answer. Three coupled
decisions need locking before the first FE call lands:

1. **Prompt structure** — system prompt + how chunks are framed in
   the user message + how citations are requested.
2. **Citation format** — what marker the model must emit in the
   answer + how the BE parses it back into `sourceChunkIds[]`.
3. **Default sampling parameters** — temperature, max output tokens,
   top-K chunk window.

If we don't lock these now, every RAG-touching PR will rewrite the
prompt (citation drift) + the parser (regex divergence) + the
sampling defaults (FE quality regressions invisible until pilot).

Constraints binding the choice:

- **Groq free tier output budget** — `openai/gpt-oss-120b` allows
  generous output tokens but each free-tier RPM cap is 1k/day. Want
  short, focused answers — no rambling.
- **Hard Rule 1 ($0/month)** — no calls to paid APIs to "improve
  quality". Whatever lands today MUST work on Groq + Gemini free.
- **Search rule from ADR-007 + KbSearchService** — workspace
  isolation already enforced at the search layer; the RAG layer
  inherits it. No need to re-check at the LLM call.
- **Audit policy from `.claude/rules/security.md`** — the question
  text + answer text MUST NOT appear in audit payloads (search
  queries can leak business intent; answers can leak source material).

## Decision

### 1. Prompt structure — system + user split

**System prompt** (constant; locked here):

```
You are QA Nexus, a knowledge-base assistant for Iksula's QA team.
Answer the user's question using ONLY the provided context chunks.
Rules:
1. If the context does not contain the answer, respond with exactly:
   "I don't have information on that in this knowledge base."
   Do NOT speculate, do NOT use outside knowledge.
2. When you use information from a chunk, cite it inline using the
   exact format: [chunk: <UUID>]
   Place the citation immediately after the sentence it supports.
   Multiple citations per sentence are allowed: [chunk: A][chunk: B].
3. Keep the answer concise — 2-4 sentences typical, 6 maximum.
4. Use a neutral, professional tone.
```

**User message** (templated; built per-call):

```
Question: <user's question>

Context (top {N} chunks, ranked by semantic similarity):

[chunk: <chunkId>]
Source: <document title>
<chunk text>

[chunk: <chunkId>]
Source: <document title>
<chunk text>

...
```

The `[chunk: <UUID>]` marker appears in the **input** as the chunk
header AND in the **output** as the citation — the model trivially
mirrors it because it's already in its context window. This avoids
the citation-drift failure mode where models hallucinate
`[chunk-1]`, `[1]`, `Source: doc.pdf p.3` and similar variants.

### 2. Citation parser

Extract cited chunk IDs from the answer text via:

```ts
const CITATION_REGEX =
  /\[chunk:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/gi;
const cited = new Set<string>();
let m: RegExpExecArray | null;
while ((m = CITATION_REGEX.exec(answer)) !== null)
  cited.add(m[1].toLowerCase());
```

UUID-anchored regex prevents false positives if the model emits
something like `[chunk: 1]` or `[chunk: abc]`. Cited IDs are then
intersected with the IDs we actually sent — any UUID in the answer
that wasn't in the input chunk window is filtered out (catches the
rare case of a model hallucinating a chunk ID).

### 3. Default sampling parameters

| Param           | Value                                                        | Why                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `temperature`   | `0.2`                                                        | Low creativity; we want deterministic, grounded answers. Higher temps produce more variation in word choice + occasionally drift into making things up.                                                      |
| `maxTokens`     | `800`                                                        | ~600 word answer cap. Plenty for the 2-6 sentence target; cuts off rambling. Free-tier output well within budget.                                                                                            |
| `topK` (chunks) | `5`                                                          | Empirical balance: top-5 typically covers the answer for short factual questions; going higher dilutes context with low-relevance chunks + spends tokens. Override per-request via `topK` body field (1-10). |
| Provider        | `LLMGateway` default routing (Groq primary, Gemini fallback) | The gateway already encapsulates the provider choice — we don't override here.                                                                                                                               |

### 4. Empty-context behavior

If `KbSearchService.search()` returns 0 chunks:

- **Skip the LLM call entirely.**
- Return `{ answer: "I don't have information on that in this knowledge base.", sourceChunkIds: [], confidenceScore: 0, noContext: true }`.
- Audit `kb_answer_generated` with `result_chunks: 0, llm_called: false`.

Saves a Groq RPD slot + gives the FE a deterministic short-circuit
path. The same string the model would produce per the system prompt
rule 1, but produced server-side without network.

### 5. Confidence score

Computed BE-side as the average similarity of the chunks the model
actually cited:

```
confidenceScore = avg(cited_chunks.similarity) || top_chunk.similarity
```

If the model cited no chunks but did produce an answer (rare —
violates system prompt), fall back to the top-1 similarity. The FE
displays this as a band: ≥0.75 high · 0.50-0.75 medium · <0.50 low
(F19 confidence chip color logic).

### 6. Audit payload (PII-redacted)

The `kb_answer_generated` audit row carries:

```json
{
  "project_id": "<UUID>",
  "question_length": 142,
  "question_token_count": 18,
  "result_chunks": 5,
  "cited_chunks": 3,
  "answer_length": 287,
  "no_context": false,
  "llm_called": true,
  "provider": "groq",
  "model": "openai/gpt-oss-120b",
  "tokens_in": 1247,
  "tokens_out": 142,
  "confidence_score": 0.81,
  "actor_email": "<email>"
}
```

**Never logged:** question text, answer text, chunk text, chunk IDs.
Pinned by a security test in `kb-answer.service.spec.ts`.

## Consequences

### Positive

- **Citation format is one-line-grep-able** in both directions
  (input header + output marker). Any future "hey the citations are
  wrong" bug → check the regex.
- **Empty-context short-circuits the LLM** — saves Groq RPD slots +
  gives the FE deterministic latency on cold-start "no chunks
  embedded yet" cases.
- **Hard ceiling on output tokens (800)** keeps free-tier budget
  predictable + prevents prompt-injection answer-bombing.
- **PII redaction in audit** matches the pattern from KbSearchService
  (PR #53) — question/answer text NEVER in audit, only counts.
- **Provider-agnostic** — uses `LLMGateway.complete()` so swapping
  Groq → Gemini → future provider doesn't touch the RAG service.
- **temperature 0.2** is conservative; later we can tune up if QA
  feedback says answers feel canned (M3 quality eval gate).

### Negative

- **Citation regex is UUID-anchored** — if the chunk ID format ever
  changes (e.g., to ULID), the regex needs an update. Tracked
  inline in the `kb-answer.service.ts` source.
- **Top-K=5 is a magic number** — no per-doc-type tuning. F19 may
  need a "wider context" toggle in M3 if some doc types benefit
  from K=10+.
- **System prompt is constant** — no per-tenant override yet.
  Multi-tenant PM3 may need a "house tone" variant per workspace.
  Tracked as a future followup.
- **Empty-context shortcut emits a hardcoded string** — if we ever
  i18n the FE, this string needs a translation key. Defer to PM2.
- **Confidence score is a heuristic, not a calibrated probability**
  — pipeline doesn't run calibration. M3 quality eval may replace
  with a learned reranker score.

### Mitigation plan

1. **Lock the system prompt in source code as a constant** — diffs
   make any change visible in PR review. Don't load from env or DB
   (would defeat the lock).
2. **Pin citation regex via a unit test** — one test sends a
   synthetic answer containing `[chunk: <known-UUID>]` and asserts
   parser extracts it. Catches accidental regex breakage.
3. **PR-review trigger:** any PR touching the system prompt OR the
   citation regex MUST cite this ADR + Yogesh approves.
4. **Followup `(af)`** filed for "RAG quality eval methodology" —
   M3 work to define a labeled question-answer test set + a
   regression-testable quality score. Out of scope for M2.

## Alternatives considered

### A. ChatML / messages array instead of system+user split

- **Pros:** Native to most provider APIs; allows multi-turn.
- **Cons:** `LLMGateway.complete()` takes a single prompt + optional
  `systemPrompt` — adopting messages would require gateway-level
  refactor (ADR-MS0-T023 deliberately kept the surface minimal).
  Multi-turn isn't a PM1 requirement — F19 is single-shot Q&A.
- **Verdict:** Rejected for M2 — the gateway shape stays simple.
  Revisit at M3 if multi-turn becomes a requirement.

### B. JSON-mode citation output

- **Pros:** Strict schema; no regex parsing.
- **Cons:** Groq's free tier `gpt-oss-120b` supports JSON mode but
  the output verbosity goes up (every answer wrapped in `{"answer":
"...", "citations": [...]}`); free-tier output token budget
  spent on schema framing. Also breaks streaming UX (FE can't show
  partial answer until full JSON arrives).
- **Verdict:** Rejected — inline `[chunk: UUID]` markers are cheaper
  - stream-friendly + still parser-deterministic.

### C. Self-hosted re-ranker (e.g., bge-reranker-base)

- **Pros:** Better quality than raw cosine similarity.
- **Cons:** Adds another model to load (+150 MB) on Render Free's
  512 MB ceiling — would push past the budget that bge-large
  already failed on (ADR-003 amendment). Hard Rule 1 binding.
- **Verdict:** Rejected for M2. M3 may revisit if Render Hobby tier
  is approved.

### D. Multi-step "ReAct" agent that decides to search again

- **Pros:** Higher answer quality on complex questions.
- **Cons:** Multiplies LLM calls per question (3-5x typical) — burns
  free-tier RPD. Adds latency (FE cold-start "thinking..." UX).
  Out of scope for M2 single-shot Q&A.
- **Verdict:** Rejected — single-shot is the M2 contract.

## Cross-references

- `apps/api/src/kb/kb-answer.service.ts` — implementation (this PR)
- `apps/api/src/kb/__tests__/kb-answer.service.spec.ts` — pinned tests
- `apps/api/src/kb/kb-search.service.ts` — upstream chunk retrieval
- `apps/api/src/llm/llm-gateway.service.ts` — `complete()` entry point
- `packages/shared/src/schemas/kb.ts` — `KbAnswerRequest` / `KbAnswerResponse` Zod
- ADR-003 — embedding model that produced the chunks
- `.claude/rules/security.md` — audit-redaction policy
- `docs/followups.md` `(af)` — M3 RAG quality eval methodology (filed in this PR)
