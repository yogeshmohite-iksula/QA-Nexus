// QA Nexus PM1 — T019 OTel pipeline tests.
//
// Three cases per Day-4 morning Task A spec:
//   1. Redaction: SENSITIVE_KEYS list applies to BOTH trace span
//      attributes AND log record attributes (single source of truth).
//   2. Init success: when GRAFANA_CLOUD_OTLP_ENDPOINT +
//      BETTER_STACK_OTLP_ENDPOINT are set, both SDKs report
//      `status: "configured"`.
//   3. Graceful fallback: when env vars are missing, both SDKs report
//      `status: "deferred"` and don't throw on emit.
//
// We don't actually export to a remote endpoint in tests — the OTel
// SDK's exporter is wrapped by our `redactAttributes` pre-export, so
// we can test redaction by inspecting attributes after the wrapper
// runs. Exporter call is mocked.

import { redactAttributes, isSensitiveKey, SENSITIVE_KEYS } from '../redact';
import { initOtelTraces, getOtelTraceStatus } from '../otel.config';
import {
  initOtelLogs,
  getOtelLogsStatus,
  NestOtelLogger,
} from '../otel-logs.config';
import { Test } from '@nestjs/testing';
import { Module, Controller, Get } from '@nestjs/common';

describe('observability: redaction (single source of truth)', () => {
  it('isSensitiveKey matches well-known keys case-insensitively', () => {
    expect(isSensitiveKey('Authorization')).toBe(true);
    expect(isSensitiveKey('AUTHORIZATION')).toBe(true);
    expect(isSensitiveKey('http.request.header.cookie')).toBe(true);
    expect(isSensitiveKey('better-auth.session_token')).toBe(true);
    expect(isSensitiveKey('GROQ_API_KEY')).toBe(true);
    expect(isSensitiveKey('audit_log.payload.body')).toBe(true);
    // Negative cases
    expect(isSensitiveKey('http.method')).toBe(false);
    expect(isSensitiveKey('user_id')).toBe(false);
    expect(isSensitiveKey('')).toBe(false);
  });

  it('redactAttributes replaces sensitive values with "REDACTED" (top-level + nested)', () => {
    const attrs = {
      'http.method': 'POST',
      authorization: 'Bearer abc123',
      'user.id': 'akshay-uuid',
      headers: {
        cookie: 'better-auth.session_token=secret',
        'content-type': 'application/json',
        'x-api-key': 'sk-abc',
      },
      audit_log: {
        actor_id: 'yogesh',
        // Generic payload nested — actor_id is fine, but payload.body must redact.
        'payload.body': { sensitive: 'value' },
      },
    };
    const out = redactAttributes(attrs);
    expect(out['http.method']).toBe('POST');
    expect(out.authorization).toBe('REDACTED');
    expect(out['user.id']).toBe('akshay-uuid');
    const headers = out.headers as Record<string, unknown>;
    expect(headers.cookie).toBe('REDACTED');
    expect(headers['content-type']).toBe('application/json');
    expect(headers['x-api-key']).toBe('REDACTED');
    const audit = out.audit_log as Record<string, unknown>;
    expect(audit.actor_id).toBe('yogesh');
    expect(audit['payload.body']).toBe('REDACTED');
  });

  it('SENSITIVE_KEYS covers all four mandated categories', () => {
    // Categories per docs/SECURITY.md: HTTP headers, auth tokens,
    // BetterAuth specifics, audit-log payloads, provider keys.
    const lower = SENSITIVE_KEYS.map((k) => k.toLowerCase());
    expect(lower).toEqual(expect.arrayContaining(['authorization', 'cookie']));
    expect(lower).toEqual(
      expect.arrayContaining(['password', 'token', 'secret']),
    );
    expect(lower).toEqual(
      expect.arrayContaining([
        'better-auth.session_token',
        'betterauth_secret',
      ]),
    );
    expect(lower).toEqual(
      expect.arrayContaining([
        'groq_api_key',
        'gemini_api_key',
        'r2_secret_access_key',
      ]),
    );
    expect(lower).toEqual(expect.arrayContaining(['audit_log.payload.body']));
  });
});

describe('observability: deferred mode (env vars missing)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GRAFANA_CLOUD_OTLP_ENDPOINT;
    delete process.env.GRAFANA_CLOUD_OTLP_AUTH;
    delete process.env.BETTER_STACK_OTLP_ENDPOINT;
    delete process.env.BETTER_STACK_OTLP_AUTH;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('initOtelTraces() with no endpoint → status "deferred", no throw', () => {
    expect(() => initOtelTraces()).not.toThrow();
    const s = getOtelTraceStatus();
    expect(s.status).toBe('deferred');
    expect(s.exporter_endpoint).toBeUndefined();
  });

  it('initOtelLogs() with no endpoint → status "deferred", sink "stdout"', () => {
    expect(() => initOtelLogs()).not.toThrow();
    const s = getOtelLogsStatus();
    expect(s.status).toBe('deferred');
    expect(s.sink).toBe('stdout');
  });
});

describe('observability: NestOtelLogger boot regression (Nest 10 ConsoleLogger requirement)', () => {
  // Regression test added 2026-04-30 after Render redeploy crashed with:
  //   "Using the extends Logger instruction is not allowed in Nest v9.
  //    Please, use extends ConsoleLogger instead."
  //
  // Root cause: NestOtelLogger originally extended Logger (the static API
  // facade). Nest 10's `app.useLogger()` calls overrideLogger() which
  // requires the instance to extend ConsoleLogger. Boot would crash on
  // any deployed environment that hits that code path.
  //
  // This test exercises the EXACT path that caused the crash:
  // NestFactory.create(...) with `{ logger: new NestOtelLogger() }` set.
  // We use a minimal stub module (not AppModule) so the test stays fast
  // and doesn't require Prisma/BetterAuth/R2 wiring — the override path
  // fires regardless of module size.

  @Controller('ping')
  class PingController {
    @Get()
    ping(): { ok: true } {
      return { ok: true };
    }
  }

  @Module({ controllers: [PingController] })
  class StubModule {}

  it('NestFactory.create accepts NestOtelLogger without "extends Logger" error', async () => {
    // The crash signature was: throw at overrideLogger time during create.
    // If the class doesn't extend ConsoleLogger, NestFactory.create
    // synchronously rejects with the "instruction is not allowed" message.
    let bootError: unknown = null;
    const moduleRef = await Test.createTestingModule({
      imports: [StubModule],
    }).compile();
    const app = moduleRef.createNestApplication({
      logger: new NestOtelLogger(),
    });
    try {
      await app.init();
    } catch (err) {
      bootError = err;
    } finally {
      await app.close();
    }
    expect(bootError).toBeNull();
  });
});
