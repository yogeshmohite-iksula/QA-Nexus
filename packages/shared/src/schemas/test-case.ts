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

// ─────────────────────────────────────────────────────────────────────
// M3 Day-13 TASK 1 — Test case CRUD response + filter shapes.
// Real implementation replaces the M3-BE-02 501 stubs.
// ─────────────────────────────────────────────────────────────────────

/// `GET /api/projects/:projectId/test-cases` filter surface per
/// Milestone_M3_Test_Cases_AI_v2.md §"List + Filter UI". All filters
/// are optional; combining them ANDs the conditions. `q` is a
/// case-insensitive substring match on title (Postgres `ILIKE`).
export const TestCaseListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  /// CSV per v2 plan §"Filters" (e.g., `?priority=P0,P1`). Coerced
  /// from string to array at parse time.
  priority: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined,
    ),
  status: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined,
    ),
  format: TestCaseFormat.optional(),
  /// `?hasLinks=true` filters to cases that have at least one
  /// TestCaseLink row. `?hasLinks=false` filters to cases with zero
  /// links. Omit for no filter.
  hasLinks: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((s) => (s === 'true' ? true : s === 'false' ? false : undefined)),
  /// Free-text title search (case-insensitive ILIKE substring).
  q: z.string().min(1).max(200).optional(),
});
export type TestCaseListQuery = z.infer<typeof TestCaseListQuery>;

export const TestCaseListItem = z.object({
  id: Uuid,
  projectId: Uuid,
  key: z.string(),
  title: NonEmpty,
  priority: Priority,
  status: TestCaseStatus,
  format: TestCaseFormat,
  generatedByAgent: GeneratedByAgent.nullable(),
  confidenceScore: z.number().min(0).max(1).nullable(),
  /// Number of linked requirements — derived via Prisma `_count`.
  linkCount: z.number().int().nonnegative(),
  createdBy: Uuid,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type TestCaseListItem = z.infer<typeof TestCaseListItem>;

export const TestCaseListResponse = z.object({
  ok: z.literal(true),
  testCases: z.array(TestCaseListItem),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  }),
});
export type TestCaseListResponse = z.infer<typeof TestCaseListResponse>;

/// Linked requirement summary (for detail endpoint). Just the
/// minimum FE needs to render an RTM coverage row.
export const LinkedRequirementSummary = z.object({
  requirementId: Uuid,
  key: z.string(),
  title: NonEmpty,
  priority: Priority,
  status: z.string(), // RequirementStatus enum value (string-mapped from Prisma)
});
export type LinkedRequirementSummary = z.infer<typeof LinkedRequirementSummary>;

/// Suite membership summary (for detail endpoint).
export const SuiteMembershipSummary = z.object({
  suiteId: Uuid,
  name: NonEmpty,
});
export type SuiteMembershipSummary = z.infer<typeof SuiteMembershipSummary>;

export const TestCaseDetailItem = TestCaseListItem.extend({
  preconditions: z.string(),
  stepsJson: z.array(TestStepSchema),
  expectedResult: z.string(),
  /// `format='gherkin'` cases only. Null otherwise.
  gherkin: z.string().nullable(),
  /// kb_chunk UUIDs that grounded the AI generation — populated only
  /// for Composer/Curator output. Null for manual cases.
  sourceChunkIds: z.array(Uuid).nullable(),
  rationale: z.string().nullable(),
  aiProvenanceJson: z.record(z.unknown()).nullable(),
  links: z.array(LinkedRequirementSummary),
  suiteMemberships: z.array(SuiteMembershipSummary),
});
export type TestCaseDetailItem = z.infer<typeof TestCaseDetailItem>;

export const TestCaseDetailResponse = z.object({
  ok: z.literal(true),
  testCase: TestCaseDetailItem,
});
export type TestCaseDetailResponse = z.infer<typeof TestCaseDetailResponse>;

export const TestCaseCreateResponse = z.object({
  ok: z.literal(true),
  testCase: TestCaseDetailItem,
});
export type TestCaseCreateResponse = z.infer<typeof TestCaseCreateResponse>;

export const TestCaseUpdateResponse = z.object({
  ok: z.literal(true),
  testCase: TestCaseDetailItem,
});
export type TestCaseUpdateResponse = z.infer<typeof TestCaseUpdateResponse>;

/// DELETE = soft-delete via `status='archived'` per task spec. The
/// row stays in TB-007 so historical run results / defect references
/// remain valid; queries should filter by `status != 'archived'`.
export const TestCaseDeleteResponse = z.object({
  ok: z.literal(true),
  testCaseId: Uuid,
  archived: z.literal(true),
});
export type TestCaseDeleteResponse = z.infer<typeof TestCaseDeleteResponse>;

// ─────────────────────────────────────────────────────────────────────
// M3 Day-13 TASK 2 — RTM linking endpoints.
//   POST   /api/test-cases/:caseId/links            (link to requirement)
//   DELETE /api/test-cases/:caseId/links/:reqId     (unlink)
//   GET    /api/requirements/:reqId/test-cases      (RTM coverage view)
// ─────────────────────────────────────────────────────────────────────

export const CreateTestCaseLinkInput = z.object({
  requirementId: Uuid,
});
export type CreateTestCaseLinkInput = z.infer<typeof CreateTestCaseLinkInput>;

export const TestCaseLinkResponse = z.object({
  ok: z.literal(true),
  testCaseId: Uuid,
  requirementId: Uuid,
  /// `created` = first-time link; `existed` = idempotent re-link
  /// (link already present). Both are 200/201 — the caller can
  /// retry safely without polluting the audit chain.
  outcome: z.enum(['created', 'existed']),
});
export type TestCaseLinkResponse = z.infer<typeof TestCaseLinkResponse>;

export const TestCaseUnlinkResponse = z.object({
  ok: z.literal(true),
  testCaseId: Uuid,
  requirementId: Uuid,
});
export type TestCaseUnlinkResponse = z.infer<typeof TestCaseUnlinkResponse>;

/// `GET /api/requirements/:reqId/test-cases` — RTM coverage from
/// the requirement perspective (counterpart to TestCaseDetailItem.links).
export const RequirementCoverageItem = z.object({
  testCaseId: Uuid,
  key: z.string(),
  title: NonEmpty,
  priority: Priority,
  status: TestCaseStatus,
  format: TestCaseFormat,
});
export type RequirementCoverageItem = z.infer<typeof RequirementCoverageItem>;

export const RequirementCoverageResponse = z.object({
  ok: z.literal(true),
  requirementId: Uuid,
  coverage: z.array(RequirementCoverageItem),
  total: z.number().int().nonnegative(),
});
export type RequirementCoverageResponse = z.infer<typeof RequirementCoverageResponse>;
