# BetterAuth ↔ Invitations integration plan (M1, T021)

**Status:** PLAN — no code yet. Drafted Day-6 (2026-05-02) on
`feature/be-m1-users-schema`. The implementation lands in M1 final
once MS0-T021 (BetterAuth Postgres adapter) is fully wired.

**Audience:** BE chat (M1 implementer) + Yogesh (architectural review)

- FE chat (knows what cookie shape will land after invite-accept).

---

## 1. Why a plan, not code

InvitationsService.accept() today:

1. Hashes the inbound plaintext token, looks up `UserInvitation` by hash.
2. Validates status / expiry / not-already-a-user.
3. In a single transaction: creates the `users` row (with placeholder
   `passwordHash = 'PENDING_BETTERAUTH_M1'`), creates `project_members`
   rows for each scoped project, flips invitation to `accepted`.
4. Audits `invitation_accepted`.
5. Returns `{ ok, user, workspaceId }` to the caller.

What's MISSING for a real-world flow: **the user has no session after
accept**. They've been provisioned but they can't actually sign in
yet — the placeholder password is intentionally non-recoverable, and
BetterAuth hasn't been told about them. The FE would have to redirect
them to `/sign-in` and have them request a fresh magic-link, which
defeats the whole "click invite → land in workspace" value prop.

This doc is the contract for closing that gap without breaking the
audit chain or letting the invitation token escape its single-use
guarantee.

---

## 2. Design decision: TWO tokens, NOT one

**Recommendation: keep the invitation token and the BetterAuth session
token as separate values.** Do not reuse the invitation token as a
session token.

### Rationale

