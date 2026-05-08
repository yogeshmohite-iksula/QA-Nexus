// QA Nexus PM1 — CuratorController (A2 / Duplicate Detection).
//
// Spec: M3 Day-13 TASK BE-3 (stretch).
//
// Endpoint:
//   POST /api/projects/:projectId/test-cases/:tcId/duplicates
//   RBAC: Admin / Lead / QAEngineer / Stakeholder (read-equivalent —
//         dedupe checks don't modify state, just consult the index)
//
// Path-shape note: nested under `/test-cases/:tcId/duplicates` because
// the check is grounded in a specific test case. Dedupe on a proposed
// (not-yet-saved) Composer case will be a different Day-16 endpoint
// (POST /api/projects/:projectId/test-cases/check-duplicates with
// raw title + body) — F14m2's pre-save banner uses that variant.

import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  Role,
  CuratorCheckRequest,
  type CuratorCheckResponse,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { CuratorService } from './curator.service';
import type { ActorContext } from './test-cases.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/projects/:projectId/test-cases/:tcId')
@UseGuards(RolesGuard)
export class CuratorController {
  constructor(
    private readonly curator: CuratorService,
    private readonly authService: AuthService,
  ) {}

  private async actorOf(req: Request): Promise<ActorContext> {
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException(
        'session disappeared between guard and handler',
      );
    }
    return {
      workspaceId: session.appUser.workspaceId,
      actorId: session.appUser.id,
      actorEmail: session.appUser.email,
      role: session.appUser.role as ActorContext['role'],
    };
  }

  @Post('duplicates')
  @HttpCode(200)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async check(
    @Param('projectId') projectId: string,
    @Param('tcId') tcId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<CuratorCheckResponse> {
    const input = CuratorCheckRequest.parse(body ?? {});
    const ctx = await this.actorOf(req);
    return this.curator.check(projectId, tcId, input, ctx);
  }
}
