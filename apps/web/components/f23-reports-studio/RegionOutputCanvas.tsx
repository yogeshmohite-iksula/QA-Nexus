// F23 Reports Studio — Region 2: Report output canvas (5 states).
// Source: handoff/F23/spec.json §sections[region-2-output-canvas] + canned-data.
//
// States: empty (default) · loading · result · no-data · error.
// Tonight's scaffold = structural skeleton + Empty state + Result state stub
// with KPI cards + chart placeholder + table skeleton.
// TODO Monday: loading skeleton · no-data · error · real chart render.

'use client';

import { f23CannedData } from './canned-data';
import type { ReportKindKey, CanvasState } from './RegionConfigure';

interface Props {
  state: CanvasState;
  activeKind: ReportKindKey;
  onStarterClick: (starter: string) => void;
  onRetry: () => void;
}

export function RegionOutputCanvas({ state, activeKind, onStarterClick, onRetry }: Props) {
  return (
    <section
      role="region"
      aria-label="Report output"
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8"
      style={{ background: 'var(--canvas)' }}
    >
      {state === 'empty' && <EmptyState onStarterClick={onStarterClick} />}
      {state === 'loading' && <LoadingState />}
      {state === 'result' && <ResultState activeKind={activeKind} />}
      {state === 'no-data' && <NoDataState onRetry={onRetry} />}
      {state === 'error' && <ErrorState onRetry={onRetry} />}
    </section>
  );
}

