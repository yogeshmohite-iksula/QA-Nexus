// QA Nexus PM1 — LlmConfigModule.
// Spec: Day-8 Step 3 (M1.5 Admin LLM-config endpoints).
import { Module } from '@nestjs/common';
import { LlmConfigController } from './llm-config.controller';
import { LlmConfigService } from './llm-config.service';
import { AuthModule } from '../../auth/auth.module';
// AuditModule is @Global (already in M0); no import needed.

@Module({
  imports: [AuthModule],
  controllers: [LlmConfigController],
  providers: [LlmConfigService],
  exports: [LlmConfigService],
})
export class LlmConfigModule {}
