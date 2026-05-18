// QA Nexus PM1 — Sherlock RCA orchestrator (Day-20 P1, ADR-019).
//
// Day-21 followup (da) hardening: adds `runAndPersist()` — wraps the
// existing pure-function `runRca()` with DB persistence to `rca_reports`
// + `agent_runs`, HMAC-chained audit row on completion, and WS emit on
// `rca.complete.<runId>` per CLAUDE.md Hard Rule 7 + .claude/rules/api.md.
//
// Coordinates 4 parallel agents (code/data/env/flake) via Promise.all
// with per-agent 30s timeout. Deterministic merge per ADR-019 §4-5 +
// 2-of-4 tolerance per §6.
//
// SCOPE Day-20 baseline (still preserved):
//   - `runRca()` — pure-function orchestration. Returns flat hypothesis
//     array synchronously. Used by Day-20 sync-response code path.
//
// SCOPE Day-21 hardening (this PR — followup `(da)`):
//   - `runAndPersist()` — full path: AgentRun row → fan-out → 5-layer
//     RcaReport persistence → audit row → WS emit. Used by Day-21 async
//     202+WS code path in DefectsController.
//   - 5-layer mapping: flake→layer1_stack, env→layer2_env, layer3_config
//     left empty for future env-config split, code→layer4_code,
//     data→layer5_data.
//   - Agent fan-out extracted into `runFanout()` private helper so both
//     code paths (sync `runRca` + async `runAndPersist`) share it without
//     duplicating Promise.all + timeout + merge logic.

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { SherlockCodeService } from '../sherlock-code/sherlock-code.service';
import { SherlockDataService } from '../sherlock-data/sherlock-data.service';
import { SherlockEnvService } from '../sherlock-env/sherlock-env.service';
import { SherlockFlakeService } from '../sherlock-flake/sherlock-flake.service';
import {
  SherlockCodeInputSchema,
  type SherlockCodeInput,
  type SherlockHypothesis,
} from '../sherlock-code/schemas';

const tracer = trace.getTracer('qa-nexus-api/sherlock-orchestrator', '0.0.1');
const PER_AGENT_TIMEOUT_MS = 30_000;
const MIN_AGENTS_FOR_SUCCESS = 2; // ADR-019 §6 — 2-of-4 tolerance
const MAX_HYPOTHESES = 10;

export type RcaStatus = 'completed' | 'degraded';

export interface SherlockOrchestratorRunResult {
  runId: string;
  status: RcaStatus;
  okAgentCount: number;
  hypotheses: SherlockHypothesis[];
}

/** Day-21 (da): per-agent + merged fan-out result. Internal contract so
 *  `runRca()` (sync path) and `runAndPersist()` (async path) share fan-out
 *  logic without duplicating Promise.all + timeout + merge. */
interface FanoutResult {
  perAgent: {
    code: SherlockHypothesis[];
    data: SherlockHypothesis[];
    env: SherlockHypothesis[];
    flake: SherlockHypothesis[];
  };
  status: RcaStatus;
  okAgentCount: number;
  hypotheses: SherlockHypothesis[]; // merged + deduped + sorted
}

/** Day-21 (da): runAndPersist() context — workspaceId is required for the
 *  audit chain (per PM1_ERD §3.13 + .claude/rules/api.md audit log section);
 *  actorId is nullable for system-initiated runs (cron, retries). */
export interface RunAndPersistContext {
  /** Pre-allocated runId — controller generates this BEFORE writing the
   *  kickoff audit row, so the same id flows through audit → AgentRun →
   *  RcaReport → WS event without races. */
  runId: string;
  workspaceId: string;
  actorId: string | null;
}

/** Day-21 (da): runAndPersist() return shape. Smaller than runRca's full
 *  result because the response (202 + runId) has already been returned by
 *  the time this resolves — the caller only needs persistence-side facts. */
