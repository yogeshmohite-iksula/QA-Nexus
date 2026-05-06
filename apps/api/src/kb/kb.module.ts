// QA Nexus PM1 — KbModule.
// Spec: Day-8 Step 4 (M2 chunk-search contract scaffold) + Step 6
// (KB embedding service) + Step 7 (upload-completion orchestrator).
//
// Step 4: KbController returns hardcoded fixtures from kb.fixtures.ts
//         (search + chunk detail). M2 final swap will replace fixtures
//         with real pgvector HNSW search using KbEmbeddingService output.
// Step 6: KbEmbeddingController + KbEmbeddingService populate
//         kb_chunks.embedding via @xenova/transformers
//         (bge-small-en-v1.5, 384-dim). Admin-gated. Idempotent
//         (WHERE embedding IS NULL).
// Step 7: UploadOrchestratorController + UploadOrchestratorService wrap
//         Steps 5 + 6 into a single POST /api/admin/kb/finalize-upload
//         call. Inject ChunkingService (from ChunkingModule) +
//         KbEmbeddingService + R2Service + AuditService. Synchronous
//         response carries chunking + embedding results so the FE can
//         render terminal state without polling.
//
// Module imports:
//   - AuthModule: RolesGuard needs AuthService for session resolution.
//   - ChunkingModule: orchestrator needs ChunkingService (Step 7).
//   - StorageModule: orchestrator needs R2Service for the file fetch.
//   - EmbeddingModule is @Global so KbEmbeddingService can inject the
//     low-level EmbeddingService directly without a re-import here.
//   - PrismaModule + AuditModule are also @Global at AppModule level.
import { Module } from '@nestjs/common';
import { KbController } from './kb.controller';
import { KbEmbeddingController } from './embedding.controller';
import { KbEmbeddingService } from './embedding.service';
import { UploadOrchestratorController } from './upload-orchestrator.controller';
import { UploadOrchestratorService } from './upload-orchestrator.service';
import { KbSearchService } from './kb-search.service';
import { KbDocumentsController } from './kb-documents.controller';
import { KbDocumentsService } from './kb-documents.service';
import { AuthModule } from '../auth/auth.module';
import { ChunkingModule } from '../chunking/chunking.module';
import { StorageModule } from '../storage/r2.module';

// Day-11 TASK 2: KbSearchService — real pgvector flip for search/detail.
// Day-11 TASK 4: KbDocumentsController + KbDocumentsService —
//   list/detail/delete with cascade chunks + R2 file delete.

@Module({
  imports: [AuthModule, ChunkingModule, StorageModule],
  controllers: [
    KbController,
    KbEmbeddingController,
    UploadOrchestratorController,
    KbDocumentsController,
  ],
  providers: [
    KbEmbeddingService,
    UploadOrchestratorService,
    KbSearchService,
    KbDocumentsService,
  ],
  exports: [
    KbEmbeddingService,
    UploadOrchestratorService,
    KbSearchService,
    KbDocumentsService,
  ],
})
export class KbModule {}
