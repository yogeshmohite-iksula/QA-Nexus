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

  it('onModuleInit does NOT throw when LLM_PRIMARY_PROVIDER + DB are both empty (env-first then DB-fallback per ADR-015)', async () => {
    delete process.env.LLM_PRIMARY_PROVIDER;
    const svc = new LLMGatewayService({
      llmProvider: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any);
    await expect(svc.onModuleInit()).resolves.not.toThrow();
    expect(svc.deferred).toBe(true);
    expect(svc.deferredReason).toMatch(/LLM_PRIMARY_PROVIDER/);
    expect(svc.configSource).toBe('none');
  });

  it('complete() in deferred mode throws 501 with admin-friendly message', async () => {
    delete process.env.LLM_PRIMARY_PROVIDER;
    const svc = new LLMGatewayService({
      llmProvider: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any);
    await svc.onModuleInit();
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

  it('onModuleInit succeeds via env path when LLM_PRIMARY_PROVIDER is set', async () => {
    process.env.LLM_PRIMARY_PROVIDER = 'groq';
    process.env.LLM_PRIMARY_MODEL = 'openai/gpt-oss-120b';
    const svc = new LLMGatewayService({
      llmProvider: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any);
    await svc.onModuleInit();
    expect(svc.deferred).toBe(false);
    expect(svc.deferredReason).toBeNull();
    expect(svc.configSource).toBe('env');
    const cfg = svc.getConfig();
    expect(cfg).not.toBeNull();
    expect(cfg!.primaryProvider).toBe('groq');
  });

  it('getConfig() returns null in deferred mode', async () => {
    delete process.env.LLM_PRIMARY_PROVIDER;
    const svc = new LLMGatewayService({
      llmProvider: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any);
    await svc.onModuleInit();
    expect(svc.getConfig()).toBeNull();
  });

  it('does NOT require BETTER_AUTH_SECRET when DB has no provider row (CI regression — PR #115)', async () => {
    // Pre-fix: readConfigFromDb threw "BETTER_AUTH_SECRET env var is
    // required..." even when there was no row to decrypt — masking the
    // real "no provider configured" deferredReason. CI envs rightly
    // lack BETTER_AUTH_SECRET; the service must not require it just
    // to decide "DB is empty, fall through to deferred".
    delete process.env.LLM_PRIMARY_PROVIDER;
    delete process.env.BETTER_AUTH_SECRET;
    const findFirst = jest.fn().mockResolvedValue(null);
    const svc = new LLMGatewayService({ llmProvider: { findFirst } } as any);
    await svc.onModuleInit();
    expect(svc.deferred).toBe(true);
    // The deferred reason must mention LLM_PRIMARY_PROVIDER (the actual
    // root cause), NOT BETTER_AUTH_SECRET (which we don't need without
    // a row to decrypt).
    expect(svc.deferredReason).toMatch(/LLM_PRIMARY_PROVIDER/);
    expect(svc.deferredReason).not.toMatch(/BETTER_AUTH_SECRET/);
    expect(svc.configSource).toBe('none');
    expect(findFirst).toHaveBeenCalledTimes(1);
  });

  it('DOES require BETTER_AUTH_SECRET when DB has a provider row (deferred + actionable error)', async () => {
    // Mirror case: when there IS a row to decrypt, the missing seed
    // becomes a real operator error — surfaced as the deferred reason
    // so an operator can act on it.
    delete process.env.LLM_PRIMARY_PROVIDER;
    delete process.env.BETTER_AUTH_SECRET;
    const findFirst = jest.fn().mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      providerKind: 'groq',
      apiKeyEncrypted: 'fake.fake.fake',
      models: [],
    });
    const svc = new LLMGatewayService({ llmProvider: { findFirst } } as any);
    await svc.onModuleInit();
    expect(svc.deferred).toBe(true);
    expect(svc.deferredReason).toMatch(/BETTER_AUTH_SECRET/);
    expect(svc.deferredReason).toMatch(/llm_providers row exists/);
    expect(svc.configSource).toBe('none');
  });
});
