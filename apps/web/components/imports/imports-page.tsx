// F13 Imported Files List — main orchestrator.
//
// Implements `PM1_UI_v2/frame  html view/F13 Imported Files List.html`.
// Mounted at `/projects/[slug]/imports`. Reached from F12 submit.
//
// Pattern A enforcement (PM1_PRD §F13) — 7 deferred markers:
// - Mount → `pattern-a:deferred:imports-list-load`
//     { projectSlug, fileCount, statusBreakdown }.
// - Filter change → `pattern-a:deferred:imports-filter-change`
//     { kind, value }.
// - Sort change → `pattern-a:deferred:imports-sort-change` { sort }.
// - View tab change → `pattern-a:deferred:imports-view-change` { view }.
// - Row action → `pattern-a:deferred:imports-row-action`
//     { importId, action }.
// - Upload more → `pattern-a:deferred:imports-upload-more`
//     { from: 'F13' } + route to /projects/{slug}/upload.
// - Export history → `pattern-a:deferred:imports-export-history`.
// - ZERO fetch / useMutation / axios.

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useProject, useProjectList } from '@/lib/contexts/ProjectContext';
import { useTeamMember } from '@/lib/contexts/TeamRosterContext';
import { SEED_IDS } from '@/lib/demo-seed';

interface ImportsPageProps {
  projectSlug: string;
}

// View-fixture stub: each entry pairs an import-id with its display columns.
// Names of uploaders come from the seed via `useTeamMember(uploaderId)`.
type ImportStatus = 'in_progress' | 'completed' | 'pending_action' | 'failed';
type ImportSourceKind = 'upload' | 'jira' | 'figma' | 'confluence';
type ImportType = 'requirements' | 'test_cases' | 'other';
type FileKindBadge = 'xls' | 'csv' | 'pdf' | 'mp4' | 'fig' | 'htm' | 'jira' | 'mixed';

interface ImportRow {
  importId: number;
  primaryFileLabel: string;
  primaryFileKind: FileKindBadge;
  fileMeta: string;
  fileTone: 'pass' | 'primary' | 'secondary' | 'info' | 'tertiary';
  morePill?: string;
  type: ImportType;
  source: ImportSourceKind;
  status: ImportStatus;
  statusDetail?: string;
  progressPct?: number;
  caseCount: number;
  casePill?: { label: string; tone: 'a1' | 'a1-drafting' | 'imported' };
  uploaderId: string;
  isNew?: boolean;
  isSelected?: boolean;
}

// Pattern A view fixture — what `/api/imports?projectKey=RET&limit=6` will
// eventually return. Names of uploaders read from the seed via `useTeamMember`.
const SAMPLE_IMPORTS: ImportRow[] = [
  {
    importId: 242,
    primaryFileLabel: 'return_policy_v2.xlsx',
    primaryFileKind: 'xls',
    fileMeta: '14.4 MB total',
    fileTone: 'pass',
    morePill: '+ 2 more',
    type: 'requirements',
    source: 'upload',
    status: 'in_progress',
    statusDetail: '23% · ~47s remaining',
    progressPct: 23,
    caseCount: 8,
    casePill: { label: 'A1 DRAFTING', tone: 'a1-drafting' },
    uploaderId: SEED_IDS.users.yogesh,
    isNew: true,
    isSelected: true,
  },
  {
    importId: 241,
    primaryFileLabel: 'RET · Jira sync',
    primaryFileKind: 'jira',
    fileMeta: '142 issues · 9:58 AM',
    fileTone: 'info',
    type: 'requirements',
    source: 'jira',
    status: 'completed',
    caseCount: 142,
    casePill: { label: 'Imported', tone: 'imported' },
    uploaderId: SEED_IDS.users.yogesh,
  },
  {
    importId: 240,
    primaryFileLabel: 'figma_mocks_checkout.fig',
    primaryFileKind: 'fig',
    fileMeta: '8.2 MB · yesterday 4:12 PM',
    fileTone: 'secondary',
    type: 'other',
    source: 'figma',
    status: 'pending_action',
    statusDetail: 'OAuth re-auth needed',
    caseCount: 0,
    uploaderId: SEED_IDS.users.akshay,
  },
  {
    importId: 239,
    primaryFileLabel: 'q2_sprint_42_stories.xlsx',
    primaryFileKind: 'xls',
    fileMeta: '2.1 MB · yesterday 2:48 PM',
    fileTone: 'pass',
    type: 'requirements',
    source: 'upload',
    status: 'completed',
    caseCount: 34,
    casePill: { label: 'A1', tone: 'a1' },
    uploaderId: SEED_IDS.users.kishor,
  },
  {
    importId: 238,
    primaryFileLabel: 'confluence_auth_module_prd.html',
    primaryFileKind: 'htm',
    fileMeta: '640 KB · 2d ago',
    fileTone: 'tertiary',
    type: 'requirements',
    source: 'confluence',
    status: 'failed',
    statusDetail: 'AI couldn’t parse · 3 sections empty',
    caseCount: 0,
    uploaderId: SEED_IDS.users.nitin,
  },
  {
    importId: 237,
    primaryFileLabel: 'customer_return_flow_recording.mp4',
    primaryFileKind: 'mp4',
    fileMeta: '12.4 MB · 3d ago',
    fileTone: 'secondary',
    type: 'test_cases',
    source: 'upload',
    status: 'completed',
    caseCount: 18,
    casePill: { label: 'A1', tone: 'a1' },
    uploaderId: SEED_IDS.users.yogesh,
  },
];

