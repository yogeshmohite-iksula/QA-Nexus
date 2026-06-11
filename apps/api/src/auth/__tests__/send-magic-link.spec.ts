// QA Nexus PM1 — Day-17 PR #137 — sendMagicLink URL emission tests.
//
// Spec: intermediate-confirm-page pattern (followup (bk)). Closes the
// Gmail-prefetch ?error=INVALID_TOKEN issue that PR #130 attempted
// (silent-crashed, fix-forwarded by #132 which removed no-op
// allowedAttempts). BA ≥ 1.6.11 hardcodes atomic single-use per
// GHSA-hc7v-rggr-4hvx, so allowedAttempts can't solve prefetch.
// Canonical fix: emit a neutral FE page URL pointing at
// /verify-magic-link, FE renders a "Confirm Sign In" button,
// token is POSTed only on real user click. Slack/Notion/Linear/
// GitHub all use this pattern.
//
// Mock strategy mirrors t021-auth.config.spec.ts: mock the BA module
// surface; capture the magicLink plugin's sendMagicLink callback from
// the magicLink() factory mock; invoke the captured callback under
// each scenario; assert what gets passed to EmailService.sendMagicLink.
//
// 6 pinning tests (per the brief):
//   1. emits FE confirm-page URL (not BA verify endpoint)
//   2. preserves callbackURL from BA default url
//   3. defaults callbackURL to '/home' when BA url has none
//   4. soft-fallback when FRONTEND_BASE_URL env unset
//   5. URL-encodes special-char tokens (e.g., +, /, =)
//   6. strips trailing slash from FRONTEND_BASE_URL

jest.mock('better-auth', () => ({
  betterAuth: jest.fn(() => ({
    api: {
      signInMagicLink: jest.fn().mockResolvedValue({ status: true }),
      getSession: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ success: true }),
    },
    handler: jest.fn(),
  })),
}));
jest.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: jest.fn(() => ({})),
}));

type MagicLinkOpts = {
  sendMagicLink: (args: {
    email: string;
    url: string;
    token: string;
  }) => Promise<unknown>;
  expiresIn: number;
};

jest.mock('better-auth/plugins', () => ({
  magicLink: jest.fn((opts: MagicLinkOpts) => ({
    __pluginType: 'magicLink',
    __opts: opts,
  })),
  // P0-001 follow-up (#259): auth.config now also pulls customSession from
  // better-auth/plugins. A jest.mock factory REPLACES the real module, so any
  // export it omits resolves `undefined` at the import site — keep this list
  // in sync with auth.config.ts's imports.
  customSession: jest.fn((fn: unknown) => ({
    __pluginType: 'customSession',
    __fn: fn,
  })),
}));
jest.mock('better-auth/next-js', () => ({
  nextCookies: jest.fn(() => ({ __pluginType: 'nextCookies' })),
}));

import { magicLink } from 'better-auth/plugins';
import { buildAuth } from '../auth.config';

const fakePrisma = {
  user: { findUnique: jest.fn() },
  workspace: { findFirst: jest.fn() },
};

const fakeEmail = {
  sendMagicLink: jest.fn().mockResolvedValue({ ok: true }),
  send: jest.fn().mockResolvedValue({ ok: true }),
};

/** Build auth + return the sendMagicLink callback that auth.config
 *  registered with the magicLink plugin. */
function captureSendMagicLink(): (data: {
  email: string;
  url: string;
  token: string;
}) => Promise<unknown> {
  process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
  buildAuth(fakePrisma as never, fakeEmail as never);
  const call = (magicLink as jest.Mock).mock.calls[0][0] as MagicLinkOpts;
  return call.sendMagicLink;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BETTER_AUTH_SECRET = 'a'.repeat(32);
  delete process.env.FRONTEND_BASE_URL;
  fakeEmail.sendMagicLink.mockClear();
});

