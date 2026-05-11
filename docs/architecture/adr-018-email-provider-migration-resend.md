# ADR-018 — Email provider migration: Gmail SMTP → Resend HTTPS API

**Status:** Accepted
**Date:** 2026-05-11 (Day-16)
**Authors:** BE+1 chat (proposer) · Yogesh (deployer-admin, decider)
**Supersedes:** [ADR-008](./adr-008-email-service-gmail-smtp.md) — Gmail SMTP via nodemailer
**Superseded by:** none (yet)

---

## 1. Context

Day-15 (2026-05-10) M3 close ceremony was blocked at the auth-flow
verification step. The cascade:

1. FE+1 flipped to BetterAuth's magic-link sign-in flow per Pattern B
   (followup `(bb)` / `(bc)`). Magic-link POST to
   `/auth/sign-in/magic-link` returned 405 → traced to the narrow
   Express mount in `apps/api/src/main.ts`. Widened to catch-all
   `/auth/*` in PR #119.
2. POST then 200'd but no email arrived in the recipient inbox. Render
   logs showed `EmailService DEFERRED — SMTP env invalid` at boot —
   the Day-8 SMTP env vars (`SMTP_HOST`, `SMTP_USER`,
   `SMTP_PASSWORD`, etc., 9 fields per ADR-008) were never set on
   Render after the Day-9 → Day-10 redeploys.
3. Yogesh added the 9 vars Day-15 evening. Next deploy: same DEFERRED
   warning, same inbox silence. `nodemailer` was reporting
   `connection timeout` to `smtp.gmail.com:587`.
4. Root cause confirmed via Render docs + community forum: **Render
   blocks outbound SMTP connections on the Free tier as of September
   2025** (anti-abuse measure following a wave of phishing-bot
   deployments). The block is silent — packets are dropped, no
   ICMP unreachable, the TCP SYN just times out after 30s. There is
   no opt-in unblock for Free; the only Render-supported escape is
   "use an HTTPS-based email API instead." The block also extends
   to ports 25 / 465 / 2525 — every standard SMTP variant.

The Day-8 ADR-008 migration plan (§4) anticipated a Resend custom-
domain swap when "IT cooperates" but assumed both transports were
otherwise viable. The 2025 Render policy invalidates that assumption
for the SMTP-bound path: ADR-008 is now non-functional in production,
not merely sub-optimal.

**Decision drivers:**

1. **Pilot-blocker** — without working email, the 8-user pilot cannot
   accept invitations or sign in via magic-link. M3 close cannot
   complete. P0.
2. **Cost gate (Hard Rule 1)** — Resend free tier is **3,000
   emails/month forever** (no trial expiry, no card on file required),
   100/day cap. Pilot peak: ~24 emails/week. Comfortably free.
3. **Reversibility / blast radius** — `EmailService.sendInternal()` is
   still the single choke point added in Day-6. Migration is
   transport-only; the `sendInvitation` / `sendMagicLink` /
   `sendPasswordReset` / `send` public surface is preserved verbatim.
   FE+1 needs zero coordination.
4. **BetterAuth alignment** — Resend is BetterAuth's official default
   email provider in their docs (per `better-auth.com/docs/plugins/
magic-link`). Their integration examples assume `new Resend(...)`.
   This means future BetterAuth upgrades / plugin additions will be
   smoother on Resend than on a custom nodemailer transport.
5. **No new accounts to provision** — RESEND_API_KEY was already
   present in Render env vars (Day-4 provisioning, originally for the
   Day-3 → Day-7 stub period). Yogesh re-issued a fresh key
   (`qa-nexus-pm1-api`) on Day-16 morning to rotate after the failed
   Day-7 IT-block window.

---

## 2. Decision

**Use Resend HTTPS API via the official `resend` npm SDK as the M3+
email transport.** Five env vars (1 required + 4 optional, down from
9 SMTP vars):