const STAT_TOTAL = 242;
const STAT_COMPLETED = 198;
const STAT_IN_PROGRESS = 12;
const STAT_NEEDS_ATTENTION = 32;

function projectNameFromSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(' ');
}

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts[1].endsWith('.')) return `${parts[0]} ${parts[1]}`;
  return `${parts[0]} ${parts[1][0]}.`;
}

function initialsOf(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ImportsPage({ projectSlug }: ImportsPageProps) {
  const router = useRouter();
  const me = useCurrentUser();
  const projects = useProjectList();
  const project = useProject(projectSlug);
  const projectName = project?.name ?? projectNameFromSlug(projectSlug);
  const meName = shortName(me.displayName);
  const meInitials = initialsOf(me.displayName);
  const meRoleLabel = (me.role === 'Admin' ? 'Admin' : me.organizationalLabel) ?? me.role;

  const [filterStatus, setFilterStatus] = useState<'all' | ImportStatus>('all');
  const [view, setView] = useState<'table' | 'compact'>('table');

  useEffect(() => {
    const breakdown = SAMPLE_IMPORTS.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    console.info('pattern-a:deferred:imports-list-load', {
      projectSlug,
      projectName,
      fileCount: SAMPLE_IMPORTS.length,
      statusBreakdown: breakdown,
    });
  }, [projectSlug, projectName]);

  const filteredRows = useMemo(() => {
    if (filterStatus === 'all') return SAMPLE_IMPORTS;
    return SAMPLE_IMPORTS.filter((r) => r.status === filterStatus);
  }, [filterStatus]);

  function onFilterChange(kind: string, value: string) {
    console.info('pattern-a:deferred:imports-filter-change', { kind, value });
  }

  function onStatusFilterChange(value: 'all' | ImportStatus) {
    setFilterStatus(value);
    onFilterChange('status', value);
  }

  function onSortChange(sort: string) {
    console.info('pattern-a:deferred:imports-sort-change', { sort });
  }

  function onViewChange(next: 'table' | 'compact') {
    if (next === view) return;
    setView(next);
    console.info('pattern-a:deferred:imports-view-change', { view: next });
  }

  function onRowAction(importId: number, action: string) {
    console.info('pattern-a:deferred:imports-row-action', { importId, action });
  }

  function onUploadMore() {
    console.info('pattern-a:deferred:imports-upload-more', { from: 'F13' });
    router.push(`/projects/${projectSlug}/upload`);
  }

  function onExportHistory() {
    console.info('pattern-a:deferred:imports-export-history', { projectSlug });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
      <TopBar
        projectName={projectName}
        projectCount={projects.length}
        meName={meName}
        meInitials={meInitials}
        meRoleLabel={meRoleLabel}
      />
      <div className="flex flex-1">
        <ImportsLeftRail meName={meName} meInitials={meInitials} meRoleLabel={meRoleLabel} />
        <main className="flex min-w-0 flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Breadcrumb projectName={projectName} />
          <PageHeader
            projectName={projectName}
            onExportHistory={onExportHistory}
            onUploadMore={onUploadMore}
          />
          <StatsStrip />
          <FilterRow
            status={filterStatus}
            view={view}
            onStatusFilterChange={onStatusFilterChange}
            onFilterChange={onFilterChange}
            onSortChange={onSortChange}
            onViewChange={onViewChange}
          />
          <ImportsList rows={filteredRows} onRowAction={onRowAction} view={view} />
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

function TopBar({
  projectName,
  projectCount,
  meName,
  meInitials,
  meRoleLabel,
}: {
  projectName: string;
  projectCount: number;
  meName: string;
  meInitials: string;
  meRoleLabel: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--canvas)] px-3 sm:gap-4 sm:px-6">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        aria-label="QA Nexus home"
      >
        <span
          aria-hidden="true"
          className="font-display inline-flex h-7 w-7 items-center justify-center rounded-md text-[14px] font-bold text-[var(--primary-ink)]"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        >
          Q
        </span>
        <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
          QA Nexus
        </span>
      </Link>

      <button
        type="button"
        aria-label={`Switch project — currently ${projectName}`}
        className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] py-1.5 pl-1.5 pr-3 text-[13px] text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:inline-flex"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-bold text-[var(--primary-ink)]"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        >
          IR
        </span>
        <span className="font-medium">{projectName}</span>
        <span aria-hidden="true" className="text-[var(--text-tertiary)]">
          ·
        </span>
        <span className="font-mono text-[12px] text-[var(--text-tertiary)]">main</span>
        <ChevronDownIcon />
      </button>

      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="flex w-full max-w-[520px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-2 text-[13px] text-[var(--text-tertiary)]">
          <SearchIcon />
          <span className="flex-1 truncate">Search everything…</span>
          <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex flex-1 md:flex-none" />

      <div
        role="tablist"
        aria-label="Mode"
        className="hidden shrink-0 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] p-0.5 lg:inline-flex"
      >
        <ModeTab active>Operate</ModeTab>
        <ModeTab>Review</ModeTab>
        <ModeTab>Prove</ModeTab>
      </div>

      <button
        type="button"
        aria-label={`Signed in as ${meName}, ${meRoleLabel}`}
        className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] py-1.5 pl-1.5 pr-3 transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold text-[var(--primary-ink)]"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        >
          {meInitials}
        </span>
        <span className="hidden text-[13px] font-medium text-[var(--text-primary)] sm:inline">
          {meName}
        </span>
        <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 hidden rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--secondary)] sm:inline">
          {meRoleLabel}
        </span>
        <ChevronDownIcon />
      </button>
      {/* Visually-hidden helper for the sr-only project count tracker. */}
      <span className="sr-only">{`${projectCount} projects available`}</span>
    </header>
  );
}

