// QA Nexus PM1 — DefectsService (W2-R read API, Day-32).
//
// Closes the Phase-B W2 🔴 finding: the 25 seeded defects had no working
// read API (GET list absent, GET :id a 501 stub), so F21 Defects Hub
// rendered blank. This service provides the two read paths.
//
// Scope: READ-ONLY (list + detail). Create / status / jira-push / rca stay
// as controller stubs — out of this PR's scope.
//
// Tenancy: app-level where-clause on project.workspaceId (the proven-live
// isolation layer — DB RLS is installed but inert for the app role per the
// Day-32 G5 probe). Cross-workspace access → 404, never a leak, never a 403.
//
// Audit: reads are NOT audited — ERD §8.7 + Hard Rule 7 scope the audit log
// to STATE-CHANGING operations. This service has no AuditService dependency.

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { DefectListItem, DefectListQuery } from '@qa-nexus/shared';

/** Resolved session context the controller passes through. Mirrors the
 *  test-cases ActorContext; defined locally to keep the modules decoupled. */
export interface DefectActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  role: 'Admin' | 'Lead' | 'QAEngineer' | 'Stakeholder';
}

/** Single source of truth for the columns + joined refs a read returns.
 *  `project.workspaceId` is selected for the tenant check and dropped by
 *  the mapper — it never reaches the wire. */
const DEFECT_SELECT = {
  id: true,
  projectId: true,
  key: true,
  title: true,
  description: true,
  severity: true,
  status: true,
  triggeredByRunId: true,
  triggeredByTestCaseId: true,
  assigneeId: true,
  jiraIssueId: true,
  component: true,
  createdAt: true,
  resolvedAt: true,
  verifiedAt: true,
  closedAt: true,
  project: { select: { id: true, key: true, name: true } },
  assignee: { select: { id: true, displayName: true } },
} satisfies Prisma.DefectSelect;

type DefectRow = Prisma.DefectGetPayload<{ select: typeof DEFECT_SELECT }>;

/** Map a Prisma row → the shared wire shape (Date → ISO string). */
function toItem(row: DefectRow): DefectListItem {
  return {
    id: row.id,
    projectId: row.projectId,
    key: row.key,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    triggeredByRunId: row.triggeredByRunId,
    triggeredByTestCaseId: row.triggeredByTestCaseId,
    assigneeId: row.assigneeId,
    jiraIssueId: row.jiraIssueId,
    component: row.component,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    project: {
      id: row.project.id,
      key: row.project.key,
      name: row.project.name,
    },
    assignee: row.assignee
      ? { id: row.assignee.id, displayName: row.assignee.displayName }
      : null,
  };
}

@Injectable()
export class DefectsService {
  private readonly logger = new Logger(DefectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/defects — workspace-scoped list for the F21 Defects Hub.
   * Optional filters narrow WITHIN the workspace (defense in depth: the
   * workspace constraint is always present, never client-supplied).
   */
  async list(
    query: DefectListQuery,
    ctx: DefectActorContext,
  ): Promise<{
    defects: DefectListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: Prisma.DefectWhereInput = {
      project: {
        workspaceId: ctx.workspaceId,
        ...(query.projectId ? { id: query.projectId } : {}),
      },
      ...(query.status ? { status: query.status } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.component ? { component: query.component } : {}),
      ...(query.q
        ? {
            OR: [
              { key: { contains: query.q, mode: 'insensitive' } },
              { title: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.defect.findMany({
        where,
        select: DEFECT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.defect.count({ where }),
    ]);

    return {
      defects: rows.map(toItem),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /**
   * GET /api/defects/:id — detail. The workspace constraint in the
   * where-clause makes cross-tenant (or non-existent) → 404 in a single
   * query: no existence leak, no 403.
   */
  async detail(
    defectId: string,
    ctx: DefectActorContext,
  ): Promise<DefectListItem> {
    const row = await this.prisma.defect.findFirst({
      where: { id: defectId, project: { workspaceId: ctx.workspaceId } },
      select: DEFECT_SELECT,
    });
    if (!row) {
      throw new NotFoundException(`defect ${defectId} not found`);
    }
    return toItem(row);
  }
}
