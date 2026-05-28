'use client';

import { useState } from 'react';
import { f25Demo } from './data/canned-data';
import { Check, Download, RefreshCw } from 'lucide-react';

export function ExecutiveHeader() {
  const [tf, setTf] = useState<string>(f25Demo.activeTimeframe);
  const { release, scope, timeframes } = f25Demo;

  return (
    <section
      data-canonical-section="release-header"
      role="banner"
      aria-label="Release header"
      className="flex flex-col gap-4"
    >
      {/* Mobile (<sm): stack — top row eyebrow + GO button + timestamp; below: title + sprint info full-width.
          sm+ : side-by-side layout matching canonical. */}
      <div className="flex flex-col gap-4 border-b border-[color:var(--p-border)] pb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--p-text-3)]">
            <span className="rounded-[3px] border border-[color:var(--p-secondary-line)] bg-[color:var(--p-secondary-bg)] px-1.5 py-0.5 font-mono text-[9.5px] leading-none tracking-[0.04em] text-[color:var(--p-secondary)]">
              Prove · Boardroom
            </span>
            <span>Release · Quality &amp; Value Snapshot</span>
          </div>
          <h1 className="m-0 break-words text-[22px] font-[DM_Sans] font-bold leading-7 tracking-[-0.01em] text-[color:var(--p-text-1)] sm:text-[26px] sm:leading-8 lg:text-[30px] lg:leading-9">
            {release.title}
          </h1>
          {/* Sprint info — flex-wrap so each nowrap chunk can drop to the next
              line at narrow viewports (320px iPhone SE). JSX collapses
              whitespace between sibling spans, so we use flex-wrap + gap
              instead of relying on inline-text spaces for wrap points. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] leading-5 text-[color:var(--p-text-2)]">
            <span className="whitespace-nowrap">
              {release.sprintName} · Day{' '}
              <b className="font-mono font-semibold text-[color:var(--p-text-1)]">
                {release.sprintDay}
              </b>{' '}
              of {release.sprintLength}
            </span>
            <span className="text-[color:var(--p-text-4)]">·</span>
            <span className="whitespace-nowrap">
              Target ship{' '}
              <b className="font-mono font-semibold text-[color:var(--p-text-1)]">
                {release.targetShipDate}
              </b>
            </span>
            <span className="text-[color:var(--p-text-4)]">·</span>
            <span className="whitespace-nowrap">
              <b className="font-mono font-semibold text-[color:var(--p-text-1)]">
                {release.daysRemaining} days
              </b>{' '}
              remaining
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-2 sm:shrink-0 sm:flex-col sm:items-end">
          <div
            role="status"
            aria-label={`${release.decision} decision`}
            className={`inline-flex items-center gap-2 rounded-lg border-2 px-[18px] py-2.5 text-lg font-[DM_Sans] font-bold leading-none tracking-[-0.01em] ${
              release.decision === 'GO'
                ? 'border-[color:var(--p-pass)] bg-[color:var(--p-pass-bg)] text-[color:var(--p-pass)]'
                : 'border-[color:var(--p-fail)] bg-[color:var(--p-fail-bg)] text-[color:var(--p-fail)]'
            }`}
          >
            <Check className="h-[18px] w-[18px]" strokeWidth={3.5} />
            {release.decision}
          </div>
          <span className="whitespace-nowrap font-mono text-[11px] font-medium text-[color:var(--p-text-3)]">
            Updated {release.updatedAt}
          </span>
        </div>
      </div>

      {/* Timeframe controls */}
      <div
        role="toolbar"
        aria-label="Timeframe and export"
        className="-mt-1 flex flex-wrap items-center gap-2"
      >
        <div
          role="tablist"
          aria-label="Timeframe"
          className="inline-flex h-[34px] max-w-full overflow-x-auto rounded-md border border-[color:var(--p-border)] bg-[color:var(--p-card)] p-0.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {timeframes.map((label) => {
            const isOn = tf === label;
            return (
              <button
                key={label}
                role="tab"
                aria-selected={isOn}
                onClick={() => setTf(label)}
                className={`h-7 min-h-7 shrink-0 whitespace-nowrap rounded px-2 text-[11.5px] font-semibold tracking-[0.02em] sm:px-2.5 ${
                  isOn
                    ? 'bg-[color:var(--p-secondary-bg)] text-[color:var(--p-secondary)]'
                    : 'text-[color:var(--p-text-3)] hover:text-[color:var(--p-text-1)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <button
          aria-label="Export dashboard"
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-[color:var(--p-border)] bg-[color:var(--p-card)] text-[color:var(--p-text-3)] hover:border-[color:var(--p-border-strong)] hover:bg-[color:var(--p-card-soft)] hover:text-[color:var(--p-text-1)]"
        >
          <Download className="h-[13px] w-[13px]" strokeWidth={2} />
        </button>
        <button
          aria-label="Refresh data"
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-[color:var(--p-border)] bg-[color:var(--p-card)] text-[color:var(--p-text-3)] hover:border-[color:var(--p-border-strong)] hover:bg-[color:var(--p-card-soft)] hover:text-[color:var(--p-text-1)]"
        >
          <RefreshCw className="h-[13px] w-[13px]" strokeWidth={2} />
        </button>
      </div>

      {/* Scope row — wraps freely on narrow viewports */}
      <div
        role="region"
        aria-label="Release scope"
        className="flex flex-wrap items-center gap-x-0 gap-y-1"
      >
        <span className="inline-flex items-baseline gap-1.5 border-r border-[color:var(--p-border)] px-3 py-1.5 text-[12.5px] text-[color:var(--p-text-2)] first:pl-0 last:border-r-0">
          <span className="font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
            {scope.tickets}
          </span>
          tickets
        </span>
        <span className="inline-flex items-baseline gap-1.5 border-r border-[color:var(--p-border)] px-3 py-1.5 text-[12.5px] text-[color:var(--p-text-2)]">
          <span className="font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
            {scope.testCases}
          </span>
          test cases
        </span>
        <span className="inline-flex items-baseline gap-1.5 px-3 py-1.5 text-[12.5px] text-[color:var(--p-text-2)]">
          <span className="font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
            {scope.storiesDone}&nbsp;/&nbsp;{scope.storiesTotal}
          </span>
          stories ·{' '}
          <span className="ml-1 font-[JetBrains_Mono] font-semibold text-[color:var(--p-primary)]">
            {scope.velocityPct}%
          </span>
          velocity
        </span>
        <div className="mt-1.5 inline-flex w-full flex-wrap items-center gap-2 md:ml-auto md:mt-0 md:w-auto">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-[color:var(--p-pass-line)] bg-[color:var(--p-pass-bg)] px-2 py-1 text-[11.5px] font-semibold leading-none text-[color:var(--p-pass)]">
            <Check className="h-[11px] w-[11px]" strokeWidth={3} />
            Stable · last 50 runs{' '}
            <span className="ml-1 font-[JetBrains_Mono] font-bold">
              {scope.last50RunsPassPct}%
            </span>{' '}
            pass
          </span>
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-[color:var(--p-warn-line)] bg-[color:var(--p-warn-bg)] px-2 py-1 text-[11.5px] font-semibold leading-none text-[color:var(--p-warn)]">
            <span className="font-[JetBrains_Mono] font-bold">{scope.openP0}</span> P0 ·{' '}
            <span className="font-[JetBrains_Mono] font-bold">{scope.openP1}</span> P1
            <span className="ml-1 font-[JetBrains_Mono] font-bold text-[color:var(--p-pass)]">
              ↓ {Math.abs(scope.p1DeltaThisWeek)}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
