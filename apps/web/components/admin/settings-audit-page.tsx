// F28 Settings & Audit — main orchestrator.
//
// Locked source: PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F28 Settings and Audit.html
// Mounted at /admin/settings (Admin-only via `<AdminGuard>`).
//
// Hash-anchor deeplinks: F27 fires `pattern-a:deferred:users-audit-open`
// and routes to /admin/settings#audit-log → this page reads the URL hash
// on mount and lands on the Audit Log tab. Default tab when the hash is
// empty (or unknown) is "general".
//
// Pattern A enforcement (PM1_PRD §F28) — 9 deferred markers:
// - Mount → `pattern-a:deferred:settings-load`
//     { activeTab, eventCount, retentionDays, chainIntegrityPct }.
// - Tab change → `pattern-a:deferred:settings-tab-change` { tab }.
// - Audit search → `pattern-a:deferred:audit-search-change` { query }.
// - Audit filter → `pattern-a:deferred:audit-filter-change`
//     { kind, value }.
// - Export → `pattern-a:deferred:audit-export` { format: 'csv' | 'pdf' }.
// - Schedule digest → `pattern-a:deferred:audit-schedule-digest`.
// - Verify hash → `pattern-a:deferred:audit-verify-hash` { eventId }.
// - Pagination → `pattern-a:deferred:audit-paginate` { page }.
// - Retention "Adjust" → `pattern-a:deferred:audit-retention-adjust`.
// - ZERO fetch / useMutation / axios. Real /api/audit-log + /api/settings
//   land MS0-T030.5+ post-merge of BE M1 schema.
//
// ADR-006 hooks:
// - `useCurrentUser()` — workspaceId for the mount marker.
// - `useTeamRoster()` + `useTeamMember(actorId)` — audit-row attribution
//   (no inline name strings — every actor resolves via seed roster).
// - `useProjectList()` — project context for retention scoping copy.
// NO local data.ts entries for entity identity.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useTeamMember } from '@/lib/contexts/TeamRosterContext';
import { useProjectList } from '@/lib/contexts/ProjectContext';
import { SEED_IDS } from '@/lib/demo-seed';
import { AdminShell } from './admin-shell';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type SettingsTab =
  | 'general'
  | 'branding'
  | 'retention'
  | 'integrations'
  | 'audit-log'
  | 'billing'
  | 'sso'
  | 'compliance';

interface TabDef {
  id: SettingsTab;
  label: string;
  count?: string;
  badge?: string;
  available: boolean;
}

const TABS: TabDef[] = [
  { id: 'general', label: 'General', available: true },
  { id: 'branding', label: 'Branding', available: true },
  { id: 'retention', label: 'Data Retention', available: true },
  { id: 'integrations', label: 'Integrations Health', count: '5', available: true },
  { id: 'audit-log', label: 'Audit Log', count: '47k', available: true },
  { id: 'billing', label: 'Billing', badge: 'Admin', available: true },
  { id: 'sso', label: 'SSO / SAML', badge: 'v2', available: false },
  { id: 'compliance', label: 'Compliance', badge: 'v2', available: false },
];

// ---------------------------------------------------------------------------
// View-fixture audit log — references real seed user IDs only. Names
// resolve at render time via `useTeamMember(actorId)`. NO inline name
// strings. Replaces the locked source's placeholder names with canonical
// CLAUDE.md roster IDs.
// ---------------------------------------------------------------------------

type AuditEventKind =
  | 'invite_sent'
  | 'invite_accepted'
  | 'role_updated'
  | 'project_assigned'
  | 'login_success'
  | 'login_failed'
  | 'settings_changed'
  | 'export_run'
  | 'integration_connected';

interface AuditEntry {
  id: string;
  ts: string; // "2026-04-29 · 10:32:08"
  kind: AuditEventKind;
  actorId: string;
  targetId?: string;
  detailA?: string;
  detailB?: string;
  ip: string;
  hashPrefix: string;
}

