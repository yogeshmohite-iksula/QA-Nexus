// TB-017 kb_documents + TB-018 kb_chunks.
import { z } from 'zod';
import { Uuid, Timestamp, NonEmpty } from './enums';

export const KbDocumentSchema = z.object({
  id: Uuid,
  // null = workspace-scoped
  projectId: Uuid.nullable(),
  title: NonEmpty,
  bodyMd: z.string(),
  // Kept as a free text field until M2 enumerates the 12 PM1 templates.
  templateKind: NonEmpty,
  pinned: z.boolean(),
  authorId: Uuid,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type KbDocument = z.infer<typeof KbDocumentSchema>;

export const CreateKbDocumentInput = z.object({
  projectId: Uuid.nullable().optional(),
  title: NonEmpty,
  bodyMd: z.string().default(''),
  templateKind: NonEmpty,
  pinned: z.boolean().default(false),
});
export type CreateKbDocumentInput = z.infer<typeof CreateKbDocumentInput>;

export const UpdateKbDocumentInput = z.object({
  title: NonEmpty.optional(),
  bodyMd: z.string().optional(),
  templateKind: NonEmpty.optional(),
  pinned: z.boolean().optional(),
});
export type UpdateKbDocumentInput = z.infer<typeof UpdateKbDocumentInput>;

// TB-018 kb_chunks (server-managed; clients never write these directly)
export const KbChunkSchema = z.object({
  id: Uuid,
  documentId: Uuid,
  chunkText: z.string(),
  // embedding intentionally omitted — server-only.
  chunkIndex: z.number().int().nonnegative(),
  metadataJson: z.record(z.unknown()),
});
export type KbChunk = z.infer<typeof KbChunkSchema>;

// ─────────────────────────────────────────────────────────────────────
// M2 Day-8 Step 4 — chunk-search API contract scaffold (STUBBED).
//
// Endpoints (mounted but returning hardcoded fixtures until M2 wires
// the real pgvector HNSW search + LLMGateway re-rank):
//   POST /api/projects/:projectId/kb/search    (semantic+filter search)
//   GET  /api/projects/:projectId/kb/chunks/:chunkId  (single-chunk detail)
//
// Wire goal Day-8: lock the wire shape NOW so the FE can implement F19
// Run Console search box + F30 KB browser against a stable contract,
// even while the BE still returns demo `return_policy_v2.xlsx` fixtures.
// M2 swaps the controller body to call EmbeddingService → vector(384)
// HNSW search → optional LLMGateway re-rank — same response shape.
//
// Per ERD §3.7 the stored fields per chunk are:
//   chunk_id, source_file_id (here: documentId), chunk_text, page_no,
//   line_range, relevance_score (computed at query time, not stored).
// ─────────────────────────────────────────────────────────────────────

/// Quoted source-attribution band for a hit. `lineRange` is a
/// 1-indexed inclusive [start, end] tuple matching how the upload
/// pipeline (M2) will record xlsx row spans / md line spans / pdf line
/// spans. `pageNo` is null for non-paginated formats (md, csv).
export const ChunkSourceAttribution = z.object({
  pageNo: z.number().int().positive().nullable(),
  lineRange: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
});
export type ChunkSourceAttribution = z.infer<typeof ChunkSourceAttribution>;

/// Single chunk shape used in BOTH the search result list AND the
/// detail endpoint. `relevanceScore` is null on the detail endpoint
/// (no query was issued); 0..1 on the search endpoint.
export const Chunk = z.object({
  chunkId: Uuid,
  sourceFileId: Uuid, // = KbDocument.id
  sourceFileName: NonEmpty, // = KbDocument.title
  chunkText: z.string(),
  chunkIndex: z.number().int().nonnegative(),
  source: ChunkSourceAttribution,
  /// 0..1 cosine similarity. Null on detail endpoint.
  relevanceScore: z.number().min(0).max(1).nullable(),
  /// Optional hit-context preview (first 80 chars + ellipsis) — FE-friendly.
  preview: z.string().max(240),
  metadataJson: z.record(z.unknown()).default({}),
});
export type Chunk = z.infer<typeof Chunk>;

/// Detail-endpoint response — same shape but always `relevanceScore: null`.
export const ChunkDetail = Chunk.extend({
  relevanceScore: z.null(),
  /// Larger preview window for the detail page — neighbouring chunks.
  neighbourPreviousChunkId: Uuid.nullable(),
  neighbourNextChunkId: Uuid.nullable(),
});
export type ChunkDetail = z.infer<typeof ChunkDetail>;

/// POST /api/projects/:projectId/kb/search request body.
/// `semantic: false` falls back to plain ILIKE keyword search (M2.5
/// when full pgvector ranking lands; today both modes return same fixture).
export const KbSearchRequest = z.object({
  query: z.string().min(1).max(500),
  semantic: z.boolean().default(true),
  filters: z
    .object({
      /// Filter by source-file UUIDs. Empty = all docs in project.
      sourceFileIds: z.array(Uuid).max(100).optional(),
      /// Filter by template kind (`requirement` / `evidence` / `runbook` / etc.).
      templateKind: NonEmpty.optional(),
      /// Optional minimum cosine score (0..1) to filter low-confidence hits.
      minRelevanceScore: z.number().min(0).max(1).optional(),
    })
    .default({}),
  /// Sort key. Default semantic = relevance-desc; keyword = recency-desc.
  sort: z.enum(['relevance', 'recency', 'source_file']).default('relevance'),
  page: z
    .object({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
    })
    .default({}),
});
export type KbSearchRequest = z.infer<typeof KbSearchRequest>;

export const KbSearchResponse = z.object({
  ok: z.literal(true),
  chunks: z.array(Chunk),
  /// Total matches BEFORE pagination (so FE can show "1-20 of 247").
  total: z.number().int().nonnegative(),
  /// Wall-clock query time. M2 will populate from a span attr.
  tookMs: z.number().int().nonnegative(),
  /// Opaque cursor for the next page. Null = last page.
  nextCursor: z.string().nullable(),
  /// True until the BE swaps the stub for real pgvector. FE can show a
  /// "demo data" banner when this is true.
  stubbed: z.boolean(),
});
export type KbSearchResponse = z.infer<typeof KbSearchResponse>;

export const ChunkDetailResponse = z.object({
  ok: z.literal(true),
  chunk: ChunkDetail,
  stubbed: z.boolean(),
});
export type ChunkDetailResponse = z.infer<typeof ChunkDetailResponse>;

// ─────────────────────────────────────────────────────────────────────
// M2 Day-8 Step 5 — chunking service request/response.
//
// Internal Admin-only endpoint POST /api/admin/kb/chunk-document.
// Step 7's upload completion hook will call ChunkingService directly
// (not via this endpoint) — the endpoint stays as a manual re-chunk
// surface for ops + a debug entry point.
// ─────────────────────────────────────────────────────────────────────

export const ChunkDocumentRequest = z.object({
  /** UUID of the existing KbDocument row (caller created it upstream). */
  documentId: Uuid,
  /** Original file name — used for format detection (.pdf/.xlsx/.csv/.txt/.md). */
  fileName: z.string().min(3).max(512),
  /** Object key in the R2 bucket (caller knows; e.g.,
   *  `projects/RET/uploads/return_policy_v2.xlsx`). */
  r2Key: z.string().min(3).max(1024),
});
export type ChunkDocumentRequest = z.infer<typeof ChunkDocumentRequest>;

export const ChunkDocumentResponse = z.object({
  ok: z.literal(true),
  documentId: Uuid,
  /** Detected source format. */
  format: z.enum(['pdf', 'xlsx', 'csv', 'txt']),
  chunkCount: z.number().int().nonnegative(),
  /** First chunk's text (truncated to 80 chars) — sanity-check that the
   *  right file got chunked. NOT a security risk: Admin already has
   *  read access to the source file via the upload pipeline. */
  firstChunkPreview: z.string(),
});
export type ChunkDocumentResponse = z.infer<typeof ChunkDocumentResponse>;

// ─────────────────────────────────────────────────────────────────────
// M2 Day-8 Step 6 — Embedding endpoint contracts.
// ─────────────────────────────────────────────────────────────────────

export const EmbedDocumentRequest = z.object({
  /** UUID of the existing KbDocument row. Chunks for this document
   *  must already exist (run chunking first via the Step 5 endpoint). */
  documentId: Uuid,
});
export type EmbedDocumentRequest = z.infer<typeof EmbedDocumentRequest>;

export const EmbedDocumentResponse = z.object({
  ok: z.literal(true),
  documentId: Uuid,
  /** Number of chunks newly embedded in THIS call. 0 = idempotent no-op
   *  (every chunk already had a vector). */
  embeddedCount: z.number().int().nonnegative(),
  /** Total chunks for the document (embedded + already-embedded). */
  totalChunks: z.number().int().nonnegative(),
  /** Chunks that already had an embedding before this call ran. */
  alreadyEmbedded: z.number().int().nonnegative(),
  /** Convenience flag for FE: true if nothing needed embedding. */
  noop: z.boolean(),
});
export type EmbedDocumentResponse = z.infer<typeof EmbedDocumentResponse>;
