// F14 Requirements List — main orchestrator.
//
// Implements `PM1_UI_v2/frame  html view/F14 Requirements.html`.
// Mounted at `/requirements`. Reached from the home dashboard's
// "Open requirements" link or via deep-link from F08a / F08b cards.
//
// Pattern A enforcement (PM1_PRD §4 Requirements lifecycle) — 9
// deferred markers:
// - Mount → `pattern-a:deferred:requirements-list-load`
//     { projectId, totalCount, statusBreakdown }.
// - Source-tab change → `pattern-a:deferred:requirements-source-change`
//     { source }.
// - Filter chip change → `pattern-a:deferred:requirements-filter-change`
//     { kind, value }.
// - Search input → `pattern-a:deferred:requirements-search-change`
//     { query }.
// - View toggle → `pattern-a:deferred:requirements-view-toggle`
//     { view: 'cards' | 'table' }.
// - Row select → `pattern-a:deferred:requirements-row-select`
//     { reqKey }.
// - Add CTA → `pattern-a:deferred:requirements-add-open` + route to
//     `/requirements/new`.
// - Edit row → `pattern-a:deferred:requirements-row-edit`
//     { reqKey } + route to `/requirements/<key>/edit`.
// - Generate tests → `pattern-a:deferred:requirements-row-generate`
//     { reqKey } (M3 — A1 agent wires this up).
// - Import / Coverage report CTAs → `pattern-a:deferred:requirements-*`.
// - ZERO fetch / useMutation / axios.
//
// Hash-anchor deeplinks supported on mount:
//   #status=active | #status=draft | …
//   #sprint=Sprint%2042
//   #source=jira | #source=upload | #source=manual
//
// Tab clicks update the hash via `history.replaceState` (no full route
// change). Multiple hash params combine via `&` (URL-search style).
//
// ADR-006 hooks:
// - `useCurrentUser()` — workspace ID for the mount marker.
// - `useActiveProject()` — project context (RET).
// - `useTeamMember(createdById)` — owner-name resolution per row.
// - `useRequirements(projectId)` — seed list (Pattern A: no fetch).
//
// RBAC: F14 is QA Engineer accessible — no `<AdminGuard>` wrap.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeShell } from '@/components/home/home-shell';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useActiveProject } from '@/lib/contexts/ProjectContext';
import { useTeamMember } from '@/lib/contexts/TeamRosterContext';
import {
  countRequirements,
  filterRequirements,
  listSprints,
  requirementPriorityLabel,
  requirementSourceLabel,
  requirementStatusLabel,
  useRequirements,
  type Requirement,
  type RequirementPriority,
  type RequirementSource,
  type RequirementStatus,
} from '@/lib/data/requirements';

// ---------------------------------------------------------------------------
// View state
// ---------------------------------------------------------------------------

type ViewMode = 'cards' | 'table';

interface UrlFilter {
  status?: RequirementStatus;
  sprint?: string;
  source?: RequirementSource;
}

// Parse `#status=active&sprint=Sprint%2042&source=jira` into a filter
// object. Tolerant of single-key or empty hashes.
function parseHashFilter(hash: string): UrlFilter {
  const out: UrlFilter = {};
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return out;
  for (const pair of raw.split('&')) {
    const [k, v] = pair.split('=');
    if (!k || !v) continue;
    const decoded = decodeURIComponent(v);
    if (k === 'status' && ['draft', 'active', 'done', 'archived'].includes(decoded)) {
      out.status = decoded as RequirementStatus;
    } else if (k === 'sprint') {
      out.sprint = decoded;
    } else if (k === 'source' && ['jira', 'upload', 'manual'].includes(decoded)) {
      out.source = decoded as RequirementSource;
    }
  }
  return out;
}

