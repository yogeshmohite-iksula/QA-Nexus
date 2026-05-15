# QA Nexus PM1 — CLAUDE.md

Auto-loaded by Claude Code on every session start. Survives restarts. Defines the binding context for the QA Nexus PM1 build.

## Binding spec (HIGHEST authority)

| Doc                      | Path                                                     | Version  |
| ------------------------ | -------------------------------------------------------- | -------- |
| **PM1 product spec**     | `QA Nexus/PM1/PM1_PRD/PM1_PRD.md`                        | **v8.1** |
| **PM1 engineering spec** | `QA Nexus/PM1/PM1_ERD/PM1_ERD.md`                        | **v2.1** |
| **PM1 design system**    | `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md`           | locked   |
| **M0 backlog**           | `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` | v8.0     |

Project-level `QA Nexus/PRD/PRD.md` (v2.10) and `QA Nexus/ERD/ERD.md` (v2.6) describe the PM2-PM4 vision — **NOT binding for PM1**.

Conflict resolution priority: **PM1_PRD > PM1_ERD > M0_v8 > 01_SYSTEM > Tech-project-forge-skill > MCP suggestions > library defaults.**

## Hard rules (do not violate)

1. **$0/month cost gate is binding.** Any decision that would force a paid component requires Yogesh's explicit written approval first. Even $5/mo upgrades require an ADR and sign-off.
2. **Free / OSI-approved OSS only.** Hosted services may be used if they have a free tier matching pilot scale (Groq, Gemini, Cloudflare, Neon, Render, Resend, Grafana Cloud, UptimeRobot, GitHub Actions).
3. **Never modify the 46 locked HTML frames** spanning **3 folders** in `QA Nexus/PM1/PM1_UI_v2/`:
   - `frame  html view/` (16 frames, TWO spaces in folder name — F22 v1 removed 2026-05-08, superseded by F22 v2)
   - `frames - claude code build (PM1 v2.6-v2.8)/` (16 frames — F18/F19/F20/F21 v1 removed 2026-05-08, superseded by v2 redesigns in `Redesign Frame by claude design/`)
   - `Redesign Frame by claude design/` (14 v2 frames: F14, F14m1, F14m2, F14m3, F15, F16a, F16b, F16c, F18, F18m1, F19, F20, F21, F22 — these are the canonical references for all M3+M4 page ports per Hard Rule 15)

   Plus 4 supporting reference files in `Redesign Frame by claude design/`: `F15 Mobile Breakpoints.html`, `primitives-playground.html`, `2026-05-03-phase-3-drift-retrofit-memo.html`, `_Demo Collapsible Nav Sections.html`. These are NOT in the 46 count — they are binding patterns + retrofit guidance.

   **v2-supersedes-v1 policy (codified 2026-05-08, "Path B"):** When Claude Design ships a v2 redesign for a frame that has a v1 original, the v1 file is deleted in the same PR that adds the v2. Rationale: maintaining stale v1s alongside v2s confuses FE+1 about which is canonical (Hard Rule 15 source-of-truth conflict). Frames retained in `frame  html view/` and `frames - claude code build/` are those without v2 redesigns. Once a frame is redesigned to v2, its v1 must be removed in the same commit.

   Translate them to React components in `apps/web/src/app/**` instead. Reference with `// Implements F06 Sign In · see PM1_UI_v2/frame  html view/F06 Sign In.html` or `// Implements F14 Requirements · see PM1_UI_v2/Redesign Frame by claude design/F14 Requirements v2.html`.

