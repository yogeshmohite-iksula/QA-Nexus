// QA Nexus PM1 — JiraSyncModule.
//
// Day-19 P0 #2 (PR #157): scaffold (501 stub controller).
// Day-19 P2 (this PR):    add JiraSyncService + AuditModule import to
//                          unlock the functional webhook receiver.
// Day-20+:                  Defects-side wire-in (DefectsService.createFromJira)
//                          + connect/sync controller endpoints become functional.

import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JiraSyncController } from './jira-sync.controller';
import { JiraSyncService } from './jira-sync.service';
import { WebhookProcessorService } from './webhook-processor.service';

// Day-22 P1 (ADR-020 §7 ratified): WebhookProcessorService is the
// pg-listen subscriber that drives the async webhook pipeline.
// JiraSyncController INSERTs the staging row → Postgres trigger
// pg_notify('webhook_received', id) → WebhookProcessorService picks up
// → calls the (Day-23) handler → marks processed=true.

@Module({
  imports: [AuditModule],
  controllers: [JiraSyncController],
  providers: [JiraSyncService, WebhookProcessorService],
  exports: [JiraSyncService, WebhookProcessorService],
})
export class JiraSyncModule {}
