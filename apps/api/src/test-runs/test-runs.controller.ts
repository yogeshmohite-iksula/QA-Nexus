// QA Nexus PM1 — TestRunsController (M4 P3 / Day-18 #149).
//
// Spec: PM1_ERD §3.10 state machine + M4 Day-18 PM TASK 3.
//
// Routes (all PATCH; no creates/lists in this skeleton — those are
// the runner's responsibility in Day-19+):
//   PATCH /api/test-runs/:id/start    queued → running   (any authed)
//   PATCH /api/test-runs/:id/result   running → passed|failed|blocked
//                                                       (any authed)
//   PATCH /api/test-runs/:id/abort    running → aborted (Admin / Lead)
//
// Why those role gates:
//   - start + result: any QA Engineer running the suite can drive
//     state transitions for their own runs.
//   - abort: pulling the stop-cord on someone else's run is a
//     supervisory action. RBAC keeps it to Admin / Lead.
//
// Stretch-goal: project-scoped guard (ProjectScopedRolesGuard) wraps
// the runId-→ project membership check. NOT applied here yet —
// would need a request-time runId-→project_id lookup, which adds
// latency to every PATCH. Day-19 will fold in the project membership
// check inside the service layer (defence-in-depth) once the runner
// is exercising real per-project data.
//
// Pattern A note: this controller is post-onboarding only. Onboarding
// wizard never hits these endpoints.

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import {
  Role,
  TestRunListQuery,
  type TestRunListResponse,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { ZodValidationPipe } from '../storage/zod-validation.pipe';
import { TestRunsService, type TestRunActor } from './test-runs.service';

/// PATCH /api/test-runs/:id/result body.
/// Note: 'aborted' is NOT in this enum — abort has its own endpoint.
/// 'queued' / 'running' are also rejected — those are not terminal results.
const ReportRunResultSchema = z.object({
  status: z.enum(['passed', 'failed', 'blocked']),
});
type ReportRunResult = z.infer<typeof ReportRunResultSchema>;

@Controller('api/test-runs')
@UseGuards(RolesGuard)
export class TestRunsController {
  constructor(
    private readonly testRuns: TestRunsService,
    private readonly auth: AuthService,
  ) {}

  /**
   * GET /api/test-runs — workspace-scoped list for F08 /home ACTIVE_RUNS
   * (`?status=running`) + RECENT_RUNS (default `sort=started_at_desc`).
   * Read-only, all 4 roles (Stakeholder read parity with the defects/
   * test-cases lists). NOT audited (ERD §8.7). Optional filters:
   * `?status=&projectId=&sort=&page=&pageSize=`.
   */
  @Get()
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(
    @Query() query: unknown,
    @Req() req: Request,
  ): Promise<TestRunListResponse> {
    const q = TestRunListQuery.parse(query ?? {});
    const actor = await this.requireActor(req);
    const result = await this.testRuns.list(q, actor);
    return {
      ok: true,
      testRuns: result.testRuns,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  /** PATCH /api/test-runs/:id/start — queued → running. */
  @Patch(':id/start')
  @HttpCode(200)
  async start(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    const actor = await this.requireActor(req);
    const run = await this.testRuns.start(id, actor);
    return { id: run.id, status: run.status, startedAt: run.startedAt };
  }

  /** PATCH /api/test-runs/:id/result — running → passed|failed|blocked. */
  @Patch(':id/result')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(ReportRunResultSchema))
  async report(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ReportRunResult,
    @Req() req: Request,
  ) {
    const actor = await this.requireActor(req);
    const run = await this.testRuns.report(id, body, actor);
    return {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    };
  }

  /** PATCH /api/test-runs/:id/abort — running → aborted. Admin / Lead. */
  @Patch(':id/abort')
  @Roles(Role.Admin, Role.Lead)
  @HttpCode(200)
  async abort(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    const actor = await this.requireActor(req);
    const run = await this.testRuns.abort(id, actor);
    return {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    };
  }

  /** Build a TestRunActor from the BetterAuth session. RolesGuard already
   *  passed (so a session exists) — this just unpacks it into the service-
   *  facing shape. Mirrors the pattern used by StorageController. */
  private async requireActor(req: Request): Promise<TestRunActor> {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
      else if (v) headers.append(k, v);
    }
    const session = await this.auth.resolveSession(headers);
    if (!session) {
      // Defence-in-depth — RolesGuard should have rejected first.
      throw new Error('session vanished between RolesGuard and handler');
    }
    return {
      appUserId: session.appUser.id,
      workspaceId: session.appUser.workspaceId,
    };
  }
}
