// QA Nexus PM1 — LLMGateway service.
//
// Spec: PM1_ERD §5 + MS0-T023. The single-entry-point that all callers
// (A1 Scribe, A2 Sentinel, A4 Sherlock, etc.) use to invoke an LLM.
// Owns:
//   - provider selection (primary / secondary / long-context per env)
//   - long-context routing heuristic (input-token estimate vs threshold)
//   - retry-then-fallback orchestration
//   - structured logging + future OTel attribute emission
//
// The gateway never imports a specific provider class — only the registry.
// That's the architectural seam that makes new providers a 1-file add.
import {
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  AllProvidersFailedError,
  LLMOptions,
  LLMResult,
  RetryableLLMError,
} from './types';
import { getProvider, listProviders } from './provider-registry';

interface GatewayConfig {
  primaryProvider: string;
  primaryModel: string | undefined;
  secondaryProvider: string | undefined;
  secondaryModel: string | undefined;
  longContextProvider: string | undefined;
  longContextModel: string | undefined;
  longContextThresholdTokens: number;
}

const DEFAULT_LONG_CONTEXT_THRESHOLD = 30000;

@Injectable()
export class LLMGatewayService implements OnModuleInit {
  private readonly logger = new Logger(LLMGatewayService.name);
  private config!: GatewayConfig;
  /**
   * True when LLM env vars are missing — service runs in deferred mode.
   * Matches R2Service / EmailService pattern. Per Yogesh + arch decision
   * (Day-4 noon): LLM keys come from F26 UI in M1, not env vars. Until
   * F26 lands, the service should NOT crash on boot if vars missing.
   */
  public deferred = true;
  public deferredReason: string | null = null;

