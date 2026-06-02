// F15 Knowledge Base — main orchestrator (Pattern A scaffold).
//
// Locked source: PM1_UI_v2/Redesign Frame by claude design/F15 Knowledge
// Base v2.html (desktop) + F15 Mobile Breakpoints.html (320 / 768 / 1440)
// + primitives-playground.html (slider + snap-sheet).
//
// Pattern A → B BE-gated. The `useKbSearch()` hook calls the stub
// fetcher in `lib/api/kb-api.ts`; PR #30 BE controller already returns
// the same fixture set when called against `/api/projects/:id/kb/search`.
// Day-9/10 swap-in: replace the fetcher body with a real `fetch()` per
// `kb-page.connection-pause.md`.
//
// RWD spec (F15 Mobile Breakpoints):
// - 320 px: single column, search + Semantic toggle stacked, filter
//     bottom-pinned FAB → snap-sheet (defer FAB UI to follow-up; v1
//     uses an inline disclosure), detail = full-screen Drawer.
// - 768 px: two-pane (filters inline + results column), detail = Drawer.
// - 1024 px+: three-pane split (rail · results · detail).
//
// Phase 3 retrofit compliance: rails violet, CTAs teal, 44×44 tap floor.

'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, Sliders, X } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { slugFromName } from '@/lib/project-slug';
import { useKbSearch } from '@/lib/hooks/use-kb-search';
import type { KbSearchRequest } from '@/lib/api/kb-api';
import { KbSearchBar } from './kb-search-bar';
import { KbFilterChips } from './kb-filter-chips';
import { KbMinScoreSlider } from './kb-min-score-slider';
import { KbChunkCard } from './kb-chunk-card';
import { KbChunkDetailPanel } from './kb-chunk-detail-panel';
import { KbResultsEmpty, KbResultsError, KbResultsIdle, KbResultsLoading } from './kb-view-states';

interface KbPageProps {
  projectId: string;
  projectKey: string;
  projectName: string;
}

export function KbPage(props: KbPageProps) {
  return (
    <AdminShell active="knowledge-base" projectKeyLower={slugFromName(props.projectName)}>
      <KbPageContent {...props} />
    </AdminShell>
  );
}

