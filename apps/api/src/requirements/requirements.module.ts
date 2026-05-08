// QA Nexus PM1 — RequirementsModule.
// Spec: M3 Day-13 TASK 2 — real CRUD + RTM coverage view.
// Replaces the M3-BE-03 skeleton wiring from PR #77.
//
// Module imports:
//   - AuthModule: RolesGuard needs AuthService for session resolution.
//   - TestCasesModule: RequirementsCoverageController depends on
//     TestCasesService.coverageForRequirement(). TestCasesModule
//     exports TestCasesService.
//   - PrismaModule + AuditModule are @Global at AppModule level.

import { Module } from '@nestjs/common';
import {
  RequirementsProjectScopedController,
  RequirementsCoverageController,
} from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { AuthModule } from '../auth/auth.module';
import { TestCasesModule } from '../test-cases/test-cases.module';

@Module({
  imports: [AuthModule, TestCasesModule],
  controllers: [
    RequirementsProjectScopedController,
    RequirementsCoverageController,
  ],
  providers: [RequirementsService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