function ModeTab({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active ? 'true' : 'false'}
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        active
          ? 'bg-[var(--primary)] text-[var(--primary-ink)]'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Left rail — Plan section expanded with Imports active.
// ---------------------------------------------------------------------------

function ImportsLeftRail({
  meName,
  meInitials,
  meRoleLabel,
}: {
  meName: string;
  meInitials: string;
  meRoleLabel: string;
}) {
  return (
    <aside
      aria-label="Workspace navigation"
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--canvas)] py-4 lg:flex lg:flex-col"
    >
      <nav className="flex flex-1 flex-col gap-5 px-3">
        <NavSection>
          <NavItem label="Home" />
        </NavSection>
        <NavSection title="Plan">
          <NavItem label="Requirements" count="6" highlighted />
          <NavSubItem label="↳ Imports" count="242" active />
          <NavItem label="Test Plans & Cycles" count="0" />
          <NavItem label="Test Cases" count="8" />
        </NavSection>
        <NavSection title="Author">
          <NavItem label="Test Suites" count="0" />
          <NavItem label="Knowledge Base" count="0" />
          <NavItem label="Automation Studio" disabled badge="v1.5" />
          <NavItem label="Data & Mocks" disabled badge="v1.5" />
        </NavSection>
        <NavSection title="Run">
          <NavItem label="Runs & Sessions" count="0" />
          <NavItem label="Environments" count="0" />
        </NavSection>
        <NavSection title="Analyse">
          <NavItem label="Run Results" />
          <NavItem label="Defects" count="0" />
          <NavItem label="Reports" />
          <NavItem label="QA Value" badge="Lead+" />
        </NavSection>
        <NavSection title="Govern">
          <NavItem label="Agents" />
          <NavItem label="Integrations" />
          <NavItem label="Users & Roles" />
          <NavItem label="Settings & Audit" />
        </NavSection>
      </nav>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-subtle)] px-3 py-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-2">
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[var(--primary-ink)]"
            style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
          >
            {meInitials}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">
              {meName}
            </span>
            <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 inline-flex w-fit rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--secondary)]">
              {meRoleLabel}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {title && (
        <span className="px-3 pb-1 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          {title}
        </span>
      )}
      {children}
    </div>
  );
}

