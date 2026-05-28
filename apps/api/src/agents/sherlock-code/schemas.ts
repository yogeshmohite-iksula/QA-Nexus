/**
 * Sherlock RCA — agent.code Zod schemas (Day-19 P1 per ADR-019).
 *
 * Input: failure context for one defect (stack trace + message + component +
 * optional recent commits).
 * Output: array of category-tagged hypotheses. Day-20 orchestrator merges
 * 4 agents' outputs deterministically.
 */
import { z } from 'zod';

export const SherlockCodeInputSchema = z.object({
  defectId: z.string().uuid(),
  stackTrace: z.string().min(1).max(50_000),
  failureMessage: z.string().min(1).max(10_000),
  component: z.string().min(1).max(120).nullable(),
  recentCommits: z
    .array(
      z.object({
        sha: z.string().length(40),
        message: z.string().min(1),
        author: z.string().min(1),
        when: z.coerce.date(),
      }),
    )
    .max(20)
    .default([]),
});
export type SherlockCodeInput = z.infer<typeof SherlockCodeInputSchema>;

/** ADR-019 §4 deterministic-merge category enum (10 buckets). */
export const SHERLOCK_CATEGORIES = [
  'code-bug',
  'data-bug',
  'env-config',
  'flaky-network',
  'auth-permissions',
  'dependency-version',
  'ui-regression',
  'race-condition',
  'payment-gateway',
  'other',
] as const;

/** Day-20 P1 widening — agent enum now spans all 4 Sherlock agents so
 *  the orchestrator's mergeHypotheses() can type all sibling outputs
 *  uniformly. Code-agent still re-tags its output with agent='code' via
 *  .map() before returning so #161 spec assertions continue to hold. */
export const SHERLOCK_AGENTS = ['code', 'data', 'env', 'flake'] as const;
export type SherlockAgent = (typeof SHERLOCK_AGENTS)[number];

export const SherlockHypothesisSchema = z.object({
  category: z.enum(SHERLOCK_CATEGORIES),
  hypothesis: z.string().min(10).max(2_000),
  confidence: z.number().min(0).max(1),
  // [Day-28 AC042 schema-bridge fix] gpt-oss-120b emits `evidence` as a single
  // string per hypothesis, not as an array. Accept either shape and normalise
  // to string[] for downstream consumers. Empty default covers omission.
  evidence: z
    .union([z.array(z.string()).max(10), z.string()])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .default([]),
  // [Day-28 AC042 schema-bridge fix] LLM does not emit `agent` — each agent
  // service re-tags its output in the caller (per the design comment in
  // sherlock-data.service.ts:144-146). Make optional so safeParse succeeds;
  // caller's .map() sets the correct literal post-parse.
  agent: z.enum(SHERLOCK_AGENTS).optional(),
});
export type SherlockHypothesis = z.infer<typeof SherlockHypothesisSchema>;

/** Array form — what agent.analyze() returns (may be empty on failure). */
export const SherlockHypothesisArraySchema = z.array(SherlockHypothesisSchema);
