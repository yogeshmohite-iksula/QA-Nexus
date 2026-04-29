import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { HealthModule } from './health/health.module';
import { StorageModule } from './storage/r2.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuditModule,
    AuthModule,
    EmbeddingModule,
    StorageModule,
    HealthModule, // last so it can depend on R2Service for /health r2 readout
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
