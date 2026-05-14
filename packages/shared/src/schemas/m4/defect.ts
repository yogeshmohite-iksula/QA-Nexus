// QA Nexus PM1 — M4 (Day-18 #144) — defect Zod schema (UPDATES TB-015).
//
// Existing TB-015 fields preserved; M4 adds `component` + `verifiedAt` +
// `closedAt`. Defects M4 schema lives under `m4/` to keep the M3-era
// `packages/shared/src/schemas/defect.ts` (if any) intact during the
// transition; M5 audit will dedupe.

import { z } from 'zod';
import { DefectStatusEnum, SeverityEnum } from './enums';

export const DefectSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  key: z.string().min(1), // e.g. "PAY-1472"
  title: z.string().min(1),
  description: z.string(),
  severity: SeverityEnum,
  status: DefectStatusEnum.default('new'),
  triggeredByRunId: z.string().uuid().nullable(),
  triggeredByTestCaseId: z.string().uuid().nullable(),
  assigneeId: z.string().uuid().nullable(),
  jiraIssueId: z.string().uuid().nullable(),

  // M4 additions (migration 0004)
  component: z.string().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  closedAt: z.coerce.date().nullable(),

  // Existing timestamps
  createdAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
});
export type Defect = z.infer<typeof DefectSchema>;

/// Create input — POST /api/defects body. Status defaults to 'new'.
export const DefectCreateInputSchema = z.object({
  projectId: z.string().uuid(),
  key: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().min(0).max(10_000),
  severity: SeverityEnum,
  triggeredByRunId: z.string().uuid().optional(),
  triggeredByTestCaseId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  component: z.string().min(1).max(120).optional(),
});
export type DefectCreateInput = z.infer<typeof DefectCreateInputSchema>;

/// PATCH /api/defects/{id}/status body — drives defect_history insert.
export const DefectStatusPatchSchema = z.object({
  toStatus: DefectStatusEnum,
  comment: z.string().max(2_000).optional(),
});
export type DefectStatusPatch = z.infer<typeof DefectStatusPatchSchema>;