function NavItem({
  label,
  count,
  badge,
  disabled,
  highlighted,
}: {
  label: string;
  count?: string;
  badge?: string;
  disabled?: boolean;
  highlighted?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'group relative flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        highlighted
          ? 'border-l-[3px] border-[var(--secondary)] bg-[var(--raised)] pl-[9px] font-medium text-[var(--text-primary)]'
          : disabled
            ? 'cursor-not-allowed text-[var(--text-disabled)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      <span className="truncate">{label}</span>
      {count && (
        <span className="inline-flex items-center rounded bg-[var(--overlay)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--text-tertiary)]">
          {count}
        </span>
      )}
      {badge && (
        <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--secondary)]">
          {badge}
        </span>
      )}
    </button>
  );
}

function NavSubItem({ label, count, active }: { label: string; count?: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center justify-between gap-2 rounded-md py-1.5 pl-7 pr-3 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        active
          ? 'text-[var(--primary)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      <span className="truncate">{label}</span>
      {count && (
        <span
          className={`font-mono text-[11px] ${active ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}
        >
          ({count})
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumb + Page header + Stats strip
// ---------------------------------------------------------------------------

function Breadcrumb({ projectName }: { projectName: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)]"
    >
      <Link href="/" className="hover:text-[var(--text-primary)]">
        Home
      </Link>
      <span aria-hidden="true" className="text-[var(--text-disabled)]">
        ›
      </span>
      <span>Plan</span>
      <span aria-hidden="true" className="text-[var(--text-disabled)]">
        ›
      </span>
      <span>{projectName}</span>
      <span aria-hidden="true" className="text-[var(--text-disabled)]">
        ›
      </span>
      <span className="font-semibold text-[var(--text-primary)]">Imports</span>
    </nav>
  );
}

function PageHeader({
  projectName,
  onExportHistory,
  onUploadMore,
}: {
  projectName: string;
  onExportHistory: () => void;
  onUploadMore: () => void;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-[22px] font-bold leading-[28px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[24px] sm:leading-[32px]">
          Imported Files
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--text-tertiary)] sm:text-[13px]">
          Track every import into{' '}
          <span className="font-medium text-[var(--text-secondary)]">{projectName}</span> and across
          your projects
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onExportHistory}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 2v9M4 7l4 4 4-4M3 14h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export history
        </button>
        <button
          type="button"
          onClick={onUploadMore}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3.5 text-[12.5px] font-semibold text-[var(--primary-ink)] shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Import
        </button>
      </div>
    </header>
  );
}

function StatsStrip() {
  return (
    <div className="flex flex-wrap items-stretch gap-px overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:flex-nowrap">
      <StatCard
        value={STAT_TOTAL}
        valueColor="primary"
        suffix="imports total"
        meta="since project created"
      />
      <StatCard
        value={STAT_COMPLETED}
        valueColor="pass"
        suffix="completed"
        meta="3.1k cases generated"
      />
      <StatCard
        value={STAT_IN_PROGRESS}
        valueColor="warn"
        suffix="in progress"
        meta="4 with active A1 generation"
      />
      <StatCard
        value={STAT_NEEDS_ATTENTION}
        valueColor="fail"
        suffix="need attention"
        meta="24 failed · 8 pending action"
      />
    </div>
  );
}

function StatCard({
  value,
  valueColor,
  suffix,
  meta,
}: {
  value: number;
  valueColor: 'primary' | 'pass' | 'warn' | 'fail';
  suffix: string;
  meta: string;
}) {
  const colorClass = {
    primary: 'text-[var(--text-primary)]',
    pass: 'text-[var(--pass)]',
    warn: 'text-[var(--warn)]',
    fail: 'text-[var(--fail)]',
  }[valueColor];
  return (
    <div className="flex flex-1 basis-1/2 flex-col gap-0.5 bg-[var(--raised)] px-4 py-3 sm:basis-0 sm:px-5 sm:py-3.5">
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-display text-[20px] font-bold leading-[26px] sm:text-[22px] sm:leading-[28px] ${colorClass}`}
        >
          {value}
        </span>
        <span className="text-[12px] font-medium text-[var(--text-secondary)] sm:text-[13px]">
          {suffix}
        </span>
      </div>
      <p className="text-[10.5px] leading-[14px] text-[var(--text-tertiary)] sm:text-[11px] sm:leading-[16px]">
        {meta}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter row
// ---------------------------------------------------------------------------

function FilterRow({
  status,
  view,
  onStatusFilterChange,
  onFilterChange,
  onSortChange,
  onViewChange,
}: {
  status: 'all' | ImportStatus;
  view: 'table' | 'compact';
  onStatusFilterChange: (next: 'all' | ImportStatus) => void;
  onFilterChange: (kind: string, value: string) => void;
  onSortChange: (sort: string) => void;
  onViewChange: (next: 'table' | 'compact') => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[13px] text-[var(--text-tertiary)] sm:max-w-[240px]">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search imports…"
          aria-label="Search imports"
          className="w-full bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="Type" value="All" onClick={() => onFilterChange('type', 'all')} />
        <StatusFilterChip current={status} onChange={onStatusFilterChange} />
        <FilterChip label="Source" value="All" onClick={() => onFilterChange('source', 'all')} />
        <FilterChip
          label="Date"
          value="Last 30 days"
          onClick={() => onFilterChange('date', 'last-30')}
        />
        <FilterChip label="Owner" value="All" onClick={() => onFilterChange('owner', 'all')} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <FilterChip label="Sort" value="Newest first" onClick={() => onSortChange('newest')} />
        <div
          role="tablist"
          aria-label="View"
          className="inline-flex h-8 items-center gap-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--overlay)] p-0.5"
        >
          <ViewTab active={view === 'table'} onClick={() => onViewChange('table')}>
            Table
          </ViewTab>
          <ViewTab active={view === 'compact'} onClick={() => onViewChange('compact')}>
            Compact
          </ViewTab>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--overlay)] px-3 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
    >
      <span className="font-medium text-[var(--text-tertiary)]">{label}:</span>
      <span>{value}</span>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function StatusFilterChip({
  current,
  onChange,
}: {
  current: 'all' | ImportStatus;
  onChange: (next: 'all' | ImportStatus) => void;
}) {
  // Cycle through filter values on click for the visual gate (real
  // dropdown lands when MAIN ports the menu primitive).
  const options: Array<{ value: 'all' | ImportStatus; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending_action', label: 'Pending Action' },
    { value: 'failed', label: 'Failed' },
  ];
  const idx = options.findIndex((o) => o.value === current);
  const display = options[idx]?.label ?? 'All';
  function cycle() {
    const next = options[(idx + 1) % options.length];
    onChange(next.value);
  }
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="Cycle status filter"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--overlay)] px-3 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
    >
      <span className="font-medium text-[var(--text-tertiary)]">Status:</span>
      <span>{display}</span>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function ViewTab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'inline-flex h-7 items-center rounded-[4px] px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        active
          ? 'bg-[var(--primary)] font-semibold text-[var(--primary-ink)]'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Imports list (table on lg+, card stack on smaller)
// ---------------------------------------------------------------------------

function ImportsList({
  rows,
  onRowAction,
  view,
}: {
  rows: ImportRow[];
  onRowAction: (id: number, action: string) => void;
  view: 'table' | 'compact';
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--raised)] px-6 py-10 text-center">
        <span className="font-display text-[16px] font-bold text-[var(--text-primary)]">
          No imports match these filters
        </span>
        <span className="text-[12.5px] text-[var(--text-tertiary)]">
          Adjust your filters or upload a new file to get started.
        </span>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--raised)]">
      <ColumnHeaders />
      <ul className="flex flex-col">
        {rows.map((r) => (
          <ImportRowCard
            key={r.importId}
            row={r}
            onAction={onRowAction}
            compact={view === 'compact'}
          />
        ))}
      </ul>
    </div>
  );
}

