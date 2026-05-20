// QA Nexus PM1 — Jira webhook payload Zod schemas.
//
// Spec: ADR-020 ratified (commit 1203068).
// Reference: https://developer.atlassian.com/cloud/jira/platform/webhooks/
//
// Day-23 wire-up: extended with event-specific schemas for the 7 event
// types we route (3 issue + 4 sprint). Comment / Version / Property event
// families are Day-24 scope.
//
// Atlassian sends `webhookEvent: "jira:issue_<verb>"` for issue events and
// `webhookEvent: "sprint_<verb>"` for sprint events. We surface the verb as
// a discriminator string; the WebhookProcessorService dispatcher matches.

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Common refs
// ─────────────────────────────────────────────────────────────────────────────

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

/** Minimal sprint identity Atlassian includes on sprint events (top-level
 *  `sprint` object) AND inside `issue.fields.customfield_10020` array on
 *  issue events. */
export const JiraWebhookSprintRefSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    name: z.string(),
    state: z.enum(['active', 'closed', 'future']),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    completeDate: z.string().optional().nullable(),
    originBoardId: z.union([z.string(), z.number()]).optional().nullable(),
  })
  .passthrough();

export type JiraWebhookSprintRef = z.infer<typeof JiraWebhookSprintRefSchema>;

/** User who triggered the event. Optional — system events have none. */
export const JiraWebhookUserRefSchema = z
  .object({
    accountId: z.string().min(1),
    displayName: z.string().optional(),
    emailAddress: z.string().email().optional(),
  })
  .partial()
  .passthrough();

// ─────────────────────────────────────────────────────────────────────────────
// Top-level envelope (the controller's gate before dispatching to handlers)
// ─────────────────────────────────────────────────────────────────────────────

/** Top-level webhook envelope — all event types share these keys. The
 *  per-event-type schemas below tighten this for handler use. */
export const JiraWebhookPayloadSchema = z
  .object({
    webhookEvent: z.string().min(1),
    timestamp: z.number().int().nonnegative().optional(),
    issue: JiraWebhookIssueRefSchema.optional(),
    sprint: JiraWebhookSprintRefSchema.optional(),
    user: JiraWebhookUserRefSchema.optional(),
  })
  .passthrough();

export type JiraWebhookPayload = z.infer<typeof JiraWebhookPayloadSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Issue event payloads (Day-23 P1: jira:issue_created / _updated / _deleted)
// ─────────────────────────────────────────────────────────────────────────────

/** jira:issue_created — full issue object present. */
export const JiraWebhookIssueCreatedPayloadSchema = JiraWebhookPayloadSchema.extend({
  webhookEvent: z.literal('jira:issue_created'),
  issue: JiraWebhookIssueRefSchema,
});
export type JiraWebhookIssueCreatedPayload = z.infer<
  typeof JiraWebhookIssueCreatedPayloadSchema
>;

/** jira:issue_updated — Atlassian also sends `changelog.items[]` listing
 *  the fields that changed in this event. We accept it loosely; handler
 *  computes its own diff against cached values for the trigger logic. */
export const JiraWebhookIssueChangelogItemSchema = z
  .object({
    field: z.string(),
    fieldtype: z.string().optional(),
    from: z.string().optional().nullable(),
    fromString: z.string().optional().nullable(),
    to: z.string().optional().nullable(),
    toString: z.string().optional().nullable(),
  })
  .passthrough();

export const JiraWebhookIssueUpdatedPayloadSchema =
  JiraWebhookPayloadSchema.extend({
    webhookEvent: z.literal('jira:issue_updated'),
    issue: JiraWebhookIssueRefSchema,
    changelog: z
      .object({
        id: z.string().optional(),
        items: z.array(JiraWebhookIssueChangelogItemSchema).optional(),
      })
      .passthrough()
      .optional(),
  });
export type JiraWebhookIssueUpdatedPayload = z.infer<
  typeof JiraWebhookIssueUpdatedPayloadSchema
>;

/** jira:issue_deleted — only issue.id + issue.key are guaranteed. */
export const JiraWebhookIssueDeletedPayloadSchema = JiraWebhookPayloadSchema.extend({
  webhookEvent: z.literal('jira:issue_deleted'),
  issue: JiraWebhookIssueRefSchema,
});
export type JiraWebhookIssueDeletedPayload = z.infer<
  typeof JiraWebhookIssueDeletedPayloadSchema
>;

// ─────────────────────────────────────────────────────────────────────────────
// Sprint event payloads (Day-23 P1: sprint_created / _updated / _deleted / _closed)
// ─────────────────────────────────────────────────────────────────────────────

export const JiraWebhookSprintCreatedPayloadSchema =
  JiraWebhookPayloadSchema.extend({
    webhookEvent: z.literal('sprint_created'),
    sprint: JiraWebhookSprintRefSchema,
  });
export type JiraWebhookSprintCreatedPayload = z.infer<
  typeof JiraWebhookSprintCreatedPayloadSchema
>;

export const JiraWebhookSprintUpdatedPayloadSchema =
  JiraWebhookPayloadSchema.extend({
    webhookEvent: z.literal('sprint_updated'),
    sprint: JiraWebhookSprintRefSchema,
  });
export type JiraWebhookSprintUpdatedPayload = z.infer<
  typeof JiraWebhookSprintUpdatedPayloadSchema
>;

export const JiraWebhookSprintDeletedPayloadSchema =
  JiraWebhookPayloadSchema.extend({
    webhookEvent: z.literal('sprint_deleted'),
    sprint: JiraWebhookSprintRefSchema,
  });
export type JiraWebhookSprintDeletedPayload = z.infer<
  typeof JiraWebhookSprintDeletedPayloadSchema
>;

export const JiraWebhookSprintClosedPayloadSchema =
  JiraWebhookPayloadSchema.extend({
    webhookEvent: z.literal('sprint_closed'),
    sprint: JiraWebhookSprintRefSchema,
  });
export type JiraWebhookSprintClosedPayload = z.infer<
  typeof JiraWebhookSprintClosedPayloadSchema
>;

// ─────────────────────────────────────────────────────────────────────────────
// Day-23 P1 wire-up: handled event-type literals (used by dispatcher).
// Day-24 expands with: comment_created/updated/deleted, version_created/
// released/unreleased, property_set/deleted.
// ─────────────────────────────────────────────────────────────────────────────

export const WIRED_EVENT_TYPES = [
  'jira:issue_created',
  'jira:issue_updated',
  'jira:issue_deleted',
  'sprint_created',
  'sprint_updated',
  'sprint_deleted',
  'sprint_closed',
] as const;

export type WiredEventType = (typeof WIRED_EVENT_TYPES)[number];

export function isWiredEventType(s: string): s is WiredEventType {
  return (WIRED_EVENT_TYPES as readonly string[]).includes(s);
}
