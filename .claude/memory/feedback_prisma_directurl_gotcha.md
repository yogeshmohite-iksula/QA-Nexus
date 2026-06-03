# feedback — `prisma migrate` uses `directUrl`, NOT `DATABASE_URL` (Day-2 2026-06-03)

> **BINDING gotcha — near-miss caught by the 12th reality-check.** Almost ran a
> migration against the **pilot** Neon DB while intending the test branch.

## The trap

`apps/api/prisma/schema.prisma` datasource:

```prisma
datasource db {
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // ← migrations use THIS
}
```

`prisma migrate deploy` / `migrate dev` / `migrate reset` connect via **`directUrl`**
(`env("DIRECT_URL")`), **not** `url`/`DATABASE_URL`. In QA Nexus, `DIRECT_URL` in
`apps/api/.env` points at the **pilot** DB (`ep-blue-silence…`, same host as
`DATABASE_URL` — "DIRECT_URL = DATABASE_URL is acceptable for the single-dyno pilot"
per the `.env.example`).

**Consequence:** the intuitive command

```
DATABASE_URL="$TEST_DATABASE_DIRECT_URL" prisma migrate deploy
```

**silently runs migrations against the PILOT**, because Prisma ignores the
`DATABASE_URL` override for migrations and uses `DIRECT_URL` (= pilot). The Datasource
banner confirmed `ep-blue-silence` (pilot), not the intended `ep-blue-star` (test).

## The correct form (override BOTH)

```
DIRECT_URL="$TEST_DATABASE_DIRECT_URL" DATABASE_URL="$TEST_DATABASE_URL" \
  pnpm --filter @qa-nexus/api exec prisma migrate deploy
```

**Always check the Datasource banner** (`… at "ep-blue-star-…"`) before trusting the
target. DML (`seed`, queries) is unaffected — those use the connection URL you pass
(pooler is fine); only **migration commands** consult `directUrl`.

## Day-2 fallout (no harm)

- The mis-targeted `migrate deploy` hit pilot but was **inert** — pilot already had the
  schema (advanced via `db push`; its `_prisma_migrations` ledger lags at
  `add_betterauth_tables`), and the additive migrations changed nothing. Yogesh
  confirmed pilot integrity (project=5, testCase≈1284, requirement≈142, ledger
  unchanged).
- The **test branch** had base schema + an **empty migration ledger**, so `migrate
deploy` (even correctly targeted) failed `P3018: type "user_role" already exists`.
  Fixed **non-destructively** with `prisma db push` (additive sync — no ledger, no
  `migrate reset` drop) → M3 columns landed → seed succeeded (1/1/1/1/3).

## Rules to add

1. `.claude/rules/database.md` — "migration commands use `directUrl`; to target a
   non-default DB you MUST override `DIRECT_URL` (overriding `DATABASE_URL` is not
   enough). Always read the Datasource banner."
2. For a fixture/test DB with base-schema-but-empty-ledger, prefer **`db push`**
   (additive, non-destructive) over `migrate reset` (destructive).
3. Any `prisma migrate *` against a non-pilot DB → verify the Datasource banner shows
   the intended endpoint before proceeding.

## Cross-references

- Day-2 Wed pilot-push · the 12th reality-check (halt at the boundary before a pilot
  migration) · `docs/eod-reports/2026-06-03-day-2-wed-be.md` · `apps/api/.env.example`
  (DIRECT_URL note).

---

_Entry Day-2 2026-06-03 (BE+1). Pilot unharmed; failure mode is real → codify._
