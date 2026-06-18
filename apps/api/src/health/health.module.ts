// HealthModule — public /health endpoint for UptimeRobot (T015) +
// Render's own health-check probe.
//
// Spec: MS0-T025. PrismaService + EmbeddingService are auto-resolved
// from the @Global() PrismaModule + EmbeddingModule (registered in
// AppModule); no need to re-import here.
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthLiteController } from './health-lite.controller';
import { StorageModule } from '../storage/r2.module';

@Module({
  imports: [StorageModule], // exposes R2Service for the /health r2 readout
  // HealthLiteController has a zero-dependency constructor → DB-free by
  // construction; the canonical UptimeRobot keep-alive target (Day-32).
  controllers: [HealthController, HealthLiteController],
})
export class HealthModule {}
