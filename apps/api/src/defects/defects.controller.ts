// QA Nexus PM1 — DefectsController (M4 STUB — Day-19 P0 #2 wiring).
//
// 501 stub per Day-19 brief. Full defect-lifecycle endpoints land
// Day-20+ alongside the A4 RCA service (defect.rca_ready event chain).
//
// Routes (per PM1_ERD §6 EP-011..EP-015):
//   POST   /api/defects                  create
//   GET    /api/defects/:id              detail (incl. RCA)
//   GET    /api/defects/:id/rca          fetch + (re)compute RCA
//   POST   /api/defects/:id/jira         push to Jira (delegates to JiraSync)
//   PATCH  /api/defects/:id/status       status change (state machine)

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

@Controller('api/defects')
export class DefectsController {
  @Post()
  create(@Body() _body: unknown, @Res() res: Response): void {
    this.stub(res, 'create defect');
  }

  @Get(':id')
  detail(@Param('id') _id: string, @Res() res: Response): void {
    this.stub(res, 'get defect detail');
  }

  @Get(':id/rca')
  rca(@Param('id') _id: string, @Res() res: Response): void {
    this.stub(res, 'fetch defect RCA');
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
        message:
          `Defects endpoint stub (Day-19 P0 #2 AppModule wiring). ` +
          `Operation "${op}" lands Day-20+ alongside A4 RCA service.`,
        m4Stub: true,
        op,
      });
  }
}
