---
name: api
description: Backend (NestJS) coding rules — RBAC, Zod, OTel, audit log
paths:
  - apps/api/**
---

# Backend (apps/api) — coding rules

> Scope: NestJS service at `apps/api/**`. Spec: P1.4 of
> `docs/audits/2026-04-27-skill-alignment-audit.md` + PM1_ERD §3 (API
> conventions) + PM1_ERD §3.13 (audit log).

## TypeScript

- **Strict mode is non-negotiable.** `apps/api/tsconfig.json` has `"strict": true`. Do not relax `strictNullChecks`, `noImplicitAny`, or `strictPropertyInitialization`.
- **No `any` types** without an inline `// FIXME(<ticket>): <reason>` comment referencing a Linear-style ticket. CI will not enforce this — peer review will.
- Prefer `unknown` over `any` at boundaries; narrow with Zod or type guards.

## Endpoints

- **Every endpoint** must have a corresponding Zod schema in `packages/shared` (request body + response). The frontend imports the same schema for client-side validation — never duplicate.
- **Every endpoint** must have an RBAC guard via the `@Roles(...)` decorator (PM1_ERD §3.4). The only exceptions are:
  - `GET /health`
  - `POST /auth/sign-in`
  - `POST /auth/sign-up`
  - `GET|POST /auth/callback` (BetterAuth magic-link callback)
- Roles are the four defined in PM1_ERD §3.4: `Admin`, `Lead`, `QA Engineer`, `Stakeholder`. Do not invent new roles.
- HTTP errors are thrown as NestJS `HttpException` subclasses, never plain `throw new Error(...)` — the global filter relies on `getStatus()`.

## LLM gateway

- All LLM calls go through `LLMGateway.complete()` (MS0-T023). Direct calls to `Groq SDK` or `@google/generative-ai` outside the gateway module are prohibited — the gateway owns retry, fallback, and quota tracking.
- Every gateway call **must** emit an OpenTelemetry span (`llm.complete`) with attributes: `provider`, `model`, `prompt_tokens`, `completion_tokens`, `latency_ms`, `fallback_triggered`. PM1_ERD §3.10.

## Audit log (PM1_ERD §3.13)

- Every state-changing operation (POST / PUT / PATCH / DELETE) **must** write a row to the `audit_log` table.
- The write happens **synchronously inside the request handler, before the response is returned**. Async / fire-and-forget writes are not allowed — a failed audit write must roll back the transaction.
- Audit rows are HMAC-SHA256-chained: `this_hash = HMAC(secret, prev_hash || row_payload)`. Use `AuditLogService.append()` — never insert into `audit_log` directly.

## WebSocket gateway (MS0-T026)

- Use `@nestjs/websockets` + `ws` only. Do **not** add `socket.io`, `@nestjs/platform-socket.io`, or any other transport — they're outside the locked stack.
- Authenticate the WebSocket upgrade with the same BetterAuth session cookie used by REST. No custom token-in-query schemes.

## Embedding service (MS0-T024)

- `EmbeddingService.embed(text)` is the only entry point. It returns a 1024-dim Float32Array.
- The Qwen3-Embedding-0.6B model is loaded **once at app startup**, not per-request. If startup load fails, the app should crash — failing closed is correct here.

## What NOT to add

- ❌ FastAPI, Express, Hapi, Koa — NestJS is the only HTTP framework.
- ❌ `socket.io`, `socket.io-client` — `ws` only.
- ❌ Sequelize, TypeORM, MikroORM, Drizzle — Prisma is the only ORM.
- ❌ `redis`, `ioredis`, `bullmq` — no Redis in PM1 (cost gate).
- ❌ `winston`, `pino` for app logs — use NestJS's built-in logger + OTel.
  - **Verified by T019 (2026-04-30):** NestJS Logger + OTel logs SDK (`@opentelemetry/sdk-logs` + `@opentelemetry/exporter-logs-otlp-http`) provides full telemetry pipeline including Better Stack ingestion via OTLP. No third-party logger transports required. See `apps/api/src/observability/otel-logs.config.ts` (`NestOtelLogger` class) + `docs/deploy/better-stack-runbook.md`.
