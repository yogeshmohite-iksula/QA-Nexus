// QA Nexus PM1 — Day-24 P0 ADR-021 ReportsController.
//
// Endpoints (per ADR-021 §1):
//   POST   /api/reports                              run report (cache-first SWR)
//   POST   /api/reports/templates                    create saved template
//   GET    /api/projects/:projectId/reports/templates  list visible templates
//
// All routes RBAC-guarded per api.md (every endpoint must have @Roles).
// Workspace scoping via AuthService.resolveSession() like UsersController.

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role, m5 } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { ReportsService } from './reports.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api')
@UseGuards(RolesGuard)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly authService: AuthService,
  ) {}

  private async actor(req: Request): Promise<{
    workspaceId: string;
    actorId: string;
  }> {
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException(
        'session disappeared between guard and handler',
      );
    }
    return {
      workspaceId: session.appUser.workspaceId,
      actorId: session.appUser.id,
    };
  }

  /// POST /api/reports — run a report. Stakeholder can view (read-only
  /// pattern of analytics endpoints), QAEngineer/Lead/Admin can run.
  @Post('reports')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async runReport(@Body() body: unknown, @Req() req: Request) {
    const parsed = m5.ReportRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        {
          error: 'InvalidReportRequest',
          message: parsed.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; '),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const ctx = await this.actor(req);
    const envelope = await this.reports.run(
      ctx.workspaceId,
      parsed.data,
      ctx.actorId,
    );
    return { ok: true as const, report: envelope };
  }

  /// POST /api/reports/templates — save a report config.
  /// Stakeholder cannot save (read-only); Admin/Lead/QAEngineer can.
  @Post('reports/templates')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async createTemplate(@Body() body: unknown, @Req() req: Request) {
    const parsed = m5.ReportTemplateCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        {
          error: 'InvalidReportTemplate',
          message: parsed.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; '),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const ctx = await this.actor(req);
    const template = await this.reports.createTemplate(
      ctx.workspaceId,
      ctx.actorId,
      parsed.data,
    );
    return { ok: true as const, template };
  }

  /// GET /api/projects/:projectId/reports/templates — list visible templates.
  /// All roles can list (Stakeholder needs read for F23 Reports Studio).
  @Get('projects/:projectId/reports/templates')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async listTemplates(
    @Param('projectId') projectId: string,
    @Req() req: Request,
  ) {
    const ctx = await this.actor(req);
    const templates = await this.reports.listTemplates(
      ctx.workspaceId,
      projectId,
      ctx.actorId,
    );
    return { ok: true as const, templates };
  }
}
