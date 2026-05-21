// QA Nexus PM1 — Day-24 P0 ADR-021 ReportsModule.
//
// Wires the ReportsController + ReportsService + ReportsRefreshCron with
// their dependencies. ScheduleModule registration is in AppModule
// (single forRoot() — NestJS pattern).

import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRefreshCron } from './reports-refresh.cron';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRefreshCron],
  // Exported so other modules (defects, runs) can call invalidate() on
  // state transitions to flip is_stale=true for related aggregates.
  exports: [ReportsService],
})
export class ReportsModule {}
