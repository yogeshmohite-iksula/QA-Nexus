// QA Nexus PM1 — KbDocumentsService.
//
// Spec: M2 TASK 4 (Day-11). Document CRUD: list / detail / delete.
//
// Architecture:
//   - List: paginated by createdAt DESC, project-scoped, workspace
//     check enforced via JOIN to Project.workspaceId (mirrors
//     KbSearchService isolation pattern from TASK 2).
//   - Detail: single doc + the K most-recent chunks (caller chooses
//     pagination via ?chunkLimit; default 50). Same workspace check.
//   - Delete: Admin/Lead only (RBAC at controller).
//     R2 file lookup → R2 delete → DB delete → audit. R2 FIRST so a
//     failed R2 delete doesn't orphan the DB row (Yogesh-spec'd
//     ordering: "don't orphan DB row if R2 delete fails").
//
// R2 key lookup: KbDocument doesn't have an r2_key column. The
// chunking flow writes the r2_key into the `kb_chunks_generated`
// audit-row payload (PR #34). We look up the LATEST such row for
// this doc and extract `r2_key`. If no row exists (doc was created
// without chunking — should be rare in PM1; only possible via a
// future direct-write path), skip R2 delete with a logged warning.
// This preserves the "best-effort R2" semantic without requiring
// a schema change to add `KbDocument.r2_key`.
//
// Cascade behavior: KbChunk has `onDelete: Cascade` on the
// `documentId` FK (per prisma/schema.prisma TB-018). Deleting the
// document row implicitly deletes its chunks — no manual chunk
// delete needed. Pinned by a test that asserts the FK behavior
// (counts kb_chunks before+after).
//
// Audit payload (PII-redacted per .claude/rules/security.md):
//   - doc_id, project_id, workspace_id, chunk_count_at_delete,
//     r2_delete_attempted, r2_delete_succeeded, actor_email,
//     title_length (NOT title — filenames can contain customer
//     PII like "Customer XYZ Refund Policy.pdf").

import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { R2Service } from '../storage/r2.service';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

export interface ListInput {
  projectId: string;
  /** 1-indexed; default 1. */
  page?: number;
  /** Default 20, hard-capped at 100. */
  pageSize?: number;
}

export interface KbDocumentListItem {
  id: string;
  projectId: string | null;
  title: string;
  templateKind: string;
  pinned: boolean;
  authorId: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KbDocumentDetail extends KbDocumentListItem {
  bodyMd: string;
  /** Most-recent K chunks (default K=50, capped at 100). For full
   *  pagination through chunks, FE uses the chunk-search/detail
   *  endpoints from TASK 2. */
  chunks: Array<{
    id: string;
    chunkIndex: number;
    chunkText: string;
    metadataJson: Record<string, unknown>;
  }>;
}

export interface DeleteResult {
  documentId: string;
  chunkCountAtDelete: number;
  r2DeleteAttempted: boolean;
  r2DeleteSucceeded: boolean;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_CHUNK_PREVIEW = 50;
const MAX_CHUNK_PREVIEW = 100;

@Injectable()
export class KbDocumentsService {
  private readonly logger = new Logger(KbDocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly r2: R2Service,
  ) {}

  /** Verify project exists + belongs to actor's workspace. Returns
   *  the project's workspaceId for downstream JOIN-style filters.
   *  Throws 404 on missing OR cross-workspace (no leak). */
  private async assertProjectWorkspace(
    projectId: string,
    ctx: ActorContext,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    if (!project || project.workspaceId !== ctx.workspaceId) {
      throw new NotFoundException(`project ${projectId} not found`);
    }
  }

  async list(
    input: ListInput,
    ctx: ActorContext,
  ): Promise<{
    documents: KbDocumentListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    await this.assertProjectWorkspace(input.projectId, ctx);

    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.max(
      1,
      Math.min(MAX_PAGE_SIZE, input.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.kbDocument.findMany({
        where: { projectId: input.projectId },
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
        select: {
          id: true,
          projectId: true,
          title: true,
          templateKind: true,
          pinned: true,
          authorId: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { chunks: true } },
        },
      }),
      this.prisma.kbDocument.count({ where: { projectId: input.projectId } }),
    ]);

    const documents: KbDocumentListItem[] = rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      title: r.title,
      templateKind: r.templateKind,
      pinned: r.pinned,
      authorId: r.authorId,
      chunkCount: r._count.chunks,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { documents, total, page, pageSize };
  }

  async detail(
    projectId: string,
    docId: string,
    chunkLimit: number | undefined,
    ctx: ActorContext,
  ): Promise<KbDocumentDetail> {
    await this.assertProjectWorkspace(projectId, ctx);

    const limit = Math.max(
      1,
      Math.min(MAX_CHUNK_PREVIEW, chunkLimit ?? DEFAULT_CHUNK_PREVIEW),
    );

    const doc = await this.prisma.kbDocument.findUnique({
      where: { id: docId },
      select: {
        id: true,
        projectId: true,
        title: true,
        bodyMd: true,
        templateKind: true,
        pinned: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            chunkText: true,
            metadataJson: true,
          },
          orderBy: { chunkIndex: 'asc' },
          take: limit,
        },
        _count: { select: { chunks: true } },
      },
    });
    if (!doc || doc.projectId !== projectId) {
      throw new NotFoundException(`document ${docId} not found`);
    }

