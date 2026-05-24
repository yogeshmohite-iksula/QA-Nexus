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

import { Save, Link2, Download, ChevronDown, MoreHorizontal } from 'lucide-react';
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
  // Day-25 Sun re-port iter 4 per canonical L780-803 + L298-306:
  //   - Wrap result content in .out-card (bordered --base box, radius lg)
  //   - .out-head L299: title + runner-avatar (16x16 gradient primary→secondary)
  //     + Run by Yogesh M. + timestamp + duration · right-aligned action row:
  //     Save · Share link · Export split · More 3-dots
  //   - .out-body L306: padding 14/16, gap 14 (KPIs + chart + table)
  return (
    <div
      data-view="result"
      className="flex flex-col overflow-hidden"
      style={{
        background: 'var(--base)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      {/* .out-head L299 */}
      <header
        className="flex flex-wrap items-center gap-x-2.5 gap-y-2 px-4 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* .title L300 — DM Sans 16px bold --t1 */}
          <span
            className="text-[16px] font-bold"
            style={{
              color: 'var(--t1)',
              fontFamily: 'var(--font-dm-sans), system-ui',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </span>
          {/* .runner-av L304 — 16x16 round gradient + dark canvas text */}
          <span
            className="inline-flex items-center gap-1 font-mono text-[10.5px]"
            style={{ color: 'var(--t2)' }}
          >
            <span
              aria-hidden="true"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8.5px] font-bold"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#0B0F17',
              }}
            >
              YM
            </span>
            Run by{' '}
            <b style={{ color: 'var(--t1)', fontWeight: 600 }}>
              {f23CannedData.result.run_attribution.replace('Run by ', '')}
            </b>
            <span aria-hidden="true">·</span>
            <span>{f23CannedData.result.run_timestamp}</span>
            {/* .ts L301 — 10.5px --t3 */}
            <span style={{ color: 'var(--t3)' }}>· {f23CannedData.result.run_time_ms}</span>
          </span>
        </div>

        {/* .actions L305 — margin-left auto */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ActionBtn icon={<Save size={13} strokeWidth={1.7} />} label="Save" />
          <ActionBtn icon={<Link2 size={13} strokeWidth={1.7} />} label="Share link" />
          {/* .split L286 — 36px tall bordered group, --raised bg */}
          <div
            className="inline-flex items-center overflow-hidden"
            style={{
              height: 36,
              background: 'var(--raised)',
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium transition-colors hover:bg-[var(--overlay)]"
              style={{ height: '100%', padding: '0 10px', color: 'var(--t1)' }}
            >
              <Download size={13} strokeWidth={1.7} aria-hidden="true" />
              Export
            </button>
            <span
              style={{ width: 1, height: '100%', background: 'var(--border)' }}
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label="Export options"
              className="inline-flex items-center justify-center transition-colors hover:bg-[var(--overlay)]"
              style={{ height: '100%', padding: '0 6px', color: 'var(--t3)' }}
            >
              <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <ActionBtn
            icon={<MoreHorizontal size={14} strokeWidth={2} />}
            label=""
            ariaLabel="More"
          />
        </div>
      </header>

      {/* .out-body L306 — padding 14/16, gap 14 */}
      <div className="flex flex-col gap-3.5 px-4 py-3.5">
        <div
          role="group"
          aria-label="Key metrics"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
        >
          {kpis.map((k, i) => (
            <KpiCard key={i} kpi={k} />
          ))}
        </div>

        {activeKind === 'cycle' && <CycleChart />}
        {activeKind === 'defect' && <DefectAgeChart />}
        {activeKind === 'agent' && <AgentCostChart />}
        {activeKind === 'sprint' && <SprintBurndownChart />}
        {activeKind === 'coverage' && <CoverageChart />}
        {activeKind === 'reqcov' && <ReqcovChart />}

        <DataTable activeKind={activeKind} />
      </div>
    </div>
  );
}

// .btn .btn-sm L280 — height 30, padding 0 10, font 11.5px, --raised bg
function ActionBtn({
  icon,
  label,
  ariaLabel,
}: {
  icon: React.ReactNode;
  label: string;
  ariaLabel?: string;
}) {
  const isIconOnly = label === '';
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      className="inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium transition-colors hover:bg-[var(--overlay)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
      style={{
        height: 30,
        padding: isIconOnly ? '0 8px' : '0 10px',
        borderRadius: 6,
        background: 'var(--raised)',
        border: '1px solid var(--border)',
        color: 'var(--t1)',
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
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

// .kpi L313 — bg --raised, border --border, radius 8, padding 10/12, min-h 80
// .kpi.acc-{pass|fail|warn|info|ai} L320-324 — tone-tinted linear-gradient bg
// + tone-matched border (rgba 0.06 → transparent 70%)
type KpiAcc = 'pass' | 'fail' | 'warn' | 'info' | 'ai' | null;
function accFromLabel(lbl: string): KpiAcc {
  const l = lbl.toLowerCase();
  // pass (green) — Cycle Pass · Defect Closed · Sprint Stories done · Sprint Velocity ·
  // Agent Cash cost · Coverage Overall/Modules-≥80%/Critical-paths · ReqCov Verified
  if (
    l === 'pass' ||
    l === 'closed (7d)' ||
    l === 'stories done' ||
    l === 'velocity' ||
    l === 'cash cost' ||
    l === 'overall coverage' ||
    l === 'modules ≥80%' ||
    l === 'critical paths' ||
    l === 'verified'
  )
    return 'pass';
  // fail (red) — Cycle Fail · Defect Total open / 30+d / Oldest · Coverage Modules-<60% ·
  // ReqCov Conflicting
  if (
    l === 'fail' ||
    l === 'total open' ||
    l.includes('30+d') ||
    l === 'oldest' ||
    l === 'modules <60%' ||
    l === 'conflicting'
  )
    return 'fail';
  // warn (yellow) — Cycle Blocked · Sprint Scope added · Sprint In progress (risk) ·
  // ReqCov Unmapped · Agent Groq RPD (high usage)
  if (
    l.includes('block') ||
    l === 'scope added' ||
    l === 'in progress' ||
    l === 'unmapped' ||
    l === 'groq rpd'
  )
    return 'warn';
  // info (blue) — Cycle Pass-rate · Coverage % · Passing % · Sprint Forecast · ReqCov Coverage
  if (
    l.includes('pass-rate') ||
    l === 'coverage %' ||
    l === 'passing %' ||
    l === 'forecast' ||
    l === 'coverage'
  )
    return 'info';
  return null;
}
const ACC_TINT: Record<Exclude<KpiAcc, null>, { bg: string; border: string }> = {
  pass: {
    bg: 'linear-gradient(180deg, rgba(52,211,153,0.06), transparent 70%)',
    border: 'var(--pass-line)',
  },
  fail: {
    bg: 'linear-gradient(180deg, rgba(248,113,113,0.06), transparent 70%)',
    border: 'var(--fail-line)',
  },
  warn: {
    bg: 'linear-gradient(180deg, rgba(251,191,36,0.06), transparent 70%)',
    border: 'var(--warn-line)',
  },
  info: {
    bg: 'linear-gradient(180deg, rgba(96,165,250,0.06), transparent 70%)',
    border: 'var(--info-line)',
  },
  ai: {
    bg: 'linear-gradient(180deg, rgba(167,139,250,0.06), transparent 70%)',
    border: 'var(--ai-line)',
  },
};

function KpiCard({ kpi }: { kpi: Kpi }) {
  const tone =
    kpi.delta_tone === 'pass'
      ? 'var(--pass)'
      : kpi.delta_tone === 'fail'
        ? 'var(--fail)'
        : kpi.delta_tone === 'warn'
          ? 'var(--warn)'
          : 'var(--t3)';
  // Δ vs S41 special-case: canonical applies inline color="--pass" on the value
  const isDelta = kpi.lbl.toLowerCase().startsWith('δ vs') || kpi.lbl.startsWith('Δ');
  const valueColor = isDelta && kpi.delta_tone === 'pass' ? 'var(--pass)' : 'var(--t1)';

  const acc = accFromLabel(kpi.lbl);
  const accStyle = acc
    ? { background: ACC_TINT[acc].bg, border: `1px solid ${ACC_TINT[acc].border}` }
    : { background: 'var(--raised)', border: '1px solid var(--border)' };

  return (
    <div
      className="flex flex-col gap-1"
      style={{
        minHeight: 80,
        padding: '10px 12px',
        borderRadius: 8,
        ...accStyle,
      }}
    >
      {/* .kpi .lbl L314 — JetBrains Mono 9.5px bold uppercase letter-spacing 0.08em */}
      <span
        className="text-[9.5px] font-bold uppercase"
        style={{
          color: 'var(--t3)',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          letterSpacing: '0.08em',
        }}
      >
        {kpi.lbl}
      </span>
      {/* .kpi .v L315 — 22px JetBrains Mono bold line-h 1.1 letter-spacing -0.01em
          color: --t1, OR --pass for Δ vs S41 improving (canonical inline style L814) */}
      <span
        className="font-bold"
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 22,
          color: valueColor,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}
      >
        {kpi.v}
        {kpi.u && (
          <span className="ml-0.5 font-medium" style={{ fontSize: 11, color: 'var(--t3)' }}>
            {kpi.u}
          </span>
        )}
      </span>
      {/* .kpi .d L317 — JetBrains Mono 10px weight 600 tone-coded */}
      {kpi.delta && (
        <span
          className="font-semibold"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10,
            color: tone,
          }}
        >
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
  // .chart L327 — bg --raised, border --border, radius 10, padding 14, gap 10, min-h 280
  return (
    <div
      className="flex flex-col gap-2.5"
      style={{
        minHeight: 280,
        padding: 14,
        borderRadius: 10,
        background: 'var(--raised)',
        border: '1px solid var(--border)',
      }}
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

// ─────────────────────────────────────────────────────────────────────────
// DEFECT AGE CHART — stacked bars per age bucket × severity (design.html L900-940)
// ─────────────────────────────────────────────────────────────────────────
function DefectAgeChart() {
  return (
    <ChartShell
      title="Open defects by age & severity"
      legend={[
        { c: 'var(--fail)', l: 'P1' },
        { c: 'var(--warn)', l: 'P2' },
        { c: 'var(--info)', l: 'P3' },
        { c: 'var(--t4)', l: 'P4' },
      ]}
    >
      <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="aspect-[800/240] w-full">
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
        {/* 0-3d */}
        <rect x={80} y={110} width={100} height={90} fill="#F87171" />
        <rect x={80} y={60} width={100} height={50} fill="#FBBF24" />
        <rect x={80} y={30} width={100} height={30} fill="#60A5FA" />
        <rect x={80} y={10} width={100} height={20} fill="#94A3B8" />
        {/* 4-7d */}
        <rect x={230} y={130} width={100} height={70} fill="#F87171" />
        <rect x={230} y={90} width={100} height={40} fill="#FBBF24" />
        <rect x={230} y={60} width={100} height={30} fill="#60A5FA" />
        <rect x={230} y={40} width={100} height={20} fill="#94A3B8" />
        {/* 8-14d */}
        <rect x={380} y={150} width={100} height={50} fill="#F87171" />
        <rect x={380} y={120} width={100} height={30} fill="#FBBF24" />
        <rect x={380} y={95} width={100} height={25} fill="#60A5FA" />
        <rect x={380} y={80} width={100} height={15} fill="#94A3B8" />
        {/* 15-30d */}
        <rect x={530} y={170} width={100} height={30} fill="#F87171" />
        <rect x={530} y={148} width={100} height={22} fill="#FBBF24" />
        <rect x={530} y={130} width={100} height={18} fill="#60A5FA" />
        <rect x={530} y={120} width={100} height={10} fill="#94A3B8" />
        {/* 30+d aging */}
        <rect x={680} y={180} width={100} height={20} fill="#F87171" />
        <rect x={680} y={165} width={100} height={15} fill="#FBBF24" />
        <rect x={680} y={155} width={100} height={10} fill="#60A5FA" />
        <rect
          x={676}
          y={151}
          width={108}
          height={53}
          fill="none"
          stroke="#F87171"
          strokeWidth={1.5}
          strokeDasharray="4,3"
          rx={3}
        />
        <text
          x={730}
          y={146}
          fill="#F87171"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
          textAnchor="middle"
          fontWeight={700}
        >
          AGING OUT · n=3
        </text>
        {[
          [130, '0–3d', '23 open'],
          [280, '4–7d', '16 open'],
          [430, '8–14d', '11 open'],
          [580, '15–30d', '9 open'],
          [730, '30+d', '3 open'],
        ].map(([x, a, b]) => (
          <g key={String(x)}>
            <text
              x={x as number}
              y={218}
              fill={a === '30+d' ? '#F87171' : 'var(--t4)'}
              fontFamily="var(--font-jetbrains-mono), monospace"
              fontSize={11}
              textAnchor="middle"
            >
              {a}
            </text>
            <text
              x={x as number}
              y={232}
              fill="var(--t4)"
              fontFamily="var(--font-inter), system-ui"
              fontSize={10}
              textAnchor="middle"
            >
              {b}
            </text>
          </g>
        ))}
      </svg>
    </ChartShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AGENT COST CHART — line + stacked area (design.html L943-981)
// ─────────────────────────────────────────────────────────────────────────
function AgentCostChart() {
  return (
    <ChartShell
      title="Token spend by agent · Last 30 days"
      legend={[
        { c: '#A78BFA', l: 'Composer' },
        { c: '#60A5FA', l: 'Curator' },
        { c: '#2DD4BF', l: 'Sherlock' },
      ]}
    >
      <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="aspect-[800/240] w-full">
        <defs>
          <linearGradient id="f23-aC" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#A78BFA" stopOpacity={0.5} />
            <stop offset="1" stopColor="#A78BFA" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="f23-aK" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#60A5FA" stopOpacity={0.4} />
            <stop offset="1" stopColor="#60A5FA" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="f23-aS" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2DD4BF" stopOpacity={0.4} />
            <stop offset="1" stopColor="#2DD4BF" stopOpacity={0.04} />
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
          d="M40,210 130,206 220,202 310,196 400,188 490,180 580,172 670,164 760,150 L760,200 L40,200 Z"
          fill="url(#f23-aK)"
        />
        <path
          d="M40,200 130,196 220,188 310,180 400,160 490,148 580,140 670,128 760,110 L760,170 L40,200 Z"
          fill="url(#f23-aS)"
        />
        <path
          d="M40,180 130,168 220,150 310,140 400,120 490,98  580,80  670,72  760,58  L760,170 L40,200 Z"
          fill="url(#f23-aC)"
        />
        <polyline
          points="40,180 130,168 220,150 310,140 400,120 490,98 580,80 670,72 760,58"
          stroke="#A78BFA"
          strokeWidth={2.4}
          fill="none"
          strokeLinejoin="round"
        />
        <polyline
          points="40,200 130,196 220,188 310,180 400,160 490,148 580,140 670,128 760,110"
          stroke="#2DD4BF"
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
        />
        <polyline
          points="40,210 130,206 220,202 310,196 400,188 490,180 580,172 670,164 760,150"
          stroke="#60A5FA"
          strokeWidth={1.7}
          fill="none"
          strokeLinejoin="round"
        />
        <circle cx={760} cy={58} r={4} fill="#A78BFA" />
        {[
          [40, 'Apr 19'],
          [220, 'Apr 26'],
          [400, 'May 3'],
          [580, 'May 12'],
          [760, 'Today'],
        ].map(([x, l]) => (
          <text
            key={String(x)}
            x={x as number}
            y={232}
            fill={l === 'Today' ? '#A78BFA' : 'var(--t4)'}
            fontFamily="var(--font-inter), system-ui"
            fontSize={11}
            textAnchor="middle"
          >
            {l}
          </text>
        ))}
        {[
          [50, '400k'],
          [98, '300k'],
          [146, '200k'],
          [194, '100k'],
        ].map(([y, l]) => (
          <text
            key={String(y)}
            x={6}
            y={y as number}
            fill="var(--t4)"
            fontFamily="var(--font-jetbrains-mono), monospace"
            fontSize={9}
          >
            {l}
          </text>
        ))}
      </svg>
    </ChartShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SPRINT BURNDOWN CHART — ideal + actual + scope-add steps (design.html L985-1021)
// ─────────────────────────────────────────────────────────────────────────
function SprintBurndownChart() {
  return (
    <ChartShell
      title="Sprint 42 burndown · scope changes overlaid"
      legend={[
        { c: 'var(--primary)', l: 'Ideal' },
        { c: 'var(--pass)', l: 'Actual' },
        { c: 'var(--fail)', l: 'Scope added' },
      ]}
    >
      <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="aspect-[800/240] w-full">
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
        <polyline
          points="40,30 760,200"
          stroke="#2DD4BF"
          strokeWidth={1.5}
          strokeDasharray="4,4"
          fill="none"
        />
        <polyline
          points="40,30 130,40 220,55 310,68 400,82 490,102 540,140"
          stroke="#34D399"
          strokeWidth={2.4}
          fill="none"
          strokeLinejoin="round"
        />
        <polyline
          points="40,30 280,30 280,18 480,18 480,12 760,12"
          stroke="#F87171"
          strokeWidth={1.4}
          fill="none"
          strokeDasharray="2,3"
        />
        <circle cx={280} cy={18} r={3.5} fill="#F87171" />
        <circle cx={480} cy={12} r={3.5} fill="#F87171" />
        <text
          x={284}
          y={14}
          fill="#F87171"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
          fontWeight={700}
        >
          +2 pts
        </text>
        <text
          x={484}
          y={8}
          fill="#F87171"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
          fontWeight={700}
        >
          +1 pt
        </text>
        <line
          x1={540}
          y1={10}
          x2={540}
          y2={216}
          stroke="#A78BFA"
          strokeWidth={0.8}
          strokeDasharray="3,3"
        />
        <circle cx={540} cy={140} r={4} fill="#34D399" />
        <text
          x={548}
          y={18}
          fill="#A78BFA"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9.5}
          fontWeight={700}
        >
          TODAY · DAY 9
        </text>
        {[
          [40, 'May 11'],
          [220, 'May 13'],
          [400, 'May 16'],
          [540, 'May 19'],
          [760, 'May 25'],
        ].map(([x, l]) => (
          <text
            key={String(x)}
            x={x as number}
            y={232}
            fill="var(--t4)"
            fontFamily="var(--font-inter), system-ui"
            fontSize={11}
            textAnchor="middle"
          >
            {l}
          </text>
        ))}
        <text
          x={6}
          y={35}
          fill="var(--t4)"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
        >
          42pts
        </text>
        <text
          x={6}
          y={200}
          fill="var(--t4)"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
        >
          0
        </text>
      </svg>
    </ChartShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TEST COVERAGE CHART — horizontal bars per module (design.html L1025-1046)
// ─────────────────────────────────────────────────────────────────────────
function CoverageChart() {
  const rows: { name: string; pct: number; color: string }[] = [
    { name: 'refund-core', pct: 98, color: '#34D399' },
    { name: 'payments-svc', pct: 93, color: '#34D399' },
    { name: 'rma-flow', pct: 90, color: '#34D399' },
    { name: 'webhook-dispatch', pct: 88, color: '#34D399' },
    { name: 'admin-portal', pct: 85, color: '#34D399' },
    { name: 'notifications', pct: 82, color: '#34D399' },
    { name: 'audit-log', pct: 81, color: '#34D399' },
    { name: 'customer-cs', pct: 68, color: '#FBBF24' },
    { name: 'refund-edge-cases', pct: 49, color: '#F87171' },
  ];
  return (
    <ChartShell
      title="Coverage by module · Iksula Returns"
      legend={[
        { c: 'var(--pass)', l: 'Covered' },
        { c: 'var(--border)', l: 'Gap' },
      ]}
    >
      <svg viewBox="0 0 800 280" preserveAspectRatio="none" className="aspect-[800/280] w-full">
        {rows.map((r, i) => {
          const y = 13 + i * 26;
          const w = (r.pct / 100) * 600;
          return (
            <g key={r.name} fontFamily="var(--font-inter), system-ui" fontSize={11}>
              <text x={6} y={y + 9} fill="var(--t2)">
                {r.name}
              </text>
              <rect x={160} y={y} width={600} height={12} fill="#2A3347" rx={2} />
              <rect x={160} y={y} width={w} height={12} fill={r.color} rx={2} />
              <text
                x={770}
                y={y + 9}
                fontFamily="var(--font-jetbrains-mono), monospace"
                fill={r.color}
                fontWeight={600}
              >
                {r.pct}%
              </text>
            </g>
          );
        })}
        <text
          x={160}
          y={260}
          fill="var(--t4)"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
        >
          0%
        </text>
        <text
          x={760}
          y={260}
          fill="var(--t4)"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
          textAnchor="end"
        >
          100%
        </text>
      </svg>
    </ChartShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// REQ COVERAGE CHART — stacked horizontal bars per epic (design.html L1050-1066)
// ─────────────────────────────────────────────────────────────────────────
function ReqcovChart() {
  // mapped/unmapped/conflicting widths per epic (from canonical L1057-1061)
  const rows = [
    {
      name: 'Refund SLA (RET-87)',
      mapped: 490,
      unmapped: 60,
      conflict: 30,
      label: '84%',
      labelColor: '#34D399',
    },
    {
      name: 'Partner-bank webhook',
      mapped: 450,
      unmapped: 80,
      conflict: 50,
      label: '78%',
      labelColor: '#34D399',
    },
    {
      name: 'RMA flow',
      mapped: 380,
      unmapped: 160,
      conflict: 40,
      label: '66%',
      labelColor: '#34D399',
    },
    {
      name: 'Admin reconciliation',
      mapped: 320,
      unmapped: 200,
      conflict: 60,
      label: '55%',
      labelColor: '#FBBF24',
    },
    {
      name: 'Customer notifications',
      mapped: 290,
      unmapped: 240,
      conflict: 0,
      label: '50%',
      labelColor: '#FBBF24',
    },
  ];
  return (
    <ChartShell
      title="Requirement coverage by epic · Sprint 42"
      legend={[
        { c: 'var(--pass)', l: 'Mapped' },
        { c: 'var(--warn)', l: 'Unmapped' },
        { c: 'var(--fail)', l: 'Conflicting' },
      ]}
    >
      <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="aspect-[800/240] w-full">
        {rows.map((r, i) => {
          const y = 13 + i * 26;
          const mapX = 180;
          const unX = mapX + r.mapped;
          const cfX = unX + r.unmapped;
          return (
            <g key={r.name} fontFamily="var(--font-inter), system-ui" fontSize={11}>
              <text x={6} y={y + 9} fill="var(--t2)">
                {r.name}
              </text>
              <rect x={180} y={y} width={580} height={12} fill="#2A3347" rx={2} />
              <rect x={mapX} y={y} width={r.mapped} height={12} fill="#34D399" rx={2} />
              <rect x={unX} y={y} width={r.unmapped} height={12} fill="#FBBF24" rx={2} />
              {r.conflict > 0 && (
                <rect x={cfX} y={y} width={r.conflict} height={12} fill="#F87171" rx={2} />
              )}
              <text
                x={770}
                y={y + 9}
                fontFamily="var(--font-jetbrains-mono), monospace"
                fill={r.labelColor}
                fontWeight={600}
              >
                {r.label}
              </text>
            </g>
          );
        })}
        <text
          x={180}
          y={220}
          fill="var(--t4)"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
        >
          0%
        </text>
        <text
          x={760}
          y={220}
          fill="var(--t4)"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={9}
          textAnchor="end"
        >
          100%
        </text>
      </svg>
    </ChartShell>
  );
}

// Shared chart-card shell (matches CycleChart's pattern: --raised bg, radius 10, padding 14)
function ChartShell({
  title,
  legend,
  children,
}: {
  title: string;
  legend: { c: string; l: string }[];
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-2.5"
      style={{
        minHeight: 280,
        padding: 14,
        borderRadius: 10,
        background: 'var(--raised)',
        border: '1px solid var(--border)',
      }}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--t2)' }}>
          {title}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px]">
          {legend.map((k) => (
            <Legend key={k.l} swatch={k.c} label={k.l} />
          ))}
        </span>
      </header>
      <div role="img" aria-label={title} className="w-full">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// DATA TABLE — cycle has real rows; other kinds show 'Monday' placeholder
// ─────────────────────────────────────────────────────────────────────────

function DataTable({ activeKind }: { activeKind: ReportKindKey }) {
  // Dispatch to per-kind table renderer. Each table has different columns +
  // tone-coded cell formatters per canonical (design.html L1070-1190).
  if (activeKind === 'defect') return <DefectAgeTable />;
  if (activeKind === 'agent') return <AgentCostTable />;
  if (activeKind === 'sprint') return <SprintTable />;
  if (activeKind === 'coverage') return <CoverageTable />;
  if (activeKind === 'reqcov') return <ReqcovTable />;

  const t = f23CannedData.table.cycle;
  return (
    // .tbl-wrap L339 — wrapper bg inherits from --out-body (--base).
    // thead bg --raised L344 (slightly lighter than rows) creates the
    // header/body contrast. Hover bg --raised L350.
    <div
      className="flex max-h-[440px] flex-col overflow-x-auto overflow-y-auto"
      style={{
        borderRadius: 8,
        background: 'var(--base)',
        border: '1px solid var(--border)',
      }}
    >
      <table
        className="min-w-full border-collapse text-[11.5px]"
        style={{ tableLayout: 'fixed' }}
        role="table"
        aria-label="Underlying records"
      >
        <thead className="sticky top-0">
          <tr
            style={{
              background: 'var(--raised)',
              color: 'var(--t3)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {t.columns.map((c, i) => (
              <th
                key={i}
                className="whitespace-nowrap px-4 py-[9px] text-left font-semibold uppercase tracking-wider"
                style={{ width: `${100 / t.columns.length}%` }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, i) => (
            // .tbl tbody tr:hover L350 — bg --raised, cursor pointer
            <tr
              key={i}
              className="cursor-pointer transition-colors hover:bg-[var(--raised)]"
              style={{
                borderBottom: '1px solid var(--border)',
                color: 'var(--t2)',
              }}
            >
              {/* Cycle ID — .mono color --t1 weight 500 (L348) */}
              <td
                className="whitespace-nowrap px-4 py-[9px] text-left font-mono text-[10.5px] font-medium"
                style={{ color: 'var(--t1)' }}
              >
                {r.id}
              </td>
              {/* Suite — plain --t2 (canonical default L347) */}
              <td className="whitespace-nowrap px-4 py-[9px] text-left">{r.suite}</td>
              {/* Pass/Fail/Blocked — plain --t2 (NOT tone-coded per canonical L1075-1083) */}
              <td className="whitespace-nowrap px-4 py-[9px] text-left font-mono">{r.pass}</td>
              <td className="whitespace-nowrap px-4 py-[9px] text-left font-mono">{r.fail}</td>
              <td className="whitespace-nowrap px-4 py-[9px] text-left font-mono">{r.blocked}</td>
              {/* Pass-rate — tone-coded: >=85% --pass green, <85% --warn amber, font-weight 600 */}
              <td
                className="whitespace-nowrap px-4 py-[9px] text-left font-mono font-semibold"
                style={{ color: passRateColor(r.pct) }}
              >
                {r.pct}
              </td>
              <td className="whitespace-nowrap px-4 py-[9px] text-left">{r.owner}</td>
              <td className="whitespace-nowrap px-4 py-[9px] text-left">
                <StatusBadge status={r.status} />
              </td>
              {/* .drill L351 — --secondary violet "View →" drill link */}
              <td className="whitespace-nowrap px-4 py-[9px] text-left">
                <a
                  href="#"
                  className="font-mono text-[11px] hover:underline"
                  style={{ color: 'var(--secondary)' }}
                >
                  View →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Pass-rate tone per canonical inline style L1075-1083:
// >=85% → var(--pass) green, <85% → var(--warn) amber.
function passRateColor(pct: string): string {
  const n = parseFloat(pct.replace('%', ''));
  if (Number.isNaN(n)) return 'var(--t2)';
  return n >= 85 ? 'var(--pass)' : 'var(--warn)';
}

// .pill L358 — height 20, padding 0/7, gap 4, JBM 10px bold uppercase letter-spacing 0.04em
// Maps from canned-data status to canonical pill variant + icon prefix per L1075-1083:
//   complete → .pill.pass + ✓
//   running  → .pill.warn + ▶  (CANONICAL — was incorrectly mapped to info before)
//   closed   → .pill.dim + ∎
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; bd: string; icon: string }> = {
    complete: {
      bg: 'var(--pass-soft)',
      fg: 'var(--pass)',
      bd: 'var(--pass-line)',
      icon: '✓',
    },
    running: {
      bg: 'var(--warn-soft)',
      fg: 'var(--warn)',
      bd: 'var(--warn-line)',
      icon: '▶',
    },
    closed: {
      bg: 'var(--raised)',
      fg: 'var(--t3)',
      bd: 'var(--border)',
      icon: '∎',
    },
  };
  const tones = map[status] ?? map.closed;
  return (
    <span
      className="inline-flex items-center font-bold uppercase"
      style={{
        height: 20,
        padding: '0 7px',
        gap: 4,
        borderRadius: 4,
        background: tones.bg,
        color: tones.fg,
        border: `1px solid ${tones.bd}`,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 10,
        letterSpacing: '0.04em',
        lineHeight: 1,
      }}
    >
      <span aria-hidden="true">{tones.icon}</span>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PER-KIND DATA TABLES (Defect / Agent / Sprint / Coverage / ReqCov)
// Source: handoff/F23/design.html L1094-1190 + canned-data.ts §table.*
// ─────────────────────────────────────────────────────────────────────────

// Shared table wrapper — bg --base, thead --raised, hover --raised, scroll
// Per-column alignment to keep TH and TD in lockstep — fixes Defect Age
// header/cell drift (Assignee/Status TH was right-aligned but TD was left).
// `Align` retained for the per-table call-site signatures (each kind passes
// align[] for documentation purposes; alignment itself is now uniform left).
export type Align = 'left' | 'right';
function TableShell({
  ariaLabel,
  columns,
  align: _align,
  children,
}: {
  ariaLabel: string;
  columns: readonly string[];
  align: readonly Align[];
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex max-h-[440px] flex-col overflow-x-auto overflow-y-auto"
      style={{
        borderRadius: 8,
        background: 'var(--base)',
        border: '1px solid var(--border)',
      }}
    >
      <table
        className="min-w-full border-collapse text-[11.5px]"
        style={{ tableLayout: 'fixed' }}
        role="table"
        aria-label={ariaLabel}
      >
        <thead className="sticky top-0">
          <tr
            style={{
              background: 'var(--raised)',
              color: 'var(--t3)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {columns.map((c, i) => (
              // Equal-width columns per Yogesh feedback: total table width / N.
              // Header text always CENTER, td values keep their `align[i]`.
              <th
                key={i}
                className="whitespace-nowrap px-4 py-[9px] text-left font-semibold uppercase tracking-wider"
                style={{ width: `${100 / columns.length}%` }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// Compact severity/state pill — same 20h compact style as StatusBadge (canonical .pill L358)
function MiniPill({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: 'pass' | 'warn' | 'fail' | 'info' | 'dim';
  icon?: string;
}) {
  const map = {
    pass: { bg: 'var(--pass-soft)', fg: 'var(--pass)', bd: 'var(--pass-line)' },
    warn: { bg: 'var(--warn-soft)', fg: 'var(--warn)', bd: 'var(--warn-line)' },
    fail: { bg: 'var(--fail-soft)', fg: 'var(--fail)', bd: 'var(--fail-line)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)', bd: 'var(--info-line)' },
    dim: { bg: 'var(--raised)', fg: 'var(--t3)', bd: 'var(--border)' },
  }[tone];
  return (
    <span
      className="inline-flex items-center font-bold uppercase"
      style={{
        height: 20,
        padding: '0 7px',
        gap: 4,
        borderRadius: 4,
        background: map.bg,
        color: map.fg,
        border: `1px solid ${map.bd}`,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 10,
        letterSpacing: '0.04em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </span>
  );
}

const Td = ({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <td
    className={`whitespace-nowrap px-4 py-[9px] text-left align-middle ${className}`.trim()}
    style={style}
  >
    {children}
  </td>
);
const TdRow = ({ children }: { children: React.ReactNode }) => (
  <tr
    className="cursor-pointer transition-colors hover:bg-[var(--raised)]"
    style={{ borderBottom: '1px solid var(--border)', color: 'var(--t2)' }}
  >
    {children}
  </tr>
);

// Severity P1/P2/P3 pill mapping per canonical L1098-1111
function severityTone(sev: string): 'fail' | 'warn' | 'info' | 'dim' {
  if (sev === 'P1') return 'fail';
  if (sev === 'P2') return 'warn';
  if (sev === 'P3') return 'info';
  return 'dim';
}

// Coverage % cell tone per value (canonical inline color L1155-1166)
function coveragePctTone(pct: string): string {
  const n = parseFloat(pct.replace('%', ''));
  if (Number.isNaN(n)) return 'var(--t2)';
  if (n >= 85) return 'var(--pass)';
  if (n >= 70) return 'var(--warn)';
  return 'var(--fail)';
}

function DefectAgeTable() {
  const t = f23CannedData.table.defect;
  // Defect · Severity (pill) · Age (numeric → right) · Assignee · Status (pill)
  return (
    <TableShell
      ariaLabel="Open defects"
      columns={t.columns}
      align={['left', 'left', 'right', 'left', 'left']}
    >
      {t.rows.map((r, i) => (
        <TdRow key={i}>
          <Td className="font-mono text-[10.5px] font-medium" style={{ color: 'var(--t1)' }}>
            {r.id}
          </Td>
          <Td>
            <MiniPill label={r.sev} tone={severityTone(r.sev)} />
          </Td>
          <Td className="font-mono">{r.age}</Td>
          <Td>{r.assignee}</Td>
          <Td>
            <MiniPill
              label={r.status}
              tone={r.statusTone as 'warn' | 'fail'}
              icon={r.statusTone === 'fail' ? '⚠' : '▶'}
            />
          </Td>
        </TdRow>
      ))}
    </TableShell>
  );
}

function AgentCostTable() {
  const t = f23CannedData.table.agent;
  // Agent · Provider · In tokens / Out tokens / Calls / Avg latency / Cost (all numeric → right)
  return (
    <TableShell
      ariaLabel="Agent token spend"
      columns={t.columns}
      align={['left', 'left', 'right', 'right', 'right', 'right', 'right']}
    >
      {t.rows.map((r, i) => (
        <TdRow key={i}>
          <Td style={{ color: 'var(--t1)', fontWeight: 500 }}>{r.agent}</Td>
          <Td>{r.provider}</Td>
          <Td className="font-mono">{r.inTok}</Td>
          <Td className="font-mono">{r.outTok}</Td>
          <Td className="font-mono">{r.calls}</Td>
          <Td className="font-mono">{r.latency}</Td>
          <Td className="font-mono font-semibold" style={{ color: 'var(--pass)' }}>
            {r.cost}
          </Td>
        </TdRow>
      ))}
    </TableShell>
  );
}

function SprintTable() {
  const t = f23CannedData.table.sprint;
  // Story · Owner · Pts (numeric → right) · Status (pill → left)
  return (
    <TableShell
      ariaLabel="Sprint stories"
      columns={t.columns}
      align={['left', 'left', 'right', 'left']}
    >
      {t.rows.map((r, i) => (
        <TdRow key={i}>
          <Td className="font-mono text-[10.5px]" style={{ color: 'var(--t1)', fontWeight: 500 }}>
            {r.id}
          </Td>
          <Td>{r.owner}</Td>
          <Td className="font-mono">{r.pts}</Td>
          <Td>
            <MiniPill
              label={r.status}
              tone={r.statusTone as 'pass' | 'warn' | 'info'}
              icon={r.statusTone === 'pass' ? '✓' : r.statusTone === 'info' ? '○' : '▶'}
            />
          </Td>
        </TdRow>
      ))}
    </TableShell>
  );
}

function CoverageTable() {
  const t = f23CannedData.table.coverage;
  // Module · Owner · Lines · Covered · % (last 3 numeric → right)
  return (
    <TableShell
      ariaLabel="Module coverage"
      columns={t.columns}
      align={['left', 'left', 'right', 'right', 'right']}
    >
      {t.rows.map((r, i) => (
        <TdRow key={i}>
          <Td className="font-mono text-[10.5px]" style={{ color: 'var(--t1)', fontWeight: 500 }}>
            {r.module}
          </Td>
          <Td>{r.owner}</Td>
          <Td className="font-mono">{r.lines}</Td>
          <Td className="font-mono">{r.covered}</Td>
          <Td className="font-mono font-semibold" style={{ color: coveragePctTone(r.pct) }}>
            {r.pct}
          </Td>
        </TdRow>
      ))}
    </TableShell>
  );
}

function ReqcovTable() {
  const t = f23CannedData.table.reqcov;
  // Requirement · Epic · Mapped TCs (numeric → right) · State (pill → left)
  return (
    <TableShell
      ariaLabel="Requirements coverage"
      columns={t.columns}
      align={['left', 'left', 'right', 'left']}
    >
      {t.rows.map((r, i) => (
        <TdRow key={i}>
          <Td className="font-mono text-[10.5px]" style={{ color: 'var(--t1)', fontWeight: 500 }}>
            {r.id}
          </Td>
          <Td>{r.epic}</Td>
          <Td className="font-mono">{r.tcs}</Td>
          <Td>
            <MiniPill
              label={r.state}
              tone={r.stateTone as 'pass' | 'warn' | 'fail'}
              icon={r.stateTone === 'pass' ? '✓' : r.stateTone === 'fail' ? '⚠' : '▶'}
            />
          </Td>
        </TdRow>
      ))}
    </TableShell>
  );
}
