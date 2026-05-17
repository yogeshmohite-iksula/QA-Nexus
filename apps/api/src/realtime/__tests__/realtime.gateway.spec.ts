// QA Nexus PM1 — Day-18 M4 TASK 2 (#148) — RealtimeGateway tests.
//
// Strategy: unit-test the gateway's per-method behaviour with mocked
// AuthService + PrismaService + fake WebSocket clients. Does NOT spin
// up a real ws server (that's E2E territory; later in M4).
//
// 4+ tests per the brief:
//   1. handleConnection rejects (close 4401) when AuthService.resolveSession
//      returns null
//   2. handleConnection attaches qaNexus payload on success
//   3. subscribe('test_run.progress.<runId>') ack-resolves when the user
//      has project-member access (Prisma returns a row)
//   4. subscribe rejects (WsException) when Prisma returns null (no access)
//   5. emitTestRunProgress sends to subscribed clients only, not to
//      others; respects readyState=1 (OPEN) precondition

// IMPORTANT: mock the AuthService module BEFORE importing RealtimeGateway.
// AuthService imports auth.config.ts which imports `better-auth`, an
// ESM-only package that jest's CJS transformer can't load directly
// (same pattern as t021-auth.config.spec.ts). Mocking AuthService at
// the module boundary means the better-auth chain never evaluates.
jest.mock('../../auth/auth.service', () => ({
  AuthService: class {},
}));
jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { WsException } from '@nestjs/websockets';
import { RealtimeGateway } from '../realtime.gateway';

type ClientStub = {
  readyState: number;
  qaNexus?: {
    appUserId: string;
    appUserEmail: string;
    role: string;
    workspaceId: string;
    authUserId: string;
  };
  qaNexusChannels?: Set<string>;
  closeCalls: Array<{ code: number; reason: string }>;
  sendCalls: string[];
  send: jest.Mock;
  close: jest.Mock;
};

function newClient(opts: { readyState?: number } = {}): ClientStub {
  const closeCalls: Array<{ code: number; reason: string }> = [];
  const sendCalls: string[] = [];
  const send = jest.fn((frame: string) => sendCalls.push(frame));
  const close = jest.fn((code: number, reason: string) =>
    closeCalls.push({ code, reason }),
  );
  return {
    readyState: opts.readyState ?? 1, // 1 = OPEN
    closeCalls,
    sendCalls,
    send,
    close,
  };
}

