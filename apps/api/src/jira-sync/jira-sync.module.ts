// QA Nexus PM1 — JiraSyncModule.
//
// Day-19 P0 #2 (PR #157): scaffold (501 stub controller).
// Day-19 P2 (this PR):    add JiraSyncService + AuditModule import to
//                          unlock the functional webhook receiver.
// Day-20+:                  Defects-side wire-in (DefectsService.createFromJira)
//                          + connect/sync controller endpoints become functional.

import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { JiraSyncController } from './jira-sync.controller';
import { JiraSyncService } from './jira-sync.service';

@Module({
  imports: [AuditModule],
  controllers: [JiraSyncController],
  providers: [JiraSyncService],
  exports: [JiraSyncService],
})
export class JiraSyncModule {}
