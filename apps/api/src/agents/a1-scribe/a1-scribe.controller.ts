// QA Nexus PM1 — A1 Scribe controller.
//
// Spec: PM1_PRD §3 + MS0-T036.
//
// Endpoints:
//   POST /agents/a1/generate    — Admin / Lead / QAEngineer
//
// RBAC: per PM1_PRD §3.2 ("Stakeholders cannot generate test cases — they
// only review approvals"), Stakeholder is excluded from the @Roles list.
//
// The controller's only job: validate the body, resolve the session into
// an audit-ready RunContext, hand off to the service. Zero LLM-specific
// logic here — the service owns that.

import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@qa-nexus/shared';
import { Roles } from '../../auth/rbac/roles.decorator';
import { RolesGuard } from '../../auth/rbac/roles.guard';
import { AuthService } from '../../auth/auth.service';
import { A1ScribeService } from './a1-scribe.service';
import {
  GenerateTestCasesRequest,
  type GenerateTestCasesResponse,
} from './schemas';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('agents/a1')
@UseGuards(RolesGuard)
export class A1ScribeController {
  constructor(
    private readonly scribe: A1ScribeService,
    // We re-resolve the session here (rather than reading it off the request)
    // because RolesGuard doesn't currently attach it. When a `@CurrentUser()`
    // param decorator lands (M1), this re-resolution becomes a one-liner.
    private readonly authService: AuthService,
  ) {}

  @Post('generate')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async generate(
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<GenerateTestCasesResponse> {
    // 1. Zod-validate the request body.
    const input = GenerateTestCasesRequest.parse(body);

    // 2. Resolve the session for audit context (workspace + actor IDs).
    //    RolesGuard already proved the session exists + has a permitted role,
    //    so a null result here is a pure surprise — surface as 401.
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException(
        'session disappeared between guard and handler',
      );
    }

    return this.scribe.generate(input, {
      workspaceId: session.appUser.workspaceId,
      actorId: session.appUser.id,
      actorEmail: session.appUser.email,
    });
  }
}
