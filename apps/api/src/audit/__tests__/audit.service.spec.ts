// Unit tests for AuditService — the wrapper around writeAuditRow that
// ergonomic methods + workspace resolution + non-blocking write paths.
//
// Spec: PM1_ERD §3.13 + MS0-T027.
//
// Strategy: jest.mock the writeAuditRow helper (covered separately by
// audit-helper.spec.ts) — these tests verify the SERVICE layer's wiring:
//   - write() relays params + returns the id+thisHash from the helper
//   - writeNonBlocking() swallows + logs errors instead of bubbling
//   - resolveActorByEmail() does the user-lookup + workspace-fallback dance
import { Test } from '@nestjs/testing';
import { AuditService } from '../audit.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('../audit-helper', () => ({
  writeAuditRow: jest.fn(),
}));
import { writeAuditRow } from '../audit-helper';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    (writeAuditRow as jest.Mock).mockReset();
    prisma = {
      user: { findUnique: jest.fn() },
      workspace: { findFirstOrThrow: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AuditService);
  });

  describe('write()', () => {
    it('relays params to writeAuditRow and returns {id, thisHash}', async () => {
      (writeAuditRow as jest.Mock).mockResolvedValueOnce({
        id: 'r-1',
        prevHash: 'p',
        thisHash: 't-1',
      });
      const out = await service.write({
        workspaceId: 'ws-1',
        actorId: 'u-1',
        entityType: 'project',
        entityId: 'p-1',
        action: 'project_created',
        payload: { x: 1 },
      });
      expect(writeAuditRow).toHaveBeenCalledTimes(1);
      const args = (writeAuditRow as jest.Mock).mock.calls[0];
      expect(args[0]).toBe(prisma);
      expect(args[1]).toMatchObject({
        workspaceId: 'ws-1',
        actorId: 'u-1',
        action: 'project_created',
      });
      expect(out).toEqual({ id: 'r-1', thisHash: 't-1' });
    });

    it('propagates helper errors (synchronous chain integrity is binding)', async () => {
      (writeAuditRow as jest.Mock).mockRejectedValueOnce(
        new Error('chain broke'),
      );
      await expect(
        service.write({
          workspaceId: 'ws-1',
          actorId: null,
          entityType: 'rbac',
          entityId: null,
          action: 'rbac_denied',
          payload: {},
        }),
      ).rejects.toThrow(/chain broke/);
    });
  });

  describe('writeNonBlocking()', () => {
    it('returns void synchronously (does not await)', () => {
      (writeAuditRow as jest.Mock).mockResolvedValueOnce({
        id: 'r',
        prevHash: 'p',
        thisHash: 't',
      });
      const result = service.writeNonBlocking({
        workspaceId: 'ws-1',
        actorId: null,
        entityType: 'rbac',
        entityId: null,
        action: 'rbac_denied',
        payload: {},
      });
      expect(result).toBeUndefined();
    });

    it('swallows + logs helper errors instead of bubbling (non-blocking contract)', async () => {
      (writeAuditRow as jest.Mock).mockRejectedValueOnce(new Error('db down'));
      // Swap the logger with a spy.
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => {});

      service.writeNonBlocking({
        workspaceId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        actorId: null,
        entityType: 'rbac',
        entityId: null,
        action: 'rbac_denied',
        payload: {},
      });

      // Wait for the promise rejection to propagate to the .catch handler.
      await new Promise((r) => setImmediate(r));

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const msg = warnSpy.mock.calls[0][0] as string;
      expect(msg).toContain('rbac_denied');
      expect(msg).toContain('db down');
      expect(msg).toContain('aaaaaaaa'); // first 8 chars of workspace UUID
    });
  });

  describe('resolveActorByEmail()', () => {
    it('returns workspace + actor when user exists', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-7',
        workspaceId: 'ws-7',
      });
      const out = await service.resolveActorByEmail('yogesh@iksula.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'yogesh@iksula.com' },
        select: { id: true, workspaceId: true },
      });
      expect(out).toEqual({ workspaceId: 'ws-7', actorId: 'u-7' });
      expect(prisma.workspace.findFirstOrThrow).not.toHaveBeenCalled();
    });

    it('falls back to seeded workspace + null actor when email is unknown (pre-signup events)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.workspace.findFirstOrThrow.mockResolvedValueOnce({
        id: 'ws-fallback',
      });
      const out = await service.resolveActorByEmail('stranger@example.com');
      expect(out).toEqual({ workspaceId: 'ws-fallback', actorId: null });
    });
  });
});
