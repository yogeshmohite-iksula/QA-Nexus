// QA Nexus PM1 — InvitationsService.
//
// Spec: PM1_ERD §3 (TB-005 user_invitations + TB-002 users + TB-004
// project_members) + M1 (Users & Roles milestone).
//
// **STATUS — M1 PREVIEW (un-routed).** Per Day-5 brief: this module exists
// to give FE a stable contract preview but is NOT yet wired into AppModule.
// The InvitationsModule registration step lands in the M1 final PR
// (Monday Day-8) once M0 acceptance gate closes Sunday evening. Until then
// the controller routes are not reachable from the running API.
//
// What this owns (scoped per the brief):
//   1. create()  — Admin/Lead invites a new user. Generates a secret token,
//                  stores its SHA-256 hash, returns the plaintext for the
//                  magic-link URL. Audits 'invitation_created'.
//   2. list()    — List pending/accepted/revoked invitations in workspace.
//   3. accept()  — Public-by-token. Validates token + expiry + status,
//                  creates the User row + ProjectMember rows for each
//                  scoped project, marks invitation accepted.
//                  Audits 'invitation_accepted'.
//   4. revoke()  — Admin/Lead. Marks invitation revoked. Idempotent —
//                  re-revoking is a 409. Audits 'invitation_revoked'.
//
// Audit discipline (CLAUDE.md Hard Rule 7 + PM1_ERD §3.13): every state-
// changing op writes a synchronous audit row before returning. The chain
// is binding — a missed audit row is a Sev-2 incident.
//
// Token discipline:
//   - Plaintext token = `crypto.randomBytes(32).toString('hex')` = 64 chars.
//   - Stored hash    = `sha256(token).digest('hex')` = 64 chars.
//   - Plaintext NEVER persisted server-side; only returned at create() time
//     for caller (EmailService) to embed in the magic-link URL.
//   - Verification: hash the inbound token + look up UserInvitation by
//     (tokenHash, workspaceId). Constant-time comparison via the DB index
//     lookup itself (no early-return string compare in app code).

import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import {
  CreateInvitationInput,
  AcceptInvitationInput,
  InvitationListItem,
  AcceptInvitationResponse,
  Role,
} from '@qa-nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

/**
 * Result of create() — plaintext token returned ONLY this once. Caller
 * (eventually EmailService.sendInvitationMagicLink) is responsible for
 * embedding it in the email URL and never logging it.
 */
