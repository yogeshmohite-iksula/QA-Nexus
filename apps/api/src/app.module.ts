import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { LLMGatewayModule } from './llm/llm-gateway.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthModule } from './health/health.module';
import { StorageModule } from './storage/r2.module';
import { A1ScribeModule } from './agents/a1-scribe/a1-scribe.module';
import { ProjectsModule } from './projects/projects.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuditModule,
    AuthModule,
    EmbeddingModule,
    LLMGatewayModule,
    RealtimeModule,
    StorageModule,
    A1ScribeModule,
    ProjectsModule,
    InvitationsModule, // M1 wired Day-6 — endpoints active per InvitationsController
    HealthModule, // last so it can depend on LLMGateway + R2Service for /health readouts
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
