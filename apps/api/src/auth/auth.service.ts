// Wraps the BetterAuth instance + provides ergonomic helpers used by the
// AuthController (sign-up/in/out/session) and by the rest of the app
// (e.g., RBAC guard fetching the active user from a request).
//
// Spec: MS0-T021. T027 refactored the inline audit writes to delegate to
// AuditService — chain semantics unchanged, single entry point for any
// future audit consumer (interceptor, deny-handler, etc.).
//
// Day-9 T021 wiring (closes followup `(x)` Day-0 admin seed gap):
//   On first sign-in, if the BetterAuth session belongs to the configured
//   ADMIN_SEED_EMAIL (default `yogesh.mohite@iksula.com` per CLAUDE.md
//   "Iksula data canon" + Day-0 bootstrap) AND no TB-002 user row exists
//   for that email yet, AuthService auto-creates the row with
//   role=Admin attached to the seeded Iksula workspace. Idempotent on
//   subsequent sign-ins. Audit row written: `day0_admin_seeded`.
import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { buildAuth, type AuthInstance } from './auth.config';

/** Shared select shape for the TB-002 user fields ResolvedSession needs.
 *  Captured as a const so `prisma.user.findUnique({ select: USER_SELECT })`
 *  + `prisma.user.create({ data, select: USER_SELECT })` agree on the
 *  return type — keeps `appUser` reassignment type-safe in resolveSession. */
const USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  workspaceId: true,
  organizationalLabel: true,
  disabledAt: true,
} as const;

type UserSelectShape = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  workspaceId: string;
  organizationalLabel: string | null;
  disabledAt: Date | null;
};

/** Day-0 deployer-admin email (per CLAUDE.md "Iksula data canon").
 *  Override via env for testing or alternate deployments. */
const ADMIN_SEED_EMAIL =
  process.env.ADMIN_SEED_EMAIL ?? 'yogesh.mohite@iksula.com';

