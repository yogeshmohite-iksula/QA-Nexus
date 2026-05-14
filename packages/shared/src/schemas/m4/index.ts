// QA Nexus PM1 — M4 (Day-18 #144) — barrel re-export.
//
// Re-exports all M4 schemas + types. Consumers import the namespace:
//   import { m4 } from '@qa-nexus/shared';
//   const x = m4.DefectSchema.parse(...);
//
// This avoids name collisions with the legacy M0-M3 schemas at
// `packages/shared/src/schemas/{defect,test-run,jira}.ts` which still
// re-export `DefectSchema`, `TestRunSchema`, `RcaReportSchema` etc.
// at the package root. M5 will dedupe + retire the legacy variants
// once all callers have migrated to the M4 shapes.

export * from './enums';
export * from './evidence';
export * from './defect';
export * from './defect-history';
export * from './jira-integration';
export * from './jira-webhook-event';
export * from './jira-sync-log';
export * from './test-run';
export * from './test-execution';
export * from './rca-report';
