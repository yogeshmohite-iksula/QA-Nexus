// QA Nexus PM1 — Projects module.
//
// Spec: MS0-T038. Wires ProjectsController + ProjectsService.
// AuthModule provides AuthService (session re-resolution). AuditModule
// provides AuditService (chained audit_log writes). PrismaModule is global.

import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMembersController } from './project-members.controller';
import { ProjectMembersService } from './project-members.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProjectsController, ProjectMembersController],
  providers: [ProjectsService, ProjectMembersService],
  exports: [ProjectsService, ProjectMembersService],
})
export class ProjectsModule {}
