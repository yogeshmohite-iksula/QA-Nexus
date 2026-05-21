'use client';

import { f25Demo } from './data/canned-data';
import { ArrowRight, Check } from 'lucide-react';

/**
 * Risk posture — 2 cards.
 *
 * Card 1: Open defects (P0/P1/P2/P3 pills with counts + target line + drill link).
 * Card 2: Release readiness gates (5-of-5 checklist + summary).
 */
export function RiskPostureGrid() {
  const { risk } = f25Demo;
  const { openDefects: od, readinessGates: rg } = risk;

  return (
    <section data-canonical-section="risk-posture" role="region" aria-label="Risk posture">
      <h2 className="m-0 mb-2.5 inline-flex flex-wrap items-center gap-2 text-[12.5px] font-[DM_Sans] font-bold uppercase leading-[18px] tracking-[0.08em] text-[color:var(--p-text-1)]">
        Risk posture
        <span className="rounded-full border border-[color:var(--p-border)] bg-[color:var(--p-card)] px-1.5 py-0.5 text-[10.5px] font-[JetBrains_Mono] font-semibold normal-case leading-none tracking-normal text-[color:var(--p-text-3)]">
          2 dimensions
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {/* Open defects */}
        <article className="flex min-h-[160px] flex-col gap-2.5 rounded-xl border border-[color:var(--p-border)] bg-[color:var(--p-card)] p-4 md:min-h-[180px] md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--p-text-3)]">
              Open defects
            </span>
            <span className="inline-flex h-[22px] items-center gap-0.5 whitespace-nowrap rounded border border-[color:var(--p-pass-line)] bg-[color:var(--p-pass-bg)] px-1.5 py-0.5 text-[11px] font-[JetBrains_Mono] font-semibold leading-none text-[color:var(--p-pass)]">
              {od.trend}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--p-warn-line)] bg-[color:var(--p-warn-bg)] px-3 py-2.5">
            <DefPill tone="p0" count={od.counts.p0} />
            <DefPill tone="p1" count={od.counts.p1} />
            <DefPill tone="p2" count={od.counts.p2} />
            <DefPill tone="p3" count={od.counts.p3} />
          </div>
          <p className="mt-auto text-[11.5px] leading-4 text-[color:var(--p-text-2)]">
            Target by ship:{' '}
            <b className="font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
              {od.target.p0Max} P0
            </b>
            <span className="mx-1.5 text-[color:var(--p-text-4)]">·</span>
            <b className="font-[JetBrains_Mono] font-semibold text-[color:var(--p-text-1)]">
              ≤ {od.target.p1Max} P1
            </b>
            <span className="ml-1.5 font-bold text-[color:var(--p-pass)]">▼ on track</span>
          </p>
          <a
            href={od.drillLinkHref}
            className="mt-1.5 inline-flex min-h-6 items-center gap-1 text-[12px] font-semibold text-[color:var(--p-secondary)] no-underline hover:text-[color:var(--p-text-1)]"
          >
            {od.drillLinkLabel}
            <ArrowRight className="h-[11px] w-[11px]" strokeWidth={2.2} />
          </a>
        </article>

        {/* Readiness gates */}
        <article className="flex min-h-[160px] flex-col gap-2.5 rounded-xl border border-[color:var(--p-border)] bg-[color:var(--p-card)] p-4 md:min-h-[180px] md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--p-text-3)]">
              Release readiness gates
            </span>
            <span className="inline-flex h-[22px] items-center gap-0.5 whitespace-nowrap rounded border border-[color:var(--p-pass-line)] bg-[color:var(--p-pass-bg)] px-1.5 py-0.5 text-[11px] font-[JetBrains_Mono] font-semibold leading-none text-[color:var(--p-pass)]">
              {rg.passed} of {rg.total} passed
            </span>
          </div>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {rg.gates.map((g) => (
              <div
                key={g.name}
                className="flex flex-wrap items-center gap-2.5 text-[12.5px] leading-[17px] text-[color:var(--p-text-1)]"
              >
                <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[color:var(--p-pass)] bg-[color:var(--p-pass-bg)] text-[color:var(--p-pass)]">
                  <Check className="h-[9px] w-[9px]" strokeWidth={3.6} />
                </span>
                <span className="min-w-[120px] flex-1 font-semibold text-[color:var(--p-text-1)]">
                  {g.name}
                </span>
                <span className="text-right text-[11px] text-[color:var(--p-text-3)]">
                  {g.detail}
                </span>
              </div>
            ))}
          </div>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[color:var(--p-pass-line)] bg-[color:var(--p-pass-bg)] px-2.5 py-1.5 text-[12px] text-[color:var(--p-text-2)]">
            <Check
              className="h-[11px] w-[11px] shrink-0 text-[color:var(--p-pass)]"
              strokeWidth={3}
            />
            <span>
              <b className="font-[JetBrains_Mono] font-bold text-[color:var(--p-pass)]">
                {rg.passed} of {rg.total} gates passed.
              </b>{' '}
              Release-ready.
            </span>
          </span>
        </article>
      </div>
    </section>
  );
}

function DefPill({ tone, count }: { tone: 'p0' | 'p1' | 'p2' | 'p3'; count: number }) {
  const cls = {
    p0: 'bg-[color:var(--p-fail-bg)] text-[color:var(--p-fail)] border-[color:var(--p-fail-line)]',
    p1: 'bg-[rgba(249,115,22,0.15)] text-[#FB923C] border-[rgba(249,115,22,0.40)] dark:bg-[#FFEDD5] dark:text-[#C2410C] dark:border-[#FDBA74]',
    p2: 'bg-[color:var(--p-warn-bg)] text-[color:var(--p-warn)] border-[color:var(--p-warn-line)]',
    p3: 'bg-[color:var(--p-card-soft)] text-[color:var(--p-text-3)] border-[color:var(--p-border)]',
  }[tone];
  return (
    <span
      className={`inline-flex h-[26px] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] font-[JetBrains_Mono] font-bold leading-none ${cls}`}
    >
      <span className="mr-px text-[15px] font-extrabold">{count}</span>
      <span className="text-[10px] tracking-[0.06em]">{tone.toUpperCase()}</span>
    </span>
  );
}
