// QA Nexus PM1 — ProjectScopedRolesGuard.
//
// Spec: PM1_ERD §3.4 (4-role RBAC + per-project role overrides via TB-004).
// Sister of `roles.guard.ts` — same audit + 401/403 semantics, but the
// effective role is computed per-project.
//
// **STATUS — M1 PREVIEW.** Not yet wired. M1 final PR registers via
// `@UseGuards(ProjectScopedRolesGuard)` on the Project / TestCase /
// TestRun controllers that need per-project authority. Workspace-level
// admin operations continue to use the existing RolesGuard.
//
// Resolution algorithm:
//   1. Read @ProjectScopedRoles(...) metadata from handler/class.
//   2. Resolve session → app user. (401 if no session.)
//   3. Find the project ID from the route — try common param names in
//      this order: 'slug' (looked up by key), 'projectId' (UUID directly),
//      'projectKey' (synonym for 'slug'). If NONE are present, the guard
//      falls back to workspace-role check (acts identically to @Roles).
//   4. Look up TB-004.project_members.role_override for (project, user).
//   5. effectiveRole = override ?? user.role
//   6. Allow iff effectiveRole ∈ requiredRoles.
//   7. On denial: write 'rbac_project_denied' audit row + throw 403.
//
// Cross-workspace projects deny implicitly: ProjectMember rows only exist
// for project_ids in the user's workspace, so the lookup misses → falls
// back to workspace role, which is the user's workspace-level role — but
// the project itself is in a different workspace, so the ROUTE handler
// would have filtered it out anyway via its own workspace scoping. The
// guard never returns "the project doesn't exist" because that's not its
// job (handlers do that with NotFoundException).

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role } from '@qa-nexus/shared';
import { AuthService } from '../auth.service';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJECT_SCOPED_ROLES_KEY } from './project-roles.decorator';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Injectable()
export class ProjectScopedRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(
      PROJECT_SCOPED_ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    const req = ctx.switchToHttp().getRequest<Request>();
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException('not authenticated');
    }
    if (!required || required.length === 0) {
      return true;
    }

    // Resolve effective role for this user × this project.
    const effective = await this.resolveEffectiveRole(req, session.appUser);

    if (required.includes(effective.role as Role)) {
      return true;
    }

    // Denial — audit (non-blocking) + 403.
    this.auditService.writeNonBlocking({
      workspaceId: session.appUser.workspaceId,
      actorId: session.appUser.id,
      entityType: 'rbac',
      entityId: effective.projectId ?? session.appUser.id,
      action: 'rbac_project_denied',
      payload: {
        path: req.path,
        method: req.method,
        required_roles: required,
        effective_role: effective.role,
        workspace_role: session.appUser.role,
        override_role: effective.override,
        project_id: effective.projectId,
        project_key: effective.projectKey,
        auth_user_id: session.authUser.id,
      },
    });
    throw new ForbiddenException(
      `effective role '${effective.role}' for project ${effective.projectKey ?? effective.projectId ?? '<workspace>'} ` +
        `not in required set [${required.join(', ')}]`,
    );
  }

  /**
   * Compute effective role for the user × project hinted at by the route.
   * Falls back to workspace role if the route is not project-scoped or
   * if the user has no override row (most common case).
   */
  private async resolveEffectiveRole(
    req: Request,
    user: {
      id: string;
      role: string;
      workspaceId: string;
    },
  ): Promise<{
    role: string;
    override: string | null;
    projectId: string | null;
    projectKey: string | null;
  }> {
    const params = (req.params ?? {}) as Record<string, string | undefined>;

    // Try in order: slug (key), projectKey (synonym), projectId (UUID).
    const slug = params.slug ?? params.projectKey ?? null;
    const projectIdParam = params.projectId ?? null;

    let projectId: string | null = null;
    let projectKey: string | null = null;

    if (projectIdParam) {
      // Direct UUID — find row to verify it's in the user's workspace.
      const p = await this.prisma.project.findFirst({
        where: { id: projectIdParam, workspaceId: user.workspaceId },
        select: { id: true, key: true },
      });
      if (p) {
        projectId = p.id;
        projectKey = p.key;
      }
    } else if (slug) {
      const p = await this.prisma.project.findUnique({
        where: {
          workspaceId_key: { workspaceId: user.workspaceId, key: slug },
        },
        select: { id: true, key: true },
      });
      if (p) {
        projectId = p.id;
        projectKey = p.key;
      }
    }

    if (!projectId) {
      // No project context — degenerate to workspace role.
      return {
        role: user.role,
        override: null,
        projectId: null,
        projectKey: null,
      };
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
      select: { roleOverride: true },
    });

    const override = membership?.roleOverride ?? null;
    return {
      role: override ?? user.role,
      override,
      projectId,
      projectKey,
    };
  }
}
