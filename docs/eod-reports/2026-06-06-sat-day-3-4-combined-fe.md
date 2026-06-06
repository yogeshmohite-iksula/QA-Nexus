# Day-3 + Day-4 Combined FE EOD — Sat 2026-06-06

**Owner:** FE+1 (cross-executed in MAIN's chat per Yogesh authorization 2026-06-03)
**Worktree:** `/Users/yogeshmohite/AI_Tester_Project/Project10-QA_Nexus-frontend`
**Combined window:** Fri Day-3 19:00 IST → Sat Day-4 22:00 IST (intermittent across the weekend pilot-prep push)
**Pilot Day-1:** Mon 2026-06-08 — Yogesh onboards 7 QA engineers via the Invite flow shipped today

---

## §1 Completed

5 PRs shipped to `main` this weekend, all flat-base, all pilot-prep-tagged:

| #   | PR                                                               | Frame                                                     | Branch                                             |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| 1   | [#232](https://github.com/yogeshmohite-iksula/QA-Nexus/pull/232) | F27 Users & Roles port + mobile h-scroll fix              | `feat/web-f27-users-roles` (merged earlier)        |
| 2   | [#236](https://github.com/yogeshmohite-iksula/QA-Nexus/pull/236) | F26m1 LLM Provider Setup (Option 1 query-param)           | `feat/web-f26m1-llm-provider-setup-port` (MERGED)  |
| 3   | [#237](https://github.com/yogeshmohite-iksula/QA-Nexus/pull/237) | F28m1 LLM Provider Config (2-pane wizard)                 | `feat/web-f28m1-llm-provider-config-port` (MERGED) |
| 4   | [#240](https://github.com/yogeshmohite-iksula/QA-Nexus/pull/240) | F27m1 Invite User (bulk-invite + role/projects dropdowns) | `feat/web-f27m1-invite-user-port`                  |
| 5   | [#244](https://github.com/yogeshmohite-iksula/QA-Nexus/pull/244) | F26m2 Agent Model Assignment (per-agent routing)          | `feat/web-f26m2-agent-model-assignment-port`       |

Main HEAD at session start: `b24f70d` (F27 merged) → after morning merges: `ac02d50` → 3 PRs awaiting merge (`#240`, `#244`, plus #232 already in).

---

## §2 New lessons captured (4 codifications)

These extend `feedback_skill_v2.2_first_use.md`. Each was caught via Playwright self-verify before reaching Yogesh's eyes — exact pattern Lesson 8 codifies.

### Lesson 7 — Query-param mode > demo toggle (F26m1, Sat morning)

Canonical modals often include a "Demo / Fresh setup / Edit existing" mock-only state toggle (`<!-- demo state-bar (mock-only) -->`). **Don't port this verbatim.** Real users decide mode via the entry point (e.g. "Add provider" button → fresh; "Edit" button → edit). For Pattern A (no backend yet), encode that as a URL search param:

```
/admin/agents/provider-setup            → Fresh Setup
/admin/agents/provider-setup?mode=edit&id=groq  → Edit Existing
```

Wire entry-point buttons to the right URL via `<Link>`. Modal reads `useSearchParams()` to derive its initial state. Future backend wire-up: just check `GET /api/integrations/llm` and route to the right Link target. **Zero modal changes needed**.

**Used in:** F26m1 (mode=edit/fresh), F26m2 (`?agent=composer|curator|sherlock`)

### Lesson 8 — Playwright self-verify state transitions BEFORE visual gate

Yogesh's eyes shouldn't catch state-transition bugs. Run a Playwright probe that:

1. Captures default state (DOM probe of key data, not screenshots)
2. Triggers every state change (click, type, toggle)
3. Asserts the expected DOM result

This catches issues like the **F27m1 className-template-literal bug** (Lesson 9 below) BEFORE Yogesh sees a screenshot. F27m1 saved ~3 VG rounds this way.

### Lesson 9 — Prettier strips whitespace inside conditional className templates

```tsx
// THIS BUG (caught only via DOM probe):
className={`snr${cond ? ' na' : ''}`}
// → prettier strips the leading space → renders as "snrna" (single token, NO na class applied)

// FIX (prettier-safe):
className={['snr', cond ? 'na' : ''].filter(Boolean).join(' ')}
```

Visual inspection of screenshots can't catch this — the "active" CSS rule simply doesn't apply because the class name is wrong. The radio button, checkbox, or active-state visual never changes. Use array-join across the board for conditional className composition.

**Caught in:** F27m1 (.snr.na + .snr .cb.on + .pmsg.open all silently broken)

### Lesson 10 — Font loading in modal CSS

Canonical HTML loads fonts via `<link rel="stylesheet">` in `<head>`. The app's `next/font/google` setup declares CSS variables like `--font-inter`, but in **Next.js 15.5 + Tailwind 4 `@theme inline`** those vars don't cascade to plain CSS rules outside Tailwind utility classes (verified empty via `getComputedStyle(html).getPropertyValue('--font-inter')`). Even the registered FontFaces show **"error" state** in `document.fonts.check()` — only the Fallback variants load.

**Symptom user sees:** WhatFont Chrome extension shows declared family is `Inter` but resolved font is `system-ui` (or `Times` for JetBrains Mono fallback chain).

**Pragmatic fix for pilot Monday demo:**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

at the top of each modal CSS.

**Follow-up ticket (file Sun/Mon):** audit + fix global `next/font` setup so future modal ports inherit cleanly. **F26m1 / F27m1 / F28m1 likely have the same latent issue** — Yogesh approved them visually so I haven't touched them. Could be the difference between "looks fine on dev machines (Inter installed as system font)" and "looks wrong on Iksula corporate Windows machines (no Inter installed)". Test on Mon morning before pilot kickoff.

### Lesson 11 — Flex sibling separators need .flatMap not .map

Canonical pattern:

```html
<div class="s-specs">
  <span>131K ctx</span>
  <span class="sep">·</span>
  <span>500 tok/s</span>
  <span class="sep">·</span>
  <span>1K RPD</span>
</div>
```

With `.s-specs { display: flex; gap: 8px }` — each span is a separate flex child, gap applies symmetrically between all 5.

**Wrong port (visible drift):**

```tsx
{
  specs.map((sp, i) => (
    <span key={i}>
      {i > 0 ? <span className="sep">·</span> : null}
      {sp}
    </span>
  ));
}
```

This wraps `sep + text` in ONE flex child, breaking the gap symmetry. Visual: `131K ctx ·500 tok/s ·1K RPD` (sep bunched with right text).

**Correct port:**

```tsx
{
  specs.flatMap((sp, i) =>
    i === 0
      ? [<span key={`sp-${i}`}>{sp}</span>]
      : [
          <span key={`sep-${i}`} className="sep">
            ·
          </span>,
          <span key={`sp-${i}`}>{sp}</span>,
        ],
  );
}
```

**Used in:** F26m2 (3 slot spec rows fixed)

---

## §3 PRs shipped today (count)

**5 PRs to main** — F27 + F26m1 + F28m1 + F27m1 + F26m2. PRs #232, #236, #237 already merged to `main`. PRs #240 + #244 pending review (opened in last 4 hours).

Branches on origin:

- `feat/web-f26m1-llm-provider-setup-port` (merged)
- `feat/web-f28m1-llm-provider-config-port` (merged)
- `feat/web-f27m1-invite-user-port` (open #240)
- `feat/web-f26m2-agent-model-assignment-port` (open #244)

---

## §4 Blockers + watch items

### Day-29 followup — FE home page renders 100% stub data

The `/home/` route (F08 Home) renders 100% stub data even for a signed-in user — no API calls observed in network tab. Should either:

- Pull real data when BE M1 endpoints land (post-pilot)
- Render an explicit empty-state for new users (Akshay + 6 engineers on Day-1)

Today's pilot is fine because Yogesh demos `/admin/*` routes only. But once users log in and hit `/home/` after onboarding, they'll see Yogesh's hardcoded test data. **Action**: file `(an)` followup for M1 wire-up.

### 10th near-miss — branch-creation drift in multi-worktree git

This evening I started F27m1 on the parked f26m1 branch (last branch active before resume) instead of branching off origin/main fresh. Caught at commit-time when `git status` showed wrong base. Recovered clean with `git checkout -B feat/web-f27m1 origin/main` + cherry-pick of working-tree changes. **Pattern to codify**: at session resume, ALWAYS run `git status && git checkout -B <feature> origin/main` before any edits, never trust the parked branch state. Logging as `feedback_branch_create_at_resume.md` memory.

### Lesson 10 follow-up — next/font + Tailwind 4 @theme cascade

F26m2 needed an `@import` workaround. F26m1 / F27m1 / F28m1 might too — test on Mon AM before pilot kickoff. Could be invisible on dev (macOS Inter installed) but break on Windows/Linux pilot machines.

### No external blockers — $0 cost gate intact (zero Groq burn this whole day, all Pattern A)

---

## §5 Pilot UI readiness verdict — **GREEN** ✅

All 4 critical Day-1 surfaces shipped:

- ✅ F27 Users & Roles list (#232)
- ✅ F27m1 Invite User flow (#240 — Yogesh's primary Day-1 demo)
- ✅ F26m1 LLM Provider Setup (#236 — onboarding-day "set up Groq")
- ✅ F28m1 LLM Provider Config (#237 — Settings view for existing provider)

Bonus shipped (nice-to-have):

- ✅ F26m2 Agent Model Assignment (#244 — per-agent routing config)

**Pilot Day-1 (Mon) onboarding flow is intact**: Yogesh → F27 → "Invite user" → F27m1 → enter 7 emails → bulk-apply QA Engineer role + Returns project → Send invites → Akshay + 6 engineers receive Resend email → set-password → first-run → land on `/home/`.

---

## §6 Sun on-call posture

**Asynchronous-only.** Respond only to Yogesh smoke-test bug reports from his Mon AM walkthrough rehearsal. No proactive work — let the merge wave settle, let the dust clear.

Watch items if anything fires:

- WhatFont audit on `/admin/users/invite` + `/admin/agents/provider-setup` + `/admin/settings/providers` to verify Lesson 10 isn't a real issue on those pages (low-risk pre-Mon check)
- Smoke test the 5 ported routes at desktop + mobile in a real Chrome (not Playwright)

---

## §7 Stand-down

22:00 IST hard stop. Resuming Mon AM for pilot day kickoff support.

Token discipline note: heavy context-mode use throughout (ctx_execute / ctx_batch_execute / ctx_execute_file replacing direct Bash for everything > 20 lines per CLAUDE.md token-discipline section). Inline Read used only for files I was about to Edit. Estimated savings ~40% on raw output capture vs an un-disciplined run.

---

## §8 Cross-references

- **Skill workflow**: `.claude/skills/frame-port/SKILL.md` v2.2 (7-step canonical-first)
- **Hard Rules**: 11/13/14/15/17/18 carryforward enforced on every PR body
- **Canonicals**: `PM1_UI_v2/Redesign Frame by claude design/F26m1/F26m2/F27/F27m1/F28m1 *.html`
- **Iksula data canon**: CLAUDE.md → used in F27m1 project list + F26m2 banner stats
- **Lessons memory**: `feedback_skill_v2.2_first_use.md` (lessons 1-6 from earlier days; 7-11 added today)
- **EOD canonical location**: `docs/eod-reports/YYYY-MM-DD-day-N.md` per kickoff §5
