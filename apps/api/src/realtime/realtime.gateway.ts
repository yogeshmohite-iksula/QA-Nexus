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
import { Logger, OnModuleInit } from '@nestjs/common';
import type { IncomingMessage } from 'http';
import type { WebSocket, WebSocketServer as WsServer } from 'ws';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Day-21 Kimi-K2 HIGH triage (b) — WS rate limit + connection ceiling.
//
// Without these guards, a single misbehaving client (or attacker) could:
//   - Open arbitrarily many WS connections (memory pressure, fd exhaustion
//     on the Render free dyno which has ~1 GB RAM + limited fd count)
//   - Hammer the upgrade endpoint with auth attempts that each trigger a
//     Prisma session lookup (DB CU-hr burn + amplifies any auth slowness)
//
// Token bucket: per-IP, capacity 10, refill 10/min (i.e. 1 token every 6s).
// Connection ceiling: global cap on concurrent connections; configurable
// via MAX_WS_CONNECTIONS env var, default 100 (well above 8-user pilot but
// catches runaway clients before they exhaust the dyno).
const WS_TOKEN_BUCKET_CAPACITY = 10;
const WS_TOKEN_REFILL_PER_MS = 10 / 60_000; // 10 tokens / 60 s

interface IpBucket {
  tokens: number;
  lastRefillMs: number;
}

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
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(RealtimeGateway.name);
  @WebSocketServer() server!: WsServer;
  /** Channel → subscribed-client-set. Per-process Map; no Redis (Hard Rule 5,
   *  single-instance NestJS dyno). Cleared on client disconnect. */
  private readonly channels = new Map<string, Set<ConnectedClient>>();

  // Day-21 Kimi-K2 HIGH triage (b) — rate limit + connection ceiling.
  /** Global cap on concurrent WS connections. Loaded at boot from
   *  MAX_WS_CONNECTIONS env var (default 100). */
  private maxWsConnections = 100;
  /** Current open connections (including unauthenticated mid-handshake).
   *  Incremented in handleConnection, decremented in handleDisconnect. */
  private connectionCount = 0;
  /** Per-IP token bucket. Map is unbounded but each bucket is small; we
   *  GC stale buckets after 5 min idle to keep size bounded. */
  private readonly ipBuckets = new Map<string, IpBucket>();
  /** Last GC sweep epoch ms — runs lazily on each handleConnection. */
  private lastIpBucketsGcMs = 0;

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const raw = process.env.MAX_WS_CONNECTIONS;
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        this.maxWsConnections = parsed;
      } else {
        this.logger.warn(
          `MAX_WS_CONNECTIONS="${raw}" is not a positive integer — using default ${this.maxWsConnections}`,
        );
      }
    }
    this.logger.log(
      `WS rate limit + ceiling loaded: max_connections=${this.maxWsConnections}, ` +
        `per_ip_bucket_capacity=${WS_TOKEN_BUCKET_CAPACITY}, ` +
        `refill_rate=10/min`,
    );
  }

  /** Refill the per-IP bucket based on elapsed time, then consume 1 token.
   *  Returns true if the connection is allowed; false if the IP is throttled. */
  private consumeIpToken(ip: string): boolean {
    const now = Date.now();
    let bucket = this.ipBuckets.get(ip);
    if (!bucket) {
      bucket = { tokens: WS_TOKEN_BUCKET_CAPACITY, lastRefillMs: now };
      this.ipBuckets.set(ip, bucket);
    } else {
      const elapsed = now - bucket.lastRefillMs;
      const refill = elapsed * WS_TOKEN_REFILL_PER_MS;
      bucket.tokens = Math.min(
        WS_TOKEN_BUCKET_CAPACITY,
        bucket.tokens + refill,
      );
      bucket.lastRefillMs = now;
    }
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  }

  /** GC stale IP buckets to keep the Map bounded. Runs lazily; sweeps
   *  at most once per 60s. Removes buckets idle >5 min (= bucket fully
   *  refilled, no recent attempts). */
  private gcIpBucketsIfDue(): void {
    const now = Date.now();
    if (now - this.lastIpBucketsGcMs < 60_000) return;
    this.lastIpBucketsGcMs = now;
    const staleAfter = now - 5 * 60_000;
    for (const [ip, bucket] of this.ipBuckets) {
      if (bucket.lastRefillMs < staleAfter) this.ipBuckets.delete(ip);
    }
  }

  /** Validate the session at handshake. Reject (close 4401) if no
   *  resolvable session — the client sees a normal close-with-code, not
   *  a generic 1006, so they can react with "please re-auth".
   *
   *  Day-21 Kimi-K2 HIGH triage (b): rate-limit + capacity checks run
   *  BEFORE the auth resolve. This is intentional — auth resolve hits
   *  Prisma (DB cost) so we reject runaway / DoS clients before spending
   *  CU-hr on them. Order: capacity → IP rate-limit → auth → success.
   *
   *  Close codes (per RFC 6455 §7.4 + our 4xxx app-codes):
   *    4408 — per-IP rate limit exceeded
   *    4409 — global capacity exceeded
   *    4401 — unauthenticated (no resolvable session)
   *    4500 — server handshake error */
  async handleConnection(
    client: ConnectedClient,
    req: IncomingMessage,
  ): Promise<void> {
    const ip = this.ipOf(req);
    this.gcIpBucketsIfDue();

    // Capacity check (cheapest — just compare counts).
    if (this.connectionCount >= this.maxWsConnections) {
      this.logger.warn(
        `WS connection rejected: capacity ${this.connectionCount}/${this.maxWsConnections} (ip=${ip})`,
      );
      client.close(4409, 'capacity exceeded');
      return;
    }

    // Per-IP rate limit (token bucket).
    if (!this.consumeIpToken(ip)) {
      this.logger.warn(
        `WS connection rejected: per-IP rate limit (ip=${ip}, capacity=${WS_TOKEN_BUCKET_CAPACITY}/min)`,
      );
      client.close(4408, 'rate limited');
      return;
    }

    // Count this connection now so handleDisconnect's decrement is balanced
    // even if auth resolve crashes mid-flight.
    this.connectionCount += 1;

    try {
      const headers = this.buildHeadersFromRequest(req);
      const session = await this.authService.resolveSession(headers);
      if (!session) {
        this.logger.warn(
          `WS connection rejected: no resolvable session (ip=${ip})`,
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
          `workspace=${session.appUser.workspaceId.slice(0, 8)} ` +
          `(${this.connectionCount}/${this.maxWsConnections})`,
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
    // Day-21 Kimi-K2 HIGH triage (b): decrement connection count. Clamp to
    // 0 to guard against double-disconnect races (ws sends 'close' then
    // 'error' in some failure modes).
    if (this.connectionCount > 0) this.connectionCount -= 1;
    if (client.qaNexus) {
      this.logger.log(
        `WS disconnected: ${client.qaNexus.appUserEmail} (${client.qaNexus.role}) ` +
          `(${this.connectionCount}/${this.maxWsConnections})`,
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
