// F16b — Composer wire-shape adapter (Pattern B flip helper).
//
// Day-15 TASK D2. Maps BE `ComposerGeneratedCase` (from
// `@qa-nexus/shared`) → FE `GeneratedCase` (from `./canned-data`) so the
// existing case-card / case-list-pane render trees work unchanged after
// the Pattern A → B flip.
//
// Why an adapter (not a refactor of GeneratedCase)?
//   - GeneratedCase carries display-only derived fields (confidenceTier,
//     similarityTier) that the BE response intentionally doesn't include
//     (Composer's job is generation, not Curator's similarity scoring).
//   - The case-card / case-list-pane / streaming-card components already
//     ship + screenshot-passed in PR #110. Keeping their props shape
//     stable lets us land the wire-up with zero render-tree change.
//
// Future M3.5 follow-up: when Curator dedup callouts wire to the real
// `POST /api/projects/:projectId/test-cases/:tcId/duplicates` endpoint,
// add a second adapter `composerCase + curatorMatches → GeneratedCase`
// that fills `curatorDup` from the Curator response.

import type { ComposerGeneratedCase } from '@qa-nexus/shared';
import type { GeneratedCase, CaseStep } from './canned-data';

/**
 * Adapts ONE BE-generated case into the FE display shape.
 *
 * @param bc          The wire payload from Composer.
 * @param requirementKey The requirement key from URL `?source=…` (e.g. 'RET-247').
 *                       Used as `groundedReq` since BE response doesn't echo it.
 */
export function adaptComposerCase(
  bc: ComposerGeneratedCase,
  requirementKey: string,
): GeneratedCase {
  return {
    id: bc.key,
    title: bc.title,
    // Newly generated cases land in 'drafted' state — user reviews +
    // accepts/rejects from there. ('queued'/'streaming' are reserved
    // for the streaming card UX during the actual generation call.)
    state: 'drafted',
    // Confidence + similarity are NOT in Composer response; they come
    // from Curator (similarity) + a future per-case scoring (confidence).
    // Use sensible defaults that render as "high confidence, distinct"
    // until those signals wire in.
    confidencePct: 85,
    confidenceTier: 'high',
    similarityPct: 0,
    similarityTier: 'distinct',
    groundedReq: requirementKey,
    groundedChunkId: bc.sourceChunkIds[0] ?? 'CHUNK-PENDING',
    steps: bc.stepsJson.map(
      (s): CaseStep => ({
        step: s.order,
        // Display-side concatenates BE `action` (the imperative verb)
        // with `expected` (the per-step assertion) so the card text
        // reads like "Do X — assert Y". Keeps the existing single-line
        // step-row layout intact.
        text: s.expected ? `${s.action} — ${s.expected}` : s.action,
      }),
    ),
    expected: bc.expectedResult,
    // No curatorDup — that's a separate Curator endpoint (M3.5 wire-up).
  };
}

/** Convenience: adapt the whole `cases[]` array in one call. */
export function adaptComposerCases(
  cases: ComposerGeneratedCase[],
  requirementKey: string,
): GeneratedCase[] {
  return cases.map((c) => adaptComposerCase(c, requirementKey));
}
