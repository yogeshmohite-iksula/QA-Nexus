---
name: database
description: Database (Prisma + Postgres + pgvector) schema and migration rules
paths:
  - prisma/**
  - apps/api/prisma/**
---

# Database (prisma) — schema and migration rules

> Scope: `prisma/**` schemas + migrations. Spec: P1.4 of
> `docs/audits/2026-04-27-skill-alignment-audit.md` + PM1_ERD §3.1
> (data model) + PM1_ERD §3.13 (audit log) + MS0-T020 (TB-001…TB-021).

## Multi-tenancy: row-level security (RLS)

- **Every table** that holds workspace-scoped data **must** have an RLS policy keyed on `workspace_id`. The current pilot is single-workspace, but PM2 onwards will not be — building this in now is cheaper than retrofitting.
- The exceptions (no RLS needed) are: `workspaces`, `users` (top-level), `audit_log` (admin-only via app-layer guard), and any join table whose RLS is enforced transitively through its parents.
- Use the standard policy template: `CREATE POLICY <table>_workspace_isolation ON <table> USING (workspace_id = current_setting('app.workspace_id')::uuid);`
- Set `app.workspace_id` per-request in NestJS via a Prisma `$use` middleware. Never bypass RLS by calling raw SQL with `BYPASSRLS`.

## Vector columns (pgvector)

- All vector columns are **1024-dim** (Qwen3-Embedding-0.6B output). Do not introduce other dimensions without an ADR — mixed dimensions break batch embedding flows.
- **HNSW indexes are mandatory** on every vector column used for similarity search. Add via raw SQL migration, not via `@@index` in `schema.prisma` (Prisma 5 doesn't natively support HNSW yet):
  ```sql
  CREATE INDEX CONCURRENTLY <table>_<col>_hnsw_idx
    ON <table> USING hnsw (<col> vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
  ```
- Use `vector_cosine_ops` unless you have a specific reason for L2 / inner-product. Cosine matches the embedding model's training objective.

## Audit log (PM1_ERD §3.13)

- The `audit_log` table is **HMAC-SHA256 chained**: each row stores `prev_hash` (the previous row's `this_hash`) and `this_hash = HMAC(BETTERAUTH_SECRET, prev_hash || row_payload_json)`.
- Genesis row has `prev_hash = '0' * 64`.
- The chain is **append-only**. Migrations must never `UPDATE` or `DELETE` from `audit_log`. Verification job (post-PM1) will detect tampering by replaying the chain.
- A unique index on `(workspace_id, created_at)` keeps the F28 Audit screen fast.

## Migrations

- Migrations are **append-only**. Once a migration has landed on `main`, it is immutable — never edit a committed migration file. If you need to fix a mistake, write a new corrective migration.
- Schema changes that alter request/response shape **must** be paired with a Zod schema update in `packages/shared` in the same PR. CI does not enforce this — peer review will.
- Use `prisma migrate dev --name <descriptive_snake_case>` locally; commit the generated migration directory and the updated `schema.prisma`.
- Production migrations run via `prisma migrate deploy` from the Render build step (MS0-T011).

## Naming

- Table names: `snake_case`, plural (`test_cases`, not `TestCase`).
- Column names: `snake_case`. Booleans prefixed `is_` or `has_`. Timestamps suffixed `_at`.
- Foreign keys: `<referenced_table_singular>_id` (`workspace_id`, `user_id`).
- Enums live in Postgres (`CREATE TYPE`) and are mirrored in `schema.prisma` enums — Prisma generates the TypeScript union.

## Backups (MS0-T018)

- Weekly `pg_dump` cron via `.github/workflows/` writes a timestamped `.sql.gz` to Cloudflare R2.
- Restore drill is documented in `docs/runbooks/db-restore.md` (TBD); test it manually each quarter.

## What NOT to add

- ❌ Neo4j, Graphiti — no graph DB in PM1 (cost gate).
- ❌ `pgvectorscale` — paid Timescale extension.
- ❌ Other vector DBs (Pinecone, Weaviate, Qdrant) — pgvector only.
