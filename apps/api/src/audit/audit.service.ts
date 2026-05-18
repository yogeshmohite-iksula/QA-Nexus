// Spec: PM1_ERD §3.13 + CLAUDE.md Hard Rule 7 + database.md.
//
// AuditService is the single entry point for the HMAC-SHA256 chained
// audit_log writes. Wraps the lower-level `writeAuditRow` helper from
// T021 with ergonomic methods + workspace-id resolution + an async
// fire-and-forget mode for write-on-the-side cases (deny audits, etc.).
//
// Spec source: MS0-T027. Replaces the inline `writeAuthAudit` shim
// added in T021. The chain semantics are unchanged — same helper, same
// HMAC, same per-workspace serialization via pg_advisory_xact_lock.
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { writeAuditRow } from './audit-helper';

/** Helper: canonical-key JSON for hash recomputation. Mirrors the
 *  algorithm in audit-helper.ts so verify-chain produces identical
 *  hashes to what writeAuditRow produced. Pure function — duplicated
 *  here intentionally to keep audit-helper.ts free of public exports. */
function canonicalJson(obj: unknown): string {
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

const GENESIS_HASH = '0'.repeat(64);
const VERIFY_CHAIN_ROW_CAP = 10_000;

export interface AuditWriteInput {
  /** UUID of the workspace this event lives under. */
  workspaceId: string;
  /** UUID of the TB-002 user who performed the action. NULL for system actions. */
  actorId: string | null;
  /** Logical entity type, e.g. "auth", "workspace", "test_case", "defect". */
  entityType: string;
  /** UUID of the affected entity, when applicable. NULL for sweeping actions. */
  entityId: string | null;
  /** Action verb in snake_case, e.g. "created", "magic_link_sent",
   *  "rbac_denied", "redacted". Free-form by design — the chain hashes the
   *  payload, not the action vocabulary. */
  action: string;
  /** JSONB payload — anything reproducible. Hashed via canonical-key JSON. */
  payload: Record<string, unknown>;
}

@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);
  /** Day-21 Kimi-K2 HIGH triage (c): boot-loaded HMAC secret. NEVER read
   *  process.env directly elsewhere in this service — onModuleInit owns the
   *  load + validate, then this field is read-only. */
  private secret!: string;

  constructor(private readonly prisma: PrismaService) {}

  /** Boot-time secret load + validation. App MUST crash here on missing or
   *  too-short secret — the audit chain MUST be signable (PM1_ERD §3.13 +
   *  CLAUDE.md Hard Rule 7 are binding; a chain that can't sign is a
   *  Sev-1 incident, not a degraded mode). */
  onModuleInit(): void {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        'AuditService.onModuleInit: BETTER_AUTH_SECRET missing or too short ' +
          '(need ≥32 chars). Set in .env (dev) or Render env (prod).',
      );
    }
    this.secret = secret;
    this.logger.log(
      `audit HMAC secret loaded at boot (len=${secret.length} chars)`,
    );
  }

  /**
   * Write an audit row synchronously. Returns the new row's id + thisHash.
   * Throws on failure — callers should ensure the surrounding HTTP request
   * fails too (the audit chain is binding; a missed audit row is a Sev-2
   * incident, not a swallowed log).
   */
  async write(
    input: AuditWriteInput,
  ): Promise<{ id: string; thisHash: string }> {
    const row = await writeAuditRow(this.prisma, {
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      payload: input.payload,
      secret: this.secret,
    });
    return { id: row.id, thisHash: row.thisHash };
  }

  /**
   * Fire-and-forget variant for side-effect audits where the chain integrity
   * matters but the calling endpoint shouldn't block on a slow Postgres write
   * (e.g., `rbac_denied` rows from a guard — the response is already
   * 403 by the time we want to record). Errors are logged at WARN level.
   */
  writeNonBlocking(input: AuditWriteInput): void {
    this.write(input).catch((err) => {
      this.logger.warn(
        `audit_log non-blocking write FAILED for action=${input.action} ` +
          `workspace=${input.workspaceId.slice(0, 8)}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  /**
   * Resolve workspace_id + actor_id from an email (BetterAuth's auth_user.email
   * → TB-002 users.email join). Falls back to the seeded Iksula workspace
   * with actor=null for events that fire BEFORE a TB-002 user exists
   * (e.g., sign-up magic-link sent for a non-pilot email).
   */
  async resolveActorByEmail(
    email: string,
  ): Promise<{ workspaceId: string; actorId: string | null }> {
    const appUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, workspaceId: true },
    });
    if (appUser) {
      return { workspaceId: appUser.workspaceId, actorId: appUser.id };
    }
    const fallback = await this.prisma.workspace.findFirstOrThrow({
      select: { id: true },
    });
    return { workspaceId: fallback.id, actorId: null };
  }

  // ────────────────────────────────────────────────────────────────────
  // M1 Day-6 PM Block 3 — read endpoints (F28 audit tab).
  // ────────────────────────────────────────────────────────────────────

  /**
   * Cursor-paginated list of audit rows for the given workspace.
   * Filters AND together. Cursor encodes (createdAt, id) so pagination
   * is stable across writes (vs offset which would shift on inserts).
   */
  async query(
    workspaceId: string,
    filters: {
      from?: string;
      to?: string;
      userId?: string;
      action?: string;
      cursor?: string;
      limit?: number;
    },
  ): Promise<{ items: AuditQueryRow[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);

    // Date range — default last 7 days, max 30-day window.
    const now = Date.now();
    const DEFAULT_DAYS = 7;
    const MAX_DAYS = 30;
    const fromTs = filters.from
      ? new Date(filters.from).getTime()
      : now - DEFAULT_DAYS * 24 * 60 * 60 * 1000;
    const toTs = filters.to ? new Date(filters.to).getTime() : now;
    if (toTs - fromTs > MAX_DAYS * 24 * 60 * 60 * 1000) {
      throw new Error(
        `audit query window must be ≤ ${MAX_DAYS} days (got ${Math.round((toTs - fromTs) / (24 * 60 * 60 * 1000))})`,
      );
    }

    // Decode cursor: base64 of "ISO|UUID" — corresponds to the LAST row
    // of the previous page; we ask for rows strictly OLDER than it.
    // Strict validation: garbage cursors silently degrade to "no cursor"
    // rather than nullifying the query (FE shouldn't have to special-case).
    let cursorClause: { createdAt: Date; id: string } | null = null;
    if (filters.cursor) {
      try {
        const decoded = Buffer.from(filters.cursor, 'base64').toString('utf8');
        const [iso, id] = decoded.split('|');
        const date = new Date(iso);
        if (!isNaN(date.getTime()) && id && /^[0-9a-f-]{20,}$/i.test(id)) {
          cursorClause = { createdAt: date, id };
        }
      } catch {
        // Ignore malformed cursors — start at the head.
      }
    }

    const where: Record<string, unknown> = {
      workspaceId,
      createdAt: { gte: new Date(fromTs), lte: new Date(toTs) },
    };
    if (filters.userId) where.actorId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (cursorClause) {
      // Newer-first: take rows whose (createdAt, id) is strictly less.
      where.OR = [
        { createdAt: { lt: cursorClause.createdAt } },
        {
          createdAt: cursorClause.createdAt,
          id: { lt: cursorClause.id },
        },
      ];
    }

    const rowsRaw = await this.prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1, // request one extra to know if there's a next page
      include: {
        actor: { select: { email: true } },
      },
    });

    const hasMore = rowsRaw.length > limit;
    const rows = hasMore ? rowsRaw.slice(0, limit) : rowsRaw;
    const items: AuditQueryRow[] = rows.map((r) => ({
      id: r.id,
      ts: r.createdAt.toISOString(),
      actorUserId: r.actorId,
      actorEmail: r.actor?.email ?? null,
      action: r.action,
      entity: r.entityType,
      entityId: r.entityId,
      payload: (r.payload ?? {}) as Record<string, unknown>,
      prevHash: r.prevHash,
      thisHash: r.thisHash,
    }));

    let nextCursor: string | null = null;
    if (hasMore && rows.length > 0) {
      const last = rows[rows.length - 1];
      nextCursor = Buffer.from(
        `${last.createdAt.toISOString()}|${last.id}`,
        'utf8',
      ).toString('base64');
    }

    return { items, nextCursor };
  }

  /**
   * Walk the workspace's audit_log in createdAt-asc order, recomputing
   * each row's HMAC and verifying it matches what's stored. Caps at
   * VERIFY_CHAIN_ROW_CAP rows for free-tier safety; reports `truncated`
   * if more rows exist beyond the cap.
   *
   * Uses BETTER_AUTH_SECRET as the HMAC key — same as audit-helper.ts.
   * If the secret has rotated since the chain was written, ALL rows
   * will fail verification (expected: rotation invalidates historical
   * verifiability — that's the trade-off, document it).
   */
  async verifyChain(workspaceId: string): Promise<{
    valid: boolean;
    brokenAtId: string | null;
    totalRows: number;
    verifiedRows: number;
    verifyDurationMs: number;
    truncated: boolean;
  }> {
    const t0 = Date.now();
    const totalRows = await this.prisma.auditLog.count({
      where: { workspaceId },
    });

    const rows = await this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: VERIFY_CHAIN_ROW_CAP,
      select: {
        id: true,
        prevHash: true,
        thisHash: true,
        payload: true,
      },
    });

    // Day-21 Kimi-K2 HIGH triage (c): boot-loaded secret (see onModuleInit).
    const secret = this.secret;

    let prevExpected = GENESIS_HASH;
    let brokenAtId: string | null = null;
    for (const r of rows) {
      // Two checks per row:
      //   1. The stored prevHash matches the previous row's stored thisHash
      //      (chain link).
      //   2. Recomputing thisHash from prevHash + canonical(payload) with
      //      the secret matches the stored thisHash (HMAC integrity).
      if (r.prevHash !== prevExpected) {
        brokenAtId = r.id;
        break;
      }
      const recomputed = createHmac('sha256', secret)
        .update(r.prevHash + canonicalJson(r.payload))
        .digest('hex');
      if (recomputed !== r.thisHash) {
        brokenAtId = r.id;
        break;
      }
      prevExpected = r.thisHash;
    }

    return {
      valid: brokenAtId === null,
      brokenAtId,
      totalRows,
      verifiedRows: brokenAtId
        ? rows.findIndex((r) => r.id === brokenAtId)
        : rows.length,
      verifyDurationMs: Date.now() - t0,
      truncated: totalRows > rows.length,
    };
  }
}

/** Result row for AuditService.query(). Mirrors AuditLogEntry in
 *  packages/shared/src/schemas/audit.ts. */
export interface AuditQueryRow {
  id: string;
  ts: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  prevHash: string;
  thisHash: string;
}
