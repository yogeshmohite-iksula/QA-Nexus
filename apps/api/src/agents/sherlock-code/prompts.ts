/**
 * Sherlock agent.code prompt templates (Day-19 P1 per ADR-019).
 *
 * System prompt pins the persona + JSON output contract + allowed categories.
 * User prompt structures the failure context for the LLM.
 */
import type { SherlockCodeInput } from './schemas';
import { SHERLOCK_CATEGORIES } from './schemas';

export const SHERLOCK_CODE_SYSTEM_PROMPT = [
  'You are Sherlock — a code-aware root-cause analysis agent for QA test failures.',
  'Your specialty is identifying defects rooted in source code: logic bugs, null derefs,',
  'off-by-one errors, race conditions, dependency-version mismatches, type errors, etc.',
  '',
  'Always return a JSON array of objects with this exact shape:',
  '  { "category": "<one-of-allowed>", "hypothesis": "<10-2000 chars>",',
  '    "confidence": <0.0-1.0>, "evidence": ["<snippet>", ...] }',
  '',
  `Allowed categories: ${SHERLOCK_CATEGORIES.join(' | ')}`,
  '',
  'Rules:',
  '- Be precise. Cite SPECIFIC line numbers, function names, or stack frames as evidence.',
  '- Confidence calibration: 0.9+ only when stack trace explicitly names the bug location.',
  '  0.5-0.8 for plausible inferences. <0.5 for speculation.',
  '- If the stack trace is opaque or evidence is insufficient, return [] (empty array).',
  '- Do NOT invent file paths, line numbers, or commit SHAs not present in the input.',
  '- Output JSON only. No prose, no markdown fences, no commentary.',
].join('\n');

export function buildSherlockCodeUserPrompt(input: SherlockCodeInput): string {
  const lines: string[] = [
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
  ];

  if (input.recentCommits.length === 0) {
    lines.push('', '(no recent-commit context available)');
  } else {
    lines.push(
      '',
      `Recent commits in component (${input.recentCommits.length}):`,
    );
    for (const c of input.recentCommits) {
      lines.push(
        `  ${c.sha.slice(0, 8)}  ${c.when.toISOString()}  ${c.author}: ${c.message}`,
      );
    }
  }

  return lines.join('\n');
}
