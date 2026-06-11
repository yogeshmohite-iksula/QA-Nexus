# API Shape Catalog — FE+1 Option B wiring (Sun 2026-06-07)

> **Audience:** FE+1, wiring F09 / F27 / F28 / F26m1 to real endpoints with
> canned-data fallback (Option B).
> **Source of truth:** the Zod schemas in `packages/shared/src/schemas/*` (Hard
> Rule 10 — FE imports these same schemas). Routes + guards read verbatim from
> the NestJS controllers. **Nothing here is invented** — every field traces to a
> schema or controller line cited inline.
> **Sample data** reflects the **post-seed** pilot (the `seed-iksula-pilot.ts`
> dry-run plan). Until Yogesh runs `seed:pilot --commit`, these list endpoints
> return **empty arrays** `{ ok: true, projects: [] }` — your canned-data
> fallback is what renders. That's expected and correct for Mon AM if the seed
> hasn't landed.

## Auth model (applies to ALL four endpoints)

- **BetterAuth session cookie**, NOT `Authorization: Bearer`. Every controller
  below is `@UseGuards(RolesGuard)`, which reads the session cookie (ref:
  `feedback_nfr_probe_token_auth.md` — RolesGuard = session-cookie, not token).
- From the FE this is automatic: the browser sends the cookie same-origin. The
  Next app calls `/api/*`; in prod that's proxied/rewritten to the API origin
  `https://qa-nexus-api.onrender.com`.
- **For manual curl testing** you must copy the session cookie from browser
  devtools after signing in (Application → Cookies). Cookie name is
  BetterAuth's `better-auth.session_token` (confirm exact name in devtools — a
  prefix may apply under cross-site `__Secure-`).
- **Base URL** in examples: `https://qa-nexus-api.onrender.com`. Replace with
  `http://localhost:3001` for local API.

### Standard error envelopes (NestJS global filter)

| Status             | When                                     | Body shape                                                                     |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------ |
| `401 Unauthorized` | no / invalid session cookie              | `{ "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized" }`    |
| `403 Forbidden`    | valid session, role not in `@Roles(...)` | `{ "statusCode": 403, "message": "Forbidden resource", "error": "Forbidden" }` |
| `404 Not Found`    | unknown id/slug (detail routes)          | `{ "statusCode": 404, "message": "<entity> not found", "error": "Not Found" }` |

FE: on 401 → redirect to sign-in; on 403 → hide the panel (role gate);
on any network/5xx → **fall back to canned-data** (Option B safety net).

---

## 1. F09 Projects List — `GET /api/projects`

- **Controller:** `apps/api/src/projects/projects.controller.ts:86` (`@Get()`).
- **Auth:** any authenticated role — `@Roles(Admin, Lead, QAEngineer, Stakeholder)`.
- **Scope:** returns the **session user's workspace** projects only (no
  cross-workspace leakage).
- **Response schema:** `{ ok: true, projects: Project[] }`,
  `Project` = `ProjectSchema` (`packages/shared/src/schemas/project.ts:5`).

```bash
curl -s https://qa-nexus-api.onrender.com/api/projects \
  -b "better-auth.session_token=<PASTE_FROM_DEVTOOLS>" | jq
```

```json
{
  "ok": true,
  "projects": [
    {
      "id": "…uuid…",
      "workspaceId": "26d25198-611a-4535-9722-7abe5c41ce62",
      "key": "RET",
      "name": "Iksula Returns",
      "description": "Returns, refunds and reverse-logistics for Iksula — anchor pilot project (Sprint 42, release R-2026-04-PaymentV2).",
      "createdBy": "…uuid…",
      "createdAt": "2026-06-07T…Z"
    },
    {
      "id": "…uuid…",
      "workspaceId": "26d2…",
      "key": "CART",
      "name": "Iksula Commerce",
      "description": "Storefront, cart and checkout.",
      "createdBy": "…",
      "createdAt": "…"
    },
    {
      "id": "…uuid…",
      "workspaceId": "26d2…",
      "key": "PAY",
      "name": "Iksula Payments",
      "description": "Payment gateway and settlement.",
      "createdBy": "…",
      "createdAt": "…"
    },
    {
      "id": "…uuid…",
      "workspaceId": "26d2…",
      "key": "AUTH",
      "name": "Iksula Mobile App",
      "description": "Customer mobile app (auth + account).",
      "createdBy": "…",
      "createdAt": "…"
    },
    {
      "id": "…uuid…",
      "workspaceId": "26d2…",
      "key": "OPS",
      "name": "Iksula Internal Ops",
      "description": "Internal operations and tooling.",
      "createdBy": "…",
      "createdAt": "…"
    }
  ]
}
```

