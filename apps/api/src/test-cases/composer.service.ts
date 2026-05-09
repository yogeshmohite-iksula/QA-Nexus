// QA Nexus PM1 — ComposerService (A1 / Test Case Generator).
//
// Spec: M3 Day-13 TASK BE-1. Pattern A scaffold — returns 5
// canned-but-realistic test cases for any requirement. Day-15 swaps
// the service body to call Groq `openai/gpt-oss-120b` with
// response_format=json_schema (per ADR-013, lands Day-14).
//
// Why Pattern A first:
//   - FE+1 needs F16a Composer review modal to implement against a
//     stable wire shape this week (Day-13 → Day-14 cascade).
//   - Real LLM call requires ADR-013 prompt lock + JSON schema
//     definition + retry/fallback flow which slots in Day-14/15.
//   - Locking the contract NOW (canned response, audit row written,
//     TestCaseGenerationRun persisted) lets FE flip from `stubbed: true`
//     → `stubbed: false` with zero downstream changes when Day-15 lands.
//
// Pipeline (Pattern A):
//   1. assertReqWorkspace → 404 cross-workspace OR cross-project (no leak)
//   2. Audit `composer_generation_started` (PII guard: req_key only)
//   3. Generate N canned cases (deterministic from reqId + index)
//   4. Persist TestCaseGenerationRun row (TB-022) with status='success',
//      llm_provider='groq', llm_model='openai/gpt-oss-120b', and
//      placeholder token counts. Day-15 fills these from actual call.
//   5. Audit `composer_generation_completed` with run metadata
//   6. Return { runId, cases[], llmMetadata, stubbed: true }
//
// PII discipline: audit payloads carry req_key + counts only. NEVER
// requirement title/description or generated case text (case content
// can echo customer PII from the requirement description).

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  ComposerGenerateRequest,
  ComposerGenerateResponse,
  ComposerGeneratedCase,
} from '@qa-nexus/shared';
import type { ActorContext } from './test-cases.service';

/// Day-15 swap target. Centralized so the Day-15 PR has a single
/// search-and-replace point. Mirrors ADR-012's pattern of pinning the
/// model id in source-code constants (greppable, diff-visible).
const COMPOSER_LLM_PROVIDER = 'groq' as const;
const COMPOSER_LLM_MODEL = 'openai/gpt-oss-120b' as const;

/// Deterministic latency simulator for Pattern A — returns a value in
/// the same ballpark Day-15's real Groq call will exhibit (~600-1200ms
/// observed during PR #57 RAG calls). Lets FE develop loading states
/// against realistic timing without flakiness in tests.
const STUB_LATENCY_MS = 850;
const STUB_TOKENS_IN = 420;
const STUB_TOKENS_OUT_PER_CASE = 180;

@Injectable()
export class ComposerService {
  private readonly logger = new Logger(ComposerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /// Resolve a requirement + assert its project is in the actor's
  /// workspace AND the URL's `:projectId`. 404 on any mismatch.
  private async assertReqWorkspace(
    projectId: string,
    requirementId: string,
    ctx: ActorContext,
  ): Promise<{ key: string; title: string; projectKey: string }> {
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        projectId: true,
        key: true,
        title: true,
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
      projectKey: req.project.key,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // GENERATE
  // ─────────────────────────────────────────────────────────────────

  async generate(
    projectId: string,
    requirementId: string,
    input: ComposerGenerateRequest,
    ctx: ActorContext,
  ): Promise<ComposerGenerateResponse> {
    const req = await this.assertReqWorkspace(projectId, requirementId, ctx);

    // Audit: generation started (counts/keys only, NEVER req.title).
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
        requested_count: input.count,
        requested_format: input.format,
        actor_email: ctx.actorEmail,
      },
    });

    // ────────────────────────────────────────────────────────────────
    // Pattern A scaffold — Day-15 swap point.
    // ────────────────────────────────────────────────────────────────
    // Day-15 will: build the system prompt + user message per ADR-013,
    // call this.llm.complete(prompt, { systemPrompt, temperature: 0.4,
    // maxTokens: 1500, model: COMPOSER_LLM_MODEL,
    // responseFormat: { type: 'json_schema', schema: ... } }), parse the
    // JSON response into ComposerGeneratedCase[], retry once on parse
    // failure, fall back to llama-4-scout on 2x failure, fall back to
    // Gemini on 3x failure, error on 4x.
    //
    // Today's Pattern A returns 5 canned cases derived deterministically
    // from (req.key, index) so tests are stable.
    const cases = this.generateCannedCases(req, input.count);
    const tokensOut = STUB_TOKENS_OUT_PER_CASE * cases.length;
    const latencyMs = STUB_LATENCY_MS;

    // Persist TB-022 row so audit + analytics can correlate.
    const runId = randomUUID();
    await this.prisma.testCaseGenerationRun.create({
      data: {
        id: runId,
        projectId,
        requirementId,
        triggeredBy: ctx.actorId,
        llmProvider: COMPOSER_LLM_PROVIDER,
        llmModel: COMPOSER_LLM_MODEL,
        inputTokenCount: STUB_TOKENS_IN,
        outputTokenCount: tokensOut,
        chunksRetrieved: 0, // Day-15 will set this from KbSearchService
        casesGenerated: cases.length,
        casesAccepted: null, // FE updates after F16a review
        casesDedupeFlagged: null, // Day-15+ Curator pass
        durationMs: latencyMs,
        status: 'success',
        errorReason: null,
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
        cases_generated: cases.length,
        llm_provider: COMPOSER_LLM_PROVIDER,
        llm_model: COMPOSER_LLM_MODEL,
        tokens_in: STUB_TOKENS_IN,
        tokens_out: tokensOut,
        duration_ms: latencyMs,
        stubbed: true, // Day-15 flips this off
        actor_email: ctx.actorEmail,
      },
    });

    return {
      ok: true,
      runId,
      cases,
      llmMetadata: {
        providerName: COMPOSER_LLM_PROVIDER,
        modelUsed: COMPOSER_LLM_MODEL,
        tokensIn: STUB_TOKENS_IN,
        tokensOut,
        latencyMs,
        fallbackUsed: false,
      },
      stubbed: true,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Pattern A canned-cases generator
  //
  // Returns realistic step-format test cases. Templates loosely based
  // on RET-247 (refund flow) but parameterized so any requirement
  // gets coherent output. Day-15 deletes this method.
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
      // Suggested key uses the proposal index. FE may rename before
      // POST; key uniqueness is enforced server-side at the create step.
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
        sourceChunkIds: [], // Day-15 will populate from KbSearchService
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
