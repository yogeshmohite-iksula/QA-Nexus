// QA Nexus PM1 — M3 TASK BE-01 schema sanity tests.
//
// Spec: Milestone_M3_Test_Cases_AI_v2.md §TB-007 column extension +
//       §TB-022 test_case_generation_runs.
//
// Why this file lives in apps/api/src/__tests__ rather than
// packages/shared: packages/shared has no jest runner (its `test`
// script is a no-op shim). Same pattern as M1 Day-8 Part A
// shared-user-schemas.spec.ts.
//
// Coverage targets (4 minimum per task spec):
//   1. New Prisma columns nullable/default semantics match Zod.
//   2. test_case_generation_runs Zod shape (insert + cascade-delete
//      contracts pinned at the Zod layer; FK behavior verified by the
//      raw migration SQL CHECK + ON DELETE clauses below).
//   3. Format CHECK constraint vocabulary (Zod enum mirrors raw SQL
//      `CHECK ('step', 'gherkin')`).
//   4. Migration up/down idempotency contract — verifies the migration
//      SQL is a SET of additive ALTER + CREATE TABLE statements with no
//      destructive ops, so re-running the migration on a partially-
//      applied DB reports IF NOT EXISTS-style errors only (no data loss).
//      Live DB up/down is gated to a raw-SQL ops runbook + Day-13's
//      first real migration apply.
//
// PII / security guard: TestCaseGenerationRun.errorReason is capped at
// 500 chars (Zod max(500)) to mirror the kb_search_failed truncation
// rule from PR #53. Pinned by a negative test below.

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  TestCaseSchema,
  CreateTestCaseInput,
  TestCaseFormat,
  TestCaseGenerationLlmProvider,
  TestCaseGenerationRunStatus,
  TestCaseGenerationRunSchema,
} from '@qa-nexus/shared';

const MIGRATION_DIR = '20260507135000_m3_test_case_ai_columns';
const MIGRATION_PATH = path.join(
  __dirname,
  '..',
  '..',
  'prisma',
  'migrations',
  MIGRATION_DIR,
  'migration.sql',
);

function readMigration(): string {
  return fs.readFileSync(MIGRATION_PATH, 'utf8');
}