  onModuleInit(): void {
    try {
      this.config = this.readConfig();
      this.deferred = false;
      this.deferredReason = null;
      this.logger.log(
        `LLMGateway initialised: primary=${this.config.primaryProvider}` +
          (this.config.primaryModel ? `:${this.config.primaryModel}` : '') +
          (this.config.secondaryProvider
            ? ` · secondary=${this.config.secondaryProvider}`
            : ' · NO secondary configured (no fallback available)') +
          (this.config.longContextProvider
            ? ` · long-context=${this.config.longContextProvider} (threshold=${this.config.longContextThresholdTokens} tok)`
            : ''),
      );
      this.logger.log(
        `available providers in registry: ${listProviders().join(', ')}`,
      );
    } catch (e) {
      this.deferred = true;
      this.deferredReason = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `LLMGateway running in DEFERRED mode (no provider configured): ${this.deferredReason}. ` +
          `Admin must configure via F26 UI in M1 — until then any /llm/* call returns 501.`,
      );
    }
  }

  /** Return the active config snapshot — used by /health and /llm/providers.
   *  Returns null in deferred mode (no config to snapshot). */
  getConfig(): Readonly<GatewayConfig> | null {
    return this.deferred ? null : { ...this.config };
  }

  /** Cheap, env-agnostic token estimate: roughly 4 chars per token. */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Public completion entry point. Routes to long-context / primary /
   * secondary based on options + config + estimated input length.
   */
  async complete(prompt: string, opts: LLMOptions = {}): Promise<LLMResult> {
    if (this.deferred) {
      throw new HttpException(
        `LLM gateway not configured: ${this.deferredReason ?? 'no provider env vars set'}. ` +
          `Admin must set LLM provider via F26 UI in M1.`,
        501,
      );
    }
    const t0 = Date.now();
    const inputTokens = this.estimateTokens(prompt + (opts.systemPrompt ?? ''));

    // Long-context routing: if forced OR over threshold AND configured.
    const longCtxProvider = this.config.longContextProvider;
    const longCtxConfigured = !!longCtxProvider;
    const wantsLongCtx =
      opts.forceLongContext === true ||
      (longCtxConfigured &&
        inputTokens > this.config.longContextThresholdTokens);

    if (wantsLongCtx && longCtxProvider) {
      this.logger.log(
        `route=long_context provider=${longCtxProvider} input_tokens~=${inputTokens} ` +
          `threshold=${this.config.longContextThresholdTokens}`,
      );
      const provider = getProvider(longCtxProvider);
      const result = await provider.complete(prompt, {
        ...opts,
        model: opts.model ?? this.config.longContextModel,
      });
      return {
        ...result,
        latencyMs: Date.now() - t0,
        routeReason: 'long_context',
        fallbackUsed: false,
      };
    }

    // Primary route — attempt with retry baked into BaseProvider.
    const attempts: AllProvidersFailedError['attempts'] = [];
    try {
      this.logger.log(
        `route=primary provider=${this.config.primaryProvider} input_tokens~=${inputTokens}`,
      );
      const provider = getProvider(this.config.primaryProvider);
      const result = await provider.complete(prompt, {
        ...opts,
        model: opts.model ?? this.config.primaryModel,
      });
      return {
        ...result,
        latencyMs: Date.now() - t0,
        routeReason: 'primary',
        fallbackUsed: false,
      };
    } catch (err) {
      const isTransient = err instanceof RetryableLLMError;
      const errMsg = err instanceof Error ? err.message : String(err);
      attempts.push({
        providerName: this.config.primaryProvider,
        error: errMsg,
        statusCode:
          err instanceof RetryableLLMError ? err.statusCode : undefined,
      });
      if (!isTransient) {
        // Non-transient error from primary — don't fall through (could be
        // a programming bug, e.g. bad prompt format). Surface as-is.
        throw err;
      }
      this.logger.warn(
        `primary provider '${this.config.primaryProvider}' exhausted retries: ${errMsg}. ` +
          `Falling through to secondary…`,
      );
    }

    // Secondary route (only reached if primary threw RetryableLLMError).
    if (!this.config.secondaryProvider) {
      throw new AllProvidersFailedError(
        `Primary provider '${this.config.primaryProvider}' failed and no secondary is configured. ` +
          `Set LLM_SECONDARY_PROVIDER + LLM_SECONDARY_MODEL in env to enable fallback.`,
        attempts,
      );
    }
    try {
      this.logger.log(
        `route=secondary provider=${this.config.secondaryProvider} (primary failed)`,
      );
      const provider = getProvider(this.config.secondaryProvider);
      const result = await provider.complete(prompt, {
        ...opts,
        model: opts.model ?? this.config.secondaryModel,
      });
      return {
        ...result,
        latencyMs: Date.now() - t0,
        routeReason: 'secondary_after_primary_failure',
        fallbackUsed: true,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      attempts.push({
        providerName: this.config.secondaryProvider,
        error: errMsg,
        statusCode:
          err instanceof RetryableLLMError ? err.statusCode : undefined,
      });
      throw new AllProvidersFailedError(
        `All providers failed: ${attempts.map((a) => `${a.providerName}=${a.error}`).join(' | ')}`,
        attempts,
      );
    }
  }

  /** Read env config at boot. Throws if primary is missing. */
  private readConfig(): GatewayConfig {
    const primary = process.env.LLM_PRIMARY_PROVIDER;
    if (!primary) {
      throw new Error(
        'LLM_PRIMARY_PROVIDER env var is required (e.g. "groq"). ' +
          `Available providers: ${listProviders().join(', ')}.`,
      );
    }
    return {
      primaryProvider: primary,
      primaryModel: process.env.LLM_PRIMARY_MODEL,
      secondaryProvider: process.env.LLM_SECONDARY_PROVIDER,
      secondaryModel: process.env.LLM_SECONDARY_MODEL,
      longContextProvider: process.env.LLM_LONG_CONTEXT_PROVIDER,
      longContextModel: process.env.LLM_LONG_CONTEXT_MODEL,
      longContextThresholdTokens: Number(
        process.env.LLM_LONG_CONTEXT_THRESHOLD_TOKENS ??
          DEFAULT_LONG_CONTEXT_THRESHOLD,
      ),
    };
  }
}
