-- QA Nexus PM1 — Day-32 fix: align the migration chain with schema.prisma.
--
-- ROOT CAUSE: the original qa-nexus DB was evolved largely via `prisma db push`,
-- so ~3 tables (evidence, defect_history, jira_sync_logs), ~17 columns (incl.
-- users.disabled_at, defects.component/verified_at/closed_at) and several
-- enum/FK/type reconciliations never reached the migrations/ chain. `migrate
-- deploy` reproduces only the chain, so every FRESH DB (qa-nexus-2 switchover,
-- Jul-1 switchback-if-rebuilt, any DR restore-from-migrations) is silently
-- behind schema.prisma even though `migrate status` reports "up to date".
--
-- This migration is the `prisma migrate diff (datasource → datamodel)` output,
-- made fully IDEMPOTENT (IF [NOT] EXISTS guards + DROP-before-ADD on every FK +
-- a guarded RENAME) so it is a no-op on the old qa-nexus DB (which already has
-- everything) and brings any fresh DB up to schema.prisma. Self-healing: no
-- manual `migrate resolve` is required at the Jul-1 switchback.
--
-- Day-29/32 ledger item "clean-DB db-push drift" — CLOSED by this migration.

-- AlterEnum
ALTER TYPE "jira_auth_method" ADD VALUE IF NOT EXISTS 'api_token';

-- DropForeignKey
ALTER TABLE "jira_issues" DROP CONSTRAINT IF EXISTS "jira_issues_sprint_id_fkey";

-- DropForeignKey
ALTER TABLE "jira_sprints" DROP CONSTRAINT IF EXISTS "jira_sprints_project_id_fkey";

-- DropForeignKey
ALTER TABLE "report_aggregate" DROP CONSTRAINT IF EXISTS "report_aggregate_project_id_fkey";

-- DropForeignKey
ALTER TABLE "report_aggregate" DROP CONSTRAINT IF EXISTS "report_aggregate_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "report_template" DROP CONSTRAINT IF EXISTS "report_template_owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "report_template" DROP CONSTRAINT IF EXISTS "report_template_project_id_fkey";

-- DropForeignKey
ALTER TABLE "report_template" DROP CONSTRAINT IF EXISTS "report_template_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "test_case_generation_runs" DROP CONSTRAINT IF EXISTS "tcgr_project_fk";

-- DropForeignKey
ALTER TABLE "test_case_generation_runs" DROP CONSTRAINT IF EXISTS "tcgr_requirement_fk";

-- DropForeignKey
ALTER TABLE "test_case_generation_runs" DROP CONSTRAINT IF EXISTS "tcgr_triggered_by_fk";

-- AlterTable
ALTER TABLE "defects" ADD COLUMN IF NOT EXISTS     "closed_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS     "component" TEXT,
ADD COLUMN IF NOT EXISTS     "verified_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "jira_connections" ADD COLUMN IF NOT EXISTS     "account_email" TEXT,
ADD COLUMN IF NOT EXISTS     "status_mapping" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "rca_reports" ADD COLUMN IF NOT EXISTS     "feedback" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS     "layer1_confidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS     "layer2_confidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS     "layer3_confidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS     "layer4_confidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS     "layer5_confidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS     "otel_trace_id" TEXT;

