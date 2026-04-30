// QA Nexus PM1 — Day-4 afternoon hotfix regression test.
//
// Verifies EmbeddingService stays graceful when the model load fails
// (e.g., sharp native binary missing on Render Linux x64, OOM on 512
// MB free dyno, network issue fetching ONNX). Pre-hotfix, the .catch
// just logged the error — there was no `deferred` flag visible to
// /health, so /health continued reporting embedding `down` and
// UptimeRobot would alert.
// Post-hotfix, the service flips `deferred=true` + surfaces the
// reason via status() so /health can return 200 with a clear
// "deferred" subsystem readout.

import { EmbeddingService } from '../embedding.service';

describe('EmbeddingService — graceful deferred mode', () => {
  it('starts in deferred mode (model not yet loaded)', () => {
    const svc = new EmbeddingService();
    const status = svc.status();
    expect(status.deferred).toBe(true);
    expect(status.deferredReason).toMatch(/loading on bootstrap/i);
    expect(status.warm).toBe(false);
  });

  it('flips to deferred=true with reason when loadModel rejects', async () => {
    const svc = new EmbeddingService();
    // Override loadModel to simulate sharp/xenova failure (this is the
    // exact path that crashed Render before the hotfix). Cast through
    // unknown because loadModel is private.
    (svc as unknown as { loadModel: () => Promise<never> }).loadModel = () =>
      Promise.reject(
        new Error('Cannot find module ../build/Release/sharp-linux-x64.node'),
      );

    // Trigger the same code path NestJS triggers at bootstrap.
    svc.onModuleInit();
    // The rejection is fire-and-forget, but we can wait for the next
    // microtask cycle to let the .catch handler run.
    await new Promise((resolve) => setImmediate(resolve));

    const status = svc.status();
    expect(status.deferred).toBe(true);
    expect(status.deferredReason).toMatch(/sharp-linux-x64/);
    expect(status.warm).toBe(false);
  });

  it('status() shape includes deferred + deferredReason fields', () => {
    const svc = new EmbeddingService();
    const status = svc.status();
    expect(status).toEqual(
      expect.objectContaining({
        warm: expect.any(Boolean),
        modelId: expect.any(String),
        deferred: expect.any(Boolean),
        deferredReason: expect.anything(), // string | null
      }),
    );
  });
});

// Mock node:v8 BEFORE importing the SUT so the import binding picks up
// the mock. jest.requireActual preserves all other v8 exports.
jest.mock('node:v8', () => ({
  ...jest.requireActual('node:v8'),
  getHeapStatistics: jest.fn(() => ({
    // Default: pretend we're on a comfortably-large dyno so the
    // memory guard always allows. Override per-test for guard
    // assertions.
    heap_size_limit: 4096 * 1024 * 1024,
  })),
}));
import { getHeapStatistics as mockedGetHeapStatistics } from 'node:v8';

describe('EmbeddingService — pre-flight memory guard (Day-4 afternoon, ADR-003 amendment)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('refuses to load bge-large (470 MB) on a 512 MB dyno → deferred with clear reason', () => {
    process.env.EMBEDDING_MODEL_ID = 'Xenova/bge-large-en-v1.5';
    // Simulate Render Free 512 MB dyno — V8 heap_size_limit ≈ 512 MB.
    (mockedGetHeapStatistics as jest.Mock).mockReturnValue({
      heap_size_limit: 512 * 1024 * 1024,
    });
    const svc = new EmbeddingService();
    svc.onModuleInit();
    const status = svc.status();
    expect(status.deferred).toBe(true);
    expect(status.deferredReason).toMatch(/exceeds safe budget/);
    expect(status.deferredReason).toMatch(/bge-large/);
    expect(status.warm).toBe(false);
  });

  it('allows bge-small (33 MB) on a 512 MB dyno → proceeds to load', async () => {
    process.env.EMBEDDING_MODEL_ID = 'Xenova/bge-small-en-v1.5';
    (mockedGetHeapStatistics as jest.Mock).mockReturnValue({
      heap_size_limit: 512 * 1024 * 1024,
    });
    const svc = new EmbeddingService();
    // Override loadModel so the test doesn't actually fetch from HF.
    (svc as unknown as { loadModel: () => Promise<unknown> }).loadModel = () =>
      new Promise(() => {
        /* never resolves — we just want to confirm the guard didn't refuse */
      });
    svc.onModuleInit();
    await new Promise((resolve) => setImmediate(resolve));
    const status = svc.status();
    // Guard passed → service proceeds to load (still deferred until model
    // resolves, but the deferredReason is the "loading on bootstrap" one,
    // NOT the memory-guard refusal.
    expect(status.deferredReason).not.toMatch(/exceeds safe budget/);
  });

  it('allows unknown models with a warning (forward-compat for new models)', () => {
    process.env.EMBEDDING_MODEL_ID =
      'Xenova/some-future-model-not-yet-measured';
    (mockedGetHeapStatistics as jest.Mock).mockReturnValue({
      heap_size_limit: 512 * 1024 * 1024,
    });
    const svc = new EmbeddingService();
    (svc as unknown as { loadModel: () => Promise<unknown> }).loadModel = () =>
      new Promise(() => {});
    svc.onModuleInit();
    const status = svc.status();
    // Unknown model → guard allows with warning, NOT the memory-guard
    // refusal reason.
    expect(status.deferredReason).not.toMatch(/exceeds safe budget/);
  });
});