function ColumnHeaders() {
  return (
    <div
      className="hidden h-9 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--overlay)] px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] lg:grid"
      style={{ gridTemplateColumns: '70px minmax(220px, 1fr) 110px 120px 150px 120px 110px 60px' }}
    >
      <span>Import</span>
      <span>Files</span>
      <span>Type</span>
      <span>Source</span>
      <span>Status</span>
      <span>Cases</span>
      <span>By</span>
      <span className="text-right">Actions</span>
    </div>
  );
}

function ImportRowCard({
  row,
  onAction,
  compact,
}: {
  row: ImportRow;
  onAction: (id: number, action: string) => void;
  compact: boolean;
}) {
  const uploader = useTeamMember(row.uploaderId);
  const uploaderName = uploader ? shortName(uploader.displayName) : '—';
  const uploaderInitials = uploader ? initialsOf(uploader.displayName) : '··';
  return (
    <li
      className={[
        'relative grid border-b border-[var(--border-subtle)] last:border-b-0',
        row.isSelected ? 'bg-[var(--primary)]/[0.06]' : 'bg-[var(--raised)] hover:bg-[var(--base)]',
        // Mobile: stack as card. Desktop: table grid.
        'gap-2 px-4 py-3 lg:items-center lg:gap-3',
        compact ? 'lg:py-2' : 'lg:py-3.5',
      ].join(' ')}
      style={{
        gridTemplateColumns: '1fr',
      }}
    >
      {row.isSelected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 hidden h-full w-[3px] bg-[var(--secondary)] lg:block"
        />
      )}
      <div className="lg:contents">
        <div className="lg:hidden">
          <ImportRowMobileCard
            row={row}
            uploaderName={uploaderName}
            uploaderInitials={uploaderInitials}
            onAction={onAction}
          />
        </div>
        <div
          className="hidden lg:grid lg:items-center lg:gap-3"
          style={{
            gridTemplateColumns: '70px minmax(220px, 1fr) 110px 120px 150px 120px 110px 60px',
          }}
        >
          <ImportIdCell row={row} />
          <FilesCell row={row} />
          <TypeCell row={row} />
          <SourceCell row={row} />
          <StatusCell row={row} />
          <CasesCell row={row} />
          <ByCell uploaderName={uploaderName} uploaderInitials={uploaderInitials} />
          <ActionsCell importId={row.importId} onAction={onAction} />
        </div>
      </div>
    </li>
  );
}

