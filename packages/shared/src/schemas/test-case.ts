// TB-007 test_cases + TB-008 test_case_links + TB-022 test_case_generation_runs.
import { z } from 'zod';
import { Uuid, Timestamp, Priority, TestCaseStatus, NonEmpty } from './enums';

export const TestStepSchema = z.object({
  order: z.number().int().nonnegative(),
  action: NonEmpty,
  expected: z.string().optional(),
});
export type TestStep = z.infer<typeof TestStepSchema>;

// ─────────────────────────────────────────────────────────────────────
// M3 TASK BE-01 — AI provenance value enums.
// ─────────────────────────────────────────────────────────────────────

/// `format` discriminator — drives whether `stepsJson` (existing) or
/// `gherkin` (new, TB-007 column added by 20260507135000 migration)
/// is the body of the test case. Default 'step' preserves M2 behavior.
export const TestCaseFormat = z.enum(['step', 'gherkin']);
export type TestCaseFormat = z.infer<typeof TestCaseFormat>;

/// `generated_by_agent` — null for manual cases, 'composer' for
/// Composer (M3 generator) output, 'curator' for cases revised by
/// the dedupe agent (M3.5+).
export const GeneratedByAgent = z.enum(['composer', 'curator']);
export type GeneratedByAgent = z.infer<typeof GeneratedByAgent>;

/// LLM provider on a generation run (matches LLMGatewayService).
export const TestCaseGenerationLlmProvider = z.enum(['groq', 'gemini']);
export type TestCaseGenerationLlmProvider = z.infer<typeof TestCaseGenerationLlmProvider>;

/// Status of a generation run.
export const TestCaseGenerationRunStatus = z.enum(['success', 'partial', 'failed']);
export type TestCaseGenerationRunStatus = z.infer<typeof TestCaseGenerationRunStatus>;

// ─────────────────────────────────────────────────────────────────────
// TB-007 — TestCase with M3 AI provenance columns.
// ─────────────────────────────────────────────────────────────────────

export const TestCaseSchema = z.object({
  id: Uuid,
  projectId: Uuid,
  key: z.string().min(2).max(40),
  title: NonEmpty,
  preconditions: z.string(),
  stepsJson: z.array(TestStepSchema),
  expectedResult: z.string(),
  priority: Priority,
  status: TestCaseStatus,
  confidenceScore: z.number().min(0).max(1).nullable(),
  aiProvenanceJson: z.record(z.unknown()).nullable(),
  /// M3 — AI provenance fields (new in 20260507135000 migration).
  format: TestCaseFormat,
  /// Required when format='gherkin', null when format='step'.
  /// Refinement at the create-input layer; null is valid here for
  /// the manual + step path which is the M2 default.
  gherkin: z.string().nullable(),
  generatedByAgent: GeneratedByAgent.nullable(),
  /// Array of kb_chunk UUIDs that grounded the generation. Populated
  /// only when generatedByAgent != null.
  sourceChunkIds: z.array(Uuid).nullable(),
  rationale: z.string().nullable(),
  // Embedding is server-managed; not part of API responses by default.
  createdBy: Uuid,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type TestCase = z.infer<typeof TestCaseSchema>;

export const CreateTestCaseInput = z
  .object({
    key: z.string().min(2).max(40),
    title: NonEmpty,
    preconditions: z.string().default(''),
    stepsJson: z.array(TestStepSchema).default([]),
    expectedResult: z.string(),
    priority: Priority,
    status: TestCaseStatus.default('manual_draft'),
    linkedRequirementIds: z.array(Uuid).default([]),
    /// M3 — default 'step' preserves the M2 surface for callers
    /// not yet aware of the new column.
    format: TestCaseFormat.default('step'),
    gherkin: z.string().nullable().default(null),
    /// M3 — manual creation path leaves these null. Composer service
    /// will set them server-side when format='gherkin'.
    generatedByAgent: GeneratedByAgent.nullable().default(null),
    sourceChunkIds: z.array(Uuid).nullable().default(null),
    rationale: z.string().nullable().default(null),
  })
  /// gherkin format MUST carry a non-empty body; step format MUST NOT.
  .refine(
    (v) =>
      v.format === 'gherkin'
        ? typeof v.gherkin === 'string' && v.gherkin.trim().length > 0
        : v.gherkin == null,
    {
      message:
        "format='gherkin' requires non-empty gherkin body; format='step' requires gherkin=null",
      path: ['gherkin'],
    },
  );
export type CreateTestCaseInput = z.infer<typeof CreateTestCaseInput>;

export const UpdateTestCaseInput = z.object({
  title: NonEmpty.optional(),
  preconditions: z.string().optional(),
  stepsJson: z.array(TestStepSchema).optional(),
  expectedResult: z.string().optional(),
  priority: Priority.optional(),
  status: TestCaseStatus.optional(),
  linkedRequirementIds: z.array(Uuid).optional(),
  format: TestCaseFormat.optional(),
  gherkin: z.string().nullable().optional(),
  rationale: z.string().nullable().optional(),
});
export type UpdateTestCaseInput = z.infer<typeof UpdateTestCaseInput>;

// TB-008 test_case_links
export const TestCaseLinkSchema = z.object({
  testCaseId: Uuid,
  requirementId: Uuid,
});
export type TestCaseLink = z.infer<typeof TestCaseLinkSchema>;

// ─────────────────────────────────────────────────────────────────────
// TB-022 (NEW for M3) — TestCaseGenerationRun.
// One row per Composer (test-case generator) run. Created server-side
// only — clients never write directly. Surfaced read-only via a future
// list endpoint (M3 Day-14+).
// ─────────────────────────────────────────────────────────────────────

export const TestCaseGenerationRunSchema = z.object({
  id: Uuid,
  projectId: Uuid,
  /// Null when Composer was invoked free-form OR when a referenced
  /// requirement was later deleted (FK ON DELETE SET NULL).
  requirementId: Uuid.nullable(),
  triggeredBy: Uuid,
  llmProvider: TestCaseGenerationLlmProvider,
  llmModel: z.string().min(1).max(100),
  inputTokenCount: z.number().int().nonnegative(),
  outputTokenCount: z.number().int().nonnegative(),
  chunksRetrieved: z.number().int().nonnegative(),
  casesGenerated: z.number().int().nonnegative(),
  /// Null until user accepts/rejects in F31 review modal.
  casesAccepted: z.number().int().nonnegative().nullable(),
  /// Null until Curator dedupe pass runs (post-generation).
  casesDedupeFlagged: z.number().int().nonnegative().nullable(),
  durationMs: z.number().int().nonnegative(),
  status: TestCaseGenerationRunStatus,
  /// Truncated to ~500 chars in app code (mirrors kb_search_failed).
  errorReason: z.string().max(500).nullable(),
  createdAt: Timestamp,
});
export type TestCaseGenerationRun = z.infer<typeof TestCaseGenerationRunSchema>;
