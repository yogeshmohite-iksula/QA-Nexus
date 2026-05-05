// F15 KB chunk-search TanStack Query hooks — Pattern A (BE-gated).
//
// Two hooks:
// - useKbSearch(projectId, request)   → query (cached search result)
// - useKbChunkDetail(projectId, id)  → query (single-chunk detail)
//
// PAUSE points marked inline. Real BE wires already exist (PR #30 stub
// controller) but return hardcoded fixtures only. The M2 swap on the
// BE side replaces the controller body; this FE layer doesn't change.
// Day 8 ships against stub fetchers locally; the live cut-over happens
// when BE+1 confirms `stubbed: false` on the response.

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchKbChunkDetail,
  fetchKbSearch,
  type ChunkDetailResponse,
  type KbSearchRequest,
  type KbSearchResponse,
} from '@/lib/api/kb-api';

/** Cache key factory — every call site should use these helpers (NOT
 *  raw arrays) so cache invalidation stays consistent. */
export const kbQueryKeys = {
  all: ['kb'] as const,
  search: (projectId: string, req: KbSearchRequest) => ['kb', 'search', projectId, req] as const,
  chunkDetail: (projectId: string, chunkId: string) => ['kb', 'chunk', projectId, chunkId] as const,
};

/** Search hook — keep `request` stable (memoize on the caller side) so
 *  the cache key doesn't churn on every render. Returns the standard
 *  TanStack `{ data, isLoading, isError, error, refetch }` envelope.
 *
 *  PAUSE — wait BE+1 confirmation that KB endpoints are wired beyond
 *  stub responses. Currently PR #30 returns hardcoded fixtures only.
 *  Once the M2 swap lands, `fetchKbSearch` swaps body to a real
 *  `fetch()` (see `lib/api/kb-api.ts`). NO change required at this
 *  hook level.
 */
export function useKbSearch(projectId: string, request: KbSearchRequest) {
  return useQuery<KbSearchResponse, Error>({
    queryKey: kbQueryKeys.search(projectId, request),
    queryFn: () => fetchKbSearch(projectId, request),
    staleTime: 30_000, // 30 s — short enough that re-search after upload
    // surfaces fast, long enough that filter
    // toggling doesn't re-fetch unnecessarily.
    retry: 1,
    enabled: request.query.length > 0,
  });
}

/** Chunk-detail hook — used by the desktop split-pane + mobile
 *  Drawer. Disabled when chunkId is null (no row selected yet).
 */
export function useKbChunkDetail(projectId: string, chunkId: string | null) {
  return useQuery<ChunkDetailResponse, Error>({
    queryKey: chunkId ? kbQueryKeys.chunkDetail(projectId, chunkId) : ['kb', 'chunk', 'none'],
    queryFn: () => fetchKbChunkDetail(projectId, chunkId as string),
    enabled: chunkId !== null,
    staleTime: 60_000, // chunk text is immutable post-ingestion
    retry: 1,
  });
}
