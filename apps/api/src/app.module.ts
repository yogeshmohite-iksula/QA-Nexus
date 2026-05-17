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
import { ObservabilityModule } from './observability/observability.module';
import { UsersModule } from './users/users.module';
import { KbModule } from './kb/kb.module';
import { LlmConfigModule } from './admin/llm-config/llm-config.module';
import { ChunkingModule } from './chunking/chunking.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { RequirementsModule } from './requirements/requirements.module';
import { TestRunsModule } from './test-runs/test-runs.module';
import { DefectsModule } from './defects/defects.module';
import { JiraSyncModule } from './jira-sync/jira-sync.module';

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
    UsersModule, // M1 Day-6 PM Block 1 — F27 Admin tab endpoints
    KbModule, // M2 Day-8 Step 4 — chunk-search contract scaffold (stubbed)
    LlmConfigModule, // M1.5 Day-8 Step 3 — F26 Admin LLM-config tab endpoints
    ChunkingModule, // M2 Day-8 Step 5 — file → kb_chunks parser + persistence
    TestCasesModule, // M3 Day-12 TASK BE-02 — test cases CRUD skeleton (501 stubs)
    RequirementsModule, // M3 Day-12 TASK BE-03 — requirements CRUD skeleton (501 stubs)
    TestRunsModule, // M4 Day-18 P3 — TestRun state-machine + audit + WS emit (PR #149)
    DefectsModule, // M4 Day-19 P0 #2 → Day-20 P1 — POST :id/rca FUNCTIONAL (calls SherlockOrchestratorService); other endpoints stay 501 stubs
    JiraSyncModule, // M4 Day-19 P0 #2 — STUB (501); webhook + sync land Day-19/20
    ObservabilityModule, // /admin/otel/test-trace (Admin-gated)
    HealthModule, // last so it can depend on LLMGateway + R2Service for /health readouts
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
