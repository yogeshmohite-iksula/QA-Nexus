# Webhook raw-body middleware design

**Status:** Active (Day-19, 2026-05-15) — established by Jira webhook receiver (PR feat/be-jira-webhook-receiver).
**Spec context:** PM1_PRD §3 (Jira sync) + PM1_ERD §6 + followup `(bq)` (filed Day-18).
**Reusable for:** any future webhook receiver that uses HMAC over raw bytes — Slack, GitHub, Stripe, Linear.

---

## The problem

Atlassian Jira computes the `X-Hub-Signature: sha256=<hex>` header by HMAC-SHA256 over the **raw request bytes** of the webhook payload. NestJS's default Express body-parser (`bodyParser.json()`) consumes the request stream and replaces `req.body` with a parsed JavaScript object.

If our handler then computes HMAC over `JSON.stringify(req.body)`, the resulting byte sequence differs from what Atlassian signed:

- **Whitespace** — formatters often re-indent (Atlassian uses tight `{"key":"val"}`, V8's default `JSON.stringify` matches but custom replacers don't).
- **Key order** — V8 mostly preserves insertion order on objects with string keys, but the spec doesn't guarantee it. Atlassian's serializer might emit `{"id":...,"key":...}` while ours emits `{"key":...,"id":...}`.
- **Unicode escape forms** — `é` vs the literal `é` byte sequence.
- **Number serialization** — `1715000000000.0` vs `1715000000000`.

Result: every legitimate webhook fails HMAC verification in production. Worse, the failure mode is silent — it just looks like the secret is wrong.

## The fix — route-scoped raw middleware

Install `express.raw({ type: '*/*' })` on the webhook path **only**, **before** the global `express.json()` parser registers. The handler then reads `req.body` as a `Buffer` of the original bytes, computes HMAC over that buffer, and `JSON.parse(buffer.toString('utf8'))` for payload access.

### Implementation in QA Nexus PM1

`apps/api/src/main.ts` (lines ~134-145):

