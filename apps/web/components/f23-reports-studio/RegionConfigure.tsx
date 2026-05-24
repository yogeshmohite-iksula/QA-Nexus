// F23 Reports Studio — Region 1: Configure report (sticky top, single row at desktop).
// Source: handoff/F23/spec.json §sections[region-1-configure] + canned-data.ts.
//
// Holds: kind-picker (6) · time-range pills (5) · filters · 4 action buttons.

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
      className="sticky top-0 z-10 flex flex-none flex-col gap-3 border-b px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4 lg:px-8 lg:py-3"
      style={{
        background: 'var(--canvas)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Kind picker */}
      <div role="tablist" aria-label="Report kind" className="flex flex-none flex-wrap gap-1.5">
        {f23CannedData.report_kinds.map((k) => {
          const Icon = KIND_ICON[k.icon];
          const isOn = activeKind === k.key;
          return (
            <button
              key={k.key}
              role="tab"
              aria-selected={isOn}
              onClick={() => onKindChange(k.key as ReportKindKey)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                background: isOn ? 'var(--primary-soft)' : 'var(--base)',
                borderColor: isOn ? 'var(--primary-line)' : 'var(--border)',
                color: isOn ? 'var(--primary)' : 'var(--t2)',
              }}
            >
              {Icon && <Icon size={13} strokeWidth={2.2} aria-hidden={true} />}
              {k.label}
            </button>
          );
        })}
      </div>

      {/* Time range pills */}
      <div role="tablist" aria-label="Time range" className="flex flex-none flex-wrap gap-1">
        {f23CannedData.time_ranges.map((r) => {
          const isOn = activeTimeRange === r;
          return (
            <button
              key={r}
              role="tab"
              aria-selected={isOn}
              onClick={() => onTimeRangeChange(r)}
              className="inline-flex min-h-[32px] items-center rounded-full border px-3 text-[11px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
              style={{
                background: isOn ? 'var(--primary-soft)' : 'var(--base)',
                borderColor: isOn ? 'var(--primary-line)' : 'var(--border)',
                color: isOn ? 'var(--primary)' : 'var(--t3)',
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Project filter chip (canonical placeholder) */}
      <div
        role="group"
        aria-label="Project filters"
        className="flex flex-none flex-wrap items-center gap-1.5"
      >
        <span
          className="inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: 'var(--base)',
            borderColor: 'var(--border)',
            color: 'var(--t3)',
          }}
        >
          {f23CannedData.context.project_key}
        </span>
      </div>

      {/* Per-kind optional filters (compact pills) */}
      <div
        role="group"
        aria-label="Optional filters"
        className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
      >
        {perKindFilters.map((f) => (
          <span
            key={f.label}
            className="inline-flex max-w-full items-center gap-1 truncate rounded border px-2 py-1 text-[10.5px]"
            style={{
              background: 'var(--overlay)',
              borderColor: 'var(--border)',
              color: 'var(--t3)',
            }}
            title={`${f.label}: ${f.value}`}
          >
            <span style={{ color: 'var(--t4)' }}>{f.label}:</span>
            <span style={{ color: 'var(--t2)' }} className="truncate">
              {f.value}
            </span>
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div
        role="group"
        aria-label="Report actions"
        className="flex flex-none flex-wrap items-center gap-1.5"
      >
        <button
          onClick={onRun}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{
            background: 'var(--primary)',
            borderColor: 'var(--primary-line)',
            color: 'var(--primary-ink)',
          }}
        >
          <Play size={13} strokeWidth={2.5} aria-hidden="true" />
          {f23CannedData.actions.primary.label}
        </button>
        <button
          onClick={onSave}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t2)' }}
        >
          <Save size={13} strokeWidth={2.2} aria-hidden="true" />
          {f23CannedData.actions.save.label}
        </button>
        <button
          onClick={onSchedule}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t2)' }}
        >
          <Calendar size={13} strokeWidth={2.2} aria-hidden="true" />
          {f23CannedData.actions.schedule.label}
        </button>
        <button
          onClick={onExport}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t2)' }}
        >
          <Download size={13} strokeWidth={2.2} aria-hidden="true" />
          {f23CannedData.actions.export.label}
        </button>
      </div>
    </section>
  );
}
