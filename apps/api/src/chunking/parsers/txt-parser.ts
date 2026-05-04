// QA Nexus PM1 — TXT / Markdown parser for chunking service.
//
// Also serves as the MP4-transcript parser — the upload pipeline
// (Step 7) pre-extracts video transcripts to .txt sibling files,
// so video chunking IS just text chunking by the time it reaches
// here.
//
// Strategy: split on double-newlines (paragraph boundaries) first,
// then group paragraphs into chunks targeting ~2000 chars
// (~500 tokens at 4 chars/token, matching ERD §5 budget). Falls
// back to single-newline splits when no paragraph breaks exist
// (e.g., a transcript dumped as one long line).

import type { ParsedChunk } from './types';

const TARGET_CHUNK_CHARS = 2000;

export function parseTxt(buffer: Buffer): ParsedChunk[] {
  const text = buffer.toString('utf8').trim();
  if (!text) return [];

  // Track 1-indexed line ranges for source attribution.
  const allLines = text.split('\n');
  const totalLines = allLines.length;

  // Build (paragraph, [startLine, endLine]) pairs by walking line by line.
  type Para = { text: string; lineRange: [number, number] };
  const paragraphs: Para[] = [];
  let buf: string[] = [];
  let bufStart = 1;
  for (let i = 0; i < totalLines; i++) {
    const line = allLines[i];
    if (line.trim() === '' && buf.length > 0) {
      paragraphs.push({
        text: buf.join('\n'),
        lineRange: [bufStart, i], // i is 0-indexed, so user-visible line = i (which is the blank line above) — close just before it
      });
      buf = [];
      bufStart = i + 2; // next non-blank is i+1 (0-index) = i+2 (1-index)
    } else if (line.trim() !== '') {
      if (buf.length === 0) bufStart = i + 1;
      buf.push(line);
    }
  }
  if (buf.length > 0) {
    paragraphs.push({
      text: buf.join('\n'),
      lineRange: [bufStart, totalLines],
    });
  }

  // Group paragraphs into chunks near TARGET_CHUNK_CHARS.
  const chunks: ParsedChunk[] = [];
  let chunkBuf: Para[] = [];
  let chunkLen = 0;
  for (const p of paragraphs) {
    // If adding this paragraph blows the budget AND we have at least
    // one paragraph buffered, flush.
    if (chunkLen + p.text.length > TARGET_CHUNK_CHARS && chunkBuf.length > 0) {
      flushChunk(chunkBuf, chunks);
      chunkBuf = [];
      chunkLen = 0;
    }
    chunkBuf.push(p);
    chunkLen += p.text.length + 2; // +2 for paragraph separator
  }
  if (chunkBuf.length > 0) flushChunk(chunkBuf, chunks);

  return chunks;
}

function flushChunk(
  buf: Array<{ text: string; lineRange: [number, number] }>,
  out: ParsedChunk[],
): void {
  const chunkText = buf.map((p) => p.text).join('\n\n');
  const lineRange: [number, number] = [
    buf[0].lineRange[0],
    buf[buf.length - 1].lineRange[1],
  ];
  out.push({
    chunkText,
    metadata: { pageNo: null, lineRange },
  });
}
