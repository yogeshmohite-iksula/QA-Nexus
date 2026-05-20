// Day-23 ADR-020 wire-up — Sprint event handler.
//
// Handles the 4 sprint_* event types from the Atlassian webhook feed:
//   - sprint_created → INSERT jira_sprint + audit
//   - sprint_updated → UPDATE jira_sprint (delta: state, end_date) + audit
//                      + IF state==active log "recompute current-sprint
//                      cache" (M6 cache invalidation hook — no-op today)
//   - sprint_deleted → SOFT-DELETE jira_sprint (deleted_at=NOW) + audit
//   - sprint_closed  → UPDATE jira_sprint state=closed + audit + log
//                      "trigger sprint-summary report aggregation"
//                      (M6 hook — no-op today)
//
// Critical (per ADR-020 ratified §6 + Yogesh's Day-23 brief): Sprint
// events do NOT support JQL filtering at the Atlassian webhook
// subscription level. We subscribe to ALL sprint_* events from the
// connected Atlassian instance and filter by project_id APP-SIDE.
//
// Day-23 simplification: use the first jira_connection's projectId
// (pilot is single-tenant Iksula workspace). M6 multi-tenant adds
// proper sprint→board→project resolution from sprint.originBoardId.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  JiraWebhookSprintCreatedPayload,
  JiraWebhookSprintUpdatedPayload,
  JiraWebhookSprintDeletedPayload,
  JiraWebhookSprintClosedPayload,
  JiraWebhookSprintRef,
} from './jira-webhook.schema';

