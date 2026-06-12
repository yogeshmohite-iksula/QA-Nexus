// Canonical topbar widgets for AdminShell.
//
// Source: _SHELL Developer Handoff.md §4 (Sun 2026-06-07 canonical).
// All 7 interactive topbar elements live here so AdminShell stays slim:
//
//   - ProjectSwitcher  (dropdown, popover id: 'project-switcher')
//   - Search           (dropdown + ⌘K shortcut, popover id: 'search')
//   - QuickCreate      (dropdown, popover id: 'quick-create')
//   - Notifications    (dropdown + unread badge, popover id: 'notifications')
//   - ThemeToggle      (direct click — flips html[data-theme], persists localStorage)
//   - ModeToggle       (3-segment control — sets app.dataset.mode, persists localStorage)
//   - UserMenu         (dropdown, popover id: 'user-menu')
//
// All popovers go through usePopoverManager() (one-at-a-time + outside-click + ESC).
//
// Hard Rule 17 (verbatim strings): nav item labels mirror what the rail renders
// so the search index stays consistent. Project list verbatim from
// CLAUDE.md "Other Iksula projects" section. Notification sample text verbatim
// from canonical _SHELL Topbar + Left Rail.html.

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Keyboard,
  Lock,
  LogOut,
  Moon,
  Play,
  Plus,
  Search as SearchIcon,
  Settings,
  Sparkles,
  Sun,
  TriangleAlert,
  User,
  CheckSquare,
} from 'lucide-react';

import { usePopoverManager, useClickOutside } from './use-popover-manager';
import {
  getSwitcherProjects,
  PROJECTS_FALLBACK,
  type SwitcherProject,
} from '@/lib/api/projects-api';
import { authClient } from '@/lib/auth/client';

// =========================================================================
// SHARED
// =========================================================================

/** Shared dropdown panel wrapper. Absolute positioning with right anchor by
 *  default; pass align="left" to anchor by the left edge of the parent button. */
function PopoverPanel({
  align = 'right',
  width,
  children,
}: {
  align?: 'left' | 'right';
  width?: number | string;
  children: ReactNode;
}) {
  return (
    <div
      role="menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        [align]: 0,
        width,
        background: 'var(--raised)',
        border: '1px solid var(--border-strong)',
        borderRadius: 10,
        boxShadow: '0 16px 40px -12px rgba(0,0,0,0.55)',
        zIndex: 1000,
        padding: 6,
        animation: 'popIn 140ms ease-out',
      }}
    >
      {children}
    </div>
  );
}

// =========================================================================
// 1. PROJECT SWITCHER
// =========================================================================

// Project list now comes from getSwitcherProjects() (Option B, F09 wiring):
// canned PROJECTS_FALLBACK renders instantly, then a /api/projects fetch
// swaps in real data on success. Pre-seed (empty) / error → fallback stays.
type ProjectKey = string;

const PROJECT_LS_KEY = 'qa-nexus.project';

