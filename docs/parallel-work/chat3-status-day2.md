# CHAT 3 (backend) — Day 2 status

> Updated by the CHAT 3 Claude session. Branch: `feature/prisma-schema-tb001-021`
> (off latest `origin/main`). Read this from MAIN before merging.

## ✅ MS0-T020 — Prisma schema for TB-001..TB-021 + Zod schemas + RLS migration draft

Schema-only commit per Day 2 brief. **No `prisma migrate dev` ran yet** — that
waits for Yogesh to provision Neon (parallel task). The schema, raw-SQL
migration, and Zod mirrors are all in this branch and validated locally.

### What landed

#### `apps/api/prisma/schema.prisma` (~580 lines)

- **18 Postgres enums** mirroring §5 (UserRole, InvitationStatus, Priority, RequirementStatus, RequirementSource, TestCaseStatus, TestSuiteStatus, RunTrigger, TestRunStatus, TestResultStatus, JiraAuthMethod, JiraConnectionStatus, DefectStatus, LlmProviderKind, LlmProviderStatus, AgentKind, AgentRole, AgentRunStatus). Each has `@@map(snake_case)` for the Postgres type name.
- **21 ERD-mandated models** (TB-001..TB-021) — Workspace, User, Project, ProjectMember, UserInvitation, Requirement, TestCase, TestCaseLink, TestSuite, TestSuiteMember, TestRun, TestRunResult, JiraConnection, JiraIssue, Defect, RcaReport, KbDocument, KbChunk, LlmProvider, LlmProviderModel, AgentModelAssignment.
- **2 auxiliary models** (not in ERD §5 but FK targets / policy-required): `AuditLog` (HMAC-chained, `prevHash` + `thisHash` `Char(64)`, unique on `[workspaceId, createdAt]`) and `AgentRun` (FK target of `RcaReport`).
- All workspace-scoped models have `workspaceId` FK either directly or via `projectId`.
- Vector cols on TestCase + KbChunk: `Unsupported("vector(1024)")?` + `previewFeatures = ["postgresqlExtensions"]` + `extensions = [pgvector(map: "vector")]`.
- `directUrl = env("DIRECT_URL")` for Prisma Migrate against Neon's pooled URL.

#### `apps/api/prisma/migrations/0_init_rls_hnsw/migration.sql` (~180 lines)

Raw-SQL companion for everything Prisma 5 cannot express:

