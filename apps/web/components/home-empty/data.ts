// View-only fixtures for F08c Empty Project First-Run.
//
// FOLLOWUP (i) — seed-centralization (ADR-006):
// - Entity identity (signed-in user, active project) MOVED to context
//   hooks: `useCurrentUser()` + `useActiveProject()`.
// - The page wraps the tree in
//   `<CurrentUserProvider initialUserId={SEED_IDS.users.yogesh}>` so the
//   active user is Yogesh Mohite (the canonical Day-0 bootstrap Admin
//   per CLAUDE.md). The locked frame's rail-footer "QA LEAD" label was
//   already a documented deviation — left-rail.tsx now resolves the role
//   chip via `me.role === 'Admin' ? 'Admin' : me.organizationalLabel`.
// - View-specific stubs (`glyph`, `branch`, `isNew`, displayed
//   `projectId` composite) are inlined in the consumer components.
// - This file now holds only VIEW-FIXTURE data (HERO copy, setup cards,
//   checklist, empty-state zones).
// - Pattern A still applies: NO fetch / useMutation / axios anywhere.

export const HERO = {
  heading: "Iksula Returns is ready. Let's get it set up.",
  sub: 'Just created 2 min ago by Yogesh M. · Operate mode · Sprint 42 Day 9 of 14',
};

// ---------------------------------------------------------------------------
// BLOCK 2 — three setup cards
// ---------------------------------------------------------------------------

export interface SetupCard {
  id: string;
  variant: 'teal' | 'teal' | 'violet';
  eyebrow: string;
  fastChip?: boolean;
  title: string;
  body: string;
  chips: string[];
  ctaLabel: string;
  ctaTarget: string;
  subtext: string;
  glyph: 'connect' | 'upload' | 'ai';
}

export const SETUP_CARDS: SetupCard[] = [
  {
    id: 'connect-source',
    variant: 'teal',
    eyebrow: '~2 min',
    title: 'Connect a source',
    body: 'Pull requirements and issues from Jira, Confluence, or Figma. Best for teams already using Atlassian or existing trackers.',
    chips: ['Jira Cloud', 'Confluence', 'Figma', 'GitHub'],
    ctaLabel: 'Start with Jira →',
    ctaTarget: 'F11a-jira-oauth-step1',
    subtext: 'or connect Confluence, Figma, GitHub',
    glyph: 'connect',
  },
  {
    id: 'upload-materials',
    variant: 'teal',
    eyebrow: '~30 sec',
    title: 'Upload materials',
    body: 'Import existing requirements or test cases from XLSX, CSV, PDF, or MP4. A1 can optionally generate test cases from uploaded docs.',
    chips: ['XLSX', 'CSV', 'PDF', 'MP4 / MOV'],
    ctaLabel: 'Import files →',
    ctaTarget: 'F12-upload-modal',
    subtext: 'or drag files anywhere on this page',
    glyph: 'upload',
  },
  {
    id: 'ai-generate',
    variant: 'violet',
    eyebrow: '~1 min',
    fastChip: true,
    title: 'Let AI create your first tests',
    body: 'Paste a URL or document. A1 Test Case Generator produces structured test cases with steps, BDD, and clarifications in minutes. Review before activating.',
    chips: ['BDD', 'Traditional', 'Gherkin', 'Clarifications'],
    ctaLabel: 'Start with AI →',
    ctaTarget: 'F16a-test-case-editor-a1',
    subtext: "A1 needs input — you'll provide it on the next screen",
    glyph: 'ai',
  },
];

// ---------------------------------------------------------------------------
// BLOCK 4 — setup checklist
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export const SETUP_CHECKLIST: ChecklistItem[] = [
  { id: 'connect', label: 'Connect a source / upload materials', done: false },
  { id: 'first-case', label: 'Create your first test case', done: false },
  { id: 'invite', label: 'Invite a teammate', done: false },
  { id: 'first-run', label: 'Create your first test run', done: false },
];
