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

// ─────────────────────────────────────────────────────────────────────
// M1 Day-6 PM Block 3 — F28 audit log query + chain verification.
// ─────────────────────────────────────────────────────────────────────

/// Public projection of an audit row. Returned by GET /api/audit.
/// Adds actorEmail (joined from TB-002 users) for FE display ergonomics.
/// Includes prevHash + thisHash so an Admin doing forensics can spot-check
/// the chain without calling /verify-chain.
export const AuditLogEntry = z.object({
  id: Uuid,
  ts: Timestamp,
  actorUserId: Uuid.nullable(),
  actorEmail: z.string().email().nullable(),
  action: NonEmpty,
  entity: NonEmpty,
  entityId: Uuid.nullable(),
  payload: z.record(z.unknown()),
  prevHash: Sha256Hex,
  thisHash: Sha256Hex,
});
export type AuditLogEntry = z.infer<typeof AuditLogEntry>;

/// Query params for GET /api/audit. Date range default = last 7 days,
/// max 30-day window to keep query fast on Neon free tier.
export const ListAuditQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  userId: Uuid.optional(),
  action: NonEmpty.optional(),
  /** Opaque cursor — service decodes to a (createdAt, id) tuple. */
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListAuditQuery = z.infer<typeof ListAuditQuery>;

export const ListAuditResponse = z.object({
  ok: z.literal(true),
  items: z.array(AuditLogEntry),
  /** Opaque base64 cursor for the next page. NULL = last page. */
  nextCursor: z.string().nullable(),
});
export type ListAuditResponse = z.infer<typeof ListAuditResponse>;

/// Response for GET /api/audit/verify-chain. Caps at 10 000 rows for
/// free-tier Neon safety; larger workspaces resume via cursor in M2.
export const VerifyChainResponse = z.object({
  ok: z.literal(true),
  valid: z.boolean(),
  /** ID of the first row whose recomputed hash didn't match. NULL if valid. */
  brokenAtId: Uuid.nullable(),
  totalRows: z.number().int().nonnegative(),
  verifiedRows: z.number().int().nonnegative(),
  verifyDurationMs: z.number().int().nonnegative(),
  /** True if more rows exist beyond the verified window. */
  truncated: z.boolean(),
});
export type VerifyChainResponse = z.infer<typeof VerifyChainResponse>;

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
