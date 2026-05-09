// QA Nexus PM1 — TestCasesModule.
// Spec: M3 Day-13. Real CRUD shipped in PR #85; Composer scaffold
// added in TASK BE-1.
//
// Module imports:
//   - AuthModule: RolesGuard needs AuthService for session resolution.
//   - PrismaModule + AuditModule are @Global at AppModule level — no
//     re-import needed.

import { Module } from '@nestjs/common';
import {
  TestCasesProjectScopedController,
  TestCasesCaseScopedController,
} from './test-cases.controller';
import { TestCasesService } from './test-cases.service';
import { ComposerService } from './composer.service';
import { ComposerController } from './composer.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    TestCasesProjectScopedController,
    TestCasesCaseScopedController,
    ComposerController, // M3 Day-13 TASK BE-1 — Composer scaffold (Pattern A)
  ],
  providers: [TestCasesService, ComposerService],
  exports: [TestCasesService, ComposerService],
})
export class TestCasesModule {}
