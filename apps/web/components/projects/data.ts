// View-only fixtures for F09 Projects List.
//
// FOLLOWUP (i) — seed-centralization (ADR-006, refined post PR #16):
// - Entity identity (signed-in user, project entity rows) MOVED to
//   context hooks: `useCurrentUser()` + `useProjectList()` from
//   `@/lib/contexts/{CurrentUser,Project}Context`.
// - The page wraps the tree in
//   `<CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>` so
//   the active user is Yogesh Mohite (Admin viewing the workspace's
//   project list — this matches the original SIGNED_IN_USER intent).
// - The 5-project list is read from `useProjectList()` (the demo seed
//   has the same 5 Iksula projects in the same order). For each seed
//   project, a per-key view-fixture entry below provides the sprint /
//   RAG / counts / lastActivity copy that's NOT yet on the Project
//   entity (sprints + run results land in M2+).
// - Pattern A still applies: NO fetch / useMutation / axios anywhere.

export type ProjectRag = 'green' | 'amber' | 'red' | 'neutral';
export type BranchTone = 'main' | 'staging' | 'available';

/**
 * View-only display state per project — joined with the seed entity
 * (Project type from `@qa-nexus/shared`) by `key` at render time. Each
 * field below is either a sprint computation, a roll-up of M2+ entities
 * (runs, defects), or pure UI fixture (RAG, branch chip, "your role"
 * membership status). When BE adds the corresponding entities in M2+,
 * these fields swap their data source — the consumer keeps reading via
 * the same join shape.
 */
export interface ProjectViewFixture {
  glyph: string;
  branch: string;
  branchTone: BranchTone;
  sprint: string;
  passRate: string;
  rag: ProjectRag;
  ragLabel: string;
  openCases: string;
  automated: string;
  defects: string;
  yourRole: 'Lead' | 'Admin' | 'QA Engineer' | 'Stakeholder';
  lastActivity: string;
  isPinned: boolean;
  isAnchor?: boolean;
  setup?: { incomplete?: boolean; note?: string };
}

/** View-fixture lookup keyed by `Project.key` (e.g. `'RET'`, `'CART'`). */
export const PROJECT_VIEW_FIXTURES: Record<string, ProjectViewFixture> = {
  RET: {
    glyph: 'IR',
    branch: 'main',
    branchTone: 'main',
    sprint: 'Sprint 42 · Day 9 of 14 · pass rate 87%',
    passRate: '87%',
    rag: 'amber',
    ragLabel: 'AMBER · 3 P1 defects open',
    openCases: '6 open cases',
    automated: '52 automated',
    defects: '3 defects',
    yourRole: 'Lead',
    lastActivity: 'Last activity 18 min ago by Kishor K.',
    isPinned: true,
    isAnchor: true,
  },
  CART: {
    glyph: 'IC',
    branch: 'main',
    branchTone: 'main',
    sprint: 'Sprint 42 · Day 9 of 14 · pass rate 91%',
    passRate: '91%',
    rag: 'green',
    ragLabel: 'GREEN · on track',
    openCases: '12 open cases',
    automated: '68 automated',
    defects: '2 defects',
    yourRole: 'Lead',
    lastActivity: 'Last activity 1h ago by Nitin G.',
    isPinned: false,
  },
  PAY: {
    glyph: 'IP',
    branch: 'staging',
    branchTone: 'staging',
    sprint: 'Sprint 42 · Day 9 of 14 · pass rate 82%',
    passRate: '82%',
    rag: 'amber',
    ragLabel: 'AMBER · 3 P1 defects open',
    openCases: '12 open cases',
    automated: '47 automated',
    defects: '3 defects',
    yourRole: 'Lead',
    lastActivity: 'Last activity 2h ago by Nadim S.',
    isPinned: false,
  },
  AUTH: {
    glyph: 'IM',
    branch: 'main',
    branchTone: 'main',
    sprint: 'Sprint 41 · ended 3d ago · pass rate 88%',
    passRate: '88%',
    rag: 'green',
    ragLabel: 'GREEN · on track',
    openCases: '24 open cases',
    automated: '38 automated',
    defects: '1 defect',
    yourRole: 'Lead',
    lastActivity: 'Last activity 1d ago by Mohanraj K.',
    isPinned: false,
  },
  OPS: {
    glyph: 'IO',
    branch: 'available',
    branchTone: 'available',
    sprint: 'Not configured yet',
    passRate: '—',
    rag: 'neutral',
    ragLabel: 'AVAILABLE · not configured',
    openCases: '0 open cases',
    automated: '0 automated',
    defects: '0 defects',
    yourRole: 'Admin',
    lastActivity: 'Created 2d ago — set up to start',
    isPinned: false,
    setup: { incomplete: true, note: 'Set up your first sprint' },
  },
};

/**
 * Composite display row — join of seed entity (id + key + name) with the
 * per-key view fixture above. Components destructure both layers from
 * this single shape, identical to the legacy `Project` interface so the
 * downstream JSX stays unchanged.
 */
export interface ProjectListRow extends ProjectViewFixture {
  id: string;
  name: string;
  key: string;
}

/**
 * Helper: join `useProjectList()` output with the per-key view fixtures.
 * Falls back to a minimal "available" fixture for any seed project that
 * doesn't yet have a view-fixture entry (e.g., a newly-created project
 * via F10 will appear here with default empty-state copy).
 */
export function joinProjectsWithFixtures(
  seedProjects: Array<{ id: string; key: string; name: string }>,
): ProjectListRow[] {
  return seedProjects.map((p) => {
    const fixture = PROJECT_VIEW_FIXTURES[p.key];
    if (fixture) {
      return { id: p.id, name: p.name, key: p.key, ...fixture };
    }
    // Fallback for newly-created projects (post-F10) without view fixture.
    return {
      id: p.id,
      name: p.name,
      key: p.key,
      glyph: p.key.slice(0, 2),
      branch: 'available',
      branchTone: 'available' as const,
      sprint: 'Not configured yet',
      passRate: '—',
      rag: 'neutral' as const,
      ragLabel: 'AVAILABLE · not configured',
      openCases: '0 open cases',
      automated: '0 automated',
      defects: '0 defects',
      yourRole: 'Admin' as const,
      lastActivity: 'Just created — set up to start',
      isPinned: false,
      setup: { incomplete: true, note: 'Set up your first sprint' },
    };
  });
}

export const ARCHIVED_COUNT = 0;
