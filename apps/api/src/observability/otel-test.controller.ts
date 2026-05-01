// QA Nexus PM1 — OTel manual test endpoint (T019 ops verification).
//
// Admin-gated diagnostic endpoint that emits a known span + log + metric
// for end-to-end verification of the OTel pipeline. Use after Yogesh
// sets GRAFANA_CLOUD_OTLP_* + BETTER_STACK_OTLP_* env vars on Render to
// confirm the export path actually reaches Grafana / Better Stack.
//
// Returns the trace_id + span_id so ops can search for them in
// Grafana's Explore → Tempo or Better Stack's Explore.
//
// Spec: T019 verification path. NOT a public endpoint — Admin-only.

import {
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import { logs as otelLogs, SeverityNumber } from '@opentelemetry/api-logs';
import { Role } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { getOtelTraceStatus } from './otel.config';
import { getOtelLogsStatus } from './otel-logs.config';

const tracer = trace.getTracer('qa-nexus-api/otel-test', '0.0.1');
const otelTestLogger = otelLogs.getLogger('qa-nexus-api/otel-test', '0.0.1');

@Controller('admin')
@UseGuards(RolesGuard)
export class OtelTestController {
  /**
   * Emit a sample span (with one child span) + a sample log record.
   * Returns the IDs so ops can hunt them in Grafana / Better Stack.
   *
   * Refuses in NODE_ENV=production unless ALLOW_ADMIN_OTEL_TEST is also
   * set — guards against accidental hits leaving sample spans in prod
   * telemetry.
   */
  @Post('otel/test-trace')
  @Roles(Role.Admin)
  async testTrace(): Promise<{
    note: string;
    trace_id: string;
    span_id: string;
    parent_span_id: string;
    traces_status: string;
    logs_status: string;
    grafana_search_hint: string;
    better_stack_search_hint: string;
  }> {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_ADMIN_OTEL_TEST !== 'true'
    ) {
      throw new ForbiddenException(
        'Admin OTel test-trace is disabled in production. Set ' +
          'ALLOW_ADMIN_OTEL_TEST=true in Render env vars temporarily ' +
          'if you need to verify the pipeline against prod.',
      );
    }

    const traceStatus = getOtelTraceStatus();
    const logStatus = getOtelLogsStatus();

    return await tracer.startActiveSpan(
      'qa-nexus.otel-test.parent',
      {
        attributes: {
          'qa-nexus.test_trace.kind': 'manual_verification',
          'qa-nexus.test_trace.timestamp': new Date().toISOString(),
        },
      },
      async (parentSpan: Span) => {
        try {
          const ctx = parentSpan.spanContext();
          // Emit a child span so the trace has 2 nodes — easier to spot
          // in Grafana's trace-tree view.
          const childResult = await tracer.startActiveSpan(
            'qa-nexus.otel-test.child',
            { attributes: { 'qa-nexus.test_trace.role': 'child' } },
            async (childSpan: Span) => {
              const childCtx = childSpan.spanContext();
              // Simulate a small unit of work so latency_ms isn't 0.
              await new Promise((resolve) => setTimeout(resolve, 50));
              childSpan.setStatus({ code: SpanStatusCode.OK });
              childSpan.end();
              return {
                childTraceId: childCtx.traceId,
                childSpanId: childCtx.spanId,
              };
            },
          );
          // Emit a log record with the trace ID embedded so ops can
          // cross-correlate Grafana traces ↔ Better Stack logs.
          otelTestLogger.emit({
            severityNumber: SeverityNumber.INFO,
            severityText: 'INFO',
            body: 'qa-nexus otel-test manual verification log',
            attributes: {
              'qa-nexus.test_trace.trace_id': ctx.traceId,
              'qa-nexus.test_trace.span_id': ctx.spanId,
              'qa-nexus.test_trace.kind': 'manual_verification',
            },
          });

          parentSpan.setAttributes({
            'qa-nexus.test_trace.child_trace_id': childResult.childTraceId,
            'qa-nexus.test_trace.child_span_id': childResult.childSpanId,
          });
          parentSpan.setStatus({ code: SpanStatusCode.OK });
          return {
            note:
              traceStatus.status === 'configured' &&
              logStatus.status === 'configured'
                ? 'Span + log emitted. Search Grafana Tempo / Better Stack ' +
                  'for the trace_id below within ~30s.'
                : 'Span + log emitted to local SDK, but exporters are ' +
                  'NOT configured (see traces_status / logs_status). The ' +
                  'records went to /dev/null.',
            trace_id: ctx.traceId,
            span_id: ctx.spanId,
            parent_span_id: ctx.spanId,
            traces_status: traceStatus.status,
            logs_status: logStatus.status,
            grafana_search_hint:
              `https://grafana.com/explore?datasource=tempo&queryType=traceql` +
              `&query=%7Btrace_id%3D%22${ctx.traceId}%22%7D`,
            better_stack_search_hint:
              `https://logs.betterstack.com/team/<team>/sources?source=qa-nexus-api-prod` +
              `&q=trace_id%3A%22${ctx.traceId}%22`,
          };
        } catch (err) {
          parentSpan.recordException(err as Error);
          parentSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: err instanceof Error ? err.message : String(err),
          });
          throw err;
        } finally {
          parentSpan.end();
        }
      },
    );
  }

  /**
   * Emit a high-severity log record marked as a test alert. Better Stack
   * alert rules pointed at Slack should fire on this event (rule
   * matchers documented in `docs/deploy/better-stack-runbook.md`).
   *
   * Path (a) per Day-5 #4 decision: Better Stack OWNS the alerting
   * (rule → webhook → Slack). This endpoint just emits the trigger
   * event; verification happens in the Slack channel.
   *
   * Returns:
   *   - test_marker: unique id Yogesh can search for in Slack to
   *     confirm the rule fired
   *   - logs_status: pipeline state at emit time
   *   - runbook URL: where the alert rule setup lives
   *
   * Refuses in NODE_ENV=production unless ALLOW_ADMIN_OTEL_TEST=true
   * (same gate as test-trace — these are diagnostic endpoints, not
   * production-traffic events).
   */
  @Post('alerts/test-slack')
  @Roles(Role.Admin)
  async testSlackAlert(): Promise<{
    note: string;
    test_marker: string;
    logs_status: string;
    next_step: string;
    runbook: string;
  }> {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_ADMIN_OTEL_TEST !== 'true'
    ) {
      throw new ForbiddenException(
        'Admin alerts test-slack is disabled in production. Set ' +
          'ALLOW_ADMIN_OTEL_TEST=true in Render env vars temporarily ' +
          'if you need to verify the Slack alert path against prod.',
      );
    }

    const logStatus = getOtelLogsStatus();
    // Test marker — unique per call so Yogesh can match the Slack
    // message to this exact endpoint hit (rather than a real prod
    // alert that happened to fire concurrently).
    const test_marker = `qa-nexus-test-slack-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    // Emit at ERROR severity to match Better Stack's primary alert
    // rule ("severity >= ERROR → Slack"). The body string also matches
    // the secondary rule ("DEFERRED mode" substring) so this single
    // event exercises both rules at once.
    otelTestLogger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body:
        `qa-nexus alerts test-slack — TEST EVENT (DEFERRED mode simulation). ` +
        `marker=${test_marker}. If you see this in Slack, the Better Stack ` +
        `alert rule is wired correctly. Search the marker in #qa-nexus-alerts ` +
        `to confirm.`,
      attributes: {
        'qa-nexus.alert.kind': 'test-slack',
        'qa-nexus.alert.test_marker': test_marker,
        'qa-nexus.alert.severity': 'error',
      },
    });

    const note =
      logStatus.status === 'configured'
        ? 'Test event emitted to Better Stack. Expect Slack message in ' +
          '#qa-nexus-alerts within ~30 seconds (Better Stack batches log ' +
          'export every 5-10s, then alert rules evaluate every ~10s).'
        : `Test event emitted to local SDK, but logs exporter is "${logStatus.status}". ` +
          `Event went to ${logStatus.sink}. ` +
          (logStatus.deferred_reason ?? '') +
          ' No Slack notification will fire — fix env vars first.';

    return {
      note,
      test_marker,
      logs_status: logStatus.status,
      next_step:
        'Open Slack #qa-nexus-alerts. Search for the test_marker above. ' +
        'If found within ~30s: rule is live. If not: check Better Stack ' +
        'Alerts dashboard for rule status + Slack integration health.',
      runbook: 'docs/deploy/better-stack-runbook.md → "Slack alerting" section',
    };
  }
}
