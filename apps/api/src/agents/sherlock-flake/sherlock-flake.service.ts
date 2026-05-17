// QA Nexus PM1 — SherlockFlakeService (Day-20 P1, ADR-019 agent #4).
//
// Specialty: flaky-test detection (retry-history pattern, intermittent
// network failures, time-of-day correlation, parallel-test contamination).
// Model: openai/gpt-oss-20b (faster, smaller — flake patterns are mostly
// statistical signals, no need for heavy reasoning).

import { Injectable, Logger } from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { LLMGatewayService } from '../../llm/llm-gateway.service';
import {
  SherlockCodeInputSchema,
  SherlockHypothesisArraySchema,
  type SherlockCodeInput,
  type SherlockHypothesis,
} from '../sherlock-code/schemas';

const tracer = trace.getTracer('qa-nexus-api/sherlock-flake', '0.0.1');
const SHERLOCK_FLAKE_MODEL = 'openai/gpt-oss-20b';
const MAX_LOCAL_RETRIES = 1;

const SHERLOCK_FLAKE_SYSTEM_PROMPT = [
  'You are Sherlock — a FLAKE-pattern root-cause analysis agent.',
  'Your specialty: flaky tests (retry-success patterns, intermittent network',
  'failures, race-y test setup, parallel-test contamination, time-of-day',
  'correlation with external services).',
  '',
  'Always return a JSON array of objects: { category, hypothesis, confidence, evidence }.',
  'Allowed categories: code-bug | data-bug | env-config | flaky-network |',
  '  auth-permissions | dependency-version | ui-regression | race-condition |',
  '  payment-gateway | other.',
  '',
  'Rules:',
  '- Cite retry counts, error timing patterns, or specific network signals.',
  '- Confidence calibration: 0.9+ only when retry-pass-rate signal is strong.',
  '- If insufficient evidence (single failure, no retry history), return [].',
  '- Output JSON only.',
].join('\n');

function buildFlakeUserPrompt(input: SherlockCodeInput): string {
  return [
    `Defect ID: ${input.defectId}`,
    `Component: ${input.component ?? '(unknown)'}`,
    '',
    'Failure message:',
    input.failureMessage,
    '',
    'Stack trace:',
    '```',
    input.stackTrace,
    '```',
  ].join('\n');
}

@Injectable()
export class SherlockFlakeService {
  private readonly logger = new Logger(SherlockFlakeService.name);
  constructor(private readonly llm: LLMGatewayService) {}

  async analyze(rawInput: SherlockCodeInput): Promise<SherlockHypothesis[]> {
    return tracer.startActiveSpan('sherlock.flake', async (span) => {
      const parsed = SherlockCodeInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        span.setAttribute('outcome', 'failed');
        span.end();
        return [];
      }
      const input = parsed.data;
      span.setAttribute('defect.id', input.defectId);
      span.setAttribute('model', SHERLOCK_FLAKE_MODEL);

      let llmText: string | null = null;
      for (let attempt = 0; attempt <= MAX_LOCAL_RETRIES; attempt++) {
        try {
          const result = await this.llm.complete(buildFlakeUserPrompt(input), {
            systemPrompt: SHERLOCK_FLAKE_SYSTEM_PROMPT,
            model: SHERLOCK_FLAKE_MODEL,
            temperature: 0.2,
            maxTokens: 1024,
          });
          llmText = result.text;
          break;
        } catch (err) {
          if (attempt < MAX_LOCAL_RETRIES) continue;
          this.logger.warn(
            `agent.flake retry exhausted: ${err instanceof Error ? err.message : String(err)}`,
          );
          span.setAttribute('outcome', 'failed');
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.end();
          return [];
        }
      }

      const hypotheses = this.parseAndValidate(llmText ?? '');
      span.setAttribute(
        'outcome',
        hypotheses.length === 0 ? 'empty' : 'success',
      );
      span.end();
      return hypotheses.map((h) => ({
        ...h,
        agent: 'flake' as const,
      })) as SherlockHypothesis[];
    });
  }

  private parseAndValidate(raw: string): SherlockHypothesis[] {
    if (!raw || raw.trim().length === 0) return [];
    let candidate = raw.trim();
    const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) candidate = fenceMatch[1].trim();
    else {
      const first = candidate.indexOf('[');
      const last = candidate.lastIndexOf(']');
      if (first !== -1 && last !== -1 && last > first)
        candidate = candidate.slice(first, last + 1);
    }
    let asJson: unknown;
    try {
      asJson = JSON.parse(candidate);
    } catch {
      return [];
    }
    const validated = SherlockHypothesisArraySchema.safeParse(asJson);
    return validated.success ? validated.data : [];
  }
}
