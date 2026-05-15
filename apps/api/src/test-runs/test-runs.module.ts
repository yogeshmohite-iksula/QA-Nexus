// QA Nexus PM1 — TestRunsModule (M4 STUB — Day-19 P0 #2 wiring).
//
// Minimal module: registers TestRunsController (501 stubs) so the
// AppModule surface includes test-runs endpoints before PR #149 lands
// the full state-machine + audit + WS-emit implementation.
//
// PR #149 (HOLD) replaces this module + controller with the full impl.
// Route paths + module class name + file paths chosen to match #149's
// expectations so the cascade rebase resolution is "take #149's version".

import { Module } from '@nestjs/common';
import { TestRunsController } from './test-runs.controller';

@Module({
  controllers: [TestRunsController],
})
export class TestRunsModule {}
