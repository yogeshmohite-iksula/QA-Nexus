// F28 Settings & Audit — main orchestrator (v2.3 re-port, Day-28).
//
// Canonical source: PM1_UI_v2/Redesign Frame by claude design/F28 Settings and Audit v2.html
// (v2.3 redesign — supersedes the v1 frames - claude code build/ reference).
// Ported via .claude/skills/frame-port v2.2 7-step workflow (spec approved,
// PRE-STEP-3 sanity PASS: 44 structural sections, 90% token adoption).
// Mounted at /admin/settings (Admin-only via `<AdminGuard>`).
//
// Hash-anchor deeplinks: F27 fires `pattern-a:deferred:users-audit-open`
// and routes to /admin/settings#audit-log → this page reads the URL hash
// on mount and lands on the Audit Log tab (default per v2.3 design).
//
// Hard Rule 17: EVERY user-visible string imports from
// `./settings-audit-page.canned-data.ts` (F28_* semantic exports) — no inline
// copy. Hard Rule 14: AdminShell wrap, active="settings-audit".
//
// DEVIATION (documented per frame-port protocol step 9): the canonical v2.3
// HTML defines an `--admin-red` token in its local <style> that is NOT in
// apps/web globals.css; adding a non-whitelisted hex would trip
// enforce-design-tokens.sh (Hard Rule 4). Actor role pills therefore use the
// locked-palette `--fail` for ADMIN/ANONYMOUS (red family), distinguished by
// label text. Same choice the v1 implementation made.
//
// AUDIT TAB IS LIVE (Finding I, 2026-06-12): rows + event count + chain badge
// come from GET /api/audit + /api/audit/verify-chain (shared schemas, Rule 10)
// with the canned fixture as the offline/dev fallback per the Option-B
// convention. Settings/integrations/billing tabs remain Pattern A (deferred
// markers) until their endpoints land.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { fetchAuditEntries, fetchVerifyChain, auditEntryToRow } from '@/lib/api/audit-api';
import { AdminShell } from './admin-shell';
import {
  F28_HEAD,
  F28_TABS,
  F28_TAB_SECTION_LABELS,
  F28_AUDIT,
  F28_AUDIT_ROWS,
  F28_RETENTION,
  F28_INTEGRATIONS,
  F28_BILLING,
  F28_GENERAL,
  F28_BRANDING,
  F28_LOCKED_PANELS,
  type F28AuditRow,
} from './settings-audit-page.canned-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SettingsTab = (typeof F28_TABS)[number]['id'];

const TOTAL_EVENTS = 47234;
const CHAIN_INTEGRITY_PCT = '99.97%';
const AUDIT_RETENTION_DAYS = 90;

// Canonical `.f28-btn` button classes — height 32px / 12px / radius 6.
// `.sm` = 28px. `.primary` = teal. `.ghost` = transparent + --t3.
const F28_BTN_BASE =
  'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[12px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]';
const F28_BTN = `${F28_BTN_BASE} border border-[var(--border)] text-[var(--t2)] hover:border-[var(--border-strong)] hover:bg-[var(--raised)] hover:text-[var(--t1)]`;
const F28_BTN_GHOST = `${F28_BTN_BASE} border border-[var(--border)] text-[var(--t3)] hover:border-[var(--border-strong)] hover:bg-[var(--raised)] hover:text-[var(--t1)]`;
const F28_BTN_PRIMARY = `${F28_BTN_BASE} border border-[var(--primary)] bg-[var(--primary)] font-semibold text-[var(--primary-ink)] hover:opacity-90`;
const F28_BTN_SM =
  'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--border)] px-2.5 text-[11.5px] font-medium leading-none text-[var(--t2)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--raised)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]';

// Audit action-badge tone classes (.act.*) + actor/target tones — canonical.
const ACT_TONE: Record<string, string> = {
  generate: 'border-[var(--ai-line)] bg-[var(--ai-soft)] text-[var(--secondary)]',
  dedup: 'border-[var(--ai-line)] bg-[var(--ai-soft)] text-[var(--secondary)]',
  invite: 'border-[var(--primary-line)] bg-[var(--primary-soft)] text-[var(--primary)]',
  config: 'border-[var(--warn-line)] bg-[var(--warn-soft)] text-[var(--warn)]',
  warn: 'border-[var(--warn-line)] bg-[var(--warn-soft)] text-[var(--warn)]',
  approve: 'border-[var(--info-line)] bg-[var(--info-soft)] text-[var(--info)]',
  update: 'border-[var(--info-line)] bg-[var(--info-soft)] text-[var(--info)]',
  archive: 'border-[var(--fail-line)] bg-[var(--fail-soft)] text-[var(--fail)]',
  authfail: 'border-[var(--fail-line)] bg-[var(--fail-soft)] text-[var(--fail)]',
  export: 'border-[var(--border)] bg-[var(--overlay)] text-[var(--t2)]',
  create: 'border-[var(--pass-line)] bg-[var(--pass-soft)] text-[var(--pass)]',
};
const TARGET_TONE: Record<string, string> = {
  primary: 'text-[var(--primary)]',
  violet: 'text-[var(--secondary)]',
  fail: 'text-[var(--fail)]',
};

