// QA Nexus PM1 — RequirementsController.
//
// Spec: M3 Day-13 TASK 2. Real CRUD + RTM coverage view replaces
// the 501 stubs from PR #77 (M3-BE-03 skeleton).
//
// Endpoints + RBAC matrix:
//   POST   /api/projects/:projectId/requirements          — Admin/Lead/QAEng
//   GET    /api/projects/:projectId/requirements          — all 4 roles
//   GET    /api/projects/:projectId/requirements/:reqId   — all 4 roles
//   PATCH  /api/projects/:projectId/requirements/:reqId   — Admin/Lead/QAEng
//   DELETE /api/projects/:projectId/requirements/:reqId   — Admin/Lead/QAEng
//
//   GET    /api/requirements/:reqId/test-cases            — all 4 roles (RTM coverage)
//
// Path-shape change vs M3-BE-03 skeleton: GET/PATCH/DELETE are now
// project-scoped (per Day-13 TASK 2 spec), not top-level. The
// previous top-level :reqId routes are repurposed for the RTM
// coverage view (which IS top-level by design — a requirement's
// coverage is the RTM perspective, not a project perspective).
//
// Stakeholder = read-only across the entire surface.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
  RequirementListQuery,
  type RequirementListResponse,
  type RequirementDetailResponse,
  type RequirementCreateResponse,
  type RequirementUpdateResponse,
  type RequirementDeleteResponse,
  type RequirementCoverageResponse,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { RequirementsService, type ActorContext } from './requirements.service';
import { TestCasesService } from '../test-cases/test-cases.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

/**
 * Project-scoped surface. ALL 5 CRUD endpoints live here per
 * Day-13 TASK 2 spec (skeleton's split has been merged — :reqId
 * routes promoted to project-scoped paths).
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
  @HttpCode(201)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async create(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<RequirementCreateResponse> {
    const input = CreateRequirementInput.parse(body);
    const ctx = await this.actorOf(req);
    this.reqs.assertWriteRole(ctx);
    const requirement = await this.reqs.create(projectId, input, ctx);
    return { ok: true, requirement };
  }

  @Get()
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(
    @Param('projectId') projectId: string,
    @Query() query: unknown,
    @Req() req: Request,
  ): Promise<RequirementListResponse> {
    const q = RequirementListQuery.parse(query ?? {});
    const ctx = await this.actorOf(req);
    const result = await this.reqs.list(projectId, q, ctx);
    return {
      ok: true,
      requirements: result.requirements,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  @Get(':reqId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async detail(
    @Param('projectId') projectId: string,
    @Param('reqId') reqId: string,
    @Req() req: Request,
  ): Promise<RequirementDetailResponse> {
    const ctx = await this.actorOf(req);
    const requirement = await this.reqs.detail(projectId, reqId, ctx);
    return { ok: true, requirement };
  }

  @Patch(':reqId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async update(
    @Param('projectId') projectId: string,
    @Param('reqId') reqId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<RequirementUpdateResponse> {
    const input = UpdateRequirementInput.parse(body);
    const ctx = await this.actorOf(req);
    this.reqs.assertWriteRole(ctx);
    const requirement = await this.reqs.update(projectId, reqId, input, ctx);
    return { ok: true, requirement };
  }

  /// SOFT delete via status='archived'.
  @Delete(':reqId')
  @HttpCode(200)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async remove(
    @Param('projectId') projectId: string,
    @Param('reqId') reqId: string,
    @Req() req: Request,
  ): Promise<RequirementDeleteResponse> {
    const ctx = await this.actorOf(req);
    this.reqs.assertWriteRole(ctx);
    const result = await this.reqs.archive(projectId, reqId, ctx);
    return { ok: true, requirementId: result.requirementId, archived: true };
  }
}

/**
 * Top-level requirement-scoped surface — currently just the RTM
 * coverage view (intentionally NOT project-scoped: a requirement's
 * coverage is the RTM perspective, not a project perspective; the
 * requirement's project is implicit from the requirementId).
 *
 * Workspace isolation enforced inside
 * TestCasesService.coverageForRequirement via JOIN-then-WHERE on
 * Project.workspaceId.
 */
@Controller('api/requirements')
@UseGuards(RolesGuard)
export class RequirementsCoverageController {
  constructor(
    private readonly testCases: TestCasesService,
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

  @Get(':reqId/test-cases')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async coverage(
    @Param('reqId') reqId: string,
    @Req() req: Request,
  ): Promise<RequirementCoverageResponse> {
    const ctx = await this.actorOf(req);
    const coverage = await this.testCases.coverageForRequirement(reqId, ctx);
    return {
      ok: true,
      requirementId: reqId,
      coverage,
      total: coverage.length,
    };
  }
}
