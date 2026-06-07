// F09 Projects API — Option B wiring (Sun 2026-06-07).
// Catalog: GET /api/projects → { ok: true, projects: Project[] }
// (docs/pilot-prep/2026-06-07-sun-api-shape-catalog.md §1).
//
// Hard Rule 10: imports the shared ProjectSchema (single source of truth) —
// no FE-invented shape. Hard Rule 11: every field traces to the catalog.
//
// ⚠️ Catalog gotcha: the API Project has NO `branch`/`status` column. The
// topbar switcher only shows `· <branch>`; we merge it from a key→branch
// canned map (BRANCH_BY_KEY) — display-only, per the catalog's explicit
// instruction. Pre-seed the endpoint returns [] → fallback (canned 5) renders.

import { z } from 'zod';
import { ProjectSchema } from '@qa-nexus/shared';
import { fetchWithFallback } from './fetch-with-fallback';

/** Display shape the ProjectSwitcher renders. */
export interface SwitcherProject {
  key: string;
  name: string;
  branch: string;
}

/** Canonical fallback — the 5 Iksula projects (CLAUDE.md Iksula data canon).
 *  This is what renders pre-seed (empty API) or on any fetch failure. The
 *  ProjectSwitcher seeds its state with this so there is never an empty/
 *  loading flash. */
export const PROJECTS_FALLBACK: SwitcherProject[] = [
  { key: 'RET', name: 'Iksula Returns', branch: 'main' },
  { key: 'CART', name: 'Iksula Commerce', branch: 'main' },
  { key: 'PAY', name: 'Iksula Payments', branch: 'main' },
  { key: 'AUTH', name: 'Iksula Mobile App', branch: 'main' },
  { key: 'OPS', name: 'Iksula Internal Ops', branch: 'main' },
];

/** key → display branch. API has no branch column (catalog §1). Keep faithful
 *  to the currently-shipped switcher (all `main`); a future ProjectMeta map
 *  can introduce per-project branch/status when F09 list-page needs it. */
const BRANCH_BY_KEY: Record<string, string> = {
  RET: 'main',
  CART: 'main',
  PAY: 'main',
  AUTH: 'main',
  OPS: 'main',
};

const projectsResponseSchema = z.object({
  ok: z.literal(true),
  projects: z.array(ProjectSchema),
});

/**
 * Fetch the workspace projects for the topbar switcher.
 * Returns the canned fallback on empty / error / timeout (never throws).
 * Maps the raw API Project → SwitcherProject (key + name + merged branch).
 */
export async function getSwitcherProjects(): Promise<SwitcherProject[]> {
  const res = await fetchWithFallback(
    '/api/projects',
    null as null | z.infer<typeof projectsResponseSchema>,
    {
      schema: projectsResponseSchema,
      label: 'F09 projects',
    },
  );

  // Null = fetch failed/timed out → fallback. Empty array = pre-seed → fallback
  // (catalog: "empty arrays … your canned-data fallback is what renders").
  if (!res || res.projects.length === 0) {
    return PROJECTS_FALLBACK;
  }

  return res.projects.map((p) => ({
    key: p.key,
    name: p.name,
    branch: BRANCH_BY_KEY[p.key] ?? 'main',
  }));
}
