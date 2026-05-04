// QA Nexus PM1 — ChunkingService.
//
// Spec: Day-8 Step 5 (M2 retrieval flow). Parses an uploaded source
// file into chunks + writes rows to TB-018 `kb_chunks`.
// Embedding generation deferred to Step 6 (next PR; @xenova/transformers
// per ADR-003 + ADR-009).
//
// Inputs: a `KbDocument` row (the source file's metadata) + the file
// content as a Buffer (caller fetches from R2 via R2Service.getObject).
//
// Idempotency: leverages the existing `(documentId, chunkIndex)` unique
// constraint on `kb_chunks`. Strategy: delete-then-insert in a single
// transaction, so re-running on the same file produces deterministic
// (documentId, chunkIndex) tuples and a clean replacement (rather than
// stacking duplicates with new UUIDs). Each chunk's UUID is fresh per
// invocation — that's a deliberate trade-off documented in the README:
// chunkIndex is the stable key, chunkId is regenerated. Step 6's
// embedding write will use the fresh chunkIds.
//
// Audit (Hard Rule 7): every chunking run writes a synchronous
// `kb_chunks_generated` audit row with { document_id, chunk_count,
// format, source_file_name, actor_email }. Chain-binding.
//
// Invocation (Step 5 scope): an internal Admin-gated endpoint
// (POST /api/admin/kb/chunk-document). Step 7 adds the upload
// completion hook that calls this service automatically.

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { parsePdf } from './parsers/pdf-parser';
import { parseXlsx } from './parsers/xlsx-parser';
import { parseCsv } from './parsers/csv-parser';
import { parseTxt } from './parsers/txt-parser';
import {
  detectFormat,
  type ParsedChunk,
  type SupportedFormat,
} from './parsers/types';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

export interface ChunkingResult {
  documentId: string;
  format: SupportedFormat;
  chunkCount: number;
  /** First chunk's metadata for FE preview ("first page", "rows 1-25", etc). */
  firstChunkPreview: string;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Parse + chunk + persist. Atomic: chunks are written in a single
   * transaction so the kb_chunks state is always consistent with the
   * most recent successful run on this document.
   *
   * @param documentId Existing KbDocument.id (caller's responsibility
   *   to have created the document row + uploaded the file to R2).
   * @param fileName Original file name — used for format detection +
   *   audit-log preview (NOT for storage path; that's R2-side).
   * @param content File bytes.
   * @param ctx Actor for audit + workspace scoping.
   */
  async chunkDocument(
    documentId: string,
    fileName: string,
    content: Buffer,
    ctx: ActorContext,
  ): Promise<ChunkingResult> {
    const format = detectFormat(fileName);
    if (!format) {
      throw new BadRequestException(
        `unsupported file format: ${fileName} (supported: pdf, xlsx, csv, txt, md)`,
      );
    }

    // Verify the document exists + belongs to actor's workspace.
    // Document → project → workspace (KbDocument has projectId nullable
    // for workspace-scoped docs; either way the workspace must match).
    const doc = await this.prisma.kbDocument.findUnique({
      where: { id: documentId },
      include: { project: { select: { workspaceId: true } } },
    });
    if (!doc) {
      throw new NotFoundException(`document ${documentId} not found`);
    }
    // Workspace check: workspace-scoped docs (projectId=null) need a
    // separate workspace pointer — for now, require all docs to have
    // a project (we'll loosen if/when a workspace-only KB lands).
    if (!doc.project || doc.project.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`document ${documentId} not found`);
    }

    // Dispatch to the right parser.
    const parsed = await this.parse(format, content);
    if (parsed.length === 0) {
      throw new BadRequestException(
        `parser produced 0 chunks from ${fileName} — file is empty or all-whitespace`,
      );
    }

    // Atomic replace: delete existing chunks + insert fresh ones.
    // The (documentId, chunkIndex) unique constraint guarantees the
    // pre-existing rows can't collide with the new inserts inside the
    // same tx (delete fires first).
    await this.prisma.$transaction(async (tx) => {
      await tx.kbChunk.deleteMany({ where: { documentId } });
      await tx.kbChunk.createMany({
        data: parsed.map((p, idx) => ({
          documentId,
          chunkText: p.chunkText,
          chunkIndex: idx,
          metadataJson: p.metadata as unknown as Prisma.InputJsonValue,
          // embedding intentionally omitted — Step 6 wires it.
        })),
      });
    });

    // Audit (chain-binding).
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'kb_document',
      entityId: documentId,
      action: 'kb_chunks_generated',
      payload: {
        document_id: documentId,
        format,
        // File NAME is fine in audit (not PII; the upload pipeline already
        // exposes it through R2). NOT the file CONTENTS.
        source_file_name: fileName,
        chunk_count: parsed.length,
        // First chunk preview helps debug a "wrong file got chunked" mistake.
        first_chunk_preview_chars: parsed[0].chunkText.slice(0, 80),
        actor_email: ctx.actorEmail,
      },
    });

    return {
      documentId,
      format,
      chunkCount: parsed.length,
      firstChunkPreview: parsed[0].chunkText.slice(0, 80),
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Parser dispatch — exposed via static so tests can drive parsers
  // directly without going through the full service.
  // ────────────────────────────────────────────────────────────────────

  async parse(
    format: SupportedFormat,
    content: Buffer,
  ): Promise<ParsedChunk[]> {
    switch (format) {
      case 'pdf':
        return parsePdf(content);
      case 'xlsx':
        return parseXlsx(content);
      case 'csv':
        return parseCsv(content);
      case 'txt':
        return parseTxt(content);
    }
  }
}