function ImportRowMobileCard({
  row,
  uploaderName,
  uploaderInitials,
  onAction,
}: {
  row: ImportRow;
  uploaderName: string;
  uploaderInitials: string;
  onAction: (id: number, action: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold text-[var(--primary)]">
            #{row.importId}
          </span>
          {row.isNew && <Pill tone="pass">● NEW</Pill>}
        </div>
        <ActionsCell importId={row.importId} onAction={onAction} />
      </div>
      <div className="flex items-start gap-2">
        <FileBadge kind={row.primaryFileKind} tone={row.fileTone} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-mono text-[12.5px] text-[var(--text-primary)]">
            {row.primaryFileLabel}
          </span>
          <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
            {row.morePill ? `${row.morePill} · ` : ''}
            {row.fileMeta}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TypeChip type={row.type} />
        <SourceLabel source={row.source} />
        <StatusChip status={row.status} detail={row.statusDetail} progressPct={row.progressPct} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <CasesCell row={row} />
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] font-bold text-[var(--primary-ink)]"
            style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
          >
            {uploaderInitials}
          </span>
          <span className="text-[11.5px] text-[var(--text-secondary)]">{uploaderName}</span>
        </div>
      </div>
    </div>
  );
}

function ImportIdCell({ row }: { row: ImportRow }) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="text-left font-mono text-[12px] font-semibold text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        #{row.importId}
      </button>
      {row.isNew && <Pill tone="pass">● NEW</Pill>}
    </div>
  );
}

