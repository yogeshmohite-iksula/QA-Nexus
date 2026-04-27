---
name: security
description: Repo-wide security rules — secrets, dangerous Bash, .env hygiene
paths:
  - '**'
---

# Security — repo-wide rules

> Scope: every file in the repo. Spec: P1.4 of
> `docs/audits/2026-04-27-skill-alignment-audit.md` + `docs/SECURITY.md`.

## Secrets

- **No secrets in the repo. Ever.** Enforced at author-time by
  `.claude/hooks/pre-tool-use/check-secrets.sh` (PreToolUse Edit|Write)
  and at CI-time by the `gitleaks` job in `.github/workflows/ci.yml`
  (rules in `.gitleaks.toml`).
- Live values for `GROQ_API_KEY`, `GEMINI_API_KEY`, `CLOUDFLARE_API_TOKEN`,
  `RESEND_API_KEY`, `BETTERAUTH_SECRET`, `DATABASE_URL`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, etc. live **only** in Render env vars (runtime)
  and GitHub repo secrets (CI/deploy).
- `.env.example` contains placeholders only (`<your-key-here>`,
  `REPLACE_ME`). Never copy a real value into `.env.example` "for local
  dev convenience".

## .env hygiene

- `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `*.crt`,
  `secrets/`, `.secrets/` are all in `.gitignore` (root). Do not remove
  these patterns from `.gitignore`.
- Each app's local `.env` (e.g. `apps/api/.env`, `apps/web/.env.local`)
  is also gitignored via the root patterns. The deny block in
  `.claude/settings.json` additionally blocks Edit/Write on `.env` and
  `apps/**/.env` paths.

## Logging

- **Never `console.log` or `Logger.log` any of:**
  - API tokens or secret values
  - Session IDs or BetterAuth cookies
  - Passwords (raw or hashed)
  - Full request bodies on auth endpoints (`/auth/sign-in`,
    `/auth/sign-up`, `/auth/callback`)
  - User PII beyond what the audit log already captures
- Structured logs go through the NestJS logger, exported via OTel. The
  OTel exporter must redact known sensitive attribute keys (configured
  in `apps/api/src/observability/otel.config.ts`).
- For debug logging during development, use `debug()` (the npm package)
  with namespace prefixes — never check in `console.log` calls in
  `apps/api/src/**` or `apps/web/src/**`.

## Bash safety (enforced by hook + deny block)

- The `block-dangerous.sh` PreToolUse hook blocks `rm -rf`, `--force`,
  `DROP TABLE`, `TRUNCATE`, and force-push patterns.
- The `deny` block in `.claude/settings.json` adds belt-and-suspenders
  denial of: `rm -rf`, `rm -r`, `git push --force`, `git push -f`,
  `git reset --hard`, `git clean -f`, `git checkout --`,
  `git restore --`, `gh repo delete`, `DROP TABLE`, `TRUNCATE`.
- Locked PM1 design files (`QA Nexus/PM1/PM1_UI_v2/**`) and `.env` files
  are also denied for Edit/Write at the harness layer.
- If you genuinely need a destructive operation, ask Yogesh first.

## Dependency hygiene

- The `enforce-pm1-stack.sh` PreToolUse hook blocks the kickoff §6 ban
  list in `package.json` and `pnpm-lock.yaml` writes (FastAPI, Ollama,
  Redis, Neo4j, MUI, Material Tailwind, etc.).
- The same hook also enforces locked-major version pins from
  `.claude/locked-deps.json` (next=15, react=19, tailwindcss=4,
  @nestjs/\*=10, prisma=5).
- New dependencies need an explicit Yogesh approval **before** the PR is
  opened. Document the rationale in the PR description.

## Disclosure + incident response

See `docs/SECURITY.md` for: disclosure email, per-provider rotation
links, T+0 → T+24h incident response timeline, P1/P2/P3 severity
definitions.

## What NOT to do

- ❌ Do not commit a "throwaway" key "just for testing" — gitleaks will
  catch it on PR but it's already in your local git reflog.
- ❌ Do not bypass the PreToolUse hooks by editing files outside Claude
  Code (e.g. via `vim`) and committing directly. The husky pre-commit
  hook does not currently run gitleaks; rely on CI as the safety net,
  but author-time discipline is still expected.
- ❌ Do not paste secrets into Claude Code conversations, Slack threads,
  or Linear tickets. Provider logs and chat history are out of our
  control.
