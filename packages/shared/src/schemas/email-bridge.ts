// QA Nexus PM1 — Apps Script email-bridge request/response contract (ADR-025).
//
// The pilot magic-link transport posts to a Google Apps Script Web App deployed
// "Execute as: yogesh.mohite@iksula.com" (Workspace, 1500 recipients/day, $0,
// no DNS verification needed). This is the single source of truth for the
// request body + response shape, shared so the BE provider and any FE/diagnostic
// caller validate identically. The `secret` is a shared bearer string checked by
// the Web App — NEVER log a parsed request object (it carries the secret).

import { z } from 'zod';

export const AppsScriptEmailRequest = z.object({
  /** Shared secret validated by the Web App. Never logged. */
  secret: z.string().min(1),
  to: z.string().email(),
  subject: z.string().min(1),
  htmlBody: z.string().min(1),
  /** Plain-text alternative (deliverability — lowers spam scoring). */
  textBody: z.string().optional(),
  /** Display name in the From header; envelope sender is fixed by the deploy. */
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
});
export type AppsScriptEmailRequest = z.infer<typeof AppsScriptEmailRequest>;

export const AppsScriptEmailResponse = z.object({
  ok: z.boolean(),
  /** Remaining daily quota the Web App reports (best-effort). */
  remaining: z.number().optional(),
  /** Web App-side send duration in ms (best-effort). */
  ms: z.number().optional(),
  /** Error string when ok=false. */
  error: z.string().optional(),
});
export type AppsScriptEmailResponse = z.infer<typeof AppsScriptEmailResponse>;
