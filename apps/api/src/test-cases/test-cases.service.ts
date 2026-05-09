// QA Nexus PM1 — TestCasesService.
//
// Spec: M3 Day-13 TASK 1. Real CRUD implementation replaces the
// 501 stubs from PR #75 (M3-BE-02 skeleton).
//
// Architecture:
//   - assertProjectWorkspace → 404 on cross-workspace (no leak,
//     mirrors KbDocumentsService pattern from M2 Day-11 PR #60).
//   - List: paginated by `pinned DESC, createdAt DESC` (TestCase
//     has no `pinned` column — order by createdAt only). Supports
//     `?priority=P0,P1` / `?status=ai_draft,ready` / `?format=gherkin`
//     / `?hasLinks=true` / `?q=login` filters.
//   - Detail: includes linked requirements + suite memberships.
//   - Create: insert TestCase + optional TestCaseLink rows in a
//     single Prisma transaction. Returns the full detail shape
//     (with empty links if no linkedRequirementIds provided).
//   - Update: patch TestCase fields + delta-apply linkedRequirementIds
//     (insert missing, delete removed) inside a single transaction.
//   - Delete: SOFT delete via `status='archived'`. Run results +
//     defect references stay valid because the row persists.
//
// PII discipline: audit payloads NEVER carry title/preconditions/
// expectedResult/stepsJson/gherkin/rationale text — those can leak
// business intent (e.g., "Verify Customer XYZ refund flow"). Audit
// records case_key + counts/lengths only.

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, type TestCase as PrismaTestCase } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  CreateTestCaseInput,
  UpdateTestCaseInput,
  TestCaseListQuery,
  TestCaseDetailItem,
  TestCaseListItem,
} from '@qa-nexus/shared';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  /// User's effective role — controllers parse this off the
  /// resolved session and pass it through. Service-level checks
  /// reference it for fine-grained denials beyond the @Roles guard.
  role: 'Admin' | 'Lead' | 'QAEngineer' | 'Stakeholder';
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class TestCasesService {
  private readonly logger = new Logger(TestCasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Verify project exists + belongs to actor's workspace. Throws
   *  404 on missing OR cross-workspace (no existence leak). */
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

  /** Resolve a test case + assert its project is in the actor's
   *  workspace. Used by detail/update/delete code paths where the
   *  controller has only `caseId` and no `projectId`. */
  private async assertCaseWorkspace(
    caseId: string,
    ctx: ActorContext,
  ): Promise<{ projectId: string; key: string }> {
    const tc = await this.prisma.testCase.findUnique({
      where: { id: caseId },
      select: {
        projectId: true,
        key: true,
        project: { select: { workspaceId: true } },
      },
    });
    if (!tc || tc.project.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`test case ${caseId} not found`);
    }
    return { projectId: tc.projectId, key: tc.key };
  }

  // ─────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────

  async create(
    projectId: string,
    input: CreateTestCaseInput,
    ctx: ActorContext,
  ): Promise<TestCaseDetailItem> {
    await this.assertProjectWorkspace(projectId, ctx);

    // If caller provides linkedRequirementIds, all must belong to
    // the same project (cross-project link = 400, not 404, so the
    // FE can show a precise error).
    if (input.linkedRequirementIds.length > 0) {
      const reqCount = await this.prisma.requirement.count({
        where: {
          id: { in: input.linkedRequirementIds },
          projectId,
        },
      });
      if (reqCount !== input.linkedRequirementIds.length) {
        throw new NotFoundException(
          'one or more linked requirements not found in this project',
        );
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      let row: PrismaTestCase;
      try {
        row = await tx.testCase.create({
          data: {
            projectId,
            key: input.key,
            title: input.title,
            preconditions: input.preconditions,
            stepsJson: input.stepsJson as Prisma.InputJsonValue,
            expectedResult: input.expectedResult,
            priority: input.priority,
            status: input.status,
            format: input.format,
            gherkin: input.gherkin,
            generatedByAgent: input.generatedByAgent,
            sourceChunkIds:
              input.sourceChunkIds === null
                ? Prisma.JsonNull
                : (input.sourceChunkIds as Prisma.InputJsonValue),
            rationale: input.rationale,
            createdBy: ctx.actorId,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new ConflictException(
            `test case key '${input.key}' already exists in this project`,
          );
        }
        throw err;
      }

      if (input.linkedRequirementIds.length > 0) {
        await tx.testCaseLink.createMany({
          data: input.linkedRequirementIds.map((reqId) => ({
            testCaseId: row.id,
            requirementId: reqId,
          })),
          skipDuplicates: true,
        });
      }

      return row;
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'test_case',
      entityId: created.id,
      action: 'test_case_created',
      payload: {
        test_case_id: created.id,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        // PII guard: counts/keys only, NEVER title / steps / gherkin.
        case_key: created.key,
        priority: created.priority,
        status: created.status,
        format: created.format,
        title_length: input.title.length,
        steps_count: input.stepsJson.length,
        linked_requirement_count: input.linkedRequirementIds.length,
        generated_by_agent: created.generatedByAgent,
        actor_email: ctx.actorEmail,
      },
    });

    return this.toDetail(created.id, ctx);
  }

  // ─────────────────────────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────────────────────────

  async list(
    projectId: string,
    query: TestCaseListQuery,
    ctx: ActorContext,
  ): Promise<{
    testCases: TestCaseListItem[];
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

    // Build dynamic where clause from filters.
    const where: Prisma.TestCaseWhereInput = { projectId };
    if (query.priority && query.priority.length > 0) {
      where.priority = {
        in: query.priority as Prisma.TestCaseWhereInput['priority'] as never,
      };
    }
    if (query.status && query.status.length > 0) {
      where.status = {
        in: query.status as Prisma.TestCaseWhereInput['status'] as never,
      };
    }
    if (query.format) {
      where.format = query.format;
    }
    if (typeof query.hasLinks === 'boolean') {
      where.requirementLinks = query.hasLinks ? { some: {} } : { none: {} };
    }
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }

    const [rows, total] = await Promise.all([
      this.prisma.testCase.findMany({
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
          format: true,
          generatedByAgent: true,
          confidenceScore: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { requirementLinks: true } },
        },
      }),
      this.prisma.testCase.count({ where }),
    ]);

    const testCases: TestCaseListItem[] = rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      key: r.key,
      title: r.title,
      priority: r.priority,
      status: r.status,
      format: r.format as 'step' | 'gherkin',
      generatedByAgent: (r.generatedByAgent ?? null) as
        | 'composer'
        | 'curator'
        | null,
      confidenceScore: r.confidenceScore,
      linkCount: r._count.requirementLinks,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { testCases, total, page, pageSize };
  }

  // ─────────────────────────────────────────────────────────────────
  // DETAIL
  // ─────────────────────────────────────────────────────────────────

  async detail(caseId: string, ctx: ActorContext): Promise<TestCaseDetailItem> {
    await this.assertCaseWorkspace(caseId, ctx);
    return this.toDetail(caseId, ctx);
  }

  /** Internal: build a full TestCaseDetailItem (used by create/
   *  update/detail). Caller must have already done the workspace
   *  check. */
  private async toDetail(
    caseId: string,
    _ctx: ActorContext,
  ): Promise<TestCaseDetailItem> {
    const tc = await this.prisma.testCase.findUnique({
      where: { id: caseId },
      include: {
        requirementLinks: {
          select: {
            requirement: {
              select: {
                id: true,
                key: true,
                title: true,
                priority: true,
                status: true,
              },
            },
          },
        },
        suiteMembers: {
          select: {
            suite: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!tc) {
      throw new NotFoundException(`test case ${caseId} not found`);
    }

    return {
      id: tc.id,
      projectId: tc.projectId,
      key: tc.key,
      title: tc.title,
      priority: tc.priority,
      status: tc.status,
      format: tc.format as 'step' | 'gherkin',
      generatedByAgent: (tc.generatedByAgent ?? null) as
        | 'composer'
        | 'curator'
        | null,
      confidenceScore: tc.confidenceScore,
      linkCount: tc.requirementLinks.length,
      preconditions: tc.preconditions,
      stepsJson: (tc.stepsJson ?? []) as TestCaseDetailItem['stepsJson'],
      expectedResult: tc.expectedResult,
      gherkin: tc.gherkin,
      sourceChunkIds: (tc.sourceChunkIds ?? null) as string[] | null,
      rationale: tc.rationale,
      aiProvenanceJson: (tc.aiProvenanceJson ?? null) as Record<
        string,
        unknown
      > | null,
      links: tc.requirementLinks.map((l) => ({
        requirementId: l.requirement.id,
        key: l.requirement.key,
        title: l.requirement.title,
        priority: l.requirement.priority,
        status: l.requirement.status,
      })),
      suiteMemberships: tc.suiteMembers.map((m) => ({
        suiteId: m.suite.id,
        name: m.suite.name,
      })),
      createdBy: tc.createdBy,
      createdAt: tc.createdAt.toISOString(),
      updatedAt: tc.updatedAt.toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────

  async update(
    caseId: string,
    input: UpdateTestCaseInput,
    ctx: ActorContext,
  ): Promise<TestCaseDetailItem> {
    const { projectId, key } = await this.assertCaseWorkspace(caseId, ctx);

    if (input.linkedRequirementIds && input.linkedRequirementIds.length > 0) {
      const reqCount = await this.prisma.requirement.count({
        where: {
          id: { in: input.linkedRequirementIds },
          projectId,
        },
      });
      if (reqCount !== input.linkedRequirementIds.length) {
        throw new NotFoundException(
          'one or more linked requirements not found in this project',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.TestCaseUpdateInput = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.preconditions !== undefined)
        data.preconditions = input.preconditions;
      if (input.stepsJson !== undefined)
        data.stepsJson = input.stepsJson as Prisma.InputJsonValue;
      if (input.expectedResult !== undefined)
        data.expectedResult = input.expectedResult;
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.status !== undefined) data.status = input.status;
      if (input.format !== undefined) data.format = input.format;
      if (input.gherkin !== undefined) data.gherkin = input.gherkin;
      if (input.rationale !== undefined) data.rationale = input.rationale;

      const row = await tx.testCase.update({ where: { id: caseId }, data });

      // Delta-apply linkedRequirementIds when provided. Replace the
      // full link set (delete-then-insert pattern; same as M1's
      // LLM-config routing).
      if (input.linkedRequirementIds !== undefined) {
        await tx.testCaseLink.deleteMany({ where: { testCaseId: caseId } });
        if (input.linkedRequirementIds.length > 0) {
          await tx.testCaseLink.createMany({
            data: input.linkedRequirementIds.map((reqId) => ({
              testCaseId: caseId,
              requirementId: reqId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return row;
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'test_case',
      entityId: caseId,
      action: 'test_case_updated',
      payload: {
        test_case_id: caseId,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        case_key: key,
        // PII guard: list of which fields changed, NOT the values.
        fields_changed: Object.keys(input).filter(
          (k) => (input as Record<string, unknown>)[k] !== undefined,
        ),
        new_status: updated.status,
        new_priority: updated.priority,
        actor_email: ctx.actorEmail,
      },
    });

    return this.toDetail(caseId, ctx);
  }

  // ─────────────────────────────────────────────────────────────────
  // ARCHIVE (soft delete)
  // ─────────────────────────────────────────────────────────────────

  async archive(
    caseId: string,
    ctx: ActorContext,
  ): Promise<{ testCaseId: string }> {
    const { projectId, key } = await this.assertCaseWorkspace(caseId, ctx);

    // M3 v2 plan §"Status vocabulary" defers final status enum
    // reconciliation to Day-13 if real CRUD demands it. The existing
    // TestCaseStatus Prisma enum has 'deprecated' as the closest
    // equivalent to 'archived' — using that until the enum migration
    // lands. (M3-BE-01 reconciliation note documents this.)
    await this.prisma.testCase.update({
      where: { id: caseId },
      data: { status: 'deprecated' },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'test_case',
      entityId: caseId,
      action: 'test_case_archived',
      payload: {
        test_case_id: caseId,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        case_key: key,
        actor_email: ctx.actorEmail,
      },
    });

    return { testCaseId: caseId };
  }

  // ─────────────────────────────────────────────────────────────────
  // RTM linking — TASK 2 surface area, lives here because it
  // operates on TestCaseLink rows. Day-13 TASK 2 controller also
  // delegates here via the case-scoped routes.
  // ─────────────────────────────────────────────────────────────────

  async linkRequirement(
    caseId: string,
    requirementId: string,
    ctx: ActorContext,
  ): Promise<{ outcome: 'created' | 'existed' }> {
    const { projectId, key } = await this.assertCaseWorkspace(caseId, ctx);

    // Cross-project link → 404 (mirrors create() check; covers
    // both the "requirement doesn't exist" and "requirement is in a
    // different project" cases).
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: { projectId: true, key: true },
    });
    if (!req || req.projectId !== projectId) {
      throw new NotFoundException(
        `requirement ${requirementId} not found in this project`,
      );
    }

    // Idempotent: if link already exists, return outcome='existed'
    // without writing audit (audit chain stays clean across retries).
    const existing = await this.prisma.testCaseLink.findUnique({
      where: {
        testCaseId_requirementId: { testCaseId: caseId, requirementId },
      },
      select: { testCaseId: true },
    });
    if (existing) {
      return { outcome: 'existed' };
    }

    await this.prisma.testCaseLink.create({
      data: { testCaseId: caseId, requirementId },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'test_case_link',
      entityId: caseId,
      action: 'test_case_linked_to_requirement',
      payload: {
        test_case_id: caseId,
        requirement_id: requirementId,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        case_key: key,
        requirement_key: req.key,
        actor_email: ctx.actorEmail,
      },
    });

    return { outcome: 'created' };
  }

  async unlinkRequirement(
    caseId: string,
    requirementId: string,
    ctx: ActorContext,
  ): Promise<void> {
    const { projectId, key } = await this.assertCaseWorkspace(caseId, ctx);

    // 404 if the link doesn't exist (don't silently no-op — caller
    // expects a deterministic outcome). Use deleteMany count to
    // distinguish missing-link from successful delete.
    const result = await this.prisma.testCaseLink.deleteMany({
      where: { testCaseId: caseId, requirementId },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        `link from test case ${caseId} to requirement ${requirementId} not found`,
      );
    }

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'test_case_link',
      entityId: caseId,
      action: 'test_case_unlinked_from_requirement',
      payload: {
        test_case_id: caseId,
        requirement_id: requirementId,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        case_key: key,
        actor_email: ctx.actorEmail,
      },
    });
  }

  /** RTM coverage from the requirement perspective (counterpart to
   *  TestCaseDetailItem.links). Used by GET
   *  /api/requirements/:reqId/test-cases. */
  async coverageForRequirement(
    requirementId: string,
    ctx: ActorContext,
  ): Promise<
    Array<{
      testCaseId: string;
      key: string;
      title: string;
      priority: 'P0' | 'P1' | 'P2' | 'P3';
      status:
        | 'ai_draft'
        | 'manual_draft'
        | 'reviewed'
        | 'active'
        | 'flaky'
        | 'deprecated';
      format: 'step' | 'gherkin';
    }>
  > {
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        id: true,
        project: { select: { workspaceId: true } },
      },
    });
    if (!req || req.project.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`requirement ${requirementId} not found`);
    }

    const links = await this.prisma.testCaseLink.findMany({
      where: { requirementId },
      select: {
        testCase: {
          select: {
            id: true,
            key: true,
            title: true,
            priority: true,
            status: true,
            format: true,
          },
        },
      },
      orderBy: { testCase: { createdAt: 'desc' } },
    });

    return links.map((l) => ({
      testCaseId: l.testCase.id,
      key: l.testCase.key,
      title: l.testCase.title,
      priority: l.testCase.priority as 'P0' | 'P1' | 'P2' | 'P3',
      status: l.testCase.status as
        | 'ai_draft'
        | 'manual_draft'
        | 'reviewed'
        | 'active'
        | 'flaky'
        | 'deprecated',
      format: l.testCase.format as 'step' | 'gherkin',
    }));
  }

  /// Re-export so the controller can fail loud when a Stakeholder
  /// hits a write endpoint via direct request shaping. The @Roles
  /// guard catches it first in normal flows; this is defense-in-depth.
  assertWriteRole(ctx: ActorContext): void {
    if (ctx.role === 'Stakeholder') {
      throw new ForbiddenException(
        'Stakeholder role is read-only on test cases',
      );
    }
  }
}
