// QA Nexus PM1 — Sherlock RCA orchestrator (Day-20 P1, ADR-019).
//
// Coordinates 4 parallel agents (code/data/env/flake) via Promise.all
// with per-agent 30s timeout. Deterministic merge per ADR-019 §4-5 +
// 2-of-4 tolerance per §6.
//
// SCOPE Day-20 (this PR):
//   - Pure-function orchestration. Returns { runId, status, hypotheses }
//     synchronously to caller; controller decides response shape.
//   - NO DB persistence (5-layer `RcaReport` schema from PR #144 is the
//     pre-ADR-019 design and incompatible with the flat-hypothesis-array
//     output the agents emit — Day-21 hardening adapts).
//   - NO WS emit (RealtimeGateway has no public emit() yet — Day-21 adds it).
//   - Audit writes happen at the controller boundary (single source-of-
//     truth for defects.rca_kicked_off / defects.rca_completed).
//
// SCOPE Day-21+ (NOT in this PR — tracked in followup `(da)`):
//   - Adapt output → 5-layer RcaReport schema (map code→layer4, data→layer5,
//     env→layer2+3, flake→layer1) OR migrate to flat hypothesis array
//   - Async 202+runId pattern + fire-and-forget fanOut() + WS emit on done
//   - RealtimeGateway.emit() public method + emit('rca.complete.{runId}')

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { trace, SpanStatusCode } from '@opentelemetry/api';
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

@Injectable()
export class SherlockOrchestratorService {
  private readonly logger = new Logger(SherlockOrchestratorService.name);

  constructor(
    private readonly code: SherlockCodeService,
    private readonly data: SherlockDataService,
    private readonly env: SherlockEnvService,
    private readonly flake: SherlockFlakeService,
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

      const results = await Promise.all([
        this.withTimeout(this.code.analyze(input), 'code'),
        this.withTimeout(this.data.analyze(input), 'data'),
        this.withTimeout(this.env.analyze(input), 'env'),
        this.withTimeout(this.flake.analyze(input), 'flake'),
      ]);

      const okAgentCount = results.filter((r) => r.length > 0).length;
      const status: RcaStatus =
        okAgentCount >= MIN_AGENTS_FOR_SUCCESS ? 'completed' : 'degraded';
      const hypotheses = this.mergeHypotheses(results);

      span.setAttribute('agents.ok_count', okAgentCount);
      span.setAttribute('hypotheses.count', hypotheses.length);
      span.setAttribute('outcome', status);
      span.end();

      return { runId, status, okAgentCount, hypotheses };
    });
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