export interface RunAndPersistResult {
  rcaReportId: string;
  status: RcaStatus;
  topHypothesis: string;
  okAgentCount: number;
  durationMs: number;
}

@Injectable()
export class SherlockOrchestratorService {
  private readonly logger = new Logger(SherlockOrchestratorService.name);

  constructor(
    private readonly code: SherlockCodeService,
    private readonly data: SherlockDataService,
    private readonly env: SherlockEnvService,
    private readonly flake: SherlockFlakeService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /**
   * Run all 4 agents in parallel and return merged hypotheses.
   *
   * Returns synchronously — caller awaits the merged result + decides
   * response shape (sync return vs Day-21 async 202+poll pattern). For
   * Day-20 the DefectsController returns the result inline; Day-21 may
   * flip to async if pilot ops show p95 latency >5s.
   *
   * NEVER throws — each agent.analyze() is already never-throws by
   * contract (ADR-019 §6). Timeouts collapse to empty arrays. Worst case:
   * all 4 timeout → returns { status: 'degraded', hypotheses: [] }.
   */
  async runRca(
    rawInput: SherlockCodeInput,
  ): Promise<SherlockOrchestratorRunResult> {
    return tracer.startActiveSpan('sherlock.rca', async (span) => {
      const runId = randomUUID();
      span.setAttribute('run.id', runId);

      const parsed = SherlockCodeInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        this.logger.warn(
          `runRca: input validation failed: ${parsed.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')}`,
        );
        span.setAttribute('outcome', 'invalid_input');
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
        return {
          runId,
          status: 'degraded' as RcaStatus,
          okAgentCount: 0,
          hypotheses: [],
        };
      }
      const input = parsed.data;
      span.setAttribute('defect.id', input.defectId);

      const fanout = await this.runFanout(input);

      span.setAttribute('agents.ok_count', fanout.okAgentCount);
      span.setAttribute('hypotheses.count', fanout.hypotheses.length);
      span.setAttribute('outcome', fanout.status);
      span.end();

      return {
        runId,
        status: fanout.status,
        okAgentCount: fanout.okAgentCount,
        hypotheses: fanout.hypotheses,
      };
    });
  }

