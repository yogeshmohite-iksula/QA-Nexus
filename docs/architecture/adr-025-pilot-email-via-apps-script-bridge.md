# ADR-025: Pilot email via Apps Script bridge (yogesh.mohite@iksula.com Workspace)

## Status

Ratified 2026-06-06 (Sat) by Yogesh after detailed research.

## Context

Pilot launches Mon Jun 8 with 8 iksula.com users. Magic-link email infrastructure must work.

Resend domain `mail.qanexus.iksula.com` is blocked: requires DNS DKIM/SPF records on iksula.com Cloudflare zone, which Iksula IT controls (Yogesh has no DNS edit access). All transactional email services (Resend / Brevo / MailerSend / Mailgun / Postmark / AWS SES) require the same domain verification — switching services does not solve the IT-access blocker.

## Decision

Use Google Apps Script as a thin email bridge. Yogesh deploys a Web App from his Workspace account (`yogesh.mohite@iksula.com`); QA Nexus API POSTs JSON `{to, subject, htmlBody, secret}` to the Web App endpoint; Apps Script's `MailApp.sendEmail` sends from `yogesh.mohite@iksula.com`.

## Rationale

- **$0/month** (honors Hard Rule 1)
- Workspace Apps Script quota = **1,500 recipients/day** per user (75× pilot need of ~20 emails/day)
- Sender = `yogesh.mohite@iksula.com` → iksula.com recipients = highest internal Workspace trust deliverability
- No DNS work needed (Workspace handles SPF/DKIM internally for same-domain delivery)
- BetterAuth abstracted behind `EmailService`; provider swap is single env var change

## Consequences

### Positive

- Mon Jun 8 pilot launch **unblocked**
- Pilot users see trusted internal sender (`yogesh.mohite@iksula.com`)
- Migration to Resend domain post-IT cooperation is one env var swap (`EMAIL_PROVIDER=resend`)

### Negative

- Magic link URL points to `qa-nexus-web.pages.dev` not `iksula.com` (URL/sender mismatch; mitigated by Workspace internal trust for iksula→iksula delivery)
- Apps Script has no formal SLA (acceptable for pilot scale; Google infrastructure reliable in practice)
- Bridge tied to Yogesh's Workspace account (if disabled/departs, bridge breaks; mitigated by 30-min recreate runbook)

## Migration trigger

When Iksula IT verifies `mail.qanexus.iksula.com` in Resend:

1. Update env var `EMAIL_PROVIDER=resend` (or remove `APPS_SCRIPT_EMAIL_URL`)
2. Render auto-redeploys
3. `EmailService` implementation switches to Resend client
4. Apps Script bridge stays deployed as fallback

## Fallback chain

1. **Resend domain** (post-IT DNS verification) — production target
2. **Apps Script bridge** (current pilot) — `yogesh.mohite@iksula.com` sender
3. **Resend team invites** (emergency) — sends from `onboarding@resend.dev` to Yogesh only, then manual forward

## Cross-references

- Hard Rule 1 ($0/month cost gate)
- BetterAuth email sender abstraction (`EmailService` in `apps/api/src/email/`)
- ADR-018 (Resend free tier choice, supersedes ADR-008 Gmail SMTP)
- ADR-024 (NFR-003 pilot vs GA gate, parallel architectural decision)
