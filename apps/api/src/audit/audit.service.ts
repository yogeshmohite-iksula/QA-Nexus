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
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { writeAuditRow } from './audit-helper';

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
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

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
}
