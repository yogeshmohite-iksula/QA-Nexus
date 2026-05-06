// QA Nexus PM1 — KbDocumentsController.
//
// Spec: M2 TASK 4 (Day-11). Document CRUD endpoints under
//   /api/projects/:projectId/kb/documents
//
// Endpoints:
//   GET    /api/projects/:projectId/kb/documents
//          (Admin/Lead/QAEng/Stake — paginated list)
//   GET    /api/projects/:projectId/kb/documents/:docId
//          (Admin/Lead/QAEng/Stake — detail with chunks)
//   DELETE /api/projects/:projectId/kb/documents/:docId
//          (Admin/Lead only — cascade chunks + R2 file)
//
// Workspace isolation: KbDocumentsService asserts project-workspace
// match on every call. Cross-workspace → 404 (no leak, no 403 — both
// leak existence per the established M2 isolation pattern).

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  Role,
  KbDocumentListQuery,
  KbDocumentDetailQuery,
  type KbDocumentListResponse,
  type KbDocumentDetailResponse,
  type KbDocumentDeleteResponse,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { KbDocumentsService, type ActorContext } from './kb-documents.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/projects/:projectId/kb/documents')
@UseGuards(RolesGuard)
export class KbDocumentsController {
  constructor(
    private readonly docs: KbDocumentsService,
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
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(
    @Param('projectId') projectId: string,
    @Query() query: unknown,
    @Req() req: Request,
  ): Promise<KbDocumentListResponse> {
    const q = KbDocumentListQuery.parse(query ?? {});
    const ctx = await this.actorOf(req);
    const result = await this.docs.list(
      { projectId, page: q.page, pageSize: q.pageSize },
      ctx,
    );
    return {
      ok: true,
      documents: result.documents,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  @Get(':docId')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async detail(
    @Param('projectId') projectId: string,
    @Param('docId') docId: string,
    @Query() query: unknown,
    @Req() req: Request,
  ): Promise<KbDocumentDetailResponse> {
    const q = KbDocumentDetailQuery.parse(query ?? {});
    const ctx = await this.actorOf(req);
    const document = await this.docs.detail(
      projectId,
      docId,
      q.chunkLimit,
      ctx,
    );
    return { ok: true, document };
  }

  @Delete(':docId')
  @HttpCode(200) // explicit 200 (not 204) so we can return the cascade summary
  @Roles(Role.Admin, Role.Lead)
  async delete(
    @Param('projectId') projectId: string,
    @Param('docId') docId: string,
    @Req() req: Request,
  ): Promise<KbDocumentDeleteResponse> {
    const ctx = await this.actorOf(req);
    const result = await this.docs.delete(projectId, docId, ctx);
    return {
      ok: true,
      documentId: result.documentId,
      chunkCountAtDelete: result.chunkCountAtDelete,
      r2DeleteAttempted: result.r2DeleteAttempted,
      r2DeleteSucceeded: result.r2DeleteSucceeded,
    };
  }
}
