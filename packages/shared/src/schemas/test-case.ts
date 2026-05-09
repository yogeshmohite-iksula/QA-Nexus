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

// ─────────────────────────────────────────────────────────────────────
// M3 Day-13 TASK BE-1 — Composer (A1 / Test Case Generator) endpoint.
//
//   POST /api/projects/:projectId/requirements/:reqId/test-cases/generate
//
// Pattern A scaffold: returns 5 canned-but-realistic test cases for any
// requirement. Day-15 swaps the service body to call Groq
// openai/gpt-oss-120b with response_format=json_schema. Wire shape is
// LOCKED so FE+1's F16a Composer modal can implement against a stable
// contract.
//
// IMPORTANT: this endpoint does NOT insert TestCase rows. It returns
// proposed cases for the user to review in F16a + accept individually
// (each accepted case is then POSTed to /api/projects/:projectId/test-cases
// with format='gherkin' or 'step' + generatedByAgent='composer' +
// sourceChunkIds[] + rationale). A TestCaseGenerationRun row IS written
// (TB-022) so audit + analytics can correlate generation runs with the
// cases they produced.
// ─────────────────────────────────────────────────────────────────────

export const ComposerGenerateRequest = z.object({
  /// How many test cases to generate. Capped at 10 to keep the FE
  /// review modal manageable + Groq RPD usage in check.
  count: z.number().int().min(1).max(10).default(5),
  /// Optional output format. 'auto' lets Composer decide based on the
  /// requirement's domain (e.g., gherkin for behavior-driven flows,
  /// step for granular UI verification). Day-15 service body honors
  /// this; today's Pattern A scaffold always emits step format.
  format: z.enum(['auto', 'step', 'gherkin']).default('auto'),
});
export type ComposerGenerateRequest = z.infer<typeof ComposerGenerateRequest>;

/// Proposed (not-yet-persisted) test case from Composer. Same field
/// names as `CreateTestCaseInput` so the FE can post each one back
/// with minimal massaging once the user accepts in F16a.
export const ComposerGeneratedCase = z.object({
  /// Server-generated suggested key (FE may rename before POST).
  /// Format: `TC-<projectKey>-<NNN>` where NNN is a stable digest of
  /// (requirementId + index). FE re-derives if the project's keyspace
  /// has shifted between proposal + accept.
  key: z.string().min(2).max(40),
  title: NonEmpty,
  preconditions: z.string(),
  stepsJson: z.array(TestStepSchema),
  expectedResult: z.string(),
  priority: Priority,
  format: TestCaseFormat,
  /// Set when format='gherkin'. Null for step format.
  gherkin: z.string().nullable(),
  /// LLM-rendered "why this case" — surfaced in F16a review UI under
  /// each proposed case. Free-form prose; no PII guard at this layer
  /// because it's user-facing review copy.
  rationale: z.string(),
  /// kb_chunk UUIDs that grounded this proposal. Empty when Composer
  /// ran without RAG context (free-form prompt mode).
  sourceChunkIds: z.array(Uuid),
});
export type ComposerGeneratedCase = z.infer<typeof ComposerGeneratedCase>;

export const ComposerGenerateResponse = z.object({
  ok: z.literal(true),
  /// FK target for `TestCase.generationRunId` once the FE accepts +
  /// POSTs each case (deferred — current TB-022 schema doesn't yet
  /// have that FK; M3.5 follow-up).
  runId: Uuid,
  /// Proposed test cases. Caller iterates + POSTs each one.
  cases: z.array(ComposerGeneratedCase),
  /// Provider metadata (mirrors KbAnswerLlmMetadata from M2 PR #57).
  llmMetadata: z.object({
    providerName: z.string(),
    modelUsed: z.string(),
    tokensIn: z.number().int().nonnegative(),
    tokensOut: z.number().int().nonnegative(),
    latencyMs: z.number().int().nonnegative(),
    fallbackUsed: z.boolean(),
  }),
  /// True until Day-15 swaps the service body for the real Groq call.
  /// FE shows a "demo data" banner when this is true (mirrors M2 Step-4
  /// `stubbed: true` pattern from KbSearchResponse).
  stubbed: z.boolean(),
});
export type ComposerGenerateResponse = z.infer<typeof ComposerGenerateResponse>;

