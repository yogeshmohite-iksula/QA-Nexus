// QA Nexus PM1 — Production /health smoke test (Day-4 afternoon hotfix-3).
//
// Asserts the deployed Render API has `embedding.status === "up"` with
// `warm: true`. Specifically catches the regression that caused
// hotfix-3: pnpm config split across two `pnpm` keys in root
// package.json silently dropped `onlyBuiltDependencies` (last-key-wins
// in JSON), so sharp's native binary never built on Render Linux x64,
// embedding stayed deferred forever. Future package.json edits that
// re-introduce the split will be caught by this assertion.
//
// Skipped by default — only runs when PROD_SMOKE_URL is set in env so
// CI + local pnpm test stay green. The two intended invocation modes:
//
//   1. Manual smoke after a deploy:
//      PROD_SMOKE_URL=https://qa-nexus-api.onrender.com \
//        pnpm --filter @qa-nexus/api test:e2e -- --testPathPattern=smoke
//
//   2. Scheduled GitHub Actions check (future, post-T015 UptimeRobot):
//      env.PROD_SMOKE_URL set as repo secret; cron runs daily.

const SMOKE_URL = process.env.PROD_SMOKE_URL;

// Use describe.skip when env unset so jest --passWithNoTests still
// reports the suite as PASS (no failures, just nothing to run).
const maybeDescribe = SMOKE_URL ? describe : describe.skip;

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  db: { status: string };
  embedding:
    | {
        status: 'up';
        warm: boolean;
        load_duration_ms: number | null;
        model_id: string;
      }
    | { status: 'deferred'; reason: string; model_id: string }
    | { status: 'down'; error: string };
  llm: unknown;
  r2: unknown;
  quota: { neon_pct: number | null };
  otel: unknown;
}

async function fetchHealth(url: string): Promise<{
  status: number;
  body: HealthResponse;
}> {
  const res = await fetch(url);
  const body = (await res.json()) as HealthResponse;
  return { status: res.status, body };
}

// Sentinel test always runs so jest doesn't fail with "test file produces
// zero tests" when PROD_SMOKE_URL is unset (the common local + CI case).
describe('PROD smoke: harness', () => {
  it(
    SMOKE_URL
      ? `running against ${SMOKE_URL}`
      : 'PROD_SMOKE_URL unset — skipping live assertions (set env to enable)',
    () => {
      expect(true).toBe(true);
    },
  );
});

maybeDescribe('PROD smoke: /health', () => {
  it('returns HTTP 200', async () => {
    const r = await fetchHealth(`${SMOKE_URL}/health`);
    expect(r.status).toBe(200);
  }, 30_000);

  it('overall status is "ok" (not degraded, not down)', async () => {
    const r = await fetchHealth(`${SMOKE_URL}/health`);
    expect(r.body.status).toBe('ok');
  }, 30_000);

  it('db subsystem is up', async () => {
    const r = await fetchHealth(`${SMOKE_URL}/health`);
    expect(r.body.db.status).toBe('up');
  }, 30_000);

  it('embedding subsystem is up + warm (catches sharp regression)', async () => {
    const r = await fetchHealth(`${SMOKE_URL}/health`);
    // The full failure mode this catches: pnpm.onlyBuiltDependencies
    // dropped → sharp install script blocked → native binary missing
    // on Linux x64 → embedding stays "deferred" forever. Hotfix-3
    // (2026-04-30) merged the split `pnpm` keys to fix it.
    if (r.body.embedding.status !== 'up') {
      const detail =
        r.body.embedding.status === 'deferred'
          ? `deferred — reason: ${r.body.embedding.reason}`
          : r.body.embedding.status === 'down'
            ? `down — error: ${r.body.embedding.error}`
            : 'unknown shape';
      throw new Error(
        `Expected embedding.status="up" but got ${r.body.embedding.status}. ` +
          `Likely a regression of the pnpm.onlyBuiltDependencies split-key bug. ` +
          `Verify root package.json has a SINGLE "pnpm" key with both "onlyBuiltDependencies" ` +
          `and "overrides" inside it. Detail: ${detail}`,
      );
    }
    expect(r.body.embedding).toMatchObject({
      status: 'up',
      warm: true,
    });
  }, 30_000);

  it('quota is well under free-tier cap', async () => {
    const r = await fetchHealth(`${SMOKE_URL}/health`);
    if (r.body.quota.neon_pct !== null) {
      expect(r.body.quota.neon_pct).toBeLessThan(90);
    }
  }, 30_000);
});
