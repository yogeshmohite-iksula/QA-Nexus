// QA Nexus PM1 — KbAnswerService unit tests (Day-11 TASK 3).
//
// Strategy: stub KbSearchService + LLMGatewayService + AuditService.
// Pins per ADR-012 prompt strategy contract:
//   - Empty-context short-circuit (LLM NEVER called when 0 chunks)
//   - System prompt locked (regression catch if it drifts in source)
//   - Citation parser regex (UUID-anchored)
//   - Hallucinated UUIDs filtered out (cited ID NOT in retrieved set)
//   - Confidence = avg(cited similarities) || top-chunk fallback
//   - PII guard: question + answer + chunk text NEVER in audit
//   - LLM failure → ServiceUnavailableException + kb_answer_failed audit
//   - Multi-citation per sentence parsed correctly
//   - topK clamping (1..10)
//   - Audit-failure does NOT mask the original error

jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import { ServiceUnavailableException } from '@nestjs/common';
import { KbAnswerService } from '../kb-answer.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'user-1',
  actorEmail: 'kishor.kadam@iksula.com',
};

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const CHUNK_A = 'aaaaaaaa-1111-1111-1111-111111111111';
const CHUNK_B = 'bbbbbbbb-2222-2222-2222-222222222222';
const CHUNK_C = 'cccccccc-3333-3333-3333-333333333333';

function fakeChunk(id: string, similarity: number, text = 'chunk text') {
  return {
    chunkId: id,
    sourceFileId: 'doc-1',
    sourceFileName: 'return_policy_v2.xlsx',
    chunkText: text,
    chunkIndex: 0,
    source: { pageNo: null, lineRange: [0, 0] as [number, number] },
    relevanceScore: similarity,
    preview: text,
    metadataJson: {},
  };
}

function makeSearcher(chunks: ReturnType<typeof fakeChunk>[] = []) {
  return {
    search: jest.fn().mockResolvedValue({ chunks, total: chunks.length }),
  };
}

function makeLlm(opts: { text?: string; throwOnComplete?: Error } = {}) {
  return {
    complete: jest.fn().mockImplementation(() => {
      if (opts.throwOnComplete) return Promise.reject(opts.throwOnComplete);
      return Promise.resolve({
        text: opts.text ?? 'Default test answer.',
        providerName: 'groq',
        modelUsed: 'openai/gpt-oss-120b',
        tokensIn: 1247,
        tokensOut: 142,
        latencyMs: 850,
        fallbackUsed: false,
        cost: 0,
        routeReason: 'primary',
      });
    }),
  };
}

function makeAudit() {
  return { write: jest.fn().mockResolvedValue(undefined) };
}

