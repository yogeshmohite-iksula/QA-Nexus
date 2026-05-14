// QA Nexus PM1 — M4 (Day-18 #144) — defect_history Zod schema.
//
// One row per defect status change. fromStatus=NULL on the genesis
// 'Create' row. transitionedAt + auditLogId form a tamper-evident
// chain via the audit_log HMAC reference.

import { z } from 'zod';
import { DefectStatusEnum } from './enums';

export const DefectHistorySchema = z.object({
  id: z.string().uuid(),
  defectId: z.string().uuid(),
  fromStatus: DefectStatusEnum.nullable(), // null on the genesis 'Create' row
  toStatus: DefectStatusEnum,
  actorId: z.string().uuid().nullable(),
  comment: z.string().nullable(),
  transitionedAt: z.coerce.date(),
  auditLogId: z.string().uuid().nullable(),
});
export type DefectHistory = z.infer<typeof DefectHistorySchema>;
