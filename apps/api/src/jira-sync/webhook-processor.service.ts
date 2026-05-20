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

const WEBHOOK_CHANNEL = 'webhook_received';

type Subscriber = ReturnType<typeof createSubscriber>;

@Injectable()
export class WebhookProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookProcessorService.name);
  private subscriber: Subscriber | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jiraSync: JiraSyncService,
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

    this.subscriber.notifications.on(WEBHOOK_CHANNEL, async (payload: unknown) => {
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
    });

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
   * Day-22 stub handler — fetch + log + mark processed. Day-23 wire-up
   * replaces the stub body with actual side-effect logic (defect upsert,
   * WS emit, retry-with-backoff). Marking processed=true ensures the
   * staging table doesn't accumulate during testing.
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
    this.logger.log(
      `WebhookProcessor: would process eventType=${row.eventType} issueKey=${row.jiraIssueKey ?? 'n/a'} id=${id} ` +
        `(Day-23 wire-up adds: defect upsert, WS emit, retry-with-backoff)`,
    );
    // Mark processed so the table doesn't accumulate during testing.
    // Day-23 wire-up will set this AFTER the real handler completes;
    // setting it here keeps the staging table clean during scaffold.
    await this.jiraSync.markWebhookProcessed(id);
  }
}