  /**
   * Day-21 followup (da) — full RCA path with persistence + audit + WS.
   *
   * Sequence:
   *   1. Create AgentRun row (kind=A4, status=running, startedAt=now).
   *   2. Run the 4-agent fan-out (same as runRca).
   *   3. Persist RcaReport: per-agent results → 5-layer JSONB columns
   *      (flake→L1, env→L2, code→L4, data→L5, L3 empty). topHypothesis is
   *      the highest-confidence entry from the merged set.
   *   4. Update AgentRun → complete (status, completedAt, durationMs).
   *   5. Write audit row `defect.rca_completed` synchronously inside this
   *      orchestrator scope (.claude/rules/api.md: NEVER fire-and-forget
   *      from request handler; the controller fire-and-forgets THIS whole
   *      method, but inside it the audit is synchronous → durable before
   *      the WS emit notifies clients).
   *   6. Emit `rca.complete.<runId>` on RealtimeGateway. Subscribers
   *      (F22 Defect Detail) refetch the RcaReport.
   *
   * On exception anywhere after AgentRun creation: AgentRun is marked
   * failed; a `defect.rca_failed` audit row is written; the WS event is
   * NOT emitted (FE keeps showing "running" until the AgentRun row's
   * status flips, which is the source-of-truth). The exception is
   * re-thrown so the controller's setImmediate error handler logs it.
   */
  async runAndPersist(
    input: SherlockCodeInput,
    ctx: RunAndPersistContext,
  ): Promise<RunAndPersistResult> {
    return tracer.startActiveSpan('sherlock.rca.persist', async (span) => {
      const startTime = Date.now();
      const { runId, workspaceId, actorId } = ctx;
      span.setAttribute('run.id', runId);
      span.setAttribute('defect.id', input.defectId);
      span.setAttribute('workspace.id', workspaceId);

      // Step 1 — AgentRun row (running)
      await this.prisma.agentRun.create({
        data: {
          id: runId,
          workspaceId,
          agentKind: 'A4',
          status: 'running',
          startedAt: new Date(),
        },
      });

      try {
        // Step 2 — fan-out
        const fanout = await this.runFanout(input);
        const durationMs = Date.now() - startTime;
        const top = fanout.hypotheses[0];
        const topHypothesis =
          top?.hypothesis ?? '(no hypothesis — all 4 agents returned empty)';
        const topHypothesisTrunc = topHypothesis.slice(0, 200);
        const otelTraceId = span.spanContext().traceId;

        // Step 3 — RcaReport (5-layer mapping)
        const report = await this.prisma.rcaReport.create({
          data: {
            defectId: input.defectId,
            layer1StackJson: { hypotheses: fanout.perAgent.flake },
            layer2EnvJson: { hypotheses: fanout.perAgent.env },
            layer3ConfigJson: { hypotheses: [] }, // future: env-config split
            layer4CodeJson: { hypotheses: fanout.perAgent.code },
            layer5DataJson: { hypotheses: fanout.perAgent.data },
            topHypothesis,
            createdByAgentRunId: runId,
            layer1Confidence: fanout.perAgent.flake[0]?.confidence ?? null,
            layer2Confidence: fanout.perAgent.env[0]?.confidence ?? null,
            layer3Confidence: null,
            layer4Confidence: fanout.perAgent.code[0]?.confidence ?? null,
            layer5Confidence: fanout.perAgent.data[0]?.confidence ?? null,
            otelTraceId,
          },
        });

        // Step 4 — AgentRun → complete
        await this.prisma.agentRun.update({
          where: { id: runId },
          data: {
            status: fanout.status === 'completed' ? 'complete' : 'failed',
            completedAt: new Date(),
            durationMs,
          },
        });

        // Step 5 — audit row (synchronous, durable before WS emit)
        await this.audit.write({
          workspaceId,
          actorId,
          entityType: 'defect',
          entityId: input.defectId,
          action: 'rca_completed',
          payload: {
            runId,
            rcaReportId: report.id,
            status: fanout.status,
            okAgentCount: fanout.okAgentCount,
            hypothesisCount: fanout.hypotheses.length,
            topHypothesis: topHypothesisTrunc,
            durationMs,
          },
        });

        // Step 6 — WS emit (after persistence + audit are durable)
        this.realtime.emitRcaComplete(runId, {
          defectId: input.defectId,
          status: fanout.status,
          okAgentCount: fanout.okAgentCount,
          topHypothesis: topHypothesisTrunc,
          rcaReportId: report.id,
          durationMs,
        });

        span.setAttribute('agents.ok_count', fanout.okAgentCount);
        span.setAttribute('hypotheses.count', fanout.hypotheses.length);
        span.setAttribute('outcome', fanout.status);
        span.setAttribute('rca_report.id', report.id);
        span.end();

        return {
          rcaReportId: report.id,
          status: fanout.status,
          topHypothesis,
          okAgentCount: fanout.okAgentCount,
          durationMs,
        };
      } catch (err) {
        // Failure path: mark AgentRun failed, write failure audit, do NOT
        // emit WS (subscribers should refetch on a missed deadline).
        const errMsg = err instanceof Error ? err.message : String(err);
        const errClass =
          err instanceof Error ? err.constructor.name : 'Unknown';
        const durationMs = Date.now() - startTime;

        try {
          await this.prisma.agentRun.update({
            where: { id: runId },
            data: {
              status: 'failed',
              completedAt: new Date(),
              durationMs,
              errorClass: errClass,
            },
          });
        } catch (updateErr) {
          this.logger.error(
            `runAndPersist: AgentRun update failed for runId=${runId}: ${
              updateErr instanceof Error ? updateErr.message : String(updateErr)
            }`,
          );
        }

        try {
          await this.audit.write({
            workspaceId,
            actorId,
            entityType: 'defect',
            entityId: input.defectId,
            action: 'rca_failed',
            payload: {
              runId,
              errorClass: errClass,
              errorMessage: errMsg.slice(0, 500),
              durationMs,
            },
          });
        } catch (auditErr) {
          this.logger.error(
            `runAndPersist: failure-audit write failed for runId=${runId}: ${
              auditErr instanceof Error ? auditErr.message : String(auditErr)
            }`,
          );
        }

        span.setAttribute('outcome', 'failed');
        span.setAttribute('error.class', errClass);
        span.setStatus({ code: SpanStatusCode.ERROR, message: errMsg });
        span.end();

        throw err;
      }
    });
  }

