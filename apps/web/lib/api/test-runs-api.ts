// Test Runs API — GET /api/test-runs wire for F08 /home ACTIVE_RUNS.
//
// Hard Rule 11 verified against BE #292 (test-runs.controller.ts:77 +
// shared/test-run.ts:82-122):
//   @Controller('api/test-runs') @Get() — workspace-scoped list, all 4
//   roles (read parity), NOT audited (ERD §8.7).
//   Response: { ok: true, testRuns: TestRunListItem[],
//              pagination: { total, page, pageSize } }
//   Query params: status?, projectId?, sort='started_at_desc' (default),
//                 page=1 (default), pageSize=20 (default, max 50).
//
// TestRunListItem fields (verbatim from shared/test-run.ts):
//   id, projectId, name, status, trigger, environment,
//   startedAt(nullable), completedAt(nullable),
//   totalCases, passedCases?, failedCases?,
//   triggeredBy({id,displayName}|null), project({id,key,name})
//
// 44th-RC discipline: per-endpoint contract — OFFSET pagination here,
// NOT the cursor pattern used by /api/audit.
//
// Gotchas BE+1 documented in #292:
//   • `triggeredBy` is the HUMAN (nullable; webhook/cron → null);
//     `trigger` is the trigger TYPE (manual/webhook/cron).
//   • passed/failed are optional — a queued run has no tallies yet.
//   • `test_runs` table is currently EMPTY (no seed); response is
//     `{ ok:true, testRuns:[], pagination:{total:0} }` until the runner
//     creates rows. Empty-state path must render cleanly.

import {
  TestRunListResponse,
  type TestRunListItem,
  type TestRunListResponse as TestRunListResponseT,
} from '@qa-nexus/shared';

import { fetchWithFallback } from './fetch-with-fallback';

/** ACTIVE_RUNS feed: `?status=running`, top 10 by default sort. Null =
 *  fetch failed → caller falls back to canned ACTIVE_RUNS. Empty
 *  testRuns array = honest "no active runs" state. */
export async function fetchActiveRuns(pageSize = 10): Promise<TestRunListResponseT | null> {
  return fetchWithFallback<TestRunListResponseT | null>(
    `/api/test-runs?status=running&page=1&pageSize=${pageSize}`,
    null,
    { schema: TestRunListResponse, label: 'F08 active runs' },
  );
}

/** RECENT_RUNS feed: no status filter, default sort=started_at_desc, top
 *  pageSize. Includes runs of all statuses (running/passed/failed/etc).
 *  Null = fetch failed → caller falls back to canned RECENT_RUNS. */
export async function fetchRecentRuns(pageSize = 5): Promise<TestRunListResponseT | null> {
  return fetchWithFallback<TestRunListResponseT | null>(
    `/api/test-runs?page=1&pageSize=${pageSize}`,
    null,
    { schema: TestRunListResponse, label: 'F08 recent runs' },
  );
}

/** Display-side row for the F08 ActiveRunsCard. Derived from the BE list
 *  item with case-count math + percent computation. `flaky` is dropped —
 *  BE has no flaky concept; the canned card line "X pass · X flaky · X
 *  fail · X left" shrinks to "X pass · X fail · X left" on live data. */
export interface ActiveRunRow {
  id: string;
  shortId: string;
  name: string;
  projectKey: string;
  passed: number;
  failed: number;
  total: number;
  remaining: number;
  percent: number;
}

/** Compute `percent` honestly: 0% when `totalCases === 0` (a queued run
 *  with no tallies); never NaN. */
function percentComplete(passed: number, failed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((passed + failed) / total) * 100);
}

export function testRunToActiveRow(item: TestRunListItem): ActiveRunRow {
  const passed = item.passedCases ?? 0;
  const failed = item.failedCases ?? 0;
  const total = item.totalCases;
  return {
    id: item.id,
    shortId: item.id.slice(0, 8),
    name: item.name,
    projectKey: item.project.key,
    passed,
    failed,
    total,
    remaining: Math.max(0, total - passed - failed),
    percent: percentComplete(passed, failed, total),
  };
}

/** Display-side row for the F08 RecentRunsSection. Honest summary line:
 *  `passed / failed / total` derived from the BE response; status drives
 *  the chip tone. `triggeredBy` displayName surfaces when set; "—" for
 *  webhook/cron-triggered runs. */
export interface RecentRunRow {
  id: string;
  shortId: string;
  name: string;
  projectKey: string;
  status: TestRunListItem['status'];
  summary: string;
  whenIso: string | null;
  whenRelative: string;
  triggeredByName: string;
}

function relativeFreshness(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

export function testRunToRecentRow(item: TestRunListItem): RecentRunRow {
  const passed = item.passedCases ?? 0;
  const failed = item.failedCases ?? 0;
  const total = item.totalCases;
  return {
    id: item.id,
    shortId: item.id.slice(0, 8),
    name: item.name,
    projectKey: item.project.key,
    status: item.status,
    summary: `${passed} passed / ${failed} failed / ${total} total`,
    whenIso: item.startedAt,
    whenRelative: relativeFreshness(item.startedAt),
    triggeredByName: item.triggeredBy?.displayName ?? '—',
  };
}
