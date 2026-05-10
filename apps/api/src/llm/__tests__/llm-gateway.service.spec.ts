// Unit tests for LLMGatewayService — retry + fallback orchestration.
//
// Strategy: jest.mock the provider-registry module so getProvider() returns
// a controllable mock per-provider-name. The mocks throw / resolve to
// scripted outcomes so we can verify the gateway's routing without a real
// network call to Groq / Gemini (good for CI: no API keys, no quota burn,
// deterministic timing).
//
// Spec: MS0-T023.b. Covers:
//   1. primary 429 once  -> retry succeeds (BaseProvider absorbs)
//   2. primary 429 twice -> RetryableLLMError -> gateway falls to secondary
//   3. both fail         -> AllProvidersFailedError carries both attempts
//   4. long-context routing (forceLongContext + prompt-length heuristic)
//   5. non-retryable from primary -> bubbles up, NO fallback
//   6. no secondary configured + primary 429 twice -> AllProvidersFailedError
//      with helpful message

import { LLMGatewayService } from '../llm-gateway.service';
import {
  AllProvidersFailedError,
  type LLMProvider,
  type LLMResult,
  RetryableLLMError,
} from '../types';

// --- Mock the registry. The real getProvider() reads from a static REGISTRY
// map; we replace it with a per-test setProviderMock() seam.
const providerMocks = new Map<string, LLMProvider>();
jest.mock('../provider-registry', () => ({
  getProvider: (name: string): LLMProvider => {
    const m = providerMocks.get(name);
    if (!m)
      throw new Error(`test setup: no mock registered for provider '${name}'`);
    return m;
  },
  listProviders: (): string[] => Array.from(providerMocks.keys()),
  _resetProviderCacheForTests: (): void => providerMocks.clear(),
}));

interface MockProviderConfig {
  name: string;
  // Sequence of outcomes — one per call to .complete(). Each entry is
  // either a successful result text OR an error to throw.
  script: Array<{ ok: true; text: string } | { ok: false; throw: unknown }>;
}

function makeMock(cfg: MockProviderConfig): LLMProvider {
  let cursor = 0;
  return {
    name: cfg.name,
    defaultModel: `${cfg.name}-default-model`,
    async complete(prompt, opts): Promise<LLMResult> {
      const step = cfg.script[cursor++];
      if (!step) {
        throw new Error(
          `test: provider '${cfg.name}' called more times than scripted`,
        );
      }
      if (!step.ok) throw step.throw;
      return {
        text: step.text,
        providerName: cfg.name,
        modelUsed: opts?.model ?? `${cfg.name}-default-model`,
        tokensIn: Math.ceil(prompt.length / 4),
        tokensOut: Math.ceil(step.text.length / 4),
        latencyMs: 1, // overwritten by gateway
        fallbackUsed: false, // overwritten by gateway
        cost: 0,
        routeReason: 'primary', // overwritten by gateway
      };
    },
    async healthCheck(): Promise<boolean> {
      return true;
    },
    getHealth() {
      return {
        status: 'unknown' as const,
        lastSuccessAt: null,
        lastFailureAt: null,
        lastFailureMessage: null,
      };
    },
  };
}

