// F14 Requirements list — main orchestrator (M3 Pattern A scaffold).
//
// Locked reference: PM1_UI_v2/Redesign Frame by claude design/F14 Requirements v2.html
// Per Hard Rule 15: pixel-faithful port within React-component idioms.
//
// Layout (mobile-first per CLAUDE.md Rule 12 + Rule 14):
//   AdminShell wrap (active="requirements") provides top bar + left rail.
//   Page owns content area only:
//     1. Breadcrumb (Home / Plan / Requirements)
//     2. Page header (title + sub + 2 CTAs)
//     3. Sprint context row (active sprint chip + 4 stat metas)
//     4. Filter bar (Priority / Status / Coverage chip groups + search)
//     5. Bulk action bar (only when selectedIds.size > 0)
//     6. Table (≥ md) / Cards (< md)
//     7. Pagination footer
//
// Pattern A markers — every interactive site fires a console.info.
// Local state IS allowed for filter chip toggles + checkbox selection
// so the bulk-bar can show; only persistence is deferred to Pattern B.

'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AgentName } from '@/components/ui/agent-name';
import { EditRequirementModal } from './edit-requirement-modal';
import { LinkTestCaseModal } from './link-test-case-modal';
import {
  RequirementDetailDrawer,
  type RequirementDetailDrawerData,
} from './requirement-detail-drawer';

// ---------------------------------------------------------------------------
// Types — local view models for the Pattern A scaffold. Shape mirrors
// what BE+1's @qa-nexus/shared Requirement schemas will land with;
// when Pattern B flips, swap out for KbDocumentListItem-style imports.
// ---------------------------------------------------------------------------

type Priority = 'P0' | 'P1' | 'P2' | 'P3';
type Status = 'approved' | 'in-review' | 'draft' | 'archived';
type Coverage = 'full' | 'gap' | 'empty';
type Source = 'jira' | 'manual';

interface Requirement {
  id: string; // e.g. "RET-247"
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  coverage: Coverage;
  /** Indexed test cases linked / total expected. Empty = "0/—". */
  rtmLinked: number;
  rtmTotal: number | null;
  rtmLinkedBy: 'composer' | string; // "composer" → AgentName; else display name
  updatedAtRelative: string;
  updatedBy: string;
  source: Source;
}

// ---------------------------------------------------------------------------
// Stub data (Iksula Returns canon — RET-247..RET-258 per spec)
// ---------------------------------------------------------------------------

const STUB_REQUIREMENTS: Requirement[] = [
  {
    id: 'RET-247',
    title: 'Refund window for digital goods extends to 30 days on partial-download failure',
    description:
      'Customer-facing refund window must auto-extend from 14 → 30 days when at least one download segment fails. Affects refund-eligibility cron + RMA approval matrix; Stock Ops needs a daily reconciliation report.',
    priority: 'P0',
    status: 'in-review',
    coverage: 'gap',
    rtmLinked: 8,
    rtmTotal: 12,
    rtmLinkedBy: 'composer',
    updatedAtRelative: '2 hr ago',
    updatedBy: 'Akshay P.',
    source: 'jira',
  },
  {
    id: 'RET-248',
    title: 'Partial returns: per-shipment refund pro-ration with stock-zone label generation',
    description:
      'Multi-package returns must pro-rate refunds by shipment value, not flat-split. Generate per-zone return labels (north / south / west) so the warehouse routing service picks the right carrier.',
    priority: 'P1',
    status: 'in-review',
    coverage: 'full',
    rtmLinked: 14,
    rtmTotal: 14,
    rtmLinkedBy: 'composer',
    updatedAtRelative: '4 hr ago',
    updatedBy: 'Yogesh M.',
    source: 'jira',
  },
  {
    id: 'RET-251',
    title: 'Bulk return manual review SLA: 24-hour queue for 10+ unit same-SKU returns',
    description:
      'Bulk returns of the same SKU within a 24-hour window flag for manual review by Lead. Surface in F08 Home queue with a 24-hour SLA timer.',
    priority: 'P1',
    status: 'draft',
    coverage: 'empty',
    rtmLinked: 0,
    rtmTotal: null,
    rtmLinkedBy: '',
    updatedAtRelative: '1 day ago',
    updatedBy: 'Kishor K.',
    source: 'jira',
  },
  {
    id: 'RET-252',
    title: 'RMA approval matrix: 2-of-3 sign-off for refunds >₹25,000',
    description:
      'High-value refunds (>₹25,000) require any 2 of {QA Lead, Stock Ops Lead, Finance} to approve in F21 Defects Hub before refund webhook fires.',
    priority: 'P2',
    status: 'approved',
    coverage: 'full',
    rtmLinked: 6,
    rtmTotal: 6,
    rtmLinkedBy: 'Akshay P.',
    updatedAtRelative: '2 days ago',
    updatedBy: 'Akshay P.',
    source: 'manual',
  },
  {
    id: 'RET-258',
    title: 'Holiday calendar exceptions: refund window pauses for Indian Stock Exchange holidays',
    description:
      'Refund windows freeze on declared NSE/BSE holidays — both 14-day and 30-day windows. Holiday list pulls from RBI calendar API at midnight IST.',
    priority: 'P2',
    status: 'approved',
    coverage: 'full',
    rtmLinked: 9,
    rtmTotal: 9,
    rtmLinkedBy: 'composer',
    updatedAtRelative: '3 days ago',
    updatedBy: 'Nadim S.',
    source: 'manual',
  },
];

