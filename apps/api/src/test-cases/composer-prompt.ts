// QA Nexus PM1 — Composer (A1) prompt + JSON schema lock.
//
// Spec: ADR-013 (docs/architecture/adr-013-composer-prompt-strategy.md).
//
// SOURCE OF TRUTH for the system prompt + user-message template +
// response JSON schema sent to Groq's `response_format=json_schema`.
//
// LOCKED — any edit here requires:
//   1. ADR-013 update (or successor ADR)
//   2. Yogesh approval per ADR-013 §"Mitigation plan"
//   3. Snapshot test refresh: __snapshots__/composer-json-schema.json
//
// The JSON schema below is HAND-MAINTAINED (not derived) to avoid
// adding a `zod-to-json-schema` dep + lockfile bump mid-cascade.
// `composer-prompt.spec.ts` validates the same set of canonical
// payloads against BOTH this JSON schema AND the Zod schema in
// `@qa-nexus/shared` — drift between them is caught at test time.

import type { ComposerGeneratedCase } from '@qa-nexus/shared';

/// System prompt — ADR-013 §1, locked verbatim.
export const COMPOSER_SYSTEM_PROMPT = `You are QA Nexus Composer, a test-case generator for QA engineers at Iksula.
Given a requirement (and optionally retrieved knowledge-base chunks),
produce {N} concrete, executable test cases.

Rules:
1. Output ONLY valid JSON conforming to the provided JSON schema.
   Do NOT wrap in markdown code fences. Do NOT include prose before or after.
2. Each test case must be specific to the requirement — generic placeholder
   text ("perform action") is not acceptable. Use the requirement's domain
   vocabulary (refund, sprint, release, etc.).
3. Cover diverse failure modes: at least one happy-path case AND at least
   one negative-path case (validation, RBAC, isolation, edge case).
4. Each step's "action" is in imperative present tense ("Click Submit").
   Each step's "expected" is in declarative present tense ("Modal closes").
5. Priorities skew toward P0/P1 for security + integrity tests, P1/P2 for
   functional flows, P2/P3 for edge cases.
6. "format" is "step" by default. Use "gherkin" only if the requirement
   explicitly describes behavior in Given/When/Then style.
7. "rationale" (1-2 sentences) explains why THIS case matters relative to
   the requirement — not a generic "tests the feature" boilerplate.
8. "sourceChunkIds" echoes the chunk UUIDs you used from the context
   window. Empty array if you didn't use any chunk.`;

/// Reinforcement prompt appended after a JSON-parse failure (ADR-013 §5
/// attempt 2). Instructs the model to emit ONLY the JSON object.
export const COMPOSER_JSON_REINFORCEMENT =
  'Your previous response was not valid JSON conforming to the schema. ' +
  'Output ONLY the JSON object, no other text.';

/// Build the user-message portion of the Composer prompt. Templated
/// per-call. KB chunk-context arg is reserved for M3.5 (today's path
/// always passes []).
export function buildComposerUserMessage(args: {
  reqKey: string;
  reqTitle: string;
  reqDescription: string;
  projectKey: string;
  count: number;
  format: 'auto' | 'step' | 'gherkin';
  /** Optional chunks for KB-grounded mode (M3.5+). Today: []. */
  chunks?: Array<{ id: string; documentTitle: string; text: string }>;
}): string {
  const lines: string[] = [
    `Requirement key: ${args.reqKey}`,
    `Requirement title: ${args.reqTitle}`,
    `Requirement description: ${args.reqDescription}`,
    `Project key: ${args.projectKey}`,
    `Suggested key prefix: TC-${args.projectKey}-PROPOSED-NNN (3-digit zero-padded)`,
    '',
    `Generate ${args.count} test cases in ${args.format} format.`,
  ];
  if (args.chunks && args.chunks.length > 0) {
    lines.push('');
    lines.push(
      `Knowledge-base context (top ${args.chunks.length} chunks, ranked by similarity):`,
    );
    for (const c of args.chunks) {
      // Cap chunk text at 1000 chars per ADR-013 §1 to keep prompt
      // token-budget predictable.
      const snippet = c.text.length > 1000 ? c.text.slice(0, 1000) : c.text;
      lines.push('');
      lines.push(`[chunk: ${c.id}]`);
      lines.push(`Source: ${c.documentTitle}`);
      lines.push(snippet);
    }
  }
  return lines.join('\n');
}

/// JSON schema for `response_format=json_schema`. Mirrors the
/// `cases: ComposerGeneratedCase[]` Zod schema in
/// `packages/shared/src/schemas/test-case.ts`.
///
/// Wrapped in an outer `{ cases: [...] }` envelope because Groq's
/// strict-mode requires `additionalProperties: false` on the root —
/// returning a bare array as the root is technically allowed but the
/// strict-mode tooling prefers an object root.
export const COMPOSER_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['cases'],
  properties: {
    cases: {
      type: 'array',
      minItems: 1,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'key',
          'title',
          'preconditions',
          'stepsJson',
          'expectedResult',
          'priority',
          'format',
          'gherkin',
          'rationale',
          'sourceChunkIds',
        ],
        properties: {
          key: { type: 'string', minLength: 2, maxLength: 40 },
          title: { type: 'string', minLength: 1 },
          preconditions: { type: 'string' },
          stepsJson: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['order', 'action'],
              properties: {
                order: { type: 'integer', minimum: 0 },
                action: { type: 'string', minLength: 1 },
                expected: { type: 'string' },
              },
            },
          },
          expectedResult: { type: 'string' },
          priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          format: { type: 'string', enum: ['step', 'gherkin'] },
          gherkin: { type: ['string', 'null'] },
          rationale: { type: 'string' },
          sourceChunkIds: {
            type: 'array',
            items: {
              type: 'string',
              // UUID v4 pattern (loose — service Zod re-validates strictly).
              pattern:
                '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
            },
          },
        },
      },
    },
  },
} as const;

/// Schema name surfaced to Groq for telemetry. Stable identifier.
export const COMPOSER_RESPONSE_SCHEMA_NAME = 'composer_generated_cases';

/// Default sampling parameters per ADR-013 §4.
export const COMPOSER_TEMPERATURE = 0.4;
export const COMPOSER_MAX_TOKENS = 1500;

/// Shape returned by the LLM after JSON parse, before we map to
/// ComposerGeneratedCase (which is the same shape but Zod-validated).
export interface ComposerLLMResponse {
  cases: ComposerGeneratedCase[];
}

/// Service-layer error thrown when the LLM's JSON output fails Zod
/// validation. NOT a RetryableLLMError — the gateway must NOT fall
/// through to a different provider on parse failures (the same
/// problem will recur). Service-layer retry logic handles this with
/// reinforced prompt.
export class ComposerParseError extends Error {
  constructor(
    message: string,
    public readonly rawText: string,
  ) {
    super(message);
    this.name = 'ComposerParseError';
  }
}
