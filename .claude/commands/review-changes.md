---
description: Walk the diff between the current branch and origin/main file-by-file, summarize each change in 2-3 lines, and flag cross-domain bleed (parallel-chat path-filter violations)
---

# /review-changes — Branch diff walk + cross-domain check

You are doing a structured pre-PR review of the current branch's changes vs `origin/main`. Goal: catch problems BEFORE the PR is opened — wrong-branch commits, cross-domain bleed (parallel-chat path-filter violations), accidental secret commits, scope creep.

## Steps

### 1. Refresh the diff base

```bash
git fetch origin --quiet
```

### 2. Print the high-level summary

Run and report:

```bash
git status --short
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
```

If the branch isn't ahead of `origin/main` at all, halt and say: `nothing to review — branch is at origin/main`.

### 3. File-by-file walk

For each file in `git diff --name-only origin/main...HEAD`:

a. **Classify the file** by path. Use these buckets (the parallel-chat domain split):

| Path pattern                                                  | Owner                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/web/**`                                                 | **CHAT 2 (FE)**                                         |
| `.claude/hooks/**`, `.claude/rules/**`, `.claude/commands/**` | **CHAT 2 (FE)** (also generally FE-led)                 |
| `apps/api/**`, `prisma/**`, `packages/shared/**`              | **CHAT 3 (BE)**                                         |
| `.github/workflows/**`                                        | **CHAT 3 (BE) / MAIN**                                  |
| `.claude/agents/**`                                           | **CHAT 3 (BE)**                                         |
| `.claude/settings.json` deny block                            | **CHAT 3 (BE)** (FE may add hooks to PreToolUse arrays) |
| `docs/**`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`           | **MAIN** (cross-cutting)                                |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`       | **MAIN** (cross-cutting)                                |

b. **Read the file's diff** (`git diff origin/main...HEAD -- <file>`).

c. **Produce a 2-3 line summary** in this format:

```
<file path>  [<owner bucket>]
  - <purpose: what this change does, 1 line>
  - <impact: who/what is affected, 1 line>
  - <risk: any concern, or "none" — 1 line>
```

### 4. Cross-domain bleed flag

After the walk, scan the file list. If THIS branch is `feature/frontend-ports` and ANY file is owned by CHAT 3 (BE) or MAIN, flag it as:

```
⚠ CROSS-DOMAIN BLEED:
  - <file>  → owned by <bucket>, not this branch's domain
  Recommendation: revert and let the owning chat handle it,
  OR confirm with Yogesh that this exception is intentional.
```

If THIS branch is `feature/backend-wiring` and any file is owned by CHAT 2 (FE), do the symmetric flag.

### 5. Secret-leak quick scan

Run a fast grep over the diff for obvious leak patterns:

```bash
git diff origin/main...HEAD | grep -nE '(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{35}|gsk_[A-Za-z0-9]{40,}|xoxb-[0-9-]+-[A-Za-z0-9]+|GROQ_API_KEY *= *[a-zA-Z0-9_-]+|RESEND_API_KEY *= *[a-zA-Z0-9_-]+)'
```

If anything matches, halt with a loud `🚨 POTENTIAL SECRET LEAK` warning and the offending line. Do NOT proceed.

### 6. Final verdict

Print one of:

```
✅ READY FOR PR — N files changed, all in domain, no secret leaks detected.
   Suggested PR title: <derived from commit messages>
```

OR

```
⚠ HOLD — see flags above. Resolve before opening PR.
```

## Reference

- Parallel-chat domain split — see this prompt's source (CHAT 2 brief)
- `.claude/rules/frontend.md` — full FE path-filter detail
- `.claude/hooks/pre-tool-use/check-secrets.sh` — runtime version of step 5 (planned for P1.5, BE chat owns)
