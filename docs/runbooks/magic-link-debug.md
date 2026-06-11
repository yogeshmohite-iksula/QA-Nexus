# Runbook — Magic-link debugging (Apps Script bridge)

> **Audience:** Yogesh + BE+1 on-call · **Scope:** sign-in email delivery via Apps Script bridge (ADR-025) · **Risk:** LOW (read-only debugging until rotation step)

## Symptom triage

| Symptom                                           | Likely cause                                                    | Jump to            |
| ------------------------------------------------- | --------------------------------------------------------------- | ------------------ |
| User enters email; submits; no error; no email    | Apps Script bridge URL wrong / secret mismatch / quota exceeded | §1 Bridge health   |
| User receives email; clicks link; "invalid token" | `BETTER_AUTH_SECRET` rotated or session DB out of sync          | §2 BetterAuth side |
| Email arrives but goes to Spam folder             | Workspace sender reputation / first-time-recipient flag         | §3 Deliverability  |
| Sign-in form returns 500                          | API down / NestJS controller error                              | §4 API side        |
| Sign-in form returns 401 on /auth/sign-in         | Cookie / origin config mismatch                                 | §5 Cookie/Origin   |
| Magic-link arrives but expires too fast           | BetterAuth token TTL config                                     | §6 TTL config      |

## §1 — Apps Script bridge health

The Apps Script bridge (per ADR-025) is the bottleneck during pilot. Check its health first.

### Step 1.1 — Direct GET to the Web App URL

```bash
curl -s -o /tmp/bridge.html -w "%{http_code}\n" "$APPS_SCRIPT_EMAIL_URL"
```

Expected: 200. If 401/403/404 → the Web App is misconfigured. Check Apps Script project → Deploy → "Manage deployments" → ensure the active deployment is "Anyone" access.

### Step 1.2 — Send a test email via the bridge (Render-side)

SSH into Render shell (Render Dashboard → Service → Shell) and run:

```bash
node -e "(async () => { const r = await fetch(process.env.APPS_SCRIPT_EMAIL_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:'yogesh.mohite@iksula.com', subject:'Bridge smoke '+new Date().toISOString(), htmlBody:'<p>Smoke test from Render shell.</p>', secret: process.env.APPS_SCRIPT_EMAIL_SECRET }) }); console.log(r.status, await r.text()); })();"
```

Expected: 200 + JSON `{ "ok": true }`. If 401 → secret mismatch (re-run §1.3). If 500 → quota exhausted or Workspace policy block.

### Step 1.3 — Verify shared secret matches both sides

- **Render env var:** `APPS_SCRIPT_EMAIL_SECRET`
- **Apps Script project:** `SHARED_SECRET` constant in the `Code.gs` source

If they differ → re-run `env-reset-secret-rotation.md` §"`APPS_SCRIPT_EMAIL_SECRET` rotation".

### Step 1.4 — Check Apps Script execution log

Open Apps Script project → Executions tab → filter to the last 1 hour. Each magic-link request should show as a successful execution. If you see failed executions → click for stack trace. Common errors:

- `Service invoked too many times for one day: email` — quota exhausted (>1,500 recipients/day; impossible at pilot scale unless under attack)
- `Address blocked: ...` — recipient address rejected by Workspace policy (whitelist via Workspace admin)
- `You do not have permission to access this resource` — Web App access scope changed; re-deploy with "Anyone" access

## §2 — BetterAuth side

If the email arrives but clicking the link fails with "invalid token" / "session expired" / "redirected to sign-in":

### Step 2.1 — Check BetterAuth session table

Connect to pilot Neon with `psql "$DATABASE_URL"`:

```sql
SELECT id, "userId", "expiresAt", "ipAddress", "userAgent"
FROM "Session"
WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'yogesh.mohite@iksula.com')
ORDER BY "expiresAt" DESC
LIMIT 5;
```

If no recent session row exists despite the user clicking → the magic-link callback failed silently. Check API logs (Better Stack) for `/auth/callback` errors.

### Step 2.2 — Check BetterAuth verification table

```sql
SELECT identifier, value, "expiresAt"
FROM "Verification"
WHERE identifier = 'yogesh.mohite@iksula.com'
ORDER BY "expiresAt" DESC
LIMIT 5;
```

If a row exists but `expiresAt` is past → user took >TTL to click the link (default 60 min). Request a new link.

### Step 2.3 — Look for `BETTER_AUTH_SECRET` rotation events

If `BETTER_AUTH_SECRET` was rotated recently (Render env edit history), all old sessions are invalid. Every user must request a new magic-link. Symptom matches.

## §3 — Deliverability (Spam folder / not arriving)

Apps Script sends from `yogesh.mohite@iksula.com` → highest internal-trust deliverability for iksula.com recipients per ADR-025.

