// Unit tests for WebhookProcessorService + JiraSyncService.persistWebhookEvent
// — Day-22 P1 (ADR-020 §7 ratified). Stub the pg-listen connect path
// (NODE_ENV=test branch) so we don't need a live Postgres for the unit
// run. handleNotification is exercised directly with mocked Prisma.

import { Test } from '@nestjs/testing';
import { WebhookProcessorService } from '../webhook-processor.service';
import { JiraSyncService } from '../jira-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

jest.mock('../../audit/audit.service', () => ({
  AuditService: class FakeAuditService {
    writeNonBlocking = jest.fn();
    write = jest.fn();
  },
}));

describe('WebhookProcessorService.handleNotification', () => {
  let processor: WebhookProcessorService;
  let prismaFindUnique: jest.Mock;
  let prismaUpdate: jest.Mock;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    prismaFindUnique = jest.fn();
    prismaUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      jiraWebhookEvent: {
        findUnique: prismaFindUnique,
        update: prismaUpdate,
        create: jest.fn(),
      },
      workspace: { findFirst: jest.fn().mockResolvedValue({ id: 'ws-1' }) },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        WebhookProcessorService,
        JiraSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { writeNonBlocking: jest.fn() } },
      ],
    }).compile();
    processor = moduleRef.get(WebhookProcessorService);
  });

  it('happy path — fetches row + logs + marks processed', async () => {
    prismaFindUnique.mockResolvedValueOnce({
      id: 'row-1',
      eventId: 'atl-evt-abc',
      eventType: 'jira:issue_created',
      jiraIssueKey: 'RET-42',
      signatureValid: true,
      processed: false,
    });
    await processor.handleNotification('row-1');
    expect(prismaFindUnique).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      select: expect.any(Object),
    });
    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: expect.objectContaining({ processed: true }),
    });
  });

  it('row not found → logs warn, does NOT call update', async () => {
    prismaFindUnique.mockResolvedValueOnce(null);
    await processor.handleNotification('row-missing');
    expect(prismaUpdate).not.toHaveBeenCalled();
  });

  it('already processed → skips update (idempotent)', async () => {
    prismaFindUnique.mockResolvedValueOnce({
      id: 'row-2',
      eventId: 'atl-evt-xyz',
      eventType: 'jira:issue_updated',
      jiraIssueKey: 'RET-99',
      signatureValid: true,
      processed: true,
    });
    await processor.handleNotification('row-2');
    expect(prismaUpdate).not.toHaveBeenCalled();
  });

  it('onModuleInit skips subscriber boot in NODE_ENV=test', async () => {
    process.env.NODE_ENV = 'test';
    // Calling onModuleInit shouldn't try to open pg-listen connection.
    await expect(processor.onModuleInit()).resolves.toBeUndefined();
  });
});

describe('JiraSyncService.persistWebhookEvent', () => {
  let service: JiraSyncService;
  let prismaCreate: jest.Mock;

  beforeEach(async () => {
    prismaCreate = jest.fn();
    const prisma = {
      jiraWebhookEvent: {
        create: prismaCreate,
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      workspace: { findFirst: jest.fn().mockResolvedValue({ id: 'ws-1' }) },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        JiraSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { writeNonBlocking: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(JiraSyncService);
  });

  const samplePayload = {
    webhookEvent: 'jira:issue_created',
    issue: { id: '10042', key: 'RET-42' },
  };

  it('inserts new row → returns "inserted"', async () => {
    prismaCreate.mockResolvedValueOnce({ id: 'row-1' });
    const result = await service.persistWebhookEvent({
      eventId: 'atl-evt-001',
      payload: samplePayload,
      signatureValid: true,
    });
    expect(result).toBe('inserted');
    expect(prismaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventId: 'atl-evt-001',
        eventType: 'jira:issue_created',
        jiraIssueKey: 'RET-42',
        signatureValid: true,
      }),
    });
  });

  it('duplicate event_id (P2002) → returns "duplicate" (Atlassian retry absorbed)', async () => {
    const p2002 = Object.assign(new Error('UNIQUE constraint'), {
      code: 'P2002',
    });
    prismaCreate.mockRejectedValueOnce(p2002);
    const result = await service.persistWebhookEvent({
      eventId: 'atl-evt-001',
      payload: samplePayload,
      signatureValid: true,
    });
    expect(result).toBe('duplicate');
  });

  it('non-P2002 error → rethrows (transient failure surfaces to caller)', async () => {
    prismaCreate.mockRejectedValueOnce(new Error('connection lost'));
    await expect(
      service.persistWebhookEvent({
        eventId: 'atl-evt-002',
        payload: samplePayload,
        signatureValid: true,
      }),
    ).rejects.toThrow(/connection lost/);
  });
});
