// QA Nexus PM1 — XLSX parser for chunking service.
//
// Library choice: `xlsx` (SheetJS Community Edition, Apache 2.0).
// Standard for Node-side spreadsheet parsing; handles xlsx + xls +
// other formats via the same `read()` API.
//
// Strategy: per-sheet, group rows of N (default 25 rows per chunk)
// into a single chunk_text formatted as a TSV-like preview. Each
// chunk's metadata.sheet = sheet name; metadata.lineRange = [start_row,
// end_row] 1-indexed (matches how the FE renders "rows 1-25 of 247").
//
// Header row (first row) is repeated INSIDE every chunk's body so the
// embedding (Step 6) sees the column context for each grouped batch
// — without it, "0.85 / Tier-3 / 2024-Q3" loses meaning when the
// embedding model lacks the "score / tier / quarter" header context.

import * as XLSX from 'xlsx';
import type { ParsedChunk } from './types';

const ROWS_PER_CHUNK = 25;

export function parseXlsx(buffer: Buffer): ParsedChunk[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const chunks: ParsedChunk[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    // sheet_to_json with header: 1 returns array-of-arrays (one inner
    // array per row). Includes empty cells as `null`.
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      raw: false,
    });
    if (rows.length === 0) continue;

    const header = rows[0].map((c) => stringify(c));
    const headerLine = header.join('\t');

    // Skip pure-empty sheets (header row with all nulls + no data).
    const hasData =
      rows.length > 1 &&
      rows.slice(1).some((r) => r.some((c) => c !== null && c !== ''));
    if (!hasData) continue;

    // Group data rows (skip header at index 0) in batches of ROWS_PER_CHUNK.
    for (let start = 1; start < rows.length; start += ROWS_PER_CHUNK) {
      const end = Math.min(start + ROWS_PER_CHUNK, rows.length);
      const batchRows = rows.slice(start, end);
      // Skip empty batches (all rows in this slice are blank).
      const nonEmpty = batchRows.filter((r) =>
        r.some((c) => c !== null && c !== ''),
      );
      if (nonEmpty.length === 0) continue;

      const body = nonEmpty
        .map((r) => r.map((c) => stringify(c)).join('\t'))
        .join('\n');
      const chunkText = `${headerLine}\n${body}`;

      chunks.push({
        chunkText,
        metadata: {
          pageNo: null, // XLSX is non-paginated
          // 1-indexed inclusive [first-row, last-row]. Header is row 1;
          // data starts at row 2 in the user-visible numbering.
          lineRange: [start + 1, end],
          sheet: sheetName,
        },
      });
    }
  }
  return chunks;
}

function stringify(c: unknown): string {
  if (c === null || c === undefined) return '';
  if (typeof c === 'string') return c;
  if (typeof c === 'number' || typeof c === 'boolean') return String(c);
  if (c instanceof Date) return c.toISOString();
  return JSON.stringify(c);
}
