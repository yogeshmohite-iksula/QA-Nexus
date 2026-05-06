# Skill Alignment Audit — Day 11 (2026-05-06)

> **Trigger:** Post-M1 close (M1 sealed 2026-05-05; tag `m1-closed-2026-05-05`).
> **Cadence rule:** "occasional, not nightly" per Yogesh; previous audit 2026-04-27.
> **Next due:** Post-M2 close (~2026-05-09 target).
> **Author:** MAIN session. **Approver:** Yogesh Mohite.

---

## Executive summary

| Area                               | Status         | Notes                                                                                                               |
| ---------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `.claude/hooks/` (13 scripts)      | ✅ ALL WIRED   | every script in `settings.json` matches a file on disk                                                              |
| `.claude/agents/` (3 subagents)    | ✅ PRESENT     | changelog-updater, frontend-tester, retro-agent                                                                     |
| `.claude/memory/`                  | ✅ POPULATED   | 9 files; CLAUDE_DECISIONS, IKSULA_CONTEXT, PM1_PATTERNS, RETROS, STACK_LEARNINGS + index                            |
| `.claude/settings.json` deny block | ✅ CURRENT     | covers locked frames, .env, dangerous bash patterns                                                                 |
| `CLAUDE.md` vs repo state          | ⚠️ MINOR DRIFT | embedding-model description still references 1024-dim/bge-large; reality is 384-dim/bge-small per ADR-003 amendment |
| PRD v8.1 / ERD v2.1 vs schema      | ⚠️ SAME DRIFT  | followup `(ae)` filed in this audit                                                                                 |
| Tech-project-forge v1.4 features   | 7/10 fully     | compound-learnings + retro-agent under-used; context-mode discipline weak                                           |
| Husky pre-push gates (3)           | ✅ FIRING      | typecheck + frozen-lockfile + CHANGELOG guard verified Day-10                                                       |
| New skills in last 7 days          | None added     | last skill addition was M1 close-prep work; no plugin marketplace changes                                           |

---

## 1. Hook inventory check

### 1.1 Files on disk vs `settings.json` references

All 13 hook scripts in `.claude/hooks/` are referenced from `settings.json`. No orphans, no dangling references.

| Lifecycle              | Script                         | Wired? |
| ---------------------- | ------------------------------ | ------ |
| PreToolUse `*`         | `inject-memory.sh`             | ✅     |
| PreToolUse Bash        | `block-dangerous.sh`           | ✅     |
| PreToolUse Edit\|Write | `check-secrets.sh`             | ✅     |
| PreToolUse Edit\|Write | `enforce-design-tokens.sh`     | ✅     |
| PreToolUse Edit\|Write | `enforce-pm1-stack.sh`         | ✅     |
| PreToolUse Edit\|Write | `enforce-rwd.sh`               | ✅     |
| PostToolUse `*`        | `audit-log.sh`                 | ✅     |
| PostToolUse Bash       | `report-token-savings.sh`      | ✅     |
| UserPromptSubmit `*`   | `load-binding-context.sh`      | ✅     |
| SessionStart `*`       | `sync-hooks.sh`                | ✅     |
| Stop `*`               | `update-docs-check.sh`         | ✅     |
| Stop `*`               | `cumulative-savings-report.sh` | ✅     |
| Stop `*`               | `log-token-savings.sh`         | ✅     |

### 1.2 Hook firing evidence (Day-10 ceremony)

- `block-dangerous.sh`: blocked nothing today (no destructive commands attempted)
- `check-secrets.sh`: passed all writes (3 docs files, 1 fetcher fix, 1 work-log update)
- `enforce-pm1-stack.sh`: passed (no `package.json` changes)
- `audit-log.sh`: ✅ writing to `.claude/audit.jsonl` (verified row count grew during ceremony)
- `load-binding-context.sh`: ✅ visible in every user prompt today as `=== PM1 BINDING CONTEXT ===` header
- `report-token-savings.sh`: gate fired on `git push origin main` (4 pushes) and `git push -u origin <branch>` (2 pushes)

**Verdict: Hooks are live and healthy.**

---

## 2. Subagent inventory

| Agent               | File                                  | Used in M1?                                        |
| ------------------- | ------------------------------------- | -------------------------------------------------- |
| `changelog-updater` | `.claude/agents/changelog-updater.md` | ❌ Not invoked (manual CHANGELOG edits all 47 PRs) |
| `frontend-tester`   | `.claude/agents/frontend-tester.md`   | ❌ Not invoked (Playwright e2e deferred)           |
| `retro-agent`       | `.claude/agents/retro-agent.md`       | ❌ Not invoked (M1 close report written manually)  |

