// QA Nexus PM1 — ChunkingController.
//
// Spec: Day-8 Step 5. Internal-only Admin-gated endpoint to fire the
// chunking service against an already-uploaded document. Step 7 will
// add the upload completion hook that calls the SERVICE directly
// (not via this endpoint) — at that point this endpoint stays as a
// manual re-chunk surface for ops + a debug entry point.
//
// File content is fetched from R2 by the controller (not by the
// service) so the service stays storage-agnostic + unit-testable
// with raw Buffers.

import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role, ChunkDocumentRequest } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { R2Service } from '../storage/r2.service';
import { ChunkingService, type ActorContext } from './chunking.service';

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
export class ChunkingController {
  private readonly logger = new Logger(ChunkingController.name);

  constructor(
    private readonly chunking: ChunkingService,
    private readonly r2: R2Service,
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

  /**
   * POST /api/admin/kb/chunk-document
   * Body: { documentId, fileName, r2Key }
   * - documentId: existing KbDocument.id
   * - fileName: original file name (for format detection + audit preview)
   * - r2Key: object key in the R2 bucket (caller knows; e.g.,
   *   `projects/RET/uploads/return_policy_v2.xlsx`)
   *
   * Internal Admin-only — Step 7's upload completion hook will call
   * the service directly without this endpoint.
   */
  @Post('chunk-document')
  @Roles(Role.Admin)
  async chunkDocument(@Body() body: unknown, @Req() req: Request) {
    const input = ChunkDocumentRequest.parse(body);
    const ctx = await this.actorOf(req);

    // Fetch the source file bytes from R2.
    let content: Buffer;
    try {
      content = await this.r2.getObject(input.r2Key);
    } catch (err) {
      this.logger.warn(
        `R2 fetch failed for r2Key=${input.r2Key}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new NotFoundException(
        `source file at r2Key=${input.r2Key} not found or unreachable`,
      );
    }

    const result = await this.chunking.chunkDocument(
      input.documentId,
      input.fileName,
      content,
      ctx,
    );
    return { ok: true as const, ...result };
  }
}
