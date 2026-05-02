// QA Nexus PM1 — OpenTelemetry logs SDK + NestJS Logger bridge.
//
// Spec: T019 (M0 backlog) + Day-4 morning Yogesh decision (Path 2,
// pure-OTel pipeline, no pino — keeps `.claude/rules/api.md` rule
// "no third-party logger transports" intact).
//
// Better Stack accepts OTel logs ingest natively (their docs as of
// Q1 2026 list "OpenTelemetry source" as the primary path going
// forward; older Pino-transport guides are now flagged as legacy).
//
// Architecture:
//   1. LoggerProvider (SDK) with OTLPLogExporter pointed at Better
//      Stack's OTLP endpoint.
//   2. A NestJS LoggerService implementation that, in addition to
//      the usual stdout write, emits a LogRecord through the OTel
//      logger so the SDK ships it via OTLP.
//   3. Same `redactAttributes` from `redact.ts` applied before any
//      log record leaves the process (single source of truth for
//      sensitive-key list).
//
// Deferred mode: when BETTER_STACK_OTLP_ENDPOINT is unset, the
// LoggerProvider is NOT started. NestLogger falls back to plain
// stdout. /health reports `logs.exporter = "deferred"`,
// `logs.sink = "stdout"`. Lets the API ship before T019 dashboard
// provisioning lands.

// IMPORTANT: extend ConsoleLogger (instance class) — NOT Logger (static API
// facade). Nest 10's `app.useLogger()` calls overrideLogger() which checks
// `instance instanceof ConsoleLogger`. Extending Logger triggers
// "Using the extends Logger instruction is not allowed in Nest v9"
// at boot. Verified by Render redeploy crash 2026-04-30.
import { ConsoleLogger, LoggerService, LogLevel } from '@nestjs/common';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs as otelLogs, SeverityNumber } from '@opentelemetry/api-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { redactAttributes } from './redact';

// Semantic-conventions attribute keys (inlined — see otel.config.ts).
const ATTR_SERVICE_NAME = 'service.name';
const ATTR_SERVICE_VERSION = 'service.version';
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name';

interface OtelLogsStatus {
  status: 'configured' | 'deferred' | 'error';
  exporter_endpoint?: string;
  /** "better_stack" when OTLP endpoint reaches Better Stack; "stdout"
   *  in deferred mode (still useful for local dev + Render web logs). */
  sink: 'better_stack' | 'stdout';
  last_export_at?: string;
  error?: string;
  /** Diagnostic: which env vars were present at init time. Lets ops
   *  triage "why is this deferred" without server-side log access.
   *  Boolean only — never the actual value. */
  env_present?: {
    BETTER_STACK_OTLP_ENDPOINT: boolean;
    BETTER_STACK_OTLP_AUTH: boolean;
  };
  deferred_reason?: string;
}

let _status: OtelLogsStatus = { status: 'deferred', sink: 'stdout' };
let _provider: LoggerProvider | undefined;

export function getOtelLogsStatus(): OtelLogsStatus {
  return { ..._status };
}

/**
 * Initialize the OTel logs SDK. Call ONCE at bootstrap before
 * NestFactory.create. Idempotent.
 */
