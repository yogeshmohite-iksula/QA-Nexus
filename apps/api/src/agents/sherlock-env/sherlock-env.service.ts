// QA Nexus PM1 — SherlockEnvService (Day-20 P1, ADR-019 agent #3).
//
// Specialty: env-config defects (env var changes vs last-passing run, feature
// flag flips, secret rotation timing, region routing).
// Model: openai/gpt-oss-20b (faster, smaller — env classification is mostly
// pattern-matching against known signals).
//
// Same shape as sherlock-data.service.ts — only diffs are the model + the
// system prompt + agent literal re-tag to 'env'.

import { Injectable, Logger } from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { LLMGatewayService } from '../../llm/llm-gateway.service';
import {
  SherlockCodeInputSchema,
  SherlockHypothesisArraySchema,
  type SherlockCodeInput,
  type SherlockHypothesis,
} from '../sherlock-code/schemas';

const tracer = trace.getTracer('qa-nexus-api/sherlock-env', '0.0.1');
const SHERLOCK_ENV_MODEL = 'openai/gpt-oss-20b';
const MAX_LOCAL_RETRIES = 1;

const SHERLOCK_ENV_SYSTEM_PROMPT = [
  'You are Sherlock — an ENV-aware root-cause analysis agent.',
  'Your specialty: defects rooted in environment configuration (env var',
  'changes, feature-flag flips, region routing, secret rotation timing,',
  'CDN/proxy misroutes).',
  '',
  'Always return a JSON array of objects: { category, hypothesis, confidence, evidence }.',
  'Allowed categories: code-bug | data-bug | env-config | flaky-network |',
  '  auth-permissions | dependency-version | ui-regression | race-condition |',
  '  payment-gateway | other.',
  '',
  'Rules:',
  '- Cite specific env var names, flag keys, or region identifiers as evidence.',
  '- Confidence calibration: 0.9+ only when stack trace explicitly names env state.',
  '- If insufficient evidence, return [].',
  '- Output JSON only.',
].join('\n');

function buildEnvUserPrompt(input: SherlockCodeInput): string {
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
export class SherlockEnvService {
  private readonly logger = new Logger(SherlockEnvService.name);
  constructor(private readonly llm: LLMGatewayService) {}

  async analyze(rawInput: SherlockCodeInput): Promise<SherlockHypothesis[]> {
    return tracer.startActiveSpan('sherlock.env', async (span) => {
      const parsed = SherlockCodeInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        span.setAttribute('outcome', 'failed');
        span.end();
        return [];
      }
      const input = parsed.data;
      span.setAttribute('defect.id', input.defectId);
      span.setAttribute('model', SHERLOCK_ENV_MODEL);

      let llmText: string | null = null;
      for (let attempt = 0; attempt <= MAX_LOCAL_RETRIES; attempt++) {
        try {
          const result = await this.llm.complete(buildEnvUserPrompt(input), {
            systemPrompt: SHERLOCK_ENV_SYSTEM_PROMPT,
            model: SHERLOCK_ENV_MODEL,
            temperature: 0.2,
            maxTokens: 1024, // smaller — env classifications are short
          });
          llmText = result.text;
          break;
        } catch (err) {
          if (attempt < MAX_LOCAL_RETRIES) continue;
          this.logger.warn(
            `agent.env retry exhausted: ${err instanceof Error ? err.message : String(err)}`,
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
        agent: 'env' as const,
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
