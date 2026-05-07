// QA Nexus PM1 — RequirementsService.
//
// Spec: M3 TASK BE-03 (Day-12). Skeleton — all methods throw 501
// NOT IMPLEMENTED. Real CRUD lands later in M3 (Day-14+) once the
// PRD ingestion + Composer trigger flow is settled.
//
// Why a skeleton ships ahead of the real implementation:
//   - The TestCases skeleton (M3-BE-02) wires `/api/test-cases` ahead
//     of Day-13's real CRUD. This sister PR puts `/api/requirements`
//     in the same shape so M3 frontend (F11 Requirements) can stub
//     against a stable URL space.
//   - A1 Composer needs a Requirement to ground a generation run
//     against (TB-022 has `requirement_id` FK). Locking the path
//     space now means Day-14's Composer service can call into
//     RequirementsService without an API redesign.

import { Injectable, NotImplementedException } from '@nestjs/common';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  /// User's effective role — Day-14 service-level checks may further
  /// constrain WRITE on Stakeholder-shared projects. Guard layer
  /// already handles role-only RBAC.
  role: 'Admin' | 'Lead' | 'QAEngineer' | 'Stakeholder';
}

@Injectable()
export class RequirementsService {
  /// Day-14 will: validate Zod input → assertProjectWorkspace →
  /// generate next REQ-{key}-NNN → prisma.requirement.create →
  /// audit row → return.
  async create(): Promise<never> {
    throw new NotImplementedException(
      'RequirementsService.create — Day-14 work. Skeleton from M3-BE-03.',
    );
  }

  /// Day-14 will: paginated findMany scoped to project (workspace
  /// isolation via JOIN-then-WHERE on Project.workspaceId), with
  /// `?status` / `?priority` / `?source` / `?sprint` filters per
  /// PRD §"Requirements browser".
  async list(): Promise<never> {
    throw new NotImplementedException(
      'RequirementsService.list — Day-14 work. Skeleton from M3-BE-03.',
    );
  }

  /// Day-14 will: prisma.requirement.findUnique + JOIN with
  /// workspace check (cross-workspace OR cross-project reqId → 404).
  async detail(): Promise<never> {
    throw new NotImplementedException(
      'RequirementsService.detail — Day-14 work. Skeleton from M3-BE-03.',
    );
  }

  /// Day-14 will: validate Zod patch + status-transition rules.
  async update(): Promise<never> {
    throw new NotImplementedException(
      'RequirementsService.update — Day-14 work. Skeleton from M3-BE-03.',
    );
  }

  /// Day-14 will: cascade-delete TestCaseLink (FK CASCADE handles
  /// this automatically); TestCaseGenerationRun.requirement_id =>
  /// SET NULL preserves Composer history. Audit row with PII-safe
  /// payload (req_key + actor_email, NOT title/description — those
  /// can leak business intent like "Black Friday rate-limit policy").
  async remove(): Promise<never> {
    throw new NotImplementedException(
      'RequirementsService.remove — Day-14 work. Skeleton from M3-BE-03.',
    );
  }
}
