-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_users_disabled_at.sql — M1 user lifecycle columns
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Spec: PM1_ERD §3.5 (User lifecycle) + Day-6 PM brief Block 1.
--
-- WHY:
--   M1's PATCH /api/users/:id/status endpoint requires a persisted
--   "disabled" state — Admin disables a user → BetterAuth sessions
--   purged → user can no longer authenticate even via fresh magic-link.
--   Without a column, status would be derived from activatedAt only,
--   which can't distinguish "disabled" from "still invited".
--
--   Also adds role_changed_at so the F27 Admin UI can surface
--   "role last changed: 2 days ago" without joining audit_log.
--
-- SAFETY:
--   - Both columns NULLABLE — no data backfill needed.
--   - No index added: F27 queries are workspace-scoped (small N for
--     the 8-user pilot). HNSW / btree are per-table-row reads, not
--     per-status filters.
--   - Idempotent: ADD COLUMN IF NOT EXISTS guards re-runs.
--
-- INVOCATION:
--   pnpm --filter @qa-nexus/api prisma:apply-raw:0003
--   (See `apps/api/package.json` scripts.)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS role_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN users.disabled_at IS
  'M1 (Day-6) — Admin-set timestamp; non-NULL means disabled + sessions revoked.';
COMMENT ON COLUMN users.role_changed_at IS
  'M1 (Day-6) — Stamped on PATCH /api/users/:id/role. Surfaces in F27.';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-APPLY VERIFICATION (run manually):
--   SELECT column_name, data_type, is_nullable
--     FROM information_schema.columns
--     WHERE table_name = 'users' AND column_name IN ('disabled_at', 'role_changed_at');
--   -- Expected: 2 rows, both 'timestamp with time zone', is_nullable='YES'.
-- ─────────────────────────────────────────────────────────────────────────────
