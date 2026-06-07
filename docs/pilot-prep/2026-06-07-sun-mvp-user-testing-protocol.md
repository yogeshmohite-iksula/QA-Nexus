# Sun Evening MVP User-Testing Protocol — Sun 2026-06-07

> **Tester:** Yogesh · **Window:** Sun 16:30-19:30 IST (~3 hours) · **Goal:** Discover P0/P1 bugs BEFORE Mon Jun 8 8-user pilot launch.

This is a UX-research-style structured smoke test, not a regression test suite. The goal is **be the first user**: act as Akshay Panchal opening the app for the first time, and document every confusion or break.

---

## §1 — Pre-test setup (Yogesh, ~10 min)

1. **Sign out of QA Nexus everywhere** (close all tabs).
2. **Clear browser state** for both `qa-nexus-web.pages.dev` and `qa-nexus-api.onrender.com`:
   - Chrome: chrome://settings → Privacy → Cookies and site data → See all cookies → search "qa-nexus" → delete each.
   - Safari: Settings → Privacy → Manage Website Data → search "qa-nexus" → Remove.
3. **Open two browsers side-by-side**: Chrome incognito + Safari (regular).
4. **Open a notes app** (Apple Notes / TextEdit) for bug tracking, with the bug-reporting template from §3 pasted at the top.
5. **Set up screen recording** if possible (Cmd+Shift+5 → record screen) for video evidence on confusing flows.
6. **Have your iPhone or browser DevTools open** for mobile responsive checks (320px viewport).

---

## §2 — Test scenarios (~3 hours total)

### Scenario A — First-time sign-in flow (5-10 min)

**Goal:** Verify the magic-link sign-in path works end-to-end for a brand-new user.

1. Navigate to `https://qa-nexus-web.pages.dev/auth/sign-in`
2. Verify the F06 Sign In page renders (locked frame design):
   - Left panel: gradient brand mark + product copy
   - Right panel: email input form
3. Enter `yogesh.mohite@iksula.com` → click "Send magic link"
4. Wait for confirmation message ("Check your email…")
5. **Switch to your email client** (Gmail web or iOS Mail app).
6. Wait for the magic-link email. **Time it** — target <30s from click to inbox.
7. Verify the email:
   - Sender: `yogesh.mohite@iksula.com` (via Apps Script bridge per ADR-025)
   - Subject: "Sign in to QA Nexus" (or similar)
   - Plain-text fallback present
   - Magic-link points to `https://qa-nexus-web.pages.dev/auth/verify?token=...`
8. **Click the magic-link from your phone's mail app** (cross-device test) AND **separately from Gmail web** (same-device test). Both should work.
9. Land on `/home`. **Verify NO dummy/seed data shown** — the F08 Home should show real Iksula data (RET project highlights, recent activity) or empty states if user is brand-new.
10. Document the time-to-land-on-home + any confusion points.

**Pass criteria:**

- [ ] Email arrives in <60s (target <30s)
- [ ] Magic-link works from at least one mail client
- [ ] No console errors in browser DevTools
- [ ] `/home` renders with real data (NOT placeholder lorem-ipsum)
- [ ] BetterAuth session cookie set with `SameSite=None; Secure` (DevTools → Application → Cookies)

### Scenario B — F08 Home page (10-15 min)

**Goal:** Verify the daily-driver landing surface is functional + responsive.

1. **Welcome message** uses real user name (Yogesh Mohite or "Yogesh")
2. **Project switcher pill** in top utility bar shows the user's default project (RET = Iksula Returns)
3. Click each of the 7 topbar elements one at a time — each should open + close cleanly:
   - [ ] Project switcher dropdown
   - [ ] Global search omnibox (or ⌘K shortcut)
   - [ ] Plus icon (quick-create menu)
   - [ ] Bell icon (notifications panel)
   - [ ] Theme toggle (sun/moon icon)
   - [ ] Mode toggle (Operate / Review / Prove)
   - [ ] User menu (avatar + sign-out)
4. **Theme toggle test:** click sun/moon → page flips to dark/light → refresh → state persists per browser.
5. **Search test:** press ⌘K → omnibox opens → type "req" → results filter live.
6. **Mobile test:** open DevTools Responsive Mode → set to 320px (iPhone SE) → verify:
   - [ ] Hamburger menu visible in topbar
   - [ ] Tap hamburger → drawer slides in from left with all nav sections
   - [ ] Tap a nav item or tap backdrop → drawer closes
   - [ ] No horizontal scroll at 320px width
7. **Tablet test:** 768px viewport → AdminShell should still render rail collapsed; topbar should fit cleanly.

**Pass criteria:**

- [ ] All 7 topbar elements function
- [ ] Theme persists across reload
- [ ] Mobile (320px) has hamburger + drawer; no horizontal scroll
- [ ] All nav sections collapsible (chevron toggles)

### Scenario C — Projects switching (10 min)

