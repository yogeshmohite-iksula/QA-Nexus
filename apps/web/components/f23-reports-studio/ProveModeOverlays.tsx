// F23 Reports Studio — Prove-mode overlays (snapshot ribbon + watermark + audit foot).
// Source: handoff/F23/spec.json §sections[prove-mode-overlays] + canned-data.prove.
//
// Visible only when AdminShell mode == 'prove'. Tonight: visual scaffold only.
// Monday: wire to AdminShell mode prop + add hash truncation + copy-to-clipboard
// behavior on the SHA-256 chip.

'use client';

import { f23CannedData } from './canned-data';

interface Props {
  mode: 'operate' | 'review' | 'prove';
}

export function ProveModeOverlays({ mode }: Props) {
  if (mode !== 'prove') return null;
  const p = f23CannedData.prove;
  return (
    <>
      {/* Snapshot ribbon — sits above output canvas */}
      <div
        role="complementary"
        aria-label="Snapshot metadata"
        className="flex flex-wrap items-center gap-2 border-l-4 px-4 py-2 text-[11.5px]"
        style={{
          background: 'var(--ai-soft)',
          borderColor: 'var(--secondary)',
          color: 'var(--t2)',
        }}
      >
        <span
          className="font-semibold uppercase tracking-wider"
          style={{ color: 'var(--secondary)' }}
        >
          {p.ribbon.label}
        </span>
        <span>
          taken by <b>{p.ribbon.taken_by}</b>
        </span>
        <span aria-hidden="true">·</span>
        <span className="font-mono text-[10.5px]" style={{ color: 'var(--t4)' }}>
          {p.ribbon.taken_at}
        </span>
        <span aria-hidden="true">·</span>
        <span style={{ color: 'var(--t3)' }}>{p.ribbon.copy}</span>
        <span aria-hidden="true">·</span>
        <span
          className="truncate rounded border px-1.5 py-0.5 font-mono text-[10px]"
          style={{
            background: 'var(--canvas)',
            borderColor: 'var(--border)',
            color: 'var(--t3)',
            maxWidth: '320px',
          }}
          title={p.ribbon.hash}
        >
          {p.ribbon.hash}
        </span>
      </div>

      {/* Watermark — TODO Monday: place behind chart at 8% violet diagonal per spec */}
      {/* Audit foot — TODO Monday: place below output canvas with snapshot_id + source_config + retention */}
    </>
  );
}
