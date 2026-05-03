// Unit tests for AuditService.query() + verifyChain() — M1 Day-6 PM Block 3.
//
// Strategy: stub PrismaService — no real DB writes/reads.
// Pins: cursor pagination, date-range guard, filter AND-ing,
// HMAC chain re-verification (happy path + tampered row case).

import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import { AuditService } from '../audit.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('../audit-helper', () => ({ writeAuditRow: jest.fn() }));

const TEST_SECRET = 'b'.repeat(64);
const GENESIS = '0'.repeat(64);

function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          canonicalJson((obj as Record<string, unknown>)[k]),
      )
      .join(',') +
    '}'
  );
}

/** Build a valid 3-row chain (genesis + 2 links) for verifyChain happy-path test. */
function buildValidChain(secret: string) {
  const rows: Array<{
    id: string;
    prevHash: string;
    thisHash: string;
    payload: Record<string, unknown>;
  }> = [];
  let prev = GENESIS;
  for (let i = 0; i < 3; i++) {
    const payload = { i, msg: `row-${i}` };
    const thisHash = createHmac('sha256', secret)
      .update(prev + canonicalJson(payload))
      .digest('hex');
    rows.push({ id: `row-${i}`, prevHash: prev, thisHash, payload });
    prev = thisHash;
  }
  return rows;
}

describe('AuditService.query()', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditLog: { findMany: jest.fn(), count: jest.fn() },
      user: { findUnique: jest.fn() },
      workspace: { findFirstOrThrow: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AuditService);
  });

  it('happy path — returns items + nextCursor when more exist', async () => {
    // 3 mock rows; limit=2 → first 2 returned, cursor for next page.
    const t = new Date('2026-05-02T10:00:00Z');
    prisma.auditLog.findMany.mockResolvedValueOnce([
      {
        id: 'r1',
        createdAt: new Date(t.getTime() + 2000),
        actorId: 'u-1',
        action: 'invitation_created',
        entityType: 'invitation',
        entityId: 'inv-1',
        payload: { x: 1 },
        prevHash: 'a'.repeat(64),
        thisHash: 'b'.repeat(64),
        actor: { email: 'akshay@iksula.com' },
      },
      {
        id: 'r2',
        createdAt: new Date(t.getTime() + 1000),
        actorId: 'u-1',
        action: 'invitation_revoked',
        entityType: 'invitation',
        entityId: 'inv-1',
        payload: { y: 2 },
        prevHash: 'b'.repeat(64),
        thisHash: 'c'.repeat(64),
        actor: { email: 'akshay@iksula.com' },
      },
      {
        id: 'r3',
        createdAt: new Date(t.getTime()),
        actorId: null,
        action: 'system_seed',
        entityType: 'workspace',
        entityId: null,
        payload: {},
        prevHash: 'c'.repeat(64),
        thisHash: 'd'.repeat(64),
        actor: null,
      },
    ]);

    const out = await service.query('ws-1', { limit: 2 });
    expect(out.items).toHaveLength(2);
    expect(out.items[0]).toMatchObject({
      id: 'r1',
      actorEmail: 'akshay@iksula.com',
      action: 'invitation_created',
    });
    expect(out.items[2]).toBeUndefined();
    expect(out.nextCursor).not.toBeNull(); // there's a 3rd row pending
    // Cursor decodes to ISO|UUID
    const decoded = Buffer.from(out.nextCursor!, 'base64').toString('utf8');
    expect(decoded).toMatch(/T[\d:.]+Z\|r2$/);
  });

  it('last page — nextCursor is null', async () => {
    prisma.auditLog.findMany.mockResolvedValueOnce([
      {
        id: 'r1',
        createdAt: new Date(),
        actorId: null,
        action: 'x',
        entityType: 'y',
        entityId: null,
        payload: {},
        prevHash: 'a'.repeat(64),
        thisHash: 'b'.repeat(64),
        actor: null,
      },
    ]);
    const out = await service.query('ws-1', { limit: 50 });
    expect(out.items).toHaveLength(1);
    expect(out.nextCursor).toBeNull();
  });

  it('filters AND together (action + userId)', async () => {
    prisma.auditLog.findMany.mockResolvedValueOnce([]);
    await service.query('ws-1', {
      userId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      action: 'invitation_revoked',
      limit: 50,
    });
    const where = (prisma.auditLog.findMany.mock.calls[0][0] as any).where;
    expect(where.actorId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(where.action).toBe('invitation_revoked');
    expect(where.workspaceId).toBe('ws-1');
  });

  it('rejects date window > 30 days', async () => {
    await expect(
      service.query('ws-1', {
        from: '2026-01-01T00:00:00Z',
        to: '2026-03-01T00:00:00Z', // 59 days later
      }),
    ).rejects.toThrow(/window must be ≤ 30 days/);
  });

  it('cursor decoding skips malformed input + treats as no-cursor', async () => {
    prisma.auditLog.findMany.mockResolvedValueOnce([]);
    await service.query('ws-1', { cursor: 'not-base64-#$%', limit: 50 });
    const where = (prisma.auditLog.findMany.mock.calls[0][0] as any).where;
    // No OR clause means the cursor was ignored
    expect(where.OR).toBeUndefined();
  });
});

