// QA Nexus PM1 — DefectsModule.
//
// Day-19 P0 #2 (#157): scaffold (501 stubs).
// Day-20 P1 (this PR): wires SherlockOrchestratorModule so the controller's
//   POST :id/rca endpoint can call SherlockOrchestratorService.runRca().
// Day-21+: DefectsService CRUD + full RcaReport persistence path.

import { Module } from '@nestjs/common';
import { SherlockOrchestratorModule } from '../agents/sherlock-orchestrator/sherlock-orchestrator.module';
import { DefectsController } from './defects.controller';

@Module({
  imports: [SherlockOrchestratorModule],
  controllers: [DefectsController],
})
export class DefectsModule {}
