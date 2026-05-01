// Unit tests for InvitationsService — M1 Users & Roles preview.
//
// Strategy: stub PrismaService + AuditService — no real DB writes.
// Covers positive + negative paths for create / list / accept / revoke.
// Token plaintext NEVER appears in audit payloads (security guarantee).
//
// Spec: PM1_ERD §3 (TB-002 + TB-004 + TB-005) + M1.

import { Test } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CreateInvitationInput } from '@qa-nexus/shared';
import { InvitationsService } from '../invitations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

/** Helper: parse partial input through the Zod schema so optional/default
 *  fields are filled, matching the type the service expects. */
const inv = (partial: Record<string, unknown>) =>
  CreateInvitationInput.parse(partial);

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'user-1',
  actorEmail: 'akshay.panchal@iksula.com', // Lead inviting
};

const FUTURE = new Date(Date.now() + 60_000);
const PAST = new Date(Date.now() - 60_000);

function makePrisma() {
  return {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userInvitation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    projectMember: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: ReturnType<typeof makePrisma>;
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = makePrisma();
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(InvitationsService);
  });

  describe('create()', () => {
    it('happy path — generates token, persists hash, audits', async () => {
      prisma.userInvitation.findFirst.mockResolvedValueOnce(null); // no dup
      prisma.userInvitation.create.mockResolvedValueOnce({
        id: 'abcdef01-2345-6789-aaaa-bbbbccccdddd',
        invitedEmail: 'new@iksula.com',
        expiresAt: FUTURE,
      });

      const result = await service.create(
        inv({ invitedEmail: 'new@iksula.com', role: 'QAEngineer' }),
        ctx,
      );

      // Plaintext token returned ONCE
      expect(result.token).toMatch(/^[0-9a-f]{64}$/);
      expect(result.shortRef).toMatch(/^[0-9a-f]{8}$/);
      // tokenHash persisted = sha256(token)
      const persistedHash = (
        prisma.userInvitation.create.mock.calls[0][0] as any
      ).data.tokenHash;
      const expectedHash = createHash('sha256')
        .update(result.token)
        .digest('hex');
      expect(persistedHash).toBe(expectedHash);
      // tokenHash is NOT the plaintext
      expect(persistedHash).not.toBe(result.token);
      // Audit fired with action + entityType
      expect(audit.write).toHaveBeenCalledTimes(1);
      const auditArg = audit.write.mock.calls[0][0];
      expect(auditArg.action).toBe('invitation_created');
      expect(auditArg.entityType).toBe('invitation');
      expect(auditArg.payload.invited_email).toBe('new@iksula.com');
      // Critical: plaintext token NEVER in audit payload
      expect(JSON.stringify(auditArg.payload)).not.toContain(result.token);
    });

    it('refuses double-invite for active (pending) invitation', async () => {
      prisma.userInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-old',
        status: 'pending',
      });
      await expect(
        service.create(
          inv({ invitedEmail: 'dup@iksula.com', role: 'QAEngineer' }),
          ctx,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.userInvitation.create).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('rejects projectScopeJson with cross-workspace project IDs', async () => {
      // Only 1 of the 3 requested UUIDs is found in the workspace.
      prisma.project.findMany.mockResolvedValueOnce([
        { id: '11111111-1111-1111-1111-111111111111' },
      ]);
      await expect(
        service.create(
          inv({
            invitedEmail: 'x@iksula.com',
            role: 'QAEngineer',
            projectScopeJson: [
              '11111111-1111-1111-1111-111111111111',
              '22222222-2222-2222-2222-222222222222',
              '33333333-3333-3333-3333-333333333333',
            ],
          }),
          ctx,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(audit.write).not.toHaveBeenCalled();
    });
  });

  describe('list()', () => {
    it('returns workspace-scoped invitations with shortRef + no tokenHash', async () => {
      prisma.userInvitation.findMany.mockResolvedValueOnce([
        {
          id: '12345678-aaaa-bbbb-cccc-dddddddddddd',
          workspaceId: 'ws-1',
          invitedEmail: 'a@iksula.com',
          role: 'QAEngineer',
          projectScopeJson: ['proj-1'],
          invitedBy: 'user-1',
          tokenHash: 'should-not-leak',
          expiresAt: FUTURE,
          status: 'pending',
          acceptedAt: null,
          createdAt: new Date('2026-05-01T10:00:00Z'),
        },
      ]);
      const out = await service.list(ctx);
      expect(out).toHaveLength(1);
      expect(out[0]).not.toHaveProperty('tokenHash');
      expect(out[0].shortRef).toBe('12345678');
      // Was scoped to ctx.workspaceId
      expect(prisma.userInvitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId: 'ws-1' } }),
      );
    });
  });

  describe('accept()', () => {
    const tokenPlain = 'a'.repeat(64);
    const tokenHash = createHash('sha256').update(tokenPlain).digest('hex');

    it('happy path — creates user + membership rows + audits', async () => {
      prisma.userInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-1',
        workspaceId: 'ws-1',
        invitedEmail: 'new@iksula.com',
        role: 'QAEngineer',
        projectScopeJson: ['proj-1', 'proj-2'],
        status: 'pending',
        expiresAt: FUTURE,
      });
      prisma.user.findUnique.mockResolvedValueOnce(null); // no existing user
      // Drive the $transaction callback like an inline tx — pass prisma itself.
      const txStub = {
        user: {
          create: jest.fn().mockResolvedValueOnce({
            id: 'new-user-1',
            workspaceId: 'ws-1',
            email: 'new@iksula.com',
            displayName: 'Newbie',
            role: 'QAEngineer',
            organizationalLabel: null,
            activatedAt: new Date(),
            lastLoginAt: null,
            createdAt: new Date(),
          }),
        },
        projectMember: {
          createMany: jest.fn().mockResolvedValueOnce({ count: 2 }),
        },
        userInvitation: { update: jest.fn().mockResolvedValueOnce({}) },
      };
      prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(txStub));

      const out = await service.accept({
        token: tokenPlain,
        displayName: 'Newbie',
      });

      expect(out.ok).toBe(true);
      expect(out.user.email).toBe('new@iksula.com');
      expect(out.workspaceId).toBe('ws-1');
      // Verify hash-based lookup
      expect(prisma.userInvitation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tokenHash } }),
      );
      // Project-membership rows for each scoped project
      expect(txStub.projectMember.createMany).toHaveBeenCalledWith({
        data: [
          { projectId: 'proj-1', userId: 'new-user-1', roleOverride: null },
          { projectId: 'proj-2', userId: 'new-user-1', roleOverride: null },
        ],
      });
      // Invitation flipped to accepted
      expect(txStub.userInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({ status: 'accepted' }),
        }),
      );
      // Audit fired
      expect(audit.write).toHaveBeenCalledTimes(1);
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('invitation_accepted');
      expect(a.payload.new_user_id).toBe('new-user-1');
    });

    it('unknown token → 404 (no leak that the token format was valid)', async () => {
      prisma.userInvitation.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.accept({ token: tokenPlain, displayName: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('already-accepted token → 410 Gone', async () => {
      prisma.userInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-1',
        status: 'accepted',
        expiresAt: FUTURE,
      });
      await expect(
        service.accept({ token: tokenPlain, displayName: 'X' }),
      ).rejects.toBeInstanceOf(GoneException);
    });

    it('revoked token → 410 Gone', async () => {
      prisma.userInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-1',
        status: 'revoked',
        expiresAt: FUTURE,
      });
      await expect(
        service.accept({ token: tokenPlain, displayName: 'X' }),
      ).rejects.toBeInstanceOf(GoneException);
    });

    it('expired token → 410 + auto-marks status=expired', async () => {
      prisma.userInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-1',
        status: 'pending',
        expiresAt: PAST,
      });
      prisma.userInvitation.update.mockResolvedValueOnce({});
      await expect(
        service.accept({ token: tokenPlain, displayName: 'X' }),
      ).rejects.toBeInstanceOf(GoneException);
      expect(prisma.userInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: { status: 'expired' },
        }),
      );
    });

    it('email already a user → 409 Conflict (parallel-accept race guard)', async () => {
      prisma.userInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-1',
        workspaceId: 'ws-1',
        invitedEmail: 'taken@iksula.com',
        role: 'QAEngineer',
        projectScopeJson: [],
        status: 'pending',
        expiresAt: FUTURE,
      });
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing-user' });
      await expect(
        service.accept({ token: tokenPlain, displayName: 'X' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('revoke()', () => {
    it('happy path — flips status + audits', async () => {
      prisma.userInvitation.findUnique.mockResolvedValueOnce({
        id: 'inv-1',
        workspaceId: 'ws-1',
        invitedEmail: 'r@iksula.com',
        status: 'pending',
      });
      prisma.userInvitation.update.mockResolvedValueOnce({});
      const out = await service.revoke('inv-1', 'wrong person', ctx);
      expect(out).toEqual({
        ok: true,
        invitationId: 'inv-1',
        status: 'revoked',
      });
      expect(prisma.userInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'revoked' } }),
      );
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('invitation_revoked');
      expect(a.payload.reason).toBe('wrong person');
    });

    it('missing → 404', async () => {
      prisma.userInvitation.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.revoke('gone', undefined, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cross-workspace revoke → 404 (never leak existence)', async () => {
      prisma.userInvitation.findUnique.mockResolvedValueOnce({
        id: 'inv-other',
        workspaceId: 'ws-2', // different workspace
        invitedEmail: 'x@iksula.com',
        status: 'pending',
      });
      await expect(
        service.revoke('inv-other', undefined, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('already revoked → 409', async () => {
      prisma.userInvitation.findUnique.mockResolvedValueOnce({
        id: 'inv-1',
        workspaceId: 'ws-1',
        invitedEmail: 'r@iksula.com',
        status: 'revoked',
      });
      await expect(
        service.revoke('inv-1', undefined, ctx),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('already accepted → 409 (must use F27 user-revoke instead)', async () => {
      prisma.userInvitation.findUnique.mockResolvedValueOnce({
        id: 'inv-1',
        workspaceId: 'ws-1',
        invitedEmail: 'r@iksula.com',
        status: 'accepted',
      });
      await expect(
        service.revoke('inv-1', undefined, ctx),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
