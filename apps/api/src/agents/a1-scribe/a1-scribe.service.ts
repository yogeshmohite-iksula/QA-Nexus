// QA Nexus PM1 — A1 Scribe service.
//
// Spec: PM1_PRD §3 + PM1_ERD §5 + MS0-T036.
//
// A1 Scribe = "drafts test cases from a requirement". This service is a
// pure orchestrator: it builds the prompt, calls the LLMGateway abstraction,
// parses the model's JSON response, validates with Zod, and writes the
// audit_log row via T027's AuditService.
//
// CRITICAL ARCHITECTURAL RULE (per CLAUDE.md + the noon brief):
//   This file MUST NOT import 'groq-sdk', '@google/generative-ai', or any
//   other concrete LLM SDK. The provider-agnostic seam is binding — we
//   only ever talk to LLMGatewayService.complete(). When tomorrow's free
//   provider (Mistral / Together.ai / etc.) lands, A1 Scribe gets it for
//   free with zero changes to this file.

import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { LLMGatewayService } from '../../llm/llm-gateway.service';
import { AuditService } from '../../audit/audit.service';
import { SCRIBE_SYSTEM_PROMPT, buildScribeUserPrompt } from './prompts';
import {
  GenerateTestCasesRequest,
  GenerateTestCasesResponse,
  ModelResponse,
  type DraftTestCase,
} from './schemas';

interface RunContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

@Injectable()
export class A1ScribeService {
  private readonly logger = new Logger(A1ScribeService.name);

  constructor(
    private readonly llm: LLMGatewayService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Generate `count` draft test cases for the supplied requirement.
   *
   * Audit semantics (PM1_ERD §3.13): we write a SYNCHRONOUS audit row
   * BEFORE returning success. If the audit write fails the API call also
   * fails — the chain is binding (Hard Rule 7). Failures from the LLM
   * gateway are NOT audited at this scaffold stage; M1 will add a
   * `scribe_generation_failed` event.
   */
  async generate(
    input: GenerateTestCasesRequest,
    ctx: RunContext,
  ): Promise<GenerateTestCasesResponse> {
    const t0 = Date.now();

    // 1. Build prompt
    const userPrompt = buildScribeUserPrompt({
      projectKey: input.projectKey,
      requirement: input.requirement,
      acceptanceCriteria: input.acceptanceCriteria,
      count: input.count,
    });

    // 2. Call gateway. Note: ZERO direct provider imports above this line.
    const llmResult = await this.llm.complete(userPrompt, {
      systemPrompt: input.systemPromptOverride ?? SCRIBE_SYSTEM_PROMPT,
      forceLongContext: input.forceLongContext,
      // Free-tier defaults — tuned for Groq's openai/gpt-oss-120b primary.
      // Lower temp = more deterministic JSON; max tokens guards latency.
      temperature: 0.3,
      maxTokens: 4096,
    });

    // 3. Parse the model's JSON. Some models emit trailing prose / fences;
    //    extractJson() strips both before Zod-parsing.
    const parsed = this.extractAndValidateJson(llmResult.text);

    // 4. Audit (synchronous — chain integrity is binding).
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'agent_run',
      entityId: null,
      action: 'a1_scribe_generated',
      payload: {
        agent: 'A1_Scribe',
        project_key: input.projectKey,
        requested_count: input.count,
        produced_count: parsed.test_cases.length,
        provider: llmResult.providerName,
        model: llmResult.modelUsed,
        route_reason: llmResult.routeReason,
        fallback_used: llmResult.fallbackUsed,
        tokens_in: llmResult.tokensIn,
        tokens_out: llmResult.tokensOut,
        latency_ms: llmResult.latencyMs,
        actor_email: ctx.actorEmail,
        wall_ms: Date.now() - t0,
      },
    });

    return {
      ok: true,
      testCases: parsed.test_cases,
      notes: parsed.notes,
      llm: {
        providerName: llmResult.providerName,
        modelUsed: llmResult.modelUsed,
        routeReason: llmResult.routeReason,
        fallbackUsed: llmResult.fallbackUsed,
        tokensIn: llmResult.tokensIn,
        tokensOut: llmResult.tokensOut,
        latencyMs: llmResult.latencyMs,
        cost: llmResult.cost,
      },
    };
  }

  /**
   * Models sometimes wrap JSON in ```json … ``` fences or add a leading
   * "Here are your test cases:" sentence. Strip both, then Zod-parse.
   * Throws BadGatewayException on parse failure — surfaced as 502 to the
   * caller so they retry (the LLM, not the gateway, was at fault).
   */
  private extractAndValidateJson(raw: string): ModelResponse {
    let candidate = raw.trim();

    // Strip ```json …``` or ``` …``` fences.
    const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      candidate = fenceMatch[1].trim();
    } else {
      // No fences — find first '{' and last '}' to ignore prose.
      const first = candidate.indexOf('{');
      const last = candidate.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        candidate = candidate.slice(first, last + 1);
      }
    }

    let asObject: unknown;
    try {
      asObject = JSON.parse(candidate);
    } catch {
      this.logger.warn(
        `A1 Scribe JSON.parse failed; first 200 chars: ${candidate.slice(0, 200)}`,
      );
      throw new BadGatewayException(
        'A1 Scribe model produced invalid JSON. Try again or rephrase the requirement.',
      );
    }

    const parsed = ModelResponse.safeParse(asObject);
    if (!parsed.success) {
      this.logger.warn(
        `A1 Scribe Zod-validation failed: ${parsed.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
      throw new BadGatewayException(
        'A1 Scribe model output did not match the expected schema. Try again.',
      );
    }
    return parsed.data;
  }

  /** Type-checked alias re-export so consumers of the service get the type
   *  without reaching into ./schemas. */
  static readonly DraftTestCaseT: DraftTestCase | null = null;
}
