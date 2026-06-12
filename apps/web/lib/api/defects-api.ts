// Defects API — GET /api/defects (+ /:id) wire for F21 Defects Hub.
//
// Hard Rule 11 verified against BE #271 (defects.controller.ts):
//   GET /api/defects     (all 4 roles) → { ok, defects: DefectListItem[],
//                                          pagination: { total, page, pageSize } }
//   GET /api/defects/:id (all 4 roles) → { ok, defect } · cross-tenant → 404
// ⚠ OFFSET-paged (page/pageSize, max 100) — NOT cursor-paged like /api/audit.
// Each endpoint is consumed per its own contract (44th-RC discipline).
//
// Shapes from @qa-nexus/shared (Rule 10): DefectListItem extends the base
// DefectSchema with component/verifiedAt/closedAt + project{id,key,name} +
// assignee{id,displayName}|null (the M4 read-shape — NOT base DefectSchema).
//
// defectToRow adapts an API row → the F21 canonical DefectRow display shape.
// Display-only fields the data model doesn't carry (type chip, agent pill,
// impact tiles) get neutral defaults — no invented data, just chrome.

import {
  DefectListResponse,
  DefectDetailResponse,
  type DefectListItem,
  type DefectListResponse as DefectListResponseT,
  type DefectDetailResponse as DefectDetailResponseT,
  type DefectStatus,
} from '@qa-nexus/shared';

import type { DefectRow, DefectStatusKey } from '@/components/defects/canned-data';
import { fetchWithFallback } from './fetch-with-fallback';

/** First page of workspace defects (pilot dataset = 25 seeded rows; BE max
 *  pageSize 100 covers it in one fetch). Null = fetch failed → canned. */
export async function fetchDefects(page = 1, pageSize = 100): Promise<DefectListResponseT | null> {
  return fetchWithFallback<DefectListResponseT | null>(
    `/api/defects?page=${page}&pageSize=${pageSize}`,
    null,
    { schema: DefectListResponse, label: 'F21 defects list' },
  );
}

/** Single defect (F22 header data). Cross-tenant / unknown id → BE 404 →
 *  fetchWithFallback returns null (graceful). */
export async function fetchDefectDetail(id: string): Promise<DefectDetailResponseT | null> {
  return fetchWithFallback<DefectDetailResponseT | null>(`/api/defects/${id}`, null, {
    schema: DefectDetailResponse,
    label: 'F22 defect detail',
  });
}

/** Real DefectStatus → F21 status chip key (drives chip color). */
const STATUS_TO_KEY: Record<DefectStatus, DefectStatusKey> = {
  new: 'open',
  reopened: 'open',
  triaged: 'open',
  in_progress: 'progress',
  blocked: 'progress',
  verified: 'qa',
  resolved: 'fixed',
  closed: 'closed',
};

/** Humanized status label, e.g. 'in_progress' → 'In Progress'. */
function statusLabelOf(status: DefectStatus): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function initialsOf(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function daysAgoLabel(iso: string): { age: string; days: number } {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  return { age: days < 1 ? '<1d ago' : `${days}d ago`, days };
}

/** API defect → F21 canonical DefectRow display shape. */
export function defectToRow(d: DefectListItem): DefectRow {
  const { age, days } = daysAgoLabel(d.createdAt);
  return {
    id: d.key,
    priority: d.severity.toLowerCase() as DefectRow['priority'],
    title: d.title,
    // The data model has no defect-type taxonomy yet — neutral App Bug chip.
    typeKey: 'appbug',
    typeLabel: 'App Bug',
    statusKey: STATUS_TO_KEY[d.status],
    statusLabel: statusLabelOf(d.status),
    agentKey: null,
    metaSegments: [
      { kind: 'text', value: d.project.key },
      ...(d.component ? [{ kind: 'text', value: d.component } as const] : []),
    ],
    ref: null,
    impact: null,
    assignee: d.assignee
      ? {
          initials: initialsOf(d.assignee.displayName),
          name: d.assignee.displayName,
          avatarTone: 'teal',
        }
      : { initials: '—', name: 'Unassigned', avatarTone: 'none' },
    age,
    opened: `opened ${days}d`,
    staleLabel: null,
  };
}
