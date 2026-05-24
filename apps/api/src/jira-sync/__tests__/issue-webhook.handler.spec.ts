// Day-23 ADR-020 wire-up — IssueWebhookHandler spec.
//
// Focus: Sherlock trigger logic on jira:issue_updated. Per ratification:
//   - Trigger IF (prevStatus != Done && newStatus == Done) — close event
//   - Trigger IF (priorityBumped(prev, new)) — severity escalation
//   - Do NOT trigger on jira:issue_created (no prior state)
//   - Do NOT trigger if linkedDefectId is null
//
// Module-boundary jest.mock on sherlock-orchestrator path — pulls
// RealtimeGateway → AuthService → better-auth ESM (Day-21/22 #138/#139/#174
// pattern). Same approach as defects.controller.spec.ts.

jest.mock(
  '../../agents/sherlock-orchestrator/sherlock-orchestrator.service',
  () => ({
    SherlockOrchestratorService: class FakeOrchestrator {
      runRca = jest.fn();
      runAndPersist = jest.fn();
    },
  }),
);

import { Test } from '@nestjs/testing';
import { IssueWebhookHandler } from '../issue-webhook.handler';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SherlockOrchestratorService } from '../../agents/sherlock-orchestrator/sherlock-orchestrator.service';
import { JiraSyncService } from '../jira-sync.service';

const TEST_CONN = {
  id: 'conn-1',
  projectId: 'proj-1',
  project: { workspaceId: 'ws-1' },
};

const baseIssue = (key: string, status: string, priorityName?: string) => ({
  webhookEvent: 'jira:issue_updated' as const,
  issue: {
    id: '10001',
    key,
    fields: {
      issuetype: 'Bug',
      status,
      ...(priorityName ? { priority: { name: priorityName } } : {}),
    },
  },
});

