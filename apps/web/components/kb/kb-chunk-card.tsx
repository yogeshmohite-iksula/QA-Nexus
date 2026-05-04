// F15 KB chunk-card — single result row in the search list.
//
// Selected state uses a violet active-rail accent (Phase 3 SYS-1 lock:
// rails violet, CTAs teal). Click → opens detail in the split-pane on
// lg+ or the bottom-sheet Drawer on mobile.

'use client';

import { FileSpreadsheet, FileText, FileCode2 } from 'lucide-react';
import type { Chunk } from '@/lib/api/kb-api';

interface KbChunkCardProps {
  chunk: Chunk;
  selected: boolean;
  onClick: () => void;
}

// Pick an icon by file extension. Defaults to a generic doc icon.
function FileIcon({ name, size }: { name: string; size: number }) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
    return <FileSpreadsheet size={size} aria-hidden="true" />;
  }
  if (lower.endsWith('.md') || lower.endsWith('.txt')) {
    return <FileCode2 size={size} aria-hidden="true" />;
  }
  return <FileText size={size} aria-hidden="true" />;
}

// Bucketize the relevance score into 3 tiers. Mirrors the BE fixture
// distribution: high (>0.75) = pass-green, mid (0.50–0.75) = info-blue,
// low (<0.50) = warn-amber. Use design tokens, never hex literals.
function relevanceTone(score: number | null): { label: string; color: string; bg: string } {
  if (score == null) {
    return {
      label: 'n/a',
      color: 'var(--text-tertiary)',
      bg: 'var(--overlay)',
    };
  }
  if (score >= 0.75) {
    return { label: 'high', color: 'var(--pass)', bg: 'var(--pass)' };
  }
  if (score >= 0.5) {
    return { label: 'mid', color: 'var(--info)', bg: 'var(--info)' };
  }
  return { label: 'low', color: 'var(--warn)', bg: 'var(--warn)' };
}

export function KbChunkCard({ chunk, selected, onClick }: KbChunkCardProps) {
  const tone = relevanceTone(chunk.relevanceScore);
  const lineRange = chunk.source.lineRange;
  const locator = chunk.source.pageNo
    ? `p${chunk.source.pageNo} · L${lineRange[0]}–${lineRange[1]}`
    : `L${lineRange[0]}–${lineRange[1]}`;
  const shortChunkId = `CHUNK-RET-${String(chunk.chunkIndex + 1).padStart(4, '0')}`;
  const score = chunk.relevanceScore !== null ? `${(chunk.relevanceScore * 100).toFixed(0)}%` : '—';

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={[
          'group relative flex min-h-[44px] w-full flex-col gap-2 rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]',
          selected
            ? 'bg-[var(--secondary)]/10 border-[var(--secondary)]'
            : 'border-[var(--border-subtle)] bg-[var(--raised)] hover:border-[var(--border-strong)]',
        ].join(' ')}
      >
        {selected && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r bg-[var(--secondary)]"
          />
        )}

        <header className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10.5px] font-semibold text-[var(--text-tertiary)]">
            {shortChunkId}
          </span>
          <span
            className="inline-flex h-5 items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--overlay)] px-1.5 font-mono text-[10.5px] text-[var(--text-secondary)]"
            aria-label={`Source file ${chunk.sourceFileName}`}
          >
            <FileIcon name={chunk.sourceFileName} size={11} />
            <span className="max-w-[140px] truncate sm:max-w-none">{chunk.sourceFileName}</span>
          </span>
          <span className="font-mono text-[10.5px] text-[var(--text-tertiary)]">{locator}</span>
          <span
            className="ml-auto inline-flex h-5 items-center gap-1.5 rounded px-1.5 font-mono text-[10.5px] font-semibold"
            style={{ color: tone.color }}
            aria-label={`Relevance score ${score} (${tone.label})`}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: tone.bg }}
            />
            {score}
          </span>
        </header>

        <p className="line-clamp-3 text-[12.5px] leading-[18px] text-[var(--text-primary)]">
          {chunk.preview}
        </p>
      </button>
    </li>
  );
}
