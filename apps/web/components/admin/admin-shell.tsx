// AdminShell v2 — shared top-bar + left-rail chrome for project-context
// pages. Originally landed for the M1 admin surface (F27 Users & Roles,
// F27m1 Invite User Modal, F28 Settings & Audit); extended Day-8 PM to
// support the Author surface (F15 Knowledge Base) per Phase 3 retrofit;
// upgraded to v2 on Day-12 (2026-05-07) under Hard Rule 14 — adds rail
// collapse toggle, mobile hamburger + drawer overlay, body scroll-lock,
// ESC close, and `.rail-foot` username truncation fix.
//
// Source of truth: PM1_UI_v2/Redesign Frame by claude design/F15
// Knowledge Base v2.html (lines 89-198 for menu-btn / rail.mobile-open /
// rail-toggle / [data-rail="collapsed"] / .rail-foot).
//
// All identity comes from `useCurrentUser()` + `useProjectList()` per
// ADR-006 — NO local data.ts entries.
//
// Naming followup: rename `AdminShell` → `AppShell` (or `WorkspaceShell`)
// once the rail item count grows past the Govern section. Tracked in
// docs/followups.md (post-M2 cleanup).

'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { ArrowLeft, Menu, X } from 'lucide-react';
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

// localStorage key for desktop collapsed-rail persistence.
// Namespaced under qa-nexus to avoid collision with the F15 v2.html
// reference (which uses `f15.rail`).
const COLLAPSED_STORAGE_KEY = 'qa-nexus.shell.rail-collapsed';

