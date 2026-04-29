// Unit tests for ProjectsService.
//
// Spec: MS0-T038. Covers:
//   1. create — happy path: writes project + audit row
//   2. create — duplicate (P2002) → ConflictException(409)
//   3. list — returns projects scoped to ctx.workspaceId
//   4. getBySlug — happy path returns row
//   5. getBySlug — missing row → NotFoundException(404)
//   6. jiraOAuthStart — 404 if project missing; 200 + audit on hit
//   7. jiraOAuthCallback — 404 if project missing; audit redacts query values
//
// Strategy: stub PrismaService + AuditService — no real DB writes.

import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../projects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'user-1',
  actorEmail: 'yogesh.mohite@iksula.com',
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: {
    project: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    audit = {
      write: jest.fn().mockResolvedValue({ id: 'a1', thisHash: 'h1' }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(ProjectsService);
  });

  describe('create', () => {
    it('writes project + audit row on happy path', async () => {
      const created = {
        id: 'p-1',
        workspaceId: 'ws-1',
        key: 'NEW',
        name: 'New Project',
        description: null,
        createdBy: 'user-1',
        createdAt: new Date(),
      };
      prisma.project.create.mockResolvedValueOnce(created);

      const result = await service.create(
        { key: 'NEW', name: 'New Project' },
        ctx,
      );

      expect(result).toBe(created);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'ws-1',
          key: 'NEW',
          name: 'New Project',
          description: null,
          createdBy: 'user-1',
        },
      });
      expect(audit.write).toHaveBeenCalledTimes(1);
      const auditArg = audit.write.mock.calls[0][0];
      expect(auditArg.action).toBe('project_created');
      expect(auditArg.entityType).toBe('project');
      expect(auditArg.entityId).toBe('p-1');
      expect(auditArg.payload.project_key).toBe('NEW');
      expect(auditArg.payload.actor_email).toBe('yogesh.mohite@iksula.com');
    });

    it('throws ConflictException on Prisma P2002 unique-violation', async () => {
      prisma.project.create.mockRejectedValueOnce({ code: 'P2002' });
      await expect(
        service.create({ key: 'DUP', name: 'Dup' }, ctx),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(audit.write).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns projects scoped to workspaceId, with member counts', async () => {
      prisma.project.findMany.mockResolvedValueOnce([
        {
          id: 'p1',
          key: 'RET',
          name: 'Iksula Returns',
          description: null,
          createdAt: new Date('2026-04-29T10:00:00Z'),
          _count: { members: 8 },
        },
      ]);
      const list = await service.list(ctx);
      expect(list).toEqual([
        {
          id: 'p1',
          key: 'RET',
          name: 'Iksula Returns',
          description: null,
          createdAt: '2026-04-29T10:00:00.000Z',
          memberCount: 8,
        },
      ]);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
        }),
      );
    });
  });

  describe('getBySlug', () => {
    it('returns project on hit', async () => {
      const project = {
        id: 'p1',
        workspaceId: 'ws-1',
        key: 'RET',
        name: 'Iksula Returns',
        description: null,
        createdBy: 'u',
        createdAt: new Date(),
      };
      prisma.project.findUnique.mockResolvedValueOnce(project);
      const result = await service.getBySlug('RET', ctx);
      expect(result).toBe(project);
    });

    it('throws NotFoundException on miss', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(null);
      await expect(service.getBySlug('GONE', ctx)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('jiraOAuthStart (stub)', () => {
    it('404s if project missing', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(null);
      await expect(service.jiraOAuthStart('GONE', ctx)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns stub URL + audits on hit', async () => {
      prisma.project.findUnique.mockResolvedValueOnce({
        id: 'p1',
        key: 'RET',
        name: 'Iksula Returns',
        description: null,
        workspaceId: 'ws-1',
        createdBy: 'u',
        createdAt: new Date(),
      });
      const result = await service.jiraOAuthStart('RET', ctx);
      expect(result.stub).toBe(true);
      expect(result.authorizeUrl).toContain('STUB=1');
      expect(result.authorizeUrl).toContain('project=RET');
      expect(audit.write).toHaveBeenCalledTimes(1);
      expect(audit.write.mock.calls[0][0].action).toBe('jira_oauth_start_stub');
    });
  });

  describe('jiraOAuthCallback (stub)', () => {
    it('404s if project missing', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.jiraOAuthCallback('GONE', { code: 'x' }, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('audits with redacted KEYS only (not values)', async () => {
      prisma.project.findUnique.mockResolvedValueOnce({
        id: 'p1',
        key: 'RET',
        name: 'Iksula Returns',
        description: null,
        workspaceId: 'ws-1',
        createdBy: 'u',
        createdAt: new Date(),
      });
      await service.jiraOAuthCallback(
        'RET',
        { code: 'sensitive-code', state: 'csrf-token' },
        ctx,
      );
      expect(audit.write).toHaveBeenCalledTimes(1);
      const arg = audit.write.mock.calls[0][0];
      expect(arg.action).toBe('jira_oauth_callback_stub');
      expect(arg.payload.received_keys).toEqual(['code', 'state']);
      // Values must NOT appear in the audit payload
      expect(JSON.stringify(arg.payload)).not.toContain('sensitive-code');
      expect(JSON.stringify(arg.payload)).not.toContain('csrf-token');
    });
  });
});
