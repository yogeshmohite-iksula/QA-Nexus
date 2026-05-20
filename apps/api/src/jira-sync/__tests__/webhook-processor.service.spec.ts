// Day-22 + Day-23 wire-up tests for WebhookProcessorService + persistWebhookEvent.
//
// Day-22 (PR #186): pg-listen subscriber + stub handleNotification
// Day-23 (this PR): handleNotification dispatches by eventType to
// IssueWebhookHandler / SprintWebhookHandler. Unwired events absorbed.
//
// NODE_ENV=test skips the live pg-listen connection — we exercise
// handleNotification directly with mocked Prisma + handlers.

import { Test } from '@nestjs/testing';
import { WebhookProcessorService } from '../webhook-processor.service';
import { JiraSyncService } from '../jira-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { IssueWebhookHandler } from '../issue-webhook.handler';
import { SprintWebhookHandler } from '../sprint-webhook.handler';

jest.mock('../../audit/audit.service', () => ({
  AuditService: class FakeAuditService {
    writeNonBlocking = jest.fn();
    write = jest.fn();
  },
}));

jest.mock('../issue-webhook.handler', () => ({
  IssueWebhookHandler: class FakeIssueHandler {
    handleCreated = jest.fn();
    handleUpdated = jest.fn();
    handleDeleted = jest.fn();
  },
}));

jest.mock('../sprint-webhook.handler', () => ({
  SprintWebhookHandler: class FakeSprintHandler {
    handleCreated = jest.fn();
    handleUpdated = jest.fn();
    handleDeleted = jest.fn();
    handleClosed = jest.fn();
  },
}));

const minimalIssuePayload = (eventType: string, key = 'RET-42') => ({
  webhookEvent: eventType,
  issue: { id: '10001', key },
});

const minimalSprintPayload = (eventType: string, sprintId = '42') => ({
  webhookEvent: eventType,
  sprint: { id: sprintId, name: 'Sprint 42', state: 'active' as const },
});

