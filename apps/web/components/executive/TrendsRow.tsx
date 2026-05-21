'use client';

import { f25Demo } from './data/canned-data';

interface SeriesPoint {
  week: string;
  value: number;
}
interface ChartProps {
  label: string;
  trend: string;
  trendDirection: 'up' | 'down-good' | 'flat';
  first: number;
  last: number;
  sub: string;
  series: SeriesPoint[];
  annotation: string;
}

/**
 * 4-week trends — 3 mini-charts.
 *
 * Defects (line), Pass rate (bars), Velocity (bars w/ taper).
 * SVG viewBox 0 0 300 100 — chart band 14–62, label band 80–95.
 */
export function TrendsRow() {
  const { trends } = f25Demo;

  return (
    <section data-canonical-section="trends" role="region" aria-label="Four-week trends">
      <h2 className="m-0 mb-2.5 inline-flex flex-wrap items-center gap-2 text-[12.5px] font-[DM_Sans] font-bold uppercase leading-[18px] tracking-[0.08em] text-[color:var(--p-text-1)]">
        4-week trends
        <span className="rounded-full border border-[color:var(--p-border)] bg-[color:var(--p-card)] px-1.5 py-0.5 text-[10.5px] font-[JetBrains_Mono] font-semibold normal-case leading-none tracking-normal text-[color:var(--p-text-3)]">
          last 4 weeks
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
        <DefectChart {...trends.defects} />
        <PassRateChart {...trends.passRate} />
        <VelocityChart {...trends.velocity} />
      </div>
    </section>
  );
}

function ChartShell({
  data,
  children,
  ariaLabel,
}: {
  data: ChartProps;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const trendClass =
    data.trendDirection === 'flat'
      ? 'bg-[color:var(--p-card-soft)] text-[color:var(--p-text-3)] border-[color:var(--p-border)]'
      : 'bg-[color:var(--p-pass-bg)] text-[color:var(--p-pass)] border-[color:var(--p-pass-line)]';

  return (
    <article className="flex min-h-[160px] flex-col gap-2.5 rounded-xl border border-[color:var(--p-border)] bg-[color:var(--p-card)] p-4 md:min-h-[180px] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--p-text-3)]">
          {data.label}
        </span>
        <span
          className={`inline-flex h-[22px] items-center gap-0.5 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-[JetBrains_Mono] font-semibold leading-none ${trendClass}`}
        >
          {data.trend}
        </span>
      </div>
      <p className="m-0 font-mono text-[22px] font-bold leading-7 tracking-[-0.02em] text-[color:var(--p-text-1)]">
        {data.first}
        {data.label.includes('Pass rate') ? '%' : ''} →{' '}
        <span className="text-[color:var(--p-pass)]">
          {data.last}
          {data.label.includes('Pass rate') ? '%' : ''}
        </span>
      </p>
      <p className="m-0 text-[13px] font-medium leading-[18px] text-[color:var(--p-text-2)]">
        {data.sub}
      </p>
      <div className="relative mt-auto h-24 w-full">
        <svg
          viewBox="0 0 300 100"
          preserveAspectRatio="none"
          className="block h-full w-full"
          role="img"
          aria-label={ariaLabel}
        >
          <line
            x1="0"
            y1="14"
            x2="300"
            y2="14"
            stroke="var(--p-border)"
            strokeWidth="0.5"
            strokeDasharray="2,3"
          />
          <line
            x1="0"
            y1="42"
            x2="300"
            y2="42"
            stroke="var(--p-border)"
            strokeWidth="0.5"
            strokeDasharray="2,3"
          />
          {children}
        </svg>
        <p className="mt-2 text-[10.5px] italic leading-[14px] text-[color:var(--p-text-3)]">
          {data.annotation}
        </p>
      </div>
    </article>
  );
}

function DefectChart(data: ChartProps) {
  const xs = [20, 110, 200, 280];
  // map values 28→12, 22→24, 14→46, 9→58 (approx linear by reference)
  const ys = [12, 24, 46, 58];
  const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  return (
    <ChartShell
      data={data}
      ariaLabel={`Defect count W1 to W4: ${data.series.map((s) => s.value).join(', ')}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--p-primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {xs.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={ys[i]}
          r={i === xs.length - 1 ? 4.5 : 3.5}
          fill="var(--p-primary)"
          stroke={i === xs.length - 1 ? 'var(--p-canvas)' : undefined}
          strokeWidth={i === xs.length - 1 ? 2 : undefined}
        />
      ))}
      {data.series.map((s, i) => (
        <text
          key={s.week}
          x={xs[i]}
          y="92"
          fill="var(--p-text-4)"
          fontFamily="Inter"
          fontSize="9"
          textAnchor="middle"
        >
          {s.week}·{s.value}
        </text>
      ))}
    </ChartShell>
  );
}

function PassRateChart(data: ChartProps) {
  // bar heights: 82%→20, 85%→28, 87%→38, 87%→38 (taller = better, anchor y=62)
  const bars = [
    { x: 15, y: 42, h: 20, label: 'W1·82%', cx: 40 },
    { x: 85, y: 34, h: 28, label: 'W2·85%', cx: 110 },
    { x: 155, y: 24, h: 38, label: 'W3·87%', cx: 180 },
    { x: 225, y: 24, h: 38, label: 'W4·87%', cx: 250 },
  ];
  return (
    <ChartShell
      data={data}
      ariaLabel={`Pass rate W1 to W4: ${data.series.map((s) => s.value + '%').join(', ')}`}
    >
      {bars.map((b) => (
        <rect
          key={b.label}
          x={b.x}
          y={b.y}
          width="50"
          height={b.h}
          fill="var(--p-primary)"
          rx="2"
        />
      ))}
      {bars.map((b) => (
        <text
          key={b.label}
          x={b.cx}
          y="92"
          fill="var(--p-text-4)"
          fontFamily="Inter"
          fontSize="9"
          textAnchor="middle"
        >
          {b.label}
        </text>
      ))}
    </ChartShell>
  );
}

function VelocityChart(data: ChartProps) {
  // bar heights show ramp + taper
  const bars = [
    { x: 15, y: 22, h: 40, label: 'W1·140', cx: 40, opacity: 1 },
    { x: 85, y: 14, h: 48, label: 'W2·156', cx: 110, opacity: 1 },
    { x: 155, y: 26, h: 36, label: 'W3·134', cx: 180, opacity: 1 },
    { x: 225, y: 40, h: 22, label: 'W4·89', cx: 250, opacity: 0.7 },
  ];
  return (
    <ChartShell
      data={data}
      ariaLabel={`Stories per week W1 to W4: ${data.series.map((s) => s.value).join(', ')}`}
    >
      {bars.map((b) => (
        <rect
          key={b.label}
          x={b.x}
          y={b.y}
          width="50"
          height={b.h}
          fill="var(--p-primary)"
          rx="2"
          opacity={b.opacity}
        />
      ))}
      {bars.map((b) => (
        <text
          key={b.label}
          x={b.cx}
          y="92"
          fill="var(--p-text-4)"
          fontFamily="Inter"
          fontSize="9"
          textAnchor="middle"
        >
          {b.label}
        </text>
      ))}
    </ChartShell>
  );
}