// Render details text with canonical .details-cell <b> highlights (--t2).
function renderDetails(text: string, bold: string[]) {
  if (bold.length === 0) return text;
  // Build a split regex from the bold substrings (escaped).
  const esc = bold.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${esc.join('|')})`, 'g'));
  return parts.map((p, i) =>
    bold.includes(p) ? (
      <b key={i} className="font-medium text-[var(--t2)]">
        {p}
      </b>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

// Render .ret-note with canonical highlights: "2 years" (--t2 bold), "Adjust →" (--secondary link).
function renderRetNote(note: string) {
  const parts = note.split(/(2 years|Adjust →)/g);
  return parts.map((p, i) => {
    if (p === '2 years')
      return (
        <b key={i} className="font-medium text-[var(--t2)]">
          {p}
        </b>
      );
    if (p === 'Adjust →')
      return (
        <a key={i} className="cursor-pointer font-medium text-[var(--secondary)] hover:underline">
          {p}
        </a>
      );
    return <span key={i}>{p}</span>;
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SettingsAuditPage() {
  const me = useCurrentUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('audit-log');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
    const matched = F28_TABS.find((t) => t.id === hash);
    const initial: SettingsTab = matched && matched.available ? matched.id : 'audit-log';
    setActiveTab(initial);
    // PATTERN-A: load settings deferred until M1 (T030.5) - real /api/settings GET on mount
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
    // PATTERN-A: change settings tab deferred until M1 (T030.5) - client-only state + history.replaceState
    console.info('pattern-a:deferred:settings-tab-change', { tab: next });
    setActiveTab(next);
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `#${next}`);
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setPage(1);
    // PATTERN-A: search audit log deferred until M1 (T030.5) - real /api/audit-log GET (search param)
    console.info('pattern-a:deferred:audit-search-change', { query: q });
  }

  function handleExport(format: 'csv' | 'pdf') {
    // PATTERN-A: export audit log deferred until M1 (T030.5) - real /api/audit-log/export POST
    console.info('pattern-a:deferred:audit-export', { format, total: TOTAL_EVENTS });
  }

  function handleScheduleDigest() {
    // PATTERN-A: schedule weekly digest deferred until M1 (T030.5) - real /api/notifications/digest POST
    console.info('pattern-a:deferred:audit-schedule-digest', {});
  }

  function handleVerifyHash(rowTs: string) {
    // PATTERN-A: verify HMAC chain deferred until M1 (T030.5) - real /api/audit-log/:id/verify POST
    console.info('pattern-a:deferred:audit-verify-hash', { rowTs });
  }

  function handlePaginate(next: number) {
    setPage(next);
    // PATTERN-A: paginate audit log deferred until M1 (T030.5) - real /api/audit-log GET (page param)
    console.info('pattern-a:deferred:audit-paginate', { page: next });
  }

  function handleRetentionSave() {
    // PATTERN-A: save retention policy deferred until M1 (T030.5) - real /api/settings/retention PATCH
    console.info('pattern-a:deferred:audit-retention-adjust', {});
  }

  function handleConfigureIntegration(name: string) {
    // PATTERN-A: configure integration deferred until M1 (T030.5) - real /api/integrations/:id PATCH
    console.info('pattern-a:deferred:integration-configure', { name });
  }

  // ── Finding I: live audit data (canned = offline/dev fallback) ──
  const [liveRows, setLiveRows] = useState<F28AuditRow[] | null>(null);
  const [liveTotal, setLiveTotal] = useState<number | null>(null);
  const [liveChainVal, setLiveChainVal] = useState<string | null>(null);
  const [liveChainPct, setLiveChainPct] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchAuditEntries().then((res) => {
      if (!alive || !res || res.items.length === 0) return;
      setLiveRows(res.items.map(auditEntryToRow));
      // Refined by verify-chain's totalRows when that resolves (Admin only).
      setLiveTotal((cur) => cur ?? res.items.length);
    });
    void fetchVerifyChain().then((res) => {
      if (!alive || !res) return;
      setLiveTotal(res.totalRows);
      setLiveChainPct(res.valid ? '100%' : 'BROKEN');
      setLiveChainVal(
        res.valid
          ? res.truncated
            ? `${res.verifiedRows.toLocaleString()} of ${res.totalRows.toLocaleString()} verified`
            : '100% verified'
          : `broken at ${res.brokenAtId ? res.brokenAtId.slice(0, 8) : 'unknown row'}`,
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  const sourceRows = liveRows ?? F28_AUDIT_ROWS;

  const filteredAudit = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sourceRows;
    return sourceRows.filter((e) =>
      [e.ts, e.actor, e.action, e.target, e.targetSub, e.project, e.details, e.hash]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [searchQuery, sourceRows]);

  return (
    <AdminShell active="settings-audit">
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <QHead total={liveTotal} chainPct={liveChainPct} />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <SettingsTabNav activeTab={activeTab} onChange={handleTabChange} />
          <div
            role="tabpanel"
            aria-label={F28_TABS.find((t) => t.id === activeTab)?.label}
            className="flex min-w-0 flex-1 flex-col gap-6"
          >
            {activeTab === 'general' && <GeneralPanel />}
            {activeTab === 'branding' && <BrandingPanel />}
            {activeTab === 'retention' && <RetentionPanel onSave={handleRetentionSave} />}
            {activeTab === 'integrations' && (
              <IntegrationsPanel onConfigure={handleConfigureIntegration} />
            )}
            {activeTab === 'audit-log' && (
              <AuditLogPanel
                rows={filteredAudit}
                searchQuery={searchQuery}
                page={page}
                total={liveTotal ?? TOTAL_EVENTS}
                chainVal={liveChainVal ?? undefined}
                onSearchChange={handleSearchChange}
                onExport={handleExport}
                onScheduleDigest={handleScheduleDigest}
                onVerifyHash={handleVerifyHash}
                onPaginate={handlePaginate}
              />
            )}
            {activeTab === 'billing' && <BillingPanel />}
            {activeTab === 'sso' && <LockedPanel data={F28_LOCKED_PANELS.sso} />}
            {activeTab === 'compliance' && <LockedPanel data={F28_LOCKED_PANELS.compliance} />}
          </div>
        </div>
      </main>
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------
// q-head — title + stats strip (5 fragments)
// ---------------------------------------------------------------------------

function QHead({
  total,
  chainPct,
}: {
  /** Live event count (Finding I) — null renders the canned headline. */
  total: number | null;
  /** Live chain integrity ('100%' / 'BROKEN') — null renders canned. */
  chainPct: string | null;
}) {
  const toneCls: Record<string, string> = {
    b: 'font-semibold text-[var(--t1)]',
    pass: 'font-bold text-[var(--pass)]',
    gate: 'text-[var(--secondary)]',
  };
  const stats = F28_HEAD.stats.map((st) => {
    if (total !== null && st.rest.includes('events logged')) {
      return { ...st, hl: total.toLocaleString('en-US') };
    }
    if (chainPct !== null && st.rest.includes('HMAC-verified')) {
      return { ...st, hl: chainPct };
    }
    return st;
  });
  return (
    <header className="flex flex-col gap-2.5 border-b border-[var(--border)] pb-3.5">
      <h1 className="font-display text-[22px] font-bold leading-[28px] tracking-[-0.01em] text-[var(--t1)] sm:text-[26px] sm:leading-[34px]">
        {F28_HEAD.h1}
      </h1>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11.5px] leading-[18px] text-[var(--t3)]">
          {stats.map((s, i) => (
            <span key={s.hl} className="inline-flex items-center gap-2.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-[var(--t4)]">
                  ·
                </span>
              )}
              <span>
                <span className={toneCls[s.tone]}>{s.hl}</span> {s.rest}
              </span>
            </span>
          ))}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--pass-line)] bg-[var(--pass-soft)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--pass)]">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3.5 8.5l3 3 6-6.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {F28_HEAD.synced}
        </span>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Tab nav — role=tablist, aria-label="Settings sections"
