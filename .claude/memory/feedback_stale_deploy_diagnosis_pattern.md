# BINDING RULE — Stale-deploy diagnosis pattern

**Type:** feedback · **Filed:** Sun Day-5 2026-06-07 ~16:35 IST · **First observed:** Sun Day-5 ~15:30 IST (Yogesh smoke surfaced P0-001) → ~16:15 IST (FE+1 32nd reality-check identified stale deploy)

## Rule

When diagnosing a "live" UI bug against a deployed bundle, **FIRST verify which commit/PR the deploy is built from BEFORE assuming code bug**. Cloudflare Pages auto-deploys on `main` commits, but pending PRs (not yet merged) are NOT in the production bundle. A "bug" that doesn't reproduce in current code is almost certainly a deploy-version mismatch.

## Why this exists

Sun Jun 7 ~15:30 IST. Yogesh ran the user-testing protocol Scenario A on `https://qa-nexus-web.pages.dev` and found his identity rendering as "Kishor K." instead of "Yogesh M." Filed as P0-001 (Mon-blocker) in the Sun EOD.

FE+1's 32nd reality-check (~16:15 IST) couldn't reproduce in current code:

- `grep -r 'Kishor' apps/web/src/` returned zero hardcoded matches
- `useCurrentUser()` defaulted to Yogesh (the dev fixture)
- Phase-2 smoke rendered Yogesh correctly

Discovery: PR #247 (canonical AdminShell with correct identity wiring) was open + unmerged. Cloudflare Pages deploy was therefore stale — built from a `main` SHA that predated the seed-centralization + shell upgrade. The "bug" disappeared the moment #247 + #251 (formerly #250) merged + Cloudflare auto-redeployed (~3 min after `963fc08`).

**Cost of misdiagnosis** if FE+1 had charged into an auth rewrite based on Yogesh's initial report: ~2-4 hours of unnecessary code surgery + risk of introducing real bugs into the auth path during a Mon-launch crunch window.

## How to apply

Before classifying any UI bug as P0/P1 against a deployed environment:

1. **Check the deployed commit SHA.**
   - Cloudflare Pages dashboard → Project → Deployments → top entry → "Commit"
   - Render dashboard → Service → Events → recent "Deploy live" → "Commit"
2. **Compare to current `origin/main` HEAD:** `git fetch origin main && git log --oneline -1 origin/main`
3. **Check if recent fix-PRs are merged + deployed.** `gh pr list --state merged --base main --limit 10 --json number,title,mergedAt`
4. **Grep current `main` for the value the bug describes.** If zero matches → suspect stale deploy.
5. **Read the relevant provider/hook source.** E.g., `useCurrentUser()`, `useSession()`, route loaders — does the code actually do what the bug claims it does?
6. **If mismatch:** merge pending PRs + wait for redeploy + re-test BEFORE any code changes.

## Stacked-PR cascade caveat (observed live during this fix)

Sun Jun 7 ~16:25 IST during this merge wave:

- PR #250 (EmptyState + Playwright smoke) was opened with `base = feat/web-shell-canonical-upgrade` (stacked on #247's branch)
- When #247 squash-merged, GitHub auto-deleted the base branch → PR #250 auto-CLOSED as orphaned
- GraphQL refused base re-target on closed PRs
- Fix: open replacement PR (#251) off `main` with the same head branch — content unchanged

Pattern lesson: **stacked PRs need either (a) base re-target before parent merge, or (b) re-open against main after parent merge.** Captures the same `.git`-resource-sharing class as the 9th-pattern multi-worktree drift (the chained-base brittleness).

## Cross-references

- `feedback_chained_base_cascade_resolution.md` (cousin — chained-base drift from squash-merges; this 10th pattern is the diagnostic version of the same class)
- `feedback_worktree_locked_merge_pattern.md` (foundational — temp-branch + force-with-lease)
- `feedback_multi_worktree_git_working_tree_drift.md` (sibling — `.git` resource sharing hazards)
- FE+1's 32nd reality-check (Sun Day-5 ~16:15 IST — the precedent)
- PR #247 + #250 (closed) → #251 (re-open) — the live cascade
- Sun EOD §2 P0-001 — surfacing report
- Hard Rule 13 — visual gate authority; the visual gate is against the deployed bundle, not source code

_Authored Sun Day-5 2026-06-07 ~16:35 IST. 10th safety pattern of the week; running tally: 9 formal + 1 (10th, this file) + 1 dwelling (broad-audit-shallow-coverage)._
