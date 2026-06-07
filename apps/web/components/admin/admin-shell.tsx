// AdminShell v2 (full canon) — shared top-bar + left-rail chrome for
// project-context pages. Source of truth for all (app)/**/page.tsx
// shell needs (Hard Rule 14 + Hard Rule 15).
//
// Day-13 (2026-05-08) — TASK 0 elevates the AdminShell to the FULL F15
// v2 canon:
//
//   * data-tone matrix on every nav item — colored 24×24 icon chips
//     with semantic tone (home / primary / secondary / info / warn /
//     pass / fail) per F15 v2.html lines 163-198
//   * Per-section collapse with chevron toggle, localStorage
//     persistence, auto-expand of the active section on mount
//     (per `_Demo Collapsible Nav Sections.html`)
//   * Single rail scrollbar — 3-zone layout: rail-toggle (fixed top)
//     · rail-content (scrollable middle, the only scrollbar) ·
//     rail-foot (fixed bottom username block)
//   * Executive Dashboard (F25) added under ANALYSE (between Run
//     Results and Defects/Failures), tone="secondary"
//   * Dark/light mode toggle in top utility bar (Pattern A stub —
//     real implementation post-M4 per Hard Rule 14 spec)
//   * Mobile hamburger + drawer overlay + body scroll-lock + ESC
//     close (carry-over from v2 collapse PR #69)
//
// Tokens: inline rgba() at 12% bg / 30% border per established pattern
// (F12 StatCard, F13 StatusBadge). Colors derive from the locked
// palette: --primary teal #2dd4bf, --secondary violet #a78bfa,
// --info blue #60a5fa, --warn amber #fbbf24, --pass green #34d399,
// --fail red #f87171.
//
// All identity comes from `useCurrentUser()` + `useProjectList()` per
// ADR-006 — NO local data.ts entries.

'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bookmark,
  Bot,
  Calendar,
  CheckSquare,
  ChevronDown,
  Database,
  FileBarChart,
  FileText,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Menu,
  Play,
  Plug,
  Server,
  Settings,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { PopoverManagerProvider } from '@/components/admin/use-popover-manager';
import {
  ProjectSwitcher,
  Search as ShellSearch,
  QuickCreate,
  Notifications,
  ThemeToggle,
  ModeToggle,
  UserMenu,
} from '@/components/admin/shell-topbar-widgets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminNavActive =
  // Top-level
  | 'home'
  | 'projects'
  // PLAN
  | 'requirements'
  | 'test-plans-cycles'
  | 'test-cases'
  // AUTHOR
  | 'test-suites'
  | 'knowledge-base'
  // RUN
  | 'runs-sessions'
  | 'environments'
  // ANALYSE
  | 'run-results'
  | 'executive-dashboard'
  | 'defects-failures'
  | 'reports'
  // GOVERN
  | 'agents'
  | 'integrations'
  | 'users-roles'
  | 'settings-audit';

type NavTone = 'home' | 'primary' | 'secondary' | 'info' | 'warn' | 'pass' | 'fail' | 'disabled';

type SectionKey = 'plan' | 'author' | 'run' | 'analyse' | 'govern';

