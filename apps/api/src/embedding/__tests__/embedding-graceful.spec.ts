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
