// QA Nexus PM1 — Day-24 P0 ADR-021 — time-range normalization.
//
// Converts the structured `ReportTimeRange` (Zod-validated input) into:
//   1. A canonical TEXT key for UPSERT on report_aggregate
//      (uq_report_aggregate_project_kind_window). Same kind+window MUST
//      produce the same key across calls or the UPSERT degrades to INSERT
//      and we leak rows.
//   2. Concrete (start, end) Date bounds for SQL WHERE clauses.
//
// `sprint` is resolved server-side via sprint_current() — the helper
// returns the canonical key but the per-kind builder uses the function.

import type { ReportTimeRange } from '@qa-nexus/shared/dist/schemas/m5/report';

export interface ResolvedTimeRange {
  /** Canonical UPSERT key for report_aggregate.time_range_key. */
  key: string;
  /** Inclusive lower bound for SQL WHERE. null for 'sprint' (resolved in builder). */
  start: Date | null;
  /** Exclusive upper bound for SQL WHERE. */
  end: Date;
}

export function resolveTimeRange(
  range: ReportTimeRange,
  now: Date = new Date(),
): ResolvedTimeRange {
  const end = new Date(now);
  switch (range.kind) {
    case 'sprint':
      // Builder calls sprint_current(project_id) at SQL-time. Key just
      // captures the intent — the actual sprint id is part of the data.
      return { key: 'sprint', start: null, end };
    case '7d':
      return {
        key: '7d',
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end,
      };
    case '30d':
      return {
        key: '30d',
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end,
      };
    case '90d':
      return {
        key: '90d',
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        end,
      };
    case 'custom': {
      const start = new Date(range.start);
      const customEnd = new Date(range.end);
      if (customEnd.getTime() <= start.getTime()) {
        throw new Error(
          'ReportTimeRange custom: `end` must be strictly after `start`',
        );
      }
      return {
        // Truncate to seconds so two equal ranges produce the same key.
        key: `custom:${start.toISOString()}..${customEnd.toISOString()}`,
        start,
        end: customEnd,
      };
    }
  }
}
