// QA Nexus PM1 — M5 schemas barrel re-export.
//
// Consumers import the namespace:
//   import { m5 } from '@qa-nexus/shared';
//   m5.ReportRequestSchema.parse(body);
//
// M5 currently covers: ADR-021 Reports backend (Day-24).

export * from './report';
