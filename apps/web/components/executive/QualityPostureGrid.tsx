'use client';

import { f25Demo } from './data/canned-data';
import { Check } from 'lucide-react';

/**
 * Quality posture — 3 KPI cards.
 *
 * Cards: pass rate (with severity breakdown bars), coverage
 * (with automated/manual/untested segment bar), defect density
 * (with industry benchmark callout).
 */
export function QualityPostureGrid() {
  const { quality } = f25Demo;

  return (
    <section data-canonical-section="quality-posture" role="region" aria-label="Quality posture">
      <h2 className="m-0 mb-2.5 inline-flex flex-wrap items-center gap-2 text-[12.5px] font-[DM_Sans] font-bold uppercase leading-[18px] tracking-[0.08em] text-[color:var(--p-text-1)]">
        Quality posture
        <span className="rounded-full border border-[color:var(--p-border)] bg-[color:var(--p-card)] px-1.5 py-0.5 text-[10.5px] font-[JetBrains_Mono] font-semibold normal-case leading-none tracking-normal text-[color:var(--p-text-3)]">
          3 metrics
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
        {/* Pass rate */}
        <KpiCard
          label="Test pass rate"
          trend={quality.passRate.trend}
          trendDirection={quality.passRate.trendDirection}
        >
          <Metric value={quality.passRate.value.toString()} unit={quality.passRate.unit} />
          <p className="m-0 text-[13px] font-medium leading-[18px] text-[color:var(--p-text-2)]">
            {quality.passRate.sub}
          </p>
          <div className="mt-auto flex flex-col gap-1.5">
            {quality.passRate.severityBreakdown.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[70px_1fr_36px] items-center gap-2 text-[11px] text-[color:var(--p-text-2)]"
              >
                <span className="font-medium">{row.label}</span>
                <div className="h-[5px] overflow-hidden rounded-full border border-[color:var(--p-border)] bg-[color:var(--p-card-soft)]">
                  <span
                    className="block h-full bg-[color:var(--p-primary)]"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="text-right text-[11px] font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
                  {row.pct}%
                </span>
              </div>
            ))}
          </div>
        </KpiCard>

        {/* Coverage */}
        <KpiCard
          label="Test coverage"
          trend={quality.coverage.trend}
          trendDirection={quality.coverage.trendDirection}
        >
          <Metric value={quality.coverage.value.toString()} unit={quality.coverage.unit} />
          <p className="m-0 text-[13px] font-medium leading-[18px] text-[color:var(--p-text-2)]">
            {quality.coverage.sub}
          </p>
          <div
            role="img"
            aria-label={`Coverage breakdown: ${quality.coverage.breakdown.automated}% automated, ${quality.coverage.breakdown.manual}% manual, ${quality.coverage.breakdown.untested}% untested`}
            className="mt-1 flex h-2 overflow-hidden rounded-full border border-[color:var(--p-border)] bg-[color:var(--p-card-soft)]"
          >
            <span
              className="block h-full bg-[color:var(--p-primary)]"
              style={{ width: `${quality.coverage.breakdown.automated}%` }}
            />
            <span
              className="block h-full bg-[color:var(--p-text-3)]"
              style={{ width: `${quality.coverage.breakdown.manual}%` }}
            />
            <span
              className="block h-full bg-[color:var(--p-border)]"
              style={{ width: `${quality.coverage.breakdown.untested}%` }}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-[color:var(--p-text-3)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-[color:var(--p-primary)]" />
              Automated{' '}
              <span className="ml-0.5 font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
                {quality.coverage.breakdown.automated}%
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-[color:var(--p-text-3)]" />
              Manual{' '}
              <span className="ml-0.5 font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
                {quality.coverage.breakdown.manual}%
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-[color:var(--p-border)]" />
              Untested{' '}
              <span className="ml-0.5 font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
                {quality.coverage.breakdown.untested}%
              </span>
            </span>
          </div>
        </KpiCard>

        {/* Defect density */}
        <KpiCard
          label="Defect density"
          trend={quality.defectDensity.trend}
          trendDirection={quality.defectDensity.trendDirection}
        >
          <Metric
            value={quality.defectDensity.value.toString()}
            unit={quality.defectDensity.unit}
          />
          <p className="m-0 text-[13px] font-medium leading-[18px] text-[color:var(--p-text-2)]">
            {quality.defectDensity.sub}
          </p>
          <span className="mt-auto inline-flex flex-wrap items-center gap-1.5 rounded-md border border-[color:var(--p-border)] bg-[color:var(--p-card-soft)] px-2.5 py-1.5 text-[11px] text-[color:var(--p-text-3)]">
            <Check className="h-2.5 w-2.5 shrink-0 text-[color:var(--p-pass)]" strokeWidth={3} />
            <span
              dangerouslySetInnerHTML={{
                __html: quality.defectDensity.benchmark.replace(
                  '1–5',
                  '<b class="text-[color:var(--p-text-2)] font-[JetBrains_Mono] font-semibold">1–5</b>',
                ),
              }}
            />
          </span>
        </KpiCard>
      </div>
    </section>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  trend,
  trendDirection,
  children,
}: {
  label: string;
  trend: string;
  trendDirection: 'up' | 'down-good' | 'flat';
  children: React.ReactNode;
}) {
  const trendClass =
    trendDirection === 'flat'
      ? 'bg-[color:var(--p-card-soft)] text-[color:var(--p-text-3)] border-[color:var(--p-border)]'
      : 'bg-[color:var(--p-pass-bg)] text-[color:var(--p-pass)] border-[color:var(--p-pass-line)]';

  return (
    <article className="flex min-h-[160px] flex-col gap-2.5 rounded-xl border border-[color:var(--p-border)] bg-[color:var(--p-card)] p-4 md:min-h-[180px] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--p-text-3)]">
          {label}
        </span>
        <span
          className={`inline-flex h-[22px] items-center gap-0.5 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-[JetBrains_Mono] font-semibold leading-none ${trendClass}`}
        >
          {trend}
        </span>
      </div>
      {children}
    </article>
  );
}

function Metric({ value, unit }: { value: string; unit: string }) {
  return (
    <p className="m-0 font-mono text-[30px] font-bold leading-9 tracking-[-0.02em] text-[color:var(--p-text-1)] md:text-[36px] md:leading-[42px]">
      {value}
      <span className="ml-1 font-mono text-[18px] font-medium text-[color:var(--p-text-3)] md:text-[20px]">
        {unit}
      </span>
    </p>
  );
}
