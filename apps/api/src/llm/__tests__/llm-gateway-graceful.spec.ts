// QA Nexus PM1 — Day-4 afternoon hotfix regression test.
//
// Verifies LLMGatewayService boots gracefully when LLM_PRIMARY_PROVIDER
// env var is missing. Pre-hotfix, Render redeploy crashed at boot:
//   Bootstrap failed: Error: LLM_PRIMARY_PROVIDER env var is required
// Post-hotfix, the service logs a warning + sets `deferred=true`;
// /llm/* throws 501 with admin-friendly message; /health surfaces the
// deferred state instead of returning 503.
//
// Matches the pattern R2Service + EmailService already follow.

import { HttpException } from '@nestjs/common';
import { LLMGatewayService } from '../llm-gateway.service';

describe('LLMGatewayService — graceful deferred mode', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('onModuleInit does NOT throw when LLM_PRIMARY_PROVIDER is unset', () => {
    delete process.env.LLM_PRIMARY_PROVIDER;
    const svc = new LLMGatewayService();
    expect(() => svc.onModuleInit()).not.toThrow();
    expect(svc.deferred).toBe(true);
    expect(svc.deferredReason).toMatch(/LLM_PRIMARY_PROVIDER/);
  });

  it('complete() in deferred mode throws 501 with admin-friendly message', async () => {
    delete process.env.LLM_PRIMARY_PROVIDER;
    const svc = new LLMGatewayService();
    svc.onModuleInit();
    let caught: unknown = null;
    try {
      await svc.complete('test prompt');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(HttpException);
    const exc = caught as HttpException;
    expect(exc.getStatus()).toBe(501);
    expect(exc.message).toMatch(/F26 UI/);
  });

  it('onModuleInit succeeds normally when LLM_PRIMARY_PROVIDER is set', () => {
    process.env.LLM_PRIMARY_PROVIDER = 'groq';
    process.env.LLM_PRIMARY_MODEL = 'openai/gpt-oss-120b';
    const svc = new LLMGatewayService();
    expect(() => svc.onModuleInit()).not.toThrow();
    expect(svc.deferred).toBe(false);
    expect(svc.deferredReason).toBeNull();
    const cfg = svc.getConfig();
    expect(cfg).not.toBeNull();
    expect(cfg!.primaryProvider).toBe('groq');
  });

  it('getConfig() returns null in deferred mode', () => {
    delete process.env.LLM_PRIMARY_PROVIDER;
    const svc = new LLMGatewayService();
    svc.onModuleInit();
    expect(svc.getConfig()).toBeNull();
  });
});
