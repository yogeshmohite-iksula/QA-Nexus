// QA Nexus PM1 — DefectsModule.
//
// Day-19 P0 #2 (#157): scaffold (501 stubs).
// Day-20 P1 (#173): wires SherlockOrchestratorModule so the controller's
//   POST :id/rca endpoint can call SherlockOrchestratorService.runRca().
// Day-21 P0 (this PR, followup `(da)`): adds PrismaModule + AuditModule
//   so the controller can resolve workspaceId from the defect + write
//   the `rca_kicked_off` audit row synchronously before returning 202.
// Day-21+: DefectsService CRUD + GET /rca endpoint promoted from stub.
// Day-32 (#262): AuthModule import — POST :id/rca is now @UseGuards(RolesGuard)
//   + @Roles, and the controller injects AuthService to resolve the actor for
//   the audit row + tenant check. AuthModule exports both AuthService +
//   RolesGuard; without this import Nest DI fails at boot (caught by the E2E
//   "API failed to boot" check, NOT by unit tests that useValue-provide them).
//   Plain import (not forwardRef) — DefectsModule is not part of the
//   AuthModule ↔ AuditModule cycle.

import { Module } from '@nestjs/common';
import { SherlockOrchestratorModule } from '../agents/sherlock-orchestrator/sherlock-orchestrator.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DefectsController } from './defects.controller';
import { DefectsService } from './defects.service';

@Module({
  imports: [SherlockOrchestratorModule, PrismaModule, AuditModule, AuthModule],
  controllers: [DefectsController],
  // Day-32 (W2-R): DefectsService backs GET list + GET :id (read API).
  providers: [DefectsService],
})
export class DefectsModule {}
