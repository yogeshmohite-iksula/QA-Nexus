// QA Nexus PM1 — ComposerService (A1 / Test Case Generator).
//
// Spec: M3 Day-13 TASK BE-1 (PR #93 scaffold) + Day-14 TASK A3 real
// Groq integration. ADR-013 locks the prompt strategy + JSON schema.
//
// Day-15-and-onward swap point now ACTIVE — service calls
// `LLMGatewayService.complete()` with `responseFormat=json_schema`,
// parses + Zod-validates, persists TB-022 row, audits PII-redacted.
//
// Pipeline:
//   1. assertReqWorkspace → 404 cross-workspace OR cross-project
//   2. Audit `composer_generation_started` (PII guard: req_key only)
//   3. Either:
//      a. ONLINE path (default): build prompt per ADR-013 §1, call
//         LLMGateway with the JSON schema, retry-with-reinforcement on
//         parse failure, fall through to long-context model on 2nd
//         failure (gateway handles secondary-provider fallback per
//         retry policy), parse + Zod-validate.
//      b. OFFLINE path (`COMPOSER_OFFLINE=1`): emit canned cases for
//         dev-without-internet. Sets `stubbed: true` in response.
//   4. Persist TestCaseGenerationRun (TB-022) with real token counts
//   5. Audit `composer_generation_completed` with run metadata
//   6. Return { runId, cases[], llmMetadata, stubbed }
//
// PII discipline: audit payloads carry req_key + counts only. NEVER
// requirement title/description, generated case text, raw prompt, or
// raw completion. Pinned by composer-pii-guard.spec.ts.

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LLMGatewayService } from '../llm/llm-gateway.service';
import {
  AllProvidersFailedError,
  RetryableLLMError,
  type LLMResult,
} from '../llm/types';
import {
  ComposerGenerateRequest,
  type ComposerGenerateResponse,
  type ComposerGeneratedCase,
} from '@qa-nexus/shared';
import {
  COMPOSER_SYSTEM_PROMPT,
  COMPOSER_JSON_REINFORCEMENT,
  COMPOSER_RESPONSE_JSON_SCHEMA,
  COMPOSER_RESPONSE_SCHEMA_NAME,
  COMPOSER_TEMPERATURE,
  COMPOSER_MAX_TOKENS,
  ComposerParseError,
  buildComposerUserMessage,
  type ComposerLLMResponse,
} from './composer-prompt';
import type { ActorContext } from './test-cases.service';

/// Provider identifier surfaced in audit + TB-022. The actual provider
/// answering may differ when fallback fires; `LLMResult.providerName`
/// + `LLMResult.modelUsed` are the source of truth at runtime.
const COMPOSER_LLM_PROVIDER_DEFAULT = 'groq';
const COMPOSER_LLM_MODEL_DEFAULT = 'openai/gpt-oss-120b';

/// Offline-mode token estimate constants — used when COMPOSER_OFFLINE=1
/// emits canned cases without an LLM call. Kept in same ballpark as
/// real Groq calls observed during PR #57 RAG.
const STUB_LATENCY_MS = 850;
const STUB_TOKENS_IN = 420;
const STUB_TOKENS_OUT_PER_CASE = 180;

/// Hard ceiling on JSON-parse retries before we give up. Each retry
/// re-calls the LLM (cost) so cap small. ADR-013 §5 attempt 1 + 2.
const MAX_JSON_PARSE_RETRIES = 1;