const AUDIT_LOG: AuditEntry[] = [
  {
    id: 'evt-9001',
    ts: '2026-05-01 · 14:32:08',
    kind: 'integration_connected',
    actorId: SEED_IDS.users.yogesh,
    detailA: 'Atlassian OAuth · Iksula Returns',
    ip: '203.0.113.42',
    hashPrefix: '8a3f1b…',
  },
  {
    id: 'evt-9000',
    ts: '2026-05-01 · 13:21:55',
    kind: 'export_run',
    actorId: SEED_IDS.users.akshay,
    detailA: 'Audit log · CSV',
    detailB: 'Last 30 days',
    ip: '203.0.113.51',
    hashPrefix: '7e2c9d…',
  },
  {
    id: 'evt-8999',
    ts: '2026-05-01 · 12:08:14',
    kind: 'invite_sent',
    actorId: SEED_IDS.users.yogesh,
    targetId: SEED_IDS.users.akshay,
    detailA: 'QA Lead',
    ip: '203.0.113.42',
    hashPrefix: '6d4b8a…',
  },
  {
    id: 'evt-8998',
    ts: '2026-05-01 · 11:47:02',
    kind: 'login_success',
    actorId: SEED_IDS.users.kishor,
    detailA: 'OTP · iOS Safari',
    ip: '203.0.113.55',
    hashPrefix: '5c1f3e…',
  },
  {
    id: 'evt-8997',
    ts: '2026-05-01 · 10:33:41',
    kind: 'role_updated',
    actorId: SEED_IDS.users.yogesh,
    targetId: SEED_IDS.users.nitin,
    detailA: 'QA Engineer',
    detailB: 'QA Engineer (Senior QA)',
    ip: '203.0.113.42',
    hashPrefix: '4b9e2c…',
  },
  {
    id: 'evt-8996',
    ts: '2026-05-01 · 09:56:18',
    kind: 'login_failed',
    actorId: SEED_IDS.users.govind,
    detailA: 'Wrong password · 1/5',
    ip: '203.0.113.71',
    hashPrefix: '3a0d7f…',
  },
  {
    id: 'evt-8995',
    ts: '2026-05-01 · 09:14:50',
    kind: 'project_assigned',
    actorId: SEED_IDS.users.akshay,
    targetId: SEED_IDS.users.nadim,
    detailA: 'Iksula Commerce',
    ip: '203.0.113.51',
    hashPrefix: '29b6c5…',
  },
  {
    id: 'evt-8994',
    ts: '2026-04-30 · 18:42:09',
    kind: 'settings_changed',
    actorId: SEED_IDS.users.yogesh,
    detailA: 'Audit retention',
    detailB: '60 → 90 days',
    ip: '203.0.113.42',
    hashPrefix: '18a4d3…',
  },
  {
    id: 'evt-8993',
    ts: '2026-04-30 · 16:21:33',
    kind: 'invite_accepted',
    actorId: SEED_IDS.users.mohanraj,
    ip: '203.0.113.81',
    hashPrefix: '0f7b2e…',
  },
  {
    id: 'evt-8992',
    ts: '2026-04-30 · 15:08:27',
    kind: 'export_run',
    actorId: SEED_IDS.users.yogesh,
    detailA: 'Test cases · PDF',
    detailB: 'Iksula Returns',
    ip: '203.0.113.42',
    hashPrefix: 'eb5a91…',
  },
  {
    id: 'evt-8991',
    ts: '2026-04-30 · 14:47:11',
    kind: 'integration_connected',
    actorId: SEED_IDS.users.akshay,
    detailA: 'Cloudflare R2 · Storage',
    ip: '203.0.113.51',
    hashPrefix: 'd2c8e4…',
  },
  {
    id: 'evt-8990',
    ts: '2026-04-30 · 11:15:48',
    kind: 'login_success',
    actorId: SEED_IDS.users.sagar,
    detailA: 'OTP · Chrome desktop',
    ip: '203.0.113.92',
    hashPrefix: 'c1b7a3…',
  },
];

