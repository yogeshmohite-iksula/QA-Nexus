// QA Nexus PM1 — NfrModule (Day-3 Task 5). Admin NFR-003 latency probe.
//
// `imports: [AuthModule]` lets RolesGuard resolve AuthService (Reflector +
// AuditService are global). Spec: runbook §3 Option C.

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NfrController } from './nfr.controller';
import { NfrProbeService } from './nfr-probe.service';

@Module({
  imports: [AuthModule],
  controllers: [NfrController],
  providers: [NfrProbeService],
})
export class NfrModule {}
