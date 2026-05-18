// Unit tests for Day-21 Kimi-K2 HIGH triage (a) — open-redirect protection.
//
// The validation kernel lives in callback-url.ts. AuthController consumes it
// at sign-up/sign-in intake AND callback redirect. These tests pin the
// allowlist + relative-path + protocol-relative behavior so a regression
// in the helper can't silently re-open the redirect.

import { parseTrustedOrigins, isTrustedCallbackUrl } from '../callback-url';

describe('parseTrustedOrigins', () => {
  it('returns DEFAULT_DEV_ORIGINS when env is undefined', () => {
    const out = parseTrustedOrigins(undefined);
    expect(out.has('http://localhost:3000')).toBe(true);
  });

  it('returns DEFAULT_DEV_ORIGINS when env is empty string', () => {
    expect(parseTrustedOrigins('').has('http://localhost:3000')).toBe(true);
    expect(parseTrustedOrigins('   ').has('http://localhost:3000')).toBe(true);
  });

  it('parses CSV of origins, normalising to scheme://host[:port]', () => {
    const out = parseTrustedOrigins(
      'https://app.example.com, https://staging.example.com',
    );
    expect(out.size).toBe(2);
    expect(out.has('https://app.example.com')).toBe(true);
    expect(out.has('https://staging.example.com')).toBe(true);
  });

  it('strips path/query/fragment from each entry', () => {
    const out = parseTrustedOrigins(
      'https://app.example.com/some/path?x=1#frag',
    );
    expect(out.has('https://app.example.com')).toBe(true);
    expect(out.has('https://app.example.com/some/path?x=1#frag')).toBe(false);
  });

  it('throws on malformed origin entry (fail-fast at boot)', () => {
    expect(() => parseTrustedOrigins('not-a-url')).toThrow(/invalid entry/);
  });

  it('falls back to DEFAULT_DEV_ORIGINS if all entries are whitespace', () => {
    const out = parseTrustedOrigins(' , , ');
    expect(out.has('http://localhost:3000')).toBe(true);
  });
});

describe('isTrustedCallbackUrl', () => {
  const trusted = new Set(['https://app.example.com', 'http://localhost:3000']);

  it('allows undefined / empty (no redirect requested)', () => {
    expect(isTrustedCallbackUrl(undefined, trusted)).toBe(true);
    expect(isTrustedCallbackUrl('', trusted)).toBe(true);
  });

  it('allows same-origin relative paths starting with single /', () => {
    expect(isTrustedCallbackUrl('/home', trusted)).toBe(true);
    expect(isTrustedCallbackUrl('/projects/123?tab=defects', trusted)).toBe(
      true,
    );
  });

  it('REJECTS protocol-relative URLs (//evil.com is NOT same-origin)', () => {
    expect(isTrustedCallbackUrl('//evil.com', trusted)).toBe(false);
    expect(isTrustedCallbackUrl('//evil.com/path', trusted)).toBe(false);
  });

  it('allows absolute URLs whose origin matches the allowlist', () => {
    expect(isTrustedCallbackUrl('https://app.example.com/home', trusted)).toBe(
      true,
    );
    expect(
      isTrustedCallbackUrl('http://localhost:3000/projects/123?tab=x', trusted),
    ).toBe(true);
  });

  it('REJECTS absolute URLs whose origin is NOT in allowlist (open-redirect)', () => {
    expect(isTrustedCallbackUrl('https://evil.com/home', trusted)).toBe(false);
    expect(
      isTrustedCallbackUrl('https://app.example.com.evil.com', trusted),
    ).toBe(false);
  });

  it('REJECTS malformed URLs', () => {
    expect(isTrustedCallbackUrl('javascript:alert(1)', trusted)).toBe(false);
    expect(isTrustedCallbackUrl('https://', trusted)).toBe(false);
  });

  it('REJECTS scheme mismatch (http vs https on otherwise-trusted host)', () => {
    // Only http://localhost:3000 + https://app.example.com are trusted.
    expect(isTrustedCallbackUrl('http://app.example.com/x', trusted)).toBe(
      false,
    );
    expect(isTrustedCallbackUrl('https://localhost:3000/x', trusted)).toBe(
      false,
    );
  });

  it('REJECTS port mismatch (origin includes port)', () => {
    expect(isTrustedCallbackUrl('http://localhost:8080/x', trusted)).toBe(
      false,
    );
  });
});
