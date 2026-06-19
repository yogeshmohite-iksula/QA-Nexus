// Requirements API — GET /api/projects/:projectId/requirements wire for F14.
//
// Hard Rule 11 verified against BE (requirements.controller.ts):
//   GET /api/projects/:projectId/requirements  (project-scoped list)
//     → { ok, requirements: RequirementListItem[],
//         pagination: { total, page, pageSize } }
//   Project-scoped via path param — NOT a flat /api/requirements query.
//   Shared schemas: RequirementListItem (line 83) + RequirementListResponse
//   (line 102) in packages/shared/src/schemas/requirement.ts.
//
// `requirementToRow` adapts an API row → the F14 page's `Requirement`
// display shape. Several display-only fields don't exist in the list
// response (description, rtmTotal, rtmLinkedBy, updatedBy) — those get
// neutral fallbacks. Description is only in the detail endpoint; rtmTotal
// has no equivalent in the data model so we render `linkedTestCaseCount`
// without a "X of Y" denominator.

import {
  RequirementListResponse,
  type RequirementListItem,
  type RequirementListResponse as RequirementListResponseT,
  type RequirementStatus,
} from '@qa-nexus/shared';

import { fetchWithFallback } from './fetch-with-fallback';

/** Project-scoped requirements list. Null = fetch failed → canned. */
export async function fetchRequirements(
  projectId: string,
  page = 1,
  pageSize = 100,
): Promise<RequirementListResponseT | null> {
  return fetchWithFallback<RequirementListResponseT | null>(
    `/api/projects/${projectId}/requirements?page=${page}&pageSize=${pageSize}`,
    null,
    { schema: RequirementListResponse, label: 'F14 requirements list' },
  );
}

/** Display-side status keys used by F14 chip styling. The BE enum
 *  (`draft|active|done|archived`) doesn't 1:1 match the original display
 *  enum (`draft|in-review|approved|archived`); we collapse it as below
 *  (active → in-review, done → approved). */
export type RequirementDisplayStatus = 'approved' | 'in-review' | 'draft' | 'archived';
export type RequirementDisplayCoverage = 'full' | 'gap' | 'empty';
export type RequirementDisplayPriority = 'P0' | 'P1' | 'P2' | 'P3';

const STATUS_TO_DISPLAY: Record<RequirementStatus, RequirementDisplayStatus> = {
  draft: 'draft',
  active: 'in-review',
  done: 'approved',
  archived: 'archived',
};

/** Coverage derived from `linkedTestCaseCount` only (no expected-total in
 *  data model). 0 = empty, > 0 = full. The "gap" state requires a target
 *  count BE doesn't track yet, so we never surface it from live data. */
function coverageOf(linkedTestCaseCount: number): RequirementDisplayCoverage {
  return linkedTestCaseCount === 0 ? 'empty' : 'full';
}

/** ISO timestamp → "N hr ago" / "N min ago" / "N day ago". Same shape as
 *  audit-api.relativeFreshness() but inlined to avoid coupling. */
function relativeFreshness(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

/** Display-side source type. Page-level chrome only renders the 'jira'
 *  and 'manual' chips; an `upload`-sourced requirement (CSV/XLSX import)
 *  is displayed under the 'manual' chip — the data model distinction is
 *  surfaced on the detail drawer, not the list row. */
export type RequirementDisplaySource = 'jira' | 'manual';

/** Structural display row — decoupled from the F14 page's frozen literal
 *  Requirement type so we can keep canned-data narrow + live data wide. */
export interface RequirementRow {
  id: string;
  title: string;
  description: string;
  priority: RequirementDisplayPriority;
  status: RequirementDisplayStatus;
  coverage: RequirementDisplayCoverage;
  rtmLinked: number;
  rtmTotal: number | null;
  rtmLinkedBy: string;
  updatedAtRelative: string;
  updatedBy: string;
  source: RequirementDisplaySource;
}

/** Adapt a BE list row → F14 display row. */
export function requirementToRow(item: RequirementListItem): RequirementRow {
  return {
    id: item.key,
    title: item.title,
    description: '',
    priority: item.priority as RequirementDisplayPriority,
    status: STATUS_TO_DISPLAY[item.status],
    coverage: coverageOf(item.linkedTestCaseCount),
    rtmLinked: item.linkedTestCaseCount,
    rtmTotal: null,
    rtmLinkedBy: '',
    updatedAtRelative: relativeFreshness(item.updatedAt),
    updatedBy: '',
    source: item.source === 'jira' ? 'jira' : 'manual',
  };
}
