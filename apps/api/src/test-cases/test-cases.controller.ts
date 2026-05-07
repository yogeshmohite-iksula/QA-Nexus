// QA Nexus PM1 — TestCasesController.
//
// Spec: M3 TASK BE-02 (Day-12). Skeleton — all 5 endpoints return
// 501 NOT IMPLEMENTED via the service. Real CRUD lands Day-13.
//
// Endpoints + RBAC matrix (per Milestone_M3_Test_Cases_AI_v2.md §RBAC):
//   POST   /api/projects/:projectId/test-cases  — Admin/Lead/QAEngineer
//   GET    /api/projects/:projectId/test-cases  — all 4 roles
//   GET    /api/test-cases/:caseId              — all 4 roles
//   PATCH  /api/test-cases/:caseId              — Admin/Lead/QAEngineer
//   DELETE /api/test-cases/:caseId              — Admin/Lead/QAEngineer
//
// Stakeholder = read-only across the entire surface (matches the
// existing KbDocumentsController list/detail-vs-delete split). Day-13
// real implementation may further constrain UPDATE/DELETE to the
// case's project members, but the @Roles guard scaffold below is the
// minimum surface area MAIN's M2-CLOSE-GATE sweep already covers.
//
// Path-shape note: the GET/PATCH/DELETE on `:caseId` (no projectId in
// the path) follows the v2 plan §"Endpoints" verbatim. Workspace
// isolation is enforced inside the service via JOIN-then-WHERE on
// Project.workspaceId (mirrors KbDocumentsService.detail). The 404
// path is intentional — leak-free.

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
  CreateTestCaseInput,
  UpdateTestCaseInput,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { TestCasesService, type ActorContext } from './test-cases.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

/// Minimal list-query Zod surface for the skeleton. Day-13 will swap
/// for a richer filter shape (priority, status, format, hasLinks, q).
import { z } from 'zod';
const TestCaseListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Project-scoped surface (POST + LIST). Workspace check enforced by
 * the service; cross-workspace project IDs → 404.
 */
@Controller('api/projects/:projectId/test-cases')
@UseGuards(RolesGuard)
export class TestCasesProjectScopedController {
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

  @Post()
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async create(
    @Param('projectId') _projectId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<never> {
    // Zod-validate at the surface so 400s show up before the 501.
    // Day-13 will pass the parsed input into the service call.
    CreateTestCaseInput.parse(body);
    await this.actorOf(req);
    return this.testCases.create();
  }

  @Get()
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(
    @Param('projectId') _projectId: string,
    @Query() query: unknown,
    @Req() req: Request,
  ): Promise<never> {
    TestCaseListQuery.parse(query ?? {});
    await this.actorOf(req);
    return this.testCases.list();
  }
}

/**
 * Case-scoped surface (GET / PATCH / DELETE on a single case ID).
 * Workspace check delegated to the service; cross-workspace caseId
 * → 404.
 */
@Controller('api/test-cases')
@UseGuards(RolesGuard)
export class TestCasesCaseScopedController {
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

  @Get(':caseId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async detail(
    @Param('caseId') _caseId: string,
    @Req() req: Request,
  ): Promise<never> {
    await this.actorOf(req);
    return this.testCases.detail();
  }

  @Patch(':caseId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async update(
    @Param('caseId') _caseId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<never> {
    UpdateTestCaseInput.parse(body);
    await this.actorOf(req);
    return this.testCases.update();
  }

  @Delete(':caseId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async remove(
    @Param('caseId') _caseId: string,
    @Req() req: Request,
  ): Promise<never> {
    await this.actorOf(req);
    return this.testCases.remove();
  }
}
