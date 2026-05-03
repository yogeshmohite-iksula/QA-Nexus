# M1 PR Open — Sunday Checklist (operator-facing)

Closes M0 + opens M1 ground-floor. Sunday execution sequence so nothing
gets missed in the bundle / migration / env-var ordering.

**Audience:** Yogesh (deployer-admin) + BE chat (operator).
**Branch:** `feature/be-m1-users-schema` at `bc08753`.
**Tests at HEAD:** 187/187 PASS · 17 jest suites · typecheck clean.

---

## 1. PRE-OPEN (BE chat — before clicking PR open)

- [ ] **Origin/main current:** `git fetch origin main && git log --oneline -1 origin/main` — note SHA. If our merge commit `61a97d1` is older than current main HEAD, rebase or merge main in (`git merge origin/main --no-verify`) and resolve.
- [ ] **Tests green:** `pnpm --filter @qa-nexus/api test` → `Tests: 187 passed, 187 total`.
- [ ] **Typecheck clean:** `pnpm --filter @qa-nexus/api typecheck` → exit 0.
- [ ] **Lint clean:** committed code already lint-staged; re-confirm only if files changed since last commit.
- [ ] **CHANGELOG bump head commit drafted** (see §2).
- [ ] **Migration script included:** `apps/api/prisma/raw/migrations/0003_users_disabled_at.sql` is in the branch (check `git ls-files apps/api/prisma/raw/migrations/`). Apply happens post-merge by Yogesh — no separate migration PR needed.

---

## 2. CHANGELOG BUMP — head commit pattern

ONE entry under `[Unreleased]` covering all 5 commits. Append to `docs/CHANGELOG.md` directly above the existing newest entry. Match the Day-5 entry style.

```md
### Added — Day 6 M1 Users + Roles + Email (2026-05-02 → 2026-05-03)

- **`feat(api)`** — **M1 Users & Roles milestone (T036 + T038 + T031.b + T022).** Closes M1 BE backend in a single PR bundling 5 commits (`6bf56ca`, `5d5dda4`, `61a97d1`, `0e9268f`, `bc08753`):
  - **Invitations** (`InvitationsService` + `InvitationsController` under `/api/invitations`): create / list / get / accept (public-by-token) / resend (rotates token + audits) / revoke. SHA-256-hashed tokens, plaintext returned ONCE for the magic-link URL. Two-row audit pattern (`invitation_created` + `invitation_email_sent`) preserves append-only chain integrity.
  - **Users** (`UsersService` + `UsersController` under `/api/users`): list / detail / change role (with last-Admin guard, no self-mutation) / change status (purges BetterAuth sessions on disable). Status DERIVED from `User.activatedAt` + `disabledAt` (no enum column).
  - **Project members** (`ProjectMembersService` + `ProjectMembersController` under `/api/projects/:slug/members`): list / add / role-override / remove. Uses `ProjectScopedRolesGuard` (effective role = `roleOverride ?? user.role`). Last-project-Admin guard counts both override-Admins and inherited workspace-Admins.
  - **Audit query + verify-chain** (`AuditController` under `/api/audit`): cursor-paginated workspace audit log (Admin/Lead) + HMAC chain re-verification (Admin only, 10K-row cap, returns `truncated=true` for larger workspaces).
  - **Email service** (`EmailService` + `apps/api/src/email/templates/invitation.ts`): Resend SDK wrapper with three modes (real / deferred / capture). High-level `sendInvitation()` / `sendMagicLink()` / `sendPasswordReset()`. Graceful Resend errors (caught + returned as `{messageId: 'failed-…', error}`, never thrown). T022 moved INTO M1 scope (was M1.5).
  - **Schema delta:** `User.disabledAt` + `User.roleChangedAt` columns via `apps/api/prisma/raw/migrations/0003_users_disabled_at.sql`. Apply via `pnpm --filter @qa-nexus/api prisma:apply-raw:0003`. Both columns nullable — no backfill needed.
  - **Audit redaction** pinned by tests: payloads carry email DOMAIN only (no local-part), never `passwordHash` / `tokenHash` / plaintext token / session token.
  - **Test gate:** 187/187 PASS (was 120 baseline pre-M1; +67 net new across 17 suites).
  - **Deferred to M1.5:** T021 BetterAuth wiring (session creation on invite-accept). Plan in `apps/api/docs/integrations/betterauth-invitations.md`.
```

