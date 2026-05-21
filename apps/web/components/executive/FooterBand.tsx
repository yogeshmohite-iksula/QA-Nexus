'use client';

import { f25Demo } from './data/canned-data';
import { AgentTooltip } from './agents/AgentTooltip';

/**
 * Footer band — last updated · agent credits · permalink to drill-down.
 *
 * Renders as <footer role="contentinfo"> at the bottom of the prove
 * canvas. Both agent mentions (Sherlock + Composer) use AgentTooltip
 * per Hard Rule 15.
 */
export function FooterBand() {
  const { footer } = f25Demo;

  return (
    <footer
      role="contentinfo"
      className="flex flex-wrap items-center justify-between gap-3.5 border-t border-[color:var(--p-border)] pt-3.5 text-[11px] text-[color:var(--p-text-3)]"
    >
      <span>
        Last updated ·{' '}
        <span className="font-[JetBrains_Mono] text-[color:var(--p-text-2)]">
          {footer.lastUpdatedAt}
        </span>
      </span>
      <span className="inline-flex flex-wrap items-center gap-1">
        Powered by <AgentTooltip name="Sherlock" size="sm" /> +{' '}
        <AgentTooltip name="Composer" size="sm" /> agents
      </span>
      <a
        href={footer.permalink.href}
        className="inline-flex min-h-6 items-center font-semibold text-[color:var(--p-secondary)] no-underline hover:underline"
      >
        {footer.permalink.label}
      </a>
    </footer>
  );
}