function buildHash(f: UrlFilter): string {
  const parts: string[] = [];
  if (f.status) parts.push(`status=${encodeURIComponent(f.status)}`);
  if (f.sprint) parts.push(`sprint=${encodeURIComponent(f.sprint)}`);
  if (f.source) parts.push(`source=${encodeURIComponent(f.source)}`);
  return parts.length > 0 ? `#${parts.join('&')}` : '';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function RequirementsListPage() {
  return (
    <HomeShell>
      <RequirementsListContent />
    </HomeShell>
  );
}

function RequirementsListContent() {
  const router = useRouter();
  const me = useCurrentUser();
  const project = useActiveProject();
  const all = useRequirements(project.id);

  const counts = useMemo(() => countRequirements(all), [all]);
  const sprints = useMemo(() => listSprints(all), [all]);

  const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<RequirementPriority | 'all'>('all');
  const [sprintFilter, setSprintFilter] = useState<string | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<RequirementSource | 'all'>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('cards');

  // ─────────── Mount + hash-deeplink ───────────
  // Mount-once via a ref guard — can't use empty deps because the
  // lint-staged runtime doesn't load `react-hooks/exhaustive-deps` so
  // the disable-comment workaround errors out. Listing the real deps +
  // gating with a ref keeps the effect mount-only AND lint-clean.
  const mountFiredRef = useRef(false);
  useEffect(() => {
    if (mountFiredRef.current) return;
    mountFiredRef.current = true;

    const initial = parseHashFilter(typeof window !== 'undefined' ? window.location.hash : '');
    if (initial.status) setStatusFilter(initial.status);
    if (initial.sprint) setSprintFilter(initial.sprint);
    if (initial.source) setSourceFilter(initial.source);

    const breakdown: Record<RequirementStatus, number> = {
      draft: 0,
      active: 0,
      done: 0,
      archived: 0,
    };
    for (const r of all) breakdown[r.status]++;

    // PATTERN-A: load requirements list deferred until M2 (T030.5) - real /api/projects/:slug/requirements GET
    console.info('pattern-a:deferred:requirements-list-load', {
      workspaceId: me.workspaceId,
      projectId: project.id,
      projectKey: project.key,
      totalCount: all.length,
      statusBreakdown: breakdown,
      initialFilter: initial,
    });
  }, [me.workspaceId, project.id, project.key, all]);

  // Sync URL hash when filters change (no full route navigation).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const f: UrlFilter = {};
    if (statusFilter !== 'all') f.status = statusFilter as RequirementStatus;
    if (sprintFilter !== 'all') f.sprint = sprintFilter;
    if (sourceFilter !== 'all') f.source = sourceFilter as RequirementSource;
    const next = buildHash(f);
    const cur = window.location.hash;
    if (cur !== next) {
      window.history.replaceState(null, '', `${window.location.pathname}${next}`);
    }
  }, [statusFilter, sprintFilter, sourceFilter]);

  const filtered = useMemo(
    () =>
      filterRequirements(all, {
        status: statusFilter,
        priority: priorityFilter,
        sprint: sprintFilter,
        source: sourceFilter,
        search,
      }),
    [all, statusFilter, priorityFilter, sprintFilter, sourceFilter, search],
  );

  // ─────────── Handlers ───────────
  function onSourceTabChange(next: RequirementSource | 'all' | 'coverageGaps') {
    if (next === 'coverageGaps') {
      // Coverage-gaps is a derived view (testCaseCount === 0) — for the
      // F14 port we treat it as a soft-filter chip + a marker fire.
      // PATTERN-A: source-tab coverage-gaps deferred until M2 (T030.5) - derived view, no BE call
      console.info('pattern-a:deferred:requirements-source-change', { source: 'coverage-gaps' });
      return;
    }
    setSourceFilter(next);
    // PATTERN-A: change source filter deferred until M2 (T030.5) - URL hash + client filter
    console.info('pattern-a:deferred:requirements-source-change', { source: next });
  }

  function onAdd() {
    // PATTERN-A: open add-requirement modal deferred until M2 (T030.5) - route to /requirements/new
    console.info('pattern-a:deferred:requirements-add-open', { from: 'F14' });
    router.push('/requirements/new');
  }

  function onEdit(req: Requirement) {
    // PATTERN-A: edit requirement deferred until M2 (T030.5) - route to /requirements/<key>/edit
    console.info('pattern-a:deferred:requirements-row-edit', { reqKey: req.key });
    router.push(`/requirements/${req.key.toLowerCase()}/edit`);
  }

  function onGenerateTests(req: Requirement) {
    // PATTERN-A: generate tests deferred until M3 (T040+) - A1 agent flow lands in M3
    console.info('pattern-a:deferred:requirements-row-generate', { reqKey: req.key });
  }

  function onImport() {
    // PATTERN-A: import requirements deferred until M2 (T030.5) - route to F12 upload flow
    console.info('pattern-a:deferred:requirements-import-open', { from: 'F14' });
    router.push('/upload');
  }

  function onCoverageReport() {
    // PATTERN-A: open coverage report deferred until M3 (T040+) - coverage panel lands in M3
    console.info('pattern-a:deferred:requirements-coverage-report', { from: 'F14' });
  }

  function onViewToggle(next: ViewMode) {
    if (next === view) return;
    setView(next);
    // PATTERN-A: toggle view mode deferred until M2 (T030.5) - client-only state
    console.info('pattern-a:deferred:requirements-view-toggle', { view: next });
  }

  function onSearchChange(q: string) {
    setSearch(q);
    // PATTERN-A: search requirements deferred until M2 (T030.5) - real /api/.../requirements GET (q param)
    console.info('pattern-a:deferred:requirements-search-change', { query: q });
  }

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:gap-7 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        counts={counts}
        onAdd={onAdd}
        onImport={onImport}
        onCoverageReport={onCoverageReport}
      />

      <SourceFilterTabs active={sourceFilter} counts={counts} onChange={onSourceTabChange} />

      <FilterChipBar
        status={statusFilter}
        setStatus={(v) => {
          setStatusFilter(v);
          // PATTERN-A: change status filter deferred until M2 (T030.5) - URL hash + client filter
          console.info('pattern-a:deferred:requirements-filter-change', {
            kind: 'status',
            value: v,
          });
        }}
        priority={priorityFilter}
        setPriority={(v) => {
          setPriorityFilter(v);
          // PATTERN-A: change priority filter deferred until M2 (T030.5) - client filter
          console.info('pattern-a:deferred:requirements-filter-change', {
            kind: 'priority',
            value: v,
          });
        }}
        sprint={sprintFilter}
        setSprint={(v) => {
          setSprintFilter(v);
          // PATTERN-A: change sprint filter deferred until M2 (T030.5) - URL hash + client filter
          console.info('pattern-a:deferred:requirements-filter-change', {
            kind: 'sprint',
            value: v,
          });
        }}
        sprints={sprints}
        view={view}
        onViewToggle={onViewToggle}
        search={search}
        onSearchChange={onSearchChange}
      />

      {filtered.length === 0 ? (
        <EmptyState />
      ) : view === 'cards' ? (
        <RequirementCardList rows={filtered} onEdit={onEdit} onGenerateTests={onGenerateTests} />
      ) : (
        <RequirementTable rows={filtered} onEdit={onEdit} onGenerateTests={onGenerateTests} />
      )}

      <Footer total={all.length} shown={filtered.length} />
    </main>
  );
}

