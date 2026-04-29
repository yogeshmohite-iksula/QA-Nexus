// RealtimeModule — wires the WS gateway into Nest's lifecycle. Imports
// AuthModule because the gateway uses AuthService at handshake to resolve
// the BetterAuth session.
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
