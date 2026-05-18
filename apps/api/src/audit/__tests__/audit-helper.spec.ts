// Unit tests for writeAuditRow — the kernel of the HMAC-SHA256 chained
// audit log (CLAUDE.md Hard Rule 7 + PM1_ERD §3.13).
//
// Strategy: stub Prisma's $transaction (passes a fake tx into the callback
// + captures the raw lock + findFirst + auditLog.create calls). This
// exercises the real chain logic — canonical JSON, HMAC computation,
// genesis vs link case, secret-validation guard — without a live DB.
//
// The chain is binding: a missed audit row is a Sev-2 incident. These
// tests pin the contract.
import { createHmac } from 'node:crypto';
import { writeAuditRow } from '../audit-helper';

// 32+ char dummy. Real value lives in .env, set per-test below to confirm
// the secret-validation guard fires.
const TEST_SECRET = 'a'.repeat(64);
const GENESIS = '0'.repeat(64);

function makeTx(opts: { previousThisHash: string | null; newRowId?: string }) {
  const created: any[] = [];
  const lockCalls: string[] = [];
  const tx = {
    $executeRawUnsafe: jest.fn(async (sql: string) => {
      lockCalls.push(sql);
      return 1;
    }),
    auditLog: {
      findFirst: jest.fn(async () =>
        opts.previousThisHash ? { thisHash: opts.previousThisHash } : null,
      ),
      create: jest.fn(async ({ data, select: _ }: any) => {
        const row = {
          id: opts.newRowId ?? 'row-1',
          prevHash: data.prevHash,
          thisHash: data.thisHash,
        };
        created.push(data);
        return row;
      }),
    },
  };
  return { tx, created, lockCalls };
}

function makePrisma(tx: any) {
  return {
    $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(tx)),
  } as any;
}

describe('writeAuditRow — HMAC chain integrity', () => {
  // Day-21 Kimi-K2 HIGH triage (c): secret is now passed by caller via params,
  // not read from process.env. baseParams includes the test secret so the
  // happy-path tests don't need to set it explicitly per call.
  const baseParams = {
    workspaceId: '11111111-2222-3333-4444-555555555555',
    actorId: 'actor-1',
    entityType: 'project',
    entityId: 'p-1',
    action: 'project_created',
    payload: { hello: 'world', n: 1 },
    secret: TEST_SECRET,
  };

  it('genesis row uses 0*64 as prevHash + correct HMAC over canonical(payload)', async () => {
    const { tx, created, lockCalls } = makeTx({ previousThisHash: null });
    const result = await writeAuditRow(makePrisma(tx), baseParams);

    // Advisory lock taken first
    expect(lockCalls.length).toBe(1);
    expect(lockCalls[0]).toContain('pg_advisory_xact_lock');

    // Genesis prev_hash + HMAC matches the spec
    const expectedHash = createHmac('sha256', TEST_SECRET)
      .update(GENESIS + '{"hello":"world","n":1}')
      .digest('hex');
    expect(created[0].prevHash).toBe(GENESIS);
    expect(created[0].thisHash).toBe(expectedHash);
    expect(result.thisHash).toBe(expectedHash);
    expect(result.prevHash).toBe(GENESIS);
  });

  it('subsequent row chains: prev_hash = previous row this_hash', async () => {
    const PREV = 'b'.repeat(64);
    const { tx, created } = makeTx({ previousThisHash: PREV });
    const result = await writeAuditRow(makePrisma(tx), baseParams);

    const expectedHash = createHmac('sha256', TEST_SECRET)
      .update(PREV + '{"hello":"world","n":1}')
      .digest('hex');
    expect(created[0].prevHash).toBe(PREV);
    expect(result.thisHash).toBe(expectedHash);
  });

  it('canonicalJson normalises key order (same hash for re-ordered payload keys)', async () => {
    const { tx: tx1, created: c1 } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx1), {
      ...baseParams,
      payload: { hello: 'world', n: 1 },
    });
    const { tx: tx2, created: c2 } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx2), {
      ...baseParams,
      payload: { n: 1, hello: 'world' }, // reordered
    });
    expect(c1[0].thisHash).toBe(c2[0].thisHash);
  });

  it('different payload → different hash', async () => {
    const { tx: tx1, created: c1 } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx1), {
      ...baseParams,
      payload: { x: 1 },
    });
    const { tx: tx2, created: c2 } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx2), {
      ...baseParams,
      payload: { x: 2 },
    });
    expect(c1[0].thisHash).not.toBe(c2[0].thisHash);
  });

  it('different secret → different hash (guards against secret-rotation collisions)', async () => {
    const { tx: tx1, created: c1 } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx1), baseParams);

    const { tx: tx2, created: c2 } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx2), {
      ...baseParams,
      secret: 'b'.repeat(64),
    });

    expect(c1[0].thisHash).not.toBe(c2[0].thisHash);
  });

  it('throws if secret param is missing (Day-21 Kimi-c — param, not env)', async () => {
    const { tx } = makeTx({ previousThisHash: null });
    await expect(
      writeAuditRow(makePrisma(tx), {
        ...baseParams,
        secret: undefined as unknown as string,
      }),
    ).rejects.toThrow(/secret missing/);
  });

  it('throws if secret param is too short (<32 chars)', async () => {
    const { tx } = makeTx({ previousThisHash: null });
    await expect(
      writeAuditRow(makePrisma(tx), { ...baseParams, secret: 'short' }),
    ).rejects.toThrow(/too short/);
  });

  it('canonicalJson handles nested objects + arrays + null + non-object values', async () => {
    // Two payloads that should hash identically because canonicalisation
    // recurses into nested objects too.
    const { tx: tx1, created: c1 } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx1), {
      ...baseParams,
      payload: {
        z: null,
        list: [3, 1, { b: 2, a: 1 }],
        nested: { y: 'y', x: 'x' },
      },
    });
    const { tx: tx2, created: c2 } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx2), {
      ...baseParams,
      payload: {
        nested: { x: 'x', y: 'y' }, // reordered nested keys
        list: [3, 1, { a: 1, b: 2 }], // reordered keys inside array element
        z: null,
      },
    });
    expect(c1[0].thisHash).toBe(c2[0].thisHash);
  });

  it('lock key is derived from first 8 hex chars of workspace UUID', async () => {
    const { tx, lockCalls } = makeTx({ previousThisHash: null });
    await writeAuditRow(makePrisma(tx), {
      ...baseParams,
      workspaceId: 'deadbeef-aaaa-bbbb-cccc-dddddddddddd',
    });
    // 'deadbeef' = 0xdeadbeef = 3735928559
    expect(lockCalls[0]).toContain('3735928559');
  });
});
