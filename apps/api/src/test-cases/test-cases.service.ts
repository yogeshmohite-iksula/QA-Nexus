// QA Nexus PM1 — TestCasesService.
//
// Spec: M3 TASK BE-02 (Day-12). Skeleton — all methods throw 501
// NOT IMPLEMENTED. Real CRUD lands Day-13 morning, slotting into
// the same shape so the wire stays stable for FE.
//
// Why a skeleton ships ahead of the real implementation:
//   - Day-13 has ~30 min of "wire it up" work (controller already in
//     AppModule, RBAC guard already covering the route, Zod schemas
//     already in @qa-nexus/shared from M3-BE-01).
//   - Splitting the merge surface lets MAIN cherry-pick this PR
//     independently if the real CRUD slips.
//   - Establishes the canonical TestCases path /api/projects/:projectId/test-cases
//     before A1 Composer (M3 Day-14) needs to insert into it.

import { Injectable, NotImplementedException } from '@nestjs/common';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  /// User's effective role — used by service-level checks the
  /// guard layer can't express (e.g. Stakeholder read-only on a
  /// shared route). Day-13 fills these checks in.
  role: 'Admin' | 'Lead' | 'QAEngineer' | 'Stakeholder';
}

@Injectable()
export class TestCasesService {
  /// Day-13 will: validate Zod input → assertProjectWorkspace →
  /// generate next TC-{key}-NNN → prisma.testCase.create →
  /// optional linkedRequirementIds inserts → audit row → return.
  async create(): Promise<never> {
    throw new NotImplementedException(
      'TestCasesService.create — Day-13 work. Skeleton from M3-BE-02.',
    );
  }

  /// Day-13 will: paginated findMany scoped to project (workspace
  /// isolation via JOIN-then-WHERE on Project.workspaceId), with
  /// `?priority` / `?status` / `?format` / `?hasLinks` filters per
  /// v2 plan §"List + Filter UI".
  async list(): Promise<never> {
    throw new NotImplementedException(
      'TestCasesService.list — Day-13 work. Skeleton from M3-BE-02.',
    );
  }

  /// Day-13 will: prisma.testCase.findUnique + JOIN with workspace
  /// check (cross-workspace OR cross-project caseId → 404, no
  /// existence leak — same pattern as KbDocumentsService.detail).
  async detail(): Promise<never> {
    throw new NotImplementedException(
      'TestCasesService.detail — Day-13 work. Skeleton from M3-BE-02.',
    );
  }

  /// Day-13 will: validate Zod patch + status-transition rules +
  /// linkedRequirementIds delta (insert/delete TestCaseLink rows in
  /// a single transaction).
  async update(): Promise<never> {
    throw new NotImplementedException(
      'TestCasesService.update — Day-13 work. Skeleton from M3-BE-02.',
    );
  }

  /// Day-13 will: cascade-delete TestCaseLink (FK ON DELETE Cascade
  /// handles this), TestSuiteMember (same), TestRunResult (same),
  /// then audit row with PII-safe payload (case_key + actor_email,
  /// NOT title — titles can leak business intent).
  async remove(): Promise<never> {
    throw new NotImplementedException(
      'TestCasesService.remove — Day-13 work. Skeleton from M3-BE-02.',
    );
  }
}
