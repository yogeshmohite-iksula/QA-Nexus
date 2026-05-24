// QA Nexus PM1 — Day-24 P1 ADR-020 wire-up FINISH — Comment event handler.
//
// Handles the 3 comment_* event types from Atlassian webhook feed:
//   - comment_created → audit `jira_comment.created` (Sherlock Day-25 hook)
//   - comment_updated → audit `jira_comment.updated`
//   - comment_deleted → audit `jira_comment.deleted` (soft pattern — audit
//                       chain preserves the event even though no table)
//
// PM1 has NO jira_comments table — comments are audit-only. Day-25 Sherlock
// cluster detection scans the audit_log for comment.* actions to identify
// repeated-failure clusters per ADR-020 §6.
//
// project_id resolution: same pattern as SprintWebhookHandler — Atlassian
// doesn't include project_id reliably on comment events, so we look up
// the first jira_connection's project (pilot is single-tenant Iksula
// workspace). M6 multi-tenant adds proper resolution via issue.key prefix
// or the (Day-25+) jira_issues lookup.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  JiraWebhookCommentCreatedPayload,
  JiraWebhookCommentUpdatedPayload,
  JiraWebhookCommentDeletedPayload,
} from './jira-webhook.schema';

@Injectable()
export class CommentWebhookHandler {
  private readonly logger = new Logger(CommentWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async handleCreated(
    payload: JiraWebhookCommentCreatedPayload,
    eventRowId: string,
  ): Promise<void> {
    const ctx = await this.resolveProjectContext(payload.issue.key);
    if (!ctx) return;
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: null,
      entityType: 'jira_comment',
      entityId: payload.comment.id,
      action: 'jira_comment.created',
      payload: {
        eventRowId,
        commentId: payload.comment.id,
        issueKey: payload.issue.key,
        issueId: payload.issue.id,
        author: payload.comment.author?.accountId ?? null,
        bodyLength: payload.comment.body?.length ?? 0,
      },
    });
    // Day-25 Sherlock cluster detection hook — TODO when SherlockOrchestrator
    // gains a comment-feed input. Today: audit-only.
    this.logger.debug(
      `comment_created issueKey=${payload.issue.key} commentId=${payload.comment.id}`,
    );
  }

  async handleUpdated(
    payload: JiraWebhookCommentUpdatedPayload,
    eventRowId: string,
  ): Promise<void> {
    const ctx = await this.resolveProjectContext(payload.issue.key);
    if (!ctx) return;
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: null,
      entityType: 'jira_comment',
      entityId: payload.comment.id,
      action: 'jira_comment.updated',
      payload: {
        eventRowId,
        commentId: payload.comment.id,
        issueKey: payload.issue.key,
        updateAuthor: payload.comment.updateAuthor?.accountId ?? null,
        bodyLength: payload.comment.body?.length ?? 0,
      },
    });
  }

  async handleDeleted(
    payload: JiraWebhookCommentDeletedPayload,
    eventRowId: string,
  ): Promise<void> {
    const ctx = await this.resolveProjectContext(payload.issue.key);
    if (!ctx) return;
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: null,
      entityType: 'jira_comment',
      entityId: payload.comment.id,
      action: 'jira_comment.deleted',
      payload: {
        eventRowId,
        commentId: payload.comment.id,
        issueKey: payload.issue.key,
        issueId: payload.issue.id,
      },
    });
  }

  /** Resolve {workspaceId, projectId} from the first active jira_connection.
   *  Per ADR-020 §6 + Day-23 sprint-handler pattern. Returns null + WARN
   *  if no connection exists (drains the row without erroring). */
  private async resolveProjectContext(
    issueKey: string,
  ): Promise<{ workspaceId: string; projectId: string } | null> {
    const conn = await this.prisma.jiraConnection.findFirst({
      where: { status: 'active' },
      select: { projectId: true, project: { select: { workspaceId: true } } },
    });
    if (!conn) {
      this.logger.warn(
        `comment handler: no active jira_connection — issueKey=${issueKey} drained without audit`,
      );
      return null;
    }
    return {
      workspaceId: conn.project.workspaceId,
      projectId: conn.projectId,
    };
  }
}
