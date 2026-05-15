// QA Nexus PM1 — TestRunsController (M4 STUB — Day-19 P0 #2 wiring).
//
// 501 stub per Day-19 brief — AppModule surface exists so FE+1 + Yogesh
// can hit endpoints (they'll return Not Implemented with the
// `x-m4-stub: true` header for visibility) before the full state-machine
// + audit + WS-emit implementation lands at M4 close cascade via PR #149.
//
// State machine (PM1_ERD §3.10) — full impl in PR #149 (HOLD):
//   queued → running → passed | failed | blocked | aborted
//
// Routes (subject to PR #149 replacement; route paths must match for the
// rebase to drop in cleanly):
//   PATCH /api/test-runs/:id/start    queued → running
//   PATCH /api/test-runs/:id/result   running → passed | failed | blocked
//   PATCH /api/test-runs/:id/abort    running → aborted (Admin / Lead)

import {
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

@Controller('api/test-runs')
export class TestRunsController {
  @Patch(':id/start')
  start(@Param('id') _id: string, @Res() res: Response): void {
    this.stub(res);
  }

  @Patch(':id/result')
  report(@Param('id') _id: string, @Res() res: Response): void {
    this.stub(res);
  }

  @Patch(':id/abort')
  abort(@Param('id') _id: string, @Res() res: Response): void {
    this.stub(res);
  }

  private stub(res: Response): void {
    res
      .status(HttpStatus.NOT_IMPLEMENTED)
      .header('x-m4-stub', 'true')
      .json({
        error: 'NotImplemented',
        message:
          'TestRuns endpoints are M4 stubs (Day-19 P0 #2 AppModule wiring). ' +
          'Full state-machine + audit + WS-emit lands at M4 close cascade via PR #149.',
        m4Stub: true,
        landingPr: 149,
      });
    // Throwing keeps the controller signature aligned with the eventual
    // PR #149 impl's promise return; resolve via response object only.
    void HttpException;
  }
}
