// Left rail for F08c — same nav structure as F08b but ALL counts = 0.
// Disabled tier-2 items (Automation Studio, Data & Mocks) still shown to
// communicate scope to the founder. Footer shows ADMIN role for Yogesh
// per CLAUDE.md Day-0 bootstrap (locked source had QA LEAD which is
// inconsistent with the binding spec).

'use client';

import { SIGNED_IN_USER } from './data';

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
      { id: 'requirements', label: 'Requirements', count: { value: '0', tone: 'neutral' } },
      { id: 'test-plans', label: 'Test Plans & Cycles', count: { value: '0', tone: 'neutral' } },
      { id: 'test-cases', label: 'Test Cases', count: { value: '0', tone: 'neutral' } },
    ],
  },
  {
    id: 'author',
    title: 'Author',
    items: [
      { id: 'test-suites', label: 'Test Suites', count: { value: '0', tone: 'neutral' } },
      { id: 'kb', label: 'Knowledge Base', count: { value: '0', tone: 'neutral' } },
      { id: 'automation', label: 'Automation Studio', disabled: true, badge: 'v1.5' },
      { id: 'data-mocks', label: 'Data & Mocks', disabled: true, badge: 'v1.5' },
    ],
  },
  {
    id: 'run',
    title: 'Run',
    items: [
      { id: 'runs-sessions', label: 'Runs & Sessions', count: { value: '0', tone: 'neutral' } },
      { id: 'environments', label: 'Environments', count: { value: '0', tone: 'neutral' } },
    ],
  },
  {
    id: 'analyse',
    title: 'Analyse',
    items: [
      { id: 'run-results', label: 'Run Results', count: { value: '0', tone: 'neutral' } },
      { id: 'defects', label: 'Defects / Failures', count: { value: '0', tone: 'neutral' } },
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
        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] px-3 py-2">
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[var(--primary-ink)]"
            style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
          >
            {SIGNED_IN_USER.initials}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">
              {SIGNED_IN_USER.name}
            </span>
            <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 inline-flex w-fit rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--secondary)]">
              {SIGNED_IN_USER.role}
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
          ? 'bg-[var(--primary)]/10 font-medium text-[var(--text-primary)]'
          : item.disabled
            ? 'cursor-not-allowed text-[var(--text-disabled)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {item.active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--primary)]"
        />
      )}
      <span className="truncate">{item.label}</span>
      {item.count && <CountChip {...item.count} />}
      {item.badge && (
        <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--secondary)]">
          {item.badge}
        </span>
      )}
    </button>
  );
}

function CountChip({
  value,
  tone,
}: {
  value: string;
  tone: NonNullable<NavItem['count']>['tone'];
}) {
  const toneClass: Record<typeof tone, string> = {
    pass: 'text-[var(--pass)] bg-[var(--pass)]/10',
    fail: 'text-[var(--fail)] bg-[var(--fail)]/10',
    warn: 'text-[var(--warn)] bg-[var(--warn)]/10',
    neutral: 'text-[var(--text-disabled)] bg-[var(--overlay)]',
  };
  return (
    <span
      className={[
        'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium',
        toneClass[tone],
      ].join(' ')}
    >
      {value}
    </span>
  );
}
