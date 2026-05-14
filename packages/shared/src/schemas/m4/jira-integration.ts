// QA Nexus PM1 — M4 (Day-18 #144) — jira_connections Zod schema.
//
// Yogesh's Day-17 Jira decision: PM1 supports both api_token (simpler
// bootstrap) AND oauth_3lo (production-grade). Postgres-side this is
// ONE row in jira_connections, distinguished by `authMethod`.
// TypeScript-side we expose it as a discriminated union so consumers
// get exhaustive type narrowing.
//
// CRITICAL — token columns are AES-GCM ciphertext via apps/api/src/llm/
// crypto.ts (PR #115). NEVER pass plaintext through these schemas;
// encrypt before persisting, decrypt on demand only.

import { z } from 'zod';
import { DefectStatusEnum, JiraConnectionStatusEnum } from './enums';

const JiraIntegrationBase = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  jiraBaseUrl: z.string().url(),
  status: JiraConnectionStatusEnum.default('active'),
  /// Per-integration Jira-status → defect_status map.
  /// `{}` = use default mapping. Surfaces in F26 admin config.
  statusMapping: z.record(z.string(), DefectStatusEnum).default({}),
  lastSyncAt: z.coerce.date().nullable(),
});

export const JiraIntegrationOAuth3LO = JiraIntegrationBase.extend({
  authMethod: z.literal('oauth_3lo'),
  oauthAccessTokenEncrypted: z.string().min(1), // AES-GCM ciphertext
  oauthRefreshTokenEncrypted: z.string().min(1),
  oauthExpiresAt: z.coerce.date(),
  accountEmail: z.null(), // not used in oauth_3lo
});

export const JiraIntegrationApiToken = JiraIntegrationBase.extend({
  authMethod: z.literal('api_token'),
  /// Repurposed column: holds the AES-GCM ciphertext of the Atlassian
  /// API token. NOT a refresh token; api_token doesn't rotate the
  /// same way.
  oauthAccessTokenEncrypted: z.string().min(1),
  oauthRefreshTokenEncrypted: z.string().nullable(),
  oauthExpiresAt: z.coerce.date().nullable(),
  accountEmail: z.string().email(), // REQUIRED in api_token branch
});

export const JiraIntegrationSchema = z.discriminatedUnion('authMethod', [
  JiraIntegrationOAuth3LO,
  JiraIntegrationApiToken,
]);
export type JiraIntegration = z.infer<typeof JiraIntegrationSchema>;

/// POST /api/projects/{id}/jira/connect — api_token bootstrap input.
/// Server encrypts apiToken via crypto.ts before persisting.
export const JiraIntegrationCreateApiTokenInputSchema = z.object({
  jiraBaseUrl: z.string().url(),
  accountEmail: z.string().email(),
  apiToken: z.string().min(8),
  statusMapping: z.record(z.string(), DefectStatusEnum).default({}),
});
export type JiraIntegrationCreateApiTokenInput = z.infer<
  typeof JiraIntegrationCreateApiTokenInputSchema
>;
