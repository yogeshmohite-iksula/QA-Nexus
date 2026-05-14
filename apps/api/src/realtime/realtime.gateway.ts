// QA Nexus PM1 — WebSocket gateway.
//
// Spec: PM1_ERD §3 + MS0-T026 (scaffold) + M4 TASK 2 (channels + emits).
// F19 Run Console (M4) uses this for live test-execution streaming.
//
// Capabilities:
//   - @WebSocketGateway with @nestjs/platform-ws (CLAUDE.md locked stack:
//     "@nestjs/websockets + ws" — NO socket.io, NO Redis pub/sub per
//     Hard Rule 5 — single NestJS dyno, single WS process)
//   - Connection-time auth: BetterAuth session cookie on the upgrade
//     request (browsers send automatically same-origin) OR ?token=
//     query-param fallback for non-browser clients (future F19 Playwright
//     runners shelling in from CI)
//   - @SubscribeMessage('echo') — sanity-check roundtrip
//   - @SubscribeMessage('subscribe') / @SubscribeMessage('unsubscribe')
//     — channel pattern `test_run.progress.<runId>`. On subscribe,
//     verifies the connected user has project-membership access to the
//     run's project (defence-in-depth — DB-level RLS would also reject,
//     but rejecting at the WS layer surfaces the error to the client).
//   - Public emit methods called from TestRunService / A4 RCA / AgentRun
//     handlers: `emitTestRunProgress(runId, payload)`,
//     `emitDefectRcaReady(defectId, payload)`,
//     `emitAgentRunComplete(agentRunId, payload)`. Channel-scoped fanout
//     via the per-channel client-set Map; broadcast-to-workspace path
//     for `defect.*` + `agent_run.*` lands in a Day-19/20 follow-up.
//
// Cookie parsing on WS upgrade (Hard Rule 11 watchpoint from M4 brief):
// `ws` library does NOT auto-parse cookies on the upgrade request. The
// existing `buildHeadersFromRequest()` helper handles this manually by
// forwarding `req.headers.cookie` (already a single string from Node's
// http parser) into a Headers object that AuthService.resolveSession
// consumes via the same shape as Express middleware. No subprotocol
// negotiation needed — cookie + ?token= cover both browser + CI cases.

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
import { PrismaService } from '../prisma/prisma.service';

interface ConnectedClient extends WebSocket {
  /** Attached on successful handshake — used for per-message auditing. */
  qaNexus?: {
    appUserId: string;
    appUserEmail: string;
    role: string;
    workspaceId: string;
    authUserId: string;
  };
  /** Channel keys this client is subscribed to. Cleared on disconnect. */
  qaNexusChannels?: Set<string>;
}

/** Channel-key parsing. Pattern: `<resource>.<...>` where the LEADING
 *  segment is one of the known resources. We split into `[resource, id]`
 *  for authorization. */
