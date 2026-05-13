# F19 Run Console — discovery manifest

**Source:** `PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html` (1066 LOC, 77 KB) — locked canonical per Hard Rule 15.

**Author:** FE+1 (Claude Code) · **Date:** 2026-05-13 (Day-17) · **Purpose:** Pre-flight discovery for the F19 Pattern A scaffold port per Day-15 retro lesson 3 (read v2 HTML structurally before code).

---

## Top-level layout

Confirmed from v2 HTML comment markers (L554–L968):

| Block            | v2 HTML lines | Notes                                                               |
| ---------------- | ------------- | ------------------------------------------------------------------- |
| TOP BAR          | L554          | Handled by AdminShell (Hard Rule 14)                                |
| LEFT RAIL        | L578          | Handled by AdminShell                                               |
| Run metadata bar | L638–L657     | Inside MAIN — title + chips + LIVE pill + Pause/Stop                |
| Run meter        | L658–L668     | 5-segment progress bar                                              |
| 3-pane body      | L670–L965     | Pane 1 (case list) / Pane 2 (current case) / Pane 3 (evidence rail) |

**Brief said "4-zone".** Resolved (Yogesh, 2026-05-13): v2 HTML wins per Hard Rule 15 — actual layout is metadata bar + meter + 3-pane body, NOT a 4-zone framing.

---

## Design tokens used (from `:root` declarations)

- Colors: `--canvas`, `--base`, `--raised`, `--overlay`, `--border`, `--border-strong`
- Text: `--t1` / `--t2` / `--t3` / `--t4`
- Brand: `--primary` (teal 2DD4BF) + `--primary-ink` + `--secondary` (violet A78BFA) + `--secondary-ink` + `--ai-accent` (C4B5FD)
- States: `--pass` (34D399) · `--fail` (F87171) · `--warn` (FBBF24) · `--info` (60A5FA)
- Soft/line variants for each state: `--*-soft` (alpha 0.10–0.14) + `--*-line` (alpha 0.28–0.34)
- Layout: `--rail-w: 240px` · `--topbar-h: 56px` · `--tap: 44px` · `--r-sm: 6px` · `--r-md: 8px` · `--r-lg: 12px` · `--r-ai: 14px`

All tokens already in globals.css (inherited from M3 work). No additions needed.

---

## Keyframes

- `@keyframes pulse` — `0%,100% { opacity:0.45; transform:scale(0.85) } 50% { opacity:1; transform:scale(1.15) }`
- `@keyframes shimmer` — `0% { transform:translateX(-100%) } 100% { transform:translateX(100%) }`

Pulse duration varies by element (NOT a single value):

