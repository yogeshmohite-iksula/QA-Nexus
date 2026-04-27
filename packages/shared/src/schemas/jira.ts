// TB-013 jira_connections + TB-014 jira_issues.
import { z } from 'zod';
import { Uuid, Timestamp, JiraAuthMethod, JiraConnectionStatus } from './enums.js';

export const JiraConnectionSchema = z.object({
  id: Uuid,
  projectId: Uuid,
  authMethod: JiraAuthMethod,
  jiraBaseUrl: z.string().url(),
  // *_encrypted fields are app-layer AES-GCM ciphertext; never returned to clients.
  oauthAccessTokenEncrypted: z.string(),
  oauthRefreshTokenEncrypted: z.string(),
  oauthExpiresAt: Timestamp,
  status: JiraConnectionStatus,
  lastSyncAt: Timestamp.nullable(),
});
export type JiraConnection = z.infer<typeof JiraConnectionSchema>;

/// Public view of a Jira connection (strips ciphertext).
export const JiraConnectionPublicSchema = JiraConnectionSchema.omit({
  oauthAccessTokenEncrypted: true,
  oauthRefreshTokenEncrypted: true,
});
export type JiraConnectionPublic = z.infer<typeof JiraConnectionPublicSchema>;

export const CreateJiraConnectionInput = z.object({
  jiraBaseUrl: z.string().url(),
  // OAuth tokens come from the OAuth callback handler; never accepted from
  // a user-facing API. This shape is for internal use post-callback.
  oauthAccessToken: z.string(),
  oauthRefreshToken: z.string(),
  oauthExpiresAt: Timestamp,
});
export type CreateJiraConnectionInput = z.infer<typeof CreateJiraConnectionInput>;

// TB-014 jira_issues
export const JiraIssueSchema = z.object({
  id: Uuid,
  jiraConnectionId: Uuid,
  jiraKey: z.string(),
  issueType: z.string(),
  status: z.string(),
  linkedDefectId: Uuid.nullable(),
  linkedRequirementId: Uuid.nullable(),
  lastSyncedAt: Timestamp,
});
export type JiraIssue = z.infer<typeof JiraIssueSchema>;
