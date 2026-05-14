// QA Nexus PM1 — M4 (Day-18 #144) — test_run_results Zod schema (UPDATES TB-012).
//
// "execution" is the user-facing M4 term; "test_run_result" is the
// canonical table name (preserved). M4 migration 0004 adds:
//   actualResult + evidenceIds + blockedReason
// on top of the existing TB-012 columns.
//
// App-layer enforces: when status=blocked, blockedReason is REQUIRED;
// when status=failed, failureMessage is REQUIRED. Zod refines below.

import { z } from 'zod';
import { TestResultStatusEnum } from './enums';

export const TestExecutionSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  testCaseId: z.string().uuid(),
  status: TestResultStatusEnum,
  durationMs: z.number().int().min(0),
  evidenceUri: z.string().nullable(), // legacy single-evidence (deprecated)
  failureMessage: z.string().nullable(),
  stackTrace: z.string().nullable(),

  // M4 additions (migration 0004)
  actualResult: z.string().nullable(),
  evidenceIds: z.array(z.string().uuid()).default([]),
  blockedReason: z.string().nullable(), // required at app layer when status=blocked
});
export type TestExecution = z.infer<typeof TestExecutionSchema>;

/// PATCH /api/test-runs/{runId}/results/{id} — execution update input.
/// Refines: blockedReason required when status=blocked; failureMessage
/// required when status=failed.
export const TestExecutionUpdateInputSchema = z
  .object({
    status: TestResultStatusEnum,
    durationMs: z.number().int().min(0),
    actualResult: z.string().min(0).max(20_000).optional(),
    evidenceIds: z.array(z.string().uuid()).default([]),
    blockedReason: z.string().min(1).max(2_000).optional(),
    failureMessage: z.string().min(0).max(10_000).optional(),
    stackTrace: z.string().min(0).max(50_000).optional(),
  })
  .refine((v) => v.status !== 'blocked' || !!v.blockedReason, {
    message: 'blockedReason is required when status=blocked',
    path: ['blockedReason'],
  })
  .refine((v) => v.status !== 'failed' || !!v.failureMessage, {
    message: 'failureMessage is required when status=failed',
    path: ['failureMessage'],
  });
export type TestExecutionUpdateInput = z.infer<typeof TestExecutionUpdateInputSchema>;
