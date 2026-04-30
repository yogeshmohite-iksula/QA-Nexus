// Unit tests for BaseProvider — the retry-with-backoff + health-tracking
// kernel that every concrete LLM adapter inherits.
//
// Spec: MS0-T023. Covers:
//   1. happy path: callProvider succeeds → status=up + lastSuccessAt set
//   2. transient (429) once → retry succeeds (BaseProvider absorbs)
//   3. transient (503) twice → throws RetryableLLMError + status=down
//   4. non-transient error → bubbles immediately (no retry)
//   5. isTransientError detects status from .status / .statusCode / .response.status
//   6. isTransientError ignores non-429/503 codes
//   7. healthCheck returns true on success, false on failure
//   8. lastSuccessAt persists across a later failure record
//
// Strategy: subclass BaseProvider with a scripted callProvider so we can
// drive each scenario from the test. Uses REAL timers — fake timers race
// with promise-rejection microtasks (jest.runAllTimersAsync does not flush
// catch handlers reliably). The 1s backoff × ~2 retrying tests = ~2s
// overhead, acceptable.
import { BaseProvider } from '../providers/base.provider';
import { LLMOptions, LLMResult, RetryableLLMError } from '../types';

class TestProvider extends BaseProvider {
  readonly name = 'test';
  readonly defaultModel = 'test-model';
  public script: Array<
    | { kind: 'ok'; result?: Partial<LLMResult> }
    | { kind: 'throw'; err: unknown }
  > = [];
  public calls = 0;

  protected async callProvider(
    _prompt: string,
    _opts: LLMOptions,
  ): Promise<LLMResult> {
    this.calls++;
    const step = this.script.shift();
    if (!step)
      throw new Error(
        `test setup: no more scripted steps (call #${this.calls})`,
      );
    if (step.kind === 'throw') throw step.err;
    return {
      text: 'pong',
      providerName: this.name,
      modelUsed: 'test-model',
      tokensIn: 1,
      tokensOut: 1,
      latencyMs: 0,
      fallbackUsed: false,
      cost: 0,
      routeReason: 'primary',
      ...(step.result ?? {}),
    };
  }
}

describe('BaseProvider', () => {
  it('happy path: success → marks status=up + sets lastSuccessAt', async () => {
    const p = new TestProvider();
    p.script = [{ kind: 'ok' }];
    const r = await p.complete('hi');
    expect(r.text).toBe('pong');
    expect(r.providerName).toBe('test');
    expect(typeof r.latencyMs).toBe('number');
    const h = p.getHealth();
    expect(h.status).toBe('up');
    expect(h.lastSuccessAt).not.toBeNull();
    expect(h.lastFailureAt).toBeNull();
    expect(p.calls).toBe(1);
  });

  it('transient (429) once → retry succeeds (call count=2)', async () => {
    const p = new TestProvider();
    p.script = [
      { kind: 'throw', err: { status: 429, message: 'rate-limited' } },
      { kind: 'ok' },
    ];
    const r = await p.complete('hi');
    expect(r.text).toBe('pong');
    expect(p.calls).toBe(2);
    expect(p.getHealth().status).toBe('up');
  });

  it('transient (503) twice → throws RetryableLLMError + status=down', async () => {
    const p = new TestProvider();
    p.script = [
      { kind: 'throw', err: { status: 503, message: 'unavailable-1' } },
      { kind: 'throw', err: { status: 503, message: 'unavailable-2' } },
    ];
    await expect(p.complete('hi')).rejects.toBeInstanceOf(RetryableLLMError);
    expect(p.calls).toBe(2);
    expect(p.getHealth().status).toBe('down');
    // Plain-object errors stringify as "[object Object]" via String(err) — what
    // matters is that *some* failure message was captured, not the exact text.
    // Real provider SDKs throw Error subclasses where .message is meaningful;
    // see the "lastSuccessAt is preserved" test for the Error-instance path.
    expect(p.getHealth().lastFailureMessage).not.toBeNull();
  });

  it('non-transient error → bubbles immediately, NO retry', async () => {
    const p = new TestProvider();
    p.script = [
      { kind: 'throw', err: { status: 400, message: 'bad request' } },
    ];
    await expect(p.complete('hi')).rejects.toEqual(
      expect.objectContaining({ status: 400 }),
    );
    expect(p.calls).toBe(1);
    expect(p.getHealth().status).toBe('down');
  });

  it('explicit RetryableLLMError throw → treated as transient + retried', async () => {
    const p = new TestProvider();
    p.script = [
      { kind: 'throw', err: new RetryableLLMError('boom', 'test', 503) },
      { kind: 'ok' },
    ];
    const r = await p.complete('hi');
    expect(r.text).toBe('pong');
    expect(p.calls).toBe(2);
  });

  it('isTransientError reads from .status, .statusCode, and .response.status', () => {
    const p = new TestProvider();
    const isT = (err: unknown) => (p as any).isTransientError(err);
    expect(isT({ status: 429 })).toBe(true);
    expect(isT({ statusCode: 503 })).toBe(true);
    expect(isT({ response: { status: 429 } })).toBe(true);
    expect(isT({ status: 500 })).toBe(false);
    expect(isT({ status: 400 })).toBe(false);
    expect(isT(null)).toBe(false);
    expect(isT('string-error')).toBe(false);
    expect(isT(new RetryableLLMError('x', 'p', 429))).toBe(true);
  });

  it('healthCheck() returns true on success', async () => {
    const p = new TestProvider();
    p.script = [{ kind: 'ok' }];
    const ok = await p.healthCheck();
    expect(ok).toBe(true);
    expect(p.getHealth().status).toBe('up');
  });

  it('healthCheck() returns false on failure', async () => {
    const p = new TestProvider();
    // Plain Error is non-transient → callProvider throws → catch sets failure → returns false.
    p.script = [{ kind: 'throw', err: new Error('boom') }];
    const ok = await p.healthCheck();
    expect(ok).toBe(false);
    expect(p.getHealth().status).toBe('down');
  });

  it('lastSuccessAt is preserved when a later failure overwrites status', async () => {
    const p = new TestProvider();
    p.script = [{ kind: 'ok' }];
    await p.complete('hi');
    const successAt = p.getHealth().lastSuccessAt;
    expect(successAt).not.toBeNull();

    // Second call: non-retryable failure (Error has no .status field).
    p.script = [{ kind: 'throw', err: new Error('hard') }];
    await expect(p.complete('hi')).rejects.toThrow('hard');
    const h = p.getHealth();
    expect(h.status).toBe('down');
    // Critical: lastSuccessAt is preserved so /health can show "last seen up at X".
    expect(h.lastSuccessAt).toBe(successAt);
    expect(h.lastFailureAt).not.toBeNull();
    expect(h.lastFailureMessage).toBe('hard');
  });
});
