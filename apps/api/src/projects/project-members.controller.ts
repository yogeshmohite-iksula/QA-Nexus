// QA Nexus PM1 — ProjectMembersController.
//
// Spec: PM1_ERD §3.6 + Day-6 PM brief Block 2.
//
// Endpoints (under /api/projects/:slug/members):
//   GET    /                        list    ProjectScoped Admin/Lead/QAEng/Stakeholder
//   POST   /                        add     ProjectScoped Admin/Lead
//   PATCH  /:userId                 role    ProjectScoped Admin/Lead
//   DELETE /:userId                 remove  ProjectScoped Admin/Lead
//
// Uses ProjectScopedRolesGuard so RBAC checks happen with the
// effective role (workspace role || roleOverride) on the :slug project.

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  Role,
  AddProjectMemberInput,
  ChangeProjectMemberRoleInput,
} from '@qa-nexus/shared';
import { ProjectScopedRoles } from '../auth/rbac/project-roles.decorator';
import { ProjectScopedRolesGuard } from '../auth/rbac/project-roles.guard';
import { AuthService } from '../auth/auth.service';
import {
  ProjectMembersService,
  type ActorContext,
} from './project-members.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/projects/:slug/members')
@UseGuards(ProjectScopedRolesGuard)
export class ProjectMembersController {
  constructor(
    private readonly members: ProjectMembersService,
    private readonly authService: AuthService,
  ) {}

  private async actorOf(req: Request): Promise<ActorContext> {
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException(
        'session disappeared between guard and handler',
      );
    }
    return {
      workspaceId: session.appUser.workspaceId,
      actorId: session.appUser.id,
      actorEmail: session.appUser.email,
      actorRole: session.appUser.role,
    };
  }

  @Get()
  @ProjectScopedRoles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(@Param('slug') slug: string, @Req() req: Request) {
    const ctx = await this.actorOf(req);
    const members = await this.members.list(slug, ctx);
    return { ok: true as const, members };
  }

  @Post()
  @ProjectScopedRoles(Role.Admin, Role.Lead)
  async add(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = AddProjectMemberInput.parse(body);
    const ctx = await this.actorOf(req);
    const member = await this.members.add(
      slug,
      { userId: input.userId, roleOverride: input.roleOverride as Role },
      ctx,
    );
    return { ok: true as const, member };
  }

  @Patch(':userId')
  @ProjectScopedRoles(Role.Admin, Role.Lead)
  async changeRole(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = ChangeProjectMemberRoleInput.parse(body);
    const ctx = await this.actorOf(req);
    const member = await this.members.changeRole(
      slug,
      userId,
      input.roleOverride as Role | null,
      ctx,
    );
    return { ok: true as const, member };
  }

  @Delete(':userId')
  @ProjectScopedRoles(Role.Admin, Role.Lead)
  async remove(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const ctx = await this.actorOf(req);
    return this.members.remove(slug, userId, ctx);
  }
}
