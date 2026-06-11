# Runbook — Environment reset + secret rotation

> **Audience:** Yogesh (Admin) · **Scope:** Render env vars + GitHub Secrets + provider keys · **Risk:** MEDIUM (downtime possible during rotation)

## When to use this runbook

- A provider API key (Groq / Gemini / Resend / R2 / Apps Script secret) is suspected leaked.
- BetterAuth session secret needs rotation (forced sign-out of all users).
- A `.env` file was accidentally committed (recover + rotate the leaked values).
- Routine post-pilot security hygiene rotation (recommended quarterly).
- A teammate departs (rotate keys they had access to).

## Pre-rotation pre-flight

- [ ] Identify which keys need rotation (full list, not just the suspect one — adjacent compromise is common).
- [ ] Identify pilot impact: in-flight signed-in users will lose session if `BETTER_AUTH_SECRET` rotates.
- [ ] Schedule rotation during low-traffic window (Mon-Fri 22:00-06:00 IST or weekends per pilot operating window).
- [ ] Inform pilot team via email channel B (`yogesh.mohite@iksula.com`) if user-visible downtime expected.

## Inventory — where each secret lives

| Secret                        | Source / generator                             | Lives in                               | Rotation method                                   |
| ----------------------------- | ---------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| `GROQ_API_KEY`                | https://console.groq.com/keys                  | Render env vars                        | Regenerate in Groq console + paste to Render      |
| `GEMINI_API_KEY`              | https://aistudio.google.com/app/apikey         | Render env vars                        | Regenerate in AI Studio + paste to Render         |
| `RESEND_API_KEY`              | https://resend.com/api-keys                    | Render env vars                        | Regenerate in Resend + paste to Render            |
| `R2_ACCESS_KEY_ID` + secret   | Cloudflare R2 dashboard → Manage R2 API Tokens | Render env vars                        | Roll token in Cloudflare + paste pair to Render   |
| `APPS_SCRIPT_EMAIL_URL`       | Apps Script Web App deploy URL (per ADR-025)   | Render env vars                        | Redeploy Apps Script with new version → new URL   |
| `APPS_SCRIPT_EMAIL_SECRET`    | Yogesh-chosen long random string               | Render env vars + Apps Script `secret` | Generate via `openssl rand -base64 32` both sides |
| `BETTER_AUTH_SECRET`          | `openssl rand -base64 32`                      | Render env vars                        | Regenerate + paste; **all users signed out**      |
| `DATABASE_URL` / `DIRECT_URL` | Neon dashboard → Connection strings            | Render env vars                        | Reset password in Neon → update both URLs         |
| `TEST_DATABASE_URL`           | Neon `ep-blue-star` branch connection string   | Render env vars (probe-only)           | Reset password on test branch                     |
| `JIRA_WEBHOOK_SECRET`         | Yogesh-chosen long random string               | Render env vars + Jira webhook config  | Rotate both sides simultaneously                  |
| `GH_PAT` for `gh` CLI         | https://github.com/settings/tokens             | GitHub Secrets + local `gh auth login` | Regenerate PAT in GitHub + re-authenticate        |

**NOT secrets** (cleared for source): `ADMIN_SEED_EMAIL`, `BETTER_AUTH_URL`, `BETTER_AUTH_COOKIE_DOMAIN`, `NEXT_PUBLIC_*`, `NODE_ENV`, `PORT`, `EMBEDDING_MODEL_ID`, model names.

## Rotation procedure (per-secret)

### Standard rotation (provider keys — Groq / Gemini / Resend / R2)

1. **Generate the new value** in the provider's dashboard. Do NOT delete the old one yet.
2. **Render Dashboard → Service → Environment → Edit** → update the env var → Save Changes.
3. Render auto-deploys (~3-5 min). Watch the Deploy logs tab for the new build.
4. **Verify** with a canary call:
   - Groq: trigger A1 (`POST /admin/agents/composer/generate` with a small payload)
   - Resend: send a test magic-link to `yogesh.mohite@iksula.com`
   - R2: upload a tiny file via the KB upload UI
