# ADR-014: Curator (A2) dedup thresholds + cosine-similarity calibration

- **Status:** **Accepted** (2026-05-09 — Day-14 Block B+ pull-forward; Yogesh confirmed Path C)
- **Date:** 2026-05-09 (outline + acceptance both Day-14)
- **Deciders:** Yogesh Mohite (Admin), BE chat
- **Related:** M3 Day-13 PR #97 (Curator Pattern A scaffold) · M3 Day-14/15 swap PR (Curator real pgvector — sister to ADR-013) · ADR-003 + ADR-003-amendment (embedding model — bge-small-en-v1.5 384-dim) · ADR-013 (Composer prompt strategy — sister doc; defines Composer's KB-grounding scope which Curator must NOT trespass) · `apps/api/src/embedding/embedding.service.ts` (in-process Xenova bridge) · `apps/api/src/test-cases/curator.service.ts` (swap target) · `apps/api/prisma/schema.prisma` (TB-007 `embedding Unsupported("vector(384)")`) · `apps/api/prisma/raw/migrations/0002_vector_384_dim.sql` (Day-5 dim migration + HNSW index recreation) · CLAUDE.md "Locked tech stack" (pgvector HNSW pin) · followups `(au)` + `(av)` (filed in this PR)
- **Supersedes:** none
- **Superseded by:** none

---

## Context

M3 Day-13 PR #97 shipped `POST /api/projects/:projectId/test-cases/:tcId/duplicates` as a Pattern A scaffold returning canned similarity scores. F14m2 modal already wires against the locked response shape. Day-14/15 swap (sister PR) replaces the canned-score generator with a real pgvector cosine-similarity query against `test_cases.embedding`.

