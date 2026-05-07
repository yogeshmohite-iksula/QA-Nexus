// QA Nexus PM1 — RequirementsController.
//
// Spec: M3 TASK BE-03 (Day-12). Skeleton — all 5 endpoints return
// 501 NOT IMPLEMENTED via the service. Real CRUD lands Day-14.
//
// Endpoints + RBAC matrix:
//   POST   /api/projects/:projectId/requirements  — Admin/Lead/QAEng
//   GET    /api/projects/:projectId/requirements  — all 4 roles
//   GET    /api/requirements/:reqId               — all 4 roles
//   PATCH  /api/requirements/:reqId               — Admin/Lead/QAEng
//   DELETE /api/requirements/:reqId               — Admin/Lead/QAEng
//
// Stakeholder = read-only across the entire surface (matches the
// TestCases skeleton from M3-BE-02 + KbDocuments split).

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  Role,
  CreateRequirementInput,
  UpdateRequirementInput,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { RequirementsService, type ActorContext } from './requirements.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

/// Minimal list-query Zod surface. Day-14 will swap for a richer
/// filter shape (status, priority, source, sprint, q).
import { z } from 'zod';
const RequirementListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Project-scoped surface (POST + LIST). Workspace check enforced by
 * the service; cross-workspace project IDs → 404.
 */
@Controller('api/projects/:projectId/requirements')
@UseGuards(RolesGuard)
export class RequirementsProjectScopedController {
  constructor(
    private readonly reqs: RequirementsService,
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
      role: session.appUser.role as ActorContext['role'],
    };
  }

  @Post()
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async create(
    @Param('projectId') _projectId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<never> {
    CreateRequirementInput.parse(body);
    await this.actorOf(req);
    return this.reqs.create();
  }

  @Get()
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(
    @Param('projectId') _projectId: string,
    @Query() query: unknown,
    @Req() req: Request,
  ): Promise<never> {
    RequirementListQuery.parse(query ?? {});
    await this.actorOf(req);
    return this.reqs.list();
  }
}

/**
 * Requirement-scoped surface (GET / PATCH / DELETE on a single req
 * ID). Workspace check delegated to the service; cross-workspace
 * reqId → 404.
 */
@Controller('api/requirements')
@UseGuards(RolesGuard)
export class RequirementsReqScopedController {
  constructor(
    private readonly reqs: RequirementsService,
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
      role: session.appUser.role as ActorContext['role'],
    };
  }

  @Get(':reqId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async detail(
    @Param('reqId') _reqId: string,
    @Req() req: Request,
  ): Promise<never> {
    await this.actorOf(req);
    return this.reqs.detail();
  }

  @Patch(':reqId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async update(
    @Param('reqId') _reqId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<never> {
    UpdateRequirementInput.parse(body);
    await this.actorOf(req);
    return this.reqs.update();
  }

  @Delete(':reqId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async remove(
    @Param('reqId') _reqId: string,
    @Req() req: Request,
  ): Promise<never> {
    await this.actorOf(req);
    return this.reqs.remove();
  }
}
