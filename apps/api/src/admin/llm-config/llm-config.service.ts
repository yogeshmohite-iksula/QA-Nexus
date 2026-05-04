// QA Nexus PM1 — Admin LLM provider config service.
//
// Spec: Day-8 Step 3 (M1.5 endpoint surface for F26 Admin tab).
// Reads + writes the existing TB-019/020/021 schema:
//   - LlmProvider          (workspace's registered providers + ciphertext API key)
//   - LlmProviderModel     (catalog of models per provider)
//   - AgentModelAssignment (agentKind × role → modelPk)
//
// Today's surface is READ + ROUTING UPDATE. API-key onboarding +
// rotation lives on a separate future endpoint
// (POST /api/admin/config/llm-providers/:id/key) so a single PUT
// can never accidentally clobber a key. ApiKey ciphertext NEVER
// leaves the service in either direction.
//
// Audit discipline (CLAUDE.md Hard Rule 7 + PM1_ERD §3.13):
//   - PUT writes a synchronous `llm_provider_config_changed` audit row
//     with old + new assignment summary BEFORE returning. Chain integrity
//     is binding; a failed audit fails the API call.
//   - Audit payload includes assignment shapes only (agentKind/role/modelPk);
//     never the API key ciphertext, never the provider's API key kind-name
//     in a way that would help fingerprint configuration secrets.

import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  type LlmProviderConfigItem,
  type LlmAssignmentItem,
  type PutLlmProviderConfigRequest,
} from '@qa-nexus/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

@Injectable()
export class LlmConfigService {
  private readonly logger = new Logger(LlmConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Read the workspace's full LLM picture.
   * Joins providers + their models + the routing assignments.
   * Strips API-key ciphertext on the wire.
   */
  async get(ctx: ActorContext): Promise<{
    providers: LlmProviderConfigItem[];
    assignments: LlmAssignmentItem[];
  }> {
    const providers = await this.prisma.llmProvider.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { createdAt: 'asc' },
      include: {
        models: {
          where: { enabledForWorkspace: true },
          orderBy: { displayName: 'asc' },
        },
      },
    });

    const projectedProviders: LlmProviderConfigItem[] = providers.map((p) => ({
      id: p.id,
      providerKind: p.providerKind,
      displayName: p.displayName,
      endpointUrl: p.endpointUrl,
      status: p.status,
      // Derived boolean — never returns the ciphertext itself.
      hasApiKey: !!p.apiKeyEncrypted && p.apiKeyEncrypted.length > 0,
      lastTestAt: p.lastTestAt?.toISOString() ?? null,
      models: p.models.map((m) => ({
        modelPk: m.id,
        modelId: m.modelId,
        displayName: m.displayName,
        enabledForWorkspace: m.enabledForWorkspace,
      })),
    }));

    const assignments = await this.prisma.agentModelAssignment.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: {
        model: {
          include: {
            provider: {
              select: { providerKind: true, displayName: true },
            },
          },
        },
      },
    });

    const projectedAssignments: LlmAssignmentItem[] = assignments.map((a) => ({
      id: a.id,
      agentKind: a.agentKind,
      role: a.role,
      modelPk: a.modelPk,
      providerKind: a.model.provider.providerKind,
      providerDisplayName: a.model.provider.displayName,
      modelId: a.model.modelId,
      modelDisplayName: a.model.displayName,
    }));

    return {
      providers: projectedProviders,
      assignments: projectedAssignments,
    };
  }

  /**
   * Replace the workspace's routing assignments wholesale. Atomic:
   * delete-all + insert-all in a single transaction. Validates:
   *   1. Every (agentKind, role) pair appears at most once in the body.
   *   2. Every modelPk exists in the workspace's provider catalog
   *      (cross-workspace modelPks fail-fast as 422).
   *
   * Audits `llm_provider_config_changed` with old + new shapes.
   * Hard Rule 7: a failed audit fails the API call.
   */
  async update(
    input: PutLlmProviderConfigRequest,
    ctx: ActorContext,
  ): Promise<void> {
    // 1. In-payload uniqueness — refuse two entries for the same
    //    (agentKind, role) pair.
    const seen = new Set<string>();
    for (const a of input.assignments) {
      const key = `${a.agentKind}:${a.role}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          `duplicate assignment for ${key} — each (agentKind, role) must appear at most once`,
        );
      }
      seen.add(key);
    }

    // 2. Validate every modelPk belongs to this workspace's catalog.
    const requestedPks = input.assignments.map((a) => a.modelPk);
    const validRows = await this.prisma.llmProviderModel.findMany({
      where: {
        id: { in: requestedPks },
        provider: { workspaceId: ctx.workspaceId },
      },
      select: { id: true },
    });
    const validSet = new Set(validRows.map((r) => r.id));
    const invalid = requestedPks.filter((pk) => !validSet.has(pk));
    if (invalid.length) {
      throw new BadRequestException(
        `modelPks not in this workspace's catalog: ${invalid.slice(0, 3).join(', ')}` +
          (invalid.length > 3 ? '…' : ''),
      );
    }

    // 3. Capture pre-update state for audit.
    const oldRows = await this.prisma.agentModelAssignment.findMany({
      where: { workspaceId: ctx.workspaceId },
      select: { agentKind: true, role: true, modelPk: true },
    });

    // 4. Atomic replace: delete-all then insert-all in a tx.
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.agentModelAssignment.deleteMany({
          where: { workspaceId: ctx.workspaceId },
        });
        if (input.assignments.length > 0) {
          await tx.agentModelAssignment.createMany({
            data: input.assignments.map((a) => ({
              workspaceId: ctx.workspaceId,
              agentKind: a.agentKind,
              role: a.role,
              modelPk: a.modelPk,
              activationThresholdJson:
                (a.activationThresholdJson as object | undefined) ?? undefined,
              createdBy: ctx.actorId,
            })),
          });
        }
      });
    } catch (err: unknown) {
      // Defensive: shouldn't trigger because we pre-validated, but the
      // unique (workspaceId, agentKind, role) constraint catches anything
      // that slipped through (e.g., race with another Admin's PUT).
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'concurrent assignment update detected — refresh + retry',
        );
      }
      throw err;
    }

    // 5. Audit (synchronous; chain-binding).
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'llm_provider_config',
      // No single entityId for a wholesale-replace; use null to indicate
      // workspace-scoped change. F28 audit UI groups by entityType so this
      // shows up under "LLM provider config".
      entityId: null,
      action: 'llm_provider_config_changed',
      payload: {
        // Compact summary — the FULL replacement set, plus a count delta.
        // We intentionally do NOT include modelPks beyond the count to
        // keep audit rows small (modelPks are UUIDs, 36 chars each; a
        // workspace with ~12 assignments would balloon the row).
        old_assignment_count: oldRows.length,
        new_assignment_count: input.assignments.length,
        // Shape only — agentKind + role list (NOT modelPk values).
        new_routing_shape: input.assignments.map((a) => ({
          agentKind: a.agentKind,
          role: a.role,
        })),
        actor_email: ctx.actorEmail,
      },
    });
  }
}
