// QA Nexus PM1 — DefectsController.
//
// Day-19 P0 #2 (PR #157): all 5 endpoints scaffolded as 501 stubs.
// Day-20 P1 (#173): POST /api/defects/:id/rca becomes FUNCTIONAL —
//   calls SherlockOrchestratorService.runRca() synchronously and returns
//   { runId, status, hypotheses } inline.
// Day-21 P0 (this PR, followup `(da)`): POST /api/defects/:id/rca flips
//   to async 202+WS pattern. Returns 202 + { defectId, runId, accepted }
//   immediately; the orchestrator runs out-of-band via setImmediate and
//   emits `rca.complete.<runId>` on the RealtimeGateway when persistence
//   + audit are durable.
//
//   Sequence (Day-21):
//     1. Validate UUID + body shape (existing).
//     2. Look up defect → project → workspaceId (existence + scope).
//     3. Generate runId via randomUUID() — flows through audit + AgentRun
//        + RcaReport + WS event identically.
//     4. Write `defect.rca_kicked_off` audit row SYNC (per CLAUDE.md
//        Hard Rule 7 + .claude/rules/api.md — audit MUST be durable before
//        the response is returned; a failed audit fails the request).
//     5. setImmediate → sherlock.runAndPersist(input, ctx). Errors logged,
//        not surfaced (response already returned 202).
//     6. Return 202 + { defectId, runId, accepted: true }.
//
// Day-21+: GET /api/defects/:id/rca becomes functional once 5-layer
// RcaReport persistence lands (this PR); POST/GET/PATCH on the defect
// itself land alongside DefectsService CRUD.
//
// Request body shape for POST :id/rca:
//   { stackTrace: string, failureMessage: string, component: string | null }
//
// Auth (Day-21): NOT yet wired on this endpoint — actorId is null for now
// (system-initiated audits). Auth retrofit is a separate followup; the
// existing audit chain still validates because workspaceId is resolved
// from the defect itself (defect → project → workspaceId).

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  Role,
  DefectListQuery,
  type DefectListResponse,
  type DefectDetailResponse,
} from '@qa-nexus/shared';
import { z } from 'zod';
import { SherlockOrchestratorService } from '../agents/sherlock-orchestrator/sherlock-orchestrator.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { DefectsService, type DefectActorContext } from './defects.service';

/** Canonical UUID v4 path-param matcher (shared by detail + rca). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Request body for POST /api/defects/:id/rca. Failure context the
 *  orchestrator's 4 agents need to do their analysis. */
const RcaKickoffBodySchema = z.object({
  stackTrace: z.string().min(1).max(50_000),
  failureMessage: z.string().min(1).max(10_000),
  component: z.string().min(1).max(120).nullable(),
});

/** Build a WHATWG Headers from the Express request for AuthService session
 *  resolution. Mirrors the per-controller helper in auth/audit controllers. */
function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/defects')
export class DefectsController {
  private readonly logger = new Logger(DefectsController.name);

  constructor(
    private readonly sherlock: SherlockOrchestratorService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authService: AuthService,
    private readonly defects: DefectsService,
  ) {}

