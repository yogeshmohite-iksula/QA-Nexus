// QA Nexus PM1 — Storage (R2 presigned-URL) request/response Zod schemas.
//
// Spec: ADR-005 (`docs/architecture/adr-005-r2-storage.md`) + MS0-T013.
// Used by:
//   - apps/api: validates inbound request bodies on POST /storage/*
//   - apps/web: validates form-side payload before request fires
//
// Pattern A (deferred routing) NOTE: presigned-URL responses are consumed
// by FE components OUTSIDE the onboarding tree, so they are allowed to
// fire fetch() on these endpoints. The onboarding tree itself never uploads
// during the wizard — uploads happen post-onboarding (e.g., in F19 Run
// Console for video evidence).

import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────
// Allowed content types (whitelist, defense-in-depth on top of CORS)
// ────────────────────────────────────────────────────────────────────

/** Whitelist of content-types acceptable for upload. Driven by the file
 *  classes named in IKSULA_CONTEXT.md "Sample files for upload demos". */
export const ALLOWED_CONTENT_TYPES = [
  // Images (defect screenshots, KB article images)
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  // Documents (requirement uploads)
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls (legacy)
  'text/csv',
  'text/plain',
  // Video (test recordings — F19 Run Console)
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  // Audio (rare, but valid for run recordings with voice-over)
  'audio/mpeg',
  'audio/wav',
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

// ────────────────────────────────────────────────────────────────────
// Request/response shapes
// ────────────────────────────────────────────────────────────────────

/** Filename: 1–255 chars, no path separators (defense in depth — even
 *  though we always prefix the storage key with `uploads/<date>/<uuid>-`,
 *  filename pollution at the API surface is still rejected). */
export const FilenameSchema = z
  .string()
  .min(1, 'filename required')
  .max(255, 'filename too long (max 255 chars)')
  .refine((v) => !v.includes('/'), 'filename must not contain "/"')
  .refine((v) => !v.includes('\\'), 'filename must not contain "\\\\"')
  .refine((v) => !v.includes('\0'), 'filename must not contain null byte');

/** Content-type: must be in the whitelist. */
export const ContentTypeSchema = z.enum(
  ALLOWED_CONTENT_TYPES as unknown as [AllowedContentType, ...AllowedContentType[]],
);

/** POST /storage/presigned-upload — request body. */
export const PresignedUploadRequestSchema = z.object({
  contentType: ContentTypeSchema,
  filename: FilenameSchema,
  /** Optional namespace prefix — separates uploads by domain
   *  (e.g., "defects", "requirements", "runs"). Defaults to "uploads".
   *  Restricted to lowercase alphanumeric + hyphen, max 32 chars. */
  prefix: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'prefix must be lowercase alphanumeric + hyphens only')
    .max(32, 'prefix too long (max 32 chars)')
    .optional(),
});
export type PresignedUploadRequest = z.infer<typeof PresignedUploadRequestSchema>;

/** POST /storage/presigned-upload — response body. */
export const PresignedUploadResponseSchema = z.object({
  /** Pre-signed PUT URL — valid for 5 min. FE PUTs file bytes directly. */
  uploadUrl: z.string().url(),
  /** Pre-signed GET URL for the same key — valid for 5 min. Returned eagerly
   *  so the FE doesn't need a second round-trip after the upload. */
  downloadUrl: z.string().url(),
  /** R2 object key (e.g., `uploads/2026-04-29/<uuid>-screenshot.png`).
   *  Persist this in the audit_log + the application's domain table
   *  (e.g., defects.evidence_keys[]). */
  key: z.string().min(1),
  /** ISO 8601 timestamp when both URLs expire. */
  expiresAt: z.string().datetime(),
});
export type PresignedUploadResponse = z.infer<typeof PresignedUploadResponseSchema>;

/** POST /storage/presigned-download — request body. */
export const PresignedDownloadRequestSchema = z.object({
  /** R2 object key returned from a prior presigned-upload response.
   *  Must match `^[a-zA-Z0-9_/.-]+$` to prevent path traversal. */
  key: z
    .string()
    .min(1, 'key required')
    .max(1024, 'key too long')
    .regex(/^[a-zA-Z0-9_/.-]+$/, 'key contains invalid characters'),
});
export type PresignedDownloadRequest = z.infer<typeof PresignedDownloadRequestSchema>;

/** POST /storage/presigned-download — response body. */
export const PresignedDownloadResponseSchema = z.object({
  url: z.string().url(),
  expiresAt: z.string().datetime(),
});
export type PresignedDownloadResponse = z.infer<typeof PresignedDownloadResponseSchema>;

// ────────────────────────────────────────────────────────────────────
// /health storage subsystem readout (subset; full type lives in
// apps/api/src/health/health.controller.ts)
// ────────────────────────────────────────────────────────────────────

export const StorageHealthSchema = z.union([
  z.object({
    status: z.literal('up'),
    bucket: z.string(),
    endpoint_reachable: z.literal(true),
    latency_ms: z.number().nonnegative(),
  }),
  z.object({
    status: z.literal('down'),
    error: z.string(),
  }),
  z.object({
    status: z.literal('deferred'),
    note: z.string(),
  }),
]);
export type StorageHealth = z.infer<typeof StorageHealthSchema>;
