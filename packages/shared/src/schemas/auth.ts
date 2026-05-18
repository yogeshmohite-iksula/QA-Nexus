// QA Nexus PM1 — Auth request schemas (shared between apps/api + apps/web).
//
// Day-21 Kimi-K2 HIGH triage (d): extracted from apps/api/src/auth/auth.controller.ts
// so the FE can validate sign-in / sign-up forms with the SAME Zod schema
// the BE controller uses for inbound body parsing. Prevents drift where
// FE form validation accepts an input the BE rejects (or vice versa).
//
// Endpoints:
//   POST /auth/sign-up — body validated by SignUpBodySchema
//   POST /auth/sign-in — body validated by SignInBodySchema
//
// `callbackURL` is intentionally loose at the Zod layer — origin-allowlist
// validation happens at the controller (see validateCallbackUrl in
// `apps/api/src/auth/callback-url.ts`, Day-21 Kimi-K2 HIGH triage item (a)).
// The Zod schema only enforces shape; the allowlist check is a runtime
// concern because trusted origins differ per environment (dev/staging/prod).
import { z } from 'zod';

export const SignUpBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  callbackURL: z.string().optional(),
});

export type SignUpBody = z.infer<typeof SignUpBodySchema>;

export const SignInBodySchema = z.object({
  email: z.string().email(),
  callbackURL: z.string().optional(),
});

export type SignInBody = z.infer<typeof SignInBodySchema>;
