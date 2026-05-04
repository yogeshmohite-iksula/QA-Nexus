// QA Nexus PM1 — PDF parser for chunking service.
//
// Library choice: `pdf-parse` (MIT, wraps pdfjs internally with a
// leaner footprint). Originally Day-8 brief said `pdfjs-dist`, but
// pdfjs-dist pulls `canvas` as a peer-dep — a heavy native module
// (~30MB resident on Linux) that risks recreating the Day-4 bge-large
// 512MB OOM on Render Free. pdf-parse is a thin wrapper around the
// same pdfjs core text-extraction pipeline without the canvas
// dependency. Same extraction quality, fraction of the memory.
//
// Strategy: one chunk per page. Each chunk's metadata.pageNo is the
// 1-indexed page; metadata.lineRange is [1, line-count-on-that-page].
// Pages with empty/whitespace-only text are skipped — they'd produce
// useless empty chunks.
//
// MAX_CHUNK_CHARS guard: a single PDF page CAN contain 5-10k chars
// (A1 spec sheet, dense table). Per ERD §5 / database.md "chunks
// should target ~500 tokens (~2000 chars)" — so split very long pages
// at paragraph boundaries to honour the chunk-size budget.

import { PDFParse, type TextResult } from 'pdf-parse';
import type { ParsedChunk } from './types';

/** Soft target — split pages longer than this at paragraph boundaries. */
const MAX_CHUNK_CHARS = 2000;

export async function parsePdf(buffer: Buffer): Promise<ParsedChunk[]> {
  // pdf-parse v2 is class-based. Pass `data: Buffer/Uint8Array` to
  // PDFParse constructor; call getText() for per-page text.
  // Per the pdf-parse v2 API:
  //   - PDFParse({ data: Buffer }) constructs the parser
  //   - .getText() returns a TextResult with `.pages: Array<{ text: string }>`
  //     plus a concatenated `.text: string` for the full doc.
  const parser = new PDFParse({ data: buffer });
  let result: TextResult;
  try {
    result = await parser.getText();
  } finally {
    await parser.destroy();
  }

  const chunks: ParsedChunk[] = [];
  // Per-page iteration with 1-indexed page numbers.
  const pages = (result.pages ?? []) as Array<{ text?: string }>;
  pages.forEach((p, idx) => {
    const trimmed = (p.text ?? '').trim();
    if (!trimmed) return; // skip empty pages
    const pageNo = idx + 1;
    const subChunks = splitPageIfTooLong(trimmed);
    for (const sub of subChunks) {
      const lineCount = sub.split('\n').length;
      chunks.push({
        chunkText: sub,
        metadata: { pageNo, lineRange: [1, lineCount] },
      });
    }
  });
  return chunks;
}

/**
 * If a page exceeds MAX_CHUNK_CHARS, split at double-newline (paragraph)
 * boundaries to keep each emitted chunk near the 2000-char target.
 * Falls back to single-newline if no paragraph breaks exist.
 */
function splitPageIfTooLong(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  // Try paragraph splits first.
  const paragraphs = text.split(/\n\n+/);
  if (paragraphs.length <= 1) {
    // No paragraph breaks — split by single newline as fallback.
    return groupLinesNearTarget(text.split('\n'));
  }
  return groupLinesNearTarget(paragraphs);
}

function groupLinesNearTarget(lines: string[]): string[] {
  const out: string[] = [];
  let buf: string[] = [];
  let bufLen = 0;
  for (const line of lines) {
    if (bufLen + line.length > MAX_CHUNK_CHARS && buf.length > 0) {
      out.push(buf.join('\n'));
      buf = [];
      bufLen = 0;
    }
    buf.push(line);
    bufLen += line.length + 1;
  }
  if (buf.length > 0) out.push(buf.join('\n'));
  return out;
}