- `live-pill .ld` → **1.4s** ease-in-out (the run-meta LIVE pill — matches brief's spec)
- `live-tag .ld` → 1s ease-in-out (inside step-meta when step is executing)
- `live-cap-pill .ld` → 1.2s ease-in-out (evidence rail "Live capture" pill)
- `cr-status.running` → 1.2s ease-in-out (active case row pill)
- `capture-row.streaming .cap-icon` → 1.2s ease-in-out

Honor `@media (prefers-reduced-motion: reduce)` — disable animations.

---

## Media queries (8 breakpoints)

- `(min-width:1440px)` — desktop XL (canvas spec primary)
- `(min-width:1024px)` — desktop, full 3-pane horizontal layout
- `(max-width:1023px)` — tablet/mobile, 3-pane stacks
- `(min-width:768px)` — md, run-meta gets nowrap + 20px padding
- `(max-width:767px)` — sm, full mobile collapse
- `(max-width:639px)` — XS phones
- `(hover:none) and (pointer:coarse)` — touch tap targets
- `(prefers-reduced-motion: reduce)` — disable pulse + shimmer

---

## Pane 1 — Case List

**DOM:**

```
.case-list
  .cl-head
    .cl-title-row → h2 "Cases in run" + .cl-counts (142·18·6·1 pass/fail/flaky/run)
    .cl-search → search input
  .cl-rows
    .case-row[.pass|.fail|.flaky|.queued|.active aria-current="true"]
      .cr-status[.pass|.fail|.flaky|.running] → icon svg (check / X / play / etc.)
      .cr-body → .cr-id ("TC-RET-0339 · 139/218") + .cr-title (case title, may contain .mono inline code)
```

**Pattern A stub:** 12 rows total to match brief — mixed states `done(pass)/done(fail)/active/queued/queued/...`. Active row at index 5 (one row currently running, rest queued or done).

---

## Pane 2 — Current Case

**DOM:**

```
.case-panel
  .cp-head
    .cp-eyebrow → "Now running" + .cp-seq "145 of 218"
    .cp-title.display → case title
    .cp-id-row → .cp-id + .cp-tag (Returns Core) + .cp-tag.dim (P1 · BDD) + .agent-pill (Composer w/ info-dot + v2.3) + .cp-tag.dim (Owner · Priya S.)
  .cp-body
    .curator-hint role="note" → "Curator flagged this similar to TC-RET-0211"
    .steps section
      .steps-head → "Steps" + .stp "3 of 5 · BDD format"
      .step[.done|.current|.queued]
        .step-num → check svg (done) OR number (current/queued)
        .step-text → .kw "Given/When/And/Then" + clause (may contain .mono)
        .step-meta → "Completed in X.Xs" OR .live-tag "Executing · X.Xs elapsed"
    .actions role="group" aria-label="Step result"
      .act-btn.act-pass → check icon + "Pass" + .kbd "P"
      .act-btn.act-fail → X icon + "Fail" + .kbd "F"
      .act-btn.act-block → circle-with-slash icon + "Block" + .kbd "B"
      .act-btn.act-skip → next icon + "Skip" + .kbd "S"
    .notes
      .notes-head → .notes-label "Execution notes" + .notes-tools (Attach evidence + Voice memo buttons)
      .notes-textarea → placeholder "Capture what happened — auto-saves on Pass/Fail. On Fail, Sherlock will pull this into 5-layer RCA."
```

**Pattern A stub steps:** 5 BDD steps mixing `done` (2) + `current` (1) + `queued` (2) — matches v2 HTML exactly. Brief said "12 steps" but v2 HTML uses 5. v2 wins.

**Curator hint:** Pattern A stub — clickable badge that fires `console.info('pattern-a:deferred:f19:curator-dedup', { caseId })`.

---

## Pane 3 — Evidence rail

**DOM:**

```
aside.evidence-rail
  header.ev-head → h3 "Evidence" + .live-cap-pill "Live capture"
  nav.ev-tabs role="tablist"
    button.ev-tab.on role="tab" aria-selected="true" → "Last failure" + .n "1"
    button.ev-tab → "Screenshots" + .n "3"
    button.ev-tab → "Console"
    button.ev-tab → "Network"
    button.ev-tab → "DOM"
  .ev-body
    article.ev-fail-card
      .ev-fail-head → .ev-fail-meta (.ev-fail-id "TC-RET-0342 · Failed" + .ev-fail-title "Refund webhook · refund.retry.exhausted") + .ev-fail-time "2m ago"
      .capture-stream → 4 .capture-row entries (3 done + 1 streaming)
        .cap-icon (check svg OR pulse-ring for streaming) + .cap-label + .cap-time
      .preview-row Screenshots → .preview-grid → 2 .preview-tile cards (shot1, shot2)
      .preview-row Console (last 3 lines) → .console-snippet with .dim timestamp + .key tokens + .err errors
      .preview-row Environment → .env-stack → 4 .env-chip (Firefox 124, macOS 14.6, staging-iksula, build #4218)
    article.sherlock-card
      .sb-head → .sb-name "Sherlock" + info-dot + .sb-handle "A4 · v1.4" + .sb-conf "87%"
      .sb-layers → 5 .sb-layer-row (Stack 90% / Env 80% / Config 60% / Code 50% / Data 40%)
      button.ev-cta → "Open full RCA" (Pattern A: console.info marker)
  footer.ev-kbd → keyboard hints (P/F/B/S/N + ⌘J)
```

**Pattern A stubs:**

- Tabs render but only "Last failure" is wired (others fire `console.info('pattern-a:deferred:f19:tab-change', { tab })`)
- "Open full RCA →" CTA fires `console.info('pattern-a:deferred:f19:sherlock')`
- Capture stream 4th row uses `streaming` state with pulse animation on cap-icon

---

## Pattern A markers (deferred to Day-18+)

| Marker                                                                                   | Will wire on Day-18                              |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `pattern-a:deferred:f19:websocket` (fires on mount)                                      | WS subscribe to `/runs/:runId` topic via Gateway |
| `pattern-a:deferred:f19:case-row-click`                                                  | Switch active case in WS subscription            |
| `pattern-a:deferred:f19:action-pass` / `:action-fail` / `:action-block` / `:action-skip` | POST step result to BE                           |
| `pattern-a:deferred:f19:pause-run` / `:stop-run`                                         | POST run control                                 |
| `pattern-a:deferred:f19:tab-change`                                                      | Tab state local; BE not involved                 |
| `pattern-a:deferred:f19:sherlock`                                                        | Navigate to full Sherlock RCA page               |
| `pattern-a:deferred:f19:curator-dedup`                                                   | Navigate to F14m2 Curator dedup view             |
| `pattern-a:deferred:f19:attach-evidence` / `:voice-memo`                                 | Upload to R2 + attach to run-step row            |
| `pattern-a:deferred:f19:notes-save`                                                      | Auto-save on blur or on Pass/Fail click          |

---

## Hard Rule alignment

- **Hard Rule 12 (RWD):** v2 HTML media queries cover 320/768/1024/1440 — 3-pane collapses to vertical stack ≤1023px, evidence tabs become horizontal scroll
- **Hard Rule 13 (visual gate):** screenshots at 320 + 1440 BEFORE commit, post to Yogesh, wait for "looks good, commit"
- **Hard Rule 14 (AdminShell):** route is `apps/web/app/(app)/projects/[slug]/runs/[runId]/page.tsx` — must wrap in AdminShell with `active="runs"` (or closest existing nav-icon code)
- **Hard Rule 15 (v2 HTML canonical):** all layout, tokens, copy, keyframe timings come from v2 HTML — NOT brief framing

---

## Iksula canon present in v2 HTML

- Run title: `Refund Flow — Sprint 42`
- Run ID: `RUN-RET-2026-04-25-002`
- Env: `staging` · Sprint: `Sprint 42` · Runner: `manual · Yogesh`
- Case IDs: `TC-RET-0339`..`TC-RET-0349` + `TC-RET-0247` (active)
- Active case: "Process refund with split tender — gift card + credit card remainder"
- Curator dedup target: `TC-RET-0211`
- Failed case: `TC-RET-0342` ("Refund webhook · refund.retry.exhausted")
- Order: `#ORD-8841` · Refund ref: `RFD-2645`
- Sherlock: `A4 · v1.4` · 87% confidence
- Env chips: Firefox 124 / macOS 14.6 / staging-iksula / build #4218

All preserved in Pattern A canned data.

---

## Files this discovery informs

- `apps/web/app/(app)/projects/[slug]/runs/[runId]/page.tsx` — route shell + AdminShell wrap
- `apps/web/components/runs/run-console-page.tsx` — assembles metadata bar + meter + 3-pane body
- `apps/web/components/runs/run-metadata-bar.tsx` — top bar + LIVE pill + Pause/Stop buttons
- `apps/web/components/runs/run-meter.tsx` — 5-segment progress bar
- `apps/web/components/runs/case-list-pane.tsx` — Pane 1
- `apps/web/components/runs/current-case-pane.tsx` — Pane 2 (Curator hint + Steps + Actions + Notes)
- `apps/web/components/runs/evidence-rail-pane.tsx` — Pane 3 (tabbed evidence + Sherlock)
- `apps/web/components/runs/canned-data.ts` — types + Pattern A fixtures
- `apps/web/app/globals.css` — append `@keyframes pulse` if not already named-collision-safe

ETA: ~3.5 hr to PR (per brief).