**Action:** these subagents are scaffolded but unused. Consider invoking `retro-agent` at M2 close as a forcing function. Currently shipping value: zero from these 3 subagents alone.

---

## 3. CLAUDE.md vs repo drift check

### 3.1 Confirmed drifts

| Topic              | CLAUDE.md says                                        | Reality                                                              | Severity                     |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------- |
| Embedding model    | "Xenova/bge-large-en-v1.5 (1024-dim)"                 | `Xenova/bge-small-en-v1.5` (384-dim) per ADR-003 amendment + ADR-009 | **P2** — see followup `(ae)` |
| Frame count        | "41 locked HTML frames"                               | 41 confirmed (17 + 20 + 4) ✅                                        | OK                           |
| Locked deps majors | "next=15, react=19, tailwind=4, @nestjs=10, prisma=5" | matches `.claude/locked-deps.json` ✅                                | OK                           |
| pnpm only          | "Use pnpm only"                                       | confirmed — no npm/yarn lockfiles ✅                                 | OK                           |
| RBAC roles         | "Admin, Lead, QA Engineer, Stakeholder"               | matches `Role` enum in shared schemas ✅                             | OK                           |

### 3.2 No drift

- 8-user pilot roster: still matches actual seeded users
- Hooks active list: matches `.claude/hooks/` and `settings.json`
- MCP servers configured: matches `~/.claude/plugins/` available skills
- Hard rules 1–13: enforced or surfaced at session start

---

## 4. Tech-project-forge v1.4 feature usage

Re-audit from Day-10 retro:

| Feature                  | Available     | Used effectively in M1?                                            |
| ------------------------ | ------------- | ------------------------------------------------------------------ |
| Memory System            | ✅            | ✅ Decisions/Patterns/Stack files updated regularly                |
| Compound Learnings       | ✅ skill      | ❌ Used 0 times — long-form `docs/lessons-learned/` instead        |
| Subagents (3)            | ✅ scaffolded | ❌ Used 0 times in M1                                              |
| Auto-docs Stop hook      | ✅ wired      | ✅ Fired multiple times during M1                                  |
| Pre-push CHANGELOG guard | ✅ wired      | ✅ Active on every push                                            |
| Audit Log                | ✅ wired      | ✅ JSONL growing                                                   |
| Context Mode plugin      | ✅ available  | ⚠️ Used 2× in M1, ~5 missed opportunities (gh pr list, jest, find) |
| Superpowers skills       | ✅ available  | ⚠️ `simplify` never invoked; `commit-push-pr` used ~10×            |
| Code Simplifier          | ✅ available  | ❌ Never invoked                                                   |
| Token-savings tracking   | ✅ wired      | ✅ JSONL growing; Excel aggregator running                         |

**Score: 7/10 fully used, 3/10 underutilized** (consistent with Day-10 retro).

---

## 5. Action items for M2

| #   | Action                                                                                                          | Owner              | Effort          |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------ | --------------- |
| 1   | File followup `(ae)` — PRD v8.1 / ERD v2.1 / CLAUDE.md drift on embedding model (1024 → 384 dim spec amendment) | MAIN (this PR)     | 5 min           |
| 2   | At M2 close, invoke `retro-agent` instead of writing the close report manually                                  | MAIN at M2 close   | 0 (just invoke) |
| 3   | Adopt `/compound-learnings` for ad-hoc lessons; `docs/lessons-learned/` reserved for milestone-batch lessons    | MAIN every session | 0               |
| 4   | Default to `ctx_batch_execute` for any output >20 lines                                                         | MAIN every session | 0               |
| 5   | Trial `simplify` skill on the next refactor PR                                                                  | FE+1 or BE+1       | 5 min           |
| 6   | Trial `frontend-tester` agent before Render deployment (Playwright sweep against staging URL)                   | FE+1 + MAIN        | 30 min          |

---

## 6. Memory cadence update

`feedback_skill_audit_cadence.md` — append:

```
- Last skill audit: 2026-05-06 (post-M1 close trigger).
- Next due: post-M2 close (~2026-05-09 target).
- Audit doc: docs/audits/2026-05-06-skill-alignment-audit-day-11.md
```

---

## Cross-references

- `docs/audits/skill-alignment-audit.md` — generic template (followed for structure)
- `docs/audits/2026-04-27-eod-skill-conformance-audit.md` — prior audit
- `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` — 7 lessons context
- `docs/followups.md` — followup `(ae)` filed in this PR
- `.claude/settings.json` — hooks wiring (verified)
- `.claude/locked-deps.json` — version-pin source of truth
