// QA Nexus PM1 — @qa-nexus/shared barrel
// =============================================================================
// Re-exports Zod schemas that mirror prisma/schema.prisma.
// Used by:
//   - apps/api: validate inbound request bodies, type outbound responses
//   - apps/web: client-side form validation (react-hook-form + zodResolver)
// Spec: .claude/rules/database.md ("Schema changes that alter request/response
//       shape MUST be paired with a Zod schema update in packages/shared in
//       the same PR.").
// =============================================================================

export * from './schemas/enums';
export * from './schemas/workspace';
export * from './schemas/user';
export * from './schemas/project';
export * from './schemas/requirement';
export * from './schemas/test-case';
export * from './schemas/test-suite';
export * from './schemas/test-run';
export * from './schemas/jira';
export * from './schemas/defect';
export * from './schemas/kb';
export * from './schemas/llm';
export * from './schemas/audit';
export * from './schemas/auth';
export * from './schemas/smtp-env';
export * from './schemas/resend-env';
export * from './schemas/nfr-probe';
export * from './schemas/email-bridge';
// M4 (Day-18 #144) — namespaced to avoid collision with legacy
// DefectSchema / TestRunSchema / RcaReportSchema / JiraConnection types
// at the package root. Import as: `import { m4 } from '@qa-nexus/shared'`
// then `m4.DefectSchema`, `m4.EvidenceSchema`, `m4.JiraIntegrationSchema`,
// etc. M5 retro will dedupe the legacy variants.
export * as m4 from './schemas/m4';
// M5 (Day-24 P0 #189-derived) — namespaced. Currently covers ADR-021
// Reports backend (ReportRequest/Response, 6 kind data shapes, ReportTemplate).
export * as m5 from './schemas/m5';
export * from './auth/role.enum';
export * from './storage';
// UI-facing seed/display types — extends the BE schemas with denormalized
// joins + UI-only types (AgentActivity, Approval, TeamRoster, ProjectList).
// See packages/shared/src/seed-types.ts header for the migration contract.
export type {
  // UI-only types (no BE schema yet)
  AgentActivity,
  AgentActivityTestCaseGenerated,
  AgentActivityTestCaseRevised,
  AgentActivityDefectTriaged,
  AgentActivityRunSummarized,
  AgentActivityRcaProposed,
  Approval,
  ApprovalTestCase,
  ApprovalDefectRca,
  ApprovalRunSignoff,
  // Denormalized "with relations" join types
  TestCaseWithRelations,
  DefectWithRelations,
  TestRunResultWithRelations,
  // Convenience aggregates
  TeamRoster,
  ProjectList,
} from './seed-types';
