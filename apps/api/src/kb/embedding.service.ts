// QA Nexus PM1 — KbEmbeddingService.
//
// Spec: Day-8 Step 6 (M2 retrieval flow). Populates `kb_chunks.embedding`
// for chunks emitted by ChunkingService (Step 5, PR #34).
//
// Architecture:
//   - Low-level embedder: apps/api/src/embedding/embedding.service.ts
//     (the @xenova/transformers bridge — bge-small-en-v1.5, 384-dim).
//     Already deferred-pattern-wrapped (graceful when model can't load
//     on Render Free 512 MB). This module wraps it for the KB domain.
//   - This service: KB-domain orchestration. Pulls chunks WHERE
//     embedding IS NULL for a given documentId, batches through
//     EmbeddingService.embedBatch(), writes back via raw SQL (Prisma's
//     pgvector support is via @db.Unsupported — needs $executeRaw).
//   - Audit: synchronous `kb_chunks_embedded` row per call.
//
// Idempotency: the WHERE embedding IS NULL filter makes re-running on
// an already-embedded document a no-op (returns { embeddedCount: 0 }).
// Re-chunking the document via ChunkingService will produce fresh
// chunks with NULL embeddings, which the next call here populates.
//
// Batching: pgvector raw SQL UPDATE in a single transaction. Uses
// Postgres VALUES + UPDATE FROM pattern so all chunks update in one
// round-trip (vs N round-trips for per-row UPDATEs).
//
// Cross-workspace safety: the documentId lookup joins through project
// to verify workspace match — same pattern as ChunkingService.
// Cross-workspace document → 404 (no leak). Workspace mismatch on
// chunks (impossible by FK but defensively checked) → 500.

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmbeddingService } from '../embedding/embedding.service';

const EXPECTED_DIM = 384;

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

export interface EmbedDocumentResult {
  documentId: string;
  /** Number of chunks newly embedded in THIS call. 0 = idempotent no-op. */
  embeddedCount: number;
  /** Total chunks for the document (embedded + already-embedded). */
  totalChunks: number;
  /** Chunks that already had an embedding before this call ran. */
  alreadyEmbedded: number;
}

@Injectable()
export class KbEmbeddingService {
  private readonly logger = new Logger(KbEmbeddingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly embedder: EmbeddingService,
  ) {}

  /**
   * Embed all NULL-embedding chunks for a document.
   *
   * @param documentId Existing KbDocument.id (caller's responsibility
   *   to have run ChunkingService first).
   * @param ctx Actor for audit + workspace scoping.
   *
   * Workflow:
   *   1. Verify document exists + workspace matches → 404 if not.
   *   2. Read chunks WHERE embedding IS NULL ORDER BY chunkIndex.
   *      If 0 → return { embeddedCount: 0, ... } (idempotent).
   *   3. Call EmbeddingService.embedBatch(chunkTexts) — single WASM
   *      bridge crossing for all chunks.
   *   4. Write back via raw SQL UPDATE (one round-trip).
   *   5. Audit synchronously inside the request handler.
   */
  async embedDocument(
    documentId: string,
    ctx: ActorContext,
  ): Promise<EmbedDocumentResult> {
    // 1. Verify document + workspace.
    const doc = await this.prisma.kbDocument.findUnique({
      where: { id: documentId },
      include: { project: { select: { workspaceId: true } } },
    });
    if (!doc) {
      throw new NotFoundException(`document ${documentId} not found`);
    }
    if (!doc.project || doc.project.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`document ${documentId} not found`);
    }

    // 2. Pull chunks needing embedding. We use raw SQL instead of
    // prisma.kbChunk.findMany because the embedding column is
    // @db.Unsupported (vector(384)) — Prisma's typed client can't
    // reference it in a WHERE filter. Raw SQL gives us IS NULL.
    const totalChunks = await this.prisma.kbChunk.count({
      where: { documentId },
    });
    if (totalChunks === 0) {
      throw new BadRequestException(
        `document ${documentId} has no chunks — run chunking first`,
      );
    }
    const pending = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; chunk_text: string; chunk_index: number }>
    >(
      `SELECT id, chunk_text, chunk_index
         FROM kb_chunks
        WHERE document_id = $1::uuid AND embedding IS NULL
        ORDER BY chunk_index`,
      documentId,
    );
    const alreadyEmbedded = totalChunks - pending.length;

    if (pending.length === 0) {
      // Idempotent no-op. Still audit so we have a record of the call.
      await this.audit.write({
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        entityType: 'kb_document',
        entityId: documentId,
        action: 'kb_chunks_embedded',
        payload: {
          document_id: documentId,
          embedded_count: 0,
          total_chunks: totalChunks,
          already_embedded: alreadyEmbedded,
          noop: true,
          actor_email: ctx.actorEmail,
        },
      });
      return {
        documentId,
        embeddedCount: 0,
        totalChunks,
        alreadyEmbedded,
      };
    }

    // 3. Batch-embed.
    const texts = pending.map((c) => c.chunk_text);
    const vectors = await this.embedder.embedBatch(texts);
    if (vectors.length !== pending.length) {
      throw new Error(
        `embedder returned ${vectors.length} vectors for ${pending.length} chunks`,
      );
    }

    // 4. Write back via raw SQL. Single transaction; one UPDATE per row
    // (pgvector parameter binding is per-vector, not bulk-friendly via
    // VALUES because the array literal needs the dim baked in). For
    // M2 pilot scale (~50 chunks/doc), N round-trips is fine (~10ms total).
    // Optimize to bulk VALUES if M3 throughput demands it.
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < pending.length; i++) {
        const chunk = pending[i];
        const vec = vectors[i];
        if (vec.length !== EXPECTED_DIM) {
          throw new Error(
            `chunk ${chunk.id} embedding dim mismatch: expected ${EXPECTED_DIM}, ` +
              `got ${vec.length}`,
          );
        }
        // pgvector accepts the literal '[v1,v2,...]' string format.
        const literal = `[${Array.from(vec).join(',')}]`;
        await tx.$executeRawUnsafe(
          `UPDATE kb_chunks SET embedding = $1::vector WHERE id = $2::uuid`,
          literal,
          chunk.id,
        );
      }
    });

    // 5. Audit.
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'kb_document',
      entityId: documentId,
      action: 'kb_chunks_embedded',
      payload: {
        document_id: documentId,
        embedded_count: pending.length,
        total_chunks: totalChunks,
        already_embedded: alreadyEmbedded,
        // Embedder-info for forensics (which model produced these vectors).
        // status() returns modelId + warm flag — small + non-PII.
        embedder_status: this.embedder.status(),
        actor_email: ctx.actorEmail,
      },
    });

    return {
      documentId,
      embeddedCount: pending.length,
      totalChunks,
      alreadyEmbedded,
    };
  }
}
