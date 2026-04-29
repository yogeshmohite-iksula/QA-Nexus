// QA Nexus PM1 — R2 storage service.
//
// Spec: ADR-005 (`docs/architecture/adr-005-r2-storage.md`) + MS0-T013.
//
// Pattern: presigned-URL direct-from-FE upload. The FE PUTs file bytes
// straight to R2 — they NEVER traverse the Render dyno (which has only
// 512 MB RAM per ADR-004). API mediates only the auth + key-naming
// + presign-token issuance.
//
// R2 is S3-API-compatible, so we use @aws-sdk/client-s3 +
// @aws-sdk/s3-request-presigner. Endpoint URL points at R2 instead of
// AWS. Region is "auto" — R2 doesn't care, but the AWS SDK requires
// SOMETHING in the region field.
//
// Env vars (set in Render per docs/deploy/render-runbook.md):
//   - R2_ACCESS_KEY_ID
//   - R2_SECRET_ACCESS_KEY
//   - R2_BUCKET (default: qa-nexus-evidence-pm1)
//   - R2_ENDPOINT (https://<account-id>.r2.cloudflarestorage.com)
//
// "Deferred mode": if any of the 4 env vars are missing, the service
// returns null from isConfigured() and all methods throw a NotConfigured
// error. The /health r2 readout reports status="deferred" instead of
// "down". Lets the API ship + start serving auth/embedding endpoints
// before R2 provisioning lands (T013 dashboard work).

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DEFAULT_BUCKET = 'qa-nexus-evidence-pm1';
const DEFAULT_PRESIGNED_TTL_SECS = 300; // 5 min
const MAX_PRESIGNED_TTL_SECS = 3600; // 1 h (per ADR-005 § "5-min presigned-URL expiry")

export interface PresignedResult {
  url: string;
  expiresAt: string;
}

export interface PresignedUploadResult extends PresignedResult {
  /** Pre-signed GET URL for the same key — returned eagerly so the FE
   *  doesn't need a second round-trip after PUT succeeds. */
  downloadUrl: string;
  key: string;
}

export interface R2HealthUp {
  status: 'up';
  bucket: string;
  endpoint_reachable: true;
  latency_ms: number;
}
export interface R2HealthDown {
  status: 'down';
  error: string;
}
export interface R2HealthDeferred {
  status: 'deferred';
  note: string;
}
export type R2Health = R2HealthUp | R2HealthDown | R2HealthDeferred;

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly endpoint: string | undefined;

  constructor() {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    const bucket = process.env.R2_BUCKET ?? DEFAULT_BUCKET;

    this.bucket = bucket;
    this.endpoint = endpoint;

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      this.logger.warn(
        'R2 not configured (missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_ENDPOINT). ' +
          '/storage/* endpoints will return 503 + /health will report r2.status="deferred". ' +
          'See docs/deploy/r2-runbook.md to provision.',
      );
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region: 'auto', // R2 ignores; AWS SDK requires non-empty
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      // R2 doesn't honor the AWS-style virtual-hosted-style URLs reliably;
      // path-style works everywhere. Tradeoff: slightly longer URLs.
      forcePathStyle: true,
    });
    this.logger.log(`R2 configured: bucket=${bucket} endpoint=${endpoint}`);
  }

  /** True if the 4 env vars are set + S3Client built. False = deferred mode. */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /** Returns the configured bucket name (always available, even in deferred mode). */
  getBucket(): string {
    return this.bucket;
  }

  /**
   * Issue a presigned PUT URL + matching GET URL for a new upload.
   *
   * Key naming:  uploads/<YYYY-MM-DD>/<uuid>-<sanitized-filename>
   * (date prefix simplifies lifecycle cleanup; uuid prevents collisions;
   * filename retained for human-readable downloads)
   *
   * Or with custom prefix:  <prefix>/<YYYY-MM-DD>/<uuid>-<sanitized-filename>
   */
  async presignedUpload(args: {
    contentType: string;
    filename: string;
    prefix?: string;
    expiresIn?: number;
  }): Promise<PresignedUploadResult> {
    const client = this.requireClient();
    const expiresIn = clampTtl(args.expiresIn);
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const safeName = sanitizeFilename(args.filename);
    const prefix = args.prefix ?? 'uploads';
    const key = `${prefix}/${date}/${randomUUID()}-${safeName}`;

    const putCmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: args.contentType,
    });
    const getCmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const [uploadUrl, downloadUrl] = await Promise.all([
      getSignedUrl(client, putCmd, { expiresIn }),
      getSignedUrl(client, getCmd, { expiresIn }),
    ]);

    return {
      url: uploadUrl,
      downloadUrl,
      key,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  /** Presigned GET URL for an existing key. */
  async presignedDownload(args: {
    key: string;
    expiresIn?: number;
  }): Promise<PresignedResult> {
    const client = this.requireClient();
    const expiresIn = clampTtl(args.expiresIn);
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: args.key,
    });
    const url = await getSignedUrl(client, cmd, { expiresIn });
    return {
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  /** List object keys (typically used for admin / cleanup tasks). */
  async listObjects(args: {
    prefix?: string;
    limit?: number;
  }): Promise<ListObjectsV2CommandOutput> {
    const client = this.requireClient();
    const cmd = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: args.prefix,
      MaxKeys: args.limit ?? 100,
    });
    return client.send(cmd);
  }

  /** Delete an object by key. */
  async deleteObject(key: string): Promise<void> {
    const client = this.requireClient();
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /**
   * Health probe: HeadBucket call. Returns one of:
   *   - { status: 'up', bucket, endpoint_reachable: true, latency_ms }
   *   - { status: 'down', error }   ← bucket exists but request failed
   *   - { status: 'deferred', note } ← env vars not set
   *
   * NEVER throws; always returns a structured readout for /health to embed.
   */
  async health(): Promise<R2Health> {
    if (!this.client) {
      return {
        status: 'deferred',
        note: 'R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_ENDPOINT not set — see docs/deploy/r2-runbook.md',
      };
    }
    const t0 = Date.now();
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return {
        status: 'up',
        bucket: this.bucket,
        endpoint_reachable: true,
        latency_ms: Date.now() - t0,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { status: 'down', error: msg };
    }
  }

  /** Throw 503 if not configured — used by service methods (not /health). */
  private requireClient(): S3Client {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'R2 storage not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, ' +
          'R2_ENDPOINT in Render env vars (see docs/deploy/r2-runbook.md), then redeploy.',
      );
    }
    return this.client;
  }
}

// ────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────

function clampTtl(requested: number | undefined): number {
  const raw = requested ?? DEFAULT_PRESIGNED_TTL_SECS;
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_PRESIGNED_TTL_SECS;
  return Math.min(Math.floor(raw), MAX_PRESIGNED_TTL_SECS);
}

/** Sanitize filename for use in an R2 object key. Strips path separators,
 *  null bytes, query-string-confusable chars; collapses whitespace; caps
 *  length at 96 chars (the rest is uuid + prefix + date). */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\\0]/g, '_')
    .replace(/[?#&%]/g, '_')
    .replace(/\s+/g, '-')
    .slice(0, 96);
}
