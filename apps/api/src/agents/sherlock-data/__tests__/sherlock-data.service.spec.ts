// Unit tests for SherlockDataService — Day-20 P1.
// Mirrors sherlock-code spec exactly with model + agent literal substitutions.
// REPRESENTATIVE — sherlock-env.service.spec.ts and sherlock-flake.service.spec.ts
// at promote time are produced by copy-paste + 'data'→'env'/'flake' rename.

import { Test } from '@nestjs/testing';
import { SherlockDataService } from '../sherlock-data.service';
import { LLMGatewayService } from '../../../llm/llm-gateway.service';
import type { SherlockCodeInput } from '../../sherlock-code/schemas';

const VALID_INPUT: SherlockCodeInput = {
  defectId: '11111111-2222-3333-4444-555555555555',
  stackTrace:
    'TypeError: Cannot read properties of undefined (reading "amount")\n    at processRefund (refund.service.ts:42:18)',
  failureMessage: 'Refund failed for order RET-1042: missing payment fixture',
  component: 'apps/api/src/refunds',
  recentCommits: [],
};

// IMPORTANT: this test file emits hypotheses with `agent: 'code'` (because
// sherlock-code/schemas.ts is the import source pre-Day-20-promote). After
// promote step 4 (widen agent enum to z.enum([code,data,env,flake])), the
// LLM responses below would emit `agent: 'data'` directly. Until then, the
// SherlockDataService.analyze() re-tags via .map() before returning, and
// the assertion below checks the final tagged result.
const VALID_HYPOTHESES_FROM_LLM = [
  {
    category: 'data-bug',
    hypothesis:
      'Missing payment fixture for order RET-1042 — seed data drifted from prod schema',
    confidence: 0.82,
    evidence: [
      'failure mentions RET-1042',
      'undefined.amount = missing payment row',
    ],
    agent: 'code', // pre-promote shape; service re-tags to 'data'
  },
];

function makeLLMResult(text: string) {
  return {
    text,
    providerName: 'groq',
    modelUsed: 'openai/gpt-oss-120b',
    tokensIn: 220,
    tokensOut: 160,
    latencyMs: 380,
    fallbackUsed: false,
    cost: 0,
    routeReason: 'primary' as const,
  };
}

describe('SherlockDataService', () => {
  let service: SherlockDataService;
  let llmComplete: jest.Mock;

  beforeEach(async () => {
    llmComplete = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SherlockDataService,
        { provide: LLMGatewayService, useValue: { complete: llmComplete } },
      ],
    }).compile();
    service = moduleRef.get(SherlockDataService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('happy path — valid JSON returned with agent: data', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResult(JSON.stringify(VALID_HYPOTHESES_FROM_LLM)),
    );
    const out = await service.analyze(VALID_INPUT);
    expect(out).toHaveLength(1);
    expect(out[0].agent).toBe('data'); // re-tagged by service
    expect(out[0].category).toBe('data-bug');
  });

  it('uses gpt-oss-120b for long-context', async () => {
    llmComplete.mockResolvedValueOnce(makeLLMResult('[]'));
    await service.analyze(VALID_INPUT);
    expect(llmComplete).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: 'openai/gpt-oss-120b' }),
    );
  });

  it('returns [] (never throws) on retry exhaustion', async () => {
    llmComplete
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ECONNRESET'));
    const out = await service.analyze(VALID_INPUT);
    expect(out).toEqual([]);
    expect(llmComplete).toHaveBeenCalledTimes(2);
  });

  it('returns [] on malformed JSON', async () => {
    llmComplete.mockResolvedValueOnce(makeLLMResult('definitely not json'));
    const out = await service.analyze(VALID_INPUT);
    expect(out).toEqual([]);
  });

  it('returns [] on bad input shape (invalid UUID)', async () => {
    const out = await service.analyze({
      ...VALID_INPUT,
      defectId: 'not-a-uuid',
    } as SherlockCodeInput);
    expect(out).toEqual([]);
    expect(llmComplete).not.toHaveBeenCalled();
  });
});
