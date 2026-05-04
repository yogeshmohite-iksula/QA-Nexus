// QA Nexus PM1 — Admin LLM provider config controller.
//
// Endpoints (under /api/admin/config/llm-providers):
//   GET    /  — Admin only. Returns workspace's providers + routing.
//   PUT    /  — Admin only. Replaces routing wholesale. Audits.
//
// Spec: Day-8 Step 3 (M1.5; F26 Admin tab consumer).

import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role, PutLlmProviderConfigRequest } from '@qa-nexus/shared';
import { Roles } from '../../auth/rbac/roles.decorator';
import { RolesGuard } from '../../auth/rbac/roles.guard';
import { AuthService } from '../../auth/auth.service';
import { LlmConfigService, type ActorContext } from './llm-config.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/admin/config/llm-providers')
@UseGuards(RolesGuard)
export class LlmConfigController {
  constructor(
    private readonly svc: LlmConfigService,
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
    };
  }

  @Get()
  @Roles(Role.Admin)
  async get(@Req() req: Request) {
    const ctx = await this.actorOf(req);
    const data = await this.svc.get(ctx);
    return {
      ok: true as const,
      providers: data.providers,
      assignments: data.assignments,
    };
  }

  @Put()
  @Roles(Role.Admin)
  async put(@Body() body: unknown, @Req() req: Request) {
    const input = PutLlmProviderConfigRequest.parse(body);
    const ctx = await this.actorOf(req);
    await this.svc.update(input, ctx);
    // Return the freshly-updated state so F26 doesn't need a follow-up GET.
    const refreshed = await this.svc.get(ctx);
    return {
      ok: true as const,
      providers: refreshed.providers,
      assignments: refreshed.assignments,
    };
  }
}
