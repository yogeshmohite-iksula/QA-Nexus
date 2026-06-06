# BINDING RULE — DNS authority verification on Day-1 of any project

**Type:** feedback · **Filed:** Sat Day-3+4 2026-06-06 · **First observed:** Sat Day-3+4 AM (Iksula IT DNS blocker discovery)

## Rule

Day-1 of any project, explicitly verify who controls DNS for the production domain. Don't assume the dev's email-on-domain means DNS edit access. **Domain ownership ≠ email account ownership ≠ DNS edit access.** The three rights are distinct and must each be verified independently.

## Why this exists

Sat Jun 6 morning. QA Nexus PM1 pilot launches Mon Jun 8 with 8 iksula.com users. Magic-link email infrastructure plan: Resend domain `mail.qanexus.iksula.com` with DKIM/SPF DNS records on iksula.com Cloudflare zone. Discovery Sat morning: Yogesh has an iksula.com email account but does NOT have DNS edit access on the iksula.com zone — that's controlled by Iksula IT. All transactional email services (Resend / Brevo / MailerSend / Mailgun / Postmark / AWS SES) require the same domain verification step, so switching email vendors doesn't solve the IT-access blocker.

Drove ADR-025 pivot to Apps Script bridge from yogesh.mohite@iksula.com Workspace — sender is internal-trust + no DNS work needed, unblocking Mon Jun 8.

Cost of late discovery: ~3 hours Saturday morning re-architecting email path + writing ADR-025 + rebuilding the EmailProvider strategy + opening PR #235. If the question had been asked Hour-1 of the project, we'd have planned the Apps Script bridge from M0 instead of M5 evening.

## How to apply

At project kickoff (Day-1, Hour-1), ask explicitly:

1. **Domain ownership:** "Who owns the production domain (registrar)?"
2. **Email account ownership:** "Who provisions email accounts on this domain (Workspace / Microsoft 365 admin)?"
3. **DNS edit access:** "Who has Cloudflare / Route53 / DNS provider admin rights to this zone?"

The three answers may be different people / teams. The third one is the binding constraint for ALL of: email domain verification, custom domain on hosting (Cloudflare Pages / Render), SSL cert provisioning, subdomain delegation, MX/SPF/DKIM/DMARC records, and CNAME-based migrations.

If the answer to #3 is "I'll have to ask IT" — assume a multi-day SLA and route around it via fallback strategies (e.g., subdomain on a vendor-controlled zone, vendor-sender like `*.resend.dev`, or Apps Script bridge from a personal Workspace account).

## Cross-references

- `docs/architecture/adr-025-pilot-email-via-apps-script-bridge.md` — the ADR this rule drove
- ADR-018 (Resend free tier choice) — the plan this rule overturned
- ADR-008 (Gmail SMTP, superseded) — the original Day-0 plan that was killed by Render SMTP blocking
- Cost-gate ($0/month) — DNS-blocker workarounds must still honor the budget
