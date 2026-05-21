// QA Nexus PM1 — WebhookProcessorService.
//
// Day-22 P1 (ADR-020 §7 ratified) — pg-listen subscriber that drives the
// async webhook pipeline. On boot, opens a dedicated Postgres connection
// (separate from the Prisma pool so notifications keep flowing during
// heavy query bursts) and subscribes to the `webhook_received` channel.
//
// Flow:
//   1. Postgres trigger fires `pg_notify('webhook_received', NEW.id)`
//      AFTER INSERT on jira_webhook_events (migration
//      20260519080000_jira_webhook_retry_count_and_notify_trigger).
//   2. This service's onNotification handler receives the id payload.
//   3. SELECT the row via JiraSyncService → drive the handler stub →
//      mark processed=true so the staging table doesn't accumulate.
//
// Day-22 scope: scaffold + stub handler logging only. Day-23 wire-up
// adds: routing per webhookEvent → DefectsService.createFromJira on
// jira:issue_created, status sync on jira:issue_updated, WS emit on
// defect.* changes, retry-with-backoff increments retryCount and
// pushes to DLQ at MAX_RETRIES.
//
// Why pg-listen instead of Redis/BullMQ: Hard Rule 5 bans Redis.
// Postgres LISTEN/NOTIFY is the in-stack, $0/month equivalent — works
// fine for our 8-user pilot volume (peak ~10 webhook/min sustained).
//
// Robustness:
//  - pg-listen auto-reconnects on connection drop (built-in)
//  - Fallback unprocessed-scan runs every 60s to catch events that
//    arrived while we were disconnected (Day-23 wire-up adds this)
//  - onNotification handler is wrapped in try/catch so a single bad
//    event can't crash the subscriber loop

