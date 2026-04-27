# Bug Patterns and Fixes

Append new entries at the top with `[YYYY-MM-DD]: bug — root cause — fix` format. Cross-link to the commit that fixed it.

## 2026-04-26: Commitlint rejected `ops(deploy):` — type-enum too strict (`@commitlint/config-conventional` default)

Commitlint's `@commitlint/config-conventional` default type-enum is: `build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test`. `ops` is NOT in the default set. Commit failed with `type must be one of [...] [type-enum]` at the commit-msg hook.

**Fix (be9f3be):** extend `commitlint.rules.type-enum` in root `package.json` to include `ops`:

```json
"commitlint": {
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test", "ops"]]
  }
}
```

**Pattern:** when adopting a deployment-class semantic prefix not in the conventional-commits default, extend the type-enum once and commit it as part of the same change.

## 2026-04-26: Husky pre-commit can't find `pnpm` — Bash sub-shell PATH

`.husky/pre-commit` runs `pnpm exec lint-staged`. On Yogesh's non-admin Mac, Homebrew is at `~/homebrew/bin/` (not `/opt/homebrew/bin/` or `/usr/local/bin/`). Husky spawns the hook in a non-login non-interactive Bash sub-shell that doesn't source `~/.zprofile` or `~/.bashrc`, so `pnpm` is missing from `$PATH`.

**Fix:** prefix the bash invocation with `export PATH="$HOME/homebrew/bin:$PATH" &&` for any git or commit-triggered command.

**Pattern:** any agent shell on this machine MUST prepend `export PATH="$HOME/homebrew/bin:$PATH"` before running pnpm/git/gh/wrangler. Auto-runs in interactive `zsh` shells via `~/.zprofile`, but agent sub-shells need it explicit.

## 2026-04-26: F06 + F06b form below the fold on 770–900 px viewports — `min-h-[1024px]` overflow

Initial F06 + F06b ports used `min-h-[1024px]` on the stage container, copying the locked HTML literally. Real viewports (1440×900 MacBook, ~770 px usable height after Chrome chrome) were shorter than 1024 px, so the form rendered BELOW the fold. Yogesh saw blank dark canvas on top + form requiring scroll-down on every load.

**Fix:** swap `min-h-[1024px]` → `min-h-screen` on the stage. Add `overflow-y-auto` to taller auth panels (F06b, F06c) so cramped viewports scroll within the panel instead of breaking layout.

**Pattern:** the 41 locked HTML frames are 1600×1024 design references, NOT mandated React heights. Always use `min-h-screen` + `overflow-y-auto` in the form column.

## 2026-04-26: Grammarly browser extension triggered React hydration error on every page load

Console error: `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.` Stack pointed to `<body>` with `__processed_<id>="true"`, `data-new-gr-c-s-check-loaded="..."`, `data-gr-ext-installed=""`. These are Grammarly attributes injected AFTER SSR but BEFORE hydration.

**Fix (a2005cb):** add `suppressHydrationWarning` to `<body>` in `apps/web/app/layout.tsx`. Scope to smallest element where extensions inject — does NOT mask real subtree mismatches.

**Pattern:** any team using Grammarly / ColorZilla / dark-reader / similar will hit this. The fix is well-known; bake it into every Next.js app layout from the start.

## 2026-04-26: F06 + F06b had horizontal scroll on Yogesh's 1440-wide MacBook — fixed `w-[1600px]` containers

Initial ports used `w-[1600px]` on the stage + `w-[800px]` on each panel, faithful to the locked HTML. Yogesh's display = 1440 × 900 → the 1600-wide stage overflowed by ~160 px → Chrome auto-scrollbar; user could drag left/right to see both panels.

**Fix (a2005cb):** rewrite to fluid pattern — `flex min-h-screen flex-col lg:flex-row` outer, `flex-1` panels, brand panel `hidden lg:flex` on mobile, mobile-only BrandMark above the form, hero `text-[40px] xl:text-[56px]`. Result: NO horizontal scroll at any viewport ≥ 320 px.

**Pattern:** never assume the locked HTML width. Always treat `1600 × 1024` as a design reference and build mobile-first responsive. Codified as CLAUDE.md Rule 12 + planned `enforce-rwd.sh` hook (T034).

## 2026-04-26: Next.js 16.2.4 scaffolded instead of locked v15 — `pnpm create next-app` defaults to latest

`pnpm create next-app` always installs the latest stable. PM1 locks to Next 15. Slip caught at the dry-run stage of MS0-T002, AFTER scaffold but BEFORE first commit.

**Fix:** edit `apps/web/package.json` to pin `"next": "^15.5.0"` + `pnpm install`. Then created MS0-T033 to harden `enforce-pm1-stack.sh` with major-version enforcement so this can NEVER silently happen again. Hook now blocks Edit|Write to package.json / pnpm-lock.yaml when any locked-deps.json major is mismatched. Lands at scaffold time, not dry-run time.

**Pattern:** when pinning major versions of any framework, also pin them at the hook layer so future scaffolds can't drift. `.claude/locked-deps.json` is the source of truth.

## Empty: API bugs, DB bugs

Stub for future entries. API surface lands in MS0-T020+ (M1). DB schema lands in MS0-T020. Bug categories will appear here as the build progresses.
