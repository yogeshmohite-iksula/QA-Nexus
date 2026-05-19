// QA Nexus PM1 — JiraSyncService (Day-19 P2 webhook receiver core).
//
// Spec: PM1_PRD §3 (Jira sync) + PM1_ERD §6 (jira_webhook events) +
// followup `(bq)` raw-body design.
//
// SCOPE Day-19 P2:
//   - Handles signature-verified webhooks: Zod-parse + audit-write.
//   - Caches the system workspace ID at OnModuleInit (single boot-time
//     prisma.workspace.findFirst — NO per-request DB hit per Day-19 cost
//     gate; Neon at 81.61/100 CU-hr).
//
// SCOPE Day-20+ (NOT in this PR):
//   - jira:issue_created → defect row upsert (DefectsService.createFromJira).
//   - jira:issue_updated → status sync.
//   - WebSocket `defect.updated` event emit.

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { JiraWebhookPayload } from './jira-webhook.schema';
import type { VerifyFailReason } from './hmac-verifier';

@Injectable()
export class JiraSyncService implements OnModuleInit {
  private readonly logger = new Logger(JiraSyncService.name);
  /** Cached at boot — single source for the system-actor audit rows. */
  private cachedSystemWorkspaceId: string | null = null;

  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /** One-time DB hit at boot to resolve the system workspace UUID.
   *  All later webhook audits reuse this cached value — zero per-request
   *  DB hits in the hot path.
   *
   *  Defensive: if the lookup fails (no workspaces seeded — e.g. fresh
   *  test DB), service stays usable but audit writes will be skipped at
   *  runtime with a WARN log. The HMAC verify path still works because
   *  it doesn't depend on the audit chain. */
  async onModuleInit(): Promise<void> {
    try {
      const ws = await this.prisma.workspace.findFirst({
        select: { id: true },
      });
      if (ws) {
        this.cachedSystemWorkspaceId = ws.id;
        this.logger.log(
          `JiraSync system workspace cached: ${ws.id.slice(0, 8)}…`,
        );
      } else {
        this.logger.warn(
          'JiraSync OnModuleInit: no workspace found — audit writes will be skipped',
        );
      }
    } catch (err) {
      this.logger.warn(
        `JiraSync OnModuleInit workspace lookup failed: ${err instanceof Error ? err.message : String(err)} — audit writes will be skipped`,
      );
    }
  }

  /**
   * Record a successfully-verified Jira webhook receipt to the audit chain.
   * Fire-and-forget (non-blocking) — the HTTP 200 ack returns immediately.
   *
   * Day-20 will add the actual upsert side-effects; this PR's contract is
   * "received + audited + acked".
   */
  recordWebhookReceived(payload: JiraWebhookPayload): void {
    const wsId = this.cachedSystemWorkspaceId;
    if (!wsId) {
      this.logger.warn(
        `JiraSync.recordWebhookReceived: no cached workspace — skipping audit for event=${payload.webhookEvent}`,
      );
      return;
    }
    this.audit.writeNonBlocking({
      workspaceId: wsId,
      actorId: null, // system event — Atlassian, not a TB-002 user
      entityType: 'jira',
      entityId: payload.issue?.id ?? null,
      action: 'webhook_received',
      payload: {
        webhookEvent: payload.webhookEvent,
        issueKey: payload.issue?.key ?? null,
        issueId: payload.issue?.id ?? null,
        userAccountId: payload.user?.accountId ?? null,
        timestamp: payload.timestamp ?? null,
      },
    });
  }

  /**
   * Record a signature-verification FAILURE to the audit chain. Fire-and-
   * forget. Skipped silently if the system workspace isn't cached (e.g.
   * pre-seed test DB) — failure-side audit is best-effort.
   *
   * Defense-in-depth: even though we 401 the request, we still record the
   * attempt so a forensic review can see signature-mismatch volume + IP
   * patterns (IP capture lands Day-20 with the rate-limiter).
   */
  recordWebhookSignatureInvalid(reason: VerifyFailReason): void {
    const wsId = this.cachedSystemWorkspaceId;
    if (!wsId) {
      // Don't log warn here — pre-seed env shouldn't spam on invalid attempts.
      return;
    }
    this.audit.writeNonBlocking({
      workspaceId: wsId,
      actorId: null,
      entityType: 'jira',
      entityId: null,
      action: 'webhook_signature_invalid',
      payload: { reason },
    });
  }

  /**
   * Day-22 P1 (ADR-020 §7 ratified) — persist the inbound webhook to the
   * `jira_webhook_events` staging table BEFORE returning 200 OK. The
   * AFTER-INSERT trigger then fires `pg_notify('webhook_received', id)`
   * which the WebhookProcessorService listens for + drives async.
   *
   * Idempotency: `event_id` is UNIQUE. Atlassian retries (which use the
   * SAME X-Atlassian-Webhook-Identifier value per delivery cycle) are
   * absorbed as 'duplicate' — caller returns 200 OK so Atlassian stops
   * retrying instead of escalating to dead-letter.
   *
   * Hot-path budget per ADR-020 §7: <500ms p95 from receive → 200 ack.
   * The INSERT itself is ~30-80ms on Neon free tier; trigger NOTIFY is
   * negligible (Postgres in-process pub/sub). Well within budget after
   * HMAC verify (~5-15ms) + JSON parse + Zod validate (~5-10ms).
   */
  async persistWebhookEvent(input: {
    eventId: string;
    payload: JiraWebhookPayload;
    signatureValid: boolean;
  }): Promise<'inserted' | 'duplicate'> {
    try {
      await this.prisma.jiraWebhookEvent.create({
        data: {
          eventId: input.eventId,
          jiraIssueKey: input.payload.issue?.key ?? null,
          eventType: input.payload.webhookEvent,
          payload: input.payload as object,
          signatureValid: input.signatureValid,
          // processed=false (default), retryCount=0 (default), processedAt=null
        },
      });
      return 'inserted';
    } catch (err) {
      // Prisma P2002 = unique constraint violation on event_id.
      // Atlassian retries deliver the same X-Atlassian-Webhook-Identifier,
      // so this is the expected duplicate-absorption path.
      const code = (err as { code?: string }).code;
      if (code === 'P2002') return 'duplicate';
      throw err;
    }
  }

  /**
   * Day-22 P1 — fetch + mark a single webhook event as processed. Called
   * by WebhookProcessorService on receipt of a `webhook_received` NOTIFY.
   * The actual side-effect logic (defect upsert, WS emit, etc) lands
   * Day-23 wire-up; this stub just toggles processed=true so the table
   * doesn't accumulate during testing.
   */
  async markWebhookProcessed(
    id: string,
    error: string | null = null,
  ): Promise<void> {
    await this.prisma.jiraWebhookEvent.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingError: error,
      },
    });
  }

  /** Test seam — exposed only for spec injection of the cached value
   *  without booting the whole NestJS lifecycle. NEVER call from app
   *  code; if you need the value, depend on OnModuleInit ordering. */
  /** @internal */
  _setCachedWorkspaceIdForTests(workspaceId: string | null): void {
    this.cachedSystemWorkspaceId = workspaceId;
  }
}
