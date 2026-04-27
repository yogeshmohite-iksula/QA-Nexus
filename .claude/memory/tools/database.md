# Database — Postgres 15 + pgvector on Neon free

Append new entries at the top with `[YYYY-MM-DD]: decision/gotcha — rationale` format.

## Provider

- **Neon free tier** (0.5 GB cap, scale-to-zero on idle).
- Region: closest to India (auto-select at provisioning, MS0-T012).
- Connection: `$NEON_DATABASE_URL` in Render env vars + local `.env` (gitignored).
- **Cost:** $0/month while we stay under 0.5 GB. Weekly `pg_dump` backup to R2 (MS0-T018).

## Stack

- **PostgreSQL 15** — locked. NOT 14 or 16.
- **pgvector** extension — `CREATE EXTENSION pgvector;` after provisioning.
- **HNSW indexes** on vector columns — created via raw-SQL migration alongside Prisma schema migrations.
- **NOT pgvectorscale** — banned (paid tier of Timescale; we use vanilla pgvector).

## Migration tool

- **Prisma 5** for schema migrations.
- Workflow: `prisma migrate dev --name <change-name>` locally, `prisma migrate deploy` in CI.
- Raw-SQL migrations for HNSW indexes (Prisma doesn't natively understand HNSW yet) — `prisma/migrations/<timestamp>_add_hnsw_indexes/migration.sql`.

## Schema

- 21 tables: TB-001 through TB-021. Inventory in `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3.
- TB-019 / TB-020 / TB-021 are LLM provider configuration tables (provider keys, agent-model assignments, prompt templates).
- Schema lands in MS0-T020 (queued).

## Connection MCP

- `claude mcp add postgres ... -- ... "$NEON_DATABASE_URL"` — **deferred** until MS0-T012 (Neon URL not yet provisioned). Once added, Claude can introspect schema and run read-only queries.

## Empty: gotchas

Stub. Common Postgres + Prisma + pgvector gotchas (e.g., `Decimal` precision, `Json` field default, `@@unique` vs `@unique`) will land here as we hit them.
