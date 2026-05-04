# `apps/api/src/kb/` — KB chunk-search

**Status:** STUB (M2 contract scaffold landed Day-8 Step 4).
**Wire shape:** stable — FE can build against this contract today.
**Backend:** returns hardcoded `return_policy_v2.xlsx` fixtures.

---

## What's REAL

| Component                                   | Status  | Notes                                                                                                                                                                                            |
| ------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wire schemas                                | ✅ REAL | `packages/shared/src/schemas/kb.ts` — `KbSearchRequest` / `KbSearchResponse` / `Chunk` / `ChunkDetail` / `ChunkDetailResponse` / `ChunkSourceAttribution`. M2 swap does NOT change these shapes. |
| RBAC + RolesGuard                           | ✅ REAL | `@Roles(Admin, Lead, QAEngineer, Stakeholder)` on both endpoints. Cross-workspace + auth-missing rejected by guard.                                                                              |
| Endpoints mounted in AppModule              | ✅ REAL | `POST /api/projects/:projectId/kb/search` + `GET /api/projects/:projectId/kb/chunks/:chunkId` reachable from a running API.                                                                      |
| Sort + filter + cursor pagination semantics | ✅ REAL | `sort=relevance/recency/source_file`, `filters.{sourceFileIds, minRelevanceScore, templateKind}`, `page.{cursor, limit}` all parsed + applied.                                                   |
| Stub-disclosure flag                        | ✅ REAL | Every response carries `stubbed: true`. FE can show a "demo data" banner on this.                                                                                                                |

## What's STUBBED

