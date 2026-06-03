// QA Nexus PM1 — AC042 Sherlock RCA eval harness.
//
// Day-25 Sun 2026-05-24 P1. The M5 binding gate per ADR-019 + M4 plan §4.5.
//
// PASS CRITERIA (corpus n=50):
//   top-2 hit rate ≥ 40% AND calibration ≥ 0.8 on high-confidence
//   (confidence ≥ 0.8) predictions.
//
// CORPUS-SIZE-AGNOSTIC: loads every `def-*.json` from sherlock-rca/ and
// scores against the same logic regardless of n. Smoke run (n=5, today)
// and binding run (n=50, after corpus expansion) use the same script.
//
// SCORING:
//   * top-2 hit  → groundTruth.rootCauseCategory OR any of
//                  groundTruth.acceptableAlternatives appears in the
//                  orchestrator's top-2 hypothesis categories.
//   * calibration → among predictions where top-1.confidence ≥ 0.8,
//                   what fraction had top-1 category match groundTruth
//                   (or acceptable alt)? Higher = better-calibrated.
//
// BOOTSTRAP:
//   Uses NestFactory.createApplicationContext with a minimal
//   AC042EvalModule that wires LLMGatewayModule (@Global) + the 4
//   Sherlock agent services + the orchestrator. Prisma/Audit/Realtime
//   are faked because runRca() (the sync pure-function path we use for
//   eval) never touches them — only runAndPersist() does.
//
// USAGE:
//   cd apps/api && pnpm exec ts-node --transpile-only test/ac042-eval.ts
//   OR (from monorepo root): pnpm --filter @qa-nexus/api ac042:eval

import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

import { SherlockOrchestratorService } from '../src/agents/sherlock-orchestrator/sherlock-orchestrator.service';
import { SherlockCodeService } from '../src/agents/sherlock-code/sherlock-code.service';
import { SherlockDataService } from '../src/agents/sherlock-data/sherlock-data.service';
import { SherlockEnvService } from '../src/agents/sherlock-env/sherlock-env.service';
import { SherlockFlakeService } from '../src/agents/sherlock-flake/sherlock-flake.service';
// Direct service import — NOT LLMGatewayModule. The module also registers
// LLMController which uses @Roles → RolesGuard → AuthService chain →
// AuthService needs PrismaService etc. By providing LLMGatewayService
// directly we skip the controller graph entirely. ADR-019 §6: agents only
// need gateway.complete(), nothing controller-layer.
import { LLMGatewayService } from '../src/llm/llm-gateway.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';

import type {
  SherlockCodeInput,
  SherlockHypothesis,
} from '../src/agents/sherlock-code/schemas';

// --- Fakes — orchestrator.runRca() never invokes these. ---------------------

class FakePrismaService {
  onModuleInit(): void {}
  onModuleDestroy(): void {}
  async $disconnect(): Promise<void> {}
}

class FakeAuditService {
  writeNonBlocking(): void {}
  async write(): Promise<void> {}
}

class FakeRealtimeGateway {
  emitRcaComplete(): void {}
  emitTestRunProgress(): void {}
  emitDefectRcaReady(): void {}
  emitAgentRunComplete(): void {}
}

@Module({
  providers: [
    LLMGatewayService,
    SherlockOrchestratorService,
    SherlockCodeService,
    SherlockDataService,
    SherlockEnvService,
    SherlockFlakeService,
    { provide: PrismaService, useClass: FakePrismaService },
    { provide: AuditService, useClass: FakeAuditService },
    { provide: RealtimeGateway, useClass: FakeRealtimeGateway },
  ],
})
class AC042EvalModule {}

// --- Corpus types -----------------------------------------------------------

interface DefectCase {
  id: string;
  input: {
    testCaseId: string;
    testCaseTitle: string;
    runId: string;
    stepNumber: number;
    stepLabel: string;
    durationMs: number;
    environment: string;
    errorMessage: string;
    stackTrace?: string | null;
    priorHistory?: unknown;
    kbContext: string[];
  };
  groundTruth: {
    rootCauseCategory: string;
    rootCauseDetail: string;
    acceptableAlternatives: string[];
    confidence: string;
    notesForEval: string;
  };
}

const HIGH_CONFIDENCE_THRESHOLD = 0.8;

// --- Corpus loader ----------------------------------------------------------

async function loadCorpus(dir: string): Promise<DefectCase[]> {
  const files = (await fs.readdir(dir))
    .filter((f) => f.startsWith('def-') && f.endsWith('.json'))
    .sort();
  const cases: DefectCase[] = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(dir, f), 'utf8');
    cases.push(JSON.parse(raw) as DefectCase);
  }
  return cases;
}