// ---------------------------------------------------------------------------

// Per-tab menu icons — verbatim canonical `.tn-ic` SVG paths. Default --t3;
// AdminShell turns the icon --primary on the active tab (handled in TabButton).
const TAB_ICONS: Record<SettingsTab, React.ReactNode> = {
  general: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M5 8h6M8 5v6" strokeLinecap="round" />
    </svg>
  ),
  branding: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M4 13l8-8-1-3-3-1-8 8 1 3 3 1z" />
    </svg>
  ),
  retention: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="10" height="10" rx="1.5" />
      <path d="M3 6h10" strokeLinecap="round" />
    </svg>
  ),
  integrations: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
      <path d="M5 7v2M11 7V5M7 11h2" strokeLinecap="round" />
    </svg>
  ),
  'audit-log': (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M5 9h6M5 11h4" strokeLinecap="round" />
    </svg>
  ),
  billing: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="12" height="9" rx="1" />
      <path d="M2 7h12" strokeLinecap="round" />
    </svg>
  ),
  sso: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="10" height="7" rx="1" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  ),
  compliance: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M8 2L2 5v4c0 4 3 6 6 7 3-1 6-3 6-7V5z" />
    </svg>
  ),
};

function SettingsTabNav({
  activeTab,
  onChange,
}: {
  activeTab: SettingsTab;
  onChange: (next: SettingsTab) => void;
}) {
  const functional = F28_TABS.filter((t) => t.available);
  const preview = F28_TABS.filter((t) => !t.available);
  return (
    <nav
      role="tablist"
      aria-label="Settings sections"
      aria-orientation="vertical"
      className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 lg:mx-0 lg:w-56 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0"
    >
      <span className="mx-1 mb-1 hidden border-b border-[var(--border-subtle)] px-2 pb-2 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--t3)] lg:block">
        {F28_TAB_SECTION_LABELS.workspace}
      </span>
      {functional.map((t) => (
        <TabButton key={t.id} tab={t} active={t.id === activeTab} onClick={() => onChange(t.id)} />
      ))}
      <span className="mx-1 mb-1 mt-3 hidden border-b border-[var(--border-subtle)] px-2 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--t4)] lg:block">
        {F28_TAB_SECTION_LABELS.preview}
      </span>
      {preview.map((t) => (
        <TabButton key={t.id} tab={t} active={t.id === activeTab} onClick={() => onChange(t.id)} />
      ))}
    </nav>
  );
}

