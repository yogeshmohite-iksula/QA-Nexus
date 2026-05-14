// QA Nexus PM1 — TestRunsModule (M4 P3 / Day-18 #149).
//
// Wires:
//   - TestRunsController (PATCH /api/test-runs/:id/{start,result,abort})
//   - TestRunsService (state-machine + audit + WS emit)
//
// Imports:
//   - PrismaModule:    state-machine updates against test_runs
//   - AuditModule:     HMAC-chained audit_log writes (Hard Rule 7)
//   - AuthModule:      RolesGuard + AuthService.resolveSession in
//                      controller's requireActor() helper
//   - RealtimeModule:  RealtimeGateway.emitTestRunProgress() — emits
//                      test_run.progress event on every transition

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TestRunsController } from './test-runs.controller';
import { TestRunsService } from './test-runs.service';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RealtimeModule],
  controllers: [TestRunsController],
  providers: [TestRunsService],
  exports: [TestRunsService],
})
export class TestRunsModule {}
