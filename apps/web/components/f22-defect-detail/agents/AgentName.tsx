'use client';
// Rule 15 — every AI agent reference in UI renders through this component.
// Never plain "AI" or "the system".

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AgentCode } from '../types';

const AGENTS: Record<AgentCode, { label: string; tooltip: string }> = {
  composer: {
    label: 'Composer',
    tooltip: 'Test Case Generator agent (drafts test cases from requirements)',
  },
  curator: {
    label: 'Curator',
    tooltip: 'Duplicate Detection & Clustering agent (pgvector cosine similarity)',
  },
  sherlock: {
    label: 'Sherlock',
    tooltip: 'Defect Intelligence agent (5-layer Root Cause Analysis)',
  },
};

export function AgentName({ code, className = '' }: { code: AgentCode; className?: string }) {
  const a = AGENTS[code];
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold text-[color:var(--secondary)] ${className}`}
    >
      {a.label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${a.label}`}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--t3)] hover:text-[color:var(--secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--secondary)]"
          >
            <Info className="h-2.5 w-2.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{a.tooltip}</TooltipContent>
      </Tooltip>
    </span>
  );
}
