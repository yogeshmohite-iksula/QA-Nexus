# Cloudflare R2 deploy runbook (T013)

**Owner:** Yogesh (dashboard work) + MAIN (post-provisioning wiring).
**Target:** Bucket `qa-nexus-evidence-pm1` created, CORS configured for FE origin, presigned URL upload tested end-to-end.
**Cost:** $0/month (CF R2 free tier — 10 GB storage + 1M Class A ops/mo + 10M Class B ops/mo + zero egress fees forever).
**Closes:** MS0-T013, MS0-AC004.

---

## Prerequisites

- [ ] Cloudflare account exists with R2 enabled (Day 0 setup confirmed). Account ID known.
- [ ] You have admin access to the CF account (needed to create R2 API tokens).
- [ ] Render service is provisioned per `render-runbook.md` (so we know the FE/API origin to allowlist in CORS).

---

## Step 1 — Create the bucket

1. Sign in to https://dash.cloudflare.com.
2. Left sidebar → **R2 Object Storage** → **Create bucket**.
3. Bucket settings:

| Field                 | Value                                  | Notes                                                          |
| --------------------- | -------------------------------------- | -------------------------------------------------------------- |
| Name                  | `qa-nexus-evidence-pm1`                | Globally unique within your account. Lowercase + hyphens only. |
| Location              | **Automatic** (Asia-Pacific)           | CF auto-routes; no manual region pick on free tier.            |
| Default storage class | **Standard** (the only option on free) | Infrequent Access tier requires upgrade.                       |

4. Click **Create bucket**.

---

## Step 2 — Configure CORS policy

R2 allows direct-from-browser uploads via presigned URLs, but only if CORS is configured. Without this, the FE → presigned-PUT call fails with a CORS error.

1. From the bucket page → **Settings** tab → **CORS Policy** → **Add CORS policy**.
2. Paste this JSON (literal — replace nothing):

```json
[
  {
    "AllowedOrigins": [
      "https://qa-nexus-web.pages.dev",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

3. Click **Save**.

**Why these settings:**

- `AllowedOrigins` — only the FE production URL + localhost dev. If we add staging later (e.g., `qa-nexus-web-staging.pages.dev`), append it.
- `PUT` — for presigned-URL uploads.
- `GET + HEAD` — for presigned-URL downloads + existence checks.
- `POST` — for multipart upload init (R2 supports multipart, useful for >5MB files like `customer_return_flow_recording.mp4` per IKSULA_CONTEXT.md).
- `*` for headers — covers `Content-Type`, `Content-Length`, `x-amz-*` headers the AWS SDK adds.
- `ExposeHeaders: ["ETag"]` — lets the FE read the ETag from the upload response (used for client-side de-dup checks).
- `MaxAgeSeconds: 3600` — preflight OPTIONS cached for 1h.

---

## Step 3 — Generate R2 API token

1. CF dashboard → **R2 Object Storage** → **Manage R2 API Tokens** (top-right).
2. Click **Create API Token**.
3. Token settings:

| Field                | Value                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------- |
| Token name           | `qa-nexus-pm1-api`                                                                    |
| Permissions          | **Object Read & Write**                                                               |
| Bucket scope         | **Apply to specific buckets only** → select `qa-nexus-evidence-pm1` (least-privilege) |
| TTL                  | **Forever** (we'll rotate manually if needed)                                         |
| IP address filtering | (leave blank — Render uses dynamic outbound IPs)                                      |

4. Click **Create API Token**.
5. **CRITICAL:** the next page shows the secret ONCE. Copy:
   - **Access Key ID** (starts with random chars, ~32 char)
   - **Secret Access Key** (longer, ~64 char base64-ish)
   - **Endpoint URL** (looks like `https://<account-id>.r2.cloudflarestorage.com` — note: NOT the S3-compat one with `/qa-nexus-evidence-pm1` suffix; the bucket is path-prefixed by SDK clients)
6. **Paste them back into this chat** (or directly into Render env-vars panel) and MAIN will wire them in.

**If you accidentally close the page without copying:** you have to revoke the token and create a new one. There's no "show secret again" option.

---

## Step 4 — Capture the values

Send these 3 values back to MAIN (or paste directly into Render env vars):

```
R2_ACCESS_KEY_ID=<paste here>
R2_SECRET_ACCESS_KEY=<paste here>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

`R2_BUCKET=qa-nexus-evidence-pm1` is hardcoded in the runbook + .env.example, so you don't need to paste it.

---

## Step 5 — Test upload end-to-end (after MAIN wires the API)

Once `R2_*` env vars are set in Render AND the API redeploys:

```bash
# 1. Get a presigned upload URL (Admin/Lead role required; use Yogesh's session)
curl -s -X POST https://qa-nexus-api.onrender.com/storage/presigned-upload \
  -H "Cookie: better-auth.session_token=<your-session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{"contentType":"image/png","filename":"test-upload.png"}' | jq