// Pre-selected for the bulk-bar demo per spec
const PRE_SELECTED = new Set(['RET-247', 'RET-248', 'RET-251']);

// Filter chip options
const PRIORITY_OPTIONS: Priority[] = ['P0', 'P1', 'P2', 'P3'];
const STATUS_OPTIONS: { key: Status; label: string }[] = [
  { key: 'approved', label: 'Approved' },
  { key: 'in-review', label: 'In review' },
  { key: 'draft', label: 'Draft' },
  { key: 'archived', label: 'Archived' },
];
const COVERAGE_OPTIONS: { key: 'all' | 'gap' | 'empty'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gap', label: 'Has gaps' },
  { key: 'empty', label: 'Uncovered' },
];

// ---------------------------------------------------------------------------
// Tone / token helpers
// ---------------------------------------------------------------------------

function priorityTone(p: Priority): { bg: string; border: string; color: string } {
  switch (p) {
    case 'P0':
      return {
        bg: 'rgba(248,113,113,0.12)',
        border: 'rgba(248,113,113,0.30)',
        color: 'var(--fail)',
      };
    case 'P1':
      return {
        bg: 'rgba(251,191,36,0.12)',
        border: 'rgba(251,191,36,0.30)',
        color: 'var(--warn)',
      };
    case 'P2':
      return {
        bg: 'rgba(96,165,250,0.12)',
        border: 'rgba(96,165,250,0.30)',
        color: 'var(--info)',
      };
    case 'P3':
      return {
        bg: 'var(--raised)',
        border: 'var(--border-subtle)',
        color: 'var(--text-tertiary)',
      };
  }
}

function statusTone(s: Status): { bg: string; border: string; color: string; label: string } {
  switch (s) {
    case 'approved':
      return {
        bg: 'rgba(52,211,153,0.12)',
        border: 'rgba(52,211,153,0.30)',
        color: 'var(--pass)',
        label: 'Approved',
      };
    case 'in-review':
      return {
        bg: 'rgba(251,191,36,0.12)',
        border: 'rgba(251,191,36,0.30)',
        color: 'var(--warn)',
        label: 'In review',
      };
    case 'draft':
      return {
        bg: 'rgba(96,165,250,0.12)',
        border: 'rgba(96,165,250,0.30)',
        color: 'var(--info)',
        label: 'Draft',
      };
    case 'archived':
      return {
        bg: 'var(--raised)',
        border: 'var(--border-subtle)',
        color: 'var(--text-tertiary)',
        label: 'Archived',
      };
  }
}

