// QA Nexus PM1 — LLM gateway abstraction layer.
//
// Spec: PM1_ERD §5 + MS0-T023. Provider-agnostic by design. The whole
// point of these types is that the application code only ever sees:
//
//    inject LLMGateway → call .complete(prompt, opts) → get LLMResult
//
// The decision of which provider runs the call (Groq vs Gemini vs future
// Mistral / Together / etc.) is owned by the gateway service, configured
// via env vars, never hardcoded in the call sites. Adding a new provider:
//   1. New file in apps/api/src/llm/providers/<name>.provider.ts
//      that extends BaseProvider and implements complete() + healthCheck().
//   2. One line in provider-registry.ts mapping the name → factory.
//   3. Set LLM_PRIMARY_PROVIDER (or _SECONDARY / _LONG_CONTEXT) env var.
//   4. Done — zero changes to LLMGateway, controllers, or callers.

export interface LLMOptions {
  /** Provider-specific model id. Falls back to the gateway's configured
   *  default for the chosen provider when omitted. */
  model?: string;
  /** Sampling temperature (0..2). Default = provider's default. */
  temperature?: number;
  /** Hard ceiling on response tokens. Default = provider's default. */
  maxTokens?: number;
  /** Optional system prompt prepended before `prompt`. */
  systemPrompt?: string;
  /** When true the gateway routes to the long-context provider (if
   *  configured). Defaults to auto-detect via prompt length heuristic. */
  forceLongContext?: boolean;
}

export interface LLMResult {
  /** The model's textual completion. */
  text: string;
  /** Which provider actually answered (after fallback). */
  providerName: string;
  /** Which model id was used (for cost / capability accounting). */
  modelUsed: string;
  /** Approximate input tokens (provider-reported when available). */
  tokensIn: number;
  /** Approximate output tokens. */
  tokensOut: number;
  /** End-to-end latency from gateway entry to response. */
  latencyMs: number;
  /** True iff a fallback path served the request (primary failed). */
  fallbackUsed: boolean;
  /** Dollar cost. Always 0 for free-tier providers in PM1. */
  cost: number;
  /** Reason the gateway picked this route — for diagnostics. */
  routeReason: 'primary' | 'long_context' | 'secondary_after_primary_failure';
}

export interface ProviderHealth {
  status: 'up' | 'down' | 'unknown';
  /** Last successful health-check timestamp, or null if never. */
  lastSuccessAt: string | null;
  /** Last failure timestamp + error, when applicable. */
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
}

/**
 * Provider-facing contract. Every concrete provider in providers/*.provider.ts
 * must implement this. BaseProvider supplies sensible defaults for retry +
 * health tracking; subclasses only need to implement the actual API call.
 */
export interface LLMProvider {
  /** Stable identifier — must match the registry key (e.g. "groq", "gemini"). */
  readonly name: string;
  /** Default model id when LLMOptions.model is omitted. */
  readonly defaultModel: string;
  /**
   * Single completion call. Must throw a typed RetryableLLMError on
   * transient failures (429 / 503) so the gateway can decide to retry
   * and/or fall through to the secondary provider.
   */
  complete(prompt: string, opts?: LLMOptions): Promise<LLMResult>;
  /** Lightweight ping — used by /health. Should be cheap (no completion). */
  healthCheck(): Promise<boolean>;
  /** Latest health snapshot (in-memory, refreshed on each healthCheck call). */
  getHealth(): ProviderHealth;
}

/** Thrown by a provider when the failure is transient (HTTP 429 / 503).
 *  The gateway catches this specifically: retry once, then fall through. */
export class RetryableLLMError extends Error {
  constructor(
    message: string,
    public readonly providerName: string,
    public readonly statusCode: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RetryableLLMError';
  }
}

/** Thrown when ALL configured providers (primary + secondary, after retry)
 *  have failed. Carries each underlying error for diagnostics. */
export class AllProvidersFailedError extends Error {
  constructor(
    message: string,
    public readonly attempts: Array<{
      providerName: string;
      error: string;
      statusCode?: number;
    }>,
  ) {
    super(message);
    this.name = 'AllProvidersFailedError';
  }
}
