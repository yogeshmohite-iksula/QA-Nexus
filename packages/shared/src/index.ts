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

export * from './schemas/enums.js';
export * from './schemas/workspace.js';
export * from './schemas/user.js';
export * from './schemas/project.js';
export * from './schemas/requirement.js';
export * from './schemas/test-case.js';
export * from './schemas/test-suite.js';
export * from './schemas/test-run.js';
export * from './schemas/jira.js';
export * from './schemas/defect.js';
export * from './schemas/kb.js';
export * from './schemas/llm.js';
export * from './schemas/audit.js';
