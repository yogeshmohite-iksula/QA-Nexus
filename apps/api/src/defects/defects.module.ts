// QA Nexus PM1 — DefectsModule.
//
// Day-19 P0 #2 (#157): scaffold (501 stubs).
// Day-20 P1 (#173): wires SherlockOrchestratorModule so the controller's
//   POST :id/rca endpoint can call SherlockOrchestratorService.runRca().
// Day-21 P0 (this PR, followup `(da)`): adds PrismaModule + AuditModule
//   so the controller can resolve workspaceId from the defect + write
//   the `rca_kicked_off` audit row synchronously before returning 202.
// Day-21+: DefectsService CRUD + GET /rca endpoint promoted from stub.

import { Module } from '@nestjs/common';
import { SherlockOrchestratorModule } from '../agents/sherlock-orchestrator/sherlock-orchestrator.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { DefectsController } from './defects.controller';

@Module({
  imports: [SherlockOrchestratorModule, PrismaModule, AuditModule],
  controllers: [DefectsController],
})
export class DefectsModule {}
