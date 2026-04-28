# CLAUDE_DECISIONS — architectural decisions log

> Per-decision summary tied to ADRs. Loaded by `inject-memory.sh` when Claude is about to edit related code paths. Append new entries at the top with `[YYYY-MM-DD] [ADR-###]` header. Cross-link to the full ADR in `docs/architecture/`.

---

## [2026-04-28] [ADR-002] Prisma migrations vs `prisma/raw/` split

**Decision:** Two-directory split. `apps/api/prisma/migrations/<ts>_*/` for Prisma-managed schema (auto-generated). `apps/api/prisma/raw/*.sql` for hand-written infra (RLS, HNSW, extensions, triggers).

**Rules:**

- Raw files must be **idempotent** (`IF NOT EXISTS`, `CREATE OR REPLACE`, etc.).
- One file per logical concern; never append to existing raw files for non-trivial changes.
- Reference Prisma-managed tables only AFTER they exist (apply order: migrate-deploy first, db:apply-raw second).
- Apply raw files via `pnpm db:apply-raw` (manual, with human approval gate). No silent CI automation of RLS changes yet.

**Why this matters when editing `apps/api/prisma/**`:** if you're adding RLS, HNSW, an extension, or a trigger, it goes in `prisma/raw/`, NOT in a new Prisma migration. Use `IF NOT EXISTS`everywhere. New file per concern (e.g.,`betterauth_rls.sql`for MS0-T021, not appended to`init_rls_hnsw.sql`).

**Full ADR:** `docs/architecture/adr-002-prisma-raw-split.md`

---

## [2026-04-26] [implicit, not yet ADR-001] Postgres + Prisma over alternatives

**Decision:** Postgres 15 + pgvector on Neon free tier; Prisma 5 as the only ORM. Locked at PM1_ERD §1.1.

**Rejected alternatives:** MongoDB (no relational integrity for the 21-table model), Sequelize/TypeORM/MikroORM/Drizzle (none of them have the same Prisma migrate-dev shadow-DB validation that catches destructive migrations at author time), Supabase (would force their auth + RLS model rather than BetterAuth + our hand-written RLS).

**Why this matters when editing `apps/api/**`:** never reach for a different ORM library or "just write raw SQL queries." All DB access goes through `PrismaClient`. The `enforce-pm1-stack.sh` hook will block adding the rejected libraries.

**Full ADR:** ADR-001 not yet written; implicit in `CLAUDE.md` § "Locked tech stack" + PM1_ERD §1.1.