describe('AuditService.verifyChain()', () => {
  let service: AuditService;
  let prisma: any;
  const ORIG = process.env.BETTER_AUTH_SECRET;

  beforeEach(async () => {
    process.env.BETTER_AUTH_SECRET = TEST_SECRET;
    prisma = {
      auditLog: { findMany: jest.fn(), count: jest.fn() },
      user: { findUnique: jest.fn() },
      workspace: { findFirstOrThrow: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AuditService);
  });
  afterAll(() => {
    if (ORIG === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = ORIG;
  });

  it('valid chain → valid=true, brokenAtId=null', async () => {
    const rows = buildValidChain(TEST_SECRET);
    prisma.auditLog.count.mockResolvedValueOnce(rows.length);
    prisma.auditLog.findMany.mockResolvedValueOnce(rows);
    const out = await service.verifyChain('ws-1');
    expect(out.valid).toBe(true);
    expect(out.brokenAtId).toBeNull();
    expect(out.totalRows).toBe(3);
    expect(out.verifiedRows).toBe(3);
    expect(out.truncated).toBe(false);
  });

  it('tampered payload → valid=false, brokenAtId=tampered row', async () => {
    const rows = buildValidChain(TEST_SECRET);
    // Mutate row 1's payload AFTER hash computation — simulates tampering.
    rows[1].payload = { i: 999, msg: 'tampered' };
    prisma.auditLog.count.mockResolvedValueOnce(rows.length);
    prisma.auditLog.findMany.mockResolvedValueOnce(rows);
    const out = await service.verifyChain('ws-1');
    expect(out.valid).toBe(false);
    expect(out.brokenAtId).toBe('row-1');
    expect(out.verifiedRows).toBe(1); // row-0 verified, row-1 broke
  });

  it('broken chain link → valid=false', async () => {
    const rows = buildValidChain(TEST_SECRET);
    // Mutate row 2's prevHash — chain link broken.
    rows[2].prevHash = 'f'.repeat(64);
    prisma.auditLog.count.mockResolvedValueOnce(rows.length);
    prisma.auditLog.findMany.mockResolvedValueOnce(rows);
    const out = await service.verifyChain('ws-1');
    expect(out.valid).toBe(false);
    expect(out.brokenAtId).toBe('row-2');
  });

  it('throws if BETTER_AUTH_SECRET missing', async () => {
    delete process.env.BETTER_AUTH_SECRET;
    prisma.auditLog.count.mockResolvedValueOnce(0);
    prisma.auditLog.findMany.mockResolvedValueOnce([]);
    await expect(service.verifyChain('ws-1')).rejects.toThrow(
      /BETTER_AUTH_SECRET missing/,
    );
  });

  it('truncated=true when totalRows > 10 000', async () => {
    const rows = buildValidChain(TEST_SECRET); // only 3 returned
    prisma.auditLog.count.mockResolvedValueOnce(15_000);
    prisma.auditLog.findMany.mockResolvedValueOnce(rows);
    const out = await service.verifyChain('ws-1');
    expect(out.truncated).toBe(true);
    expect(out.totalRows).toBe(15_000);
    expect(out.verifiedRows).toBe(3);
  });
});
