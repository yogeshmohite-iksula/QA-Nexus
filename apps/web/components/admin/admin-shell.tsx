// AdminShell — shared top-bar + left-rail chrome for project-context
// pages. Originally landed for the M1 admin surface (F27 Users & Roles,
// F27m1 Invite User Modal, F28 Settings & Audit); extended Day-8 PM to
// support the Author surface (F15 Knowledge Base) per Phase 3 retrofit
// + visual-gate consistency feedback.
//
// All identity comes from `useCurrentUser()` + `useProjectList()` per
// ADR-006 — NO local data.ts entries.
//
// Naming followup: rename `AdminShell` → `AppShell` (or `WorkspaceShell`)
// once the rail item count grows past the Govern section. Tracked in
// docs/followups.md (post-M2 cleanup).

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useProjectList } from '@/lib/contexts/ProjectContext';

export type AdminNavActive = 'users-roles' | 'settings-audit' | 'knowledge-base';

interface AdminShellProps {
  active: AdminNavActive;
  children: ReactNode;
  /** Optional — required when `active='knowledge-base'` so the KB nav
   *  link can route to /projects/<slug>/kb. Lowercased project key. */
  projectKeyLower?: string;
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

export function AdminShell({ active, children, projectKeyLower }: AdminShellProps) {
  const me = useCurrentUser();
  const projects = useProjectList();
  const meName = shortName(me.displayName);
  const meInitials = initialsOf(me.displayName);
  const meRoleLabel = (me.role === 'Admin' ? 'Admin' : me.organizationalLabel) ?? me.role;
  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
      <TopBar
        meName={meName}
        meInitials={meInitials}
        meRoleLabel={meRoleLabel}
        projectCount={projects.length}
      />
      <div className="flex flex-1">
        <AdminLeftRail
          active={active}
          meName={meName}
          meInitials={meInitials}
          meRoleLabel={meRoleLabel}
          projectKeyLower={projectKeyLower}
        />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

function TopBar({
  meName,
  meInitials,
  meRoleLabel,
  projectCount,
}: {
  meName: string;
  meInitials: string;
  meRoleLabel: string;
  projectCount: number;
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
        aria-label="Switch project"
        className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] py-1.5 pl-1.5 pr-3 text-[13px] text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:inline-flex"
      >
        <span
          aria-hidden="true"
          className="inline-block h-5 w-5 rounded-md"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        />
        <span className="font-medium">All projects</span>
        <span aria-hidden="true" className="text-[var(--text-tertiary)]">
          ·
        </span>
        <span className="font-mono text-[12px] text-[var(--primary)]">{projectCount}</span>
      </button>

      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="flex w-full max-w-[520px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-4 py-2 text-[13px] text-[var(--text-tertiary)]">
          <SearchIcon />
          <span className="flex-1 truncate">Search users, audit events, settings…</span>
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
      </button>
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

function AdminLeftRail({
  active,
  meName,
  meInitials,
  meRoleLabel,
  projectKeyLower,
}: {
  active: AdminNavActive;
  meName: string;
  meInitials: string;
  meRoleLabel: string;
  projectKeyLower?: string;
}) {
  return (
    <aside
      aria-label="Workspace navigation"
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--canvas)] py-4 lg:flex lg:flex-col"
    >
      <nav className="flex flex-1 flex-col gap-5 px-3">
        <NavSection>
          <NavLink href="/home" label="Home" />
        </NavSection>
        <NavSection title="Plan">
          <NavLink href="/" label="Requirements" disabled />
          <NavLink href="/" label="Test Plans & Cycles" disabled />
          <NavLink href="/" label="Test Cases" disabled />
        </NavSection>
        <NavSection title="Author">
          <NavLink href="/" label="Test Suites" disabled />
          <NavLink
            href={projectKeyLower ? `/projects/${projectKeyLower}/kb` : '/'}
            label="Knowledge Base"
            active={active === 'knowledge-base'}
            disabled={!projectKeyLower && active !== 'knowledge-base'}
          />
          <NavLink href="/" label="Automation Studio" disabled badge="v1.5" />
          <NavLink href="/" label="Data & Mocks" disabled badge="v1.5" />
        </NavSection>
        <NavSection title="Run">
          <NavLink href="/" label="Runs & Sessions" disabled />
          <NavLink href="/" label="Environments" disabled />
        </NavSection>
        <NavSection title="Analyse">
          <NavLink href="/" label="Run Results" disabled />
          <NavLink href="/" label="Defects / Failures" disabled />
          <NavLink href="/" label="Reports" disabled />
          <NavLink href="/" label="QA Value" badge="Lead+" disabled />
        </NavSection>
        <NavSection title="Govern">
          <NavLink href="/" label="Agents" disabled />
          <NavLink href="/" label="Integrations" disabled />
          <NavLink href="/admin/users" label="Users & Roles" active={active === 'users-roles'} />
          <NavLink
            href="/admin/settings"
            label="Settings & Audit"
            active={active === 'settings-audit'}
          />
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

function NavLink({
  href,
  label,
  active,
  disabled,
  badge,
}: {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
}) {
  const Tag = (disabled ? 'button' : Link) as React.ElementType;
  const tagProps = disabled ? { type: 'button' as const, disabled: true } : { href };
  return (
    <Tag
      {...tagProps}
      aria-current={active ? 'page' : undefined}
      className={[
        'group relative flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        active
          ? 'bg-[var(--secondary)]/10 font-medium text-[var(--text-primary)]'
          : disabled
            ? 'cursor-not-allowed text-[var(--text-disabled)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--secondary)]"
        />
      )}
      <span className="truncate">{label}</span>
      {badge && (
        <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--secondary)]">
          {badge}
        </span>
      )}
    </Tag>
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
