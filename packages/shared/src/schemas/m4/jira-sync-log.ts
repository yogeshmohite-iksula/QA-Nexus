// QA Nexus PM1 — M4 (Day-18 #144) — jira_sync_logs Zod schema.
//
// Every Jira API call (outbound) or webhook processing (inbound).
// payloadHash = SHA-256 hex for dedupe + diff detection. retried +
// retryOf form a retry chain. F28 Audit surfaces failed entries.

import { z } from 'zod';
import { JiraSyncDirectionEnum } from './enums';

export const JiraSyncLogSchema = z.object({
  id: z.string().uuid(),
  jiraConnectionId: z.string().uuid().nullable(),
  direction: JiraSyncDirectionEnum,
  action: z.string().min(1), // 'create_issue' | 'fetch_issue' | ...
  defectId: z.string().uuid().nullable(),
  jiraIssueKey: z.string().nullable(),
  payloadHash: z.string().length(64), // SHA-256 hex
  httpStatus: z.number().int().min(100).max(599).nullable(),
  success: z.boolean(),
  errorMessage: z.string().nullable(),
  retried: z.boolean().default(false),
  retryOf: z.string().uuid().nullable(),
  occurredAt: z.coerce.date(),
  auditLogId: z.string().uuid().nullable(),
});
export type JiraSyncLog = z.infer<typeof JiraSyncLogSchema>;
