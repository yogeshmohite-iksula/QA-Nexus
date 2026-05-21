// Day-24 P1 ADR-020 wire-up FINISH — Comment / Version / Property handler specs.
//
// All 3 handlers follow the same pattern: resolve project context via first
// active jira_connection → audit.write the event → log if no connection.

import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CommentWebhookHandler } from '../comment-webhook.handler';
import { VersionWebhookHandler } from '../version-webhook.handler';
import { PropertyWebhookHandler } from '../property-webhook.handler';

const CONN = {
  projectId: 'proj-1',
  project: { workspaceId: 'ws-1' },
};
const NO_CONN = null;

describe('CommentWebhookHandler', () => {
  let handler: CommentWebhookHandler;
  let prisma: { jiraConnection: { findFirst: jest.Mock } };
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = {
      jiraConnection: { findFirst: jest.fn().mockResolvedValue(CONN) },
    };
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    const m = await Test.createTestingModule({
      providers: [
        CommentWebhookHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    handler = m.get(CommentWebhookHandler);
  });

  it('comment_created → audits jira_comment.created with author + bodyLength', async () => {
    await handler.handleCreated(
      {
        webhookEvent: 'comment_created',
        issue: { id: '10001', key: 'RET-42' },
        comment: {
          id: '99',
          body: 'short comment',
          author: { accountId: 'u-1', displayName: 'A' },
        },
      } as never,
      'evt-1',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        action: 'jira_comment.created',
        entityType: 'jira_comment',
        entityId: '99',
        payload: expect.objectContaining({
          author: 'u-1',
          bodyLength: 13,
          issueKey: 'RET-42',
        }),
      }),
    );
  });

  it('comment_updated → audits jira_comment.updated with updateAuthor', async () => {
    await handler.handleUpdated(
      {
        webhookEvent: 'comment_updated',
        issue: { id: '10001', key: 'RET-42' },
        comment: {
          id: '99',
          body: 'updated body',
          updateAuthor: { accountId: 'u-2' },
        },
      } as never,
      'evt-2',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'jira_comment.updated',
        payload: expect.objectContaining({ updateAuthor: 'u-2' }),
      }),
    );
  });

  it('comment_deleted → audits jira_comment.deleted', async () => {
    await handler.handleDeleted(
      {
        webhookEvent: 'comment_deleted',
        issue: { id: '10001', key: 'RET-42' },
        comment: { id: '99' },
      } as never,
      'evt-3',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'jira_comment.deleted' }),
    );
  });

  it('no active jira_connection → drains event without audit', async () => {
    prisma.jiraConnection.findFirst.mockResolvedValue(NO_CONN);
    await handler.handleCreated(
      {
        webhookEvent: 'comment_created',
        issue: { id: '10001', key: 'RET-42' },
        comment: { id: '99' },
      } as never,
      'evt-4',
    );
    expect(audit.write).not.toHaveBeenCalled();
  });
});

describe('VersionWebhookHandler', () => {
  let handler: VersionWebhookHandler;
  let prisma: { jiraConnection: { findFirst: jest.Mock } };
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = {
      jiraConnection: { findFirst: jest.fn().mockResolvedValue(CONN) },
    };
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    const m = await Test.createTestingModule({
      providers: [
        VersionWebhookHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    handler = m.get(VersionWebhookHandler);
  });

  it('jira:version_created → audits jira_version.created', async () => {
    await handler.handleCreated(
      {
        webhookEvent: 'jira:version_created',
        version: {
          id: '7',
          name: 'R-2026-04-PaymentV2',
          projectId: '10000',
          released: false,
        },
      } as never,
      'evt-v1',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'jira_version.created',
        entityId: '7',
        payload: expect.objectContaining({
          versionName: 'R-2026-04-PaymentV2',
          atlassianProjectId: '10000',
          released: false,
        }),
      }),
    );
  });

  it('jira:version_released → audits jira_version.released', async () => {
    await handler.handleReleased(
      {
        webhookEvent: 'jira:version_released',
        version: {
          id: '7',
          name: 'R-2026-04-PaymentV2',
          released: true,
          releaseDate: '2026-04-30',
        },
      } as never,
      'evt-v2',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'jira_version.released',
        payload: expect.objectContaining({
          released: true,
          releaseDate: '2026-04-30',
        }),
      }),
    );
  });

  it('jira:version_unreleased → audits jira_version.unreleased', async () => {
    await handler.handleUnreleased(
      {
        webhookEvent: 'jira:version_unreleased',
        version: { id: '7', released: false },
      } as never,
      'evt-v3',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'jira_version.unreleased' }),
    );
  });

  it('no connection → drains without audit + does not crash', async () => {
    prisma.jiraConnection.findFirst.mockResolvedValue(NO_CONN);
    await expect(
      handler.handleReleased(
        {
          webhookEvent: 'jira:version_released',
          version: { id: '7' },
        } as never,
        'evt-v4',
      ),
    ).resolves.toBeUndefined();
    expect(audit.write).not.toHaveBeenCalled();
  });
});

describe('PropertyWebhookHandler', () => {
  let handler: PropertyWebhookHandler;
  let prisma: { jiraConnection: { findFirst: jest.Mock } };
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = {
      jiraConnection: { findFirst: jest.fn().mockResolvedValue(CONN) },
    };
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    const m = await Test.createTestingModule({
      providers: [
        PropertyWebhookHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    handler = m.get(PropertyWebhookHandler);
  });

  it('issue_property_set → audits jira_property.set', async () => {
    await handler.handle(
      {
        webhookEvent: 'issue_property_set',
        issue: { id: '10001', key: 'RET-42' },
        propertyKey: 'app.iksula.priority-tag',
      } as never,
      'evt-p1',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'jira_property.set',
        entityType: 'jira_property',
        payload: expect.objectContaining({
          issueKey: 'RET-42',
          propertyKey: 'app.iksula.priority-tag',
        }),
      }),
    );
  });

  it('issue_property_deleted → audits jira_property.deleted', async () => {
    await handler.handle(
      {
        webhookEvent: 'issue_property_deleted',
        issue: { id: '10001', key: 'RET-42' },
        propertyKey: 'app.iksula.priority-tag',
      } as never,
      'evt-p2',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'jira_property.deleted' }),
    );
  });

  it('no issue ref → still audits with entityId=null', async () => {
    await handler.handle(
      { webhookEvent: 'issue_property_set' } as never,
      'evt-p3',
    );
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: null }),
    );
  });

  it('no connection → drains without audit', async () => {
    prisma.jiraConnection.findFirst.mockResolvedValue(NO_CONN);
    await handler.handle(
      { webhookEvent: 'issue_property_set' } as never,
      'evt-p4',
    );
    expect(audit.write).not.toHaveBeenCalled();
  });
});
