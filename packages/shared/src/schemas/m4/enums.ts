// QA Nexus PM1 — M4 (Day-18 #144) shared enum primitives.
//
// Mirrors the PostgreSQL enum types defined in
// apps/api/prisma/raw/migrations/0004_m4_runs_defects_jira.sql + the
// Prisma enums in apps/api/prisma/schema.prisma. Snake_case lowercase
// values (matches existing canon — see Day-17 A-F decision matrix
// resolution; defect_status values were chosen to align with TB-015).
//
// Imports kept platform-agnostic — `packages/shared` runs in both
// apps/api (Node) and apps/web (Next.js client).

import { z } from 'zod';

export const DefectStatusEnum = z.enum([
  'new',
  'triaged',
  'in_progress',
  'resolved',
  'verified',
  'closed',
  'reopened',
  'blocked',
]);
export type DefectStatus = z.infer<typeof DefectStatusEnum>;

export const TestRunStatusEnum = z.enum([
  'queued',
  'running',
  'passed',
  'failed',
  'blocked',
  'aborted',
]);
export type TestRunStatus = z.infer<typeof TestRunStatusEnum>;

export const TestResultStatusEnum = z.enum(['passed', 'failed', 'blocked', 'skipped']);
export type TestResultStatus = z.infer<typeof TestResultStatusEnum>;

export const JiraAuthMethodEnum = z.enum(['oauth_3lo', 'api_token']);
export type JiraAuthMethod = z.infer<typeof JiraAuthMethodEnum>;

export const JiraConnectionStatusEnum = z.enum(['active', 'expired', 'revoked']);
export type JiraConnectionStatus = z.infer<typeof JiraConnectionStatusEnum>;

export const JiraSyncDirectionEnum = z.enum(['outbound', 'inbound']);
export type JiraSyncDirection = z.infer<typeof JiraSyncDirectionEnum>;

export const RunTriggerEnum = z.enum(['manual', 'webhook', 'cron']);
export type RunTrigger = z.infer<typeof RunTriggerEnum>;

export const SeverityEnum = z.enum(['P0', 'P1', 'P2', 'P3']);
export type Severity = z.infer<typeof SeverityEnum>;
