// QA Nexus PM1 — XLSX parser for chunking service.
//
// Library: `exceljs` (Apache 2.0, ~1.9M weekly DLs, actively maintained).
// Day-22 (2026-05-19) — m5 CVE remediation / Kimi K2 HIGH triage:
// replaced `xlsx` (SheetJS CE 0.18.5) which had two live HIGH advisories
// with no patched version available:
//   - GHSA-4r6h-8v6p-xvw6 (Prototype Pollution in sheetJS)
//   - GHSA-5pgg-2g8v-p4x9 (Regular Expression Denial of Service / ReDoS)
//
// Strategy (unchanged from xlsx implementation): per-sheet, group rows of N
// (default 25 rows per chunk) into a single chunk_text formatted as a
// TSV-like preview. Each chunk's metadata.sheet = sheet name;
// metadata.lineRange = [start_row, end_row] 1-indexed (matches how the
// FE renders "rows 1-25 of 247").
//
// Header row (first row) is repeated INSIDE every chunk's body so the
// embedding (Step 6) sees the column context for each grouped batch.
//
// ExcelJS API notes vs the old xlsx API:
//   - `workbook.xlsx.load(buffer)` is async → parseXlsx() is now async too
//     (chunking.service.ts already awaits a Promise<ParsedChunk[]>).
//   - `row.values` is 1-INDEXED (index 0 reserved by ExcelJS); slice(1) to
//     recover the cell-value array matching xlsx's `header:1` shape.
//   - `eachRow({ includeEmpty: true })` mirrors xlsx's `defval: null` for
//     blank cells. We further pad short rows to header column count.
//   - Rich-text and formula cells are reduced to their displayable text
//     equivalent in `stringify()` so embeddings get the rendered value.

import { Workbook } from 'exceljs';
import type { ParsedChunk } from './types';

const ROWS_PER_CHUNK = 25;

export async function parseXlsx(buffer: Buffer): Promise<ParsedChunk[]> {
  const workbook = new Workbook();
  // Cast: ExcelJS strict types require ArrayBuffer but Buffer.buffer is
  // ArrayBufferLike (may be SharedArrayBuffer). Runtime accepts Buffer fine.
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const chunks: ParsedChunk[] = [];

  workbook.eachSheet((worksheet) => {
    const sheetName = worksheet.name;

    // Build array-of-arrays mirror of xlsx's sheet_to_json({header:1}).
    // ExcelJS row.values is 1-indexed; slice off the leading undefined.
    const rows: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const raw = Array.isArray(row.values) ? row.values : [];
      const values = raw.slice(1).map((v) => (v === undefined ? null : v));
      rows.push(values);
    });
    if (rows.length === 0) return;

    const header = rows[0].map((c) => stringify(c));
    const headerLine = header.join('\t');

    // Pad rows to header column count (xlsx did this implicitly).
    const colCount = header.length;
    for (const r of rows) {
      while (r.length < colCount) r.push(null);
    }

    // Skip pure-empty sheets (header row + nothing useful below).
    const hasData =
      rows.length > 1 &&
      rows.slice(1).some((r) => r.some((c) => c !== null && c !== ''));
    if (!hasData) return;

    // Group data rows in batches of ROWS_PER_CHUNK.
    for (let start = 1; start < rows.length; start += ROWS_PER_CHUNK) {
      const end = Math.min(start + ROWS_PER_CHUNK, rows.length);
      const batchRows = rows.slice(start, end);
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
          lineRange: [start + 1, end],
          sheet: sheetName,
        },
      });
    }
  });

  return chunks;
}

function stringify(c: unknown): string {
  if (c === null || c === undefined) return '';
  if (typeof c === 'string') return c;
  if (typeof c === 'number' || typeof c === 'boolean') return String(c);
  if (c instanceof Date) return c.toISOString();
  if (typeof c === 'object') {
    const obj = c as Record<string, unknown>;
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((rt) => String((rt as { text?: unknown }).text ?? ''))
        .join('');
    }
    if (obj.result !== undefined && obj.result !== null) {
      return stringify(obj.result);
    }
    if (typeof obj.text === 'string') return obj.text;
  }
  return JSON.stringify(c);
}
