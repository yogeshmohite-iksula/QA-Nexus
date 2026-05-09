// QA Nexus PM1 — ComposerService Pattern A scaffold spec.
//
// Spec: M3 Day-13 TASK BE-1. Tests the Pattern A canned-response
// scaffold. Day-15 will replace the canned generator with the real
// Groq call + add new tests for retry/fallback/JSON-schema parsing.
//
// Coverage targets (8+):
//   1. happy path → cases + run row + audit
//   2. response carries stubbed: true (Pattern A flag)
//   3. count parameter respected (default 5, max 10)
//   4. all cases have format='step' (Pattern A constraint) + non-empty rationale
//   5. cross-workspace project → 404
//   6. cross-project requirement → 404
//   7. TestCaseGenerationRun row persisted with right fields
//   8. audit emits BOTH started + completed
//   9. PII guard — req title NOT in audit payload
//   10. assertWriteRole rejects Stakeholder
//   11. suggested keys follow TC-<projectKey>-PROPOSED-NNN pattern

jest.mock('../../auth/auth.service', () => ({ AuthService: class {} }));

import 'reflect-metadata';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ComposerService } from '../composer.service';
import type { ActorContext } from '../test-cases.service';

const FAKE_ACTOR: ActorContext = {
  workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  actorEmail: 'yogesh.mohite@iksula.com',
  role: 'Admin',
};

const PROJECT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const REQ_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

interface MockOpts {
  reqFound?: boolean;
  reqProjectId?: string;
  reqWorkspaceId?: string;
  reqTitle?: string;
  reqDescription?: string;
  /** When true, mock LLMGateway.deferred=true so the canned offline path
   *  engages (preserves Pattern A scaffold test semantics). Default true. */
  llmDeferred?: boolean;
}

function makeService(opts: MockOpts = {}) {
  const reqFound = opts.reqFound ?? true;
  const reqProjectId = opts.reqProjectId ?? PROJECT_ID;
  const reqWsId = opts.reqWorkspaceId ?? FAKE_ACTOR.workspaceId;
  const reqTitle = opts.reqTitle ?? 'Refund flow within 7 days';
  const reqDescription = opts.reqDescription ?? '';
  const llmDeferred = opts.llmDeferred ?? true;

  const prisma = {
    requirement: {
      findUnique: jest.fn().mockResolvedValue(
        reqFound
          ? {
              projectId: reqProjectId,
              key: 'REQ-RET-247',
              title: reqTitle,
              description: reqDescription,
              project: { workspaceId: reqWsId, key: 'RET' },
            }
          : null,
      ),
    },
    testCaseGenerationRun: {
      create: jest.fn().mockImplementation(async ({ data }) => data),
    },
  };

  const audit = {
    write: jest.fn().mockResolvedValue({ id: 'audit-1', thisHash: 'h' }),
  };

  const llm = {
    deferred: llmDeferred,
    deferredReason: llmDeferred ? 'no LLM env vars set in test' : null,
    complete: jest.fn(),
  };

  const svc = new ComposerService(prisma as any, audit as any, llm as any);
  return { svc, prisma, audit, llm };
}