5. **Revoke the old key** in the provider's dashboard.
6. **Update Day-29 followup register** to track rotation cadence.

### `BETTER_AUTH_SECRET` rotation (forces global sign-out)

1. **Announce downtime** to pilot team via email channel B with 1-hour notice.
2. Generate new secret:
   ```bash
   openssl rand -base64 32
   ```
3. **Render Dashboard** → update `BETTER_AUTH_SECRET` → Save.
4. Render auto-deploys (~3-5 min).
5. **All BetterAuth sessions are now invalid.** Pilot team will be signed out.
6. **Verify** new sign-in works:
   - `curl -X POST https://qa-nexus-api.onrender.com/auth/sign-in -d '{"email":"yogesh.mohite@iksula.com"}'`
   - Click magic-link → land on `/home` → session established.
7. **Announce restoration** in same email thread.

### `APPS_SCRIPT_EMAIL_SECRET` rotation (both sides — must be atomic)

1. Generate new secret: `openssl rand -base64 32`.
2. **Apps Script side:** Open Apps Script project → edit `SHARED_SECRET` constant → Deploy → Manage deployments → "New version" with the same Web App URL (URL stays stable across version updates).
3. **Render side:** Update `APPS_SCRIPT_EMAIL_SECRET` env var → Save.
4. Render auto-deploys (~3-5 min). Between the Apps Script redeploy and the Render redeploy, sign-in emails will fail — expect ~5-10 min email outage.
5. **Verify** with a magic-link self-test.

### `DATABASE_URL` rotation (Neon password reset)

1. **Neon Dashboard → Roles → Reset password** for the pilot role.
2. Copy the new connection string for both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
3. **Render Dashboard** → update both env vars → Save.
4. Render auto-deploys.
5. **Verify** `curl https://qa-nexus-api.onrender.com/health` returns 200 + DB query succeeds.

## Emergency reset — `.env` accidentally committed

If a `.env` file with real secrets is pushed to GitHub:

1. **Treat ALL secrets in that file as compromised.** GitHub indexes commits; private repos still get cloned by leaked-credentials bots.
2. **Rotate every secret in the file** per the per-secret procedures above (do NOT skip any).
3. **Remove the file from git history:**
   ```bash
   git rm --cached <path-to.env>
   git commit -m "fix(secrets): remove leaked env file"
   git push
   ```
   _(History rewrite with `git filter-repo` / BFG is OPTIONAL and risky — the secrets are already exposed; rotation is what matters.)_
4. **Verify `.gitignore` rules cover all variants** (`.env`, `.env.*`, `apps/*/.env`, `secrets/`, `.secrets/`).
5. **Run `gitleaks` locally** + in CI to catch any other leaked patterns.
6. **Notify Iksula IT** if it's a corporate API key (Atlassian, internal alerting).

## Post-rotation verification

- [ ] `curl https://qa-nexus-api.onrender.com/health` returns 200
- [ ] `/admin/agents/composer/generate` returns successfully (LLM provider connected)
- [ ] Test magic-link delivered + sign-in works
- [ ] All old credentials revoked in provider dashboards
- [ ] Rotation logged in `docs/security-log.md` (create if absent)

## Cross-references

- `docs/SECURITY.md` — disclosure email + provider rotation link index
- `.claude/rules/security.md` — repo-wide security rules
- `docs/runbooks/magic-link-debug.md` — sibling runbook for email-bridge troubleshooting
- `docs/runbooks/db-migration-rollback.md` — sibling for DB-side reset paths
- `docs/architecture/adr-025-pilot-email-via-apps-script-bridge.md` — Apps Script bridge architecture
- Hard Rule 1 — $0/month gate; no rotation introduces a paid service
- Hard Rule 6 — Never put API keys in repo

_Authored Sun Day-5 2026-06-07 PM session as part of MAIN Bucket 3 (4 missing runbooks)._
