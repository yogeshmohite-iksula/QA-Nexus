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
