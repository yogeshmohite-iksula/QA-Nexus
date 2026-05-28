'use client';

import { f25Demo } from './data/canned-data';
import { AgentTooltip } from './agents/AgentTooltip';
import { TrendingUp, MessageSquare } from 'lucide-react';

export function RoiValueTile() {
  const { roi } = f25Demo;
  const { formula } = roi;

  return (
    <section
      data-canonical-section="roi-value"
      role="region"
      aria-label="Release ROI"
      className="grid grid-cols-1 gap-5 rounded-[14px] border-2 border-[color:var(--p-primary)] bg-[color:var(--p-card)] p-5 shadow-[0_1px_0_0_rgba(13,148,136,0.06)] md:p-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8 lg:p-7"
    >
      {/* Left — hero + formula */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--p-primary)]">
          <TrendingUp className="h-[11px] w-[11px]" strokeWidth={2} />
          ROI · This release
        </div>
        <h2 className="m-0 break-words text-[42px] font-[JetBrains_Mono] font-bold leading-[48px] tracking-[-0.02em] text-[color:var(--p-text-1)] sm:text-[48px] sm:leading-[54px] lg:text-[54px] lg:leading-[60px]">
          <span className="text-[color:var(--p-primary)]">{roi.headlinePct}%</span> ROI
        </h2>
        <p className="m-0 max-w-[520px] text-sm leading-[21px] text-[color:var(--p-text-2)]">
          QA &amp; AI generated{' '}
          <b className="font-semibold text-[color:var(--p-text-1)]">{roi.headlinePct}% return</b> on
          AI infrastructure investment for this release. Conservative net is{' '}
          <b className="font-semibold text-[color:var(--p-text-1)]">{roi.conservativePct}%</b>{' '}
          (excluding indirect benefits).
        </p>

        {/* Formula breakdown */}
        <div
          aria-label="ROI formula breakdown"
          className="mt-1.5 rounded-lg border border-[color:var(--p-border)] bg-[color:var(--p-card-soft)] px-3.5 py-3 text-[11.5px] font-[JetBrains_Mono] leading-[18px] text-[color:var(--p-text-2)]"
        >
          <FormulaRow
            label="Time saved"
            value={
              <>
                {formula.timeSavedHours} h{' '}
                <span className="font-normal text-[color:var(--p-text-3)]">
                  ({formula.timeSavedHumanDays} human-days)
                </span>
              </>
            }
          />
          <FormulaRow
            label="Blended QA rate"
            value={`₹${formula.blendedQaRateInr.toLocaleString('en-IN')} / hour`}
          />
          <FormulaRow
            label="Time value"
            value={`₹${formula.timeValueInrLakh} L · ~$${Math.round(formula.timeValueUsd / 1000)}K`}
          />
          <FormulaRow
            label="+ Defects caught"
            value={`${formula.defectsCaught} (${formula.defectsPreProd} pre-prod · ${formula.defectsStaging} staging)`}
            sep
          />
          <FormulaRow
            label="+ Stage multiplier"
            value={`avg ${formula.stageMultiplier}× (PRD cost model)`}
          />
          <FormulaRow
            label="+ Cost avoided"
            value={`₹${formula.costAvoidedInrLakh} L · defect + rework`}
          />
          <FormulaRow
            label="= Total QA value"
            value={`₹${formula.totalQaValueInrLakh} L · ~$${(formula.totalQaValueUsd / 1000).toFixed(1)}K`}
            sep
            bold
          />
          <FormulaRow
            label="− AI infra cost"
            value={`₹${formula.aiInfraCostInrLakh} L · LLM + vector DB + compute`}
          />
          <FormulaRow
            label="= Net benefit"
            value={`₹${formula.netBenefitInrLakh} L · ~$${(formula.netBenefitUsd / 1000).toFixed(1)}K`}
            sep
            bold
          />
          <div className="flex items-center justify-between gap-3 py-0.5 text-[12.5px] font-bold text-[color:var(--p-primary)]">
            <span className="flex-1">= Net ROI</span>
            <span className="text-right">
              ({formula.netBenefitInrLakh}L / {formula.aiInfraCostInrLakh}L) × 100 ={' '}
              {roi.conservativePct}%
            </span>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] italic leading-[15px] text-[color:var(--p-text-3)]">
          <b className="font-[JetBrains_Mono] font-semibold not-italic text-[color:var(--p-text-2)]">
            Note:
          </b>{' '}
          Headline {roi.headlinePct}% ROI includes indirect benefits (faster TTM, reduced hiring
          need, improved product quality perception — conservatively valued at{' '}
          <b className="font-[JetBrains_Mono] font-semibold not-italic text-[color:var(--p-text-2)]">
            ₹{formula.indirectBenefitsInrLakh} L
          </b>
          ).
        </p>
      </div>

      {/* Right — CTO quote */}
      <div className="flex flex-col justify-center gap-3.5 border-t border-[color:var(--p-border)] pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--p-text-3)]">
          <MessageSquare className="h-[11px] w-[11px]" strokeWidth={2} />
          One-line CTO summary
        </span>
        <p className="m-0 text-sm font-medium italic leading-[21px] text-[color:var(--p-text-1)] lg:text-[15px] lg:leading-[22px]">
          &ldquo;AI-generated test cases cut authoring time by{' '}
          <b className="font-bold not-italic text-[color:var(--p-primary)]">50%</b>, caught{' '}
          <b className="font-bold not-italic text-[color:var(--p-primary)]">23 shipping defects</b>{' '}
          pre-release.{' '}
          <b className="font-bold not-italic text-[color:var(--p-primary)]">
            Justifies AI investment 3× over.
          </b>
          &rdquo;
        </p>
        <span className="mt-1 text-[11px] font-[JetBrains_Mono] text-[color:var(--p-text-3)]">
          — <AgentTooltip name="Sherlock" /> narrative · approved by Akshay Panchal (QA Lead)
        </span>
      </div>
    </section>
  );
}

function FormulaRow({
  label,
  value,
  sep,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  sep?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-0.5 ${
        sep ? 'mt-1.5 border-t border-[color:var(--p-border)] pt-1.5' : ''
      } ${bold ? 'font-bold text-[color:var(--p-text-1)]' : ''}`}
    >
      <span className="flex-1">{label}</span>
      <span className="text-right font-semibold text-[color:var(--p-text-1)]">{value}</span>
    </div>
  );
}