interface AdminShellProps {
  active: AdminNavActive;
  children: ReactNode;
  /** Optional — required when `active='knowledge-base'` so the KB nav
   *  link can route to /projects/<slug>/kb. Lowercased project key. */
  projectKeyLower?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLLAPSED_STORAGE_KEY = 'qa-nexus.shell.rail-collapsed';
const SECTION_STORAGE_PREFIX = 'qa-nexus.shell.section-';
const MOBILE_DRAWER_WIDTH = 280; // F15 v2.html line 132

/** data-tone → inline style map. Keeps Rule 4 (no token extension)
 *  while matching F15 v2.html lines 195-201 visually.
 *
 *  M3 close drift fix (Day-18, post-#135): swapped hardcoded
 *  rgba() literals for canonical `var(--*-soft)` / `var(--*-line)`
 *  tokens (already defined in globals.css :root). Probe vs F15/F19
 *  canonical revealed alpha mismatches: primary 0.12/0.30 → canon
 *  0.10/0.28; warn/pass/fail 0.12/0.30 → canon 0.14/0.34. Source-of-
 *  truth is now the globals.css token table — keeps any future
 *  alpha tweaks single-edit. Also fixes `secondary` color which was
 *  --secondary (violet #a78bfa) but canon F15 L197 uses --ai-accent
 *  (lighter violet #c4b5fd). */
function toneStyle(tone: NavTone): { background: string; borderColor: string; color: string } {
  switch (tone) {
    case 'home':
      return {
        background: 'var(--raised)',
        borderColor: 'var(--border-strong)',
        color: 'var(--text-primary)',
      };
    case 'primary':
      return {
        background: 'var(--primary-soft)',
        borderColor: 'var(--primary-line)',
        color: 'var(--primary)',
      };
    case 'secondary':
      return {
        background: 'var(--ai-soft)',
        borderColor: 'var(--ai-line)',
        color: 'var(--ai-accent)',
      };
    case 'info':
      return {
        background: 'var(--info-soft)',
        borderColor: 'var(--info-line)',
        color: 'var(--info)',
      };
    case 'warn':
      return {
        background: 'var(--warn-soft)',
        borderColor: 'var(--warn-line)',
        color: 'var(--warn)',
      };
    case 'pass':
      return {
        background: 'var(--pass-soft)',
        borderColor: 'var(--pass-line)',
        color: 'var(--pass)',
      };
    case 'fail':
      return {
        background: 'var(--fail-soft)',
        borderColor: 'var(--fail-line)',
        color: 'var(--fail)',
      };
    case 'disabled':
      return {
        background: 'var(--raised)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-disabled)',
      };
  }
}

// ---------------------------------------------------------------------------
// Nav matrix — single source of truth for the rail. The order here is
// the render order; section grouping comes from the nav-section blocks
// inside <AdminLeftRail>.
// ---------------------------------------------------------------------------

interface NavItem {
  id: AdminNavActive;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  tone: NavTone;
  /** Numeric / textual count rendered to the right (font-mono 11 px).
   *  Use NavItem.tone "fail" to color the count red (Defects path). */
  count?: string;
  /** Pill (e.g. "v1.5", "Lead+") rendered when the item is locked-out
   *  by milestone. Pairs with `disabled: true`. */
  pill?: string;
  disabled?: boolean;
  section: 'top' | SectionKey;
}

/** Resolve the active section for a given active nav id. Used to
 *  auto-expand the matching section on mount. */
function sectionOfActive(active: AdminNavActive): SectionKey | 'top' | null {
  switch (active) {
    case 'home':
    case 'projects':
      return 'top';
    case 'requirements':
    case 'test-plans-cycles':
    case 'test-cases':
      return 'plan';
    case 'test-suites':
    case 'knowledge-base':
      return 'author';
    case 'runs-sessions':
    case 'environments':
      return 'run';
    case 'run-results':
    case 'executive-dashboard':
    case 'defects-failures':
    case 'reports':
      return 'analyse';
    case 'agents':
    case 'integrations':
    case 'users-roles':
    case 'settings-audit':
      return 'govern';
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main shell component
// ---------------------------------------------------------------------------

export function AdminShell({ active, children, projectKeyLower }: AdminShellProps) {
  const me = useCurrentUser();
  // useProjectList() no longer consumed at shell level — the ProjectSwitcher
  // widget reads its own hardcoded canon (per CLAUDE.md Iksula data canon).
  const meName = shortName(me.displayName);
  const meInitials = initialsOf(me.displayName);
  const meRoleLabel = (me.role === 'Admin' ? 'Admin' : me.organizationalLabel) ?? me.role;

  // Desktop collapsed state, persisted.
  const [collapsed, setCollapsed] = useState(false);
  // Mobile drawer state.
  const [mobileOpen, setMobileOpen] = useState(false);
  // Theme is now owned by ThemeToggle widget — html[data-theme] + localStorage.

  // Hydrate collapsed state from localStorage post-mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (stored === '1') setCollapsed(true);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
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

  // Close drawer on viewport ≥ lg.
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
    <PopoverManagerProvider>
      <div className="flex min-h-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
        <TopBar
          meName={meName}
          meFullName={me.displayName}
          meEmail={me.email}
          meInitials={meInitials}
          meRoleLabel={meRoleLabel}
          isAdmin={me.role === 'Admin'}
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
    </PopoverManagerProvider>
  );
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------

function TopBar({
  meName,
  meFullName,
  meEmail,
  meInitials,
  meRoleLabel,
  isAdmin,
  onOpenMobileMenu,
}: {
  meName: string;
  meFullName: string;
  meEmail: string;
  meInitials: string;
  meRoleLabel: string;
  isAdmin: boolean;
  onOpenMobileMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--base)] px-3 lg:gap-3 lg:px-6">
      {/* Hamburger — first child, hidden ≥ lg per F15 v2.html line 92.
          Canonical L89: border-radius 8px on hamburger (NOT 6px).
          width/height: --tap (44px). */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="Open navigation"
        style={{ borderRadius: '8px' }}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:hidden"
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

      {/* Canonical topbar widgets — all 7 from _SHELL Developer Handoff.md §4.
          Each manages its own state via usePopoverManager() for one-at-a-time
          + outside-click + ESC behavior. */}
      <ProjectSwitcher />
      <ShellSearch />

      {/* Spacer pushes the right cluster (icons + mode toggle + user pill) to
          the right edge when search is hidden at <xl. At xl+ the search
          wrapper itself handles flex-grow so spacer becomes inert. */}
      <div className="flex flex-1 xl:flex-none" />

      <QuickCreate />
      <Notifications />
      <ThemeToggle />
      <ModeToggle />
      <UserMenu
        meName={meName}
        meFullName={meFullName}
        meEmail={meEmail}
        meInitials={meInitials}
        meRoleLabel={meRoleLabel}
        isAdmin={isAdmin}
      />
    </header>
  );
}

// IconButton + ModeTab helpers REMOVED — superseded by canonical shell widgets:
// IconButton lives in shell-topbar-widgets.tsx (exported); ModeTab is replaced
// by ModeToggle in the same file (Sun 2026-06-07 Phase 2 upgrade).

// ---------------------------------------------------------------------------
// Left rail — 3-zone layout: rail-toggle (fixed top) + rail-content
// (scrollable middle, single scrollbar) + rail-foot (fixed bottom).
// ---------------------------------------------------------------------------

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
  const isCollapsed = collapsed;
  return (
    <>
      {/* Mobile backdrop — separate element for tap-to-close */}
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
        data-rail={isCollapsed ? 'collapsed' : 'expanded'}
        data-mobile-open={mobileOpen ? 'true' : 'false'}
        style={mobileOpen ? { width: MOBILE_DRAWER_WIDTH } : undefined}
        className={[
          'flex shrink-0 flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--base)]',
          mobileOpen
            ? 'fixed bottom-0 left-0 top-14 z-50 flex shadow-[0_8px_32px_rgba(0,0,0,0.4)] lg:relative lg:top-auto lg:z-auto lg:shadow-none'
            : 'hidden lg:flex',
          'lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]',
          isCollapsed ? 'lg:w-16' : 'lg:w-60',
          'transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        ].join(' ')}
      >
        {/* Mobile-only close (top of drawer) — 6px radius pinned. */}
        <div className="flex items-center justify-end px-2 pb-1 pt-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            style={{ borderRadius: '6px' }}
            className="inline-flex h-9 w-9 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* ── ZONE 1: rail-toggle (fixed top, desktop only) ── */}
        <RailToggle isCollapsed={isCollapsed} onClick={onToggleCollapsed} />

        {/* ── ZONE 2: rail-content (scrollable middle — the single
                       scrollbar lives here) ──
                       data-canonical-section anchors this region for
                       frame-port diff-probe TERTIARY-tier matching
                       (CLAUDE.md Hard Rule 18 Day-19 amendment Part 1).
                       The canonical v2 HTML uses class="rail-content";
                       React port preserves the semantic anchor via
                       data-attribute since Tailwind utility classes
                       can't carry that signal. */}
        <div
          data-canonical-section="rail-content"
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          <RailNav active={active} isCollapsed={isCollapsed} projectKeyLower={projectKeyLower} />
        </div>

        {/* ── ZONE 3: rail-foot (fixed bottom username block) ── */}
        <RailFoot
          meName={meName}
          meInitials={meInitials}
          meRoleLabel={meRoleLabel}
          isCollapsed={isCollapsed}
        />
      </aside>
    </>
  );
}

function RailToggle({ isCollapsed, onClick }: { isCollapsed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-canonical-section="railCollapseToggle"
      aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
      aria-expanded={isCollapsed ? 'false' : 'true'}
      className={[
        'hidden lg:flex',
        'min-h-11 shrink-0 items-center gap-2.5 rounded-md border border-transparent font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        isCollapsed
          ? 'mx-auto mb-2 mt-3 h-11 w-11 justify-center px-0'
          : 'mx-3 mb-2 mt-3 px-3 py-2.5',
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
  );
}

// ---------------------------------------------------------------------------
// RailNav — emits the Home nav item plus 5 collapsible sections.
// Auto-expands the section containing the active item on mount.
// ---------------------------------------------------------------------------

function RailNav({
  active,
  isCollapsed,
  projectKeyLower,
}: {
  active: AdminNavActive;
  isCollapsed: boolean;
  projectKeyLower?: string;
}) {
  // Per-section collapse state. Each section has its own
  // localStorage key. Default expanded; auto-expand the active
  // section regardless of stored state.
  const activeSection = useMemo(() => sectionOfActive(active), [active]);

  const sections: SectionKey[] = ['plan', 'author', 'run', 'analyse', 'govern'];
  const [collapsedMap, setCollapsedMap] = useState<Record<SectionKey, boolean>>(() => ({
    plan: false,
    author: false,
    run: false,
    analyse: false,
    govern: false,
  }));

  // Hydrate from localStorage post-mount; force expand the active
  // section without writing back (so user can still collapse it
  // manually next time).
  useEffect(() => {
    const next: Record<SectionKey, boolean> = { ...collapsedMap };
    for (const key of sections) {
      try {
        const stored = window.localStorage.getItem(`${SECTION_STORAGE_PREFIX}${key}-collapsed`);
        if (stored === '1') next[key] = true;
      } catch {
        /* ignore */
      }
    }
    if (activeSection && activeSection !== 'top') {
      next[activeSection] = false;
    }
    setCollapsedMap(next);
    // Intentionally only re-run when activeSection changes; reading
    // collapsedMap inside the effect would create a stale-closure +
    // infinite-loop hazard. The set-state callback variant isn't
    // useful here because we ALSO need to read localStorage.
  }, [activeSection]);

  const toggleSection = useCallback((key: SectionKey) => {
    setCollapsedMap((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(
          `${SECTION_STORAGE_PREFIX}${key}-collapsed`,
          next[key] ? '1' : '0',
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Build the Knowledge Base href dynamically (project-scoped).
  const kbHref = projectKeyLower ? `/projects/${projectKeyLower}/kb` : '/';

  // ── Top items (Home — no section header) ──
  const topItems: NavItem[] = [
    { id: 'home', label: 'Home', href: '/home', icon: Home, tone: 'home', section: 'top' },
  ];

  // ── PLAN ──
  const planItems: NavItem[] = [
    {
      id: 'requirements',
      label: 'Requirements',
      href: '/requirements',
      icon: FileText,
      tone: 'info',
      count: '142',
      section: 'plan',
    },
    {
      id: 'test-plans-cycles',
      label: 'Test Plans & Cycles',
      href: '/',
      icon: Calendar,
      tone: 'primary',
      disabled: true,
      section: 'plan',
    },
    {
      id: 'test-cases',
      label: 'Test Cases',
      href: '/',
      icon: CheckSquare,
      tone: 'pass',
      count: '1,284',
      disabled: true,
      section: 'plan',
    },
  ];

  // ── AUTHOR ──
  const authorItems: NavItem[] = [
    {
      id: 'test-suites',
      label: 'Test Suites',
      href: '/',
      icon: LayoutGrid,
      tone: 'warn',
      disabled: true,
      section: 'author',
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge Base',
      href: kbHref,
      icon: Bookmark,
      tone: 'secondary',
      count: '1.2K chunks',
      disabled: !projectKeyLower && active !== 'knowledge-base',
      section: 'author',
    },
    {
      id: 'agents', // reusing id — Automation Studio is M3+ feature; placeholder
      label: 'Automation Studio',
      href: '/',
      icon: Zap,
      tone: 'disabled',
      pill: 'v1.5',
      disabled: true,
      section: 'author',
    },
    {
      id: 'integrations', // placeholder id for Data & Mocks
      label: 'Data & Mocks',
      href: '/',
      icon: Database,
      tone: 'disabled',
      pill: 'v1.5',
      disabled: true,
      section: 'author',
    },
  ];

  // ── RUN ──
  const runItems: NavItem[] = [
    {
      id: 'runs-sessions',
      label: 'Runs & Sessions',
      href: '/',
      icon: Play,
      tone: 'primary',
      count: '3',
      disabled: true,
      section: 'run',
    },
    {
      id: 'environments',
      label: 'Environments',
      href: '/',
      icon: Server,
      tone: 'info',
      disabled: true,
      section: 'run',
    },
  ];

  // ── ANALYSE ──
  const analyseItems: NavItem[] = [
    {
      id: 'run-results',
      label: 'Run Results',
      href: '/',
      icon: BarChart3,
      tone: 'info',
      disabled: true,
      section: 'analyse',
    },
    {
      id: 'executive-dashboard',
      label: 'Executive Dashboard',
      href: '/',
      icon: LayoutDashboard,
      tone: 'secondary',
      disabled: true,
      section: 'analyse',
    },
    {
      id: 'defects-failures',
      label: 'Defects / Failures',
      href: '/',
      icon: AlertTriangle,
      tone: 'fail',
      count: '14',
      disabled: true,
      section: 'analyse',
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/',
      icon: FileBarChart,
      tone: 'warn',
      disabled: true,
      section: 'analyse',
    },
  ];

  // ── GOVERN ──
  const governItems: NavItem[] = [
    {
      id: 'agents',
      label: 'Agents',
      href: '/',
      icon: Bot,
      tone: 'secondary',
      disabled: true,
      section: 'govern',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      href: '/',
      icon: Plug,
      tone: 'info',
      disabled: true,
      section: 'govern',
    },
    {
      id: 'users-roles',
      label: 'Users & Roles',
      href: '/admin/users',
      icon: Users,
      tone: 'home',
      section: 'govern',
    },
    {
      id: 'settings-audit',
      label: 'Settings & Audit',
      href: '/admin/settings',
      icon: Settings,
      tone: 'home',
      section: 'govern',
    },
  ];

  return (
    <nav
      className={['flex flex-col', isCollapsed ? 'gap-2 px-1.5 py-2' : 'gap-1 px-3 py-2'].join(' ')}
      aria-label="Workspace navigation links"
    >
      {/* Top — Home (no section header) */}
      {topItems.map((item) => (
        <NavLinkRow
          key={item.id}
          item={item}
          active={active === item.id}
          isCollapsed={isCollapsed}
        />
      ))}

      {/* PLAN section */}
      <NavSection
        title="Plan"
        sectionKey="plan"
        isCollapsed={isCollapsed}
        sectionCollapsed={collapsedMap.plan}
        onToggleSection={() => toggleSection('plan')}
      >
        {planItems.map((item) => (
          <NavLinkRow
            key={item.id}
            item={item}
            active={active === item.id}
            isCollapsed={isCollapsed}
          />
        ))}
      </NavSection>

      {/* AUTHOR section */}
      <NavSection
        title="Author"
        sectionKey="author"
        isCollapsed={isCollapsed}
        sectionCollapsed={collapsedMap.author}
        onToggleSection={() => toggleSection('author')}
      >
        {authorItems.map((item) => (
          <NavLinkRow
            key={`${item.section}-${item.label}`}
            item={item}
            active={active === item.id}
            isCollapsed={isCollapsed}
          />
        ))}
      </NavSection>

      {/* RUN section */}
      <NavSection
        title="Run"
        sectionKey="run"
        isCollapsed={isCollapsed}
        sectionCollapsed={collapsedMap.run}
        onToggleSection={() => toggleSection('run')}
      >
        {runItems.map((item) => (
          <NavLinkRow
            key={item.id}
            item={item}
            active={active === item.id}
            isCollapsed={isCollapsed}
          />
        ))}
      </NavSection>

      {/* ANALYSE section */}
      <NavSection
        title="Analyse"
        sectionKey="analyse"
        isCollapsed={isCollapsed}
        sectionCollapsed={collapsedMap.analyse}
        onToggleSection={() => toggleSection('analyse')}
      >
        {analyseItems.map((item) => (
          <NavLinkRow
            key={item.id}
            item={item}
            active={active === item.id}
            isCollapsed={isCollapsed}
          />
        ))}
      </NavSection>

      {/* GOVERN section */}
      <NavSection
        title="Govern"
        sectionKey="govern"
        isCollapsed={isCollapsed}
        sectionCollapsed={collapsedMap.govern}
        onToggleSection={() => toggleSection('govern')}
      >
        {governItems.map((item) => (
          <NavLinkRow
            key={`govern-${item.label}`}
            item={item}
            active={active === item.id}
            isCollapsed={isCollapsed}
          />
        ))}
      </NavSection>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// NavSection — collapsible section header with chevron + body
// ---------------------------------------------------------------------------

function NavSection({
  title,
  sectionKey,
  isCollapsed,
  sectionCollapsed,
  onToggleSection,
  children,
}: {
  title: string;
  sectionKey: SectionKey;
  isCollapsed: boolean;
  sectionCollapsed: boolean;
  onToggleSection: () => void;
  children: ReactNode;
}) {
  // In collapsed-rail mode hide the title row entirely (matches F15
  // v2.html [data-rail="collapsed"] .nav-section{visibility:hidden}).
  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-1" aria-label={`${title} section`}>
        <span aria-hidden="true" className="block h-2" />
        <div className="flex flex-col gap-1">{children}</div>
      </div>
    );
  }

  const bodyId = `nav-section-${sectionKey}-body`;

  return (
    <div className="flex flex-col gap-0.5" aria-label={`${title} section`}>
      <button
        type="button"
        onClick={onToggleSection}
        aria-expanded={sectionCollapsed ? 'false' : 'true'}
        aria-controls={bodyId}
        className="mx-1 mb-1 mt-3 flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-2 pb-1.5 pt-2 text-left transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          {title}
        </span>
        <ChevronDown
          size={11}
          aria-hidden="true"
          className={[
            'shrink-0 text-[var(--text-tertiary)] transition-transform duration-200',
            sectionCollapsed ? '-rotate-90' : '',
          ].join(' ')}
        />
      </button>

      {/* Body — uses max-height + opacity transition. max-height: 2000px
          when expanded (F15 v2 line 188 — large enough to never
          truncate); 0 when collapsed. */}
      <div
        id={bodyId}
        className="flex flex-col gap-1 overflow-hidden transition-all duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: sectionCollapsed ? '0px' : '2000px',
          opacity: sectionCollapsed ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NavLinkRow — one row of the rail. Renders the colored icon chip,
// label, optional count, optional pill.
// ---------------------------------------------------------------------------

function NavLinkRow({
  item,
  active,
  isCollapsed,
}: {
  item: NavItem;
  active: boolean;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;
  const Tag = (item.disabled ? 'button' : Link) as React.ElementType;
  const tagProps = item.disabled
    ? { type: 'button' as const, disabled: true }
    : { href: item.href };
  // Canonical F15 v2 HTML L181-201 (Hard Rule 14): `.nav-item.disabled`
  // affects text color + opacity + cursor ONLY. The colored icon chip's
  // `data-tone` MUST stay (visual identity, not status). The exception
  // is items whose intrinsic tone IS 'disabled' (e.g. Automation Studio
  // v1.5 placeholder) — those render the disabled tone style.
  const chipStyle = toneStyle(item.tone);
  const countColor =
    item.tone === 'fail' && item.count
      ? 'var(--fail)'
      : active
        ? 'var(--secondary)'
        : 'var(--text-tertiary)';

  return (
    <Tag
      {...tagProps}
      aria-current={active ? 'page' : undefined}
      title={isCollapsed ? item.label : undefined}
      data-label={item.label}
      data-tone={item.tone}
      className={[
        // text-left + items-start text-alignment defeat any inherited
        // text-center cascade from parent section containers (canonical
        // F15 v2 L181 uses no text-align; safe-default to start).
        'group relative flex items-center gap-2.5 rounded-md text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
        isCollapsed ? 'justify-center px-1.5 py-1.5' : 'px-2.5 py-2',
        active
          ? 'bg-[rgba(167,139,250,0.10)] font-medium text-[var(--text-primary)]'
          : item.disabled
            ? 'cursor-not-allowed text-[var(--text-disabled)] opacity-55'
            : 'text-[var(--text-secondary)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--secondary)]"
        />
      )}

      {/* Colored icon chip — F15 v2.html .nav-icon */}
      <span
        aria-hidden="true"
        className={[
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-transform duration-200',
          'group-hover:scale-105',
          active ? 'shadow-[0_0_0_1px_currentColor_inset]' : '',
        ].join(' ')}
        style={chipStyle}
      >
        <Icon size={14} aria-hidden="true" />
      </span>

      {/* Label + optional count/pill (hidden in collapsed mode) */}
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.count && (
            <span
              className="ml-auto font-mono text-[11px]"
              style={{ color: countColor, fontVariantNumeric: 'tabular-nums' }}
            >
              {item.count}
            </span>
          )}
          {item.pill && (
            <span
              className="ml-auto rounded-[3px] border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em]"
              style={{
                background: 'var(--raised)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
            >
              {item.pill}
            </span>
          )}
        </>
      )}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// RailFoot — fixed bottom username block (Gap 4 truncation fix).
// ---------------------------------------------------------------------------

function RailFoot({
  meName,
  meInitials,
  meRoleLabel,
  isCollapsed,
}: {
  meName: string;
  meInitials: string;
  meRoleLabel: string;
  isCollapsed: boolean;
}) {
  return (
    <div
      data-canonical-section="rail-foot"
      className={[
        'shrink-0 border-t border-[var(--border-subtle)] py-3',
        isCollapsed ? 'px-1.5' : 'px-3',
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)]',
          isCollapsed ? 'justify-center p-1.5' : 'px-2.5 py-2',
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
            <span className="truncate text-[12.5px] font-semibold text-[var(--text-primary)]">
              {meName}
            </span>
            <span
              className="truncate font-mono text-[9.5px] font-semibold uppercase tracking-[0.05em]"
              style={{ color: 'var(--secondary)' }}
            >
              {meRoleLabel}
            </span>
          </div>
        )}
        {!isCollapsed && (
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="shrink-0 text-[var(--text-tertiary)]"
          />
        )}
      </div>
    </div>
  );
}
