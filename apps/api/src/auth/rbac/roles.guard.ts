// RolesGuard — Nest CanActivate that:
//   1. reads the @Roles(...) metadata from the target handler/class
//   2. resolves the BetterAuth session + joins to TB-002 users for the role
//   3. allows iff the user's role is in the required set
//
// 401 if no session, 403 if session but wrong role. Writes a `rbac_denied`
// audit_log row on 403 for SOC-2 / forensics (chain stays intact).
//
// Spec: MS0-T022 + PM1_ERD §3.4. Used as a per-controller guard:
//   @UseGuards(RolesGuard) @Roles(Role.Admin) async deleteWorkspace() {...}
//
// Future T023 may register this globally via APP_GUARD; for now per-controller
// keeps the surface obvious in code review.
import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role } from '@qa-nexus/shared';
import type { AuthService } from '../auth.service';
import { ROLES_KEY } from './roles.decorator';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    // No @Roles() declared → handler is public for any authenticated user.
    // (Truly public endpoints — sign-up/in/callback — should not use this guard.)
    const req = ctx.switchToHttp().getRequest<Request>();
    const session = await this.authService.resolveSession(reqHeaders(req));
    if (!session) {
      throw new UnauthorizedException('not authenticated');
    }
    if (!required || required.length === 0) {
      // Any authenticated user is allowed.
      return true;
    }
    if (required.includes(session.appUser.role as Role)) {
      return true;
    }
    // Audit the denial (SOC-2 trail). Don't await — non-blocking.
    void this.authService.writeAuthAudit({
      actorEmail: session.appUser.email,
      actorAuthUserId: session.authUser.id,
      action: 'sign_out', // reuse a known action to keep TS union tight; future:
      // AuditService (T027) will accept arbitrary action strings.
      payload: {
        kind: 'rbac_denied',
        path: req.path,
        method: req.method,
        required_roles: required,
        actor_role: session.appUser.role,
      },
    });
    throw new ForbiddenException(
      `role '${session.appUser.role}' not in required set [${required.join(', ')}]`,
    );
  }
}
