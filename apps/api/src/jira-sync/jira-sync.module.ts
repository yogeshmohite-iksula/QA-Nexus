// QA Nexus PM1 — JiraSyncModule (M4 STUB — Day-19 P0 #2 wiring).
//
// Minimal module — registers JiraSyncController (501 stubs).
// Real Jira webhook receiver + sync logic lands Day-19/20 with the
// raw-body middleware + HMAC signature validation.

import { Module } from '@nestjs/common';
import { JiraSyncController } from './jira-sync.controller';

@Module({
  controllers: [JiraSyncController],
})
export class JiraSyncModule {}
