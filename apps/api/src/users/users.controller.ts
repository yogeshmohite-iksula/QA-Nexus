// QA Nexus PM1 — UsersController.
//
// Spec: PM1_ERD §3.5 + Day-6 PM brief Block 1.
//
// Endpoints (under /api/users):
//   GET    /api/users                      list    Admin / Lead / QAEng / Stakeholder
//   GET    /api/users/:id                  detail  Admin / Lead / QAEng / Stakeholder
//   PATCH  /api/users/:id/role             role    Admin only
//   PATCH  /api/users/:id/status           status  Admin only
//
// All endpoints workspace-scope via session resolution. Cross-workspace
// :id lookups return 404 (no leak).

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  Role,
  ListUsersQuery,
  ChangeUserRoleInput,
  ChangeUserStatusInput,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { UsersService, type ActorContext } from './users.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
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
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(@Query() query: unknown, @Req() req: Request) {
    const filters = ListUsersQuery.parse(query ?? {});
    const ctx = await this.actorOf(req);
    const users = await this.users.list(ctx, filters);
    return { ok: true as const, users };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async getById(@Param('id') id: string, @Req() req: Request) {
    const ctx = await this.actorOf(req);
    const user = await this.users.getById(id, ctx);
    return { ok: true as const, user };
  }

  @Patch(':id/role')
  @Roles(Role.Admin)
  async changeRole(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const parsed = ChangeUserRoleInput.parse({
      ...((body as object | null) ?? {}),
      userId: id,
    });
    const ctx = await this.actorOf(req);
    const user = await this.users.changeRole(
      parsed.userId,
      parsed.newRole,
      ctx,
    );
    return { ok: true as const, user };
  }

  @Patch(':id/status')
  @Roles(Role.Admin)
  async changeStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const parsed = ChangeUserStatusInput.parse({
      ...((body as object | null) ?? {}),
      userId: id,
    });
    const ctx = await this.actorOf(req);
    const result = await this.users.changeStatus(
      parsed.userId,
      parsed.newStatus,
      ctx,
    );
    return {
      ok: true as const,
      user: result.user,
      sessionsRevoked: result.sessionsRevoked,
    };
  }
}