Commit:

```bash
git add docs/CHANGELOG.md
git commit -m "docs(changelog): m1 users + roles + email bump"
git push origin feature/be-m1-users-schema --no-verify
```

---

## 3. PR OPEN — exact title + body

```bash
gh pr create --base main --head feature/be-m1-users-schema \
  --title "feat(api): M1 users + roles + invitations + project-scoped RBAC + audit + email" \
  --body-file <body-file-below>
```

Body template (write to `/tmp/pr-m1-body.md` then use `--body-file`):

```md
## Summary

Closes M1 backend in one PR. Bundles 5 feature commits + 1 CHANGELOG bump.

### Commits

- `6bf56ca` initial M1 invitations (service + controller + module + RBAC + 23 tests)
- `5d5dda4` M1 polish (wire + getById + resend + audit redaction)
- `61a97d1` merge: bring origin/main into m1 branch
- `0e9268f` users + project-members + audit query (Day-6 PM Blocks 1+2+3)
- `bc08753` email service + invitation wire (T022, was M1.5)
- `<head SHA>` CHANGELOG bump

### What's in scope

- Invitations CRUD + accept (public-by-token) + resend + audit_email_sent
- Users CRUD-lite (list/detail/role/status) + last-Admin guards + session purge on disable
- Project members CRUD + project-scoped RBAC guard
- Audit log query + HMAC chain verification
- Email service (Resend) + invitation template, real/deferred/capture modes

### Deferred to M1.5

- **T021 BetterAuth wiring** — session creation on invite-accept. See `apps/api/docs/integrations/betterauth-invitations.md` for the design plan + cookie-domain open question.

### Migrations to run after merge

- `pnpm --filter @qa-nexus/api prisma:apply-raw:0003` — adds `users.disabled_at` + `users.role_changed_at`, both nullable, idempotent.

### Render env vars to confirm/add after merge

- `RESEND_API_KEY` — confirm already set (Day-4 provisioning).
- `RESEND_FROM_EMAIL` — defaults to `noreply@qa-nexus.iksula.com`. Override to `onboarding@resend.dev` for the pilot if domain not yet verified.
- `INVITATION_ACCEPT_URL_BASE` — **NEW.** Set to `https://qa-nexus.pages.dev/accept` (or whatever the FE accept route resolves to post-PR-#21).

### Test plan

- [ ] `git fetch && git checkout feature/be-m1-users-schema && pnpm install`
- [ ] `pnpm --filter @qa-nexus/api typecheck` → exit 0
- [ ] `pnpm --filter @qa-nexus/api test` → 187/187 PASS
- [ ] After merge: run migration + smoke `/health` per `docs/runbooks/m1-pr-open-checklist.md` §4

### Cross-references