function coverageBarColor(c: Coverage): string {
  switch (c) {
    case 'full':
      return 'var(--pass)';
    case 'gap':
      return 'var(--warn)';
    case 'empty':
      return 'var(--fail)';
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RequirementsListPage() {
  // Next 15 + output: 'export' bails the static prerender if
  // `useSearchParams()` is called outside a <Suspense> boundary.
  // The compound learning from Day-9 (F06 Sign In) — wrap content
  // in Suspense at the route segment.
  return (
    <AdminShell active="requirements">
      <Suspense fallback={null}>
        <RequirementsListContent />
      </Suspense>
    </AdminShell>
  );
}

function RequirementsListContent() {
  const [rows] = useState<Requirement[]>(STUB_REQUIREMENTS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(PRE_SELECTED);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<Status>>(new Set());
  const [coverageFilter, setCoverageFilter] = useState<'all' | 'gap' | 'empty'>('all');

  // F14m1 modal trigger via URL search-param. Deep-linkable + plays
  // nicely with browser back-button. `?edit=new` → new requirement;
  // `?edit=RET-247` → edit row.
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams?.get('edit') ?? null;
  const linkRequirementId = searchParams?.get('link') ?? null;
  const viewRequirementId = searchParams?.get('view') ?? null;

  const openNewRequirement = useCallback(() => {
    console.info('pattern-a:deferred:requirements:new');
    router.push('/requirements?edit=new');
  }, [router]);

  const openEditRequirement = useCallback(
    (id: string) => {
      console.info('pattern-a:deferred:requirements:row:edit', { id });
      router.push(`/requirements?edit=${id}`);
    },
    [router],
  );

  const closeEditModal = useCallback(() => {
    router.replace('/requirements');
  }, [router]);

  const openLinkTestCases = useCallback(
    (id: string) => {
      console.info('pattern-a:deferred:requirements:row:link-tests', { id });
      router.push(`/requirements?link=${id}`);
    },
    [router],
  );

  const closeLinkModal = useCallback(() => {
    router.replace('/requirements');
  }, [router]);

  const openViewDrawer = useCallback(
    (id: string) => {
      console.info('pattern-a:deferred:requirements:row:view', { id });
      router.push(`/requirements?view=${id}`);
    },
    [router],
  );

  const closeViewDrawer = useCallback(() => {
    router.replace('/requirements');
  }, [router]);

  // Convert a row → drawer-data shape. Pattern A: synthesize the
  // detail fields locally; Pattern B (Day-15) will fetch the full
  // requirement via /api/projects/:projectId/requirements/:reqId.
  const drawerData: RequirementDetailDrawerData | null = useMemo(() => {
    if (!viewRequirementId) return null;
    const row = rows.find((r) => r.id === viewRequirementId);
    if (!row) return null;
    return rowToDrawerData(row);
  }, [viewRequirementId, rows]);

  useEffect(() => {
    console.info('pattern-a:deferred:requirements:load', {
      total: rows.length,
      preSelected: selectedIds.size,
    });
    // Intentionally fires once on mount only; rows + selection are
    // local-state and don't need to re-fire the load marker.
  }, []);

  // Derived filtered rows. Filters are local-state-driven; persistence
  // is deferred to Pattern B.
  const filteredRows = useMemo(() => {
    let out = rows;
    if (priorityFilter.size > 0) out = out.filter((r) => priorityFilter.has(r.priority));
    if (statusFilter.size > 0) out = out.filter((r) => statusFilter.has(r.status));
    if (coverageFilter !== 'all') out = out.filter((r) => r.coverage === coverageFilter);
    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      out = out.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }
    return out;
  }, [rows, priorityFilter, statusFilter, coverageFilter, search]);

  function togglePriority(p: Priority) {
    console.info('pattern-a:deferred:requirements:filter:priority', { value: p });
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }
  function toggleStatus(s: Status) {
    console.info('pattern-a:deferred:requirements:filter:status', { value: s });
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }
  function setCoverage(c: 'all' | 'gap' | 'empty') {
    console.info('pattern-a:deferred:requirements:filter:coverage', { value: c });
    setCoverageFilter(c);
  }

  function toggleRow(id: string) {
    console.info('pattern-a:deferred:requirements:select', { id });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    console.info('pattern-a:deferred:requirements:select-all', {
      currentlyAll: selectedIds.size === filteredRows.length,
    });
    setSelectedIds((prev) => {
      if (prev.size === filteredRows.length) return new Set();
      return new Set(filteredRows.map((r) => r.id));
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  const allSelected = selectedIds.size === filteredRows.length && filteredRows.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)]">
          <li>
            <a
              href="/home"
              className="hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            >
              Home
            </a>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={11} />
          </li>
          <li>Plan</li>
          <li aria-hidden="true">
            <ChevronRight size={11} />
          </li>
          <li className="text-[var(--text-secondary)]">Requirements</li>
        </ol>
      </nav>

      {/* Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[22px] font-bold leading-[28px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[26px] sm:leading-[32px]">
            Requirements
          </h1>
          <p className="max-w-[640px] text-[13px] leading-[20px] text-[var(--text-tertiary)] sm:text-[14px]">
            Source of truth for what must be tested. Generate test cases from any requirement with{' '}
            <AgentName code="composer" inherit /> using project KB context.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => console.info('pattern-a:deferred:requirements:import-jira')}
            className="inline-flex h-9 min-h-[44px] items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
          >
            <Download size={14} aria-hidden="true" />
            Import from Jira
          </button>
          <button
            type="button"
            onClick={openNewRequirement}
            className="inline-flex h-9 min-h-[44px] items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
            style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}
          >
            <Plus size={14} aria-hidden="true" />
            New requirement
          </button>
        </div>
      </header>

      {/* Sprint context row */}
      <SprintContextRow />

      {/* Filter bar */}
      <FilterBar
        priorityFilter={priorityFilter}
        statusFilter={statusFilter}
        coverageFilter={coverageFilter}
        search={search}
        setSearch={setSearch}
        onTogglePriority={togglePriority}
        onToggleStatus={toggleStatus}
        onSetCoverage={setCoverage}
      />

      {/* Bulk action bar — appears when selection > 0 */}
      {selectedIds.size > 0 && <BulkActionBar count={selectedIds.size} onClear={clearSelection} />}

      {/* Desktop table (≥ md) */}
      <div
        className="hidden overflow-hidden rounded-lg border md:block"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'var(--base)',
        }}
      >
        <RequirementsTable
          rows={filteredRows}
          selectedIds={selectedIds}
          allSelected={allSelected}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          onEditRow={openEditRequirement}
          onLinkTestCases={openLinkTestCases}
          onOpenView={openViewDrawer}
        />
        <PaginationFooter total={142} from={1} to={filteredRows.length} />
      </div>

      {/* Mobile cards (< md) */}
      <ul className="flex flex-col gap-3 md:hidden">
        {filteredRows.map((row) => (
          <RequirementCard
            key={row.id}
            row={row}
            selected={selectedIds.has(row.id)}
            onToggle={() => toggleRow(row.id)}
            onEdit={() => openEditRequirement(row.id)}
            onOpenView={() => openViewDrawer(row.id)}
          />
        ))}
        <PaginationFooter total={142} from={1} to={filteredRows.length} />
      </ul>

      {/* F14m1 Edit Requirement Modal — opens via ?edit=<id|new>.
          F14m2 Link Test Case Modal — opens via ?link=<id>. The two
          modals are mutually exclusive (?edit takes precedence per
          spec — if both params present, the link modal won't render
          because we close on edit-modal mount). */}
      <EditRequirementModal mode={editMode} onClose={closeEditModal} />
      <LinkTestCaseModal
        requirementId={editMode === null ? linkRequirementId : null}
        onClose={closeLinkModal}
      />
      {/* F14 Requirement Detail Drawer (Day-14 TASK A3) — opens via
          ?view=<id>. Mutually exclusive with ?edit and ?link; renders
          only when neither modal is mounted. */}
      <RequirementDetailDrawer
        open={editMode === null && linkRequirementId === null && drawerData !== null}
        data={drawerData}
        onClose={closeViewDrawer}
        onOpenEdit={(id) => {
          // Switch from drawer (view) → modal (edit) by replacing the URL.
          router.replace(`/requirements?edit=${id}`);
        }}
        onGenerate={(id) => {
          router.push(`/test-cases/generate?source=${id}`);
        }}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// SprintContextRow — pulsing chip + 4 stat metas
// ---------------------------------------------------------------------------

function SprintContextRow() {
  return (
    <section
      aria-label="Active sprint context"
      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 sm:p-4"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--base)' }}
    >
      {/* Pulsing sprint chip */}
      <span
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.05em]"
        style={{
          background: 'rgba(45,212,191,0.10)',
          border: '1px solid rgba(45,212,191,0.30)',
          color: 'var(--primary)',
        }}
      >
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: 'var(--primary)' }}
        />
        Sprint 42 · Day 9 of 14
      </span>
      <StatMeta icon={Calendar} label="Release" value="R-2026-04-PaymentV2" />
      <StatMeta icon={Target} label="Coverage" value="84%" tone="pass" />
      <StatMeta icon={AlertTriangle} label="Open gaps" value="6" tone="warn" />
      <StatMeta icon={TrendingUp} label="Velocity" value="+12 / sprint" tone="info" />
    </section>
  );
}

