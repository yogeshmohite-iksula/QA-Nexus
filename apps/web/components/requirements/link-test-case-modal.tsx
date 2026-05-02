// F14m2 Link Test Case Modal — overlay rendered on top of F14.
// Locked source: PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/
//   F14m2 Link Test Case Modal.html
// Mounted by /requirements/<key>/link routes.
//
// Pattern A enforcement (PM1_PRD §4 Requirements lifecycle / TB-008
// `test_case_link`) — 5 deferred markers:
// - Mount → `pattern-a:deferred:link-test-case-open`
//     { reqKey, availableCount, linkedCount }.
// - Search input → `pattern-a:deferred:link-test-case-search-change`
//     { query }.
// - Link → `pattern-a:deferred:link-test-case-link` { reqKey, tcKey }.
// - Unlink → `pattern-a:deferred:link-test-case-unlink` { reqKey, tcKey }.
// - Cancel + Esc + backdrop → `pattern-a:deferred:link-test-case-cancel`
//     { trigger: 'esc' | 'button' | 'backdrop' }.
// - ZERO fetch / useMutation / axios. Real
//   /api/requirements/:key/links POST + DELETE wires at MS0-T030.5+.
//
// UX surfaces:
// - 300 ms search debounce (Pattern A: client-only filter on the seed
//   list — no BE call).
// - Sonner success toast on link / unlink — copy adapts to the
//   action ("TC-RET-405 linked to RET-001" / "TC-RET-405 unlinked").
// - 2-column layout on lg+ (available | linked); stacks vertically on
//   mobile.

'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
import { useActiveProject } from '@/lib/contexts/ProjectContext';
import { REQUIREMENTS } from '@/lib/data/requirements';

// View-fixture seed — 12 mock TC-RET-### test cases. Real
// /api/projects/:slug/test-cases?requirementKey=... wires at MS0-T030.5+
// once BE M3 schema lands.
interface MockTestCase {
  key: string;
  title: string;
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  source: 'manual' | 'a1';
}

const MOCK_TEST_CASES: MockTestCase[] = [
  {
    key: 'TC-RET-401',
    title: 'Refund POST creates a Stripe refund',
    priority: 'High',
    source: 'manual',
  },
  {
    key: 'TC-RET-402',
    title: 'Refund POST is idempotent on charge id',
    priority: 'Highest',
    source: 'manual',
  },
  {
    key: 'TC-RET-403',
    title: 'Refund POST rejects non-Admin actor',
    priority: 'High',
    source: 'a1',
  },
  {
    key: 'TC-RET-404',
    title: 'Refund POST writes audit-log entry',
    priority: 'Medium',
    source: 'manual',
  },
  {
    key: 'TC-RET-405',
    title: 'Multi-currency refund: EUR round-trip',
    priority: 'Medium',
    source: 'a1',
  },
  {
    key: 'TC-RET-406',
    title: 'Multi-currency refund: GBP round-trip',
    priority: 'Medium',
    source: 'a1',
  },
  {
    key: 'TC-RET-407',
    title: 'Multi-currency refund: INR round-trip',
    priority: 'Medium',
    source: 'a1',
  },
  {
    key: 'TC-RET-408',
    title: 'Webhook signature mismatch is rejected',
    priority: 'Highest',
    source: 'manual',
  },
  {
    key: 'TC-RET-409',
    title: 'Webhook retry telemetry surfaces span',
    priority: 'Low',
    source: 'manual',
  },
  {
    key: 'TC-RET-410',
    title: 'Refund email template rfd_v2 renders',
    priority: 'Low',
    source: 'manual',
  },
  {
    key: 'TC-RET-411',
    title: 'Partial refund on 2-of-3 line items',
    priority: 'High',
    source: 'a1',
  },
  {
    key: 'TC-RET-412',
    title: 'Refund SLA cron alerts on overdue',
    priority: 'Lowest',
    source: 'manual',
  },
];

// 3 of the 12 are pre-linked to whatever requirement opens the modal.
const INITIAL_LINKED_KEYS = ['TC-RET-401', 'TC-RET-405', 'TC-RET-411'];

interface LinkTestCaseModalProps {
  /** Routing hook: invoked by Cancel / Esc / backdrop / successful save. */
  onClose: () => void;
  /** Requirement to link test cases against. Defaults to RET-001 for the standalone /link route. */
  reqKey?: string;
}