| Var                 | Required | Default                 | Purpose                                                   |
| ------------------- | -------- | ----------------------- | --------------------------------------------------------- |
| `RESEND_API_KEY`    | yes      | —                       | Resend bearer token (`re_...`). Render secret.            |
| `RESEND_FROM_EMAIL` | no       | `onboarding@resend.dev` | From-address. Default works without domain verification.  |
| `RESEND_FROM_NAME`  | no       | `QA Nexus`              | Display name in From header.                              |
| `RESEND_REPLY_TO`   | no       | (omitted)               | Reply-To header. Recommended in any non-throwaway deploy. |
| `RESEND_BCC_EMAIL`  | no       | (omitted)               | Silent pilot-tracking copy (followup `(bg)` retained).    |

`EmailService.sendInternal()` calls `this.resend.emails.send({ from,
to, subject, html, text, bcc?, replyTo? })`. BCC + Reply-To are
conditionally spread when their env vars are set — Resend's API
rejects `null` / empty-string for these fields.

`packages/shared/src/schemas/resend-env.ts` defines a Zod schema
(`parseResendEnv`) for fail-fast validation at boot. If
`RESEND_API_KEY` is missing or doesn't start with `re_`, the service
falls back to **deferred mode** — same shape as ADR-008, same boot
log warning prefix, same `deferred-<uuid>` messageId pattern. The API
still boots; magic-links log to stdout as a recovery path while the
operator sets the env var.

`RESEND_API_KEY` is read from `process.env` at runtime only:

- Never hardcoded.
- Never committed to the repo (`.gitleaks.toml` matches `re_*` token
  patterns; `.claude/hooks/pre-tool-use/check-secrets.sh` matches at
  author-time).
- Never logged — error messages are scrubbed via
  `String.split(RESEND_API_KEY).join('<redacted>')` defensive pass
  before reaching the logger (mirrors the SMTP_PASSWORD redaction
  from ADR-008).

The `SMTP_*` env vars from ADR-008 are deprecated. Boot detects them
and emits a single warning pointing to followup `(bh)` for cleanup.
They are NOT removed from Render automatically — operator action is
followed up out-of-band to keep this PR purely additive on the env
surface (so a rollback is a 1-minute redeploy of the prior commit
without re-entering 9 secrets).

---

## 3. Consequences

### Positive

- **Production email works again.** Render's SMTP block is bypassed.
- **$0/month** — Hard Rule 1 held. 3,000/mo free vs ~96/mo expected
  pilot use leaves 30× headroom.
- **5 env vars vs 9** — simpler operator surface, fewer ways to mis-
  configure. Optional fields have sane defaults so the minimal viable
  config is just `RESEND_API_KEY=<key>`.
- **BetterAuth-native path** — easier upgrade trajectory.
- **Single choke point preserved** — all sends still route through
  `sendInternal()`; BCC + Reply-To wiring cannot be forgotten on a
  per-call basis.
- **Capture mode preserved** — jest tests now mock the `resend`
  module via `jest.mock('resend')` instead of `jest.mock('nodemailer')`.
  Behavioural assertions are unchanged.
- **Boot-time validation** — Zod-parsed env config means a missing /
  malformed key fails on the next deploy, not on the next send hours
  later.
- **Better deliverability** — Resend uses dedicated transactional IPs
  with built-in DKIM / DMARC alignment. `onboarding@resend.dev`
  (sandbox) is whitelisted with most major mailbox providers. Once
  the iksula.com domain is verified (followup `(bg)`), QA Nexus
  inherits full domain-aligned reputation.

### Negative

- **`onboarding@resend.dev` from-address is unbranded.** Pilot users
  see `From: "QA Nexus" <onboarding@resend.dev>` until followup
  `(bg)` lands the iksula.com domain verification. Acceptable for the
  internal pilot (recipients are colleagues who know the context);
  unacceptable for any external launch.
- **100 emails/day soft cap on Resend free.** Same ceiling as Gmail
  SMTP per ADR-008; well above pilot need but a hard ceiling. Burst
  scenarios (bulk-resend + magic-links + password resets on the same
  day) should stay well under. M1.5 / M5 follow-up if pilot data
  shows the cap being approached.
- **Vendor dependency** — Resend's free tier ToS could change. SLA on
  the free plan is best-effort. Mitigation: the abstraction layer
  (`EmailService.sendInternal()`) lets us swap providers without
  touching call sites; a future move to AWS SES / Postmark / etc.
  would be a sub-200-line change to one file.