**⚠️ FE-critical gotcha — `branch` and `status` are NOT in the API.** The Prisma
`Project` model and `ProjectSchema` have **no** `branch` / `status` / colour
column (confirmed: `project.ts:5-17`). F09's "main / staging amber / available"
chips are **display-only canned data**. Keep them in your canned-data map keyed
by project `key` (`RET→main`, `PAY→staging amber`, …) and merge over the API
rows. Do **not** expect the API to supply them.

- **Pagination:** none — full workspace project list (≤ a handful at pilot scale).
- **Single project:** `GET /api/projects/:slug` → `{ ok: true, project: Project }`
  (`:slug` = the lowercased key, e.g. `ret`).

---

## 2. F27 Users & Roles — `GET /api/users`

- **Controller:** `apps/api/src/users/users.controller.ts:69` (`@Get()`).
- **Auth:** any authenticated role — `@Roles(Admin, Lead, QAEngineer, Stakeholder)`
  (everyone can _view_ the roster; mutations below are Admin-only).
- **Response schema:** `{ ok: true, users: UserPublic[] }`,
  `UserPublic` = `UserSchema.omit({ passwordHash })`
  (`packages/shared/src/schemas/user.ts:21`).
- **Note (status is derived, not a column):** the list service augments each row
  with a derived `status ∈ {active, invited, disabled}` (rule documented at
  `user.ts:36-40`: `disabled` if `disabledAt`, else `invited` if `activatedAt`
  is null, else `active`). Confirm the field name `status` in the list item when
  you wire — it drives the F27 status pill.

```bash
curl -s "https://qa-nexus-api.onrender.com/api/users" \
  -b "better-auth.session_token=<PASTE>" | jq
```

```json
{
  "ok": true,
  "users": [
    {
      "id": "…",
      "workspaceId": "26d2…",
      "email": "akshay.panchal@iksula.com",
      "displayName": "Akshay Panchal",
      "role": "Lead",
      "organizationalLabel": "QA Lead",
      "activatedAt": "…Z",
      "lastLoginAt": "…Z",
      "createdAt": "…Z"
    },
    {
      "id": "…",
      "workspaceId": "26d2…",
      "email": "yogesh.mohite@iksula.com",
      "displayName": "Yogesh Mohite",
      "role": "Admin",
      "organizationalLabel": "Sr QA",
      "activatedAt": "…Z",
      "lastLoginAt": "…Z",
      "createdAt": "…Z"
    },
    {
      "id": "…",
      "workspaceId": "26d2…",
      "email": "kishor.kadam@iksula.com",
      "displayName": "Kishor Kadam",
      "role": "QAEngineer",
      "organizationalLabel": "QA Engineer",
      "activatedAt": null,
      "lastLoginAt": null,
      "createdAt": "…Z"
    }
    // … + Nitin, Nadim, Govind, Mohanraj, Sagar (8 total)
  ]
}
```

- **Roles enum:** `Admin | Lead | QAEngineer | Stakeholder` (PM1_ERD §3.4). Note
  `QAEngineer` is one token (no space) on the wire.
- **Query filters** (`ListUsersQuery`, all optional): confirm exact fields in the
  schema when you wire search/role filters; the bare `GET /api/users` returns the
  full workspace roster (8 at pilot scale — no pagination needed).
- **Detail:** `GET /api/users/:id` → `{ ok: true, user: UserPublic }`.

---

## 3. F28 Audit log — `GET /api/audit`

- **Controller:** `apps/api/src/audit/audit.controller.ts:56` (`@Get()`).
- **Auth:** **Admin or Lead only** — `@Roles(Admin, Lead)`. (QA Engineers get 403
  → hide the F28 audit panel for them.)
- **Response schema:** `{ ok: true, items: AuditLogEntry[], nextCursor: string|null }`
  (`ListAuditResponse`, `packages/shared/src/schemas/audit.ts:71`).
  `AuditLogEntry` = `audit.ts:44`.
