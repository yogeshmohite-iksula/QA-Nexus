// QA Nexus PM1 — R2Service unit tests.
//
// Spec: ADR-005 + MS0-T013. Tests run with mocked AWS SDK so they're
// hermetic (no network, no R2 account required).
//
// Coverage:
//   - deferred mode (env vars unset) → isConfigured()=false, methods throw 503
//   - configured mode → presignedUpload returns valid shape with sane key naming
//   - presignedDownload returns valid shape
//   - health() returns one of {up,down,deferred} matching state
//   - sanitizeFilename strips path separators + caps length
//   - clampTtl clamps to [1s, 3600s]

import { ServiceUnavailableException } from '@nestjs/common';
import { R2Service } from './r2.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock the presigner — every call returns a deterministic fake URL.
// We assert structure (the actual URL string varies by SDK internals).
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

// Mock the S3 client constructor + send. We don't assert per-call args
// at the constructor level; we DO assert that the right Command type
// instances are passed to .send for HeadBucket etc.
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

const ENV_KEYS = [
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET',
] as const;

describe('R2Service', () => {
  let savedEnv: Record<string, string | undefined>;
  let mockGetSignedUrl: jest.Mock;

  beforeEach(() => {
    savedEnv = {};
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    mockGetSignedUrl = getSignedUrl as unknown as jest.Mock;
    mockGetSignedUrl.mockReset();
    mockSend.mockReset();
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  describe('deferred mode (env vars unset)', () => {
    it('isConfigured returns false', () => {
      const svc = new R2Service();
      expect(svc.isConfigured()).toBe(false);
    });

    it('getBucket still returns the default name', () => {
      const svc = new R2Service();
      expect(svc.getBucket()).toBe('qa-nexus-evidence-pm1');
    });

    it('presignedUpload throws 503', async () => {
      const svc = new R2Service();
      await expect(
        svc.presignedUpload({
          contentType: 'image/png',
          filename: 'screenshot.png',
        }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('presignedDownload throws 503', async () => {
      const svc = new R2Service();
      await expect(
        svc.presignedDownload({ key: 'uploads/foo.png' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('health returns deferred (never throws)', async () => {
      const svc = new R2Service();
      const result = await svc.health();
      expect(result.status).toBe('deferred');
      if (result.status === 'deferred') {
        expect(result.note).toMatch(/R2_ACCESS_KEY_ID/);
      }
    });
  });

  describe('configured mode', () => {
    beforeEach(() => {
      process.env.R2_ACCESS_KEY_ID = 'fake-access-key';
      process.env.R2_SECRET_ACCESS_KEY = 'fake-secret-key';
      process.env.R2_ENDPOINT = 'https://acct.r2.cloudflarestorage.com';
      process.env.R2_BUCKET = 'test-bucket';
    });

    it('isConfigured returns true', () => {
      const svc = new R2Service();
      expect(svc.isConfigured()).toBe(true);
    });

    it('presignedUpload returns valid shape with key naming convention', async () => {
      mockGetSignedUrl
        .mockResolvedValueOnce('https://signed-put.example/key?token=xyz')
        .mockResolvedValueOnce('https://signed-get.example/key?token=xyz');
      const svc = new R2Service();
      const result = await svc.presignedUpload({
        contentType: 'image/png',
        filename: 'screenshot.png',
      });
      // Key shape: uploads/YYYY-MM-DD/<uuid>-screenshot.png
      expect(result.key).toMatch(
        /^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}-screenshot\.png$/,
      );
      expect(result.url).toBe('https://signed-put.example/key?token=xyz');
      expect(result.downloadUrl).toBe(
        'https://signed-get.example/key?token=xyz',
      );
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
      // 2 calls: 1 for PUT presign, 1 for GET presign
      expect(mockGetSignedUrl).toHaveBeenCalledTimes(2);
    });

    it('presignedUpload honors custom prefix', async () => {
      mockGetSignedUrl.mockResolvedValue('https://example.com/url');
      const svc = new R2Service();
      const result = await svc.presignedUpload({
        contentType: 'image/png',
        filename: 'evidence.png',
        prefix: 'defects',
      });
      expect(result.key.startsWith('defects/')).toBe(true);
    });

    it('presignedUpload sanitizes filename (strips path separators)', async () => {
      mockGetSignedUrl.mockResolvedValue('https://example.com/url');
      const svc = new R2Service();
      const result = await svc.presignedUpload({
        contentType: 'image/png',
        filename: '../../etc/passwd',
      });
      // / and . should be replaced; no traversal possible
      expect(result.key).not.toContain('../');
      expect(result.key).not.toContain('/etc/');
    });

    it('presignedUpload clamps expiresIn to [1, 3600]', async () => {
      mockGetSignedUrl.mockResolvedValue('https://example.com/url');
      const svc = new R2Service();
      // 999999 should clamp to 3600
      await svc.presignedUpload({
        contentType: 'image/png',
        filename: 'a.png',
        expiresIn: 999999,
      });
      const optsArg = mockGetSignedUrl.mock.calls[0]?.[2] as {
        expiresIn: number;
      };
      expect(optsArg.expiresIn).toBe(3600);
      mockGetSignedUrl.mockClear();
      // 0 should fall back to default (300)
      await svc.presignedUpload({
        contentType: 'image/png',
        filename: 'b.png',
        expiresIn: 0,
      });
      const optsArg2 = mockGetSignedUrl.mock.calls[0]?.[2] as {
        expiresIn: number;
      };
      expect(optsArg2.expiresIn).toBe(300);
    });

    it('presignedDownload returns valid shape', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed-get.example/url');
      const svc = new R2Service();
      const result = await svc.presignedDownload({
        key: 'uploads/2026-04-29/abc-screenshot.png',
      });
      expect(result.url).toBe('https://signed-get.example/url');
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('health returns up on successful HeadBucket', async () => {
      mockSend.mockResolvedValueOnce({}); // HeadBucket success
      const svc = new R2Service();
      const result = await svc.health();
      expect(result.status).toBe('up');
      if (result.status === 'up') {
        expect(result.bucket).toBe('test-bucket');
        expect(result.endpoint_reachable).toBe(true);
        expect(result.latency_ms).toBeGreaterThanOrEqual(0);
      }
    });

    it('health returns down on failed HeadBucket (never throws)', async () => {
      mockSend.mockRejectedValueOnce(new Error('NoSuchBucket'));
      const svc = new R2Service();
      const result = await svc.health();
      expect(result.status).toBe('down');
      if (result.status === 'down') {
        expect(result.error).toContain('NoSuchBucket');
      }
    });

    it('deleteObject sends DeleteObjectCommand', async () => {
      mockSend.mockResolvedValueOnce({});
      const svc = new R2Service();
      await svc.deleteObject('uploads/2026-04-29/foo.png');
      expect(mockSend).toHaveBeenCalledTimes(1);
      // The first arg should be a DeleteObjectCommand instance — check by
      // constructor name (avoids having to import the class type here)
      expect(mockSend.mock.calls[0]?.[0].constructor.name).toBe(
        'DeleteObjectCommand',
      );
    });
  });
});
