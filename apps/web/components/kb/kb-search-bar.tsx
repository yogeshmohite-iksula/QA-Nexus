// F15 KB search bar — input + Semantic toggle.
//
// Semantic ON (default): pgvector cosine similarity (BE M2 swap).
// Semantic OFF: plain ILIKE keyword match (BE M2.5 fallback).
// Both modes return the same fixture set today (Pattern A — wire shape
// stable, BE swap incoming).

'use client';

import { Search, Sparkles } from 'lucide-react';

interface KbSearchBarProps {
  value: string;
  onChange: (s: string) => void;
  semantic: boolean;
  onSemanticChange: (b: boolean) => void;
  resultCount?: number;
  isStubbed?: boolean;
}

export function KbSearchBar({
  value,
  onChange,
  semantic,
  onSemanticChange,
  resultCount,
  isStubbed,
}: KbSearchBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-11 min-h-[44px] flex-1 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[14px] text-[var(--text-primary)] focus-within:border-[var(--border-strong)] sm:h-12">
        <Search size={15} aria-hidden="true" className="text-[var(--text-tertiary)]" />
        <label htmlFor="kb-search-input" className="sr-only">
          Search the knowledge base
        </label>
        <input
          id="kb-search-input"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask a question, search a phrase, paste a section title…"
          className="flex-1 bg-transparent text-[14px] placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
        {value.length > 0 && (
          <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">
            {resultCount ?? '…'} {resultCount === 1 ? 'hit' : 'hits'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={semantic}
          onClick={() => onSemanticChange(!semantic)}
          className={[
            'inline-flex h-11 min-h-[44px] items-center gap-2 rounded-md border px-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:h-10 sm:min-h-0',
            semantic
              ? 'bg-[var(--secondary)]/15 border-[var(--secondary)] text-[var(--secondary)]'
              : 'border-[var(--border-subtle)] bg-[var(--raised)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
          ].join(' ')}
        >
          <Sparkles size={13} aria-hidden="true" />
          Semantic
          <span
            aria-hidden="true"
            className={[
              'ml-1 inline-flex h-3 w-6 shrink-0 items-center rounded-full transition-colors',
              semantic ? 'bg-[var(--secondary)]' : 'bg-[var(--overlay)]',
            ].join(' ')}
          >
            <span
              className={[
                'h-2.5 w-2.5 rounded-full transition-transform',
                semantic
                  ? 'translate-x-3 bg-[var(--canvas)]'
                  : 'translate-x-0.5 bg-[var(--text-tertiary)]',
              ].join(' ')}
            />
          </span>
        </button>

        {isStubbed && (
          <span
            aria-label="Demo data — BE M2 swap pending"
            className="border-[var(--warn)]/30 bg-[var(--warn)]/10 inline-flex h-7 items-center rounded border px-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--warn)]"
          >
            Demo
          </span>
        )}
      </div>
    </div>
  );
}
