# API Design Decisions

Append new entries at the top with `[YYYY-MM-DD]: decision — rationale` format. Cross-link to the route file or NestJS controller.

## 2026-04-26: API surface lives in `apps/api` (NestJS 10), NOT in `apps/web`

`apps/web` is a static export to Cloudflare Pages — no Node runtime, no API routes, no middleware. Every server-side concern (auth, DB, LLM gateway, embedding service, Jira sync, audit log, WebSocket) lives in `apps/api` (NestJS 10) on Render free Hobby. FE talks to API via fetch with credentials over HTTPS. CORS configured to allow `*.qa-nexus-web.pages.dev` only.

**Pattern:** when in doubt, the rule is FE = static + client state, API = everything server. No exceptions for "small server-side things in `apps/web`."

## 2026-04-26: All API endpoints define Zod schemas in `packages/shared` (deferred to MS0-T004)

Single source of truth for request/response shapes. NestJS validates inbound via the same schema FE uses for client-side validation. Lands in MS0-T004. Pattern reference: see `packages/shared/src/schemas/auth.ts` once it exists.

## Stub: REST + WebSocket endpoints

Real endpoints land in MS0-T021 (BetterAuth: `/auth/sign-up`, `/auth/sign-in`, `/auth/callback`, `/auth/set-password`, `/auth/reset-password`), T022 (RBAC guard on every project-scoped resource), T023 (LLM gateway: `/llm/complete` internal), T024 (embeddings: `/embed` internal), T025 (`/health`), T026 (WebSocket gateway scaffold), T027 (audit log endpoints).

PM1_ERD §3 is the canonical entity inventory (TB-001 through TB-021). Endpoint table lives in `docs/PROJECT_SPEC.md` Part B.
