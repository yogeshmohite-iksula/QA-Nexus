// Regression coverage for resolveCookieConfig — the per-topology cookie policy
// at the heart of the P0-001 fix (2026-06-07). Three deployment topologies must
// each emit the correct { crossSubDomain, useSecure, sameSite } so the browser
// stores + sends the BetterAuth session cookie.
//
// Day-29 cleanup: this spec lands alongside the *.qanexus.iksula.com shared-
// parent migration so both topologies (Lax shared-parent + None cross-site)
// stay regression-covered when we flip back. See
// docs/pilot-prep/2026-06-07-p0-001-cookie-cors-root-cause-be.md.
import { resolveCookieConfig } from '../auth.config';

// resolveCookieConfig is a pure function, but it lives in auth.config.ts which
// imports better-auth (ESM-only — jest's CJS transform can't parse the .mjs).
// Mock the better-auth surface with factories so importing auth.config.ts never
// loads the real ESM module. resolveCookieConfig touches none of it.
jest.mock('better-auth', () => ({ betterAuth: jest.fn() }));
jest.mock('better-auth/adapters/prisma', () => ({ prismaAdapter: jest.fn() }));
jest.mock('better-auth/plugins', () => ({ magicLink: jest.fn() }));
jest.mock('better-auth/next-js', () => ({ nextCookies: jest.fn() }));

describe('resolveCookieConfig (P0-001 cross-site cookie topology)', () => {
  const ORIGINAL = process.env.BETTER_AUTH_COOKIE_DOMAIN;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.BETTER_AUTH_COOKIE_DOMAIN;
    else process.env.BETTER_AUTH_COOKIE_DOMAIN = ORIGINAL;
  });

  it('(1) local dev (http) → host-only, insecure, SameSite=Lax', () => {
    delete process.env.BETTER_AUTH_COOKIE_DOMAIN;
    const c = resolveCookieConfig('http://localhost:3001');
    expect(c.crossSubDomain.enabled).toBe(false);
    expect(c.useSecure).toBe(false);
    expect(c.sameSite).toBe('lax');
  });

  it('(2) shared-parent zone (https *.qanexus.iksula.com) → wildcard Domain, secure, SameSite=Lax', () => {
    delete process.env.BETTER_AUTH_COOKIE_DOMAIN;
    const c = resolveCookieConfig('https://api.qanexus.iksula.com');
    expect(c.crossSubDomain).toEqual({
      enabled: true,
      domain: '.qanexus.iksula.com',
    });
    expect(c.useSecure).toBe(true);
    expect(c.sameSite).toBe('lax');
  });

  it('(3) cross-site pilot (https onrender.com) → host-only (no Domain), secure, SameSite=None [P0-001 FIX]', () => {
    delete process.env.BETTER_AUTH_COOKIE_DOMAIN;
    const c = resolveCookieConfig('https://qa-nexus-api.onrender.com');
    expect(c.crossSubDomain.enabled).toBe(false);
    expect(c.crossSubDomain.domain).toBeUndefined();
    expect(c.useSecure).toBe(true);
    expect(c.sameSite).toBe('none');
  });

  it('BETTER_AUTH_COOKIE_DOMAIN override forces the shared-parent branch even on a cross-site host', () => {
    process.env.BETTER_AUTH_COOKIE_DOMAIN = '.example.com';
    const c = resolveCookieConfig('https://qa-nexus-api.onrender.com');
    expect(c.crossSubDomain).toEqual({ enabled: true, domain: '.example.com' });
    expect(c.useSecure).toBe(true);
    expect(c.sameSite).toBe('lax');
  });

  it('malformed https URL → safe cross-site default (host-only, SameSite=None, Secure)', () => {
    delete process.env.BETTER_AUTH_COOKIE_DOMAIN;
    const c = resolveCookieConfig('https://');
    expect(c.crossSubDomain.enabled).toBe(false);
    expect(c.useSecure).toBe(true);
    expect(c.sameSite).toBe('none');
  });
});
