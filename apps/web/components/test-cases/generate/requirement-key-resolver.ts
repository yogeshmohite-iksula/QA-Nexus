// F16b — requirement-key → (projectId, requirementId) UUID resolver.
//
// Day-15 TASK D2 transitional helper. The `/test-cases/generate?source=RET-247`
// URL carries the human-readable requirement KEY but the Composer endpoint
// needs the UUID pair `(projectId, requirementId)`.
//
// In M3.5 this resolution will hit:
//   GET /api/projects?key=RET            → projectId
//   GET /api/projects/:projectId/requirements?key=RET-247 → requirementId
//
// For Day-15 Pattern B flip we hardcode the canonical Iksula seed mapping
// matching the BE seed UUIDs that BE+1's Day-15 deploy will provision.
// These UUIDs match `docs/architecture/composer-sample-RET-247.json`'s
// `_meta.input_used` and the BE seed fixture.
//
// Returns `null` if the key isn't in the canonical seed (caller should
// surface a "requirement not found" toast and abort the generate flow
// instead of POSTing with bad UUIDs).

interface ResolvedKey {
  projectId: string;
  requirementId: string;
  /** Echo of the source key, for activity-log readability. */
  requirementKey: string;
}

// Canonical Iksula seed UUIDs — pinned to match BE seed + the
// composer-sample fixture's `_meta.input_used` payload.
//
// Project keys → UUIDs (mirrors `docs/architecture/composer-sample-RET-247.json`):
//   RET  → cccccccc-cccc-4ccc-8ccc-cccccccccccc  (Iksula Returns)
//
// Requirement keys → UUIDs:
//   RET-247 → dddddddd-dddd-4ddd-8ddd-dddddddddddd  (Refund flow within 7 days)
//
// Other RET-### / CART / PAY / AUTH / OPS keys are NOT yet seeded — they
// fall through to `null` and the FE shows a "requirement not found" toast.
const CANONICAL_SEED: Record<string, ResolvedKey> = {
  'RET-247': {
    projectId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    requirementId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    requirementKey: 'RET-247',
  },
};

export function resolveRequirementKey(key: string): ResolvedKey | null {
  return CANONICAL_SEED[key] ?? null;
}
