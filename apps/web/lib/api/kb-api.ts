// F15 Knowledge Base — chunk-search API client scaffolding (Pattern A).
//
// Day-8 BE-gated: BE M2 chunk-search controller landed via PR #30 at
// SHA fe46d75. The wire shape (`KbSearchRequest`/`KbSearchResponse`/
// `Chunk`/`ChunkDetail`) is LOCKED in `packages/shared/src/schemas/kb.ts`
// — the BE controller currently returns 8 hardcoded fixtures from
// `return_policy_v2.xlsx`, but the response shape will not change when
// M2 swaps the stub for real pgvector HNSW search + LLMGateway re-rank.
//
// PAUSE points are explicitly marked with `// PAUSE — wait BE+1 …`
// comments. Today's call is intentionally NOT made — this scaffold
// flips to live in 30 min by replacing the stub fetcher body with a
// real `fetch()`. See `kb-page.connection-pause.md` for the exact
// swap-in recipe.

import {
  type Chunk,
  type ChunkDetail,
  type ChunkDetailResponse,
  type KbSearchRequest,
  type KbSearchResponse,
  KbSearchRequest as KbSearchRequestSchema,
  KbSearchResponse as KbSearchResponseSchema,
  ChunkDetailResponse as ChunkDetailResponseSchema,
} from '@qa-nexus/shared';

export type { Chunk, ChunkDetail, ChunkDetailResponse, KbSearchRequest, KbSearchResponse };

export { KbSearchRequestSchema, KbSearchResponseSchema, ChunkDetailResponseSchema };

// ---------------------------------------------------------------------------
// Fetchers — currently STUBS returning seed data that mirrors the BE
// fixture set. Real fetch swaps in at the connection point.
// ---------------------------------------------------------------------------

/** Stub fetcher — returns the 8-chunk seed list as a Promise so the
 *  TanStack Query hook can call `await fetcher(req)` without changing
 *  shape when the real fetch swaps in.
 *
 *  PAUSE — wait BE+1 confirmation that KB endpoints are wired beyond
 *  stub responses. Currently PR #30 returns hardcoded fixtures only.
 *  Once the M2 swap lands (pgvector HNSW + optional LLM re-rank), this
 *  body becomes:
 *
 *      const res = await fetch(
 *        `/api/projects/${projectId}/kb/search`,
 *        { method: 'POST', credentials: 'include',
 *          headers: { 'content-type': 'application/json' },
 *          body: JSON.stringify(req) }
 *      );
 *      if (!res.ok) throw new Error(`HTTP ${res.status}`);
 *      const json = await res.json();
 *      return KbSearchResponseSchema.parse(json);
 *
 *  No call site needs to change. The hook + the F15 page consume the
 *  parsed shape, not the raw response.
 */
export async function fetchKbSearch(
  _projectId: string,
  req: KbSearchRequest,
): Promise<KbSearchResponse> {
  KbSearchRequestSchema.parse(req); // validate input shape
  // Lazy-import the seed so prod bundles drop the stub via tree-shaking
  // once the real fetch lands.
  const { stubKbSearchResponse, applyClientFilters } = await import('./kb-stub-data');
  // Mimic a brief network round-trip so loading-state UI renders during
  // dev. M2 will replace this latency.
  await new Promise((resolve) => setTimeout(resolve, 250));
  // Apply the request's filters / sort / page client-side against the
  // stub set so the FE can verify behaviour even before BE wires up.
  const filtered = applyClientFilters(stubKbSearchResponse, req);
  return KbSearchResponseSchema.parse(filtered);
}

/** Stub chunk-detail fetcher. PAUSE — replace with
 *  `GET /api/projects/:projectId/kb/chunks/:chunkId` once BE+1 ships
 *  the real reads. */
export async function fetchKbChunkDetail(
  _projectId: string,
  chunkId: string,
): Promise<ChunkDetailResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const { stubChunkDetail } = await import('./kb-stub-data');
  return ChunkDetailResponseSchema.parse(stubChunkDetail(chunkId));
}
