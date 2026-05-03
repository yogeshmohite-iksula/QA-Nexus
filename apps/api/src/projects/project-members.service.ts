// QA Nexus PM1 — ProjectMembersService.
//
// Spec: PM1_ERD §3.6 (TB-004 project_members) + Day-6 PM brief Block 2.
//
// CRUD-lite for the F27 Admin → project-scoped role override section.
// Endpoints all under /api/projects/:slug/members; the controller
// resolves :slug → projectId via TB-003 in the actor's workspace.
//
// "Effective role" = ProjectMember.roleOverride ?? User.role.
// Already implemented in ProjectScopedRolesGuard (Day-5).
//
// Last-Project-Admin guard (binding for DELETE):
//   For each project, count users whose effective role IS 'Admin' on
//   that project (workspace Admin without an override THAT downgrades
//   them, OR any user with roleOverride='Admin'). Removing the last
//   such user from the project orphans it — refuse with 409.
//
// All mutations write a synchronous audit row.

import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Role, type ProjectMemberListItem } from '@qa-nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
}

@Injectable()
export class ProjectMembersService {
  private readonly logger = new Logger(ProjectMembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Resolve :slug → project (within actor's workspace). 404 if absent. */
  private async resolveProject(
    slug: string,
    ctx: ActorContext,
  ): Promise<{ id: string; key: string }> {
    const p = await this.prisma.project.findUnique({
      where: { workspaceId_key: { workspaceId: ctx.workspaceId, key: slug } },
      select: { id: true, key: true },
    });
    if (!p) {
      throw new NotFoundException(`project ${slug} not found`);
    }
    return p;
  }

  async list(
    slug: string,
    ctx: ActorContext,
  ): Promise<ProjectMemberListItem[]> {
    const project = await this.resolveProject(slug, ctx);
    const rows = await this.prisma.projectMember.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, displayName: true, role: true },
        },
      },
    });
    return rows.map((r) => ({
      userId: r.user.id,
      email: r.user.email,
      name: r.user.displayName,
      workspaceRole: r.user.role as Role,
      roleOverride: (r.roleOverride ?? null) as Role | null,
      addedAt: r.createdAt.toISOString(),
      // TB-004 doesn't store added_by today — derive from audit_log if
      // needed, otherwise NULL. M1.5 followup: add added_by FK column.
      addedByUserId: null,
    }));
  }

  async add(
    slug: string,
    input: { userId: string; roleOverride?: Role },
    ctx: ActorContext,
  ): Promise<ProjectMemberListItem> {
    const project = await this.resolveProject(slug, ctx);

    // 422 if user not in workspace.
    const target = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        displayName: true,
        role: true,
      },
    });
    if (!target || target.workspaceId !== ctx.workspaceId) {
      throw new UnprocessableEntityException(
        `user ${input.userId} is not in this workspace`,
      );
    }

    // 409 if already a member.
    const existing = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: target.id },
      },
    });
    if (existing) {
      throw new ConflictException(
        `user is already a member of project ${project.key}; use PATCH to change override`,
      );
    }

    const created = await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: target.id,
        roleOverride: input.roleOverride ?? null,
      },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'project_member',
      entityId: project.id,
      action: 'project_member_added',
      payload: {
        project_id: project.id,
        project_key: project.key,
        target_user_id: target.id,
        target_email_domain: '@' + target.email.split('@')[1],
        role_override: input.roleOverride ?? null,
        actor_email: ctx.actorEmail,
      },
    });

    return {
      userId: target.id,
      email: target.email,
      name: target.displayName,
      workspaceRole: target.role as Role,
      roleOverride: (input.roleOverride ?? null) as Role | null,
      addedAt: created.createdAt.toISOString(),
      addedByUserId: ctx.actorId,
    };
  }

  async changeRole(
    slug: string,
    userId: string,
    newOverride: Role | null,
    ctx: ActorContext,
  ): Promise<ProjectMemberListItem> {
    const project = await this.resolveProject(slug, ctx);
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId } },
      include: {
        user: {
          select: { id: true, email: true, displayName: true, role: true },
        },
      },
    });
    if (!member) {
      throw new NotFoundException(
        `user ${userId} is not a member of project ${project.key}`,
      );
    }

    // Last-project-Admin guard if demoting from Admin (or removing
    // override that was Admin while workspace role is < Admin).
    const oldEffective = member.roleOverride ?? member.user.role;
    const newEffective = newOverride ?? member.user.role;
    if (oldEffective === 'Admin' && newEffective !== 'Admin') {
      await this.assertNotLastProjectAdmin(project.id, member.user.id);
    }

    const oldOverride = member.roleOverride ?? null;
    await this.prisma.projectMember.update({
      where: { projectId_userId: { projectId: project.id, userId } },
      data: { roleOverride: newOverride },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'project_member',
      entityId: project.id,
      action: 'project_role_override_changed',
      payload: {
        project_id: project.id,
        project_key: project.key,
        target_user_id: userId,
        target_email_domain: '@' + member.user.email.split('@')[1],
        old_role_override: oldOverride,
        new_role_override: newOverride,
        actor_email: ctx.actorEmail,
      },
    });

    return {
      userId: member.user.id,
      email: member.user.email,
      name: member.user.displayName,
      workspaceRole: member.user.role as Role,
      roleOverride: (newOverride ?? null) as Role | null,
      addedAt: member.createdAt.toISOString(),
      addedByUserId: null,
    };
  }

  async remove(
    slug: string,
    userId: string,
    ctx: ActorContext,
  ): Promise<{ ok: true; projectId: string; userId: string }> {
    const project = await this.resolveProject(slug, ctx);
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId } },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    });
    if (!member) {
      throw new NotFoundException(
        `user ${userId} is not a member of project ${project.key}`,
      );
    }

    const effective = member.roleOverride ?? member.user.role;
    if (effective === 'Admin') {
      await this.assertNotLastProjectAdmin(project.id, member.user.id);
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId: project.id, userId } },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'project_member',
      entityId: project.id,
      action: 'project_member_removed',
      payload: {
        project_id: project.id,
        project_key: project.key,
        target_user_id: userId,
        target_email_domain: '@' + member.user.email.split('@')[1],
        was_role_override: member.roleOverride ?? null,
        actor_email: ctx.actorEmail,
      },
    });

    return { ok: true, projectId: project.id, userId };
  }

  /**
   * Refuse if removing/demoting `excludeUserId` would leave zero users
   * with effective Admin role on `projectId`. Counts:
   *   - members with roleOverride='Admin' (other than excludeUserId)
   *   - members with NO override AND workspace User.role='Admin' (other than excludeUserId)
   *   - workspace Admins NOT in project_members (they implicitly inherit
   *     Admin everywhere — but this is an edge case; document it).
   */
  private async assertNotLastProjectAdmin(
    projectId: string,
    excludeUserId: string,
  ): Promise<void> {
    // Count override-Admins among other members (cheap).
    const overrideAdmins = await this.prisma.projectMember.count({
      where: {
        projectId,
        userId: { not: excludeUserId },
        roleOverride: 'Admin',
      },
    });
    if (overrideAdmins > 0) return;

    // Count members with NO override + workspace Admin role (other than excludeUserId).
    const inheritedAdmins = await this.prisma.projectMember.count({
      where: {
        projectId,
        userId: { not: excludeUserId },
        roleOverride: null,
        user: { role: 'Admin' },
      },
    });
    if (inheritedAdmins > 0) return;

    // No other Admin path in this project — refuse.
    throw new ConflictException(
      'cannot remove the last Admin from this project; promote another member first',
    );
  }
}
