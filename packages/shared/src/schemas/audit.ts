// audit_log + agent_runs (auxiliary, not in ERD §5).
import { z } from 'zod';
import { Uuid, Timestamp, AgentKind, AgentRunStatus, NonEmpty } from './enums';

// 64-char hex string for HMAC-SHA256 hashes.
export const Sha256Hex = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/);

export const AuditLogSchema = z.object({
  id: Uuid,
  workspaceId: Uuid,
  actorId: Uuid.nullable(),
  entityType: NonEmpty,
  entityId: Uuid.nullable(),
  action: NonEmpty,
  payload: z.record(z.unknown()),
  prevHash: Sha256Hex,
  thisHash: Sha256Hex,
  createdAt: Timestamp,
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

/// Input passed to AuditLogService.append() — service computes prev_hash +
/// this_hash internally.
export const AppendAuditLogInput = z.object({
  actorId: Uuid.nullable(),
  entityType: NonEmpty,
  entityId: Uuid.nullable(),
  action: NonEmpty,
  payload: z.record(z.unknown()),
});
export type AppendAuditLogInput = z.infer<typeof AppendAuditLogInput>;

// agent_runs
export const AgentRunSchema = z.object({
  id: Uuid,
  workspaceId: Uuid,
  agentKind: AgentKind,
  status: AgentRunStatus,
  startedAt: Timestamp.nullable(),
  completedAt: Timestamp.nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
  evalResult: z.record(z.unknown()).nullable(),
  errorClass: z.string().nullable(),
  createdAt: Timestamp,
});
export type AgentRun = z.infer<typeof AgentRunSchema>;
