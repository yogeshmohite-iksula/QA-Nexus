// QA Nexus PM1 — Day-24 P0 ADR-021 — time-range helper unit tests.

import { resolveTimeRange } from '../time-range.helper';

describe('resolveTimeRange', () => {
  const FIXED_NOW = new Date('2026-05-21T12:00:00Z');

  it('sprint kind returns null start + canonical "sprint" key', () => {
    const r = resolveTimeRange({ kind: 'sprint' }, FIXED_NOW);
    expect(r.start).toBeNull();
    expect(r.key).toBe('sprint');
    expect(r.end.getTime()).toBe(FIXED_NOW.getTime());
  });

  it.each([
    ['7d', 7],
    ['30d', 30],
    ['90d', 90],
  ] as const)('%s kind returns now - %d days', (kind, days) => {
    const r = resolveTimeRange({ kind }, FIXED_NOW);
    expect(r.key).toBe(kind);
    expect(r.start).not.toBeNull();
    const elapsedDays =
      (FIXED_NOW.getTime() - (r.start as Date).getTime()) / (24 * 3600_000);
    expect(elapsedDays).toBeCloseTo(days, 5);
  });

  it('custom kind encodes both ISO bounds in the key', () => {
    const r = resolveTimeRange(
      {
        kind: 'custom',
        start: '2026-04-01T00:00:00.000Z',
        end: '2026-04-30T23:59:59.000Z',
      },
      FIXED_NOW,
    );
    expect(r.key).toBe(
      'custom:2026-04-01T00:00:00.000Z..2026-04-30T23:59:59.000Z',
    );
    expect((r.start as Date).toISOString()).toBe('2026-04-01T00:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-04-30T23:59:59.000Z');
  });

  it('rejects custom range with end <= start', () => {
    expect(() =>
      resolveTimeRange(
        {
          kind: 'custom',
          start: '2026-04-30T00:00:00.000Z',
          end: '2026-04-01T00:00:00.000Z',
        },
        FIXED_NOW,
      ),
    ).toThrow(/end.*after.*start/i);
  });

  it('same canonical key for same inputs (UPSERT idempotency)', () => {
    const a = resolveTimeRange({ kind: '30d' }, FIXED_NOW);
    const b = resolveTimeRange({ kind: '30d' }, FIXED_NOW);
    expect(a.key).toBe(b.key);
  });
});
