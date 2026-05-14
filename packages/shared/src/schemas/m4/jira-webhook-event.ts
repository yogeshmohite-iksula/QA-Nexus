// QA Nexus PM1 — M4 (Day-18 #144) — jira_webhook_events Zod schema.
//
// Inbound Jira webhook event log. UNIQUE on event_id for idempotent
// dedupe (Jira retries on 5xx). signature_valid=false rows kept for
// forensics.
//
// CRITICAL — Day-20 implementation note: Atlassian Jira webhooks
// compute HMAC-SHA256 on RAW body bytes. The webhook handler MUST
// use a dedicated raw-body middleware on the route ONLY (rest of API
// keeps default JSON parsing). See M4 Day-20 brief.

import { z } from 'zod';

export const JiraWebhookEventSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().min(1), // Jira-supplied dedupe key
  jiraIssueKey: z.string().nullable(),
  eventType: z.string().min(1), // 'jira:issue_updated', etc.
  payload: z.record(z.string(), z.unknown()), // arbitrary Jira shape
  signatureValid: z.boolean(),
  processed: z.boolean().default(false),
  processingError: z.string().nullable(),
  receivedAt: z.coerce.date(),
  processedAt: z.coerce.date().nullable(),
});
export type JiraWebhookEvent = z.infer<typeof JiraWebhookEventSchema>;
