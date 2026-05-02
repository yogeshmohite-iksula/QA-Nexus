// QA Nexus PM1 — InvitationsController.
//
// Spec: M1 Users & Roles milestone.
//
// **STATUS — M1 PREVIEW (un-routed).** This controller is part of the
// InvitationsModule which is intentionally NOT registered in AppModule
// today. FE chat reads this file + the shared Zod schemas as the contract
// preview. Wiring lands in the M1 final PR (Monday Day-8) once M0 closes.
//
// Endpoints (registered in AppModule as of Day-6):
//   POST   /api/invitations              create   Admin / Lead
//   GET    /api/invitations              list     Admin / Lead / QAEngineer / Stakeholder
//   GET    /api/invitations/:id          detail   Admin / Lead
//   POST   /api/invitations/accept       accept   PUBLIC (token = auth)
//   PATCH  /api/invitations/:id/resend   resend   Admin / Lead
//   DELETE /api/invitations/:id          revoke   Admin / Lead
//
// RBAC notes:
//   - "create" + "revoke" are workspace-Admin-or-Lead actions per
//     PM1_PRD §3.2 ("only Lead+Admin can grow the team").
//   - "list" is open to all authenticated users so QAEngineers see
//     their own pending invites + Stakeholders can read who's been
//     invited (read-only context for review meetings).
//   - "accept" is public-by-token: there's no session yet (the user
//     doesn't exist yet) — the token IS the auth. Constant-time check
//     happens via the DB index lookup in InvitationsService.

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  Role,
  CreateInvitationInput,
  AcceptInvitationInput,
  RevokeInvitationInput,
  ResendInvitationInput,
} from '@qa-nexus/shared';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { AuthService } from '../auth/auth.service';
import { InvitationsService, type ActorContext } from './invitations.service';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Controller('api/invitations')
export class InvitationsController {
  constructor(
    private readonly invitations: InvitationsService,
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
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Lead)
  async create(@Body() body: unknown, @Req() req: Request) {
    const input = CreateInvitationInput.parse(body);
    const ctx = await this.actorOf(req);
    const created = await this.invitations.create(input, ctx);
    // The token plaintext travels through this response surface ONCE so the
    // FE / future EmailService can build the magic-link URL. After this
    // turn, the only persisted form is the SHA-256 hash.
    return { ok: true as const, invitation: created };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Lead, Role.QAEngineer, Role.Stakeholder)
  async list(@Req() req: Request) {
    const ctx = await this.actorOf(req);
    const invitations = await this.invitations.list(ctx);
    return { ok: true as const, invitations };
  }

  /** Public — no @UseGuards. Token is the auth. Rate-limit at edge. */
  @Post('accept')
  async accept(@Body() body: unknown) {
    const input = AcceptInvitationInput.parse(body);
    return this.invitations.accept(input);
  }

  /**
   * Single-record fetch. Order matters: Nest matches Express-style — :id
   * routes go AFTER literal segments like /accept (which is matched
   * above). Any new literal-segment route MUST also live above this.
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Lead)
  async getById(@Param('id') id: string, @Req() req: Request) {
    const ctx = await this.actorOf(req);
    const invitation = await this.invitations.getById(id, ctx);
    return { ok: true as const, invitation };
  }

  /**
   * Regenerate the magic-link token + extend expiry. Returns the new
   * plaintext token ONCE for the caller to re-email. Stale links from
   * any prior send become invalid the moment this row updates.
   */
  @Patch(':id/resend')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Lead)
  async resend(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const parsed = ResendInvitationInput.parse({
      ...((body as object | null) ?? {}),
      invitationId: id,
    });
    const ctx = await this.actorOf(req);
    const result = await this.invitations.resend(
      parsed.invitationId,
      { expiresInHours: parsed.expiresInHours, reason: parsed.reason },
      ctx,
    );
    return {
      ok: true as const,
      invitationId: result.id,
      token: result.token,
      shortRef: result.shortRef,
      expiresAt: result.expiresAt,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Lead)
  async revoke(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    // Body optional (just `reason`); merge id from URL into the Zod input.
    const parsed = RevokeInvitationInput.parse({
      ...((body as object | null) ?? {}),
      invitationId: id,
    });
    const ctx = await this.actorOf(req);
    return this.invitations.revoke(parsed.invitationId, parsed.reason, ctx);
  }
}
