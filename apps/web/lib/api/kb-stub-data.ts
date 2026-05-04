// F15 KB stub seed — mirrors `apps/api/src/kb/kb.fixtures.ts` 1:1 so
// the FE-side stub fetcher returns the same 8 chunks the BE controller
// returns today. Once BE+1 swaps the controller body to real pgvector
// (M2 Day-9/10), this file is deleted; the call site in
// `lib/api/kb-api.ts` becomes a real `fetch()` (see PAUSE markers).
//
// Iksula data canon: 8 chunks from `return_policy_v2.xlsx`, RET project,
// CHUNK-RET-#### prefix preserved in deterministic UUIDs. Relevance
// distribution mimics what `bge-small-en-v1.5` produces in the M0
// cosine-sanity test.

import type {
  Chunk,
  ChunkDetail,
  ChunkDetailResponse,
  KbSearchRequest,
  KbSearchResponse,
} from './kb-api';

const RETURN_POLICY_FILE_ID = '11111111-1111-1111-1111-111111111111';
const RETURN_POLICY_FILE_NAME = 'return_policy_v2.xlsx';

const CHUNK_IDS = {
  RET_0001: '22222222-2222-2222-2222-000000000001',
  RET_0002: '22222222-2222-2222-2222-000000000002',
  RET_0003: '22222222-2222-2222-2222-000000000003',
  RET_0004: '22222222-2222-2222-2222-000000000004',
  RET_0005: '22222222-2222-2222-2222-000000000005',
  RET_0006: '22222222-2222-2222-2222-000000000006',
  RET_0007: '22222222-2222-2222-2222-000000000007',
  RET_0008: '22222222-2222-2222-2222-000000000008',
} as const;

function preview(s: string): string {
  return s.length > 200 ? s.slice(0, 197) + '…' : s;
}

const RAW_CHUNKS: Array<Omit<Chunk, 'preview'>> = [
  {
    chunkId: CHUNK_IDS.RET_0001,
    sourceFileId: RETURN_POLICY_FILE_ID,
    sourceFileName: RETURN_POLICY_FILE_NAME,
    chunkText:
      'Section 1.1 — Returns are accepted within 30 days of delivery for all categories EXCEPT perishable goods (3 days) and personalized items (non-returnable). The customer must initiate the return via the Returns portal at iksula.com/returns and receive a Return Authorization Number (RAN) before shipping the item back.',
    chunkIndex: 0,
    source: { pageNo: null, lineRange: [1, 5] },
    relevanceScore: 0.82,
    metadataJson: { sheet: 'Policy', section: '1.1' },
  },
  {
    chunkId: CHUNK_IDS.RET_0002,
    sourceFileId: RETURN_POLICY_FILE_ID,
    sourceFileName: RETURN_POLICY_FILE_NAME,
    chunkText:
      'Section 2.4 — Partial refunds are permitted on multi-item orders. The original order discount is recalculated against the retained items; if the retained items would no longer qualify for the discount tier, the discount is rescinded proportionally on the refund (NOT charged back to the customer).',
    chunkIndex: 1,
    source: { pageNo: null, lineRange: [12, 17] },
    relevanceScore: 0.79,
    metadataJson: { sheet: 'Policy', section: '2.4' },
  },
  {
    chunkId: CHUNK_IDS.RET_0003,
    sourceFileId: RETURN_POLICY_FILE_ID,
    sourceFileName: RETURN_POLICY_FILE_NAME,
    chunkText:
      'Section 3 — Refund processing window: 5–7 business days from receipt of the returned item at the Iksula warehouse. Refund is issued to the original payment method. UPI / wallet refunds are typically 24–48h; card refunds depend on the issuing bank.',
    chunkIndex: 2,
    source: { pageNo: null, lineRange: [22, 26] },
    relevanceScore: 0.71,
    metadataJson: { sheet: 'Policy', section: '3' },
  },
  {
    chunkId: CHUNK_IDS.RET_0004,
    sourceFileId: RETURN_POLICY_FILE_ID,
    sourceFileName: RETURN_POLICY_FILE_NAME,
    chunkText:
      'Section 4.2 — If the customer reports an item as damaged-in-transit, photos must be uploaded within 48 hours of delivery via the Returns portal. The QA team validates the claim against carrier handling reports before approving a no-questions-asked return.',
    chunkIndex: 3,
    source: { pageNo: null, lineRange: [33, 37] },
    relevanceScore: 0.64,
    metadataJson: { sheet: 'Policy', section: '4.2' },
  },
  {
    chunkId: CHUNK_IDS.RET_0005,
    sourceFileId: RETURN_POLICY_FILE_ID,
    sourceFileName: RETURN_POLICY_FILE_NAME,
    chunkText:
      'Section 5 — Return shipping is free if the return reason is one of: damaged-on-arrival, wrong-item-shipped, defective-product, fraud-claim. For change-of-mind returns, the customer pays return shipping (deducted from the refund).',
    chunkIndex: 4,
    source: { pageNo: null, lineRange: [42, 46] },
    relevanceScore: 0.58,
    metadataJson: { sheet: 'Policy', section: '5' },
  },
  {
    chunkId: CHUNK_IDS.RET_0006,
    sourceFileId: RETURN_POLICY_FILE_ID,
    sourceFileName: RETURN_POLICY_FILE_NAME,
    chunkText:
      'Section 6 — Bulk returns (orders containing 10+ units of the same SKU) require manual review by the Returns Operations team. The portal flags these and routes them to a 24h SLA queue.',
    chunkIndex: 5,
    source: { pageNo: null, lineRange: [51, 54] },
    relevanceScore: 0.46,
    metadataJson: { sheet: 'Policy', section: '6' },
  },
  {
    chunkId: CHUNK_IDS.RET_0007,
    sourceFileId: RETURN_POLICY_FILE_ID,
    sourceFileName: RETURN_POLICY_FILE_NAME,
    chunkText:
      'Section 7 — Subscription / auto-ship items: customers can pause or cancel future shipments via the Account portal. Already-shipped items follow the standard 30-day return window (Section 1.1).',
    chunkIndex: 6,
    source: { pageNo: null, lineRange: [60, 63] },
    relevanceScore: 0.39,
    metadataJson: { sheet: 'Policy', section: '7' },
  },
  {
    chunkId: CHUNK_IDS.RET_0008,
    sourceFileId: RETURN_POLICY_FILE_ID,
    sourceFileName: RETURN_POLICY_FILE_NAME,
    chunkText:
      'Appendix A — Internal RBAC for the Returns portal: Admin can override any decision; Lead can approve/deny within their assigned project; QA Engineer can review evidence + flag for Lead; Stakeholder is read-only.',
    chunkIndex: 7,
    source: { pageNo: null, lineRange: [70, 73] },
    relevanceScore: 0.34,
    metadataJson: { sheet: 'Policy', section: 'Appendix A' },
  },
];

