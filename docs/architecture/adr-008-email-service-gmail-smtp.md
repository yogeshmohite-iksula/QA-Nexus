# ADR-008 — Email service: Gmail SMTP (via nodemailer) for the M1 pilot

**Status:** SUPERSEDED by [ADR-018](./adr-018-email-provider-migration-resend.md) — 2026-05-11 (Day-16)
**Date:** 2026-05-04 (Day-8)
**Authors:** BE chat (proposer) · Yogesh (deployer-admin, decider)
**Supersedes:** none — extends the Day-3 EmailService (Resend SDK stub)
**Superseded by:** ADR-018 (2026-05-11) — Render Free tier silently
blocks outbound SMTP (Sept 2025 policy change), making the path
documented here non-functional in production. Migrated to Resend HTTPS
API, which round-trips through `api.resend.com` over 443 and is
unaffected by the SMTP block. The 9 `SMTP_*` env vars are deprecated;
new contract is `RESEND_API_KEY` (required) plus 4 optional fields.
The Day-6 public API surface (`sendInvitation` / `sendMagicLink` /
`sendPasswordReset` / `send` / capture+deferred modes / BCC wiring) is
preserved — only the transport flipped. See ADR-018 §4 for the full
migration record. The historical context below remains accurate for
the Day-8 → Day-15 window; it is retained for audit purposes.

---

## 1. Context

`EmailService` was wired Day-3 around the Resend SDK (`resend` npm package, free tier 3000/mo on the upgraded pilot account, 100/day on the dev account). Day-6 PM landed the high-level surface (`sendInvitation` / `sendMagicLink` / `sendPasswordReset`) + capture/deferred modes + invitation wiring + 17 jest tests. M1 invitations + project-scoped RBAC + audit query merged Sunday.

Day-7 follow-up surfaced an IT block: **Iksula IT will not approve adding a custom domain to the Resend account on the pilot timeline** (a verification round-trip via Cloudflare DNS + IT-side review queue → soonest expected 6-8 weeks). Without a custom domain, Resend's "shared sender" mode only delivers to the account holder's own address — useless for a multi-user pilot.

Yogesh has Gmail App Passwords enabled on his personal Google Workspace account. Gmail SMTP outgoing limit on a free Google account is **100 messages / rolling 24h** (well above pilot need: 8 named users × ~3 invites/resends/magic-links per week ≈ 24/wk). The decision is whether to wait 6-8 weeks for Resend custom domain OR ship a Gmail-SMTP bridge now and swap later.

**Decision drivers:**

1. **Time-to-pilot** — pilot is Day-7 → Day-21 (2 weeks). Waiting for IT means no real email for the entire pilot window.
2. **Cost gate (Hard Rule 1)** — Gmail SMTP via App Password is **$0/month**. Resend's paid tier is $20/mo (over-budget without explicit Yogesh approval per Hard Rule 1).
3. **Reversibility** — `EmailService` already has a single `sendInternal()` choke point. Swapping the transport is a sub-200-line refactor confined to `email.service.ts`. The high-level API surface (`sendInvitation` / `sendMagicLink` / `sendPasswordReset`) does NOT change.
4. **Audit / pilot tracking** — Yogesh wants a copy of every outbound email during the pilot for visibility (and so a missed delivery surfaces in his inbox immediately rather than via a bug report). Gmail SMTP supports BCC natively; Resend's API exposes BCC too. Both meet this need.
5. **Brand quality** — pilot recipients (the 8 named pilot users) are colleagues, not external customers. The fact that mail arrives `from: yogesh.ybm999@gmail.com` is acceptable for a pilot; we'd want a custom-domain `from:` for any external launch.

---

## 2. Decision

**Use Gmail SMTP via `nodemailer` + `@nestjs-modules/mailer` for the M1 pilot.** Nine env vars (provisioned in Render dashboard by Yogesh on Day-8 morning):

| Var               | Value (pilot)              | Purpose                                                                 |
| ----------------- | -------------------------- | ----------------------------------------------------------------------- |
| `SMTP_HOST`       | `smtp.gmail.com`           | Gmail SMTP entry point                                                  |
| `SMTP_PORT`       | `587`                      | STARTTLS port                                                           |
| `SMTP_SECURE`     | `false`                    | STARTTLS (not implicit SSL)                                             |
| `SMTP_USER`       | `yogesh.ybm999@gmail.com`  | SMTP auth + From address                                                |
| `SMTP_PASSWORD`   | (Render secret)            | Google App Password (16 chars). Render-encrypted; never logged.         |
| `SMTP_FROM_NAME`  | `QA Nexus`                 | Friendly From-name                                                      |
| `SMTP_FROM_EMAIL` | `yogesh.ybm999@gmail.com`  | Must match SMTP_USER (Gmail rejects spoofed From)                       |
| `SMTP_REPLY_TO`   | `yogesh.mohite@iksula.com` | Replies land in Yogesh's work inbox                                     |
| `SMTP_BCC_EMAIL`  | `yogesh.mohite@iksula.com` | Silent pilot-tracking copy of every outbound (Day-8 follow-up addition) |

