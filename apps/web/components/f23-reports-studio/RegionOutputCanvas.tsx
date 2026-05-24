// F23 Reports Studio — Region 2: Report output canvas (5 states, 6 chart kinds).
// Source: handoff/F23/design.html L770-1180 + canned-data.ts.
//
// Day-25 Sun re-port after Yogesh REJECTED the Day-25-PM scaffold for being a
// "render Monday" placeholder. This iteration ports:
//   • REAL Cycle Pass-Rate stacked-area SVG chart (Pass/Fail/Blocked over Sprint
//     42 weeks + TODAY marker + forecast segment, faithful to design.html L868-896)
//   • Polished KPI cards (big mono value + colored delta + tone-coded text)
//   • Polished Cycle data table with colored Pass/Fail/Blocked cells +
//     status badges (Complete · Running · Closed)
//   • All 5 states (Empty / Loading skeleton / Result / No-data / Error)
//
// Monday continues:
//   • Defect Age stacked-bar chart (design.html L900-940)
//   • Agent Cost line+area, Sprint burndown, Coverage hbar, ReqCov hbar
//   • Per-kind KPI/table data (currently only `cycle` has full table rows)

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

// ─────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────

function EmptyState({ onStarterClick }: { onStarterClick: (s: string) => void }) {
  const c = f23CannedData.states.empty;
  return (
    <div
      data-view="empty"
      className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border p-8 text-center"
      style={{ borderColor: 'var(--border)', background: 'var(--base)' }}
    >
      <div
        aria-hidden="true"
        className="inline-flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ background: 'var(--ai-soft)', color: 'var(--secondary)' }}
      >
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      </div>
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

// ─────────────────────────────────────────────────────────────────────────
// LOADING STATE — skeleton chart + 6 KPIs + table rows
// ─────────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div data-view="loading" className="flex flex-col gap-4">
      <div
        className="h-7 w-full max-w-[480px] animate-pulse rounded"
        style={{ background: 'var(--overlay)' }}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/2] animate-pulse rounded-md"
            style={{ background: 'var(--base)' }}
          />
        ))}
      </div>
      <div
        className="aspect-[800/240] w-full animate-pulse rounded-lg"
        style={{ background: 'var(--base)' }}
      />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded"
            style={{ background: 'var(--base)' }}
          />
        ))}
      </div>
      <p className="text-center text-[11.5px]" style={{ color: 'var(--t3)' }}>
        {f23CannedData.states.loading.hint}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// NO-DATA STATE
// ─────────────────────────────────────────────────────────────────────────

