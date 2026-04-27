-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('Admin', 'Lead', 'QAEngineer', 'Stakeholder');

-- CreateEnum
CREATE TYPE "invitation_status" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "priority" AS ENUM ('P0', 'P1', 'P2', 'P3');

-- CreateEnum
CREATE TYPE "requirement_status" AS ENUM ('draft', 'active', 'done', 'archived');

-- CreateEnum
CREATE TYPE "requirement_source" AS ENUM ('manual', 'jira', 'upload');

-- CreateEnum
CREATE TYPE "test_case_status" AS ENUM ('ai_draft', 'manual_draft', 'reviewed', 'active', 'flaky', 'deprecated');

-- CreateEnum
CREATE TYPE "test_suite_status" AS ENUM ('healthy', 'warning', 'stale', 'archived');

-- CreateEnum
CREATE TYPE "run_trigger" AS ENUM ('manual', 'webhook', 'cron');

-- CreateEnum
CREATE TYPE "test_run_status" AS ENUM ('queued', 'running', 'passed', 'failed', 'blocked', 'aborted');

-- CreateEnum
CREATE TYPE "test_result_status" AS ENUM ('passed', 'failed', 'blocked', 'skipped');

-- CreateEnum
CREATE TYPE "jira_auth_method" AS ENUM ('oauth_3lo');

-- CreateEnum
CREATE TYPE "jira_connection_status" AS ENUM ('active', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "defect_status" AS ENUM ('new', 'triaged', 'in_progress', 'resolved', 'verified', 'closed', 'reopened', 'blocked');

-- CreateEnum
CREATE TYPE "llm_provider_kind" AS ENUM ('groq', 'gemini', 'openrouter', 'cerebras', 'openai', 'anthropic', 'kimi', 'mistral', 'together', 'fireworks', 'custom_oai');

-- CreateEnum
CREATE TYPE "llm_provider_status" AS ENUM ('connected', 'error', 'unverified');

-- CreateEnum
CREATE TYPE "agent_kind" AS ENUM ('A1', 'A2', 'A4');

-- CreateEnum
CREATE TYPE "agent_role" AS ENUM ('primary', 'long_context', 'fallback', 'fast_layer');

-- CreateEnum
CREATE TYPE "agent_run_status" AS ENUM ('queued', 'running', 'complete', 'failed');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "organizational_label" TEXT,
    "password_hash" TEXT NOT NULL,
    "activated_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_override" "user_role",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("project_id","user_id")
);

-- CreateTable
CREATE TABLE "user_invitations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "invited_email" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "project_scope_json" JSONB NOT NULL DEFAULT '[]',
    "invited_by" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "invitation_status" NOT NULL DEFAULT 'pending',
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "epic_key" TEXT,
    "priority" "priority" NOT NULL,
    "status" "requirement_status" NOT NULL DEFAULT 'draft',
    "sprint" TEXT,
    "source" "requirement_source" NOT NULL DEFAULT 'manual',
    "source_ref" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preconditions" TEXT NOT NULL DEFAULT '',
    "steps_json" JSONB NOT NULL DEFAULT '[]',
    "expected_result" TEXT NOT NULL,
    "priority" "priority" NOT NULL,
    "status" "test_case_status" NOT NULL DEFAULT 'ai_draft',
    "confidence_score" DOUBLE PRECISION,
    "ai_provenance_json" JSONB,
    "embedding" vector(1024),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_links" (
    "test_case_id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,

    CONSTRAINT "test_case_links_pkey" PRIMARY KEY ("test_case_id","requirement_id")
);

