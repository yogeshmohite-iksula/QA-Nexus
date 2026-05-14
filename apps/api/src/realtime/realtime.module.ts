// RealtimeModule — wires the WS gateway into Nest's lifecycle.
//   - AuthModule: gateway uses AuthService at handshake to resolve
//     BetterAuth sessions.
//   - PrismaModule: gateway uses PrismaService to authorize channel
//     subscribes (test_run.progress.<runId> requires project-member
//     access; M4 TASK 2). Per-subscribe DB lookup; one round-trip per
//     subscribe call (negligible at pilot scale).
//   - Exports RealtimeGateway so TestRunService / A4 RCA / AgentRun
//     handlers can inject + call emit*().
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
