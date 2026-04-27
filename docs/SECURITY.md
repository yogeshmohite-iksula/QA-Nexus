# QA Nexus PM1 — Security Policy

> Spec: P1.5 of `docs/audits/2026-04-27-skill-alignment-audit.md`.
> Pairs with `.claude/hooks/pre-tool-use/check-secrets.sh` (author-time block) and `.gitleaks.toml` (CI scan).

## Disclosure policy

Suspected vulnerabilities, leaked secrets, or PII exposure → email **security@iksula.com** with subject prefix `[QA Nexus PM1]`.

CC the on-call PM1 admins:

- **Yogesh Mohite** (Admin RBAC, deployer-admin) — Slack `@yogesh.mohite`
- **Akshay Panchal** (QA Lead) — Slack `@akshay.panchal`

Do **NOT** open a public GitHub issue or pull-request comment for security reports — the QA Nexus repo (`yogeshmohite-iksula/QA-Nexus`) is private but issue notifications are routed to the team's general channel.

Acknowledgement SLA: 1 business day. Triage SLA: 3 business days. Pilot users (8 named in `CLAUDE.md`) will be notified via Slack `#qa-nexus-pm1` if any incident has user-facing impact.

## Per-provider secret rotation

If a key is suspected exposed, rotate within **1 hour** of discovery. Each provider has a self-service rotation flow — no support ticket needed.

| Provider                                         | Where to rotate                                                 | Where the new value lives                                                                                         | Notes                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Groq**                                         | https://console.groq.com/keys                                   | Render env var `GROQ_API_KEY`                                                                                     | Revoke leaked key first, then issue new one                                                                          |
| **Google AI / Gemini**                           | https://aistudio.google.com/app/apikey                          | Render env var `GEMINI_API_KEY` (and `GOOGLE_API_KEY` if mirrored)                                                | Free-tier quota is per-project, not per-key — rotation is non-destructive                                            |
| **Cloudflare API token**                         | https://dash.cloudflare.com/profile/api-tokens                  | GitHub repo secret `CLOUDFLARE_API_TOKEN` (used by `.github/workflows/deploy.yml`) + Render env                   | Use a scoped token (Pages:Edit + Workers:Edit only); avoid the global key                                            |
| **Resend**                                       | https://resend.com/api-keys                                     | Render env var `RESEND_API_KEY`                                                                                   | Sender domain verification is separate; rotation does not require re-verifying                                       |
| **BetterAuth**                                   | regenerate locally: `openssl rand -base64 48`                   | Render env var `BETTERAUTH_SECRET`                                                                                | **WARNING:** regenerating invalidates all active sessions — pilot users will be force-logged-out                     |
| **Neon (Postgres)**                              | https://console.neon.tech → project → Settings → Reset password | Render env var `DATABASE_URL` + GitHub Actions secret `DATABASE_URL` (for `pg_dump` cron in `.github/workflows/`) | Free-tier branch backups retain the OLD password for 7 days — rotate again after 7 days for full hygiene             |
| **Cloudflare R2**                                | https://dash.cloudflare.com → R2 → Manage API Tokens            | Render env vars `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY`                                                       | Presigned URLs already issued remain valid until expiry (default 1h) — short TTLs in PM1_ERD §3.7 limit blast radius |
| **OpenTelemetry / Grafana Cloud / Better Stack** | each provider's dashboard                                       | Render env vars `OTEL_EXPORTER_OTLP_HEADERS` + `BETTER_STACK_TOKEN`                                               | Read-only data ingest tokens — rotation is low-risk                                                                  |

## Incident response

| T+                | Action                                                                                                                                                                                                            | Owner           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **0** (discovery) | Confirm exposure: search public repos, paste sites, error logs, Slack scrollback                                                                                                                                  | Reporter        |
| **+15 min**       | Notify Yogesh + Akshay via Slack `#qa-nexus-pm1` channel with severity (P1 / P2 / P3) and provider                                                                                                                | Reporter        |
| **+1 hr**         | Rotate the affected secret per the table above. Confirm the new key works in a Render preview deploy                                                                                                              | Yogesh          |
| **+2 hr**         | Review the `audit_log` table (PM1_ERD §3.13, F28 Settings & Audit screen) for any actions taken with the leaked key. Look for unexpected rows on sensitive tables (`users`, `auth_sessions`, `llm_provider_keys`) | Yogesh + Akshay |
| **+24 hr**        | Write postmortem at `docs/incidents/YYYY-MM-DD-<slug>.md` covering: timeline, root cause, blast radius, remediation, prevention                                                                                   | Whoever rotated |

## Severity definitions

| Severity | Definition                                                                                           | Examples                                                             |
| -------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **P1**   | Production data exposed, customer PII at risk, or credential grants attacker actions inside QA Nexus | Leaked `DATABASE_URL`, leaked `BETTERAUTH_SECRET`, RCE in production |
| **P2**   | Credential exposed but blast radius is bounded by free-tier quota / read-only scope                  | Leaked Grafana ingest token, leaked Resend API (rate-limited)        |
| **P3**   | Best-practice violation with no immediate exploit path                                               | Outdated dependency with disclosed CVE not on our code path          |

## Layered defenses

| Layer                          | Control                                                                                                        | Where                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Author-time**                | `check-secrets.sh` PreToolUse hook blocks Edit/Write of files containing provider key patterns                 | `.claude/hooks/pre-tool-use/check-secrets.sh` |
| **Pre-commit (file-level)**    | `.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `secrets/`                       | `.gitignore` (root)                           |
| **Pre-commit (content-level)** | husky `pre-commit` runs `lint-staged` which can be extended to call `gitleaks protect --staged`                | `.husky/pre-commit`                           |
| **CI**                         | `gitleaks detect --source .` job in PR workflow uses `.gitleaks.toml` rules                                    | `.github/workflows/ci.yml`                    |
| **Runtime**                    | Render dashboard env vars (not the repo) are the source of truth for live keys                                 | Render → Service → Environment                |
| **Audit**                      | All state-changing operations write to HMAC-SHA256-chained `audit_log` table; surfaced in F28 Settings & Audit | PM1_ERD §3.13                                 |

## Allowlisted patterns

`.env.example` placeholder values are allowed (e.g., `<your-key-here>`, `REPLACE_ME`). See the `[allowlist]` section of `.gitleaks.toml`.

Test fixtures (`gsk_fake...`, `AIzaSyEXAMPLE...`) used to verify the `check-secrets.sh` hook are allowlisted globally so the hook can be self-tested without tripping itself.

## What NOT to do

- ❌ Do not `git rm` the leaked file as the only response — the secret is in git history forever. **Always rotate the credential first.**
- ❌ Do not use `git filter-branch` or `git rewrite` on `main` — coordinate with Yogesh; rewrite history only if the secret is high-impact AND the repo has few clones.
- ❌ Do not commit a `.env.example` containing real values "to make local dev easier".
- ❌ Do not paste secrets into Slack threads, Linear tickets, or Claude Code conversations — Slack history and LLM provider logs are out of our control.
