// QA Nexus PM1 — Sherlock RCA agent.code module.
//
// Spec: ADR-019 + Day-19 P1 design at `.claude/scratch/sherlock-agent-1-design.md`.
//
// LLMGatewayModule is @Global (per llm-gateway.module.ts) so we don't
// re-import it. NO controller this PR — Day-20 SherlockOrchestratorService
// is the caller; DefectsController.rca (currently 501 stub from #157) wires
// to the orchestrator on Day-20.
//
// NOT yet wired into AppModule — that flip lands Day-20 alongside the
// orchestrator + 3 sibling agents (cleaner single-PR AppModule surface).

import { Module } from '@nestjs/common';
import { SherlockCodeService } from './sherlock-code.service';

@Module({
  providers: [SherlockCodeService],
  exports: [SherlockCodeService],
})
export class SherlockCodeModule {}
