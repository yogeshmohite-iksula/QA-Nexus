// QA Nexus PM1 — DefectsController.
//
// Day-19 P0 #2 (PR #157): all 5 endpoints scaffolded as 501 stubs.
// Day-20 P1 (this PR): POST /api/defects/:id/rca becomes FUNCTIONAL —
//   calls SherlockOrchestratorService.runRca() synchronously and returns
//   { runId, status, hypotheses } inline. Other 4 endpoints stay stubs.
//
// Day-21+: GET /api/defects/:id/rca becomes functional once 5-layer
// RcaReport persistence lands (followup `(da)`); POST/GET/PATCH on the
// defect itself land alongside DefectsService CRUD.
//
// Request body shape for POST :id/rca (Day-20):
//   { stackTrace: string, failureMessage: string, component: string | null }
// The defect identity comes from path param :id. Day-21 will switch to
// DB lookup once DefectsService.findByIdOrThrow lands.

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { SherlockOrchestratorService } from '../agents/sherlock-orchestrator/sherlock-orchestrator.service';

/** Request body for POST /api/defects/:id/rca. Failure context the
 *  orchestrator's 4 agents need to do their analysis. */
const RcaKickoffBodySchema = z.object({
  stackTrace: z.string().min(1).max(50_000),
  failureMessage: z.string().min(1).max(10_000),
  component: z.string().min(1).max(120).nullable(),
});

@Controller('api/defects')
export class DefectsController {
  constructor(private readonly sherlock: SherlockOrchestratorService) {}

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
   * Day-20 contract: synchronous fan-out (all 4 agents in parallel via
   * Promise.all + 30s timeout each). Returns the merged hypotheses
   * inline. p95 latency expected <5s in pilot ops; Day-21 may flip to
   * async 202+poll pattern if real ops show >5s.
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

    const result = await this.sherlock.runRca({
      defectId,
      stackTrace: parsed.data.stackTrace,
      failureMessage: parsed.data.failureMessage,
      component: parsed.data.component,
      recentCommits: [],
    });

    res.status(HttpStatus.OK).json({
      defectId,
      runId: result.runId,
      status: result.status,
      okAgentCount: result.okAgentCount,
      hypotheses: result.hypotheses,
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
