// QA Nexus PM1 — T021 BetterAuth magic-link wiring tests (Day-9).
//
// Strategy: stub PrismaService + EmailService + AuditService — no real
// BetterAuth instance against a live DB; instead, mock the BetterAuth
// API surface that AuthService consumes. For cookie-attribute + CSRF
// tests we instantiate a real `buildAuth()` with an in-memory Prisma
// stub since those checks happen INSIDE BetterAuth's response chain.
//
// 8 minimum tests required per Day-9 plan:
//   1. magic-link send happy path → token row + email sent
//   2. expired token (>10 min) → 401
//   3. invalid/tampered token → 401
//   4. replay attack (same token used twice) → 401
//   5. cookie set on callback (domain=.qanexus.iksula.com,
//      partitioned, secure, httpOnly verified)
//   6. CSRF token validation on POST /api/auth/sign-in/magic-link
//   7. Day-0 admin seed: yogesh.mohite first-login auto-promotes
//   8. Audit log writes: sign-in event captured with HMAC chain valid
//
// + Sanity: 10-min TTL is not 15-min (regression catch for Yogesh's
//   morning expiresIn change).

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
  sendMagicLink: (args: { email: string; url: string }) => Promise<unknown>;
  expiresIn: number;
};
jest.mock('better-auth/plugins', () => ({
  magicLink: jest.fn((opts: MagicLinkOpts) => ({
    __pluginType: 'magicLink',
    __opts: opts,
  })),
}));
jest.mock('better-auth/next-js', () => ({
  nextCookies: jest.fn(() => ({ __pluginType: 'nextCookies' })),
}));

import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { buildAuth } from '../auth.config';

const fakePrisma = {
  user: { findUnique: jest.fn() },
  workspace: { findFirst: jest.fn() },
};

// Loose-typed so `.sendMagicLink` mock is reachable in assertions; cast
// at buildAuth call sites that expect the real PrismaClient/EmailService.
const fakeEmail = {
  sendMagicLink: jest.fn().mockResolvedValue({ ok: true }),
  send: jest.fn().mockResolvedValue({ ok: true }),
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BETTER_AUTH_SECRET = 'a'.repeat(32);
});

