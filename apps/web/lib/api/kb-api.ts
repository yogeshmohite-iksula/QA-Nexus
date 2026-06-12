// F15 Knowledge Base — REAL BE-wired API client (Pattern B).
//
// Day-12 TASK 3 (M2 close). Connection-pause from `kb-page.connection-pause.md`
// closed: stub fetchers replaced with real `fetch()` calls. The wire shapes
// (`KbSearchRequest`/`KbSearchResponse`/`Chunk`/`ChunkDetail`/`KbAnswerRequest`/
// `KbAnswerResponse`) are LOCKED in `packages/shared/src/schemas/kb.ts`.
//
// Endpoints:
//   - POST /api/projects/:projectId/kb/search        (BE+1 PR #53)
//   - POST /api/projects/:projectId/kb/answer        (BE+1 PR #57, RAG)
//   - GET  /api/projects/:projectId/kb/chunks/:chunkId
//
// FE absolute-URL discipline: `NEXT_PUBLIC_API_BASE_URL` prefix matches
// the pattern in `users-api.ts`, `kb-imports-api.ts`, and `auth/client.ts`.
// Local dev defaults to http://localhost:3001; prod is the Render URL set
// in Cloudflare Pages env vars.

import { getApiBaseURL } from '@/lib/env';
import {
  type Chunk,
  type ChunkDetail,
  type ChunkDetailResponse,
  type KbAnswerRequest,
  type KbAnswerResponse,
  type KbSearchRequest,
  type KbSearchResponse,
  KbAnswerRequest as KbAnswerRequestSchema,
  KbAnswerResponse as KbAnswerResponseSchema,
  KbSearchRequest as KbSearchRequestSchema,
  KbSearchResponse as KbSearchResponseSchema,
  ChunkDetailResponse as ChunkDetailResponseSchema,
} from '@qa-nexus/shared';

export type {
  Chunk,
  ChunkDetail,
  ChunkDetailResponse,
  KbAnswerRequest,
  KbAnswerResponse,
  KbSearchRequest,
  KbSearchResponse,
};

export {
  KbAnswerRequestSchema,
  KbAnswerResponseSchema,
  KbSearchRequestSchema,
  KbSearchResponseSchema,
  ChunkDetailResponseSchema,
};

const API_BASE = getApiBaseURL().replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Fetchers (Pattern B — real BE)
// ---------------------------------------------------------------------------

/** POST /api/projects/:projectId/kb/search — chunk-search backed by
 *  pgvector HNSW + optional LLMGateway re-rank. Cookie session; cross-
 *  workspace requests get 401/403. */
export async function fetchKbSearch(
  projectId: string,
  req: KbSearchRequest,
): Promise<KbSearchResponse> {
  KbSearchRequestSchema.parse(req); // validate input shape pre-flight
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/kb/search`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let msg = `POST /api/projects/${projectId}/kb/search → HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') msg = body.message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(msg);
  }
  const json = await res.json();
  return KbSearchResponseSchema.parse(json);
}

/** GET /api/projects/:projectId/kb/chunks/:chunkId — single chunk
 *  detail (full text + neighbouring context). */
export async function fetchKbChunkDetail(
  projectId: string,
  chunkId: string,
): Promise<ChunkDetailResponse> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/kb/chunks/${chunkId}`, {
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`GET /api/projects/${projectId}/kb/chunks/${chunkId} → HTTP ${res.status}`);
  }
  const json = await res.json();
  return ChunkDetailResponseSchema.parse(json);
}

/** POST /api/projects/:projectId/kb/answer — RAG answer generation.
 *  Retrieves top-K chunks via the search service, prompts the LLM
 *  gateway with chunk-header citation markers, parses the model's
 *  cited UUIDs, and intersects them with the retrieved set. ADR-012
 *  details the citation discipline.
 *
 *  When the upstream search returns 0 chunks the BE short-circuits
 *  the LLM and returns `noContext: true` + the canonical "I don't
 *  have information…" string in `answer`. The FE renders that as a
 *  notice, not a chat bubble. */
export async function fetchKbAnswer(
  projectId: string,
  req: KbAnswerRequest,
): Promise<KbAnswerResponse> {
  KbAnswerRequestSchema.parse(req);
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/kb/answer`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let msg = `POST /api/projects/${projectId}/kb/answer → HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') msg = body.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  const json = await res.json();
  return KbAnswerResponseSchema.parse(json);
}
