// QA Nexus PM1 — M4 (Day-18 #144) — rca_reports Zod schema (UPDATES TB-016).
//
// Existing 5 per-layer JSON columns preserved (schema.prisma:644).
// M4 migration 0004 adds 5 confidence DOUBLE PRECISION columns +
// otelTraceId + feedback JSONB on top.
//
// Confidence canon (per A4 spec):
//   L1=0.90 · L2=0.80 · L3=0.60 · L4=0.50 · L5=0.40 baseline.
// Postgres CHECK constraint enforces 0.0-1.0; Zod mirrors here.

import { z } from 'zod';

const ConfidenceScalar = z.number().min(0).max(1).nullable();

export const RcaFeedbackSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    correctLayer: z.number().int().min(1).max(5).nullable().optional(),
    comment: z.string().max(5_000).nullable().optional(),
    submittedBy: z.string().uuid().optional(),
    submittedAt: z.coerce.date().optional(),
  })
  .default({});
export type RcaFeedback = z.infer<typeof RcaFeedbackSchema>;

export const RcaReportSchema = z.object({
  id: z.string().uuid(),
  defectId: z.string().uuid(),
  layer1StackJson: z.unknown(),
  layer2EnvJson: z.unknown(),
  layer3ConfigJson: z.unknown(),
  layer4CodeJson: z.unknown(),
  layer5DataJson: z.unknown(),
  topHypothesis: z.string(),
  createdByAgentRunId: z.string().uuid(),
  createdAt: z.coerce.date(),

  // M4 additions (migration 0004)
  layer1Confidence: ConfidenceScalar,
  layer2Confidence: ConfidenceScalar,
  layer3Confidence: ConfidenceScalar,
  layer4Confidence: ConfidenceScalar,
  layer5Confidence: ConfidenceScalar,
  otelTraceId: z.string().nullable(),
  feedback: RcaFeedbackSchema,
});
export type RcaReport = z.infer<typeof RcaReportSchema>;

/// POST /api/defects/{id}/rca/feedback body.
export const RcaFeedbackInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  correctLayer: z.number().int().min(1).max(5).nullable().optional(),
  comment: z.string().max(5_000).optional(),
});
export type RcaFeedbackInput = z.infer<typeof RcaFeedbackInputSchema>;