- `CREATE EXTENSION IF NOT EXISTS vector` (idempotent).
- `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on all 20 workspace-scoped tables.
- 20 RLS policies — direct workspace_id check for own-column tables, `EXISTS (… JOIN projects p …)` for project-scoped tables, deeper joins for join tables (test_case_links, test_suite_members, jira_issues, rca_reports, kb_chunks, llm_provider_models). All keyed on `current_setting('app.workspace_id')::uuid`.
- HNSW indexes on `test_cases.embedding` + `kb_chunks.embedding` with `vector_cosine_ops`, `m=16`, `ef_construction=64`.
- `audit_log` append-only enforcement: `reject_audit_log_mutation()` plpgsql function + BEFORE UPDATE/DELETE triggers. `REVOKE` on app role deferred (role doesn't exist until T011/T012).

This file is **not yet wired into `prisma migrate dev`** — when Yogesh provisions Neon and runs `prisma migrate dev --name init`, copy these statements into the generated init migration (or apply via `psql -f` after).

#### `packages/shared/` (new workspace member)

- `package.json` — `@qa-nexus/shared@0.0.1`, exports Zod schemas; depends on `zod ^3.23.8`.
- `tsconfig.json` — strict TypeScript, ESNext modules, no emit.
- `src/index.ts` — barrel re-exporting all schema files.
- `src/schemas/enums.ts` — 18 Zod enums + `Uuid`, `Timestamp`, `NonEmpty`, `Sha256Hex` primitives.
- `src/schemas/{workspace,user,project,requirement,test-case,test-suite,test-run,jira,defect,kb,llm,audit}.ts` — 12 domain files. Each exports an entity Schema, an Input schema, and inferred TS types. Public-view variants (`UserPublicSchema`, `JiraConnectionPublicSchema`, `LlmProviderPublicSchema`) strip secret fields.
- pnpm workspace already had `packages/*` glob — no `pnpm-workspace.yaml` change needed.
- `apps/api` now depends on `"@qa-nexus/shared": "workspace:*"`.

#### Root + scaffold updates

- `apps/api/package.json` — added `prisma 5.22.0` + `@prisma/client 5.22.0` (matches `.claude/locked-deps.json` `prisma=5` major-pin) + `zod ^3.23.8` + `@qa-nexus/shared workspace:*`. Six `prisma:*` scripts. `build` and `typecheck` now run `prisma generate` first so `@prisma/client` types are available.
- `package.json` (root) — added `db:generate`, `db:format`, `db:validate`, `db:migrate:dev`, `db:migrate:deploy`, `db:studio` proxying to apps/api.
- `.env.example` — added `DIRECT_URL` (required by Prisma Migrate against Neon's pooled `DATABASE_URL`); `DATABASE_URL` host hint changed to `ep-xxx-pooler.…` to make the pooled-vs-direct distinction explicit.
- `pnpm-lock.yaml` updated by `pnpm install`.

### Authoring decisions (binding spec was ambiguous on these)

| #   | Question                                                                                     | Decision                                                                                                                                             | Rationale                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Vector dim — ERD §5 says `vector(384)` BGE-small; database.md + ERD §7 A2 say 1024-dim Qwen3 | **1024**                                                                                                                                             | database.md is binding rule; ERD §5 column tables are stale doc-bug                                                                                                                       |
| 2   | Naming — ERD singular, database.md mandates plural snake_case                                | **Plural snake_case via `@@map`**                                                                                                                    | database.md rule wins; Prisma model names PascalCase singular                                                                                                                             |
| 3   | `workspaces.created_by` ↔ `users.workspace_id` circular FK                                   | `created_by NULL`, backfilled by seed                                                                                                                | Matches Day-0 Workspace Bootstrap pattern; avoids deferred-constraint complexity                                                                                                          |
| 4   | `audit_log` columns (not in ERD §5)                                                          | Designed from CLAUDE.md Hard Rule 7 + database.md HMAC chain spec                                                                                    | Captured: `id, workspace_id, actor_id NULL, entity_type, entity_id NULL, action, payload jsonb, prev_hash char(64), this_hash char(64), created_at`. Unique `(workspace_id, created_at)`. |
| 5   | `agent_run` columns (not in ERD §5; FK target of `rca_reports`)                              | First-pass minimum: `id, workspace_id, agent_kind, status, started_at, completed_at, duration_ms, eval_result jsonb, error_class, created_at`        | Refine in M3 when A1/A2/A4 specs solidify                                                                                                                                                 |
| 6   | `kb_documents.template_kind` (12 values not enumerated)                                      | `text` for now                                                                                                                                       | Enum-ify in M2 when KB templates land                                                                                                                                                     |
| 7   | BetterAuth schema ownership                                                                  | Defined `users` per ERD TB-002 with `password_hash`; T021 will configure BetterAuth Postgres adapter to use this table OR add a parallel auth-shadow | T021 design call, not T020                                                                                                                                                                |
| 8   | Token-encryption columns (Vault is on §6 ban-list)                                           | Plain `text` placeholder                                                                                                                             | App-layer AES-GCM with `BETTER_AUTH_SECRET` lands in T013/T021                                                                                                                            |
| 9   | `DIRECT_URL` for Prisma Migrate against Neon pooled URL                                      | Added as separate env var                                                                                                                            | Prisma standard pattern; pooled URL goes through pgBouncer which doesn't support migrate's prepared statements                                                                            |

All decisions documented inline in `schema.prisma` header comments + `migration.sql` header.

### Local validation green

```
$ DATABASE_URL=… DIRECT_URL=… pnpm --filter api exec prisma validate
The schema at prisma/schema.prisma is valid 🚀

$ pnpm --filter api exec prisma format
Formatted prisma/schema.prisma in 58ms 🚀

$ pnpm --filter '@qa-nexus/shared' typecheck
exit 0 (no errors)
```

`prisma validate` requires env vars to resolve `env("…")` even though no DB is touched — passed inline placeholders. Production CI will use real values.

### Files-touched scope (compliance with brief's "ONLY these")

- ✅ `prisma/**` — all under `apps/api/prisma/`
- ✅ `apps/api/**` — `package.json` + `prisma/` only; no source changes
- ✅ `packages/shared/**` — entire scaffold
- ✅ Plus 3 supporting touches outside that scope, all justifiable: root `package.json` `db:*` scripts (delegate to apps/api), `.env.example` `DIRECT_URL` (referenced by `apps/api/prisma/schema.prisma`), `docs/parallel-work/chat3-status-day2.md` (this doc).

NOT touched: `apps/web/**`, `.claude/**`, `.github/**`, `docs/SECURITY.md`, `docs/MILESTONES.md`, `.gitignore`, etc.

### Deferred to follow-up sessions (per brief)

- `prisma migrate dev --name init` — needs Neon `DATABASE_URL` (Yogesh's parallel task).
- BetterAuth wiring (`MS0-T021`, separate task).
- NestJS controllers/services consuming the Prisma client (`MS0-T022+`).
- Per-request RLS injection middleware (`Prisma $use` to set `app.workspace_id`) — lands with `MS0-T022` RBAC guard.

### How MAIN should review

1. Inspect `apps/api/prisma/schema.prisma` — the binding source of truth for TB-001..TB-021.
2. Read the 9-row decision matrix above — flag any decision you'd reverse before this lands on `main`.
3. Check `apps/api/prisma/migrations/0_init_rls_hnsw/migration.sql` — RLS policies are the most error-prone piece.
4. Confirm `packages/shared/` shape matches what `apps/web` will consume in MS0-T028+.
5. PR title (suggested): `feat(api): Prisma schema for TB-001..TB-021 + Zod schemas + RLS migration draft (MS0-T020)`.

### Blockers

None — all local validation green; ready for review.

## ⏸ Awaiting

- **Yogesh** — Neon project creation (parallel task per brief). When `DATABASE_URL` + `DIRECT_URL` land in `~/.zprofile`, reply **"Neon ready"** and CHAT 3 will run `prisma migrate dev --name init` in the next session.
- **MAIN** — review + merge this PR.