function StatMeta({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  tone?: 'pass' | 'warn' | 'info';
}) {
  const valueColor =
    tone === 'pass'
      ? 'var(--pass)'
      : tone === 'warn'
        ? 'var(--warn)'
        : tone === 'info'
          ? 'var(--info)'
          : 'var(--text-primary)';
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} aria-hidden="true" className="text-[var(--text-tertiary)]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

function FilterBar({
  priorityFilter,
  statusFilter,
  coverageFilter,
  search,
  setSearch,
  onTogglePriority,
  onToggleStatus,
  onSetCoverage,
}: {
  priorityFilter: Set<Priority>;
  statusFilter: Set<Status>;
  coverageFilter: 'all' | 'gap' | 'empty';
  search: string;
  setSearch: (v: string) => void;
  onTogglePriority: (p: Priority) => void;
  onToggleStatus: (s: Status) => void;
  onSetCoverage: (c: 'all' | 'gap' | 'empty') => void;
}) {
  return (
    <section
      className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--base)' }}
    >
      {/* Priority group */}
      <FilterGroup label="Priority">
        {PRIORITY_OPTIONS.map((p) => {
          const tone = priorityTone(p);
          const active = priorityFilter.has(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => onTogglePriority(p)}
              className="inline-flex h-7 items-center rounded-full border px-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                background: active ? tone.bg : 'transparent',
                borderColor: active ? tone.border : 'var(--border-subtle)',
                color: active ? tone.color : 'var(--text-tertiary)',
              }}
              aria-pressed={active}
            >
              {p}
            </button>
          );
        })}
      </FilterGroup>

      <Divider />

      {/* Status group */}
      <FilterGroup label="Status">
        {STATUS_OPTIONS.map(({ key, label }) => {
          const tone = statusTone(key);
          const active = statusFilter.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleStatus(key)}
              className="inline-flex h-7 items-center rounded-full border px-2.5 text-[12px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                background: active ? tone.bg : 'transparent',
                borderColor: active ? tone.border : 'var(--border-subtle)',
                color: active ? tone.color : 'var(--text-tertiary)',
              }}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </FilterGroup>

      <Divider />

      {/* Coverage group */}
      <FilterGroup label="Coverage">
        {COVERAGE_OPTIONS.map(({ key, label }) => {
          const active = coverageFilter === key;
          const color =
            key === 'gap'
              ? 'var(--warn)'
              : key === 'empty'
                ? 'var(--fail)'
                : 'var(--text-secondary)';
          const bg =
            key === 'gap'
              ? 'rgba(251,191,36,0.12)'
              : key === 'empty'
                ? 'rgba(248,113,113,0.12)'
                : 'var(--raised)';
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSetCoverage(key)}
              className="inline-flex h-7 items-center rounded-full border px-2.5 text-[12px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                background: active ? bg : 'transparent',
                borderColor: active ? color : 'var(--border-subtle)',
                color: active ? color : 'var(--text-tertiary)',
              }}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </FilterGroup>

      <div className="flex-1" />

      {/* Search mini */}
      <label
        className="ml-auto flex h-9 items-center gap-2 rounded-md border bg-[var(--raised)] px-3 text-[12.5px] text-[var(--text-tertiary)] focus-within:border-[var(--secondary)] sm:min-w-[200px] sm:max-w-[320px]"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <Search size={13} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            console.info('pattern-a:deferred:requirements:search', { q: e.target.value });
          }}
          placeholder="Search requirements…"
          className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
      </label>
    </section>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="hidden h-5 w-px sm:block"
      style={{ background: 'var(--border-subtle)' }}
    />
  );
}