- **No suppression-list / bounce-handling** — Resend exposes a
  webhook-driven bounce + complaint stream we are not yet consuming.
  M5 follow-up; pilot data will tell us if we need it.

### Neutral / observable

- `EmailService.getHealth()` now exposes `{mode, from, bccEnabled}`
  with `from` defaulting to `onboarding@resend.dev` when only the API
  key is set. `/health` consumer surface is unchanged.
- Audit redaction discipline is unchanged — the M1 invitation audit
  rows still store email DOMAIN only on the `invitation_email_sent`
  row. PII contract preserved.
- 5 SMTP env vars + 4 Render-specific pieces (`SMTP_FROM_NAME`,
  `SMTP_FROM_EMAIL`, `SMTP_REPLY_TO`, `SMTP_BCC_EMAIL`) become
  unused on Render until cleanup (followup `(bh)`).

---

## 4. Migration record (this ADR's actual scope)

Code changes shipped in this PR:

1. `pnpm add resend -F @qa-nexus/api` — SDK dependency.
2. `apps/api/src/email/email.service.ts` — full rewrite: replace
   `nodemailer.createTransport()` block with `new Resend(...)`,
   replace `transporter.sendMail()` with `this.resend.emails.send()`,
   adapt error path for Resend's `{ data, error }` response shape,
   conditionally spread `bcc` / `replyTo` (Resend rejects null),
   redact `RESEND_API_KEY` from logged errors, retain DEFERRED + BCC
   - capture-mode patterns from ADR-008.
3. `packages/shared/src/schemas/resend-env.ts` (new) — Zod schema +
   `parseResendEnv()`. `parseSmtpEnv()` retained for ~1 sprint in
   case rollback is needed (followup `(bh)` will retire it).
4. `packages/shared/src/index.ts` — re-export `resend-env` schema.
5. `apps/api/src/email/__tests__/email.service.spec.ts` — full
   rewrite to mock `resend` instead of `nodemailer`. Test count
   roughly preserved; behavioural assertions are 1:1 with ADR-008
   spec where applicable.
6. `docs/deploy/render-runbook.md` — Step 3 env var table updated.
7. `docs/architecture/adr-008-email-service-gmail-smtp.md` — header
   marked SUPERSEDED, links forward to this ADR. Body retained as
   audit history (Hard Rule 11 spirit: explain WHY rather than
   delete).
8. `CLAUDE.md` — tech stack `Email:` line flipped from
   "Resend free" (which was historically aspirational from kickoff)
   to "Resend free tier (3000/mo) via @resend SDK over HTTPS
   (ADR-018)" — now grounded in code.
9. `docs/CHANGELOG.md` — Day-16 entry under `[Unreleased]`.

Operator-side changes deferred to followups:

- `(bg)` — verify `iksula.com` domain in Resend dashboard so
  `from: noreply@qanexus.iksula.com` becomes valid. ~1h Cloudflare
  DNS round-trip + Resend dashboard click. Until then,
  `onboarding@resend.dev` is the active From-address.
- `(bh)` — remove the 9 deprecated `SMTP_*` env vars from Render
  staging + production. ~5min via Render dashboard. EmailService
  warns on detection; cleanup is a polish item.
- `(bi)` — update `apps/api/docs/integrations/betterauth-magic-link.md`
  - the relevant auth-flow specs to assert "Resend" not "nodemailer"
    in the email-delivery contract sentence.

---

## 5. Alternatives considered

### A. Stick with Gmail SMTP via a forwarding proxy

- **Pros:** No code change to `EmailService` if the proxy speaks SMTP.
- **Cons:** Render's outbound block is at the L4 packet level — any
  proxy hosted on Render hits the same wall. A proxy hosted off-Render
  (e.g., a tiny VPS) costs $5+/mo (Hard Rule 1 violation) AND adds a
  new piece of infrastructure to operate. Reject.

### B. Migrate to AWS SES free tier