- **Query params** (`ListAuditQuery`, `audit.ts:60`): `from?` (ISO datetime),
  `to?` (ISO), `userId?` (uuid), `action?` (string), `cursor?` (opaque base64),
  `limit?` (int 1–200, **default 50**). Date window defaults to last 7 days,
  max 30 days (Neon-free guard).

```bash
curl -s "https://qa-nexus-api.onrender.com/api/audit?limit=25" \
  -b "better-auth.session_token=<PASTE>" | jq
```

```json
{
  "ok": true,
  "items": [
    {
      "id": "…",
      "ts": "2026-06-07T…Z",
      "actorUserId": "…yogesh-uuid…",
      "actorEmail": "yogesh.mohite@iksula.com",
      "action": "project.seeded",
      "entity": "project",
      "entityId": "…ret-uuid…",
      "payload": {
        "key": "RET",
        "name": "Iksula Returns",
        "seededBy": "seed-iksula-pilot.ts"
      },
      "prevHash": "0000…(64 hex)",
      "thisHash": "a1b2…(64 hex)"
    },
    {
      "id": "…",
      "ts": "…Z",
      "actorUserId": "…akshay…",
      "actorEmail": "akshay.panchal@iksula.com",
      "action": "requirement.seeded",
      "entity": "requirement",
      "entityId": "…",
      "payload": {
        "key": "RET-005",
        "priority": "P0",
        "status": "active",
        "seededBy": "seed-iksula-pilot.ts"
      },
      "prevHash": "a1b2…",
      "thisHash": "c3d4…"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiI…" // base64; null on last page
}
```

- **Pagination:** cursor-based. Pass `nextCursor` back as `?cursor=…` for the
  next page; stop when `nextCursor` is `null`.
- **`actorEmail`** is joined server-side (no extra fetch needed for the actor
  column). `actorUserId`/`actorEmail`/`entityId` may be `null` (system events).
- **Bonus — live chain integrity:** `GET /api/audit/verify-chain` (**Admin only**)
  → `{ ok, valid, brokenAtId, totalRows, verifiedRows, verifyDurationMs, truncated }`
  (`VerifyChainResponse`, `audit.ts:81`). Surfacing a green/red chip in F28 from
  this is a nice-to-have. **Heads-up:** on the current pilot `valid` is `false`
  with `brokenAtId` = the row-25 seed-drift artifact (documented benign exception,
  Bucket 1) — so don't render a scary red banner without context. The new seed
  rows (post-`seed:pilot`) all chain cleanly after that point.

---

## 4. F26m1 LLM Provider Config — `GET /api/admin/config/llm-providers`

- **Controller:** `apps/api/src/admin/llm-config/llm-config.controller.ts:56` (`@Get()`).
- **Auth:** **Admin only** — `@Roles(Admin)`. (Lead/QA/Stakeholder → 403.)
- **⚠️ One endpoint covers BOTH your asks.** There is **no** `GET /api/llm-providers`
  and **no** `GET /api/agents`. This single admin endpoint returns providers
  **and** agent→model assignments together:
  `{ ok: true, providers: LlmProviderPublic[], assignments: AgentModelAssignment[] }`.

```bash
curl -s https://qa-nexus-api.onrender.com/api/admin/config/llm-providers \
  -b "better-auth.session_token=<PASTE>" | jq
```

```json
{
  "ok": true,
  "providers": [
    {
      "id": "…",
      "workspaceId": "26d2…",
      "providerKind": "groq",
      "displayName": "Groq (primary)",
      "endpointUrl": "https://api.groq.com/openai/v1",
      "extraConfigJson": {},
      "status": "active",
      "lastTestAt": "…Z",
      "lastTestResult": { "ok": true },
      "createdBy": "…yogesh…",
      "createdAt": "…Z"
    }
    // NOTE: apiKeyEncrypted is stripped (LlmProviderPublicSchema) — never on the wire.
  ],
  "assignments": [
    {
      "id": "…",
      "workspaceId": "26d2…",
      "agentKind": "composer",
      "role": "primary",
      "modelPk": "…model-uuid…",
      "activationThresholdJson": null,
      "createdBy": "…",
      "createdAt": "…Z"
    },
    {
      "id": "…",
      "agentKind": "curator",
      "role": "primary",
      "modelPk": "…",
      "…": "…"
    },
    {
      "id": "…",
      "agentKind": "sherlock",
      "role": "primary",
      "modelPk": "…",
      "…": "…"
    }
  ]
}
```

