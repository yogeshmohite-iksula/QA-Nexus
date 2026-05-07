// F13 KB Imports — REAL BE-wired API client (Pattern B).
//
// Day-12 TASK 2 (M2 close). PR #60 (BE+1 KB document CRUD) shipped:
//   GET    /api/projects/:projectId/kb/documents
//   GET    /api/projects/:projectId/kb/documents/:docId
//   DELETE /api/projects/:projectId/kb/documents/:docId
//
// Both list + delete are consumed here. List is read-only (no auth
// step needed beyond the shared cookie session). Delete is RBAC-gated
// to Admin / Lead.
//
// FE absolute-URL discipline (compound learning from Day-10): use
// NEXT_PUBLIC_API_BASE_URL as the absolute prefix — matches
// `users-api.ts` and `auth/client.ts`. Defaults to localhost:3001 in
// dev; set to the Render URL via Cloudflare Pages env vars in prod.

import {
  KbDocumentListResponse,
  KbDocumentDeleteResponse,
  type KbDocumentListItem,
} from '@qa-nexus/shared';

export type { KbDocumentListItem };
export type { KbDocumentListResponse, KbDocumentDeleteResponse } from '@qa-nexus/shared';

const API_BASE = (
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001') as string
).replace(/\/$/, '');

/** GET /api/projects/:projectId/kb/documents — list KB documents for a project.
 *  Cookie session; cross-workspace access yields 401/403. */
export async function fetchKbImports(projectId: string): Promise<KbDocumentListResponse> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/kb/documents`, {
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`GET /api/projects/${projectId}/kb/documents → HTTP ${res.status}`);
  }
  const json = await res.json();
  return KbDocumentListResponse.parse(json);
}

/** DELETE /api/projects/:projectId/kb/documents/:docId — remove a KB
 *  document and its indexed chunks. RBAC: Admin / Lead only. */
export async function deleteKbImport(
  projectId: string,
  docId: string,
): Promise<KbDocumentDeleteResponse> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/kb/documents/${docId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  if (!res.ok) {
    let msg = `DELETE /api/projects/${projectId}/kb/documents/${docId} → HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') msg = body.message;
    } catch {
      // ignore non-JSON bodies; keep the generic message
    }
    throw new Error(msg);
  }
  const json = await res.json();
  return KbDocumentDeleteResponse.parse(json);
}
