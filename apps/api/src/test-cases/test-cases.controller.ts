// QA Nexus PM1 — TestCasesController.
//
// Spec: M3 Day-13 TASK 1. Real CRUD implementation replacing the
// 501 stubs from M3-BE-02 PR #75.
//
// Endpoints + RBAC matrix (per Milestone_M3_Test_Cases_AI_v2.md §RBAC):
//   POST   /api/projects/:projectId/test-cases  — Admin/Lead/QAEngineer
//   GET    /api/projects/:projectId/test-cases  — all 4 roles
//   GET    /api/test-cases/:caseId              — all 4 roles
//   PATCH  /api/test-cases/:caseId              — Admin/Lead/QAEngineer
//   DELETE /api/test-cases/:caseId              — Admin/Lead/QAEngineer
//
//   POST   /api/test-cases/:caseId/links            — link to requirement (TASK 2)
//   DELETE /api/test-cases/:caseId/links/:reqId     — unlink (TASK 2)
//
// Stakeholder = read-only across the entire surface (matches the
// existing KbDocumentsController list/detail-vs-delete split).
//
// Path-shape note: GET/PATCH/DELETE on `:caseId` (no projectId in
// the path) follows the v2 plan §"Endpoints" verbatim. Workspace
// isolation is enforced inside the service via JOIN-then-WHERE on
// Project.workspaceId. Cross-workspace caseId → 404 (no leak).

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
  CreateTestCaseInput,
  UpdateTestCaseInput,
  TestCaseListQuery,
  CreateTestCaseLinkInput,
  type TestCaseListResponse,
  type TestCaseDetailResponse,
  type TestCaseCreateResponse,
  type TestCaseUpdateResponse,
  type TestCaseDeleteResponse,
  type TestCaseLinkResponse,
  type TestCaseUnlinkResponse,
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
  @HttpCode(201)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async create(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<TestCaseCreateResponse> {
    const input = CreateTestCaseInput.parse(body);
    const ctx = await this.actorOf(req);
    this.testCases.assertWriteRole(ctx);
    const testCase = await this.testCases.create(projectId, input, ctx);
    return { ok: true, testCase };
  }

  @Get()
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(
    @Param('projectId') projectId: string,
    @Query() query: unknown,
    @Req() req: Request,
  ): Promise<TestCaseListResponse> {
    const q = TestCaseListQuery.parse(query ?? {});
    const ctx = await this.actorOf(req);
    const result = await this.testCases.list(projectId, q, ctx);
    return {
      ok: true,
      testCases: result.testCases,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }
}

/**
 * Case-scoped surface (GET / PATCH / DELETE on a single case ID +
 * RTM link/unlink). Workspace check delegated to the service;
 * cross-workspace caseId → 404.
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
    @Param('caseId') caseId: string,
    @Req() req: Request,
  ): Promise<TestCaseDetailResponse> {
    const ctx = await this.actorOf(req);
    const testCase = await this.testCases.detail(caseId, ctx);
    return { ok: true, testCase };
  }

  @Patch(':caseId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async update(
    @Param('caseId') caseId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<TestCaseUpdateResponse> {
    const input = UpdateTestCaseInput.parse(body);
    const ctx = await this.actorOf(req);
    this.testCases.assertWriteRole(ctx);
    const testCase = await this.testCases.update(caseId, input, ctx);
    return { ok: true, testCase };
  }

  /// SOFT delete via status='archived' (TestCase row stays). Run
  /// results + defect references stay valid; queries should filter
  /// out archived rows.
  @Delete(':caseId')
  @HttpCode(200) // explicit 200 (not 204) so we can return the archive flag
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async remove(
    @Param('caseId') caseId: string,
    @Req() req: Request,
  ): Promise<TestCaseDeleteResponse> {
    const ctx = await this.actorOf(req);
    this.testCases.assertWriteRole(ctx);
    const result = await this.testCases.archive(caseId, ctx);
    return { ok: true, testCaseId: result.testCaseId, archived: true };
  }

  // ────────────────────────────────────────────────────────────────
  // RTM linking — TASK 2 endpoints. Live here (case-scoped) because
  // both link and unlink operate from the test case side. The
  // /api/requirements/:reqId/test-cases coverage view is on
  // RequirementsController.
  // ────────────────────────────────────────────────────────────────

  @Post(':caseId/links')
  @HttpCode(201)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async link(
    @Param('caseId') caseId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<TestCaseLinkResponse> {
    const input = CreateTestCaseLinkInput.parse(body);
    const ctx = await this.actorOf(req);
    this.testCases.assertWriteRole(ctx);
    const result = await this.testCases.linkRequirement(
      caseId,
      input.requirementId,
      ctx,
    );
    return {
      ok: true,
      testCaseId: caseId,
      requirementId: input.requirementId,
      outcome: result.outcome,
    };
  }

  @Delete(':caseId/links/:reqId')
  @HttpCode(200)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async unlink(
    @Param('caseId') caseId: string,
    @Param('reqId') reqId: string,
    @Req() req: Request,
  ): Promise<TestCaseUnlinkResponse> {
    const ctx = await this.actorOf(req);
    this.testCases.assertWriteRole(ctx);
    await this.testCases.unlinkRequirement(caseId, reqId, ctx);
    return { ok: true, testCaseId: caseId, requirementId: reqId };
  }
}