  /** Resolve the actor off the BetterAuth session. The RolesGuard already
   *  proved a valid session exists; this re-resolves it for the workspace
   *  scope (the guard doesn't attach it to the request). */
  private async actorOf(req: Request): Promise<DefectActorContext> {
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
      role: session.appUser.role as DefectActorContext['role'],
    };
  }

  @Post()
  create(@Body() _body: unknown, @Res() res: Response): void {
    this.stub(res, 'create defect');
  }

  /**
   * GET /api/defects — workspace-scoped list for the F21 Defects Hub.
   * W2-R (Day-32): the 25 seeded defects are now reachable. Read-only,
   * all 4 roles (Stakeholder is read-only — parity with test-cases/
   * requirements list). NOT audited (ERD §8.7). Optional filters:
   * ?projectId=&status=&severity=&assigneeId=&component=&q=&page=&pageSize=.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(
    @Query() query: unknown,
    @Req() req: Request,
  ): Promise<DefectListResponse> {
    const q = DefectListQuery.parse(query ?? {});
    const ctx = await this.actorOf(req);
    const result = await this.defects.list(q, ctx);
    return {
      ok: true,
      defects: result.defects,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  /**
   * GET /api/defects/:id — detail (F21 row → F22 header data). W2-R
   * (Day-32): replaces the 501 stub. Cross-workspace or absent → 404
   * (no leak). Read-only, all 4 roles. NOT audited.
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async detail(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<DefectDetailResponse> {
    if (!UUID_RE.test(id)) {
      throw new BadRequestException('Defect ID path param must be a UUID.');
    }
    const ctx = await this.actorOf(req);
    const defect = await this.defects.detail(id, ctx);
    return { ok: true, defect };
  }

  /**
   * POST /api/defects/:id/rca — kick off Sherlock RCA fan-out.
   *
   * Day-21 (da) contract: async 202+WS pattern.
   *   - Validates UUID + body, then resolves defect → workspaceId.
   *   - Writes `defect.rca_kicked_off` audit row synchronously.
   *   - Returns 202 + { defectId, runId, accepted: true } immediately.
   *   - Spawns the orchestrator via setImmediate; it persists the
   *     RcaReport + writes the `rca_completed` audit row + emits
   *     `rca.complete.<runId>` on the WS gateway when done. p95 latency
   *     expected ~3-5s in pilot ops.
   *
   *   FE subscribes to `rca.complete.<runId>` (RealtimeGateway) BEFORE
   *   firing this request so the completion event isn't missed.
   */
  @Post(':id/rca')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async kickoffRca(
    @Param('id') defectId: string,
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Validate path param is a UUID — fail fast on shape errors.
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        defectId,
      )
    ) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'InvalidDefectId',
        message: 'Defect ID path param must be a UUID.',
      });
      return;
    }

    const parsed = RcaKickoffBodySchema.safeParse(body);
    if (!parsed.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'InvalidRequestBody',
        message: parsed.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      });
      return;
    }

    // Resolve defect → workspaceId. Doubles as existence check.
    const defect = await this.prisma.defect.findUnique({
      where: { id: defectId },
      select: { project: { select: { workspaceId: true } } },
    });
    if (!defect) {
      res.status(HttpStatus.NOT_FOUND).json({
        error: 'DefectNotFound',
        message: `Defect ${defectId} not found.`,
      });
      return;
    }
    const workspaceId = defect.project.workspaceId;

    // The guard guarantees an authenticated Admin/Lead/QA-Engineer session.
    // Resolve the actor for the audit trail + enforce tenant isolation: a user
    // may only trigger RCA on a defect in their OWN workspace. Cross-tenant (or
    // a vanished session) is surfaced as 404 — never reveal another workspace's
    // defect exists, and never burn LLM quota for it.
    const actor = await this.authService.resolveSession(reqHeaders(req));
    if (!actor || actor.appUser.workspaceId !== workspaceId) {
      res.status(HttpStatus.NOT_FOUND).json({
        error: 'DefectNotFound',
        message: `Defect ${defectId} not found.`,
      });
      return;
    }
    const actorId = actor.appUser.id;

    // Pre-allocate runId so audit + orchestrator + WS event share it.
    const runId = randomUUID();
    const orchestratorInput = {
      defectId,
      stackTrace: parsed.data.stackTrace,
      failureMessage: parsed.data.failureMessage,
      component: parsed.data.component,
      recentCommits: [],
    };

    // Step 5 — kickoff audit (SYNC, blocks 202). A failed audit MUST
    // fail the request per .claude/rules/api.md.
    await this.audit.write({
      workspaceId,
      actorId,
      entityType: 'defect',
      entityId: defectId,
      action: 'rca_kicked_off',
      payload: {
        runId,
        component: parsed.data.component,
        failureMessagePreview: parsed.data.failureMessage.slice(0, 200),
      },
    });

    // Step 6 — spawn orchestrator out-of-band. setImmediate ensures the
    // 202 response is flushed before the fan-out + 4 LLM agent calls
    // begin. Errors are logged; the AgentRun row's status is the
    // source-of-truth for the run state.
    setImmediate(() => {
      this.sherlock
        .runAndPersist(orchestratorInput, {
          runId,
          workspaceId,
          actorId,
        })
        .catch((err) => {
          this.logger.error(
            `runAndPersist failed for runId=${runId} defectId=${defectId}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        });
    });

    res.status(HttpStatus.ACCEPTED).json({
      defectId,
      runId,
      accepted: true,
      wsChannel: `rca.complete.${runId}`,
    });
  }

  @Get(':id/rca')
  rca(@Param('id') _id: string, @Res() res: Response): void {
    this.stub(res, 'fetch defect RCA (GET — Day-21 once DB persistence lands)');
  }

  @Post(':id/jira')
  pushToJira(
    @Param('id') _id: string,
    @Body() _body: unknown,
    @Res() res: Response,
  ): void {
    this.stub(res, 'push defect to Jira');
  }

  @Patch(':id/status')
  setStatus(
    @Param('id') _id: string,
    @Body() _body: unknown,
    @Res() res: Response,
  ): void {
    this.stub(res, 'change defect status');
  }

  private stub(res: Response, op: string): void {
    res
      .status(HttpStatus.NOT_IMPLEMENTED)
      .header('x-m4-stub', 'true')
      .json({
        error: 'NotImplemented',
        message: `Defects endpoint stub. Operation "${op}" lands Day-20+ alongside DefectsService CRUD.`,
        m4Stub: true,
        op,
      });
  }
}