If an email goes to Spam for an iksula.com recipient:

1. **First-time-recipient flag:** Workspace puts first-ever messages from a domain into Spam for 24-48 hours. Pilot users may need to whitelist `yogesh.mohite@iksula.com` manually one time.
2. **Subject line triggers:** check that the subject doesn't contain spam-trigger words. The current template uses "Sign in to QA Nexus" — clean.
3. **Body content:** plain-text fallback should accompany the HTML body. Verify in Apps Script source.

If email goes to Spam for a non-iksula.com recipient (post-pilot): plan the migration to `mail.qanexus.iksula.com` Resend domain per ADR-025 migration trigger.

## §4 — API side (NestJS / `/auth/sign-in` 500)

### Step 4.1 — Render logs

Render Dashboard → Service → Logs → filter for `/auth/sign-in`. Look for:

- `Cannot read properties of undefined` → likely `EMAIL_PROVIDER` env var unset (defaults to `apps-script`)
- `APPS_SCRIPT_EMAIL_URL is not configured` → env var missing entirely
- `Failed to dispatch email via apps-script` → bridge unreachable (back to §1)

### Step 4.2 — Better Stack OTel traces

Better Stack search: `service.name="qa-nexus-api"` AND `http.target="/auth/sign-in"` AND `http.status_code=500`. Open a recent trace → inspect span attributes for the failed call.

### Step 4.3 — Confirm `EmailService` provider strategy

Recent change (Sat Jun 6, PR #235): `EMAIL_PROVIDER` env var defaults to `apps-script`; flip to `resend` only post-IT-DNS verification per ADR-025 migration trigger. If someone flipped this prematurely without configuring Resend domain → all sends will fail.

```bash
# Render shell:
echo "Provider: $EMAIL_PROVIDER"
```

## §5 — Cookie / origin mismatch (401 on /auth/sign-in form submit)

When the FE is on `qa-nexus-web.pages.dev` (Cloudflare Pages) and the API is on `qa-nexus-api.onrender.com` (Render), the BetterAuth cookie config must allow cross-site.

### Required env vars (Render side)

- `BETTER_AUTH_URL` = `https://qa-nexus-api.onrender.com`
- `BETTER_AUTH_COOKIE_DOMAIN` = `.onrender.com` (or unset for default per BetterAuth)
- `AUTH_TRUSTED_ORIGINS` = `https://qa-nexus-web.pages.dev`

### Required env vars (FE side, NEXT*PUBLIC*\*)

- `NEXT_PUBLIC_API_BASE_URL` = `https://qa-nexus-api.onrender.com`
- `NEXT_PUBLIC_APP_BASE_URL` = `https://qa-nexus-web.pages.dev`

### Verify CORS in the response

```bash
curl -v -X POST "https://qa-nexus-api.onrender.com/auth/sign-in" \
  -H "Origin: https://qa-nexus-web.pages.dev" \
  -H "Content-Type: application/json" \
  -d '{"email":"yogesh.mohite@iksula.com"}'
```

The response should include:

- `Access-Control-Allow-Origin: https://qa-nexus-web.pages.dev`
- `Access-Control-Allow-Credentials: true`
- `Set-Cookie: ...; SameSite=None; Secure`

If `SameSite=Lax` or missing → cross-site cookie won't persist. Check BetterAuth config in `apps/api/src/auth/auth.config.ts`.

## §6 — TTL config (magic-link expires too fast)

BetterAuth default magic-link TTL is 5-10 min (varies by version). For pilot, recommend bumping to 60 min so a user can read the email at leisure.

Check `apps/api/src/auth/auth.config.ts` for the `magicLink` plugin config:

```ts
expiresIn: 60 * 60, // 60 min in seconds
```

If absent, the default applies. Update + redeploy if pilot reports "link expired" errors frequently.

## Escalation

- **Pilot is down >15 min** with no clear cause → switch fallback chain per ADR-025:
  1. Try Resend (set `EMAIL_PROVIDER=resend` if a verified sender exists, even `onboarding@resend.dev` to `yogesh.mohite@iksula.com` only, then manual-forward).
  2. Worst case: send invites manually via Gmail Compose with the magic-link URL.

## Cross-references

- `docs/architecture/adr-025-pilot-email-via-apps-script-bridge.md` — bridge architecture
- `docs/runbooks/env-reset-secret-rotation.md` — secret rotation (sibling)
- `apps/api/src/email/` — EmailService strategy implementation (PR #235)
- `apps/api/src/auth/auth.config.ts` — BetterAuth config
- BetterAuth docs: https://www.better-auth.com/docs

_Authored Sun Day-5 2026-06-07 PM session as part of MAIN Bucket 3 (4 missing runbooks)._
