// QA Nexus PM1 — KbModule.
// Spec: Day-8 Step 4 (M2 chunk-search contract scaffold).
//
// Currently STUB — controller returns hardcoded fixtures from
// kb.fixtures.ts. M2 will inject EmbeddingService + PrismaService for
// real pgvector HNSW search; module imports added then.
import { Module } from '@nestjs/common';
import { KbController } from './kb.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // RolesGuard needs AuthService for session resolution
  controllers: [KbController],
})
export class KbModule {}
