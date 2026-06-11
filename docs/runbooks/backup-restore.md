# Runbook — Database backup + restore

> **Audience:** Yogesh (Admin) · **Scope:** Neon pg_dump backups stored on R2 · **Risk:** HIGH for restore (data loss possible)

## Architecture

- **Backup cron:** `.github/workflows/weekly-backup.yml` runs `pg_dump` every Sunday 02:30 IST via GitHub Actions free tier.
- **Backup destination:** Cloudflare R2 bucket `qa-nexus-backups` (free tier 10 GB).
- **Retention:** weekly cadence; manual prune after 8 weeks (free tier headroom).
- **Compression:** `pg_dump --format=custom --compress=9` → `.dump` files; typically 5-30 MB at pilot scale.
- **Encryption:** R2 server-side encryption (free tier default). No client-side encryption layer.

## §1 — Verify last successful backup ran

```bash
gh run list --workflow="weekly-backup.yml" --limit 5
```

Each row shows status (`success`/`failure`) + timestamp. The most recent should be from the last Sunday 02:30 IST.

If the latest run shows `failure`:

```bash
gh run view <run-id> --log
```

Common failure modes:

- `pg_dump: error: connection failed` → Neon free tier scale-to-zero; the connection timeout during cold-start. **Fix:** add a pre-`pg_dump` warmup query in the workflow.
- `403 Forbidden` from R2 upload → `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` GitHub Secret rotated without updating the workflow secrets. **Fix:** re-add via repo Settings → Secrets.
- `quota exceeded` → R2 bucket >10 GB. **Fix:** manually delete oldest backups via Cloudflare dashboard.

## §2 — List available backups on R2

```bash
aws s3 ls s3://qa-nexus-backups/ \
  --endpoint-url "$R2_ENDPOINT" \
  --human-readable
```

You should see files like:

```
2026-05-04T02:30:00Z  18 MiB qa-nexus-2026-05-04.dump
2026-05-11T02:30:00Z  19 MiB qa-nexus-2026-05-11.dump
2026-05-18T02:30:00Z  21 MiB qa-nexus-2026-05-18.dump
2026-05-25T02:30:00Z  23 MiB qa-nexus-2026-05-25.dump
2026-06-01T02:30:00Z  24 MiB qa-nexus-2026-06-01.dump
```

If no recent file exists → §1 first. Don't attempt a restore from a stale backup without Yogesh approval.

## §3 — Restore procedure

> ⚠️ **DESTRUCTIVE OPERATION.** This overwrites the pilot DB. Hard Rule 11 — Yogesh approval required.

### Pre-flight checklist

- [ ] Confirm with Yogesh: which backup file? (newest known-good, typically)
- [ ] Confirm: pilot users will lose all data since that backup. How many minutes?
- [ ] Confirm: scheduled window (outside pilot operating hours 10:00-22:00 IST preferred)
- [ ] **Take an emergency backup of the current state** to preserve forensic evidence:
  ```bash
  pg_dump "$DATABASE_URL" --format=custom --compress=9 > pre-restore-$(date -u +%Y%m%dT%H%M%SZ).dump
  ```
- [ ] **Notify pilot team** via email channel B with restore start time + expected duration.

### Restore steps

1. **Suspend Render API** (Render Dashboard → Service → Suspend) to prevent in-flight writes.
2. **Download the target backup:**
   ```bash
   aws s3 cp s3://qa-nexus-backups/qa-nexus-2026-MM-DD.dump . \
     --endpoint-url "$R2_ENDPOINT"
   ```
3. **Decision — restore in place vs. new Neon branch:**

   **Option A — New Neon branch (preferred, reversible):**
   - Neon Dashboard → Branches → Create branch from current main.
   - Note the new branch's connection string.
   - Restore into the new branch:
     ```bash
     pg_restore --clean --if-exists --no-owner \
       --dbname="$NEW_BRANCH_DATABASE_URL" \
       qa-nexus-2026-MM-DD.dump
     ```
   - Update Render env vars `DATABASE_URL` + `DIRECT_URL` to the new branch.
   - If something goes wrong, revert env vars to point back to the original branch. Original data is intact.

   **Option B — In-place on current main (destructive, last resort):**
   - Run on the live pilot DB. Old data is gone unless §3.4 emergency backup was taken.
     ```bash
     pg_restore --clean --if-exists --no-owner \
       --dbname="$DATABASE_URL" \
       qa-nexus-2026-MM-DD.dump
     ```

4. **Run Prisma migrations** to ensure schema is current (the backup may be older than the latest migration):
   ```bash
   cd apps/api
   pnpm prisma migrate deploy
   ```
5. **Resume Render API.** Verify `curl https://qa-nexus-api.onrender.com/health` returns 200.
6. **Verify audit log chain integrity:**
   ```bash
   pnpm verify:audit
   ```
   Per PM1_ERD §3.13, the HMAC-SHA256 chain must validate. If it fails after restore, the audit-log table was restored to a state where the most recent rows reference hashes that haven't been recomputed yet — this is expected for the first new row after restore, but the chain from that row forward must be intact.
7. **Spot-check via UI:** sign in, navigate to F08 Home, F14 Requirements, F21 Defects — verify data appears as expected for the chosen backup timestamp.
8. **Announce restoration complete** to pilot team via email.

## §4 — Test the restore procedure (drill)

**Recommended cadence:** monthly (first Sunday of each month, after the regular backup runs).

1. Pick the latest backup file.
2. Create a fresh Neon branch (separate from pilot main).
3. Run the restore procedure into that branch.
4. Verify the dump restored cleanly (row counts match, audit chain validates).
5. Delete the test branch.
6. Log result in `docs/observability/backup-drill-log.md` (create if absent).

Why drill: a backup you've never restored is not a backup. The Sat audit AMBER flag for "backup restore procedure undocumented" is closed by this runbook; "backup restore procedure untested" is the next AMBER → close via the monthly drill cadence.

## §5 — Manual backup outside the cron schedule

Use cases: before a risky migration, before bulk data import, before user provisions a new pilot team.

```bash
pg_dump "$DATABASE_URL" --format=custom --compress=9 \
  | aws s3 cp - "s3://qa-nexus-backups/qa-nexus-manual-$(date -u +%Y%m%dT%H%M%SZ).dump" \
    --endpoint-url "$R2_ENDPOINT"
```

Tag manual backups with a descriptive suffix in the filename (`-pre-m6-migration`, `-before-bulk-import`) for later identification.

## §6 — Free-tier budget watchpoint

- R2 free tier: 10 GB storage + 1 M Class A ops/month + 10 M Class B ops/month.
- Pilot scale: ~25 MB/week × 52 weeks ≈ 1.3 GB/year. Comfortable headroom.
- Watch for unexpected growth — e.g., embeddings expansion in M6 could push backup size up.

## Cross-references

- `.github/workflows/weekly-backup.yml` — the cron workflow
- `docs/runbooks/db-migration-rollback.md` — sibling runbook; Path B references this one
- `docs/runbooks/env-reset-secret-rotation.md` — sibling; covers `DATABASE_URL` rotation
- `docs/architecture/adr-005-r2-storage.md` — R2 architecture
- PM1_ERD §3.13 — audit log chain integrity
- Hard Rule 1 — $0/month gate; backups stay on R2 free tier
- Hard Rule 11 — Yogesh approval for destructive restore

_Authored Sun Day-5 2026-06-07 PM session as part of MAIN Bucket 3 (4 missing runbooks). Closes Sat audit AMBER finding for "backup restore procedure undocumented."_