function fakeReq(
  opts: {
    cookie?: string;
    forwardedFor?: string;
    url?: string;
  } = {},
) {
  return {
    headers: {
      cookie: opts.cookie,
      'x-forwarded-for': opts.forwardedFor,
    },
    url: opts.url ?? '/realtime',
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Parameters<RealtimeGateway['handleConnection']>[1];
}

const successSession = {
  appUser: {
    id: 'user-uuid-1',
    email: 'akshay.panchal@iksula.com',
    role: 'Lead',
    workspaceId: 'workspace-uuid-1',
  },
  authUser: { id: 'auth-uuid-1' },
};

describe('RealtimeGateway — M4 TASK 2 (#148)', () => {
  let mockAuth: { resolveSession: jest.Mock };
  let mockPrisma: { testRun: { findFirst: jest.Mock } };
  let gateway: RealtimeGateway;

  beforeEach(() => {
    mockAuth = { resolveSession: jest.fn() };
    mockPrisma = { testRun: { findFirst: jest.fn() } };
    gateway = new RealtimeGateway(mockAuth as never, mockPrisma as never);
  });

  describe('handleConnection — BetterAuth session auth', () => {
    it('rejects (close 4401 unauthenticated) when resolveSession returns null', async () => {
      mockAuth.resolveSession.mockResolvedValue(null);
      const client = newClient();
      await gateway.handleConnection(client as never, fakeReq());

      expect(client.close).toHaveBeenCalledWith(4401, 'unauthenticated');
      expect(client.qaNexus).toBeUndefined();
    });

    it('attaches qaNexus payload to the client on successful session resolve', async () => {
      mockAuth.resolveSession.mockResolvedValue(successSession);
      const client = newClient();
      await gateway.handleConnection(
        client as never,
        fakeReq({ cookie: 'better-auth.session_token=abc' }),
      );

      expect(client.close).not.toHaveBeenCalled();
      expect(client.qaNexus).toEqual({
        appUserId: 'user-uuid-1',
        appUserEmail: 'akshay.panchal@iksula.com',
        role: 'Lead',
        workspaceId: 'workspace-uuid-1',
        authUserId: 'auth-uuid-1',
      });
    });
  });

  describe('subscribe — channel auth + bucket bookkeeping', () => {
    function connectedClient(): ClientStub {
      const c = newClient();
      c.qaNexus = {
        appUserId: 'user-uuid-1',
        appUserEmail: 'akshay.panchal@iksula.com',
        role: 'Lead',
        workspaceId: 'workspace-uuid-1',
        authUserId: 'auth-uuid-1',
      };
      return c;
    }

    it('subscribe.test_run.progress.<runId> ack-resolves when user is a project member', async () => {
      const runId = '11111111-1111-4111-8111-111111111111';
      // Prisma returns a row → user has access
      mockPrisma.testRun.findFirst.mockResolvedValue({ id: runId });
      const client = connectedClient();

      const ack = await gateway.subscribe(
        { channel: `test_run.progress.${runId}` },
        client as never,
      );

      expect(ack.event).toBe('subscribe:ack');
      expect(ack.data.channel).toBe(`test_run.progress.${runId}`);
      expect(mockPrisma.testRun.findFirst).toHaveBeenCalledTimes(1);
      // Prisma where clause must scope by the user's id — defence-in-depth
      const callArg = mockPrisma.testRun.findFirst.mock.calls[0][0];
      expect(callArg.where.id).toBe(runId);
      expect(callArg.where.project.members.some.userId).toBe('user-uuid-1');
    });

    it('subscribe REJECTS (WsException) when Prisma returns null (no project access)', async () => {
      const runId = '22222222-2222-4222-8222-222222222222';
      mockPrisma.testRun.findFirst.mockResolvedValue(null);
      const client = connectedClient();

      await expect(
        gateway.subscribe(
          { channel: `test_run.progress.${runId}` },
          client as never,
        ),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('subscribe REJECTS on unsupported channel pattern', async () => {
      const client = connectedClient();
      await expect(
        gateway.subscribe(
          { channel: 'unknown.something.123' },
          client as never,
        ),
      ).rejects.toBeInstanceOf(WsException);
      // No DB call — we never reached the runId-auth branch
      expect(mockPrisma.testRun.findFirst).not.toHaveBeenCalled();
    });

    it('subscribe REJECTS on malformed payload (missing channel field)', async () => {
      const client = connectedClient();
      await expect(
        gateway.subscribe({} as never, client as never),
      ).rejects.toBeInstanceOf(WsException);
    });
  });

  describe('emitTestRunProgress — channel-scoped fan-out', () => {
    async function connectAndSubscribe(runId: string): Promise<ClientStub> {
      mockAuth.resolveSession.mockResolvedValue(successSession);
      mockPrisma.testRun.findFirst.mockResolvedValue({ id: runId });
      const client = newClient();
      await gateway.handleConnection(client as never, fakeReq());
      await gateway.subscribe(
        { channel: `test_run.progress.${runId}` },
        client as never,
      );
      return client;
    }

    it('emits ONLY to clients subscribed to the target run channel', async () => {
      const runA = '33333333-3333-4333-8333-333333333333';
      const runB = '44444444-4444-4444-8444-444444444444';

      const subA = await connectAndSubscribe(runA);
      const subB = await connectAndSubscribe(runB);

      const sent = gateway.emitTestRunProgress(runA, {
        status: 'running',
        progressPct: 50,
        passed: 5,
        failed: 0,
        blocked: 0,
      });

      expect(sent).toBe(1);
      expect(subA.sendCalls).toHaveLength(1);
      expect(subB.sendCalls).toHaveLength(0);

      // Frame is JSON-encoded { event, data }
      const frame = JSON.parse(subA.sendCalls[0]);
      expect(frame.event).toBe('test_run.progress');
      expect(frame.data.status).toBe('running');
      expect(frame.data.progressPct).toBe(50);
    });

    it('SKIPS clients whose socket is not OPEN (readyState != 1)', async () => {
      const runId = '55555555-5555-4555-8555-555555555555';
      // Connect + subscribe an OPEN client
      const openClient = await connectAndSubscribe(runId);
      // Connect + subscribe a CLOSING client (readyState=2)
      const closingClient = await connectAndSubscribe(runId);
      closingClient.readyState = 2;

      const sent = gateway.emitTestRunProgress(runId, {
        status: 'passed',
      });

      // Only the OPEN one received the frame
      expect(sent).toBe(1);
      expect(openClient.sendCalls).toHaveLength(1);
      expect(closingClient.sendCalls).toHaveLength(0);
    });

    it('emit is a no-op (returns 0) when no clients are subscribed', () => {
      const sent = gateway.emitTestRunProgress(
        '66666666-6666-4666-8666-666666666666',
        { status: 'passed' },
      );
      expect(sent).toBe(0);
    });
  });

  describe('handleDisconnect — channel-bucket cleanup', () => {
    it('removes the client from all channel buckets on disconnect', async () => {
      mockAuth.resolveSession.mockResolvedValue(successSession);
      const runId = '77777777-7777-4777-8777-777777777777';
      mockPrisma.testRun.findFirst.mockResolvedValue({ id: runId });

      const client = newClient();
      await gateway.handleConnection(client as never, fakeReq());
      await gateway.subscribe(
        { channel: `test_run.progress.${runId}` },
        client as never,
      );

      gateway.handleDisconnect(client as never);

      // Subsequent emit to that channel finds zero subscribers
      const sent = gateway.emitTestRunProgress(runId, { status: 'failed' });
      expect(sent).toBe(0);
    });
  });
});
