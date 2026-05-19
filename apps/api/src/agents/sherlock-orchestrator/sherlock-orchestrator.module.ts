// QA Nexus PM1 — SherlockOrchestratorModule (Day-20 P1, ADR-019).
//
// Wires the orchestrator + 4 agent services. LLMGatewayModule is @Global
// so each agent service injects it directly without explicit re-import.
//
// AppModule import lands separately (apps/api/src/app.module.ts).
//
// Day-20 SCOPE: synchronous in-memory orchestration only.
// Day-21 (da) SCOPE: adds PrismaModule + AuditModule + RealtimeModule
//   so `runAndPersist()` can write AgentRun + RcaReport, append the
//   `rca_completed` audit row, and emit the `rca.complete.<runId>` WS
//   event. PrismaService is needed for the two DB writes (AgentRun
//   create/update + RcaReport create).

import { Module } from '@nestjs/common';
import { SherlockOrchestratorService } from './sherlock-orchestrator.service';
import { SherlockCodeService } from '../sherlock-code/sherlock-code.service';
import { SherlockDataService } from '../sherlock-data/sherlock-data.service';
import { SherlockEnvService } from '../sherlock-env/sherlock-env.service';
import { SherlockFlakeService } from '../sherlock-flake/sherlock-flake.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';
import { RealtimeModule } from '../../realtime/realtime.module';

@Module({
  imports: [PrismaModule, AuditModule, RealtimeModule],
  providers: [
    SherlockOrchestratorService,
    SherlockCodeService,
    SherlockDataService,
    SherlockEnvService,
    SherlockFlakeService,
  ],
  exports: [SherlockOrchestratorService],
})
export class SherlockOrchestratorModule {}
