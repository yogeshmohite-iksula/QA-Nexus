// QA Nexus PM1 — KbModule.
// Spec: Day-8 Step 4 (M2 chunk-search contract scaffold) + Step 6
// (KB embedding service).
//
// Step 4: KbController returns hardcoded fixtures from kb.fixtures.ts
//         (search + chunk detail). M2 final swap will replace fixtures
//         with real pgvector HNSW search using KbEmbeddingService output.
// Step 6: KbEmbeddingController + KbEmbeddingService populate
//         kb_chunks.embedding via @xenova/transformers
//         (bge-small-en-v1.5, 384-dim). Admin-gated. Idempotent
//         (WHERE embedding IS NULL).
//
// Module imports:
//   - AuthModule: RolesGuard needs AuthService for session resolution.
//   - EmbeddingModule is @Global so KbEmbeddingService can inject the
//     low-level EmbeddingService directly without a re-import here.
//   - PrismaModule + AuditModule are also @Global at AppModule level.
import { Module } from '@nestjs/common';
import { KbController } from './kb.controller';
import { KbEmbeddingController } from './embedding.controller';
import { KbEmbeddingService } from './embedding.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KbController, KbEmbeddingController],
  providers: [KbEmbeddingService],
  exports: [KbEmbeddingService],
})
export class KbModule {}
