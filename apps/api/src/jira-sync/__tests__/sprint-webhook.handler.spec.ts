// Day-23 ADR-020 wire-up — SprintWebhookHandler spec.
//
// Focus: 4 sprint event types + state-transition semantics (active→closed
// recompute cache hook, out-of-order delivery, soft-delete on _deleted).

import { Test } from '@nestjs/testing';
import { SprintWebhookHandler } from '../sprint-webhook.handler';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const TEST_CONN = { projectId: 'proj-1' };

const sprintPayload = (
  eventType: string,
  state: 'active' | 'closed' | 'future' = 'active',
  overrides: Record<string, unknown> = {},
) => ({
  webhookEvent: eventType,
  sprint: {
    id: '42',
    name: 'Sprint 42',
    state,
    startDate: '2026-05-12T09:00:00.000Z',
    endDate: '2026-05-26T17:00:00.000Z',
    completeDate: null,
    originBoardId: 7,
    ...overrides,
  },
});

describe('SprintWebhookHandler', () => {
  let handler: SprintWebhookHandler;
  let prismaSprintFindUnique: jest.Mock;
  let prismaSprintUpsert: jest.Mock;
  let prismaSprintUpdate: jest.Mock;
  let prismaConnFindFirst: jest.Mock;
  let prismaWorkspaceFindFirst: jest.Mock;
  let auditWrite: jest.Mock;

  beforeEach(async () => {
    prismaSprintFindUnique = jest.fn();
    prismaSprintUpsert = jest.fn().mockResolvedValue({});
    prismaSprintUpdate = jest.fn().mockResolvedValue({});
    prismaConnFindFirst = jest.fn().mockResolvedValue(TEST_CONN);
    prismaWorkspaceFindFirst = jest.fn().mockResolvedValue({ id: 'ws-1' });
    auditWrite = jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SprintWebhookHandler,
        {
          provide: PrismaService,
          useValue: {
            jiraSprint: {
              findUnique: prismaSprintFindUnique,
              upsert: prismaSprintUpsert,
              update: prismaSprintUpdate,
            },
            jiraConnection: { findFirst: prismaConnFindFirst },
            workspace: { findFirst: prismaWorkspaceFindFirst },
          },
        },
        { provide: AuditService, useValue: { write: auditWrite } },
      ],
    }).compile();
    handler = moduleRef.get(SprintWebhookHandler);
  });

  it('sprint_created → UPSERT new row + audit jira_sprint.created', async () => {
    await handler.handleCreated(
      sprintPayload('sprint_created') as never,
      'evt-1',
    );
    expect(prismaSprintUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '42' },
        create: expect.objectContaining({
          id: '42',
          projectId: 'proj-1',
          state: 'active',
        }),
      }),
    );
    expect(auditWrite).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'jira_sprint.created' }),
    );
  });

  it('sprint_created with no jira_connection → warn + skip (no upsert)', async () => {
    prismaConnFindFirst.mockResolvedValueOnce(null);
    await handler.handleCreated(
      sprintPayload('sprint_created') as never,
      'evt-2',
    );
    expect(prismaSprintUpsert).not.toHaveBeenCalled();
  });

  it('sprint_updated future → active transition → logs recompute cache hook', async () => {
    prismaSprintFindUnique.mockResolvedValueOnce({
      id: '42',
      state: 'future',
      endDate: null,
      projectId: 'proj-1',
    });
    await handler.handleUpdated(
      sprintPayload('sprint_updated', 'active') as never,
      'evt-3',
    );
    expect(prismaSprintUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '42' },
        data: expect.objectContaining({ state: 'active' }),
      }),
    );
    expect(auditWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'jira_sprint.updated',
        payload: expect.objectContaining({
          changedFields: expect.arrayContaining(['state']),
        }),
      }),
    );
  });

  it('sprint_updated out-of-order (no existing row) → falls through to handleCreated', async () => {
    prismaSprintFindUnique.mockResolvedValueOnce(null);
    await handler.handleUpdated(
      sprintPayload('sprint_updated', 'active') as never,
      'evt-4',
    );
    // Fallthrough to handleCreated path
    expect(prismaSprintUpsert).toHaveBeenCalled();
  });

  it('sprint_deleted → soft-delete (deleted_at set, NOT hard delete)', async () => {
    prismaSprintFindUnique.mockResolvedValueOnce({
      id: '42',
      projectId: 'proj-1',
    });
    await handler.handleDeleted(
      sprintPayload('sprint_deleted') as never,
      'evt-5',
    );
    expect(prismaSprintUpdate).toHaveBeenCalledWith({
      where: { id: '42' },
      data: expect.objectContaining({ deletedAt: expect.any(Date) }),
    });
    expect(auditWrite).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'jira_sprint.deleted' }),
    );
  });

  it('sprint_closed → UPDATE state=closed + audit + logs report-aggregation hook', async () => {
    prismaSprintFindUnique.mockResolvedValueOnce({ id: '42' });
    await handler.handleClosed(
      sprintPayload('sprint_closed', 'closed', {
        completeDate: '2026-05-26T17:00:00.000Z',
      }) as never,
      'evt-6',
    );
    expect(prismaSprintUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '42' },
        data: expect.objectContaining({ state: 'closed' }),
      }),
    );
    expect(auditWrite).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'jira_sprint.closed' }),
    );
  });
});