export function ProjectSwitcher() {
  const { isOpen, toggle, close } = usePopoverManager();
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Seed with canned fallback so there's never an empty/loading flash.
  const [projects, setProjects] = useState<SwitcherProject[]>(PROJECTS_FALLBACK);
  const [selected, setSelected] = useState<ProjectKey>('RET');
  const open = isOpen('project-switcher');

  // F09 wiring: fetch real workspace projects on mount; keep fallback on
  // empty/error (getSwitcherProjects never throws). Runs once.
  useEffect(() => {
    let alive = true;
    void getSwitcherProjects().then((list) => {
      if (alive && list.length > 0) setProjects(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Hydrate selection from localStorage once mounted.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROJECT_LS_KEY);
      if (stored && projects.some((p) => p.key === stored)) setSelected(stored);
    } catch {
      /* ignore */
    }
  }, [projects]);

  // Mirror to document for downstream CSS / page hooks.
  useEffect(() => {
    document.documentElement.setAttribute('data-project', selected);
  }, [selected]);

  useClickOutside(rootRef, close, open);

  const current = projects.find((p) => p.key === selected) ?? projects[0] ?? PROJECTS_FALLBACK[0];

  function pick(key: ProjectKey) {
    setSelected(key);
    try {
      localStorage.setItem(PROJECT_LS_KEY, key);
    } catch {
      /* ignore */
    }
    close();
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }} className="hidden sm:inline-flex">
      <button
        type="button"
        aria-label={`Switch project (${projects.length} projects)`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => toggle('project-switcher')}
        style={{ borderRadius: '6px' }}
        className="inline-flex h-9 shrink-0 items-center gap-2 border border-[var(--border-subtle)] bg-[var(--raised)] px-2.5 text-[13px] text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <span
          aria-hidden="true"
          className="font-display inline-flex h-[18px] w-[18px] items-center justify-center text-[9px] font-bold text-[var(--primary-ink)]"
          style={{
            borderRadius: '4px',
            background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)',
          }}
        >
          {current.key.slice(0, 2)}
        </span>
        <span className="font-medium">{current.name}</span>
        <span aria-hidden="true" className="font-mono text-[11px] text-[var(--text-tertiary)]">
          · {current.branch}
        </span>
        <ChevronDown size={12} aria-hidden="true" className="text-[var(--text-tertiary)]" />
      </button>

      {open && (
        <PopoverPanel align="left" width={340}>
          <div
            className="flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span>Switch project</span>
            <span className="font-mono">{projects.length} projects</span>
          </div>
          <ul className="mt-1 flex flex-col gap-0.5">
            {projects.map((p) => {
              const isSel = p.key === selected;
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSel}
                    onClick={() => pick(p.key)}
                    style={{
                      borderRadius: 6,
                      background: isSel ? 'var(--primary-soft)' : 'transparent',
                    }}
                    className="flex w-full items-center gap-2.5 px-2 py-2 text-left text-[12.5px] text-[var(--text-primary)] hover:bg-[var(--overlay)]"
                  >
                    <span
                      aria-hidden="true"
                      className="font-display inline-flex h-[22px] w-[22px] items-center justify-center text-[10px] font-bold text-[var(--primary-ink)]"
                      style={{
                        borderRadius: '5px',
                        background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)',
                      }}
                    >
                      {p.key.slice(0, 2)}
                    </span>
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
                      {p.key}
                    </span>
                    <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
                      · {p.branch}
                    </span>
                    {isSel && (
                      <Check size={14} aria-hidden="true" className="text-[var(--primary)]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-2 text-left text-[12.5px] font-medium text-[var(--primary)] hover:bg-[var(--overlay)]"
              style={{ borderRadius: 6 }}
              onClick={close}
            >
              <Plus size={14} aria-hidden="true" /> New project
            </button>
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}

// =========================================================================
// 2. SEARCH (⌘K)
// =========================================================================

/** Nav search index — mirrors the rail's nav structure so search results
 *  navigate to the same routes. Per handoff §4 ("Live-filters all nav items
 *  as you type, grouped by section"). */
interface SearchItem {
  label: string;
  href: string;
  group: 'GENERAL' | 'PLAN' | 'AUTHOR' | 'RUN' | 'ANALYSE' | 'GOVERN';
}
const SEARCH_INDEX: SearchItem[] = [
  { label: 'Home', href: '/home', group: 'GENERAL' },
  { label: 'Projects', href: '/projects', group: 'GENERAL' },
  { label: 'Requirements', href: '/requirements', group: 'PLAN' },
  { label: 'Test Plans & Cycles', href: '/test-plans-cycles', group: 'PLAN' },
  { label: 'Test Cases', href: '/test-cases', group: 'PLAN' },
  { label: 'Test Suites', href: '/test-suites', group: 'AUTHOR' },
  { label: 'Knowledge Base', href: '/projects/ret/kb', group: 'AUTHOR' },
  { label: 'Runs & Sessions', href: '/projects/ret/runs', group: 'RUN' },
  { label: 'Environments', href: '/environments', group: 'RUN' },
  { label: 'Run Results', href: '/projects/ret/results', group: 'ANALYSE' },
  { label: 'Defects / Failures', href: '/projects/ret/defects', group: 'ANALYSE' },
  { label: 'Reports', href: '/projects/ret/reports', group: 'ANALYSE' },
  { label: 'Executive Dashboard', href: '/dashboard/executive', group: 'ANALYSE' },
  { label: 'Agents', href: '/admin/agents', group: 'GOVERN' },
  { label: 'Users & Roles', href: '/admin/users', group: 'GOVERN' },
  { label: 'Settings & Audit', href: '/admin/settings', group: 'GOVERN' },
];

export function Search() {
  const router = useRouter();
  const { isOpen, open, close } = usePopoverManager();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const opened = isOpen('search');

  // ⌘K / Ctrl-K global shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open('search');
        setTimeout(() => inputRef.current?.focus(), 30);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useClickOutside(rootRef, close, opened);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX;
    return SEARCH_INDEX.filter((i) => i.label.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    for (const item of results) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    }
    return map;
  }, [results]);

  function pick(href: string) {
    close();
    setQuery('');
    router.push(href);
  }

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative' }}
      className="hidden flex-1 justify-center xl:flex"
    >
      <button
        type="button"
        aria-label="Search (⌘K)"
        aria-haspopup="dialog"
        aria-expanded={opened}
        onClick={() => {
          open('search');
          setTimeout(() => inputRef.current?.focus(), 30);
        }}
        style={{ borderRadius: '6px' }}
        className="flex h-9 w-full max-w-[520px] items-center gap-2 border border-[var(--border-subtle)] bg-[var(--raised)] px-2.5 text-[13px] text-[var(--text-tertiary)]"
      >
        <SearchIcon size={14} aria-hidden="true" />
        <span className="flex-1 truncate text-left">Search everything…</span>
        <kbd
          style={{ borderRadius: '4px' }}
          className="border border-[var(--border-subtle)] bg-[var(--base)] px-1 py-0 font-mono text-[10.5px] text-[var(--text-tertiary)]"
        >
          ⌘K
        </kbd>
      </button>

      {opened && (
        <PopoverPanel align="left" width="100%">
          <div
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
            className="flex items-center gap-2 px-2 py-1.5"
          >
            <SearchIcon size={14} aria-hidden="true" className="text-[var(--text-tertiary)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) pick(results[0].href);
              }}
              placeholder="Type to filter nav…"
              className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none"
            />
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
                No results for &ldquo;{query}&rdquo;
                <div className="mt-1 text-[11px]">Try: requirements, test cases, agents</div>
              </div>
            ) : (
              [...grouped.entries()].map(([group, items]) => (
                <div key={group} className="mt-2">
                  <div className="px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    {group}
                  </div>
                  <ul>
                    {items.map((item) => (
                      <li key={item.href}>
                        <button
                          type="button"
                          onClick={() => pick(item.href)}
                          style={{ borderRadius: 6 }}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[12.5px] text-[var(--text-primary)] hover:bg-[var(--overlay)]"
                        >
                          <ChevronRight
                            size={12}
                            aria-hidden="true"
                            className="text-[var(--text-tertiary)]"
                          />
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}

// =========================================================================
// 3. QUICK CREATE (+)
// =========================================================================

const CREATE_ITEMS = [
  { icon: FileText, label: 'New requirement', href: '/requirements/new', tone: 'var(--info)' },
  { icon: CheckSquare, label: 'New test case', href: '/test-cases/new', tone: 'var(--pass)' },
  {
    icon: Sparkles,
    label: 'Generate with Composer',
    href: '/test-cases/generate',
    tone: 'var(--secondary)',
  },
  { icon: Play, label: 'Start a test run', href: '/projects/ret/runs/new', tone: 'var(--primary)' },
  {
    icon: TriangleAlert,
    label: 'Log a defect',
    href: '/projects/ret/defects/new',
    tone: 'var(--fail)',
  },
];

export function QuickCreate() {
  const { isOpen, toggle, close } = usePopoverManager();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const opened = isOpen('quick-create');
  useClickOutside(rootRef, close, opened);

  return (
    <div ref={rootRef} style={{ position: 'relative' }} className="inline-flex">
      <IconButton
        aria-label="Create new"
        aria-expanded={opened}
        onClick={() => toggle('quick-create')}
      >
        <Plus size={16} aria-hidden="true" />
      </IconButton>
      {opened && (
        <PopoverPanel align="right" width={260}>
          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
            Create new
          </div>
          <ul>
            {CREATE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={close}
                    style={{ borderRadius: 6 }}
                    className="flex w-full items-center gap-2.5 px-2 py-2 text-[13px] text-[var(--text-primary)] hover:bg-[var(--overlay)]"
                  >
                    <span style={{ color: item.tone }}>
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </PopoverPanel>
      )}
    </div>
  );
}

// =========================================================================
// 4. NOTIFICATIONS
// =========================================================================

interface Notif {
  id: string;
  text: ReactNode;
  age: string;
  unreadInit: boolean;
}
const NOTIFS: Notif[] = [
  {
    id: 'n1',
    text: (
      <>
        Composer generated <b>5 test cases</b> for REQ-142 · awaiting your review
      </>
    ),
    age: '2 min ago',
    unreadInit: true,
  },
  {
    id: 'n2',
    text: (
      <>
        Sherlock completed RCA for <b>DEF-512</b> · confidence 0.81
      </>
    ),
    age: '18 min ago',
    unreadInit: true,
  },
  {
    id: 'n3',
    text: (
      <>
        Akshay Panchal approved <b>R-2026-04-PaymentV2</b> release readiness
      </>
    ),
    age: '1 h ago',
    unreadInit: true,
  },
  {
    id: 'n4',
    text: <>Curator flagged a duplicate pair in Returns suite</>,
    age: '3 h ago',
    unreadInit: false,
  },
  {
    id: 'n5',
    text: (
      <>
        Test run <b>TR-2026-06-04-#241</b> finished · 98.2% pass-rate
      </>
    ),
    age: '6 h ago',
    unreadInit: false,
  },
];

export function Notifications() {
  const { isOpen, toggle, close } = usePopoverManager();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const opened = isOpen('notifications');
  const [unread, setUnread] = useState<Set<string>>(
    () => new Set(NOTIFS.filter((n) => n.unreadInit).map((n) => n.id)),
  );
  useClickOutside(rootRef, close, opened);

  function markAllRead() {
    setUnread(new Set());
  }
  function markOne(id: string) {
    setUnread((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }} className="inline-flex">
      <IconButton
        aria-label={`Notifications (${unread.size} unread)`}
        aria-expanded={opened}
        onClick={() => toggle('notifications')}
      >
        <span className="relative inline-flex">
          <Bell size={16} aria-hidden="true" />
          {unread.size > 0 && (
            <span
              aria-hidden="true"
              className="font-display absolute -right-1.5 -top-1.5 inline-flex h-[14px] min-w-[14px] items-center justify-center px-[3px] text-[9px] font-bold leading-none text-white"
              style={{
                borderRadius: 999,
                background: 'var(--admin-red)',
              }}
            >
              {unread.size}
            </span>
          )}
        </span>
      </IconButton>

      {opened && (
        <PopoverPanel align="right" width={380}>
          <div
            className="flex items-center justify-between px-2 py-1.5"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">
              Notifications
            </span>
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--primary)]"
            >
              Mark all read
            </button>
          </div>
          <ul style={{ maxHeight: 380, overflowY: 'auto' }}>
            {NOTIFS.map((n) => {
              const isUnread = unread.has(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markOne(n.id)}
                    style={{
                      borderRadius: 6,
                      background: isUnread ? 'var(--primary-soft)' : 'transparent',
                    }}
                    className="flex w-full items-start gap-2 px-2 py-2 text-left hover:bg-[var(--overlay)]"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block h-1.5 w-1.5 shrink-0"
                      style={{
                        borderRadius: 999,
                        background: isUnread ? 'var(--primary)' : 'transparent',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] leading-[18px] text-[var(--text-primary)]">
                        {n.text}
                      </p>
                      <p className="mt-0.5 font-mono text-[10.5px] text-[var(--text-tertiary)]">
                        {n.age}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div
            style={{ borderTop: '1px solid var(--border-subtle)' }}
            className="flex items-center justify-center px-2 py-2"
          >
            <Link
              href="/admin/settings"
              onClick={close}
              className="text-[12px] font-medium text-[var(--primary)] hover:underline"
            >
              View all activity →
            </Link>
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}

// =========================================================================
// 5. THEME TOGGLE (direct click, no popover)
// =========================================================================

const THEME_LS_KEY = 'qa-nexus.theme';

/** Returns current theme + setter. Read once on mount, persist on change. */
export function useTheme(): [theme: 'dark' | 'light', toggle: () => void] {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem(THEME_LS_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggle];
}

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  return (
    <IconButton
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      onClick={toggle}
    >
      {theme === 'light' ? (
        <Sun size={16} aria-hidden="true" />
      ) : (
        <Moon size={16} aria-hidden="true" />
      )}
    </IconButton>
  );
}

// =========================================================================
// 6. MODE TOGGLE (3-segment, no popover)
// =========================================================================

const MODE_LS_KEY = 'qa-nexus.mode';
type Mode = 'operate' | 'review' | 'prove';

export function ModeToggle() {
  const [mode, setMode] = useState<Mode>('operate');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MODE_LS_KEY) as Mode | null;
      if (stored && ['operate', 'review', 'prove'].includes(stored)) setMode(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    try {
      localStorage.setItem(MODE_LS_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  function tab(value: Mode, label: ReactNode) {
    const isActive = mode === value;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => setMode(value)}
        style={{ borderRadius: '4px' }}
        className={
          'inline-flex h-7 items-center gap-1 px-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors ' +
          (isActive
            ? 'bg-[var(--overlay)] text-[var(--text-primary)]'
            : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]')
        }
      >
        {label}
      </button>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Mode"
      style={{ borderRadius: '6px' }}
      className="hidden h-8 shrink-0 items-center border border-[var(--border-subtle)] bg-[var(--raised)] p-0.5 xl:inline-flex"
    >
      {tab('operate', 'Operate')}
      {tab('review', 'Review')}
      {tab(
        'prove',
        <>
          <Lock size={9} aria-hidden="true" /> Prove
        </>,
      )}
    </div>
  );
}

// =========================================================================
// 7. USER MENU
// =========================================================================

interface UserMenuProps {
  meName: string;
  meFullName: string;
  meEmail: string;
  meInitials: string;
  meRoleLabel: string;
  isAdmin: boolean;
}

export function UserMenu({
  meName,
  meFullName,
  meEmail,
  meInitials,
  meRoleLabel,
  isAdmin,
}: UserMenuProps) {
  const { isOpen, toggle, close } = usePopoverManager();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [theme, toggleTheme] = useTheme();
  const opened = isOpen('user-menu');
  useClickOutside(rootRef, close, opened);

  async function signOut() {
    close();
    try {
      // Finding H: the old `fetch('/api/auth/sign-out')` hit the FE origin
      // (pages.dev → 405) and never revoked the server session. authClient
      // targets the API origin (baseURL=onrender, basePath=/auth →
      // …/auth/sign-out) with credentials, so the session IS revoked + the
      // cookie cleared server-side.
      await authClient.signOut();
    } catch {
      /* ignore network failure — still nav to sign-in */
    }
    router.push('/sign-in');
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }} className="inline-flex">
      <button
        type="button"
        aria-label={`Signed in as ${meName}, ${meRoleLabel}`}
        aria-expanded={opened}
        onClick={() => toggle('user-menu')}
        style={{ borderRadius: '999px' }}
        className="flex h-9 shrink-0 items-center gap-2 border border-[var(--border-subtle)] bg-[var(--raised)] py-0.5 pl-0.5 pr-2.5 transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[var(--primary-ink)]"
          style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
        >
          {meInitials}
        </span>
        <span className="hidden text-[12.5px] font-medium text-[var(--text-primary)] md:inline">
          {meName}
        </span>
        {isAdmin && (
          <span
            className="hidden rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] sm:inline"
            style={{
              background: 'var(--admin-soft)',
              borderColor: 'var(--admin-line)',
              color: 'var(--admin-red)',
            }}
          >
            Admin
          </span>
        )}
      </button>

      {opened && (
        <PopoverPanel align="right" width={280}>
          <div
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
            className="flex items-center gap-2.5 px-2 py-2"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-bold text-[var(--primary-ink)]"
              style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #A78BFA 120%)' }}
            >
              {meInitials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                {meFullName}
              </div>
              <div className="truncate font-mono text-[11px] text-[var(--text-tertiary)]">
                {meEmail}
              </div>
            </div>
            {isAdmin && (
              <span
                className="rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{
                  background: 'var(--admin-soft)',
                  borderColor: 'var(--admin-line)',
                  color: 'var(--admin-red)',
                }}
              >
                Admin
              </span>
            )}
          </div>
          <ul className="py-1">
            <MenuRow icon={User} label="Profile & preferences" onClick={close} href="/profile" />
            <MenuRow
              icon={Settings}
              label="Account settings"
              onClick={close}
              href="/settings/account"
            />
            <button
              type="button"
              onClick={toggleTheme}
              style={{ borderRadius: 6 }}
              className="flex w-full items-center gap-2 px-2 py-2 text-left text-[12.5px] text-[var(--text-primary)] hover:bg-[var(--overlay)]"
            >
              {theme === 'light' ? (
                <Moon size={14} aria-hidden="true" />
              ) : (
                <Sun size={14} aria-hidden="true" />
              )}
              <span className="flex-1">Switch to {theme === 'light' ? 'dark' : 'light'} mode</span>
            </button>
            <MenuRow
              icon={Keyboard}
              label="Keyboard shortcuts"
              kbd="⌘/"
              onClick={close}
              href="/help/shortcuts"
            />
            <MenuRow icon={HelpCircle} label="Help & docs" onClick={close} href="/help" />
          </ul>
          <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={signOut}
              style={{ borderRadius: 6 }}
              className="flex w-full items-center gap-2 px-2 py-2 text-left text-[12.5px] font-medium text-[var(--fail)] hover:bg-[var(--fail-soft)]"
            >
              <LogOut size={14} aria-hidden="true" /> Sign out
            </button>
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  href,
  kbd,
  onClick,
}: {
  icon: typeof User;
  label: string;
  href: string;
  kbd?: string;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        style={{ borderRadius: 6 }}
        className="flex w-full items-center gap-2 px-2 py-2 text-[12.5px] text-[var(--text-primary)] hover:bg-[var(--overlay)]"
      >
        <Icon size={14} aria-hidden="true" />
        <span className="flex-1">{label}</span>
        {kbd && (
          <kbd
            className="border px-1 py-0 font-mono text-[10px] text-[var(--text-tertiary)]"
            style={{
              borderRadius: 3,
              borderColor: 'var(--border-subtle)',
              background: 'var(--base)',
            }}
          >
            {kbd}
          </kbd>
        )}
      </Link>
    </li>
  );
}

// =========================================================================
// Shared icon button used by Plus / Bell / Theme
// =========================================================================

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}
export function IconButton({ children, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      style={{ borderRadius: '6px' }}
      className={
        'inline-flex h-9 w-9 shrink-0 items-center justify-center border border-transparent text-[var(--text-secondary)] transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] ' +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}
