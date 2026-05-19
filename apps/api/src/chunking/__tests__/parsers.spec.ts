// Unit tests for individual parsers — Day-8 Step 5.
//
// Strategy: build small in-memory buffers (no fixture files), call each
// parser, assert chunk shape + metadata + idempotency (parsing the same
// input twice returns identical output).
//
// Day-22 (2026-05-19) — m5 CVE remediation / Kimi K2 HIGH triage:
// xlsx (sheetjs CE 0.18.5) → exceljs swap. parseXlsx() is now async; the
// in-memory buildXlsx() helper uses ExcelJS Workbook + writeBuffer.

import { parseTxt } from '../parsers/txt-parser';
import { parseCsv } from '../parsers/csv-parser';
import { parseXlsx } from '../parsers/xlsx-parser';
import { detectFormat } from '../parsers/types';
import { Workbook } from 'exceljs';

describe('Chunking parsers', () => {
  describe('detectFormat()', () => {
    it.each([
      ['return_policy_v2.xlsx', 'xlsx'],
      ['data.xls', 'xlsx'],
      ['report.PDF', 'pdf'],
      ['legacy_refund_test_cases.csv', 'csv'],
      ['notes.txt', 'txt'],
      ['runbook.md', 'txt'],
    ])('%s → %s', (fileName, expected) => {
      expect(detectFormat(fileName)).toBe(expected);
    });

    it('returns null for unsupported formats', () => {
      expect(detectFormat('movie.mp4')).toBeNull();
      expect(detectFormat('image.png')).toBeNull();
      expect(detectFormat('no-extension')).toBeNull();
    });
  });

  describe('parseTxt()', () => {
    it('happy path — splits on paragraph boundaries with 1-indexed lineRange', () => {
      const text = [
        'First paragraph line 1.',
        'First paragraph line 2.',
        '',
        'Second paragraph line 1.',
        '',
        'Third paragraph.',
      ].join('\n');
      const chunks = parseTxt(Buffer.from(text, 'utf8'));
      expect(chunks.length).toBeGreaterThan(0);
      for (const c of chunks) {
        expect(c.metadata.pageNo).toBeNull();
        expect(c.metadata.lineRange[0]).toBeGreaterThanOrEqual(1);
        expect(c.metadata.lineRange[1]).toBeGreaterThanOrEqual(
          c.metadata.lineRange[0],
        );
      }
    });

    it('empty buffer → empty chunk array', () => {
      expect(parseTxt(Buffer.from('', 'utf8'))).toEqual([]);
      expect(parseTxt(Buffer.from('   \n\n  \n', 'utf8'))).toEqual([]);
    });

    it('groups paragraphs near 2000-char target', () => {
      const para = 'word '.repeat(120);
      const text = Array(5).fill(para).join('\n\n');
      const chunks = parseTxt(Buffer.from(text, 'utf8'));
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      for (const c of chunks) {
        expect(c.chunkText.length).toBeLessThan(3000);
      }
    });

    it('idempotent — parsing same input twice produces identical output', () => {
      const text =
        'Para A.\n\nPara B.\n\nPara C with multiple\nlines inside it.';
      const a = parseTxt(Buffer.from(text, 'utf8'));
      const b = parseTxt(Buffer.from(text, 'utf8'));
      expect(a).toEqual(b);
    });
  });

  describe('parseCsv()', () => {
    it('happy path — header repeated in each chunk body', () => {
      const csv = [
        'name,email,role',
        'Akshay,akshay@iksula.com,Lead',
        'Yogesh,yogesh.mohite@iksula.com,Admin',
        'Kishor,kishor@iksula.com,QAEngineer',
      ].join('\n');
      const chunks = parseCsv(Buffer.from(csv, 'utf8'));
      expect(chunks).toHaveLength(1);
      expect(chunks[0].chunkText).toContain('name\temail\trole');
      expect(chunks[0].chunkText).toContain('Akshay');
      expect(chunks[0].chunkText).toContain('Kishor');
      expect(chunks[0].metadata.pageNo).toBeNull();
      expect(chunks[0].metadata.lineRange).toEqual([2, 4]);
    });

    it('header-only CSV → no chunks (no data)', () => {
      expect(parseCsv(Buffer.from('a,b,c\n', 'utf8'))).toEqual([]);
    });

    it('empty CSV → no chunks', () => {
      expect(parseCsv(Buffer.from('', 'utf8'))).toEqual([]);
    });

    it('groups 60 rows into 3 chunks of 25 (with leftover 10)', () => {
      const lines = ['col1,col2'];
      for (let i = 0; i < 60; i++) lines.push(`v${i}a,v${i}b`);
      const chunks = parseCsv(Buffer.from(lines.join('\n'), 'utf8'));
      expect(chunks).toHaveLength(3);
      expect(chunks[0].metadata.lineRange).toEqual([2, 26]);
      expect(chunks[2].metadata.lineRange).toEqual([52, 61]);
    });

    it('idempotent', () => {
      const csv = 'h1,h2\nv1,v2\nv3,v4';
      const a = parseCsv(Buffer.from(csv, 'utf8'));
      const b = parseCsv(Buffer.from(csv, 'utf8'));
      expect(a).toEqual(b);
    });
  });

  describe('parseXlsx()', () => {
    /** Build a minimal in-memory XLSX with given sheets using ExcelJS.
     *  Day-22 swap: was xlsx (sheetjs) — now exceljs. Same surface
     *  (sheet-name → array-of-arrays); per-test bodies are now async. */
    async function buildXlsx(
      sheets: Record<string, unknown[][]>,
    ): Promise<Buffer> {
      const wb = new Workbook();
      for (const [name, rows] of Object.entries(sheets)) {
        const ws = wb.addWorksheet(name);
        for (const row of rows) {
          ws.addRow(row);
        }
      }
      // ExcelJS writeBuffer returns ArrayBuffer in @4.x — wrap for Node Buffer.
      const ab = await wb.xlsx.writeBuffer();
      return Buffer.from(ab as ArrayBuffer);
    }

    it('happy path — single sheet with header + data', async () => {
      const buf = await buildXlsx({
        Policy: [
          ['section', 'description'],
          ['1.1', 'Returns within 30 days'],
          ['1.2', 'Refunds in 5-7 days'],
        ],
      });
      const chunks = await parseXlsx(buf);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].metadata.sheet).toBe('Policy');
      expect(chunks[0].metadata.pageNo).toBeNull();
      expect(chunks[0].chunkText).toContain('section\tdescription');
      expect(chunks[0].chunkText).toContain('Returns within 30 days');
    });

    it('multi-sheet → chunks per sheet, sheet name in metadata', async () => {
      const buf = await buildXlsx({
        Policy: [
          ['s', 'd'],
          ['1', 'a'],
        ],
        FAQ: [
          ['q', 'a'],
          ['How long?', '30 days'],
        ],
      });
      const chunks = await parseXlsx(buf);
      expect(chunks).toHaveLength(2);
      const sheets = chunks.map((c) => c.metadata.sheet).sort();
      expect(sheets).toEqual(['FAQ', 'Policy']);
    });

    it('empty sheet (header only) → skipped', async () => {
      const buf = await buildXlsx({
        Empty: [['col1', 'col2']],
        WithData: [
          ['a', 'b'],
          ['1', '2'],
        ],
      });
      const chunks = await parseXlsx(buf);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].metadata.sheet).toBe('WithData');
    });

    it('idempotent', async () => {
      const buf = await buildXlsx({
        Sheet1: [
          ['a', 'b'],
          ['1', '2'],
          ['3', '4'],
        ],
      });
      const a = await parseXlsx(buf);
      const b = await parseXlsx(buf);
      expect(a).toEqual(b);
    });
  });
});
