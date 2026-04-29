// QA Nexus PM1 — Storage controller.
//
// Spec: ADR-005 (`docs/architecture/adr-005-r2-storage.md`) + MS0-T013.
//
// Endpoints:
//   POST /storage/presigned-upload   (Admin / Lead via @Roles)
//     Body: { contentType, filename, prefix? }
//     Returns: { uploadUrl, downloadUrl, key, expiresAt }
//
//   POST /storage/presigned-download (any authenticated user)
//     Body: { key }
//     Returns: { url, expiresAt }
//
// Each upload presign also writes an audit_log row per CLAUDE.md Rule 7
// + .claude/rules/api.md "Audit log" — synchronous, blocks the response.
// (Issuance of a presigned PUT is a state-changing operation: it grants a
// short-lived capability to write to R2.)
//
// Pattern A NOTE: this controller is consumed by FE components OUTSIDE the
// onboarding tree. The onboarding wizard never uploads; uploads happen in
// F19 Run Console + F11 Requirements Upload + defect attachments — all
// post-onboarding surfaces.

import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  PresignedDownloadRequestSchema,
  PresignedUploadRequestSchema,
  Role,
  type PresignedDownloadRequest,
  type PresignedDownloadResponse,
  type PresignedUploadRequest,
  type PresignedUploadResponse,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import { R2Service } from './r2.service';
import { ZodValidationPipe } from './zod-validation.pipe';

@Controller('storage')
@UseGuards(RolesGuard)
export class StorageController {
  constructor(
    private readonly r2: R2Service,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Issue a presigned upload URL. Admin or Lead only.
   *
   * Audit: writes one row entityType="storage", action="presigned_upload_issued"
   * BEFORE returning. If the audit write fails, the request fails (R2 is
   * not yet "dirty" — no PUT has happened — but we maintain the chain
   * integrity contract).
   */
  @Post('presigned-upload')
  @Roles(Role.Admin, Role.Lead)
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(PresignedUploadRequestSchema))
  async presignedUpload(
    @Body() body: PresignedUploadRequest,
    @Req() req: Request,
  ): Promise<PresignedUploadResponse> {
    const session = await this.requireSession(req);
    const result = await this.r2.presignedUpload({
      contentType: body.contentType,
      filename: body.filename,
      prefix: body.prefix,
    });
    // Synchronous audit (per CLAUDE.md Rule 7). Throws on failure → bubbles
    // up → request fails before FE can use the presigned URL. Acceptable
    // tradeoff: PM1's audit chain integrity > a single failed upload retry.
    await this.audit.write({
      workspaceId: session.appUser.workspaceId,
      actorId: session.appUser.id,
      entityType: 'storage',
      entityId: null,
      action: 'presigned_upload_issued',
      payload: {
        key: result.key,
        contentType: body.contentType,
        filename: body.filename,
        prefix: body.prefix ?? 'uploads',
        expires_at: result.expiresAt,
      },
    });
    return {
      uploadUrl: result.url,
      downloadUrl: result.downloadUrl,
      key: result.key,
      expiresAt: result.expiresAt,
    };
  }

  /**
   * Issue a presigned download URL. Any authenticated user (no @Roles).
   * RolesGuard still enforces that there IS a session (401 if not).
   *
   * Audit: NOT logged (downloads are read-only; auditing every link issuance
   * would balloon the table for negligible forensic value at PM1 scale).
   * Future: if we add per-asset access controls, audit the deny side only.
   */
  @Post('presigned-download')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(PresignedDownloadRequestSchema))
  async presignedDownload(
    @Body() body: PresignedDownloadRequest,
  ): Promise<PresignedDownloadResponse> {
    const result = await this.r2.presignedDownload({ key: body.key });
    return result;
  }

  /** Resolve the authenticated session — RolesGuard already passed, so this
   *  is guaranteed to succeed UNLESS the cookie expired between guard run
   *  and handler execution (vanishingly rare; surface as 401 either way). */
  private async requireSession(req: Request): Promise<{
    appUser: { id: string; workspaceId: string; role: string };
  }> {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
      else if (v) headers.append(k, v);
    }
    const session = await this.auth.resolveSession(headers);
    if (!session) {
      // Should never happen post-RolesGuard, but defense in depth.
      throw new Error('session vanished between RolesGuard and handler');
    }
    return session;
  }
}