const TEST_RUN_PROGRESS_CHANNEL_RE =
  /^test_run\.progress\.([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

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
  /** Channel → subscribed-client-set. Per-process Map; no Redis (Hard Rule 5,
   *  single-instance NestJS dyno). Cleared on client disconnect. */
  private readonly channels = new Map<string, Set<ConnectedClient>>();

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

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
    // Clear channel subscriptions to prevent emit-to-dead-socket leaks.
    if (client.qaNexusChannels) {
      for (const ch of client.qaNexusChannels) {
        this.channels.get(ch)?.delete(client);
        // Garbage-collect empty channel buckets to keep the Map bounded.
        if (this.channels.get(ch)?.size === 0) this.channels.delete(ch);
      }
      client.qaNexusChannels.clear();
    }
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

  // ────────────────────────────────────────────────────────────────────
  // M4 TASK 2 — Channel subscribe / unsubscribe + emit fan-out.
  // ────────────────────────────────────────────────────────────────────

  /** Subscribe the client to a channel. Currently supports:
   *    test_run.progress.<runId>  — F19 Run Console live updates.
   *  Authorization: client's connected user MUST be a project member
   *  of the project owning the run. Rejects with WsException on any
   *  validation/authorization failure.
   *
   *  Payload: `{ channel: 'test_run.progress.<uuid>' }`
   *  Ack: `{ event: 'subscribe:ack', data: { channel, ts } }` */
  @SubscribeMessage('subscribe')
  async subscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: ConnectedClient,
  ): Promise<{
    event: 'subscribe:ack';
    data: { channel: string; ts: string };
  }> {
    if (!client.qaNexus) throw new WsException('unauthenticated');
    const channel = this.extractChannelOrThrow(payload);

    // Channel-pattern auth dispatch
    const m = TEST_RUN_PROGRESS_CHANNEL_RE.exec(channel);
    if (m) {
      const runId = m[1];
      await this.assertCanReadRun(runId, client.qaNexus.appUserId);
    } else {
      throw new WsException(`unsupported channel: ${channel}`);
    }

    // Subscribe — idempotent (Set semantics).
    if (!client.qaNexusChannels) client.qaNexusChannels = new Set();
    client.qaNexusChannels.add(channel);
    let bucket = this.channels.get(channel);
    if (!bucket) {
      bucket = new Set();
      this.channels.set(channel, bucket);
    }
    bucket.add(client);
    this.logger.log(
      `WS subscribe: ${client.qaNexus.appUserEmail} → ${channel} ` +
        `(bucket=${bucket.size})`,
    );
    return {
      event: 'subscribe:ack',
      data: { channel, ts: new Date().toISOString() },
    };
  }

  /** Symmetric unsubscribe. No auth check beyond "client is connected"
   *  — unsubscribe is always allowed for channels the client is in. */
  @SubscribeMessage('unsubscribe')
  unsubscribe(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: ConnectedClient,
  ): { event: 'unsubscribe:ack'; data: { channel: string; ts: string } } {
    if (!client.qaNexus) throw new WsException('unauthenticated');
    const channel = this.extractChannelOrThrow(payload);
    client.qaNexusChannels?.delete(channel);
    const bucket = this.channels.get(channel);
    bucket?.delete(client);
    if (bucket && bucket.size === 0) this.channels.delete(channel);
    return {
      event: 'unsubscribe:ack',
      data: { channel, ts: new Date().toISOString() },
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Public emit API — called from TestRunService / A4 RCA / AgentRun.
  // ────────────────────────────────────────────────────────────────────

  /** Emit a `test_run.progress` event to all clients subscribed to the
   *  `test_run.progress.<runId>` channel. No-op if no subscribers. */
  emitTestRunProgress(
    runId: string,
    payload: {
      status: string;
      progressPct?: number;
      currentTestCaseId?: string;
      passed?: number;
      failed?: number;
      blocked?: number;
      message?: string;
    },
  ): number {
    const channel = `test_run.progress.${runId}`;
    return this.emitToChannel(channel, 'test_run.progress', payload);
  }

  /** Emit a `defect.rca_ready` event when A4's 5-layer parallel
   *  orchestration completes. Day-19 wire-up — minimal scaffold here.
   *  Subscribers subscribe to channel `defect.<defectId>` (pattern + auth
   *  to be finalized in Day-19 follow-up). */
  emitDefectRcaReady(
    defectId: string,
    payload: { topHypothesis: string; otelTraceId?: string },
  ): number {
    const channel = `defect.${defectId}`;
    return this.emitToChannel(channel, 'defect.rca_ready', payload);
  }

  /** Emit an `agent_run.complete` event. Subscribers subscribe to
   *  channel `agent_run.<agentRunId>`. Day-19 wire-up. */
  emitAgentRunComplete(
    agentRunId: string,
    payload: { status: string; latencyMs?: number; tokens?: number },
  ): number {
    const channel = `agent_run.${agentRunId}`;
    return this.emitToChannel(channel, 'agent_run.complete', payload);
  }

  /** Internal fanout. Returns number of clients the message was sent to.
   *  Skips clients whose socket is not OPEN (defensive; disconnect hook
   *  should have cleaned them out but races exist). */
  private emitToChannel(
    channel: string,
    event: string,
    payload: unknown,
  ): number {
    const bucket = this.channels.get(channel);
    if (!bucket || bucket.size === 0) return 0;
    const frame = JSON.stringify({ event, data: payload });
    let sent = 0;
    for (const client of bucket) {
      // ws readyState: 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED.
      if (client.readyState === 1) {
        client.send(frame);
        sent += 1;
      }
    }
    return sent;
  }

  /** Validate inbound subscribe/unsubscribe payload shape + extract
   *  `channel`. Throws WsException on any malformedness. */
  private extractChannelOrThrow(payload: unknown): string {
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('channel' in (payload as Record<string, unknown>))
    ) {
      throw new WsException('payload must include `channel` field');
    }
    const channel = (payload as { channel: unknown }).channel;
    if (typeof channel !== 'string' || channel.length === 0) {
      throw new WsException('`channel` must be a non-empty string');
    }
    return channel;
  }

  /** Verify the connecting user has read access to the test_run via
   *  project membership. Single Prisma query (test_run → project →
   *  project_member). Throws WsException with code 4403 message on
   *  any access failure (run not found, user not a member). */
  private async assertCanReadRun(
    runId: string,
    appUserId: string,
  ): Promise<void> {
    // findFirst with a member-scoped where clause: if the user is NOT
    // a member of the run's project, the result is null.
    const run = await this.prisma.testRun.findFirst({
      where: {
        id: runId,
        project: {
          members: { some: { userId: appUserId } },
        },
      },
      select: { id: true },
    });
    if (!run) {
      throw new WsException(`forbidden: run ${runId} not accessible`);
    }
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