describe('IssueWebhookHandler — Sherlock trigger logic', () => {
  let handler: IssueWebhookHandler;
  let runAndPersist: jest.Mock;
  let prismaJiraIssueFindUnique: jest.Mock;
  let prismaJiraIssueUpdate: jest.Mock;
  let prismaJiraConnectionFindFirst: jest.Mock;
  let prismaWorkspaceFindFirst: jest.Mock;
  let auditWrite: jest.Mock;

  beforeEach(async () => {
    runAndPersist = jest.fn().mockResolvedValue({
      rcaReportId: 'rca-1',
      status: 'completed',
      topHypothesis: 'mock',
      okAgentCount: 4,
      durationMs: 1000,
    });
    prismaJiraIssueFindUnique = jest.fn();
    prismaJiraIssueUpdate = jest.fn().mockResolvedValue({});
    prismaJiraConnectionFindFirst = jest.fn().mockResolvedValue(TEST_CONN);
    prismaWorkspaceFindFirst = jest.fn().mockResolvedValue({ id: 'ws-1' });
    auditWrite = jest.fn().mockResolvedValue({ id: 'a1', thisHash: 'h' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        IssueWebhookHandler,
        { provide: JiraSyncService, useValue: {} },
        {
          provide: PrismaService,
          useValue: {
            jiraIssue: {
              findUnique: prismaJiraIssueFindUnique,
              update: prismaJiraIssueUpdate,
              upsert: jest.fn(),
            },
            jiraConnection: { findFirst: prismaJiraConnectionFindFirst },
            workspace: { findFirst: prismaWorkspaceFindFirst },
          },
        },
        { provide: AuditService, useValue: { write: auditWrite } },
        {
          provide: SherlockOrchestratorService,
          useValue: { runRca: jest.fn(), runAndPersist },
        },
      ],
    }).compile();
    handler = moduleRef.get(IssueWebhookHandler);
  });

  it('status → Done WITH linked defect → triggers Sherlock', async () => {
    prismaJiraIssueFindUnique.mockResolvedValueOnce({
      id: 'issue-1',
      status: 'In Progress',
      priority: 'Medium',
      sprintId: null,
      assigneeAccountId: null,
    });
    // For findLinkedDefect lookup
    prismaJiraIssueFindUnique.mockResolvedValueOnce({
      linkedDefectId: 'defect-1',
    });
    await handler.handleUpdated(baseIssue('RET-1', 'Done', 'Medium'), 'evt-1');
    expect(runAndPersist).toHaveBeenCalledTimes(1);
    expect(runAndPersist).toHaveBeenCalledWith(
      expect.objectContaining({ defectId: 'defect-1' }),
      expect.objectContaining({ workspaceId: 'ws-1' }),
    );
  });

  it('priority bump Medium → Highest WITH linked defect → triggers Sherlock', async () => {
    prismaJiraIssueFindUnique.mockResolvedValueOnce({
      id: 'issue-2',
      status: 'In Progress',
      priority: 'Medium',
      sprintId: null,
      assigneeAccountId: null,
    });
    prismaJiraIssueFindUnique.mockResolvedValueOnce({
      linkedDefectId: 'defect-2',
    });
    await handler.handleUpdated(
      baseIssue('RET-2', 'In Progress', 'Highest'),
      'evt-2',
    );
    expect(runAndPersist).toHaveBeenCalledTimes(1);
  });

  it('routine update (no status/priority change) → does NOT trigger Sherlock', async () => {
    prismaJiraIssueFindUnique.mockResolvedValueOnce({
      id: 'issue-3',
      status: 'In Progress',
      priority: 'Medium',
      sprintId: null,
      assigneeAccountId: null,
    });
    await handler.handleUpdated(
      baseIssue('RET-3', 'In Progress', 'Medium'),
      'evt-3',
    );
    expect(runAndPersist).not.toHaveBeenCalled();
  });

  it('status → Done but NO linked defect → does NOT trigger Sherlock', async () => {
    prismaJiraIssueFindUnique.mockResolvedValueOnce({
      id: 'issue-4',
      status: 'In Progress',
      priority: 'Medium',
      sprintId: null,
      assigneeAccountId: null,
    });
    prismaJiraIssueFindUnique.mockResolvedValueOnce({ linkedDefectId: null });
    await handler.handleUpdated(baseIssue('RET-4', 'Done', 'Medium'), 'evt-4');
    expect(runAndPersist).not.toHaveBeenCalled();
  });

  it('priority DOWNGRADE (Highest → Low) → does NOT trigger Sherlock', async () => {
    prismaJiraIssueFindUnique.mockResolvedValueOnce({
      id: 'issue-5',
      status: 'In Progress',
      priority: 'Highest',
      sprintId: null,
      assigneeAccountId: null,
    });
    await handler.handleUpdated(
      baseIssue('RET-5', 'In Progress', 'Low'),
      'evt-5',
    );
    expect(runAndPersist).not.toHaveBeenCalled();
  });

  it('handleCreated never triggers Sherlock (no prior state)', async () => {
    await handler.handleCreated(
      {
        webhookEvent: 'jira:issue_created',
        issue: {
          id: '11',
          key: 'RET-11',
          fields: {
            issuetype: 'Bug',
            status: 'To Do',
            priority: { name: 'Highest' },
          },
        },
      } as never,
      'evt-create',
    );
    expect(runAndPersist).not.toHaveBeenCalled();
  });

  it('handleDeleted → soft-delete (deleted_at set, NOT hard delete)', async () => {
    prismaJiraIssueFindUnique.mockResolvedValueOnce({ id: 'issue-del' });
    await handler.handleDeleted(
      {
        webhookEvent: 'jira:issue_deleted',
        issue: { id: '99', key: 'RET-99' },
      } as never,
      'evt-del',
    );
    expect(prismaJiraIssueUpdate).toHaveBeenCalledWith({
      where: { id: 'issue-del' },
      data: expect.objectContaining({ deletedAt: expect.any(Date) }),
    });
    expect(auditWrite).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'jira_issue.deleted' }),
    );
  });
});
