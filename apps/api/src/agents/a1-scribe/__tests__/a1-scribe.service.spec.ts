// Unit tests for A1ScribeService.
//
// Spec: MS0-T036.b. Covers:
//   1. happy path — model returns clean JSON, service parses + audits + returns
//   2. model wraps JSON in ```json ... ``` fences — extractor strips them
//   3. model returns prose + JSON — extractor finds the JSON block
//   4. model returns garbage — service throws BadGatewayException (502)
//   5. model returns JSON that fails Zod (e.g., empty steps array) — 502
//   6. audit row gets the expected provenance fields
//
// Strategy: stub LLMGatewayService.complete() + AuditService.write() — no
// real LLM calls, no real DB writes. Exercises the JSON-extraction logic
// (which is the only domain-specific logic in this service).

import { Test } from '@nestjs/testing';
import { BadGatewayException } from '@nestjs/common';
import { A1ScribeService } from '../a1-scribe.service';
import { LLMGatewayService } from '../../../llm/llm-gateway.service';
import { AuditService } from '../../../audit/audit.service';

const VALID_MODEL_RESPONSE = {
  test_cases: [
    {
      title: 'User can submit a return for a delivered order',
      preconditions: 'User is signed in and has a delivered order',
      steps: [
        {
          action: 'Navigate to Orders → Returns',
          expected_result: 'Returns wizard renders',
        },
        {
          action: 'Select reason "Wrong item" and submit',
          expected_result: 'Confirmation toast shown, return appears in list',
        },
      ],
      priority: 'P1' as const,
      type: 'functional' as const,
    },
  ],
  notes: 'Assumed online-only flow.',
};

function makeLLMResultText(text: string) {
  return {
    text,
    providerName: 'groq',
    modelUsed: 'openai/gpt-oss-120b',
    tokensIn: 120,
    tokensOut: 340,
    latencyMs: 510,
    fallbackUsed: false,
    cost: 0,
    routeReason: 'primary' as const,
  };
}

describe('A1ScribeService', () => {
  let service: A1ScribeService;
  let llmComplete: jest.Mock;
  let auditWrite: jest.Mock;

  beforeEach(async () => {
    llmComplete = jest.fn();
    auditWrite = jest.fn().mockResolvedValue({ id: 'audit-1', thisHash: 'h1' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        A1ScribeService,
        {
          provide: LLMGatewayService,
          useValue: { complete: llmComplete },
        },
        {
          provide: AuditService,
          useValue: { write: auditWrite },
        },
      ],
    }).compile();
    service = moduleRef.get(A1ScribeService);
  });

  const ctx = {
    workspaceId: 'ws-1',
    actorId: 'user-1',
    actorEmail: 'yogesh.mohite@iksula.com',
  };
  const baseInput = {
    projectKey: 'RET',
    requirement:
      'A returning customer should be able to submit a return for any delivered order within 30 days.',
    count: 1,
  };

  it('happy path — clean JSON parses + audits + returns drafts', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResultText(JSON.stringify(VALID_MODEL_RESPONSE)),
    );

    const result = await service.generate(baseInput, ctx);

    expect(result.ok).toBe(true);
    expect(result.testCases).toHaveLength(1);
    expect(result.testCases[0].title).toContain('return');
    expect(result.notes).toBe('Assumed online-only flow.');
    expect(result.llm.providerName).toBe('groq');
    expect(result.llm.modelUsed).toBe('openai/gpt-oss-120b');
    expect(result.llm.fallbackUsed).toBe(false);
  });

  it('strips ```json fences before parsing', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResultText(
        '```json\n' + JSON.stringify(VALID_MODEL_RESPONSE) + '\n```',
      ),
    );
    const result = await service.generate(baseInput, ctx);
    expect(result.testCases).toHaveLength(1);
  });

  it('extracts JSON when model leads with prose', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResultText(
        'Here are your test cases:\n\n' + JSON.stringify(VALID_MODEL_RESPONSE),
      ),
    );
    const result = await service.generate(baseInput, ctx);
    expect(result.testCases).toHaveLength(1);
  });

  it('throws BadGateway on completely invalid output', async () => {
    llmComplete.mockResolvedValueOnce(makeLLMResultText('I refuse to comply.'));
    await expect(service.generate(baseInput, ctx)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(auditWrite).not.toHaveBeenCalled();
  });

  it('throws BadGateway when JSON is well-formed but Zod rejects it', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResultText(
        JSON.stringify({
          test_cases: [{ title: 'too short', steps: [] }], // empty steps
        }),
      ),
    );
    await expect(service.generate(baseInput, ctx)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(auditWrite).not.toHaveBeenCalled();
  });

  it('audit row carries full provenance', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResultText(JSON.stringify(VALID_MODEL_RESPONSE)),
    );
    await service.generate(baseInput, ctx);

    expect(auditWrite).toHaveBeenCalledTimes(1);
    const arg = auditWrite.mock.calls[0][0];
    expect(arg.workspaceId).toBe('ws-1');
    expect(arg.actorId).toBe('user-1');
    expect(arg.action).toBe('a1_scribe_generated');
    expect(arg.entityType).toBe('agent_run');
    expect(arg.payload.agent).toBe('A1_Scribe');
    expect(arg.payload.project_key).toBe('RET');
    expect(arg.payload.provider).toBe('groq');
    expect(arg.payload.model).toBe('openai/gpt-oss-120b');
    expect(arg.payload.requested_count).toBe(1);
    expect(arg.payload.produced_count).toBe(1);
    expect(arg.payload.actor_email).toBe('yogesh.mohite@iksula.com');
  });

  it('passes systemPrompt + temperature + maxTokens to gateway', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResultText(JSON.stringify(VALID_MODEL_RESPONSE)),
    );
    await service.generate(baseInput, ctx);

    expect(llmComplete).toHaveBeenCalledTimes(1);
    const [prompt, opts] = llmComplete.mock.calls[0];
    expect(prompt).toContain('Project: RET');
    expect(prompt).toContain('Requirement:');
    expect(opts.systemPrompt).toContain('A1 Scribe');
    expect(opts.temperature).toBe(0.3);
    expect(opts.maxTokens).toBe(4096);
  });

  it('respects systemPromptOverride', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResultText(JSON.stringify(VALID_MODEL_RESPONSE)),
    );
    await service.generate(
      { ...baseInput, systemPromptOverride: 'CUSTOM SYSTEM PROMPT' },
      ctx,
    );
    const [, opts] = llmComplete.mock.calls[0];
    expect(opts.systemPrompt).toBe('CUSTOM SYSTEM PROMPT');
  });

  it('forwards forceLongContext to gateway', async () => {
    llmComplete.mockResolvedValueOnce(
      makeLLMResultText(JSON.stringify(VALID_MODEL_RESPONSE)),
    );
    await service.generate({ ...baseInput, forceLongContext: true }, ctx);
    const [, opts] = llmComplete.mock.calls[0];
    expect(opts.forceLongContext).toBe(true);
  });
});