describe('WebhookProcessorService.handleNotification (Day-23 dispatch)', () => {
  let processor: WebhookProcessorService;
  let issueHandler: jest.Mocked<IssueWebhookHandler>;
  let sprintHandler: jest.Mocked<SprintWebhookHandler>;
  let prismaFindUnique: jest.Mock;
  let prismaUpdate: jest.Mock;
  let jiraSyncMarkProcessed: jest.Mock;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    prismaFindUnique = jest.fn();
    prismaUpdate = jest.fn().mockResolvedValue({});
    jiraSyncMarkProcessed = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      jiraWebhookEvent: { findUnique: prismaFindUnique, update: prismaUpdate },
      workspace: { findFirst: jest.fn().mockResolvedValue({ id: 'ws-1' }) },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        WebhookProcessorService,
        {
          provide: JiraSyncService,
          useValue: { markWebhookProcessed: jiraSyncMarkProcessed },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { writeNonBlocking: jest.fn() } },
        IssueWebhookHandler,
        SprintWebhookHandler,
      ],
    }).compile();
    processor = moduleRef.get(WebhookProcessorService);
    issueHandler = moduleRef.get(
      IssueWebhookHandler,
    ) as jest.Mocked<IssueWebhookHandler>;
    sprintHandler = moduleRef.get(
      SprintWebhookHandler,
    ) as jest.Mocked<SprintWebhookHandler>;
  });

  // ─── Guard-condition tests ──────────────────────────────────────────────
  it('row not found → warn, no handler called, no markProcessed', async () => {
    prismaFindUnique.mockResolvedValueOnce(null);
    await processor.handleNotification('row-missing');
    expect(jiraSyncMarkProcessed).not.toHaveBeenCalled();
    expect(issueHandler.handleCreated).not.toHaveBeenCalled();
  });

  it('already processed → skips (idempotent)', async () => {
    prismaFindUnique.mockResolvedValueOnce({
      id: 'r2',
      eventType: 'jira:issue_created',
      signatureValid: true,
      processed: true,
      payload: minimalIssuePayload('jira:issue_created'),
    });
    await processor.handleNotification('r2');
    expect(issueHandler.handleCreated).not.toHaveBeenCalled();
    expect(jiraSyncMarkProcessed).not.toHaveBeenCalled();
  });

  it('signature invalid → marks processed with reason, no handler called', async () => {
    prismaFindUnique.mockResolvedValueOnce({
      id: 'r3',
      eventType: 'jira:issue_created',
      signatureValid: false,
      processed: false,
      payload: minimalIssuePayload('jira:issue_created'),
    });
    await processor.handleNotification('r3');
    expect(issueHandler.handleCreated).not.toHaveBeenCalled();
    expect(jiraSyncMarkProcessed).toHaveBeenCalledWith(
      'r3',
      'signature_invalid_skipped',
    );
  });

  it('unwired event type → marks processed + skip (no handler dispatch)', async () => {
    prismaFindUnique.mockResolvedValueOnce({
      id: 'r4',
      eventType: 'comment_created',
      signatureValid: true,
      processed: false,
      payload: { webhookEvent: 'comment_created' },
    });
    await processor.handleNotification('r4');
    expect(issueHandler.handleCreated).not.toHaveBeenCalled();
    expect(sprintHandler.handleCreated).not.toHaveBeenCalled();
    expect(jiraSyncMarkProcessed).toHaveBeenCalledWith(
      'r4',
      'unwired_event_type',
    );
  });

  // ─── Issue event dispatch tests ─────────────────────────────────────────
  it.each([
    ['jira:issue_created', 'handleCreated'],
    ['jira:issue_updated', 'handleUpdated'],
    ['jira:issue_deleted', 'handleDeleted'],
  ])(
    'dispatches %s to IssueWebhookHandler.%s',
    async (eventType, methodName) => {
      const payload = minimalIssuePayload(eventType);
      prismaFindUnique.mockResolvedValueOnce({
        id: 'row-issue',
        eventType,
        signatureValid: true,
        processed: false,
        payload,
      });
      await processor.handleNotification('row-issue');
      expect(
        (issueHandler as unknown as Record<string, jest.Mock>)[methodName],
      ).toHaveBeenCalledWith(
        expect.objectContaining({ webhookEvent: eventType }),
        'row-issue',
      );
      expect(jiraSyncMarkProcessed).toHaveBeenCalledWith('row-issue');
    },
  );

  // ─── Sprint event dispatch tests ────────────────────────────────────────
  it.each([
    ['sprint_created', 'handleCreated'],
    ['sprint_updated', 'handleUpdated'],
    ['sprint_deleted', 'handleDeleted'],
    ['sprint_closed', 'handleClosed'],
  ])(
    'dispatches %s to SprintWebhookHandler.%s',
    async (eventType, methodName) => {
      const payload = minimalSprintPayload(eventType);
      prismaFindUnique.mockResolvedValueOnce({
        id: 'row-sprint',
        eventType,
        signatureValid: true,
        processed: false,
        payload,
      });
      await processor.handleNotification('row-sprint');
      expect(
        (sprintHandler as unknown as Record<string, jest.Mock>)[methodName],
      ).toHaveBeenCalledWith(
        expect.objectContaining({ webhookEvent: eventType }),
        'row-sprint',
      );
      expect(jiraSyncMarkProcessed).toHaveBeenCalledWith('row-sprint');
    },
  );

  // ─── Failure path tests ─────────────────────────────────────────────────
  it('handler throw → rethrows + does NOT mark processed (Day-24 retry candidate)', async () => {
    prismaFindUnique.mockResolvedValueOnce({
      id: 'row-fail',
      eventType: 'jira:issue_updated',
      signatureValid: true,
      processed: false,
      payload: minimalIssuePayload('jira:issue_updated'),
    });
    issueHandler.handleUpdated.mockRejectedValueOnce(new Error('DB conn lost'));
    await expect(processor.handleNotification('row-fail')).rejects.toThrow(
      /DB conn lost/,
    );
    expect(jiraSyncMarkProcessed).not.toHaveBeenCalled();
  });

  it('malformed payload → Zod validation error rethrown', async () => {
    prismaFindUnique.mockResolvedValueOnce({
      id: 'row-bad',
      eventType: 'jira:issue_created',
      signatureValid: true,
      processed: false,
      // Missing required `issue` field for jira:issue_created.
      payload: { webhookEvent: 'jira:issue_created' },
    });
    await expect(processor.handleNotification('row-bad')).rejects.toThrow(
      /Zod validation failed/,
    );
    expect(issueHandler.handleCreated).not.toHaveBeenCalled();
    expect(jiraSyncMarkProcessed).not.toHaveBeenCalled();
  });
});
