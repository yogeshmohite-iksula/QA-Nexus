// QA Nexus PM1 — A1 Scribe module.
//
// Spec: MS0-T036.
//
// Wires the controller + service. LLMGatewayModule is @Global (per T023.a)
// so we don't need to re-import it here. AuthModule + AuditModule provide
// the AuthService (for session resolution) + AuditService (for the chained
// audit_log write inside the service).

import { Module } from '@nestjs/common';
import { A1ScribeController } from './a1-scribe.controller';
import { A1ScribeService } from './a1-scribe.service';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [A1ScribeController],
  providers: [A1ScribeService],
  exports: [A1ScribeService],
})
export class A1ScribeModule {}
