// F15 KB chunk-detail panel — split-pane on lg+, full-screen Drawer on
// mobile. Renders the full chunk text + source attribution + neighbour
// pointers + a "Used in" placeholder section (cross-references land
// post-pilot).

'use client';

import { ChevronLeft, ChevronRight, Loader2, X, AlertCircle } from 'lucide-react';
import { useKbChunkDetail } from '@/lib/hooks/use-kb-search';

interface KbChunkDetailPanelProps {
  projectId: string;
  chunkId: string | null;
  /** Mobile-only — provided so the Drawer can dismiss. lg+ ignores this. */
  onClose?: () => void;
  /** Step-through neighbour navigation (prev / next). null = no neighbour. */
  onSelect: (chunkId: string) => void;
}

export function KbChunkDetailPanel({
  projectId,
  chunkId,
  onClose,
  onSelect,
}: KbChunkDetailPanelProps) {
  const { data, isLoading, isError, error } = useKbChunkDetail(projectId, chunkId);

  if (!chunkId) {
    return <PlaceholderEmpty />;
  }

  if (isLoading) {
    return <PlaceholderLoading onClose={onClose} />;
  }

  if (isError || !data) {
    return <PlaceholderError message={error?.message} onClose={onClose} />;
  }

  const { chunk } = data;
  const shortId = `CHUNK-RET-${String(chunk.chunkIndex + 1).padStart(4, '0')}`;
  const lineRange = chunk.source.lineRange;
  const locator = chunk.source.pageNo
    ? `Page ${chunk.source.pageNo}, lines ${lineRange[0]}–${lineRange[1]}`
    : `Lines ${lineRange[0]}–${lineRange[1]}`;

  return (
    <aside
      aria-label="Chunk detail"
      className="flex h-full flex-col overflow-hidden bg-[var(--base)]"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {shortId}
          </span>
          <h2 className="font-display text-[16px] font-bold leading-[22px] text-[var(--text-primary)]">
            {chunk.sourceFileName}
          </h2>
          <p className="font-mono text-[11px] text-[var(--text-tertiary)]">{locator}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:hidden"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </header>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Section label="Chunk text">
          <p className="whitespace-pre-wrap text-[13px] leading-[20px] text-[var(--text-primary)]">
            {chunk.chunkText}
          </p>
        </Section>

        <Section label="Source">
          <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12px]">
            <dt className="text-[var(--text-tertiary)]">File</dt>
            <dd className="truncate text-[var(--text-primary)]">{chunk.sourceFileName}</dd>
            <dt className="text-[var(--text-tertiary)]">Locator</dt>
            <dd className="font-mono text-[var(--text-primary)]">{locator}</dd>
            <dt className="text-[var(--text-tertiary)]">Chunk index</dt>
            <dd className="font-mono text-[var(--text-primary)]">{chunk.chunkIndex}</dd>
            {Object.entries(chunk.metadataJson).map(([k, v]) => (
              <Each key={k} k={k} v={v} />
            ))}
          </dl>
        </Section>

        <Section label="Neighbouring chunks">
          <div className="flex flex-col gap-2">
            <NeighbourLink
              dir="prev"
              chunkId={chunk.neighbourPreviousChunkId}
              onSelect={onSelect}
            />
            <NeighbourLink dir="next" chunkId={chunk.neighbourNextChunkId} onSelect={onSelect} />
          </div>
        </Section>

        <Section label="Used in">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Cross-references to test cases / requirements / defects land post-pilot. PR #30 wireup
            deferred.
          </p>
        </Section>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 flex flex-col gap-2 last:mb-0">
      <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        {label}
      </h3>
      {children}
    </section>
  );
}

function Each({ k, v }: { k: string; v: unknown }) {
  return (
    <>
      <dt className="text-[var(--text-tertiary)]">{k}</dt>
      <dd className="truncate font-mono text-[var(--text-primary)]">{String(v)}</dd>
    </>
  );
}

function NeighbourLink({
  dir,
  chunkId,
  onSelect,
}: {
  dir: 'prev' | 'next';
  chunkId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!chunkId) {
    return (
      <span className="inline-flex h-10 min-h-[44px] items-center gap-1.5 rounded-md border border-dashed border-[var(--border-subtle)] px-3 text-[12px] text-[var(--text-tertiary)] sm:min-h-0">
        {dir === 'prev' ? <ChevronLeft size={13} aria-hidden="true" /> : null}
        <span>{dir === 'prev' ? 'No previous chunk' : 'No next chunk'}</span>
        {dir === 'next' ? <ChevronRight size={13} aria-hidden="true" /> : null}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(chunkId)}
      className="inline-flex h-10 min-h-[44px] items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--raised)] px-3 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:min-h-0"
    >
      {dir === 'prev' ? <ChevronLeft size={13} aria-hidden="true" /> : null}
      <span>{dir === 'prev' ? 'Previous chunk' : 'Next chunk'}</span>
      {dir === 'next' ? <ChevronRight size={13} aria-hidden="true" /> : null}
    </button>
  );
}

function PlaceholderEmpty() {
  return (
    <aside
      aria-label="Chunk detail"
      className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--base)] py-16 text-center"
    >
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">Pick a chunk</p>
      <p className="max-w-[280px] text-[12.5px] text-[var(--text-tertiary)]">
        Click any result on the left to read the full chunk text, source attribution, and
        neighbouring chunks.
      </p>
    </aside>
  );
}

function PlaceholderLoading({ onClose }: { onClose?: () => void }) {
  return (
    <aside
      aria-label="Chunk detail loading"
      role="status"
      aria-live="polite"
      className="flex h-full flex-col bg-[var(--base)]"
    >
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <span className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-tertiary)]">
          <Loader2 size={14} aria-hidden="true" className="animate-spin" />
          Loading chunk…
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:hidden"
          >
            <X size={14} />
          </button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="mb-3 block h-3 w-full animate-pulse rounded bg-[var(--overlay)]"
          />
        ))}
      </div>
    </aside>
  );
}

function PlaceholderError({ message, onClose }: { message?: string; onClose?: () => void }) {
  return (
    <aside
      aria-label="Chunk detail error"
      role="alert"
      className="flex h-full flex-col bg-[var(--base)]"
    >
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <span className="inline-flex items-center gap-2 text-[12.5px] text-[var(--fail)]">
          <AlertCircle size={14} aria-hidden="true" />
          Failed to load chunk
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] lg:hidden"
          >
            <X size={14} />
          </button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-[12.5px] text-[var(--text-secondary)]">
          {message ?? 'The chunk-detail request failed. Try selecting it again.'}
        </p>
      </div>
    </aside>
  );
}
