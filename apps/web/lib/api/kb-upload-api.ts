// F12 KB Upload — REAL BE-wired API client (Pattern B).
//
// Day-12 TASK 1 RESUME (M2 close). BE+1 PR #78 closed (al) by adding
// `POST /api/projects/:projectId/kb/documents` which atomically creates
// the kb_document row + returns a presigned R2 PUT URL. The full flow:
//
//   1. POST /api/projects/:projectId/kb/documents
//        → { documentId, presignedUploadUrl, r2Key, expiresAt }
//   2. PUT presignedUploadUrl with file bytes (Content-Type matches
//      mimeType verbatim — R2 signs the header)
//   3. POST /api/admin/kb/finalize-upload { documentId, fileName, r2Key }
//        → { ok, documentId, chunkCount, embeddedCount, totalDurationMs, … }
//        Synchronous — chunks + embeds in one call (~3-5 s).
//
// Step 4 (status polling) is NOT needed: finalize is sync, so the FE
// can branch on `chunkCount > 0` (success) vs error (catch path).
// The user's hand-off snippet listed a poll step for forward-compat
// when BE+1 ships an async finalize variant; we'll add it then.
//
// FE absolute-URL discipline: NEXT_PUBLIC_API_BASE_URL prefix matches
// the pattern in `users-api.ts`, `kb-imports-api.ts`, `kb-api.ts`,
// and `auth/client.ts`.

import { getApiBaseURL } from '@/lib/env';
import {
  CreateKbDocumentRequest,
  CreateKbDocumentResponse,
  type KbUploadFileType,
  type FinalizeUploadRequest,
  type FinalizeUploadResponse,
  FinalizeUploadRequest as FinalizeUploadRequestSchema,
  FinalizeUploadResponse as FinalizeUploadResponseSchema,
} from '@qa-nexus/shared';

export type {
  CreateKbDocumentRequest,
  CreateKbDocumentResponse,
  KbUploadFileType,
  FinalizeUploadRequest,
  FinalizeUploadResponse,
} from '@qa-nexus/shared';

export {
  CreateKbDocumentRequest as CreateKbDocumentRequestSchema,
  CreateKbDocumentResponse as CreateKbDocumentResponseSchema,
  KbUploadFileType as KbUploadFileTypeSchema,
  KB_UPLOAD_MAX_BYTES,
} from '@qa-nexus/shared';

const API_BASE = getApiBaseURL().replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** File-extension → KbUploadFileType. Browser File.name carries the
 *  trailing extension; we use it as a stable mapping key (more reliable
 *  than `file.type` which can be empty for `.md` files). */
export function fileTypeFromExt(fileName: string): KbUploadFileType | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.md')) return 'md';
  if (lower.endsWith('.txt')) return 'txt';
  if (lower.endsWith('.xlsx')) return 'xlsx';
  if (lower.endsWith('.csv')) return 'csv';
  return null;
}

/** Browser-detected MIME → BE-canonical MIME for the upload. Defaults
 *  per fileType when `file.type` is empty (common for .md / .txt). */
export function canonicalMimeForFileType(fileType: KbUploadFileType, detected: string): string {
  if (detected && detected.length > 0) return detected;
  switch (fileType) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'md':
      return 'text/markdown';
    case 'txt':
      return 'text/plain';
  }
}

// ---------------------------------------------------------------------------
// Step 1 — POST /api/projects/:projectId/kb/documents
// ---------------------------------------------------------------------------

export async function createKbDocument(
  projectId: string,
  req: CreateKbDocumentRequest,
): Promise<CreateKbDocumentResponse> {
  CreateKbDocumentRequest.parse(req);
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/kb/documents`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let msg = `POST /api/projects/${projectId}/kb/documents → HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') msg = body.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  const json = await res.json();
  return CreateKbDocumentResponse.parse(json);
}

// ---------------------------------------------------------------------------
// Step 2 — PUT to presigned R2 URL
// ---------------------------------------------------------------------------

/** PUT file bytes directly to R2. R2 signs `Content-Type` — the header
 *  here MUST exactly match the `mimeType` passed in step 1, or the
 *  signature breaks (compound-learning from BE+1's storage.controller). */
export async function putToR2(presignedUrl: string, file: File, mimeType: string): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': mimeType },
  });
  if (!res.ok) {
    throw new Error(`PUT R2 → HTTP ${res.status} ${res.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// Step 3 — POST /api/admin/kb/finalize-upload (sync chunk + embed)
// ---------------------------------------------------------------------------

export async function finalizeKbUpload(
  req: FinalizeUploadRequest,
): Promise<FinalizeUploadResponse> {
  FinalizeUploadRequestSchema.parse(req);
  const res = await fetch(`${API_BASE}/api/admin/kb/finalize-upload`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let msg = `POST /api/admin/kb/finalize-upload → HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') msg = body.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  const json = await res.json();
  return FinalizeUploadResponseSchema.parse(json);
}