# Expected:
# {
#   "uploadUrl": "https://<account-id>.r2.cloudflarestorage.com/qa-nexus-evidence-pm1/...?X-Amz-...",
#   "downloadUrl": "https://<account-id>.r2.cloudflarestorage.com/qa-nexus-evidence-pm1/...?X-Amz-...",
#   "key": "uploads/2026-04-29/<uuid>-test-upload.png",
#   "expiresAt": "2026-04-29T..."
# }

# 2. Upload a sample PNG using the presigned URL
echo -n "fake png bytes" > /tmp/test.png
curl -s -X PUT "<uploadUrl from above>" \
  -H "Content-Type: image/png" \
  --data-binary @/tmp/test.png \
  -w "\nHTTP %{http_code}\n"

# Expected: HTTP 200

# 3. Download via the downloadUrl
curl -s "<downloadUrl from above>" -o /tmp/test-download.png
diff /tmp/test.png /tmp/test-download.png
# Expected: no output (files identical)

# 4. Verify /health flipped from "deferred" to "up"
curl -s https://qa-nexus-api.onrender.com/health | jq '.r2'
# Expected: { "up": true, "bucket": "qa-nexus-evidence-pm1", "endpoint_reachable": true }
```

If all 4 pass, R2 is fully wired. Update `docs/STATUS.md` Health Checks row.

---

## Step 6 — Cost confirmation

After a week of running:

1. CF dashboard → **R2 Object Storage** → **Plans & Pricing**.
2. Confirm:
   - **Storage:** < 10 GB used (free).
   - **Class A operations** (PUT, DELETE, multipart): < 1M / month (free).
   - **Class B operations** (GET, HEAD): < 10M / month (free).
   - **Egress:** unlimited free always (R2's flagship feature vs S3).

For PM1 pilot (8 users × ~5 file uploads/day × 30 days = ~1,200 PUTs/month), we're at ~0.12% of Class A free quota.

---

## Step 7 — Common errors + fixes

| Symptom                                                                | Likely cause                        | Fix                                                                                                                 |
| ---------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| FE upload blocked by browser CORS error                                | CORS policy not saved               | Re-paste JSON in Step 2; click Save explicitly. CF's CORS UI sometimes doesn't auto-save.                           |
| `/storage/presigned-upload` returns 403                                | RBAC blocked — caller is QAEngineer | Sign in as Admin (Yogesh) or Lead (Akshay). Per CLAUDE.md role table.                                               |
| `/storage/presigned-upload` returns 503 + reason="missing credentials" | Env vars not set in Render          | Add R2\_\* env vars in Render → Manual Deploy.                                                                      |
| Presigned URL works but then 401 after a few seconds                   | Clock skew between Render + CF      | Render is NTP-synced; check your local laptop clock if testing from local. The `expiresIn=300` (5 min) is generous. |
| Upload succeeds but `/health` r2.up=false                              | HeadBucket call fails               | Token doesn't have read permission. Re-issue token with **Object Read & Write** (not just Write).                   |
| Bucket name "already in use" when creating                             | Another CF account claimed it       | Pick a different name (e.g., `qa-nexus-evidence-pm1-iksula`). Update `R2_BUCKET` env var + IKSULA_CONTEXT.md note.  |

---

## Step 8 — Rotation procedure (when needed)

R2 tokens don't expire automatically. Rotate when:

- A team member with API access leaves the project.
- The token is suspected to have leaked.
- ~Quarterly hygiene rotation.

Steps:

1. Create a new token (Step 3) with the same permissions.
2. Add the new values to Render env vars (don't delete the old ones yet).
3. Trigger a redeploy. Verify `/health` r2.up=true with new token.
4. Revoke the OLD token in CF dashboard.
5. Update `docs/SECURITY.md` rotation log.

---

## Cross-references

- `docs/architecture/adr-005-r2-storage.md` — the ADR documenting WHY R2 over S3 (presigned-URL pattern, no egress fees)
- `apps/api/src/storage/r2.module.ts` — the NestJS module
- `apps/api/src/storage/r2.service.ts` — presignedPutUrl + presignedGetUrl
- `apps/api/src/storage/storage.controller.ts` — the `/storage/presigned-upload` + `/storage/presigned-download` endpoints
- `packages/shared/src/storage.ts` — Zod schemas (PresignedUploadRequest, PresignedUploadResponse)
- `IKSULA_CONTEXT.md` § "Sample files for upload demos" — the expected file types (XLSX, CSV, MP4)
- `PM1_ERD §M0_v8` — task T013 spec