// ─────────────────────────────────────────────────────────────────────
// M3 Day-13 TASK BE-3 — Curator (A2 / Duplicate Detection) endpoint.
//
//   POST /api/projects/:projectId/test-cases/:tcId/duplicates
//
// Pattern A scaffold: returns canned similarity scores. Day-16 swaps
// the service body to call pgvector cosine search against the
// project's existing test_case embeddings. Wire shape locked NOW so
// FE+1's F14m2 Curator ⓘ near-dup banner can implement against a
// stable contract.
//
// Threshold canon (per CLAUDE.md + ADR-014 lands Day-15):
//   ≥ 0.95 → 'block' (true duplicate; FE blocks save with explanation)
//   ≥ 0.85 → 'flag'  (near-duplicate warning; FE shows banner with
//                     "similar to TC-RET-001 — review before saving")
//   < 0.85 → not surfaced (below threshold; matches dropped from the
//                          response so FE doesn't render noise)
// ─────────────────────────────────────────────────────────────────────

/// Verdict for the OVERALL check, derived from the highest match.
/// 'clear' = no matches above thresholdFlag; safe to save.
/// 'flag'  = at least one match in [thresholdFlag, thresholdBlock).
/// 'block' = at least one match >= thresholdBlock.
export const CuratorVerdict = z.enum(['clear', 'flag', 'block']);
export type CuratorVerdict = z.infer<typeof CuratorVerdict>;

/// Per-match verdict — 'flag' for [thresholdFlag, thresholdBlock),
/// 'block' for >= thresholdBlock. (Below-flag matches are dropped.)
export const CuratorMatchVerdict = z.enum(['flag', 'block']);
export type CuratorMatchVerdict = z.infer<typeof CuratorMatchVerdict>;

/// Hard caps + defaults from CLAUDE.md canon. Tests pin these exact
/// values; ADR-014 Day-15 may revise once we have pilot data.
export const CURATOR_THRESHOLD_FLAG_DEFAULT = 0.85;
export const CURATOR_THRESHOLD_BLOCK_DEFAULT = 0.95;
export const CURATOR_TOP_K_DEFAULT = 5;
export const CURATOR_TOP_K_MAX = 20;

export const CuratorCheckRequest = z
  .object({
    /// Lower bound for surfacing matches (default 0.85). Below this
    /// score, matches are dropped from the response.
    thresholdFlag: z.number().min(0).max(1).default(CURATOR_THRESHOLD_FLAG_DEFAULT),
    /// Lower bound for 'block' verdict (default 0.95). MUST be >
    /// thresholdFlag or `.refine()` fails.
    thresholdBlock: z.number().min(0).max(1).default(CURATOR_THRESHOLD_BLOCK_DEFAULT),
    /// Max matches to return (default 5, capped at 20).
    topK: z.number().int().min(1).max(CURATOR_TOP_K_MAX).default(CURATOR_TOP_K_DEFAULT),
  })
  .refine((v) => v.thresholdBlock > v.thresholdFlag, {
    message: 'thresholdBlock must be greater than thresholdFlag',
    path: ['thresholdBlock'],
  });
export type CuratorCheckRequest = z.infer<typeof CuratorCheckRequest>;

export const CuratorMatch = z.object({
  candidateCaseId: Uuid,
  candidateCaseKey: z.string(),
  candidateCaseTitle: NonEmpty,
  /// Cosine similarity in [0, 1].
  similarity: z.number().min(0).max(1),
  verdict: CuratorMatchVerdict,
});
export type CuratorMatch = z.infer<typeof CuratorMatch>;

export const CuratorCheckResponse = z.object({
  ok: z.literal(true),
  testCaseId: Uuid,
  /// Overall verdict derived from the highest-scoring match.
  /// 'clear' when matches[] is empty.
  verdict: CuratorVerdict,
  /// Highest similarity in matches[]. 0 when matches[] is empty.
  highestSimilarity: z.number().min(0).max(1),
  /// Matches above thresholdFlag, sorted by similarity DESC.
  /// Capped at topK.
  matches: z.array(CuratorMatch),
  /// Thresholds used for this call (echoes request defaults so the
  /// FE can render "n/k cases above 0.85" copy without reasserting).
  thresholds: z.object({
    flag: z.number().min(0).max(1),
    block: z.number().min(0).max(1),
  }),
  /// Search metadata. Pattern A returns synthetic values; Day-16's
  /// real pgvector query populates from actual SQL execution.
  searchMetadata: z.object({
    /// Number of test cases scanned (whole project minus the source).
    candidatesScanned: z.number().int().nonnegative(),
    /// Wall-clock duration of the similarity search.
    durationMs: z.number().int().nonnegative(),
  }),
  /// True until Day-16 swaps the service body for the real pgvector
  /// HNSW cosine search. FE shows a "demo data" banner when this is
  /// true (mirrors KbSearchResponse.stubbed pattern from M2 Step 4).
  stubbed: z.boolean(),
});
export type CuratorCheckResponse = z.infer<typeof CuratorCheckResponse>;