export const STUB_CHUNKS: Chunk[] = RAW_CHUNKS.map((c) => ({
  ...c,
  preview: preview(c.chunkText),
}));

const STUB_CHUNK_BY_ID = new Map<string, Chunk>(STUB_CHUNKS.map((c) => [c.chunkId, c]));

export const stubKbSearchResponse: KbSearchResponse = {
  ok: true,
  chunks: STUB_CHUNKS,
  total: STUB_CHUNKS.length,
  tookMs: 1,
  nextCursor: null,
  stubbed: true,
};

/** Apply the request's `query` / `filters` / `sort` / `page.limit` to the
 *  static stub set client-side. Mirrors the BE controller's keyword-overlap
 *  heuristic at a coarser level — good enough for FE visual-gate validation
 *  even before the M2 swap.
 */
export function applyClientFilters(base: KbSearchResponse, req: KbSearchRequest): KbSearchResponse {
  const tokens = req.query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  let chunks = base.chunks.map((c) => {
    if (tokens.length === 0) return c;
    const text = c.chunkText.toLowerCase();
    const hits = tokens.filter((t) => text.includes(t)).length;
    // Same +0.05 per hit boost the BE controller uses; cap at 1.0.
    const boosted = Math.min(1, (c.relevanceScore ?? 0) + hits * 0.05);
    return { ...c, relevanceScore: boosted };
  });

  // Filter: minRelevanceScore
  if (typeof req.filters?.minRelevanceScore === 'number') {
    const min = req.filters.minRelevanceScore;
    chunks = chunks.filter((c) => (c.relevanceScore ?? 0) >= min);
  }

  // Filter: sourceFileIds (only one stub file, so this filters all-or-nothing)
  const fileIds = req.filters?.sourceFileIds;
  if (fileIds && fileIds.length > 0) {
    chunks = chunks.filter((c) => fileIds.includes(c.sourceFileId));
  }

  // Sort
  if (req.sort === 'relevance') {
    chunks.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
  } else if (req.sort === 'recency') {
    // No createdAt on Chunk — fall back to chunkIndex desc (newer chunks last).
    chunks.sort((a, b) => b.chunkIndex - a.chunkIndex);
  } else if (req.sort === 'source_file') {
    chunks.sort((a, b) => a.sourceFileName.localeCompare(b.sourceFileName));
  }

  const total = chunks.length;
  const limit = req.page?.limit ?? 20;
  const sliced = chunks.slice(0, limit);

  return {
    ok: true,
    chunks: sliced,
    total,
    tookMs: 1,
    nextCursor: null,
    stubbed: true,
  };
}

/** Build the detail-endpoint shape — adds neighbour pointers, forces
 *  `relevanceScore: null` per the contract. */
export function stubChunkDetail(chunkId: string): ChunkDetailResponse {
  const c = STUB_CHUNK_BY_ID.get(chunkId);
  if (!c) {
    throw new Error(`Stub chunk not found: ${chunkId}`);
  }
  const idx = STUB_CHUNKS.findIndex((x) => x.chunkId === chunkId);
  const detail: ChunkDetail = {
    ...c,
    relevanceScore: null,
    neighbourPreviousChunkId: idx > 0 ? STUB_CHUNKS[idx - 1].chunkId : null,
    neighbourNextChunkId:
      idx >= 0 && idx < STUB_CHUNKS.length - 1 ? STUB_CHUNKS[idx + 1].chunkId : null,
  };
  return { ok: true, chunk: detail, stubbed: true };
}