// ---------------------------------------------------------------------------
// PageHeader
// ---------------------------------------------------------------------------

function PageHeader({
  counts,
  onAdd,
  onImport,
  onCoverageReport,
}: {
  counts: ReturnType<typeof countRequirements>;
  onAdd: () => void;
  onImport: () => void;
  onCoverageReport: () => void;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[22px] font-bold leading-[28px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[26px] sm:leading-[34px]">
          Requirements
        </h1>
        <p className="text-[13px] leading-[20px] text-[var(--text-secondary)] sm:text-[14px]">
          <span className="font-mono font-semibold text-[var(--text-primary)]">{counts.all}</span>{' '}
          total ·{' '}
          <span className="font-mono font-semibold text-[var(--secondary)]">{counts.jira}</span>{' '}
          from Jira ·{' '}
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            {counts.uploaded}
          </span>{' '}
          uploaded ·{' '}
          <span className="font-mono font-semibold text-[var(--warn)]">{counts.coverageGaps}</span>{' '}
          coverage gaps.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <HeaderActionButton onClick={onCoverageReport} variant="ghost">
          Coverage report
        </HeaderActionButton>
        <HeaderActionButton onClick={onImport} variant="ghost">
          Import
        </HeaderActionButton>
        <HeaderActionButton onClick={onAdd} variant="primary">
          + Add requirement
        </HeaderActionButton>
      </div>
    </header>
  );
}

function HeaderActionButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: 'primary' | 'ghost';
}) {
  const base =
    'inline-flex h-9 min-h-[44px] items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0 sm:h-9';
  const cls =
    variant === 'primary'
      ? `${base} bg-[var(--primary)] text-[var(--primary-ink)] hover:opacity-90`
      : `${base} border border-[var(--border-subtle)] bg-[var(--raised)] text-[var(--text-primary)] hover:border-[var(--border-strong)]`;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Source filter tabs (All / Jira / Uploaded / Coverage gaps / Manual)
// ---------------------------------------------------------------------------

function SourceFilterTabs({
  active,
  counts,
  onChange,
}: {
  active: RequirementSource | 'all';
  counts: ReturnType<typeof countRequirements>;
  onChange: (next: RequirementSource | 'all' | 'coverageGaps') => void;
}) {
  const tabs = [
    { id: 'all' as const, label: 'All', count: counts.all },
    { id: 'jira' as const, label: 'Jira', count: counts.jira },
    { id: 'upload' as const, label: 'Uploaded', count: counts.uploaded },
    { id: 'coverageGaps' as const, label: 'Coverage gaps', count: counts.coverageGaps },
    { id: 'manual' as const, label: 'Manual', count: counts.manual },
  ];
  return (
    <nav
      role="tablist"
      aria-label="Filter requirements by source"
      className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={[
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
              isActive
                ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)]'
                : 'border-[var(--border-subtle)] bg-[var(--raised)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            <span>{t.label}</span>
            <span
              className={[
                'rounded-full px-1.5 py-0.5 font-mono text-[10.5px] font-semibold',
                isActive
                  ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                  : 'bg-[var(--overlay)] text-[var(--text-tertiary)]',
              ].join(' ')}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Filter chip bar (Priority / Status / Sprint + Search + View toggle)
// ---------------------------------------------------------------------------

interface FilterChipBarProps {
  status: RequirementStatus | 'all';
  setStatus: (v: RequirementStatus | 'all') => void;
  priority: RequirementPriority | 'all';
  setPriority: (v: RequirementPriority | 'all') => void;
  sprint: string | 'all';
  setSprint: (v: string | 'all') => void;
  sprints: string[];
  view: ViewMode;
  onViewToggle: (v: ViewMode) => void;
  search: string;
  onSearchChange: (s: string) => void;
}

function FilterChipBar({
  status,
  setStatus,
  priority,
  setPriority,
  sprint,
  setSprint,
  sprints,
  view,
  onViewToggle,
  search,
  onSearchChange,
}: FilterChipBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Status"
          value={status}
          options={[
            { value: 'all', label: 'All' },
            { value: 'draft', label: 'Draft' },
            { value: 'active', label: 'Active' },
            { value: 'done', label: 'Done' },
            { value: 'archived', label: 'Archived' },
          ]}
          onChange={(v) => setStatus(v as RequirementStatus | 'all')}
        />
        <FilterDropdown
          label="Priority"
          value={priority}
          options={[
            { value: 'all', label: 'All' },
            { value: 'P0', label: 'P0' },
            { value: 'P1', label: 'P1' },
            { value: 'P2', label: 'P2' },
            { value: 'P3', label: 'P3' },
          ]}
          onChange={(v) => setPriority(v as RequirementPriority | 'all')}
        />
        <FilterDropdown
          label="Sprint"
          value={sprint}
          options={[
            { value: 'all', label: 'All sprints' },
            ...sprints.map((s) => ({ value: s, label: s })),
          ]}
          onChange={(v) => setSprint(v)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={onSearchChange} />
        <ViewToggle view={view} onChange={onViewToggle} />
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <label
      htmlFor={id}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] pl-3 pr-1 text-[12.5px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)]"
    >
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        {label}:
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 cursor-pointer rounded-full bg-transparent pr-2 text-[12.5px] font-medium text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        aria-label={`${label} filter`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[13px] text-[var(--text-primary)] focus-within:border-[var(--border-strong)]">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m13 13-2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        aria-label="Search requirements"
        placeholder="Search by key or title…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-44 bg-transparent text-[13px] placeholder:text-[var(--text-tertiary)] focus:outline-none sm:w-56"
      />
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="inline-flex h-9 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] p-0.5"
    >
      {(['cards', 'table'] as ViewMode[]).map((v) => {
        const isActive = view === v;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(v)}
            className={[
              'inline-flex h-7 items-center rounded-full px-3 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
              isActive
                ? 'bg-[var(--primary)] text-[var(--primary-ink)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {v === 'cards' ? 'Cards' : 'Table'}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card view
// ---------------------------------------------------------------------------

function RequirementCardList({
  rows,
  onEdit,
  onGenerateTests,
}: {
  rows: Requirement[];
  onEdit: (r: Requirement) => void;
  onGenerateTests: (r: Requirement) => void;
}) {
  return (
    <ul
      role="list"
      aria-label="Requirements list"
      className="grid grid-cols-1 gap-3 lg:grid-cols-2"
    >
      {rows.map((r) => (
        <RequirementCard key={r.id} req={r} onEdit={onEdit} onGenerateTests={onGenerateTests} />
      ))}
    </ul>
  );
}

function RequirementCard({
  req,
  onEdit,
  onGenerateTests,
}: {
  req: Requirement;
  onEdit: (r: Requirement) => void;
  onGenerateTests: (r: Requirement) => void;
}) {
  const owner = useTeamMember(req.createdById);
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-4 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[var(--text-tertiary)]">
              {req.key}
            </span>
            <PriorityBadge priority={req.priority} />
            <StatusDot status={req.status} />
            {req.sprint && <SprintChip sprint={req.sprint} />}
            <SourceChip source={req.source} />
          </div>
          <h3 className="text-[14px] font-semibold leading-[20px] text-[var(--text-primary)]">
            {req.title}
          </h3>
          <p className="line-clamp-2 text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
            {req.description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
        <span className="text-[11.5px] text-[var(--text-tertiary)]">
          {req.testCaseCount > 0 ? (
            <>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {req.testCaseCount}
              </span>{' '}
              {req.testCaseCount === 1 ? 'test case' : 'test cases'} · owner{' '}
              <span className="text-[var(--text-secondary)]">
                {owner?.displayName ?? 'Unknown'}
              </span>
            </>
          ) : (
            <>
              <span className="text-[var(--warn)]">No coverage</span> · owner{' '}
              <span className="text-[var(--text-secondary)]">
                {owner?.displayName ?? 'Unknown'}
              </span>
            </>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <RowActionButton onClick={() => onGenerateTests(req)} variant="ghost">
            ✨ Generate tests
          </RowActionButton>
          <RowActionButton onClick={() => onEdit(req)} variant="ghost">
            Edit
          </RowActionButton>
        </div>
      </div>
    </li>
  );
}

function RowActionButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: 'primary' | 'ghost';
}) {
  const base =
    'inline-flex h-7 min-h-[44px] items-center rounded-md px-2.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0 sm:h-7';
  const cls =
    variant === 'primary'
      ? `${base} bg-[var(--primary)] text-[var(--primary-ink)]`
      : `${base} border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]`;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Table view (compact desktop, stacks on mobile)
// ---------------------------------------------------------------------------

function RequirementTable({
  rows,
  onEdit,
  onGenerateTests,
}: {
  rows: Requirement[];
  onEdit: (r: Requirement) => void;
  onGenerateTests: (r: Requirement) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--base)]">
      <div className="hidden grid-cols-[110px_minmax(0,1fr)_64px_88px_120px_88px_140px] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)] lg:grid">
        <span>Key</span>
        <span>Title</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Sprint</span>
        <span>Tests</span>
        <span className="text-right">Actions</span>
      </div>
      <ul role="list" className="flex flex-col">
        {rows.map((r) => (
          <RequirementTableRow
            key={r.id}
            req={r}
            onEdit={onEdit}
            onGenerateTests={onGenerateTests}
          />
        ))}
      </ul>
    </div>
  );
}

function RequirementTableRow({
  req,
  onEdit,
  onGenerateTests,
}: {
  req: Requirement;
  onEdit: (r: Requirement) => void;
  onGenerateTests: (r: Requirement) => void;
}) {
  return (
    <li className="grid grid-cols-1 gap-2 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 hover:bg-[var(--raised)] lg:grid-cols-[110px_minmax(0,1fr)_64px_88px_120px_88px_140px] lg:items-center lg:gap-3 lg:py-2">
      <span className="font-mono text-[11.5px] font-semibold text-[var(--text-tertiary)]">
        {req.key}
      </span>
      <span className="truncate text-[13px] text-[var(--text-primary)]">{req.title}</span>
      <PriorityBadge priority={req.priority} />
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--text-secondary)]">
        <StatusDot status={req.status} />
      </span>
      <span className="text-[11.5px] text-[var(--text-secondary)]">
        {req.sprint ?? <span className="text-[var(--text-tertiary)]">—</span>}
      </span>
      <span className="font-mono text-[11.5px] text-[var(--text-secondary)]">
        {req.testCaseCount === 0 ? (
          <span className="text-[var(--warn)]">0</span>
        ) : (
          req.testCaseCount
        )}
      </span>
      <span className="flex items-center gap-1.5 lg:justify-end">
        <RowActionButton onClick={() => onGenerateTests(req)} variant="ghost">
          ✨ Tests
        </RowActionButton>
        <RowActionButton onClick={() => onEdit(req)} variant="ghost">
          Edit
        </RowActionButton>
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Chips + dots + badges
// ---------------------------------------------------------------------------

function PriorityBadge({ priority }: { priority: RequirementPriority }) {
  const tone =
    priority === 'P0'
      ? 'bg-[var(--fail)]/15 text-[var(--fail)]'
      : priority === 'P1'
        ? 'bg-[var(--warn)]/15 text-[var(--warn)]'
        : priority === 'P2'
          ? 'bg-[var(--secondary)]/15 text-[var(--secondary)]'
          : 'bg-[var(--overlay)] text-[var(--text-tertiary)]';
  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 font-mono text-[10.5px] font-bold ${tone}`}
    >
      {requirementPriorityLabel[priority]}
    </span>
  );
}

function StatusDot({ status }: { status: RequirementStatus }) {
  const tone =
    status === 'active'
      ? 'bg-[var(--pass)]'
      : status === 'draft'
        ? 'bg-[var(--warn)]'
        : status === 'done'
          ? 'bg-[var(--secondary)]'
          : 'bg-[var(--text-tertiary)]';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${tone}`} />
      <span className="text-[11.5px] text-[var(--text-secondary)]">
        {requirementStatusLabel[status]}
      </span>
    </span>
  );
}

function SprintChip({ sprint }: { sprint: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded border border-[var(--border-subtle)] bg-[var(--raised)] px-1.5 font-mono text-[10.5px] text-[var(--text-secondary)]">
      {sprint}
    </span>
  );
}

function SourceChip({ source }: { source: RequirementSource }) {
  return (
    <span className="inline-flex h-5 items-center rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
      {requirementSourceLabel[source]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty state + footer
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--base)] py-16 text-center"
    >
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">
        No requirements match this filter.
      </p>
      <p className="max-w-[420px] text-[12.5px] text-[var(--text-tertiary)]">
        Try clearing a chip, or start fresh by adding a requirement or running an import from Jira.
      </p>
    </div>
  );
}

function Footer({ total, shown }: { total: number; shown: number }) {
  return (
    <footer className="flex flex-col items-start justify-between gap-2 border-t border-[var(--border-subtle)] pt-4 text-[11.5px] text-[var(--text-tertiary)] sm:flex-row sm:items-center">
      <span>
        Showing <span className="font-mono font-semibold text-[var(--text-primary)]">{shown}</span>{' '}
        of <span className="font-mono font-semibold text-[var(--text-primary)]">{total}</span>{' '}
        requirements.
      </span>
      <span>
        Real /api/projects/:slug/requirements wires at MS0-T030.5+ (BE M2 schema). Pattern A.
      </span>
    </footer>
  );
}
