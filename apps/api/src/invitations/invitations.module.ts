// QA Nexus PM1 — InvitationsModule.
//
// **STATUS — M1 PREVIEW (un-routed).** This module is intentionally NOT
// imported into AppModule today. Per Day-5 brief: M1 prep on a feature
// branch, ready-to-PR Monday Day-8 once M0 acceptance gate closes Sunday
// evening. Wiring lands in the M1 final PR — that change is one line in
// `apps/api/src/app.module.ts`.
//
// FE chat reads:
//   - invitations.service.ts          → service signature + audit contract
//   - invitations.controller.ts       → endpoint shapes + RBAC matrix
//   - packages/shared/src/schemas/user.ts → Zod for request/response payloads
//   - __tests__/invitations.service.spec.ts → expected behaviour as living docs

import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
