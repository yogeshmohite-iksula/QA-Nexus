-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_vector_384_dim.sql — vector dimensionality migration
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Spec: ADR-003 (Day-4 amendment) + ADR-009 (Render Free 512 MB constraint).
-- M0 last task per Day-5 brief.
--
-- WHY:
--   On Day-4 afternoon Render Free's 512 MB dyno OOM-crashed when
--   EmbeddingService loaded `Xenova/bge-large-en-v1.5` (~470 MB resident
--   WASM + ~50 MB API baseline = over the cap). Tactical fix: swap
--   `EMBEDDING_MODEL_ID` env to `Xenova/bge-small-en-v1.5` (33 MB resident,
--   384-dim instead of 1024-dim, MTEB avg 62.17 vs 64.23 = -2.06 pt
--   quality cost). See followup (l) for the eval methodology that will
--   re-litigate bge-large at M3 once we're off Free tier.
--
--   This migration is the schema half of that swap: the `embedding`
--   columns must match the model's output dim. pgvector's vector(N) type
--   is strict about dim — inserting a 384-dim vector into a vector(1024)
--   column fails with "expected 1024 dimensions, not 384".
--
-- SAFETY:
--   - Tables are EMPTY at M0 (no real embeddings written yet — only
--     stub seed which doesn't populate the embedding column). `USING NULL`
--     drops any pre-existing values; safe because there are none.
--   - HNSW indexes are dim-specific — they MUST be dropped before the
--     ALTER COLUMN (Postgres rejects ALTER on indexed vector columns)
--     and recreated after at the new dim.
--   - Wrapped in a single transaction so a partial failure rolls back
--     completely. If this errors mid-way, re-running is idempotent (the
--     DROPs use IF EXISTS, the CREATEs are recoverable).
--
-- WHEN TO RE-RUN:
--   - Fresh dev DB: run init_rls_hnsw.sql first (creates indexes at
--     vector(1024)), then run THIS file (alters to 384 + recreates).
--   - Existing prod DB (Neon): same — init was already applied at the
--     1024-dim shape, this is the upgrade.
--   - When bge-large returns at M3+ (off Free tier), a 0003_vector_1024.sql
--     will reverse this; the same DROP→ALTER→CREATE pattern applies.
--
-- INVOCATION:
--   pnpm --filter @qa-nexus/api prisma:apply-raw:migrations
--   (See `apps/api/package.json` scripts.)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Drop the dim-specific HNSW indexes. They were created at vector(1024) by
--    init_rls_hnsw.sql; the ALTER below would fail otherwise.
DROP INDEX IF EXISTS test_cases_embedding_hnsw_idx;
DROP INDEX IF EXISTS kb_chunks_embedding_hnsw_idx;

-- 2. Re-type the embedding columns. `USING NULL` discards any extant
--    values — safe because tables are empty at M0 (no production embeddings
--    written yet). If we ever re-run this on populated tables in PM1+,
--    swap the USING clause to a re-embed strategy (re-run A1 Scribe over
--    every test_case + kb_chunk to repopulate at the new dim).
ALTER TABLE test_cases ALTER COLUMN embedding TYPE vector(384) USING NULL;
ALTER TABLE kb_chunks  ALTER COLUMN embedding TYPE vector(384) USING NULL;

-- 3. Recreate the HNSW indexes at the new dim. Same parameters as the
--    init script (m=16, ef_construction=64 — the cosine-ops defaults
--    documented in database.md).
CREATE INDEX test_cases_embedding_hnsw_idx
  ON test_cases USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX kb_chunks_embedding_hnsw_idx
  ON kb_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-APPLY VERIFICATION (run manually):
--   SELECT atttypid::regtype AS type, attname
--     FROM pg_attribute
--     WHERE attrelid IN ('test_cases'::regclass, 'kb_chunks'::regclass)
--       AND attname = 'embedding';
--   -- Expected: vector(384) for both rows.
--
--   SELECT indexname, indexdef
--     FROM pg_indexes
--     WHERE indexname LIKE '%embedding_hnsw%';
--   -- Expected: 2 rows, both USING hnsw, vector_cosine_ops, no dim leak.
-- ─────────────────────────────────────────────────────────────────────────────
