// QA Nexus PM1 — KB chunk-search demo fixtures.
//
// Spec: Day-8 Step 4. Returned by KbController until M2 wires the real
// pgvector HNSW search. The fixtures intentionally use the M0 anchor
// project + IKSULA_CONTEXT canonical demo file:
//   - return_policy_v2.xlsx (Iksula Returns project, RET)
//   - chunk IDs follow the CHUNK-RET-#### convention (per IKSULA_CONTEXT
//     ID patterns)
//   - relevance distribution mimics what bge-small-en-v1.5 actually
//     produces in the M0 cosine-sanity test (best ~0.80, mid ~0.60,
//     low ~0.40) so the FE can build the confidence-band UI against
//     realistic numbers.
//
// IMPORTANT: every fixture's `sourceFileId` is a deterministic UUID
// derived from the file name (so FE caching keys are stable across
// dev restarts). The chunkId UUIDs are also deterministic so the
// detail endpoint resolves cleanly.

import type { Chunk, ChunkDetail } from '@qa-nexus/shared';

// Deterministic UUID seeds — readable in the wire payload.
// Matches Iksula canon (return_policy_v2.xlsx is the demo upload per
// IKSULA_CONTEXT.md / docs/parallel-work/chat3-status-day1.md).
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

/** Deterministic preview helper — first 200 chars + ellipsis. */
function preview(s: string): string {
  return s.length > 200 ? s.slice(0, 197) + '…' : s;
}

/**
 * Demo chunks for the "return policy" file. 8 chunks with a realistic
 * relevance distribution: 2 high (>0.75), 3 mid (0.50–0.75), 3 low
 * (0.30–0.50). M2 swap will replace this with real pgvector ranking.
 */
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

export const DEMO_CHUNKS: Chunk[] = RAW_CHUNKS.map((c) => ({
  ...c,
  preview: preview(c.chunkText),
}));

export const DEMO_CHUNK_BY_ID: Map<string, Chunk> = new Map(
  DEMO_CHUNKS.map((c) => [c.chunkId, c]),
);

/**
 * Build the detail-endpoint shape — adds neighbour pointers.
 * `relevanceScore` is forced to null per the contract (no query was issued).
 */
export function toChunkDetail(c: Chunk): ChunkDetail {
  const idx = DEMO_CHUNKS.findIndex((x) => x.chunkId === c.chunkId);
  return {
    ...c,
    relevanceScore: null,
    neighbourPreviousChunkId: idx > 0 ? DEMO_CHUNKS[idx - 1].chunkId : null,
    neighbourNextChunkId:
      idx >= 0 && idx < DEMO_CHUNKS.length - 1
        ? DEMO_CHUNKS[idx + 1].chunkId
        : null,
  };
}
