// Mirrors enums in apps/api/prisma/schema.prisma.
// Keep these in lockstep with the Prisma `enum` blocks — Postgres CREATE TYPE
// is the source of truth, Prisma mirrors it, Zod mirrors Prisma.
import { z } from 'zod';

export const UserRole = z.enum(['Admin', 'Lead', 'QAEngineer', 'Stakeholder']);
export type UserRole = z.infer<typeof UserRole>;

export const InvitationStatus = z.enum(['pending', 'accepted', 'expired', 'revoked']);
export type InvitationStatus = z.infer<typeof InvitationStatus>;

export const Priority = z.enum(['P0', 'P1', 'P2', 'P3']);
export type Priority = z.infer<typeof Priority>;

export const RequirementStatus = z.enum(['draft', 'active', 'done', 'archived']);
export type RequirementStatus = z.infer<typeof RequirementStatus>;

export const RequirementSource = z.enum(['manual', 'jira', 'upload']);
export type RequirementSource = z.infer<typeof RequirementSource>;

export const TestCaseStatus = z.enum([
  'ai_draft',
  'manual_draft',
  'reviewed',
  'active',
  'flaky',
  'deprecated',
]);
export type TestCaseStatus = z.infer<typeof TestCaseStatus>;

export const TestSuiteStatus = z.enum(['healthy', 'warning', 'stale', 'archived']);
export type TestSuiteStatus = z.infer<typeof TestSuiteStatus>;

export const RunTrigger = z.enum(['manual', 'webhook', 'cron']);
export type RunTrigger = z.infer<typeof RunTrigger>;

export const TestRunStatus = z.enum([
  'queued',
  'running',
  'passed',
  'failed',
  'blocked',
  'aborted',
]);
export type TestRunStatus = z.infer<typeof TestRunStatus>;

export const TestResultStatus = z.enum(['passed', 'failed', 'blocked', 'skipped']);
export type TestResultStatus = z.infer<typeof TestResultStatus>;

export const JiraAuthMethod = z.enum(['oauth_3lo']);
export type JiraAuthMethod = z.infer<typeof JiraAuthMethod>;

export const JiraConnectionStatus = z.enum(['active', 'expired', 'revoked']);
export type JiraConnectionStatus = z.infer<typeof JiraConnectionStatus>;

export const DefectStatus = z.enum([
  'new',
  'triaged',
  'in_progress',
  'resolved',
  'verified',
  'closed',
  'reopened',
  'blocked',
]);
export type DefectStatus = z.infer<typeof DefectStatus>;

export const LlmProviderKind = z.enum([
  'groq',
  'gemini',
  'openrouter',
  'cerebras',
  'openai',
  'anthropic',
  'kimi',
  'mistral',
  'together',
  'fireworks',
  'custom_oai',
]);
export type LlmProviderKind = z.infer<typeof LlmProviderKind>;

export const LlmProviderStatus = z.enum(['connected', 'error', 'unverified']);
export type LlmProviderStatus = z.infer<typeof LlmProviderStatus>;

export const AgentKind = z.enum(['A1', 'A2', 'A4']);
export type AgentKind = z.infer<typeof AgentKind>;

export const AgentRole = z.enum(['primary', 'long_context', 'fallback', 'fast_layer']);
export type AgentRole = z.infer<typeof AgentRole>;

export const AgentRunStatus = z.enum(['queued', 'running', 'complete', 'failed']);
export type AgentRunStatus = z.infer<typeof AgentRunStatus>;

// Common primitives reused across schemas.
export const Uuid = z.string().uuid();
export const Timestamp = z.string().datetime({ offset: true });
export const NonEmpty = z.string().min(1);
