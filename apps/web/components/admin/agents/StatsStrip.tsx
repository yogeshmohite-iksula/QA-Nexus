// F26 StatsStrip — accepts `data?` for Phase-2 wire-up.
// Phase-1 fallback: render the 5 canonical chips verbatim from F26_RAW.textByTag.span.
// Phase-2: receive F26StatsData from semantic canned-data export (with tone metadata).

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26StatsData } from '@/components/admin/agents/types';

// Canonical Phase-1 chip strings (verbatim in textByTag).
const CHIP_KEYS = [
  '3 agents active',
  '47 decisions today',
  '98.2% accept rate',
  '$0.00 cost today',
  'Synced 1 min ago',
] as const;

function chip(text: string): string {
  return F26_RAW.textByTag.span.find((s) => s === text) ?? text;
}

interface Props {
  data?: F26StatsData;
}

export function StatsStrip({ data }: Props) {
  // Phase-2: render data if provided (carries tone metadata).
  if (data && data.length > 0) {
    return (
      <div className="stats-strip" role="list" aria-label="Agent statistics">
        {data.map((c, i) => (
          <span key={i} role="listitem" className="stat-chip" data-tone={c.tone}>
            {c.text}
          </span>
        ))}
      </div>
    );
  }
  // Phase-1 fallback.
  return (
    <div className="stats-strip" role="list" aria-label="Agent statistics">
      {CHIP_KEYS.map((c, i) => (
        <span key={i} role="listitem" className="stat-chip">
          {chip(c)}
        </span>
      ))}
    </div>
  );
}