  /** Day-21 (da): extracted 4-agent fan-out + merge. Shared by `runRca()`
   *  (Day-20 sync path) and `runAndPersist()` (Day-21 async path). */
  private async runFanout(input: SherlockCodeInput): Promise<FanoutResult> {
    const [code, data, env, flake] = await Promise.all([
      this.withTimeout(this.code.analyze(input), 'code'),
      this.withTimeout(this.data.analyze(input), 'data'),
      this.withTimeout(this.env.analyze(input), 'env'),
      this.withTimeout(this.flake.analyze(input), 'flake'),
    ]);
    const perAgent = { code, data, env, flake };
    const okAgentCount = [code, data, env, flake].filter(
      (r) => r.length > 0,
    ).length;
    const status: RcaStatus =
      okAgentCount >= MIN_AGENTS_FOR_SUCCESS ? 'completed' : 'degraded';
    const hypotheses = this.mergeHypotheses([code, data, env, flake]);
    return { perAgent, status, okAgentCount, hypotheses };
  }

  /**
   * Deterministic merge per ADR-019 §4-5:
   *   1. Flatten all 4 agents' hypotheses
   *   2. Dedupe by (category, hypothesis-prefix-100chars) — keeps the
   *      higher-confidence hit when two agents agree
   *   3. Sort by confidence DESC, then category lex ASC (deterministic)
   *   4. Cap at MAX_HYPOTHESES (10)
   */
  mergeHypotheses(results: SherlockHypothesis[][]): SherlockHypothesis[] {
    const flat = results.flat();
    const seen = new Map<string, SherlockHypothesis>();
    for (const h of flat) {
      const key = `${h.category}|${h.hypothesis.slice(0, 100)}`;
      const prior = seen.get(key);
      if (!prior || h.confidence > prior.confidence) {
        seen.set(key, h);
      }
    }
    return [...seen.values()]
      .sort(
        (a, b) =>
          b.confidence - a.confidence || a.category.localeCompare(b.category),
      )
      .slice(0, MAX_HYPOTHESES);
  }

  /**
   * Race a single agent's promise against PER_AGENT_TIMEOUT_MS.
   * On timeout: returns [] (treated as agent-failed for tolerance check).
   * On agent throw: shouldn't happen (analyze() never throws by contract)
   * but defensively returns [].
   */
  private withTimeout(
    p: Promise<SherlockHypothesis[]>,
    agent: string,
  ): Promise<SherlockHypothesis[]> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<SherlockHypothesis[]>((resolve) => {
      timeoutId = setTimeout(() => {
        this.logger.warn(
          `${agent}-agent timed out after ${PER_AGENT_TIMEOUT_MS}ms — treating as empty`,
        );
        resolve([]);
      }, PER_AGENT_TIMEOUT_MS);
    });
    return Promise.race([p, timeout])
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `${agent}-agent threw (contract violation): ${msg} — treating as empty`,
        );
        return [] as SherlockHypothesis[];
      })
      .finally(() => clearTimeout(timeoutId));
  }
}