function FilesCell({ row }: { row: ImportRow }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        <FileBadge kind={row.primaryFileKind} tone={row.fileTone} />
        <span className="truncate font-mono text-[12.5px] text-[var(--text-primary)]">
          {row.primaryFileLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 pl-7 text-[10.5px] text-[var(--text-tertiary)]">
        {row.morePill && (
          <button type="button" className="text-[var(--text-tertiary)] hover:underline">
            {row.morePill}
          </button>
        )}
        <span className="font-mono">
          {row.morePill ? '· ' : ''}
          {row.fileMeta}
        </span>
      </div>
    </div>
  );
}

function FileBadge({ kind, tone }: { kind: FileKindBadge; tone: ImportRow['fileTone'] }) {
  const toneClass = {
    pass: 'bg-[var(--pass)]/15 text-[var(--pass)]',
    primary: 'bg-[var(--primary)]/15 text-[var(--primary)]',
    secondary: 'bg-[var(--secondary)]/15 text-[var(--secondary)]',
    info: 'bg-[var(--info)]/15 text-[var(--info)]',
    tertiary: 'bg-[var(--overlay)] text-[var(--text-tertiary)]',
  }[tone];
  const label = (() => {
    if (kind === 'jira') return 'J';
    if (kind === 'fig') return 'FIG';
    if (kind === 'htm') return 'HTM';
    if (kind === 'mp4') return 'MP4';
    if (kind === 'csv') return 'CSV';
    if (kind === 'pdf') return 'PDF';
    if (kind === 'xls') return 'XLS';
    return '··';
  })();
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[8.5px] font-bold ${toneClass}`}
    >
      {label}
    </span>
  );
}

function TypeCell({ row }: { row: ImportRow }) {
  return <TypeChip type={row.type} />;
}

function TypeChip({ type }: { type: ImportType }) {
  const map: Record<ImportType, { label: string; cls: string }> = {
    requirements: {
      label: 'Requirements',
      cls: 'border-[var(--primary)]/35 bg-[var(--primary)]/15 text-[var(--primary)]',
    },
    test_cases: {
      label: 'Test Cases',
      cls: 'border-[var(--primary)]/35 bg-[var(--primary)]/15 text-[var(--primary)]',
    },
    other: {
      label: 'Other',
      cls: 'border-[var(--border-subtle)] bg-[var(--overlay)] text-[var(--text-tertiary)]',
    },
  };
  const { label, cls } = map[type];
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-full border px-2.5 text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function SourceCell({ row }: { row: ImportRow }) {
  return <SourceLabel source={row.source} />;
}

function SourceLabel({ source }: { source: ImportSourceKind }) {
  const map: Record<ImportSourceKind, { badgeLabel: string; label: string; toneCls: string }> = {
    upload: {
      badgeLabel: 'U',
      label: 'File upload',
      toneCls: 'bg-[var(--primary)]/15 text-[var(--primary)]',
    },
    jira: {
      badgeLabel: 'J',
      label: 'Jira sync',
      toneCls: 'bg-[var(--info)]/15 text-[var(--info)]',
    },
    figma: {
      badgeLabel: 'F',
      label: 'Figma',
      toneCls: 'bg-[var(--secondary)]/15 text-[var(--secondary)]',
    },
    confluence: {
      badgeLabel: 'C',
      label: 'Confluence',
      toneCls: 'bg-[var(--info)]/15 text-[var(--info)]',
    },
  };
  const { badgeLabel, label, toneCls } = map[source];
  return (
    <span className="inline-flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
      <span
        aria-hidden="true"
        className={`inline-flex h-4 w-4 items-center justify-center rounded font-mono text-[9px] font-bold ${toneCls}`}
      >
        {badgeLabel}
      </span>
      {label}
    </span>
  );
}

function StatusCell({ row }: { row: ImportRow }) {
  return <StatusChip status={row.status} detail={row.statusDetail} progressPct={row.progressPct} />;
}

function StatusChip({
  status,
  detail,
  progressPct,
}: {
  status: ImportStatus;
  detail?: string;
  progressPct?: number;
}) {
  const map: Record<ImportStatus, { label: string; cls: string; detailCls: string }> = {
    in_progress: {
      label: '● In Progress',
      cls: 'border-[var(--warn)]/30 bg-[var(--warn)]/15 text-[var(--warn)]',
      detailCls: 'text-[var(--text-tertiary)]',
    },
    completed: {
      label: '✓ Completed',
      cls: 'border-[var(--pass)]/30 bg-[var(--pass)]/15 text-[var(--pass)]',
      detailCls: 'text-[var(--text-tertiary)]',
    },
    pending_action: {
      label: '⚠ Pending Action',
      cls: 'border-[var(--warn)]/30 bg-[var(--warn)]/15 text-[var(--warn)]',
      detailCls: 'text-[var(--warn)]',
    },
    failed: {
      label: '✗ Failed',
      cls: 'border-[var(--fail)]/30 bg-[var(--fail)]/15 text-[var(--fail)]',
      detailCls: 'text-[var(--fail)]',
    },
  };
  const { label, cls, detailCls } = map[status];
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={`inline-flex h-[22px] w-fit items-center rounded-full border px-2.5 text-[11px] font-semibold ${cls}`}
      >
        {label}
      </span>
      {progressPct !== undefined && (
        <div className="h-1 max-w-[140px] overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <div
            className="h-full bg-[var(--primary)]"
            style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
          />
        </div>
      )}
      {detail && <span className={`font-mono text-[10px] ${detailCls}`}>{detail}</span>}
    </div>
  );
}

function CasesCell({ row }: { row: ImportRow }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-display text-[15px] font-bold ${
          row.caseCount === 0 ? 'text-[var(--text-disabled)]' : 'text-[var(--text-primary)]'
        }`}
      >
        {row.caseCount}
      </span>
      {row.casePill && <CasePill pill={row.casePill} />}
    </div>
  );
}