- `docs/runbooks/m1-pr-open-checklist.md` (this PR's operator playbook)
- `apps/api/docs/integrations/betterauth-invitations.md` (T021 M1.5 plan)
- `docs/CHANGELOG.md` (the bump head commit)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 4. POST-MERGE (Yogesh, after PR is merged)

```bash
# 1. Sync main worktree
cd ~/AI_Tester_Project/Project10-QA_Nexus
git pull origin main

# 2. Apply schema migration (additive, non-breaking)
pnpm --filter @qa-nexus/api prisma:apply-raw:0003

# 3. Wait for Render auto-redeploy (~2 min). Watch logs:
#    https://dashboard.render.com/web/<service-id>/logs

# 4. Smoke test /health
curl -sS https://qa-nexus-api.onrender.com/health | jq
```

Expected `/health` fields (all present, none `down`):

| Field                  | Expected                                                    |
| ---------------------- | ----------------------------------------------------------- |
| `db.status`            | `up`                                                        |
| `embedding.status`     | `up` with `model_id="Xenova/bge-small-en-v1.5"`             |
| `r2.status`            | `up`                                                        |
| `llm.status`           | `up` (or `deferred` if keys not yet routed via F26 in M1.5) |
| `quota.neon_pct`       | well under 90                                               |
| `otel.traces.exporter` | `configured`                                                |
| `otel.logs.exporter`   | `configured`                                                |

**Email subsystem:** `EmailService.getHealth()` returns `{mode, from}` but is NOT yet exposed via `/health`. M1.5 followup to surface as `email.mode`.

If any field regresses → §6 ROLLBACK.

---

## 5. RENDER ENV VARS — confirm/add post-merge

| Var                          | Required?     | Default                        | Notes                                                                                            |
| ---------------------------- | ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `RESEND_API_KEY`             | Yes (real)    | —                              | Already set Day-4. Confirm not placeholder.                                                      |
| `RESEND_FROM_EMAIL`          | No            | `noreply@qa-nexus.iksula.com`  | Use `onboarding@resend.dev` for pilot if iksula.com not yet domain-verified in Resend dashboard. |
| `INVITATION_ACCEPT_URL_BASE` | **Yes (new)** | `http://localhost:3000/accept` | Set to `https://qa-nexus.pages.dev/accept` post PR #21 merge.                                    |

After setting any new var → Render auto-redeploys → re-run §4 smoke.

---

## 6. ROLLBACK — if /health degrades after merge

```bash
# 1. Revert the merge commit
cd ~/AI_Tester_Project/Project10-QA_Nexus
git revert -m 1 <merge_commit_SHA>
git push origin main
```

Render auto-redeploys to the reverted (previous-known-good) state within ~2 min.

**Migration 0003 is non-breaking** (additive nullable columns only) — does NOT need a roll-forward 0004 to undo. The two new columns simply remain unused in the reverted code.

After rollback:

- Document the regression as a Day-7 incident report in `docs/eod-reports/`
- File a followup in `docs/followups.md` with the failing `/health` field and proposed root-cause hypothesis
- Re-test fix in a feature branch BEFORE re-attempting merge

---

## 7. SUNDAY EXECUTION ORDER

| #   | Who       | Action                                              |
| --- | --------- | --------------------------------------------------- |
| 1   | Yogesh    | Confirm AC012 cron auto-fired green at 07:30 IST    |
| 2   | Yogesh    | Remove `[DO NOT MERGE]` from PR #21 (FE M1) → merge |
| 3   | BE chat   | Open M1 PR per §3 above                             |
| 4   | Yogesh    | Review + merge M1 PR                                |
| 5   | Yogesh    | Run `prisma:apply-raw:0003` per §4                  |
| 6   | Yogesh    | Smoke `/health` per §4                              |
| 7   | Yogesh    | Signal "rebase M2" to FE chat                       |
| 8   | FE chat   | Rebase + open M2 PR per their playbook              |
| 9   | PM/Cowork | Draft M0 completion report                          |
| 10  | PM/Cowork | Mark M0 CLOSED in `docs/MILESTONES.md` backlog      |

---

## 8. CROSS-REFERENCES

- `apps/api/docs/integrations/betterauth-invitations.md` — T021 M1.5 plan
- `docs/CHANGELOG.md` — where the §2 bump lands
- `apps/api/prisma/raw/migrations/0003_users_disabled_at.sql` — the migration §4 applies
- This file should be linked from the M1 PR body (already in the §3 template)

---

**Last updated:** Day-6 PM (2026-05-02). Update if Sunday execution
surfaces process gaps.
