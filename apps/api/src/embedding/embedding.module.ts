// EmbeddingModule — global so any module that needs vectors (test_cases
// generation, kb_chunks ingest, future RAG) can inject EmbeddingService
// without re-importing.
//
// AuthModule is imported (not just AuthService) because the dev probe
// controller below uses RolesGuard which depends on AuthService DI.
import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmbeddingController } from './embedding.controller';
import { EmbeddingService } from './embedding.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [EmbeddingController],
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
