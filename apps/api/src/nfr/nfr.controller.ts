// QA Nexus PM1 — Admin NFR-003 latency probe endpoints (Day-3 Task 5).
//
//   POST /admin/nfr/a1  — Composer (A1) generate() latency · p95 gate 10s
//   POST /admin/nfr/a2  — Curator  (A2) check()    latency · p95 gate 500ms
//
// Admin-only (@Roles(Role.Admin) + RolesGuard) AND behind the NFR_PROBE_ENABLED
// flag (404 when off — never exposed in normal prod). The probe targets the
// TEST branch only (NfrProbeService.assertTestBranch). Spec: runbook §3 Option
// C (docs/runbooks/render-side-nfr-measurement.md).
//
// Body (NfrProbeRequest): { limit?: number, sleepMs?: number }.

import {
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NfrProbeRequest, Role, type NfrProbeResponse } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { NfrProbeService } from './nfr-probe.service';

@Controller('admin/nfr')
@UseGuards(RolesGuard)
export class NfrController {
  constructor(private readonly probe: NfrProbeService) {}

  @Post('a1')
  @Roles(Role.Admin)
  async a1(@Body() body: unknown): Promise<NfrProbeResponse> {
    this.assertEnabled();
    const { limit, sleepMs } = NfrProbeRequest.parse(body ?? {});
    return this.probe.runA1(limit ?? 5, sleepMs ?? 6000);
  }

  @Post('a2')
  @Roles(Role.Admin)
  async a2(@Body() body: unknown): Promise<NfrProbeResponse> {
    this.assertEnabled();
    const { limit } = NfrProbeRequest.parse(body ?? {});
    return this.probe.runA2(limit ?? 10);
  }

  /** 404 (hide existence) unless explicitly enabled for a measurement window. */
  private assertEnabled(): void {
    if (process.env.NFR_PROBE_ENABLED !== 'true') {
      throw new NotFoundException();
    }
  }
}
