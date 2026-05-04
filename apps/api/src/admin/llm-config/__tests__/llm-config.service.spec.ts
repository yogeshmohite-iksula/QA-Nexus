// Unit tests for LlmConfigService — Day-8 Step 3 (M1.5).
//
// Strategy: stub PrismaService + AuditService — no real DB writes.
// Pins: API-key redaction (NEVER returned), cross-workspace modelPk
// rejection (422), audit captures shape NOT modelPks, atomic replace
// semantics (delete-all + insert-all in tx), happy path.

import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import type { PutLlmProviderConfigRequest } from '@qa-nexus/shared';
import { LlmConfigService } from '../llm-config.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'admin-1',
  actorEmail: 'yogesh.mohite@iksula.com',
};

const NOW = new Date('2026-05-04T10:00:00Z');

function makePrisma() {
  return {
    llmProvider: { findMany: jest.fn() },
    llmProviderModel: { findMany: jest.fn() },
    agentModelAssignment: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('LlmConfigService', () => {
  let service: LlmConfigService;
  let prisma: ReturnType<typeof makePrisma>;
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = makePrisma();
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LlmConfigService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(LlmConfigService);
  });

  // ────────────────────────────────────────────────────────────────────
  // GET
  // ────────────────────────────────────────────────────────────────────
  describe('get()', () => {
    it('happy path — returns providers + assignments, REDACTS apiKeyEncrypted', async () => {
      prisma.llmProvider.findMany.mockResolvedValueOnce([
        {
          id: 'p-groq',
          providerKind: 'groq',
          displayName: 'Groq',
          endpointUrl: 'https://api.groq.com',
          status: 'connected',
          // The ciphertext that MUST NOT leak.
          apiKeyEncrypted: 'CIPHERTEXT_MUST_NOT_LEAK_GqK_SECRET_xyz',
          lastTestAt: NOW,
          models: [
            {
              id: 'm-1',
              modelId: 'openai/gpt-oss-120b',
              displayName: 'GPT-OSS 120B',
              enabledForWorkspace: true,
            },
          ],
        },
      ]);
      prisma.agentModelAssignment.findMany.mockResolvedValueOnce([
        {
          id: 'a-1',
          agentKind: 'A1',
          role: 'primary',
          modelPk: 'm-1',
          model: {
            modelId: 'openai/gpt-oss-120b',
            displayName: 'GPT-OSS 120B',
            provider: { providerKind: 'groq', displayName: 'Groq' },
          },
        },
      ]);

      const out = await service.get(ctx);

      // CRITICAL: ciphertext NEVER appears anywhere in the response.
      const responseStr = JSON.stringify(out);
      expect(responseStr).not.toContain('CIPHERTEXT_MUST_NOT_LEAK');
      expect(responseStr).not.toContain('GqK_SECRET');
      expect(responseStr).not.toContain('apiKeyEncrypted');
      // hasApiKey derived boolean is exposed instead.
      expect(out.providers[0].hasApiKey).toBe(true);

      // Routing assignment carries display joins.
      expect(out.assignments[0]).toMatchObject({
        agentKind: 'A1',
        role: 'primary',
        providerKind: 'groq',
        providerDisplayName: 'Groq',
        modelId: 'openai/gpt-oss-120b',
        modelDisplayName: 'GPT-OSS 120B',
      });
    });

    it('hasApiKey=false when ciphertext is empty', async () => {
      prisma.llmProvider.findMany.mockResolvedValueOnce([
        {
          id: 'p-1',
          providerKind: 'gemini',
          displayName: 'Gemini',
          endpointUrl: 'https://x',
          status: 'unverified',
          apiKeyEncrypted: '',
          lastTestAt: null,
          models: [],
        },
      ]);
      prisma.agentModelAssignment.findMany.mockResolvedValueOnce([]);
      const out = await service.get(ctx);
      expect(out.providers[0].hasApiKey).toBe(false);
    });

    it('queries are workspace-scoped', async () => {
      prisma.llmProvider.findMany.mockResolvedValueOnce([]);
      prisma.agentModelAssignment.findMany.mockResolvedValueOnce([]);
      await service.get(ctx);
      expect(
        (prisma.llmProvider.findMany.mock.calls[0][0] as any).where,
      ).toMatchObject({ workspaceId: 'ws-1' });
      expect(
        (prisma.agentModelAssignment.findMany.mock.calls[0][0] as any).where,
      ).toMatchObject({ workspaceId: 'ws-1' });
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // PUT (update)
  // ────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    const VALID_REQ: PutLlmProviderConfigRequest = {
      assignments: [
        {
          agentKind: 'A1',
          role: 'primary',
          modelPk: '11111111-1111-1111-1111-111111111111',
        },
        {
          agentKind: 'A1',
          role: 'fallback',
          modelPk: '22222222-2222-2222-2222-222222222222',
        },
      ],
    };

    function mockValidModelPks(pks: string[]): void {
      prisma.llmProviderModel.findMany.mockResolvedValueOnce(
        pks.map((id) => ({ id })),
      );
    }

    it('happy path — atomic replace + audit', async () => {
      mockValidModelPks([
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ]);
      prisma.agentModelAssignment.findMany.mockResolvedValueOnce([
        // 3 old assignments — replaced wholesale.
        { agentKind: 'A1', role: 'primary', modelPk: 'old-1' },
        { agentKind: 'A1', role: 'secondary', modelPk: 'old-2' },
        { agentKind: 'A2', role: 'primary', modelPk: 'old-3' },
      ]);
      const txStub = {
        agentModelAssignment: {
          deleteMany: jest.fn().mockResolvedValueOnce({ count: 3 }),
          createMany: jest.fn().mockResolvedValueOnce({ count: 2 }),
        },
      };
      prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(txStub));

      await service.update(VALID_REQ, ctx);

      // Atomic: delete-all then insert-all.
      expect(txStub.agentModelAssignment.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
      });
      expect(txStub.agentModelAssignment.createMany).toHaveBeenCalledWith({
        data: [
          {
            workspaceId: 'ws-1',
            agentKind: 'A1',
            role: 'primary',
            modelPk: '11111111-1111-1111-1111-111111111111',
            activationThresholdJson: undefined,
            createdBy: 'admin-1',
          },
          {
            workspaceId: 'ws-1',
            agentKind: 'A1',
            role: 'fallback',
            modelPk: '22222222-2222-2222-2222-222222222222',
            activationThresholdJson: undefined,
            createdBy: 'admin-1',
          },
        ],
      });
      // Audit fired — chain-binding.
      expect(audit.write).toHaveBeenCalledTimes(1);
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('llm_provider_config_changed');
      expect(a.entityType).toBe('llm_provider_config');
      expect(a.payload.old_assignment_count).toBe(3);
      expect(a.payload.new_assignment_count).toBe(2);
      // Audit shape contains agentKind+role NOT modelPk values (size discipline).
      expect(a.payload.new_routing_shape).toEqual([
        { agentKind: 'A1', role: 'primary' },
        { agentKind: 'A1', role: 'fallback' },
      ]);
      const payloadStr = JSON.stringify(a.payload);
      expect(payloadStr).not.toContain('11111111-1111-1111-1111-111111111111');
      expect(payloadStr).not.toContain('22222222-2222-2222-2222-222222222222');
    });

    it('duplicate (agentKind, role) in body → 400', async () => {
      const dup: PutLlmProviderConfigRequest = {
        assignments: [
          {
            agentKind: 'A1',
            role: 'primary',
            modelPk: '11111111-1111-1111-1111-111111111111',
          },
          {
            agentKind: 'A1',
            role: 'primary', // duplicate
            modelPk: '22222222-2222-2222-2222-222222222222',
          },
        ],
      };
      await expect(service.update(dup, ctx)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.llmProviderModel.findMany).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('cross-workspace modelPk → 400 + no DB write + no audit', async () => {
      // Only 1 of the 2 requested PKs is in this workspace's catalog.
      mockValidModelPks(['11111111-1111-1111-1111-111111111111']);
      await expect(service.update(VALID_REQ, ctx)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('Prisma P2002 race → 409 (concurrent Admin updates)', async () => {
      mockValidModelPks([
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ]);
      prisma.agentModelAssignment.findMany.mockResolvedValueOnce([]);
      prisma.$transaction.mockRejectedValueOnce({ code: 'P2002' });
      await expect(service.update(VALID_REQ, ctx)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('audit payload includes actor_email (no PII redaction needed for the actor side)', async () => {
      mockValidModelPks([
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ]);
      prisma.agentModelAssignment.findMany.mockResolvedValueOnce([]);
      prisma.$transaction.mockResolvedValueOnce(undefined as any);
      await service.update(VALID_REQ, ctx);
      const a = audit.write.mock.calls[0][0];
      expect(a.payload.actor_email).toBe('yogesh.mohite@iksula.com');
    });
  });
});
