// Iksula canon stub data for F09 Projects List.
//
// Pattern A: ALL data is hard-coded TS constants — no fetch / useMutation /
// axios. Real wiring lands in MS0-T030.5+ once T021 BetterAuth + project
// queries are ready.
//
// Project list: 5 per CLAUDE.md ("Other Iksula projects" + Iksula Returns
// anchor). Locked source shows only 3 example projects; the canon is 5.

export const SIGNED_IN_USER = {
  name: 'Yogesh M.',
  initials: 'YM',
  role: 'QA Lead',
  roleId: 'QALead' as const,
};

export type ProjectRag = 'green' | 'amber' | 'red' | 'neutral';
export type BranchTone = 'main' | 'staging' | 'available';

export interface Project {
  id: string;
  name: string;
  key: string;
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

export const PROJECTS: Project[] = [
  {
    id: 'iksula-returns',
    name: 'Iksula Returns',
    key: 'RET',
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
  {
    id: 'iksula-commerce',
    name: 'Iksula Commerce',
    key: 'CART',
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
  {
    id: 'iksula-payments',
    name: 'Iksula Payments',
    key: 'PAY',
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
  {
    id: 'iksula-mobile',
    name: 'Iksula Mobile App',
    key: 'AUTH',
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
  {
    id: 'iksula-ops',
    name: 'Iksula Internal Ops',
    key: 'OPS',
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
];

export const ARCHIVED_COUNT = 0;