- **Schemas:** `LlmProviderPublic` = `LlmProviderSchema.omit({ apiKeyEncrypted })`
  (`llm.ts:31`) — secret ciphertext is never returned. `AgentModelAssignment` =
  `llm.ts:71` (`agentKind`, `role`, `modelPk`, …).
- **Resolving the model name:** an assignment carries `modelPk` (a uuid), not a
  human model id. The model's `modelId`/`displayName` come from
  `LlmProviderModel` (`llm.ts:59`). **Confirm with BE** whether the GET nests
  models under `providers[].models` or whether F26 resolves `modelPk` separately —
  I did not verify the nested shape and won't invent it. The F26 page already
  does this resolution; reuse its mapping.
- **Agent naming canon (Hard Rule 15):** display agents via `<AgentName code={…} />`
  — `composer → Composer`, `curator → Curator`, `sherlock → Sherlock`. The wire
  uses lowercase `agentKind`; the component maps to the display name.
- **Mutations:** `PUT /api/admin/config/llm-providers` (Admin) replaces config and
  returns the refreshed `{ providers, assignments }` (no follow-up GET needed).

---

## 5. Session / identity — `GET /auth/session` ⚠️ P0-001

- **Controller:** `apps/api/src/auth/auth.controller.ts:193` (`@Controller('auth')`) →
  **`/auth/session`** (NOT `/api/auth/get-session`; there is **no `/api` prefix** on the
  auth surface — BetterAuth + the auth wrapper live at `/auth/*`, the data API at `/api/*`).
- **Auth:** cookie-based; returns `{ authenticated:false }` when unauthenticated (no 401).
- **This is the FE identity source** — `user.displayName` + `user.role`. Use it to replace the
  hardcoded "Kishor K." fallback. `user` = the **app** user (TB-002), NOT BetterAuth's raw
  `/auth/get-session` (which has only id/email/name/image, no role).

```bash
curl -s https://qa-nexus-api.onrender.com/auth/session \
  -H "Cookie: better-auth.session_token=<PASTE>" --include
```

```json
{
  "authenticated": true,
  "user": {
    "id": "…",
    "workspaceId": "26d2…",
    "email": "yogesh.mohite@iksula.com",
    "displayName": "Yogesh Mohite",
    "role": "Admin",
    "organizationalLabel": "Sr QA",
    "activatedAt": "…",
    "lastLoginAt": "…",
    "createdAt": "…"
  },
  "authUserId": "…",
  "expiresAt": "2026-06-14T…Z"
}
```

Anon → `{ "authenticated": false }`.

**⚠️ Currently returns `{authenticated:false}` cross-site** (no cookie reaches the API) until the
P0-001 cookie/CORS fix lands — see `docs/pilot-prep/2026-06-07-p0-001-cookie-cors-root-cause-be.md`.
FE must fetch with `credentials: 'include'`.

---

## Quick reference

| Frame | Method + path                         | Roles       | Response envelope                            |
| ----- | ------------------------------------- | ----------- | -------------------------------------------- |
| F09   | `GET /api/projects`                   | all 4       | `{ ok, projects: Project[] }`                |
| F27   | `GET /api/users`                      | all 4       | `{ ok, users: UserPublic[] }`                |
| F28   | `GET /api/audit?limit=&cursor=`       | Admin, Lead | `{ ok, items: AuditLogEntry[], nextCursor }` |
| F28   | `GET /api/audit/verify-chain`         | Admin       | `{ ok, valid, brokenAtId, totalRows, … }`    |
| F26m1 | `GET /api/admin/config/llm-providers` | Admin       | `{ ok, providers[], assignments[] }`         |

**Option B reminder:** wrap every call in a try/catch that falls back to
canned-data on 401/403/5xx/timeout, so the pilot UI never shows a blank screen
if the API is cold-starting (Render free dyno spin-up ≈ 30–50 s after idle).
Pre-seed (before `seed:pilot --commit`), the list endpoints return empty arrays —
treat empty exactly like the fallback path.
