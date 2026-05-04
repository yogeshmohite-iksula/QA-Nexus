// F15 KB min-relevance slider — track + thumb + histogram of the
// current result set. Per primitives-playground.html P-2 spec.
//
// Histogram bins the current chunks into 10 buckets (0.0–0.1, …,
// 0.9–1.0). Each bar's height is proportional to the count in that
// bucket. The track is painted from the slider value to 1.0 in violet
// (active range); the muted band 0.0 → value is the filtered-out range.

'use client';

import { useId, useMemo } from 'react';
import type { Chunk } from '@/lib/api/kb-api';

interface KbMinScoreSliderProps {
  value: number; // 0..1
  onChange: (v: number) => void;
  chunks: Chunk[]; // current result set — used for histogram
}

const BIN_COUNT = 10;

export function KbMinScoreSlider({ value, onChange, chunks }: KbMinScoreSliderProps) {
  const id = useId();

  // Bin scores into 10 buckets. Always render 10 bars (zero-height bars
  // still hint at the histogram outline).
  const histogram = useMemo(() => {
    const bins = new Array(BIN_COUNT).fill(0) as number[];
    for (const c of chunks) {
      const score = c.relevanceScore;
      if (score == null) continue;
      // Clamp to [0, 1) then bucket. Score === 1 → last bin.
      const idx = Math.min(BIN_COUNT - 1, Math.floor(score * BIN_COUNT));
      bins[idx] = (bins[idx] ?? 0) + 1;
    }
    const max = Math.max(1, ...bins);
    return bins.map((n) => ({ count: n, ratio: n / max }));
  }, [chunks]);

  const cutoffIndex = Math.min(BIN_COUNT - 1, Math.floor(value * BIN_COUNT));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
        >
          Min relevance
        </label>
        <span className="font-mono text-[10.5px] font-semibold text-[var(--text-secondary)]">
          {value.toFixed(2)}
        </span>
      </div>

      {/* Histogram strip — bars sit ABOVE the slider track */}
      <div aria-hidden="true" className="flex h-8 items-end gap-0.5">
        {histogram.map((bin, i) => {
          const isAbove = i >= cutoffIndex;
          return (
            <span
              key={i}
              className={[
                'flex-1 rounded-sm transition-colors',
                isAbove ? 'bg-[var(--secondary)]/60' : 'bg-[var(--overlay)]',
              ].join(' ')}
              style={{ height: `${Math.max(2, bin.ratio * 100)}%` }}
              title={`${(i / BIN_COUNT).toFixed(1)}–${((i + 1) / BIN_COUNT).toFixed(1)}: ${bin.count}`}
            />
          );
        })}
      </div>

      {/* Native range slider — paints background via inline gradient so
          the active band uses var(--secondary). The thumb is styled via
          a global rule in globals.css (already shipped) — fall back to
          browser default if absent. */}
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
        aria-label="Minimum relevance score"
        className="h-11 min-h-[44px] w-full cursor-pointer appearance-none bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] sm:h-6 sm:min-h-0"
        style={{
          background: `linear-gradient(to right, var(--overlay) 0%, var(--overlay) ${
            value * 100
          }%, var(--secondary) ${value * 100}%, var(--secondary) 100%)`,
          borderRadius: '999px',
          height: '6px',
        }}
      />

      <div className="flex justify-between font-mono text-[10px] text-[var(--text-tertiary)]">
        <span>0.0</span>
        <span>0.5</span>
        <span>1.0</span>
      </div>
    </div>
  );
}
