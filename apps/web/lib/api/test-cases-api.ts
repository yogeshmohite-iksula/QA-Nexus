// Test Cases API — GET /api/projects/:projectId/test-cases wire for F17.
//
// Hard Rule 11 verified against BE (test-cases.controller.ts:113):
//   GET /api/projects/:projectId/test-cases  (project-scoped list)
//     → { ok, testCases: TestCaseListItem[],
//         pagination: { total, page, pageSize } }
//   Shared schemas: TestCaseListItem (line 206) + TestCaseListResponse
//   (line 224) in packages/shared/src/schemas/test-case.ts.
//
// F17 placeholder today shows only chrome (the F22 full table lands later
// in M3) — wiring this endpoint surfaces a live "N cases · N suites" header
// count, replacing the canned "1,284 cases" stub. The full row-display
// adapter ships when the F22 list view does.

import {
  TestCaseListResponse,
  type TestCaseListResponse as TestCaseListResponseT,
} from '@qa-nexus/shared';

import { fetchWithFallback } from './fetch-with-fallback';

/** Project-scoped test-case list. Null = fetch failed → caller renders
 *  the canned chrome unchanged. */
export async function fetchTestCases(
  projectId: string,
  page = 1,
  pageSize = 100,
): Promise<TestCaseListResponseT | null> {
  return fetchWithFallback<TestCaseListResponseT | null>(
    `/api/projects/${projectId}/test-cases?page=${page}&pageSize=${pageSize}`,
    null,
    { schema: TestCaseListResponse, label: 'F17 test cases list' },
  );
}
