# Runbook — Database migration rollback

> **Audience:** Yogesh + BE+1 on-call · **Scope:** Neon Postgres (pilot + test branches) · **Risk:** HIGH (data loss possible)

## When to use this runbook

- A Prisma migration deployed to Neon causes runtime errors after a Render deploy.
- A `prisma migrate deploy` against the pilot branch produces an unintended schema change.
- A raw SQL migration (`apps/api/prisma/raw/migrations/*.sql`) was applied and needs reversal.

**Pre-check:** if the latest migration is <60 min old AND the pilot has not run user-data writes since, prefer a forward-fix migration over rollback. Migration files are append-only in Prisma's mental model — a "rollback" is really a new migration that undoes the previous one.

## Architecture quick-ref

- **ORM migrations:** `apps/api/prisma/migrations/` — Prisma-managed (timestamped folders).
  - Current state (Day-29 snapshot): `20260427135123_init_pm1_schema` → `20260520120000_jira_sync_sprint_columns` → `20260521090000_reports_backend_schema`.
- **Raw SQL migrations:** `apps/api/prisma/raw/migrations/` — hand-written (numbered `0002_`, `0003_`, `0004_`). Applied via `pnpm prisma:apply-raw:NNNN`.
- **Pilot branch:** Neon `main` DB. **Test branch:** Neon `ep-blue-star` (used by `/admin/nfr/*` probes — never touched by pilot writes).
- **Backup:** weekly `pg_dump` cron via `.github/workflows/weekly-backup.yml`.

## Path A — Forward-fix migration (preferred)

Use when: the bad migration is recent (<60 min) AND no user-data writes have occurred since.

1. **Identify the bad migration:**
   ```bash
   cd apps/api
   pnpm prisma migrate status
   ```
2. **Author a corrective migration** that reverses the bad change in the schema:
   ```bash
   pnpm prisma migrate dev --name fix_<original-name>_rollback --create-only
   ```
3. **Hand-edit** the generated SQL under `apps/api/prisma/migrations/<timestamp>_fix_<name>_rollback/migration.sql` to express the inverse change.
4. **Test on `ep-blue-star` test branch first:**
   ```bash
   DATABASE_URL="$TEST_DATABASE_URL" DIRECT_URL="$TEST_DATABASE_DIRECT_URL" pnpm prisma migrate deploy
   ```
5. **Verify** the corrective migration produces the expected schema state.
6. **Apply to pilot main branch:**
   ```bash
   pnpm prisma migrate deploy
   ```
7. **Commit + push** the new migration file. Render auto-deploys.
8. **Verify** API endpoints work on the live pilot.

## Path B — Restore from backup (last resort)

Use when: data corruption AND user-data writes have occurred since the bad migration.

**Pre-flight (Yogesh decision required per Hard Rule 11):**

- How many minutes of user data will be lost? (Last backup age, typically up to 7 days for free tier weekly backup.)
- Is the pilot team OK with the data loss window?
- Should we delay the rollback to a maintenance window (e.g., next 10:00 PM IST quiet hour)?

If approved:

1. **Take an emergency manual backup of the current corrupt state** (preserves forensic evidence + last-chance restore if rollback recovery overshoots):
   ```bash
   pg_dump "$DATABASE_URL" > backup-corrupt-$(date -u +%Y%m%dT%H%M%SZ).sql
   ```
   _(Note: Bash's `Date` is fine here; no Workflow constraint.)_
2. **Identify the target backup** from R2 (or Neon's own backup retention if available on free tier):
   ```bash
   aws s3 ls s3://qa-nexus-backups/ --endpoint-url "$R2_ENDPOINT"
   ```
3. **Download the chosen backup:**
   ```bash
   aws s3 cp s3://qa-nexus-backups/qa-nexus-2026-MM-DDTHHMMSSZ.sql.gz . --endpoint-url "$R2_ENDPOINT"
   gunzip qa-nexus-*.sql.gz
   ```
4. **Stop the Render API** (Render dashboard → Service → Suspend) to prevent in-flight writes during restore.
5. **Drop + recreate the pilot DB** via Neon dashboard (Branches → create a new branch from pre-bad-migration timestamp if Neon retention allows — preferred over `DROP DATABASE`).
6. **If branch-rollback not available:** create a fresh Neon project, restore the backup:
   ```bash
   psql "$DATABASE_URL_OF_FRESH_DB" < qa-nexus-2026-MM-DDTHHMMSSZ.sql
   ```
7. **Update Render `DATABASE_URL` + `DIRECT_URL`** to the new branch/project.
8. **Resume the Render API** + verify endpoints.
9. **Announce data-loss window** to pilot team via email (`yogesh.mohite@iksula.com`).

## Path C — Raw SQL migration reversal

Use when: a raw SQL migration (`apps/api/prisma/raw/migrations/NNNN_*.sql`) was applied.

1. **Read the bad raw migration** to understand what it did.
2. **Author a reverse raw SQL file** at `apps/api/prisma/raw/migrations/NNNN_reverse_<bad-name>.sql`.
3. **Test on `ep-blue-star`** by editing `apps/api/package.json` to add a `prisma:apply-raw:NNNN-reverse` script if helpful, then run it with `DATABASE_URL="$TEST_DATABASE_URL"`.
4. **Apply to pilot main:**
   ```bash
   pnpm prisma:apply-raw:NNNN-reverse
   ```
5. **Commit + push.**

## Post-rollback verification

- [ ] `pnpm prisma migrate status` returns "Database schema is up to date!"
- [ ] `curl https://qa-nexus-api.onrender.com/health` returns 200
- [ ] One canary user write succeeds (e.g., sign in + post a defect)
- [ ] Audit log chain integrity preserved: `pnpm verify:audit`
- [ ] No new errors in Better Stack logs for ~15 min post-rollback

## Cross-references

- `apps/api/prisma/schema.prisma` — current schema
- `.github/workflows/weekly-backup.yml` — backup cron
- `docs/runbooks/backup-restore.md` — sibling runbook for backup restoration mechanics
- `docs/runbooks/env-reset-secret-rotation.md` — sibling for `DATABASE_URL` env var changes
- `docs/architecture/adr-002-prisma-raw-split.md` — why Prisma + raw SQL coexist
- Hard Rule 11 — Yogesh approval gate on Path B
- PM1_ERD §3.13 — audit log chain integrity must be preserved through any rollback

_Authored Sun Day-5 2026-06-07 PM session as part of MAIN Bucket 3 (4 missing runbooks). Pairs with backup-restore + magic-link-debug + env-reset runbooks._
