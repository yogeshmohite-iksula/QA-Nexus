// QA Nexus PM1 — SherlockOrchestratorModule (Day-20 P1, ADR-019).
//
// Wires the orchestrator + 4 agent services. LLMGatewayModule is @Global
// so each agent service injects it directly without explicit re-import.
//
// AppModule import lands separately (apps/api/src/app.module.ts).
//
// Day-20 SCOPE: synchronous in-memory orchestration only.
// Day-21+ SCOPE: AuditModule + RealtimeModule re-added when the 5-layer
// schema adaptation + async 202+WS pattern lands.

import { Module } from '@nestjs/common';
import { SherlockOrchestratorService } from './sherlock-orchestrator.service';
import { SherlockCodeService } from '../sherlock-code/sherlock-code.service';
import { SherlockDataService } from '../sherlock-data/sherlock-data.service';
import { SherlockEnvService } from '../sherlock-env/sherlock-env.service';
import { SherlockFlakeService } from '../sherlock-flake/sherlock-flake.service';

@Module({
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
