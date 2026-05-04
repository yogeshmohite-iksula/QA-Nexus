// QA Nexus PM1 — ChunkingModule.
// Spec: Day-8 Step 5 (M2 chunking service).
import { Module } from '@nestjs/common';
import { ChunkingController } from './chunking.controller';
import { ChunkingService } from './chunking.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/r2.module';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [ChunkingController],
  providers: [ChunkingService],
  exports: [ChunkingService], // Step 7's upload hook will inject this directly
})
export class ChunkingModule {}
