// Day-23 ADR-020 wire-up — Issue event handler.
//
// Handles the 3 jira:issue_* event types from the Atlassian webhook feed:
//   - jira:issue_created → INSERT jira_issue + audit (no Sherlock trigger)
//   - jira:issue_updated → UPDATE jira_issue (delta tracked) + audit +
//                          Sherlock trigger IF (status→Done OR severity↑)
//   - jira:issue_deleted → SOFT-DELETE jira_issue (deleted_at=NOW) + audit
//
// Soft-delete per Hard Rule 7 audit chain integrity — never hard delete.
//
// Sherlock trigger rules (jira:issue_updated only):
//   1. Status transition into "Done" — issue closed; orchestrator runs
//      post-mortem RCA so the dashboard surfaces lessons-learned.
//   2. Severity bump (priority moved UP the ladder Lowest→Highest) —
//      escalation deserves automatic RCA before humans triage.
//
// Trigger via SherlockOrchestratorService.runAndPersist (#178 async pattern;
// returns immediately, runs in background, emits rca.complete.{runId} WS).

import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SherlockOrchestratorService } from '../agents/sherlock-orchestrator/sherlock-orchestrator.service';
import { JiraSyncService } from './jira-sync.service';
import type {
  JiraWebhookIssueCreatedPayload,
  JiraWebhookIssueUpdatedPayload,
  JiraWebhookIssueDeletedPayload,
} from './jira-webhook.schema';

/** Atlassian priority ladder (low → high severity). Index 4 = Highest. */
const PRIORITY_LADDER = ['Lowest', 'Low', 'Medium', 'High', 'Highest'] as const;
const DONE_STATUS = 'Done';

@Injectable()
export class IssueWebhookHandler {
  private readonly logger = new Logger(IssueWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly orchestrator: SherlockOrchestratorService,
    private readonly jiraSync: JiraSyncService,
  ) {}

  /** jira:issue_created — INSERT new jira_issue row with denormalized
   *  sprint + priority fields (so the next update can diff against cached). */
  async handleCreated(
    payload: JiraWebhookIssueCreatedPayload,
    eventRowId: string,
  ): Promise<void> {
    const fields = payload.issue.fields ?? {};
    const status = String((fields as Record<string, unknown>).status ?? '');
    const priority = extractPriorityName(fields);
    const sprintRef = extractCurrentSprint(fields);
    const assigneeAccountId = extractAssigneeAccountId(fields);
    const resolution = extractResolution(fields);
    const labels = extractLabels(fields);

    // jira_connections lookup happens elsewhere; for Day-23 wire-up we use
    // the first jira_connection on the workspace. M6 multi-workspace will
    // look up by project key from payload.issue.fields.project.key.
    const conn = await this.prisma.jiraConnection.findFirst({
      select: { id: true, projectId: true },
    });
    if (!conn) {
      this.logger.warn(
        `IssueHandler.handleCreated: no jira_connection seeded; ` +
          `eventRowId=${eventRowId} jiraKey=${payload.issue.key} — skip`,
      );
      return;
    }

    await this.prisma.jiraIssue.upsert({
      where: {
        jiraConnectionId_jiraKey: {
          jiraConnectionId: conn.id,
          jiraKey: payload.issue.key,
        },
      },
      create: {
        jiraConnectionId: conn.id,
        jiraKey: payload.issue.key,
        issueType: String(
          (fields as Record<string, unknown>).issuetype ?? 'Unknown',
        ),
        status,
        lastSyncedAt: new Date(),
        sprintId: sprintRef?.id ?? null,
        sprintName: sprintRef?.name ?? null,
        sprintState: sprintRef?.state ?? null,
        priority,
        assigneeAccountId,
        resolution,
        labels: labels ?? undefined,
      },
      update: {
        // Idempotency — webhook retry may arrive after the row exists.
        status,
        lastSyncedAt: new Date(),
        sprintId: sprintRef?.id ?? null,
        sprintName: sprintRef?.name ?? null,
        sprintState: sprintRef?.state ?? null,
        priority,
        assigneeAccountId,
        resolution,
        labels: labels ?? undefined,
      },
    });

    await this.writeAudit('jira_issue.created', {
      eventRowId,
      jiraKey: payload.issue.key,
      status,
      priority,
      sprintId: sprintRef?.id ?? null,
    });
  }

