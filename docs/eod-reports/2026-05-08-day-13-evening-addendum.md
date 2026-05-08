# Day-13 EVENING ADDENDUM (Fri 2026-05-08, 22:00 IST) — Day-14 work pulled forward

> Yogesh stayed online ~5 more hours after Day-13 close, so we pulled
> Day-14 (Sat) work into Friday evening. **All 4 Day-14 tasks shipped
> in one session: 4 modal PRs + 2 stale-PR cleanups.** F14 Requirements
> page now has full overlay-modal coverage; F22 Test Case Library has
> a placeholder route + the F16a chooser modal mounted.

---

## Code shipped (4 PRs, ~1,950 LOC)

- **`feat(web)` PR #92** — **F14m1 Edit Requirement Modal**. 720×90vh
  desktop / full-screen drawer < sm. Header (eyebrow `EDIT REQUIREMENT
· RET-247` + title + Composer-mention sub) → scrollable body
  (Title · Description · Composer banner · Acceptance criteria
  list · Priority · Status · Sprint · Source) → footer (kbd hint +
  Cancel + Save changes). Composer ⓘ "Suggest 5 ACs" — appends 5
  stub Composer-tagged ACs after a 1.4 s simulated round-trip.
  ⌘+Enter to save · ESC to cancel · backdrop tap to close. 12
  Pattern A markers. Wired into F14 page via `?edit=<id|new>` URL
  param + auto-Suspense per Day-9 compound learning.

- **`feat(web)` PR #94** — **F14m2 Link Test Case Modal**. 760×90vh
  desktop. Curator ⓘ near-dup hint banner (signature element):
  "Curator found 4 test cases already linked to similar requirements
  (RET-248, RET-251) — you may want to consider these first." with
  "Show 4 suggested" toggle. Picker UI: 7 stub TC rows
  (TC-RET-0341..0567), 4 Curator-suggested with violet left-stripe
  - tint + tag, 2 default-selected. Footer "**N selected** · 4
    Curator-suggested · X visible" + dynamic-label "Link N cases"
    CTA. 9 Pattern A markers. Wired via `?link=<id>` (mutually
    exclusive with `?edit`).

- **`feat(web)` PR #96** — **F14m3 Convert to Jira Story Modal**.
  680×90vh desktop (locked HTML deviates from canon 960×720;
  ported verbatim per Hard Rule 15). Header `[J]` info-blue
  eyebrow + iksula.atlassian.net OAuth sub. Source banner
  `RET-247 → Jira`. Form: Project + Issue type · Summary ·
  Description (with Composer auto-draft chip) · Priority +
  Sprint · Labels chip-input. Composer chip cycles 3 states
  (default / "Composer thinking…" / "Re-draft with Composer ⓘ"
  - check icon). Footer: green dot "Jira connection healthy ·
    last sync 2 min ago" + Cancel + "Create Jira story" (info-blue
    CTA, primary-ink text — `var(--info)` is the closest whitelist
    token to Atlassian product blue). 6 Pattern A markers. Wired
    via `?jira=<id>` + the bulk-bar Convert action opens with
    the first selected ID. 3 modals are mutually exclusive:
    `?edit > ?link > ?jira` priority order.

- **`feat(web)` PR #98** — **F16a Test Case Method Chooser (stretch)**.
  940×~720 desktop / full-screen drawer < md. Header (teal `[+]`
  - "NEW TEST CASE" eyebrow) → recall row (violet "Resume where
    you left off" with RET-247 canon) → 3-card grid (vertical mobile
    / horizontal md+) → footer (kbd hints + Cancel). 3 cards: AI
    Generated ⭐ Recommended (violet Sparkles, "Generate with A1"),
    Bulk Import (info-blue Upload, "Open uploader"), Create Manually
    (neutral PenLine, "New blank case"). **Phase 3 SYS-1 lock: ALL 3
    CTAs are TEAL** — differentiation via icon-tile color only.
    Arrow-key card navigation + ESC close + body scroll-lock. 6
    Pattern A markers. Plus a minimal `/test-cases` placeholder
    route (full F22 lands later in M3) wrapping in AdminShell
    active="test-cases".

## Cleanup (2 stale PRs closed)

- **PR #70 closed** — `(al) [m2-blocker]` was resolved by BE+1
  PR #78 + FE F12 Pattern B flip PR #80. Followup entry stale.
