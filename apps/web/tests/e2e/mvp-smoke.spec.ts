// MVP new-user journey smoke suite — pilot Mon 2026-06-08.
//
// Sun 2026-06-07 Phase 4 Section R. 12 critical tests covering the canonical
// shell + P0 page render + core interactions. Behavioral (DOM + interaction),
// NOT screenshot VR. Target runtime < 2 min.
//
// Selectors align to the canonical AdminShell shipped in PR #247
// (shell-topbar-widgets.tsx aria-labels). These tests assert the shell +
// page RENDER correctly — they are resilient to the stub-vs-live data
// question (Section Q) because they check structure + canonical strings,
// not workspace-specific counts.
//
// Run: pnpm --filter web exec playwright test --config=tests/e2e/playwright.config.ts

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('MVP Smoke — new-user journey', () => {
  test('1. Sign-in page renders an input', async ({ page }) => {
    await page.goto(`${BASE}/sign-in/`);
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('2. Home page loads + canonical shell header', async ({ page }) => {
    await page.goto(`${BASE}/home/`);
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('3. Topbar canonical widgets present on Home', async ({ page }) => {
    await page.goto(`${BASE}/home/`);
    await expect(page.locator('[aria-label*="Switch project"]')).toBeVisible();
    await expect(page.locator('[aria-label*="Search"]').first()).toBeVisible();
    // Scope to button — Sonner's toast <section aria-label="Notifications ..."> also matches.
    await expect(page.locator('button[aria-label*="Notifications"]')).toBeVisible();
    await expect(page.locator('[aria-label^="Signed in"]')).toBeVisible();
  });

  test('4. Theme toggle flips + persists across reload', async ({ page }) => {
    await page.goto(`${BASE}/home/`);
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.locator('[aria-label*="Switch to"]').click();
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after).not.toBe(before);
    await page.reload();
    const persisted = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(persisted).toBe(after);
    // reset to dark for downstream tests
    if (persisted === 'light') {
      await page.locator('[aria-label*="Switch to"]').click();
    }
  });

  test('5. Cmd+K opens search with input focused', async ({ page }) => {
    await page.goto(`${BASE}/home/`);
    await page.keyboard.press('Meta+K');
    await expect(page.locator('input[placeholder*="Type to filter"]')).toBeFocused();
  });

  test('6. Navigate to Agents page (F26)', async ({ page }) => {
    // Heavy route — dev-mode FIRST compile can exceed 30s (agents-page + 8
    // sub-components + AdminShell). In CI against a built app this is instant.
    // domcontentloaded + a generous assertion budget absorbs the cold compile.
    test.setTimeout(75_000);
    await page.goto(`${BASE}/admin/agents/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    // Target the visible agent-card name (.ag-name) — getByText().first() can
    // resolve to the hidden <AgentName> ⓘ tooltip popover that precedes it.
    await expect(page.locator('.ag-name').first()).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('.ag-name').first()).toContainText(/Composer/i);
  });

  test('7. Users page shows canonical roster', async ({ page }) => {
    await page.goto(`${BASE}/admin/users/`);
    // Roster shows the 8-person canon; current user renders as "Yogesh M. (you)".
    // Assert two stable roster names (not the current-user row).
    await expect(page.getByText(/Akshay Panchal/i).first()).toBeVisible();
    await expect(page.getByText(/Kishor Kadam/i).first()).toBeVisible();
  });

  test('8. Invite User modal route renders (F27m1)', async ({ page }) => {
    await page.goto(`${BASE}/admin/users/invite/`);
    await expect(page.getByText(/Invite to QA Nexus/i).first()).toBeVisible();
  });

  test('9. Provider Setup modal route renders (F26m1)', async ({ page }) => {
    await page.goto(`${BASE}/admin/agents/provider-setup/`);
    await expect(page.getByText(/Groq|Gemini|Custom Provider/i).first()).toBeVisible();
  });

  test('10. Mobile (320px) — hamburger present, rail hidden', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`${BASE}/admin/agents/`);
    await expect(page.locator('[aria-label="Open navigation"]')).toBeVisible();
  });

  test('11. No APP console errors across P0 pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const text = m.text();
      // Ignore environment-dependent network resource-load failures. In dev/CI
      // there is no live API/session, so client calls (BetterAuth session,
      // /api/* data, e.g. /api/projects via fetchWithFallback) fail with
      // `net::ERR_CONNECTION_REFUSED` — the DESIGNED canned-data fallback path,
      // not an app bug. On the deployed pilot the API is up so these never fire.
      if (/Failed to load resource|net::ERR|ERR_CONNECTION/i.test(text)) return;
      errors.push(text);
    });
    for (const route of ['/home/', '/admin/agents/', '/admin/users/', '/admin/settings/']) {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState('networkidle');
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('12. Project switcher shows all 5 Iksula projects', async ({ page }) => {
    await page.goto(`${BASE}/home/`);
    await page.locator('[aria-label*="Switch project"]').click();
    const menu = page.locator('[role="menu"]');
    await expect(menu.getByText('Iksula Returns')).toBeVisible();
    await expect(menu.getByText('Iksula Commerce')).toBeVisible();
    await expect(menu.getByText('Iksula Payments')).toBeVisible();
    await expect(menu.getByText('Iksula Mobile App')).toBeVisible();
    await expect(menu.getByText('Iksula Internal Ops')).toBeVisible();
  });

  test('13. P0-001 regression — /home identity is NOT the removed kishor persona', async ({
    page,
  }) => {
    // Pattern B: /home no longer hardcodes Kishor. Signed-in → real user;
    // dev/CI (no session) → Yogesh fallback. Either way, never "Kishor K.".
    // This test would FAIL on the pre-fix code (initialUserId=kishor).
    await page.goto(`${BASE}/home/`);
    const pill = page.locator('[aria-label^="Signed in"]');
    await expect(pill).toBeVisible();
    await expect(pill).not.toContainText(/Kishor/i);
  });

  // 14. P0-A prod auth-gate. In PRODUCTION a signed-out visitor must be bounced
  // from /admin/* to /sign-in (AdminGuard requires a real session, not the
  // dev/CI fallback persona). This is intentionally a no-op in dev/CI — the
  // fallback persona renders admin so tests 6-9 above work — so this test only
  // runs against a production build/target (PROD_GATE=1 or a *.pages.dev BASE).
  const PROD_GATE = process.env.PROD_GATE === '1' || /pages\.dev/.test(BASE);
  test('14. P0-A prod auth-gate — signed-out /admin redirects to /sign-in', async ({ page }) => {
    test.skip(!PROD_GATE, 'prod-only: dev/CI uses the fallback persona by design');
    await page.goto(`${BASE}/admin/settings/`);
    await page.waitForURL(/\/sign-in/, { timeout: 12_000 });
    expect(page.url()).toMatch(/\/sign-in/);
  });
});
