-- QA Nexus PM1 — Day-24 P0 ADR-021 Reports backend schema.
--
-- Three artifacts:
--   1. report_aggregate — pre-computed tier-1 results per ADR-021 §2.
--      `is_stale` BOOLEAN supports Amendment B mark-stale/lazy-refresh.
--   2. report_template — saved user configs (per ADR-021 §1 templates).
--   3. sprint_current(project_id) — PL/pgSQL helper per ADR-021 §4.
--
-- SEQUENCING (critical):
--   This migration MUST land AFTER `20260520120000_jira_sync_sprint_columns`
--   (PR #189). sprint_current() reads jira_sprints.state + jira_sprints.start_date
--   — both columns originate in #189. Branch lineage: this migration's branch
--   (`feat/api-reports-backend-impl`) was cut from PR #189's head commit
--   `f1f2b30` so the dependency is satisfied even if #189 merges after this
--   PR is reviewed.
--
-- COST GATE (Hard Rule 1):
--   - 2 new tables (~50 active rows at pilot scale after cleanup cron)
--   - 3 partial indexes (~50KB index footprint)
--   - 1 STABLE SQL function (in-process, no extra storage)
--   - Estimated Neon impact <0.5 CU-hr/day. Within 100 CU-hr ceiling.

-- ============================================================
-- 1. report_aggregate — tier-1 pre-computed dashboard cache
-- ============================================================
CREATE TABLE IF NOT EXISTS "report_aggregate" (
  "id"              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id"    UUID         NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "project_id"      UUID         NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "report_kind"     TEXT         NOT NULL CHECK ("report_kind" IN (
                      'cycle_pass_rate',
                      'defect_age',
                      'agent_cost',
                      'sprint_progress',
                      'test_coverage',
                      'requirement_coverage'
                    )),
  "time_range_key"  TEXT         NOT NULL,
  -- Normalized canonical key for UPSERT — e.g. 'sprint', '7d', '30d', '90d',
  -- or 'custom:2026-04-01T00:00:00Z..2026-04-30T23:59:59Z'. Computed by the
  -- service from the structured time_range JSONB on insert.
  "time_range"      JSONB        NOT NULL,
  -- time_range shape: { kind: 'sprint'|'7d'|'30d'|'90d'|'custom', start?: ISO, end?: ISO }
  "aggregated_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "data"            JSONB        NOT NULL,
  -- data shape per kind (validated by Zod in service layer):
  --   cycle_pass_rate: { series: [{ts, pass_rate}], kpi: { current, avg_30d } }
  --   defect_age:      { buckets: [{age_bin, count}], median_age_days }
  --   agent_cost:      { by_provider: {groq, gemini, ...}, total_usd, total_tokens }
  --   sprint_progress: { sprint_id, points_completed, points_remaining, velocity }
  --   test_coverage:   { total_cases, executed, pass_rate, gaps[] }
  --   requirement_coverage: { total_reqs, covered, gaps[] }
  "is_stale"        BOOLEAN      NOT NULL DEFAULT false,
  -- ADR-021 Amendment B — sentinel for mark-stale/lazy-refresh pattern.
  -- Event-triggered invalidation flips is_stale=true; next read OR the
  -- 02:30 IST cron recomputes + flips it back to false.
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- UNIQUE upsert key — one fresh row per (project, kind, window).
-- Service layer UPSERTs on this; cron sweeps + lazy refresh both write here.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_report_aggregate_project_kind_window"
  ON "report_aggregate" ("project_id", "report_kind", "time_range_key");

-- Primary read path: latest fresh aggregate per (project, kind). Partial
-- index keeps the hot path tiny — stale rows are filtered at write-time.
CREATE INDEX IF NOT EXISTS "idx_report_aggregate_lookup"
  ON "report_aggregate" ("project_id", "report_kind", "aggregated_at" DESC)
  WHERE "is_stale" = false;

-- Sweep index — cron refresh + event invalidation scan target.
CREATE INDEX IF NOT EXISTS "idx_report_aggregate_stale"
  ON "report_aggregate" ("workspace_id")
  WHERE "is_stale" = true;

-- Workspace tenancy support (RLS app-layer filtering).
CREATE INDEX IF NOT EXISTS "idx_report_aggregate_workspace"
  ON "report_aggregate" ("workspace_id");

-- ============================================================
-- 2. report_template — saved user configurations
-- ============================================================
CREATE TABLE IF NOT EXISTS "report_template" (
  "id"            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id"  UUID         NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "project_id"    UUID         NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "owner_user_id" UUID         NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name"          TEXT         NOT NULL,
  "config"        JSONB        NOT NULL,
  -- config shape mirrors ReportRequestSchema: { kind, timeRange, filters?, groupBy? }
  "is_shared"     BOOLEAN      NOT NULL DEFAULT false,
  "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_report_template_project_user"
  ON "report_template" ("project_id", "owner_user_id");

-- ============================================================
-- 3. sprint_current(project_id) — ADR-021 §4 helper
-- ============================================================
-- DEPENDS ON: jira_sprints table from #189 migration
-- (20260520120000_jira_sync_sprint_columns). state CHECK constraint there
-- enforces 'active' | 'closed' | 'future' so the equality below is safe.
CREATE OR REPLACE FUNCTION "sprint_current"(p_project_id UUID)
RETURNS TEXT AS $$
  SELECT "id" FROM "jira_sprints"
  WHERE "project_id" = p_project_id
    AND "state" = 'active'
    AND "deleted_at" IS NULL
  ORDER BY "start_date" DESC NULLS LAST
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- Audit-log columns (per database.md HMAC chain rules) are
-- NOT added to report_aggregate / report_template — these are
-- DERIVED data with no chain-integrity requirement. Audit rows
-- for report.computed / report.cache_hit / template.created
-- live in the existing audit_log table per api.md.
-- ============================================================
