-- QA Nexus PM1 — M3 TASK BE-01: extend test_cases + create test_case_generation_runs.
--
-- Spec: Milestone_M3_Test_Cases_AI_v2.md §TB-022 (NEW for M3) +
--       § "M3 migration" (TB-007 column additions for AI provenance).
--
-- Reconciliation note (Day-12, BE chat):
-- The M3 v2 plan was written assuming a clean test_cases table. In practice
-- the table already carries `confidence_score` (Float? per ADR-003) and
-- `status` (TestCaseStatus enum: ai_draft / manual_draft / reviewed / active
-- / flaky / deprecated). Both are functionally equivalent to the M3 plan's
-- DECIMAL(3,2) + ('draft','ai_draft','ready','archived') CHECK proposals;
-- changing them now would force a Prisma enum migration + downstream
-- Zod cascade in the same PR. M3 Day-13 (real CRUD) will reconcile the
-- status vocabulary if the domain logic demands it. confidence_score
-- stays as Float? — Zod-side `.min(0).max(1)` already enforces the range.
--
-- This migration only ADDs the genuinely new AI-provenance columns and
-- the new test_case_generation_runs table.

-- ─────────────────────────────────────────────────────────────────────
-- TB-007 extension: AI provenance columns on test_cases.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE "test_cases"
  ADD COLUMN "format" VARCHAR(10) NOT NULL DEFAULT 'step',
  ADD COLUMN "gherkin" TEXT NULL,
  ADD COLUMN "generated_by_agent" VARCHAR(20) NULL,
  ADD COLUMN "source_chunk_ids" JSONB NULL,
  ADD COLUMN "rationale" TEXT NULL;

ALTER TABLE "test_cases"
  ADD CONSTRAINT "test_cases_format_check"
  CHECK ("format" IN ('step', 'gherkin'));

-- Index for filter `?format=gherkin` (per v2 plan §"List + Filter UI").
CREATE INDEX "idx_test_cases_format" ON "test_cases" ("project_id", "format");

-- ─────────────────────────────────────────────────────────────────────
-- TB-022 (NEW): test_case_generation_runs.
-- One row per Composer run (1 PRD requirement → N test cases).
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE "test_case_generation_runs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "requirement_id" UUID NULL,
  "triggered_by" UUID NOT NULL,
  "llm_provider" VARCHAR(20) NOT NULL,
  "llm_model" VARCHAR(100) NOT NULL,
  "input_token_count" INTEGER NOT NULL DEFAULT 0,
  "output_token_count" INTEGER NOT NULL DEFAULT 0,
  "chunks_retrieved" INTEGER NOT NULL DEFAULT 0,
  "cases_generated" INTEGER NOT NULL DEFAULT 0,
  "cases_accepted" INTEGER NULL,
  "cases_dedupe_flagged" INTEGER NULL,
  "duration_ms" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "error_reason" TEXT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT "tcgr_llm_provider_check"
    CHECK ("llm_provider" IN ('groq', 'gemini')),
  CONSTRAINT "tcgr_status_check"
    CHECK ("status" IN ('success', 'partial', 'failed')),

  CONSTRAINT "tcgr_project_fk"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "tcgr_requirement_fk"
    FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE SET NULL,
  CONSTRAINT "tcgr_triggered_by_fk"
    FOREIGN KEY ("triggered_by") REFERENCES "users"("id")
);

-- Per-project listing of recent runs (Composer history view).
CREATE INDEX "idx_tcgr_project_created"
  ON "test_case_generation_runs" ("project_id", "created_at" DESC);

-- Per-user run history (audit trail).
CREATE INDEX "idx_tcgr_triggered_by"
  ON "test_case_generation_runs" ("triggered_by");
