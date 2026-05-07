// QA Nexus PM1 — UploadOrchestratorController.
//
// Spec: Day-8 Step 7 (M2 retrieval flow). Single-call entry point that
// wraps Steps 5 (chunking) + 6 (embedding) into one request.
//
// Endpoint: POST /api/admin/kb/finalize-upload  (Admin only)
//
// Body: { documentId, fileName, r2Key }  — same shape as Step 5's
//   chunk-document so callers porting from the two-call pattern just
//   change the URL path. This is intentional + documented in the
//   migration note in apps/api/src/kb/README.md.
//
// In M2 pilot scale (uploads < 50 chunks, ~3-5s wall-clock with cold
// embedder load), the request is synchronous. Once we move past pilot
// scale OR want a non-blocking UX, swap to: (a) BullMQ-style queue
// (banned in PM1 — no Redis), so use (b) Postgres-row job table +
// WebSocket push when status flips to 'ready'. Out of scope for Step 7.

import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role, FinalizeUploadRequest } from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import {
  UploadOrchestratorService,
  type ActorContext,
} from './upload-orchestrator.service';

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
export class UploadOrchestratorController {
  constructor(
    private readonly orchestrator: UploadOrchestratorService,
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

  /// RBAC widened M2 Day-12 (al) — Admin/Lead/QAEngineer match the
  /// new POST /api/projects/:projectId/kb/documents endpoint, so a
  /// QAEng who creates an upload can also finalize it. Workspace
  /// isolation is enforced inside UploadOrchestratorService via the
  /// project-membership chain (cross-workspace docId → 404).
  @Post('finalize-upload')
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer)
  async finalizeUpload(@Body() body: unknown, @Req() req: Request) {
    const input = FinalizeUploadRequest.parse(body);
    const ctx = await this.actorOf(req);
    const result = await this.orchestrator.finalize(
      input.documentId,
      input.fileName,
      input.r2Key,
      ctx,
    );
    return {
      ok: true as const,
      documentId: result.documentId,
      format: result.chunking.format,
      chunkCount: result.chunking.chunkCount,
      embeddedCount: result.embedding.embeddedCount,
      alreadyEmbedded: result.embedding.alreadyEmbedded,
      totalChunks: result.embedding.totalChunks,
      totalDurationMs: result.totalDurationMs,
      firstChunkPreview: result.chunking.firstChunkPreview,
    };
  }
}