```ts
// 1. BetterAuth catch-all — uses raw body for cookie signing (Day-15+).
expressApp.all('/auth/*', toNodeHandler(authService.auth));

// 2. Raw-body middleware for Jira webhook — Day-19 P2.
//    MUST be installed BEFORE express.json() to bypass the global parser.
app.use('/api/jira/webhook', express.raw({ type: '*/*', limit: '5mb' }));

// 3. Global JSON parser for everything else.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

**Why path-scoped over global:**

1. Forcing the global body-parser to be raw breaks every other controller in the app — they all expect parsed `req.body`.
2. Per-controller body-parser swap via `MiddlewareConsumer.forRoutes()` is the NestJS idiomatic path, but it runs AFTER Express-level middleware that's already installed in main.ts (which is where global JSON parsing lives in our setup). Path order matters.
3. Express middleware is path-prefix matched + executed in registration order — installing the raw parser first on `/api/jira/webhook` means subsequent calls to `app.use(express.json())` skip that path entirely.

**Why `type: '*/*'`:**
Atlassian sends `Content-Type: application/json` for webhook payloads, but defensive — we want to accept whatever they ship in case of future evolution.

**Why `limit: '5mb'`:**
Jira webhooks are typically <50 KB (issue + minimal fields). 5 MB matches our defect-attachment ceiling for safety — never want a webhook to be the request that OOMs the dyno.

## Verification path in the controller

```ts
@Post('jira/webhook')
webhook(@Req() req: Request, @Res() res: Response): void {
  // 1. Pull raw body bytes — Buffer if middleware mounted, undefined/object otherwise.
  const rawBody = req.body as unknown;
  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: 'RawBodyMissing' });
  }

  // 2. Verify HMAC over raw bytes (constant-time via crypto.timingSafeEqual).
  const sigHeader = req.headers['x-hub-signature'];
  const result = verifyHmacSha256(rawBody, sigHeader, process.env.JIRA_WEBHOOK_SECRET ?? '');
  if (!result.ok) {
    return res.status(401).json({ error: 'InvalidSignature', reason: result.reason });
  }

  // 3. NOW parse JSON — defensive Zod-validate the shape.
  const parsed = JSON.parse(rawBody.toString('utf8'));
  const validated = JiraWebhookPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    return res.status(400).json({ error: 'PayloadValidationFailed' });
  }

  // 4. Handler logic + audit-write + 200 ack.
  this.jiraSync.recordWebhookReceived(validated.data);
  res.status(200).json({ ack: true, eventType: validated.data.webhookEvent });
}
```

## HMAC verifier contract

`apps/api/src/jira-sync/hmac-verifier.ts` exposes a single pure function:

```ts
verifyHmacSha256(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): { ok: true } | { ok: false; reason: VerifyFailReason }
```

**Fail-closed semantics:**

- Empty secret → `{ ok: false, reason: 'secret_missing' }` (defends against missing env var in dev).
- Missing/empty header → `{ ok: false, reason: 'missing_header' }`.
- Header doesn't match `sha256=<64-hex>` regex → `{ ok: false, reason: 'malformed_header' }`.
- HMAC compute disagrees → `{ ok: false, reason: 'signature_mismatch' }`.

**Constant-time compare:** uses `crypto.timingSafeEqual` on the decoded byte buffers — defense against timing-attack signature recovery (BREACH-class side-channel attacks on shared secrets).

**Reusability:** the function takes secret as a parameter (not from env) so unit tests can run with a known test secret. The controller resolves `process.env.JIRA_WEBHOOK_SECRET` at request time and passes it in.

## Future webhook receivers (M5+)

Same pattern reapplies for any HMAC-over-raw-body provider:

| Provider       | Header name           | Secret env var          | Notes                                                        |
| -------------- | --------------------- | ----------------------- | ------------------------------------------------------------ |
| Jira (this PR) | `X-Hub-Signature`     | `JIRA_WEBHOOK_SECRET`   | sha256 prefix                                                |
| Slack          | `X-Slack-Signature`   | `SLACK_SIGNING_SECRET`  | `v0=<hex>` prefix; combines with `X-Slack-Request-Timestamp` |
| GitHub         | `X-Hub-Signature-256` | `GITHUB_WEBHOOK_SECRET` | identical sha256 prefix to Jira                              |
| Stripe         | `Stripe-Signature`    | `STRIPE_WEBHOOK_SECRET` | timestamp + signature comma-separated                        |
| Linear         | `Linear-Signature`    | `LINEAR_WEBHOOK_SECRET` | similar to Jira                                              |

For each new provider:

1. Add another `app.use('/api/<provider>/webhook', express.raw({ type: '*/*', limit: '5mb' }))` in main.ts.
2. Implement provider-specific verifier (most are 90% identical to `verifyHmacSha256` — wrap into the existing function or add a sibling).
3. Document the secret env var in `apps/api/.env.example` (placeholder only — real value lives in Render env vars).

## Cost-gate alignment

Webhook receivers add zero infra. The receiver is invoked by Atlassian/Slack/etc — no polling cost. The audit-write happens via `AuditService.writeNonBlocking()` (fire-and-forget) so the HTTP 200 ack returns in <50ms. System workspace UUID is cached at `OnModuleInit` (single boot-time DB hit) so no per-webhook prisma round-trip — Neon CU-hr untouched.

## Cross-references

- `apps/api/src/jira-sync/hmac-verifier.ts` — the verifier implementation
- `apps/api/src/jira-sync/jira-sync.controller.ts` — the request flow
- `apps/api/src/jira-sync/__tests__/hmac-verifier.spec.ts` — 10 unit tests (4 fail-reason buckets + happy-path + edge cases)
- `apps/api/src/main.ts` — middleware mount order
- followup `(bq)` 2026-05-14 — the original design note that this doc fulfills
- ADR-019 (Sherlock prompt strategy) — sibling Day-19 backend deliverable
