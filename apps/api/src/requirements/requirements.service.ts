// QA Nexus PM1 — RequirementsService.
//
// Spec: M3 Day-13 TASK 2. Real CRUD implementation replaces the
// 501 stubs from PR #77 (M3-BE-03 skeleton).
//
// Architecture mirrors TestCasesService from TASK 1:
//   - assertProjectWorkspace → 404 on cross-workspace (no leak).
//   - assertReqWorkspace → 404 on cross-workspace requirementId.
//   - List: paginated by `createdAt DESC`. Supports priority/status/
//     source/sprint/q filters.
//   - Detail: includes linkedTestCaseCount derived via Prisma _count.
//   - Create: insert Requirement; Prisma P2002 unique-key collision → 409.
//   - Update: partial patch; only provided fields applied.
//   - Archive: soft delete via status='archived' (RequirementStatus
//     enum already has this value — no reconciliation needed unlike
//     test_cases — see PR #74 reconciliation note).
//
// PII discipline: audit payloads omit description text. Records
// req_key + counts/lengths only.

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  CreateRequirementInput,
  UpdateRequirementInput,
  RequirementListQuery,
  RequirementListItem,
  RequirementDetailItem,
} from '@qa-nexus/shared';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  role: 'Admin' | 'Lead' | 'QAEngineer' | 'Stakeholder';
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class RequirementsService {
  private readonly logger = new Logger(RequirementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Verify project exists + belongs to actor's workspace. */
  private async assertProjectWorkspace(
    projectId: string,
    ctx: ActorContext,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    if (!project || project.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`project ${projectId} not found`);
    }
  }

  /** Resolve a requirement + assert its project is in the actor's
   *  workspace AND the actor's claimed projectId. Throws 404 on
   *  missing OR cross-workspace OR cross-project. */
  private async assertReqWorkspace(
    projectId: string,
    requirementId: string,
    ctx: ActorContext,
  ): Promise<{ key: string }> {
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        projectId: true,
        key: true,
        project: { select: { workspaceId: true } },
      },
    });
    if (
      !req ||
      req.projectId !== projectId ||
      req.project.workspaceId !== ctx.workspaceId
    ) {
      throw new NotFoundException(
        `requirement ${requirementId} not found in this project`,
      );
    }
    return { key: req.key };
  }

  // ─────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────

  async create(
    projectId: string,
    input: CreateRequirementInput,
    ctx: ActorContext,
  ): Promise<RequirementDetailItem> {
    await this.assertProjectWorkspace(projectId, ctx);

    let row;
    try {
      row = await this.prisma.requirement.create({
        data: {
          projectId,
          key: input.key,
          title: input.title,
          description: input.description,
          epicKey: input.epicKey ?? null,
          priority: input.priority,
          sprint: input.sprint ?? null,
          source: input.source,
          sourceRef: input.sourceRef ?? null,
          createdBy: ctx.actorId,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `requirement key '${input.key}' already exists in this project`,
        );
      }
      throw err;
    }

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'requirement',
      entityId: row.id,
      action: 'requirement_created',
      payload: {
        requirement_id: row.id,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        // PII guard: counts/keys/source only, NEVER title or description.
        req_key: row.key,
        priority: row.priority,
        status: row.status,
        source: row.source,
        title_length: input.title.length,
        description_length: input.description.length,
        actor_email: ctx.actorEmail,
      },
    });

    return this.toDetail(row.id);
  }

  // ─────────────────────────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────────────────────────

  async list(
    projectId: string,
    query: RequirementListQuery,
    ctx: ActorContext,
  ): Promise<{
    requirements: RequirementListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    await this.assertProjectWorkspace(projectId, ctx);

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(
      1,
      Math.min(MAX_PAGE_SIZE, query.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const skip = (page - 1) * pageSize;

    const where: Prisma.RequirementWhereInput = { projectId };
    if (query.priority && query.priority.length > 0) {
      where.priority = {
        in: query.priority as Prisma.RequirementWhereInput['priority'] as never,
      };
    }
    if (query.status && query.status.length > 0) {
      where.status = {
        in: query.status as Prisma.RequirementWhereInput['status'] as never,
      };
    }
    if (query.source) {
      where.source = query.source;
    }
    if (query.sprint) {
      where.sprint = query.sprint;
    }
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }

    const [rows, total] = await Promise.all([
      this.prisma.requirement.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: pageSize,
        select: {
          id: true,
          projectId: true,
          key: true,
          title: true,
          priority: true,
          status: true,
          source: true,
          sourceRef: true,
          epicKey: true,
          sprint: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { testCaseLinks: true } },
        },
      }),
      this.prisma.requirement.count({ where }),
    ]);

    const requirements: RequirementListItem[] = rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      key: r.key,
      title: r.title,
      priority: r.priority,
      status: r.status,
      source: r.source,
      sourceRef: r.sourceRef,
      epicKey: r.epicKey,
      sprint: r.sprint,
      linkedTestCaseCount: r._count.testCaseLinks,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { requirements, total, page, pageSize };
  }

  // ─────────────────────────────────────────────────────────────────
  // DETAIL
  // ─────────────────────────────────────────────────────────────────

  async detail(
    projectId: string,
    requirementId: string,
    ctx: ActorContext,
  ): Promise<RequirementDetailItem> {
    await this.assertReqWorkspace(projectId, requirementId, ctx);
    return this.toDetail(requirementId);
  }

  /** Internal: full RequirementDetailItem. Caller must have already
   *  done the workspace check. */
  private async toDetail(
    requirementId: string,
  ): Promise<RequirementDetailItem> {
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { _count: { select: { testCaseLinks: true } } },
    });
    if (!req) {
      throw new NotFoundException(`requirement ${requirementId} not found`);
    }
    return {
      id: req.id,
      projectId: req.projectId,
      key: req.key,
      title: req.title,
      description: req.description,
      priority: req.priority,
      status: req.status,
      source: req.source,
      sourceRef: req.sourceRef,
      epicKey: req.epicKey,
      sprint: req.sprint,
      linkedTestCaseCount: req._count.testCaseLinks,
      createdBy: req.createdBy,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────

  async update(
    projectId: string,
    requirementId: string,
    input: UpdateRequirementInput,
    ctx: ActorContext,
  ): Promise<RequirementDetailItem> {
    const { key } = await this.assertReqWorkspace(
      projectId,
      requirementId,
      ctx,
    );

    const data: Prisma.RequirementUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.epicKey !== undefined) data.epicKey = input.epicKey ?? null;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.status !== undefined) data.status = input.status;
    if (input.sprint !== undefined) data.sprint = input.sprint ?? null;
    if (input.source !== undefined) data.source = input.source;
    if (input.sourceRef !== undefined) data.sourceRef = input.sourceRef ?? null;

    // `key` PATCH is intentionally not supported — keys are immutable
    // identifiers (would orphan TestCaseLink rows + break Jira RET-###
    // round-tripping). FE/UX surfaces the field as read-only.

    const updated = await this.prisma.requirement.update({
      where: { id: requirementId },
      data,
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'requirement',
      entityId: requirementId,
      action: 'requirement_updated',
      payload: {
        requirement_id: requirementId,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        req_key: key,
        // PII guard: list of which fields changed, NOT the values.
        fields_changed: Object.keys(input).filter(
          (k) => (input as Record<string, unknown>)[k] !== undefined,
        ),
        new_status: updated.status,
        new_priority: updated.priority,
        actor_email: ctx.actorEmail,
      },
    });

    return this.toDetail(requirementId);
  }

  // ─────────────────────────────────────────────────────────────────
  // ARCHIVE (soft delete)
  // ─────────────────────────────────────────────────────────────────

  async archive(
    projectId: string,
    requirementId: string,
    ctx: ActorContext,
  ): Promise<{ requirementId: string }> {
    const { key } = await this.assertReqWorkspace(
      projectId,
      requirementId,
      ctx,
    );

    // RequirementStatus enum already has 'archived' as a vocab value
    // — no reconciliation needed.
    await this.prisma.requirement.update({
      where: { id: requirementId },
      data: { status: 'archived' },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'requirement',
      entityId: requirementId,
      action: 'requirement_archived',
      payload: {
        requirement_id: requirementId,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        req_key: key,
        actor_email: ctx.actorEmail,
      },
    });

    return { requirementId };
  }

  /// Defense-in-depth: even though @Roles guard catches Stakeholder
  /// writes upstream, service-layer throws ForbiddenException if
  /// Stakeholder hits a write path via shaped request.
  assertWriteRole(ctx: ActorContext): void {
    if (ctx.role === 'Stakeholder') {
      throw new ForbiddenException(
        'Stakeholder role is read-only on requirements',
      );
    }
  }
}