describe('[@M3-BE-01] TestCase + TestCaseGenerationRun schemas', () => {
  describe('TestCase — new AI-provenance columns nullable correctly', () => {
    const baseTestCase = {
      id: '11111111-1111-4111-8111-111111111111',
      projectId: '22222222-2222-4222-8222-222222222222',
      key: 'TC-RET-001',
      title: 'Sample test case',
      preconditions: '',
      stepsJson: [],
      expectedResult: 'OK',
      priority: 'P1' as const,
      status: 'manual_draft' as const,
      confidenceScore: null,
      aiProvenanceJson: null,
      createdBy: '33333333-3333-4333-8333-333333333333',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('accepts manual case with format=step + all AI fields null', () => {
      const parsed = TestCaseSchema.parse({
        ...baseTestCase,
        format: 'step',
        gherkin: null,
        generatedByAgent: null,
        sourceChunkIds: null,
        rationale: null,
      });
      expect(parsed.format).toBe('step');
      expect(parsed.gherkin).toBeNull();
      expect(parsed.generatedByAgent).toBeNull();
    });

    it('accepts Composer-generated case with format=gherkin + provenance', () => {
      const parsed = TestCaseSchema.parse({
        ...baseTestCase,
        format: 'gherkin',
        gherkin: 'Given a user\nWhen they sign in\nThen they see home',
        generatedByAgent: 'composer',
        sourceChunkIds: ['44444444-4444-4444-8444-444444444444'],
        rationale: 'Covers the primary auth happy-path per RET-101.',
      });
      expect(parsed.format).toBe('gherkin');
      expect(parsed.generatedByAgent).toBe('composer');
      expect(parsed.sourceChunkIds).toHaveLength(1);
    });

    it('rejects invalid format value (CHECK vocab guard at Zod layer)', () => {
      const result = TestCaseSchema.safeParse({
        ...baseTestCase,
        format: 'BPMN', // not in CHECK ('step', 'gherkin')
        gherkin: null,
        generatedByAgent: null,
        sourceChunkIds: null,
        rationale: null,
      });
      expect(result.success).toBe(false);
    });

    it('TestCaseFormat enum exposes exactly the 2 raw-SQL CHECK values', () => {
      expect(TestCaseFormat.options).toEqual(['step', 'gherkin']);
    });
  });

  describe('CreateTestCaseInput — gherkin/step format refinement', () => {
    const baseInput = {
      key: 'TC-RET-002',
      title: 'New manual case',
      expectedResult: 'OK',
      priority: 'P1' as const,
    };

    it("rejects format='gherkin' with empty gherkin body", () => {
      const result = CreateTestCaseInput.safeParse({
        ...baseInput,
        format: 'gherkin',
        gherkin: '',
      });
      expect(result.success).toBe(false);
    });

    it("rejects format='step' with non-null gherkin body", () => {
      const result = CreateTestCaseInput.safeParse({
        ...baseInput,
        format: 'step',
        gherkin: 'Given … When …',
      });
      expect(result.success).toBe(false);
    });

    it("accepts format='gherkin' with non-empty body", () => {
      const result = CreateTestCaseInput.safeParse({
        ...baseInput,
        format: 'gherkin',
        gherkin: 'Given a user\nWhen X\nThen Y',
      });
      expect(result.success).toBe(true);
    });

    it("defaults format='step' + gherkin=null when omitted (M2 backwards-compat)", () => {
      const parsed = CreateTestCaseInput.parse(baseInput);
      expect(parsed.format).toBe('step');
      expect(parsed.gherkin).toBeNull();
      expect(parsed.generatedByAgent).toBeNull();
    });
  });

  describe('TestCaseGenerationRun — TB-022 shape', () => {
    const baseRun = {
      id: '55555555-5555-4555-8555-555555555555',
      projectId: '22222222-2222-4222-8222-222222222222',
      requirementId: null,
      triggeredBy: '33333333-3333-4333-8333-333333333333',
      llmProvider: 'groq' as const,
      llmModel: 'openai/gpt-oss-120b',
      inputTokenCount: 1240,
      outputTokenCount: 850,
      chunksRetrieved: 5,
      casesGenerated: 4,
      casesAccepted: null,
      casesDedupeFlagged: null,
      durationMs: 4200,
      status: 'success' as const,
      errorReason: null,
      createdAt: new Date().toISOString(),
    };

    it('accepts a successful run with casesAccepted=null pre-review', () => {
      expect(() => TestCaseGenerationRunSchema.parse(baseRun)).not.toThrow();
    });

    it('accepts requirementId=null (free-form Composer mode)', () => {
      const parsed = TestCaseGenerationRunSchema.parse({
        ...baseRun,
        requirementId: null,
      });
      expect(parsed.requirementId).toBeNull();
    });

    it('rejects llmProvider outside the CHECK vocab', () => {
      const result = TestCaseGenerationRunSchema.safeParse({
        ...baseRun,
        llmProvider: 'openai', // not in CHECK ('groq', 'gemini')
      });
      expect(result.success).toBe(false);
    });

    it('rejects status outside the CHECK vocab', () => {
      const result = TestCaseGenerationRunSchema.safeParse({
        ...baseRun,
        status: 'cancelled', // not in CHECK ('success', 'partial', 'failed')
      });
      expect(result.success).toBe(false);
    });

    it('truncates errorReason at 500 chars (PII / payload-bloat guard)', () => {
      const tooLong = 'x'.repeat(501);
      const result = TestCaseGenerationRunSchema.safeParse({
        ...baseRun,
        status: 'failed',
        errorReason: tooLong,
      });
      expect(result.success).toBe(false);
    });

    it('TestCaseGenerationLlmProvider mirrors raw-SQL CHECK', () => {
      expect(TestCaseGenerationLlmProvider.options).toEqual(['groq', 'gemini']);
    });

    it('TestCaseGenerationRunStatus mirrors raw-SQL CHECK', () => {
      expect(TestCaseGenerationRunStatus.options).toEqual([
        'success',
        'partial',
        'failed',
      ]);
    });
  });

  describe('Migration SQL — additive + idempotent contract', () => {
    const sql = readMigration();

    it('contains all 5 new ALTER TABLE … ADD COLUMN clauses', () => {
      expect(sql).toMatch(/ADD COLUMN "format"/);
      expect(sql).toMatch(/ADD COLUMN "gherkin"/);
      expect(sql).toMatch(/ADD COLUMN "generated_by_agent"/);
      expect(sql).toMatch(/ADD COLUMN "source_chunk_ids"/);
      expect(sql).toMatch(/ADD COLUMN "rationale"/);
    });

    it('contains the format CHECK constraint with both vocab values', () => {
      expect(sql).toMatch(/"format" IN \('step', 'gherkin'\)/);
    });

    it('creates test_case_generation_runs table with FK cascades', () => {
      expect(sql).toMatch(/CREATE TABLE "test_case_generation_runs"/);
      // Project FK = CASCADE (parent project gone → run rows gone)
      expect(sql).toMatch(/REFERENCES "projects"\("id"\) ON DELETE CASCADE/);
      // Requirement FK = SET NULL (parent req gone → run row keeps history)
      expect(sql).toMatch(
        /REFERENCES "requirements"\("id"\) ON DELETE SET NULL/,
      );
      // User FK = no cascade (default; user delete should fail loud here).
      expect(sql).toMatch(/REFERENCES "users"\("id"\)/);
    });

    it('contains both indices required by §TB-022', () => {
      expect(sql).toMatch(/CREATE INDEX "idx_tcgr_project_created"/);
      expect(sql).toMatch(/CREATE INDEX "idx_tcgr_triggered_by"/);
    });

    it('contains NO DROP / DELETE / TRUNCATE / RENAME ops (purely additive)', () => {
      expect(sql).not.toMatch(/^\s*DROP /im);
      expect(sql).not.toMatch(/^\s*DELETE /im);
      expect(sql).not.toMatch(/^\s*TRUNCATE /im);
      expect(sql).not.toMatch(/RENAME COLUMN/i);
    });
  });
});
