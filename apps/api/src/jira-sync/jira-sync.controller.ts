// QA Nexus PM1 — JiraSyncController (M4 STUB — Day-19 P0 #2 wiring).
//
// 501 stub per Day-19 brief. Real implementation lands Day-19/20:
//   - POST /api/jira/webhook (raw-body middleware route-scoped; HMAC
//     verified against JIRA_WEBHOOK_SECRET)
//   - POST /api/projects/:slug/jira/connect (api_token bootstrap)
//   - POST /api/projects/:slug/jira/sync   (manual resync trigger)
//
// CRITICAL — Day-20 implementation note (reminder, NOT in this stub):
// Atlassian Jira webhooks compute HMAC-SHA256 on RAW body bytes. The
// webhook handler MUST use a dedicated raw-body middleware on
// /api/jira/webhook ONLY (rest of API keeps default JSON parsing).

import { Body, Controller, HttpStatus, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('api')
export class JiraSyncController {
  /// POST /api/jira/webhook — Atlassian → us. Raw-body HMAC validated.
  @Post('jira/webhook')
  webhook(@Body() _body: unknown, @Res() res: Response): void {
    this.stub(res, 'jira webhook receiver');
  }

  /// POST /api/projects/:slug/jira/connect — api_token bootstrap.
  @Post('projects/:slug/jira/connect')
  connect(
    @Param('slug') _slug: string,
    @Body() _body: unknown,
    @Res() res: Response,
  ): void {
    this.stub(res, 'connect project to jira');
  }

  /// POST /api/projects/:slug/jira/sync — manual resync trigger.
  @Post('projects/:slug/jira/sync')
  sync(
    @Param('slug') _slug: string,
    @Body() _body: unknown,
    @Res() res: Response,
  ): void {
    this.stub(res, 'manual jira resync');
  }

  private stub(res: Response, op: string): void {
    res
      .status(HttpStatus.NOT_IMPLEMENTED)
      .header('x-m4-stub', 'true')
      .json({
        error: 'NotImplemented',
        message:
          `Jira sync stub (Day-19 P0 #2 AppModule wiring). ` +
          `Operation "${op}" lands Day-19/20 alongside the webhook receiver + ` +
          `raw-body middleware + HMAC-SHA256 signature validation.`,
        m4Stub: true,
        op,
      });
  }
}
