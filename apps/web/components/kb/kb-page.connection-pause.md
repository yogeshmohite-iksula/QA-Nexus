# F15 KB Pattern A → B connection-point recipe

> **PAUSE — wait BE+1 confirmation that KB endpoints are wired beyond stub responses. Currently PR #30 returns hardcoded fixtures only.**

This file documents the mechanical swap-in to flip F15 from Pattern A
(stub fetcher returning seed data) to Pattern B (real `fetch()` against
the BE M2 chunk-search controller). Day-8 ships scaffolding; the swap-in
is a 30-min operation when BE+1 reports the M2 stub-replacement landed.

---

## Pre-flight checks (do BEFORE editing F15)

1. **BE controller swapped to real pgvector HNSW search (not just stub).**
   Verify with the `stubbed` flag on the response:

   ```bash
   curl -s -X POST http://localhost:4000/api/projects/<projectId>/kb/search \
     -H 'content-type: application/json' \
     -H 'Cookie: <session>' \
     -d '{"query":"refund window","semantic":true}' | jq .stubbed
   # expect: false
   ```

2. **Schema shape unchanged.** The wire schemas in
   `packages/shared/src/schemas/kb.ts` (`KbSearchRequest`,
   `KbSearchResponse`, `Chunk`, `ChunkDetail`) MUST stay byte-identical
   between stub + real. PR #30 commits to this guarantee — the only
   change is the controller body.

3. **Dev API up:** `pnpm --filter api dev` → port 4000.

---

## Real-fetch swap-in (`apps/web/lib/api/kb-api.ts`)

Replace the body of `fetchKbSearch`:

```ts
export async function fetchKbSearch(
  projectId: string,
  req: KbSearchRequest,
): Promise<KbSearchResponse> {
  KbSearchRequestSchema.parse(req);
  const res = await fetch(`/api/projects/${projectId}/kb/search`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return KbSearchResponseSchema.parse(json);
}
```

Same shape for `fetchKbChunkDetail`:

```ts
export async function fetchKbChunkDetail(
  projectId: string,
  chunkId: string,
): Promise<ChunkDetailResponse> {
  const res = await fetch(`/api/projects/${projectId}/kb/chunks/${chunkId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return ChunkDetailResponseSchema.parse(json);
}
```

Then **delete** `apps/web/lib/api/kb-stub-data.ts` — the `await
import('./kb-stub-data')` lines disappear with the swap above.

---

## NO change required at hook or component level

`useKbSearch` / `useKbChunkDetail` / `KbPage` / `KbChunkCard` /
`KbChunkDetailPanel` / `KbSearchBar` / `KbMinScoreSlider` /
`KbFilterChips` / `KbViewStates` — all consume the parsed shape, not
the raw response. Zero edits required.

The "Demo" pill in the search bar (driven by `data?.stubbed`) auto-
hides once the BE flips `stubbed: false`. No FE work needed.

---

## Smoke test after swap-in

1. `pnpm --filter web dev` + `pnpm --filter api dev`
2. Open `/projects/ret/kb` — should hit the real BE
3. Network tab: confirm `POST /api/projects/<id>/kb/search` 200, response
   `{ ok: true, chunks: [...], stubbed: false, ... }`
4. Demo pill in the search bar should be **gone** (only renders when
   `data.stubbed === true`)
5. Type a query → real pgvector ranking; vary the min-relevance slider
   → histogram redraws against actual cosine score distribution
6. Click a chunk → split-pane detail loads with neighbour pointers from
   the real chunk index
7. To verify error rollback: temporarily make the BE return 500 →
   `<KbResultsError />` should render with "Try again" button

---

## Rollback / kill switch

If Pattern B causes regressions, revert the `kb-api.ts` fetcher bodies
back to the stub form. The scaffolding files (`kb-stub-data.ts`,
`use-kb-search.ts`, all components) can stay — they're side-effect-free
imports.

---

## Day-8 status (this PR — `feature/fe-m2-f15-kb-scaffold`)

Scaffolding shipped. F15 page renders against the stub fetcher; the
"Demo" pill makes it obvious the data is fixture-only. Ready for swap-in
when BE+1 reports the M2 controller body landed. Estimated time after
green light: 30 min (this recipe + smoke test).
