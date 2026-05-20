-- Day-23 P1 — ADR-020 Jira webhook wire-up (issue + sprint event families).
--
-- Adds:
--   (a) jira_sprints table (Atlassian Sprint object) with soft-delete
--   (b) jira_issues.sprint_* denormalization columns (avoids JOIN on
--       ADR-021 tier-1 precompute dashboards)
--   (c) jira_issues.{deleted_at, priority, assignee_account_id, resolution,
--       labels} for delta-tracking on jira:issue_updated handler
--   (d) Partial indexes for sprint_current() + soft-delete sweep
--
-- Sequencing: this migration MUST land BEFORE ADR-021's sprint_current()
-- PL/pgSQL helper migration. See .claude/scratch/be-adr-021-prereview.md §4.

-- 1. jira_sprints table
CREATE TABLE IF NOT EXISTS "jira_sprints" (
  "id"             TEXT        PRIMARY KEY,
  "project_id"     UUID        NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name"           TEXT        NOT NULL,
  "state"          TEXT        NOT NULL CHECK ("state" IN ('active', 'closed', 'future')),
  "start_date"     TIMESTAMPTZ NULL,
  "end_date"       TIMESTAMPTZ NULL,
  "complete_date"  TIMESTAMPTZ NULL,
  "board_id"       TEXT        NULL,
  "deleted_at"     TIMESTAMPTZ NULL,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index for sprint_current() helper (ADR-021 dependency).
CREATE INDEX IF NOT EXISTS "idx_jira_sprints_project_active"
  ON "jira_sprints" ("project_id", "end_date" DESC)
  WHERE "state" = 'active' AND "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_jira_sprints_project_state"
  ON "jira_sprints" ("project_id", "state");

-- 2. jira_issues sprint denormalization + delta-tracking columns
ALTER TABLE "jira_issues"
  ADD COLUMN IF NOT EXISTS "sprint_id" TEXT NULL
    REFERENCES "jira_sprints"("id") ON DELETE SET NULL;

ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "sprint_name" TEXT NULL;
ALTER TABLE "jira_issues"
  ADD COLUMN IF NOT EXISTS "sprint_state" TEXT NULL
    CHECK ("sprint_state" IS NULL OR "sprint_state" IN ('active', 'closed', 'future'));
ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "sprint_start_date" TIMESTAMPTZ NULL;
ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "sprint_end_date" TIMESTAMPTZ NULL;
ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "sprint_complete_date" TIMESTAMPTZ NULL;

-- Soft-delete (audit chain integrity per Hard Rule 7 — never hard delete)
ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ NULL;

-- Delta-tracking on jira:issue_updated (so handler can compute changedFields[])
ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "priority" TEXT NULL;
ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "assignee_account_id" TEXT NULL;
ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "resolution" TEXT NULL;
ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "labels" JSONB NULL;

CREATE INDEX IF NOT EXISTS "idx_jira_issues_sprint_active"
  ON "jira_issues" ("sprint_id")
  WHERE "sprint_id" IS NOT NULL AND "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_jira_issues_deleted_at"
  ON "jira_issues" ("deleted_at")
  WHERE "deleted_at" IS NOT NULL;
