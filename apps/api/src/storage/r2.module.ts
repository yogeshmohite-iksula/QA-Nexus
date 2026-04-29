// QA Nexus PM1 — Storage module (R2).
//
// Spec: ADR-005 + MS0-T013.
// Imports/exports the R2Service + StorageController. Wired into AppModule
// alongside the other M0 modules (Auth, Embedding, Audit, Health).
//
// Pattern A note: this module does NOT depend on AuthModule directly —
// the @Roles decorator + RolesGuard from AuthModule attach via @UseGuards
// at the controller level. NestJS resolves cross-module guards via the
// global injector, so no explicit re-import needed.

import { Module } from '@nestjs/common';
import { R2Service } from './r2.service';
import { StorageController } from './storage.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuthModule, // brings in RolesGuard + Reflector for @Roles() resolution
    AuditModule, // brings in AuditService for state-change logging on uploads
  ],
  providers: [R2Service],
  controllers: [StorageController],
  exports: [R2Service], // exposed so HealthController can call .health()
})
export class StorageModule {}
