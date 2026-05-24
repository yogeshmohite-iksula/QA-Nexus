// QA Nexus PM1 — Day-24 P1 ADR-020 wire-up FINISH — Property event handler.
//
// LOW-priority per Yogesh's Day-24 brief. Issue properties are an Atlassian
// extensibility surface for app-specific metadata — PM1 has no use case.
//
// We accept the events (audit-only) so the staging table drains cleanly and
// forensics can see volume + sources if Atlassian-side apps go rogue and
// flood us with property mutations.
//
// Two event types are handled by the same method (discriminated union on
// webhookEvent literal):
//   - issue_property_set
//   - issue_property_deleted

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { JiraWebhookPropertyPayload } from './jira-webhook.schema';

@Injectable()
export class PropertyWebhookHandler {
  private readonly logger = new Logger(PropertyWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async handle(
    payload: JiraWebhookPropertyPayload,
    eventRowId: string,
  ): Promise<void> {
    const ctx = await this.resolveProjectContext();
    if (!ctx) {
      this.logger.debug(
        `property handler: no active jira_connection — drained. event=${payload.webhookEvent}`,
      );
      return;
    }
    const action =
      payload.webhookEvent === 'issue_property_set'
        ? 'jira_property.set'
        : 'jira_property.deleted';
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: null,
      entityType: 'jira_property',
      entityId: payload.issue?.id ?? null,
      action,
      payload: {
        eventRowId,
        issueKey: payload.issue?.key ?? null,
        propertyKey: payload.propertyKey ?? null,
      },
    });
  }

  private async resolveProjectContext(): Promise<{
    workspaceId: string;
    projectId: string;
  } | null> {
    const conn = await this.prisma.jiraConnection.findFirst({
      where: { status: 'active' },
      select: { projectId: true, project: { select: { workspaceId: true } } },
    });
    if (!conn) return null;
    return {
      workspaceId: conn.project.workspaceId,
      projectId: conn.projectId,
    };
  }
}
