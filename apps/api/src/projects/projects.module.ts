// QA Nexus PM1 — Projects module.
//
// Spec: MS0-T038. Wires ProjectsController + ProjectsService.
// AuthModule provides AuthService (session re-resolution). AuditModule
// provides AuditService (chained audit_log writes). PrismaModule is global.

import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
