// QA Nexus PM1 — JiraSyncController.
//
// Day-19 P0 #2: scaffold (501 stubs for all 3 endpoints) — landed in PR #157.
// Day-19 P2: convert /api/jira/webhook to FUNCTIONAL with HMAC verify +
//            Zod payload validation + audit-write (this PR).
// Day-20+:   connect/sync land alongside Defects controller becoming
//            functional + DefectsService.createFromJira + WS emit.
//
// CRITICAL: this controller's webhook handler reads `req.body` as a
// raw Buffer (NOT JSON-parsed). The raw-body middleware is installed in
// `apps/api/src/main.ts` on `/api/jira/webhook` BEFORE the global
// `express.json()` parser. See `docs/architecture/webhook-raw-body.md`.

import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { verifyHmacSha256 } from './hmac-verifier';
import { JiraWebhookPayloadSchema } from './jira-webhook.schema';
import { JiraSyncService } from './jira-sync.service';

@Controller('api')
export class JiraSyncController {
  constructor(private readonly jiraSync: JiraSyncService) {}

  /// POST /api/jira/webhook — Atlassian → us. HMAC-SHA256 over raw body.
  ///
  /// Day-19 contract: verify signature → Zod-parse payload → fire-and-
  /// forget audit → 200 ack. Day-20 will add the side-effects (defect
  /// upsert + WS emit + retry-queue dead-letter on parse fail).
  @Post('jira/webhook')
  webhook(@Req() req: Request, @Res() res: Response): void {
    // 1. Pull raw body bytes. Express's raw middleware delivers Buffer.
    //    If something else (or nothing) parsed the body, fail closed —
    //    we cannot recompute HMAC over a JSON-stringified shape.
    const rawBody = req.body as unknown;
    if (!Buffer.isBuffer(rawBody)) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'RawBodyMissing',
        message:
          'POST /api/jira/webhook requires raw-body middleware. ' +
          'Check apps/api/src/main.ts mounting order.',
      });
      return;
    }

    // 2. HMAC verify. Header convention: `X-Hub-Signature: sha256=<hex>`.
    const sigHeader = this.firstHeaderValue(req.headers['x-hub-signature']);
    const secret = process.env.JIRA_WEBHOOK_SECRET ?? '';
    const verifyResult = verifyHmacSha256(rawBody, sigHeader, secret);
    if (!verifyResult.ok) {
      this.jiraSync.recordWebhookSignatureInvalid(verifyResult.reason);
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ error: 'InvalidSignature', reason: verifyResult.reason });
      return;
    }

    // 3. Parse JSON + Zod-validate. The raw-body path bypassed Express's
    //    type-check so we re-validate defensively.
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'InvalidJson',
        message: 'Webhook body is not valid JSON',
      });
      return;
    }
    const validated = JiraWebhookPayloadSchema.safeParse(parsed);
    if (!validated.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'PayloadValidationFailed',
        message: validated.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      });
      return;
    }

    // 4. Audit-write (fire-and-forget). 200 ack — Day-20 side-effects deferred.
    this.jiraSync.recordWebhookReceived(validated.data);
    res.status(HttpStatus.OK).json({
      ack: true,
      eventType: validated.data.webhookEvent,
      issueKey: validated.data.issue?.key ?? null,
    });
  }

  /// POST /api/projects/:slug/jira/connect — STUB (Day-20+).
  @Post('projects/:slug/jira/connect')
  connect(
    @Param('slug') _slug: string,
    @Body() _body: unknown,
    @Res() res: Response,
  ): void {
    this.stub(res, 'connect project to jira');
  }

  /// POST /api/projects/:slug/jira/sync — STUB (Day-20+).
  @Post('projects/:slug/jira/sync')
  sync(
    @Param('slug') _slug: string,
    @Body() _body: unknown,
    @Res() res: Response,
  ): void {
    this.stub(res, 'manual jira resync');
  }

  /** Express headers can be string or string[] — collapse to first value. */
  private firstHeaderValue(
    v: string | string[] | undefined,
  ): string | undefined {
    if (Array.isArray(v)) return v[0];
    return v;
  }

  private stub(res: Response, op: string): void {
    res
      .status(HttpStatus.NOT_IMPLEMENTED)
      .header('x-m4-stub', 'true')
      .json({
        error: 'NotImplemented',
        message:
          `Jira sync stub. Operation "${op}" lands Day-20+ alongside ` +
          `DefectsService.createFromJira + WS emit.`,
        m4Stub: true,
        op,
      });
  }
}
