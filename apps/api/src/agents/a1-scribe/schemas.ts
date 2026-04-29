// QA Nexus PM1 — A1 Scribe Zod schemas.
//
// Spec: PM1_PRD §3 (A1 Scribe agent) + PM1_ERD §5 + MS0-T036.
// A1 Scribe = "generate draft test cases from a requirement".
//
// Input  : a requirement (text + optional acceptance criteria + project key + count).
// Output : an array of draft test cases, each with: title, preconditions,
//          a numbered step list (action / expected_result), priority, type.
//
// Schemas live in apps/api (NOT packages/shared) at this scaffold stage —
// when M1 Scribe's full UI lands and the FE needs to type-check the same
// payload, we'll lift these into packages/shared/src/agents/a1-scribe.ts
// (per the centralization pattern established by storage.ts in T013).

import { z } from 'zod';

/** Body of `POST /agents/a1/generate`. */
export const GenerateTestCasesRequest = z.object({
  /** Project slug, e.g. "RET" — used for audit + future per-project context loading. */
  projectKey: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, 'projectKey must be uppercase A-Z, 0-9, _, -'),
  /** The requirement text the test cases should cover. Markdown is fine. */
  requirement: z.string().min(10).max(50_000),
  /** Optional: acceptance criteria, one per line. Improves LLM output. */
  acceptanceCriteria: z.string().max(20_000).optional(),
  /** How many test cases to draft. Default 3, max 10 (free-tier latency budget). */
  count: z.number().int().min(1).max(10).default(3),
  /** Optional override — Scribe defaults to systemPrompt at prompts.ts. */
  systemPromptOverride: z.string().max(10_000).optional(),
  /** Force the long-context route (e.g. when stuffing a large source spec). */
  forceLongContext: z.boolean().optional(),
});
export type GenerateTestCasesRequest = z.infer<typeof GenerateTestCasesRequest>;

/** A single drafted test case as produced by the model. */
export const DraftTestCase = z.object({
  title: z.string().min(3).max(200),
  preconditions: z.string().max(2_000).default(''),
  steps: z
    .array(
      z.object({
        action: z.string().min(1).max(1_000),
        expected_result: z.string().min(1).max(1_000),
      }),
    )
    .min(1)
    .max(20),
  priority: z.enum(['P1', 'P2', 'P3']).default('P2'),
  type: z
    .enum(['functional', 'negative', 'edge', 'regression'])
    .default('functional'),
});
export type DraftTestCase = z.infer<typeof DraftTestCase>;

/** What the model is instructed to return — wraps an array so we can add
 *  metadata (e.g., model_notes, ambiguity_flags) in future without breaking
 *  the parser. */
export const ModelResponse = z.object({
  test_cases: z.array(DraftTestCase).min(1).max(10),
  /** Optional free-text notes the model may include (e.g., "requirement is
   *  ambiguous about offline behaviour — assumed online-only"). */
  notes: z.string().max(5_000).optional(),
});
export type ModelResponse = z.infer<typeof ModelResponse>;

/** API response surface. */
export const GenerateTestCasesResponse = z.object({
  ok: z.literal(true),
  /** Drafts ready for the user to review + accept (M1 will persist these
   *  into TB-005 test_cases on accept). */
  testCases: z.array(DraftTestCase),
  /** Free-text notes from the model. */
  notes: z.string().optional(),
  /** Provider routing diagnostics — useful for Day-3+ tuning + the
   *  /llm/test diagnostic surface. */
  llm: z.object({
    providerName: z.string(),
    modelUsed: z.string(),
    routeReason: z.enum([
      'primary',
      'long_context',
      'secondary_after_primary_failure',
    ]),
    fallbackUsed: z.boolean(),
    tokensIn: z.number(),
    tokensOut: z.number(),
    latencyMs: z.number(),
    cost: z.number(),
  }),
});
export type GenerateTestCasesResponse = z.infer<
  typeof GenerateTestCasesResponse
>;
