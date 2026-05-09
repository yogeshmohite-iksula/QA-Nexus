# ADR-014: Curator (A2) dedup thresholds + cosine-similarity calibration

- **Status:** Proposed (full body lands Sunday 2026-05-10 — Day-15 TASK C1)
- **Date:** 2026-05-09 (outline) · 2026-05-10 (acceptance target)
- **Deciders:** Yogesh Mohite (Admin), BE chat
- **Related:** M3 Day-13 PR #97 (Curator Pattern A scaffold) · Day-15/Day-16 swap point (`apps/api/src/test-cases/curator.service.ts`) · ADR-003 (embedding model — bge-small-en-v1.5 384-dim per amendment) · ADR-013 (Composer prompt strategy — sister doc) · `apps/api/src/kb/embedding.service.ts` (in-process Xenova bridge) · `apps/api/prisma/schema.prisma` (TB-007 `embedding Unsupported("vector(384)")`) · CLAUDE.md "Locked tech stack" (pgvector HNSW)
- **Supersedes:** none
- **Superseded by:** none

---

## ⚠️ OUTLINE STATUS — DO NOT TREAT AS BINDING

This file is a **Proposed-status outline** committed Day-14 evening so:

1. The Day-15 swap-PR has a draft target to align against
2. Open questions are surfaced BEFORE the implementation PR opens (cheaper to argue policy than re-do code)
3. Sunday morning's TASK C1 fills in the body + flips status → Accepted

Sections marked **`[OUTLINE]`** below are placeholders. Sections marked **`[OPEN QUESTION]`** must be resolved before status flips.

---

## Context [OUTLINE]

M3 Day-13 PR #97 shipped `POST /api/projects/:projectId/test-cases/:tcId/duplicates` as a Pattern A scaffold returning canned similarity scores. F14m2 modal already wires against the locked response shape. Day-15/Day-16 swap replaces the canned-score generator with a real pgvector cosine-similarity query against `test_cases.embedding`.

