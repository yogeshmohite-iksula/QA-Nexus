# ADR-003 — Embedding model selection (PM1)

**Status:** Accepted (BE chat, Day-2 stretch session, 2026-04-28)
**Spec touched:** MS0-T024 (embedding service); PM1_ERD §6 (semantic search); CLAUDE.md "Locked tech stack" → Embeddings line.
**Related ADR:** ADR-002 (Prisma raw-SQL split — covers the `vector(1024)` HNSW indexes that this ADR's vectors flow into).

## Context

CLAUDE.md "Locked tech stack (PM1)" pins:

> **Embeddings:** Qwen3-Embedding-0.6B in-process via `@xenova/transformers` (1024-dim, ~50ms/embed)

When implementing T024 we discovered:

1. **`@xenova/transformers` requires ONNX model assets.** It ships its own ONNX runtime (WASM build) so the entire model must be available in ONNX format. Hosted as `Xenova/<model-id>` on Hugging Face Hub.
2. **`Xenova/Qwen3-Embedding-0.6B` does NOT exist** as of 2026-04-28. The official `Qwen/Qwen3-Embedding-0.6B` repo ships PyTorch + safetensors, but no ONNX export. transformers.js cannot load it.
3. **Self-converting Qwen3 → ONNX is non-trivial.** Requires `optimum-cli`, GPU (or long CPU run), output validation against the PyTorch reference, ongoing CI to keep the conversion in sync as upstream evolves. Out of scope for PM1.
4. **The downstream constraint that actually matters is dimension.** `vector(1024)` is fixed in `apps/api/prisma/schema.prisma` for `test_cases.embedding` + `kb_chunks.embedding`, and the HNSW indexes in `apps/api/prisma/raw/init_rls_hnsw.sql` are sized for 1024 dimensions. Whatever model we pick MUST output 1024-dim vectors so the schema is unchanged.

## Decision

Use **`Xenova/bge-large-en-v1.5`** as the PM1 embedding model.

- **Source:** BAAI's BGE family, English. `Xenova/bge-large-en-v1.5` is the community-maintained ONNX conversion (Apache-2.0, used by countless RAG projects on transformers.js).
- **Dimension:** 1024 — exact match for `vector(1024)`. Schema is unchanged.
- **Performance (measured 2026-04-28 on Yogesh's M-series Mac):**
  - Cold load (first run, HF download): **38s** (~660 MB ONNX + tokenizer assets).
  - Warm load (cached, restart): **1.7s** (model in `~/.cache/huggingface/`).
  - Per-embed warm latency: **19-31ms** server-side, **~273ms** including curl roundtrip.
  - This beats CLAUDE.md's "~50ms/embed" target with margin.
- **Quality (cosine similarity sanity, full 1024-dim):**
  - `embed("test case")` vs `embed("test scenario")` = **0.80** (semantically close, as expected).
  - `embed("test case")` vs `embed("the quick brown fox jumps")` = **0.46** (unrelated, much lower — model is discriminating correctly).
- **Implementation:** `EMBEDDING_MODEL_ID` env var defaults to `Xenova/bge-large-en-v1.5`. Operators can override at runtime without code change — no rebuild needed for the eventual Qwen3 swap.

## Consequences

### Accepted

- **English-only quality.** BGE-large-en is trained on English; Qwen3 is multilingual. For PM1's pilot at Iksula (English-language requirements + test cases + defects per the data canon), this is a non-issue. **Revisit if Iksula expands to Hindi / Marathi / multilingual test corpora** — Qwen3 (when ONNX-available) or `Xenova/multilingual-e5-large` (also 1024-dim) would be the swap.
- **Quality drift between `Xenova/bge-large-en-v1.5` and `Qwen/Qwen3-Embedding-0.6B`** is real but small for English semantic search. MTEB benchmarks put both in the same general performance band for retrieval tasks.

### No-op

- **Schema unchanged.** `vector(1024)` accepts BGE-large-en-v1.5's outputs directly. No migration. No re-embedding when we eventually swap to Qwen3 — vectors are produced by whichever model runs at the time and stored in the same column.
- **HNSW index unchanged.** Cosine similarity is the same metric for both models.

### Future swap path

When `Xenova/Qwen3-Embedding-0.6B` (or equivalent ONNX) is published:

1. Set `EMBEDDING_MODEL_ID=Xenova/Qwen3-Embedding-0.6B` in Render env vars.
2. Restart the api service (cold load = ~40s for download).
3. **Re-embed all existing rows:** `apps/api/scripts/reembed-all.ts` (TBD; trivial: SELECT id, source_text FROM test_cases WHERE updated_at < CUTOFF; UPDATE embedding = service.embed(source_text)). Vectors from the old model and new model are in the same dimension but **NOT directly comparable** under cosine — re-embedding is required for consistent search.
4. Update CLAUDE.md "Locked tech stack" line + this ADR's status to "Superseded by ADR-XXX".

## Alternatives considered

| Option                               | Dim  | Pros                                                 | Cons                                                                       | Verdict                                            |
| ------------------------------------ | ---- | ---------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| **`Xenova/bge-large-en-v1.5`**       | 1024 | Schema match · ONNX ready · widely used · Apache-2.0 | English-only                                                               | **Chosen**                                         |
| Self-convert Qwen3 → ONNX            | 1024 | Matches CLAUDE.md spec verbatim · multilingual       | Conversion + validation pipeline out of scope · no precedent in PM1 stack  | Rejected                                           |
| `Xenova/jina-embeddings-v2-small-en` | 768  | ONNX ready · Jina lineage                            | Wrong dim → schema migration → breaks PR #4                                | Rejected                                           |
| `Xenova/all-MiniLM-L6-v2`            | 384  | Tiny + fast (sub-10ms warm)                          | Wrong dim · lower MTEB scores                                              | Rejected                                           |
| `Xenova/multilingual-e5-large`       | 1024 | Multilingual · ONNX ready · same dim                 | English MTEB slightly lower than BGE-large; multilingual not needed in PM1 | Rejected (deferred — fallback if pilot adds Hindi) |

## Sign-off

- BE Chat 3 (2026-04-28, Day-2 stretch session) — implementation + verification.
- Awaiting Yogesh confirmation in PR review.
