# Architecture Decisions

Append new entries at the top with `[YYYY-MM-DD]: decision — rationale` format. Cross-link to ADRs (`docs/adr/`) once that folder exists.

## 2026-04-26: F06c Reset Password — Strong-state strength card extended

`PasswordStrengthCard.tsx` extended to support `level="Strong"` (4/4) per locked F06c design: s4 segment now `bg-pass` (green) when filledSegments === 4 (was previously locked to teal). Level label color now derives from `level` prop: Strong → pass (green), Good → primary (teal), Fair → warn (amber), Weak → fail (red). F06b "Good" rendering unchanged — backward compatible. **Pattern:** when adding a new state to a shared component, derive color from prop instead of hardcoding so existing consumers don't regress.

## 2026-04-26: Cloudflare Pages — static export + client-side `/` redirect

`apps/web/next.config.ts` set to `output: 'export'` + `trailingSlash: true` + `images.unoptimized: true`. CF Pages serves the `out/` directory directly (no Node runtime). **Trade-offs:** no API routes, no middleware, no server `redirect()` in `apps/web`. The `/` → `/sign-in` redirect is client-side via `useEffect` + `router.replace` in `app/page.tsx`. All API surface lives in `apps/api` (NestJS on Render — MS0-T011). Doc: `docs/deploy/cloudflare-pages.md`. Mode: Direct Upload via `pnpm deploy:web`; GitHub auto-deploy is a deferred follow-up.

## 2026-04-26: Hard Rule 13 — visual confirmation gate before commit

Every newly developed/refactored screen requires posting the local URL + 320 + 1440 screenshots to Yogesh BEFORE running `git commit`. Established after F06 + F06b + RWD iterations where automated checks (build, lint, hooks) passed but real-screen rendering revealed slider overflow + browser-extension hydration noise + cramped form spacing. Process gate, NOT a permission gate. Auto-commit pre-approved for plumbing (git, pnpm, scaffolding) but NOT for frame ports.

## 2026-04-26: Hard Rule 12 — full RWD on every ported frame

The 41 locked HTML frames in `PM1_UI_v2/` are **design references at 1600×1024 canvas size, NOT mandated React widths**. Every React port MUST be:

- Mobile-first — base styles target ~320 px (iPhone SE), progressively enhance via Tailwind breakpoints `sm: 640 / md: 768 / lg: 1024 / xl: 1280 / 2xl: 1536`
- NO fixed pixel widths on layout containers (no `w-[1600px]`, no `w-[800px]`) — use `w-full`, `max-w-*`, `flex-1`, grid
- Component max-widths only where semantically correct (forms ≤ 480 px, reading content ≤ 768 px)
- Tap targets ≥ 44 × 44 px (WCAG 2.5.5)
- NO horizontal scroll at any viewport ≥ 320 px wide — test at 320 / 768 / 1024 / 1440 / 1920 minimum before commit
- Modals (Stage 1120×860, Edit 960×720, Picker 720×640, Confirm 480×360 per `01_SYSTEM.md`) become full-screen Drawer sheets on mobile; render at declared sizes on desktop

Backed by `PM1_PRD §10 NFR-001` ("acceptable responsiveness for daily use") + `PM1_PRD §10.2` ("responsive for mobile browsers") + `01_SYSTEM.md §4.4` ("Canvas 1600×1024 desktop **primary**").

Enforcement: planned `enforce-rwd.sh` PreToolUse Edit|Write hook — MS0-T034 (P1, queued).

## 2026-04-26: Auth-surface two-panel pattern (F06 / F06b / F06c)

```
< 1024px (mobile + tablet portrait):
  - Brand panel HIDDEN (`hidden lg:flex`)
  - Auth panel takes full viewport
  - Mobile-only `<BrandMark />` renders ABOVE the form to preserve identity
  - Form container `max-w-[440px]`

>= 1024px (lg+, desktop):
  - Two columns, each `flex-1` (50/50 split)
  - Brand panel left (Evidence Mesh + hero + version chip + "All systems operational")
  - Auth panel right (form)
  - Hero typography scales: 40px (lg) → 56px (xl: 1280+)
```

**Apply this pattern to all future auth-surface frames:** F07, F07b, F07c, F07d, F27.

## 2026-04-26: Auth-surface duplicate brand mark — DEVIATION from locked HTML

Locked F06b lines 338-346 ship a small QA Nexus wordmark in the top-left of the right auth panel. Locked F06c lines 339-347 same. Per Yogesh override 2026-04-26, this is **OMITTED on desktop** — the left brand panel handles brand identity. On mobile (< lg) the BrandMark renders ABOVE the form. Apply same omission to F07 / F07b / F07c / F07d. Document inline in each page.tsx.

## 2026-04-26: Layout responsiveness rule — `min-h-screen`, NOT `min-h-[1024px]`

The 41 locked HTML frames are designed at 1600×1024 canvas size. Real viewports are 770–900 px tall. Always use `min-h-screen` for the stage; auth panel adds `overflow-y-auto` for forms taller than viewport. Confirmed on F06 + F06b + F06c on 2026-04-26.

## 2026-04-26: Grammarly hydration false-positive — `suppressHydrationWarning` on `<body>`

Browser extensions (Grammarly, ColorZilla, dark-reader) inject attributes into `<body>` between SSR and client hydration. React then complains about a tree-mismatch. Fix: `suppressHydrationWarning` on `<body>` ONLY in `apps/web/app/layout.tsx`. Does NOT mask real subtree mismatches. Pattern: scope `suppressHydrationWarning` to the smallest possible element where extensions inject.

## Pattern: Frame port protocol (every frame, every time)

1. Read locked HTML in full
2. Translate to React using shadcn-pattern components
3. Use `min-h-screen`, NOT `min-h-[1024px]`
4. Run hooks dry-run (enforce-design-tokens + enforce-pm1-stack must exit 0)
5. `pnpm --filter web build` — must be clean
6. `pnpm exec eslint <new-files>` — must return 0
7. **RESIZE TEST** at 320 / 768 / 1024 / 1440 / 1920 via Playwright + screenshot
8. **USER VISUAL CONFIRMATION GATE** (Rule 13) — post URL + 320 + 1440 screenshots, await "looks good"
9. Save screenshot to `docs/screenshots/<frame-id>-<date>.png`
10. Document any deviations from locked HTML inline in page.tsx with date + rationale
