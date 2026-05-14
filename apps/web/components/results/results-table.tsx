// F20 Results table — canonical L441-579 (CSS) + L920-1066 (markup).
//
// Suite groups (Refund Core / Refund Policy Edge / Payments) with
// collapsible head + case rows beneath. Each case row has:
//   - cr-status icon (pass / fail / flaky)
//   - cr-id (mono, tertiary)
//   - cr-title (truncate)
//   - cr-right: duration + optional defect count badge
//
// Header has filter pills (All / Failures / Flaky / Regressions) +
// Sort dropdown. Pattern A — all filter/sort actions emit deferred
// console.info markers.

'use client';

import { useState } from 'react';
import { AlertTriangle, Check, ChevronDown, X } from 'lucide-react';
import type { CaseStatus, ResultsCaseRow, ResultsSuite } from './canned-data';

interface Props {
  suites: ResultsSuite[];
  onCaseSelect: (caseId: string) => void;
  selectedCaseId: string;
}

const STATUS_COLOR: Record<CaseStatus, { bg: string; bd: string; fg: string }> = {
  pass: { bg: 'var(--pass-soft)', bd: 'var(--pass-line)', fg: 'var(--pass)' },
  fail: { bg: 'var(--fail-soft)', bd: 'var(--fail-line)', fg: 'var(--fail)' },
  flaky: { bg: 'var(--warn-soft)', bd: 'var(--warn-line)', fg: 'var(--warn)' },
  block: { bg: 'var(--canvas)', bd: 'var(--border)', fg: 'var(--t3)' },
  skip: { bg: 'var(--canvas)', bd: 'var(--border)', fg: 'var(--t4)' },
};

function StatusIcon({ status }: { status: CaseStatus }) {
  if (status === 'pass') return <Check size={11} strokeWidth={3.6} aria-hidden="true" />;
  if (status === 'fail') return <X size={11} strokeWidth={3.6} aria-hidden="true" />;
  if (status === 'flaky') return <AlertTriangle size={11} strokeWidth={2.4} aria-hidden="true" />;
  return <span aria-hidden="true">·</span>;
}

const FILTER_TABS = ['All', 'Failures', 'Flaky', 'Regressions'] as const;

export function ResultsTable({ suites, onCaseSelect, selectedCaseId }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('All');
  return (
    <section aria-label="Results by suite" className="flex flex-col gap-3">
      {/* Filter bar */}
      <header className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Result filters"
          className="inline-flex items-center gap-0.5 rounded-md border p-0.5"
          style={{ background: 'var(--raised)', borderColor: 'var(--border)' }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive ? 'true' : 'false'}
                onClick={() => {
                  setActiveTab(tab);
                  console.info('pattern-a:deferred:f20:filter', { tab });
                }}
                className="inline-flex h-7 items-center px-2.5 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                style={{
                  borderRadius: '4px',
                  background: isActive ? 'var(--overlay)' : 'transparent',
                  color: isActive ? 'var(--t1)' : 'var(--t3)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => console.info('pattern-a:deferred:f20:sort')}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'var(--raised)',
            borderColor: 'var(--border)',
            color: 'var(--t2)',
          }}
        >
          Sort: Suite
          <ChevronDown size={11} aria-hidden="true" />
        </button>
      </header>

      {/* Suite groups */}
      <div className="flex flex-col gap-3">
        {suites.map((suite) => (
          <SuiteGroup
            key={suite.name}
            suite={suite}
            onCaseSelect={onCaseSelect}
            selectedCaseId={selectedCaseId}
          />
        ))}
      </div>
    </section>
  );
}

function SuiteGroup({
  suite,
  onCaseSelect,
  selectedCaseId,
}: {
  suite: ResultsSuite;
  onCaseSelect: (caseId: string) => void;
  selectedCaseId: string;
}) {
  const [open, setOpen] = useState(true);
  const c = suite.counts;
  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        aria-expanded={open ? 'true' : 'false'}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 border-b px-3 py-2.5 text-left transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--secondary)]"
        style={{ borderColor: open ? 'var(--border)' : 'transparent', background: 'var(--raised)' }}
      >
        <ChevronDown
          size={11}
          aria-hidden="true"
          style={{
            color: 'var(--t3)',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 180ms',
          }}
        />
        <span className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
          {suite.name}
        </span>
        <span className="ml-auto inline-flex items-center gap-2 font-mono text-[10.5px] font-bold">
          <span style={{ color: 'var(--t2)' }}>{c.total}</span>
          <span style={{ color: 'var(--pass)' }}>{c.pass}</span>
          <span style={{ color: 'var(--fail)' }}>{c.fail}</span>
          <span style={{ color: 'var(--warn)' }}>{c.flaky}</span>
        </span>
      </button>
      {open && (
        <div role="list" className="flex flex-col">
          {suite.rows.map((row) => (
            <CaseRow
              key={row.id}
              row={row}
              isSelected={row.id === selectedCaseId}
              onSelect={() => onCaseSelect(row.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CaseRow({
  row,
  isSelected,
  onSelect,
}: {
  row: ResultsCaseRow;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const tones = STATUS_COLOR[row.status];
  return (
    <button
      type="button"
      role="listitem"
      aria-current={isSelected ? 'true' : undefined}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--raised)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
      className="flex w-full items-center gap-2.5 border-b px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--secondary)]"
      style={{
        borderColor: 'var(--border)',
        background: isSelected ? 'var(--primary-soft)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
      }}
    >
      <span
        className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border"
        style={{ background: tones.bg, borderColor: tones.bd, color: tones.fg }}
      >
        <StatusIcon status={row.status} />
      </span>
      <span
        className="font-mono text-[10.5px] font-medium"
        style={{ color: 'var(--t3)', minWidth: 92 }}
      >
        {row.id}
      </span>
      <span className="flex-1 truncate text-[12px]" style={{ color: 'var(--t1)' }}>
        {row.title}
      </span>
      <span className="ml-auto inline-flex flex-none items-center gap-2 text-[11px]">
        <span className="font-mono" style={{ color: 'var(--t3)' }}>
          {row.durationLabel}
        </span>
        {row.defectCount > 0 && (
          <span
            className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em]"
            style={{
              background: 'var(--fail-soft)',
              borderColor: 'var(--fail-line)',
              color: 'var(--fail)',
            }}
          >
            {row.defectCount} defect{row.defectCount === 1 ? '' : 's'}
          </span>
        )}
      </span>
    </button>
  );
}