@Injectable()
export class SprintWebhookHandler {
  private readonly logger = new Logger(SprintWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** sprint_created — INSERT new jira_sprint row. */
  async handleCreated(
    payload: JiraWebhookSprintCreatedPayload,
    eventRowId: string,
  ): Promise<void> {
    const projectId = await this.resolveProjectId(payload.sprint);
    if (!projectId) {
      this.logger.warn(
        `SprintHandler.handleCreated: cannot resolve project_id; ` +
          `eventRowId=${eventRowId} sprintId=${payload.sprint.id} — skip`,
      );
      return;
    }

    await this.prisma.jiraSprint.upsert({
      where: { id: payload.sprint.id },
      create: {
        id: payload.sprint.id,
        projectId,
        name: payload.sprint.name,
        state: payload.sprint.state,
        startDate: parseDate(payload.sprint.startDate),
        endDate: parseDate(payload.sprint.endDate),
        completeDate: parseDate(payload.sprint.completeDate),
        boardId: parseBoardId(payload.sprint.originBoardId),
      },
      update: {
        // Idempotency — webhook retry may arrive after the row exists.
        name: payload.sprint.name,
        state: payload.sprint.state,
        startDate: parseDate(payload.sprint.startDate),
        endDate: parseDate(payload.sprint.endDate),
        completeDate: parseDate(payload.sprint.completeDate),
        boardId: parseBoardId(payload.sprint.originBoardId),
      },
    });

    await this.writeAudit('jira_sprint.created', {
      eventRowId,
      sprintId: payload.sprint.id,
      sprintName: payload.sprint.name,
      state: payload.sprint.state,
      projectId,
    });
  }

  /** sprint_updated — UPDATE delta-tracked fields + log cache-invalidation
   *  hook if sprint transitioned to active. */
  async handleUpdated(
    payload: JiraWebhookSprintUpdatedPayload,
    eventRowId: string,
  ): Promise<void> {
    const existing = await this.prisma.jiraSprint.findUnique({
      where: { id: payload.sprint.id },
      select: { id: true, state: true, endDate: true, projectId: true },
    });

    if (!existing) {
      // Out-of-order delivery (update arrived before create). Treat as create.
      this.logger.log(
        `SprintHandler.handleUpdated: sprint ${payload.sprint.id} ` +
          `not found — treating as create (out-of-order delivery)`,
      );
      await this.handleCreated(
        { ...payload, webhookEvent: 'sprint_created' } as never,
        eventRowId,
      );
      return;
    }

    const newState = payload.sprint.state;
    const newEndDate = parseDate(payload.sprint.endDate);
    const stateChanged = existing.state !== newState;
    const transitionedToActive = stateChanged && newState === 'active';

    await this.prisma.jiraSprint.update({
      where: { id: payload.sprint.id },
      data: {
        name: payload.sprint.name,
        state: newState,
        startDate: parseDate(payload.sprint.startDate),
        endDate: newEndDate,
        completeDate: parseDate(payload.sprint.completeDate),
        boardId: parseBoardId(payload.sprint.originBoardId),
      },
    });

    const changedFields: string[] = [];
    if (stateChanged) changedFields.push('state');
    if (
      (existing.endDate?.toISOString() ?? null) !==
      (newEndDate?.toISOString() ?? null)
    ) {
      changedFields.push('end_date');
    }

    await this.writeAudit('jira_sprint.updated', {
      eventRowId,
      sprintId: payload.sprint.id,
      changedFields,
      newState,
    });

    if (transitionedToActive) {
      // M6 hook — when LISTEN/NOTIFY cache-invalidation channel lands per
      // ADR-021 §3 (qa_nexus.cache.report.invalidate), this is the trigger
      // point. Today: log + audit only.
      this.logger.log(
        `SprintHandler: sprint ${payload.sprint.id} state=active — ` +
          `would recompute current-sprint cache (M6 LISTEN/NOTIFY hook)`,
      );
    }
  }

  /** sprint_deleted — soft-delete (audit chain integrity per Hard Rule 7). */
  async handleDeleted(
    payload: JiraWebhookSprintDeletedPayload,
    eventRowId: string,
  ): Promise<void> {
    const existing = await this.prisma.jiraSprint.findUnique({
      where: { id: payload.sprint.id },
      select: { id: true, projectId: true },
    });
    if (existing) {
      await this.prisma.jiraSprint.update({
        where: { id: payload.sprint.id },
        data: { deletedAt: new Date() },
      });
    }
    await this.writeAudit('jira_sprint.deleted', {
      eventRowId,
      sprintId: payload.sprint.id,
      softDelete: true,
    });
  }

  /** sprint_closed — UPDATE state=closed + log sprint-summary aggregation hook. */
  async handleClosed(
    payload: JiraWebhookSprintClosedPayload,
    eventRowId: string,
  ): Promise<void> {
    const existing = await this.prisma.jiraSprint.findUnique({
      where: { id: payload.sprint.id },
      select: { id: true },
    });

    if (!existing) {
      this.logger.log(
        `SprintHandler.handleClosed: sprint ${payload.sprint.id} ` +
          `not found — treating as create (out-of-order delivery)`,
      );
      await this.handleCreated(
        { ...payload, webhookEvent: 'sprint_created' } as never,
        eventRowId,
      );
      // Then immediately update to closed.
      await this.prisma.jiraSprint.update({
        where: { id: payload.sprint.id },
        data: {
          state: 'closed',
          completeDate: parseDate(payload.sprint.completeDate),
        },
      });
    } else {
      await this.prisma.jiraSprint.update({
        where: { id: payload.sprint.id },
        data: {
          state: 'closed',
          completeDate: parseDate(payload.sprint.completeDate),
          endDate: parseDate(payload.sprint.endDate),
        },
      });
    }

    await this.writeAudit('jira_sprint.closed', {
      eventRowId,
      sprintId: payload.sprint.id,
      completeDate: payload.sprint.completeDate ?? null,
    });

    // M6 hook — sprint-summary report aggregation (ADR-021 tier-1 precompute
    // includes per-sprint stats). Today: log only.
    this.logger.log(
      `SprintHandler: sprint ${payload.sprint.id} closed — would trigger ` +
        `sprint-summary report aggregation (M6 ADR-021 hook)`,
    );
  }

  /** Resolve project_id for a Sprint payload. Day-23 simplification: use
   *  the first jira_connection on the workspace (pilot single-tenant). M6
   *  multi-tenant adds proper sprint.originBoardId → board → project
   *  resolution via the Atlassian Agile API + a `jira_boards` cache table. */
  private async resolveProjectId(
    _sprint: JiraWebhookSprintRef,
  ): Promise<string | null> {
    const conn = await this.prisma.jiraConnection.findFirst({
      select: { projectId: true },
    });
    return conn?.projectId ?? null;
  }

  /** Audit row via cached system workspace pattern (matches IssueHandler). */
  private async writeAudit(
    action: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const ws = await this.prisma.workspace.findFirst({
        select: { id: true },
      });
      if (!ws) return;
      await this.audit.write({
        workspaceId: ws.id,
        actorId: null,
        entityType: 'jira',
        entityId: null,
        action,
        payload,
      });
    } catch (err) {
      this.logger.warn(
        `SprintHandler.writeAudit failed for ${action}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseBoardId(v: string | number | null | undefined): string | null {
  if (v == null) return null;
  return String(v);
}
