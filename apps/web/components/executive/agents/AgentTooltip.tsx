'use client';

import { AGENT_TOOLTIPS, type AgentName } from '../data/canned-data';

interface AgentTooltipProps {
  /** Agent name — Sherlock | Curator | Composer */
  name: AgentName;
  /** Override font-size for inline use (default inherits) */
  size?: 'sm' | 'md' | 'inherit';
  /** Hide the visible name — render only the ⓘ pill */
  iconOnly?: boolean;
  /** Visual style class for the name text */
  className?: string;
}

/**
 * Agent name + hover ⓘ tooltip (Hard Rule 15).
 *
 * Renders the canonical agent name (Sherlock | Curator | Composer)
 * followed by a small ⓘ that reveals the agent's role on hover.
 *
 * Tooltip text is sourced from AGENT_TOOLTIPS in canned-data.ts so
 * there is exactly one place to edit per-agent descriptions.
 */
export function AgentTooltip({
  name,
  size = 'inherit',
  iconOnly = false,
  className = '',
}: AgentTooltipProps) {
  const sizeClass = size === 'sm' ? 'text-[11px]' : size === 'md' ? 'text-[13px]' : '';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${sizeClass} ${className}`}>
      {!iconOnly && (
        <span className="font-[DM_Sans] leading-none text-[color:var(--p-secondary)]">{name}</span>
      )}
      <span
        role="tooltip"
        tabIndex={0}
        aria-label={AGENT_TOOLTIPS[name]}
        title={AGENT_TOOLTIPS[name]}
        className="relative inline-flex h-[14px] w-[14px] shrink-0 cursor-help items-center justify-center rounded-full border border-[color:var(--p-secondary-line)] bg-[color:var(--p-secondary-bg)] align-middle text-[9px] font-bold italic text-[color:var(--p-secondary)] hover:border-[color:var(--p-secondary)] hover:bg-[color:var(--p-secondary)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--p-secondary)]"
      >
        i
      </span>
    </span>
  );
}