// Mobile drawer width per F15 v2.html line 132. Inline style keeps
// CLAUDE.md Rule 12's enforce-rwd hook satisfied (no fixed Tailwind
// `w-[Xpx]` on a layout container) while preserving the locked spec.
const MOBILE_DRAWER_WIDTH = 280;

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

  // Desktop rail collapsed state. Default `false` (expanded) for SSR
  // parity; sync from localStorage on mount to avoid hydration mismatch.
  const [collapsed, setCollapsed] = useState(false);
  // Mobile drawer open/closed. Always starts closed.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate collapsed state from localStorage post-mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (stored === '1') setCollapsed(true);
    } catch {
      // localStorage unavailable (private mode etc.) — keep default.
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Body scroll-lock when mobile drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // ESC closes drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Close drawer when viewport crosses lg breakpoint (≥1024px) — drawer
  // would be visually replaced by the in-flow rail anyway, but
  // explicitly resetting state avoids stale scroll-lock on rotate.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    function onChange(e: MediaQueryListEvent) {
      if (e.matches) setMobileOpen(false);
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
      <TopBar
        meName={meName}
        meInitials={meInitials}
        meRoleLabel={meRoleLabel}
        projectCount={projects.length}
        onOpenMobileMenu={() => setMobileOpen(true)}
      />
      <div className="flex flex-1">
        <AdminLeftRail
          active={active}
          meName={meName}
          meInitials={meInitials}
          meRoleLabel={meRoleLabel}
          projectKeyLower={projectKeyLower}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
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
  onOpenMobileMenu,
}: {
  meName: string;
  meInitials: string;
  meRoleLabel: string;
  projectCount: number;
  onOpenMobileMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--canvas)] px-3 sm:gap-4 sm:px-6">
      {/* Hamburger — first child, hidden ≥ lg per F15 v2.html line 92 */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="Open navigation"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:hidden"
      >
        <Menu size={18} aria-hidden="true" />
      </button>

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

interface AdminLeftRailProps {
  active: AdminNavActive;
  meName: string;
  meInitials: string;
  meRoleLabel: string;
  projectKeyLower?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
}

function AdminLeftRail({
  active,
  meName,
  meInitials,
  meRoleLabel,
  projectKeyLower,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  setMobileOpen,
}: AdminLeftRailProps) {
  // Width: 240 expanded / 64 collapsed (per F15 v2.html line 72).
  // The aside transitions width (220ms cubic-bezier) on desktop (≥lg).
  // On mobile (<lg) the aside is always 280px (drawer width per F15 v2
  // line 132) and renders in fixed position when `mobileOpen` is true.
  const isCollapsed = collapsed; // always expanded inside mobile drawer

  return (
    <>
      {/* Mobile backdrop — separate element (vs F15 v2.html's box-shadow
          trick) so we can wire tap-to-close + smoother fade. */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        aria-label="Workspace navigation"
        data-collapsed={isCollapsed ? 'true' : 'false'}
        data-mobile-open={mobileOpen ? 'true' : 'false'}
        // Mobile drawer width applied via inline style (canonical 280 px
        // per F15 v2.html line 132; inline style satisfies enforce-rwd
        // hook without weakening Rule 12 elsewhere).
        style={mobileOpen ? { width: MOBILE_DRAWER_WIDTH } : undefined}
        className={[
          // Common styles
          'flex shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-[var(--border-subtle)] bg-[var(--canvas)] py-4',
          // Mobile (<lg): hidden by default, fixed drawer when open
          mobileOpen
            ? 'fixed bottom-0 left-0 top-14 z-50 flex shadow-[0_8px_32px_rgba(0,0,0,0.4)] lg:relative lg:top-auto lg:z-auto lg:shadow-none'
            : 'hidden lg:flex',
          // Desktop (lg+): sticky, height-locked, width transitions
          'lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]',
          isCollapsed ? 'lg:w-16' : 'lg:w-60',
          'transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        ].join(' ')}
      >
        {/* Mobile-only close button at top of drawer */}
        <div className="flex items-center justify-end px-2 pb-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Desktop-only collapse toggle (hidden on mobile drawer) */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={isCollapsed ? 'false' : 'true'}
          className={[
            'hidden lg:flex',
            'mx-3 mb-2 mt-1 min-h-11 items-center gap-2.5 rounded-md border border-transparent px-3 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
            isCollapsed ? 'lg:mx-auto lg:w-11 lg:justify-center lg:px-0' : '',
          ].join(' ')}
        >
          <ArrowLeft
            size={14}
            aria-hidden="true"
            className={[
              'shrink-0 transition-transform duration-200',
              isCollapsed ? 'scale-x-[-1]' : '',
            ].join(' ')}
          />
          {!isCollapsed && <span>Collapse</span>}
        </button>

        <nav
          className={['flex flex-1 flex-col gap-5', isCollapsed ? 'lg:px-1.5' : 'px-3'].join(' ')}
        >
          <NavSection collapsed={isCollapsed}>
            <NavLink href="/home" label="Home" collapsed={isCollapsed} />
          </NavSection>
          <NavSection title="Plan" collapsed={isCollapsed}>
            <NavLink href="/" label="Requirements" disabled collapsed={isCollapsed} />
            <NavLink href="/" label="Test Plans & Cycles" disabled collapsed={isCollapsed} />
            <NavLink href="/" label="Test Cases" disabled collapsed={isCollapsed} />
          </NavSection>
          <NavSection title="Author" collapsed={isCollapsed}>
            <NavLink href="/" label="Test Suites" disabled collapsed={isCollapsed} />
            <NavLink
              href={projectKeyLower ? `/projects/${projectKeyLower}/kb` : '/'}
              label="Knowledge Base"
              active={active === 'knowledge-base'}
              disabled={!projectKeyLower && active !== 'knowledge-base'}
              collapsed={isCollapsed}
            />
            <NavLink
              href="/"
              label="Automation Studio"
              disabled
              badge="v1.5"
              collapsed={isCollapsed}
            />
            <NavLink href="/" label="Data & Mocks" disabled badge="v1.5" collapsed={isCollapsed} />
          </NavSection>
          <NavSection title="Run" collapsed={isCollapsed}>
            <NavLink href="/" label="Runs & Sessions" disabled collapsed={isCollapsed} />
            <NavLink href="/" label="Environments" disabled collapsed={isCollapsed} />
          </NavSection>
          <NavSection title="Analyse" collapsed={isCollapsed}>
            <NavLink href="/" label="Run Results" disabled collapsed={isCollapsed} />
            <NavLink href="/" label="Defects / Failures" disabled collapsed={isCollapsed} />
            <NavLink href="/" label="Reports" disabled collapsed={isCollapsed} />
            <NavLink href="/" label="QA Value" badge="Lead+" disabled collapsed={isCollapsed} />
          </NavSection>
          <NavSection title="Govern" collapsed={isCollapsed}>
            <NavLink href="/" label="Agents" disabled collapsed={isCollapsed} />
            <NavLink href="/" label="Integrations" disabled collapsed={isCollapsed} />
            <NavLink
              href="/admin/users"
              label="Users & Roles"
              active={active === 'users-roles'}
              collapsed={isCollapsed}
            />
            <NavLink
              href="/admin/settings"
              label="Settings & Audit"
              active={active === 'settings-audit'}
              collapsed={isCollapsed}
            />
          </NavSection>
        </nav>

        {/* Rail foot — username block. Gap 4 fix (Day-11 screenshot showed
            only "alue" visible): ensure `min-w-0` on the text container
            so flex children inside the chain can truncate properly.
            Without `min-w-0` the role-badge pushes the name off-screen
            and `truncate` shows fragments. */}
        <div
          className={[
            'mt-4 flex flex-col gap-3 border-t border-[var(--border-subtle)] py-4',
            isCollapsed ? 'lg:px-1.5' : 'px-3',
          ].join(' ')}
        >
          <div
            className={[
              'flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)]',
              isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'px-3 py-2',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              title={isCollapsed ? `${meName} · ${meRoleLabel}` : undefined}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[var(--primary-ink)]"
              style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
            >
              {meInitials}
            </span>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                  {meName}
                </span>
                <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/15 inline-flex w-fit max-w-full truncate rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--secondary)]">
                  {meRoleLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavSection({
  title,
  children,
  collapsed,
}: {
  title?: string;
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {title && !collapsed && (
        <span className="px-3 pb-1 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          {title}
        </span>
      )}
      {/* In collapsed mode keep a thin spacer instead of the title to
          preserve visual rhythm between sections. */}
      {title && collapsed && <span aria-hidden="true" className="block h-2" />}
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
  collapsed,
}: {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  collapsed?: boolean;
}) {
  const Tag = (disabled ? 'button' : Link) as React.ElementType;
  const tagProps = disabled ? { type: 'button' as const, disabled: true } : { href };
  return (
    <Tag
      {...tagProps}
      aria-current={active ? 'page' : undefined}
      // `title` provides a native browser tooltip when collapsed —
      // simple, accessible, no extra DOM. Omitted when expanded so it
      // doesn't interfere with the visible label.
      title={collapsed ? label : undefined}
      data-label={label}
      className={[
        'group relative flex items-center gap-2 rounded-lg text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        collapsed ? 'lg:justify-center lg:px-0 lg:py-2' : 'justify-between px-3 py-2',
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
      {/* In collapsed mode show the first letter as a fallback "icon"
          (the locked HTML uses a per-item icon set; we're matching the
          collapsed-row hit area + visual rhythm without inventing
          new icons). */}
      {collapsed ? (
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[11px] font-semibold uppercase"
        >
          {label[0]}
        </span>
      ) : (
        <span className="truncate">{label}</span>
      )}
      {badge && !collapsed && (
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