// ---------------------------------------------------------------------------
// BulkActionBar
// ---------------------------------------------------------------------------

function BulkActionBar({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <section
      role="region"
      aria-label="Bulk actions"
      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: 'rgba(167,139,250,0.10)',
        borderColor: 'rgba(167,139,250,0.30)',
        color: 'var(--secondary)',
      }}
    >
      <div className="flex items-center gap-3 text-[13px]">
        <span className="font-semibold">
          {count} requirement{count === 1 ? '' : 's'} selected
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-[12px] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => console.info('pattern-a:deferred:requirements:bulk:generate', { count })}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'rgba(167,139,250,0.20)',
            border: '1px solid rgba(167,139,250,0.40)',
            color: 'var(--secondary)',
          }}
        >
          <Sparkles size={13} aria-hidden="true" />
          Generate test cases · <AgentName code="composer" inherit />
        </button>
        <button
          type="button"
          onClick={() =>
            console.info('pattern-a:deferred:requirements:bulk:convert-jira', { count })
          }
          className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-transparent px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          Convert to Jira
        </button>
        <button
          type="button"
          onClick={() => console.info('pattern-a:deferred:requirements:bulk:archive', { count })}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-transparent px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          Archive
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// RequirementsTable (desktop)
// ---------------------------------------------------------------------------

