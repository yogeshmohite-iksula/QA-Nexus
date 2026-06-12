// F16b Composer (A1) — REAL BE-wired API client (Pattern B flip).
//
// Day-15 TASK D2. Replaces PR #110's Pattern A canned-data simulation
// with a real `POST /api/projects/:projectId/requirements/:reqId/test-cases/generate`
// call. Sister of `users-api.ts` (the canonical Pattern B example from
// Day-8 followup ab).
//
// Endpoint contract is locked by ADR-013 (composer-prompt-strategy) +
// PR #109 (real Groq integration). Wire shape pinned by Zod schemas
// in `@qa-nexus/shared/schemas/test-case.ts` + reference fixture at
// `docs/architecture/composer-sample-RET-247.json`.
//
// Behavior:
//   - On success → returns parsed `ComposerGenerateResponse`
//     (`stubbed:true` until Render env wires LLM_PRIMARY_PROVIDER=groq +
//     GROQ_API_KEY at Day-15 deploy; FE renders identically — only the
//     stubbed banner differs).
//   - On 503 → throws `ComposerUnavailableError` (retry-exhausted)
//   - On 400 → throws `ComposerSchemaError` (Zod validation fail at BE)
//   - On 429 → throws `ComposerRateLimitError` (Groq RPD cap hit)
//   - On network/parse fail → throws generic `Error`
//
// FE callers should `try/catch` and surface the error verbatim via
// Sonner toast + revert UI state (e.g. flip `isGenerating` back to false).

import { ComposerGenerateRequest, ComposerGenerateResponse } from '@qa-nexus/shared';
import { getApiBaseURL } from '@/lib/env';

// ---------------------------------------------------------------------------
// Base URL — absolute so calls reach NestJS on a separate origin (port 3001
// in local dev, Render in production). Same pattern as users-api.ts.
// ---------------------------------------------------------------------------
const API_BASE = getApiBaseURL().replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Typed errors — let the caller distinguish retry-after (503) from
// schema-fail (400) vs rate-limit (429) vs network without re-parsing.
// ---------------------------------------------------------------------------

export class ComposerUnavailableError extends Error {
  readonly status = 503 as const;
  retryAfterSec?: number;
  runId?: string;
  constructor(message: string, retryAfterSec?: number, runId?: string) {
    super(message);
    this.name = 'ComposerUnavailableError';
    this.retryAfterSec = retryAfterSec;
    this.runId = runId;
  }
}

export class ComposerSchemaError extends Error {
  readonly status = 400 as const;
  constructor(message: string) {
    super(message);
    this.name = 'ComposerSchemaError';
  }
}

export class ComposerRateLimitError extends Error {
  readonly status = 429 as const;
  retryAfterSec?: number;
  constructor(message: string, retryAfterSec?: number) {
    super(message);
    this.name = 'ComposerRateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}

// ---------------------------------------------------------------------------
// Typed client.
// ---------------------------------------------------------------------------

export interface GenerateTestCasesArgs {
  /** Project UUID — resolved upstream from URL `?source=RET-247` via
   *  requirement-key-resolver. */
  projectId: string;
  /** Requirement UUID — resolved upstream from URL `?source=RET-247`. */
  requirementId: string;
  /** Optional count (1-10, BE default 5). */
  count?: number;
  /** Optional format (BE default 'auto'). */
  format?: 'auto' | 'step' | 'gherkin';
}

/**
 * Hits `POST /api/projects/:projectId/requirements/:requirementId/test-cases/generate`
 * with the typed request body. Returns the validated response on success,
 * throws a typed error on failure.
 */
export async function generateTestCases(
  args: GenerateTestCasesArgs,
): Promise<ComposerGenerateResponse> {
  const { projectId, requirementId, count, format } = args;

  // Validate request body via shared Zod schema before send (catches dev typos
  // + parses defaults). Throws ZodError if `count` outside [1,10].
  const body = ComposerGenerateRequest.parse({
    ...(count !== undefined ? { count } : {}),
    ...(format !== undefined ? { format } : {}),
  });

  const url = `${API_BASE}/api/projects/${encodeURIComponent(projectId)}/requirements/${encodeURIComponent(requirementId)}/test-cases/generate`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // Network / DNS / CORS — surface as generic Error so caller sees it
    // distinctly from BE-emitted typed errors.
    throw new Error(`Composer network error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Read body first — we need it for typed-error context regardless of status.
  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }
  const errBody = (parsed ?? {}) as Record<string, unknown>;

  if (res.status === 503) {
    throw new ComposerUnavailableError(
      typeof errBody.error === 'string' ? errBody.error : 'composer_unavailable',
      typeof errBody.retry_after === 'number' ? errBody.retry_after : undefined,
      typeof errBody.run_id === 'string' ? errBody.run_id : undefined,
    );
  }
  if (res.status === 429) {
    throw new ComposerRateLimitError(
      typeof errBody.error === 'string' ? errBody.error : 'rate_limit',
      typeof errBody.retry_after === 'number' ? errBody.retry_after : undefined,
    );
  }
  if (res.status === 400) {
    throw new ComposerSchemaError(
      typeof errBody.message === 'string'
        ? errBody.message
        : 'Composer request rejected (schema fail)',
    );
  }
  if (!res.ok) {
    throw new Error(`Composer request failed: HTTP ${res.status} ${res.statusText}`);
  }

  // Success path — validate the response wire shape via shared Zod schema.
  // This guards against BE/FE drift; if the wire shape changes server-side,
  // the parse fails loudly here rather than producing UI undefined-deref.
  return ComposerGenerateResponse.parse(parsed);
}