describe('KbAnswerService — Day-11 TASK 3 (RAG answer pipeline)', () => {
  describe('answer() — empty-context short-circuit (ADR-012 §4)', () => {
    it('returns canonical "no info" answer + skips LLM when 0 chunks retrieved', async () => {
      const searcher = makeSearcher([]); // no chunks
      const llm = makeLlm();
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      const result = await svc.answer(
        { projectId: PROJECT_ID, question: 'when does the policy apply?' },
        ctx,
      );

      expect(result.noContext).toBe(true);
      expect(result.answer).toBe(
        "I don't have information on that in this knowledge base.",
      );
      expect(result.sourceChunkIds).toEqual([]);
      expect(result.confidenceScore).toBe(0);
      expect(result.retrievedChunkCount).toBe(0);
      expect(result.llmMetadata).toBeNull();

      // Critical: LLM NEVER called when no context (saves Groq RPD)
      expect(llm.complete).not.toHaveBeenCalled();

      // Audit STILL written even on noContext path (forensics)
      expect(audit.write).toHaveBeenCalledTimes(1);
      const auditCall = audit.write.mock.calls[0][0];
      expect(auditCall.action).toBe('kb_answer_generated');
      expect(auditCall.payload.no_context).toBe(true);
      expect(auditCall.payload.llm_called).toBe(false);
      expect(auditCall.payload.result_chunks).toBe(0);
    });
  });

  describe('answer() — happy path with citations', () => {
    it('passes context block + system prompt to LLMGateway, returns cited chunks', async () => {
      const chunks = [
        fakeChunk(CHUNK_A, 0.9, 'Refund window is 30 days from purchase.'),
        fakeChunk(CHUNK_B, 0.7, 'Returns require original packaging.'),
        fakeChunk(CHUNK_C, 0.6, 'Holiday returns extended to 60 days.'),
      ];
      const llmAnswer = `The refund window is 30 days [chunk: ${CHUNK_A}]. Returns also require original packaging [chunk: ${CHUNK_B}].`;
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({ text: llmAnswer });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      const result = await svc.answer(
        { projectId: PROJECT_ID, question: 'How long do I have to return?' },
        ctx,
      );

      // LLM called exactly once with the right prompt structure
      expect(llm.complete).toHaveBeenCalledTimes(1);
      const llmCall = llm.complete.mock.calls[0];
      const userMsg = llmCall[0];
      const opts = llmCall[1];

      // System prompt locked (ADR-012 §1)
      expect(opts.systemPrompt).toContain(
        "You are QA Nexus, a knowledge-base assistant for Iksula's QA team.",
      );
      expect(opts.systemPrompt).toContain('ONLY the provided context chunks');
      expect(opts.systemPrompt).toContain('[chunk: <UUID>]');
      expect(opts.temperature).toBe(0.2);
      expect(opts.maxTokens).toBe(800);

      // User message has the question + context with chunk markers
      expect(userMsg).toContain('Question: How long do I have to return?');
      expect(userMsg).toContain(`[chunk: ${CHUNK_A}]`);
      expect(userMsg).toContain(`[chunk: ${CHUNK_B}]`);
      expect(userMsg).toContain('Source: return_policy_v2.xlsx');
      expect(userMsg).toContain('Refund window is 30 days from purchase.');

      // Result shape
      expect(result.noContext).toBe(false);
      expect(result.answer).toBe(llmAnswer);
      expect(result.sourceChunkIds).toEqual([CHUNK_A, CHUNK_B]);
      expect(result.retrievedChunkCount).toBe(3);
      expect(result.llmMetadata).not.toBeNull();
      expect(result.llmMetadata!.providerName).toBe('groq');

      // Confidence = avg(cited similarities) = (0.9 + 0.7) / 2 = 0.8
      expect(result.confidenceScore).toBeCloseTo(0.8, 2);
    });

    it('handles multiple citations on one sentence', async () => {
      const chunks = [fakeChunk(CHUNK_A, 0.9), fakeChunk(CHUNK_B, 0.8)];
      const answer = `Returns are 30 days [chunk: ${CHUNK_A}][chunk: ${CHUNK_B}].`;
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({ text: answer });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      const result = await svc.answer(
        { projectId: PROJECT_ID, question: 'q' },
        ctx,
      );
      expect(result.sourceChunkIds.sort()).toEqual([CHUNK_A, CHUNK_B].sort());
    });

    it('filters hallucinated chunk IDs (cited ID NOT in retrieved set)', async () => {
      const HALLUCINATED = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const chunks = [fakeChunk(CHUNK_A, 0.9)];
      const answer = `Real cite [chunk: ${CHUNK_A}] and made-up [chunk: ${HALLUCINATED}].`;
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({ text: answer });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      const result = await svc.answer(
        { projectId: PROJECT_ID, question: 'q' },
        ctx,
      );
      // Hallucinated UUID stripped; only the real one survives
      expect(result.sourceChunkIds).toEqual([CHUNK_A]);
    });

    it('falls back to top-chunk similarity when LLM cited no chunks', async () => {
      const chunks = [fakeChunk(CHUNK_A, 0.85), fakeChunk(CHUNK_B, 0.6)];
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({ text: 'Answer with no citation markers at all.' });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      const result = await svc.answer(
        { projectId: PROJECT_ID, question: 'q' },
        ctx,
      );
      expect(result.sourceChunkIds).toEqual([]);
      // Falls back to top-chunk similarity (0.85)
      expect(result.confidenceScore).toBeCloseTo(0.85, 2);
    });
  });

  describe('answer() — citation regex behavior', () => {
    it('UUID-anchored regex rejects non-UUID citation forms', async () => {
      const chunks = [fakeChunk(CHUNK_A, 0.9)];
      const answer = `Bad form [chunk: 1] and [chunk: abc] and [chunk: ${CHUNK_A}].`;
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({ text: answer });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      const result = await svc.answer(
        { projectId: PROJECT_ID, question: 'q' },
        ctx,
      );
      // Only the well-formed UUID survives
      expect(result.sourceChunkIds).toEqual([CHUNK_A]);
    });
  });

  describe('answer() — topK clamping', () => {
    it('clamps topK above 10 to MAX_TOP_K=10', async () => {
      const searcher = makeSearcher([fakeChunk(CHUNK_A, 0.9)]);
      const llm = makeLlm();
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      await svc.answer(
        { projectId: PROJECT_ID, question: 'q', topK: 100 },
        ctx,
      );
      const searchCall = searcher.search.mock.calls[0][0];
      expect(searchCall.limit).toBe(10);
    });

    it('clamps topK below 1 to 1', async () => {
      const searcher = makeSearcher([fakeChunk(CHUNK_A, 0.9)]);
      const llm = makeLlm();
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      await svc.answer({ projectId: PROJECT_ID, question: 'q', topK: 0 }, ctx);
      const searchCall = searcher.search.mock.calls[0][0];
      expect(searchCall.limit).toBe(1);
    });

    it('uses default topK=5 when not specified', async () => {
      const searcher = makeSearcher([fakeChunk(CHUNK_A, 0.9)]);
      const llm = makeLlm();
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      await svc.answer({ projectId: PROJECT_ID, question: 'q' }, ctx);
      const searchCall = searcher.search.mock.calls[0][0];
      expect(searchCall.limit).toBe(5);
    });
  });

  describe('answer() — failure paths', () => {
    it('throws ServiceUnavailableException when LLM fails + audits kb_answer_failed', async () => {
      const chunks = [fakeChunk(CHUNK_A, 0.9)];
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({
        throwOnComplete: new Error('Groq quota exceeded'),
      });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      await expect(
        svc.answer({ projectId: PROJECT_ID, question: 'q' }, ctx),
      ).rejects.toThrow(ServiceUnavailableException);

      // Failure audit row written
      const failedCall = audit.write.mock.calls.find(
        (c) => c[0].action === 'kb_answer_failed',
      );
      expect(failedCall).toBeDefined();
      expect(failedCall![0].payload.stage).toBe('llm');
      expect(failedCall![0].payload.reason).toMatch(/Groq quota exceeded/);
      expect(failedCall![0].payload.retrieved_chunks).toBe(1);
    });

    it('propagates KbSearchService failure (e.g. embedder down) without LLM call', async () => {
      const searcher = {
        search: jest
          .fn()
          .mockRejectedValue(
            new ServiceUnavailableException('embedder deferred'),
          ),
      };
      const llm = makeLlm();
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      await expect(
        svc.answer({ projectId: PROJECT_ID, question: 'q' }, ctx),
      ).rejects.toThrow(ServiceUnavailableException);
      // LLM never called when search itself failed
      expect(llm.complete).not.toHaveBeenCalled();
    });
  });

  describe('answer() — security (PII redaction per ADR-012 §6)', () => {
    it('audit payload omits question text + answer text + chunk text', async () => {
      const chunks = [
        fakeChunk(CHUNK_A, 0.9, 'SENSITIVE_CHUNK_CONTENT_DO_NOT_LEAK'),
      ];
      const SECRET_QUESTION =
        'How do I cancel customer xyz123 refund worth $50000?';
      const SECRET_ANSWER = `Refund $50000 [chunk: ${CHUNK_A}].`;
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({ text: SECRET_ANSWER });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      await svc.answer(
        { projectId: PROJECT_ID, question: SECRET_QUESTION },
        ctx,
      );

      const auditCall = audit.write.mock.calls[0][0];
      const payloadStr = JSON.stringify(auditCall.payload);
      // PII guard: NONE of the secrets appear in the audit
      expect(payloadStr).not.toContain('xyz123');
      expect(payloadStr).not.toContain('cancel customer');
      expect(payloadStr).not.toContain('$50000');
      expect(payloadStr).not.toContain('SENSITIVE_CHUNK_CONTENT_DO_NOT_LEAK');
      expect(payloadStr).not.toContain('Refund $50000');

      // But COUNTS + provider metadata DO appear (forensics)
      expect(auditCall.payload.question_length).toBe(SECRET_QUESTION.length);
      expect(auditCall.payload.result_chunks).toBe(1);
      expect(auditCall.payload.cited_chunks).toBe(1);
      expect(auditCall.payload.provider).toBe('groq');
      expect(auditCall.payload.tokens_in).toBe(1247);
    });
  });

  describe('answer() — confidence score', () => {
    it('confidence is avg of cited similarities', async () => {
      const chunks = [
        fakeChunk(CHUNK_A, 0.9),
        fakeChunk(CHUNK_B, 0.7),
        fakeChunk(CHUNK_C, 0.5),
      ];
      const answer = `Cite A [chunk: ${CHUNK_A}] and C [chunk: ${CHUNK_C}].`;
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({ text: answer });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      const result = await svc.answer(
        { projectId: PROJECT_ID, question: 'q' },
        ctx,
      );
      // (0.9 + 0.5) / 2 = 0.7
      expect(result.confidenceScore).toBeCloseTo(0.7, 2);
    });

    it('confidence clamped to [0, 1]', async () => {
      const chunks = [fakeChunk(CHUNK_A, 1.5)]; // hypothetical overflow
      const answer = `[chunk: ${CHUNK_A}]`;
      const searcher = makeSearcher(chunks);
      const llm = makeLlm({ text: answer });
      const audit = makeAudit();
      const svc = new KbAnswerService(
        searcher as never,
        llm as never,
        audit as never,
      );

      const result = await svc.answer(
        { projectId: PROJECT_ID, question: 'q' },
        ctx,
      );
      expect(result.confidenceScore).toBe(1);
    });
  });
});
