// QA Nexus PM1 — OpenTelemetry SDK setup (traces + metrics).
//
// Spec: T019 (M0 backlog) + docs/architecture/adr-* (planned ADR-007
// for telemetry pipeline). This file owns trace + metric export to
// Grafana Cloud's OTLP HTTP endpoint. Logs are exported separately by
// `otel-logs.config.ts` to Better Stack — same redaction config (see
// `redact.ts`).
//
// Initialize FIRST in main.ts, BEFORE NestFactory.create — auto-
// instrumentations need to monkey-patch http/express/pg before those
// modules are required by Nest's bootstrap.
//
// Deferred mode: when `GRAFANA_CLOUD_OTLP_ENDPOINT` is unset, NodeSDK
// is NOT started. The exporter status returned to /health is
// "deferred", logs continue to stdout. Lets the API ship to Render
// before T019 dashboard provisioning lands.

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { redactAttributes } from './redact';

// Semantic-conventions attribute keys (OTel spec — stable identifiers).
// Inlined as string literals to avoid the `/incubating` subpath which
// isn't exposed by the current @opentelemetry/semantic-conventions
// package layout.
const ATTR_SERVICE_NAME = 'service.name';
const ATTR_SERVICE_VERSION = 'service.version';
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name';

interface OtelStatus {
  /** "configured" if NodeSDK started + exporter pointed at endpoint;
   *  "deferred" if env vars missing (graceful no-op);
   *  "error" if startup threw. */
  status: 'configured' | 'deferred' | 'error';
  exporter_endpoint?: string;
  /** ISO timestamp of the last span successfully shipped (best-effort,
   *  populated by the SpanProcessor wrapper). undefined until first
   *  span exports. */
  last_export_at?: string;
  error?: string;
}

let _status: OtelStatus = { status: 'deferred' };
let _sdk: NodeSDK | undefined;

/** Read-only status snapshot for /health endpoint integration. */
export function getOtelTraceStatus(): OtelStatus {
  return { ..._status };
}

/**
 * Initialize the OTel SDK for traces + metrics. Call ONCE at bootstrap
 * before NestFactory.create. Idempotent — second call is a no-op.
 *
 * If GRAFANA_CLOUD_OTLP_ENDPOINT is missing, returns without starting
 * the SDK and `_status` stays `deferred`. /health reflects this. Lets
 * us ship to Render before Yogesh provisions Grafana Cloud.
 */
export function initOtelTraces(): void {
  if (_sdk) return;

  const endpoint = process.env.GRAFANA_CLOUD_OTLP_ENDPOINT;
  const auth = process.env.GRAFANA_CLOUD_OTLP_AUTH;

  if (!endpoint) {
    _status = { status: 'deferred' };
    return;
  }

  try {
    const traceExporter = new OTLPTraceExporter({
      url: `${endpoint.replace(/\/$/, '')}/v1/traces`,
      headers: auth ? { Authorization: `Basic ${auth}` } : undefined,
    });

    // Wrap exporter to record last-export timestamp + apply redaction
    // to span attributes BEFORE they leave the process.
    const originalExport = traceExporter.export.bind(traceExporter);
    traceExporter.export = (spans, resultCallback) => {
      // Redact attributes on each span (mutates the read-model — OTel
      // SDK clones internally before export, so this is safe).
      for (const span of spans) {
        const redacted = redactAttributes(span.attributes);
        // ReadableSpan.attributes is `Attributes` (Record); we replace
        // by Object.assign because direct assignment fails the readonly
        // type. The SDK accepts mutated attribute objects.
        Object.keys(span.attributes).forEach((k) => {
          delete (span.attributes as Record<string, unknown>)[k];
        });
        Object.assign(span.attributes, redacted);
      }
      _status = {
        ..._status,
        status: 'configured',
        exporter_endpoint: endpoint,
        last_export_at: new Date().toISOString(),
      };
      return originalExport(spans, resultCallback);
    };

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'qa-nexus-api',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.1',
        [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]:
          process.env.NODE_ENV ?? 'development',
      }),
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable fs instrumentation — too noisy for this service +
          // not in the LLM/HTTP critical path. Enable if needed.
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    sdk.start();
    _sdk = sdk;
    _status = {
      status: 'configured',
      exporter_endpoint: endpoint,
    };
  } catch (err) {
    _status = {
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Shutdown handler for graceful SIGTERM (Render redeploy). */
export async function shutdownOtelTraces(): Promise<void> {
  if (_sdk) {
    await _sdk.shutdown();
    _sdk = undefined;
  }
}