`EmailService.sendInternal()` calls `nodemailer.sendMail({ from, to, bcc, replyTo, subject, html, text })` for every public method. The BCC is hidden by RFC — the recipient does NOT see Yogesh's work email in their headers; only the SMTP server (Gmail) sees it.

`packages/shared/src/schemas/smtp-env.ts` defines a Zod schema (`parseSmtpEnv`) for fail-fast validation at boot. If any of the 9 vars is missing or malformed, the service falls back to **deferred mode** (logs body to stdout, returns `messageId: 'deferred-<uuid>'`) — the API still boots, `/health` surfaces the deferral state, and Yogesh sees the validation error in Render logs.

`SMTP_PASSWORD` is read from `process.env` at runtime only:

- Never hardcoded
- Never committed to the repo (gitleaks would catch it; pre-commit hook would catch it)
- Never logged — even on send failure, the error message is scrubbed via a `String.replace(SMTP_PASSWORD, '<redacted>')` defensive pass before reaching the logger.

---

## 3. Consequences

### Positive

- **$0/month** — Hard Rule 1 held.
- **Pilot-day-8-ready** — no IT wait.
- **Single choke point** — all sends route through `nodemailer.sendMail()`; BCC + Reply-To wiring cannot be forgotten on a per-call basis (they're set centrally in `sendInternal()`).
- **Capture mode preserved** — jest tests still mock the transport via `jest.mock('nodemailer')` rather than HTTP-stubbing.
- **Boot-time validation** — Zod-parsed env config means a missing var fails on the next deploy, not on the next send hours later.

### Negative

- **From-address is Yogesh's personal Gmail.** Pilot users will see `From: "QA Nexus" <yogesh.ybm999@gmail.com>`. Acceptable internally; would not be acceptable for external launch.
- **100/day cap** — well above pilot need but a hard ceiling. Burst usage (e.g., bulk-resending 8 invitations + a magic-link round-trip on the same day) could approach the limit. `EmailService` does NOT yet enforce a rate limit; M1.5 follow-up if pilot data shows we're near the cap.
- **No suppression-list / bounce-handling** — Gmail returns errors synchronously on hard bounces; nodemailer's promise rejects, our error path captures the message into the `failed-` audit row. We do NOT yet maintain a "do not retry" list. M1.5 follow-up if the pilot generates bounces.
- **Personal Google account ToS** — Google's ToS technically restricts SMTP App Passwords to "personal use." For a pilot this is a grey-area; for production we'd need Google Workspace SMTP or a transactional provider.
- **Deliverability** — Gmail-to-Iksula-mailbox delivery should be clean (both ends are reputable senders). Unknown: whether iksula.com mail server flags `yogesh.ybm999@gmail.com` as suspicious in the body of an "invitation to QA Nexus" template. Mitigation: warm-up email to `akshay@iksula.com` BEFORE rolling out to the other 6 pilot users, and verify it lands in the inbox (not spam) AND that the BCC copy reaches `yogesh.mohite@iksula.com`.

### Neutral / observable

- `EmailService.getHealth()` now exposes `{mode, from, bccEnabled}`. `/health` surface should consume this in a follow-up if not already (M1.5).
- Audit redaction discipline (Day-6 PM) is unchanged — the M1 invitation audit rows still store email DOMAIN only on the `invitation_email_sent` row.

---

## 4. Migration plan — out of Gmail SMTP

When IT cooperates (M1.5 → M2 window) the swap is:

1. Stand up Resend custom-domain sender (`noreply@qa-nexus.iksula.com`) — one Cloudflare DNS round-trip + one Resend dashboard click.
2. Replace `nodemailer.createTransport()` block in `email.service.ts` with `new Resend(SMTP_API_KEY).emails.send(...)` — preserve the `sendInternal()` signature so `sendInvitation` / `sendMagicLink` / `sendPasswordReset` callers don't change.
3. Remove the 9 `SMTP_*` env vars from Render; replace with `RESEND_API_KEY` (already present from Day-4 provisioning, currently unused).
4. Remove `SMTP_BCC_EMAIL` field — Resend's BCC is `bcc: <email>` on `emails.send()`, identical concept.
5. Drop the `nodemailer` + `@nestjs-modules/mailer` + `@types/nodemailer` deps; remove `parseSmtpEnv` from `packages/shared` (or keep + mark deprecated for ~1 sprint in case rollback is needed).
6. Re-run the email service test suite — it mocks the transport at the right level, so swapping should produce a green diff with mostly assertion-content updates (s/sendMail/emails.send/, etc).
7. ADR-008 → status `Superseded by ADR-XXX (Resend custom domain)`.

**Estimate:** 4 BE hours net (refactor + tests + ADR + DNS verify). No schema change, no breaking API change, no FE coordination needed.

---

## 5. Alternatives considered

### A. Wait for IT-approved Resend custom domain

- **Pros:** Better From-address, higher monthly cap (3000 vs 100/day), built-in deliverability tooling.
- **Cons:** 6-8 week IT-side block. Pilot is 2 weeks. Math doesn't work. Reject.

### B. Resend "shared sender" (no custom domain)

- **Pros:** Already provisioned (Day-4), no new deps.
- **Cons:** Resend's shared sender ONLY delivers to the account holder's own email address ([docs](https://resend.com/docs/dashboard/domains/introduction)). Pilot is 8 users → only Yogesh's own invitations would arrive. Reject.

### C. Manual magic-link distribution (Slack / WhatsApp share)

- **Pros:** Zero infra. Yogesh copies the URL from `/api/invitations` create response and shares it manually.
- **Cons:** Doesn't scale beyond ~3 invitations. Defeats the point of a magic-link flow. Friction blocks dogfooding. Reject.

### D. Mailgun / SendGrid free tier

- **Pros:** Better than Resend for shared-sender deliverability.
- **Cons:** Free tier on both is 100/day too — same ceiling as Gmail. Adds a new vendor relationship + new env vars + new ADR. No marginal benefit over Gmail. Reject.

### E. Self-hosted SMTP (Postfix on the Render dyno)

- **Pros:** No 3rd party.
- **Cons:** Render's outbound port 25 is blocked (standard for cloud platforms). Even if it weren't, the IP would have zero reputation → 100% spam folder. Reject.

---

## 6. Acceptance gate (warmup test, post-merge)

> **STATUS — DEFERRED to Day 9 post-T021 (amended 2026-05-04 PM).**
> The warmup procedure below was originally specified for the same-day
> post-merge window. **Bootstrap gap discovered 2026-05-04 PM:** the
> warmup test needs an Admin session cookie to call `POST /api/invitations`,
> but the only mechanism to obtain one is the BetterAuth magic-link login
> flow — which itself depends on SMTP working (the very thing we're
> testing). Cleanest fix is during T021 magic-link wiring on Day 9, which
> includes the proper Day-0 admin seed mechanism (followup `(x)` —
> `docs/followups.md`). At T021 land, the natural login flow exists →
> session cookie → fire warmup naturally → verify per the steps below.
>
> **Risk accepted in the interim (~24-48h window):** Gmail SMTP code is
> in production but unverified for real outbound delivery. Acceptable for
> pilot scale (8 internal users; no automated invitation sends until
> Day 9+). If Yogesh wants pre-T021 verification, he can run the curl
> from §6.4 below with a manually-injected session token (DevTools cookie
> copy) — but this is optional, not blocking.

**Pre-rollout to pilot (run on Day 9 post-T021 magic-link wiring):**

1. PR `feat(api): Gmail SMTP wiring via nodemailer (ADR-008)` merges to main. ✅ **DONE** 2026-05-04 PM (PR #26 merged at `a6a2137`).
2. Render auto-redeploys (~2 min). ✅ **DONE** 2026-05-04 PM.
3. Yogesh confirms `/health` shows `email.mode: real` (M1.5 follow-up to surface the field; meanwhile check Render logs for `EmailService REAL: smtp.gmail.com:587 secure=false from=yogesh.ybm999@gmail.com bcc=yogesh.mohite@iksula.com` boot line).
4. Send a test invite to `yogesh.mohite@iksula.com` from F27 Admin tab (or via curl with Day-9 magic-link-acquired session cookie). **Recipient corrected to `yogesh.mohite@iksula.com`** — earlier draft referenced `akshay@iksula.com` (stale). Day-8 brief override is binding.
5. **Verify three things:**
   - `yogesh.mohite@iksula.com` receives the invitation in the **inbox** (not spam). If spam → halt rollout, surface to Yogesh (deliverability fix needed before more sends).
   - `yogesh.mohite@iksula.com` ALSO receives the BCC copy in the inbox (so 2 copies total — primary + BCC, both to the same address since recipient = BCC target on this warmup; for normal pilot sends the BCC will be a separate copy to Yogesh).
   - The recipient copy does NOT show `Bcc:` in the headers (Gmail strips it).
6. If all three pass → roll out invitations to remaining 6 pilot users.
7. If any fails → halt + ADR amendment.

---

## 7. Cross-references

- `apps/api/src/email/email.service.ts` (the implementation)
- `apps/api/src/email/templates/invitation.ts` (template)
- `apps/api/src/email/__tests__/email.service.spec.ts` (22 tests, including BCC wiring assertion)
- `packages/shared/src/schemas/smtp-env.ts` (Zod env contract)
- `apps/api/docs/integrations/betterauth-invitations.md` (T021 M1.5 plan that consumes this)
- `docs/architecture/adr-005-r2-storage.md` (sister ADR for the R2 service — same DEFERRED-pattern)
- `docs/SECURITY.md` (where SMTP_PASSWORD rotation will eventually be documented — M1.5 follow-up)
