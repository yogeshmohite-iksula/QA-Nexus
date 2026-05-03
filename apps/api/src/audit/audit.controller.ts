// QA Nexus PM1 — AuditController.
//
// Spec: PM1_ERD §3.13 + Day-6 PM brief Block 3.
//
// Endpoints (under /api/audit):
//   GET    /api/audit                  list    Admin / Lead
//   GET    /api/audit/verify-chain     verify  Admin only
//
// Stakeholder is EXCLUDED from both — audit log is privileged ops data.
// QA Engineers also excluded — they see their own actions reflected in
// F19 Run Console / F22 Defect detail; raw audit log is for incident
// response.

import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role, ListAuditQuery } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { AuditService } from './audit.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/audit')
@UseGuards(RolesGuard)
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly authService: AuthService,
  ) {}

  private async actorWorkspace(req: Request): Promise<string> {
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException(
        'session disappeared between guard and handler',
      );
    }
    return session.appUser.workspaceId;
  }

  @Get()
  @Roles(Role.Admin, Role.Lead)
  async list(@Query() query: unknown, @Req() req: Request) {
    const filters = ListAuditQuery.parse(query ?? {});
    const workspaceId = await this.actorWorkspace(req);
    const { items, nextCursor } = await this.audit.query(workspaceId, filters);
    return { ok: true as const, items, nextCursor };
  }

  /**
   * Walk the workspace's audit_log + recompute the HMAC chain.
   * Admin-only — chain integrity check is sensitive (a `valid: false`
   * result indicates tampering OR a BETTER_AUTH_SECRET rotation).
   * Caps at 10 000 rows for free-tier safety; truncated=true if more
   * exist (M2 will add cursor-based chunked verify for larger workspaces).
   */
  @Get('verify-chain')
  @Roles(Role.Admin)
  async verifyChain(@Req() req: Request) {
    const workspaceId = await this.actorWorkspace(req);
    const result = await this.audit.verifyChain(workspaceId);
    return { ok: true as const, ...result };
  }
}
