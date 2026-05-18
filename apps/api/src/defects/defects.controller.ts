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
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { z } from 'zod';
import { SherlockOrchestratorService } from '../agents/sherlock-orchestrator/sherlock-orchestrator.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

/** Request body for POST /api/defects/:id/rca. Failure context the
 *  orchestrator's 4 agents need to do their analysis. */
const RcaKickoffBodySchema = z.object({
  stackTrace: z.string().min(1).max(50_000),
  failureMessage: z.string().min(1).max(10_000),
  component: z.string().min(1).max(120).nullable(),
});

@Controller('api/defects')
export class DefectsController {
  private readonly logger = new Logger(DefectsController.name);

  constructor(
    private readonly sherlock: SherlockOrchestratorService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  create(@Body() _body: unknown, @Res() res: Response): void {
    this.stub(res, 'create defect');
  }

  @Get(':id')
  detail(@Param('id') _id: string, @Res() res: Response): void {
    this.stub(res, 'get defect detail');
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
  async kickoffRca(
    @Param('id') defectId: string,
    @Body() body: unknown,
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
      actorId: null, // TODO(auth-retrofit): wire AuthService once @Roles lands on this endpoint
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
          actorId: null,
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