| Concern                | One-token reuse                                                                                                | Two-token (recommended)                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Token lifetime         | Invitation = 7 days; session = 30 days. One value can't have two TTLs cleanly.                                 | Each lives in its native table with native TTL.                                                   |
| Revocability           | Revoking the invitation would also kill the session if reused.                                                 | Revoke independently — invitation revocation only affects pending invites.                        |
| Cookie semantics       | Invitation token is a URL query param (`?token=…`); session token is a cookie. Mixing channels = CSRF surface. | Native: invitation in URL, session in cookie, no overlap.                                         |
| Audit chain            | One row records both "accepted" and "session created" — tightly coupled.                                       | Two rows: `invitation_accepted` (immutable history) + `session_created` (BetterAuth's own audit). |
| BetterAuth API surface | Would require a custom plugin to teach BetterAuth about invitation tokens.                                     | Use BetterAuth's existing `signInWithMagicLink` / `verifyEmail` flows — no custom plugin.         |

The cost of two tokens is one extra DB row per accept (the BetterAuth
session) and one extra HTTP roundtrip if we go through BetterAuth's
public API. Both are negligible.

---

## 3. Proposed flow (sequence)

```
┌─────┐   ┌───────────────────────┐   ┌────────────────────┐   ┌────────────┐
│ FE  │   │ /api/invitations/     │   │ InvitationsService │   │ BetterAuth │
│     │   │ accept                │   │                    │   │            │
└──┬──┘   └────────┬──────────────┘   └─────────┬──────────┘   └─────┬──────┘
   │  POST {token, displayName}    │            │                    │
   │ ─────────────────────────────►│            │                    │
   │                                │ accept()  │                    │
   │                                │──────────►│                    │
   │                                │           │ tx: users.create + │
   │                                │           │     project_members.createMany +
   │                                │           │     invitation flip to accepted
   │                                │           │                    │
   │                                │           │ audit: invitation_accepted
   │                                │           │                    │
   │                                │           │ auth.api.createSession({ userId, …}) (NEW)
   │                                │           │ ──────────────────►│
   │                                │           │           ┌────────┘
   │                                │           │ ◄───────── { sessionId, sessionToken, expiresAt }
   │                                │           │                    │
   │                                │           │ Set-Cookie: better-auth.session_token=…
   │                                │ ◄─────────│ { ok, user, workspaceId, sessionExpiresAt }
   │ ◄──────────────────────────────│ 200 OK   │                    │
   │                                │ + Cookie │                    │
   │                                                                 │
   │ Browser stores cookie + redirects to /home/<role>              │
   │ Subsequent requests carry the better-auth.session_token cookie │
   │ (handled by RolesGuard.resolveSession exactly like sign-in)    │
```

### Key timing rule

**The session is created AFTER the user/membership/invitation transaction
commits.** Reasons:

1. If the BetterAuth session-create call fails AFTER the DB commit, the
   user exists + can re-attempt sign-in via magic-link. The invitation is
   already marked accepted (idempotent on retry).
2. If the session-create call fails BEFORE the commit, we'd have to
   roll back — but BetterAuth doesn't participate in our Prisma
   transaction (different DB session). Easier to fail-forward.
3. Audit ordering: `invitation_accepted` MUST be the FIRST audit row
   for this user (it's the genesis event in their workspace activity
   timeline). BetterAuth's own session audit follows naturally.

---

## 4. Failure paths (additive to today's coverage)

| Scenario                                                    | Today                                                                    | After this plan                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unknown token                                               | 404 NotFoundException                                                    | unchanged                                                                                                                                                                       |
| Already accepted                                            | 410 GoneException                                                        | unchanged                                                                                                                                                                       |
| Revoked                                                     | 410 GoneException                                                        | unchanged                                                                                                                                                                       |
| Expired                                                     | 410 + auto-mark `expired`                                                | unchanged                                                                                                                                                                       |
| Email already user                                          | 409 ConflictException                                                    | unchanged                                                                                                                                                                       |
| BetterAuth session-create fails AFTER tx commit             | (n/a — no session attempt)                                               | 200 OK + audit `session_create_failed_post_accept` warn-level + response includes `sessionDeferred: true` flag → FE redirects to `/sign-in` to get a magic-link the normal way. |
| Race: two parallel accepts of the same token                | First wins via tx; second sees `accepted` status → 410. Already covered. | Same — DB constraint + status guard.                                                                                                                                            |
| BetterAuth misconfigured (Postgres adapter not initialised) | (n/a)                                                                    | 500 + log; refuses to provision the user (would create an orphan with no auth path).                                                                                            |

---

## 5. Implementation checklist (M1 final PR)

- [ ] `apps/api/src/auth/auth.service.ts` — add a thin
      `createSessionForUser(userId, ipAddress, userAgent)` method that wraps
      `auth.api.createSession()` (BetterAuth's internal helper). Returns
      `{ token, expiresAt }`. Document it as "internal — only callable
      from server-side flows that just provisioned a user, e.g.
      InvitationsService.accept()."
- [ ] `apps/api/src/invitations/invitations.service.ts` — after the
      transaction in `accept()`, call `authService.createSessionForUser(user.id, …)`.
      Returns `{ token, expiresAt }`. Pass back through to the controller.
- [ ] `apps/api/src/invitations/invitations.controller.ts` — `accept()`:
      after service returns, call `res.cookie('better-auth.session_token',
token, { httpOnly: true, secure: NODE_ENV==='production', sameSite:
'lax', maxAge: <expiresAt - now> })`. Switch the controller signature
      from returning `AcceptInvitationResponse` directly to using
      `@Res({ passthrough: true })` so we can write the cookie + still
      return the JSON body.
- [ ] Drop placeholder `passwordHash: 'PENDING_BETTERAUTH_M1'` and either:
      (a) make `passwordHash` nullable in the schema (one-line schema
      delta + raw SQL migration `0003_password_hash_nullable.sql`), OR
      (b) keep the placeholder forever and document that magic-link is
      the sole auth path. Recommend (a) for cleanliness.
- [ ] Audit additions: `session_created_via_invitation` event in the
      `auth` namespace (BetterAuth's own audit) — if available; otherwise
      add a manual `invitation_session_created` row in our chain.
- [ ] Tests: - `auth.service.spec.ts` (new): mock BetterAuth, verify session
      created with correct userId + IP/UA propagation. - `invitations.service.spec.ts`: extend the happy-path test to
      verify session creation is called AFTER the tx commits. - E2E: real magic-link flow once T014 (Resend) lands an outbound
      magic-link mail to a test mailbox.

---

## 6. What NOT to do

- **Do not** issue the session BEFORE the DB transaction commits. Race
  hole: a session for a non-persisted user.
- **Do not** persist the session token in any QA-Nexus-owned table.
  BetterAuth owns the session lifecycle.
- **Do not** log either token (invitation OR session) in the audit
  chain. Audit redaction tests pin this rule
  (`apps/api/src/invitations/__tests__/invitations.service.spec.ts`
  describe block "audit-payload redaction guarantees").
- **Do not** reuse the invitation token as the session token (see §2).

---

## 7. Open questions for Yogesh

1. **Cookie domain:** the FE is on Cloudflare Pages
   (`qa-nexus.pages.dev`); the API is on Render (`qa-nexus-api.onrender.com`).
   Different sub-domains → cookie won't auto-send unless we set
   `Domain=.<custom-domain>` AND we register a custom domain. M1 either:
   (a) configure custom domain BEFORE M1 ships, OR
   (b) require Authorization-header auth from FE → API and skip cookies.
   Decision-blocking — please weigh in.
2. **Session TTL:** BetterAuth defaults to 7 days. Pilot operating
   window is 12hr/day × 7 days = 84hr. 7 days fine OR shorten to 24h
   for tighter security? My read: 7 days, with a "you've been signed
   in too long, re-auth" prompt at 5 days.
3. **Multi-device:** does accepting an invite on Device A invalidate
   sessions on Device B? Default BetterAuth = no. Pilot answer = no.
   Confirm.

---

## Cross-references

- `apps/api/src/invitations/invitations.service.ts` (today's accept flow).
- `apps/api/src/auth/auth.service.ts` (BetterAuth wiring).
- `packages/shared/src/schemas/user.ts` (`AcceptInvitationInput` / `AcceptInvitationResponse`).
- PM1_ERD §3.2 (auth) + §3.4 (RBAC).
- MS0-T021 backlog item (BetterAuth integration).
- followup (l) — embedding eval (unrelated, but follows same M3-strategic pattern).
