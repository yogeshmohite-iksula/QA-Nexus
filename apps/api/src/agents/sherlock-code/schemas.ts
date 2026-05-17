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

export const SherlockHypothesisSchema = z.object({
  category: z.enum(SHERLOCK_CATEGORIES),
  hypothesis: z.string().min(10).max(2_000),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).max(10),
  agent: z.literal('code'),
});
export type SherlockHypothesis = z.infer<typeof SherlockHypothesisSchema>;

/** Array form — what agent.analyze() returns (may be empty on failure). */
export const SherlockHypothesisArraySchema = z.array(SherlockHypothesisSchema);
