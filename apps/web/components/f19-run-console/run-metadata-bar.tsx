// F19 Run metadata bar + run meter — v2 HTML L638-L668.
//
// Pattern A: Pause / Stop buttons fire console.info markers (Day-18
// wires to POST /runs/:id/{pause,stop}).

'use client';

import { Pause, Square } from 'lucide-react';
import { LivePill } from './live-pill';
import type { RunMeta, RunMeterSegment } from './canned-data';

interface Props {
  meta: RunMeta;
  meter: { total: number; current: number; segments: RunMeterSegment[] };
  onPause: () => void;
  onStop: () => void;
}

const SEG_COLOR: Record<RunMeterSegment['key'], string> = {
  pass: 'var(--pass)',
  fail: 'var(--fail)',
  flaky: 'var(--warn)',
  running: 'var(--info)',
  queued: 'var(--border-strong)',
};

export function RunMetadataBar({ meta, meter, onPause, onStop }: Props) {
  const pct = Math.round((meter.current / meter.total) * 100);
  return (
    <>
      {/* Run metadata bar.
          RWD strategy (Hard Rule 12 + Day-17 visual gate Round-2 Issue 3):
          - Always flex-wrap (no sm:flex-nowrap) so narrow widths reflow.
          - LEFT chip cluster: flex: 1 1 auto + min-width: 0 -- shrinks
            + wraps title/chips onto a second line if needed.
          - RIGHT control cluster (LIVE + Pause + Stop): order: 999 +
            margin-left: auto + flex: none -- ALWAYS anchored top-right,
            NEVER pushed below the chips line. */}
      <div
        role="region"
        aria-label="Run metadata"
        className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b px-4 py-3 sm:px-5 lg:px-7"
        style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
      >
        {/* LEFT — title + chips. Shrinks + wraps under width pressure. */}
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
          style={{ flex: '1 1 auto', minWidth: 0 }}
        >
          <h1
            className="m-0 text-[15px] font-semibold leading-[22px]"
            style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
          >
            {meta.title}
          </h1>
          <span
            className="rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-bold"
            style={{
              background: 'var(--canvas)',
              borderColor: 'var(--border)',
              color: 'var(--t3)',
            }}
          >
            {meta.runId}
          </span>
          <Chip variant="env">{meta.env}</Chip>
          <Chip variant="sprint">{meta.sprint}</Chip>
          <Chip variant="runner">{meta.runner}</Chip>
        </div>

        {/* RIGHT — meta + LIVE pill + Pause + Stop.
            order: 999 anchors this cluster as the LAST child regardless of
            source order; combined with margin-left: auto it stays top-right. */}
        <div
          className="flex flex-wrap items-center gap-2.5"
          style={{ marginLeft: 'auto', flex: 'none', order: 999 }}
        >
          <span className="text-[12px]" style={{ color: 'var(--t3)' }}>
            Started <b style={{ color: 'var(--t2)' }}>{meta.startedAt}</b>
            <span className="mx-1.5" style={{ color: 'var(--border-strong)' }}>
              ·
            </span>
            elapsed <b style={{ color: 'var(--t2)' }}>{meta.elapsed}</b>
            <span className="mx-1.5" style={{ color: 'var(--border-strong)' }}>
              ·
            </span>
            ETA <b style={{ color: 'var(--t2)' }}>{meta.eta}</b>
          </span>
          {meta.isLive && <LivePill label="Live" variant="pass" />}
          <button
            type="button"
            aria-label="Pause run"
            onClick={onPause}
            className="inline-flex h-9 min-w-[44px] items-center justify-center rounded-md border px-2.5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              background: 'var(--raised)',
              borderColor: 'var(--border-strong)',
              color: 'var(--t2)',
            }}
          >
            <Pause size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              background: 'var(--fail-soft)',
              borderColor: 'var(--fail-line)',
              color: 'var(--fail)',
            }}
          >
            <Square size={13} aria-hidden="true" fill="currentColor" />
            Stop run
          </button>
        </div>
      </div>

      {/* Run meter */}
      <div
        className="relative flex items-center gap-3 border-b px-4 py-2.5 sm:px-5 lg:px-7"
        style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
      >
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={meter.total}
          aria-valuenow={meter.current}
          aria-label={`Run progress ${pct}%`}
          className="flex h-2 flex-1 overflow-hidden rounded-full border"
          style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
        >
          {meter.segments.map((seg) => (
            <div
              key={seg.key}
              title={`${seg.count} ${seg.key}`}
              style={{
                width: `${seg.widthPct}%`,
                background: SEG_COLOR[seg.key],
              }}
            />
          ))}
        </div>
        <span className="whitespace-nowrap text-[11.5px]" style={{ color: 'var(--t3)' }}>
          <b style={{ color: 'var(--t2)' }}>
            {meter.current} of {meter.total}
          </b>{' '}
          · {pct}%
        </span>
      </div>
    </>
  );
}

function Chip({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'env' | 'sprint' | 'runner';
}) {
  const tones = {
    env: { bg: 'var(--warn-soft)', fg: 'var(--warn)', bd: 'var(--warn-line)' },
    sprint: { bg: 'var(--primary-soft)', fg: 'var(--primary)', bd: 'var(--primary-line)' },
    runner: { bg: 'var(--info-soft)', fg: 'var(--info)', bd: 'var(--info-line)' },
  }[variant];
  return (
    <span
      className="inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ background: tones.bg, color: tones.fg, borderColor: tones.bd }}
    >
      {children}
    </span>
  );
}
