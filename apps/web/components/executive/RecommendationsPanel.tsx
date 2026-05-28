'use client';

import { f25Demo } from './data/canned-data';
import { AgentTooltip } from './agents/AgentTooltip';
import { Search } from 'lucide-react';

/**
 * Sherlock pre-ship recommendations panel.
 *
 * Header has the violet agent glyph + Sherlock name + version pill.
 * List items are styled with a violet bullet; positive signals are
 * tagged with green "+ Positive signal:" prefix.
 *
 * Curator mention inside the positive bullet uses AgentTooltip.
 */
export function RecommendationsPanel() {
  const { recommendations } = f25Demo;

  return (
    <section
      data-canonical-section="recommendations"
      role="region"
      aria-labelledby="rec-heading"
      className="flex flex-col gap-3 rounded-xl border border-[color:var(--p-secondary-line)] bg-[color:var(--p-secondary-bg)] p-[18px] md:p-[22px]"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[color:var(--p-secondary)]"
          style={{
            background: 'color-mix(in srgb, var(--p-secondary) 20%, transparent)',
            border: '1px solid color-mix(in srgb, var(--p-secondary) 40%, transparent)',
          }}
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
        <h3
          id="rec-heading"
          className="m-0 text-[15px] font-[DM_Sans] font-bold text-[color:var(--p-text-1)]"
        >
          Pre-ship recommendations
        </h3>
        <span
          className="ml-auto inline-flex h-[18px] items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[9.5px] font-[JetBrains_Mono] font-bold uppercase leading-none tracking-[0.04em] text-[color:var(--p-secondary)]"
          style={{
            background: 'color-mix(in srgb, var(--p-secondary) 14%, transparent)',
            border: '1px solid color-mix(in srgb, var(--p-secondary) 40%, transparent)',
          }}
        >
          <AgentTooltip name={recommendations.agent} className="text-[9.5px] tracking-[0.04em]" />·{' '}
          {recommendations.version}
        </span>
      </div>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {recommendations.items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-[13px] leading-[19px] text-[color:var(--p-text-1)]"
          >
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--p-secondary)]" />
            <RecItem item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecItem({ item }: { item: { positive: boolean; body: string } }) {
  // Handle Curator mention in the positive bullet specially — render with AgentTooltip
  if (item.positive && item.body.includes('Curator')) {
    return (
      <span>
        <span className="font-semibold text-[color:var(--p-pass)]">+ Positive signal:</span>{' '}
        <AgentTooltip name="Curator" /> caught{' '}
        <b className="font-semibold">24 duplicate test cases</b>, preventing{' '}
        <b className="font-semibold">12 hours</b> of redundant test runs. Recommend expanding
        Curator across projects.
      </span>
    );
  }

  // Lightly mark up code fragments and bold "Recommendation:"-style cues
  return <span dangerouslySetInnerHTML={{ __html: markup(item.body) }} />;
}

function markup(text: string): string {
  return (
    text
      // Code chunks (lowercase_with_underscores, percentages with arrows, etc.)
      .replace(
        /(\bpayment_retry\b|\bcheckout_timeout\b|\badmin_cache_clear\b)/g,
        '<span class="font-[JetBrains_Mono] text-[12px] text-[color:var(--p-secondary)] bg-[rgba(124,58,237,0.10)] px-1 py-px rounded-[3px]">$1</span>',
      )
      .replace(
        /(\b\d+%\s*→\s*\d+%)/g,
        '<span class="font-[JetBrains_Mono] text-[12px] text-[color:var(--p-secondary)] bg-[rgba(124,58,237,0.10)] px-1 py-px rounded-[3px]">$1</span>',
      )
      // Bold key phrases
      .replace(
        /^(Flaky test stabilization complete\.|P1 admin_cache_clear occasionally hangs\.|Coverage gap\.)/,
        '<b class="text-[color:var(--p-text-1)] font-semibold">$1</b>',
      )
      .replace(
        /(No further action\.|Does not block release\.|Patch ready for v2\.1\.)/g,
        '<b class="text-[color:var(--p-text-1)] font-semibold">$1</b>',
      )
      .replace(
        /(\b1 hour before smoke test Apr 28\b|\blow\b(?= \.)|\b5% untested\b)/g,
        '<b class="text-[color:var(--p-text-1)] font-semibold">$1</b>',
      )
  );
}
