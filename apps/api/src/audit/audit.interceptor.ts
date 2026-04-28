// AuditInterceptor — opt-in NestInterceptor that automates audit_log
// writes for controller methods tagged with @Audit({...}). Fires after
// the handler resolves successfully (2xx); errors propagate without
// audit (or with deny-audit if a guard already wrote one).
//
// Usage:
//   @UseInterceptors(AuditInterceptor)
//   @Audit({ entityType: 'workspace', action: 'created', entityIdFrom: 'response.id' })
//   @Post() async createWorkspace(@Body() body) { return await this.svc.create(body); }
//
// Spec: MS0-T027.
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuditService } from './audit.service';
import { AUDIT_KEY, type AuditMeta } from './audit.decorator';

function reqHeaders(req: Request): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => h.append(k, vv));
    else if (typeof v === 'string') h.set(k, v);
  }
  return h;
}

function pickPath(obj: unknown, path: string): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (
      cur &&
      typeof cur === 'object' &&
      p in (cur as Record<string, unknown>)
    ) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return null;
    }
  }
  return typeof cur === 'string' ? cur : null;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
    private readonly authService: AuthService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<AuditMeta>(AUDIT_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!meta) {
      return next.handle();
    }
    const req = ctx.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      tap(async (response) => {
        try {
          const session = await this.authService.resolveSession(
            reqHeaders(req),
          );
          if (!session) return; // unauthenticated state-changes shouldn't reach here normally
          let entityId: string | null = null;
          if (meta.entityIdFrom === 'response.id')
            entityId = pickPath(response, 'id');
          else if (meta.entityIdFrom === 'params.id')
            entityId = pickPath(req.params, 'id');
          else if (meta.entityIdFrom === 'body.id')
            entityId = pickPath(req.body, 'id');
          this.audit.writeNonBlocking({
            workspaceId: session.appUser.workspaceId,
            actorId: session.appUser.id,
            entityType: meta.entityType,
            entityId,
            action: meta.action,
            payload: {
              path: req.path,
              method: req.method,
              params: req.params,
              // Body redacted at interceptor layer; controllers that need
              // body-in-payload should write directly via AuditService.
            },
          });
        } catch (err) {
          // Interceptor must never throw — would mask the actual response.
          // AuditService.writeNonBlocking already logs; this catch is belt+
          // suspenders for resolveSession() failures.
           
          console.warn('[AuditInterceptor] background error:', err);
        }
      }),
    );
  }
}
