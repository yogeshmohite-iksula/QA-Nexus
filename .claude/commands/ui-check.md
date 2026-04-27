---
description: Visual confirmation gate for a frontend route — screenshots at 320 + 1440, then halt for explicit "looks good — commit?" approval (CLAUDE.md Rule 13)
argument-hint: <route> (e.g. /sign-in/forgot or /workspace/projects)
---

# /ui-check — Visual confirmation gate

You are running the **CLAUDE.md Rule 13 visual confirmation gate** for the route: `$ARGUMENTS`.

This gate is mandatory for every newly developed or refactored frontend screen, established 2026-04-26 after F06 + F06b iterations where automated checks (lint, typecheck, hooks) passed but real-screen rendering still revealed slider overflow, browser-extension hydration noise, and cramped form spacing. **Automation can't see what a human sees.**

## Steps (do these in order)

### 1. Validate the argument

- If `$ARGUMENTS` is empty, halt and say: `usage: /ui-check <route>  (e.g. /ui-check /sign-in/forgot)`.
- Normalize: strip leading `/` if present, then re-add a single leading `/`. Store as `$ROUTE`.
- Compute `$SLUG` = `$ROUTE` with `/` replaced by `-` and any leading `-` stripped (e.g. `/sign-in/forgot` → `sign-in-forgot`; `/` → `home`).

### 2. Ensure `pnpm dev` is running on `:3000`

- Probe `http://localhost:3000` with a short timeout (e.g. `curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:3000`).
- If response is anything except 2xx/3xx/404 (i.e. server clearly not up), start it in the background from `apps/web/`:
  ```bash
  cd apps/web && pnpm dev > /tmp/ui-check-pnpm-dev.log 2>&1 &
  ```
  Then wait up to ~15 s for `:3000` to start responding (poll every 1 s). If still not up after 15 s, halt and tail `/tmp/ui-check-pnpm-dev.log`.
- If already up, do nothing — assume Yogesh's existing dev process is fine.

### 3. Take screenshots at 320×568 (mobile) and 1440×900 (desktop)

Use the Playwright MCP server (`mcp__playwright__*` tools, configured per CLAUDE.md MCP list):

```
1. mcp__playwright__browser_navigate    → http://localhost:3000$ROUTE
2. mcp__playwright__browser_resize      → 320 × 568
3. mcp__playwright__browser_take_screenshot → docs/screenshots/rwd-$SLUG-320.png
4. mcp__playwright__browser_resize      → 1440 × 900
5. mcp__playwright__browser_take_screenshot → docs/screenshots/rwd-$SLUG-1440.png
```

Create `docs/screenshots/` first if it doesn't exist.

If Playwright surfaces a console error or network 4xx/5xx during navigation, capture it and surface alongside the screenshots — that's exactly the kind of thing this gate is designed to catch.

### 4. Print the inline report

Output (verbatim format — Yogesh scans this fast):

```
URL:   http://localhost:3000$ROUTE
320:   docs/screenshots/rwd-$SLUG-320.png
1440:  docs/screenshots/rwd-$SLUG-1440.png

Open the URL in your browser and inspect both screenshots. Check:
  - No horizontal scroll at 320 px
  - Forms ≤ 480 px wide on desktop
  - Tap targets ≥ 44 × 44 px on mobile
  - No browser-extension hydration noise (per F06 incident)
  - Modals render full-screen on mobile, declared sizes on desktop

looks good — commit?
```

### 5. HALT and wait for explicit approval

**Do NOT run `git commit` until Yogesh replies with explicit approval** ("looks good", "ship it", "commit", "yes", or similar). Anything ambiguous = stay halted, ask for clarification.

If Yogesh says no / spots a regression, do NOT auto-fix — wait for him to describe what to change, then iterate, then re-run `/ui-check` with the same route.

## Reference

- CLAUDE.md Rule 13 — visual confirmation gate definition
- `~/.claude/projects/.../memory/feedback_frame_port_protocol.md` — 9-step frame-port protocol that includes this gate
- `~/.claude/projects/.../memory/feedback_layout_responsiveness.md` — F06 incident that motivated this gate