4. **Never add Material Design 3 tokens, tertiary colors, or extend `tailwind.config.ts`** beyond the locked palette. The `enforce-design-tokens.sh` PreToolUse hook will block. Respect its decision.
5. **Never add anything on the ban list:** FastAPI, Ollama, Gemma 4 self-host, Redis, Valkey, BullMQ, ioredis, Neo4j, Graphiti, Keycloak, Vault, pgvectorscale, LangSmith, langchain, MUI, Chakra UI, Mantine, Material Design 3 tokens, daisyui, material-tailwind. The `enforce-pm1-stack.sh` PreToolUse hook will block.
6. **Never put API keys, OAuth secrets, or session tokens in the repo.** `.env` is in `.gitignore`. Provider keys go in Render env vars. CI keys go in GitHub Secrets.
7. **All state-changing operations write to the HMAC-SHA256 chained `audit_log` table** (PM1_ERD §3.13). Visible in F28 Settings & Audit.
8. **Use pnpm only** — never npm or yarn. All scripts assume pnpm.
9. **TypeScript strict mode** in both `apps/web` and `apps/api`. No `any` types without `// FIXME` + a Linear-style ticket reference.
10. **All API endpoints have Zod schemas in `packages/shared`.** Frontend imports the same schemas for client-side validation.
11. **When in doubt, ask Yogesh — never guess.** Confirm before any non-trivial architectural decision.
12. **Full responsive web design (RWD) on every ported frame.** The 41 locked HTML frames in `PM1_UI_v2/` are **design references at 1600×1024 canvas size — NOT mandated widths**. Every React port MUST be: (a) mobile-first — base styles target ~320 px (iPhone SE), progressively enhance via Tailwind breakpoints `sm: 640 / md: 768 / lg: 1024 / xl: 1280 / 2xl: 1536`; (b) NO fixed pixel widths on layout containers (no `w-[1600px]`, no `w-[800px]`) — use `w-full`, `max-w-*`, `flex-1`, grid; (c) component max-widths only where semantically correct (forms ≤ 480 px, reading content ≤ 768 px); (d) tap targets ≥ 44 × 44 px (WCAG 2.5.5); (e) NO horizontal scroll at any viewport ≥ 320 px wide — test at 320 / 768 / 1024 / 1440 / 1920 minimum before commit; (f) typography scales appropriately across breakpoints; (g) modals (Stage 1120×860, Edit 960×720, Picker 720×640, Confirm 480×360 per `01_SYSTEM.md`) become full-screen Drawer sheets on mobile, render at declared sizes on desktop. Backed by `PM1_PRD §10 NFR-001` ("acceptable responsiveness for daily use") + `PM1_PRD §10.2` ("responsive for mobile browsers") + `01_SYSTEM.md §4.4` ("Canvas 1600×1024 desktop **primary**" — explicitly leaves room for non-desktop). Enforced by `enforce-rwd.sh` PreToolUse hook (MS0-T034).
13. **User visual confirmation gate before local commit.** For every newly developed/refactored screen, post the local URL (`http://localhost:3000/<route>`) to Yogesh + screenshots at 320 px and 1440 px, and wait for explicit "looks good, commit" approval BEFORE running `git commit`. Established 2026-04-26 after F06 + F06b + RWD iterations where automated checks passed but real-screen rendering revealed slider overflow + browser-extension hydration noise + cramped form spacing that automation missed.
14. **App shell parity is mandatory on every authenticated screen.** Established 2026-05-06 (Day-11 evening) after F15 HTML ↔ React port diff revealed missing collapse + hamburger primitives in the (app) layout. **Refined 2026-05-07** to lock scrollbar + nav-icon + utility-bar pattern across all current and future frames + Claude Design redesigns.

    **WHEN shell IS required** (and MUST match F15 v2.html exactly):
    - Every authenticated page route at `apps/web/src/app/(app)/**/page.tsx`
    - Includes: F08 Home, F09 Projects List, F12/F13/F15 KB family, F14 Requirements, F16a/b/c Test Cases, F18 Test Suites, F19 Run Console, F20 Run Results, F21 Defects Hub, F23 Reports Studio, F25 Executive Dashboard, F26 Agents, F27 Users & Roles, F28 Settings & Audit

    **WHEN shell is NOT required** (explicitly excluded):
    - Auth flow pages: `(auth)/sign-in`, `(auth)/verify`, `(auth)/onboarding/**`, `(auth)/set-password`, `(auth)/reset-password`
    - Modal components (Dialog / Sheet / Drawer) — overlay parent route which already has shell
    - Marketing / landing / public pages (none in PM1 scope)

    **When required, shell MUST include (LOCKED design — DO NOT alter):**
    - **Canonical reference:** `PM1_UI_v2/Redesign Frame by claude design/F15 Knowledge Base v2.html` (lines 50-200). Also `F14 Requirements v2.html` as second canonical exemplar.
    - **Custom scrollbar (SYS-17):** F15 v2 lines 50-64. `::-webkit-scrollbar` 8px desktop / 6px touch · `--border-strong` thumb · `--secondary` on hover · transparent track. `scrollbar-width:thin` for Firefox. Applied globally to all scrollable surfaces.
    - **Left rail:** 240px expanded / 64px collapsed via toggle button (44px hit zone, persists `qa-nexus.shell.rail-collapsed`). Nav items use 24×24 colored icon chips with `data-tone` attribute (home / primary / secondary / info / warn / pass / fail). Each icon chip's color matches function — see F15 v2 lines 163-198.
    - **Mobile hamburger menu** in top bar (visible <1024px, opens drawer overlay slide-from-left, body scroll lock, ESC + backdrop-tap close).
    - **Top utility bar:** brand mark (gradient logo + QA Nexus wordmark) + project switcher pill (`Iksula Returns · main` with gradient `IR` dot) + global search omnibox (`Search everything…` + `⌘K` kbd hint) + plus icon + bell icon (with notification pip) + crosshair/grid icon + `Operate / Review / Prove` mode toggle + user pill (avatar + name).
    - **Section headings** in left rail (5 sections): PLAN / AUTHOR / RUN / ANALYSE / GOVERN — uppercase, JetBrains Mono 10px, `--t3` color, letter-spacing 0.1em.
    - **Section collapse-on-click** (NEW 2026-05-08): each section header is a clickable row with a chevron icon (▼ default, rotates -90° to ▶ when collapsed). Click toggles the section body (smooth max-height + opacity transition, ~280ms cubic-bezier). Underline divider (1px `--border`) sits BELOW the entire section header row (full width with 4px left/right margin). Persist per-section state to localStorage key `qa-nexus.shell.section-{name}-collapsed`. Each section is independent — collapsing one doesn't affect others. Reference: `Demo - Collapsible Nav Sections.html`.
    - **Single rail scrollbar** (NEW 2026-05-08): the rail has 3 zones — fixed top (rail-toggle button) + scrollable middle (`.rail-content` wrapping Home + all 5 sections) + fixed bottom (rail-foot user identity). Only ONE scrollbar appears when the middle area exceeds viewport height (6px width, `--border-strong` thumb, `--secondary` on hover). NEVER per-section scrollbars — section bodies use `max-height: 2000px` (large enough to never truncate).
    - **GOVERN section** (5th — added 2026-05-07): Agents · Integrations · Users & Roles · Settings & Audit. ANALYSE section gains **Executive Dashboard** (F25) between Run Results and Defects/Failures. Total nav items: 20.
    - **Dark/light toggle** (NEW): sun icon button in top utility bar between crosshair icon and Operate/Review/Prove mode toggle. Pattern A stub for now; real implementation post-M4.

    **Forbidden (rejection triggers at visual gate):**
    - Page-level navigation duplication (no `<header>` re-implementing top bar)
    - Missing collapse or hamburger primitives
    - Altering shell design tokens, layout, or behavior in any individual page port
    - Static text headers that duplicate project switcher info
    - Custom scrollbar overrides (must inherit SYS-17 globals)
    - Altering nav-icon chip pattern or `data-tone` color matrix
    - **Collapse toggle arrow design** — MUST be the canonical left-arrow icon from F15 v2.html. Chevrons, double-chevrons, or any other glyph variant = visual gate FAIL.
    - **Collapse functionality** — MUST be wired (click toggles 240px ↔ 64px, persists `qa-nexus.shell.rail-collapsed` to localStorage, arrow flips via `[data-rail="collapsed"] .rail-toggle .rt-icon svg{transform:scaleX(-1)}`). Static toggle button without behavior = visual gate FAIL.
    - **Nav-item menu icons** — MUST be exactly the 13 icons used in F15 v2.html (Home / Requirements / Test Plans & Cycles / Test Cases / Test Suites / Knowledge Base / Automation Studio / Data & Mocks / Runs & Sessions / Environments / Run Results / Defects / Reports). Different SVG choice for any item = visual gate FAIL. Icon size locked to 14×14 inside 24×24 colored chip.

    **Applies to:**
    - All NEW M3+ page ports (Day-13 onward)
    - Existing M1+M2 ports — **retrofit if missing** (followup (am) F08 + F09 retrofit + AdminShell nav-icon polish TASK 0.5)
    - **All future Claude Design redesign briefs** — redesign work alters page CONTENT only, NEVER the shell. The redesign brief MUST explicitly state "shell unchanged from F15 v2.html canonical." Any redesign that touches shell tokens/layout is rejected.

    **Visual gate impact (Rule 13 extension):**
    - Screenshots at 320 px MUST show the hamburger; screenshots at 1440 px MUST show the collapse toggle. Either missing → visual gate FAIL.
    - Custom scrollbar must be visible on any scrollable surface (table, drawer, content area). Default browser scrollbar visible → visual gate FAIL.
    - Nav-icon colored chip with correct `data-tone` per item — wrong color or plain icons → visual gate FAIL.
    - Top utility bar elements (project switcher pill + search + mode toggle + user pill) all visible at 1024px+ → missing any → visual gate FAIL.

    **Cross-references:** F15 v2 canonical · F14 Requirements v2 second canonical · followup `(ak)` (PreToolUse hook `enforce-app-shell.sh` — fail-fast on missing AdminShell wrap, missing collapse/hamburger primitives, OR missing nav-icon `data-tone` matrix in `apps/web/src/app/(app)/**/page.tsx` — tracked for M3 hardening) · followup `(am)` (F08 + F09 retrofit, FE+1 Fri AM TASK 5.5).

    **Policy stack:** Rule 3 (locked frames) → Rule 12 (RWD) → Rule 13 (visual gate) → **Rule 14 (shell parity + scrollbar + utility-bar canon)**. Each tightens the previous; Rule 14 is the layer that catches issues even green CI + clean RWD + perfect screenshots can miss.

    **Day-17 (2026-05-13) amendment:** AdminShell canonical reference is F19's current React implementation, NOT the F15 v2 HTML for shell internals. Lucide-react icons retained over HTML's custom inline SVG paths. F19's React DOM is the diff-probe target for all future authenticated page ports (F18, F20, F21, F22, F23, F25, F26, F28 still pending). HTML in `PM1_UI_v2/Redesign Frame by claude design/` remains canonical for NON-shell page content per Hard Rule 15.

    **Rationale:** Yogesh's Day-17 Round-4 ruling after F19 visual gate iterations. Lucide is maintained + accessible + uniform across project. Visual variance from custom HTML SVGs is acceptable.