function KbPageContent({ projectId, projectName }: KbPageProps) {
  const [query, setQuery] = useState('refund window');
  const [semantic, setSemantic] = useState(true);
  const [minRelevance, setMinRelevance] = useState(0.3);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [detailOpenMobile, setDetailOpenMobile] = useState(false);

  const request: KbSearchRequest = useMemo(
    () => ({
      query,
      semantic,
      filters: { minRelevanceScore: minRelevance },
      sort: 'relevance',
      page: { limit: 20 },
    }),
    [query, semantic, minRelevance],
  );

  const { data, isLoading, isError, error, refetch } = useKbSearch(projectId, request);

  const chunks = data?.chunks ?? [];

  function selectChunk(id: string) {
    setSelectedChunkId(id);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setDetailOpenMobile(true);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
      {/* Page header — breadcrumb + question header. Breadcrumb style:
          lowercase labels separated by chevron icons (matches the F14
          Requirements pattern that's the canonical project-context
          breadcrumb on the M2 branch). */}
      <header className="flex flex-col gap-2">
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
              <ChevronRight size={11} className="text-[var(--text-tertiary)]" />
            </li>
            <li>
              <a
                href={`/projects/${slugFromName(projectName)}`}
                className="hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              >
                Author
              </a>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={11} className="text-[var(--text-tertiary)]" />
            </li>
            <li className="text-[var(--text-secondary)]">Knowledge Base</li>
          </ol>
        </nav>
        <h1 className="font-display text-[20px] font-bold leading-[26px] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[24px] sm:leading-[32px]">
          What does the {projectName} spec already say about this?
        </h1>
      </header>

      {/* Search row */}
      <KbSearchBar
        value={query}
        onChange={setQuery}
        semantic={semantic}
        onSemanticChange={setSemantic}
        resultCount={data?.total}
        isStubbed={data?.stubbed}
      />

      {/* Filter chips inline; min-score slider sits in the right column on lg+ */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <KbFilterChips projectName={projectName} fileTypeLabel="All" dateRangeLabel="Any time" />
          <button
            type="button"
            onClick={() => setFiltersOpenMobile((v) => !v)}
            aria-expanded={filtersOpenMobile}
            className="inline-flex h-9 min-h-[44px] w-fit items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:h-8 sm:min-h-0 lg:hidden"
          >
            <Sliders size={13} aria-hidden="true" />
            Min relevance ({minRelevance.toFixed(2)})
          </button>
        </div>
        <div className="hidden lg:block lg:w-80">
          <KbMinScoreSlider value={minRelevance} onChange={setMinRelevance} chunks={chunks} />
        </div>
        {filtersOpenMobile && (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--base)] p-4 lg:hidden">
            <KbMinScoreSlider value={minRelevance} onChange={setMinRelevance} chunks={chunks} />
          </div>
        )}
      </div>

      {/* Results + Detail — split-pane on lg+, results-only on smaller */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-6">
        <section aria-label="Search results" className="flex flex-col gap-3">
          {query.trim().length === 0 ? (
            <KbResultsIdle />
          ) : isLoading ? (
            <KbResultsLoading />
          ) : isError ? (
            <KbResultsError message={error?.message} onRetry={() => refetch()} />
          ) : chunks.length === 0 ? (
            <KbResultsEmpty query={query} />
          ) : (
            <ul role="list" className="flex flex-col gap-2.5">
              {chunks.map((c) => (
                <KbChunkCard
                  key={c.chunkId}
                  chunk={c}
                  selected={selectedChunkId === c.chunkId}
                  onClick={() => selectChunk(c.chunkId)}
                />
              ))}
            </ul>
          )}
          {data && (
            <footer className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 font-mono text-[10.5px] text-[var(--text-tertiary)]">
              <span>
                Showing {chunks.length} of {data.total}
              </span>
              <span>Search took {data.tookMs} ms</span>
            </footer>
          )}
        </section>

        {/* Detail — split-pane on lg+; rendered as Drawer on mobile via
            the conditional below */}
        <div
          aria-label="Chunk detail (split pane)"
          className="hidden overflow-hidden rounded-xl border border-[var(--border-subtle)] lg:block lg:max-h-[calc(100vh-280px)]"
        >
          <KbChunkDetailPanel
            projectId={projectId}
            chunkId={selectedChunkId}
            onSelect={selectChunk}
          />
        </div>
      </div>

      {/* Mobile detail Drawer — full-screen sheet < lg */}
      {detailOpenMobile && selectedChunkId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chunk detail"
          className="fixed inset-0 z-50 flex flex-col bg-[var(--canvas)] lg:hidden"
        >
          <KbChunkDetailPanel
            projectId={projectId}
            chunkId={selectedChunkId}
            onClose={() => setDetailOpenMobile(false)}
            onSelect={selectChunk}
          />
        </div>
      )}

      {/* Mobile filters FAB — bottom-pinned (full snap-sheet primitive
          deferred to follow-up; v1 toggles the inline disclosure above) */}
      <button
        type="button"
        onClick={() => setFiltersOpenMobile((v) => !v)}
        aria-label={filtersOpenMobile ? 'Close filters' : 'Open filters'}
        className="fixed bottom-4 right-4 z-40 inline-flex h-12 min-h-[44px] items-center gap-2 rounded-full bg-[var(--secondary)] px-4 text-[13px] font-semibold text-[var(--canvas)] shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:hidden"
      >
        {filtersOpenMobile ? (
          <X size={14} aria-hidden="true" />
        ) : (
          <Sliders size={14} aria-hidden="true" />
        )}
        {filtersOpenMobile ? 'Close' : 'Filters'}
      </button>
    </main>
  );
}