describe('[@M3-BE-1] ComposerService.generate (Pattern A scaffold)', () => {
  describe('happy path', () => {
    it('returns runId + cases + llmMetadata + stubbed: true', async () => {
      const { svc } = makeService();
      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );
      expect(result.ok).toBe(true);
      expect(result.runId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.cases).toHaveLength(5);
      expect(result.stubbed).toBe(true);
      expect(result.llmMetadata.providerName).toBe('groq');
      expect(result.llmMetadata.modelUsed).toBe('openai/gpt-oss-120b');
      expect(result.llmMetadata.fallbackUsed).toBe(false);
      expect(result.llmMetadata.tokensIn).toBeGreaterThan(0);
      expect(result.llmMetadata.tokensOut).toBeGreaterThan(0);
    });

    it('respects count parameter (count=3 returns 3 cases)', async () => {
      const { svc } = makeService();
      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 3, format: 'auto' },
        FAKE_ACTOR,
      );
      expect(result.cases).toHaveLength(3);
    });

    it('default count=5 when not provided', async () => {
      const { svc } = makeService();
      // ComposerGenerateRequest.parse({}) yields { count: 5, format: 'auto' }
      // — controller does the parse before calling .generate(). Service
      // expects already-parsed input. Call with the parsed default.
      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );
      expect(result.cases).toHaveLength(5);
    });

    it('all cases have format=step (Pattern A constraint) + non-empty rationale', async () => {
      const { svc } = makeService();
      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );
      for (const c of result.cases) {
        expect(c.format).toBe('step');
        expect(c.gherkin).toBeNull();
        expect(c.rationale.length).toBeGreaterThan(0);
        expect(c.stepsJson.length).toBeGreaterThan(0);
        expect(c.sourceChunkIds).toEqual([]); // Day-15 populates from KbSearch
      }
    });

    it('suggested keys follow TC-<projectKey>-PROPOSED-NNN pattern', async () => {
      const { svc } = makeService();
      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );
      expect(result.cases[0].key).toBe('TC-RET-PROPOSED-001');
      expect(result.cases[1].key).toBe('TC-RET-PROPOSED-002');
      expect(result.cases[4].key).toBe('TC-RET-PROPOSED-005');
    });

    it('case titles include the requirement title (suffix appended)', async () => {
      const { svc } = makeService({ reqTitle: 'Refund flow within 7 days' });
      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 1, format: 'auto' },
        FAKE_ACTOR,
      );
      expect(result.cases[0].title).toContain('Refund flow within 7 days');
      expect(result.cases[0].title).toContain('happy path');
    });
  });

  describe('persistence + audit', () => {
    it('persists a TestCaseGenerationRun row with correct fields', async () => {
      const { svc, prisma } = makeService();
      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 4, format: 'auto' },
        FAKE_ACTOR,
      );
      expect(prisma.testCaseGenerationRun.create).toHaveBeenCalledTimes(1);
      const data = prisma.testCaseGenerationRun.create.mock.calls[0][0].data;
      expect(data.id).toBe(result.runId);
      expect(data.projectId).toBe(PROJECT_ID);
      expect(data.requirementId).toBe(REQ_ID);
      expect(data.triggeredBy).toBe(FAKE_ACTOR.actorId);
      expect(data.llmProvider).toBe('groq');
      expect(data.llmModel).toBe('openai/gpt-oss-120b');
      expect(data.casesGenerated).toBe(4);
      expect(data.casesAccepted).toBeNull();
      expect(data.casesDedupeFlagged).toBeNull();
      expect(data.status).toBe('success');
      expect(data.errorReason).toBeNull();
    });

    it('emits BOTH composer_generation_started + _completed audit rows', async () => {
      const { svc, audit } = makeService();
      await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );
      expect(audit.write).toHaveBeenCalledTimes(2);
      const actions = audit.write.mock.calls.map((c) => c[0].action);
      expect(actions).toEqual([
        'composer_generation_started',
        'composer_generation_completed',
      ]);
    });

    it('completed audit carries run_id + cases_generated + tokens + stubbed flag', async () => {
      const { svc, audit } = makeService();
      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );
      const completed = audit.write.mock.calls[1][0];
      expect(completed.action).toBe('composer_generation_completed');
      expect(completed.payload.run_id).toBe(result.runId);
      expect(completed.payload.cases_generated).toBe(5);
      expect(completed.payload.llm_provider).toBe('groq');
      expect(completed.payload.llm_model).toBe('openai/gpt-oss-120b');
      expect(completed.payload.stubbed).toBe(true);
    });
  });

  describe('PII redaction', () => {
    it('audit payloads omit req.title text (counts/keys only)', async () => {
      const { svc, audit } = makeService({
        reqTitle:
          'Customer XYZ refund of $50000 SECRET_REQUIREMENT_TITLE_PHRASE',
      });
      await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 1, format: 'auto' },
        FAKE_ACTOR,
      );
      const startedStr = JSON.stringify(audit.write.mock.calls[0][0]);
      const completedStr = JSON.stringify(audit.write.mock.calls[1][0]);
      for (const s of [startedStr, completedStr]) {
        expect(s).not.toContain('Customer XYZ');
        expect(s).not.toContain('50000');
        expect(s).not.toContain('SECRET_REQUIREMENT_TITLE_PHRASE');
      }
      // But req_key IS present (safe — it's just RET-247).
      expect(startedStr).toContain('REQ-RET-247');
    });
  });

  describe('error paths', () => {
    it('cross-workspace requirement → 404', async () => {
      const { svc } = makeService({ reqWorkspaceId: 'different-ws' });
      await expect(
        svc.generate(
          PROJECT_ID,
          REQ_ID,
          { count: 5, format: 'auto' },
          FAKE_ACTOR,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cross-project requirement → 404', async () => {
      const { svc } = makeService({
        reqProjectId: 'different-project-id',
      });
      await expect(
        svc.generate(
          PROJECT_ID,
          REQ_ID,
          { count: 5, format: 'auto' },
          FAKE_ACTOR,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('missing requirement → 404', async () => {
      const { svc } = makeService({ reqFound: false });
      await expect(
        svc.generate(
          PROJECT_ID,
          REQ_ID,
          { count: 5, format: 'auto' },
          FAKE_ACTOR,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('assertWriteRole', () => {
    it('allows Admin/Lead/QAEngineer', () => {
      const { svc } = makeService();
      expect(() =>
        svc.assertWriteRole({ ...FAKE_ACTOR, role: 'Admin' }),
      ).not.toThrow();
      expect(() =>
        svc.assertWriteRole({ ...FAKE_ACTOR, role: 'Lead' }),
      ).not.toThrow();
      expect(() =>
        svc.assertWriteRole({ ...FAKE_ACTOR, role: 'QAEngineer' }),
      ).not.toThrow();
    });

    it('rejects Stakeholder with 403 ForbiddenException', () => {
      const { svc } = makeService();
      expect(() =>
        svc.assertWriteRole({ ...FAKE_ACTOR, role: 'Stakeholder' }),
      ).toThrow(ForbiddenException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Day-14 TASK A3 — ONLINE Groq integration tests (ADR-013).
  // ────────────────────────────────────────────────────────────────────

  describe('[@Day-14-A3] ONLINE Groq path', () => {
    /// Build a valid LLM response for happy-path stubbing.
    function buildOkLlmResponse(count: number) {
      const cases = Array.from({ length: count }, (_, i) => ({
        key: `TC-RET-PROPOSED-${String(i + 1).padStart(3, '0')}`,
        title: `Generated case ${i + 1}`,
        preconditions: 'User authenticated',
        stepsJson: [
          { order: 1, action: 'Click submit', expected: 'Form posts' },
        ],
        expectedResult: 'Action completes',
        priority: 'P1',
        format: 'step',
        gherkin: null,
        rationale: `Validates scenario ${i + 1}`,
        sourceChunkIds: [],
      }));
      return JSON.stringify({ cases });
    }

    function buildLlmResult(text: string, fallbackUsed = false) {
      return {
        text,
        providerName: fallbackUsed ? 'gemini' : 'groq',
        modelUsed: fallbackUsed ? 'gemini-2.5-flash' : 'openai/gpt-oss-120b',
        tokensIn: 850,
        tokensOut: 1100,
        latencyMs: 1843,
        fallbackUsed,
        cost: 0,
        routeReason: fallbackUsed
          ? 'secondary_after_primary_failure'
          : 'primary',
      };
    }

    it('happy path — valid JSON → 5 cases parsed + stubbed=false', async () => {
      const { svc, llm } = makeService({ llmDeferred: false });
      llm.complete.mockResolvedValueOnce(buildLlmResult(buildOkLlmResponse(5)));

      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );

      expect(result.ok).toBe(true);
      expect(result.cases).toHaveLength(5);
      expect(result.stubbed).toBe(false);
      expect(result.llmMetadata.providerName).toBe('groq');
      expect(result.llmMetadata.modelUsed).toBe('openai/gpt-oss-120b');
      expect(result.llmMetadata.fallbackUsed).toBe(false);
      expect(result.llmMetadata.tokensIn).toBe(850);
      expect(result.llmMetadata.tokensOut).toBe(1100);
    });

    it('passes responseFormat=json_schema with composer schema name', async () => {
      const { svc, llm } = makeService({ llmDeferred: false });
      llm.complete.mockResolvedValueOnce(buildLlmResult(buildOkLlmResponse(3)));

      await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 3, format: 'auto' },
        FAKE_ACTOR,
      );

      expect(llm.complete).toHaveBeenCalledTimes(1);
      const [, opts] = llm.complete.mock.calls[0];
      expect(opts.responseFormat).toEqual(
        expect.objectContaining({
          type: 'json_schema',
          jsonSchema: expect.objectContaining({
            name: 'composer_generated_cases',
            strict: true,
          }),
        }),
      );
      expect(opts.temperature).toBe(0.4);
      expect(opts.maxTokens).toBe(1500);
      expect(opts.systemPrompt).toMatch(/QA Nexus Composer/);
    });

    it('parse retry — invalid JSON first, valid on retry → cases + run_status=partial', async () => {
      const { svc, llm, prisma } = makeService({ llmDeferred: false });
      llm.complete
        .mockResolvedValueOnce(buildLlmResult('this is not JSON'))
        .mockResolvedValueOnce(buildLlmResult(buildOkLlmResponse(5)));

      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );

      expect(result.cases).toHaveLength(5);
      expect(result.stubbed).toBe(false);
      // Reinforcement system prompt fires on the 2nd call.
      expect(llm.complete).toHaveBeenCalledTimes(2);
      const [, secondOpts] = llm.complete.mock.calls[1];
      expect(secondOpts.systemPrompt).toMatch(
        /Output ONLY the JSON object, no other text/,
      );
      // TB-022 row recorded as 'partial' with the retry note.
      const runRow =
        prisma.testCaseGenerationRun.create.mock.calls.at(-1)[0].data;
      expect(runRow.status).toBe('partial');
      expect(runRow.errorReason).toMatch(/parse retry/);
    });

    it('parse exhausted (2 invalid JSONs) → 503 + failed run row + audit', async () => {
      const { svc, llm, prisma, audit } = makeService({ llmDeferred: false });
      llm.complete
        .mockResolvedValueOnce(buildLlmResult('not json #1'))
        .mockResolvedValueOnce(buildLlmResult('not json #2'));

      await expect(
        svc.generate(
          PROJECT_ID,
          REQ_ID,
          { count: 5, format: 'auto' },
          FAKE_ACTOR,
        ),
      ).rejects.toMatchObject({
        // ServiceUnavailableException's response carries the structured payload.
        response: expect.objectContaining({
          error: 'composer_unavailable',
        }),
      });

      // Failed TB-022 row was written + composer_generation_failed audit
      // emitted before the throw.
      const runCall = prisma.testCaseGenerationRun.create.mock.calls.find(
        (c: any[]) => c[0].data.status === 'failed',
      );
      expect(runCall).toBeDefined();
      expect(runCall![0].data.errorReason).toMatch(/JSON\/Zod validation/);
      const failedAudit = audit.write.mock.calls.find(
        (c: any[]) => c[0].action === 'composer_generation_failed',
      );
      expect(failedAudit).toBeDefined();
    });

    it('gateway fallback fires (gemini answers) → fallback_used=true in audit + result', async () => {
      const { svc, llm, audit } = makeService({ llmDeferred: false });
      llm.complete.mockResolvedValueOnce(
        buildLlmResult(buildOkLlmResponse(5), /* fallbackUsed */ true),
      );

      const result = await svc.generate(
        PROJECT_ID,
        REQ_ID,
        { count: 5, format: 'auto' },
        FAKE_ACTOR,
      );

      expect(result.llmMetadata.fallbackUsed).toBe(true);
      expect(result.llmMetadata.providerName).toBe('gemini');
      const completedAudit = audit.write.mock.calls.find(
        (c: any[]) => c[0].action === 'composer_generation_completed',
      );
      expect(completedAudit![0].payload.fallback_used).toBe(true);
      expect(completedAudit![0].payload.llm_provider).toBe('gemini');
    });
  });
});
