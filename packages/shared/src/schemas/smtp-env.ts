// SMTP env-var contract — Zod schema parsed at API boot.
//
// Spec: Day-8 Step 2 (M1 Gmail SMTP wiring) + ADR-008.
//
// 9 env vars total. SMTP_PASSWORD is a Render secret — referenced via
// process.env at runtime, never logged, never committed. The schema
// here is the single source of truth for which env vars EmailService
// expects; mismatched names/types fail-fast on boot rather than at
// first send (which could be hours after deploy in low-traffic windows).
//
// Pattern: Zod with strict trims + min lengths. Boolean coerce for
// SMTP_SECURE (env strings are always 'true'/'false'). Number coerce
// for SMTP_PORT.

import { z } from 'zod';

export const SmtpEnv = z.object({
  /** SMTP host. Gmail: `smtp.gmail.com`. */
  SMTP_HOST: z.string().min(3),
  /** SMTP port. Gmail STARTTLS uses 587; SSL would be 465. */
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  /** Use SSL/TLS directly. `false` for STARTTLS on 587 (Gmail default). */
  SMTP_SECURE: z
    .string()
    .transform((s) => s === 'true' || s === '1')
    .pipe(z.boolean()),
  /** SMTP auth username. For Gmail = the sending email address. */
  SMTP_USER: z.string().email(),
  /** SMTP auth password. Gmail App Password (16 chars, no spaces).
   *  Render secret — NEVER log this value, NEVER include in errors.
   *  This schema validates length only, not format, since Gmail App
   *  Passwords don't have a fixed printable shape. */
  SMTP_PASSWORD: z.string().min(8),
  /** Friendly display name in From header. */
  SMTP_FROM_NAME: z.string().min(1).max(64),
  /** From-address email. Must match SMTP_USER for Gmail (Gmail rejects
   *  unauthenticated From spoofing). */
  SMTP_FROM_EMAIL: z.string().email(),
  /** Reply-To header — clicks to reply land in Yogesh's work email
   *  rather than the personal Gmail. */
  SMTP_REPLY_TO: z.string().email(),
  /** Silent BCC on every outbound email — used for pilot tracking.
   *  Recipient does NOT see this in headers (BCC is hidden by RFC).
   *  Yogesh's work email gets a copy of every invitation/magic-link/
   *  reset for visibility during the 8-user pilot. M1.5 will turn
   *  this off (or replace with audit-log-derived dashboard). */
  SMTP_BCC_EMAIL: z.string().email(),
});
export type SmtpEnv = z.infer<typeof SmtpEnv>;

/**
 * Parse SMTP env vars from process.env. Throws ZodError with a
 * concise list of missing/invalid keys when called at boot — the
 * resulting message is safe to surface in logs (does NOT include
 * SMTP_PASSWORD's value, only the field name if it failed validation).
 */
export function parseSmtpEnv(env: NodeJS.ProcessEnv = process.env): SmtpEnv {
  const result = SmtpEnv.safeParse({
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    SMTP_SECURE: env.SMTP_SECURE,
    SMTP_USER: env.SMTP_USER,
    SMTP_PASSWORD: env.SMTP_PASSWORD,
    SMTP_FROM_NAME: env.SMTP_FROM_NAME,
    SMTP_FROM_EMAIL: env.SMTP_FROM_EMAIL,
    SMTP_REPLY_TO: env.SMTP_REPLY_TO,
    SMTP_BCC_EMAIL: env.SMTP_BCC_EMAIL,
  });
  if (!result.success) {
    // Build a non-secret error message — ZodIssue.path tells us WHICH
    // env var failed; we never include the value itself.
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`SMTP env validation failed: ${issues}`);
  }
  return result.data;
}
