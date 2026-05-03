// QA Nexus PM1 — UsersService.
//
// Spec: PM1_ERD §3.5 (TB-002) + Day-6 PM brief Block 1.
//
// Owns workspace-scoped user CRUD-lite for the F27 Admin tab:
//   - list / getById   (read)
//   - changeRole       (Admin only)
//   - changeStatus     (Admin only — disables purge BetterAuth sessions)
//
// "User status" is DERIVED from row fields (no enum column):
//   - disabled  = disabledAt IS NOT NULL
//   - invited   = activatedAt IS NULL AND disabledAt IS NULL
//   - active    = activatedAt IS NOT NULL AND disabledAt IS NULL
//
// Audit discipline (CLAUDE.md Hard Rule 7): every mutation writes a
// synchronous audit row before responding. Audit payloads must NEVER
// carry `passwordHash`, BetterAuth session tokens, or invitation
// `tokenHash` values — same redaction discipline as InvitationsService
// (pinned by tests in the parallel spec file).

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  Role,
  type UserListItem,
  type UserDetailItem,
  type UserStatus,
} from '@qa-nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
}

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: string;
  activatedAt: Date | null;
  disabledAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  roleChangedAt: Date | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Derive the (active|invited|disabled) status from row fields. */
  static deriveStatus(row: {
    activatedAt: Date | null;
    disabledAt: Date | null;
  }): UserStatus {
    if (row.disabledAt) return 'disabled';
    if (!row.activatedAt) return 'invited';
    return 'active';
  }

  /**
   * List workspace users. `roleFilter` is Admin/Lead-only; service
   * silently ignores it for QAEngineer/Stakeholder callers (controller
   * could 403 instead — pick "ignore" so a single endpoint serves all
   * roles without forcing the FE to branch on actor role).
   */
  async list(
    ctx: ActorContext,
    filters: { role?: string; status?: UserStatus },
  ): Promise<UserListItem[]> {
    const where: Record<string, unknown> = { workspaceId: ctx.workspaceId };
    const isAdminOrLead = ctx.actorRole === 'Admin' || ctx.actorRole === 'Lead';
    if (filters.role && isAdminOrLead) where.role = filters.role;

    const rows: UserRow[] = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        activatedAt: true,
        disabledAt: true,
        lastLoginAt: true,
        createdAt: true,
        roleChangedAt: true,
      },
    });

    let mapped = rows.map((r) => this.toListItem(r));
    if (filters.status)
      mapped = mapped.filter((u) => u.status === filters.status);
    return mapped;
  }

  async getById(userId: string, ctx: ActorContext): Promise<UserDetailItem> {
    const r = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        displayName: true,
        role: true,
        activatedAt: true,
        disabledAt: true,
        lastLoginAt: true,
        createdAt: true,
        roleChangedAt: true,
      },
    });
    if (!r || r.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`user ${userId} not found`);
    }
    // invitedByUserId — best-effort lookup via the most recent accepted
    // invitation matching this user's email. NULL if Day-0 seeded user
    // (no invitation row).
    const inv = await this.prisma.userInvitation.findFirst({
      where: {
        workspaceId: ctx.workspaceId,
        invitedEmail: r.email,
        status: 'accepted',
      },
      orderBy: { acceptedAt: 'desc' },
      select: { invitedBy: true },
    });
    return {
      ...this.toListItem(r),
      invitedByUserId: inv?.invitedBy ?? null,
      roleChangedAt: r.roleChangedAt?.toISOString() ?? null,
    };
  }

  /** Workspace-level role change. Audited. Last-Admin guard binding. */
  async changeRole(
    userId: string,
    newRole: Role,
    ctx: ActorContext,
  ): Promise<UserDetailItem> {
    if (userId === ctx.actorId) {
      throw new ForbiddenException(
        'cannot change your own role; ask another Admin',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        role: true,
        activatedAt: true,
        disabledAt: true,
      },
    });
    if (!target || target.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`user ${userId} not found`);
    }
    if (!target.activatedAt) {
      throw new ConflictException(
        'cannot change role of an invited user; wait until they accept',
      );
    }
    // Last-Admin guard: if demoting the last Admin, refuse.
    if (target.role === 'Admin' && newRole !== 'Admin') {
      const otherAdmins = await this.prisma.user.count({
        where: {
          workspaceId: ctx.workspaceId,
          role: 'Admin',
          disabledAt: null,
          id: { not: target.id },
        },
      });
      if (otherAdmins === 0) {
        throw new ForbiddenException(
          'cannot demote the last active Admin; promote another user first',
        );
      }
    }

    const oldRole = target.role;
    await this.prisma.user.update({
      where: { id: target.id },
      data: { role: newRole, roleChangedAt: new Date() },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'user',
      entityId: target.id,
      action: 'workspace_role_changed',
      payload: {
        target_user_id: target.id,
        // Email DOMAIN only — no local-part PII (matches resend audit).
        target_email_domain: '@' + target.email.split('@')[1],
        old_role: oldRole,
        new_role: newRole,
        changed_by_user_id: ctx.actorId,
        actor_email: ctx.actorEmail,
      },
    });
    return this.getById(target.id, ctx);
  }

  /**
   * Status change. Disabling sets disabledAt + purges all BetterAuth
   * sessions for this user. Re-enabling clears disabledAt; user must
   * magic-link to get a new session.
   */
  async changeStatus(
    userId: string,
    newStatus: 'active' | 'disabled',
    ctx: ActorContext,
  ): Promise<{ user: UserDetailItem; sessionsRevoked: number }> {
    if (userId === ctx.actorId && newStatus === 'disabled') {
      throw new ForbiddenException('cannot disable your own account');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        role: true,
        activatedAt: true,
        disabledAt: true,
      },
    });
    if (!target || target.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`user ${userId} not found`);
    }

    // Last-Admin guard: refuse to disable the last Admin.
    if (newStatus === 'disabled' && target.role === 'Admin') {
      const otherAdmins = await this.prisma.user.count({
        where: {
          workspaceId: ctx.workspaceId,
          role: 'Admin',
          disabledAt: null,
          id: { not: target.id },
        },
      });
      if (otherAdmins === 0) {
        throw new ForbiddenException(
          'cannot disable the last active Admin; promote another user first',
        );
      }
    }

    const previousStatus = UsersService.deriveStatus(target);
    const newDisabledAt = newStatus === 'disabled' ? new Date() : null;

    let sessionsRevoked = 0;
    if (newStatus === 'disabled') {
      // BetterAuth's AuthUser is keyed by email. Find the auth row +
      // delete its sessions. If no AuthUser exists yet (user was seeded
      // but never magic-linked), this is a no-op.
      const authUser = await this.prisma.authUser.findUnique({
        where: { email: target.email },
        select: { id: true },
      });
      if (authUser) {
        const result = await this.prisma.authSession.deleteMany({
          where: { userId: authUser.id },
        });
        sessionsRevoked = result.count;
      }
    }

    await this.prisma.user.update({
      where: { id: target.id },
      data: { disabledAt: newDisabledAt },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'user',
      entityId: target.id,
      action: 'user_status_changed',
      payload: {
        target_user_id: target.id,
        target_email_domain: '@' + target.email.split('@')[1],
        previous_status: previousStatus,
        new_status: newStatus,
        sessions_revoked: sessionsRevoked,
        changed_by_user_id: ctx.actorId,
        actor_email: ctx.actorEmail,
      },
    });

    const user = await this.getById(target.id, ctx);
    return { user, sessionsRevoked };
  }

  // ──────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────

  private toListItem(r: UserRow): UserListItem {
    return {
      id: r.id,
      email: r.email,
      name: r.displayName,
      role: r.role as Role,
      status: UsersService.deriveStatus(r),
      createdAt: r.createdAt.toISOString(),
      lastSeenAt: r.lastLoginAt?.toISOString() ?? null,
    };
  }
}
