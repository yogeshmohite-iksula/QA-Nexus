// QA Nexus PM1 — Sherlock RCA agent.code service.
//
// Spec: PM1_PRD §3 (A4 Sherlock) + ADR-019 (Sherlock prompt strategy)
// + Day-19 P1 design at `.claude/scratch/sherlock-agent-1-design.md`.
//
// agent.code = "code-aware root-cause hypotheses". One of four parallel
// Sherlock agents (code/data/env/flake) the Day-20 SherlockOrchestrator
// fans out via Promise.all. Returns category-tagged hypotheses; orchestrator
// merges deterministically.
//
// CONTRACT (mandatory):
//   - NEVER throws to caller. Returns [] on any failure (LLM down, malformed
//     JSON, Zod fail, retry exhaustion). Orchestrator counts emptiness as
//     "agent failed" for ADR-019 §6 2-of-4 tolerance check.
//   - ZERO direct LLM SDK imports — provider-agnostic seam (per A1 Scribe
//     precedent + `.claude/rules/api.md`).
//   - ZERO new DB hits. Cost-gate: Neon at 81.61/100 CU-hr per Day-19 brief.
//     `agent_run` row writes land in Day-20 orchestrator, not here.
//
// Retry chain (ADR-019 §5):
//   primary call → catch retry-eligible → 250-1000ms jitter → retry once
//     → catch second failure → return [] + OTel outcome=failed
//   (LLMGateway already does provider fallback Groq→Gemini internally per
//   llm-gateway.service.ts:240-285; this layer adds 1-retry-with-jitter.)

import { Injectable, Logger } from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { LLMGatewayService } from '../../llm/llm-gateway.service';
import {
  SHERLOCK_CODE_SYSTEM_PROMPT,
  buildSherlockCodeUserPrompt,
} from './prompts';
import {
  SherlockCodeInputSchema,
  SherlockHypothesisArraySchema,
  type SherlockCodeInput,
  type SherlockHypothesis,
} from './schemas';

const tracer = trace.getTracer('qa-nexus-api/sherlock-code', '0.0.1');

/** Groq primary model for code-agent per ADR-019 §3. Override via env at
 *  Day-20 orchestrator level if needed; hard-coded here for simplicity. */
const SHERLOCK_CODE_MODEL = 'openai/gpt-oss-120b';

/** Local 1-retry budget on top of LLMGateway's provider fallback. */
const MAX_LOCAL_RETRIES = 1;
const RETRY_JITTER_MIN_MS = 250;
const RETRY_JITTER_MAX_MS = 1000;

@Injectable()
export class SherlockCodeService {
  private readonly logger = new Logger(SherlockCodeService.name);

  constructor(private readonly llm: LLMGatewayService) {}

  /**
   * Run agent.code against a defect's failure context.
   *
   * @returns array of category-tagged hypotheses (may be empty on retry
   *          exhaustion or malformed output — never throws).
   */
  async analyze(rawInput: SherlockCodeInput): Promise<SherlockHypothesis[]> {
    return tracer.startActiveSpan('sherlock.code', async (span) => {
      // Validate input first — fail-fast on bad shape (still doesn't throw,
      // just logs + returns []). Caller is the Day-20 orchestrator which
      // builds the input from defect row + stack trace; bad shape = bug there.
      const parsed = SherlockCodeInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        this.logger.warn(
          `agent.code: input validation failed: ${parsed.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')}`,
        );
        span.setAttribute('outcome', 'failed');
        span.setAttribute('failure_reason', 'invalid_input');
        span.end();
        return [];
      }
      const input = parsed.data;

      span.setAttribute('defect.id', input.defectId);
      span.setAttribute('model', SHERLOCK_CODE_MODEL);
      span.setAttribute('input.commits_count', input.recentCommits.length);

      const userPrompt = buildSherlockCodeUserPrompt(input);
      let llmText: string | null = null;
      let retried = false;

      for (let attempt = 0; attempt <= MAX_LOCAL_RETRIES; attempt++) {
        try {
          const result = await this.llm.complete(userPrompt, {
            systemPrompt: SHERLOCK_CODE_SYSTEM_PROMPT,
            model: SHERLOCK_CODE_MODEL,
            temperature: 0.2, // deterministic JSON
            maxTokens: 2048,
          });
          llmText = result.text;
          span.setAttribute('provider', result.providerName);
          span.setAttribute('latency_ms', result.latencyMs);
          span.setAttribute('input_tokens_est', result.tokensIn);
          span.setAttribute('output_bytes', result.text.length);
          span.setAttribute('fallback_used', result.fallbackUsed);
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (attempt < MAX_LOCAL_RETRIES) {
            retried = true;
            const jitterMs = this.jitterMs();
            this.logger.warn(
              `agent.code attempt ${attempt + 1} failed (${msg}); retrying in ${jitterMs}ms`,
            );
            await this.sleep(jitterMs);
            continue;
          }
          this.logger.warn(`agent.code retry exhausted: ${msg}`);
          span.setAttribute('outcome', 'failed');
          span.setAttribute('retried', retried);
          span.setAttribute('failure_reason', 'llm_exhausted');
          span.setStatus({ code: SpanStatusCode.ERROR, message: msg });
          span.end();
          return [];
        }
      }

      span.setAttribute('retried', retried);

      // Parse JSON + Zod-validate. Any failure → return [] + log warning.
      const hypotheses = this.parseAndValidate(llmText ?? '');
      span.setAttribute(
        'outcome',
        hypotheses.length === 0 ? 'empty' : 'success',
      );
      span.setAttribute('hypotheses_count', hypotheses.length);
      span.end();
      return hypotheses;
    });
  }

  /**
   * Strip optional ```json fences, JSON.parse, Zod-validate.
   * Returns [] on any failure — pattern lifted from A1ScribeService but
   * non-throwing per Sherlock contract.
   */
  private parseAndValidate(raw: string): SherlockHypothesis[] {
    if (!raw || raw.trim().length === 0) return [];

    let candidate = raw.trim();
    const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      candidate = fenceMatch[1].trim();
    } else {
      // Find first '[' and last ']' to ignore prose surrounding the array.
      const first = candidate.indexOf('[');
      const last = candidate.lastIndexOf(']');
      if (first !== -1 && last !== -1 && last > first) {
        candidate = candidate.slice(first, last + 1);
      }
    }

    let asJson: unknown;
    try {
      asJson = JSON.parse(candidate);
    } catch {
      this.logger.warn(
        `agent.code JSON.parse failed; first 200 chars: ${candidate.slice(0, 200)}`,
      );
      return [];
    }

    const validated = SherlockHypothesisArraySchema.safeParse(asJson);
    if (!validated.success) {
      this.logger.warn(
        `agent.code Zod validation failed: ${validated.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
      return [];
    }
    return validated.data;
  }

  private jitterMs(): number {
    return (
      RETRY_JITTER_MIN_MS +
      Math.floor(Math.random() * (RETRY_JITTER_MAX_MS - RETRY_JITTER_MIN_MS))
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
