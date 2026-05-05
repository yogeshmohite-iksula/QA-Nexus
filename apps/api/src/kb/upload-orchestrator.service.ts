// QA Nexus PM1 — UploadOrchestratorService.
//
// Spec: Day-8 Step 7 (M2 retrieval flow). Closes the two-call pattern
// from Steps 5 + 6 by orchestrating chunking + embedding from a single
// upload-completion entry point.
//
// Before Step 7 (the two-call pattern):
//   1. Admin POSTs /api/admin/kb/chunk-document  (Step 5, PR #34)
//   2. Admin POSTs /api/admin/kb/embed-document  (Step 6, PR #39)
//
// After Step 7 (this service):
//   1. Upload completes → caller invokes finalize-upload OR R2 webhook
//      hits /api/admin/kb/finalize-upload (Admin-only fallback today)
//   2. Service runs chunkDocument() → embedDocument() in sequence
//   3. Audit chain: kb_document_orchestration_started →
//      kb_chunks_generated (via ChunkingService) →
//      kb_chunks_embedded (via KbEmbeddingService) →
//      kb_document_orchestration_completed
//      OR kb_document_orchestration_failed (with stage + reason)
//
// Idempotency: Step 5's atomic delete-then-insert + Step 6's WHERE
// embedding IS NULL filter are both individually idempotent. The
// orchestrator inherits that — re-running on a fully-processed
// document re-chunks (same content → same chunkIndex sequence) and
// then no-ops on embedding (everything already embedded WAS just
// blown away by re-chunk; bridge logic below handles this).
//
// Failure semantics: chunking failure short-circuits — embedding is
// NOT attempted, audit row says stage='chunking'. Embedding failure
// AFTER successful chunking leaves the kb_chunks rows intact (they're
// unembedded but valid); audit row says stage='embedding'. Caller can
// retry the orchestrator OR call embed-document directly.
//
// FE notification (Step 7 minimum): the response carries the full
// chunking + embedding results so the FE can render terminal state in
// the upload modal without polling. WebSocket push is deferred to a
// follow-up — finalize-upload returns synchronously today (M2 pilot
// uploads are <50 chunks, ~3-5s wall-clock incl. cold-load).

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import {
  ChunkingService,
  type ChunkingResult,
  type ActorContext as ChunkingActorContext,
} from '../chunking/chunking.service';
import {
  KbEmbeddingService,
  type EmbedDocumentResult,
  type ActorContext as EmbeddingActorContext,
} from './embedding.service';
import { R2Service } from '../storage/r2.service';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

export type OrchestrationFailureStage = 'r2_fetch' | 'chunking' | 'embedding';

export interface OrchestrationResult {
  documentId: string;
  chunking: ChunkingResult;
  embedding: EmbedDocumentResult;
  /** Wall-clock duration in ms — useful for FE progress UX + later
   *  OTel spans. Measured from finalize() entry to audit completion. */
  totalDurationMs: number;
}

@Injectable()
export class UploadOrchestratorService {
  private readonly logger = new Logger(UploadOrchestratorService.name);

  constructor(
    private readonly chunking: ChunkingService,
    private readonly embedding: KbEmbeddingService,
    private readonly r2: R2Service,
    private readonly audit: AuditService,
  ) {}