/// Zod schema for the LLM response envelope. Re-uses the canonical
/// case shape from @qa-nexus/shared via the input parser; we hand-
/// build the envelope here to avoid pulling in extra deps.
const CASES_VALIDATION_SCHEMA = z.object({
  cases: z
    .array(
      // The LLM emits the same shape as ComposerGeneratedCase; we
      // re-validate with explicit types to catch enum drift.
      z.object({
        key: z.string().min(2).max(40),
        title: z.string().min(1),
        preconditions: z.string(),
        stepsJson: z.array(
          z.object({
            order: z.number().int().nonnegative(),
            action: z.string().min(1),
            expected: z.string().optional(),
          }),
        ),
        expectedResult: z.string(),
        priority: z.enum(['P0', 'P1', 'P2', 'P3']),
        format: z.enum(['step', 'gherkin']),
        gherkin: z.string().nullable(),
        rationale: z.string(),
        sourceChunkIds: z.array(z.string().uuid()),
      }),
    )
    .min(1)
    .max(10),
});

@Injectable()
export class ComposerService {
  private readonly logger = new Logger(ComposerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly llm: LLMGatewayService,
  ) {}

  /// Resolve a requirement + assert its project is in the actor's
  /// workspace AND the URL's `:projectId`. 404 on any mismatch.
  private async assertReqWorkspace(
    projectId: string,
    requirementId: string,
    ctx: ActorContext,
  ): Promise<{
    key: string;
    title: string;
    description: string;
    projectKey: string;
  }> {
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        projectId: true,
        key: true,
        title: true,
        description: true,
        project: { select: { workspaceId: true, key: true } },
      },
    });
    if (
      !req ||
      req.projectId !== projectId ||
      req.project.workspaceId !== ctx.workspaceId
    ) {
      throw new NotFoundException(
        `requirement ${requirementId} not found in this project`,
      );
    }
    return {
      key: req.key,
      title: req.title,
      description: req.description ?? '',
      projectKey: req.project.key,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // GENERATE
  // ─────────────────────────────────────────────────────────────────

  async generate(
    projectId: string,
    requirementId: string,
    rawInput: unknown,
    ctx: ActorContext,
  ): Promise<ComposerGenerateResponse> {
    // Re-parse input here as well as the controller — defense in
    // depth + lets us call generate() from internal triggers later.
    const input = ComposerGenerateRequest.parse(rawInput);
    const req = await this.assertReqWorkspace(projectId, requirementId, ctx);

    // Audit: generation started (counts/keys only, NEVER req.title
    // text or description text).
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'composer_run',
      entityId: requirementId,
      action: 'composer_generation_started',
      payload: {
        project_id: projectId,
        requirement_id: requirementId,
        workspace_id: ctx.workspaceId,
        req_key: req.key,
        title_length: req.title.length,
        description_length: req.description.length,
        requested_count: input.count,
        requested_format: input.format,
        actor_email: ctx.actorEmail,
      },
    });

    // ────────────────────────────────────────────────────────────────
    // Online vs offline mode branch.
    // ────────────────────────────────────────────────────────────────
    const offline = process.env.COMPOSER_OFFLINE === '1';
    let cases: ComposerGeneratedCase[];
    let providerName: string;
    let modelUsed: string;
    let tokensIn: number;
    let tokensOut: number;
    let latencyMs: number;
    let fallbackUsed: boolean;
    let stubbed: boolean;
    let runStatus: 'success' | 'partial' | 'failed' = 'success';
    let errorReason: string | null = null;

    if (offline || this.llm.deferred) {
      // Offline / deferred-gateway path — emit canned cases.
      const reason = offline
        ? 'COMPOSER_OFFLINE=1'
        : `LLM gateway deferred: ${this.llm.deferredReason ?? 'unknown'}`;
      this.logger.log(`composer offline path engaged: ${reason}`);
      cases = this.generateCannedCases(req, input.count);
      providerName = COMPOSER_LLM_PROVIDER_DEFAULT;
      modelUsed = COMPOSER_LLM_MODEL_DEFAULT;
      tokensIn = STUB_TOKENS_IN;
      tokensOut = STUB_TOKENS_OUT_PER_CASE * cases.length;
      latencyMs = STUB_LATENCY_MS;
      fallbackUsed = false;
      stubbed = true;
    } else {
      // ONLINE path — call LLMGateway with retry chain per ADR-013 §5.
      try {
        const llmRun = await this.callComposerLLM(req, input);
        cases = llmRun.cases;
        providerName = llmRun.providerName;
        modelUsed = llmRun.modelUsed;
        tokensIn = llmRun.tokensIn;
        tokensOut = llmRun.tokensOut;
        latencyMs = llmRun.latencyMs;
        fallbackUsed = llmRun.fallbackUsed;
        stubbed = false;
        if (llmRun.parseRetries > 0) {
          runStatus = 'partial';
          errorReason = `succeeded after ${llmRun.parseRetries} JSON-parse retry attempt(s)`;
        }
      } catch (err) {
        runStatus = 'failed';
        const msg = err instanceof Error ? err.message : String(err);
        errorReason = msg.length > 500 ? msg.slice(0, 500) : msg;
        // Still write the failed TB-022 row + audit BEFORE re-throwing
        // so the chain stays auditable.
        const failedRunId = randomUUID();
        await this.prisma.testCaseGenerationRun.create({
          data: {
            id: failedRunId,
            projectId,
            requirementId,
            triggeredBy: ctx.actorId,
            llmProvider: COMPOSER_LLM_PROVIDER_DEFAULT,
            llmModel: COMPOSER_LLM_MODEL_DEFAULT,
            inputTokenCount: 0,
            outputTokenCount: 0,
            chunksRetrieved: 0,
            casesGenerated: 0,
            casesAccepted: null,
            casesDedupeFlagged: null,
            durationMs: 0,
            status: 'failed',
            errorReason,
          },
        });
        await this.audit.write({
          workspaceId: ctx.workspaceId,
          actorId: ctx.actorId,
          entityType: 'composer_run',
          entityId: failedRunId,
          action: 'composer_generation_failed',
          payload: {
            run_id: failedRunId,
            project_id: projectId,
            requirement_id: requirementId,
            workspace_id: ctx.workspaceId,
            req_key: req.key,
            error_reason: errorReason,
            actor_email: ctx.actorEmail,
          },
        });
        // Surface as 503 — FE shows "Composer temporarily unavailable".
        throw new ServiceUnavailableException({
          error: 'composer_unavailable',
          message:
            'Composer could not generate test cases — all providers exhausted.',
          retry_after: 60,
          run_id: failedRunId,
        });
      }
    }

    // Persist TB-022 success/partial row.
    const runId = randomUUID();
    await this.prisma.testCaseGenerationRun.create({
      data: {
        id: runId,
        projectId,
        requirementId,
        triggeredBy: ctx.actorId,
        llmProvider: providerName,
        llmModel: modelUsed,
        inputTokenCount: tokensIn,
        outputTokenCount: tokensOut,
        chunksRetrieved: 0, // M3.5 will set this from KbSearchService
        casesGenerated: cases.length,
        casesAccepted: null, // FE updates after F16a review
        casesDedupeFlagged: null, // Curator pass populates
        durationMs: latencyMs,
        status: runStatus,
        errorReason,
      },
    });

    // Audit: generation completed.
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'composer_run',
      entityId: runId,
      action: 'composer_generation_completed',
      payload: {
        run_id: runId,
        project_id: projectId,
        requirement_id: requirementId,
        workspace_id: ctx.workspaceId,
        req_key: req.key,
        title_length: req.title.length,
        description_length: req.description.length,
        cases_generated: cases.length,
        llm_provider: providerName,
        llm_model: modelUsed,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        duration_ms: latencyMs,
        fallback_used: fallbackUsed,
        run_status: runStatus,
        stubbed,
        actor_email: ctx.actorEmail,
      },
    });

    return {
      ok: true,
      runId,
      cases,
      llmMetadata: {
        providerName,
        modelUsed,
        tokensIn,
        tokensOut,
        latencyMs,
        fallbackUsed,
      },
      stubbed,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // ONLINE LLM call orchestration — ADR-013 §5 retry chain.
  // ─────────────────────────────────────────────────────────────────

  private async callComposerLLM(
    req: {
      key: string;
      title: string;
      description: string;
      projectKey: string;
    },
    input: ComposerGenerateRequest,
  ): Promise<{
    cases: ComposerGeneratedCase[];
    providerName: string;
    modelUsed: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    fallbackUsed: boolean;
    parseRetries: number;
  }> {
    const userMessage = buildComposerUserMessage({
      reqKey: req.key,
      reqTitle: req.title,
      reqDescription: req.description,
      projectKey: req.projectKey,
      count: input.count,
      format: input.format,
      // M3.5 will populate from KbSearchService when input.useKbContext.
      chunks: undefined,
    });

    let parseRetries = 0;
    let lastResult: LLMResult | null = null;

    for (let attempt = 0; attempt <= MAX_JSON_PARSE_RETRIES; attempt++) {
      const systemPrompt =
        attempt === 0
          ? COMPOSER_SYSTEM_PROMPT
          : `${COMPOSER_SYSTEM_PROMPT}\n\n${COMPOSER_JSON_REINFORCEMENT}`;
      let result: LLMResult;
      try {
        result = await this.llm.complete(userMessage, {
          systemPrompt,
          temperature: COMPOSER_TEMPERATURE,
          maxTokens: COMPOSER_MAX_TOKENS,
          responseFormat: {
            type: 'json_schema',
            jsonSchema: {
              name: COMPOSER_RESPONSE_SCHEMA_NAME,
              strict: true,
              schema: COMPOSER_RESPONSE_JSON_SCHEMA as Record<string, unknown>,
            },
          },
        });
      } catch (err) {
        // RetryableLLMError + AllProvidersFailedError both bubble out.
        // Gateway already retried + tried fallback provider; no more
        // retries here. Re-throw to outer try/catch in generate().
        if (
          err instanceof RetryableLLMError ||
          err instanceof AllProvidersFailedError
        ) {
          throw err;
        }
        throw err;
      }
      lastResult = result;

      // Parse + validate.
      let parsed: ComposerLLMResponse;
      try {
        const json = JSON.parse(result.text) as unknown;
        parsed = CASES_VALIDATION_SCHEMA.parse(json) as ComposerLLMResponse;
      } catch (err) {
        // Parse OR Zod validation failed. Retry with reinforcement
        // unless we've burned our budget.
        if (attempt < MAX_JSON_PARSE_RETRIES) {
          parseRetries += 1;
          this.logger.warn(
            `composer JSON parse failed on attempt ${attempt + 1} ` +
              `(provider=${result.providerName} model=${result.modelUsed}); ` +
              `retrying with reinforcement`,
          );
          continue;
        }
        // Out of retries. Throw a typed error so generate() turns it
        // into a 503 with audit trail.
        throw new ComposerParseError(
          `Composer LLM output failed JSON/Zod validation after ${attempt + 1} attempt(s): ${
            err instanceof Error ? err.message : String(err)
          }`,
          result.text.length > 500 ? result.text.slice(0, 500) : result.text,
        );
      }

      // Success.
      return {
        cases: parsed.cases,
        providerName: result.providerName,
        modelUsed: result.modelUsed,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        latencyMs: result.latencyMs,
        fallbackUsed: result.fallbackUsed,
        parseRetries,
      };
    }

    // Unreachable — loop either returns or throws.
    /* c8 ignore next */
    throw new Error(
      `composer retry loop exited without return (lastResult=${lastResult?.providerName ?? 'none'})`,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Offline canned-cases generator — kept for COMPOSER_OFFLINE=1 dev
  // mode + automatic fallback when LLM gateway is deferred (no env
  // vars). Output shape identical to LLM path so the FE can render
  // either without branching.
  // ─────────────────────────────────────────────────────────────────

  private generateCannedCases(
    req: { key: string; title: string; projectKey: string },
    count: number,
  ): ComposerGeneratedCase[] {
    const templates: Array<{
      titleSuffix: string;
      precondition: string;
      steps: Array<{ action: string; expected: string }>;
      expectedResult: string;
      priority: 'P0' | 'P1' | 'P2' | 'P3';
      rationale: string;
    }> = [
      {
        titleSuffix: 'happy path — primary user flow',
        precondition: 'User authenticated; relevant entity in valid state.',
        steps: [
          {
            action: `Navigate to the screen described by ${req.key}`,
            expected: 'Screen loads with default state.',
          },
          {
            action: 'Trigger the primary action under test',
            expected: 'Action executes without error.',
          },
          {
            action: 'Verify the success outcome',
            expected: 'Expected behavior occurs end-to-end.',
          },
        ],
        expectedResult: `Primary flow described by ${req.key} completes successfully.`,
        priority: 'P1',
        rationale:
          'Covers the core happy-path described in the requirement. Highest-value first case per testing pyramid.',
      },
      {
        titleSuffix: 'invalid input — validation error',
        precondition: 'User authenticated; entity in valid pre-state.',
        steps: [
          {
            action: 'Submit invalid input (empty / malformed / out-of-range)',
            expected: 'Server returns 400 with field-level error.',
          },
          {
            action: 'Verify FE renders error inline next to the field',
            expected: 'Error message visible; submit button stays disabled.',
          },
        ],
        expectedResult:
          'Invalid input is rejected at both client + server; user sees actionable error.',
        priority: 'P1',
        rationale:
          'Validation errors are the most common user-facing failure mode. Covers both layers of defense.',
      },
      {
        titleSuffix: 'cross-workspace isolation guard',
        precondition: 'Two workspaces with overlapping entity IDs.',
        steps: [
          {
            action:
              'User in workspace A attempts to fetch entity from workspace B',
            expected: 'API returns 404 (not 403 — leak-free).',
          },
          {
            action: 'Verify response body is opaque (no entity-existence leak)',
            expected: '404 message is generic; no metadata leaked.',
          },
        ],
        expectedResult:
          'Cross-workspace access denied with no existence leak (mirrors M2 isolation pattern).',
        priority: 'P0',
        rationale:
          'Multi-tenant isolation is the highest-risk security control. Canon: 404 not 403 on cross-tenant.',
      },
      {
        titleSuffix: 'audit log integrity',
        precondition: 'User performs the action under test.',
        steps: [
          {
            action: 'Trigger the action that should write an audit row',
            expected: 'Audit row written synchronously with HMAC chain link.',
          },
          {
            action: 'Run pnpm verify:audit',
            expected: 'Chain integrity verified; no tampered or skipped rows.',
          },
        ],
        expectedResult:
          'Action emits a chain-bound audit row; verifier accepts the chain.',
        priority: 'P1',
        rationale:
          'Hard Rule 7: every state-changing action writes audit_log. Verifier must re-run clean.',
      },
      {
        titleSuffix: 'rate-limit + retry behavior',
        precondition: 'Rate limiter configured; user has no quota remaining.',
        steps: [
          {
            action: 'Attempt the action when over rate limit',
            expected: '429 with Retry-After header.',
          },
          {
            action: 'Wait the indicated duration + retry',
            expected: 'Action succeeds on retry.',
          },
        ],
        expectedResult:
          'Rate limit returns 429 with backoff hint; retry succeeds within window.',
        priority: 'P2',
        rationale:
          'Rate limiting protects free-tier quotas; tests both the limit + the recovery path.',
      },
      {
        titleSuffix: 'concurrent edit conflict resolution',
        precondition: 'Two users open the same entity simultaneously.',
        steps: [
          {
            action: 'User A saves their changes',
            expected: 'Save succeeds; entity updated.',
          },
          {
            action: 'User B saves their changes (with stale version)',
            expected: '409 Conflict with current entity state.',
          },
        ],
        expectedResult:
          'Optimistic locking prevents lost updates; user B sees conflict UX.',
        priority: 'P2',
        rationale:
          'Multi-user QA workspaces have concurrent edits regularly. Conflict UX is a quality-gate must.',
      },
      {
        titleSuffix: 'role-based access control',
        precondition: 'Stakeholder role (read-only) attempts a write action.',
        steps: [
          {
            action: 'Stakeholder POSTs to a write endpoint',
            expected: '403 Forbidden.',
          },
          {
            action: 'Verify audit_log writes rbac_denied row',
            expected: 'Audit row present with action_attempted + denied_role.',
          },
        ],
        expectedResult:
          'RBAC denial is enforced at the @Roles guard layer + recorded in audit.',
        priority: 'P0',
        rationale:
          'Hard Rule 7 + RBAC matrix per Milestone_M3_Test_Cases_AI_v2.md §RBAC.',
      },
      {
        titleSuffix: 'soft-delete preserves historical references',
        precondition: 'Entity has linked child rows + run results.',
        steps: [
          {
            action: 'Archive the entity via DELETE',
            expected: '200; entity status flips to archived.',
          },
          {
            action: 'Verify child references still resolve',
            expected: 'Linked children + run results still queryable.',
          },
        ],
        expectedResult:
          'Soft-delete (status=archived/deprecated) preserves historical FK references.',
        priority: 'P1',
        rationale:
          'M3 v2 plan + PR #85/87 reconciliation note: keep run results valid post-archive.',
      },
      {
        titleSuffix: 'PII redaction in audit payload',
        precondition: 'Entity carries sensitive fields (e.g., customer name).',
        steps: [
          {
            action: 'Trigger the action that writes the audit row',
            expected: 'Audit row written.',
          },
          {
            action: 'Inspect audit payload',
            expected:
              'Payload contains length/count metadata only; no raw text.',
          },
        ],
        expectedResult: 'Audit payload omits PII; counts/keys only.',
        priority: 'P0',
        rationale:
          'PII discipline: M2/M3 services pin this with negative test assertions.',
      },
      {
        titleSuffix: 'pagination + filter combinations',
        precondition: 'Project has > 1 page worth of entities.',
        steps: [
          {
            action: 'GET list with combined filters (priority + status + q)',
            expected: '200 with filtered + paginated results.',
          },
          {
            action: 'Page through the result set',
            expected: 'Cursor / page params return consistent ordering.',
          },
        ],
        expectedResult:
          'Filter + pagination compose correctly; total + page metadata accurate.',
        priority: 'P2',
        rationale:
          'F11/F14 list views need stable pagination across filter changes.',
      },
    ];

    return templates.slice(0, count).map((t, idx) => {
      const stepsJson = t.steps.map((s, i) => ({
        order: i + 1,
        action: s.action,
        expected: s.expected,
      }));
      const suggestedKey = `TC-${req.projectKey}-PROPOSED-${String(idx + 1).padStart(3, '0')}`;
      return {
        key: suggestedKey,
        title: `${req.title} — ${t.titleSuffix}`,
        preconditions: t.precondition,
        stepsJson,
        expectedResult: t.expectedResult,
        priority: t.priority,
        format: 'step' as const,
        gherkin: null,
        rationale: t.rationale,
        sourceChunkIds: [],
      };
    });
  }

  /// Defense-in-depth: even though @Roles guard catches Stakeholder
  /// writes upstream, service-layer throws ForbiddenException if
  /// Stakeholder hits the generate path via shaped request.
  assertWriteRole(ctx: ActorContext): void {
    if (ctx.role === 'Stakeholder') {
      throw new ForbiddenException(
        'Stakeholder role is read-only on test case generation',
      );
    }
  }
}
