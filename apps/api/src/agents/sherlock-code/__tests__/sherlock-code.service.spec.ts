// Unit tests for SherlockCodeService (Day-19 P1).
//
// Spec: ADR-019 + Day-19 design at `.claude/scratch/sherlock-agent-1-design.md`.
//
// Strategy: stub LLMGatewayService.complete() via NestJS DI useValue —
// zero real LLM calls, zero DB hits. Pattern lifted from
// a1-scribe.service.spec.ts (proven across 514/514 jest pass).
//
// Coverage (8 tests, beats brief's 4-min):
//   1. happy path — valid JSON array → parsed + returned
//   2. JSON wrapped in ```json fences → extractor strips them
//   3. JSON surrounded by prose → extractor finds the array
//   4. retry success — first call throws, second succeeds
//   5. retry exhausted — both calls throw → returns [] (NEVER throws)
//   6. malformed JSON → returns [] + logs warning
//   7. JSON with bad enum value → Zod fails → returns []
//   8. agent='code' literal — every returned hypothesis tagged 'code'
//   9. empty recentCommits — prompt construction handles gracefully
//  10. invalid input shape (bad UUID) → returns [] + warning

import { Test } from '@nestjs/testing';
import { SherlockCodeService } from '../sherlock-code.service';
import { LLMGatewayService } from '../../../llm/llm-gateway.service';
import type { SherlockCodeInput } from '../schemas';

const VALID_INPUT: SherlockCodeInput = {
  defectId: '11111111-2222-3333-4444-555555555555',
  stackTrace:
    "TypeError: Cannot read properties of null (reading 'amount')\n    at processRefund (refund.service.ts:42:18)\n    at RefundController.refund (refund.controller.ts:88:24)",
  failureMessage: 'Refund processing failed for order RET-1042',
  component: 'apps/api/src/refunds',
  recentCommits: [],
};

const VALID_HYPOTHESES = [
  {
    category: 'code-bug',
    hypothesis:
      'Null deref in processRefund at line 42 — order.payment is null when refund initiated before payment captured.',
    confidence: 0.85,
    evidence: [
      'refund.service.ts:42:18 reading amount on null',
      'failure message names RET-1042',
    ],
    agent: 'code',
  },
];

function makeLLMResult(text: string) {
  return {
    text,
    providerName: 'groq',
    modelUsed: 'openai/gpt-oss-120b',
    tokensIn: 240,
    tokensOut: 180,
    latencyMs: 420,
    fallbackUsed: false,
    cost: 0,
    routeReason: 'primary' as const,
  };
}

describe('SherlockCodeService', () => {
  let service: SherlockCodeService;
  let llmComplete: jest.Mock;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    llmComplete = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SherlockCodeService,
        {
          provide: LLMGatewayService,
          useValue: { complete: llmComplete },
        },
      ],
    }).compile();
    service = moduleRef.get(SherlockCodeService);
    // Suppress warn-log noise; assert presence via spy where relevant.
    warnSpy = jest
      .spyOn(service['logger'], 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('analyze() — happy path', () => {
    it('parses valid JSON array and returns hypotheses', async () => {
      llmComplete.mockResolvedValueOnce(
        makeLLMResult(JSON.stringify(VALID_HYPOTHESES)),
      );
      const out = await service.analyze(VALID_INPUT);
      expect(out).toHaveLength(1);
      expect(out[0].category).toBe('code-bug');
      expect(out[0].agent).toBe('code');
      expect(out[0].confidence).toBeCloseTo(0.85);
      expect(llmComplete).toHaveBeenCalledTimes(1);
    });

    it('strips ```json fences before parsing', async () => {
      const fenced = '```json\n' + JSON.stringify(VALID_HYPOTHESES) + '\n```';
      llmComplete.mockResolvedValueOnce(makeLLMResult(fenced));
      const out = await service.analyze(VALID_INPUT);
      expect(out).toHaveLength(1);
      expect(out[0].agent).toBe('code');
    });

    it('finds JSON array surrounded by prose', async () => {
      const wrapped =
        'Here are my findings:\n' +
        JSON.stringify(VALID_HYPOTHESES) +
        '\nLet me know if you need more.';
      llmComplete.mockResolvedValueOnce(makeLLMResult(wrapped));
      const out = await service.analyze(VALID_INPUT);
      expect(out).toHaveLength(1);
    });
  });

  describe('analyze() — retry chain', () => {
    it('retries once on transient failure and succeeds', async () => {
      llmComplete
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce(makeLLMResult(JSON.stringify(VALID_HYPOTHESES)));
      const out = await service.analyze(VALID_INPUT);
      expect(out).toHaveLength(1);
      expect(llmComplete).toHaveBeenCalledTimes(2);
    });

    it('returns [] (never throws) when retry exhausted', async () => {
      llmComplete
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ECONNRESET'));
      const out = await service.analyze(VALID_INPUT);
      expect(out).toEqual([]);
      expect(llmComplete).toHaveBeenCalledTimes(2);
    });
  });

  describe('analyze() — malformed output', () => {
    it('returns [] when LLM emits invalid JSON', async () => {
      llmComplete.mockResolvedValueOnce(
        makeLLMResult('this is not json at all, just prose'),
      );
      const out = await service.analyze(VALID_INPUT);
      expect(out).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('returns [] when JSON contains invalid category enum', async () => {
      const bad = [{ ...VALID_HYPOTHESES[0], category: 'made-up-category' }];
      llmComplete.mockResolvedValueOnce(makeLLMResult(JSON.stringify(bad)));
      const out = await service.analyze(VALID_INPUT);
      expect(out).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('analyze() — invariants', () => {
    it("every returned hypothesis carries agent: 'code'", async () => {
      const multi = [
        VALID_HYPOTHESES[0],
        { ...VALID_HYPOTHESES[0], category: 'race-condition', confidence: 0.4 },
      ];
      llmComplete.mockResolvedValueOnce(makeLLMResult(JSON.stringify(multi)));
      const out = await service.analyze(VALID_INPUT);
      expect(out).toHaveLength(2);
      expect(out.every((h) => h.agent === 'code')).toBe(true);
    });

    it('handles empty recentCommits without prompt error', async () => {
      llmComplete.mockResolvedValueOnce(
        makeLLMResult(JSON.stringify(VALID_HYPOTHESES)),
      );
      const out = await service.analyze({ ...VALID_INPUT, recentCommits: [] });
      expect(out).toHaveLength(1);
      const userPrompt = llmComplete.mock.calls[0][0] as string;
      expect(userPrompt).toContain('(no recent-commit context available)');
    });
  });

  describe('analyze() — input validation', () => {
    it('returns [] when input has invalid UUID', async () => {
      const out = await service.analyze({
        ...VALID_INPUT,
        defectId: 'not-a-uuid',
      } as unknown as SherlockCodeInput);
      expect(out).toEqual([]);
      expect(llmComplete).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
