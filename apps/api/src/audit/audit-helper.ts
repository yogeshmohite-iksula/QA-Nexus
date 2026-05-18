// HMAC-SHA256 chained audit-log write helper.
// Spec: PM1_ERD §3.13 + CLAUDE.md Hard Rule 7 + database.md.
//
// This is a T021-stage helper. Block 4 (T027) will refactor it into a proper
// AuditService with an interceptor; the chain-write semantics here become the
// kernel of that service.
//
// Chain rules (binding):
//   - prev_hash = previous row's this_hash for this workspace, or '0'*64 (genesis).
//   - this_hash = HMAC_SHA256(BETTER_AUTH_SECRET, prev_hash || canonical(payload))
//   - chain is per-workspace (since unique index is (workspace_id, created_at))
//   - rows are append-only; UPDATE/DELETE rejected by Postgres triggers (raw SQL migration)
//
// We grab the latest row WITHIN A TRANSACTION (FOR UPDATE) to prevent two
// concurrent writes from racing on the same prev_hash. This serializes audit
// writes per workspace, which is the correct trade-off for an append-only
// chain at PM1 scale (8 users, max ~1 audit/sec sustained).
import { createHmac } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

export interface AuditWriteParams {
  workspaceId: string;
  actorId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  payload: Record<string, unknown>;
  /** Day-21 Kimi-K2 HIGH triage (c): HMAC secret. Loaded ONCE at boot by
   *  AuditService.onModuleInit() and passed in per call. Was previously read
   *  from process.env inside this helper on every write — slow + late-failing
   *  if the env var was ever unset/rotated mid-process. Min 32 chars. */
  secret: string;
}

const GENESIS_HASH = '0'.repeat(64);

function canonicalJson(obj: unknown): string {
  // Stable key ordering so the hash is reproducible.
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          canonicalJson((obj as Record<string, unknown>)[k]),
      )
      .join(',') +
    '}'
  );
}

/**
 * Append a row to audit_log with a correctly-computed HMAC chain link.
 * Caller is responsible for passing a Prisma client (so this can run inside
 * an outer transaction if the calling endpoint needs atomicity) AND the
 * boot-loaded HMAC secret (Day-21 Kimi-K2 HIGH triage (c) — no longer read
 * from process.env on each call; AuditService.onModuleInit owns the load).
 */
export async function writeAuditRow(
  prisma: PrismaClient,
  params: AuditWriteParams,
): Promise<{ id: string; prevHash: string; thisHash: string }> {
  const { secret } = params;
  if (!secret || secret.length < 32) {
    throw new Error(
      'writeAuditRow: secret missing or too short (need ≥32 chars). ' +
        'AuditService must inject boot-loaded BETTER_AUTH_SECRET.',
    );
  }
  // Serialize per-workspace by taking an advisory lock keyed on the workspace UUID's
  // first 8 hex chars (interpreted as int4). pg_advisory_xact_lock uses 64-bit but
  // we only need ~workspace-cardinality uniqueness — first 8 hex chars of UUID = 32 bits = plenty.
  return await prisma.$transaction(async (tx) => {
    const wsLockKey = parseInt(
      params.workspaceId.replace(/-/g, '').slice(0, 8),
      16,
    );
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${wsLockKey})`);
    const previous = await tx.auditLog.findFirst({
      where: { workspaceId: params.workspaceId },
      orderBy: { createdAt: 'desc' },
      select: { thisHash: true },
    });
    const prevHash = previous?.thisHash ?? GENESIS_HASH;
    const payloadJson = canonicalJson(params.payload);
    const thisHash = createHmac('sha256', secret)
      .update(prevHash + payloadJson)
      .digest('hex');
    const row = await tx.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        actorId: params.actorId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        payload: params.payload as object,
        prevHash,
        thisHash,
      },
      select: { id: true, prevHash: true, thisHash: true },
    });
    return row;
  });
}