| Component                                  | Status                                                                                                      | M2 swap                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Chunk source                               | 🟡 STUB — 8 hardcoded chunks from one file (`return_policy_v2.xlsx`)                                        | `prisma.kbChunk.findMany({ where: { document: { projectId } } })`                                       |
| Relevance ranking                          | 🟡 STUB — keyword-overlap heuristic (any 3+ char query token in chunk text adds +0.05 to base)              | `EmbeddingService.embed(query)` → pgvector `<->` HNSW + optional `LLMGatewayService.complete()` re-rank |
| Multi-file results                         | 🟡 STUB — only `return_policy_v2.xlsx` represented                                                          | All KbDocument rows for the project, joined to KbChunk                                                  |
| Cursor format                              | 🟡 STUB — `base64(offset)` integer                                                                          | M2: `base64((relevance, chunkId))` tuple — stable across writes (offset shifts on insert)               |
| `templateKind` filter                      | 🟡 STUB — currently no-op (fixtures don't carry `templateKind` on chunks)                                   | M2: JOIN to `KbDocument.templateKind` + WHERE clause                                                    |
| Source attribution (`pageNo`, `lineRange`) | 🟡 STUB — fixtures have realistic values from M0's actual upload spec but are hand-authored                 | M2: stored on `KbChunk.metadataJson` by the upload pipeline                                             |
| `tookMs`                                   | 🟡 STUB — wall-clock from controller entry to response (~0–2 ms today; M2 will measure the real query path) | M2: span attribute from `kb.search` OTel span                                                           |

## Demo data summary

- **8 chunks** from `return_policy_v2.xlsx` (Iksula Returns project, RET — per IKSULA_CONTEXT canon).
- **Relevance distribution** mimics what `bge-small-en-v1.5` actually produces on the M0 cosine-sanity test:
  - 2 high (>0.75): sections 1.1, 2.4
  - 3 mid (0.50–0.75): sections 3, 4.2, 5
  - 3 low (0.30–0.50): sections 6, 7, Appendix A
- **Chunk IDs** follow the canonical `CHUNK-RET-####` shape (prefix preserved in deterministic UUID seed `22222222-2222-2222-2222-00000000000N`).
- **File ID** is deterministic (`11111111-1111-1111-1111-111111111111`) so FE caching keys are stable across dev restarts.

## How M2 swaps the stub

`kb.controller.ts` is the only file that changes. The two methods (`search`, `detail`) become:

```ts
// search()
const queryEmbedding = await this.embedding.embed(input.query); // 384-dim
const rows = await this.prisma.$queryRaw`
  SELECT chunk_id, source_file_id, ..., 1 - (embedding <=> ${queryEmbedding}) AS relevance
  FROM kb_chunks
  WHERE document.project_id = ${projectId}
    ${filters...}
  ORDER BY relevance DESC
  LIMIT ${limit} OFFSET ${offset}
`;
return { ok: true, chunks: rows, total: ..., tookMs: ..., nextCursor: ..., stubbed: false };

// detail()
const row = await this.prisma.kbChunk.findUnique({
  where: { id: chunkId },
  include: { document: true },
});
if (!row || row.document.projectId !== projectId) throw new NotFoundException(...);
return { ok: true, chunk: toChunkDetail(row), stubbed: false };
```

Wire shape unchanged. FE diff = zero. `stubbed: false` flips the banner off.

---

## M2 Day-8 Step 6 — Embedding service (REAL, ships with PR)

**Status:** REAL. Admin-gated endpoint; deferred-pattern under-the-hood.

| Component              | Status                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Endpoint               | ✅ REAL — `POST /api/admin/kb/embed-document` (Admin only)                                              |
| Wire schema            | ✅ REAL — `EmbedDocumentRequest` / `EmbedDocumentResponse` in `packages/shared/src/schemas/kb.ts`       |
| Embedder               | ✅ REAL — `EmbeddingService.embedBatch()` → `Xenova/bge-small-en-v1.5` (384-dim, ~33 MB)                |
| Persistence            | ✅ REAL — raw SQL `UPDATE kb_chunks SET embedding = $1::vector` per row (single tx)                     |
| Idempotent             | ✅ REAL — pulls only `WHERE embedding IS NULL`; re-running returns `embeddedCount: 0`                   |
| Cross-workspace safety | ✅ REAL — workspace mismatch on documentId → 404 (no leak)                                              |
| Audit                  | ✅ REAL — synchronous `kb_chunks_embedded` row per call (incl. no-op); payload omits chunk_text/vectors |

### Workflow (Step 5 → Step 6 → Step 4 search)

1. Admin creates `KbDocument` row + uploads file to R2 (manual today; auto-orchestrated in Step 7).
2. Admin POSTs to `/api/admin/kb/chunk-document` (Step 5) → `KbChunk` rows written, `embedding` left NULL.
3. Admin POSTs to `/api/admin/kb/embed-document` (Step 6, this PR) → `embedding` columns populated.
4. KB search via `POST /api/projects/:projectId/kb/search` (Step 4 stub today) — M2 final swap will read these embeddings via pgvector HNSW.

Step 7 (next) will fold steps 2 + 3 into the upload-completion hook so a successful R2 upload auto-chunks + auto-embeds without manual triggers.

### Stale-defaults fix bundled into this PR

`apps/api/src/embedding/embedding.service.ts` had `EXPECTED_DIM = 1024` + `DEFAULT_MODEL_ID = 'Xenova/bge-large-en-v1.5'` left over from before the Day-5 `vector(384)` migration (0002). Step 6 corrects both to 384 + `Xenova/bge-small-en-v1.5` so `embed()` no longer throws on real model output. Memory guard map already had `bge-small` listed (~33 MB) so the load path is unchanged.

### What's NOT in Step 6

- ❌ pgvector HNSW search wiring (still stubbed in `kb.controller.ts` — M2 final swap)
- ❌ Auto-embed-on-chunking trigger (Step 7)
- ❌ Re-embed-on-model-change CLI (M3 if/when we swap embedding models)

## Cross-references

- `packages/shared/src/schemas/kb.ts` — Zod contract (the source of truth)
- `apps/api/prisma/schema.prisma` — `KbDocument` (TB-017) + `KbChunk` (TB-018) Prisma models
- `apps/api/src/embedding/embedding.service.ts` — what M2 calls for query embedding
- `docs/architecture/adr-003-embedding-model.md` — the `bge-small-en-v1.5` choice + 384-dim rationale
- `apps/api/prisma/raw/migrations/0002_vector_384_dim.sql` — the HNSW index spec M2 queries against
