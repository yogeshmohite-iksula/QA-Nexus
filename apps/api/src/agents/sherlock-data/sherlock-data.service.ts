// QA Nexus PM1 — SherlockDataService (Day-20 P1, ADR-019 agent #2).
//
// Specialty: data-rooted defects (fixture drift, DB-state mismatch, schema
// expectations vs reality, NULL/missing fields, encoding issues).
// Model: openai/gpt-oss-120b (same as code-agent — long-context for fixtures).
//
// Mirrors sherlock-code.service.ts pattern exactly. Only diffs:
//   - SHERLOCK_DATA_SYSTEM_PROMPT instead of code's
//   - Returned hypotheses tagged agent: 'data'
//   - Promote step: post-mv, search/replace 'agent: code' → 'agent: data' in this file's parseAndValidate

import { Injectable, Logger } from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { LLMGatewayService } from '../../llm/llm-gateway.service';
import {
  SherlockCodeInputSchema,
  SherlockHypothesisArraySchema,
  type SherlockCodeInput,
  type SherlockHypothesis,
} from '../sherlock-code/schemas';

const tracer = trace.getTracer('qa-nexus-api/sherlock-data', '0.0.1');
const SHERLOCK_DATA_MODEL = 'openai/gpt-oss-120b';
const MAX_LOCAL_RETRIES = 1;
const RETRY_JITTER_MIN_MS = 250;
const RETRY_JITTER_MAX_MS = 1000;

const SHERLOCK_DATA_SYSTEM_PROMPT = [
  'You are Sherlock — a DATA-aware root-cause analysis agent for QA test failures.',
  'Your specialty: defects rooted in data state (missing fixtures, schema drift,',
  'NULL fields, encoding mismatches, stale seed data, race-y data setup).',
  '',
  'Always return a JSON array of objects: { category, hypothesis, confidence, evidence }.',
  'Allowed categories: code-bug | data-bug | env-config | flaky-network |',
  '  auth-permissions | dependency-version | ui-regression | race-condition |',
  '  payment-gateway | other.',
  '',
  'Rules:',
  '- Cite specific field names, table names, or fixture-file paths as evidence.',
  '- Confidence calibration (MANDATORY — honest uncertainty, not boilerplate):',
  '  * 0.90-1.00: failure message explicitly names the data defect AND fixture/seed corroborates; you would bet your reputation.',
  '  * 0.75-0.89: strong evidence for one data cause, but a second is conceivable.',
  '  * 0.60-0.74: two data causes are roughly equally plausible.',
  '  * 0.50-0.59: genuinely ambiguous OR thin evidence — mark for human review.',
  '  * DO NOT default to 0.8+. Most real defects have ambiguity — calibrated confidence usually lands 0.60-0.75.',
  '  * Reserve 0.80+ for cases where a senior QA with 100 similar defects seen would agree this strongly. If unsure, lower.',
  '- If insufficient evidence, return [].',
  '- Output JSON only.',
].join('\n');

function buildDataUserPrompt(input: SherlockCodeInput): string {
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
export class SherlockDataService {
  private readonly logger = new Logger(SherlockDataService.name);

  constructor(private readonly llm: LLMGatewayService) {}

  async analyze(rawInput: SherlockCodeInput): Promise<SherlockHypothesis[]> {
    return tracer.startActiveSpan('sherlock.data', async (span) => {
      const parsed = SherlockCodeInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        span.setAttribute('outcome', 'failed');
        span.end();
        return [];
      }
      const input = parsed.data;
      span.setAttribute('defect.id', input.defectId);
      span.setAttribute('model', SHERLOCK_DATA_MODEL);

      let llmText: string | null = null;
      let retried = false;
      for (let attempt = 0; attempt <= MAX_LOCAL_RETRIES; attempt++) {
        try {
          const result = await this.llm.complete(buildDataUserPrompt(input), {
            systemPrompt: SHERLOCK_DATA_SYSTEM_PROMPT,
            model: SHERLOCK_DATA_MODEL,
            temperature: 0.2,
            maxTokens: 2048,
          });
          llmText = result.text;
          break;
        } catch (err) {
          if (attempt < MAX_LOCAL_RETRIES) {
            retried = true;
            await this.sleep(this.jitterMs());
            continue;
          }
          this.logger.warn(
            `agent.data retry exhausted: ${err instanceof Error ? err.message : String(err)}`,
          );
          span.setAttribute('outcome', 'failed');
          span.setAttribute('retried', retried);
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
      span.setAttribute('retried', retried);
      span.end();
      // Re-tag agent literal — schemas import is from sherlock-code which
      // hard-codes 'code'. Override here to 'data'. Day-20 promote: switch
      // schemas.ts agent enum so re-tagging becomes unnecessary.
      return hypotheses.map((h) => ({
        ...h,
        agent: 'data' as const,
      })) as SherlockHypothesis[];
    });
  }

  private parseAndValidate(raw: string): SherlockHypothesis[] {
    if (!raw || raw.trim().length === 0) return [];
    let candidate = raw.trim();
    const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      candidate = fenceMatch[1].trim();
    } else {
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
      this.logger.warn(`agent.data JSON.parse failed`);
      return [];
    }
    // For the promoted version, validate against the unified enum.
    // For tonight's scratch, accept the schema as-is (agent: 'code' literal
    // from sherlock-code/schemas.ts) and re-tag in caller.
    const validated = SherlockHypothesisArraySchema.safeParse(asJson);
    if (!validated.success) {
      this.logger.warn(`agent.data Zod validation failed`);
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