15. **FE agents must port from the v2 HTML frames in `PM1_UI_v2/Redesign Frame by claude design/`; design changes require Yogesh approval.** Established 2026-05-08 after the full v2 redesign cycle (12 frames + canonical demo + design rules) shipped. Binding requirements:

    **Source of truth for all React ports:**
    - `PM1_UI_v2/Redesign Frame by claude design/` — the LOCKED v2 HTML reference for every authenticated page in PM1
    - Inventory (12 frames + 1 canonical demo + 5 modals): F14 v2 · F14m1/m2/m3 v2 · F15 v2 (canonical shell) · F16a/b/c v2 · F18 v2 · F18m1 v2 · F19 v2 · F20 v2 · F21 v2 · F22 v2 · `_Demo Collapsible Nav Sections.html` (binding pattern)
    - Each v2 file is the spec — tokens, layout, components, transitions, agent naming canon, collapsible nav sections, single rail scrollbar, Hard Rule 14 shell — all locked.

    **FE+1 React port requirements:**
    - Match the v2 HTML pixel-faithfully (within tolerance for React-component idioms — props, state, hooks)
    - Reuse the F15 v2 token block via the existing Tailwind theme + design tokens already wired in `apps/web`
    - Wrap every `(app)/**/page.tsx` in `AdminShell` (Hard Rule 14) — collapsible sections + single rail scrollbar inherit automatically
    - Composer ⓘ / Curator ⓘ / Sherlock ⓘ named-agent display via the `<AgentName code={...} />` component (single source of truth)
    - **Full RWD per Hard Rule 12** is mandatory — mobile-first, breakpoints 320/480/768/1024/1280/1440, no horizontal scroll at any viewport ≥320px, tap targets ≥44×44px

    **When the v2 HTML doesn't fit the data model:**
    - FE+1 STOPS implementation
    - Posts a clear note: "Frame F-XX v2 has design issue at [specific area] — [describe blocker]. Need redesign."
    - Yogesh either approves a small inline tweak OR commissions a fresh redesign from Claude Design
    - FE+1 does NOT improvise design decisions on the spot

    **When a frame doesn't exist for a needed page:**
    - FE+1 STOPS and asks Yogesh: "No v2 frame for [page-X]. Provide design or commission from Claude Design?"
    - Yogesh either provides existing reference OR triggers a Claude Design build
    - FE+1 does NOT build from imagination

    **Visual gate enforcement (Rule 13 amendment):**
    - At visual gate, screenshots are compared against the source v2 HTML side-by-side
    - Material differences in layout, color, typography, spacing, or interaction patterns = visual gate FAIL
    - "Material" defined as: anything a user could notice in 5 seconds of inspection
    - Approved deviations: minor pixel-level differences from rendering engine variance (browser font-smoothing, sub-pixel rounding) — these are acceptable

    **Forbidden:**
    - Inventing layouts that aren't in the v2 HTML
    - Substituting tokens (using a different color, font, spacing than what's in v2)
    - Skipping responsive breakpoints to "ship faster"
    - Modifying agent naming pattern (must use `<AgentName code={...} />`)
    - Renaming sections / nav items / data-tones from the canon

    **Cross-references:** Rule 12 (RWD) · Rule 13 (visual gate) · Rule 14 (shell parity) · `_DESIGN_RULES.md` (Claude Design's binding rules) · all 12 v2 frames in `PM1_UI_v2/Redesign Frame by claude design/`.

    **Policy stack:** Rule 3 (locked frames) → Rule 12 (RWD) → Rule 13 (visual gate) → Rule 14 (shell parity) → **Rule 15 (v2 HTML frames as port source-of-truth)**. Together these guarantee every React port matches the design system; each rule catches a different class of drift.

16. **Canonical-first port workflow (mandatory).** Before any frame port:
    (1) Read `PM1_UI_v2/Redesign Frame by claude design/_DESIGN_RULES.md` in full (17 rules)
    (2) Read the specific v2 HTML for the frame being ported
    (3) Open v2 HTML in Chrome as `file://`; open React port at localhost in adjacent window
    (4) Run Playwright diff-probe at multiple viewports (320 / 768 / 1024 / 1440) — capture computed styles for borders, backgrounds, typography, hover states
    (5) Build diff table BEFORE coding fixes
    (6) Fix root causes (often `globals.css` token gaps — undefined-token fallback to `currentColor` silently breaks borders)
    (7) Re-screenshot side-by-side comparison
    (8) Submit to visual gate only when diff probe shows zero unexpected drift

    Established 2026-05-13 (Day-17) after F19 Round-2/3/4 drift cycles revealed undefined-token fallbacks silently breaking M3 pages. Numbered "16" rather than "15.5" for clean numbering.

    **Cross-references:** Rule 13 (visual gate) · Rule 14 (shell parity + F19 React canonical for shell internals per Day-17 amendment) · Rule 15 (v2 HTML port source-of-truth for non-shell content) · `_DESIGN_RULES.md` 17 rules.

    **Policy stack:** Rules 3+12+13+14+15 above + **Rule 16 (canonical-first workflow)**. Together: discovery before code → diff before fix → fix before screenshot → screenshot before gate. Catches silent-drift class.

17. **Canned-data verbatim extraction (mandatory).** Before writing ANY React component code for a frame port, FE+1 must:

    (1) Run `scripts/extract-canned-data.mjs` against the canonical v2 HTML
    (2) Output: `apps/web/components/<frame>/canned-data.ts`
    (3) ALL text content in the React port MUST come from `canned-data.ts`
    (4) ANY string in a component file that doesn't trace back to the v2 HTML is a Hard Rule 17 violation → visual gate FAIL

    The HTML's example data IS the stub data. No invention permitted.

    **Rationale (Day-17/18 root cause):** F19 / F20 visual gate failures all traced to FE+1 inventing stub data (cluster titles, ticket IDs, error messages, right-rail labels) that didn't match the canonical HTML. Each invention created a "minor" drift that compounded across the screen until the diff became too large to fix in one pass. Extracting verbatim from the HTML eliminates this drift class entirely — the canonical HTML's example data IS the source of truth for stub data, no different from its tokens being the source of truth for styling.

    **Workflow:**
    - **Step 1 (mandatory first action when starting a port):** `node scripts/extract-canned-data.mjs --frame F22 --html "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html"` → writes `apps/web/components/f22-defect-detail/canned-data.ts`.
    - **Step 2:** All component files (`*.tsx`) import strings/arrays from `canned-data.ts`. NEVER hardcode user-visible text in a `.tsx` file.
    - **Step 3 (visual gate):** Reviewer greps every user-visible string in the React PR against `canned-data.ts` and against the source HTML. Any string that doesn't trace back to the HTML → visual gate FAIL.

    **Strings that DO NOT need extraction (whitelist):**
    - Form field placeholders that are pure type hints (`"example@email.com"`) — these are NOT canonical data
    - Icon-only buttons with no text label
    - `data-testid` values
    - i18n keys (we are not using i18n in M4, but the rule survives the eventual i18n migration unchanged)

    **Forbidden (Rule 17 violation triggers):**
    - Inventing project names, ticket IDs, defect IDs, user names, error messages, log timestamps, or any user-visible text not in the v2 HTML
    - "Improving" the canonical example data ("the HTML says 'Refund webhook timeout' but 'Webhook timeout on refund' reads better" → REJECTED)
    - Hardcoding a string in a `.tsx` file when an equivalent string exists in the HTML (extraction was skipped → violation)
    - Adding plausible-looking placeholder data that "feels like" Iksula returns data but isn't in the HTML

    **Cross-references:** Rule 13 (visual gate) · Rule 14 (shell parity) · Rule 15 (v2 HTML port source-of-truth) · Rule 16 (canonical-first workflow) · `scripts/extract-canned-data.mjs` (the tool) · Day-17/18 F19/F20 drift cycles (rationale).

    **Policy stack:** Rules 3+12+13+14+15+16 above + **Rule 17 (canned-data extraction)**. Together: structure + responsiveness + visual gate + shell + v2-source + canonical-first + verbatim-extraction. Each rule closes a different drift class; Rule 17 closes the stub-data-invention class specifically.

18. **All frame ports MUST execute via `.claude/skills/frame-port/` (mandatory).** Codified Day-18 PM 2026-05-14 after PR #145 was closed (NOT merged) as the first Hard Rule 17 violation precedent. The skill orchestrates a 7-step workflow (1. extract-canned-data, 2. extract-spec, 3. Yogesh approves spec, 4. scaffold TSX from spec+canned-data NOT from HTML, 5. diff-probe, 6. Rule 13 visual gate ONLY after diff-probe clean, 7. commit + PR). Skipping the skill workflow = visual gate FAIL regardless of output quality.

    **Why:** Rules 12-17 each catch a specific drift class, but they require human discipline. Rule 18 makes the workflow executable + auditable — `diff-probe.mjs` returns exit 1 if any section is missing or pixel diff >5% at any of 320/768/1024/1440, so FE+1 cannot accidentally submit a drifted port to Rule 13 review.

    **Workflow tools (all in `.claude/skills/frame-port/`):**
    - `SKILL.md` — orchestrator instructions; triggers on "port frame Fxx" / "build Fxx React port" / similar
    - `extract-spec.mjs` — Step 2 tool: HTML → spec.json (section tree + tokens + assets + canned-data key candidates). Uses jsdom.
    - `diff-probe.mjs` — Step 5 tool: Playwright + sharp diff at 320/768/1024/1440. Exit 0 = clean; Exit 1 = drift (visual gate blocked).
    - `README.md` — usage doc for FE+1's terminal.

    **Day-19 amendment (skill v2 — ARIA-primary structural probe).** Codified 2026-05-15 (Day-19 morning) after F21 practice re-port surfaced Finding A: the v1 diff-probe matched sections by class name (e.g., `.rail`, `.def-shell`), but Tailwind-based React ports use utility classes (`className="flex shrink-0 flex-col"`) per Hard Rule 5 + Tailwind convention. Result: v1 probe returned 0% section presence on every Tailwind port regardless of port quality — a structural false-positive failure mode that would have blocked every subsequent frame.

    **The binding contract clarification:** ARIA roles and aria-labels are binding across HTML ↔ React. Class tokens are NOT. The canonical contract a React port must honor is:
    1. **Every `role` attribute** in the canonical v2 HTML must appear in the React port on the equivalent element.
    2. **Every `aria-label` exemplar** in `spec.json.canned_data_keys.aria_exemplars` must appear in the React port on the equivalent region.
    3. **Class names diverge by design** — canonical uses BEM-like semantic tokens, React port uses Tailwind utilities. Neither is "more correct"; they encode the same DOM through different conventions.

    **v2 diff-probe matching strategy (OR semantics — any match = section present):**
    1. **PRIMARY — role + aria-label match.** Probe walks the React DOM for elements whose `role` + `aria-label` combination matches a `spec.json.aria_exemplar` entry. This is the right primary signal because both canonical HTML and React ports preserve ARIA — it travels with the component naturally.
    2. **SECONDARY — class-name substring match.** v1 behavior retained as a fallback. If a React port happens to use canonical class tokens (e.g., `className="def-shell flex flex-1"`), this still matches. Optional, not required.
    3. **TERTIARY — `data-canonical-section` attribute escape hatch.** Convention: React port may add `data-canonical-section="def-head"` to anchor sections without class-name pollution. Use when ARIA roles/labels aren't sufficient to disambiguate (rare).

    Section "present" = ANY of the three matches. Section "missing" = NONE of the three. This eliminates the class-only false-positive failure mode while preserving the v1 structural sanity check.

    **Forbidden (visual gate FAIL triggers added Day-19):**
    - Dropping an `aria-label` that exists in canonical v2 HTML
    - Changing a `role` attribute from canonical (e.g., `role="region"` → `role="group"`)
    - Adding `data-canonical-section` as a workaround instead of fixing missing ARIA — ARIA must be primary; the data-attribute is for true escape-hatch cases (e.g., decorative wrappers without semantic meaning)

    **spec.json schema change (Day-19):** `extract-spec.mjs` now emits a per-section `aria_signal: { role, aria_label, classes[], data_canonical_section }` block + a top-level `schemaVersion: 2`. Backward compatible — existing fields preserved. Re-run extract-spec on any frame to get the v2 spec; old spec.jsons remain valid input to v2 diff-probe but produce less precise structural matching.

    **Cross-references:** Rule 14 (AdminShell parity — uses ARIA naturally) · Rule 15 (v2 HTML port source-of-truth) · Rule 17 (canned-data verbatim) · F21 practice re-port Day-19 Finding A (the precedent) · PR #158 (skill v2 implementation).

    **Policy stack update:** Rules 3+12+13+14+15+16+17 above + Rule 18 (skill-mandatory workflow) **+ Rule 18 Day-19 amendment (ARIA-primary structural contract).** The amendment closes a specific drift class: structural false-positive on Tailwind ports. Each addition to the policy stack closes a different drift class identified through actual practice.

    **The close-and-redo precedent:** If `diff-probe.mjs` shows a section was implemented with invented data (e.g. cluster titles not in `canned-data.ts`), the PR is CLOSED, NOT patched. FE+1 returns to Step 4 with the canonical references and re-scaffolds. This rule exists because incremental patching of drift symptoms historically compounds — by the time the third "minor" patch lands, the diff vs canonical is too large to reconcile in one pass. The close-and-redo loop runs at most once per frame because Step 5 catches drift early.

    **Forbidden in Step 4:**
    - Opening the HTML in an editor and reading it to write TSX (this is what produced the #145 invention drift)
    - Inventing class names not in `spec.json.tokens_used` or `spec.json.sections[].classes`
    - Inventing strings not in `canned-data.ts`
    - "Improving" the canonical example data
    - Patching diff-probe symptoms without understanding root cause

    **Cross-references:** Rule 12 (RWD) · Rule 13 (visual gate) · Rule 14 (shell parity) · Rule 15 (v2 HTML source-of-truth) · Rule 16 (canonical-first workflow) · Rule 17 (canned-data extraction) · `.claude/skills/frame-port/SKILL.md` · PR #145 → #150 precedent · M4 v2 plan §7.5 progress log entries.

    **Policy stack:** Rules 3+12+13+14+15+16+17 above + **Rule 18 (skill-mandatory workflow)**. Together: structure + responsiveness + visual gate + shell + v2-source + canonical-first + verbatim-extraction + automated-enforcement. Rule 18 is the layer that makes the previous seven rules executable, not just aspirational. Each rule closes a different drift class; Rule 18 closes the discipline-drift class (humans forgetting to run the checks).

## Locked tech stack (PM1)

**Frontend:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 (CSS-first config) · shadcn/ui · Sonner · lucide-react · react-hook-form · Zod · Framer Motion · TanStack Query v5 · TipTap

**Backend:** single NestJS 10 service (REST + WebSocket via `@nestjs/websockets` + `ws`) · Prisma 5 · BetterAuth (Postgres adapter) · Zod (shared with FE) · `@xenova/transformers` (BAAI/bge-large-en-v1.5 in-process WASM — see ADR-003; Qwen3-Embedding-0.6B is the future target once Xenova ships an ONNX conversion) · Groq SDK · `@google/generative-ai`

**Database:** Postgres 15 + pgvector (HNSW indexes) on Neon free 0.5 GB · scale-to-zero

**Storage:** Cloudflare R2 free (presigned-URL direct upload from FE; bypasses 512 MB Render dyno)

**LLM:** Groq free API — `openai/gpt-oss-120b` primary (500 tok/s, 131K ctx, 1k RPD) · `meta-llama/llama-4-scout-17b-16e-instruct` long-context (10M tokens, preview tier) · `openai/gpt-oss-20b` fast layers (14.4k RPD) · Gemini 2.5 Flash fallback (1.5k RPD)

**Embeddings:** BAAI/bge-large-en-v1.5 in-process via `@xenova/transformers` (1024-dim, ~47ms/embed warm). Model selection: see `docs/architecture/adr-003-embedding-model.md`. Qwen3-Embedding-0.6B remains the future target once Xenova ships an ONNX conversion — env var `EMBEDDING_MODEL_ID` enables hot-swap without code change.

**Email:** Resend free tier (3,000/mo) via `resend` SDK over HTTPS API (ADR-018, supersedes ADR-008 Gmail SMTP — Render Free blocks outbound SMTP since Sept 2025)

**Hosting:** Cloudflare Pages free (FE) + Render free Hobby (API) + Neon free (DB) + UptimeRobot 5-min keep-alive on `/health`

**Observability:** OpenTelemetry SDK in NestJS · Grafana Cloud free · Better Stack free → Slack alerts

**Dev tools:** pnpm workspaces · GitHub Actions free (2k min/mo, weekly pg_dump cron) · DeepEval on Colab Free (engineering-only, never blocks prod traffic) · Playwright (internal QA)

**Total cost: $0/month** for the 8-user × 12hr/day pilot.

## Iksula data canon (use verbatim in seeds, fixtures, demo data)

**Anchor project:** Iksula Returns (key: `RET`) · Sprint 42 Day 9 of 14 · Release `R-2026-04-PaymentV2`

**Pilot team (8 users, final — no placeholders):**

| #   | Name           | Org role    | RBAC role                                      |
| --- | -------------- | ----------- | ---------------------------------------------- |
| 1   | Akshay Panchal | QA Lead     | **Lead**                                       |
| 2   | Yogesh Mohite  | Sr QA       | **Admin** (deployer-admin per Day-0 bootstrap) |
| 3   | Kishor Kadam   | QA Engineer | **QA Engineer**                                |
| 4   | Nitin Gomle    | QA Engineer | **QA Engineer**                                |
| 5   | Nadim Siddiqui | QA Engineer | **QA Engineer**                                |
| 6   | Govind Daware  | QA Engineer | **QA Engineer**                                |
| 7   | Mohanraj K.    | QA Engineer | **QA Engineer**                                |
| 8   | Sagar Todankar | QA Engineer | **QA Engineer**                                |

**Pilot operating window:** 7 days/week, 10 AM – 10 PM local time. UptimeRobot keep-alive must cover the full 12-hour daily window including weekends.

**Other Iksula projects (background context for F09 Projects List + F08b Home):** Iksula Commerce (key: `CART`, main branch), Iksula Payments (key: `PAY`, staging amber), Iksula Mobile App (key: `AUTH`, main green), Iksula Internal Ops (key: `OPS`, available).

**Sample files for upload demos:** `return_policy_v2.xlsx`, `legacy_refund_test_cases.csv`, `customer_return_flow_recording.mp4`

**ID patterns:** Jira reqs `RET-###` · uploaded reqs `REQ-###` · test cases `TC-RET-###` · defects `DEF-###` · imports `#242`

**Jira instance:** `iksula.atlassian.net` (12 projects visible)

## Hooks active (`.claude/hooks/`)

- **PreToolUse Bash:** `block-dangerous.sh` — blocks `rm -rf`, `DROP TABLE`, `--force`, etc.
- **PreToolUse Edit|Write:** `enforce-design-tokens.sh` — blocks non-whitelisted hex / Tailwind color classes / MD3 tokens in `apps/web/**/*.{ts,tsx,css}`
- **PreToolUse Edit|Write:** `enforce-pm1-stack.sh` — blocks ban-list deps in `package.json` / `pnpm-lock.yaml`; ALSO (MS0-T033) blocks major-version drift on locked deps per `.claude/locked-deps.json` (next=15, react=19, tailwindcss=4, @nestjs/\*=10, prisma=5, node>=20)
- **PostToolUse \*:** `audit-log.sh` — appends one JSONL line per tool call to `.claude/audit.jsonl`
- **UserPromptSubmit \*:** `load-binding-context.sh` — prepends a 7-line binding-context note to every Claude session

Hook wiring: `.claude/settings.json`. Permission grants: `.claude/settings.local.json` (auto-managed).

## MCP servers configured

- `github` (PAT-authenticated; MCP currently uses `yogeshcodeshare` PAT for general queries; QA Nexus repo ops go through `gh` CLI which is logged in as `yogeshmohite-iksula`)
- `sequential-thinking` · `context7` · `filesystem` (scoped to project root) · `playwright`
- `postgres` — **deferred** until MS0-T012 (Neon URL not yet provisioned)
- `context-mode` (pre-existing, plugin marketplace)

## What Claude should NOT do without Yogesh's explicit approval

- Modify any of the 41 locked HTML frames
- Add any paid component (even $5/mo)
- Install anything on the ban list
- Add Material Design 3 tokens, tertiary colors, or extend `tailwind.config.ts`
- Commit secrets to the repo
- Push to GitHub `main` without confirming repo name + visibility (NOTE: repo `https://github.com/yogeshmohite-iksula/QA-Nexus.git` is already created, private; `git remote add origin ...` then push — do NOT `gh repo create`)
- Activate `Tech-project-forge-skill` until Step C completes (skill install + Claude Code restart) AND Yogesh re-issues the trigger phrase "Set up my project from PRD and ERD"

## Communication preferences (kickoff §5)

- Concise and concrete. File paths, line numbers, exact commands.
- Surface inconsistencies and risks early.
- Cite sources (cite §X of PM1_PRD or PM1_ERD when basing decisions on them).
- No "let me think out loud" detours. Decide, act, summarize.
- Run the relevant validation gate after each task, report result before moving on.
- **End-of-day status at 17:00 IST:** 5 sections per kickoff §5 (completed today, in flight, blockers, tomorrow, free-tier quota usage). **Canonical location: `docs/eod-reports/YYYY-MM-DD-day-N.md`** (filename convention + template in `docs/eod-reports/README.md`, established 2026-04-27 per audit P1.10). Commit + push every EOD as `docs(eod): post Day N EOD report`.

## Token discipline (Day-11 — codified after M1 retro)

Context Mode plugin (`mcp__plugin_context-mode_context-mode__*`) is the primary token-saver in PM1. M1 retro showed it was used 2× when ~5+ opportunities existed — single biggest leak in M1. These rules are binding for all future work:

1. **Bash output > 20 lines → use `ctx_execute` or `ctx_execute_file`**, not Bash. Raw output floods context; ctx-tools keep raw data in the sandbox and return only the summary.
2. **Multiple related Bash calls (gh, git, jest, pnpm, find) → use `ctx_batch_execute`** in a single round-trip. One call replaces 30+ individual tool invocations.
3. **Web fetches → use `ctx_fetch_and_index`, never `WebFetch`**. WebFetch dumps the whole page into context; ctx_fetch indexes it for later FTS5 search.
4. **Reading a file just to grep → use `ctx_index` then `ctx_search`**. Don't `Read` a 500-line file to find one symbol.
5. **`Read` tool stays for files you'll Edit** (small, targeted, where Edit needs the surrounding context). This is the only legitimate use after Day-11.

Soft-nudge hook `.claude/hooks/post-tool-use/nudge-context-mode.sh` prints to stderr when a Bash call exceeds 20 lines AND matches `gh`/`git`/`jest`/`pnpm`/`find`. The nudge does NOT block; the next session is expected to use the alternative.

Reference: `docs/audits/2026-05-06-skill-alignment-audit-day-11.md` §4, `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` §7.

## Compact instructions

When compacting this conversation, preserve: PM1 binding spec versions, the 8-user roster, locked stack details, hook config, current step state in M0 backlog, any acceptance gate that has already passed. Discard: exploration output, raw `claude mcp list` output (already indexed in audit.jsonl), verbose logs.
