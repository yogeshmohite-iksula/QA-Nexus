// QA Nexus PM1 — JiraSyncModule.
//
// Day-19 P0 #2 (PR #157): scaffold (501 stub controller).
// Day-19 P2 (this PR):    add JiraSyncService + AuditModule import to
//                          unlock the functional webhook receiver.
// Day-20+:                  Defects-side wire-in (DefectsService.createFromJira)
//                          + connect/sync controller endpoints become functional.

import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SherlockOrchestratorModule } from '../agents/sherlock-orchestrator/sherlock-orchestrator.module';
import { JiraSyncController } from './jira-sync.controller';
import { JiraSyncService } from './jira-sync.service';
import { WebhookProcessorService } from './webhook-processor.service';
import { IssueWebhookHandler } from './issue-webhook.handler';
import { SprintWebhookHandler } from './sprint-webhook.handler';
import { CommentWebhookHandler } from './comment-webhook.handler';
import { VersionWebhookHandler } from './version-webhook.handler';
import { PropertyWebhookHandler } from './property-webhook.handler';

// Day-22 P1 (ADR-020 §7 ratified): WebhookProcessorService is the
// pg-listen subscriber that drives the async webhook pipeline.
// JiraSyncController INSERTs the staging row → Postgres trigger
// pg_notify('webhook_received', id) → WebhookProcessorService picks up.
//
// Day-23 P1 ADR-020 wire-up: WebhookProcessor dispatches by eventType to
// IssueWebhookHandler (3 issue events) or SprintWebhookHandler (4 sprint
// events). IssueHandler uses SherlockOrchestratorService for the trigger
// on jira:issue_updated when status→Done or severity bumped.
//
// Day-24 P1 ADR-020 wire-up FINISH: extends with CommentWebhookHandler
// (3 comment events — audit only, Sherlock cluster Day-25), Version
// WebhookHandler (3 jira:version events — audit only, release tracking
// M6), PropertyWebhookHandler (2 issue_property events — no-op + audit
// for forensics). All 14 Atlassian event types now wired.

@Module({
  imports: [AuditModule, SherlockOrchestratorModule],
  controllers: [JiraSyncController],
  providers: [
    JiraSyncService,
    WebhookProcessorService,
    IssueWebhookHandler,
    SprintWebhookHandler,
    CommentWebhookHandler,
    VersionWebhookHandler,
    PropertyWebhookHandler,
  ],
  exports: [JiraSyncService, WebhookProcessorService],
})
export class JiraSyncModule {}
