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
import { trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import {
  AllProvidersFailedError,
  LLMOptions,
  LLMResult,
  RetryableLLMError,
} from './types';
import { getProvider, listProviders } from './provider-registry';
import { PrismaService } from '../prisma/prisma.service';
import { decryptApiKey, envVarForProviderKind } from './crypto';

/**
 * Tracer for LLM gateway spans. Per `.claude/rules/api.md`:
 * "Every gateway call must emit an OpenTelemetry span (`llm.complete`)
 *  with attributes: provider, model, prompt_tokens, completion_tokens,
 *  latency_ms, fallback_triggered."
 *
 * The tracer is a no-op until OTel SDK initializes (see
 * `apps/api/src/observability/otel.config.ts`). After init it routes
 * spans to Grafana Cloud OTLP. No code change needed when env vars
 * are set on Render — the tracer auto-flips from no-op to live.
 */
const tracer = trace.getTracer('qa-nexus-api/llm-gateway', '0.0.1');

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
   *
   * ADR-015 (M3-close, Day-15): config resolution is now env-first then
   * DB-fallback (TB-019 `llm_providers`). Stays in deferred mode only
   * when BOTH env AND DB are empty. Source recorded in `configSource`.
   */
  public deferred = true;
  public deferredReason: string | null = null;
  /** Where the active config came from. Surfaced in /health + boot logs. */
  public configSource: 'env' | 'db' | 'none' = 'none';

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    // Env-first per ADR-015 §"Resolution order" — preserves backward
    // compat for existing Render env-var-driven deployments.
    try {
      this.config = this.readConfigFromEnv();
      this.deferred = false;
      this.deferredReason = null;
      this.configSource = 'env';
      this.logBootSummary('env');
      return;
    } catch (envErr) {
      const envMsg = envErr instanceof Error ? envErr.message : String(envErr);
      this.logger.log(
        `LLMGateway env-config not present (${envMsg}); attempting DB fallback per ADR-015...`,
      );
    }

    // DB-fallback (Path C bridge — Day-15). Reads TB-019 + TB-020,
    // decrypts api_key_encrypted via BETTER_AUTH_SECRET, injects
    // plaintext into process.env so the lazy-constructed provider
    // (GroqProvider, GeminiProvider) finds it on first call.
    try {
      const dbConfig = await this.readConfigFromDb();
      if (dbConfig) {
        this.config = dbConfig;
        this.deferred = false;
        this.deferredReason = null;
        this.configSource = 'db';
        this.logBootSummary('db');
        return;
      }
      // No DB row found AND no env config → deferred (current behavior).
      this.deferred = true;
      this.deferredReason =
        'no LLM_PRIMARY_PROVIDER env var AND no llm_providers row with status=connected';
      this.configSource = 'none';
      this.logger.warn(
        `LLMGateway running in DEFERRED mode: ${this.deferredReason}. ` +
          `Admin must EITHER set LLM_* env vars OR run \`pnpm exec ts-node apps/api/scripts/seed-llm-provider.ts\` ` +
          `(per ADR-015) — until then any /llm/* call returns 501.`,
      );
    } catch (dbErr) {
      // DB read OR decrypt failed — surface as deferred with the actual
      // error so operators can debug (e.g., wrong BETTER_AUTH_SECRET).
      this.deferred = true;
      this.deferredReason =
        dbErr instanceof Error ? dbErr.message : String(dbErr);
      this.configSource = 'none';
      this.logger.error(
        `LLMGateway DB-fallback FAILED: ${this.deferredReason}. ` +
          `Service stays in DEFERRED mode. Common causes: BETTER_AUTH_SECRET ` +
          `mismatch (decrypt fail), Prisma migration not applied (table missing), ` +
          `or seed script never run.`,
      );
    }
  }

  /** Single source of truth for boot-summary log line. */
  private logBootSummary(source: 'env' | 'db'): void {
    this.logger.log(
      `LLMGateway initialised (source=${source}): primary=${this.config.primaryProvider}` +
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
    // LLM_DEBUG=true → emit raw prompt + system to stderr for FE+1
    // wiring debugging. NEVER enable in production (would log PII to
    // stdout); env-gated for local dev only. Guarded by binary string
    // check so any non-'true' value (including unset) is a no-op.
    // Day-14 TASK B1.3.
    if (process.env.LLM_DEBUG === 'true') {
      process.stderr.write(
        '\n[LLM_DEBUG] complete() called\n' +
          `[LLM_DEBUG] systemPrompt (${(opts.systemPrompt ?? '').length} chars):\n` +
          `${opts.systemPrompt ?? '(none)'}\n` +
          `[LLM_DEBUG] prompt (${prompt.length} chars):\n${prompt}\n` +
          `[LLM_DEBUG] opts: ${JSON.stringify({ model: opts.model, temperature: opts.temperature, maxTokens: opts.maxTokens, forceLongContext: opts.forceLongContext, responseFormat: opts.responseFormat?.type ?? 'text' })}\n`,
      );
    }
    // Wrap the entire routing + retry + fallback flow in a single span
    // per .claude/rules/api.md binding rule. The span is always emitted
    // (even if it fails) — attributes capture which route fired + which
    // provider/model actually answered + tokens + fallback flag.
    return tracer.startActiveSpan(
      'llm.complete',
      {
        attributes: {
          'llm.input_tokens_estimate': this.estimateTokens(
            prompt + (opts.systemPrompt ?? ''),
          ),
          'llm.long_context_forced': opts.forceLongContext === true,
          'llm.long_context_threshold': this.config.longContextThresholdTokens,
          'llm.has_secondary': !!this.config.secondaryProvider,
          'llm.has_long_context': !!this.config.longContextProvider,
        },
      },
      async (span: Span) => {
        try {
          const result = await this.completeInternal(prompt, opts);
          span.setAttributes({
            'llm.provider': result.providerName,
            'llm.model': result.modelUsed,
            'llm.prompt_tokens': result.tokensIn,
            'llm.completion_tokens': result.tokensOut,
            'llm.latency_ms': result.latencyMs,
            'llm.fallback_triggered': result.fallbackUsed,
            'llm.route_reason': result.routeReason,
          });
          span.setStatus({ code: SpanStatusCode.OK });
          // LLM_DEBUG=true → emit raw completion + provider metadata.
          // Day-14 TASK B1.3.
          if (process.env.LLM_DEBUG === 'true') {
            process.stderr.write(
              `[LLM_DEBUG] result provider=${result.providerName} model=${result.modelUsed} ` +
                `tokensIn=${result.tokensIn} tokensOut=${result.tokensOut} latencyMs=${result.latencyMs} ` +
                `fallbackUsed=${result.fallbackUsed} route=${result.routeReason}\n` +
                `[LLM_DEBUG] completion (${result.text.length} chars):\n${result.text}\n\n`,
            );
          }
          return result;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: errMsg });
          throw err;
        } finally {
          span.end();
        }
      },
    );
  }

  /** Internal routing + retry + fallback. Wrapped by `complete()` in a
   *  span. Kept as a separate method so the span attribute setting +
   *  error path stays ergonomic. */
  private async completeInternal(
    prompt: string,
    opts: LLMOptions = {},
  ): Promise<LLMResult> {
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

  /** Read env config at boot. Throws if primary is missing.
   *  Renamed from `readConfig` per ADR-015 (env-first then DB-fallback). */
  private readConfigFromEnv(): GatewayConfig {
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

  /**
   * ADR-015 (Path C transitional bridge — Day-15) — read provider config
   * from `llm_providers` (TB-019) when env vars are absent. Strategy:
   *
   *   1. Find the first provider row with status='connected' (any
   *      workspace — multi-tenancy enforcement happens upstream of the
   *      gateway via service-layer ActorContext checks).
   *   2. AES-GCM-decrypt `api_key_encrypted` via BETTER_AUTH_SECRET.
   *   3. Inject plaintext key into `process.env[GROQ_API_KEY|...]` so
   *      the lazy-constructed provider class (GroqProvider, etc.) finds
   *      it on first `getProvider()` call. Internal-only env mutation;
   *      never leaves the process.
   *   4. Map provider's first enabled model → primaryModel.
   *   5. (Future) Map AgentModelAssignment rows for secondary +
   *      long_context. v1 leaves these undefined — single-provider
   *      Groq-only path is sufficient for M3 close.
   *
   * Returns null when no provider row exists (caller stays in deferred
   * mode). Throws when decrypt fails (caller surfaces error to operator).
   *
   * Will be removed when F26 v2 React UI ships in M5 + admins are
   * configuring via web. Tracked in followup `(az)`.
   */
  private async readConfigFromDb(): Promise<GatewayConfig | null> {
    // Check the table FIRST — fresh DB / CI envs have no provider row,
    // so we can return null cleanly without needing BETTER_AUTH_SECRET.
    // The seed only matters when there's actually a row to decrypt
    // (avoids a false-positive error in CI test envs that lack the
    // env var by design — they never reach the decrypt path anyway).
    const provider = await this.prisma.llmProvider.findFirst({
      where: { status: 'connected' },
      orderBy: { createdAt: 'asc' },
      include: {
        models: {
          where: { enabledForWorkspace: true },
          orderBy: { displayName: 'asc' },
        },
      },
    });
    if (!provider) {
      return null;
    }

    // Row found → we MUST have the seed to decrypt. If missing now,
    // it's a real operator error (DB has a row but env is unconfigured).
    const seed = process.env.BETTER_AUTH_SECRET;
    if (!seed) {
      throw new Error(
        'BETTER_AUTH_SECRET env var is required to decrypt the DB-stored ' +
          'LLM provider API key (ADR-015). A llm_providers row exists ' +
          `(id=${provider.id}, kind=${provider.providerKind}) but the ` +
          'gateway cannot decrypt it without the seed.',
      );
    }

    // Decrypt + inject — defensive: if decrypt fails (wrong seed,
    // tampered ciphertext) the helper throws + we propagate up.
    const plaintextKey = decryptApiKey(provider.apiKeyEncrypted, seed);
    const envVar = envVarForProviderKind(provider.providerKind);
    process.env[envVar] = plaintextKey;
    this.logger.log(
      `LLMGateway: injected ${envVar} from db (provider_id=${provider.id} kind=${provider.providerKind}); ` +
        `provider class will pick it up on next getProvider() call.`,
    );

    // Pick the first enabled model as primary. v1 of the bridge —
    // F26 v2 will wire AgentModelAssignment for per-agent×role routing.
    const primaryModelId = provider.models[0]?.modelId;

    return {
      primaryProvider: provider.providerKind,
      primaryModel: primaryModelId,
      // v1: secondary + long_context not derived from DB. Future PR
      // (or F26 v2) joins AgentModelAssignment to populate these.
      secondaryProvider: undefined,
      secondaryModel: undefined,
      longContextProvider: undefined,
      longContextModel: undefined,
      longContextThresholdTokens: Number(
        process.env.LLM_LONG_CONTEXT_THRESHOLD_TOKENS ??
          DEFAULT_LONG_CONTEXT_THRESHOLD,
      ),
    };
  }
}
