// AgentName — single source of truth for the named-agent display
// pattern (Composer / Curator / Sherlock) per Hard Rule 15.
//
// Spec:
//   - Always render the user-facing display name (Composer / Curator
//     / Sherlock) — NEVER the internal code (A1/A2/A4) in the UI.
//   - Render an ⓘ info icon to the right of the name.
//   - Hover tooltip on the icon shows the canonical agent description.
//   - Visual styling: violet (`var(--secondary)`) text matches AI
//     surface canon per 01_SYSTEM.md §3.1.
//
// Usage:
//   <AgentName code="composer" />
//   <AgentName code="curator" />
//   <AgentName code="sherlock" />
//
// The `code` prop accepts either the lowercase name ("composer") or
// the legacy A1/A2/A4 code (case-insensitive). Both resolve to the
// same display name + description.

'use client';

import { Info } from 'lucide-react';

export type AgentCode =
  | 'composer'
  | 'curator'
  | 'sherlock'
  | 'A1'
  | 'A2'
  | 'A4'
  | 'a1'
  | 'a2'
  | 'a4';

interface AgentSpec {
  display: string;
  /** Canonical tooltip text per Hard Rule 15. */
  description: string;
}

const SPECS: Record<string, AgentSpec> = {
  composer: {
    display: 'Composer',
    description: 'Test Case Generator agent',
  },
  curator: {
    display: 'Curator',
    description: 'Duplicate Detection agent',
  },
  sherlock: {
    display: 'Sherlock',
    description: 'Defect Intelligence agent (5-layer Root Cause Analysis)',
  },
};

const CODE_TO_KEY: Record<string, keyof typeof SPECS> = {
  composer: 'composer',
  a1: 'composer',
  curator: 'curator',
  a2: 'curator',
  sherlock: 'sherlock',
  a4: 'sherlock',
};

interface AgentNameProps {
  code: AgentCode;
  /** Hide the "ⓘ" info icon (e.g. when used inside a busy chip). */
  noIcon?: boolean;
  /** Override font-size to inherit (default 12.5px-ish via inline). */
  inherit?: boolean;
}

export function AgentName({ code, noIcon = false, inherit = false }: AgentNameProps) {
  const key = CODE_TO_KEY[code.toLowerCase()];
  const spec = key ? SPECS[key] : null;
  if (!spec) return null;
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-semibold',
        inherit ? '' : 'text-[12.5px]',
      ].join(' ')}
      style={{ color: 'var(--secondary)' }}
    >
      {spec.display}
      {!noIcon && (
        <span
          aria-label={spec.description}
          title={spec.description}
          className="inline-flex cursor-help items-center"
        >
          <Info size={11} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