-- CreateTable
CREATE TABLE "test_suites" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "owner_id" UUID NOT NULL,
    "status" "test_suite_status" NOT NULL DEFAULT 'healthy',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "test_suites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_suite_members" (
    "suite_id" UUID NOT NULL,
    "test_case_id" UUID NOT NULL,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "test_suite_members_pkey" PRIMARY KEY ("suite_id","test_case_id")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "suite_id" UUID,
    "name" TEXT NOT NULL,
    "triggered_by" "run_trigger" NOT NULL,
    "triggered_by_user" UUID,
    "status" "test_run_status" NOT NULL DEFAULT 'queued',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "environment" TEXT NOT NULL,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_run_results" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "test_case_id" UUID NOT NULL,
    "status" "test_result_status" NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "evidence_uri" TEXT,
    "failure_message" TEXT,
    "stack_trace" TEXT,

    CONSTRAINT "test_run_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jira_connections" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "auth_method" "jira_auth_method" NOT NULL DEFAULT 'oauth_3lo',
    "jira_base_url" TEXT NOT NULL,
    "oauth_access_token_encrypted" TEXT NOT NULL,
    "oauth_refresh_token_encrypted" TEXT NOT NULL,
    "oauth_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "jira_connection_status" NOT NULL DEFAULT 'active',
    "last_sync_at" TIMESTAMPTZ(6),

    CONSTRAINT "jira_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jira_issues" (
    "id" UUID NOT NULL,
    "jira_connection_id" UUID NOT NULL,
    "jira_key" TEXT NOT NULL,
    "issue_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "linked_defect_id" UUID,
    "linked_requirement_id" UUID,
    "last_synced_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "jira_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defects" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "priority" NOT NULL,
    "status" "defect_status" NOT NULL DEFAULT 'new',
    "triggered_by_run_id" UUID,
    "triggered_by_test_case_id" UUID,
    "assignee_id" UUID,
    "jira_issue_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "defects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rca_reports" (
    "id" UUID NOT NULL,
    "defect_id" UUID NOT NULL,
    "layer1_stack_json" JSONB NOT NULL,
    "layer2_env_json" JSONB NOT NULL,
    "layer3_config_json" JSONB NOT NULL,
    "layer4_code_json" JSONB NOT NULL,
    "layer5_data_json" JSONB NOT NULL,
    "top_hypothesis" TEXT NOT NULL,
    "created_by_agent_run_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rca_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_documents" (
    "id" UUID NOT NULL,
    "project_id" UUID,
    "title" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "template_kind" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "kb_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "embedding" vector(1024),
    "chunk_index" INTEGER NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "kb_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_providers" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "provider_kind" "llm_provider_kind" NOT NULL,
    "display_name" TEXT NOT NULL,
    "api_key_encrypted" TEXT NOT NULL,
    "endpoint_url" TEXT NOT NULL,
    "extra_config_json" JSONB NOT NULL DEFAULT '{}',
    "status" "llm_provider_status" NOT NULL DEFAULT 'unverified',
    "last_test_at" TIMESTAMPTZ(6),
    "last_test_result" JSONB,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_provider_models" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "model_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "capability_json" JSONB NOT NULL DEFAULT '{}',
    "enabled_for_workspace" BOOLEAN NOT NULL DEFAULT true,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_provider_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_model_assignments" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "agent_kind" "agent_kind" NOT NULL,
    "role" "agent_role" NOT NULL,
    "model_pk" UUID NOT NULL,
    "activation_threshold_json" JSONB,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_model_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "agent_kind" "agent_kind" NOT NULL,
    "status" "agent_run_status" NOT NULL DEFAULT 'queued',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "eval_result" JSONB,
    "error_class" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "actor_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "prev_hash" CHAR(64) NOT NULL,
    "this_hash" CHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_workspace_id_idx" ON "users"("workspace_id");

-- CreateIndex
CREATE INDEX "projects_workspace_id_idx" ON "projects"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_workspace_id_key_key" ON "projects"("workspace_id", "key");

-- CreateIndex
CREATE INDEX "project_members_user_id_idx" ON "project_members"("user_id");

-- CreateIndex
CREATE INDEX "user_invitations_workspace_id_idx" ON "user_invitations"("workspace_id");

-- CreateIndex
CREATE INDEX "user_invitations_invited_email_idx" ON "user_invitations"("invited_email");

-- CreateIndex
CREATE INDEX "requirements_project_id_idx" ON "requirements"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "requirements_project_id_key_key" ON "requirements"("project_id", "key");

-- CreateIndex
CREATE INDEX "test_cases_project_id_idx" ON "test_cases"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_cases_project_id_key_key" ON "test_cases"("project_id", "key");

-- CreateIndex
CREATE INDEX "test_case_links_requirement_id_idx" ON "test_case_links"("requirement_id");

-- CreateIndex
CREATE INDEX "test_suites_project_id_idx" ON "test_suites"("project_id");

-- CreateIndex
CREATE INDEX "test_suite_members_test_case_id_idx" ON "test_suite_members"("test_case_id");

-- CreateIndex
CREATE INDEX "test_runs_project_id_idx" ON "test_runs"("project_id");

-- CreateIndex
CREATE INDEX "test_runs_suite_id_idx" ON "test_runs"("suite_id");

-- CreateIndex
CREATE INDEX "test_run_results_run_id_idx" ON "test_run_results"("run_id");

-- CreateIndex
CREATE INDEX "test_run_results_test_case_id_idx" ON "test_run_results"("test_case_id");

-- CreateIndex
CREATE INDEX "jira_connections_project_id_idx" ON "jira_connections"("project_id");

-- CreateIndex
CREATE INDEX "jira_issues_linked_defect_id_idx" ON "jira_issues"("linked_defect_id");

-- CreateIndex
CREATE INDEX "jira_issues_linked_requirement_id_idx" ON "jira_issues"("linked_requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "jira_issues_jira_connection_id_jira_key_key" ON "jira_issues"("jira_connection_id", "jira_key");

-- CreateIndex
CREATE INDEX "defects_project_id_idx" ON "defects"("project_id");

-- CreateIndex
CREATE INDEX "defects_assignee_id_idx" ON "defects"("assignee_id");

-- CreateIndex
CREATE UNIQUE INDEX "defects_project_id_key_key" ON "defects"("project_id", "key");

-- CreateIndex
CREATE INDEX "rca_reports_defect_id_idx" ON "rca_reports"("defect_id");

-- CreateIndex
CREATE INDEX "kb_documents_project_id_idx" ON "kb_documents"("project_id");

-- CreateIndex
CREATE INDEX "kb_chunks_document_id_idx" ON "kb_chunks"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "kb_chunks_document_id_chunk_index_key" ON "kb_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "llm_providers_workspace_id_idx" ON "llm_providers"("workspace_id");

-- CreateIndex
CREATE INDEX "llm_provider_models_provider_id_idx" ON "llm_provider_models"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "llm_provider_models_provider_id_model_id_key" ON "llm_provider_models"("provider_id", "model_id");

-- CreateIndex
CREATE INDEX "agent_model_assignments_workspace_id_idx" ON "agent_model_assignments"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_model_assignments_workspace_id_agent_kind_role_key" ON "agent_model_assignments"("workspace_id", "agent_kind", "role");

-- CreateIndex
CREATE INDEX "agent_runs_workspace_id_idx" ON "agent_runs"("workspace_id");

-- CreateIndex
CREATE INDEX "agent_runs_agent_kind_status_idx" ON "agent_runs"("agent_kind", "status");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_workspace_id_created_at_key" ON "audit_log"("workspace_id", "created_at");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_links" ADD CONSTRAINT "test_case_links_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_links" ADD CONSTRAINT "test_case_links_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_suite_members" ADD CONSTRAINT "test_suite_members_suite_id_fkey" FOREIGN KEY ("suite_id") REFERENCES "test_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_suite_members" ADD CONSTRAINT "test_suite_members_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_suite_id_fkey" FOREIGN KEY ("suite_id") REFERENCES "test_suites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_triggered_by_user_fkey" FOREIGN KEY ("triggered_by_user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_results" ADD CONSTRAINT "test_run_results_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_results" ADD CONSTRAINT "test_run_results_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_connections" ADD CONSTRAINT "jira_connections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_issues" ADD CONSTRAINT "jira_issues_jira_connection_id_fkey" FOREIGN KEY ("jira_connection_id") REFERENCES "jira_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_issues" ADD CONSTRAINT "jira_issues_linked_defect_id_fkey" FOREIGN KEY ("linked_defect_id") REFERENCES "defects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_issues" ADD CONSTRAINT "jira_issues_linked_requirement_id_fkey" FOREIGN KEY ("linked_requirement_id") REFERENCES "requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_triggered_by_run_id_fkey" FOREIGN KEY ("triggered_by_run_id") REFERENCES "test_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_triggered_by_test_case_id_fkey" FOREIGN KEY ("triggered_by_test_case_id") REFERENCES "test_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rca_reports" ADD CONSTRAINT "rca_reports_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "defects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rca_reports" ADD CONSTRAINT "rca_reports_created_by_agent_run_id_fkey" FOREIGN KEY ("created_by_agent_run_id") REFERENCES "agent_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_documents" ADD CONSTRAINT "kb_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_documents" ADD CONSTRAINT "kb_documents_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_chunks" ADD CONSTRAINT "kb_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "kb_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_providers" ADD CONSTRAINT "llm_providers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_providers" ADD CONSTRAINT "llm_providers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_provider_models" ADD CONSTRAINT "llm_provider_models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "llm_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_model_assignments" ADD CONSTRAINT "agent_model_assignments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_model_assignments" ADD CONSTRAINT "agent_model_assignments_model_pk_fkey" FOREIGN KEY ("model_pk") REFERENCES "llm_provider_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_model_assignments" ADD CONSTRAINT "agent_model_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