  /**
   * Finalize an upload: fetch from R2 → chunk → embed → audit.
   *
   * @param documentId Existing KbDocument.id (caller created it before
   *   the upload + the file is already in R2 at r2Key).
   * @param fileName Original file name (for format detection + audit).
   * @param r2Key Object key in the R2 bucket.
   * @param ctx Actor for audit + workspace scoping.
   *
   * Throws:
   *   - NotFoundException if R2 fetch fails (object missing or
   *     unreachable) OR document not found / cross-workspace
   *   - BadRequestException if file format unsupported / parser
   *     yields zero chunks
   *   - InternalServerErrorException if embedding stage fails after
   *     chunking succeeded (caller can retry via embed-document)
   *
   * All failures audit the stage they failed at via
   * kb_document_orchestration_failed before re-throwing.
   */
  async finalize(
    documentId: string,
    fileName: string,
    r2Key: string,
    ctx: ActorContext,
  ): Promise<OrchestrationResult> {
    const startedAt = Date.now();

    // Audit: orchestration started. Useful for forensics on stuck
    // uploads ("started but never completed" → orchestrator crashed
    // mid-flight).
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'kb_document',
      entityId: documentId,
      action: 'kb_document_orchestration_started',
      payload: {
        document_id: documentId,
        source_file_name: fileName,
        r2_key: r2Key,
        actor_email: ctx.actorEmail,
      },
    });

    // Stage 1: R2 fetch.
    let content: Buffer;
    try {
      content = await this.r2.getObject(r2Key);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `R2 fetch failed for documentId=${documentId} r2Key=${r2Key}: ${reason}`,
      );
      await this.auditFailure(documentId, 'r2_fetch', reason, ctx);
      throw new NotFoundException(
        `source file at r2Key=${r2Key} not found or unreachable`,
      );
    }

    // Stage 2: chunking. ChunkingService handles its own audit row
    // (kb_chunks_generated) on success + throws on failure.
    let chunkingResult: ChunkingResult;
    try {
      const chunkingCtx: ChunkingActorContext = {
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        actorEmail: ctx.actorEmail,
      };
      chunkingResult = await this.chunking.chunkDocument(
        documentId,
        fileName,
        content,
        chunkingCtx,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await this.auditFailure(documentId, 'chunking', reason, ctx);
      throw err;
    }

    // Stage 3: embedding. KbEmbeddingService handles its own audit
    // row (kb_chunks_embedded) on success + throws on failure. After
    // a successful re-chunk above, all chunks are NEW (UUIDs
    // regenerated per chunking run by design — see chunking.service.ts
    // header) so embedding will always have work to do here, never
    // a no-op.
    let embeddingResult: EmbedDocumentResult;
    try {
      const embeddingCtx: EmbeddingActorContext = {
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        actorEmail: ctx.actorEmail,
      };
      embeddingResult = await this.embedding.embedDocument(
        documentId,
        embeddingCtx,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await this.auditFailure(documentId, 'embedding', reason, ctx);
      // Wrap as 500 — chunks exist + are valid, but embedding pass
      // failed. Caller can retry via POST /api/admin/kb/embed-document
      // without re-chunking (the WHERE embedding IS NULL filter will
      // pick them up).
      throw new InternalServerErrorException(
        `embedding failed after chunking succeeded: ${reason}. ` +
          `Retry via POST /api/admin/kb/embed-document.`,
      );
    }

    const totalDurationMs = Date.now() - startedAt;

    // Audit: orchestration completed. Closes the chain pair started
    // above. Includes counts so a forensic query can correlate
    // "started" + "completed" rows by document_id and verify
    // chunk_count + embedded_count match.
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'kb_document',
      entityId: documentId,
      action: 'kb_document_orchestration_completed',
      payload: {
        document_id: documentId,
        source_file_name: fileName,
        format: chunkingResult.format,
        chunk_count: chunkingResult.chunkCount,
        embedded_count: embeddingResult.embeddedCount,
        already_embedded: embeddingResult.alreadyEmbedded,
        total_chunks: embeddingResult.totalChunks,
        total_duration_ms: totalDurationMs,
        actor_email: ctx.actorEmail,
      },
    });

    return {
      documentId,
      chunking: chunkingResult,
      embedding: embeddingResult,
      totalDurationMs,
    };
  }

  /** Internal: write a failure-stage audit row. Best-effort — if the
   *  audit write itself fails, log but do NOT mask the original
   *  error (caller is about to re-throw the real cause). */
  private async auditFailure(
    documentId: string,
    stage: OrchestrationFailureStage,
    reason: string,
    ctx: ActorContext,
  ): Promise<void> {
    try {
      await this.audit.write({
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        entityType: 'kb_document',
        entityId: documentId,
        action: 'kb_document_orchestration_failed',
        payload: {
          document_id: documentId,
          stage,
          // Truncate long error messages to keep audit payload bounded.
          reason: reason.slice(0, 500),
          actor_email: ctx.actorEmail,
        },
      });
    } catch (auditErr) {
      this.logger.error(
        `audit write for orchestration_failed itself failed: ` +
          `${auditErr instanceof Error ? auditErr.message : String(auditErr)}. ` +
          `Original failure stage=${stage} reason=${reason.slice(0, 200)}`,
      );
    }
  }
}

// Type alias used by tests + controller — covers the `BadRequestException`
// re-export so the upstream chunking error type is visible at this layer.
export { BadRequestException };
