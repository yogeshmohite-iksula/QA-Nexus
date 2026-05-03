// Unit tests for UsersService — M1 Day-6 PM Block 1.
//
// Strategy: stub PrismaService + AuditService — no real DB writes.
// Pins: status derivation, last-Admin guards, self-mutation guards,
// cross-workspace 404, audit redaction (no passwordHash leaks, email
// DOMAIN only, no session-token leaks).

import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'admin-1',
  actorEmail: 'yogesh.mohite@iksula.com',
  actorRole: 'Admin',
};

const NOW = new Date('2026-05-02T12:00:00Z');

function makePrisma() {
  return {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userInvitation: { findFirst: jest.fn() },
    authUser: { findUnique: jest.fn() },
    authSession: { deleteMany: jest.fn() },
  };
}

const ACTIVE_ROW = {
  id: 'u-1',
  workspaceId: 'ws-1',
  email: 'kishor.kadam@iksula.com',
  displayName: 'Kishor Kadam',
  role: 'QAEngineer',
  activatedAt: NOW,
  disabledAt: null,
  lastLoginAt: NOW,
  createdAt: NOW,
  roleChangedAt: null,
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = makePrisma();
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('deriveStatus()', () => {
    it('disabled trumps everything', () => {
      expect(
        UsersService.deriveStatus({ activatedAt: NOW, disabledAt: NOW }),
      ).toBe('disabled');
    });
    it('invited when activatedAt + disabledAt both null', () => {
      expect(
        UsersService.deriveStatus({ activatedAt: null, disabledAt: null }),
      ).toBe('invited');
    });
    it('active when activated + not disabled', () => {
      expect(
        UsersService.deriveStatus({ activatedAt: NOW, disabledAt: null }),
      ).toBe('active');
    });
  });

  describe('list()', () => {
    it('happy path — derives status, omits passwordHash, scopes to workspace', async () => {
      prisma.user.findMany.mockResolvedValueOnce([
        ACTIVE_ROW,
        { ...ACTIVE_ROW, id: 'u-2', activatedAt: null, email: 'invited@x.com' },
        { ...ACTIVE_ROW, id: 'u-3', disabledAt: NOW, email: 'disabled@x.com' },
      ]);
      const out = await service.list(ctx, {});
      expect(out.map((u) => u.status)).toEqual([
        'active',
        'invited',
        'disabled',
      ]);
      // No passwordHash anywhere
      expect(JSON.stringify(out)).not.toContain('passwordHash');
      expect(JSON.stringify(out)).not.toContain('password_hash');
      // Workspace scoped
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: 'ws-1' }),
        }),
      );
    });

    it('Admin role filter applied; QAEngineer role filter ignored', async () => {
      prisma.user.findMany.mockResolvedValue([ACTIVE_ROW]);
      await service.list(ctx, { role: 'Lead' });
      expect((prisma.user.findMany.mock.calls[0][0] as any).where.role).toBe(
        'Lead',
      );

      prisma.user.findMany.mockClear();
      await service.list(
        { ...ctx, actorRole: 'QAEngineer' },
        { role: 'Admin' },
      );
      // role filter NOT applied for QAEngineer
      expect(
        (prisma.user.findMany.mock.calls[0][0] as any).where.role,
      ).toBeUndefined();
    });

    it('status filter applied client-side after derivation', async () => {
      prisma.user.findMany.mockResolvedValueOnce([
        ACTIVE_ROW,
        { ...ACTIVE_ROW, id: 'u-2', disabledAt: NOW },
      ]);
      const out = await service.list(ctx, { status: 'disabled' });
      expect(out).toHaveLength(1);
      expect(out[0].status).toBe('disabled');
    });
  });

  describe('getById()', () => {
    it('happy path — joins to last-accepted invitation for invitedByUserId', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(ACTIVE_ROW);
      prisma.userInvitation.findFirst.mockResolvedValueOnce({
        invitedBy: 'admin-1',
      });
      const out = await service.getById('u-1', ctx);
      expect(out.id).toBe('u-1');
      expect(out.status).toBe('active');
      expect(out.invitedByUserId).toBe('admin-1');
    });

    it('cross-workspace → 404 (no leak)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        workspaceId: 'ws-OTHER',
      });
      await expect(service.getById('u-1', ctx)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('missing → 404', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.getById('gone', ctx)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('changeRole()', () => {
    it('cannot change own role → 403', async () => {
      await expect(
        service.changeRole(ctx.actorId, 'Lead' as any, ctx),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('happy path — updates + audits', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'QAEngineer',
      });
      prisma.user.update.mockResolvedValueOnce({});
      // getById refresh after update
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'Lead',
        roleChangedAt: NOW,
      });
      prisma.userInvitation.findFirst.mockResolvedValueOnce(null);

      const out = await service.changeRole('u-1', 'Lead' as any, ctx);
      expect(out.role).toBe('Lead');
      // update happened
      expect((prisma.user.update.mock.calls[0][0] as any).data.role).toBe(
        'Lead',
      );
      expect(
        (prisma.user.update.mock.calls[0][0] as any).data.roleChangedAt,
      ).toBeInstanceOf(Date);
      // audit fired
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('workspace_role_changed');
      expect(a.payload.old_role).toBe('QAEngineer');
      expect(a.payload.new_role).toBe('Lead');
      // PII discipline: email DOMAIN only
      expect(a.payload.target_email_domain).toBe('@iksula.com');
      const payloadStr = JSON.stringify(a.payload);
      expect(payloadStr).not.toContain('kishor.kadam'); // local part absent
      expect(payloadStr).not.toContain('passwordHash');
    });

    it('demoting last Admin → 403', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'Admin',
      });
      prisma.user.count.mockResolvedValueOnce(0); // no other admins
      await expect(
        service.changeRole('u-1', 'Lead' as any, ctx),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('demoting Admin when others exist → allowed', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'Admin',
      });
      prisma.user.count.mockResolvedValueOnce(2); // other admins exist
      prisma.user.update.mockResolvedValueOnce({});
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'Lead',
      });
      prisma.userInvitation.findFirst.mockResolvedValueOnce(null);

      const out = await service.changeRole('u-1', 'Lead' as any, ctx);
      expect(out.role).toBe('Lead');
    });

    it('changing role of invited user → 409', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        activatedAt: null, // invited, not yet accepted
      });
      await expect(
        service.changeRole('u-1', 'Lead' as any, ctx),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('cross-workspace target → 404', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        workspaceId: 'ws-OTHER',
      });
      await expect(
        service.changeRole('u-1', 'Lead' as any, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('changeStatus()', () => {
    it('cannot disable own account → 403', async () => {
      await expect(
        service.changeStatus(ctx.actorId, 'disabled', ctx),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('disabling last Admin → 403', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'Admin',
      });
      prisma.user.count.mockResolvedValueOnce(0);
      await expect(
        service.changeStatus('u-1', 'disabled', ctx),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('happy path disable — purges sessions + audits', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'QAEngineer',
      });
      prisma.authUser.findUnique.mockResolvedValueOnce({ id: 'auth-1' });
      prisma.authSession.deleteMany.mockResolvedValueOnce({ count: 3 });
      prisma.user.update.mockResolvedValueOnce({});
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'QAEngineer',
        disabledAt: NOW,
      });
      prisma.userInvitation.findFirst.mockResolvedValueOnce(null);

      const out = await service.changeStatus('u-1', 'disabled', ctx);
      expect(out.sessionsRevoked).toBe(3);
      expect(out.user.status).toBe('disabled');
      // Sessions deleted
      expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'auth-1' },
      });
      // disabledAt set on update
      expect(
        (prisma.user.update.mock.calls[0][0] as any).data.disabledAt,
      ).toBeInstanceOf(Date);
      // Audit
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('user_status_changed');
      expect(a.payload.previous_status).toBe('active');
      expect(a.payload.new_status).toBe('disabled');
      expect(a.payload.sessions_revoked).toBe(3);
      // No session-token leak (deleteMany only returned a count)
      expect(JSON.stringify(a.payload)).not.toContain(
        'better-auth.session_token',
      );
      expect(JSON.stringify(a.payload)).not.toContain('passwordHash');
    });

    it('disable user with no AuthUser row → sessionsRevoked=0, no error', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'QAEngineer',
      });
      prisma.authUser.findUnique.mockResolvedValueOnce(null); // never magic-linked
      prisma.user.update.mockResolvedValueOnce({});
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        disabledAt: NOW,
      });
      prisma.userInvitation.findFirst.mockResolvedValueOnce(null);

      const out = await service.changeStatus('u-1', 'disabled', ctx);
      expect(out.sessionsRevoked).toBe(0);
      expect(prisma.authSession.deleteMany).not.toHaveBeenCalled();
    });

    it('re-enable (active) — clears disabledAt, does NOT touch sessions', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'QAEngineer',
        disabledAt: NOW, // currently disabled
      });
      prisma.user.update.mockResolvedValueOnce({});
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        role: 'QAEngineer',
        disabledAt: null,
      });
      prisma.userInvitation.findFirst.mockResolvedValueOnce(null);

      const out = await service.changeStatus('u-1', 'active', ctx);
      expect(out.sessionsRevoked).toBe(0);
      expect(out.user.status).toBe('active');
      expect(
        (prisma.user.update.mock.calls[0][0] as any).data.disabledAt,
      ).toBeNull();
      // Sessions NOT touched on re-enable
      expect(prisma.authUser.findUnique).not.toHaveBeenCalled();
      expect(prisma.authSession.deleteMany).not.toHaveBeenCalled();
    });

    it('cross-workspace target → 404', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...ACTIVE_ROW,
        workspaceId: 'ws-OTHER',
      });
      await expect(
        service.changeStatus('u-1', 'disabled', ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
