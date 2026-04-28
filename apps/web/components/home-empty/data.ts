// Iksula canon stub data for F08c Empty Project First-Run.
//
// Pattern A: ALL data is hard-coded TS constants — no fetch / useMutation /
// axios anywhere. Real wiring lands in MS0-T030.5+ once T021 BetterAuth +
// the home queries are ready.
//
// Iksula canon: Yogesh M. (Admin per CLAUDE.md Day-0 bootstrap, NOT QA Lead
// as the locked source incorrectly labels him in the rail-footer). Workspace
// is the freshly-bootstrapped Iksula org with one project (Iksula Returns)
// just created via F07 Founder Onboarding. No test cases / runs / defects
// yet — this is the empty state.

export const SIGNED_IN_USER = {
  name: 'Yogesh M.',
  initials: 'YM',
  role: 'Admin',
  // Locked-source deviation: rail footer labels Yogesh as 'QA LEAD' but
  // CLAUDE.md roster + Day-0 bootstrap define Yogesh as Admin. Honoring
  // the binding spec over the locked frame for this single semantic
  // inconsistency. Akshay Panchal is the actual QA Lead.
  roleId: 'Admin' as const,
};

export const ACTIVE_PROJECT = {
  name: 'Iksula Returns',
  key: 'RET' as const,
  branch: 'main',
  glyph: 'IR',
  freshness: 'just created',
  isNew: true,
  projectId: 'ORG-IKS / PRJ-RET',
};

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
