// Unit tests for JiraSyncService — Day-19 P2.
//
// Pattern: NestJS DI useValue mocks for AuditService + PrismaService.
// Mirrors A1Scribe + Sherlock test discipline. Zero real DB hits.

import { Test } from '@nestjs/testing';
import { JiraSyncService } from '../jira-sync.service';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JiraWebhookPayload } from '../jira-webhook.schema';

const TEST_WORKSPACE_ID = '11111111-2222-3333-4444-555555555555';

const VALID_PAYLOAD: JiraWebhookPayload = {
  webhookEvent: 'jira:issue_created',
  timestamp: 1715000000000,
  issue: {
    id: '10001',
    key: 'RET-42',
    self: 'https://iksula.atlassian.net/rest/api/3/issue/10001',
  },
  user: {
    accountId: '63a9658815d69a40aa1855b1',
    displayName: 'YBMohite',
  },
};

describe('JiraSyncService', () => {
  let service: JiraSyncService;
  let auditWriteNonBlocking: jest.Mock;
  let prismaFindFirst: jest.Mock;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    auditWriteNonBlocking = jest.fn();
    prismaFindFirst = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        JiraSyncService,
        {
          provide: AuditService,
          useValue: {
            write: jest.fn(),
            writeNonBlocking: auditWriteNonBlocking,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            workspace: { findFirst: prismaFindFirst },
          },
        },
      ],
    }).compile();
    service = moduleRef.get(JiraSyncService);
    warnSpy = jest
      .spyOn(service['logger'], 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('onModuleInit — workspace caching', () => {
    it('caches workspace ID at boot from prisma.workspace.findFirst', async () => {
      prismaFindFirst.mockResolvedValueOnce({ id: TEST_WORKSPACE_ID });
      await service.onModuleInit();
      expect(prismaFindFirst).toHaveBeenCalledWith({ select: { id: true } });
      // Side-effect verified via subsequent recordWebhookReceived call below.
      service.recordWebhookReceived(VALID_PAYLOAD);
      expect(auditWriteNonBlocking).toHaveBeenCalledTimes(1);
      expect(auditWriteNonBlocking.mock.calls[0][0].workspaceId).toBe(
        TEST_WORKSPACE_ID,
      );
    });

    it('warns + skips audit when no workspace found', async () => {
      prismaFindFirst.mockResolvedValueOnce(null);
      await service.onModuleInit();
      service.recordWebhookReceived(VALID_PAYLOAD);
      expect(auditWriteNonBlocking).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('warns + skips audit when prisma throws', async () => {
      prismaFindFirst.mockRejectedValueOnce(new Error('DB asleep'));
      await service.onModuleInit();
      service.recordWebhookReceived(VALID_PAYLOAD);
      expect(auditWriteNonBlocking).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('recordWebhookReceived — happy path', () => {
    beforeEach(() => {
      service._setCachedWorkspaceIdForTests(TEST_WORKSPACE_ID);
    });

    it('writes audit row with full payload context', () => {
      service.recordWebhookReceived(VALID_PAYLOAD);
      expect(auditWriteNonBlocking).toHaveBeenCalledTimes(1);
      const call = auditWriteNonBlocking.mock.calls[0][0];
      expect(call).toMatchObject({
        workspaceId: TEST_WORKSPACE_ID,
        actorId: null,
        entityType: 'jira',
        entityId: '10001',
        action: 'webhook_received',
      });
      expect(call.payload).toMatchObject({
        webhookEvent: 'jira:issue_created',
        issueKey: 'RET-42',
        issueId: '10001',
        userAccountId: '63a9658815d69a40aa1855b1',
        timestamp: 1715000000000,
      });
    });

    it('handles payload without issue (system event)', () => {
      service.recordWebhookReceived({ webhookEvent: 'jira:user_created' });
      expect(auditWriteNonBlocking).toHaveBeenCalledTimes(1);
      const call = auditWriteNonBlocking.mock.calls[0][0];
      expect(call.entityId).toBeNull();
      expect(call.payload.issueKey).toBeNull();
    });
  });

  describe('recordWebhookSignatureInvalid', () => {
    it('writes failure audit when workspace cached', () => {
      service._setCachedWorkspaceIdForTests(TEST_WORKSPACE_ID);
      service.recordWebhookSignatureInvalid('signature_mismatch');
      expect(auditWriteNonBlocking).toHaveBeenCalledTimes(1);
      const call = auditWriteNonBlocking.mock.calls[0][0];
      expect(call.action).toBe('webhook_signature_invalid');
      expect(call.payload).toEqual({ reason: 'signature_mismatch' });
    });

    it('silently skips when workspace not cached (pre-seed env)', () => {
      service._setCachedWorkspaceIdForTests(null);
      service.recordWebhookSignatureInvalid('missing_header');
      expect(auditWriteNonBlocking).not.toHaveBeenCalled();
      // Don't assert warn here — the service intentionally stays quiet
      // so an attacker can't trivially flood the WARN log.
    });
  });
});