function CasePill({ pill }: { pill: NonNullable<ImportRow['casePill']> }) {
  const cls = {
    a1: 'bg-[var(--secondary)]/15 text-[var(--secondary)]',
    'a1-drafting': 'bg-[var(--secondary)]/15 text-[var(--secondary)]',
    imported: 'bg-[var(--primary)]/15 text-[var(--primary)]',
  }[pill.tone];
  return (
    <span
      className={`inline-flex h-[18px] items-center gap-1 rounded px-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em] ${cls}`}
    >
      {pill.tone === 'a1-drafting' && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--secondary)]"
        />
      )}
      {pill.label}
    </span>
  );
}

function ByCell({
  uploaderName,
  uploaderInitials,
}: {
  uploaderName: string;
  uploaderInitials: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] font-bold text-[var(--primary-ink)]"
        style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
      >
        {uploaderInitials}
      </span>
      <span className="truncate text-[11.5px] text-[var(--text-secondary)]">{uploaderName}</span>
    </div>
  );
}

function ActionsCell({
  importId,
  onAction,
}: {
  importId: number;
  onAction: (id: number, action: string) => void;
}) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => onAction(importId, 'open-row-menu')}
        aria-label={`Actions for import #${importId}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        ⋯
      </button>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: 'pass' }) {
  const cls = {
    pass: 'bg-[var(--pass)]/15 text-[var(--pass)]',
  }[tone];
  return (
    <span
      className={`inline-flex h-[18px] w-fit items-center gap-1 rounded px-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em] ${cls}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Reusable icons
// ---------------------------------------------------------------------------

function ChevronDownIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