export interface ResolvedSession {
  authUser: { id: string; email: string; name: string };
  appUser: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    workspaceId: string;
    organizationalLabel: string | null;
  };
  expiresAt: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  // Public so main.ts can mount auth.handler on Express.
  public auth!: AuthInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit(): void {
    this.auth = buildAuth(this.prisma, this.email);
    this.logger.log(
      'BetterAuth initialised (basePath=/auth, magic-link plugin enabled)',
    );
  }

  /** Trigger the magic-link send. Used by both /auth/sign-up and /auth/sign-in. */
  async sendMagicLink(params: {
    email: string;
    name?: string;
    callbackURL?: string;
    headers: Headers;
  }): Promise<{ status: boolean }> {
    const { email, name, callbackURL, headers } = params;
    const result = await this.auth.api.signInMagicLink({
      body: {
        email,
        name: name ?? email.split('@')[0],
        callbackURL: callbackURL ?? '/',
      },
      headers,
    });
    return { status: result.status };
  }

  /** Resolve the BetterAuth session + join to the TB-002 app user by email. */
  async resolveSession(headers: Headers): Promise<ResolvedSession | null> {
    const session = await this.auth.api.getSession({ headers });
    if (!session) return null;
    let appUser: UserSelectShape | null = await this.prisma.user.findUnique({
      where: { email: session.user.email },
      select: USER_SELECT,
    });
    if (!appUser) {
      // Day-0 admin seed path — closes followup (x). If this is the
      // configured deployer-admin email signing in for the first time,
      // auto-promote them to Admin in the seeded Iksula workspace.
      // Any other unmatched email returns null (existing behavior).
      const seeded = await this.ensureDay0AdminSeed(
        session.user.email,
        session.user.id,
      );
      if (!seeded) {
        this.logger.warn(
          `BetterAuth session for <${session.user.email}> has no matching ` +
            `TB-002 users row + does not match ADMIN_SEED_EMAIL. ` +
            `Did the invitation flow run for this user?`,
        );
        return null;
      }
      appUser = seeded;
    }

    // P2 (Day-32 audit §1.5): block Admin-disabled users. resolveSession is the
    // single chokepoint behind RolesGuard (all /api/*) + the /auth/session
    // wrapper, so one gate here revokes a disabled user's access immediately
    // rather than waiting for their 7-day session to expire. Gate ONLY on
    // disabledAt — the seeded roster has activatedAt=NULL (magic-link users
    // never set it), so an activatedAt gate would lock out all 8 pilot users.
    if (appUser.disabledAt) {
      this.logger.warn(
        `Disabled user <${session.user.email}> presented a valid session — access blocked.`,
      );
      return null;
    }

    return {
      authUser: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      appUser,
      expiresAt: session.session.expiresAt.toISOString(),
    };
  }

  /** Day-0 admin seed: if the resolved BetterAuth session belongs to the
   *  configured deployer-admin email (`ADMIN_SEED_EMAIL`) AND no TB-002
   *  user row exists yet, auto-create one as Admin attached to the
   *  seeded Iksula workspace.
   *
   *  Idempotent: re-running on an existing row finds + returns it.
   *  Audit: writes `day0_admin_seeded` row so the bootstrap event is
   *  visible in F28 Settings & Audit. PII guard: payload carries
   *  `seeded_email_domain` only (NOT the full email) per
   *  `.claude/rules/security.md` audit-redaction policy.
   *
   *  Returns the (existing or newly-created) TB-002 user row, or null
   *  if seeding cannot proceed (non-admin email OR no Iksula workspace).
   */
  private async ensureDay0AdminSeed(
    authUserEmail: string,
    authUserId: string,
  ): Promise<UserSelectShape | null> {
    if (authUserEmail.toLowerCase() !== ADMIN_SEED_EMAIL.toLowerCase()) {
      return null;
    }
    // Idempotency double-check (race-safe — another concurrent sign-in
    // may have created the row between the outer findUnique + here).
    const existing = await this.prisma.user.findUnique({
      where: { email: authUserEmail },
      select: USER_SELECT,
    });
    if (existing) return existing;

    const workspace = await this.prisma.workspace.findFirst({
      where: { name: 'Iksula' },
      select: { id: true },
    });
    if (!workspace) {
      this.logger.error(
        'Day-0 admin seed: no Iksula workspace found — run prisma/seed.ts first',
      );
      return null;
    }

    const newUser = await this.prisma.user.create({
      data: {
        workspaceId: workspace.id,
        email: authUserEmail,
        displayName: 'Yogesh Mohite',
        role: UserRole.Admin,
        organizationalLabel: 'Sr QA',
        // Argon2id placeholder — magic-link auth means this is never
        // checked, but the schema column is NOT NULL.
        passwordHash: 'magic-link-only-no-password-set',
        activatedAt: new Date(),
        lastLoginAt: new Date(),
      },
      select: USER_SELECT,
    });

    // Audit the seed event — chain-binding per Hard Rule 7.
    // PII redaction: email DOMAIN only (NOT the local-part).
    await this.auditService.write({
      workspaceId: workspace.id,
      actorId: newUser.id,
      entityType: 'auth',
      entityId: newUser.id,
      action: 'day0_admin_seeded',
      payload: {
        seeded_email_domain: authUserEmail.split('@')[1],
        auth_user_id: authUserId,
        followup_closed: 'x',
      },
    });

    this.logger.log(
      `Day-0 admin seed: auto-promoted <REDACTED>@${authUserEmail.split('@')[1]} ` +
        `to Admin in workspace ${workspace.id} (closes followup x)`,
    );

    return newUser;
  }

  /** Sign out via BetterAuth. */
  async signOut(headers: Headers): Promise<{ status: boolean }> {
    const result = await this.auth.api.signOut({ headers });
    return { status: result.success };
  }

  /**
   * Append an audit_log row for a state-changing auth event.
   * Resolves workspace_id by joining auth_user.email → users.workspace_id;
   * if no app user exists yet (sign-up before seed match), uses the seeded
   * Iksula workspace as a fallback so the chain stays unbroken.
   */
  /**
   * Append an audit_log row for a state-changing auth event. Delegates to
   * AuditService — the chain semantics (HMAC, prev_hash linking, advisory
   * lock) live there. Refactored in T027 from the T021 inline helper.
   *
   * `action` is now `string` (not a tight union) because AuditService
   * accepts arbitrary verbs — RolesGuard's `rbac_denied` action would
   * otherwise force every auth-side caller to widen.
   */
  async writeAuthAudit(params: {
    actorEmail: string;
    actorAuthUserId: string | null;
    action: string;
    payload: Record<string, unknown>;
  }): Promise<{ id: string; thisHash: string }> {
    const { workspaceId, actorId } =
      await this.auditService.resolveActorByEmail(params.actorEmail);
    // entity_id is a UUID column. The BetterAuth auth_user.id is TEXT (it
    // doesn't fit), so we point entity_id at the matched TB-002 users.id
    // (always UUID) and stash the BetterAuth id inside the payload.
    return await this.auditService.write({
      workspaceId,
      actorId,
      entityType: 'auth',
      entityId: actorId,
      action: params.action,
      payload: { ...params.payload, auth_user_id: params.actorAuthUserId },
    });
  }
}