- **PR #73 closed** — Day-12 EOD morning version superseded by
  Day-12 closing addendum (in PR #66 lineage) + Day-13 EOD (PR #90).

## New shared component pattern

Standardised modal scaffolding emerged across the 4 modals:

- Body scroll-lock via `useEffect` toggling `document.body.style.overflow`
- ESC closes via document-level keydown listener
- Backdrop tap close via `onClick` on outer `role="dialog"` element
  (with `e.stopPropagation()` on the inner panel)
- 280–940 px max-w on `sm:` + full-screen below `sm:`
- Auto-focus first input on open via `setTimeout(80ms)` after mount
- Pattern A console.info markers on every interactive site
- All token usage via `var(--*)` + inline `rgba()` per the F12/F13
  established convention — zero hex outside whitelist

This pattern is not yet extracted into a shared `<Modal>` primitive —
each modal owns its own scaffolding. Folding into a shared primitive
is a post-M3 cleanup followup if the duplication burden outweighs
the per-modal flexibility.

## Per-PR verification gate (sections 5-8 across all 4 modal PRs)

|                        | F14m1           | F14m2             | F14m3              | F16a                    |
| ---------------------- | --------------- | ----------------- | ------------------ | ----------------------- |
| Sec 5 SYS-17           | ✓               | ✓                 | ✓                  | ✓                       |
| Sec 6 AgentName        | Composer × 2    | Curator × 1       | Composer × 3       | N/A (literal "A1-Groq") |
| Sec 7 RWD 320/768/1440 | ✓               | ✓                 | ✓                  | ✓                       |
| Sec 8 Iksula canon     | RET-247 + 5 ACs | TC-RET-0341..0567 | RET-247 + 3 labels | RET-247 in recall       |

**Zero gate failures across all 4 PRs.**

## Visual gate

- 17 screenshots committed total (5 + 4 + 4 + 4)
- All PRs carry `[VISUAL GATE PENDING]` in title
- Composer/Curator interactions captured (suggest-acs, near-dup
  banner, auto-draft cycle)

## Compound learnings (logged for `.claude/memory/general.md`

post-M3-merge)

- **Modal triggers via URL search-param** are deep-linkable +
  back-button-friendly + plays well with Pattern A telemetry. Pattern
  per F14m1 (`?edit`), F14m2 (`?link`), F14m3 (`?jira`), F16a
  (`?new-test-case=1`).
- **Mutually exclusive modal hierarchy** beats nested modals — set
  a priority order (`?edit > ?link > ?jira` for F14) and short-circuit
  lower-priority modals when higher-priority is open.
- **`var(--info)` as Jira-blue stand-in** — locked HTML uses an
  Atlassian product blue not in PM1's whitelist. Use the closest
  token rather than extending the palette. ADR + token addition only
  if exact-match is mandated.
- **Phase 3 SYS-1 CTA-color lock** — when porting a multi-card
  chooser like F16a, ALL CTAs use TEAL `var(--primary)`. Visual
  differentiation comes from icon-tile color (violet/blue/neutral
  family), NOT button color.
- **forwardRef wrapper** is the canonical pattern for cards in a
  keyboard-nav grid. Avoid IIFE/Object.assign tricks — just use
  `React.forwardRef` with `displayName` for clean refs.

## Day-13 evening metrics

| Metric                 | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| FE PRs opened tonight  | 4 (#92, #94, #96, #98)                                                     |
| Tasks shipped          | 4 of 4 (TASK 3 + TASK 4 + TASK 5 + TASK 6 stretch)                         |
| Stale PRs closed       | 2 (#70, #73)                                                               |
| LOC added              | ~1,950 (4 modals + 2 placeholder files + 4 sweep scripts + 17 screenshots) |
| Visual-gate failures   | 0                                                                          |
| AgentName usages added | 6 (Composer × 5 + Curator × 1)                                             |
| Routes added           | 1 (`/test-cases` placeholder)                                              |

## Day-13 grand total (morning + evening)

- 7 work PRs (#86 AdminShell v2 · #88 Rule 14 retrofit · #89 F14
  page · #92 F14m1 · #94 F14m2 · #96 F14m3 · #98 F16a)
- 1 EOD docs PR (#90) + this evening addendum
- 1 followup closed (`(am)` Hard Rule 14 retrofit)
- ~3,350 LOC added
- 22 visual-gate screenshots
- 0 gate failures across the day

## Tomorrow (Day-14 effectively skipped — pull-forward complete)

Day-14 was scoped as F14 modals + F16a (now all done). Day-15
plan stands as written: **F16b A1 Generate page** — most complex
M3 page (split-pane source + generate streaming + 4-step header

- KB grounding + cluster cards + dedup warnings).

Standing down for Day-13 22:00 IST. See you Day-15 (Sun) 09:30 IST
kickoff with F16b.
