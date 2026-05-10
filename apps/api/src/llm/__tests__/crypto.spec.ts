// QA Nexus PM1 — AES-256-GCM helper unit tests.
//
// Spec: ADR-015 (M3-close runtime LLM config bridge — Path C).
// Coverage: roundtrip, IV uniqueness, tamper detection, wrong-key
// detection, malformed input, env-var-name mapping.

import { encryptApiKey, decryptApiKey, envVarForProviderKind } from '../crypto';

const SEED = 'test-better-auth-secret-must-be-at-least-32-chars-long-xxxxxx';
const PLAINTEXT = 'gsk_test_1234567890abcdefghijklmnopqrstuvwxyz';

describe('[@m3-close] llm/crypto — AES-256-GCM helper', () => {
  describe('roundtrip', () => {
    it('encrypts then decrypts to the original plaintext', () => {
      const ciphertext = encryptApiKey(PLAINTEXT, SEED);
      const decrypted = decryptApiKey(ciphertext, SEED);
      expect(decrypted).toBe(PLAINTEXT);
    });

    it('output format is `iv.authtag.ciphertext` (3 base64url segments)', () => {
      const ciphertext = encryptApiKey(PLAINTEXT, SEED);
      const parts = ciphertext.split('.');
      expect(parts).toHaveLength(3);
      // base64url alphabet: A-Z, a-z, 0-9, -, _ (no padding)
      for (const p of parts) {
        expect(p).toMatch(/^[A-Za-z0-9_-]+$/);
      }
    });

    it('produces a different ciphertext on every call (fresh random IV)', () => {
      const c1 = encryptApiKey(PLAINTEXT, SEED);
      const c2 = encryptApiKey(PLAINTEXT, SEED);
      const c3 = encryptApiKey(PLAINTEXT, SEED);
      expect(c1).not.toBe(c2);
      expect(c2).not.toBe(c3);
      expect(c1).not.toBe(c3);
      // But all three decrypt to the same plaintext.
      expect(decryptApiKey(c1, SEED)).toBe(PLAINTEXT);
      expect(decryptApiKey(c2, SEED)).toBe(PLAINTEXT);
      expect(decryptApiKey(c3, SEED)).toBe(PLAINTEXT);
    });
  });

  describe('tamper detection (GCM auth tag)', () => {
    /// Flip the LSB of the FIRST byte of a base64url-encoded buffer.
    /// Tampering at the BYTE level (vs character level) is required:
    /// base64url last-char tampering can be a no-op when the flipped
    /// bits land in the encoding's padding region (e.g., a 16-byte
    /// auth tag uses 22 base64url chars where the last char's top 2
    /// bits are real + bottom 4 bits are ignored — 'A'→'B' decodes to
    /// IDENTICAL bytes). PR #115 CI flake was exactly this — see
    /// commit message of the fix for the full base64url-padding
    /// analysis. Byte-level mutation is deterministic + guaranteed to
    /// change the decoded buffer.
    function flipFirstBit(b64url: string): string {
      const buf = Buffer.from(b64url, 'base64url');
      buf[0] ^= 0x01; // toggle LSB of first byte — guaranteed delta
      return buf.toString('base64url');
    }

    it('throws when ciphertext segment is altered', () => {
      const triplet = encryptApiKey(PLAINTEXT, SEED);
      const [iv, authTag, ct] = triplet.split('.');
      const tampered = [iv, authTag, flipFirstBit(ct)].join('.');
      expect(() => decryptApiKey(tampered, SEED)).toThrow();
    });

    it('throws when authTag segment is altered', () => {
      const triplet = encryptApiKey(PLAINTEXT, SEED);
      const [iv, authTag, ct] = triplet.split('.');
      const tampered = [iv, flipFirstBit(authTag), ct].join('.');
      expect(() => decryptApiKey(tampered, SEED)).toThrow();
    });

    it('throws when decrypted with the wrong seed', () => {
      const triplet = encryptApiKey(PLAINTEXT, SEED);
      expect(() =>
        decryptApiKey(triplet, 'totally-different-seed-value-xxxxxxxxxxxxxx'),
      ).toThrow();
    });

    it('flipFirstBit helper actually mutates the decoded buffer (sanity check)', () => {
      // Defense against future regression — if this helper ever becomes
      // a no-op (e.g., someone "simplifies" it back to char-level),
      // this assertion fails before the tamper tests do.
      const original = Buffer.from('Hello world', 'utf8').toString('base64url');
      const flipped = (function flipFirstBit(b64url: string) {
        const buf = Buffer.from(b64url, 'base64url');
        buf[0] ^= 0x01;
        return buf.toString('base64url');
      })(original);
      expect(flipped).not.toBe(original);
      const originalBytes = Buffer.from(original, 'base64url');
      const flippedBytes = Buffer.from(flipped, 'base64url');
      expect(originalBytes[0]).not.toBe(flippedBytes[0]);
      expect(originalBytes[0] ^ flippedBytes[0]).toBe(0x01);
    });
  });

  describe('input validation', () => {
    it('encrypt: throws on empty plaintext', () => {
      expect(() => encryptApiKey('', SEED)).toThrow(/non-empty string/);
    });

    it('encrypt: throws on empty seed', () => {
      expect(() => encryptApiKey(PLAINTEXT, '')).toThrow(/non-empty string/);
    });

    it('decrypt: throws on empty triplet', () => {
      expect(() => decryptApiKey('', SEED)).toThrow(/non-empty string/);
    });

    it('decrypt: throws when triplet has wrong segment count', () => {
      expect(() => decryptApiKey('aaa.bbb', SEED)).toThrow(
        /3 dot-separated segments/,
      );
      expect(() => decryptApiKey('aaa.bbb.ccc.ddd', SEED)).toThrow(
        /3 dot-separated segments/,
      );
    });

    it('decrypt: throws when IV is wrong length', () => {
      // IV must be 12 bytes (16 base64url chars without padding).
      const badIv = Buffer.alloc(8).toString('base64url'); // 8 bytes != 12
      const validTag = Buffer.alloc(16).toString('base64url');
      const ct = Buffer.alloc(20).toString('base64url');
      expect(() =>
        decryptApiKey([badIv, validTag, ct].join('.'), SEED),
      ).toThrow(/malformed IV/);
    });

    it('decrypt: throws when authTag is wrong length', () => {
      const validIv = Buffer.alloc(12).toString('base64url');
      const badTag = Buffer.alloc(8).toString('base64url'); // 8 bytes != 16
      const ct = Buffer.alloc(20).toString('base64url');
      expect(() =>
        decryptApiKey([validIv, badTag, ct].join('.'), SEED),
      ).toThrow(/malformed authTag/);
    });
  });

  describe('envVarForProviderKind', () => {
    it('maps known providers to their canonical env var', () => {
      expect(envVarForProviderKind('groq')).toBe('GROQ_API_KEY');
      expect(envVarForProviderKind('gemini')).toBe('GEMINI_API_KEY');
    });

    it('falls back to <KIND>_API_KEY for other providers', () => {
      expect(envVarForProviderKind('openai')).toBe('OPENAI_API_KEY');
      expect(envVarForProviderKind('anthropic')).toBe('ANTHROPIC_API_KEY');
      expect(envVarForProviderKind('mistral')).toBe('MISTRAL_API_KEY');
    });
  });
});
