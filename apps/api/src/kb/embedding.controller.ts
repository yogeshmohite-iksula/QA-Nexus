// QA Nexus PM1 — KbEmbeddingController.
//
// Spec: Day-8 Step 6 (M2 retrieval flow). Admin-gated endpoint to
// trigger embedding for a previously-chunked document.
//
// Endpoint: POST /api/admin/kb/embed-document  (Admin only)
//
// Mirror of the Step-5 chunking controller — same Admin-only RBAC
// posture, same workspace scoping (cross-workspace = 404), same Zod
// validation pattern. Step 7 will fold this into the upload-completion
// hook so successful chunking auto-triggers embedding; for Step 6 it
// stays as an explicit admin endpoint for testability + retry control.

import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role, EmbedDocumentRequest } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { KbEmbeddingService, type ActorContext } from './embedding.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/admin/kb')
@UseGuards(RolesGuard)
export class KbEmbeddingController {
  constructor(
    private readonly embedding: KbEmbeddingService,
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

  @Post('embed-document')
  @Roles(Role.Admin)
  async embedDocument(@Body() body: unknown, @Req() req: Request) {
    const input = EmbedDocumentRequest.parse(body);
    const ctx = await this.actorOf(req);
    const result = await this.embedding.embedDocument(input.documentId, ctx);
    return {
      ok: true as const,
      documentId: result.documentId,
      embeddedCount: result.embeddedCount,
      totalChunks: result.totalChunks,
      alreadyEmbedded: result.alreadyEmbedded,
      noop: result.embeddedCount === 0,
    };
  }
}
