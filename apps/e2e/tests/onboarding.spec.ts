// QA Nexus PM1 — onboarding smoke spec.
//
// Spec: MS0-T031 + MS0-AC019. Exercises the full FE → BE auth + onboarding
// flow on every PR. **All tests are .skip until T014 Resend lands** the
// real magic-link send (currently EmailService is in stub mode, so the
// magic-link click step has no clickable email).
//
// Once Yogesh provisions Resend per docs/deploy/resend-runbook.md AND
// MAIN sets RESEND_API_KEY in Render env vars, remove the .skip + the
// E2E pipeline runs end-to-end.
//
// Until then, this file:
//   - validates the spec compiles + Playwright config loads
//   - establishes the test shape so future expansion is mechanical
//   - documents the expected user journey
//
// Per CLAUDE.md Rule 12 (RWD): every page-render assertion checks at
// BOTH desktop (1440x900 via 'chromium-desktop' project) and mobile
// (iPhone SE 375x667 via 'mobile-safari' project). Playwright's
// project matrix runs each test once per project automatically.

import { expect, test } from '@playwright/test';

// Use the canonical Iksula pilot user per IKSULA_CONTEXT.md.
// Yogesh = Admin (deployer-admin per Day-0 bootstrap).
const PILOT_USER_EMAIL = 'yogesh.mohite@iksula.com';

test.describe('Founder onboarding flow (F07 + F07b/c/d + F08a)', () => {
  test.skip(
    true,
    'Skipped until MS0-T014 (Resend) wires the real magic-link email. ' +
      'Currently EmailService.sendMagicLink() is in stub mode → no clickable ' +
      'email arrives → magic-link click step cannot proceed. ' +
      'See docs/deploy/resend-runbook.md.',
  );

  test('signed-out user lands on /sign-in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();
  });

  test('sign-in form requires email + triggers magic-link send', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill(PILOT_USER_EMAIL);
    await page.getByRole('button', { name: /authenticate|sign in/i }).click();
    // Expect a "check your email" confirmation
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('clicking magic-link redirects to /onboarding (founder flow)', async ({ page, request }) => {
    // Step 1: trigger magic-link via API directly (faster than form)
    const r = await request.post('/auth/sign-in', {
      data: { email: PILOT_USER_EMAIL },
    });
    expect(r.ok()).toBe(true);

    // Step 2: pull the magic-link token from a test-only endpoint
    // (lands as part of T014; until then the token never reaches the FE)
    // Placeholder shape — adjust signature when T014 endpoint exists:
    //   GET /test/magic-link?email=... → { token: string }
    // const tokenRes = await request.get(
    //   `/test/magic-link?email=${encodeURIComponent(PILOT_USER_EMAIL)}`,
    // );
    // const { token } = await tokenRes.json();
    // await page.goto(`/auth/callback?token=${token}`);

    // Step 3: confirm landed on /onboarding (or /home if user is already onboarded)
    await expect(page).toHaveURL(/\/(onboarding|home)/);
  });

  test('founder onboarding wizard: Step 1 → Step 2 → Step 3 → /home', async ({ page }) => {
    // Assume session cookie set (previous test). Walk the F07 wizard.
    await page.goto('/onboarding');

    // STEP 1 — Organization details (per F07 frame)
    await expect(page.getByRole('heading', { name: /tell us about your team/i })).toBeVisible();
    await page.getByLabel(/workspace name/i).fill('Iksula QA Nexus');
    await page.getByLabel(/anchor project|first project/i).fill('Iksula Returns');
    await page.getByRole('button', { name: /next|continue/i }).click();

    // STEP 2 — Invite team (per F07b/c/d)
    await expect(page.getByRole('heading', { name: /invite your team/i })).toBeVisible();
    // Skip invites for the smoke test; real PM1 user-add lands in M1
    await page.getByRole('button', { name: /skip|continue without/i }).click();

    // STEP 3 — Confirm
    await expect(page.getByRole('heading', { name: /you're all set|confirm/i })).toBeVisible();
    await page.getByRole('button', { name: /create project|complete/i }).click();

    // Expect redirect to /home/<role>
    await expect(page).toHaveURL(/\/home(\/[a-z-]+)?/);
    await expect(page.getByText(/iksula returns/i)).toBeVisible();
  });

  test('signed-in user on /home sees their role-specific dashboard', async ({ page }) => {
    await page.goto('/home');
    // Yogesh = Admin → sees QA Lead view (Lead and Admin share F08b layout)
    // Header should mention the workspace + active project
    await expect(page.getByText(/iksula returns/i)).toBeVisible();
    await expect(page.getByText(/sprint 42/i)).toBeVisible();
  });
});

test.describe('Public health endpoint (no auth)', () => {
  // This test does NOT need T014 — only requires API to be reachable.
  // Keep enabled so we always have at least one passing E2E once CI + API
  // wiring is correct (proves the workflow + Playwright + browser path).
  test('GET /health returns 200 with subsystem readouts', async ({ request }) => {
    // Health endpoint is on the API origin, not the FE origin — use absolute URL
    const apiBase = process.env.E2E_API_BASE_URL ?? 'http://localhost:3001';
    const r = await request.get(`${apiBase}/health`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.status).toMatch(/^(ok|degraded)$/);
    expect(body.db).toBeDefined();
    expect(body.embedding).toBeDefined();
    expect(body.r2).toBeDefined(); // status=deferred until T013 dashboard work
    expect(body.llm).toBeDefined(); // status=deferred until T023 lands
  });
});