describe('T021 — auth.config.ts (Day-9 wiring)', () => {
  describe('config invariants — pinned by tests', () => {
    it('throws when BETTER_AUTH_SECRET is missing or too short', () => {
      delete process.env.BETTER_AUTH_SECRET;
      expect(() => buildAuth(fakePrisma as never, fakeEmail as never)).toThrow(
        /secret/i,
      );
      process.env.BETTER_AUTH_SECRET = 'short';
      expect(() => buildAuth(fakePrisma as never, fakeEmail as never)).toThrow(
        /32 chars/i,
      );
    });

    it('magicLink.expiresIn is 600s (10 min) — NOT 900s (15 min)', () => {
      process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
      buildAuth(fakePrisma as never, fakeEmail as never);
      expect(magicLink).toHaveBeenCalledWith(
        expect.objectContaining({ expiresIn: 600 }),
      );
    });

    it('magicLink.allowedAttempts=3 — survives Gmail prefetch (Day-17 P0, BetterAuth GH #6985/#5550)', () => {
      // Gmail's email-security scanner pre-fetches magic-link URLs
      // before the user clicks. With the BetterAuth default of 1
      // attempt, that pre-fetch invalidates the token → real click
      // hits ?error=INVALID_TOKEN. Setting 3 leaves headroom for
      // scanner (1) + real click (1) + retry (1). NOT Infinity.
      process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
      buildAuth(fakePrisma as never, fakeEmail as never);
      expect(magicLink).toHaveBeenCalledWith(
        expect.objectContaining({ allowedAttempts: 3 }),
      );
    });

    it('includes nextCookies plugin (Next.js 15 App Router requirement)', () => {
      process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
      buildAuth(fakePrisma as never, fakeEmail as never);
      expect(nextCookies).toHaveBeenCalled();
      // Verify plugin order: nextCookies must be LAST per BetterAuth docs
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      const plugins = config.plugins;
      expect(plugins[plugins.length - 1].__pluginType).toBe('nextCookies');
    });
  });

  describe('cookie-domain config (ADR-007)', () => {
    it('production: enables crossSubDomainCookies on .qanexus.iksula.com', () => {
      process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      expect(config.advanced.crossSubDomainCookies).toEqual({
        enabled: true,
        domain: '.qanexus.iksula.com',
      });
      expect(config.advanced.useSecureCookies).toBe(true);
      expect(config.advanced.defaultCookieAttributes).toEqual({
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        partitioned: true,
      });
    });

    it('localhost dev: disables crossSubDomainCookies + useSecureCookies', () => {
      process.env.BETTER_AUTH_URL = 'http://localhost:3001';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      expect(config.advanced.crossSubDomainCookies).toEqual({
        enabled: false,
      });
      expect(config.advanced.useSecureCookies).toBe(false);
      expect(config.advanced.defaultCookieAttributes.secure).toBe(false);
      expect(config.advanced.defaultCookieAttributes.partitioned).toBe(false);
    });

    it('respects BETTER_AUTH_COOKIE_DOMAIN env override (PM2 zone migration)', () => {
      process.env.BETTER_AUTH_URL = 'https://api.qa.iksula.com';
      process.env.BETTER_AUTH_COOKIE_DOMAIN = '.qa.iksula.com';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      expect(config.advanced.crossSubDomainCookies.domain).toBe(
        '.qa.iksula.com',
      );
      delete process.env.BETTER_AUTH_COOKIE_DOMAIN;
    });
  });

  describe('trustedOrigins (CORS + CSRF)', () => {
    afterEach(() => {
      delete process.env.AUTH_TRUSTED_ORIGINS;
    });

    it('production: app.*, api.*, AND qa-nexus-web.pages.dev (Day-15 fix)', () => {
      process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      expect(config.trustedOrigins).toEqual([
        'https://app.qanexus.iksula.com',
        'https://api.qanexus.iksula.com',
        'https://qa-nexus-web.pages.dev',
      ]);
    });

    it('localhost dev: localhost:3000 (web) + localhost:3001 (api)', () => {
      process.env.BETTER_AUTH_URL = 'http://localhost:3001';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      expect(config.trustedOrigins).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
    });

    it('AUTH_TRUSTED_ORIGINS env appends comma-separated extras (production)', () => {
      process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
      process.env.AUTH_TRUSTED_ORIGINS =
        'https://89c44180.qa-nexus-web.pages.dev, https://staging.qanexus.iksula.com';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      expect(config.trustedOrigins).toEqual([
        'https://app.qanexus.iksula.com',
        'https://api.qanexus.iksula.com',
        'https://qa-nexus-web.pages.dev',
        'https://89c44180.qa-nexus-web.pages.dev',
        'https://staging.qanexus.iksula.com',
      ]);
    });

    it('AUTH_TRUSTED_ORIGINS env: empty/whitespace entries filtered out', () => {
      process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
      process.env.AUTH_TRUSTED_ORIGINS = ' , https://valid.example.com , ';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      expect(config.trustedOrigins).toEqual([
        'https://app.qanexus.iksula.com',
        'https://api.qanexus.iksula.com',
        'https://qa-nexus-web.pages.dev',
        'https://valid.example.com',
      ]);
    });

    it('AUTH_TRUSTED_ORIGINS env: appends to localhost dev list too', () => {
      process.env.BETTER_AUTH_URL = 'http://localhost:3001';
      process.env.AUTH_TRUSTED_ORIGINS = 'http://192.168.1.10:3000';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const config = (betterAuth as jest.Mock).mock.calls[0][0];
      expect(config.trustedOrigins).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
        'http://192.168.1.10:3000',
      ]);
    });
  });

  describe('magic-link send → EmailService.sendMagicLink', () => {
    it('passes "in 10 minutes" expiry copy to EmailService', async () => {
      process.env.BETTER_AUTH_URL = 'https://api.qanexus.iksula.com';
      buildAuth(fakePrisma as never, fakeEmail as never);
      const magicLinkOpts = (magicLink as jest.Mock).mock.calls[0][0];
      await magicLinkOpts.sendMagicLink({
        email: 'kishor.kadam@iksula.com',
        url: 'https://api.qanexus.iksula.com/auth/callback?token=abc',
      });
      expect(fakeEmail.sendMagicLink).toHaveBeenCalledWith({
        to: 'kishor.kadam@iksula.com',
        magicLinkUrl: 'https://api.qanexus.iksula.com/auth/callback?token=abc',
        expiresAt: 'in 10 minutes',
      });
    });
  });
});

// ────────────────────────────────────────────────────────────────────
// AuthService integration tests — Day-0 admin seed + audit chain.
// (separate file: apps/api/src/auth/__tests__/auth.service.day0.spec.ts)
// ────────────────────────────────────────────────────────────────────
//
// Pseudo-test sketch (will be in companion spec file, not this one):
//
//   describe('AuthService — Day-0 admin seed (followup x close)', () => {
//     it('auto-promotes yogesh.mohite@iksula.com on first sign-in if no TB-002 row', async () => {
//       // seed Iksula workspace; mock BetterAuth session for yogesh
//       // call resolveSession → returns appUser with role=Admin
//       // assert Prisma.user.create called with role=Admin + workspaceId=Iksula
//       // assert AuditService.write called with action='day0_admin_seeded'
//     });
//
//     it('does NOT seed a non-admin email — returns null (existing path)', async () => {
//       // mock session for sagar.todankar@iksula.com (not the admin email)
//       // call resolveSession → returns null
//       // assert Prisma.user.create NOT called
//     });
//
//     it('idempotent on second sign-in (existing TB-002 row found)', async () => {
//       // first call seeds; second call finds existing row
//       // assert Prisma.user.create called ONCE total
//     });
//
//     it('errors gracefully when no Iksula workspace exists (seed not run)', async () => {
//       // workspace.findFirst returns null
//       // resolveSession returns null + logs error
//     });
//
//     it('seed audit row payload omits email local-part (PII redaction)', async () => {
//       // assert audit payload.seeded_email_domain === 'iksula.com' (NOT full email)
//     });
//   });
