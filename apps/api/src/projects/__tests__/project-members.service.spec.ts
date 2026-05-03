// Unit tests for ProjectMembersService — M1 Day-6 PM Block 2.
//
// Strategy: stub PrismaService + AuditService — no real DB writes.
// Pins: cross-workspace 404, last-project-Admin guard (override + inherited),
// audit redaction (email DOMAIN only).

import { Test } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProjectMembersService } from '../project-members.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'admin-1',
  actorEmail: 'yogesh.mohite@iksula.com',
  actorRole: 'Admin',
};

const NOW = new Date('2026-05-02T13:00:00Z');
const PROJ = { id: 'proj-RET', key: 'RET' };

function makePrisma() {
  return {
    project: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    projectMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };
}

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;
  let prisma: ReturnType<typeof makePrisma>;
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = makePrisma();
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectMembersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(ProjectMembersService);
  });

  describe('list()', () => {
    it('happy path — returns shape with workspaceRole + roleOverride', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findMany.mockResolvedValueOnce([
        {
          createdAt: NOW,
          roleOverride: 'Lead',
          user: {
            id: 'u-1',
            email: 'kishor@iksula.com',
            displayName: 'Kishor',
            role: 'QAEngineer',
          },
        },
        {
          createdAt: NOW,
          roleOverride: null,
          user: {
            id: 'u-2',
            email: 'akshay@iksula.com',
            displayName: 'Akshay',
            role: 'Lead',
          },
        },
      ]);
      const out = await service.list('RET', ctx);
      expect(out).toHaveLength(2);
      expect(out[0]).toMatchObject({
        workspaceRole: 'QAEngineer',
        roleOverride: 'Lead',
      });
      expect(out[1]).toMatchObject({
        workspaceRole: 'Lead',
        roleOverride: null,
      });
    });

    it('cross-workspace slug → 404', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(null);
      await expect(service.list('GONE', ctx)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('add()', () => {
    it('happy path — creates member + audits', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-new',
        workspaceId: 'ws-1',
        email: 'new@iksula.com',
        displayName: 'New User',
        role: 'QAEngineer',
      });
      prisma.projectMember.findUnique.mockResolvedValueOnce(null); // not existing
      prisma.projectMember.create.mockResolvedValueOnce({ createdAt: NOW });

      const out = await service.add(
        'RET',
        { userId: 'u-new', roleOverride: 'Lead' as any },
        ctx,
      );
      expect(out.userId).toBe('u-new');
      expect(out.roleOverride).toBe('Lead');
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('project_member_added');
      expect(a.payload.role_override).toBe('Lead');
      expect(a.payload.target_email_domain).toBe('@iksula.com');
      // PII discipline
      expect(JSON.stringify(a.payload)).not.toContain('new@iksula.com'); // local-part absent
    });

    it('user not in workspace → 422', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-x',
        workspaceId: 'ws-OTHER',
        email: 'x@iksula.com',
        displayName: 'X',
        role: 'QAEngineer',
      });
      await expect(
        service.add('RET', { userId: 'u-x' }, ctx),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('user not in workspace (missing) → 422', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.add('RET', { userId: 'gone' }, ctx),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('already a member → 409', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-1',
        workspaceId: 'ws-1',
        email: 'k@iksula.com',
        displayName: 'K',
        role: 'QAEngineer',
      });
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        projectId: PROJ.id,
        userId: 'u-1',
      });
      await expect(
        service.add('RET', { userId: 'u-1' }, ctx),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('cross-workspace project slug → 404', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.add('GONE', { userId: 'u-1' }, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('changeRole()', () => {
    const memberRow = {
      projectId: PROJ.id,
      userId: 'u-1',
      roleOverride: 'Lead',
      createdAt: NOW,
      user: {
        id: 'u-1',
        email: 'kishor@iksula.com',
        displayName: 'Kishor',
        role: 'QAEngineer',
      },
    };

    it('happy path — null override (remove) audits old + new', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findUnique.mockResolvedValueOnce(memberRow);
      // old=Lead, new=null → not Admin demotion path — no count call
      prisma.projectMember.update.mockResolvedValueOnce({});
      const out = await service.changeRole('RET', 'u-1', null, ctx);
      expect(out.roleOverride).toBeNull();
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('project_role_override_changed');
      expect(a.payload.old_role_override).toBe('Lead');
      expect(a.payload.new_role_override).toBeNull();
    });

    it('member missing → 404', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.changeRole('RET', 'u-1', 'Lead' as any, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('demoting last project-Admin (override) → 409', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        ...memberRow,
        roleOverride: 'Admin',
      });
      // No other override-Admins, no inherited Admins
      prisma.projectMember.count.mockResolvedValueOnce(0);
      prisma.projectMember.count.mockResolvedValueOnce(0);
      await expect(
        service.changeRole('RET', 'u-1', 'Lead' as any, ctx),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('demoting Admin override when an inherited Admin exists → allowed', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        ...memberRow,
        roleOverride: 'Admin',
      });
      prisma.projectMember.count.mockResolvedValueOnce(0); // override-admins
      prisma.projectMember.count.mockResolvedValueOnce(1); // inherited-admins
      prisma.projectMember.update.mockResolvedValueOnce({});
      const out = await service.changeRole('RET', 'u-1', 'Lead' as any, ctx);
      expect(out.roleOverride).toBe('Lead');
    });
  });

  describe('remove()', () => {
    const memberRow = {
      projectId: PROJ.id,
      userId: 'u-1',
      roleOverride: null,
      createdAt: NOW,
      user: {
        id: 'u-1',
        email: 'kishor@iksula.com',
        role: 'QAEngineer',
      },
    };

    it('happy path — non-Admin removal succeeds + audits', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findUnique.mockResolvedValueOnce(memberRow);
      prisma.projectMember.delete.mockResolvedValueOnce({});
      const out = await service.remove('RET', 'u-1', ctx);
      expect(out).toEqual({ ok: true, projectId: PROJ.id, userId: 'u-1' });
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('project_member_removed');
      expect(a.payload.was_role_override).toBeNull();
    });

    it('removing last project-Admin (inherited) → 409', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        ...memberRow,
        user: { ...memberRow.user, role: 'Admin' },
      });
      prisma.projectMember.count.mockResolvedValueOnce(0); // no other override-Admins
      prisma.projectMember.count.mockResolvedValueOnce(0); // no other inherited-Admins
      await expect(service.remove('RET', 'u-1', ctx)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.projectMember.delete).not.toHaveBeenCalled();
    });

    it('removing Admin when other Admin exists → allowed', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        ...memberRow,
        user: { ...memberRow.user, role: 'Admin' },
      });
      prisma.projectMember.count.mockResolvedValueOnce(1); // override-admin elsewhere
      prisma.projectMember.delete.mockResolvedValueOnce({});
      const out = await service.remove('RET', 'u-1', ctx);
      expect(out.ok).toBe(true);
    });

    it('member missing → 404', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(PROJ);
      prisma.projectMember.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove('RET', 'u-1', ctx)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('cross-workspace project slug → 404', async () => {
      prisma.project.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove('GONE', 'u-1', ctx)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