Five coupled decisions need locking before that swap PR opens (mirrors ADR-013's lock pattern):

1. **Threshold values** — what cosine score triggers `flag` vs `block`?
2. **Embedding model** — must match what's already in the `test_cases.embedding` column (or trigger a re-embed migration). **This was the OPEN QUESTION in the Day-14 outline; resolved in this version.**
3. **pgvector index parameters** — HNSW `m`, `ef_construction`, search-time `ef`.
4. **Tie-breaking + top-K cutoff** — how many candidates surface in the F14m2 banner.
5. **False-positive tolerance + re-calibration trigger** — what FP rate forces a threshold revisit?

### Embedding model reality vs CLAUDE.md spec — the reconciliation

CLAUDE.md "Locked tech stack" + PM1_PRD v8.1 + PM1_ERD v2.1 all reference `BAAI/bge-large-en-v1.5` (1024-dim) as the embedding model. **The actual data layer state is `Xenova/bge-small-en-v1.5` (384-dim)** per:

- ADR-003 amendment (Day-4 PM): bge-large OOM'd Render Free dyno at ~470 MB resident; switched to bge-small (~33 MB)
- ADR-009: pnpm/sharp/render-deploy deferred to Day-5
- Migration `apps/api/prisma/raw/migrations/0002_vector_384_dim.sql` (Day-5): `ALTER TABLE test_cases ALTER COLUMN embedding TYPE vector(384) USING NULL` + recreated `test_cases_embedding_hnsw_idx` at 384-dim with cosine-ops m=16/ef_construction=64
- Schema source-of-truth: `apps/api/prisma/schema.prisma` declares `embedding Unsupported("vector(384)")` with the inline comment "384-dim Xenova/bge-small-en-v1.5 vector"

CLAUDE.md doc-drift filed as followup `(av)` for M3.5 doc-consolidation pass (see below).

## Decision

### 1. Threshold values

| Verdict | Cosine similarity range | UI surface                                          | Audit `verdict` field |
| ------- | ----------------------- | --------------------------------------------------- | --------------------- |
| `block` | ≥ **0.95**              | Red banner; user must reject OR merge before save   | `'block'`             |
| `flag`  | ≥ **0.85**, < 0.95      | Yellow warning; user can override with confirmation | `'flag'`              |
| (clean) | < 0.85                  | Filtered out before response leaves BE              | `'clean'` (no UI)     |

Aligns with PR #97's `CURATOR_THRESHOLD_FLAG_DEFAULT = 0.85` + `CURATOR_THRESHOLD_BLOCK_DEFAULT = 0.95` constants in `packages/shared/src/schemas/test-case.ts`. ADR locks them as the canonical defaults; per-call override remains supported via `CuratorCheckRequest.thresholdFlag` / `thresholdBlock` (Zod-enforced `block > flag`).

### 2. Embedding model — **Path C** (chosen)

**Decision: pin `Xenova/bge-small-en-v1.5` (384-dim) for the M3 pilot. File followup `(au)` for post-pilot upgrade evaluation.**

| Path     | Description                                                              | Disposition                                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**    | Switch to bge-large-en-v1.5 (1024-dim) NOW                               | **Rejected** — Render Free 512 MB ceiling (Hard Rule 1 binding); requires `vector(384)→vector(1024)` migration + full backfill of every existing TestCase row; full Hard Rule 11 cycle (12+ hr scope). Blocks M3 close. |
| **B**    | Hybrid — bge-small for low-priority dedup checks, bge-large for P0 cases | **Rejected** — operational complexity (2 model loads, dual-pipeline embed + retrieval, doubled OOM risk); benefits don't justify the maintenance burden for an 8-user pilot.                                            |
| **C** ✅ | Pin bge-small (384-dim) NOW + post-pilot upgrade eval per `(au)`         | **Accepted** — preserves Hard Rule 1 ($0/month) + ships M3 on schedule + matches existing data layer (zero migration) + leaves clean upgrade path.                                                                      |
| **D**    | Hard threshold (single value, no flag/block split)                       | **Rejected** — removes user override; binary "block or accept" doesn't match QA workflow.                                                                                                                               |
| **E**    | Online ML reranker / classifier                                          | **Deferred to PM2** — training data, model hosting cost, Hard Rule 5 ban on local LLM hosts.                                                                                                                            |

**Quality cost of bge-small vs bge-large:** MTEB avg 62.17 vs 64.23 (-2.06 pt). Empirical impact at 0.85/0.95 thresholds depends on Iksula corpus characteristics — calibration runs in first 2 weeks of pilot per `(au)`.

### 3. pgvector index parameters

| Param                             | Value                   | Why                                                                                                                                                                                                           |
| --------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Index type                        | HNSW                    | Day-5 migration `0002_vector_384_dim.sql` already created `test_cases_embedding_hnsw_idx`                                                                                                                     |
| `m`                               | **16**                  | Migration default; OSS canonical; ~10x recall lift over m=8 with ~2x build time                                                                                                                               |
| `ef_construction`                 | **64**                  | Migration default; build-time recall vs cost trade-off; matches kb_chunks index from M2                                                                                                                       |
| Search-time `ef` (HNSW.ef_search) | **40**                  | Default 10 too low for top-K=10 retrieval; 40 ~= 95% recall@10 in pgvector benchmarks                                                                                                                         |
| Distance op                       | `<=>` (cosine distance) | Index is `vector_cosine_ops` — MUST use `<=>`. Similarity = `1 - (a <=> b)`. **NB: brief mentioned `<->` (L2 distance) — that operator on a cosine-ops index returns wrong distances; this ADR locks `<=>`.** |

**No migration needed Day-14/15** — index already exists from Day-5. Curator service body just uses `prisma.$queryRaw` against existing schema.

### 4. Tie-breaking + top-K cutoff

- Default top-K: **10** (matches brief; PR #97 default constant `CURATOR_TOP_K_DEFAULT = 5` to be extended to 10 in shared schema during impl PR — additive change, no breaking)
- Hard cap: **20** (`CURATOR_TOP_K_MAX = 20` — F14m2 modal scroll budget)
- Tie-break: similarity DESC, then `created_at DESC` (newer cases win on ties — closer to user's mental model of "most recent duplicate")
- Always exclude:
  - `c.id != $sourceId` (don't compare a case against itself)
  - `c.status != 'deprecated'` (archived cases don't surface)
  - `c.embedding IS NOT NULL` (skip backlog of un-embedded M2-era manual cases — see `(av)`'s sibling concern)

### 5. False-positive tolerance + re-calibration trigger

- **FP rate ceiling: ≤5%** measured against Iksula's seed test_cases (~50-100 cases per project at pilot start) labeled by Yogesh + Akshay
- **Calibration cadence:**
  - Initial: first 2 weeks of pilot
  - Recurring: weekly during pilot (10 AM standup includes "Curator FP rate" metric)
- **If observed FP rate at 0.85 threshold > 5%** → **ADR-014 amendment** required:
  - Option 1: raise `flag` threshold to 0.88 (more conservative)
  - Option 2: trigger `(au)` early (consider bge-large upgrade if Render Hobby tier approved by then)
- **Measurement protocol:** `scripts/curator-fp-calibration.ts` (deferred to follow-up PR — Day-15+ tooling) runs the dedup check against a labeled set + reports precision/recall at threshold sweep
- **Audit row** `curator_dedupe_check_completed` already carries `match_count` + `verdict` + `highest_similarity` so retroactive analysis is possible without new instrumentation

### 6. PII redaction (binding — already shipped in PR #97)

`curator_dedupe_check_started` + `_completed` audit payloads carry `case_keys` + `match_case_keys` + counts only. NEVER candidate case titles. Pinned by negative test in `curator.service.spec.ts`.

### 7. Scope boundary — Curator is dedup, NOT relevance

Cross-reference ADR-013 §"KB context retrieval (M3.5)": **KB grounding is Composer's domain, not Curator's.** Curator only operates on `test_cases ↔ test_cases` similarity within a single project — NEVER `test_cases ↔ kb_chunks`. This boundary prevents scope creep + keeps Curator's cosine-similarity threshold canon meaningful (kb_chunk text has different statistical properties than test_case text — would need separate calibration).

### 8. Empty-corpus + null-embedding handling (binding — service contract)

- **Empty corpus** (project with 0 OTHER test cases that pass the WHERE filter): return `verdict='clean', matches=[], highestSimilarity=null` with `metadata.candidatesScanned=0`. No LLM call, no embedding op, fast-path return.
- **Source case has no embedding** (pre-existing M2-era manual case never re-embedded): service computes the embedding ON-DEMAND via `EmbeddingService.embed(case.title + ' ' + case.preconditions + ' ' + stepsConcat)` BEFORE the cosine search. Backfill job for batch re-embedding deferred to followup `(av)` sibling.
- **Mixed corpus** (some candidates have embeddings, some don't): WHERE clause `c.embedding IS NOT NULL` excludes the un-embedded; service logs `metadata.skippedNullEmbeddings: <count>` so QA can correlate dedup miss → backlog state.

## Consequences

### Positive

- **Threshold canon locked** → F14m2 banner UX stable; per-call override available for noisy projects
- **HNSW params already migrated** (Day-5) → zero schema work for the impl PR
- **bge-small path** preserves Hard Rule 1 ($0/month) + Render Free 512 MB ceiling
- **Calibration trigger explicit** (FP > 5% → ADR amendment) — drift detection is built-in, not retroactive
- **Curator scope boundary explicit** (no KB grounding) — prevents accidental coupling to Composer's domain
- **Empty-corpus + null-embedding behavior locked in source** — no per-call ambiguity for FE+1
- **Single-source SQL operator** (`<=>`) explicitly specified — no risk of `<->` (L2) drift on cosine-ops index

### Negative

- **bge-small quality lower than bge-large** (-2.06 MTEB pt) → may need post-pilot upgrade per `(au)`
- **0.85 / 0.95 thresholds are heuristic** → first calibration run may surface drift; ADR amendment path documented
- **HNSW search-time `ef=40` is uncalibrated** for our specific data shape → may need raising if recall < 95%
- **Backlog of M2-era un-embedded test cases** won't surface in dedup until `(av)` backfill job lands (M3.5+) — Curator silently skips them (with audit metadata)
- **CLAUDE.md doc-drift** (CLAUDE.md still says bge-large) → followup `(av)` to fix during M3.5 doc consolidation pass

### Mitigation plan

1. **Lock threshold constants in `packages/shared/src/schemas/test-case.ts`** — diffs visible in PR review
2. **Snapshot-pin SQL** — `__snapshots__/curator-pgvector-query.sql` captures the canonical `prisma.$queryRaw` template; PR review catches drift
3. **Calibration runbook** in `docs/architecture/curator-calibration-runbook.md` (deferred to follow-up PR — Day-15+ tooling) — how to re-run FP/precision measurement
4. **Followup `(au)`** — bge-large upgrade evaluation post-pilot
5. **Followup `(av)`** — TestCase.embedding backfill job + CLAUDE.md doc-drift cleanup
6. **PR-review trigger:** any PR touching the threshold constants OR the cosine SQL template OR the embedding-model-id MUST cite this ADR + Yogesh approves

## Alternatives considered

(Full table in §"Decision §2" above. Recap: A=switch-to-large NOW, B=hybrid, C=pin-small NOW (CHOSEN), D=hard-threshold, E=ML reranker.)

### Additional alternatives considered + rejected:

#### F. Edit-distance / lexical similarity (Levenshtein, BM25) — rejected

- Cons: misses semantic dupes ("login flow" vs "sign-in flow"); vector-cosine is the right primitive

#### G. Per-project threshold tuning UI — deferred to M3.5

- Cons: out of scope for M3 close; per-call override (existing in PR #97 schema) covers the M3 case

#### H. bge-large with int8 quantization for Render Free — investigated; deferred

- Pros: bge-large quality + bge-small memory footprint
- Cons: Xenova quantization support is uneven for bge-large variants; needs ~1 day spike to validate; out of scope for M3 close. Tracked under `(au)` umbrella.

## Implementation plan (Day-14 evening B+2 / Day-15 morning C2)

1. ✅ Confirm `test_cases.embedding` column exists + dim=384 — DONE (verified Day-14 22:00)
2. ✅ Confirm `test_cases_embedding_hnsw_idx` exists with cosine-ops m=16 ef_construction=64 — DONE
3. **`feat(api)` — Replace `generateCannedMatches()` in `curator.service.ts`** with `pgvectorCosineSearch()`:
   - Inject `EmbeddingService` (already provided by `EmbeddingModule`)
   - Build embed-input: `${tc.title}\n${tc.preconditions}\n${stepsConcat}`
   - Call `EmbeddingService.embed(text)` → 384-dim Float32Array
   - Raw SQL via `prisma.$queryRaw`:
     ```sql
     SELECT id, key, title, 1 - (embedding <=> $1::vector) AS similarity
     FROM test_cases
     WHERE project_id = $2::uuid
       AND id != $3::uuid
       AND embedding IS NOT NULL
       AND status != 'deprecated'
     ORDER BY embedding <=> $1::vector
     LIMIT $4
     ```
   - Apply thresholds in app code (`>=block` → 'block'; `>=flag && <block` → 'flag'; `<flag` filtered out)
   - Compute overall verdict from highest match (or 'clean' on empty result)
4. **Empty-corpus fast-path** — service checks count of OTHER cases first; returns clean if 0
5. **Null-embedding handling** — WHERE clause excludes; service logs `skippedNullEmbeddings` count in metadata
6. **Existing audit + PII discipline preserved** — payload field set additions: `cosine_search_ms`, `candidates_scanned`, `skipped_null_embeddings`
7. **Tests:** extend `curator.service.spec.ts` with raw-SQL mocks + threshold edge-cases (block / flag / clean / empty-corpus / null-embedding-skip / perf-budget)
8. **Calibration script** (`scripts/curator-fp-calibration.ts`) deferred to follow-up PR

## Cross-references

- `apps/api/src/test-cases/curator.service.ts` — service body (Day-14/15 swap target; PATTERN-A → PATTERN-B SWAP marker added Day-14 TASK B2.3)
- `apps/api/src/test-cases/curator.controller.ts` — endpoint (no changes needed)
- `apps/api/src/test-cases/__tests__/curator.service.spec.ts` — Pattern A test suite (extended Day-14/15)
- `apps/api/src/embedding/embedding.service.ts` — `embed()` entry point (Curator reuses; same singleton as KB pipeline)
- `apps/api/prisma/schema.prisma` — TB-007 `test_cases.embedding` column + comment block
- `apps/api/prisma/raw/migrations/0002_vector_384_dim.sql` — Day-5 dim migration + HNSW index recreation (THE SQL that made this ADR possible without further migration)
- `packages/shared/src/schemas/test-case.ts` — `CuratorCheckRequest` / `CuratorCheckResponse` / threshold constants
- `scripts/embed-smoke-test.ts` — Day-14 TASK B2.4 smoke test confirming bge-small load + dim=384
- ADR-003 + ADR-003-amendment — embedding model amendment (bge-small for Render Free)
- ADR-013 — Composer prompt strategy (sister doc; KB grounding scope boundary clarified §7)
- PR #97 — Pattern A scaffold this swap replaces
- PR #109 — Composer real Groq integration (sister sister)
- PR #112 — Day-14 polish bundle (this ADR's outline → Accepted upgrade lands here)
- CLAUDE.md "Locked tech stack" — pgvector HNSW pin (CLAUDE.md doc-drift on embedding model tracked in `(av)`)
- `Milestone_M3_Test_Cases_AI_v2.md` §"Curator (A2)" — product spec
- followup `(au)` — post-pilot embedding upgrade evaluation (filed in this PR)
- followup `(av)` — TestCase.embedding backfill + CLAUDE.md doc-drift cleanup (filed in this PR)