// ─────────────────────────────────────────────────────────────────────
// M3 Day-13 TASK BE-2 — Bulk operations.
//
//   POST /api/projects/:projectId/test-cases/bulk-link
//   POST /api/projects/:projectId/test-cases/bulk-delete
//
// Both endpoints accept an array of testCaseIds (1..MAX) and return
// per-row outcome arrays so the FE can render success/failure UX
// without a second round-trip. Used by F14m2 Link Test Case modal +
// F14 list-page bulk-archive checkbox flow.
// ─────────────────────────────────────────────────────────────────────

/// Hard cap on bulk operations — keeps Postgres transaction size +
/// audit row size bounded. M3 pilot upper bound is 50 cases per
/// project; larger ops should be re-thought (CSV import path).
export const BULK_OPERATION_MAX_IDS = 50;

export const BulkLinkInput = z.object({
  /// Requirement to link all listed test cases to. Must belong to the
  /// project in the URL path. Cross-project requirementId → 404.
  requirementId: Uuid,
  /// 1..50 unique test case UUIDs. All must belong to the project in
  /// the URL path.
  testCaseIds: z.array(Uuid).min(1).max(BULK_OPERATION_MAX_IDS),
});
export type BulkLinkInput = z.infer<typeof BulkLinkInput>;

export const BulkLinkOutcomeItem = z.object({
  testCaseId: Uuid,
  /// 'created' = link did not exist + was inserted.
  /// 'existed' = link already present (idempotent no-op).
  outcome: z.enum(['created', 'existed']),
});
export type BulkLinkOutcomeItem = z.infer<typeof BulkLinkOutcomeItem>;

export const BulkLinkFailureItem = z.object({
  testCaseId: Uuid,
  /// Short error key the FE can map to a friendly message:
  ///   'not_found'        — testCaseId not in this project
  ///   'cross_project'    — testCase exists but in a different project
  ///   'cross_workspace'  — testCase exists but in a different workspace
  reason: z.enum(['not_found', 'cross_project', 'cross_workspace']),
});
export type BulkLinkFailureItem = z.infer<typeof BulkLinkFailureItem>;

export const BulkLinkResponse = z.object({
  ok: z.literal(true),
  requirementId: Uuid,
  linked: z.array(BulkLinkOutcomeItem),
  failed: z.array(BulkLinkFailureItem),
  /// Convenience aggregates for FE summary line.
  totals: z.object({
    requested: z.number().int().nonnegative(),
    created: z.number().int().nonnegative(),
    existed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
});
export type BulkLinkResponse = z.infer<typeof BulkLinkResponse>;

export const BulkDeleteInput = z.object({
  /// 1..50 unique test case UUIDs. All must belong to the project in
  /// the URL path. Mixed-project IDs return per-row 'cross_project'
  /// in `failed` rather than failing the whole call.
  testCaseIds: z.array(Uuid).min(1).max(BULK_OPERATION_MAX_IDS),
});
export type BulkDeleteInput = z.infer<typeof BulkDeleteInput>;

export const BulkDeleteOutcomeItem = z.object({
  testCaseId: Uuid,
});
export type BulkDeleteOutcomeItem = z.infer<typeof BulkDeleteOutcomeItem>;

export const BulkDeleteFailureItem = z.object({
  testCaseId: Uuid,
  reason: z.enum(['not_found', 'cross_project', 'cross_workspace']),
});
export type BulkDeleteFailureItem = z.infer<typeof BulkDeleteFailureItem>;

export const BulkDeleteResponse = z.object({
  ok: z.literal(true),
  archived: z.array(BulkDeleteOutcomeItem),
  failed: z.array(BulkDeleteFailureItem),
  totals: z.object({
    requested: z.number().int().nonnegative(),
    archived: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
});
export type BulkDeleteResponse = z.infer<typeof BulkDeleteResponse>;
