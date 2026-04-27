---
description: Run all 6 pre-deploy validation gates (lint + typecheck + build + hook validation + gitleaks + free-tier quota check). Required before `pnpm deploy:web` or PR merge.
---

PM1 reusable workflow that locally mirrors the GitHub Actions CI matrix from `.github/workflows/ci.yml` (BE chat P1.7 / MS0-T005). Catches CI failures before they reach the PR stage — saves the back-and-forth we hit on Day 1 with the baseline-CI hotfix batch.

## When to use

- **Before `pnpm deploy:web`** — never push a deploy that wouldn't pass CI
- **Before opening a PR** — pre-flight check; if any gate fails, fix locally before the GH job spins up
- **After a big rebase** — confirm the rebase didn't introduce regressions
- **After dependency upgrade** — `pnpm install` of new majors can break things in subtle ways

## Process

I will run all 6 gates in order. **First failure halts the chain** (no point running build if lint already failed). Report each gate as ✅ PASS or ❌ FAIL with a one-line summary.

### Gate 1 — Lint (eslint + prettier)

```bash
export PATH="$HOME/homebrew/bin:$PATH"
pnpm lint
```

Failure modes:

- ESLint errors → `pnpm lint:fix` may auto-resolve
- Prettier mismatches → `pnpm exec prettier --write .` to auto-format
- Plugin not found (`@typescript-eslint`) → check `apps/api/eslint.config.mjs` is on flat config (P1.15 lesson)

### Gate 2 — Typecheck (tsc strict mode, both apps)

```bash
pnpm -r typecheck
```

Runs in parallel across `apps/web` (Next.js TS) and `apps/api` (NestJS TS). Both must report `Done` with exit 0.

Failure modes:

- Missing types after dep upgrade → `pnpm install` first
- `any` introduced without `// FIXME` → CLAUDE.md Rule 9 violation; add the comment + ticket ref
- Cross-package type mismatch → `packages/shared` Zod schema may have drifted from BE/FE imports

### Gate 3 — Build (web + api)

```bash
pnpm --filter web build && pnpm --filter api build
```

Sequential (NOT parallel) — apps/api build needs apps/web build to NOT have eaten all the memory first.

Failure modes:

- Next.js build error → check the route table; new dynamic route added that broke `output: 'export'`?
- NestJS build error → typically a circular dep or missing `@Module()` import

Expected output:

```
apps/web: ✓ Compiled successfully + Exporting (X/Y) routes prerendered as static content
apps/api: nest build → no errors
```

### Gate 4 — Hook validation (PreToolUse Edit|Write dry-run)

```bash
.github/scripts/run-pretooluse-hooks.sh
```

(Helper script BE chat shipped in P1.7 / MS0-T005.)

Synthesizes Write payloads and dry-runs `check-secrets.sh` + `enforce-design-tokens.sh` + `enforce-pm1-stack.sh` + `enforce-rwd.sh` against PR-changed files. None of them should exit non-zero against the current main.

Failure modes:

- `enforce-design-tokens.sh` fired → an off-palette hex / non-whitelisted Tailwind class slipped in (likely in apps/web)
- `enforce-pm1-stack.sh` fired → ban-list dep added OR locked-deps major-version drift
- `enforce-rwd.sh` fired → fixed-pixel layout width >= 200px or `max-w-[1600px]` in apps/web/\*_/_.tsx
- `check-secrets.sh` fired → a regex matched something secret-shaped; double-check before declaring it a false positive

### Gate 5 — Gitleaks (full repo scan)

```bash
if command -v gitleaks &>/dev/null; then
  gitleaks detect --source . --config .gitleaks.toml --redact --no-banner
else
  echo "gitleaks not installed locally — falling back to CI-only check"
fi
```

If gitleaks isn't installed locally, this gate is a soft warning rather than a blocker. The CI gitleaks job will still run on the PR.

Failure modes:

- Real leak detected → STOP. Rotate the key. Use `git filter-branch` or `bfg-repo-cleaner` to scrub history before pushing.
- False positive → add to `.gitleaks.toml` `[allowlist].paths` (NOT `regexes` — see P1.14b lesson; regexes match the secret value, not the surrounding URL)

### Gate 6 — Free-tier quota check (lightweight)

```bash
# CF Pages: ping production health
/usr/bin/curl -sS -o /dev/null -w "qa-nexus-web.pages.dev: HTTP %{http_code}\n" --max-time 10 https://qa-nexus-web.pages.dev/sign-in/

# API health (if deployed via MS0-T011)
/usr/bin/curl -sS -o /dev/null -w "qa-nexus-api: HTTP %{http_code}\n" --max-time 10 https://qa-nexus-api.onrender.com/health || echo "API not deployed yet (MS0-T011 pending)"

# UptimeRobot status (if API token present)
if [ -n "$UPTIMEROBOT_API_KEY" ]; then
  echo "TODO: parse UptimeRobot status via API"
else
  echo "UPTIMEROBOT_API_KEY not set — skip uptime check"
fi
```

Failure modes:

- CF Pages 5xx → CF outage (rare; check status.cloudflare.com)
- Render API 5xx → cold start in progress (~30s); wait + retry
- UptimeRobot reports downtime → check Better Stack alerts in Slack

## Final report

```
═══════════════════════════════════════
  /deploy-check — N/6 gates passed
═══════════════════════════════════════

  ✅ Gate 1 — Lint              (eslint + prettier)
  ✅ Gate 2 — Typecheck         (apps/web + apps/api strict)
  ✅ Gate 3 — Build             (web 5 routes static, api dist clean)
  ✅ Gate 4 — Hook validation   (4 PreToolUse hooks dry-ran clean)
  ✅ Gate 5 — Gitleaks          (0 leaks across N commits)
  ⚠ Gate 6 — Free-tier quotas  (CF: 200 / API: not deployed / UR: not configured)

Verdict: SAFE TO DEPLOY (gate 6 informational only)

Next:
  - `pnpm deploy:web` for FE → Cloudflare Pages
  - Open PR for code review (then squash-merge → API auto-deploys via Render webhook MS0-T011)
```

## Hard rules

- **NEVER skip a gate** to "ship faster". The 4-fix hotfix batch on Day 1 (P1.13–16) was caused by gates that hadn't been wired yet — every gate exists because something broke without it.
- **NEVER override a gate failure** by editing the gate's config. Fix the root cause.
- **ALWAYS report which gate failed first** — don't dump 6 errors at once; surface the chain-stopper.
- **NEVER deploy if Gate 1-5 fails** — Gate 6 is informational, the rest are mandatory.
- If `gitleaks` is not installed locally, gate 5 is a soft warning. CI will still enforce. Note the gap.

## Cross-references

- `.github/workflows/ci.yml` — the CI matrix this command mirrors (6 jobs in parallel on PR; this command runs them sequentially locally for fast-fail)
- `.github/scripts/run-pretooluse-hooks.sh` — the hook-validation harness
- `.gitleaks.toml` — gitleaks rules + allowlist (P1.14 + P1.14b lessons baked in)
- `docs/audits/2026-04-27-eod-skill-conformance-audit.md` — final eval-by-eval ledger including the 4 hotfix items
- `/sync-worktree` — sibling command; run this BEFORE /deploy-check when worktree is stale
- `/commit-push-pr` — sibling command; run /deploy-check BEFORE this to pre-flight CI
