# Resend email deploy runbook (T014)

**Owner:** Yogesh (dashboard work) + MAIN (env-var wiring).
**Target:** BetterAuth magic-link flow sends real email via Resend (instead of console-stub from T021). Pilot users receive a clickable magic-link → land in Founder/Invited onboarding flow.
**Cost:** $0/month (Resend free — 3,000 sends/month, 100/day).
**Closes:** MS0-T014.

---

## Prerequisites

- [ ] Render service deployed per `render-runbook.md` (so we have a URL for the magic-link callback).
- [ ] BetterAuth wired per MS0-T021 (Day 2 evening, PR #6 merged at 7f60b8e). Confirm by curling `https://qa-nexus-api.onrender.com/auth/sign-in` — should return 400 (missing body), proving the route exists.
- [ ] You have admin access to a domain (for custom-sender setup, optional for pilot — see Step 3).

---

## Step 1 — Account setup

1. Sign up at https://resend.com (free, no credit card).
2. Email = `<your Iksula corporate email>`.
3. Confirm: **Plan = Free** (3,000/month, 100/day).

---

## Step 2 — Generate API key

1. Resend dashboard → **API Keys → Create API Key**.
2. Settings:

| Field      | Value                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| Name       | `qa-nexus-pm1-render`                                                    |
| Permission | **Sending access** (full send permissions; no domain-mgmt access needed) |
| Domain     | (leave "all domains" — single-domain restriction is paid-tier only)      |

3. Click **Add**.
4. **CRITICAL:** copy the key immediately. It looks like `re_<32-40 chars>`. The page shows it ONCE.
5. **Paste back into this chat** OR directly into Render env vars:
   ```
   RESEND_API_KEY=re_<your-key-here>
   ```

---

## Step 3 — Sender domain (TWO options for pilot)

### Option A (default for pilot) — use Resend's managed domain

Resend provides `onboarding@resend.dev` as a managed sender for development. **No DNS setup required.** Limitations:

- **Only sends to verified email addresses** (i.e., Yogesh's own email + any emails added to "Allowed recipients" list in Resend dashboard).
- For PM1's 8-user pilot, add all 8 emails to the allowed list:
  1. Resend dashboard → **Domains → resend.dev → Allowed Recipients**.
  2. Add: `akshay.panchal@iksula.com`, `yogesh.mohite@iksula.com`, `kishor.kadam@iksula.com`, `nitin.gomle@iksula.com`, `nadim.siddiqui@iksula.com`, `govind.daware@iksula.com`, `mohanraj.k@iksula.com`, `sagar.todankar@iksula.com`.
  3. Each user gets a verification email; they click to allow.
- Magic-link emails send from `onboarding@resend.dev` with reply-to `<your-iksula-email>`.

**This is the PILOT path.** No DNS changes, works in 5 min, supports the 8 named users only.

### Option B (post-pilot, deferred) — custom domain

For wider rollout (PM2+), set up `noreply@qa-nexus.iksula.com`:

1. Resend dashboard → **Domains → Add Domain → `qa-nexus.iksula.com`** (or whatever subdomain you control).
2. Resend shows DNS records to add:
   - **SPF** (TXT) — `v=spf1 include:amazonses.com ~all` or similar.
   - **DKIM** (CNAME × 3) — for email signing.
   - **MX** (optional, for receiving bounces) — defer.
3. Add all DNS records to Iksula's DNS provider (Cloudflare/GoDaddy/etc.).
4. Wait 5-30 min for DNS propagation.
5. Resend dashboard → **Verify**. Once green, can send from any address @ that domain without per-recipient allowlist.

**Defer to post-pilot.** Pilot uses Option A.

---

## Step 4 — Send a test email (after MAIN wires the API)

Once `RESEND_API_KEY` is set in Render and the API redeploys:

```bash
# 1. Trigger the magic-link flow
curl -X POST https://qa-nexus-api.onrender.com/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"yogesh.mohite@iksula.com"}'

# Expected: { "ok": true, "audit_log_id": "..." }

# 2. Check your inbox (yogesh.mohite@iksula.com)
# Expected: email from "onboarding@resend.dev" subject "Sign in to QA Nexus"
# Body contains: "Click here to sign in: https://qa-nexus-api.onrender.com/auth/callback?token=..."

# 3. Click the link in the email
# Expected: redirect to https://qa-nexus-web.pages.dev/home or similar

# 4. Verify session was created
curl -s https://qa-nexus-api.onrender.com/auth/session \
  -H "Cookie: better-auth.session_token=<cookie from browser>" | jq

# Expected: { "authenticated": true, "user": { ... } }

# 5. Verify Resend logged the send
# Resend dashboard → Logs → see one entry, status "Delivered"
```

If all 5 pass, T014 is complete. Update `docs/STATUS.md`.

---

## Step 5 — Verify the EmailService no longer logs to console

The `apps/api/src/email/email.service.ts` from T021 has a STUB MODE that activates when `RESEND_API_KEY` is unset. With it set:

- Render logs should show: `[EmailService] sent magic-link to yogesh.mohite@iksula.com via Resend (id: re_xxxx)`.
- Should NOT show: `[EmailService] STUB MODE — would send: ...`

If you still see STUB MODE in logs after setting the key, check:

1. Env var name is exactly `RESEND_API_KEY` (not `RESEND_KEY` or similar).
2. Render redeployed after env-var save (env-vars don't take effect until redeploy).

---

## Step 6 — Free-tier limits + monitoring

| Resource       | Free limit | PM1 expected (8 users × 12hr × 30 days)   | Headroom |
| -------------- | ---------- | ----------------------------------------- | -------- |
| Sends / month  | 3,000      | ~30 (sign-ins) + ~10 (defects/notif) ≈ 40 | 99% free |
| Sends / day    | 100        | ~5-10                                     | 90% free |
| Domains        | 1 verified | 0 (using managed) or 1 (custom)           | —        |
| Webhook events | unlimited  | 0 (we don't subscribe to bounces yet)     | —        |

PM1 uses ~1.5% of monthly free quota. Even if we 10x (PM2 scale), still under 15% of free.

---

## Step 7 — Common errors + fixes

| Symptom                                                  | Likely cause                                       | Fix                                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Magic-link email never arrives                           | (a) STUB MODE still on, (b) domain not allowlisted | Check Render logs for STUB / verify recipient is in Resend's "Allowed Recipients" list.               |
| Resend logs "delivered" but recipient says no email      | Spam folder                                        | Check spam. Add `onboarding@resend.dev` to safe senders. Iksula's email may quarantine on first send. |
| `re_xxx` API key returns 401                             | Key revoked / typo                                 | Regenerate (Step 2). Make sure no trailing whitespace when pasting into Render.                       |
| Email arrives but link is `localhost:3001/auth/callback` | `BETTER_AUTH_URL` not set in Render env vars       | Per render-runbook.md Step 4, set `BETTER_AUTH_URL` AFTER first deploy + redeploy.                    |
| Bulk-send burst fails after ~10 rapid sends              | Free-tier rate limit (10/min)                      | Acceptable for pilot — magic-link UX is "click → wait 5s → email arrives".                            |

---

## Step 8 — Rotation procedure

Resend keys don't expire. Rotate when:

- A team member with API access leaves.
- Suspected leak.
- Quarterly hygiene.

Steps:

1. Create new key (Step 2).
2. Add to Render env vars (don't delete old yet).
3. Redeploy → verify `/auth/sign-in` works with new key.
4. Revoke old key in Resend dashboard.
5. Update `docs/SECURITY.md` rotation log.

---

## Cross-references

- `docs/deploy/render-runbook.md` — the upstream service that consumes this key
- `apps/api/src/email/email.service.ts` — the EmailService (STUB / Resend dual-mode)
- `apps/api/src/auth/auth.service.ts` — BetterAuth integration, calls EmailService
- `IKSULA_CONTEXT.md` § "Pilot team" — the 8 emails to allowlist in Resend
- `CLAUDE.md` § "Locked tech stack" → "Email: Resend free"
- `PM1_ERD §M0_v8` — task T014 spec