// --- Input mapping (corpus → orchestrator) ----------------------------------

function deriveComponent(stackTrace?: string | null): string | null {
  if (!stackTrace) return null;
  const paren = stackTrace.match(/\(([^)]+)\)/);
  if (paren) return paren[1].slice(0, 120);
  const atFrame = stackTrace.match(/at\s+(\S+:\d+)/);
  return atFrame?.[1]?.slice(0, 120) ?? null;
}

function corpusToOrchestratorInput(c: DefectCase): SherlockCodeInput {
  return {
    defectId: randomUUID(),
    stackTrace: c.input.stackTrace ?? c.input.errorMessage,
    failureMessage: c.input.errorMessage,
    component: deriveComponent(c.input.stackTrace),
    recentCommits: [],
  };
}

// --- Scoring ----------------------------------------------------------------

interface ScoreResult {
  caseId: string;
  groundTruth: string;
  acceptableAlts: string[];
  topCategories: string[];
  topConfidences: number[];
  top2Hit: boolean;
  highConfidencePredictionCorrect: boolean | null;
  status: string;
  okAgentCount: number;
  hypothesisCount: number;
  durationMs: number;
  crashed: boolean;
  errorMessage?: string;
}

function scoreCase(
  c: DefectCase,
  hyps: SherlockHypothesis[],
  status: string,
  okAgentCount: number,
  durationMs: number,
): ScoreResult {
  const top2 = hyps.slice(0, 2);
  const topCategories = top2.map((h) => h.category);
  const topConfidences = top2.map((h) => h.confidence);
  const targets = new Set([
    c.groundTruth.rootCauseCategory,
    ...c.groundTruth.acceptableAlternatives,
  ]);
  const top2Hit = topCategories.some((cat) => targets.has(cat));
  const top1 = hyps[0];
  let highConfidencePredictionCorrect: boolean | null = null;
  if (top1 && top1.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    highConfidencePredictionCorrect = targets.has(top1.category);
  }
  return {
    caseId: c.id,
    groundTruth: c.groundTruth.rootCauseCategory,
    acceptableAlts: c.groundTruth.acceptableAlternatives,
    topCategories,
    topConfidences,
    top2Hit,
    highConfidencePredictionCorrect,
    status,
    okAgentCount,
    hypothesisCount: hyps.length,
    durationMs,
    crashed: false,
  };
}

// --- Main -------------------------------------------------------------------