Five coupled decisions need locking before that swap PR opens (mirrors ADR-013's lock pattern):

1. **Threshold values** — what cosine score triggers `flag` vs `block`?
2. **Embedding model** — must match what's already in the `test_cases.embedding` column (or trigger a re-embed migration).
3. **pgvector index parameters** — HNSW `m`, `ef_construction`, search-time `ef`.
4. **Tie-breaking + top-K cutoff** — how many candidates surface in the F14m2 banner.
5. **False-positive tolerance + re-calibration trigger** — what FP rate forces a threshold revisit?

## Decision (target — placeholder values for Sunday review)

### 1. Threshold values

| Verdict        | Cosine similarity range | UI surface                                          |
| -------------- | ----------------------- | --------------------------------------------------- |
| `block`        | ≥ **0.95**              | Red banner; user must reject OR merge before save   |
| `flag`         | ≥ **0.85**, < 0.95      | Yellow warning; user can override with confirmation |
| (not surfaced) | < 0.85                  | Filtered out before response leaves BE              |

Aligns with PR #97's `CURATOR_THRESHOLD_FLAG_DEFAULT = 0.85` + `CURATOR_THRESHOLD_BLOCK_DEFAULT = 0.95` constants in `packages/shared/src/schemas/test-case.ts`. ADR locks them as the canonical defaults; per-call override remains supported via `CuratorCheckRequest.thresholdFlag` / `thresholdBlock` (Zod-enforced `block > flag`).

### 2. Embedding model — **[OPEN QUESTION]**

Brief specifies `bge-large-en-v1.5 (1024-dim)` but the **current data layer state** is:

- `apps/api/prisma/schema.prisma`: `KbChunk.embedding Unsupported("vector(384)")` per ADR-003 amendment + Day-5 migration `0002_vector_384_dim.sql`
- `apps/api/src/kb/embedding.service.ts`: `Xenova/bge-small-en-v1.5` (384-dim, ~33 MB) — fits Render Free 512 MB ceiling
- `test_cases.embedding` column shape: per TB-007 schema — **NEEDS VERIFICATION** (is it `vector(384)` or unset?)

Three paths Sunday morning needs to choose between:

- **(A) Pin bge-small (384-dim)** — match current data layer, zero migration. Trade-off: lower semantic-similarity quality than bge-large.
- **(B) Pin bge-large (1024-dim) + migration** — `vector(384) → vector(1024)` migration on `test_cases.embedding`, re-embed all rows, update `EmbeddingService` model id. Trade-off: Render Free 512 MB OOM risk (Hard Rule 1 binding); ~10-15 min one-time download per Render dyno spin-up.
- **(C) Pin bge-small NOW with planned upgrade post-pilot** — ship with bge-small, document follow-up `(au)` for bge-large upgrade once Render Hobby tier approved.

**Recommended path: (C)** — preserves $0/month gate + Hard Rule 1 + matches existing data layer. Quality regression from bge-small vs bge-large at threshold 0.85/0.95 needs empirical validation (next section).

### 3. pgvector index parameters

| Param                                 | Value          | Why                                                                                   |
| ------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| Index type                            | HNSW           | M2 KB chunks already use HNSW (PR #34); single index family across project            |
| `m`                                   | **16**         | OSS canonical default; ~10x recall lift over m=8 with ~2x build time                  |
| `ef_construction`                     | **64**         | Build-time recall vs cost trade-off; matches kb_chunks index from M2                  |
| Search-time `ef` (HNSW.SET ef_search) | **40**         | Default 10 too low for top-K=20 retrieval; 40 ~= 95% recall@20 in Pinecone benchmarks |
| Distance op                           | `<=>` (cosine) | Score = `1 - (a <=> b)` for similarity; aligns with bge-\* model output normalization |

Migration `apps/api/prisma/raw/00XX_test_case_hnsw_index.sql` adds the index against `test_cases.embedding` IF NOT already present. Idempotent.

### 4. Tie-breaking + top-K cutoff

- Default top-K: **5** (matches `CURATOR_TOP_K_DEFAULT = 5` already in shared schema)
- Hard cap: **20** (`CURATOR_TOP_K_MAX = 20` — F14m2 modal scroll budget)
- Tie-break: similarity DESC, then `created_at DESC` (newer cases win on ties — closer to user's mental model of "most recent duplicate")
- Always exclude: `c.id != $sourceId`, `c.status != 'deprecated'` (archived cases don't surface)

### 5. False-positive tolerance + re-calibration

- **FP rate ceiling: 5%** — measured against Iksula's seed test_cases (~50-100 cases per project at pilot start) labeled by Yogesh + Akshay
- If observed FP rate at 0.85 threshold > 5% within first 2 weeks of pilot → **ADR-014 amendment** required (raise flag threshold to 0.88 or pin bge-large)
- Measurement protocol: `scripts/curator-fp-calibration.ts` runs the dedup check against a labeled set + reports precision/recall at threshold sweep (Day-15+ tooling)
- Audit row `curator_dedupe_check_completed` already carries `match_count` + `verdict` so retroactive analysis is possible without new instrumentation

### 6. PII redaction (binding — already shipped in PR #97)

`curator_dedupe_check_started` + `_completed` audit payloads carry `case_keys` + `match_case_keys` + counts only. NEVER candidate case titles. Pinned by negative test in `curator.service.spec.ts`.

### 7. Scope boundary — Curator is dedup, NOT relevance [OUTLINE]

Cross-reference ADR-013 §"KB context retrieval (M3.5)": **KB grounding is Composer's domain, not Curator's.** Curator only operates on `test_cases ↔ test_cases` similarity within a project — NEVER `test_cases ↔ kb_chunks`. Avoiding scope creep.

## Consequences

### Positive [OUTLINE]

- Threshold canon locked → F14m2 banner UX stable
- Per-call override via Zod-validated request body → user can tune for noisy projects
- HNSW params match M2 KB index → operational consistency
- bge-small path (recommended) → zero migration cost, Render Free safe

### Negative [OUTLINE]

- bge-small quality lower than bge-large → may need post-pilot upgrade (followup `(au)` to be filed)
- 0.85 / 0.95 thresholds are heuristic guesses → first calibration run may surface drift
- HNSW search-time `ef=40` is uncalibrated for our data shape → may need raising if recall < 95%
- pgvector index migration adds Render boot time on first deploy after merge

### Mitigation plan [OUTLINE]

1. **Lock threshold constants in `packages/shared/src/schemas/test-case.ts`** — diffs visible in PR review
2. **Snapshot-pin index DDL** — `__snapshots__/test-case-hnsw-index.sql`
3. **Calibration runbook in `apps/api/src/test-cases/CURATOR.md`** — how to re-run FP/precision measurement
4. **Followup `(au)`** — bge-large upgrade once Render Hobby tier approved
5. **Followup `(av)`** — TestCase.embedding backfill job (M3.5+) — currently NEW Composer-generated cases get embedded; M2 manually-created cases need backfill before Curator surfaces them

## Alternatives considered [OUTLINE — Sunday expansion]

### A. Hard threshold (single value, no flag/block split) — rejected

- Cons: removes user override path; binary "block or accept" doesn't match QA workflow

### B. ML classifier (e.g., fine-tuned cross-encoder) — deferred to PM2

- Cons: training data, model hosting, Hard Rule 5 ban on local LLM hosts

### C. Edit-distance / lexical similarity (Levenshtein, BM25) — rejected

- Cons: misses semantic dupes ("login flow" vs "sign-in flow"); vector-cosine is the right primitive

### D. Per-project threshold tuning UI — deferred to M3.5

- Cons: out of scope for M3 close; per-call override covers the M3 case

### E. bge-large with quantization (int8) for Render Free — **[OPEN QUESTION for Sunday]**

- Pros: bge-large quality + bge-small memory footprint
- Cons: Xenova quantization support is uneven; needs research

## Implementation plan (Day-15/Day-16) [OUTLINE]

1. Confirm `test_cases.embedding` column exists + dim matches `EmbeddingService` model
2. Add HNSW index migration if missing
3. Replace `generateCannedMatches()` in `curator.service.ts` with `pgvectorCosineSearch()`
4. Embed source case via `EmbeddingService.embed(case.title + case.preconditions + case.stepsJson concat)`
5. Raw SQL via `prisma.$queryRaw`: `SELECT id, key, title, 1 - (embedding <=> $1::vector) AS similarity FROM test_cases WHERE project_id = $2 AND id != $3 AND embedding IS NOT NULL AND status != 'deprecated' ORDER BY embedding <=> $1::vector LIMIT $4`
6. Apply thresholds + tie-break in app code
7. Existing audit + PII discipline preserved
8. Tests: extend `curator.service.spec.ts` with raw-SQL mocks + threshold edge-cases
9. Calibration script (`scripts/curator-fp-calibration.ts`) deferred to follow-up PR

## Cross-references

- `apps/api/src/test-cases/curator.service.ts` — service body (Day-15/16 swap target)
- `apps/api/src/test-cases/curator.controller.ts` — endpoint (no changes)
- `apps/api/src/test-cases/__tests__/curator.service.spec.ts` — Pattern A test suite (extended Day-15)
- `apps/api/src/kb/embedding.service.ts` — `embed()` entry point (Curator reuses)
- `apps/api/prisma/schema.prisma` — TB-007 `test_cases.embedding` column
- `packages/shared/src/schemas/test-case.ts` — `CuratorCheckRequest` / `CuratorCheckResponse` / threshold constants
- ADR-003 — embedding model amendment (bge-small for Render Free)
- ADR-013 — Composer prompt strategy (sister doc; KB grounding scope boundary)
- PR #97 — Pattern A scaffold this swap replaces
- CLAUDE.md "Locked tech stack" — pgvector HNSW pin
- `Milestone_M3_Test_Cases_AI_v2.md` §"Curator (A2)" — product spec