import {
  Injectable,
  Logger,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import createSubscriber from 'pg-listen';
import { PrismaService } from '../prisma/prisma.service';
import { JiraSyncService } from './jira-sync.service';
import { IssueWebhookHandler } from './issue-webhook.handler';
import { SprintWebhookHandler } from './sprint-webhook.handler';
import { CommentWebhookHandler } from './comment-webhook.handler';
import { VersionWebhookHandler } from './version-webhook.handler';
import { PropertyWebhookHandler } from './property-webhook.handler';
import {
  JiraWebhookIssueCreatedPayloadSchema,
  JiraWebhookIssueUpdatedPayloadSchema,
  JiraWebhookIssueDeletedPayloadSchema,
  JiraWebhookSprintCreatedPayloadSchema,
  JiraWebhookSprintUpdatedPayloadSchema,
  JiraWebhookSprintDeletedPayloadSchema,
  JiraWebhookCommentCreatedPayloadSchema,
  JiraWebhookCommentUpdatedPayloadSchema,
  JiraWebhookCommentDeletedPayloadSchema,
  JiraWebhookVersionCreatedPayloadSchema,
  JiraWebhookVersionReleasedPayloadSchema,
  JiraWebhookVersionUnreleasedPayloadSchema,
  JiraWebhookPropertyPayloadSchema,
  JiraWebhookSprintClosedPayloadSchema,
  isWiredEventType,
} from './jira-webhook.schema';

// Day-22 legacy channel name. Kept as-is for M5 per the namespace M6 hygiene
// followup (see docs/m6/m6-hygiene-followups.md). M6 will rename to
// `qa_nexus.jira.webhook_received` per ADR-021 §6 namespace convention.
const WEBHOOK_CHANNEL = 'webhook_received';

type Subscriber = ReturnType<typeof createSubscriber>;

@Injectable()
export class WebhookProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookProcessorService.name);
  private subscriber: Subscriber | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jiraSync: JiraSyncService,
    private readonly issueHandler: IssueWebhookHandler,
    private readonly sprintHandler: SprintWebhookHandler,
    private readonly commentHandler: CommentWebhookHandler,
    private readonly versionHandler: VersionWebhookHandler,
    private readonly propertyHandler: PropertyWebhookHandler,
  ) {}

  async onModuleInit(): Promise<void> {
    // Skip subscriber boot in test environments — jest doesn't need a
    // live pg-listen connection and the lack of DATABASE_URL would
    // crash module init.
    if (process.env.NODE_ENV === 'test') {
      this.logger.log('WebhookProcessor: skipping subscriber (NODE_ENV=test)');
      return;
    }
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.logger.warn(
        'WebhookProcessor: DATABASE_URL missing — pg-listen subscriber NOT started. ' +
          'Webhooks will still persist via Prisma but async processing will not fire.',
      );
      return;
    }

    this.subscriber = createSubscriber({ connectionString: dbUrl });

    this.subscriber.notifications.on(
      WEBHOOK_CHANNEL,
      async (payload: unknown) => {
        const id = typeof payload === 'string' ? payload : String(payload);
        try {
          await this.handleNotification(id);
        } catch (err) {
          this.logger.error(
            `WebhookProcessor: handler failed for id=${id}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      },
    );

    this.subscriber.events.on('error', (err: unknown) => {
      this.logger.error(
        `WebhookProcessor: pg-listen error: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });

    await this.subscriber.connect();
    await this.subscriber.listenTo(WEBHOOK_CHANNEL);
    this.logger.log(
      `WebhookProcessor: listening on '${WEBHOOK_CHANNEL}' (Day-22 stub — Day-23 wire-up pending)`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.subscriber) return;
    try {
      await this.subscriber.unlistenAll();
      await this.subscriber.close();
      this.logger.log('WebhookProcessor: subscriber closed cleanly');
    } catch (err) {
      this.logger.warn(
        `WebhookProcessor: error closing subscriber: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Day-23 wire-up handler — dispatch by eventType to per-event handlers.
   *
   * Wired event types (Day-23 P1, 7 of 14 Atlassian events):
   *   ISSUE: jira:issue_created / _updated / _deleted
   *   SPRINT: sprint_created / _updated / _deleted / _closed
   * Deferred to Day-24: comment_*, version_*, property_*.
   *
   * Unknown / unwired event types are absorbed (logged + marked processed)
   * so the staging table doesn't accumulate. Atlassian sends secondary
   * cascade events (e.g. comment_deleted when an issue is deleted) that
   * our idempotency UNIQUE on event_id collapses — but the cascade events
   * still arrive as separate rows, so we mark-and-skip them here.
   *
   * Per ADR-020 §7: failures inside a handler do NOT crash the loop;
   * the outer try/catch in onModuleInit's notification callback catches.
   * Handler exceptions cause processed=false to stay set so the row
   * appears in the Day-24 retry-with-backoff sweep.
   */
  async handleNotification(id: string): Promise<void> {
    const row = await this.prisma.jiraWebhookEvent.findUnique({
      where: { id },
      select: {
        id: true,
        eventId: true,
        eventType: true,
        jiraIssueKey: true,
        signatureValid: true,
        processed: true,
        payload: true,
      },
    });
    if (!row) {
      this.logger.warn(
        `WebhookProcessor: notify for id=${id} but row not found (already deleted?)`,
      );
      return;
    }
    if (row.processed) {
      this.logger.debug(
        `WebhookProcessor: skip already-processed id=${id} eventId=${row.eventId}`,
      );
      return;
    }
    if (!row.signatureValid) {
      this.logger.warn(
        `WebhookProcessor: skip signature-invalid id=${id} eventId=${row.eventId}`,
      );
      await this.jiraSync.markWebhookProcessed(id, 'signature_invalid_skipped');
      return;
    }

    const eventType = row.eventType;
    const rawPayload = row.payload;

    if (!isWiredEventType(eventType)) {
      // Unwired event type (comment_*, version_*, property_*, etc) — log
      // + mark processed to drain the staging table. Day-24 wire-up adds
      // routing for the remaining 7 event types.
      this.logger.debug(
        `WebhookProcessor: unwired eventType=${eventType} id=${id} — mark processed`,
      );
      await this.jiraSync.markWebhookProcessed(id, 'unwired_event_type');
      return;
    }

    try {
      await this.dispatch(eventType, rawPayload, id);
      await this.jiraSync.markWebhookProcessed(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `WebhookProcessor: handler threw for eventType=${eventType} id=${id}: ${msg}`,
      );
      // Day-24 retry-with-backoff will increment retry_count and re-attempt.
      // Today: leave processed=false; the row is visible to the sweep.
      throw err;
    }
  }

  /** Dispatch a wired event-type to its handler. Callers Zod-parse the
   *  payload inside the handler so unknown fields are tolerated. */
  private async dispatch(
    eventType: string,
    rawPayload: unknown,
    eventRowId: string,
  ): Promise<void> {
    switch (eventType) {
      case 'jira:issue_created': {
        const parsed =
          JiraWebhookIssueCreatedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `jira:issue_created Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.issueHandler.handleCreated(parsed.data, eventRowId);
        return;
      }
      case 'jira:issue_updated': {
        const parsed =
          JiraWebhookIssueUpdatedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `jira:issue_updated Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.issueHandler.handleUpdated(parsed.data, eventRowId);
        return;
      }
      case 'jira:issue_deleted': {
        const parsed =
          JiraWebhookIssueDeletedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `jira:issue_deleted Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.issueHandler.handleDeleted(parsed.data, eventRowId);
        return;
      }
      case 'sprint_created': {
        const parsed =
          JiraWebhookSprintCreatedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `sprint_created Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.sprintHandler.handleCreated(parsed.data, eventRowId);
        return;
      }
      case 'sprint_updated': {
        const parsed =
          JiraWebhookSprintUpdatedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `sprint_updated Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.sprintHandler.handleUpdated(parsed.data, eventRowId);
        return;
      }
      case 'sprint_deleted': {
        const parsed =
          JiraWebhookSprintDeletedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `sprint_deleted Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.sprintHandler.handleDeleted(parsed.data, eventRowId);
        return;
      }
      case 'sprint_closed': {
        const parsed =
          JiraWebhookSprintClosedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `sprint_closed Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.sprintHandler.handleClosed(parsed.data, eventRowId);
        return;
      }

      // ─────────────────────────────────────────────────────────────────
      // Day-24 P1 — Comment + Version + Property event families.
      // ADR-020 wire-up now COMPLETE (14 of 14 Atlassian event types).
      // ─────────────────────────────────────────────────────────────────
      case 'comment_created': {
        const parsed =
          JiraWebhookCommentCreatedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `comment_created Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.commentHandler.handleCreated(parsed.data, eventRowId);
        return;
      }
      case 'comment_updated': {
        const parsed =
          JiraWebhookCommentUpdatedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `comment_updated Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.commentHandler.handleUpdated(parsed.data, eventRowId);
        return;
      }
      case 'comment_deleted': {
        const parsed =
          JiraWebhookCommentDeletedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `comment_deleted Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.commentHandler.handleDeleted(parsed.data, eventRowId);
        return;
      }
      case 'jira:version_created': {
        const parsed =
          JiraWebhookVersionCreatedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `jira:version_created Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.versionHandler.handleCreated(parsed.data, eventRowId);
        return;
      }
      case 'jira:version_released': {
        const parsed =
          JiraWebhookVersionReleasedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `jira:version_released Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.versionHandler.handleReleased(parsed.data, eventRowId);
        return;
      }
      case 'jira:version_unreleased': {
        const parsed =
          JiraWebhookVersionUnreleasedPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `jira:version_unreleased Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.versionHandler.handleUnreleased(parsed.data, eventRowId);
        return;
      }
      case 'issue_property_set':
      case 'issue_property_deleted': {
        const parsed = JiraWebhookPropertyPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(
            `${eventType} Zod validation failed: ${parsed.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join('; ')}`,
          );
        }
        await this.propertyHandler.handle(parsed.data, eventRowId);
        return;
      }
      default:
        // Unreachable per isWiredEventType() guard at the call site.
        throw new Error(`Dispatch: unhandled wired event type ${eventType}`);
    }
  }
}