export function LinkTestCaseModal({ onClose, reqKey = 'RET-001' }: LinkTestCaseModalProps) {
  const titleId = useId();
  const me = useCurrentUser();
  const project = useActiveProject();

  // Resolve the parent requirement title for the header copy.
  const parentReq = useMemo(
    () => REQUIREMENTS.find((r) => r.key.toLowerCase() === reqKey.toLowerCase()),
    [reqKey],
  );

  const [linkedKeys, setLinkedKeys] = useState<string[]>(INITIAL_LINKED_KEYS);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 300 ms debounce — Pattern A: client-only filter, no BE.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput) {
        // PATTERN-A: search test cases deferred until M2 (T030.5) - real /api/projects/:slug/test-cases GET (q param)
        console.info('pattern-a:deferred:link-test-case-search-change', { query: searchInput });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    // PATTERN-A: open link-test-case modal deferred until M2 (T030.5) - fire-and-forget telemetry on mount
    console.info('pattern-a:deferred:link-test-case-open', {
      reqKey,
      workspaceId: me.workspaceId,
      projectId: project.id,
      availableCount: MOCK_TEST_CASES.length - INITIAL_LINKED_KEYS.length,
      linkedCount: INITIAL_LINKED_KEYS.length,
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // PATTERN-A: cancel link-test-case modal deferred until M2 (T030.5) - navigate back
        console.info('pattern-a:deferred:link-test-case-cancel', { trigger: 'esc' });
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [reqKey, me.workspaceId, project.id, onClose]);

  function handleCancel(trigger: 'button' | 'backdrop' = 'button') {
    // PATTERN-A: cancel link-test-case modal deferred until M2 (T030.5) - navigate back
    console.info('pattern-a:deferred:link-test-case-cancel', { trigger });
    onClose();
  }

  function handleLink(tcKey: string) {
    if (linkedKeys.includes(tcKey)) return;
    setLinkedKeys((prev) => [...prev, tcKey]);
    // PATTERN-A: link test case deferred until M2 (T030.5) - real /api/requirements/:key/links POST
    console.info('pattern-a:deferred:link-test-case-link', { reqKey, tcKey });
    toast.success(`${tcKey} linked to ${reqKey}`, {
      description: 'Real BE link mutation lands MS0-T030.5+ (Pattern A — toast wired only).',
    });
  }

  function handleUnlink(tcKey: string) {
    setLinkedKeys((prev) => prev.filter((k) => k !== tcKey));
    // PATTERN-A: unlink test case deferred until M2 (T030.5) - real /api/requirements/:key/links DELETE
    console.info('pattern-a:deferred:link-test-case-unlink', { reqKey, tcKey });
    toast.success(`${tcKey} unlinked from ${reqKey}`, {
      description: 'Real BE unlink lands MS0-T030.5+.',
    });
  }

  // Filter the available list based on the debounced search.
  const filteredAvailable = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return MOCK_TEST_CASES.filter((tc) => !linkedKeys.includes(tc.key)).filter((tc) => {
      if (!q) return true;
      return (
        tc.key.toLowerCase().includes(q) ||
        tc.title.toLowerCase().includes(q) ||
        tc.source.toLowerCase().includes(q)
      );
    });
  }, [debouncedSearch, linkedKeys]);

  const linkedRows = useMemo(
    () => MOCK_TEST_CASES.filter((tc) => linkedKeys.includes(tc.key)),
    [linkedKeys],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-stretch justify-center md:items-start md:p-6"
    >
      <button
        type="button"
        aria-label="Close link-test-case modal"
        onClick={() => handleCancel('backdrop')}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative z-10 flex w-full max-w-[1000px] flex-col overflow-hidden bg-[var(--base)] shadow-2xl md:mt-12 md:max-h-[calc(100vh-6rem)] md:rounded-xl md:border md:border-[var(--border-subtle)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <h2
              id={titleId}
              className="font-display text-[18px] font-bold leading-[24px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[20px] sm:leading-[26px]"
            >
              Link test cases
            </h2>
            <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
              {parentReq ? (
                <>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {parentReq.key}
                  </span>{' '}
                  · {parentReq.title}
                </>
              ) : (
                <>Linking to {reqKey}</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCancel('button')}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3.5 3.5l9 9M12.5 3.5l-9 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="border-b border-[var(--border-subtle)] px-5 py-3 sm:px-6">
          <label htmlFor="link-tc-search" className="sr-only">
            Search test cases
          </label>
          <div className="flex h-10 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--canvas)] px-3 text-[13px] text-[var(--text-primary)] focus-within:border-[var(--border-strong)]">
            <Search size={13} aria-hidden="true" className="text-[var(--text-tertiary)]" />
            <input
              id="link-tc-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search test cases by title, ID, or tag…"
              className="flex-1 bg-transparent text-[13px] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            />
          </div>
        </div>

        {/* 2-column body */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6 lg:flex-row lg:gap-5">
          {/* Available */}
          <section
            aria-label="Available test cases"
            className="flex flex-1 flex-col gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] p-3"
          >
            <header className="flex items-center justify-between gap-2 px-1 pb-1">
              <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                Available
                <span className="ml-1.5 text-[var(--text-secondary)]">
                  ({filteredAvailable.length})
                </span>
              </h3>
            </header>
            {filteredAvailable.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
                No test cases match this search.
              </p>
            ) : (
              <ul role="list" className="flex flex-col gap-1.5">
                {filteredAvailable.map((tc) => (
                  <TestCaseRow key={tc.key} tc={tc} action="link" onAction={handleLink} />
                ))}
              </ul>
            )}
          </section>

          {/* Linked */}
          <section
            aria-label="Linked test cases"
            className="border-[var(--primary)]/30 bg-[var(--primary)]/5 flex flex-1 flex-col gap-2 rounded-lg border p-3"
          >
            <header className="flex items-center justify-between gap-2 px-1 pb-1">
              <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
                Linked to {reqKey}
                <span className="ml-1.5 text-[var(--text-secondary)]">({linkedRows.length})</span>
              </h3>
            </header>
            {linkedRows.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
                No test cases linked yet. Pick from the left column.
              </p>
            ) : (
              <ul role="list" className="flex flex-col gap-1.5">
                {linkedRows.map((tc) => (
                  <TestCaseRow key={tc.key} tc={tc} action="unlink" onAction={handleUnlink} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-subtle)] bg-[var(--base)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span
            aria-live="polite"
            className="font-mono text-[11px] text-[var(--text-tertiary)] sm:text-left"
          >
            {linkedRows.length} {linkedRows.length === 1 ? 'test case' : 'test cases'} linked · real
            persistence lands MS0-T030.5+
          </span>
          <button
            type="button"
            onClick={() => handleCancel('button')}
            className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-md bg-[var(--primary)] px-5 text-[13px] font-semibold text-[var(--primary-ink)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test-case row (compact card with key + title + Link/Unlink button)
// ---------------------------------------------------------------------------

function TestCaseRow({
  tc,
  action,
  onAction,
}: {
  tc: MockTestCase;
  action: 'link' | 'unlink';
  onAction: (key: string) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-subtle)] bg-[var(--base)] px-3 py-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10.5px] font-semibold text-[var(--text-tertiary)]">
            {tc.key}
          </span>
          <span className="rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
            {tc.priority}
          </span>
          {tc.source === 'a1' && (
            <span className="border-[var(--secondary)]/30 bg-[var(--secondary)]/10 rounded border px-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-[var(--secondary)]">
              A1
            </span>
          )}
        </div>
        <p className="truncate text-[12.5px] text-[var(--text-primary)]">{tc.title}</p>
      </div>
      <button
        type="button"
        onClick={() => onAction(tc.key)}
        aria-label={action === 'link' ? `Link ${tc.key}` : `Unlink ${tc.key}`}
        className={
          action === 'link'
            ? 'border-[var(--primary)]/30 bg-[var(--primary)]/15 hover:bg-[var(--primary)]/25 inline-flex h-8 min-h-[44px] shrink-0 items-center rounded-md border px-2.5 text-[11.5px] font-semibold text-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:h-8 sm:min-h-0'
            : 'hover:border-[var(--fail)]/40 inline-flex h-8 min-h-[44px] shrink-0 items-center rounded-md border border-[var(--border-subtle)] px-2.5 text-[11.5px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--fail)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:h-8 sm:min-h-0'
        }
      >
        {action === 'link' ? 'Link' : 'Unlink'}
      </button>
    </li>
  );
}
