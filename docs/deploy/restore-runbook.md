# Postgres restore-from-backup runbook (T018 disaster-recovery side)

**Owner:** Yogesh + on-call BE engineer.
**Target:** Restore a `qa-nexus-pm1` Neon DB from any weekly backup snapshot stored in R2 bucket `qa-nexus-backups-pm1`.
**Source backups:** weekly pg_dump uploads from `.github/workflows/weekly-backup.yml` — naming `postgres/YYYY-MM-DD.sql.gz`.
**RTO target:** 30 min from "decision to restore" to "API serving on restored DB".
**RPO target:** ≤ 7 days (worst case = restore happens on Saturday after Sunday's backup, so we lose ~6 days of mutations).

---

## When to restore

| Scenario                                                                     | Action                                                                 |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Production DB corruption / accidental DROP TABLE / wrong UPDATE on prod      | Restore latest backup → fresh Neon DB → swap `DATABASE_URL` in Render. |
| Need to debug "what did the schema look like 3 weeks ago"                    | Restore to a separate scratch DB; don't touch prod.                    |
| Migration mistake that's reversible (no data loss)                           | DON'T restore — `prisma migrate resolve` + manual fixup is faster.     |
| Suspected security incident (data exfiltration, ransomware-style encryption) | Restore to a fresh DB → **rotate every credential first** → swap.      |

---

## Prerequisites — assumed already done

- [ ] Yogesh provisioned R2 per `r2-runbook.md` (T013 dashboard work).
- [ ] Yogesh created a SECOND R2 bucket `qa-nexus-backups-pm1` for backups (separate from `qa-nexus-evidence-pm1` for user uploads).
- [ ] GitHub repo secrets are set: `NEON_DATABASE_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`.
- [ ] At least one weekly backup has succeeded (check `Actions → Weekly Backup → most recent green run`).

---

## Step 1 — Decide which backup to restore

### Option A: latest backup

Most common. Browse R2 bucket → pick `postgres/<latest-date>.sql.gz`.

```bash
# From local with AWS CLI configured for R2:
aws s3 ls s3://qa-nexus-backups-pm1/postgres/ \
  --endpoint-url "https://<account-id>.r2.cloudflarestorage.com" \
  --recursive | tail -10
```

### Option B: point-in-time recovery (NOT supported on Neon free tier)

Neon's paid plan has 7-day point-in-time recovery built in. Free tier does NOT. Our `weekly-backup.yml` is the only PITR mechanism for PM1. If you need to restore to "Tuesday 14:00", you cannot — only Sunday-of-that-week is available. Pre-GA we'll evaluate Neon Pro ($19/mo) once Iksula approves the cost.

---

## Step 2 — Prepare the target Neon DB

### Option A (recommended): restore to a NEW Neon DB, swap on success

This is non-destructive. Old DB stays available during restore for verification.

1. Sign in to https://console.neon.tech.
2. Project `qa-nexus-pm1` → **Branches** → **Create Branch**.
3. Branch name: `restore-<YYYY-MM-DD>` (matches backup date for traceability).
4. Parent: **(empty)** — explicitly NOT branching from current state. We want a blank target.
5. Click Create. Note the new branch's connection string (looks like `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/qa_nexus_pm1?sslmode=require`).

### Option B (faster, destructive): restore in-place to current DB

Only use when the current DB is so corrupted it's unusable. Effectively `DROP DATABASE` + recreate. **Not recoverable** if you change your mind.

```bash
# Connect with DIRECT_URL (not pooled) — DROP/CREATE need exclusive lock
psql "$NEON_DIRECT_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## Step 3 — Download the backup

```bash
DATE=2026-04-29  # or whatever
mkdir -p /tmp/restore
aws s3 cp \
  s3://qa-nexus-backups-pm1/postgres/${DATE}.sql.gz \
  /tmp/restore/${DATE}.sql.gz \
  --endpoint-url "https://<account-id>.r2.cloudflarestorage.com"

# Verify integrity
gunzip -t /tmp/restore/${DATE}.sql.gz && echo "✓ gzip integrity OK"

# Decompress
gunzip -k /tmp/restore/${DATE}.sql.gz
ls -lh /tmp/restore/${DATE}.sql
```

---

## Step 4 — Restore

```bash
# Set TARGET_URL to either:
#   - new Neon branch URL (Option A above)
#   - existing DIRECT_URL (Option B, after DROP SCHEMA)
TARGET_URL='postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/qa_nexus_pm1?sslmode=require'

# Restore (use psql, not pg_restore — our backups are plain-format)
psql "$TARGET_URL" < /tmp/restore/${DATE}.sql

# Watch for errors. Typical successful output ends with:
#   COMMIT
#   <empty>
# If you see "ERROR: relation already exists" → DB wasn't blank. STOP, drop schema, retry.
```

---

## Step 5 — Re-apply prisma/raw/ infra (per ADR-002)

The pg_dump captures table schema + data, but it does NOT capture the RLS policies, HNSW indexes, or pgvector extension config from `apps/api/prisma/raw/init_rls_hnsw.sql`. **Apply the raw infra after restore:**

```bash
# From a checkout of QA-Nexus repo:
DATABASE_URL="$TARGET_URL" DIRECT_URL="$TARGET_URL" pnpm db:apply-raw
```

Why this is necessary: ADR-002 §"Re-apply semantics" — the raw files are idempotent + tracked separately from Prisma. Restore = fresh DB = needs raw re-apply.

---

## Step 6 — Verify the restore

```bash
# Row counts (should match the backup's source DB at backup time)
psql "$TARGET_URL" -c "SELECT 'users' AS tbl, COUNT(*) FROM users
UNION ALL SELECT 'workspaces', COUNT(*) FROM workspaces
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log;"

# Expected for PM1 pilot baseline (T020 seed):
#   users: 8 (Akshay + Yogesh + 6 QA Engineers)
#   workspaces: 1
#   projects: 5 (RET, CART, PAY, AUTH, OPS)
#   audit_log: depends on activity since seed

# RLS sanity check — should reject queries without workspace context
psql "$TARGET_URL" -c "SET app.workspace_id = ''; SELECT * FROM users LIMIT 1;"
# Expected: 0 rows (RLS hides everything when workspace context is empty)

# pgvector + HNSW present
psql "$TARGET_URL" -c "SELECT extname FROM pg_extension WHERE extname='vector';"
# Expected: vector

psql "$TARGET_URL" -c "
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE indexdef ILIKE '%hnsw%';
"
# Expected: ≥1 row per embedding column (test_cases, kb_chunks)

# Audit-log chain integrity (last row's prev_hash should match the previous row's this_hash)
psql "$TARGET_URL" -c "
  SELECT id, action, prev_hash, this_hash
  FROM audit_log
  ORDER BY created_at DESC
  LIMIT 5;
"
# Manual chain verification — each row's prev_hash must equal the next row's this_hash
```

---

## Step 7 — Swap Render's DATABASE_URL (Option A only)

Once verification (Step 6) passes:

1. Render dashboard → `qa-nexus-api` → **Environment**.
2. Update `DATABASE_URL` and `DIRECT_URL` to the new branch's connection strings.
3. **Manual Deploy → Deploy latest commit** (env-var changes don't auto-restart — must trigger a deploy).
4. Wait ~3 min for Render to redeploy.
5. Curl `https://qa-nexus-api.onrender.com/health` — expect `200` with `db.up=true`.
6. Smoke-test sign-in: hit `/auth/sign-in` with Yogesh's email; verify magic-link arrives + clicks through.

---

## Step 8 — Decommission the old DB

After 24h of running on the restored DB without issue:

1. Neon dashboard → old branch (e.g., `main` or whatever was the prod branch pre-restore).
2. Right-click → **Delete branch**.
3. Confirm the deletion (typing the branch name).

**Don't skip this.** Neon's storage limit (0.5 GB on free) counts ALL branches. Leaving the old + restored side-by-side will exhaust quota faster.

---

## Step 9 — Post-incident — write up the restore

1. Create a file `docs/incidents/<YYYY-MM-DD>-pg-restore.md` with:
   - What triggered the restore (corruption / mistake / security event)
   - Which backup was used (key + size + age)
   - How long the restore took (Step 1 → Step 7)
   - What's now lost (mutations between backup time and restore start)
   - Did anything break in Step 6 verification?
   - What tooling gap surfaced? (e.g., "wished pg_dump captured RLS")
2. Link from `docs/SECURITY.md` § "Incident response history".

---

## Common errors + fixes

| Symptom                                                          | Likely cause                                                     | Fix                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `psql: error: connection to server failed`                       | Wrong URL / Neon DB suspended (free tier auto-suspends idle DBs) | Resume DB in Neon dashboard. Get fresh URL.                                                                                                                                                                                                                                         |
| `ERROR: relation "users" already exists`                         | Target DB not blank (restore on top of existing schema)          | Step 2 Option B: `DROP SCHEMA public CASCADE` first.                                                                                                                                                                                                                                |
| `pg_restore: error: input file appears to be a text format dump` | Used pg_restore instead of psql                                  | Our backups are `--format=plain`. Use `psql < file.sql` for restore, not `pg_restore`.                                                                                                                                                                                              |
| HNSW indexes missing after restore                               | Forgot Step 5 (`pnpm db:apply-raw`)                              | Run Step 5. Idempotent — safe even if Prisma migrations re-applied first.                                                                                                                                                                                                           |
| RLS allows queries without workspace context                     | Same — Step 5 not applied                                        | Run Step 5.                                                                                                                                                                                                                                                                         |
| Embedding column type mismatch (vector(1024) vs Float[])         | Restore from very old backup pre-T020 schema                     | Check backup date; if older than `a6644c1` (Day 1 evening), re-run `prisma migrate deploy` AFTER `db:apply-raw`. Order matters: ADR-002 says migrate FIRST, raw SECOND. For RESTORE, we restore plain dump (which has the schema baked in), then apply raw to wire RLS+HNSW on top. |

---

## Cost confirmation

R2 storage usage from backups:

- 1 backup/week × 4 weeks/month × ~3 MB gzipped = **~12 MB/month**.
- R2 free tier: **10 GB storage** + **1M Class A ops** + **10M Class B ops**.
- Backup uses **0.0001%** of storage budget, **0.0004%** of ops budget. Effectively free forever at PM1 scale.
- After 90 days × 4 backups/month = ~36 backups × 3 MB = ~108 MB. Still 0.001% of free quota. Lifecycle pruning (delete > 90 days) is a M1 nice-to-have, not a quota necessity.

---

## Cross-references

- `.github/workflows/weekly-backup.yml` — the upstream backup job
- `docs/architecture/adr-002-prisma-raw-split.md` — explains why Step 5 exists
- `docs/architecture/adr-005-r2-storage.md` — why R2 (presigned-URL pattern is for uploads; backups use plain S3-API PUT via aws-cli)
- `docs/deploy/r2-runbook.md` — initial bucket provisioning (T013)
- `apps/api/prisma/raw/init_rls_hnsw.sql` — the RLS + HNSW + pgvector definitions Step 5 re-applies
- `IKSULA_CONTEXT.md` — the 8-user / 5-project seed shape Step 6 verifies
- `PM1_ERD §M0_v8` — task T018 spec
