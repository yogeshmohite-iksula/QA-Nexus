// QA Nexus PM1 — CSV parser for chunking service.
//
// Library: `csv-parse` (Apache 2.0). Streams-friendly + handles
// the usual CSV edge cases (quoted commas, CRLF, escaped quotes).
//
// Strategy mirrors xlsx-parser: groups N rows per chunk with the
// header row prepended to every chunk for embedding context.

import { parse } from 'csv-parse/sync';
import type { ParsedChunk } from './types';

const ROWS_PER_CHUNK = 25;

export function parseCsv(buffer: Buffer): ParsedChunk[] {
  const rows: string[][] = parse(buffer, {
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });
  if (rows.length === 0) return [];

  const header = rows[0];
  const headerLine = header.join('\t');
  const dataRows = rows.slice(1);
  if (dataRows.length === 0) return []; // header only, no data

  const chunks: ParsedChunk[] = [];
  for (let start = 0; start < dataRows.length; start += ROWS_PER_CHUNK) {
    const end = Math.min(start + ROWS_PER_CHUNK, dataRows.length);
    const batch = dataRows.slice(start, end);
    const body = batch.map((r) => r.join('\t')).join('\n');
    chunks.push({
      chunkText: `${headerLine}\n${body}`,
      metadata: {
        pageNo: null,
        // Header is row 1; data starts at row 2 in user-visible numbering.
        lineRange: [start + 2, end + 1],
      },
    });
  }
  return chunks;
}