1. Click project switcher pill → dropdown lists all 5 Iksula projects:
   - [ ] Iksula Returns (RET)
   - [ ] Iksula Commerce (CART)
   - [ ] Iksula Payments (PAY)
   - [ ] Iksula Mobile App (AUTH)
   - [ ] Iksula Internal Ops (OPS)
2. Switch to Commerce (CART) → pill updates → nav items context-switch to CART data.
3. Switch back to Returns (RET) → pill updates back.
4. Navigate to F09 Projects List page → verify all 5 projects appear in the list.

**Pass criteria:**

- [ ] All 5 projects switchable
- [ ] No project shows "404 / not found" when selected
- [ ] Switching is fast (<2s; cold-start <30s acceptable)

### Scenario D — F26 Agents page + F26m1 modal (15-20 min)

1. Navigate to `/admin/agents` (or click "Agents" in left rail GOVERN section).
2. Verify F26 page shows:
   - [ ] 3 agent cards: Composer (A1), Curator (A2), Sherlock (A4)
   - [ ] Each with real status indicator (green/amber/red) — NOT hardcoded
   - [ ] LLM provider panel showing real configured provider (Groq for primary)
   - [ ] Recent activity panel showing 12 most-recent entries — REAL data, not mock
   - [ ] Eval harness panel showing AC042 PASS history (top-2 64%, calibration 1.00 from Day-28)
3. Click "Configure" on the LLM provider panel → F26m1 LLM Provider Setup modal opens.
4. Verify modal:
   - [ ] No DEMO toggle visible (per Sat Yogesh ruling — removed)
   - [ ] Form fields: API key (with Show/Hide), provider select, model select, temperature slider, max-tokens slider
   - [ ] Test connection button works (returns success for current Groq key)
   - [ ] Cancel button closes without saving
5. Navigate directly to `/admin/agents/provider-setup?mode=edit&id=composer` → modal opens in edit mode.
6. Verify form is pre-populated with current Composer config.

**Pass criteria:**

- [ ] All 3 agent cards render with real data
- [ ] F26m1 fresh-setup mode works
- [ ] F26m1 edit-existing mode works (query-param)
- [ ] Test connection actually hits the provider
- [ ] No console errors

### Scenario E — F27 Users & Roles + F27m1 modal (10 min)

1. Navigate to `/admin/users`.
2. Verify F27 page shows 8 Iksula team members in canonical order:
   - [ ] 1. Akshay Panchal — Lead
   - [ ] 2. Yogesh Mohite — Admin
   - [ ] 3. Kishor Kadam — QA Engineer
   - [ ] 4. Nitin Gomle — QA Engineer
   - [ ] 5. Nadim Siddiqui — QA Engineer
   - [ ] 6. Govind Daware — QA Engineer
   - [ ] 7. Mohanraj K. — QA Engineer
   - [ ] 8. Sagar Todankar — QA Engineer
3. Verify table is scrollable horizontally on mobile (320px) per Sat F27 fix.
4. Click "Invite user" → F27m1 modal opens.
5. Test form validation:
   - Empty email → "required" error
   - Invalid email → "valid email" error
   - Valid email + role selection → submit button enables
