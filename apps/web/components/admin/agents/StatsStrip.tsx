// F26 StatsStrip — 5 chips inside phead.

'use client';

import type { F26StatsData } from '@/components/admin/agents/types';

interface Props {
  data: F26StatsData;
}

export function StatsStrip({ data }: Props) {
  return (
    <div className="stats-strip" role="list" aria-label="Agent statistics">
      {data.map((chip, i) => (
        <span key={i} role="listitem" className="stat-chip">
          {chip.label}
        </span>
      ))}
    </div>
  );
}
