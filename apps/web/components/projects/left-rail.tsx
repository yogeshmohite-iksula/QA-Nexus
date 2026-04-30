// Left navigation rail for F09 Projects List.
// Lead variant: ALL sections visible. Home is the active item per locked
// source — /projects is treated as a Home/landing variant (no dedicated
// nav slot). When MAIN consolidates the home directories post-merge,
// this can dedupe with home-lead/left-rail.tsx.

'use client';

import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
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

interface NavItem {
  id: string;
  label: string;
  count?: { value: string; tone: 'pass' | 'fail' | 'warn' | 'neutral' };
  disabled?: boolean;
  badge?: string;
  active?: boolean;
}

interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  { id: 'top', items: [{ id: 'home', label: 'Home', active: true }] },
  {
    id: 'plan',
    title: 'Plan',
    items: [
      { id: 'requirements', label: 'Requirements' },
      { id: 'test-plans', label: 'Test Plans & Cycles' },
      { id: 'test-cases', label: 'Test Cases' },
    ],
  },
  {
    id: 'author',
    title: 'Author',
    items: [
      { id: 'test-suites', label: 'Test Suites' },
      { id: 'kb', label: 'Knowledge Base' },
      { id: 'automation', label: 'Automation Studio', disabled: true, badge: 'v1.5' },
      { id: 'data-mocks', label: 'Data & Mocks', disabled: true, badge: 'v1.5' },
    ],
  },
  {
    id: 'run',
    title: 'Run',
    items: [
      { id: 'runs-sessions', label: 'Runs & Sessions' },
      { id: 'environments', label: 'Environments' },
    ],
  },
  {
    id: 'analyse',
    title: 'Analyse',
    items: [
      { id: 'run-results', label: 'Run Results' },
      { id: 'defects', label: 'Defects / Failures' },
      { id: 'reports', label: 'Reports' },
      { id: 'qa-value', label: 'QA Value', badge: 'Lead+' },
    ],
  },
  {
    id: 'govern',
    title: 'Govern',
    items: [
      { id: 'agents', label: 'Agents' },
      { id: 'integrations', label: 'Integrations' },
      { id: 'users-roles', label: 'Users & Roles' },
      { id: 'settings-audit', label: 'Settings & Audit' },
    ],
  },
];

export function LeftRail() {
  const me = useCurrentUser();
  const meName = shortName(me.displayName);
  const meInitials = initialsOf(me.displayName);
  const meRole = me.role === 'Admin' ? 'Admin' : me.organizationalLabel;
  return (
    <aside
      aria-label="Workspace navigation"
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--canvas)] py-4 lg:flex lg:flex-col"
    >
      <nav className="flex flex-1 flex-col gap-5 px-3">
        {SECTIONS.map((section) => (
          <div key={section.id} className="flex flex-col gap-1">
            {section.title && (
              <span className="px-3 pb-1 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                {section.title}
              </span>
            )}
            {section.items.map((item) => (
              <NavLink key={item.id} item={item} />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-subtle)] px-3 py-4">
        <button
          type="button"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
        >
          Support
        </button>
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
              {meRole}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <button
      type="button"
      aria-current={item.active ? 'page' : undefined}
      disabled={item.disabled}
      className={[
        'group relative flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        item.active
          ? 'bg-[var(--secondary)]/10 font-medium text-[var(--text-primary)]'
          : item.disabled
            ? 'cursor-not-allowed text-[var(--text-disabled)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {item.active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--secondary)]"
        />
      )}
      <span className="truncate">{item.label}</span>
      {item.count && (
        <span className="inline-flex items-center rounded bg-[var(--overlay)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--text-tertiary)]">
          {item.count.value}
        </span>
      )}
      {item.badge && (
        <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--secondary)]">
          {item.badge}
        </span>
      )}
    </button>
  );
}