function RequirementsTable({
  rows,
  selectedIds,
  allSelected,
  onToggleRow,
  onToggleAll,
  onEditRow,
  onLinkTestCases,
  onOpenView,
}: {
  rows: Requirement[];
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onEditRow: (id: string) => void;
  onLinkTestCases: (id: string) => void;
  onOpenView: (id: string) => void;
}) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr
          className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          style={{ background: 'var(--overlay)' }}
        >
          <th className="w-9 px-3 py-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              aria-label="Select all rows"
              className="h-4 w-4 cursor-pointer accent-[var(--secondary)]"
            />
          </th>
          <th className="w-[100px] px-3 py-3">ID</th>
          <th className="px-3 py-3">Title & description</th>
          <th className="w-[60px] px-3 py-3">Pri</th>
          <th className="w-[110px] px-3 py-3">Status</th>
          <th className="w-[180px] px-3 py-3">RTM coverage</th>
          <th className="w-[120px] px-3 py-3">Updated</th>
          <th className="w-[120px] px-3 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const selected = selectedIds.has(row.id);
          const pri = priorityTone(row.priority);
          const stat = statusTone(row.status);
          return (
            <tr
              key={row.id}
              className="border-t text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--overlay)]"
              style={{
                borderColor: 'var(--border-subtle)',
                background: selected ? 'rgba(167,139,250,0.06)' : 'transparent',
                boxShadow: selected ? 'inset 3px 0 0 var(--secondary)' : 'none',
              }}
              onClick={() => onOpenView(row.id)}
            >
              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleRow(row.id)}
                  aria-label={`Select ${row.id}`}
                  className="h-4 w-4 cursor-pointer accent-[var(--secondary)]"
                />
              </td>
              <td
                className="px-3 py-3 align-top font-mono text-[12.5px] font-semibold"
                style={{ color: 'var(--secondary)' }}
              >
                {row.id}
              </td>
              <td className="px-3 py-3 align-top">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[var(--text-primary)]">{row.title}</span>
                  <span className="line-clamp-2 text-[12px] text-[var(--text-tertiary)]">
                    {row.description}
                  </span>
                  <SourceLine source={row.source} />
                </div>
              </td>
              <td className="px-3 py-3 align-top">
                <span
                  className="inline-flex h-5 items-center rounded-[3px] px-1.5 font-mono text-[10.5px] font-bold"
                  style={{ background: pri.bg, color: pri.color }}
                >
                  {row.priority}
                </span>
              </td>
              <td className="px-3 py-3 align-top">
                <span
                  className="inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
                  style={{
                    background: stat.bg,
                    border: `1px solid ${stat.border}`,
                    color: stat.color,
                  }}
                >
                  {stat.label}
                </span>
              </td>
              <td className="px-3 py-3 align-top">
                <CoverageMeter row={row} />
              </td>
              <td className="px-3 py-3 align-top">
                <div className="flex flex-col">
                  <span
                    className="font-mono text-[12px] text-[var(--text-tertiary)]"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {row.updatedAtRelative}
                  </span>
                  <span className="text-[11px] text-[var(--text-disabled)]">{row.updatedBy}</span>
                </div>
              </td>
              <td className="px-3 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <RowAction
                    label={`Generate test cases for ${row.id}`}
                    icon={Sparkles}
                    color="var(--secondary)"
                    onClick={() =>
                      console.info('pattern-a:deferred:requirements:row:generate', { id: row.id })
                    }
                  />
                  <RowAction
                    label={`Edit ${row.id}`}
                    icon={Pencil}
                    onClick={() => onEditRow(row.id)}
                  />
                  <RowAction
                    label={`Link test cases to ${row.id}`}
                    icon={MoreHorizontal}
                    onClick={() => onLinkTestCases(row.id)}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CoverageMeter({ row }: { row: Requirement }) {
  const { coverage, rtmLinked, rtmTotal } = row;
  const pct =
    rtmTotal && rtmTotal > 0 ? Math.min(100, Math.round((rtmLinked / rtmTotal) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div
        className="font-mono text-[12px] text-[var(--text-secondary)]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {rtmLinked}
        <span className="text-[var(--text-tertiary)]"> /{rtmTotal ?? '—'}</span>
      </div>
      <div
        aria-hidden="true"
        className="h-[5px] w-full overflow-hidden rounded-full"
        style={{ background: 'var(--overlay)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: coverageBarColor(coverage) }}
        />
      </div>
      {row.rtmLinkedBy === 'composer' && rtmLinked > 0 && (
        <div className="flex items-center gap-1 text-[10.5px] text-[var(--text-tertiary)]">
          linked by <AgentName code="composer" inherit />
        </div>
      )}
      {row.rtmLinkedBy && row.rtmLinkedBy !== 'composer' && (
        <div className="text-[10.5px] text-[var(--text-tertiary)]">linked by {row.rtmLinkedBy}</div>
      )}
    </div>
  );
}

function SourceLine({ source }: { source: Source }) {
  const dot = source === 'jira' ? 'var(--secondary)' : 'var(--info)';
  const label = source === 'jira' ? 'Jira' : 'Manual';
  return (
    <span className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-tertiary)]">
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: dot }}
      />
      <span>{label}</span>
    </span>
  );
}

