// F27 StatsStrip — phead chips with tone-aware rendering + sync pill.
// Canonical: "Admin-only · Lead read-only" is one secondary-tinted span (NOT two).

'use client';

import type { F27StatsData, F27SyncData } from '@/components/admin/users-roles/types';

interface Props {
  data: F27StatsData;
  sync: F27SyncData;
}

export function StatsStrip({ data, sync }: Props) {
  const items: React.ReactNode[] = [];
  data.forEach((chip, i) => {
    if (i > 0) {
      items.push(
        <span key={`sep-${i}`} className="sep" aria-hidden="true">
          ·
        </span>,
      );
    }
    if (chip.tone === 'secondary') {
      items.push(
        <span key={i} role="listitem" style={{ color: 'var(--secondary)' }}>
          {chip.label}
        </span>,
      );
    } else {
      items.push(
        <span key={i} role="listitem">
          <b>{chip.label}</b>
          {chip.suffix && <> {chip.suffix}</>}
        </span>,
      );
    }
  });
  return (
    <div className="stats-strip" role="list" aria-label="Users & Roles statistics">
      {items}
      <span className="synced">
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M3 8l3 3 7-7" />
        </svg>
        {sync.label}
      </span>
    </div>
  );
}
