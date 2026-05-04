// Unit tests for ChunkingService — Day-8 Step 5.
//
// Strategy: stub PrismaService + AuditService — no real DB. Use a real
// in-memory text fixture so the parser pathway exercises the actual
// parseTxt() code (not just a mock).
//
// Pins: cross-workspace 404, format detection, atomic delete-then-insert
// (two writes inside a tx), audit row content, idempotency (re-running
// produces same chunkIndex sequence).

import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChunkingService } from '../chunking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const ctx = {
  workspaceId: 'ws-1',
  actorId: 'admin-1',
  actorEmail: 'yogesh.mohite@iksula.com',
};

function makePrisma() {
  return {
    kbDocument: { findUnique: jest.fn() },
    kbChunk: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

const TXT_CONTENT = Buffer.from(
  [
    'First paragraph about returns within 30 days.',
    '',
    'Second paragraph about refund processing.',
    '',
    'Third paragraph about damaged-in-transit photos.',
  ].join('\n'),
  'utf8',
);

describe('ChunkingService', () => {
  let service: ChunkingService;
  let prisma: ReturnType<typeof makePrisma>;
  let audit: { write: jest.Mock };

  beforeEach(async () => {
    prisma = makePrisma();
    audit = { write: jest.fn().mockResolvedValue({ id: 'a', thisHash: 'h' }) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChunkingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(ChunkingService);
  });

  describe('chunkDocument()', () => {
    it('happy path — parses TXT, atomic replace, audit fires', async () => {
      prisma.kbDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        project: { workspaceId: 'ws-1' },
      });
      const txStub = {
        kbChunk: {
          deleteMany: jest.fn().mockResolvedValueOnce({ count: 0 }),
          createMany: jest.fn().mockResolvedValueOnce({ count: 1 }),
        },
      };
      prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(txStub));

      const result = await service.chunkDocument(
        'doc-1',
        'notes.txt',
        TXT_CONTENT,
        ctx,
      );

      expect(result.format).toBe('txt');
      expect(result.chunkCount).toBeGreaterThan(0);
      expect(result.firstChunkPreview).toContain('returns');

      // Atomic: delete + create both ran in the same tx callback.
      expect(txStub.kbChunk.deleteMany).toHaveBeenCalledWith({
        where: { documentId: 'doc-1' },
      });
      expect(txStub.kbChunk.createMany).toHaveBeenCalled();
      const createArg = txStub.kbChunk.createMany.mock.calls[0][0];
      // Each chunk has documentId + sequential chunkIndex starting at 0.
      const firstRow = createArg.data[0];
      expect(firstRow.documentId).toBe('doc-1');
      expect(firstRow.chunkIndex).toBe(0);
      expect(firstRow.chunkText).toBeDefined();
      // Embedding intentionally NOT set — Step 6 wires it.
      expect(firstRow.embedding).toBeUndefined();

      // Audit fired — chain-binding.
      expect(audit.write).toHaveBeenCalledTimes(1);
      const a = audit.write.mock.calls[0][0];
      expect(a.action).toBe('kb_chunks_generated');
      expect(a.entityType).toBe('kb_document');
      expect(a.entityId).toBe('doc-1');
      expect(a.payload.format).toBe('txt');
      expect(a.payload.source_file_name).toBe('notes.txt');
      expect(a.payload.actor_email).toBe('yogesh.mohite@iksula.com');
    });

    it('unsupported format → 400', async () => {
      await expect(
        service.chunkDocument('doc-1', 'movie.mp4', Buffer.from(''), ctx),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.kbDocument.findUnique).not.toHaveBeenCalled();
    });

    it('document not found → 404 (no leak that doc exists)', async () => {
      prisma.kbDocument.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.chunkDocument('gone', 'notes.txt', TXT_CONTENT, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cross-workspace document → 404 (no leak)', async () => {
      prisma.kbDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        project: { workspaceId: 'ws-OTHER' },
      });
      await expect(
        service.chunkDocument('doc-1', 'notes.txt', TXT_CONTENT, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('document without project (workspace-only KB not yet supported) → 404', async () => {
      prisma.kbDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        project: null,
      });
      await expect(
        service.chunkDocument('doc-1', 'notes.txt', TXT_CONTENT, ctx),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('empty/whitespace-only file → 400 (parser produces 0 chunks)', async () => {
      prisma.kbDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        project: { workspaceId: 'ws-1' },
      });
      await expect(
        service.chunkDocument(
          'doc-1',
          'empty.txt',
          Buffer.from('   \n\n  \n'),
          ctx,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      // Audit NOT fired on parse-empty (no state change happened).
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('idempotency — second call produces same chunkIndex sequence', async () => {
      prisma.kbDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        project: { workspaceId: 'ws-1' },
      });
      const recordedCalls: unknown[][] = [];
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txStub = {
          kbChunk: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn(async (arg: unknown) => {
              recordedCalls.push((arg as { data: unknown[] }).data);
              return { count: 1 };
            }),
          },
        };
        return cb(txStub);
      });

      await service.chunkDocument('doc-1', 'notes.txt', TXT_CONTENT, ctx);
      await service.chunkDocument('doc-1', 'notes.txt', TXT_CONTENT, ctx);

      // Both runs: same data structure (text + chunkIndex), even though
      // chunkId UUIDs differ (Prisma assigns at insert time, our service
      // doesn't pin them — that's the documented trade-off).
      expect(recordedCalls).toHaveLength(2);
      const stripIds = (rows: unknown[]) =>
        rows.map((r) => {
          const x = r as Record<string, unknown>;
          return {
            documentId: x.documentId,
            chunkText: x.chunkText,
            chunkIndex: x.chunkIndex,
            metadataJson: x.metadataJson,
          };
        });
      expect(stripIds(recordedCalls[0])).toEqual(stripIds(recordedCalls[1]));
    });
  });

  describe('parse() — direct parser dispatch', () => {
    it('txt format dispatches to parseTxt', async () => {
      const out = await service.parse('txt', TXT_CONTENT);
      expect(out.length).toBeGreaterThan(0);
      expect(out[0].metadata.pageNo).toBeNull();
    });

    it('csv format dispatches to parseCsv', async () => {
      const csv = Buffer.from('a,b\n1,2\n3,4', 'utf8');
      const out = await service.parse('csv', csv);
      expect(out).toHaveLength(1);
      expect(out[0].chunkText).toContain('a\tb');
    });
  });
});
