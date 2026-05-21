// QA Nexus PM1 — M5 (Day-24 P0 — ADR-021 Reports backend) — Zod schemas.
//
// Shared between BE (apps/api ReportsController validates inbound request,
// returns Response envelope) and FE (apps/web F23 Reports Studio for
// client-side validation + typed React Query hooks).
//
// Per ADR-021 §1: single POST /api/reports endpoint, body is a discriminated
// union on `kind` (six report kinds). One Zod entry + one SQL builder + one
// post-processor per kind keeps M6 extension cost flat.

import { z } from 'zod';

// ============================================================
// SHARED PRIMITIVES
// ============================================================

/// 6 report kinds per ADR-021 §1 ratified scope.
export const ReportKindSchema = z.enum([
  'cycle_pass_rate',
  'defect_age',
  'agent_cost',
  'sprint_progress',
  'test_coverage',
  'requirement_coverage',
]);
export type ReportKind = z.infer<typeof ReportKindSchema>;

/// Time window — sprint = sprint_current() helper; 7d/30d/90d = relative;
/// custom = explicit ISO bounds (validated server-side, end > start).
export const ReportTimeRangeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('sprint') }),
  z.object({ kind: z.literal('7d') }),
  z.object({ kind: z.literal('30d') }),
  z.object({ kind: z.literal('90d') }),
  z.object({
    kind: z.literal('custom'),
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
]);
export type ReportTimeRange = z.infer<typeof ReportTimeRangeSchema>;

// ============================================================
// REQUEST
// ============================================================

/// POST /api/reports body schema.
/// `filters` is loose record by design — kind-specific shapes live in the
/// per-kind SQL builder. Server-side rejects unknown filter keys per kind.
export const ReportRequestSchema = z.object({
  kind: ReportKindSchema,
  projectId: z.string().uuid(),
  timeRange: ReportTimeRangeSchema,
  filters: z.record(z.string(), z.unknown()).optional(),
  groupBy: z.array(z.string()).optional(),
});
export type ReportRequest = z.infer<typeof ReportRequestSchema>;

// ============================================================
// PER-KIND DATA SHAPES
// ============================================================

/// cycle_pass_rate — time series + KPI summary.
export const CyclePassRateDataSchema = z.object({
  series: z.array(
    z.object({
      ts: z.string().datetime(),
      passRate: z.number().min(0).max(1),
    }),
  ),
  kpi: z.object({
    current: z.number().min(0).max(1),
    avg30d: z.number().min(0).max(1),
  }),
});
export type CyclePassRateData = z.infer<typeof CyclePassRateDataSchema>;

/// defect_age — histogram + median.
export const DefectAgeDataSchema = z.object({
  buckets: z.array(z.object({ ageBin: z.string(), count: z.number().int().nonnegative() })),
  medianAgeDays: z.number().nonnegative(),
});
export type DefectAgeData = z.infer<typeof DefectAgeDataSchema>;

/// agent_cost — per-provider breakdown.
export const AgentCostDataSchema = z.object({
  byProvider: z.record(
    z.string(),
    z.object({
      usd: z.number().nonnegative(),
      tokens: z.number().int().nonnegative(),
    }),
  ),
  totalUsd: z.number().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});
export type AgentCostData = z.infer<typeof AgentCostDataSchema>;

/// sprint_progress — current sprint burnup + velocity.
export const SprintProgressDataSchema = z.object({
  sprintId: z.string().nullable(),
  pointsCompleted: z.number().int().nonnegative(),
  pointsRemaining: z.number().int().nonnegative(),
  velocity: z.number().nonnegative(),
});
export type SprintProgressData = z.infer<typeof SprintProgressDataSchema>;

/// test_coverage — execution depth + gaps.
export const TestCoverageDataSchema = z.object({
  totalCases: z.number().int().nonnegative(),
  executed: z.number().int().nonnegative(),
  passRate: z.number().min(0).max(1),
  gaps: z.array(z.string()),
});
export type TestCoverageData = z.infer<typeof TestCoverageDataSchema>;

/// requirement_coverage — requirement → test-case linkage health.
export const RequirementCoverageDataSchema = z.object({
  totalReqs: z.number().int().nonnegative(),
  covered: z.number().int().nonnegative(),
  gaps: z.array(z.string()),
});
export type RequirementCoverageData = z.infer<typeof RequirementCoverageDataSchema>;

// ============================================================
// RESPONSE ENVELOPE
// ============================================================

/// Uniform response — every kind returns the same envelope shape with
/// kind-specific `data` payload. `source` tells FE whether it was a
/// cache hit (cheap), a fresh compute (slower), or a stale-served
/// SWR hit (instant but background refresh kicked off).
export const ReportResponseSchema = z.object({
  kind: ReportKindSchema,
  projectId: z.string().uuid(),
  timeRange: ReportTimeRangeSchema,
  aggregatedAt: z.string().datetime(),
  source: z.enum(['cache_fresh', 'cache_stale_swr', 'computed', 'precomputed']),
  isStale: z.boolean(),
  data: z.union([
    CyclePassRateDataSchema,
    DefectAgeDataSchema,
    AgentCostDataSchema,
    SprintProgressDataSchema,
    TestCoverageDataSchema,
    RequirementCoverageDataSchema,
  ]),
});
export type ReportResponse = z.infer<typeof ReportResponseSchema>;

// ============================================================
// TEMPLATE — save/load report configurations
// ============================================================

export const ReportTemplateCreateSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(120),
  config: ReportRequestSchema,
  isShared: z.boolean().default(false),
});
export type ReportTemplateCreate = z.infer<typeof ReportTemplateCreateSchema>;

export const ReportTemplateSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  name: z.string(),
  config: ReportRequestSchema,
  isShared: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;

export const ReportTemplateListResponseSchema = z.object({
  templates: z.array(ReportTemplateSchema),
});
export type ReportTemplateListResponse = z.infer<typeof ReportTemplateListResponseSchema>;
