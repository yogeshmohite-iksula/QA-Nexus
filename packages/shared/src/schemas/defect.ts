// TB-015 defects + TB-016 rca_reports.
import { z } from 'zod';
import { Uuid, Timestamp, Priority, DefectStatus, NonEmpty } from './enums';

export const DefectSchema = z.object({
  id: Uuid,
  projectId: Uuid,
  key: z.string().min(2).max(40),
  title: NonEmpty,
  description: z.string(),
  severity: Priority,
  status: DefectStatus,
  triggeredByRunId: Uuid.nullable(),
  triggeredByTestCaseId: Uuid.nullable(),
  assigneeId: Uuid.nullable(),
  jiraIssueId: Uuid.nullable(),
  createdAt: Timestamp,
  resolvedAt: Timestamp.nullable(),
});
export type Defect = z.infer<typeof DefectSchema>;

export const CreateDefectInput = z.object({
  key: z.string().min(2).max(40),
  title: NonEmpty,
  description: z.string(),
  severity: Priority,
  triggeredByRunId: Uuid.optional(),
  triggeredByTestCaseId: Uuid.optional(),
  assigneeId: Uuid.optional(),
});
export type CreateDefectInput = z.infer<typeof CreateDefectInput>;

export const UpdateDefectInput = z.object({
  title: NonEmpty.optional(),
  description: z.string().optional(),
  severity: Priority.optional(),
  status: DefectStatus.optional(),
  assigneeId: Uuid.nullable().optional(),
});
export type UpdateDefectInput = z.infer<typeof UpdateDefectInput>;

// TB-016 rca_reports
export const RcaReportSchema = z.object({
  id: Uuid,
  defectId: Uuid,
  layer1StackJson: z.record(z.unknown()),
  layer2EnvJson: z.record(z.unknown()),
  layer3ConfigJson: z.record(z.unknown()),
  layer4CodeJson: z.record(z.unknown()),
  layer5DataJson: z.record(z.unknown()),
  topHypothesis: z.string(),
  createdByAgentRunId: Uuid,
  createdAt: Timestamp,
});
export type RcaReport = z.infer<typeof RcaReportSchema>;

// ─────────────────────────────────────────────────────────────────
// Read API (W2-R, Day-32) — F21 Defects Hub list + detail.
// Workspace-scoped reads. NOT audited — ERD §8.7 + Hard Rule 7 scope
// the audit log to STATE-CHANGING operations; a GET is not a state change.
// ─────────────────────────────────────────────────────────────────

/** Lightweight project projection on a defect row (F21 shows project key). */
export const DefectProjectRef = z.object({
  id: Uuid,
  key: z.string(),
  name: z.string(),
});
export type DefectProjectRef = z.infer<typeof DefectProjectRef>;

/** Lightweight assignee projection — nullable, unassigned defects exist. */
export const DefectAssigneeRef = z.object({
  id: Uuid,
  displayName: z.string(),
});
export type DefectAssigneeRef = z.infer<typeof DefectAssigneeRef>;

/** One row in the F21 Defects Hub list (core defect + joined refs).
 *  Adds the M4 (Day-18 #144) component/lifecycle columns — present on the
 *  prisma Defect model but NOT on the base DefectSchema (which the FE
 *  demo-seed mirrors); the read API surfaces them. `component` drives the
 *  F21 filter; verifiedAt/closedAt drive the F25 SLA panels. */
export const DefectListItem = DefectSchema.extend({
  component: z.string().nullable(),
  verifiedAt: Timestamp.nullable(),
  closedAt: Timestamp.nullable(),
  project: DefectProjectRef,
  assignee: DefectAssigneeRef.nullable(),
});
export type DefectListItem = z.infer<typeof DefectListItem>;

/** Detail view shares the list projections (RCA + history are separate
 *  endpoints; this is the F21 row → F22 header data). */
export const DefectDetailItem = DefectListItem;
export type DefectDetailItem = z.infer<typeof DefectDetailItem>;

/** GET /api/defects query filters. All optional; workspace scope is
 *  implicit (derived from the caller's session, never client-supplied). */
export const DefectListQuery = z.object({
  projectId: Uuid.optional(),
  status: DefectStatus.optional(),
  severity: Priority.optional(),
  assigneeId: Uuid.optional(),
  component: z.string().min(1).max(120).optional(),
  q: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type DefectListQuery = z.infer<typeof DefectListQuery>;

export const DefectListResponse = z.object({
  ok: z.literal(true),
  defects: z.array(DefectListItem),
  pagination: z.object({
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  }),
});
export type DefectListResponse = z.infer<typeof DefectListResponse>;

export const DefectDetailResponse = z.object({
  ok: z.literal(true),
  defect: DefectDetailItem,
});
export type DefectDetailResponse = z.infer<typeof DefectDetailResponse>;