- **Pros:** 62,000 emails/month free (when sent FROM an EC2 instance —
  not our deployment shape, so we'd get the standard 200/day on the
  pure-API path, still above pilot need). Mature, low-cost long-term.
- **Cons:** AWS account setup + IAM + sandbox-removal review (~1
  business day). Three new env vars (access key + secret + region).
  No BetterAuth-native examples. Vendor learning curve. The marginal
  benefit over Resend (better long-term ceiling, more vendor
  flexibility) is not worth the Day-16 friction during an M3-close
  blocker. Reject FOR NOW; revisit M5 if Resend's free plan changes.

### C. Postmark / Mailgun / SendGrid free tier

- **Pros:** All three are mature transactional providers.
- **Cons:** Postmark free is 100/mo (insufficient for any growth
  beyond pilot). Mailgun's "free" plan now requires card-on-file +
  has a 3-month trial expiry. SendGrid free is 100/day BUT the
  signup flow requires a use-case approval that has rejected
  pilot-stage SaaS in the past (community reports). Resend's
  evergreen 3000/mo with no card requirement is strictly better for
  the pilot window. Reject.

### D. Self-hosted SMTP outbound off Render

- **Pros:** No vendor.
- **Cons:** Cheapest qualifying VPS is $4-5/mo (Hard Rule 1 violation).
  IP would have zero reputation → 100% spam folder. Operating burden.
  Reject.

### E. Defer email entirely, distribute magic-links via Slack DM

- **Pros:** Zero infra.
- **Cons:** Doesn't scale beyond ~3 invitations. Defeats the M3
  acceptance gate. Friction blocks dogfooding. Considered + rejected
  as ADR-008 §5C; same reasoning applies. Reject.

---

## 6. Acceptance gate (post-merge)

1. PR `feat(api): migrate EmailService to Resend HTTPS API (ADR-018)`
   merges to `main`.
2. Render auto-redeploys (~2 min). Yogesh has already set
   `RESEND_API_KEY` (Day-16 morning) so deploy boots clean.
3. Verify Render logs show:
   `EmailService REAL: Resend HTTPS API · from="QA Nexus" <onboarding@resend.dev>`
   (with `bcc=yogesh.mohite@iksula.com` if `RESEND_BCC_EMAIL` set,
   otherwise `bcc=(none)`).
4. Yogesh fires a magic-link request to `yogesh.mohite@iksula.com`
   from the FE sign-in form.
5. **Verify three things:**
   - `yogesh.mohite@iksula.com` receives the magic-link email in the
     **inbox** (not spam). If spam → halt rollout, surface to BE+1
     for deliverability triage (likely needs followup `(bg)` ahead
     of schedule).
   - The magic-link URL works — clicking it lands the recipient on
     the authenticated app shell.
   - If `RESEND_BCC_EMAIL` is set, the BCC copy arrives in the same
     inbox (since recipient = BCC target on warmup).
6. If all three pass → M3 close ceremony resumes with the remaining
   E2-E8 tasks (Composer/Curator smoke, perf benchmark, edge cases,
   cross-FE E2E, ceremony, EOD).
7. If any fails → halt + ADR amendment + new followup row.

---

## 7. Cross-references

- `apps/api/src/email/email.service.ts` (the implementation)
- `apps/api/src/email/templates/invitation.ts` (template, unchanged)
- `apps/api/src/email/__tests__/email.service.spec.ts` (rewritten test
  suite — ~25 tests)
- `packages/shared/src/schemas/resend-env.ts` (Zod env contract)
- `packages/shared/src/schemas/smtp-env.ts` (deprecated, retained for
  rollback window)
- `docs/architecture/adr-008-email-service-gmail-smtp.md` (superseded)
- `docs/deploy/render-runbook.md` Step 3 (env var table)
- `docs/followups.md` rows `(bg)` `(bh)` `(bi)`
- Render's Sept 2025 SMTP-block policy — see Render docs
  "Outbound Network Restrictions" (community thread + status page)
- Resend pricing page: `resend.com/pricing` (Free tier 3000/mo)
- BetterAuth magic-link plugin docs:
  `better-auth.com/docs/plugins/magic-link`
