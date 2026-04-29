// QA Nexus PM1 — Projects controller.
//
// Spec: PM1_ERD §3 (TB-003 + TB-004 + TB-021) + MS0-T038.
//
// Endpoints (all under base path /api/projects):
//   POST   /              create project           Admin / Lead
//   GET    /              list workspace projects  any authenticated user
//   GET    /:slug         read by key              any authenticated user
//   POST   /:slug/sources/jira/oauth/start    stub Admin / Lead
//   GET    /:slug/sources/jira/oauth/callback stub Admin / Lead
//
// "slug" in routes maps to project.key — Iksula canon (RET, CART, PAY,
// AUTH, OPS) uses these as the public identifier.
//
// RBAC summary (per PM1_PRD §3.4 + PM1_ERD §3.4):
//   - Stakeholders + QAEngineers can READ but NOT mutate projects.
//   - Lead + Admin own create/update/delete + Jira OAuth setup.

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { Role, CreateProjectInput } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { ProjectsService, type ActorContext } from './projects.service';

/** Validates the :slug URL param (matches the project.key regex). */
const SlugParam = z
  .string()
  .min(2)
  .max(20)
  .regex(/^[A-Z0-9_]+$/, 'slug must be UPPER_SNAKE (matches project.key)');

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/projects')
@UseGuards(RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly authService: AuthService,
  ) {}

  /** Re-resolve session → ActorContext. Until @CurrentUser() lands. */
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

  @Post()
  @Roles(Role.Admin, Role.Lead)
  async create(@Body() body: unknown, @Req() req: Request) {
    const input = CreateProjectInput.parse(body);
    const ctx = await this.actorOf(req);
    const project = await this.projects.create(input, ctx);
    return { ok: true, project };
  }

  @Get()
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(@Req() req: Request) {
    const ctx = await this.actorOf(req);
    const projects = await this.projects.list(ctx);
    return { ok: true, projects };
  }

  @Get(':slug')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async getBySlug(@Param('slug') rawSlug: string, @Req() req: Request) {
    const slug = SlugParam.parse(rawSlug);
    const ctx = await this.actorOf(req);
    const project = await this.projects.getBySlug(slug, ctx);
    return { ok: true, project };
  }

  @Post(':slug/sources/jira/oauth/start')
  @Roles(Role.Admin, Role.Lead)
  async jiraOAuthStart(@Param('slug') rawSlug: string, @Req() req: Request) {
    const slug = SlugParam.parse(rawSlug);
    const ctx = await this.actorOf(req);
    return this.projects.jiraOAuthStart(slug, ctx);
  }

  @Get(':slug/sources/jira/oauth/callback')
  @Roles(Role.Admin, Role.Lead)
  async jiraOAuthCallback(
    @Param('slug') rawSlug: string,
    @Query() query: Record<string, string | undefined>,
    @Req() req: Request,
  ) {
    const slug = SlugParam.parse(rawSlug);
    const ctx = await this.actorOf(req);
    return this.projects.jiraOAuthCallback(slug, query, ctx);
  }
}
