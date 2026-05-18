// Unit tests for SherlockOrchestratorService — Day-20 P1 + Day-21 (da).
//
// Mocks all 4 agent services via NestJS DI useValue. ZERO real LLM calls,
// ZERO real DB hits. Day-21 hardening added PrismaService + AuditService +
// RealtimeGateway deps; this spec mocks all three.
//
// Module-boundary jest.mock on `realtime.gateway` is required because the
// real RealtimeGateway imports AuthService → auth.config → better-auth
// (ESM), which jest's CJS transformer can't load. Same Day-17 #138/#139
// pattern (and #174 fix-forward).

jest.mock('../../../realtime/realtime.gateway', () => ({
  RealtimeGateway: class FakeRealtimeGateway {
    emitRcaComplete = jest.fn();
    emitTestRunProgress = jest.fn();
    emitDefectRcaReady = jest.fn();
    emitAgentRunComplete = jest.fn();
  },
}));

import { Test } from '@nestjs/testing';
import { SherlockOrchestratorService } from '../sherlock-orchestrator.service';
import { SherlockCodeService } from '../../sherlock-code/sherlock-code.service';
import { SherlockDataService } from '../../sherlock-data/sherlock-data.service';
import { SherlockEnvService } from '../../sherlock-env/sherlock-env.service';
import { SherlockFlakeService } from '../../sherlock-flake/sherlock-flake.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { RealtimeGateway } from '../../../realtime/realtime.gateway';
import type {
  SherlockCodeInput,
  SherlockHypothesis,
} from '../../sherlock-code/schemas';

const VALID_INPUT: SherlockCodeInput = {
  defectId: '11111111-2222-3333-4444-555555555555',
  stackTrace: 'TypeError: Cannot read properties of null',
  failureMessage: 'Refund failed',
  component: 'apps/api/src/refunds',
  recentCommits: [],
};

const mkHyp = (
  agent: 'code' | 'data' | 'env' | 'flake',
  category: SherlockHypothesis['category'],
  hypothesis: string,
  confidence: number,
): SherlockHypothesis => ({
  agent,
  category,
  hypothesis,
  confidence,
  evidence: [],
});