6. **DO NOT submit a real invite** (don't want to send Apps Script email this round; save quota).
7. Cancel modal.

**Pass criteria:**

- [ ] All 8 users in canonical order
- [ ] No mobile horizontal scroll on F27
- [ ] F27m1 form validation works
- [ ] Cancel closes cleanly

### Scenario F — F28 Settings & Audit + F28m1 modal (10 min)

1. Navigate to `/admin/settings`.
2. Verify F28 page shows:
   - [ ] Real audit log entries (HMAC-chained per PM1_ERD §3.13)
   - [ ] Chain integrity indicator (green if valid)
   - [ ] Settings sections: profile, providers, security
3. Click "Configure providers" → F28m1 LLM Provider Config modal opens.
4. Verify 2-pane layout:
   - [ ] Left pane: provider list (Groq, Gemini)
   - [ ] Right pane: detail form for selected provider
   - [ ] Switching providers updates the detail pane
5. Cancel modal.

**Pass criteria:**

- [ ] Audit log shows real entries
- [ ] F28m1 2-pane layout responsive
- [ ] No console errors

### Scenario G — Cross-cutting + edge cases (15-20 min)

1. **Sign-out flow:**
   - [ ] Click user menu → Sign out → redirected to `/auth/sign-in`
   - [ ] BetterAuth session cookie cleared (DevTools confirm)
2. **Sign-in restoration:**
   - [ ] Request new magic-link → click → land on `/home` → session restored
3. **Browser back/forward navigation:**
   - [ ] After sign-in: F08 → F14 → F19 → back → back → forward — no errors
   - [ ] Project switcher state preserved on back navigation
4. **Multi-tab consistency:**
   - [ ] Open `/home` in Tab A + `/admin/agents` in Tab B
   - [ ] Sign out from Tab A → Tab B redirects on next interaction (or shows session-expired modal)
5. **Mobile responsive (320px) end-to-end:**
   - [ ] F08 → F14 → F21 → F26 → F27 all usable without horizontal scroll
   - [ ] Modal Drawer behavior at 320px: full-screen sheet (not overlay)
6. **Expired magic-link:**
   - [ ] Request a magic-link → wait >10 min → click → graceful error page (not blank / not 500)
7. **Invalid magic-link tampering:**
   - [ ] Take a valid link → change a character in the token query param → click → graceful "invalid token" error

**Pass criteria:**

- [ ] All flows work end-to-end
- [ ] No silent failures (every error has a user-facing message)
- [ ] No console errors on any flow

---

## §3 — Bug reporting template

For each bug found, paste into your notes app and fill:

```
─────────────────────────────────────────
SEVERITY: [P0 Mon-blocker / P1 Sun-fix / P2 Day-29 / P3 post-pilot]
PAGE / FLOW: [e.g., F26 Agents → F26m1 modal]
EXPECTED: [what should have happened]
ACTUAL: [what did happen]
STEPS TO REPRODUCE:
  1.
  2.
  3.
SCREENSHOT / VIDEO: [path or URL]
NOTES: [browser, viewport, time, anything else]
─────────────────────────────────────────
```

**Severity definitions:**

- **P0 Mon-blocker:** sign-in broken, data loss, auth bypass, app crashes on critical path → delay pilot to Tue Jun 9
- **P1 Sun-fix:** visible bug on Mon-pilot critical path; agent can fix tonight → fix-first workflow
- **P2 Day-29:** annoying bug; not Mon-critical → file as followup
- **P3 post-pilot:** polish item; no user impact → backlog

---

## §4 — Sun 19:00 IST GO criteria (all must be true)

- [ ] **Zero P0 bugs found** in any scenario
- [ ] **Scenario A** (sign-in + home) works end-to-end for a fresh user
- [ ] **Scenario C** (project switcher) works across all 5 projects
- [ ] **All 4 core pages** (F08 Home, F26 Agents, F27 Users, F28 Settings) load with REAL data — not stub/mock
- [ ] **BE+1 Sun AM audit verdict** ≥ AMBER (PR landed today, no P0 surfaced)
- [ ] **MAIN Sun PM audit verdict** ≥ AMBER (this doc + 4 runbooks landed, Bucket 1+2 paired-check complete)
- [ ] **FE+1 Playwright smoke suite** 12/12 PASS (or whatever is the current size — request from FE+1)
- [ ] **Apps Script bridge** still responding (curl GET to URL returns 200)
- [ ] **Audit log HMAC chain integrity** verified (`pnpm verify:audit` returns clean — request BE+1 run before 19:00)

## §5 — Sun 19:00 IST NO-GO triggers (any one defers Mon launch to Tue Jun 9)

- [ ] ≥1 P0 bug in any scenario
- [ ] Sign-in flow broken at any step of Scenario A
- [ ] ≥3 P1 bugs that can't be Sun-fixed by 22:00 IST
- [ ] Apps Script bridge unresponsive
- [ ] Audit log HMAC chain integrity broken
- [ ] Cross-site cookie persistence fails (Scenario A step 10)
- [ ] FE+1 Playwright smoke <80% PASS rate

---

## §6 — Mon Jun 8 D-day launch sequence (if Sun GO)

Already documented in `docs/briefs/2026-06-08-mon-pilot-launch.md`. Quick reference:

| Time IST | Action                                                                       |
| -------- | ---------------------------------------------------------------------------- |
| 08:00    | Verify Apps Script bridge + Render API + Neon DB all healthy                 |
| 08:30    | Send invite emails to Akshay + 6 QA Engineers via F27m1 modal                |
| 09:00    | First sign-ins expected — watch BetterAuth Session table                     |
| 09:30    | 15-min team standup — walk through F08 → F14 → F19 → F21 happy path          |
| 10:00    | Open floor — team explores, reports issues via email channel B               |
| 12:00    | First usage check-in — triage email inbox for P0/P1 bugs                     |
| 15:00    | Afternoon check-in — usage patterns + feature requests                       |
| 17:00    | End-of-Day-1 retrospective — file `docs/pilot/2026-06-08-mon-day-1-retro.md` |

## §7 — If Sun NO-GO — 24-hr remediation plan for Mon-Tue

1. Sun 19:30 IST: identify all P0/P1 root causes from Yogesh testing + agent audits
2. Sun 20:00 IST: file `docs/pilot/sun-blockers.md` with sequenced fix plan
3. Sun 20:00-22:00 IST: agents fix P0 items (fix-first workflow per Sun standby brief)
4. Mon 08:00 IST: re-run smoke (Scenarios A + targeted scenarios for fixed areas)
5. Mon 09:00 IST: if smoke clean → activate the Mon brief sequence shifted +24h (Tue Jun 9 D-day)
6. Mon 10:00 IST: notify pilot team of 1-day delay via email channel B with clear ETA

---

_Authored Sun Day-5 2026-06-07 ~16:30 IST. Yogesh's structured smoke-test protocol for the Sun evening testing window. Pairs with Sun AM BE+1 audit + Sun PM MAIN audit + 19:00 IST Sun EOD GO/NO-GO._