  /** jira:issue_updated — UPDATE row + compute changedFields[] for audit +
   *  trigger Sherlock if status transitioned to Done OR priority bumped. */
  async handleUpdated(
    payload: JiraWebhookIssueUpdatedPayload,
    eventRowId: string,
  ): Promise<void> {
    const conn = await this.prisma.jiraConnection.findFirst({
      select: {
        id: true,
        projectId: true,
        project: { select: { workspaceId: true } },
      },
    });
    if (!conn) {
      this.logger.warn(
        `IssueHandler.handleUpdated: no jira_connection; eventRowId=${eventRowId}`,
      );
      return;
    }
    const existing = await this.prisma.jiraIssue.findUnique({
      where: {
        jiraConnectionId_jiraKey: {
          jiraConnectionId: conn.id,
          jiraKey: payload.issue.key,
        },
      },
      select: {
        id: true,
        status: true,
        priority: true,
        sprintId: true,
        assigneeAccountId: true,
      },
    });
    const fields = payload.issue.fields ?? {};
    const newStatus = String((fields as Record<string, unknown>).status ?? '');
    const newPriority = extractPriorityName(fields);
    const sprintRef = extractCurrentSprint(fields);
    const newAssignee = extractAssigneeAccountId(fields);

    // Compute Sherlock triggers BEFORE persisting (cached values still old).
    const statusTransitionedToDone =
      existing != null &&
      existing.status !== DONE_STATUS &&
      newStatus === DONE_STATUS;
    const severityBumped =
      existing != null && priorityBumped(existing.priority, newPriority);

    // Compute changedFields[] for audit.
    const changedFields: string[] = [];
    if (existing) {
      if (existing.status !== newStatus) changedFields.push('status');
      if (existing.priority !== newPriority) changedFields.push('priority');
      if ((existing.sprintId ?? null) !== (sprintRef?.id ?? null))
        changedFields.push('sprint');
      if ((existing.assigneeAccountId ?? null) !== (newAssignee ?? null))
        changedFields.push('assignee');
    }

    if (existing) {
      await this.prisma.jiraIssue.update({
        where: { id: existing.id },
        data: {
          status: newStatus,
          lastSyncedAt: new Date(),
          sprintId: sprintRef?.id ?? null,
          sprintName: sprintRef?.name ?? null,
          sprintState: sprintRef?.state ?? null,
          priority: newPriority,
          assigneeAccountId: newAssignee,
          resolution: extractResolution(fields),
          labels: extractLabels(fields) ?? undefined,
        },
      });
    } else {
      // Upsert path for an update arriving before create (rare but possible
      // with out-of-order Atlassian retries).
      await this.handleCreated(
        { ...payload, webhookEvent: 'jira:issue_created' } as never,
        eventRowId,
      );
    }

    await this.writeAudit('jira_issue.updated', {
      eventRowId,
      jiraKey: payload.issue.key,
      changedFields,
      newStatus,
      newPriority,
      sherlockTriggered: statusTransitionedToDone || severityBumped,
    });

    // Sherlock trigger — only the 2 conditions per Yogesh's Day-23 brief.
    if (statusTransitionedToDone || severityBumped) {
      const linkedDefect = await this.findLinkedDefect(
        conn.id,
        payload.issue.key,
      );
      if (linkedDefect) {
        const reason = statusTransitionedToDone
          ? 'status→Done'
          : 'severity-bumped';
        this.logger.log(
          `IssueHandler: triggering Sherlock RCA on ${payload.issue.key} ` +
            `defectId=${linkedDefect} reason=${reason}`,
        );
        // Fire-and-forget — runAndPersist returns immediately and runs async
        // via the (#178) setImmediate pattern.
        const runId = randomUUID();
        this.orchestrator
          .runAndPersist(
            {
              defectId: linkedDefect,
              stackTrace: `Jira webhook sherlock trigger — reason=${reason}`,
              failureMessage: `Issue ${payload.issue.key} ${reason}`,
              component: null,
              recentCommits: [],
            },
            {
              runId,
              workspaceId: conn.project.workspaceId,
              actorId: null,
            },
          )
          .catch((err) => {
            this.logger.error(
              `IssueHandler: sherlock trigger failed for ${payload.issue.key}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          });
      }
    }
  }

  /** jira:issue_deleted — soft-delete only (Hard Rule 7 audit chain). */
  async handleDeleted(
    payload: JiraWebhookIssueDeletedPayload,
    eventRowId: string,
  ): Promise<void> {
    const conn = await this.prisma.jiraConnection.findFirst({
      select: { id: true },
    });
    if (!conn) return;
    const existing = await this.prisma.jiraIssue.findUnique({
      where: {
        jiraConnectionId_jiraKey: {
          jiraConnectionId: conn.id,
          jiraKey: payload.issue.key,
        },
      },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.jiraIssue.update({
        where: { id: existing.id },
        data: { deletedAt: new Date(), lastSyncedAt: new Date() },
      });
    }
    await this.writeAudit('jira_issue.deleted', {
      eventRowId,
      jiraKey: payload.issue.key,
      softDelete: true,
    });
  }

  /** Find the defect (PM1 defect) linked to a Jira issue, for Sherlock RCA. */
  private async findLinkedDefect(
    jiraConnectionId: string,
    jiraKey: string,
  ): Promise<string | null> {
    const issue = await this.prisma.jiraIssue.findUnique({
      where: { jiraConnectionId_jiraKey: { jiraConnectionId, jiraKey } },
      select: { linkedDefectId: true },
    });
    return issue?.linkedDefectId ?? null;
  }

  /** Write audit row via the cached system workspace pattern (M5 single-
   *  workspace; M6 multi-tenant looks up workspaceId via jira_connection.project). */
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
        `IssueHandler.writeAudit failed for ${action}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (extract Atlassian fields with tolerant parsing — webhook payload
// shape varies by Atlassian build; we use unknown + narrow defensively).
// ─────────────────────────────────────────────────────────────────────────────

function extractPriorityName(fields: unknown): string | null {
  if (!fields || typeof fields !== 'object') return null;
  const p = (fields as Record<string, unknown>).priority;
  if (p && typeof p === 'object') {
    const name = (p as Record<string, unknown>).name;
    if (typeof name === 'string') return name;
  }
  if (typeof p === 'string') return p;
  return null;
}

function extractAssigneeAccountId(fields: unknown): string | null {
  if (!fields || typeof fields !== 'object') return null;
  const a = (fields as Record<string, unknown>).assignee;
  if (a && typeof a === 'object') {
    const aid = (a as Record<string, unknown>).accountId;
    if (typeof aid === 'string') return aid;
  }
  return null;
}

function extractResolution(fields: unknown): string | null {
  if (!fields || typeof fields !== 'object') return null;
  const r = (fields as Record<string, unknown>).resolution;
  if (r && typeof r === 'object') {
    const name = (r as Record<string, unknown>).name;
    if (typeof name === 'string') return name;
  }
  return null;
}

function extractLabels(fields: unknown): string[] | null {
  if (!fields || typeof fields !== 'object') return null;
  const l = (fields as Record<string, unknown>).labels;
  if (Array.isArray(l) && l.every((x) => typeof x === 'string')) {
    return l as string[];
  }
  return null;
}

/** Atlassian stores sprints in `fields.customfield_10020` (default tenant
 *  custom-field id; can vary). We pick the CURRENT sprint via priority:
 *  active (most recent start) > closed (most recent start) > NULL. */
function extractCurrentSprint(
  fields: unknown,
): { id: string; name: string; state: 'active' | 'closed' | 'future' } | null {
  if (!fields || typeof fields !== 'object') return null;
  const raw = (fields as Record<string, unknown>).customfield_10020;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const sprints: Array<{
    id: string;
    name: string;
    state: string;
    startDate?: string;
  }> = [];
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue;
    const obj = s as Record<string, unknown>;
    const id = obj.id != null ? String(obj.id) : null;
    const name = typeof obj.name === 'string' ? obj.name : null;
    const state = typeof obj.state === 'string' ? obj.state : null;
    if (id && name && state) {
      sprints.push({
        id,
        name,
        state,
        startDate:
          typeof obj.startDate === 'string' ? obj.startDate : undefined,
      });
    }
  }
  if (sprints.length === 0) return null;
  const active = sprints
    .filter((s) => s.state === 'active')
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
  if (active[0]) return active[0] as ReturnType<typeof extractCurrentSprint>;
  const closed = sprints
    .filter((s) => s.state === 'closed')
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
  if (closed[0]) return closed[0] as ReturnType<typeof extractCurrentSprint>;
  return null;
}

/** Atlassian priority ladder bump detection. Returns true if newPriority is
 *  HIGHER on the ladder than oldPriority. Null values count as "below floor"
 *  so a transition from null→Highest is a bump, null→null is not. */
function priorityBumped(oldP: string | null, newP: string | null): boolean {
  const oldIdx = oldP ? PRIORITY_LADDER.indexOf(oldP as never) : -1;
  const newIdx = newP ? PRIORITY_LADDER.indexOf(newP as never) : -1;
  if (newIdx < 0) return false; // unknown new priority — not a bump
  return newIdx > oldIdx;
}