function NoDataState({ onRetry }: { onRetry: () => void }) {
  const c = f23CannedData.states.nodata;
  return (
    <div
      data-view="nodata"
      className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center"
      style={{ borderColor: 'var(--border)', background: 'var(--base)' }}
    >
      <div
        aria-hidden="true"
        className="inline-flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
      >
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      </div>
      <h2 className="m-0 text-[16px] font-semibold" style={{ color: 'var(--t1)' }}>
        {c.title}
      </h2>
      <p className="m-0 max-w-[60ch] text-[12.5px]" style={{ color: 'var(--t3)' }}>
        {c.copy}
      </p>
      <div className="flex flex-wrap gap-2">
        {c.actions.map((a, i) => (
          <button
            key={a}
            onClick={onRetry}
            className="inline-flex min-h-[36px] items-center rounded-md border px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)]"
            style={{
              background: i === 0 ? 'var(--primary)' : 'var(--canvas)',
              borderColor: i === 0 ? 'var(--primary-line)' : 'var(--border)',
              color: i === 0 ? 'var(--primary-ink)' : 'var(--t2)',
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const c = f23CannedData.states.error;
  return (
    <div
      data-view="error"
      className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center"
      style={{ borderColor: 'var(--fail-line)', background: 'var(--base)' }}
    >
      <div
        aria-hidden="true"
        className="inline-flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ background: 'var(--fail-soft)', color: 'var(--fail)' }}
      >
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <h2 className="m-0 text-[16px] font-semibold" style={{ color: 'var(--fail)' }}>
        {c.title}
      </h2>
      <p className="m-0 max-w-[70ch] text-[12.5px]" style={{ color: 'var(--t2)' }}>
        {c.copy}
      </p>
      <div className="flex flex-wrap gap-2">
        {c.actions.map((a, i) => (
          <button
            key={a}
            onClick={onRetry}
            className="inline-flex min-h-[36px] items-center rounded-md border px-3 text-[12px] font-semibold transition-colors hover:bg-[var(--overlay)]"
            style={{
              background: i === 0 ? 'var(--primary)' : 'var(--canvas)',
              borderColor: i === 0 ? 'var(--primary-line)' : 'var(--border)',
              color: i === 0 ? 'var(--primary-ink)' : 'var(--t2)',
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RESULT STATE
// ─────────────────────────────────────────────────────────────────────────

function ResultState({ activeKind }: { activeKind: ReportKindKey }) {
  const title = f23CannedData.result.title[activeKind] ?? 'Report';
  const kpis = f23CannedData.kpis[activeKind] ?? [];
  return (
    <div data-view="result" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          className="m-0 text-[18px] font-semibold"
          style={{ color: 'var(--t1)', fontFamily: 'var(--font-dm-sans), system-ui' }}
        >
          {title}
        </h2>
        <span className="font-mono text-[10.5px]" style={{ color: 'var(--t4)' }}>
          {f23CannedData.result.run_attribution} · {f23CannedData.result.run_timestamp} ·{' '}
          {f23CannedData.result.run_time_ms}
        </span>
      </header>

      <div
        role="group"
        aria-label="Key metrics"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {kpis.map((k, i) => (
          <KpiCard key={i} kpi={k} />
        ))}
      </div>

      {activeKind === 'cycle' ? <CycleChart /> : <ChartPlaceholder activeKind={activeKind} />}

      <DataTable activeKind={activeKind} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────

interface Kpi {
  lbl: string;
  v: string;
  u?: string;
  delta?: string;
  delta_tone?: string;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const tone =
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
      <span className="font-mono text-[22px] font-bold leading-none" style={{ color: 'var(--t1)' }}>
        {kpi.v}
        {kpi.u && (
          <span className="ml-1 text-[12px]" style={{ color: 'var(--t3)' }}>
            {kpi.u}
          </span>
        )}
      </span>
      {kpi.delta && (
        <span className="font-mono text-[10.5px]" style={{ color: tone }}>
          {kpi.delta}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CYCLE PASS-RATE CHART — port of design.html L859-897
// ─────────────────────────────────────────────────────────────────────────

function CycleChart() {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border p-4"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--t2)' }}>
          Pass / Fail / Blocked over Sprint 42 weeks
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px]">
          <Legend swatch="var(--pass)" label="Pass" />
          <Legend swatch="var(--fail)" label="Fail" />
          <Legend swatch="var(--warn)" label="Blocked" />
        </span>
      </header>

      <div role="img" aria-label="Cycle Pass-Rate stacked area chart" className="w-full">
        <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="aspect-[800/240] w-full">
          <defs>
            <linearGradient id="f23-gP" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#34D399" stopOpacity={0.55} />
              <stop offset="1" stopColor="#34D399" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="f23-gF" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#F87171" stopOpacity={0.55} />
              <stop offset="1" stopColor="#F87171" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="f23-gB" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#FBBF24" stopOpacity={0.55} />
              <stop offset="1" stopColor="#FBBF24" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          {[48, 96, 144, 192].map((y) => (
            <line
              key={y}
              x1={0}
              y1={y}
              x2={800}
              y2={y}
              stroke="var(--border)"
              strokeWidth={0.5}
              strokeDasharray="2,3"
            />
          ))}
          <path
            d="M40,200 L240,200 L440,200 L640,200 L760,200 L760,180 L640,170 L440,182 L240,194 L40,200 Z"
            fill="url(#f23-gB)"
          />
          <path
            d="M40,200 L240,194 L440,182 L640,170 L760,180 L760,148 L640,140 L440,154 L240,170 L40,200 Z"
            fill="url(#f23-gF)"
          />
          <path
            d="M40,200 L240,170 L440,154 L640,140 L760,148 L760,60 L640,52 L440,72 L240,96 L40,200 Z"
            fill="url(#f23-gP)"
          />
          <polyline
            points="40,200 240,96 440,72 640,52 760,60"
            stroke="#34D399"
            strokeWidth={2.2}
            fill="none"
            strokeLinejoin="round"
          />
          <polyline
            points="40,200 240,170 440,154 640,140 760,148"
            stroke="#F87171"
            strokeWidth={1.6}
            fill="none"
            strokeLinejoin="round"
          />
          <polyline
            points="40,200 240,194 440,182 640,170 760,180"
            stroke="#FBBF24"
            strokeWidth={1.2}
            fill="none"
            strokeLinejoin="round"
          />
          <line
            x1={640}
            y1={10}
            x2={640}
            y2={216}
            stroke="#A78BFA"
            strokeWidth={0.8}
            strokeDasharray="3,3"
          />
          <text
            x={648}
            y={20}
            fill="#A78BFA"
            fontFamily="var(--font-jetbrains-mono), monospace"
            fontSize={9.5}
            fontWeight={700}
          >
            TODAY · DAY 9
          </text>
          {(
            [
              [40, 'W1 start'],
              [240, 'May 12'],
              [440, 'May 15'],
              [640, 'May 19'],
              [760, 'forecast'],
            ] as const
          ).map(([x, label]) => (
            <text
              key={String(x)}
              x={x as number}
              y={232}
              fill="var(--t4)"
              fontFamily="var(--font-inter), system-ui"
              fontSize={11}
              textAnchor="middle"
            >
              {label as string}
            </text>
          ))}
          {(
            [
              [50, '100%'],
              [98, '75%'],
              [146, '50%'],
              [194, '25%'],
            ] as const
          ).map(([y, label]) => (
            <text
              key={String(y)}
              x={6}
              y={y as number}
              fill="var(--t4)"
              fontFamily="var(--font-jetbrains-mono), monospace"
              fontSize={9}
            >
              {label as string}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t3)' }}>
      <span
        aria-hidden="true"
        className="inline-block h-2 w-3 rounded-sm"
        style={{ background: swatch }}
      />
      {label}
    </span>
  );
}

function ChartPlaceholder({ activeKind }: { activeKind: ReportKindKey }) {
  return (
    <div
      role="img"
      aria-label="Report chart"
      className="flex aspect-[800/240] w-full items-center justify-center rounded-lg border"
      style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t4)' }}
    >
      <span className="font-mono text-[11px] uppercase tracking-wider">
        {activeKind} chart · Monday port from design.html
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// DATA TABLE — cycle has real rows; other kinds show 'Monday' placeholder
// ─────────────────────────────────────────────────────────────────────────

function DataTable({ activeKind }: { activeKind: ReportKindKey }) {
  const t = f23CannedData.table[activeKind as keyof typeof f23CannedData.table];
  if (!t) {
    return (
      <div
        className="rounded-lg border p-4 text-center font-mono text-[10.5px]"
        style={{ background: 'var(--base)', borderColor: 'var(--border)', color: 'var(--t4)' }}
      >
        table for kind &quot;{activeKind}&quot; — Monday port
      </div>
    );
  }
  return (
    <div
      className="flex max-h-[440px] flex-col overflow-x-auto overflow-y-auto rounded-lg border"
      style={{ background: 'var(--base)', borderColor: 'var(--border)' }}
    >
      <table
        className="w-full border-collapse text-[11.5px]"
        role="table"
        aria-label="Underlying records"
      >
        <thead className="sticky top-0">
          <tr
            style={{
              background: 'var(--overlay)',
              color: 'var(--t3)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {t.columns.map((c, i) => (
              <th
                key={i}
                className={`px-3 py-2 text-left font-semibold uppercase tracking-wider ${i >= 2 && i <= 5 ? 'text-right' : ''}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid var(--border)',
                color: 'var(--t2)',
              }}
            >
              <td className="px-3 py-1.5 font-mono text-[10.5px]" style={{ color: 'var(--t2)' }}>
                {r.id}
              </td>
              <td className="px-3 py-1.5">{r.suite}</td>
              <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--pass)' }}>
                {r.pass}
              </td>
              <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--fail)' }}>
                {r.fail}
              </td>
              <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--warn)' }}>
                {r.blocked}
              </td>
              <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--t1)' }}>
                {r.pct}
              </td>
              <td className="px-3 py-1.5">{r.owner}</td>
              <td className="px-3 py-1.5">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-3 py-1.5" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    complete: { bg: 'var(--pass-soft)', fg: 'var(--pass)', bd: 'var(--pass-line)' },
    running: { bg: 'var(--info-soft)', fg: 'var(--info)', bd: 'var(--info-line)' },
    closed: { bg: 'var(--overlay)', fg: 'var(--t4)', bd: 'var(--border)' },
  };
  const tones = map[status] ?? map.closed;
  return (
    <span
      className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider"
      style={{ background: tones.bg, color: tones.fg, borderColor: tones.bd }}
    >
      {status}
    </span>
  );
}
