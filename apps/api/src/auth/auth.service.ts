// Wraps the BetterAuth instance + provides ergonomic helpers used by the
// AuthController (sign-up/in/out/session) and by the rest of the app
// (e.g., RBAC guard fetching the active user from a request).
//
// Spec: MS0-T021. The audit_log writes here are inline for now; T027 will
// refactor them behind an AuditService + interceptor.
import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { EmailService } from '../email/email.service';
import { writeAuditRow } from '../audit/audit-helper';
import { buildAuth, type AuthInstance } from './auth.config';

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
    const appUser = await this.prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        workspaceId: true,
        organizationalLabel: true,
      },
    });
    if (!appUser) {
      this.logger.warn(
        `BetterAuth session for <${session.user.email}> has no matching TB-002 users row. ` +
          `Did the seed (prisma/seed.ts) run? Or is this a sign-up for a non-pilot user?`,
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
  async writeAuthAudit(params: {
    actorEmail: string;
    actorAuthUserId: string | null;
    action:
      | 'sign_up_link_sent'
      | 'sign_in_link_sent'
      | 'magic_link_verified'
      | 'sign_out';
    payload: Record<string, unknown>;
  }): Promise<{ id: string; thisHash: string }> {
    const appUser = await this.prisma.user.findUnique({
      where: { email: params.actorEmail },
      select: { id: true, workspaceId: true },
    });
    let workspaceId: string;
    let actorId: string | null = null;
    if (appUser) {
      workspaceId = appUser.workspaceId;
      actorId = appUser.id;
    } else {
      const fallback = await this.prisma.workspace.findFirstOrThrow({
        select: { id: true },
      });
      workspaceId = fallback.id;
    }
    // entity_id is a UUID column. The BetterAuth auth_user.id is now TEXT
    // (it doesn't fit), so we point entity_id at the matched TB-002 users.id
    // (always UUID) and stash the BetterAuth id inside the payload.
    const enrichedPayload = {
      ...params.payload,
      auth_user_id: params.actorAuthUserId,
    };
    const row = await writeAuditRow(this.prisma, {
      workspaceId,
      actorId,
      entityType: 'auth',
      entityId: actorId, // TB-002 users.id (UUID) when known, else null
      action: params.action,
      payload: enrichedPayload,
    });
    return { id: row.id, thisHash: row.thisHash };
  }
}
