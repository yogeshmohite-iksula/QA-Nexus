// QA Nexus PM1 — M4 (Day-18 #144) — evidence Zod schema.
//
// Mirrors `evidence` table in 0004_m4_runs_defects_jira.sql.
// XOR parent: each row attaches to EXACTLY ONE of test_run_result OR
// defect (DB CHECK constraint enforces; Zod refine here doubles up at
// the API edge).

import { z } from 'zod';

export const EvidenceSchema = z
  .object({
    id: z.string().uuid(),
    testRunResultId: z.string().uuid().nullable(),
    defectId: z.string().uuid().nullable(),
    r2Path: z.string().min(1),
    signedUrlExpiresAt: z.coerce.date().nullable(),
    contentType: z.string().nullable(),
    sizeBytes: z.number().int().min(0).nullable(),
    filename: z.string().nullable(),
    createdBy: z.string().uuid().nullable(),
    createdAt: z.coerce.date(),
    auditLogId: z.string().uuid().nullable(),
  })
  .refine((v) => (v.testRunResultId !== null) !== (v.defectId !== null), {
    message: 'evidence must attach to exactly ONE of test_run_result_id or defect_id (XOR)',
    path: ['testRunResultId'],
  });
export type Evidence = z.infer<typeof EvidenceSchema>;

/// Inbound create — server fills id, createdAt, signedUrlExpiresAt.
/// Caller MUST provide exactly one of testRunResultId or defectId.
export const EvidenceCreateInputSchema = z
  .object({
    testRunResultId: z.string().uuid().nullable().default(null),
    defectId: z.string().uuid().nullable().default(null),
    r2Path: z.string().min(1),
    contentType: z.string().optional(),
    sizeBytes: z.number().int().min(0).optional(),
    filename: z.string().optional(),
  })
  .refine((v) => (v.testRunResultId !== null) !== (v.defectId !== null), {
    message: 'XOR parent required',
    path: ['testRunResultId'],
  });
export type EvidenceCreateInput = z.infer<typeof EvidenceCreateInputSchema>;