-- AlterTable
ALTER TABLE "report_aggregate" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "report_template" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "test_case_generation_runs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "llm_provider" SET DATA TYPE TEXT,
ALTER COLUMN "llm_model" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "test_cases" ALTER COLUMN "format" SET DATA TYPE TEXT,
ALTER COLUMN "generated_by_agent" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "test_run_results" ADD COLUMN IF NOT EXISTS     "actual_result" TEXT,
ADD COLUMN IF NOT EXISTS     "blocked_reason" TEXT,
ADD COLUMN IF NOT EXISTS     "evidence_ids" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS     "disabled_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS     "role_changed_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE IF NOT EXISTS "evidence" (
    "id" UUID NOT NULL,
    "test_run_result_id" UUID,
    "defect_id" UUID,
    "r2_path" TEXT NOT NULL,
    "signed_url_expires_at" TIMESTAMPTZ(6),
    "content_type" TEXT,
    "size_bytes" BIGINT,
    "filename" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit_log_id" UUID,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "defect_history" (
    "id" UUID NOT NULL,
    "defect_id" UUID NOT NULL,
    "from_status" "defect_status",
    "to_status" "defect_status" NOT NULL,
    "actor_id" UUID,
    "comment" TEXT,
    "transitioned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit_log_id" UUID,

    CONSTRAINT "defect_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "jira_sync_logs" (
    "id" UUID NOT NULL,
    "jira_connection_id" UUID,
    "direction" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "defect_id" UUID,
    "jira_issue_key" TEXT,
    "payload_hash" CHAR(64) NOT NULL,
    "http_status" INTEGER,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "retried" BOOLEAN NOT NULL DEFAULT false,
    "retry_of" UUID,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit_log_id" UUID,

    CONSTRAINT "jira_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evidence_test_run_result_id_idx" ON "evidence"("test_run_result_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evidence_defect_id_idx" ON "evidence"("defect_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evidence_created_by_idx" ON "evidence"("created_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "defect_history_defect_id_transitioned_at_idx" ON "defect_history"("defect_id", "transitioned_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "defect_history_actor_id_idx" ON "defect_history"("actor_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jira_sync_logs_jira_connection_id_idx" ON "jira_sync_logs"("jira_connection_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jira_sync_logs_defect_id_idx" ON "jira_sync_logs"("defect_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jira_sync_logs_occurred_at_idx" ON "jira_sync_logs"("occurred_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jira_issues_sprint_id_idx" ON "jira_issues"("sprint_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jira_issues_deleted_at_idx" ON "jira_issues"("deleted_at");

-- CreateIndex — name collision: an earlier-chain index of this name exists with
-- different columns, so CREATE … IF NOT EXISTS would no-op and leave drift.
-- DROP-then-CREATE so the definition matches schema.prisma exactly; the DROP IF
-- EXISTS keeps it idempotent on the old qa-nexus DB (Jul-1 switchback).
DROP INDEX IF EXISTS "idx_report_aggregate_lookup";
CREATE INDEX "idx_report_aggregate_lookup" ON "report_aggregate"("project_id", "report_kind", "aggregated_at" DESC);

-- AddForeignKey
ALTER TABLE "test_case_generation_runs" DROP CONSTRAINT IF EXISTS "test_case_generation_runs_project_id_fkey";
ALTER TABLE "test_case_generation_runs" ADD CONSTRAINT "test_case_generation_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_generation_runs" DROP CONSTRAINT IF EXISTS "test_case_generation_runs_requirement_id_fkey";
ALTER TABLE "test_case_generation_runs" ADD CONSTRAINT "test_case_generation_runs_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_generation_runs" DROP CONSTRAINT IF EXISTS "test_case_generation_runs_triggered_by_fkey";
ALTER TABLE "test_case_generation_runs" ADD CONSTRAINT "test_case_generation_runs_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_issues" DROP CONSTRAINT IF EXISTS "jira_issues_sprint_id_fkey";
ALTER TABLE "jira_issues" ADD CONSTRAINT "jira_issues_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "jira_sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_sprints" DROP CONSTRAINT IF EXISTS "jira_sprints_project_id_fkey";
ALTER TABLE "jira_sprints" ADD CONSTRAINT "jira_sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" DROP CONSTRAINT IF EXISTS "evidence_test_run_result_id_fkey";
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_test_run_result_id_fkey" FOREIGN KEY ("test_run_result_id") REFERENCES "test_run_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" DROP CONSTRAINT IF EXISTS "evidence_defect_id_fkey";
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "defects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" DROP CONSTRAINT IF EXISTS "evidence_created_by_fkey";
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" DROP CONSTRAINT IF EXISTS "evidence_audit_log_id_fkey";
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_history" DROP CONSTRAINT IF EXISTS "defect_history_defect_id_fkey";
ALTER TABLE "defect_history" ADD CONSTRAINT "defect_history_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "defects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_history" DROP CONSTRAINT IF EXISTS "defect_history_actor_id_fkey";
ALTER TABLE "defect_history" ADD CONSTRAINT "defect_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_history" DROP CONSTRAINT IF EXISTS "defect_history_audit_log_id_fkey";
ALTER TABLE "defect_history" ADD CONSTRAINT "defect_history_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_sync_logs" DROP CONSTRAINT IF EXISTS "jira_sync_logs_jira_connection_id_fkey";
ALTER TABLE "jira_sync_logs" ADD CONSTRAINT "jira_sync_logs_jira_connection_id_fkey" FOREIGN KEY ("jira_connection_id") REFERENCES "jira_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_sync_logs" DROP CONSTRAINT IF EXISTS "jira_sync_logs_defect_id_fkey";
ALTER TABLE "jira_sync_logs" ADD CONSTRAINT "jira_sync_logs_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "defects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_sync_logs" DROP CONSTRAINT IF EXISTS "jira_sync_logs_retry_of_fkey";
ALTER TABLE "jira_sync_logs" ADD CONSTRAINT "jira_sync_logs_retry_of_fkey" FOREIGN KEY ("retry_of") REFERENCES "jira_sync_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_sync_logs" DROP CONSTRAINT IF EXISTS "jira_sync_logs_audit_log_id_fkey";
ALTER TABLE "jira_sync_logs" ADD CONSTRAINT "jira_sync_logs_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit_log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_aggregate" DROP CONSTRAINT IF EXISTS "report_aggregate_workspace_id_fkey";
ALTER TABLE "report_aggregate" ADD CONSTRAINT "report_aggregate_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_aggregate" DROP CONSTRAINT IF EXISTS "report_aggregate_project_id_fkey";
ALTER TABLE "report_aggregate" ADD CONSTRAINT "report_aggregate_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_template" DROP CONSTRAINT IF EXISTS "report_template_workspace_id_fkey";
ALTER TABLE "report_template" ADD CONSTRAINT "report_template_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_template" DROP CONSTRAINT IF EXISTS "report_template_project_id_fkey";
ALTER TABLE "report_template" ADD CONSTRAINT "report_template_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_template" DROP CONSTRAINT IF EXISTS "report_template_owner_user_id_fkey";
ALTER TABLE "report_template" ADD CONSTRAINT "report_template_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_jira_sprints_project_state')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'jira_sprints_project_id_state_idx') THEN
    ALTER INDEX "idx_jira_sprints_project_state" RENAME TO "jira_sprints_project_id_state_idx";
  END IF;
END $$;