async function main(): Promise<void> {
  const corpusDir = path.resolve(__dirname, 'golden-sets/sherlock-rca');
  const logger = new Logger('AC042Eval');
  logger.log(`Loading corpus from ${corpusDir}`);
  let cases = await loadCorpus(corpusDir);
  logger.log(`Loaded ${cases.length} defects`);
  if (cases.length === 0) {
    logger.error('Empty corpus — nothing to evaluate');
    process.exit(1);
  }

  // Smoke mode (Day-27 M5 retro §6.8 / Day-1 pilot-push F-2): AC042_CASE pins a
  // single defect for a 1-defect / 4-Groq-call smoke run BEFORE the ~200-call
  // binding eval, to catch schema/prompt bridge regressions cheaply. Permanent
  // capability — supersedes the transient AC042_LIMIT used during Day-28 diag.
  const onlyCase = process.env.AC042_CASE?.trim();
  if (onlyCase) {
    const before = cases.length;
    cases = cases.filter((c) => c.id === onlyCase);
    if (cases.length === 0) {
      logger.error(
        `AC042_CASE="${onlyCase}" not found among ${before} corpus cases`,
      );
      process.exit(1);
    }
    logger.log(
      `AC042_CASE smoke mode: running 1 defect (${onlyCase}) of ${before} in corpus`,
    );
  }

  // Limit mode (Day-1 PM pilot-push, F-2 follow-on): AC042_LIMIT=N runs the first
  // N cases — used by NFR-003 (Sherlock A4 latency over a ~20-case sample) and as a
  // cheaper partial binding run. Applied AFTER the AC042_CASE filter (if both are
  // set, AC042_CASE wins). Permanent — the Day-28 AC042_LIMIT was a transient diag.
  const limitRaw = process.env.AC042_LIMIT?.trim();
  const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;
  if (limit !== undefined && limit > 0 && limit < cases.length) {
    logger.log(
      `AC042_LIMIT=${limit} active — running first ${limit} of ${cases.length} cases`,
    );
    cases = cases.slice(0, limit);
  }

  logger.log('Bootstrapping AC042EvalModule (LLM + 4 agents + orchestrator)…');
  const app = await NestFactory.createApplicationContext(AC042EvalModule, {
    logger: ['log', 'warn', 'error'],
  });
  const orchestrator = app.get(SherlockOrchestratorService);

  const results: ScoreResult[] = [];
  let idx = 0;
  for (const c of cases) {
    idx++;
    const t0 = Date.now();
    try {
      logger.log(`[${idx}/${cases.length}] ${c.id} (${c.input.testCaseId})`);
      const input = corpusToOrchestratorInput(c);
      const result = await orchestrator.runRca(input);
      const elapsed = Date.now() - t0;
      // Smoke debug (AC042_DEBUG=1, set by scripts/ac042-smoke.mjs --debug):
      // dump the full orchestrator result (per-agent hypotheses + confidences)
      // so a 1-defect smoke surfaces schema/prompt bridge issues at a glance.
      if (process.env.AC042_DEBUG) {
        console.log(`  [debug] full RCA result for ${c.id}:`);
        console.log(JSON.stringify(result, null, 2));
      }
      const score = scoreCase(
        c,
        result.hypotheses,
        result.status,
        result.okAgentCount,
        elapsed,
      );
      results.push(score);
      const verdict = score.top2Hit ? 'HIT ' : 'MISS';
      logger.log(
        `  → ${verdict} ${elapsed}ms · status=${result.status} · agents=${result.okAgentCount}/4 · hyps=${result.hypotheses.length} · top2=[${score.topCategories.join(',')}] · gt=${score.groundTruth} · alts=[${score.acceptableAlts.join(',')}]`,
      );
    } catch (err) {
      const elapsed = Date.now() - t0;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`  → CRASH (${elapsed}ms): ${msg}`);
      results.push({
        caseId: c.id,
        groundTruth: c.groundTruth.rootCauseCategory,
        acceptableAlts: c.groundTruth.acceptableAlternatives,
        topCategories: [],
        topConfidences: [],
        top2Hit: false,
        highConfidencePredictionCorrect: null,
        status: 'crashed',
        okAgentCount: 0,
        hypothesisCount: 0,
        durationMs: elapsed,
        crashed: true,
        errorMessage: msg,
      });
    }
  }

  await app.close();

  const n = results.length;
  const crashes = results.filter((r) => r.crashed).length;
  const hits = results.filter((r) => r.top2Hit).length;
  const top2HitRate = (hits / n) * 100;
  const highConfidencePredictions = results.filter(
    (r) => r.highConfidencePredictionCorrect !== null,
  );
  const highConfidenceCorrect = highConfidencePredictions.filter(
    (r) => r.highConfidencePredictionCorrect === true,
  ).length;
  const calibration =
    highConfidencePredictions.length === 0
      ? null
      : highConfidenceCorrect / highConfidencePredictions.length;

  console.log('\n=== AC042 SUMMARY ===');
  console.log(`Corpus n:          ${n}`);
  console.log(`Crashes:           ${crashes}`);
  console.log(`Top-2 hits:        ${hits}`);
  console.log(`Top-2 hit rate:    ${top2HitRate.toFixed(1)}%`);
  if (calibration !== null) {
    console.log(
      `High-conf preds:   ${highConfidencePredictions.length} (threshold ≥${HIGH_CONFIDENCE_THRESHOLD})`,
    );
    console.log(
      `  correct:         ${highConfidenceCorrect} / ${highConfidencePredictions.length} (${(calibration * 100).toFixed(0)}%)`,
    );
    console.log(`Calibration:       ${calibration.toFixed(2)}`);
  } else {
    console.log(
      `High-conf preds:   0 (no calibration measure — orchestrator never returned ≥${HIGH_CONFIDENCE_THRESHOLD} confidence)`,
    );
  }
  const calStr = calibration === null ? 'n/a' : calibration.toFixed(2);
  console.log(
    `\nAC042 RESULT: top-2 = ${top2HitRate.toFixed(1)}% · calibration = ${calStr} · crashes = ${crashes}/${n} · corpus n=${n}`,
  );

  // Write per-case JSON report
  const ts = new Date().toISOString().slice(0, 10);
  const reportPath = path.join(corpusDir, `results-${ts}.json`);
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        corpusSize: n,
        crashes,
        top2HitRate,
        calibration,
        highConfidencePredictionCount: highConfidencePredictions.length,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`\nDetailed per-case JSON: ${reportPath}`);
}

main().catch((err) => {
  console.error('AC042 eval failed:', err);
  process.exit(1);
});