export function initOtelLogs(): void {
  if (_provider) return;

  const endpoint = process.env.BETTER_STACK_OTLP_ENDPOINT;
  const auth = process.env.BETTER_STACK_OTLP_AUTH;

  const env_present = {
    BETTER_STACK_OTLP_ENDPOINT: !!endpoint,
    BETTER_STACK_OTLP_AUTH: !!auth,
  };

  if (!endpoint) {
    _status = {
      status: 'deferred',
      sink: 'stdout',
      env_present,
      deferred_reason:
        'BETTER_STACK_OTLP_ENDPOINT env var missing on this dyno. Set in ' +
        'Render env editor; redeploy. See docs/deploy/better-stack-runbook.md.',
    };
    return;
  }
  if (!auth) {
    _status = {
      status: 'deferred',
      sink: 'stdout',
      env_present,
      deferred_reason:
        'BETTER_STACK_OTLP_ENDPOINT is set but BETTER_STACK_OTLP_AUTH is ' +
        'missing. Better Stack OTLP requires Bearer token from the source ' +
        'Connect panel. Set BETTER_STACK_OTLP_AUTH + redeploy.',
    };
    return;
  }

  try {
    const exporter = new OTLPLogExporter({
      url: `${endpoint.replace(/\/$/, '')}/v1/logs`,
      headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
    });

    // Wrap export to track last-export timestamp + redact attributes.
    const originalExport = exporter.export.bind(exporter);
    exporter.export = (records, resultCallback) => {
      for (const r of records) {
        if (r.attributes) {
          const redacted = redactAttributes(
            r.attributes as Record<string, unknown>,
          );
          Object.keys(r.attributes).forEach((k) => {
            delete (r.attributes as Record<string, unknown>)[k];
          });
          Object.assign(r.attributes, redacted);
        }
      }
      _status = {
        ..._status,
        status: 'configured',
        sink: 'better_stack',
        exporter_endpoint: endpoint,
        last_export_at: new Date().toISOString(),
      };
      return originalExport(records, resultCallback);
    };

    const provider = new LoggerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'qa-nexus-api',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.1',
        [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]:
          process.env.NODE_ENV ?? 'development',
      }),
      processors: [new BatchLogRecordProcessor(exporter)],
    });

    otelLogs.setGlobalLoggerProvider(provider);
    _provider = provider;
    _status = {
      status: 'configured',
      sink: 'better_stack',
      exporter_endpoint: endpoint,
      env_present,
    };
  } catch (err) {
    _status = {
      status: 'error',
      sink: 'stdout',
      error: err instanceof Error ? err.message : String(err),
      env_present,
    };
  }
}

export async function shutdownOtelLogs(): Promise<void> {
  if (_provider) {
    await _provider.shutdown();
    _provider = undefined;
  }
}

/**
 * NestJS LoggerService that pipes through OTel logs (when configured)
 * AND keeps NestJS's native stdout output for local dev + Render web
 * logs. Replaces NestJS default Logger via `app.useLogger()`.
 *
 * IMPORTANT: this class extends the built-in NestJS Logger, so the
 * `.claude/rules/api.md` "use NestJS Logger + OTel" rule is satisfied.
 * No third-party logger lib (no pino, no winston).
 */
export class NestOtelLogger extends ConsoleLogger implements LoggerService {
  private readonly otelLogger = otelLogs.getLogger('qa-nexus-api', '0.0.1');

  override log(message: unknown, context?: string): void {
    super.log(message as string, context);
    this.emit(SeverityNumber.INFO, 'log', message, context);
  }
  override warn(message: unknown, context?: string): void {
    super.warn(message as string, context);
    this.emit(SeverityNumber.WARN, 'warn', message, context);
  }
  override error(message: unknown, stack?: string, context?: string): void {
    super.error(message as string, stack, context);
    this.emit(SeverityNumber.ERROR, 'error', message, context, { stack });
  }
  override debug(message: unknown, context?: string): void {
    super.debug?.(message as string, context);
    this.emit(SeverityNumber.DEBUG, 'debug', message, context);
  }
  override verbose(message: unknown, context?: string): void {
    super.verbose?.(message as string, context);
    this.emit(SeverityNumber.TRACE, 'verbose', message, context);
  }

  private emit(
    severity: SeverityNumber,
    levelText: LogLevel,
    body: unknown,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    if (!_provider) return; // deferred mode — stdout-only
    const redacted = redactAttributes({
      'log.level': levelText,
      'log.context': context,
      ...(extra ?? {}),
    });
    // Coerce to OTel AnyValueMap shape — primitives only at the leaf.
    // Non-serializable values get JSON.stringify'd; null/undefined drop.
    const attributes: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(redacted)) {
      if (v == null) continue;
      if (
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean'
      ) {
        attributes[k] = v;
      } else {
        attributes[k] = JSON.stringify(v);
      }
    }
    this.otelLogger.emit({
      severityNumber: severity,
      severityText: levelText.toUpperCase(),
      body: typeof body === 'string' ? body : JSON.stringify(body),
      attributes,
      timestamp: Date.now(),
    });
  }
}
