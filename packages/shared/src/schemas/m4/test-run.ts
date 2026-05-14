// QA Nexus PM1 — M4 (Day-18 #144) — test_runs Zod schema (UPDATES TB-011).
//
// Existing schema.prisma:525 (TestRun) already has startedAt + completedAt
// + status enum (queued/running/passed/failed/blocked/aborted) per
// PR #95 (M3 Curator scaffold + run service prep). M4 adds NO new
// columns to test_runs itself — this schema just exposes the M4 view
// of the canonical row shape.

import { z } from 'zod';
import { RunTriggerEnum, TestRunStatusEnum } from './enums';

export const TestRunSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  suiteId: z.string().uuid().nullable(),
  name: z.string().min(1),
  triggeredBy: RunTriggerEnum,
  triggeredByUserId: z.string().uuid().nullable(),
  status: TestRunStatusEnum.default('queued'),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  environment: z.string().min(1),
});
export type TestRun = z.infer<typeof TestRunSchema>;
