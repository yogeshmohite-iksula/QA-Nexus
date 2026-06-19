// TB-011 test_runs + TB-012 test_run_results.
import { z } from 'zod';
import { Uuid, Timestamp, RunTrigger, TestRunStatus, TestResultStatus, NonEmpty } from './enums';

export const TestRunSchema = z.object({
  id: Uuid,
  projectId: Uuid,
  suiteId: Uuid.nullable(),
  name: NonEmpty,
  triggeredBy: RunTrigger,
  triggeredByUserId: Uuid.nullable(),
  status: TestRunStatus,
  startedAt: Timestamp.nullable(),
  completedAt: Timestamp.nullable(),
  environment: NonEmpty,
});
export type TestRun = z.infer<typeof TestRunSchema>;

export const CreateTestRunInput = z.object({
  suiteId: Uuid.optional(),
  name: NonEmpty,
  triggeredBy: RunTrigger.default('manual'),
  environment: NonEmpty,
  testCaseIds: z.array(Uuid).optional(),
});
export type CreateTestRunInput = z.infer<typeof CreateTestRunInput>;

// TB-012 test_run_results
export const TestRunResultSchema = z.object({
  id: Uuid,
  runId: Uuid,
  testCaseId: Uuid,
  status: TestResultStatus,
  durationMs: z.number().int().nonnegative(),
  evidenceUri: z.string().nullable(),
  failureMessage: z.string().nullable(),
  stackTrace: z.string().nullable(),
});
export type TestRunResult = z.infer<typeof TestRunResultSchema>;

export const ReportTestRunResultInput = z.object({
  testCaseId: Uuid,
  status: TestResultStatus,
  durationMs: z.number().int().nonnegative(),
  evidenceUri: z.string().url().optional(),
  failureMessage: z.string().optional(),
  stackTrace: z.string().optional(),
});
export type ReportTestRunResultInput = z.infer<typeof ReportTestRunResultInput>;

// ─────────────────────────────────────────────────────────────────
// Read API (Day-32) — GET /api/test-runs list for F08 /home
// ACTIVE_RUNS + RECENT_RUNS. Workspace-scoped via project.workspaceId
// (the proven-live isolation layer; DB RLS is installed but inert for the
// app role per the Day-32 G5 probe). NOT audited — ERD §8.7 + Hard Rule 7
// scope the audit log to STATE-CHANGING operations; a GET is not one.
// Mirrors the W2-R defects read pattern (DefectListItem/Query/Response).
// ─────────────────────────────────────────────────────────────────

/** Lightweight project projection on a run row (home cards show project key).
 *  Mirrors DefectProjectRef — read `projectKey` as `project.key`. */
export const TestRunProjectRef = z.object({
  id: Uuid,
  key: z.string(),
  name: z.string(),
});
export type TestRunProjectRef = z.infer<typeof TestRunProjectRef>;

/** Lightweight triggering-user projection — NULLABLE: webhook/cron runs have
 *  no human triggerer. Distinct from the `trigger` RunTrigger enum below. */
export const TestRunUserRef = z.object({
  id: Uuid,
  displayName: z.string(),
});
export type TestRunUserRef = z.infer<typeof TestRunUserRef>;

/** One row in the /home ACTIVE_RUNS / RECENT_RUNS lists. Case counts are
 *  computed from test_run_results (NOT denormalized on the run row); passed/
 *  failed are optional for forward-compat (a queued run has no tallies yet).
 *  `trigger` = how the run started (manual/webhook/cron); `triggeredBy` = the
 *  human who started it (null for webhook/cron). */
export const TestRunListItem = z.object({
  id: Uuid,
  projectId: Uuid,
  name: NonEmpty,
  status: TestRunStatus,
  trigger: RunTrigger,
  environment: NonEmpty,
  startedAt: Timestamp.nullable(),
  completedAt: Timestamp.nullable(),
  totalCases: z.number().int().nonnegative(),
  passedCases: z.number().int().nonnegative().optional(),
  failedCases: z.number().int().nonnegative().optional(),
  triggeredBy: TestRunUserRef.nullable(),
  project: TestRunProjectRef,
});
export type TestRunListItem = z.infer<typeof TestRunListItem>;

/** GET /api/test-runs query filters. Workspace scope is implicit (session-
 *  derived, never client-supplied). OFFSET pagination (page/pageSize) — NOT
 *  the cursor pattern used by /api/audit. `status` filters ACTIVE_RUNS
 *  (e.g. 'running'); default sort started_at_desc covers RECENT_RUNS. */
export const TestRunListQuery = z.object({
  status: TestRunStatus.optional(),
  projectId: Uuid.optional(),
  sort: z.enum(['started_at_desc']).default('started_at_desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type TestRunListQuery = z.infer<typeof TestRunListQuery>;

export const TestRunListResponse = z.object({
  ok: z.literal(true),
  testRuns: z.array(TestRunListItem),
  pagination: z.object({
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  }),
});
export type TestRunListResponse = z.infer<typeof TestRunListResponse>;
