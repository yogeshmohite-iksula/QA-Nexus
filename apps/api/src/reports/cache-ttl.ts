// QA Nexus PM1 — Day-24 P0 ADR-021 — per-kind cache TTL constants.
//
// Drives lru-cache `ttl` option per ReportKind. SWR (stale-while-revalidate)
// kicks in once TTL expires; the cached value is still SERVED while a
// background recompute fires. Industry-standard 2026 NestJS pattern.

import type { ReportKind } from '@qa-nexus/shared/dist/schemas/m5/report';

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;

/** Per-kind cache TTL in ms.
 *  Tuned from ADR-021 §2 expected refresh cadence:
 *  - Hot/live (5min): cycle_pass_rate, sprint_progress — change every test run / sprint event
 *  - Medium (15-30min): defect_age, test_coverage — change on defect-state transitions / TC executions
 *  - Cold (1hr): agent_cost, requirement_coverage — slow-moving; once-per-batch updates */
export const CACHE_TTL_MS: Record<ReportKind, number> = {
  cycle_pass_rate: 5 * ONE_MINUTE,
  sprint_progress: 5 * ONE_MINUTE,
  defect_age: 15 * ONE_MINUTE,
  test_coverage: 30 * ONE_MINUTE,
  agent_cost: ONE_HOUR,
  requirement_coverage: ONE_HOUR,
};

/** lru-cache `max` items — bounded to prevent unbounded growth at scale.
 *  Worst case at pilot: 6 kinds × 6 projects × 4 windows = 144 entries.
 *  Setting max=512 absorbs custom-range queries + buffer; ~1MB heap. */
export const CACHE_MAX_ENTRIES = 512;
