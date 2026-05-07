// QA Nexus PM1 — TestCasesModule.
// Spec: M3 TASK BE-02 (Day-12) skeleton. Real CRUD lands Day-13.
//
// Module imports:
//   - AuthModule: RolesGuard needs AuthService for session resolution.
//   - PrismaModule + AuditModule are @Global at AppModule level — no
//     re-import needed. Day-13's real service implementation will
//     consume both.

import { Module } from '@nestjs/common';
import {
  TestCasesProjectScopedController,
  TestCasesCaseScopedController,
} from './test-cases.controller';
import { TestCasesService } from './test-cases.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    TestCasesProjectScopedController,
    TestCasesCaseScopedController,
  ],
  providers: [TestCasesService],
  exports: [TestCasesService],
})
export class TestCasesModule {}
