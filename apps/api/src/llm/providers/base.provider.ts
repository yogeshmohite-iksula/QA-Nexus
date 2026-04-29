// QA Nexus PM1 — abstract base for every LLM provider adapter.
//
// Spec: MS0-T023. Centralises:
//   - retry-with-backoff for 429 / 503 (1-second pause, single retry)
//   - in-memory health snapshot for /health
//   - structured error mapping (HTTP status → RetryableLLMError vs fatal)
//   - shared logger
//
// Subclasses implement only `callProvider(prompt, opts)` — the actual HTTP
// call to the provider's SDK. Everything else is inherited.
//
// Adding a new provider in PM1+ is therefore a 1-file change:
//   class MistralProvider extends BaseProvider {
//     readonly name = 'mistral';
//     readonly defaultModel = 'mistral-small-latest';
//     protected async callProvider(prompt, opts) { ...sdk call... }
//   }
import { Logger } from '@nestjs/common';
import {
  LLMOptions,
  LLMProvider,
  LLMResult,
  ProviderHealth,
  RetryableLLMError,
} from '../types';

const RETRY_BACKOFF_MS = 1000;

export abstract class BaseProvider implements LLMProvider {
  abstract readonly name: string;
  abstract readonly defaultModel: string;

  protected readonly logger: Logger;
  private healthState: ProviderHealth = {
    status: 'unknown',
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureMessage: null,
  };

  constructor() {
    this.logger = new Logger(`LLM:${this.constructor.name}`);
  }

  /** Public completion entry point. Wraps callProvider with retry +
   *  health tracking. Subclasses don't override this. */
  async complete(prompt: string, opts: LLMOptions = {}): Promise<LLMResult> {
    let attempt = 0;
    while (true) {
      attempt++;
      const t0 = Date.now();
      try {
        const result = await this.callProvider(prompt, opts);
        const finalResult: LLMResult = {
          ...result,
          providerName: this.name,
          latencyMs: Date.now() - t0,
        };
        this.markSuccess();
        return finalResult;
      } catch (err) {
        const isRetryable =
          err instanceof RetryableLLMError || this.isTransientError(err);
        const message = err instanceof Error ? err.message : String(err);
        if (isRetryable && attempt === 1) {
          this.logger.warn(
            `[${this.name}] transient error (attempt ${attempt}/2): ${message} — retrying in ${RETRY_BACKOFF_MS}ms`,
          );
          await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
          continue;
        }
        this.markFailure(message);
        // Re-throw as RetryableLLMError so the gateway can decide to fall
        // through to the secondary. Non-retryable errors propagate as-is.
        if (isRetryable) {
          const status =
            err instanceof RetryableLLMError ? err.statusCode : 503;
          throw new RetryableLLMError(
            `[${this.name}] retry exhausted: ${message}`,
            this.name,
            status,
            err,
          );
        }
        throw err;
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Subclasses may override for cheaper pings; default is a 1-token
      // completion which is the most accurate signal.
      await this.callProvider('ping', { maxTokens: 1 });
      this.markSuccess();
      return true;
    } catch (err) {
      this.markFailure(err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  getHealth(): ProviderHealth {
    return { ...this.healthState };
  }

  /**
   * The actual provider-SDK call. Subclasses implement this. Must:
   *   - throw RetryableLLMError on 429 / 503 (or surface those status
   *     codes so isTransientError() picks them up)
   *   - return an LLMResult with `text` + `modelUsed` + `tokensIn` +
   *     `tokensOut` populated; the BaseProvider fills in `providerName`,
   *     `latencyMs`, `fallbackUsed=false`, `cost=0`, `routeReason='primary'`.
   *   - The gateway overwrites `routeReason` and `fallbackUsed` after.
   */
  protected abstract callProvider(
    prompt: string,
    opts: LLMOptions,
  ): Promise<LLMResult>;

  /** Heuristic: detect 429 / 503 from arbitrary error shapes. Subclasses
   *  can also throw RetryableLLMError directly for explicit cases. */
  protected isTransientError(err: unknown): boolean {
    if (err instanceof RetryableLLMError) return true;
    if (typeof err !== 'object' || err === null) return false;
    const e = err as {
      status?: number;
      statusCode?: number;
      response?: { status?: number };
    };
    const status = e.status ?? e.statusCode ?? e.response?.status;
    return status === 429 || status === 503;
  }

  private markSuccess(): void {
    this.healthState = {
      status: 'up',
      lastSuccessAt: new Date().toISOString(),
      lastFailureAt: this.healthState.lastFailureAt,
      lastFailureMessage: null,
    };
  }

  private markFailure(message: string): void {
    this.healthState = {
      status: 'down',
      lastSuccessAt: this.healthState.lastSuccessAt,
      lastFailureAt: new Date().toISOString(),
      lastFailureMessage: message,
    };
  }
}