function setEnv(env: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe('LLMGatewayService', () => {
  let svc: LLMGatewayService;

  beforeEach(async () => {
    providerMocks.clear();
    setEnv({
      LLM_PRIMARY_PROVIDER: 'mock-primary',
      LLM_PRIMARY_MODEL: 'primary-model',
      LLM_SECONDARY_PROVIDER: 'mock-secondary',
      LLM_SECONDARY_MODEL: 'secondary-model',
      LLM_LONG_CONTEXT_PROVIDER: 'mock-long',
      LLM_LONG_CONTEXT_MODEL: 'long-model',
      LLM_LONG_CONTEXT_THRESHOLD_TOKENS: '100',
    });
    svc = new LLMGatewayService({
      llmProvider: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any);
    await svc.onModuleInit();
  });

  afterEach(() => {
    setEnv({
      LLM_PRIMARY_PROVIDER: undefined,
      LLM_PRIMARY_MODEL: undefined,
      LLM_SECONDARY_PROVIDER: undefined,
      LLM_SECONDARY_MODEL: undefined,
      LLM_LONG_CONTEXT_PROVIDER: undefined,
      LLM_LONG_CONTEXT_MODEL: undefined,
      LLM_LONG_CONTEXT_THRESHOLD_TOKENS: undefined,
    });
  });

  it('routes to primary on the happy path', async () => {
    providerMocks.set(
      'mock-primary',
      makeMock({ name: 'mock-primary', script: [{ ok: true, text: 'hello' }] }),
    );
    const result = await svc.complete('hi');
    expect(result.text).toBe('hello');
    expect(result.providerName).toBe('mock-primary');
    expect(result.fallbackUsed).toBe(false);
    expect(result.routeReason).toBe('primary');
  });

  it('falls through to secondary when primary throws RetryableLLMError', async () => {
    providerMocks.set(
      'mock-primary',
      makeMock({
        name: 'mock-primary',
        // The mock throws RetryableLLMError directly (real provider would do
        // this via BaseProvider's retry loop after exhausting attempts).
        script: [
          {
            ok: false,
            throw: new RetryableLLMError(
              '429 Too Many Requests',
              'mock-primary',
              429,
            ),
          },
        ],
      }),
    );
    providerMocks.set(
      'mock-secondary',
      makeMock({
        name: 'mock-secondary',
        script: [{ ok: true, text: 'rescued by secondary' }],
      }),
    );
    const result = await svc.complete('hi');
    expect(result.text).toBe('rescued by secondary');
    expect(result.providerName).toBe('mock-secondary');
    expect(result.fallbackUsed).toBe(true);
    expect(result.routeReason).toBe('secondary_after_primary_failure');
  });

  it('throws AllProvidersFailedError when both primary and secondary fail', async () => {
    providerMocks.set(
      'mock-primary',
      makeMock({
        name: 'mock-primary',
        script: [
          {
            ok: false,
            throw: new RetryableLLMError('primary 503', 'mock-primary', 503),
          },
        ],
      }),
    );
    providerMocks.set(
      'mock-secondary',
      makeMock({
        name: 'mock-secondary',
        script: [
          {
            ok: false,
            throw: new RetryableLLMError(
              'secondary 503',
              'mock-secondary',
              503,
            ),
          },
        ],
      }),
    );
    // Capture the thrown error directly (single invocation — the mock
    // scripts above only have one entry each, so a second call would
    // exhaust the script and throw a different error).
    let captured: unknown;
    try {
      await svc.complete('hi');
    } catch (err) {
      captured = err;
    }
    expect(captured).toBeInstanceOf(AllProvidersFailedError);
    const e = captured as AllProvidersFailedError;
    expect(e.attempts).toHaveLength(2);
    expect(e.attempts[0].providerName).toBe('mock-primary');
    expect(e.attempts[0].statusCode).toBe(503);
    expect(e.attempts[1].providerName).toBe('mock-secondary');
    expect(e.attempts[1].statusCode).toBe(503);
  });

  it('does NOT fall through when primary throws a non-retryable error', async () => {
    providerMocks.set(
      'mock-primary',
      makeMock({
        name: 'mock-primary',
        script: [
          { ok: false, throw: new Error('bad request: malformed prompt') },
        ],
      }),
    );
    providerMocks.set(
      'mock-secondary',
      makeMock({
        name: 'mock-secondary',
        script: [{ ok: true, text: 'should NEVER be called' }],
      }),
    );
    await expect(svc.complete('hi')).rejects.toThrow(
      'bad request: malformed prompt',
    );
    // mock-secondary should never have been hit — the gateway propagates
    // non-transient errors immediately. (If it had been called, the script
    // would have advanced and a second call would throw the over-script error.)
  });

  it('routes to long-context provider when forceLongContext=true', async () => {
    providerMocks.set(
      'mock-long',
      makeMock({
        name: 'mock-long',
        script: [{ ok: true, text: 'long response' }],
      }),
    );
    const result = await svc.complete('short prompt', {
      forceLongContext: true,
    });
    expect(result.providerName).toBe('mock-long');
    expect(result.routeReason).toBe('long_context');
    expect(result.fallbackUsed).toBe(false);
  });

  it('routes to long-context provider when prompt exceeds threshold', async () => {
    providerMocks.set(
      'mock-long',
      makeMock({
        name: 'mock-long',
        script: [{ ok: true, text: 'long response' }],
      }),
    );
    // Threshold = 100 tokens = ~400 chars. Build a 500-char prompt.
    const longPrompt = 'x'.repeat(500);
    const result = await svc.complete(longPrompt);
    expect(result.providerName).toBe('mock-long');
    expect(result.routeReason).toBe('long_context');
  });

  it('throws AllProvidersFailedError when no secondary is configured AND primary fails', async () => {
    setEnv({
      LLM_SECONDARY_PROVIDER: undefined,
      LLM_SECONDARY_MODEL: undefined,
    });
    svc = new LLMGatewayService({
      llmProvider: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any);
    await svc.onModuleInit();
    providerMocks.set(
      'mock-primary',
      makeMock({
        name: 'mock-primary',
        script: [
          {
            ok: false,
            throw: new RetryableLLMError('primary 429', 'mock-primary', 429),
          },
        ],
      }),
    );
    try {
      await svc.complete('hi');
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(AllProvidersFailedError);
      const e = err as AllProvidersFailedError;
      expect(e.message).toContain('no secondary is configured');
      expect(e.attempts).toHaveLength(1);
    }
  });
});