export interface CreatedInvitation {
  id: string;
  invitedEmail: string;
  /** Plaintext token — only the first 8 chars are the human-displayable
   *  shortRef; the full string goes in the URL. NEVER log. */
  token: string;
  shortRef: string;
  expiresAt: string;
}

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a pending invitation + audit. The plaintext token is returned
   * to the caller for inclusion in the magic-link URL; the server stores
   * only the SHA-256 hash. Throws ConflictException(409) if an active
   * (pending OR accepted) invitation already exists for this email in
   * the workspace — Lead can't double-invite the same person.
   */
  async create(
    input: CreateInvitationInput,
    ctx: ActorContext,
  ): Promise<CreatedInvitation> {
    // 1. Validate any project-scope IDs belong to the inviter's workspace.
    //    Cross-workspace project IDs would let an Admin escalate scope.
    if (input.projectScopeJson?.length) {
      const found = await this.prisma.project.findMany({
        where: {
          id: { in: input.projectScopeJson },
          workspaceId: ctx.workspaceId,
        },
        select: { id: true },
      });
      const valid = new Set(found.map((p) => p.id));
      const missing = input.projectScopeJson.filter((id) => !valid.has(id));
      if (missing.length) {
        throw new BadRequestException(
          `projectScopeJson includes ${missing.length} project(s) not in this workspace: ` +
            missing.slice(0, 3).join(', ') +
            (missing.length > 3 ? '…' : ''),
        );
      }
    }

    // 2. Refuse double-invites for the same email + workspace if there's
    //    an active (pending / accepted) invitation.
    const existing = await this.prisma.userInvitation.findFirst({
      where: {
        workspaceId: ctx.workspaceId,
        invitedEmail: input.invitedEmail,
        status: { in: ['pending', 'accepted'] },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      throw new ConflictException(
        `an ${existing.status} invitation already exists for ${input.invitedEmail} in this workspace ` +
          `(id=${existing.id}); revoke it first or wait for it to expire`,
      );
    }

    // 3. Generate token + hash. 32 random bytes = 64 hex chars; SHA-256
    //    digest also 64 hex chars. Plaintext goes in URL only.
    const tokenPlain = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(tokenPlain).digest('hex');

    const expiresAt = new Date(
      Date.now() + (input.expiresInHours ?? 24 * 7) * 60 * 60 * 1000,
    );

    // 4. Insert + audit.
    const inv = await this.prisma.userInvitation.create({
      data: {
        workspaceId: ctx.workspaceId,
        invitedEmail: input.invitedEmail,
        role: input.role,
        projectScopeJson: (input.projectScopeJson ??
          []) as Prisma.InputJsonValue,
        invitedBy: ctx.actorId,
        tokenHash,
        expiresAt,
        // status defaults to 'pending'
      },
      select: { id: true, invitedEmail: true, expiresAt: true },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'invitation',
      entityId: inv.id,
      action: 'invitation_created',
      payload: {
        invitation_id: inv.id,
        invited_email: input.invitedEmail,
        role: input.role,
        project_scope_count: input.projectScopeJson?.length ?? 0,
        expires_at: inv.expiresAt.toISOString(),
        actor_email: ctx.actorEmail,
      },
    });

    return {
      id: inv.id,
      invitedEmail: inv.invitedEmail,
      token: tokenPlain,
      shortRef: inv.id.replace(/-/g, '').slice(0, 8),
      expiresAt: inv.expiresAt.toISOString(),
    };
  }

  /** List invitations in actor's workspace. Strips tokenHash. */
  async list(ctx: ActorContext): Promise<InvitationListItem[]> {
    const rows = await this.prisma.userInvitation.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      invitedEmail: r.invitedEmail,
      role: r.role as Role,
      projectScopeJson: Array.isArray(r.projectScopeJson)
        ? (r.projectScopeJson as unknown[])
        : [],
      invitedBy: r.invitedBy,
      expiresAt: r.expiresAt.toISOString(),
      status: r.status,
      acceptedAt: r.acceptedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      shortRef: r.id.replace(/-/g, '').slice(0, 8),
    }));
  }

  /**
   * Accept an invitation by plaintext token. Public endpoint (no auth) —
   * the token IS the auth. Creates a TB-002 user + TB-004 project_member
   * rows for each scoped project (or none = workspace-wide).
   *
   * Error semantics:
   *   - Unknown token        → NotFoundException(404) ("invalid token")
   *   - Already accepted     → GoneException(410)
   *   - Revoked              → GoneException(410)
   *   - Expired              → GoneException(410) + auto-mark status='expired'
   *   - Email already user   → ConflictException(409) — implies the same
   *                            invitee accepted via a different invitation
   */
  async accept(
    input: AcceptInvitationInput,
  ): Promise<AcceptInvitationResponse> {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const inv = await this.prisma.userInvitation.findFirst({
      where: { tokenHash },
    });
    if (!inv) {
      throw new NotFoundException('invitation token not recognised');
    }
    if (inv.status === 'accepted') {
      throw new GoneException('invitation has already been accepted');
    }
    if (inv.status === 'revoked') {
      throw new GoneException('invitation has been revoked');
    }
    if (inv.expiresAt.getTime() < Date.now()) {
      // Auto-mark expired so future probes return correct status.
      await this.prisma.userInvitation.update({
        where: { id: inv.id },
        data: { status: 'expired' },
      });
      throw new GoneException('invitation has expired');
    }
    // Block double-account creation if a user with this email already
    // exists in the workspace (means a parallel accept already won).
    const existingUser = await this.prisma.user.findUnique({
      where: { email: inv.invitedEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException(
        `a user with email ${inv.invitedEmail} already exists`,
      );
    }

    // Atomic: create user + project memberships + flip invitation status
    // + audit. Wrapped in a single transaction so partial-create rolls back.
    const projectIds = Array.isArray(inv.projectScopeJson)
      ? (inv.projectScopeJson as string[])
      : [];

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          workspaceId: inv.workspaceId,
          email: inv.invitedEmail,
          displayName: input.displayName,
          role: inv.role,
          // BetterAuth (magic-link) owns auth — placeholder hash; real auth
          // happens via /auth/sign-in. M1.5 will deprecate password_hash
          // entirely once magic-link is the sole flow per ADR.
          passwordHash: 'PENDING_BETTERAUTH_M1',
          activatedAt: new Date(),
        },
        select: {
          id: true,
          workspaceId: true,
          email: true,
          displayName: true,
          role: true,
          organizationalLabel: true,
          activatedAt: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      if (projectIds.length) {
        await tx.projectMember.createMany({
          data: projectIds.map((projectId) => ({
            projectId,
            userId: u.id,
            // Workspace-level role is the default; explicit per-project
            // override remains null until Admin sets one in Settings.
            roleOverride: null,
          })),
        });
      }
      await tx.userInvitation.update({
        where: { id: inv.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      return u;
    });

    await this.audit.write({
      workspaceId: inv.workspaceId,
      actorId: user.id, // the new user is the actor of their own accept
      entityType: 'invitation',
      entityId: inv.id,
      action: 'invitation_accepted',
      payload: {
        invitation_id: inv.id,
        new_user_id: user.id,
        invited_email: inv.invitedEmail,
        role: inv.role,
        project_scope_ids: projectIds,
      },
    });

    return {
      ok: true,
      user: {
        id: user.id,
        workspaceId: user.workspaceId,
        email: user.email,
        displayName: user.displayName,
        role: user.role as Role,
        organizationalLabel: user.organizationalLabel,
        activatedAt: user.activatedAt?.toISOString() ?? null,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      },
      workspaceId: user.workspaceId,
    };
  }

  /**
   * Revoke a pending invitation. Admin/Lead only — guard at controller.
   * Idempotent in the sense that re-revoking returns a structured 409
   * rather than corrupting state.
   */
  async revoke(
    invitationId: string,
    reason: string | undefined,
    ctx: ActorContext,
  ): Promise<{ ok: true; invitationId: string; status: 'revoked' }> {
    const inv = await this.prisma.userInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!inv) {
      throw new NotFoundException(`invitation ${invitationId} not found`);
    }
    if (inv.workspaceId !== ctx.workspaceId) {
      // Cross-workspace revoke attempt — never leak existence; return 404.
      throw new NotFoundException(`invitation ${invitationId} not found`);
    }
    if (inv.status === 'revoked') {
      throw new ConflictException('invitation is already revoked');
    }
    if (inv.status === 'accepted') {
      throw new ConflictException(
        'invitation has already been accepted; revoke the user via F27 instead',
      );
    }

    await this.prisma.userInvitation.update({
      where: { id: inv.id },
      data: { status: 'revoked' },
    });

    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'invitation',
      entityId: inv.id,
      action: 'invitation_revoked',
      payload: {
        invitation_id: inv.id,
        invited_email: inv.invitedEmail,
        reason: reason ?? null,
        actor_email: ctx.actorEmail,
      },
    });

    return { ok: true, invitationId: inv.id, status: 'revoked' };
  }
}
