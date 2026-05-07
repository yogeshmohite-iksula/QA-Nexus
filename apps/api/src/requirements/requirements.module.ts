// QA Nexus PM1 — RequirementsModule.
// Spec: M3 TASK BE-03 (Day-12) skeleton. Real CRUD lands Day-14.

import { Module } from '@nestjs/common';
import {
  RequirementsProjectScopedController,
  RequirementsReqScopedController,
} from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    RequirementsProjectScopedController,
    RequirementsReqScopedController,
  ],
  providers: [RequirementsService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
