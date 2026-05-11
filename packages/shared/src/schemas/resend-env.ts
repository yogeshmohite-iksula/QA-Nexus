// Resend env-var contract — Zod schema parsed at API boot.
//
// Spec: ADR-018 (Day-16) — migration from nodemailer/Gmail SMTP to
// Resend HTTPS API. Render Free tier blocks outbound SMTP (Sept 2025
// policy), so the SMTP path in ADR-008 became non-functional in prod.
// Resend's HTTPS POST to api.resend.com bypasses the block.
//
// 5 env vars total (down from 9 SMTP vars). RESEND_API_KEY is the only
// required secret — the rest have sensible pilot defaults so a fresh
// Render redeploy with just RESEND_API_KEY set produces working email.
//
// Pattern mirrors `smtp-env.ts`: Zod with strict trims + min lengths;
// thrown error messages include only field names, never values. The
// schema is the single source of truth for which env vars EmailService
// expects; mismatched names/types fail-fast on boot rather than at
// first send (which could be hours after deploy in low-traffic windows).

import { z } from 'zod';

export const ResendEnv = z.object({
  /** Resend API key. Format: `re_<random>`. Render secret — NEVER
   *  log this value, NEVER include in errors. Schema validates the
   *  `re_` prefix + min length only, not the full token format
   *  (Resend may rotate token shapes). */
  RESEND_API_KEY: z
    .string()
    .min(10)
    .refine((s) => s.startsWith('re_'), {
      message: 'must start with "re_" (Resend API key prefix)',
    }),
  /** From-address email. For pilot: `onboarding@resend.dev` works
   *  out-of-box (Resend sandbox sender — no domain verification
   *  needed). Production: `noreply@iksula.com` once the iksula.com
   *  domain is verified in Resend dashboard (followup (bg)). */
  RESEND_FROM_EMAIL: z.string().email().default('onboarding@resend.dev'),
  /** Friendly display name in From header. Resend renders as
   *  `"<NAME>" <<FROM_EMAIL>>` per RFC 5322. */
  RESEND_FROM_NAME: z.string().min(1).max(64).default('QA Nexus'),
  /** Reply-To header — clicks to reply land in Yogesh's work email
   *  rather than the sandbox sender. Optional; if unset, replies go
   *  to the from-email (which for `onboarding@resend.dev` will
   *  bounce — set this in any non-throwaway deploy). */
  RESEND_REPLY_TO: z.string().email().optional(),
  /** Silent BCC on every outbound email — used for pilot tracking.
   *  Recipient does NOT see this in headers (BCC is hidden by RFC).
   *  Yogesh's work email gets a copy of every invitation/magic-link/
   *  reset for visibility during the 8-user pilot. M1.5 will turn
   *  this off (or replace with audit-log-derived dashboard). */
  RESEND_BCC_EMAIL: z.string().email().optional(),
});
export type ResendEnv = z.infer<typeof ResendEnv>;

/**
 * Parse Resend env vars. Throws Error with a concise list of missing/
 * invalid keys when called at boot — the resulting message is safe
 * to surface in logs (does NOT include RESEND_API_KEY's value, only
 * the field name if it failed validation).
 *
 * Caller MUST pass the env object explicitly (typically `process.env`
 * from BE). `packages/shared` is consumed by both apps/api (Node) and
 * apps/web (Next.js client-side); referencing `process.env` directly
 * here would require `@types/node` in shared and would couple the FE
 * to a Node-only global. Pattern: keep shared platform-agnostic;
 * inject the env at the call site.
 */
export function parseResendEnv(env: Record<string, string | undefined>): ResendEnv {
  const result = ResendEnv.safeParse({
    RESEND_API_KEY: env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: env.RESEND_FROM_NAME,
    RESEND_REPLY_TO: env.RESEND_REPLY_TO,
    RESEND_BCC_EMAIL: env.RESEND_BCC_EMAIL,
  });
  if (!result.success) {
    // Build a non-secret error message — ZodIssue.path tells us WHICH
    // env var failed; we never include the value itself.
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Resend env validation failed: ${issues}`);
  }
  return result.data;
}
