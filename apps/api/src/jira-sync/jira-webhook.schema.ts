// QA Nexus PM1 — Jira webhook payload Zod schema.
//
// Spec: ADR (forthcoming Day-20) + Day-19 P2 brief.
// Reference: https://developer.atlassian.com/cloud/jira/platform/webhooks/
//
// SCOPE — Day-19 acknowledgement only.
// We Zod-validate the SHAPE we care about right now (event discriminator
// + minimal issue identity) and pass everything else through. Day-20's
// full handler will tighten the schema per event type (jira:issue_created
// → defect upsert, jira:issue_updated → status sync, etc).
//
// Atlassian sends `webhookEvent: "jira:issue_<verb>"` for issue events
// and `webhookEvent: "comment_<verb>"` etc. We surface the verb as a
// discriminator string; downstream code matches on it.

import { z } from 'zod';

/** Minimal issue identity Atlassian always includes on issue events. */
export const JiraWebhookIssueRefSchema = z
  .object({
    id: z.string().min(1),
    key: z.string().min(1),
    self: z.string().url().optional(),
    fields: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type JiraWebhookIssueRef = z.infer<typeof JiraWebhookIssueRefSchema>;

/** Top-level webhook envelope — all event types share these keys. */
export const JiraWebhookPayloadSchema = z
  .object({
    /** Event type discriminator, e.g. `jira:issue_created`. */
    webhookEvent: z.string().min(1),
    /** Unix epoch ms — Atlassian-side enqueue time. Optional. */
    timestamp: z.number().int().nonnegative().optional(),
    /** Issue ref present on `jira:issue_*` events. */
    issue: JiraWebhookIssueRefSchema.optional(),
    /** User who triggered the event. Optional — system events have none. */
    user: z
      .object({
        accountId: z.string().min(1),
        displayName: z.string().optional(),
        emailAddress: z.string().email().optional(),
      })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough();

export type JiraWebhookPayload = z.infer<typeof JiraWebhookPayloadSchema>;