function RowAction({
  label,
  icon: Icon,
  onClick,
  color,
}: {
  label: string;
  icon: typeof Pencil;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={{ color: color ?? 'var(--text-tertiary)' }}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Mobile card
// ---------------------------------------------------------------------------

function RequirementCard({
  row,
  selected,
  onToggle,
  onEdit,
  onOpenView,
}: {
  row: Requirement;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onOpenView: () => void;
}) {
  const pri = priorityTone(row.priority);
  const stat = statusTone(row.status);
  return (
    <li
      className="rounded-lg border p-3"
      style={{
        borderColor: selected ? 'rgba(167,139,250,0.40)' : 'var(--border-subtle)',
        background: selected ? 'rgba(167,139,250,0.06)' : 'var(--base)',
      }}
    >
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${row.id}`}
          className="h-4 w-4 cursor-pointer accent-[var(--secondary)]"
        />
        <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--secondary)' }}>
          {row.id}
        </span>
        <span
          className="inline-flex h-5 items-center rounded-[3px] px-1.5 font-mono text-[10.5px] font-bold"
          style={{ background: pri.bg, color: pri.color }}
        >
          {row.priority}
        </span>
        <span
          className="ml-auto inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-[0.04em]"
          style={{ background: stat.bg, border: `1px solid ${stat.border}`, color: stat.color }}
        >
          {stat.label}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenView}
        className="mt-2 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <p className="text-[13px] font-medium text-[var(--text-primary)]">{row.title}</p>
        <p className="mt-1 line-clamp-3 text-[12px] text-[var(--text-tertiary)]">
          {row.description}
        </p>
      </button>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          RTM: {row.rtmLinked}/{row.rtmTotal ?? '—'}
        </span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <RowAction
            label={`Generate test cases for ${row.id}`}
            icon={Sparkles}
            color="var(--secondary)"
            onClick={() =>
              console.info('pattern-a:deferred:requirements:row:generate', { id: row.id })
            }
          />
          <RowAction label={`Edit ${row.id}`} icon={Pencil} onClick={onEdit} />
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function PaginationFooter({ total, from, to }: { total: number; from: number; to: number }) {
  return (
    <div
      className="flex items-center justify-between border-t px-3 py-3 text-[12px] text-[var(--text-tertiary)] md:px-4"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => console.info('pattern-a:deferred:requirements:page:prev')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => console.info('pattern-a:deferred:requirements:page:next')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--overlay)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          aria-label="Next page"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer-data adapter — maps a Requirement row → drawer view-model.
// Day-14 TASK A3. Pattern A: synthesize fields locally + return a
// canned dataset for known IDs (RET-247 etc.) that the v2 mocks
// reference. Pattern B (Day-15) will fetch full requirement detail
// via /api/projects/:projectId/requirements/:reqId.
// ---------------------------------------------------------------------------

function rowToDrawerData(row: Requirement): RequirementDetailDrawerData {
  // Status mapping: list page uses 'approved' | 'in-review' | 'draft' |
  // 'archived'; drawer accepts a slightly broader vocabulary.
  const statusMap: Record<Status, { kind: RequirementDetailDrawerData['status']; label: string }> =
    {
      approved: { kind: 'active', label: 'Approved' },
      'in-review': { kind: 'in-review', label: 'In review' },
      draft: { kind: 'draft', label: 'Draft' },
      archived: { kind: 'archived', label: 'Archived' },
    };
  const status = statusMap[row.status];

  // Acceptance criteria + Composer suggestions canon by row id. Falls
  // back to deterministic-but-generic phrasing for rows not enumerated.
  const known: Record<string, { ac: string[]; suggestions: string[] }> = {
    'RET-247': {
      ac: [
        'Refund window auto-extends from 14 → 30 days when ≥1 download segment fails.',
        'Affected customers receive an email + in-app banner within 1 hour of detection.',
        'Stock Ops daily reconciliation report lists all extended-window refunds.',
      ],
      suggestions: [
        'Generate 5 test cases covering happy path + 14-day boundary + segment-failure.',
        'Add KB chunk: refund_policy_v3.pdf §2.1 (download-failure clause).',
        'Curator dedup: cross-check vs TC-RET-0142 (refund-API retry tests).',
      ],
    },
    'RET-248': {
      ac: [
        'Multi-package returns pro-rate refunds by shipment value, not flat-split.',
        'Per-zone return labels generated for north / south / west warehouses.',
        'Carrier routing service receives the correct zone code on every label.',
      ],
      suggestions: [
        'Cover 3-shipment cart with mixed zones in the test plan.',
        'Add KB chunk: warehouse_routing_spec.md (zone matrix).',
      ],
    },
    'RET-251': {
      ac: [
        'Bulk returns of same SKU within 24-hour window flag for Lead manual review.',
        'F08 Home queue surfaces flagged bulk returns with 24-hour SLA timer.',
      ],
      suggestions: [
        'Compose 3 test cases: 9-unit (no flag), 10-unit (flag), 11-unit (flag).',
        'Generate from Composer with KB grounding.',
      ],
    },
    'RET-252': {
      ac: [
        'Refunds > ₹25,000 require 2-of-3 sign-off from {QA Lead, Stock Ops, Finance}.',
        'F21 Defects Hub surfaces pending high-value approvals.',
      ],
      suggestions: [
        'Boundary test at exactly ₹25,000 (no approval needed).',
        '2-approver path + 3-approver path; reject path.',
      ],
    },
    'RET-258': {
      ac: [
        'Refund windows freeze on declared NSE/BSE holidays for both 14-day and 30-day windows.',
        'Holiday list pulls from RBI calendar API at midnight IST.',
      ],
      suggestions: [
        'Compose calendar boundary test suite (DST / holiday eve / fall-back).',
        'Pin a Curator dedup against the existing TC-RET-0098 holiday tests.',
      ],
    },
  };
  const kn = known[row.id] ?? {
    ac: [`${row.title}.`, 'Acceptance criteria for this requirement land via Pattern B (Day-15).'],
    suggestions: [
      'Generate 5 test cases via Composer.',
      'Run Curator dedup against existing TC library.',
    ],
  };

  // RTM coverage stats — synthesize pass/fail/blocked/not-run from
  // rtmLinked + a simple heuristic. Pattern B will pull real run
  // results.
  const linked = row.rtmLinked;
  const passed = Math.max(0, Math.floor(linked * 0.65));
  const failed = Math.max(0, Math.floor(linked * 0.1));
  const blocked = Math.max(0, Math.floor(linked * 0.05));
  const notRun = Math.max(0, linked - passed - failed - blocked);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: status.kind,
    statusLabel: status.label,
    jiraKey: row.source === 'jira' ? row.id : undefined,
    jiraUrl: row.source === 'jira' ? `https://iksula.atlassian.net/browse/${row.id}` : undefined,
    acceptanceCriteria: kn.ac,
    linkedTestCaseCount: linked,
    passedCount: passed,
    failedCount: failed,
    blockedCount: blocked,
    notRunCount: notRun,
    composerSuggestions: kn.suggestions,
    traceability: {
      sprint: 'Sprint 42',
      epicKey: 'RET-200',
      epicTitle: 'Refund & Returns v2',
      auditChainHash: '4f9a2b8c1d3e0a5b6c7d8e9f0a1b2c3d',
    },
  };
}
