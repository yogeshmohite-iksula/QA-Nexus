// QA Nexus PM1 — Chunking parser shared types.
//
// Spec: ERD §3.7 — chunk_id, source_file_id, chunk_text, page_no,
// line_range, relevance_score (computed at query time, not stored).
//
// Each parser returns ParsedChunk[]. The service then assigns
// chunkIndex (sequential, deterministic) + writes to kb_chunks.
// Embedding is generated separately (Step 6, next PR).

/**
 * One parsed chunk from a source file. Index is assigned by the
 * service (NOT the parser) so re-running the parser on the same
 * file produces deterministic chunk ordering, which the
 * `(documentId, chunkIndex)` unique constraint relies on for
 * idempotency.
 */
export interface ParsedChunk {
  /** The chunk's text body. Empty strings filtered upstream. */
  chunkText: string;
  /**
   * Source-attribution metadata stored on KbChunk.metadataJson.
   * Format matches ERD §3.7 / packages/shared `ChunkSourceAttribution`:
   *   - pageNo: 1-indexed page number for paginated formats (PDF);
   *             null for non-paginated formats (CSV/XLSX/TXT).
   *   - lineRange: 1-indexed [start, end] inclusive — for PDF this is
   *             "lines on the page", for XLSX this is "rows in the
   *             sheet", for CSV/TXT this is "lines in the file".
   *   - sheet: optional XLSX sheet name (omitted for non-XLSX).
   */
  metadata: {
    pageNo: number | null;
    lineRange: [number, number];
    sheet?: string;
  };
}

/** Discriminator for parser dispatch. */
export type SupportedFormat = 'pdf' | 'xlsx' | 'csv' | 'txt';

/**
 * Detect format from file extension (case-insensitive). MP4 transcripts
 * are pre-extracted to .txt by the upload pipeline (Step 7) so we don't
 * carry a video parser here.
 */
export function detectFormat(fileName: string): SupportedFormat | null {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  if (ext === 'csv') return 'csv';
  if (ext === 'txt' || ext === 'md') return 'txt';
  return null;
}