describe('sendMagicLink — intermediate-confirm-page URL emission (PR #137, followup (bk))', () => {
  // ───────────────────────────────────────────────────────────────────
  // 1. emits FE confirm-page URL (not BA verify endpoint)
  // ───────────────────────────────────────────────────────────────────
  it('emits FE confirm-page URL, not BA verify endpoint', async () => {
    process.env.FRONTEND_BASE_URL = 'https://qa-nexus-web.pages.dev';
    const send = captureSendMagicLink();
    await send({
      email: 'akshay.panchal@iksula.com',
      url: 'https://api.qanexus.iksula.com/auth/magic-link/verify?token=abc&callbackURL=%2Fhome',
      token: 'abc',
    });
    const arg = fakeEmail.sendMagicLink.mock.calls[0][0] as {
      magicLinkUrl: string;
    };
    expect(arg.magicLinkUrl).toMatch(
      /^https:\/\/qa-nexus-web\.pages\.dev\/verify-magic-link\?token=abc/,
    );
    // Explicitly NOT pointing at the BA verify endpoint
    expect(arg.magicLinkUrl).not.toContain('api.qanexus.iksula.com');
    expect(arg.magicLinkUrl).not.toContain('/auth/magic-link/verify');
    // PR #139 — confirm NO `/auth/` prefix on the FE confirm-page URL.
    // FE route lives at `app/(auth)/verify-magic-link/page.tsx`; the
    // `(auth)` is a Next.js route GROUP (parenthesized = NOT part of
    // the URL path per Next.js App Router docs), so the page mounts
    // at `/verify-magic-link`. PR #137 incorrectly emitted
    // `/auth/verify-magic-link` and 404'd in production.
    expect(arg.magicLinkUrl).not.toContain('/auth/verify-magic-link');
  });

  // ───────────────────────────────────────────────────────────────────
  // 2. preserves callbackURL from BA default url
  // ───────────────────────────────────────────────────────────────────
  it('preserves callbackURL parsed from BA default url', async () => {
    process.env.FRONTEND_BASE_URL = 'https://qa-nexus-web.pages.dev';
    const send = captureSendMagicLink();
    await send({
      email: 'x@iksula.com',
      url: 'https://api.qanexus.iksula.com/auth/magic-link/verify?token=t&callbackURL=%2Fprojects%2FRET',
      token: 't',
    });
    const arg = fakeEmail.sendMagicLink.mock.calls[0][0] as {
      magicLinkUrl: string;
    };
    // The original encoded value round-trips through our URL build
    expect(arg.magicLinkUrl).toContain('callbackURL=%2Fprojects%2FRET');
  });

  // ───────────────────────────────────────────────────────────────────
  // 3. defaults callbackURL to '/home' when BA url has none
  // ───────────────────────────────────────────────────────────────────
  it("defaults callbackURL to '/home' when BA url has none", async () => {
    process.env.FRONTEND_BASE_URL = 'https://qa-nexus-web.pages.dev';
    const send = captureSendMagicLink();
    await send({
      email: 'x@iksula.com',
      url: 'https://api.qanexus.iksula.com/auth/magic-link/verify?token=t',
      token: 't',
    });
    const arg = fakeEmail.sendMagicLink.mock.calls[0][0] as {
      magicLinkUrl: string;
    };
    expect(arg.magicLinkUrl).toContain('callbackURL=%2Fhome');
  });

  // ───────────────────────────────────────────────────────────────────
  // 4. soft-fallback when FRONTEND_BASE_URL env unset
  // ───────────────────────────────────────────────────────────────────
  it('soft-fallback to https://qa-nexus-web.pages.dev when FRONTEND_BASE_URL unset', async () => {
    // FRONTEND_BASE_URL deleted by beforeEach
    const send = captureSendMagicLink();
    await send({
      email: 'x@iksula.com',
      url: 'https://api.qanexus.iksula.com/auth/magic-link/verify?token=t&callbackURL=%2Fhome',
      token: 't',
    });
    const arg = fakeEmail.sendMagicLink.mock.calls[0][0] as {
      magicLinkUrl: string;
    };
    expect(arg.magicLinkUrl).toMatch(
      /^https:\/\/qa-nexus-web\.pages\.dev\/verify-magic-link\?token=t/,
    );
  });

  // ───────────────────────────────────────────────────────────────────
  // 5. URL-encodes special-char tokens (e.g., +, /, =)
  // ───────────────────────────────────────────────────────────────────
  it('URL-encodes special-char tokens (round-trips +, /, =)', async () => {
    process.env.FRONTEND_BASE_URL = 'https://qa-nexus-web.pages.dev';
    const send = captureSendMagicLink();
    const trickyToken = 'abc+def/ghi=jkl';
    await send({
      email: 'x@iksula.com',
      url:
        'https://api.qanexus.iksula.com/auth/magic-link/verify?token=' +
        encodeURIComponent(trickyToken),
      token: trickyToken,
    });
    const arg = fakeEmail.sendMagicLink.mock.calls[0][0] as {
      magicLinkUrl: string;
    };
    // Round-trip the URL — extract token, decodeURIComponent, expect original
    const emittedToken = new URL(arg.magicLinkUrl).searchParams.get('token');
    expect(emittedToken).toBe(trickyToken);
  });

  // ───────────────────────────────────────────────────────────────────
  // 6. strips trailing slash from FRONTEND_BASE_URL
  // ───────────────────────────────────────────────────────────────────
  it('strips trailing slash from FRONTEND_BASE_URL', async () => {
    process.env.FRONTEND_BASE_URL = 'https://qa-nexus-web.pages.dev/';
    const send = captureSendMagicLink();
    await send({
      email: 'x@iksula.com',
      url: 'https://api.qanexus.iksula.com/auth/magic-link/verify?token=t&callbackURL=%2Fhome',
      token: 't',
    });
    const arg = fakeEmail.sendMagicLink.mock.calls[0][0] as {
      magicLinkUrl: string;
    };
    // No double-slash before /verify-magic-link
    expect(arg.magicLinkUrl).not.toContain('//verify-magic-link');
    expect(arg.magicLinkUrl).toContain('/verify-magic-link?');
    // Also assert the OLD broken path is NOT present (PR #139 regression pin)
    expect(arg.magicLinkUrl).not.toContain('/auth/verify-magic-link');
  });
});