const TOTAL_EVENTS = 47234;
const CHAIN_INTEGRITY_PCT = '99.97%';
const AUDIT_RETENTION_DAYS = 90;
const EVIDENCE_RETENTION_DAYS = 365;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0];
  if (parts[1].endsWith('.')) return `${parts[0]} ${parts[1]}`;
  return `${parts[0]} ${parts[1][0]}.`;
}

function eventLabel(kind: AuditEventKind): string {
  switch (kind) {
    case 'invite_sent':
      return 'Invite sent';
    case 'invite_accepted':
      return 'Invite accepted';
    case 'role_updated':
      return 'Role updated';
    case 'project_assigned':
      return 'Project assigned';
    case 'login_success':
      return 'Login · success';
    case 'login_failed':
      return 'Login · failed';
    case 'settings_changed':
      return 'Settings changed';
    case 'export_run':
      return 'Export run';
    case 'integration_connected':
      return 'Integration connected';
  }
}

function eventTone(kind: AuditEventKind): 'pass' | 'primary' | 'secondary' | 'warn' | 'fail' {
  if (kind === 'login_failed') return 'fail';
  if (kind === 'role_updated' || kind === 'settings_changed') return 'warn';
  if (kind === 'invite_accepted') return 'pass';
  if (kind === 'integration_connected') return 'secondary';
  return 'primary';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SettingsAuditPage() {
  const me = useCurrentUser();
  const projects = useProjectList();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | AuditEventKind>('all');
  const [page, setPage] = useState(1);

  // Read URL hash on mount → drive default tab.
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
    const matched = TABS.find((t) => t.id === hash);
    const initial = matched && matched.available ? matched.id : 'general';
    setActiveTab(initial);
    console.info('pattern-a:deferred:settings-load', {
      workspaceId: me.workspaceId,
      activeTab: initial,
      eventCount: TOTAL_EVENTS,
      retentionDays: AUDIT_RETENTION_DAYS,
      chainIntegrityPct: CHAIN_INTEGRITY_PCT,
    });
  }, [me.workspaceId]);

  function handleTabChange(next: SettingsTab) {
    if (next === activeTab) return;
    console.info('pattern-a:deferred:settings-tab-change', { tab: next });
    setActiveTab(next);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${next}`);
    }
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setPage(1);
    console.info('pattern-a:deferred:audit-search-change', { query: q });
  }

  function handleFilterKindChange(value: 'all' | AuditEventKind) {
    setFilterKind(value);
    setPage(1);
    console.info('pattern-a:deferred:audit-filter-change', {
      kind: 'event-kind',
      value,
    });
  }

  function handleExport(format: 'csv' | 'pdf') {
    console.info('pattern-a:deferred:audit-export', { format, total: TOTAL_EVENTS });
  }

  function handleScheduleDigest() {
    console.info('pattern-a:deferred:audit-schedule-digest', {});
  }

  function handleVerifyHash(eventId: string) {
    console.info('pattern-a:deferred:audit-verify-hash', { eventId });
  }

  function handlePaginate(next: number) {
    setPage(next);
    console.info('pattern-a:deferred:audit-paginate', { page: next });
  }

  function handleRetentionAdjust() {
    console.info('pattern-a:deferred:audit-retention-adjust', {});
  }

  const filteredAudit = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AUDIT_LOG.filter((e) => {
      if (filterKind !== 'all' && e.kind !== filterKind) return false;
      if (!q) return true;
      return (
        e.ts.toLowerCase().includes(q) ||
        e.kind.toLowerCase().includes(q) ||
        e.detailA?.toLowerCase().includes(q) ||
        e.detailB?.toLowerCase().includes(q) ||
        e.hashPrefix.toLowerCase().includes(q) ||
        e.ip.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, filterKind]);

  return (
    <AdminShell active="settings-audit">
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <PageHeader />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <SettingsTabsNav activeTab={activeTab} onChange={handleTabChange} />
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {activeTab === 'audit-log' ? (
              <AuditLogPanel
                rows={filteredAudit}
                searchQuery={searchQuery}
                filterKind={filterKind}
                page={page}
                onSearchChange={handleSearchChange}
                onFilterKindChange={handleFilterKindChange}
                onExport={handleExport}
                onScheduleDigest={handleScheduleDigest}
                onVerifyHash={handleVerifyHash}
                onPaginate={handlePaginate}
                onRetentionAdjust={handleRetentionAdjust}
              />
            ) : (
              <PlaceholderPanel
                tab={activeTab}
                projectCount={projects.length}
                onRetentionAdjust={handleRetentionAdjust}
              />
            )}
          </div>
        </div>
      </main>
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------

function PageHeader() {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[22px] font-bold leading-[28px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[26px] sm:leading-[34px]">
          How is the workspace configured, and what&apos;s happened here?
        </h1>
        <p className="max-w-[680px] text-[13px] leading-[20px] text-[var(--text-secondary)] sm:text-[14px] sm:leading-[22px]">
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            {TOTAL_EVENTS.toLocaleString()}
          </span>{' '}
          events logged ·{' '}
          <span className="font-mono font-semibold text-[var(--pass)]">{CHAIN_INTEGRITY_PCT}</span>{' '}
          HMAC-verified · {AUDIT_RETENTION_DAYS} days retention.
        </p>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Tabs nav (left sidebar on lg+, top scroll on mobile)
// ---------------------------------------------------------------------------

function SettingsTabsNav({
  activeTab,
  onChange,
}: {
  activeTab: SettingsTab;
  onChange: (next: SettingsTab) => void;
}) {
  return (
    <nav
      aria-label="Settings sections"
      className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 lg:mx-0 lg:w-56 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0"
    >
      <span className="hidden px-3 pb-2 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)] lg:block">
        Workspace
      </span>
      {TABS.map((t) => (
        <TabButton
          key={t.id}
          tab={t}
          active={t.id === activeTab}
          onClick={() => t.available && onChange(t.id)}
        />
      ))}
    </nav>
  );
}

function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: TabDef;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!tab.available}
      aria-current={active ? 'page' : undefined}
      className={[
        'relative inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:justify-between lg:px-3 lg:py-2 lg:text-[13px]',
        active
          ? 'bg-[var(--raised)] font-medium text-[var(--text-primary)]'
          : tab.available
            ? 'text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]'
            : 'cursor-not-allowed text-[var(--text-disabled)]',
      ].join(' ')}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 hidden h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--primary)] lg:block"
        />
      )}
      <span className="truncate">{tab.label}</span>
      {tab.count && (
        <span className="font-mono text-[10px] font-medium text-[var(--text-tertiary)]">
          {tab.count}
        </span>
      )}
      {tab.badge && (
        <span
          className={[
            'rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em]',
            tab.available
              ? 'border-[var(--secondary)]/30 bg-[var(--secondary)]/15 text-[var(--secondary)]'
              : 'border-[var(--border-subtle)] bg-[var(--overlay)] text-[var(--text-tertiary)]',
          ].join(' ')}
        >
          {tab.badge}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Placeholder panel for non-audit tabs
// ---------------------------------------------------------------------------

function PlaceholderPanel({
  tab,
  projectCount,
  onRetentionAdjust,
}: {
  tab: SettingsTab;
  projectCount: number;
  onRetentionAdjust: () => void;
}) {
  const titleMap: Record<Exclude<SettingsTab, 'audit-log'>, string> = {
    general: 'General workspace settings',
    branding: 'Workspace branding',
    retention: 'Data retention policy',
    integrations: 'Integrations health',
    billing: 'Billing & subscription',
    sso: 'Single sign-on (SAML)',
    compliance: 'Compliance reports',
  };
  const subMap: Record<Exclude<SettingsTab, 'audit-log'>, string> = {
    general: 'Workspace name, default timezone, sprint cadence.',
    branding: 'Logo, primary colour, email-template branding.',
    retention: `Audit log retention currently ${AUDIT_RETENTION_DAYS} days · evidence retention ${EVIDENCE_RETENTION_DAYS} days. Configurable up to 2 years for Admins.`,
    integrations: `${projectCount} projects connected · ${projectCount} Jira workspaces healthy · 1 Cloudflare R2 bucket online.`,
    billing: 'PM1 free pilot · cost gate $0 / month. Card on file lands when R2 quota hits 80%.',
    sso: 'Available v2 — SAML, OIDC, SCIM provisioning.',
    compliance: 'Available v2 — SOC 2 Type II + ISO 27001 + EU AI Act readiness packs.',
  };
  if (tab === 'audit-log') return null;
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-5 sm:p-6">
      <header className="flex flex-col gap-1.5">
        <h2 className="font-display text-[16px] font-bold text-[var(--text-primary)] sm:text-[18px]">
          {titleMap[tab]}
        </h2>
        <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)] sm:text-[13px]">
          {subMap[tab]}
        </p>
      </header>
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-6 text-center">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Pattern A — wiring deferred
        </span>
        <p className="text-[12.5px] text-[var(--text-secondary)]">
          UI scaffold only. Real settings persistence lands MS0-T030.5+ after BE M1 schema merges.
        </p>
        {tab === 'retention' && (
          <button
            type="button"
            onClick={onRetentionAdjust}
            className="mx-auto mt-1 inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border-subtle)] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            Adjust retention →
          </button>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Audit log panel
// ---------------------------------------------------------------------------

interface AuditLogPanelProps {
  rows: AuditEntry[];
  searchQuery: string;
  filterKind: 'all' | AuditEventKind;
  page: number;
  onSearchChange: (q: string) => void;
  onFilterKindChange: (v: 'all' | AuditEventKind) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  onScheduleDigest: () => void;
  onVerifyHash: (eventId: string) => void;
  onPaginate: (page: number) => void;
  onRetentionAdjust: () => void;
}

function AuditLogPanel({
  rows,
  searchQuery,
  filterKind,
  page,
  onSearchChange,
  onFilterKindChange,
  onExport,
  onScheduleDigest,
  onVerifyHash,
  onPaginate,
  onRetentionAdjust,
}: AuditLogPanelProps) {
  return (
    <section id="audit-log" aria-labelledby="audit-head" className="flex flex-col gap-5">
      <AuditHeader
        searchQuery={searchQuery}
        filterKind={filterKind}
        onSearchChange={onSearchChange}
        onFilterKindChange={onFilterKindChange}
        onExport={onExport}
        onScheduleDigest={onScheduleDigest}
      />
      <AuditIntegrityCards onRetentionAdjust={onRetentionAdjust} />
      <AuditTable rows={rows} onVerifyHash={onVerifyHash} />
      <AuditFooter page={page} pageSize={50} total={TOTAL_EVENTS} onPaginate={onPaginate} />
    </section>
  );
}

function AuditHeader({
  searchQuery,
  filterKind,
  onSearchChange,
  onFilterKindChange,
  onExport,
  onScheduleDigest,
}: {
  searchQuery: string;
  filterKind: 'all' | AuditEventKind;
  onSearchChange: (q: string) => void;
  onFilterKindChange: (v: 'all' | AuditEventKind) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  onScheduleDigest: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2
            id="audit-head"
            className="font-display text-[16px] font-bold text-[var(--text-primary)] sm:text-[18px]"
          >
            Audit log
          </h2>
          <p className="text-[12px] leading-[18px] text-[var(--text-secondary)]">
            Immutable append-only · HMAC-SHA256 signed · every action verifiable.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onScheduleDigest}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect
                x="2"
                y="3"
                width="12"
                height="10"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path d="M2 6h12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            Schedule weekly digest
          </button>
          <button
            type="button"
            onClick={() => onExport('csv')}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => onExport('pdf')}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            Export PDF
          </button>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 sm:max-w-[320px]">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            className="text-[var(--text-tertiary)]"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by actor, kind, hash, IP…"
            aria-label="Search audit log"
            className="w-full bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />
        </label>
        <KindFilterChip current={filterKind} onChange={onFilterKindChange} />
      </div>
    </div>
  );
}

function KindFilterChip({
  current,
  onChange,
}: {
  current: 'all' | AuditEventKind;
  onChange: (v: 'all' | AuditEventKind) => void;
}) {
  const options: Array<{ value: 'all' | AuditEventKind; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'invite_sent', label: 'Invites' },
    { value: 'role_updated', label: 'Role changes' },
    { value: 'project_assigned', label: 'Project assigns' },
    { value: 'login_success', label: 'Logins' },
    { value: 'login_failed', label: 'Failed logins' },
    { value: 'settings_changed', label: 'Settings' },
    { value: 'export_run', label: 'Exports' },
    { value: 'integration_connected', label: 'Integrations' },
  ];
  const idx = options.findIndex((o) => o.value === current);
  function cycle() {
    const next = options[(idx + 1) % options.length];
    onChange(next.value);
  }
  const display = options[idx]?.label ?? 'All';
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="Cycle event-kind filter"
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--overlay)] px-3 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
    >
      <span className="font-medium text-[var(--text-tertiary)]">Kind:</span>
      <span>{display}</span>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function AuditIntegrityCards({ onRetentionAdjust }: { onRetentionAdjust: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <IntegrityCard
        toneClass="border-[var(--pass)]/30 bg-[var(--pass)]/[0.06]"
        title="Chain integrity"
        value="✓ 99.97%"
        valueTone="pass"
        meta="HMAC-SHA256 chain · click any row to verify"
      />
      <IntegrityCard
        toneClass="border-[var(--border-subtle)] bg-[var(--base)]"
        title="Audit retention · PM1"
        value={`${AUDIT_RETENTION_DAYS} days`}
        valueTone="primary"
        meta="Configurable up to 2 years (Admin)"
        action={{ label: 'Adjust →', onClick: onRetentionAdjust }}
      />
      <IntegrityCard
        toneClass="border-[var(--border-subtle)] bg-[var(--base)]"
        title="Evidence retention"
        value={`${EVIDENCE_RETENTION_DAYS} days`}
        valueTone="primary"
        meta="Screenshots · HAR · console logs in Cloudflare R2"
      />
      <IntegrityCard
        toneClass="border-[var(--secondary)]/30 bg-[var(--secondary)]/[0.06]"
        title="PM3+ compliance"
        value="7 years"
        valueTone="secondary"
        meta="EU AI Act · SOC 2 · ISO 27001 (locked)"
      />
    </div>
  );
}

function IntegrityCard({
  toneClass,
  title,
  value,
  valueTone,
  meta,
  action,
}: {
  toneClass: string;
  title: string;
  value: string;
  valueTone: 'pass' | 'primary' | 'secondary';
  meta: string;
  action?: { label: string; onClick: () => void };
}) {
  const valueColor = {
    pass: 'text-[var(--pass)]',
    primary: 'text-[var(--text-primary)]',
    secondary: 'text-[var(--secondary)]',
  }[valueTone];
  return (
    <article className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3.5 ${toneClass}`}>
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        {title}
      </span>
      <span className={`font-display text-[18px] font-bold leading-[24px] ${valueColor}`}>
        {value}
      </span>
      <p className="text-[11px] leading-[15px] text-[var(--text-tertiary)]">{meta}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 w-fit text-[11.5px] font-medium text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          {action.label}
        </button>
      )}
    </article>
  );
}

