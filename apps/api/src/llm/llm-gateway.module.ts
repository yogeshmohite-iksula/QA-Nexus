// LLMGatewayModule — @Global so any future module (A1/A2/A4 agents,
// embedding-related enrichment, RAG pipelines) can inject LLMGatewayService
// without re-importing.
//
// Imports AuthModule because the controller below uses RolesGuard which
// depends on AuthService DI.
import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LLMController } from './llm.controller';
import { LLMGatewayService } from './llm-gateway.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [LLMController],
  providers: [LLMGatewayService],
  exports: [LLMGatewayService],
})
export class LLMGatewayModule {}
