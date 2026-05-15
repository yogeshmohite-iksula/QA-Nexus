// QA Nexus PM1 — DefectsModule (M4 STUB — Day-19 P0 #2 wiring).
//
// Minimal module — registers DefectsController (501 stubs). Full defect-
// lifecycle implementation lands Day-20+ alongside A4 RCA service.

import { Module } from '@nestjs/common';
import { DefectsController } from './defects.controller';

@Module({
  controllers: [DefectsController],
})
export class DefectsModule {}
