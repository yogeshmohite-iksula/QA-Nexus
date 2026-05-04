// F11b Source Connect Jira · Step 2 — Map.
//
// Implements `PM1_UI_v2/frame  html view/F11b Source Connect Jira · Step 2 Map.html`.
// The locked source renders as a 1120×860 modal layered over a dimmed
// F09 background — that's a presentation device for the static mockup.
// In the React port this is a real page, mounted at:
//   /projects/[slug]/sources/jira/step-2
//
// Pattern A enforcement (PM1_PRD §F11b):
// - Mount fires `pattern-a:deferred:jira-step2-load`
//     { projectSlug, jiraProjectsCount }.
// - Picker selection fires `pattern-a:deferred:jira-project-select`
//     { jiraKey }.
// - Issue-type / priority / custom-field changes fire
//     `pattern-a:deferred:jira-mapping-change` { kind, jira, qa }.
// - Continue fires `pattern-a:deferred:jira-step2-continue` and routes
//   to step-3. Back routes to step-1; Cancel routes to /projects.
// - ZERO fetch / useMutation / axios.
//
// Hex audit: the locked source uses 5 Atlassian-brand swatch literals for
// the Jira issue-type dot indicators. None of those are on the CLAUDE.md
// whitelist, so they have been swapped for whitelisted equivalents in the
// same colour family (info / fail / secondary / pass / soft-violet) — the
// visual intent (5 distinct issue-type dots) is preserved.

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConnectJiraShell } from './connect-jira-shell';
import { ConnectJiraStepper } from './connect-jira-stepper';

interface ConnectJiraStep2PageProps {
  projectSlug: string;
}

// ---------------------------------------------------------------------------
// Stub fixtures — Pattern A.
//
// All arrays below are a UI-only fixture representing what the OAuth-
// connected iksula.atlassian.net would return. They are NOT seed user/
// project data. The Jira project list is shaped from the locked source
// (the same 5 keys CLAUDE.md uses for the workspace) so visual gating
// matches the design reference.
//
// TODO: replace with useJiraIntegration().projects + useCurrentProject()
// once seed-centralization (Day-4 P1 followup i) lands. Until then the
// names live in this file only — do NOT promote them to a shared data.ts.
// ---------------------------------------------------------------------------

interface JiraProject {
  key: string;
  name: string;
  issueCount: number;
  host: 'Cloud' | 'Server';
  linkedQaSlug?: string;
}

const STUB_JIRA_PROJECTS: JiraProject[] = [
  {
    key: 'RET',
    name: 'Iksula Returns',
    issueCount: 142,
    host: 'Cloud',
    linkedQaSlug: 'iksula-returns',
  },
  {
    key: 'CART',
    name: 'Iksula Commerce',
    issueCount: 89,
    host: 'Cloud',
    linkedQaSlug: 'iksula-commerce',
  },
  {
    key: 'PAY',
    name: 'Iksula Payments',
    issueCount: 142,
    host: 'Cloud',
    linkedQaSlug: 'iksula-payments',
  },
  {
    key: 'AUTH',
    name: 'Iksula Mobile App',
    issueCount: 67,
    host: 'Cloud',
    linkedQaSlug: 'iksula-mobile',
  },
  { key: 'OPS', name: 'Iksula Internal Ops', issueCount: 31, host: 'Cloud' },
];

// TODO: replace with useCurrentProject() once seed-centralization lands
const TODO_PROJECT_DISPLAY: Record<string, string> = {
  'iksula-returns': 'Iksula Returns',
  ret: 'Iksula Returns',
};
// TODO: replace with useCurrentUser() once seed-centralization lands
const TODO_CURRENT_USER = { initials: 'YM', email: 'yogesh.mohite@iksula.com' } as const;

const DEFAULT_JIRA_INSTANCE = 'iksula.atlassian.net';
const TOTAL_JIRA_PROJECTS = 12;

