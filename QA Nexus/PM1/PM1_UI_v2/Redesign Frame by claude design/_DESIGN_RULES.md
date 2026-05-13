# PM1_UI_v2 · Design Rules (read FIRST before any frame work)

These are the binding rules that govern every frame in `Redesign Frame by claude design/`.
Locked in after the F15 v2 → F16b v2 audit (May 2026). **Do not deviate.**

---

## Reference order (read these every time, in this order)

1. **`uploads/01_SYSTEM.md`** — the only source of color tokens, type, geometry, semantic states. **Never invent colors or fonts.**
2. **`uploads/PROJECT_UI_DESIGN_TOKENS.json`** — token JSON mirror.
3. **`Redesign Frame by claude design/F15 Knowledge Base v2.html`** — **canonical shell reference**. Topbar markup, rail markup, scrollbar, rail-collapse JS, persistence keys all live here. Copy verbatim.
4. **`Redesign Frame by claude design/primitives-playground.html`** — primitive components (chips, cards, scrollbars `SB-1`, etc.).
5. **`uploads/CLAUDE_DESIGN_HTML_REVIEW.md`** — review/audit conventions.
6. The relevant phase doc: `02_ENTRY_AND_HOME.md`, `03_SOURCE_AND_DOCS.md`, `04_TEST_LIFECYCLE.md`, `05_ANALYSE_AND_GOVERN.md`.

---

## Hard Rules (non-negotiable)

### Rule 1 · Tokens only from 01_SYSTEM.md
No invented hex codes. Soft tints `--*-soft` / `--*-line` are alpha overlays of approved hexes — they are not new colors.

### Rule 2 · Font stack is fixed
- **DM Sans** — display only (page titles, brand)
- **Inter** — UI text
- **JetBrains Mono** — IDs, codes, counts, kbd, meta lines

### Rule 3 · Mobile-first; breakpoints 480 / 768 / 1024 / 1440
Min hit target `--tap: 44px`. Topbar height `--topbar-h: 56px`. Rail width `--rail-w: 240px` expanded, `64px` collapsed.

### Rule 4 · Scrollbar SYS-17 verbatim
The `::-webkit-scrollbar` block from F15 v2 is the project standard. Never override with browser default. Track transparent, thumb `--border-strong`, hover `--secondary`, 8px desktop / 6px coarse pointer.

### Rule 5 · Custom focus ring
`:focus-visible { outline: 2px solid var(--secondary); outline-offset: 2px; border-radius: 4px; }`

---

## Rule 14 · Shell parity (the critical one)

**Every frame uses the F15 v2 shell verbatim.** Topbar + rail + scrollbar + collapse JS are NOT redesigned per frame. Only the `<main>` content changes between frames.

Required elements in the topbar (in order):
1. `.menu-btn` (mobile hamburger)
2. `.brand` (mark + word)
3. `.proj-pill` (project picker, hidden <768px)
4. `.global-search` (⌘K)
5. `.icon-btn` quick-create (`+`)
6. `.icon-btn` notifications (with `.pip`)
7. `.icon-btn` theme
8. `.mode-toggle` (Operate / Review / Prove, ≥1024px)
9. `.user-pill` (avatar + name)

Required rail structure:
- `.rail-toggle` (collapse handle, Linear/Notion pattern)
- `Home` nav item
- `PLAN` section: Requirements, Test Plans & Cycles, Test Cases
- `AUTHOR` section: Test Suites, Knowledge Base, Automation Studio (`.disabled` v1.5), Data & Mocks (`.disabled` v1.5)
- `RUN` section: Runs & Sessions, Environments
- `ANALYSE` section: Run Results, Defects / Failures, Reports
- `.rail-foot` (avatar + "Yogesh Mohite · Sr QA · Admin" + chevron)

Each `.nav-item` carries `data-tone="..."` (home/primary/secondary/info/warn/pass/fail) for its colored icon chip and `data-label="..."` for the collapsed-state tooltip.

