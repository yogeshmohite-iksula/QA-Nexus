// QA Nexus PM1 — Day-24 P1 ADR-020 wire-up FINISH — Version event handler.
//
// Handles 3 jira:version_* event types from Atlassian webhook feed:
//   - jira:version_created    → audit
//   - jira:version_released   → audit (release-state transition)
//   - jira:version_unreleased → audit (release rollback)
//
// PM1 has NO jira_versions table — versions are audit-only. M6 release
// tracking adds the table + report.release_health kind per ADR-020 §6.
//
// project_id resolution: Atlassian's version event includes `version.projectId`
// (numeric Atlassian project id). We look up the project via that — though
// the pilot's single-tenant fallback (first active jira_connection) suffices
// per the sprint-handler pattern.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  JiraWebhookVersionCreatedPayload,
  JiraWebhookVersionReleasedPayload,
  JiraWebhookVersionUnreleasedPayload,
  JiraWebhookVersionRef,
} from './jira-webhook.schema';

@Injectable()
export class VersionWebhookHandler {
  private readonly logger = new Logger(VersionWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async handleCreated(
    payload: JiraWebhookVersionCreatedPayload,
    eventRowId: string,
  ): Promise<void> {
    await this.recordVersionEvent(
      'jira_version.created',
      payload.version,
      eventRowId,
    );
  }

  async handleReleased(
    payload: JiraWebhookVersionReleasedPayload,
    eventRowId: string,
  ): Promise<void> {
    await this.recordVersionEvent(
      'jira_version.released',
      payload.version,
      eventRowId,
    );
  }

  async handleUnreleased(
    payload: JiraWebhookVersionUnreleasedPayload,
    eventRowId: string,
  ): Promise<void> {
    await this.recordVersionEvent(
      'jira_version.unreleased',
      payload.version,
      eventRowId,
    );
  }

  private async recordVersionEvent(
    action: string,
    version: JiraWebhookVersionRef,
    eventRowId: string,
  ): Promise<void> {
    const ctx = await this.resolveProjectContext();
    if (!ctx) {
      this.logger.warn(
        `version handler: no active jira_connection — drained without audit. action=${action}`,
      );
      return;
    }
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: null,
      entityType: 'jira_version',
      entityId: version.id,
      action,
      payload: {
        eventRowId,
        versionId: version.id,
        versionName: version.name ?? null,
        atlassianProjectId:
          version.projectId !== undefined ? String(version.projectId) : null,
        releaseDate: version.releaseDate ?? null,
        released: version.released ?? null,
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