function EmptyState({ onStarterClick }: { onStarterClick: (s: string) => void }) {
  const c = f23CannedData.states.empty;
  return (
    <div
      data-view="empty"
      className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center"
      style={{ borderColor: 'var(--border)', background: 'var(--base)' }}
    >
      <h2
        className="m-0 text-[18px] font-semibold"
        style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui' }}
      >
        {c.title}
      </h2>
      <p className="m-0 max-w-[60ch] text-[13px]" style={{ color: 'var(--t3)' }}>
        {c.copy}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {c.starters.map((s) => (
          <button
            key={s}
            onClick={() => onStarterClick(s)}
            className="inline-flex min-h-[36px] items-center rounded-md border px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            style={{
              background: 'var(--canvas)',
              borderColor: 'var(--primary-line)',
              color: 'var(--primary)',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  // TODO Monday: skeleton chart + 6 skeleton KPIs + skeleton table 5 rows per spec.
  return (
    <div
      data-view="loading"
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border p-8"
      style={{ borderColor: 'var(--border)', background: 'var(--base)' }}
    >
      <p className="m-0 text-[13px]" style={{ color: 'var(--t3)' }}>
        {f23CannedData.states.loading.hint}
      </p>
      <div
        className="h-2 w-40 overflow-hidden rounded-full"
        style={{ background: 'var(--overlay)' }}
      >
        <div
          className="h-full w-1/3"
          style={{
            background: 'var(--primary)',
            animation: 'f23LoadingPulse 1.2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

function NoDataState({ onRetry }: { onRetry: () => void }) {
  const c = f23CannedData.states.nodata;
  return (
    <div
      data-view="nodata"
      className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center"
      style={{ borderColor: 'var(--warn-line)', background: 'var(--warn-soft)' }}
    >
      <h2 className="m-0 text-[16px] font-semibold" style={{ color: 'var(--warn)' }}>
        {c.title}
      </h2>
      <p className="m-0 max-w-[60ch] text-[12.5px]" style={{ color: 'var(--t2)' }}>
        {c.copy}
      </p>
      <div className="flex flex-wrap gap-2">
        {c.actions.map((a) => (
          <button
            key={a}
            onClick={onRetry}
            className="inline-flex min-h-[36px] items-center rounded-md border px-3 text-[12px] font-semibold transition-colors"
            style={{
              background: 'var(--canvas)',
              borderColor: 'var(--border)',
              color: 'var(--t2)',
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const c = f23CannedData.states.error;
  return (
    <div
      data-view="error"
      className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center"
      style={{ borderColor: 'var(--fail-line)', background: 'var(--fail-soft)' }}
    >
      <h2 className="m-0 text-[16px] font-semibold" style={{ color: 'var(--fail)' }}>
        {c.title}
      </h2>
      <p className="m-0 max-w-[70ch] text-[12.5px]" style={{ color: 'var(--t2)' }}>
        {c.copy}
      </p>
      <div className="flex flex-wrap gap-2">
        {c.actions.map((a) => (
          <button
            key={a}
            onClick={onRetry}
            className="inline-flex min-h-[36px] items-center rounded-md border px-3 text-[12px] font-semibold transition-colors"
            style={{
              background: 'var(--canvas)',
              borderColor: 'var(--border)',
              color: 'var(--t2)',
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultState({ activeKind }: { activeKind: ReportKindKey }) {
  const title = f23CannedData.result.title[activeKind] ?? 'Report';
  const kpis = f23CannedData.kpis[activeKind] ?? [];
  return (
    <div data-view="result" className="flex flex-col gap-4">
      {/* Result head */}
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          className="m-0 text-[18px] font-semibold"
          style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui' }}
        >
          {title}
        </h2>
        <span className="font-mono text-[10.5px]" style={{ color: 'var(--t4)' }}>
          {f23CannedData.result.run_attribution} · {f23CannedData.result.run_time_ms}
        </span>
      </header>

      {/* KPI grid */}
      <div
        role="group"
        aria-label="Key metrics"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {kpis.map((k, i) => (
          <KpiCard key={i} kpi={k} />
        ))}
      </div>

      {/* Chart placeholder — TODO Monday: real chart render per activeKind */}
      <div
        role="img"
        aria-label="Report chart"
        className="flex h-[260px] items-center justify-center rounded-lg border"
        style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t4)' }}
      >
        <span className="font-mono text-[11px] uppercase tracking-wider">
          chart · {activeKind} · scaffold placeholder · Monday: render shape from spec
        </span>
      </div>

      {/* Data table — TODO Monday: full thead + sticky + scroll behavior */}
      <DataTableStub activeKind={activeKind} />
    </div>
  );
}

interface Kpi {
  lbl: string;
  v: string;
  u?: string;
  delta?: string;
  delta_tone?: string;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const toneColor =
    kpi.delta_tone === 'pass'
      ? 'var(--pass)'
      : kpi.delta_tone === 'fail'
        ? 'var(--fail)'
        : kpi.delta_tone === 'warn'
          ? 'var(--warn)'
          : 'var(--t4)';
  return (
    <div
      className="flex flex-col gap-1 rounded-md border p-3"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--t3)' }}
      >
        {kpi.lbl}
      </span>
      <span className="text-[20px] font-bold" style={{ color: 'var(--t1)' }}>
        {kpi.v}
        {kpi.u && (
          <span className="ml-1 font-mono text-[12px]" style={{ color: 'var(--t3)' }}>
            {kpi.u}
          </span>
        )}
      </span>
      {kpi.delta && (
        <span className="font-mono text-[10.5px]" style={{ color: toneColor }}>
          {kpi.delta}
        </span>
      )}
    </div>
  );
}

function DataTableStub({ activeKind }: { activeKind: ReportKindKey }) {
  // Only the cycle kind has full table data in canned-data tonight.
  // TODO Monday: render per-kind table where applicable; for now show columns + first rows for cycle.
  const t = f23CannedData.table[activeKind as keyof typeof f23CannedData.table];
  if (!t) {
    return (
      <div
        className="rounded-lg border p-4 text-center font-mono text-[10.5px]"
        style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t4)' }}
      >
        table for kind &quot;{activeKind}&quot; — Monday scaffold (canned-data has rows only for
        &quot;cycle&quot;)
      </div>
    );
  }
  return (
    <div
      role="table"
      aria-label="Underlying records"
      className="flex max-h-[440px] flex-col overflow-y-auto rounded-lg border"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <table className="w-full border-collapse text-[11.5px]">
        <thead className="sticky top-0">
          <tr style={{ background: 'var(--overlay)', color: 'var(--t3)' }}>
            {t.columns.map((c, i) => (
              <th
                key={i}
                className="px-2 py-2 text-left font-semibold uppercase tracking-wider"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)', color: 'var(--t2)' }}>
              <td className="px-2 py-1.5 font-mono">{r.id}</td>
              <td className="px-2 py-1.5">{r.suite}</td>
              <td className="px-2 py-1.5 text-right font-mono" style={{ color: 'var(--pass)' }}>
                {r.pass}
              </td>
              <td className="px-2 py-1.5 text-right font-mono" style={{ color: 'var(--fail)' }}>
                {r.fail}
              </td>
              <td className="px-2 py-1.5 text-right font-mono" style={{ color: 'var(--warn)' }}>
                {r.blocked}
              </td>
              <td className="px-2 py-1.5 text-right font-mono">{r.pct}</td>
              <td className="px-2 py-1.5">{r.owner}</td>
              <td className="px-2 py-1.5 text-[10.5px] uppercase" style={{ color: 'var(--t4)' }}>
                {r.status}
              </td>
              <td className="px-2 py-1.5" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