    return {
      id: doc.id,
      projectId: doc.projectId,
      title: doc.title,
      bodyMd: doc.bodyMd,
      templateKind: doc.templateKind,
      pinned: doc.pinned,
      authorId: doc.authorId,
      chunkCount: doc._count.chunks,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      chunks: doc.chunks.map((c) => ({
        id: c.id,
        chunkIndex: c.chunkIndex,
        chunkText: c.chunkText,
        metadataJson: (c.metadataJson ?? {}) as Record<string, unknown>,
      })),
    };
  }

  async delete(
    projectId: string,
    docId: string,
    ctx: ActorContext,
  ): Promise<DeleteResult> {
    await this.assertProjectWorkspace(projectId, ctx);

    // 1. Verify doc exists in this project + count chunks for audit.
    const doc = await this.prisma.kbDocument.findUnique({
      where: { id: docId },
      select: {
        id: true,
        projectId: true,
        title: true,
        _count: { select: { chunks: true } },
      },
    });
    if (!doc || doc.projectId !== projectId) {
      throw new NotFoundException(`document ${docId} not found`);
    }
    const chunkCountAtDelete = doc._count.chunks;

    // 2. Look up the latest r2_key from the audit log. The chunking
    //    flow writes `r2_key` into the `kb_chunks_generated` payload.
    //    Best-effort: if no such audit row exists (doc never chunked),
    //    skip R2 delete with a logged warning.
    let r2Key: string | null = null;
    const lastChunkAudit = await this.prisma.auditLog.findFirst({
      where: {
        workspaceId: ctx.workspaceId,
        entityType: 'kb_document',
        entityId: docId,
        action: 'kb_chunks_generated',
      },
      orderBy: { createdAt: 'desc' },
      select: { payload: true },
    });
    if (lastChunkAudit) {
      const payload = (lastChunkAudit.payload ?? {}) as Record<string, unknown>;
      const candidate = payload.r2_key;
      if (typeof candidate === 'string' && candidate.length > 0) {
        r2Key = candidate;
      }
    }

    // 3. R2 FIRST. If R2 delete fails, throw 500 + DB row preserved
    //    (Yogesh-spec'd ordering: "don't orphan DB row if R2 fails").
    //    Subsequent delete retry will find the doc still present + retry
    //    R2 (no-op if previous R2 delete actually succeeded server-side).
    let r2DeleteAttempted = false;
    let r2DeleteSucceeded = false;
    if (r2Key) {
      r2DeleteAttempted = true;
      try {
        await this.r2.deleteObject(r2Key);
        r2DeleteSucceeded = true;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `R2 delete failed for docId=${docId} r2Key=${r2Key}: ${reason}. ` +
            `DB row preserved; retry the DELETE call to re-attempt.`,
        );
        // Audit the R2 failure for forensics + throw 500.
        await this.auditDeleteFailure(
          docId,
          projectId,
          ctx,
          'r2',
          reason,
          chunkCountAtDelete,
        );
        throw new InternalServerErrorException(
          `R2 file delete failed: ${reason}. Retry the DELETE call.`,
        );
      }
    } else {
      this.logger.log(
        `Skipping R2 delete for docId=${docId} (no kb_chunks_generated ` +
          `audit row found — doc may never have been chunked).`,
      );
    }

    // 4. DB delete. KbChunk has onDelete: Cascade on documentId FK
    //    so chunks are dropped automatically.
    await this.prisma.kbDocument.delete({ where: { id: docId } });

    // 5. Audit (PII-redacted: doc_id + counts + flags + actor_email,
    //    NEVER the title — filenames can contain customer PII).
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'kb_document',
      entityId: docId,
      action: 'kb_document_deleted',
      payload: {
        doc_id: docId,
        project_id: projectId,
        workspace_id: ctx.workspaceId,
        chunk_count_at_delete: chunkCountAtDelete,
        title_length: doc.title.length,
        r2_delete_attempted: r2DeleteAttempted,
        r2_delete_succeeded: r2DeleteSucceeded,
        actor_email: ctx.actorEmail,
      },
    });

    return {
      documentId: docId,
      chunkCountAtDelete,
      r2DeleteAttempted,
      r2DeleteSucceeded,
    };
  }

  /** Internal: write an `kb_document_delete_failed` audit row. Best-
   *  effort — failure to audit does NOT mask the original error. */
  private async auditDeleteFailure(
    docId: string,
    projectId: string,
    ctx: ActorContext,
    stage: 'r2' | 'db',
    reason: string,
    chunkCount: number,
  ): Promise<void> {
    try {
      await this.audit.write({
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        entityType: 'kb_document',
        entityId: docId,
        action: 'kb_document_delete_failed',
        payload: {
          doc_id: docId,
          project_id: projectId,
          stage,
          reason: reason.slice(0, 500),
          chunk_count: chunkCount,
          actor_email: ctx.actorEmail,
        },
      });
    } catch (auditErr) {
      this.logger.error(
        `audit write for kb_document_delete_failed itself failed: ` +
          `${auditErr instanceof Error ? auditErr.message : String(auditErr)}. ` +
          `Original failure stage=${stage} reason=${reason.slice(0, 200)}`,
      );
    }
  }
}
