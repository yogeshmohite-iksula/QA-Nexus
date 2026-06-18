// QA Nexus PM1 — HealthLiteController spec.
//
// Day-32 Neon-incident belt-and-suspenders endpoint. Asserts the two
// properties that make it safe as the canonical keep-alive target:
//   1. zero-dependency constructor → DB-free by construction
//   2. memory-only response shape, returns in <50ms (no I/O)

import 'reflect-metadata';
import { HealthLiteController } from '../health-lite.controller';

describe('HealthLiteController (/health/lite — DB-free keep-alive)', () => {
  it('has a zero-dependency constructor (no service injection → cannot touch the DB)', () => {
    const params = Reflect.getMetadata(
      'design:paramtypes',
      HealthLiteController,
    ) as unknown[] | undefined;
    expect(params === undefined || params.length === 0).toBe(true);
  });

  it('returns { status:"ok", uptime, ts } from process memory, in <50ms', () => {
    const ctrl = new HealthLiteController();
    const before = Date.now();
    const res = ctrl.lite();
    const elapsedMs = Date.now() - before;

    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(res.uptime).toBeGreaterThanOrEqual(0);
    // ts is a valid round-trippable ISO timestamp
    expect(res.ts).toBe(new Date(res.ts).toISOString());
    // memory-only → effectively instant (generous bound for slow CI)
    expect(elapsedMs).toBeLessThan(50);
  });
});