function AuditTable({
  rows,
  onVerifyHash,
}: {
  rows: AuditEntry[];
  onVerifyHash: (eventId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--raised)] px-6 py-10 text-center">
        <span className="font-display text-[14px] font-bold text-[var(--text-primary)]">
          No matching events
        </span>
        <span className="text-[12px] text-[var(--text-tertiary)]">
          Adjust your search or filters.
        </span>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--base)]">
      <ColumnHeaders />
      <ul className="flex flex-col">
        {rows.map((r) => (
          <AuditRow key={r.id} entry={r} onVerifyHash={() => onVerifyHash(r.id)} />
        ))}
      </ul>
    </div>
  );
}

function ColumnHeaders() {
  return (
    <div className="hidden grid-cols-[160px_140px_minmax(0,1fr)_minmax(0,1fr)_120px_100px] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--raised)] px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)] lg:grid">
      <span>Timestamp</span>
      <span>Kind</span>
      <span>Actor</span>
      <span>Detail</span>
      <span>IP / Hash</span>
      <span className="text-right">Verify</span>
    </div>
  );
}

function AuditRow({ entry, onVerifyHash }: { entry: AuditEntry; onVerifyHash: () => void }) {
  const actor = useTeamMember(entry.actorId);
  const target = useTeamMember(entry.targetId ?? null);
  const actorShort = actor ? shortName(actor.displayName) : '—';
  const targetShort = target ? shortName(target.displayName) : '';
  const tone = eventTone(entry.kind);
  const toneClass = {
    pass: 'border-[var(--pass)]/30 bg-[var(--pass)]/15 text-[var(--pass)]',
    primary: 'border-[var(--primary)]/30 bg-[var(--primary)]/15 text-[var(--primary)]',
    secondary: 'border-[var(--secondary)]/30 bg-[var(--secondary)]/15 text-[var(--secondary)]',
    warn: 'border-[var(--warn)]/30 bg-[var(--warn)]/15 text-[var(--warn)]',
    fail: 'border-[var(--fail)]/30 bg-[var(--fail)]/15 text-[var(--fail)]',
  }[tone];

  return (
    <li className="grid grid-cols-1 gap-2 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 lg:grid-cols-[160px_140px_minmax(0,1fr)_minmax(0,1fr)_120px_100px] lg:items-center lg:gap-3 lg:px-5 lg:py-3">
      <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{entry.ts}</span>
      <span
        className={`inline-flex h-6 w-fit items-center rounded border px-2 font-mono text-[10px] font-semibold ${toneClass}`}
      >
        {eventLabel(entry.kind)}
      </span>
      <span className="text-[12.5px] text-[var(--text-secondary)]">
        <span className="font-medium text-[var(--text-primary)]">{actorShort}</span>
        {targetShort && (
          <>
            {' '}
            <span className="text-[var(--text-tertiary)]">→</span>{' '}
            <span className="font-medium text-[var(--secondary)]">{targetShort}</span>
          </>
        )}
      </span>
      <span className="text-[12px] text-[var(--text-secondary)]">
        {entry.detailA}
        {entry.detailB && (
          <>
            {' '}
            <span className="text-[var(--text-tertiary)]">·</span>{' '}
            <span className="text-[var(--text-tertiary)]">{entry.detailB}</span>
          </>
        )}
      </span>
      <span className="flex flex-col gap-0.5 font-mono text-[10.5px] text-[var(--text-tertiary)]">
        <span>{entry.ip}</span>
        <span>{entry.hashPrefix}</span>
      </span>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onVerifyHash}
          aria-label={`Verify hash for event ${entry.id}`}
          className="hover:border-[var(--pass)]/30 hover:bg-[var(--pass)]/10 inline-flex h-7 items-center rounded-md border border-[var(--border-subtle)] px-2.5 text-[11px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--pass)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          ✓ verify
        </button>
      </div>
    </li>
  );
}

function AuditFooter({
  page,
  pageSize,
  total,
  onPaginate,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPaginate: (next: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, total);
  const lastPage = Math.ceil(total / pageSize);
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-1 pt-3">
      <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
        Showing{' '}
        <span className="font-semibold text-[var(--text-secondary)]">
          {start.toLocaleString()}–{end.toLocaleString()}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-[var(--text-secondary)]">{total.toLocaleString()}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <PageButton onClick={() => onPaginate(Math.max(1, page - 1))} disabled={page === 1}>
          ← Prev
        </PageButton>
        <span className="px-2 font-mono text-[11px] text-[var(--text-tertiary)]">
          page {page} of {lastPage.toLocaleString()}
        </span>
        <PageButton
          onClick={() => onPaginate(Math.min(lastPage, page + 1))}
          disabled={page >= lastPage}
        >
          Next →
        </PageButton>
      </div>
    </footer>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 items-center rounded-md border border-[var(--border-subtle)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--border-subtle)] disabled:hover:text-[var(--text-secondary)]"
    >
      {children}
    </button>
  );
}
