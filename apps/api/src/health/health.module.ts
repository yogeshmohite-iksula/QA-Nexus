// HealthModule — public /health endpoint for UptimeRobot (T015) +
// Render's own health-check probe.
//
// Spec: MS0-T025. PrismaService + EmbeddingService are auto-resolved
// from the @Global() PrismaModule + EmbeddingModule (registered in
// AppModule); no need to re-import here.
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
