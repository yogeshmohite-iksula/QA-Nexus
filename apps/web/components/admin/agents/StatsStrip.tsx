// F26 StatsStrip — phead chip strip per canonical .stats-strip.

'use client';

import type { F26StatsData } from '@/components/admin/agents/types';

// Parse canonical chip "<b>N</b> rest" pattern from canned label.
function splitChip(label: string): { bold: string; rest: string } | null {
  // Canonical splits at the first space; the leading number/value is bold.
  const m = label.match(/^(\S+)\s+(.+)$/);
  if (!m) return null;
  return { bold: m[1], rest: m[2] };
}

interface Props {
  data: F26StatsData;
}

export function StatsStrip({ data }: Props) {
  // Last chip is the "Synced" one with the check icon.
  const main = data.slice(0, -1);
  const synced = data[data.length - 1];
  return (
    <div className="stats-strip">
      {main.map((chip, i) => {
        const parts = splitChip(chip.label);
        return (
          <span key={i}>
            {parts ? (
              <>
                <b>{parts.bold}</b> {parts.rest}
              </>
            ) : (
              chip.label
            )}
            {i < main.length - 1 && <span className="sep"> · </span>}
          </span>
        );
      })}
      {synced && (
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
          {synced.label}
        </span>
      )}
    </div>
  );
}
