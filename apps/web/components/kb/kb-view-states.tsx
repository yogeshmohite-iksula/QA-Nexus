// F15 KB view-state primitives — loading / empty / error / idle.

'use client';

import { Loader2, AlertCircle, FileSearch, Search } from 'lucide-react';

export function KbResultsLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Searching knowledge base"
      className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--base)] p-4"
    >
      <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
        <Loader2 size={14} aria-hidden="true" className="animate-spin" />
        <span className="text-[12.5px]">Searching chunks…</span>
      </div>
      <ul role="list" className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <li
            key={i}
            aria-hidden="true"
            className="flex flex-col gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--raised)] p-3"
          >
            <div className="flex items-center gap-2">
              <span className="h-3 w-20 animate-pulse rounded bg-[var(--overlay)]" />
              <span className="h-3 w-32 animate-pulse rounded bg-[var(--overlay)]" />
            </div>
            <span className="h-2.5 w-full animate-pulse rounded bg-[var(--overlay)]" />
            <span className="h-2.5 w-5/6 animate-pulse rounded bg-[var(--overlay)]" />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface KbResultsErrorProps {
  message?: string;
  onRetry: () => void;
}

export function KbResultsError({ message, onRetry }: KbResultsErrorProps) {
  return (
    <div
      role="alert"
      className="border-[var(--fail)]/30 bg-[var(--fail)]/5 flex flex-col gap-3 rounded-xl border p-5"
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--fail)]" />
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
            Search failed
          </h3>
          <p className="text-[12.5px] leading-[18px] text-[var(--text-secondary)]">
            {message ?? 'The /api/projects/:projectId/kb/search request failed. Try again.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="border-[var(--fail)]/40 bg-[var(--fail)]/10 hover:bg-[var(--fail)]/20 inline-flex h-9 min-h-[44px] w-fit items-center justify-center rounded-md border px-3 text-[12.5px] font-semibold text-[var(--fail)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
      >
        Try again
      </button>
    </div>
  );
}

export function KbResultsEmpty({ query }: { query: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--base)] py-16 text-center"
    >
      <FileSearch size={28} aria-hidden="true" className="text-[var(--text-tertiary)]" />
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">No chunks match — yet.</p>
      <p className="max-w-[420px] text-[12.5px] text-[var(--text-tertiary)]">
        {query
          ? `Nothing in the indexed documents matches “${query}”. Try a broader query, lower the min-relevance threshold, or check the file-type / project filters.`
          : 'Start typing a query above to search across all indexed knowledge-base chunks.'}
      </p>
    </div>
  );
}

export function KbResultsIdle() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--base)] py-16 text-center"
    >
      <Search size={28} aria-hidden="true" className="text-[var(--text-tertiary)]" />
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">
        Ask the knowledge base.
      </p>
      <p className="max-w-[420px] text-[12.5px] text-[var(--text-tertiary)]">
        Search across uploaded specs, runbooks, defect RCAs, and KB articles. Semantic match by
        default; toggle off for keyword-only.
      </p>
    </div>
  );
}
