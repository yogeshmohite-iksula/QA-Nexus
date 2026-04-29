// QA Nexus PM1 — WebSocket gateway scaffold.
//
// Spec: PM1_ERD §3 + MS0-T026. F19 Run Console (M4) will use this for
// live test-execution streaming. Today's scope = scaffold only:
//   - @WebSocketGateway with @nestjs/platform-ws (matches CLAUDE.md
//     locked stack: "@nestjs/websockets + ws" — NO socket.io)
//   - Connection-time auth check via BetterAuth session cookie OR
//     ?token query param (so the FE can send the cookie at handshake)
//   - @SubscribeMessage('echo') for connection sanity tests
//   - Sane lifecycle hooks (handleConnection, handleDisconnect) with
//     structured logging
//
// Auth strategy: WebSocket clients send the standard better-auth session
// cookie on the upgrade request (browsers do this automatically for
// same-origin upgrades). For cross-origin / non-browser clients (the
// future F19 Playwright runner shelling into the API from CI), they can
// pass `?token=<session-token-value>` in the URL — this gateway extracts
// it and synthesises a Cookie header so AuthService.resolveSession sees
// the same shape.
//
// Per @Roles convention: room-/event-level RBAC enforcement is the
// caller's job. handleConnection just validates "is this a real session"
// — it doesn't gate which channels a user can subscribe to. Channel-
// level auth lands in M4 alongside F19.
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { IncomingMessage } from 'http';
import type { WebSocket, WebSocketServer as WsServer } from 'ws';
import { AuthService } from '../auth/auth.service';

interface ConnectedClient extends WebSocket {
  /** Attached on successful handshake — used for per-message auditing. */
  qaNexus?: {
    appUserId: string;
    appUserEmail: string;
    role: string;
    workspaceId: string;
    authUserId: string;
  };
}

@WebSocketGateway({
  // CORS handled at the upgrade level — only open for our own origins.
  // Production: set ALLOWED_WS_ORIGINS env var (comma-separated). Dev:
  // wildcard fallback (cors:true) so local FE on :3000 can connect.
  cors: { origin: process.env.ALLOWED_WS_ORIGINS?.split(',') ?? true },
  // /realtime path keeps WS routes namespaced away from REST.
  path: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);
  @WebSocketServer() server!: WsServer;

  constructor(private readonly authService: AuthService) {}

  /** Validate the session at handshake. Reject (close 4401) if no
   *  resolvable session — the client sees a normal close-with-code, not
   *  a generic 1006, so they can react with "please re-auth". */
  async handleConnection(
    client: ConnectedClient,
    req: IncomingMessage,
  ): Promise<void> {
    try {
      const headers = this.buildHeadersFromRequest(req);
      const session = await this.authService.resolveSession(headers);
      if (!session) {
        this.logger.warn(
          `WS connection rejected: no resolvable session (ip=${this.ipOf(req)})`,
        );
        client.close(4401, 'unauthenticated');
        return;
      }
      client.qaNexus = {
        appUserId: session.appUser.id,
        appUserEmail: session.appUser.email,
        role: session.appUser.role,
        workspaceId: session.appUser.workspaceId,
        authUserId: session.authUser.id,
      };
      this.logger.log(
        `WS connected: ${session.appUser.email} (${session.appUser.role}) ` +
          `workspace=${session.appUser.workspaceId.slice(0, 8)}`,
      );
    } catch (err) {
      this.logger.error(
        `WS handshake error: ${err instanceof Error ? err.message : String(err)}`,
      );
      client.close(4500, 'handshake error');
    }
  }

  handleDisconnect(client: ConnectedClient): void {
    if (client.qaNexus) {
      this.logger.log(
        `WS disconnected: ${client.qaNexus.appUserEmail} (${client.qaNexus.role})`,
      );
    } else {
      this.logger.log('WS disconnected: <unauthenticated>');
    }
  }

  /** Sanity-check echo. Use from FE / curl-equivalent ws clients to
   *  verify the upgrade + auth + roundtrip. */
  @SubscribeMessage('echo')
  echo(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: ConnectedClient,
  ): {
    event: 'echo:ack';
    data: { payload: unknown; you: string | null; ts: string };
  } {
    if (!client.qaNexus) {
      // Should be unreachable — handleConnection rejects unauthed before
      // any message can be sent — but defence-in-depth.
      throw new WsException('unauthenticated');
    }
    return {
      event: 'echo:ack',
      data: {
        payload,
        you: client.qaNexus.appUserEmail,
        ts: new Date().toISOString(),
      },
    };
  }

  /** Construct a Headers object that AuthService.resolveSession can use,
   *  promoting `?token=...` query param into a synthetic Cookie header
   *  for non-browser clients. */
  private buildHeadersFromRequest(req: IncomingMessage): Headers {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
      else if (typeof v === 'string') headers.set(k, v);
    }
    // Promote ?token= → Cookie if no cookie was sent (non-browser clients).
    if (!headers.has('cookie') && req.url) {
      try {
        const url = new URL(req.url, 'http://placeholder.local');
        const token = url.searchParams.get('token');
        if (token) {
          // searchParams.get() already URL-decoded the token; cookies pass
          // values RAW (no encoding step), so write the decoded value
          // directly. Encoding again would double-encode (`%2F` → `%252F`)
          // and better-auth's session lookup would fail.
          headers.set('cookie', `better-auth.session_token=${token}`);
        }
      } catch {
        // ignore malformed URLs — handleConnection will reject as unauthed
      }
    }
    return headers;
  }

  private ipOf(req: IncomingMessage): string {
    const fwd = req.headers['x-forwarded-for'];
    return Array.isArray(fwd)
      ? fwd[0]
      : (fwd ?? req.socket.remoteAddress ?? 'unknown');
  }
}
