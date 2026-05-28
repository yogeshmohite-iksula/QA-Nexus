// F23 Reports Studio — Region 1: Configure report (3-row layout per v4 design.html).
// Source: handoff/F23/design.html L659-742.
//
// Row A — REPORT  : 6 kind chips
// Row B — RANGE   : 5 range pills + Project chip + Add project + per-kind filter chips + Clear all
// Row C — ACTIONS : Run report (primary) + Save as template + Schedule + Export split + last-run timestamp
//
// Day-25 Sun re-port after Yogesh REJECTED the Day-25-PM scaffold for cramming
// everything into 1 row + floating cluster. v4 lays this out cleanly across 3 rows.

'use client';

import {
  TrendingUp,
  Bug,
  Cpu,
  Activity,
  BarChart3,
  CheckSquare,
  Play,
  Save,
  Calendar,
  Download,
  ChevronDown,
  Plus,
  X,
} from 'lucide-react';
import { f23CannedData } from './canned-data';

export type ReportKindKey = (typeof f23CannedData.report_kinds)[number]['key'];
export type CanvasState = 'empty' | 'loading' | 'result' | 'no-data' | 'error';

interface Props {
  activeKind: ReportKindKey;
  onKindChange: (k: ReportKindKey) => void;
  activeTimeRange: string;
  onTimeRangeChange: (r: string) => void;
  onRun: () => void;
  onSave: () => void;
  onSchedule: () => void;
  onExport: () => void;
}

const KIND_ICON: Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>
> = {
  TrendingUp,
  Bug,
  Cpu,
  Activity,
  BarChart3,
  CheckSquare,
};

export function RegionConfigure({
  activeKind,
  onKindChange,
  activeTimeRange,
  onTimeRangeChange,
  onRun,
  onSave,
  onSchedule,
  onExport,
}: Props) {
  const perKindFilters = f23CannedData.per_kind_filters[activeKind] ?? [];

  return (
    <section
      role="region"
      aria-label="Configure report"
      className="flex flex-none flex-col gap-2.5 px-4 py-3 sm:px-6 lg:px-8"
      style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Row A — REPORT */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <CfgLabel>Report</CfgLabel>
        <div
          role="tablist"
          aria-label="Report kind"
          className="flex flex-wrap items-center gap-1.5"
        >
          {f23CannedData.report_kinds.map((k) => {
            const Icon = KIND_ICON[k.icon];
            const isOn = activeKind === k.key;
            return (
              <button
                key={k.key}
                role="tab"
                aria-selected={isOn}
                onClick={() => onKindChange(k.key as ReportKindKey)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                style={{
                  background: isOn ? 'var(--primary-soft)' : 'var(--base)',
                  borderColor: isOn ? 'var(--primary-line)' : 'var(--border)',
                  color: isOn ? 'var(--primary)' : 'var(--t2)',
                }}
              >
                {Icon && <Icon size={14} strokeWidth={2} aria-hidden={true} />}
                {k.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row B — RANGE */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <CfgLabel>Range</CfgLabel>
        <div
          role="tablist"
          aria-label="Time range"
          className="inline-flex items-center gap-0.5 rounded-full border p-0.5"
          style={{ borderColor: 'var(--border)', background: 'var(--base)' }}
        >
          {f23CannedData.time_ranges.map((r) => {
            const isOn = activeTimeRange === r;
            return (
              <button
                key={r}
                role="tab"
                aria-selected={isOn}
                onClick={() => onTimeRangeChange(r)}
                className="inline-flex min-h-[28px] items-center rounded-full px-3 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                style={{
                  background: isOn ? 'var(--primary)' : 'transparent',
                  color: isOn ? 'var(--primary-ink)' : 'var(--t3)',
                }}
              >
                {r}
              </button>
            );
          })}
        </div>

        <span aria-hidden="true" className="h-5 w-px" style={{ background: 'var(--border)' }} />

        <button
          aria-label="Project filter"
          className="inline-flex min-h-[28px] items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] transition-colors hover:bg-[var(--overlay)]"
          style={{ background: 'var(--overlay)', borderColor: 'var(--border)', color: 'var(--t2)' }}
        >
          <b className="font-semibold" style={{ color: 'var(--t3)' }}>
            Project:
          </b>
          <span>{f23CannedData.context.project}</span>
          <X size={11} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <button
          aria-label="Add project"
          className="inline-flex min-h-[28px] items-center gap-1.5 rounded-md border border-dashed px-2.5 text-[11.5px] transition-colors hover:bg-[var(--overlay)]"
          style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--t3)' }}
        >
          <Plus size={12} strokeWidth={2.4} aria-hidden="true" />
          Add project
        </button>

        {perKindFilters.map((f) => (
          <button
            key={f.label}
            className="inline-flex min-h-[28px] max-w-full items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] transition-colors hover:bg-[var(--overlay)]"
            style={{
              background: 'var(--overlay)',
              borderColor: 'var(--border)',
              color: 'var(--t2)',
            }}
            title={`${f.label}: ${f.value}`}
          >
            <b className="font-semibold" style={{ color: 'var(--t3)' }}>
              {f.label}:
            </b>
            <span className="truncate">{f.value}</span>
            <ChevronDown size={11} strokeWidth={2.4} aria-hidden="true" />
          </button>
        ))}

        <span className="flex-1" />

        <button
          className="inline-flex min-h-[28px] items-center rounded-md px-2 font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-[var(--overlay)]"
          style={{ color: 'var(--t3)' }}
        >
          Clear all
        </button>
      </div>

      {/* Row C — ACTIONS (border-top divider per v4 L728) */}
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-2 pt-2.5"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div role="group" aria-label="Report actions" className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRun}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              background: 'var(--primary)',
              borderColor: 'var(--primary-line)',
              color: 'var(--primary-ink)',
            }}
          >
            <Play size={13} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
            {f23CannedData.actions.primary.label}
          </button>
          <button
            onClick={onSave}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t2)' }}
          >
            <Save size={13} strokeWidth={2} aria-hidden="true" />
            {f23CannedData.actions.save.label}
          </button>
          <button
            onClick={onSchedule}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t2)' }}
          >
            <Calendar size={13} strokeWidth={2} aria-hidden="true" />
            {f23CannedData.actions.schedule.label}
          </button>
          <div
            className="inline-flex items-center overflow-hidden rounded-md border"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={onExport}
              className="inline-flex min-h-[36px] items-center gap-1.5 px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)]"
              style={{ background: 'var(--base)', color: 'var(--t2)' }}
            >
              <Download size={13} strokeWidth={2} aria-hidden="true" />
              Export
            </button>
            <span className="h-9 w-px" style={{ background: 'var(--border)' }} />
            <button
              aria-label="Export options"
              className="inline-flex min-h-[36px] items-center px-2 transition-colors hover:bg-[var(--overlay)]"
              style={{ background: 'var(--base)', color: 'var(--t3)' }}
            >
              <ChevronDown size={13} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>

        <span className="flex-1" />

        <span className="font-mono text-[10.5px]" style={{ color: 'var(--t3)' }}>
          last run ·{' '}
          <b style={{ color: 'var(--t2)' }}>
            {f23CannedData.actions.last_run.replace('last run · ', '')}
          </b>
        </span>
      </div>
    </section>
  );
}

function CfgLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[10px] font-bold uppercase tracking-wider"
      style={{ color: 'var(--t3)', minWidth: 48 }}
    >
      {children}
    </span>
  );
}
