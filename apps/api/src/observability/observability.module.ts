// QA Nexus PM1 — Observability module wires up the OTel test endpoint.
//
// The actual OTel SDK init lives in `otel.config.ts` + `otel-logs.config.ts`
// and runs BEFORE Nest's bootstrap (in main.ts). This module exists only
// to register the Admin-gated `/admin/otel/test-trace` controller so it
// participates in the RBAC guard chain.
//
// Spec: T019 (manual verification path).

import { Module } from '@nestjs/common';
import { OtelTestController } from './otel-test.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OtelTestController],
})
export class ObservabilityModule {}