The `data-rail="collapsed"` state is on the `.app` (or `.body`) wrapper. Persistence: `localStorage.setItem('<frame>.rail', state)` with a frame-namespaced key (e.g. `f15.rail`, `f16b.rail`) so per-frame previews don't cross-contaminate.

Active state: only ONE `.nav-item.active` per frame, matching the section the frame belongs to.

### When something must be on a frame but doesn't fit a topbar/rail slot
Put it in `<main>` — breadcrumbs, page-level filters, page-level tabs all live in main, never in the topbar. (F16b lesson: the breadcrumb belongs above the stepper, not in the topbar.)

---

## Rule 15 · Agent naming in UI text

The PRD uses internal codes `A1`, `A2` for the two agents. **In user-facing UI text, those become product names:**
- `A1` → **Composer** (drafts test cases)
- `A2` → **Curator** (dedup, similarity, governance)

Render them with the `.agent-name` pill: monospace name + small `ⓘ` info-mark. Internal IDs (`A1-Groq` provider id, `agent_run.id`) stay as-is — they're system identifiers, not labels.

The smaller `.agent-tag` chip (no info-mark) is for inline attribution inside other chips/rows, e.g. "Curator · Sim 87%".

---

## Rule 16 · Versioning workflow

When a frame is materially rebuilt:
1. Don't overwrite. Copy `F##.html` → `F## v2.html` (or vNN).
2. Keep the older file in place — review uses both for diff.
3. Register the new version with `asset:` so it shows up in the review pane.
4. Mention the rebuild reason in the file's top comment.

---

## Rule 17 · Variant-class namespacing

**Never reuse a top-level shell or layout class name as a variant modifier on nested elements.**

The shell uses bare names: `.app`, `.main`, `.rail`, `.topbar`, `.nav-item`, `.run-shell`, `.def-shell`, `.def-body`, `.list-pane`, `.center-pane`. Any of these as a single class on a span/div will silently inherit the shell's geometry rules — most catastrophically `.app{min-height:100vh}`, which forces a 22px pill to 1024px and explodes the parent row.

Caught and fixed:
- F20 Cluster 1 — `.cl-class.app` → renamed `.cl-class.appbug` (May 2026).
- F21 defect rows — `.type-pill.app` → renamed `.type-pill.appbug` (May 2026).

**Rule:** when categorising a defect/cluster/row by type, NEVER use a bare modifier `.app`. Use `.appbug`, `.app-bug`, or scope under a parent (`.dfrow[data-type="app"]`). Same for any other shell name. Audit new variant classes against this list before shipping:

  app · main · rail · topbar · nav-item · sidebar · header · footer · canvas · base · overlay · raised

---

## Common page patterns (for reference)

- **Stepper bar** (F16b): 64px high, sits directly under breadcrumb, separators between steps via `::before` pseudo-element on `.step + .step`.
- **3-col workspace** (F16b): `340px 1fr 340px` desktop, `300px 1fr` at 1279px, single-column at 1023px. Right pane is closable; left pane is not.
- **AI surfaces** use `--ai-soft` / `--ai-line` borders (purple), 12–14px radius. Streaming cards have a left-edge animated gradient bar (`@keyframes streamPulse`).
- **Confidence chips** use semantic colors: `conf-high` = pass, `conf-med` = warn. **Similarity chips invert** (`sim-high` = fail because high similarity = likely dup).
- **Label chips** show `LABEL · VALUE · tier` (e.g. "Conf · 92% · high") — never bare numbers.
- All `prefers-reduced-motion: reduce` paths are required for any animation.

---

## Don'ts

- ❌ No emoji as functional UI (only as content if the brand uses them — this brand doesn't).
- ❌ No new gradient backgrounds beyond the brand mark / accent strips.
- ❌ No SVG illustrations / hero art — placeholders only; ask the user for real assets.
- ❌ No "A1"/"A2" as visible text. Always Composer / Curator.
- ❌ Don't put breadcrumbs, page tabs, or page filters in the topbar.
- ❌ Don't redesign the shell per frame.