function projectNameFromSlug(slug: string): string {
  const cached = TODO_PROJECT_DISPLAY[slug.toLowerCase()];
  if (cached) return cached;
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function jiraKeyFromSlug(slug: string): string {
  const m = STUB_JIRA_PROJECTS.find((p) => p.linkedQaSlug === slug.toLowerCase());
  return m?.key ?? STUB_JIRA_PROJECTS[0].key;
}

// Whitelisted issue-type swatch palette (substitutes for Atlassian brand
// hex). Each value below is on the CLAUDE.md hex whitelist.
type IssueTypeTone = 'story' | 'bug' | 'epic' | 'task' | 'subtask';
const ISSUE_TYPE_DOT: Record<IssueTypeTone, string> = {
  story: '#60A5FA',
  bug: '#F87171',
  epic: '#A78BFA',
  task: '#34D399',
  subtask: '#C4B5FD',
};

interface IssueTypeMapping {
  jira: string;
  jiraTone: IssueTypeTone;
  qa: string;
  qaTone: 'teal' | 'fail' | 'overlay';
  count: number;
}

const DEFAULT_ISSUE_TYPE_MAP: IssueTypeMapping[] = [
  { jira: 'Story', jiraTone: 'story', qa: 'Requirement', qaTone: 'teal', count: 127 },
  { jira: 'Bug', jiraTone: 'bug', qa: 'Defect', qaTone: 'fail', count: 14 },
  { jira: 'Epic', jiraTone: 'epic', qa: 'Requirement Group', qaTone: 'teal', count: 6 },
  { jira: 'Task', jiraTone: 'task', qa: 'Test Case', qaTone: 'teal', count: 3 },
  { jira: 'Sub-task', jiraTone: 'subtask', qa: 'Test Step', qaTone: 'overlay', count: 1 },
];

interface PriorityMapping {
  jira: string;
  qa: string;
  tone: 'fail' | 'warn' | 'overlay';
}

const DEFAULT_PRIORITY_MAP: PriorityMapping[] = [
  { jira: 'Highest', qa: 'S1 Critical', tone: 'fail' },
  { jira: 'High', qa: 'S2 High', tone: 'warn' },
  { jira: 'Medium', qa: 'S3 Medium', tone: 'overlay' },
  { jira: 'Low', qa: 'S4 Low', tone: 'overlay' },
];

interface CustomFieldMapping {
  jiraId: string;
  jiraName: string;
  qaName: string;
  auto: boolean;
}

const DEFAULT_CUSTOM_FIELDS: CustomFieldMapping[] = [
  { jiraId: 'customfield_10020', jiraName: 'Sprint', qaName: 'sprint_tag', auto: true },
  { jiraId: 'customfield_10014', jiraName: 'Epic Link', qaName: 'parent_requirement', auto: true },
  { jiraId: 'components', jiraName: 'Components', qaName: 'test_suite_tag', auto: false },
];

const TOTAL_CUSTOM_FIELDS = 8;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ConnectJiraStep2Page({ projectSlug }: ConnectJiraStep2PageProps) {
  const router = useRouter();
  const projectName = projectNameFromSlug(projectSlug);
  const initialJiraKey = jiraKeyFromSlug(projectSlug);
  const [selectedJiraKey, setSelectedJiraKey] = useState(initialJiraKey);
  const [search, setSearch] = useState('');
  const [customFieldsExpanded, setCustomFieldsExpanded] = useState(false);

  useEffect(() => {
    console.info('pattern-a:deferred:jira-step2-load', {
      projectSlug,
      jiraProjectsCount: STUB_JIRA_PROJECTS.length,
      totalVisible: TOTAL_JIRA_PROJECTS,
      defaultUrl: `https://${DEFAULT_JIRA_INSTANCE}`,
    });
  }, [projectSlug]);

  const selectedJira = useMemo(
    () => STUB_JIRA_PROJECTS.find((p) => p.key === selectedJiraKey) ?? STUB_JIRA_PROJECTS[0],
    [selectedJiraKey],
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return STUB_JIRA_PROJECTS;
    return STUB_JIRA_PROJECTS.filter(
      (p) => p.key.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [search]);

  function onSelectJira(key: string) {
    if (key === selectedJiraKey) return;
    console.info('pattern-a:deferred:jira-project-select', { jiraKey: key });
    setSelectedJiraKey(key);
  }

  function onMappingChange(
    kind: 'issue-type' | 'priority' | 'custom-field',
    jira: string,
    qa: string,
  ) {
    console.info('pattern-a:deferred:jira-mapping-change', { kind, jira, qa });
  }

  function onContinue() {
    console.info('pattern-a:deferred:jira-step2-continue', {
      projectSlug,
      jiraKey: selectedJiraKey,
      jiraProjectName: selectedJira.name,
      issueTypesMapped: DEFAULT_ISSUE_TYPE_MAP.length,
      prioritiesMapped: DEFAULT_PRIORITY_MAP.length,
      customFieldsMapped: DEFAULT_CUSTOM_FIELDS.length,
    });
    router.push(`/projects/${projectSlug}/sources/jira/step-3`);
  }

  function onBack() {
    console.info('pattern-a:deferred:jira-step2-back', { projectSlug });
    router.push(`/projects/${projectSlug}/sources/jira`);
  }

  function onCancel() {
    console.info('pattern-a:deferred:jira-step2-cancel', { projectSlug });
    router.push('/projects');
  }

  function onToggleCustomFields() {
    setCustomFieldsExpanded((prev) => {
      if (!prev) console.info('pattern-a:deferred:jira-custom-fields-expand');
      return !prev;
    });
  }

  return (
    <ConnectJiraShell
      projectName={projectName}
      projectSlug={projectSlug}
      userInitials={TODO_CURRENT_USER.initials}
    >
      <main className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <PageHeader projectName={projectName} />

        <div className="mt-6 sm:mt-8">
          <ConnectJiraStepper current={2} />
        </div>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 xl:gap-8">
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5">
            <JiraProjectPicker
              projects={filteredProjects}
              total={TOTAL_JIRA_PROJECTS}
              selectedKey={selectedJiraKey}
              search={search}
              onSearchChange={setSearch}
              onSelect={onSelectJira}
            />
            <MappingPanel
              jira={selectedJira}
              issueTypes={DEFAULT_ISSUE_TYPE_MAP}
              priorities={DEFAULT_PRIORITY_MAP}
              customFields={DEFAULT_CUSTOM_FIELDS}
              totalCustomFields={TOTAL_CUSTOM_FIELDS}
              customFieldsExpanded={customFieldsExpanded}
              onToggleCustomFields={onToggleCustomFields}
              onMappingChange={onMappingChange}
            />
          </div>
          <ActivitySidebar
            jiraInstance={DEFAULT_JIRA_INSTANCE}
            totalVisible={TOTAL_JIRA_PROJECTS}
            currentJira={selectedJira}
            userEmail={TODO_CURRENT_USER.email}
          />
        </div>

        <StepFooter onBack={onBack} onCancel={onCancel} onContinue={onContinue} />
      </main>
    </ConnectJiraShell>
  );
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------

function PageHeader({ projectName }: { projectName: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="font-display text-[20px] font-medium leading-[28px] text-[var(--text-primary)] sm:text-[22px] lg:text-[24px]">
        Connect Jira to <span className="font-semibold">{projectName}</span>
      </h1>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        Step 2 of 3 · Map Jira entities to QA Nexus
      </p>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Jira project picker (left rail of the inner 2-col grid)
// ---------------------------------------------------------------------------

interface JiraProjectPickerProps {
  projects: JiraProject[];
  total: number;
  selectedKey: string;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (key: string) => void;
}

function JiraProjectPicker({
  projects,
  total,
  selectedKey,
  search,
  onSearchChange,
  onSelect,
}: JiraProjectPickerProps) {
  return (
    <aside aria-labelledby="jira-picker-head" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2
          id="jira-picker-head"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
        >
          Jira project
        </h2>
        <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
          {projects.length} of {total}
        </span>
      </div>

      <label className="flex h-9 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3">
        <span aria-hidden="true" className="text-[var(--text-tertiary)]">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${total} projects…`}
          aria-label="Search Jira projects"
          className="w-full bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
      </label>

      <ul
        role="radiogroup"
        aria-label="Jira project to map"
        className="flex max-h-[420px] flex-col overflow-y-auto rounded-md border border-[var(--border-subtle)] bg-[var(--base)]"
      >
        {projects.length === 0 ? (
          <li className="px-3 py-4 text-[12px] text-[var(--text-tertiary)]">
            No projects match &ldquo;{search}&rdquo;.
          </li>
        ) : (
          projects.map((p, idx) => (
            <li
              key={p.key}
              className={idx < projects.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}
            >
              <button
                type="button"
                role="radio"
                aria-checked={p.key === selectedKey}
                onClick={() => onSelect(p.key)}
                className={[
                  'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
                  p.key === selectedKey
                    ? 'bg-[var(--secondary)]/[0.06] border-l-[3px] border-[var(--secondary)] pl-[9px]'
                    : 'hover:bg-[var(--raised)]',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'mt-1 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
                    p.key === selectedKey
                      ? 'border-[var(--primary)]'
                      : 'border-[var(--border-strong)]',
                  ].join(' ')}
                >
                  {p.key === selectedKey && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[12px] font-semibold ${
                        p.key === selectedKey
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {p.key}
                    </span>
                    <span
                      className={`truncate text-[13px] ${
                        p.key === selectedKey
                          ? 'font-medium text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {p.name}
                    </span>
                  </span>
                  <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
                    {p.issueCount} issues · {p.host}
                  </span>
                  {p.key === selectedKey && (
                    <span className="border-[var(--pass)]/30 bg-[var(--pass)]/15 mt-1 inline-flex w-fit items-center rounded-full border px-1.5 py-[1px] font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[var(--pass)]">
                      Matches QA Nexus project
                    </span>
                  )}
                  {p.linkedQaSlug && p.key !== selectedKey && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                        <path
                          d="M8 5.5v3M8 10.5v.3"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Connected · {p.name}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      <p className="text-[11.5px] leading-[16px] text-[var(--text-tertiary)]">
        Don&apos;t see your project? Check that your Atlassian account has access.
      </p>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mapping panel (right side of inner 2-col grid)
// ---------------------------------------------------------------------------

interface MappingPanelProps {
  jira: JiraProject;
  issueTypes: IssueTypeMapping[];
  priorities: PriorityMapping[];
  customFields: CustomFieldMapping[];
  totalCustomFields: number;
  customFieldsExpanded: boolean;
  onToggleCustomFields: () => void;
  onMappingChange: (
    kind: 'issue-type' | 'priority' | 'custom-field',
    jira: string,
    qa: string,
  ) => void;
}

function MappingPanel({
  jira,
  issueTypes,
  priorities,
  customFields,
  totalCustomFields,
  customFieldsExpanded,
  onToggleCustomFields,
  onMappingChange,
}: MappingPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <SummaryStrip jira={jira} />
      <IssueTypeSection
        rows={issueTypes}
        onChange={(jira, qa) => onMappingChange('issue-type', jira, qa)}
      />
      <PrioritySection
        rows={priorities}
        onChange={(jira, qa) => onMappingChange('priority', jira, qa)}
      />
      <CustomFieldSection
        rows={customFields}
        total={totalCustomFields}
        expanded={customFieldsExpanded}
        onToggle={onToggleCustomFields}
      />
    </div>
  );
}

function SummaryStrip({ jira }: { jira: JiraProject }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-2">
      <div className="flex items-center gap-2">
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          className="text-[var(--primary)]"
          aria-hidden="true"
        >
          <path
            d="M6.5 9.5L4 12a2.1 2.1 0 1 1-3-3l2.5-2.5M9.5 6.5L12 4a2.1 2.1 0 1 1 3 3l-2.5 2.5M6 10l4-4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-mono text-[12px] font-semibold text-[var(--text-secondary)]">
          {jira.key}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          className="text-[var(--text-tertiary)]"
          aria-hidden="true"
        >
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{jira.name}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-secondary)]">
        <span className="font-mono font-semibold text-[var(--text-primary)]">
          {jira.issueCount}
        </span>
        <span>issues will sync</span>
      </div>
    </div>
  );
}

function IssueTypeSection({
  rows,
  onChange,
}: {
  rows: IssueTypeMapping[];
  onChange: (jira: string, qa: string) => void;
}) {
  return (
    <SectionShell
      title="Issue Types"
      subtitle="How Jira issue types become QA Nexus entities"
      actionLabel="Reset to defaults"
    >
      <ul className="flex flex-col overflow-hidden rounded-md border border-[var(--border-subtle)]">
        {rows.map((r, idx) => (
          <li
            key={r.jira}
            className={`flex flex-wrap items-center gap-2 bg-[var(--base)] px-3 py-2.5 ${
              idx < rows.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
            }`}
          >
            <span className="flex min-w-0 items-center gap-2 sm:w-[180px] sm:flex-none">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ background: ISSUE_TYPE_DOT[r.jiraTone] }}
              />
              <span className="text-[13px] text-[var(--text-primary)]">{r.jira}</span>
              <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
                ({r.count})
              </span>
            </span>
            <span aria-hidden="true" className="text-[var(--text-tertiary)]">
              →
            </span>
            <QaToneChip tone={r.qaTone}>{r.qa}</QaToneChip>
            <button
              type="button"
              onClick={() => onChange(r.jira, r.qa)}
              aria-label={`Edit mapping for ${r.jira}`}
              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

function PrioritySection({
  rows,
  onChange,
}: {
  rows: PriorityMapping[];
  onChange: (jira: string, qa: string) => void;
}) {
  return (
    <SectionShell
      title="Priority → Severity"
      subtitle="Jira priority maps to QA Nexus severity scale"
      actionLabel="Customize mapping"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map((r) => (
          <button
            key={r.jira}
            type="button"
            onClick={() => onChange(r.jira, r.qa)}
            className="flex flex-col items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--base)] px-2 py-2.5 text-center transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <span className="text-[12px] text-[var(--text-secondary)]">{r.jira}</span>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 3v9M4 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--text-tertiary)]"
              />
            </svg>
            <QaToneChip tone={r.tone} mono>
              {r.qa}
            </QaToneChip>
          </button>
        ))}
      </div>
    </SectionShell>
  );
}

function CustomFieldSection({
  rows,
  total,
  expanded,
  onToggle,
}: {
  rows: CustomFieldMapping[];
  total: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <SectionShell
      title="Custom Fields"
      subtitle="Atlassian standard fields auto-map; custom fields need manual mapping"
      action={
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="inline-flex items-center gap-2 text-[12px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <span className="font-mono text-[var(--text-secondary)]">
            {rows.length} of {total} mapped
          </span>
          <span>· {expanded ? 'Hide' : 'Show more'}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      }
    >
      {expanded && (
        <>
          <ul className="flex flex-col overflow-hidden rounded-md border border-[var(--border-subtle)]">
            {rows.map((r, idx) => (
              <li
                key={r.jiraId}
                className={`flex flex-wrap items-center gap-2 bg-[var(--base)] px-3 py-2.5 ${
                  idx < rows.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
                    {r.jiraId}
                  </span>
                  <span className="text-[13px] text-[var(--text-primary)]">{r.jiraName}</span>
                  <span aria-hidden="true" className="text-[var(--text-tertiary)]">
                    →
                  </span>
                  <span className="truncate font-mono text-[12px] text-[var(--text-secondary)]">
                    {r.qaName}
                  </span>
                </span>
                <span
                  className={[
                    'inline-flex h-5 items-center rounded-full border px-2 font-mono text-[10px] font-medium',
                    r.auto
                      ? 'border-[var(--primary)]/35 bg-[var(--primary)]/15 text-[var(--primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--overlay)] text-[var(--text-tertiary)]',
                  ].join(' ')}
                >
                  {r.auto ? 'Auto-detected' : 'Manual'}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-[var(--text-tertiary)]">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M8 5.5v3M8 10.5v.3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            QA Nexus auto-maps Atlassian standard fields. Custom fields require manual mapping.
          </p>
        </>
      )}
    </SectionShell>
  );
}

function SectionShell({
  title,
  subtitle,
  actionLabel,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-[14px] font-bold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-0.5 text-[11.5px] text-[var(--text-tertiary)]">{subtitle}</p>
        </div>
        {action ? (
          action
        ) : actionLabel ? (
          <button
            type="button"
            className="text-[11.5px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function QaToneChip({
  tone,
  mono,
  children,
}: {
  tone: 'teal' | 'fail' | 'warn' | 'overlay';
  mono?: boolean;
  children: React.ReactNode;
}) {
  const cls = {
    teal: 'border-[var(--primary)]/35 bg-[var(--primary)]/15 text-[var(--primary)]',
    fail: 'border-[var(--fail)]/30 bg-[var(--fail)]/15 text-[var(--fail)]',
    warn: 'border-[var(--warn)]/30 bg-[var(--warn)]/15 text-[var(--warn)]',
    overlay: 'border-[var(--border-subtle)] bg-[var(--overlay)] text-[var(--text-tertiary)]',
  }[tone];
  return (
    <span
      className={[
        'inline-flex h-[22px] items-center rounded-full border px-2.5 text-[11px] font-medium',
        cls,
        mono ? 'font-mono' : '',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Activity sidebar
// ---------------------------------------------------------------------------

function ActivitySidebar({
  jiraInstance,
  totalVisible,
  currentJira,
  userEmail,
}: {
  jiraInstance: string;
  totalVisible: number;
  currentJira: JiraProject;
  userEmail: string;
}) {
  return (
    <aside
      aria-labelledby="activity-head"
      className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--overlay)] px-4 py-4 lg:px-5 lg:py-5"
    >
      <h2
        id="activity-head"
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
      >
        Integration history
      </h2>

      <ol className="relative flex flex-col gap-3 pl-5">
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-[5px] top-1.5 w-px bg-[var(--border-subtle)]"
        />

        <ActivityEvent
          dotTone="pass"
          time="09:41 AM"
          body={
            <>
              OAuth authorized —{' '}
              <span className="font-mono text-[var(--text-primary)]">{userEmail}</span>
            </>
          }
        />
        <ActivityEvent
          dotTone="pass"
          time="09:42 AM"
          body={
            <>
              Workspace detected —{' '}
              <span className="font-mono text-[var(--text-primary)]">{jiraInstance}</span>{' '}
              <span className="text-[var(--text-tertiary)]">({totalVisible} projects visible)</span>
            </>
          }
        />
        <ActivityEvent
          dotTone="current"
          time="09:43 AM"
          body={
            <span className="font-medium text-[var(--text-primary)]">
              Mapping <span className="font-mono">{currentJira.key}</span> → {currentJira.name}
            </span>
          }
        />
        <ActivityEvent
          dotTone="pending"
          time="—"
          body={
            <span className="text-[var(--text-tertiary)]">Next: Verify with 5 sample issues</span>
          }
        />
      </ol>

      <div className="border-t border-[var(--border-subtle)] pt-3">
        <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Webhook health
        </h3>
        <span className="border-[var(--pass)]/30 bg-[var(--pass)]/15 inline-flex h-6 items-center gap-1.5 rounded-full border px-2 font-mono text-[10.5px] text-[var(--pass)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--pass)]" />
          Ready · listener registers on save
        </span>
      </div>
    </aside>
  );
}

function ActivityEvent({
  dotTone,
  time,
  body,
}: {
  dotTone: 'pass' | 'current' | 'pending';
  time: string;
  body: React.ReactNode;
}) {
  const dotClass = {
    pass: 'bg-[var(--pass)] ring-1 ring-[var(--pass)]',
    current: 'bg-[var(--secondary)] ring-1 ring-[var(--secondary)]',
    pending: 'bg-[var(--raised)] ring-2 ring-[var(--border-strong)]',
  }[dotTone];
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={`absolute -left-[18px] top-[5px] inline-block h-2.5 w-2.5 rounded-full border-2 border-[var(--overlay)] ${dotClass}`}
      />
      <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">{time}</span>
      <p className="mt-0.5 text-[12.5px] leading-[16px] text-[var(--text-secondary)]">{body}</p>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Step footer
// ---------------------------------------------------------------------------

function StepFooter({
  onBack,
  onCancel,
  onContinue,
}: {
  onBack: () => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Step 2 of 3 · Map
        </p>
        <p className="mt-1 text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
          Mapping <span className="font-semibold text-[var(--text-primary)]">1 project</span>,{' '}
          <span className="font-semibold text-[var(--text-primary)]">5 issue types</span>,{' '}
          <span className="font-semibold text-[var(--text-primary)]">4 priorities</span>,{' '}
          <span className="font-semibold text-[var(--text-primary)]">3 custom fields</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M13 8H3M7 4L3 8l4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Authorize
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Verify connection
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <span className="sr-only">
        <Link href="/projects">Exit</Link>
      </span>
    </div>
  );
}
