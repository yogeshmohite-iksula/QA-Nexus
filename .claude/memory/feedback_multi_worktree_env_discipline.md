# BINDING RULE — Multi-worktree env file discipline

**Type:** feedback · **Filed:** Thu Day-3 2026-06-04 · **First observed:** Wed Day-2 PM (BE+1 18th reality-check)

## Rule

When editing `.env` files in the QA Nexus multi-worktree setup, ALWAYS confirm the absolute path matches the worktree of the agent that needs to read it. Verify with `awk` before assuming the edit landed.

## Why this exists

Wed Jun 3 (Day-2 PM). Yogesh edited `apps/api/.env` to add `RESEND_FROM_EMAIL` + `R2_ENDPOINT` + `R2_BUCKET` to unblock BE+1 Tasks F.3 + F.5. The edits saved to `~/AI_Tester_Project/Project10-QA_Nexus/apps/api/.env` (MAIN worktree) instead of `~/AI_Tester_Project/Project10-QA_Nexus-backend/apps/api/.env` (BE worktree). BE+1's 18th reality-check caught it: `awk` returned 0 matches in the `-backend` worktree's `.env`.

Pattern echoes the Days-25-27 `GROQ_API_KEY` saga (same multi-worktree env hazard — key was pasted to the wrong worktree's `.env`).

## How to apply

Before editing any `.env` in a multi-worktree QA Nexus setup:

1. `cd` to the worktree of the agent that needs the value
2. `pwd` — confirm absolute path ends in the correct suffix (`-backend` / `-frontend` / root)
3. Open `.env` at that absolute path (in TextEdit / vim — NOT via Claude Code chat which may resolve the path ambiguously)
4. Add values, save
5. Verify with `awk`: `awk -F= '/^<KEY_PATTERN>/{print $1, length($2)}' apps/api/.env`
6. Should print key name + non-zero length
7. If empty → wrong path; back to step 1

## Cross-references

- `feedback_worktree_locked_merge_pattern.md` (sibling — worktree discipline for git operations)
- `feedback_prisma_directurl_gotcha.md` (BE+1 Day-2 AM — `DIRECT_URL` override for migration commands)
- Days-25-27 `GROQ_API_KEY` saga (same class — key pasted to wrong worktree `.env`)
