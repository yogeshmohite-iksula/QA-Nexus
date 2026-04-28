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