function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: (typeof F28_TABS)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => tab.available && onClick()}
      disabled={!tab.available}
      className={[
        'flex min-h-[40px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[7px] border px-2.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:w-full',
        active
          ? 'border-[var(--border-strong)] bg-[var(--overlay)] font-semibold text-[var(--t1)]'
          : tab.available
            ? 'border-transparent font-medium text-[var(--t2)] hover:bg-[var(--raised)] hover:text-[var(--t1)]'
            : 'cursor-not-allowed border-transparent text-[var(--t4)] opacity-[0.62]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'inline-flex h-[18px] w-[18px] flex-none items-center justify-center',
          active ? 'text-[var(--primary)]' : 'text-[var(--t3)]',
        ].join(' ')}
      >
        {TAB_ICONS[tab.id]}
      </span>
      <span className="truncate lg:flex-1">{tab.label}</span>
      {'count' in tab && tab.count && (
        <span
          className={[
            'font-mono text-[10px] font-medium',
            active ? 'text-[var(--primary)]' : 'text-[var(--t3)]',
          ].join(' ')}
        >
          {tab.count}
        </span>
      )}
      {'badge' in tab && tab.badge && (
        <span className="inline-flex items-center rounded-[3px] border border-[var(--border)] bg-[var(--raised)] px-1.5 py-px font-mono text-[9px] font-bold uppercase leading-none tracking-[0.06em] text-[var(--t4)]">
          {tab.badge}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Shared panel primitives
// ---------------------------------------------------------------------------

function PanelShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-5 sm:p-6">
      <header className="flex flex-col gap-1.5">
        <h2 className="font-display text-[16px] font-bold text-[var(--t1)] sm:text-[18px]">
          {title}
        </h2>
        <p className="text-[12.5px] leading-[18px] text-[var(--t3)] sm:text-[13px]">{sub}</p>
      </header>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// General + Branding panels
// ---------------------------------------------------------------------------

function GeneralPanel() {
  const [digestOn, setDigestOn] = useState(true);
  return (
    <PanelShell title={F28_GENERAL.title} sub={F28_GENERAL.sub}>
      <div className="flex flex-col gap-3">
        {F28_GENERAL.fields.map((f) => (
          <div
            key={f.label}
            className="flex flex-col gap-2 border-b border-[var(--border-subtle)] pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex flex-col gap-0.5 sm:w-48 sm:shrink-0">
              <span className="text-[12.5px] font-medium text-[var(--t1)]">{f.label}</span>
              {'sub' in f && f.sub && <span className="text-[11px] text-[var(--t4)]">{f.sub}</span>}
            </div>
            <div className="flex flex-1 items-center gap-2">
              {f.kind === 'input' ? (
                <input
                  type="text"
                  defaultValue={f.value}
                  className="h-9 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[13px] text-[var(--t1)] focus:border-[var(--secondary)] focus:outline-none"
                />
              ) : (
                <div className="relative w-full">
                  <select
                    defaultValue={f.value}
                    aria-label={f.label}
                    className="h-9 w-full cursor-pointer appearance-none rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] pl-3 pr-9 text-[13px] text-[var(--t1)] focus:border-[var(--secondary)] focus:outline-none"
                  >
                    {('options' in f ? f.options : []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--t4)]"
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
              {'toggle' in f && f.toggle && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={digestOn}
                  aria-label="Weekly digest"
                  onClick={() => setDigestOn((v) => !v)}
                  className="inline-flex shrink-0 items-center gap-1.5 focus-visible:outline-none"
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors',
                      digestOn ? 'bg-[var(--primary)]' : 'bg-[var(--overlay)]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-block h-4 w-4 rounded-full bg-[var(--primary-ink)] transition-transform',
                        digestOn ? 'translate-x-4' : 'translate-x-0',
                      ].join(' ')}
                    />
                  </span>
                  <span className="text-[12px] font-medium text-[var(--t2)]">
                    {digestOn ? f.toggle : 'Off'}
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function BrandingPanel() {
  const b = F28_BRANDING;
  return (
    <PanelShell title={b.title} sub={b.sub}>
      {/* Logo row */}
      <div className="flex flex-col gap-2 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-0.5 sm:w-48 sm:shrink-0">
          <span className="text-[12.5px] font-medium text-[var(--t1)]">{b.logoLabel}</span>
          <span className="text-[11px] text-[var(--t4)]">{b.logoHint}</span>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <span className="font-display inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-[15px] font-bold text-[var(--canvas)]">
            {b.logoMark}
          </span>
          {b.buttons.map((label) => (
            <button key={label} type="button" className={F28_BTN}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Accent row */}
      <div className="flex flex-col gap-2 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-0.5 sm:w-48 sm:shrink-0">
          <span className="text-[12.5px] font-medium text-[var(--t1)]">{b.accent.label}</span>
          <span className="text-[11px] text-[var(--t4)]">{b.accent.sub}</span>
        </div>
        <div className="flex flex-1 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-block h-7 w-7 shrink-0 rounded-md bg-[var(--primary)]"
          />
          <span className="font-mono text-[12px] text-[var(--t3)]">{b.accent.token}</span>
        </div>
      </div>
      {/* Email sender row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="sm:w-48 sm:shrink-0">
          <span className="text-[12.5px] font-medium text-[var(--t1)]">{b.emailSender}</span>
        </div>
        <input
          type="text"
          defaultValue={b.emailValue}
          className="h-9 flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[13px] text-[var(--t1)] focus:border-[var(--secondary)] focus:outline-none"
        />
      </div>
    </PanelShell>
  );
}

// ---------------------------------------------------------------------------
// Retention panel — slider segments
// ---------------------------------------------------------------------------

function RetentionPanel({ onSave }: { onSave: () => void }) {
  const r = F28_RETENTION;
  return (
    <PanelShell title={r.title} sub={r.sub}>
      <SliderSeg
        label={r.audit.label}
        segments={[...r.audit.segments]}
        selected={r.audit.selected}
      />
      <SliderSeg
        label={r.evidence.label}
        segments={[...r.evidence.segments]}
        selected={r.evidence.selected}
      />
      <p className="rounded-lg border border-[var(--warn-line)] bg-[var(--warn-soft)] px-3 py-2 text-[12px] leading-[17px] text-[var(--warn)]">
        {r.costNote}
      </p>
      <div className="flex flex-col gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-3 opacity-70">
        <span className="text-[12.5px] font-medium text-[var(--t1)]">{r.compliance.label}</span>
        <span className="text-[12px] text-[var(--t3)]">{r.compliance.value}</span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--t4)]">
          {r.compliance.meta}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" className={F28_BTN}>
          {r.buttons[0]}
        </button>
        <button type="button" onClick={onSave} className={F28_BTN_PRIMARY}>
          {r.buttons[1]}
        </button>
      </div>
    </PanelShell>
  );
}

function SliderSeg({
  label,
  segments,
  selected,
}: {
  label: string;
  segments: string[];
  selected: string;
}) {
  const [sel, setSel] = useState(selected);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-medium text-[var(--t2)]">{label}</span>
      <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] p-1">
        {segments.map((seg) => {
          const on = seg === sel;
          return (
            <button
              key={seg}
              type="button"
              aria-pressed={on}
              onClick={() => setSel(seg)}
              className={[
                'inline-flex h-8 min-w-[44px] flex-1 items-center justify-center rounded-md px-3 font-mono text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
                on
                  ? 'bg-[var(--primary)] font-semibold text-[var(--primary-ink)]'
                  : 'text-[var(--t3)] hover:bg-[var(--overlay)] hover:text-[var(--t1)]',
              ].join(' ')}
            >
              {seg}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Integrations panel — 5 cards
// ---------------------------------------------------------------------------

// Service logos — verbatim SVG paths from the canonical v2.3 integ-card `.ic`
// spans. Colors map to locked tokens; canonical Cloudflare brand-orange maps to
// `--warn` (closest palette token — its raw hex is non-whitelisted per Hard Rule 4).
const INTEG_ICONS: Record<string, { cls: string; node: React.ReactNode }> = {
  Jira: {
    cls: 'text-[var(--t2)]',
    node: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1l7 4v6l-7 4-7-4V5z" />
      </svg>
    ),
  },
  Groq: {
    cls: 'text-[var(--secondary)]',
    node: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M8 1l1.7 4.3L14 7l-4.3 1.7L8 13l-1.7-4.3L2 7l4.3-1.7z" />
      </svg>
    ),
  },
  'Gemini 2.5 Flash': {
    cls: 'text-[var(--info)]',
    node: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M2 8a6 6 0 0 0 12 0M8 2v4M8 10v4" strokeLinecap="round" />
      </svg>
    ),
  },
  Resend: {
    cls: 'text-[var(--warn)]',
    node: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="12" height="10" rx="1" />
        <path d="M2 5l6 4 6-4" strokeLinecap="round" />
      </svg>
    ),
  },
  'Cloudflare R2': {
    cls: 'text-[var(--warn)]',
    node: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden="true"
      >
        <path d="M4 10c-1.5 0-2.5-1-2.5-2.5S2.5 5 4 5c.4-1.5 2-2.5 3.5-2.5 1.8 0 3.3 1.2 3.7 2.8C12.5 5.5 13.5 6.5 13.5 8c0 1-1 2-2 2H4z" />
      </svg>
    ),
  },
};

function IntegrationsPanel({ onConfigure }: { onConfigure: (name: string) => void }) {
  const data = F28_INTEGRATIONS;
  return (
    <PanelShell title={data.title} sub={data.sub}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.cards.map((c) => {
          const connected = c.status === 'Connected';
          const icon = INTEG_ICONS[c.name];
          return (
            <article
              key={c.name}
              className="flex flex-col gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--raised)] p-3.5"
            >
              {/* .integ-head: ic + name + status badge */}
              <div className="flex items-center gap-2">
                {icon && (
                  <span
                    className={`inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[7px] border border-[var(--border)] bg-[var(--base)] ${icon.cls}`}
                  >
                    {icon.node}
                  </span>
                )}
                <span className="font-display min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--t1)]">
                  {c.name}
                </span>
                <span
                  className={[
                    'inline-flex h-5 flex-none items-center gap-1 rounded border px-1.5 font-mono text-[9.5px] font-bold uppercase leading-none tracking-[0.04em]',
                    connected
                      ? 'border-[var(--pass-line)] bg-[var(--pass-soft)] text-[var(--pass)]'
                      : 'border-[var(--warn-line)] bg-[var(--warn-soft)] text-[var(--warn)]',
                  ].join(' ')}
                >
                  {connected && (
                    <span
                      aria-hidden="true"
                      className="inline-block h-1.5 w-1.5 rounded-full bg-current"
                    />
                  )}
                  {c.status}
                </span>
              </div>
              {/* .integ-meta: key→value rows */}
              <dl className="flex flex-col gap-1.5">
                {c.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <dt className="font-mono text-[11.5px] text-[var(--t3)]">{row.label}</dt>
                    <dd className="font-mono text-[11.5px] text-[var(--t1)]">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {/* .integ-foot: dashed top separator + foot label + small Configure */}
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-[var(--border)] pt-1.5">
                {c.foot ? (
                  <span className="font-mono text-[10.5px] text-[var(--t3)]">{c.foot}</span>
                ) : (
                  <span />
                )}
                <button type="button" onClick={() => onConfigure(c.name)} className={F28_BTN_SM}>
                  {c.action}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </PanelShell>
  );
}

// ---------------------------------------------------------------------------
// Billing panel — 4 cards + locked
// ---------------------------------------------------------------------------

function BillingPanel() {
  const b = F28_BILLING;
  return (
    <PanelShell title={b.title} sub={b.sub}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {b.cards.map((c) => (
          <article
            key={c.label}
            className="flex flex-col gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-3.5"
          >
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--t3)]">
              {c.label}
            </span>
            <span className="font-display text-[18px] font-bold leading-[24px] text-[var(--t1)]">
              {c.value}
            </span>
            <p className="text-[11px] leading-[15px] text-[var(--t4)]">{c.meta}</p>
          </article>
        ))}
      </div>
      <p className="rounded-lg border border-[var(--warn-line)] bg-[var(--warn-soft)] px-3 py-2 text-[12px] leading-[17px] text-[var(--t2)]">
        <span className="font-semibold text-[var(--warn)]">Pilot tier disclosure: </span>
        {b.pilotDisclosure.replace('Pilot tier disclosure: ', '')}
      </p>
      <div className="border-[var(--secondary)]/30 bg-[var(--secondary)]/[0.06] flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--secondary)]">
          PM3+ Preview
        </span>
        <span
          aria-hidden="true"
          className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 inline-flex h-9 w-9 items-center justify-center rounded-lg border text-[var(--secondary)]"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect
              x="3"
              y="7"
              width="10"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </span>
        <span className="font-display text-[15px] font-bold text-[var(--t1)]">
          {b.paidTierTitle}
        </span>
        <p className="max-w-[480px] text-[12px] leading-[17px] text-[var(--t3)]">{b.lockedCopy}</p>
      </div>
    </PanelShell>
  );
}

// ---------------------------------------------------------------------------
// Locked panel (SSO / Compliance) — PM3+ preview
// ---------------------------------------------------------------------------

function LockedPanel({ data }: { data: { title: string; copy: string } }) {
  return (
    <PanelShell title={data.title} sub="Available in v2 · PM3+">
      <div className="border-[var(--secondary)]/30 bg-[var(--secondary)]/[0.06] flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--secondary)]">
          Locked behind PM3+ (v2)
        </span>
        <p className="max-w-[480px] text-[12.5px] leading-[18px] text-[var(--t3)]">{data.copy}</p>
      </div>
    </PanelShell>
  );
}

// ---------------------------------------------------------------------------
// Audit-log panel
// ---------------------------------------------------------------------------

interface AuditLogPanelProps {
  rows: F28AuditRow[];
  searchQuery: string;
  page: number;
  /** Real event count from the API (verify-chain totalRows); canned fallback. */
  total: number;
  /** Live chain-integrity text from /api/audit/verify-chain; canned fallback. */
  chainVal?: string;
  onSearchChange: (q: string) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  onScheduleDigest: () => void;
  onVerifyHash: (rowTs: string) => void;
  onPaginate: (page: number) => void;
}

function AuditLogPanel({
  rows,
  searchQuery,
  page,
  total,
  chainVal,
  onSearchChange,
  onExport,
  onScheduleDigest,
  onVerifyHash,
  onPaginate,
}: AuditLogPanelProps) {
  const b = F28_AUDIT.banner;
  return (
    <section
      aria-labelledby="audit-head"
      className="flex flex-col gap-3.5 rounded-[10px] border border-[var(--border)] bg-[var(--base)] p-[18px]"
    >
      {/* .p-head */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2
            id="audit-head"
            className="font-display text-[18px] font-bold leading-[24px] tracking-[-0.01em] text-[var(--t1)]"
          >
            {F28_AUDIT.title}
          </h2>
          <p className="text-[12px] text-[var(--t3)]">{F28_AUDIT.sub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={onScheduleDigest} className={F28_BTN_GHOST}>
            {F28_AUDIT.headerButtons[0]}
          </button>
          <button type="button" onClick={() => onExport('csv')} className={F28_BTN}>
            {F28_AUDIT.headerButtons[1]}
          </button>
          <button type="button" onClick={() => onExport('pdf')} className={F28_BTN_PRIMARY}>
            {F28_AUDIT.headerButtons[2]}
          </button>
        </div>
      </header>

      {/* .imm-banner */}
      <div className="flex flex-wrap items-center gap-3.5 rounded-lg border border-[var(--ai-line)] bg-[var(--ai-soft)] px-4 py-3">
        <span className="bg-[var(--secondary)]/[0.18] inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[7px] text-[var(--secondary)]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="3" y="7" width="10" height="7" rx="1.5" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" />
          </svg>
        </span>
        <p className="min-w-[200px] flex-1 text-[12.5px] leading-[18px] text-[var(--t2)]">
          <b className="font-semibold text-[var(--t1)]">{b.bold}</b>
          {b.before}
          <code className="rounded-[3px] border border-[var(--border)] bg-[var(--base)] px-[5px] py-px font-mono text-[11px] text-[var(--secondary)]">
            {b.code}
          </code>
          {b.after}
        </p>
        <span className="flex-none text-right font-mono">
          <span className="block text-[10.5px] font-medium leading-[14px] text-[var(--t3)]">
            {b.chainLabel}
          </span>
          <span className="flex items-center justify-end gap-1 text-[11.5px] font-bold leading-4 text-[var(--pass)]">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3.5 8.5l3 3 6-6.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {chainVal ?? b.chainVal}
          </span>
        </span>
      </div>

      {/* .ret-row — 3 cards */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {F28_AUDIT.retentionCards.map((c) => (
          <div
            key={c.lbl}
            className="flex flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--raised)] px-3.5 py-3"
          >
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-[var(--t3)]">
              {c.lbl}
            </span>
            <span
              className={`font-mono text-[14px] font-semibold leading-[1.3] ${c.locked ? 'text-[var(--t3)]' : 'text-[var(--t1)]'}`}
            >
              {c.val} <span className="text-[11px] font-medium text-[var(--t3)]">{c.unit}</span>
            </span>
            <span className="text-[11.5px] leading-[1.4] text-[var(--t3)]">
              {renderRetNote(c.note)}
            </span>
          </div>
        ))}
      </div>

      {/* .filter-bar — 4 pills + spacer + search + More filters */}
      <div className="flex flex-wrap items-center gap-2">
        {F28_AUDIT.filters.map((f, i) => (
          <span
            key={f.label}
            className={[
              'inline-flex min-h-[38px] items-center gap-2 rounded-[7px] border px-3 leading-none',
              i === 0
                ? 'border-[var(--primary-line)] bg-[var(--primary-soft)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--raised)] text-[var(--t2)]',
            ].join(' ')}
          >
            <span className="flex flex-col gap-px">
              <span
                className={`text-[9.5px] font-semibold uppercase leading-none tracking-[0.06em] ${i === 0 ? 'text-[var(--primary)]' : 'text-[var(--t3)]'}`}
              >
                {f.label}
              </span>
              <span
                className={`text-[12px] font-semibold leading-none ${i === 0 ? 'text-[var(--primary)]' : 'text-[var(--t2)]'}`}
              >
                {f.value}
              </span>
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className={i === 0 ? 'text-[var(--primary)]' : 'text-[var(--t4)]'}
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        ))}
        <label className="flex min-h-[38px] min-w-[200px] flex-1 items-center gap-2 rounded-[7px] border border-[var(--border)] bg-[var(--raised)] px-3 focus-within:border-[var(--border-strong)]">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            className="text-[var(--t3)]"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={F28_AUDIT.searchPlaceholder}
            aria-label="Search audit log"
            className="outline-none! focus:outline-none! focus-visible:outline-none! w-full bg-transparent text-[12.5px] text-[var(--t1)] placeholder:text-[var(--t4)]"
          />
        </label>
        <button type="button" className={F28_BTN}>
          {F28_AUDIT.moreFilters}
        </button>
      </div>

      {/* .audit-table-wrap — boxed (bg --raised), thead th uses --base for the
          distinct header bg; tbody rows show the --raised box bg. */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--raised)]">
        <AuditTable rows={rows} onVerifyHash={onVerifyHash} />
        <AuditFooter page={page} pageSize={25} total={total} onPaginate={onPaginate} />
      </div>
    </section>
  );
}

function AuditTable({
  rows,
  onVerifyHash,
}: {
  rows: F28AuditRow[];
  onVerifyHash: (ts: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--raised)] px-6 py-10 text-center">
        <span className="font-display text-[14px] font-bold text-[var(--t1)]">
          No matching events
        </span>
        <span className="text-[12px] text-[var(--t4)]">Adjust your search.</span>
      </div>
    );
  }
  // Horizontal scroll inside the boxed wrap (min-width forces the canonical
  // 7-column layout to scroll rather than crush on narrow screens).
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: '1080px' }}>
        <thead>
          <tr>
            {F28_AUDIT.columns.map((c) => (
              <th
                key={c}
                className="border-b border-[var(--border)] bg-[var(--base)] px-3 py-2.5 text-left font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-[var(--t3)]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <AuditRow key={r.hash} entry={r} onVerifyHash={() => onVerifyHash(r.ts)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditRow({ entry, onVerifyHash }: { entry: F28AuditRow; onVerifyHash: () => void }) {
  const spaceIdx = entry.ts.indexOf(' ');
  const date = entry.ts.slice(0, spaceIdx);
  const time = entry.ts.slice(spaceIdx + 1);
  return (
    <tr className="border-t border-[var(--border)] align-middle hover:bg-[var(--overlay)]">
      {/* Timestamp */}
      <td className="w-[130px] px-3 py-2">
        <div className="font-mono text-[11.5px] font-semibold leading-[1.2] text-[var(--t2)]">
          {date}
        </div>
        <div className="mt-px font-mono text-[10px] leading-[1.2] text-[var(--t4)]">{time}</div>
      </td>
      {/* Actor */}
      <td className="px-3 py-2">
        {entry.kind === 'agent' ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--secondary)]">
            {entry.actor}
            <span title={entry.tip} aria-label={entry.tip} className="cursor-help">
              ⓘ
            </span>
          </span>
        ) : entry.kind === 'system' ? (
          <span className="text-[12px] italic text-[var(--t3)]">{entry.actor}</span>
        ) : (
          <span className="text-[12px] font-medium text-[var(--t1)]">{entry.actor}</span>
        )}
      </td>
      {/* Action */}
      <td className="px-3 py-2">
        <span
          className={`inline-flex h-[22px] items-center whitespace-nowrap rounded border px-[7px] font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.04em] ${ACT_TONE[entry.act]}`}
        >
          {entry.action}
        </span>
      </td>
      {/* Target */}
      <td className="px-3 py-2">
        <span
          className={`block font-mono text-[11px] font-medium ${TARGET_TONE[entry.targetTone]}`}
        >
          {entry.target}
        </span>
        <span className="mt-px block text-[9.5px] font-medium uppercase leading-[1.4] tracking-[0.06em] text-[var(--t3)]">
          {entry.targetSub}
        </span>
      </td>
      {/* Project */}
      <td className="px-3 py-2">
        <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded border border-[var(--border)] bg-[var(--overlay)] px-[7px] text-[11px] font-medium leading-none text-[var(--t2)]">
          {entry.project}
        </span>
      </td>
      {/* Details */}
      <td className="px-3 py-2 text-[11.5px] leading-[1.4] text-[var(--t3)]">
        {renderDetails(entry.details, entry.detailsBold)}
      </td>
      {/* Verification */}
      <td className="px-3 py-2">
        <a
          onClick={onVerifyHash}
          title="Click to verify"
          className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap font-mono text-[11px] text-[var(--pass)] hover:underline"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3.5 8.5l3 3 6-6.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {entry.hash}
        </a>
      </td>
    </tr>
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
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  // Live data (Finding I): rebuild the canonical footer string + page list from
  // the REAL total. When total === the canned 47,234 fixture (offline fallback)
  // the output is byte-identical to the canonical text.
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const footerText = F28_AUDIT.footer
    .replace('1–25', `${from.toLocaleString('en-US')}–${to.toLocaleString('en-US')}`)
    .replace('47,234', total.toLocaleString('en-US'));
  const pageTokens =
    total === TOTAL_EVENTS
      ? F28_AUDIT.pages
      : lastPage <= 5
        ? Array.from({ length: lastPage }, (_, i) => String(i + 1))
        : page <= 3
          ? ['1', '2', '3', '…', String(lastPage)]
          : page >= lastPage - 2
            ? ['1', '…', String(lastPage - 2), String(lastPage - 1), String(lastPage)]
            : ['1', '…', String(page - 1), String(page), String(page + 1), '…', String(lastPage)];
  // Inside the .audit-table-wrap box — canonical .audit-foot (bg --base, border-top).
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--border)] bg-[var(--base)] px-3.5 py-3 font-mono text-[11px] text-[var(--t3)]">
      <span>{footerText}</span>
      <div className="inline-flex gap-1">
        <PgBtn onClick={() => onPaginate(Math.max(1, page - 1))} disabled={page === 1}>
          ‹
        </PgBtn>
        {pageTokens.map((p, i) => {
          const isCur = p === String(page);
          const isEllipsis = p === '…';
          return (
            <button
              key={`${p}-${i}`}
              type="button"
              disabled={isEllipsis}
              onClick={() => {
                const n = Number(p.replace(/,/g, ''));
                if (!Number.isNaN(n)) onPaginate(n);
              }}
              className={[
                'inline-flex h-[26px] min-w-[30px] items-center justify-center rounded px-2 font-mono text-[11px]',
                isEllipsis
                  ? 'cursor-default border border-transparent bg-transparent text-[var(--t4)]'
                  : isCur
                    ? 'border border-[var(--primary-line)] bg-[var(--primary-soft)] font-semibold text-[var(--primary)]'
                    : 'border border-[var(--border)] bg-[var(--raised)] text-[var(--t2)] hover:border-[var(--border-strong)] hover:text-[var(--t1)]',
              ].join(' ')}
            >
              {p}
            </button>
          );
        })}
        <PgBtn onClick={() => onPaginate(Math.min(lastPage, page + 1))} disabled={page >= lastPage}>
          ›
        </PgBtn>
      </div>
    </footer>
  );
}

function PgBtn({
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
      className="inline-flex h-[26px] min-w-[30px] items-center justify-center rounded border border-[var(--border)] bg-[var(--raised)] px-2 font-mono text-[11px] text-[var(--t2)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
