// QA Nexus PM1 — ComposerController (A1 / Test Case Generator).
//
// Spec: M3 Day-13 TASK BE-1.
//
// Endpoint:
//   POST /api/projects/:projectId/requirements/:reqId/test-cases/generate
//   RBAC: Admin / Lead / QAEngineer (write — generates new proposals)
//
// Path-shape note: nested under `/requirements/:reqId/` because the
// generation is grounded in a specific requirement (per M3 v2 plan).
// Future "free-form prompt" mode without a requirement would be a
// different endpoint (`POST /api/projects/:projectId/test-cases/generate`).
//
// Stakeholder = read-only across the entire surface (matches the
// rest of M3's @Roles split).

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
  ComposerGenerateRequest,
  type ComposerGenerateResponse,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { ComposerService } from './composer.service';
import type { ActorContext } from './test-cases.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/projects/:projectId/requirements/:reqId/test-cases')
@UseGuards(RolesGuard)
export class ComposerController {
  constructor(
    private readonly composer: ComposerService,
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

  @Post('generate')
  @HttpCode(200) // 200 not 201 — no resource is created (just proposals)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async generate(
    @Param('projectId') projectId: string,
    @Param('reqId') reqId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<ComposerGenerateResponse> {
    const input = ComposerGenerateRequest.parse(body ?? {});
    const ctx = await this.actorOf(req);
    this.composer.assertWriteRole(ctx);
    return this.composer.generate(projectId, reqId, input, ctx);
  }
}