describe('SherlockOrchestratorService', () => {
  let service: SherlockOrchestratorService;
  let codeAnalyze: jest.Mock;
  let dataAnalyze: jest.Mock;
  let envAnalyze: jest.Mock;
  let flakeAnalyze: jest.Mock;

  beforeEach(async () => {
    codeAnalyze = jest.fn();
    dataAnalyze = jest.fn();
    envAnalyze = jest.fn();
    flakeAnalyze = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SherlockOrchestratorService,
        { provide: SherlockCodeService, useValue: { analyze: codeAnalyze } },
        { provide: SherlockDataService, useValue: { analyze: dataAnalyze } },
        { provide: SherlockEnvService, useValue: { analyze: envAnalyze } },
        { provide: SherlockFlakeService, useValue: { analyze: flakeAnalyze } },
        // Day-21 (da) — runAndPersist deps. runRca tests don't exercise these
        // but the constructor requires them. Specific runAndPersist tests
        // assert against these mocks via getter.
        {
          provide: PrismaService,
          useValue: {
            agentRun: {
              create: jest.fn().mockResolvedValue({ id: 'mock-agent-run' }),
              update: jest.fn().mockResolvedValue({}),
            },
            rcaReport: {
              create: jest.fn().mockResolvedValue({ id: 'mock-rca-report-id' }),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            write: jest
              .fn()
              .mockResolvedValue({ id: 'mock-audit', thisHash: 'h' }),
          },
        },
        { provide: RealtimeGateway, useClass: RealtimeGateway },
      ],
    }).compile();
    service = moduleRef.get(SherlockOrchestratorService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('runRca — kickoff + return shape', () => {
    it('returns runId + status + okAgentCount + hypotheses', async () => {
      codeAnalyze.mockResolvedValue([
        mkHyp('code', 'code-bug', 'h1 ten chars ok', 0.8),
      ]);
      dataAnalyze.mockResolvedValue([
        mkHyp('data', 'data-bug', 'h2 ten chars ok', 0.7),
      ]);
      envAnalyze.mockResolvedValue([]);
      flakeAnalyze.mockResolvedValue([]);

      const out = await service.runRca(VALID_INPUT);
      expect(out.runId).toMatch(/^[0-9a-f]{8}-/);
      expect(out.status).toBe('completed');
      expect(out.okAgentCount).toBe(2);
      expect(out.hypotheses).toHaveLength(2);
    });

    it('returns degraded + empty hypotheses on invalid input UUID', async () => {
      const out = await service.runRca({
        ...VALID_INPUT,
        defectId: 'not-a-uuid',
      } as SherlockCodeInput);
      expect(out.status).toBe('degraded');
      expect(out.hypotheses).toEqual([]);
      expect(codeAnalyze).not.toHaveBeenCalled();
    });
  });

  describe('mergeHypotheses — deterministic merge (ADR-019 §4-5)', () => {
    it('dedupes by category+hypothesis-prefix, keeps higher confidence', () => {
      const a = mkHyp(
        'code',
        'code-bug',
        'Null deref in processRefund line 42',
        0.8,
      );
      const b = mkHyp(
        'data',
        'code-bug',
        'Null deref in processRefund line 42',
        0.92,
      );
      const merged = service.mergeHypotheses([[a], [b], [], []]);
      expect(merged).toHaveLength(1);
      expect(merged[0].confidence).toBeCloseTo(0.92);
      expect(merged[0].agent).toBe('data'); // higher conf wins
    });

    it('sorts by confidence DESC then category ASC', () => {
      const merged = service.mergeHypotheses([
        [mkHyp('code', 'race-condition', 'race A ten chars', 0.5)],
        [mkHyp('data', 'code-bug', 'bug B ten chars', 0.7)],
        [mkHyp('env', 'env-config', 'env C ten chars', 0.7)],
        [],
      ]);
      expect(merged.map((h) => h.category)).toEqual([
        'code-bug',
        'env-config',
        'race-condition',
      ]);
    });

    it('caps at MAX_HYPOTHESES (10)', () => {
      const many: SherlockHypothesis[] = Array.from({ length: 25 }, (_, i) =>
        mkHyp(
          'code',
          'other',
          `hypothesis number ${i.toString().padStart(2, '0')}`,
          Math.random(),
        ),
      );
      const merged = service.mergeHypotheses([many, [], [], []]);
      expect(merged.length).toBeLessThanOrEqual(10);
    });

    it('returns [] when all 4 agents return []', () => {
      expect(service.mergeHypotheses([[], [], [], []])).toEqual([]);
    });
  });

  describe('runRca — 2-of-4 tolerance (ADR-019 §6)', () => {
    it('marks status=completed when 2 agents return non-empty', async () => {
      codeAnalyze.mockResolvedValue([
        mkHyp('code', 'code-bug', 'h1 ten chars ok', 0.8),
      ]);
      dataAnalyze.mockResolvedValue([
        mkHyp('data', 'data-bug', 'h2 ten chars ok', 0.7),
      ]);
      envAnalyze.mockResolvedValue([]);
      flakeAnalyze.mockResolvedValue([]);
      const out = await service.runRca(VALID_INPUT);
      expect(out.status).toBe('completed');
      expect(out.okAgentCount).toBe(2);
    });

    it('marks status=degraded when only 1 agent returns non-empty', async () => {
      codeAnalyze.mockResolvedValue([
        mkHyp('code', 'code-bug', 'only one ten ch', 0.8),
      ]);
      dataAnalyze.mockResolvedValue([]);
      envAnalyze.mockResolvedValue([]);
      flakeAnalyze.mockResolvedValue([]);
      const out = await service.runRca(VALID_INPUT);
      expect(out.status).toBe('degraded');
      expect(out.okAgentCount).toBe(1);
    });

    it('marks status=degraded when all 4 return [] (worst case)', async () => {
      codeAnalyze.mockResolvedValue([]);
      dataAnalyze.mockResolvedValue([]);
      envAnalyze.mockResolvedValue([]);
      flakeAnalyze.mockResolvedValue([]);
      const out = await service.runRca(VALID_INPUT);
      expect(out.status).toBe('degraded');
      expect(out.okAgentCount).toBe(0);
      expect(out.hypotheses).toEqual([]);
    });

    it('survives agent contract violation (defensive catch)', async () => {
      codeAnalyze.mockRejectedValue(new Error('contract violation'));
      dataAnalyze.mockResolvedValue([
        mkHyp('data', 'data-bug', 'd ten chars ok', 0.8),
      ]);
      envAnalyze.mockResolvedValue([
        mkHyp('env', 'env-config', 'e ten chars ok', 0.7),
      ]);
      flakeAnalyze.mockResolvedValue([]);
      const out = await service.runRca(VALID_INPUT);
      // code threw → treated as empty; data + env returned → completed.
      expect(out.status).toBe('completed');
      expect(out.okAgentCount).toBe(2);
    });
  });
});
