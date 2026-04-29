# ADR-005: Cloudflare R2 with presigned-URL direct-from-FE upload pattern

- **Status:** Accepted
- **Date:** 2026-04-29
- **Deciders:** Yogesh Mohite (Admin), MAIN session
- **Related:** MS0-T013 · `docs/deploy/r2-runbook.md` · ADR-004 (Render dyno's 512 MB memory ceiling motivates the bypass-API pattern)
- **Supersedes:** none
- **Superseded by:** none

---

## Context

PM1 needs object storage for:

- **Test recordings** — screen captures uploaded during F19 Run Console (~5-50 MB per file, MP4).
- **Requirement uploads** — Excel/CSV/PDF imports per F11 (~100 KB – 5 MB).
- **Defect attachments** — screenshots, logs (~50 KB – 2 MB).
- **Audit-log evidence** — periodic exports of the HMAC-chained `audit_log` table for offline retention.
- **Future PM2:** image attachments on KB articles, run-export PDFs.

Constraints:

- **Cost ceiling:** $0/month total infra. AWS S3's egress fees ($0.09/GB) would make a $0 architecture impossible at any meaningful pilot scale.
- **Pilot scale:** ~5 uploads/user/day × 8 users × 30 days ≈ 1,200 uploads/month. Average ~2 MB. Total transferred per month ~2.5 GB.
- **Render free dyno has a 512 MB RAM ceiling** (per ADR-004). Files larger than ~50 MB cannot be buffered through the API process without OOM risk. Direct browser → storage uploads must bypass the API entirely.
- **Browser CORS:** any direct-from-FE upload requires CORS-configured storage.
- **Authorization:** uploads must be authenticated (RBAC: Admin/Lead can upload; QA Engineer can view; Stakeholder read-only).

## Decision

Use **Cloudflare R2** with the **presigned-URL pattern**:

1. Frontend calls `POST /storage/presigned-upload` (RBAC-gated) on our NestJS API.
2. API returns a short-lived (5-min) S3-style presigned PUT URL pointing directly at R2.
3. FE PUTs the file bytes to the presigned URL — bytes never traverse the Render dyno.
4. R2 returns 200; FE notifies API of success via a separate `POST /storage/confirm` (records audit-log row).
5. Downloads symmetric: `POST /storage/presigned-download` → 5-min GET URL → FE fetches directly.

**R2 is S3-API-compatible**, so we use `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` as the client library (vendor-neutral; can swap to S3 if R2 fails).

## Consequences

### Positive

- **$0/month forever** at PM1 scale. R2 free tier: 10 GB storage + 1M Class A ops + 10M Class B ops + **zero egress fees ever**. PM1 uses ~25 MB / 1.2k ops per month → 0.25% / 0.12% of free quota.
- **Bypass Render's 512 MB ceiling.** Largest file we'll ever store (a `customer_return_flow_recording.mp4`) is ~50 MB. Buffering through Render would OOM. Direct PUT → R2 is unbounded.
- **Vendor-neutral SDK.** `@aws-sdk/client-s3` works with S3, R2, MinIO, Wasabi, Backblaze B2. If R2 ever changes terms, swap the endpoint URL + done.
- **No egress fees.** S3 charges $0.09/GB out → at PM1's 2.5 GB/month transferred, that'd be $0.23/month. Negligible at PM1, but compounds at PM2/PM3.
- **CORS-friendly.** R2 supports per-bucket CORS policy; no extra Cloudflare Worker shim needed.
- **Region-flexible.** R2 auto-routes to nearest edge (Asia-Pacific for Iksula's pilot users).

### Negative / accepted trade-offs

- **Eventual consistency on multipart upload completion.** R2's HeadObject right after a multipart-complete may return 404 for ~1s. Mitigation: FE delays "view" until 2s after upload-confirmed. Acceptable for PM1's UX (not a real-time CDN scenario).
- **No CloudFront-equivalent caching.** R2 doesn't have Cloudflare's CDN cache integration on the free tier in the same way as S3+CloudFront. For static assets that need <50ms global latency we'd need to attach Cloudflare CDN as a separate step. PM1 doesn't need this — uploads are user-private.
- **5-min presigned-URL expiry is short.** If a user has a slow connection and the upload takes >5 min (e.g., a 100 MB MP4 over 3G), it fails. Mitigation: configurable `expiresIn` on the API endpoint (max 1 hour). PM1 default = 5 min.
- **No native versioning** on R2 free tier. Mitigation: prefix keys with date + UUID (`uploads/2026-04-29/<uuid>-<filename>`). Effectively immutable; never overwrite.
- **No native lifecycle policies** on R2 free tier (i.e., "auto-delete files older than N days"). Mitigation: scheduled GitHub Action runs `pnpm scripts/r2-cleanup.ts` weekly to delete uploads older than 90 days (deferred to M1).
- **Token rotation is manual.** R2 API tokens don't expire; rotated on demand per `r2-runbook.md` Step 8.

### Neutral

- **R2 dashboard is browser-only** (same as Render). Provisioning is human-driven (Yogesh) per runbook.
- **Pre-signed URLs leak the storage origin** in the URL. Acceptable — they're scoped to a single object key + expire fast.

## Alternatives considered

### A. AWS S3 (with presigned URLs)

**Rejected.** Same architectural pattern, but:

- **Egress fees** (~$0.09/GB out, $0.005/1000 GET requests). At PM1 scale (~2.5 GB/month transferred + ~10k GETs/month) ≈ $0.28/month — small absolute number but breaks the $0 cost gate AND scales linearly. R2 is $0 forever.
- **Free tier expires after 12 months.** R2 free tier is permanent.

### B. Cloudflare KV

**Rejected.** KV is for small (<25 MB) key-value pairs, not file storage. Our MP4s would exceed the per-value limit.

### C. Local disk on Render dyno

**Rejected.** Files lost on every dyno restart (free tier restarts on any deploy + after long idle). Doesn't scale beyond a single dyno. Not a real storage solution.

### D. Postgres `bytea` column on Neon

**Rejected.** Neon free tier is 0.5 GB total. Storing even a few MP4s would exhaust it. Plus serving from Postgres bypasses CDN, all bytes flow through Render dyno = back to the 512 MB ceiling problem.

### E. Backblaze B2

**Considered, deferred.** B2 is also S3-compatible with a generous free tier (10 GB + 1 GB/day download). Comparable to R2. Picked R2 because we're already in the Cloudflare ecosystem (Pages + Workers eventually) → one less vendor to manage.

### F. Cloudflare Images (specialized image storage)

**Rejected** for general storage. CF Images is for image-only with on-the-fly transforms. Doesn't handle MP4/PDF/XLSX. Could be a future addition for screenshot transform pipelines (M3+).

### G. Stream-through API (no presigned URLs)

**Considered, rejected.** Simpler to reason about (auth happens once per request) but:

- Bytes traverse the Render dyno → 512 MB ceiling problem.
- Counts against Render's "build-up time" if uploads are slow.
- 100 MB upload at 1 MB/s = 100s of dyno time consumed.

The presigned-URL pattern is universally how cloud-native storage APIs work; not worth fighting it.

## Open questions resolved

1. **What about thumbnails for uploaded images?** Defer to M2/M3 when KB articles need preview thumbnails. Likely path: Cloudflare Images bucket + on-demand thumbnail.
2. **What about virus scanning on uploads?** Not for PM1 (8 trusted internal users at Iksula). At PM2 (external invitees), add ClamAV integration via a Cloudflare Worker scanning new R2 puts. Filed as P2 in followups.
3. **What if R2 has an outage?** Static asset retrieval degrades; user uploads queue at FE (localStorage) + retry. Not blocking auth/RBAC/normal app function.
4. **Encryption at rest?** R2 enforces AES-256 at rest by default. No additional config needed.

## Cross-references

- `docs/deploy/r2-runbook.md` — the provisioning runbook
- `apps/api/src/storage/r2.module.ts` — the NestJS module (lands in Phase 2 of Day 3)
- `apps/api/src/storage/r2.service.ts` — presignedPutUrl + presignedGetUrl
- `apps/api/src/storage/storage.controller.ts` — `/storage/presigned-upload` + `/storage/presigned-download`
- `packages/shared/src/storage.ts` — Zod schemas (PresignedUploadRequest, PresignedUploadResponse)
- ADR-004 — Render deployment (where the 512 MB ceiling motivating this ADR comes from)
- `IKSULA_CONTEXT.md` § "Sample files for upload demos" — the file types we'll actually store
- `CLAUDE.md` § "Locked tech stack" → "Storage: Cloudflare R2 free"
- `PM1_ERD §M0_v8` — task T013 spec
- `PM1_ERD §3.13` (audit log) — every upload writes an audit row
