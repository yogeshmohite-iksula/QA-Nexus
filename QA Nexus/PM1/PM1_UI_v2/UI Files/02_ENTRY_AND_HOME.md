# 02 — Entry & Home

**Part of PM1_UI_v2 package. Paste `01_SYSTEM.md` first, then this file.**

---

## §1. Pinned reminder (Stitch keeps forgetting — re-read before generating)

**CRITICAL—re-read 01_SYSTEM.md before generating each frame. This section is NOT a substitute for the full system spec; it is a quick lockdown checklist only.**

**Product name:** QA Nexus (never "Evidence Mesh" or "Workbench")

**Exact color palette (no others):**
- Primary (CTAs, value, approval): `#2DD4BF` teal
- Secondary (AI-only, agent outputs, confidence spine): `#A78BFA` violet
- Canvas (operate mode): `#0B0F17` (never `#141219` or MD3 tokens)
- Base: `#111827`, Raised: `#1A2233`, Overlay: `#232C3F`
- Semantic: `#34D399` pass, `#F87171` fail, `#FBBF24` warn, `#60A5FA` info
- Text: `#F1F5F9` primary, `#C7D0DC` secondary, `#8A94A6` tertiary

**FORBIDDEN (hard constraint violation if present):**
- NO tertiary brand color (no orange, yellow, coral, pink)
- NO Material Design 3 tokens (`primary-container`, `surface-tint`, `on-primary`, etc.)
- NO Tailwind config extension with MD3 palette
- NO glassmorphism, neon gradients, or decorative blur

**Navigation contract (frozen, applies every frame):**
- Top bar (8 slots): logo · project switcher ▾ · search ⌘K · quick create + · notifications 🔔 · theme toggle ◐ · mode toggle (Operate/Review/Prove) · avatar
- Left rail (272px): Home + PLAN (Requirements / Test Plans / Test Cases) + AUTHOR (Test Suites / Knowledge Base / Automation Studio disabled / Data & Mocks disabled) + RUN (Runs & Sessions / Environments) + ANALYSE (Run Results / Defects / Reports / QA Value [Lead+ only]) + GOVERN (Agents / Integrations / Users / Settings [Lead/Admin only]) + pinned bottom (Support / Account)
- Role gating: QA Engineer hides GOVERN section + QA Value. Stakeholder hides GOVERN.

**Signature data (use consistently):**
- Project: Iksula Commerce
- Sprint: Sprint 42 (2026-04-09 → 2026-04-23)
- Team: Yogesh M (Lead) / Priya S (Sr QA) / Rahul K / Arjun M / Neha D / Rohan K
- Example ticket: PAY-1472 (Checkout hangs on Stripe 3DS redirect in Firefox)
- Example test case: TC-PAY-0341 (Apply two gift cards at checkout)

**See 01_SYSTEM.md for full specs.** If Stitch drifts, re-read 01_SYSTEM.md immediately and regenerate.

---

## §2. Frame F06 — Sign In + Workspace Select  🔒 APPROVED BASELINE (2026-04-23)

### Front matter
- **ID:** F06
- **Role gate:** All (pre-auth)
- **Canvas:** 1600 × 1024
- **Shell:** Minimal (no rail, no top bar) — this is the only non-shell frame in PM1
- **Entry/Exit:** Public URL / sign-out → F07 (new lead/admin) | F08a (QA Engineer return) | F08b (Lead/Admin/Stakeholder return)
- **Status:** ✅ Design approved. Left panel is LOCKED and must not change. Right-side sign-in form is locked to the approved shape; visual treatment (inline form vs elevated card) may be iterated but content order is fixed.

### Purpose
Entry point into QA Nexus. Two-panel split: left half is brand / positioning; right half is the sign-in form. Post-auth, role-based routing sends user to F07 (new Lead/Admin onboarding), F08a (QA Engineer return), or F08b (Lead/Admin/Stakeholder return).

### Content regions — APPROVED LAYOUT (do not change proportions or copy)

**Layout:** 50/50 horizontal split at 800 px divide. `lg:flex w-1/2` on each side. Both halves full-height 1024 px.

#### Region 1 — LEFT BRAND PANEL (800 × 1024, x=0 y=0) 🔒 LOCKED

Approved treatment, do not re-design:

- **Background:** `#111827` base surface with right border `1 px solid #2A3347`.
- **Decorative overlay:** abstract tech-line background image at 20% opacity, covering the full panel behind content. Subtle diagonal lines suggesting signal flow / circuit pattern. Must be low-contrast so foreground copy remains readable.
- **Top-left brand mark (padding 48 px from top, 48 px from left):**
  - Flask / beaker icon in teal `#2DD4BF`, 24 × 24 (Material Symbols `science` or equivalent glyph)
  - Wordmark **"QA Nexus"** immediately right of glyph, DM Sans 24/700, color teal `#2DD4BF`, letter-spacing -0.01em
- **Hero block (vertically centered, 48 px left padding, max-width 420 px):**
  - Heading **"Operational Intelligence Platform."** — DM Sans 48/700, color `#F1F5F9`, line-height 1.1, letter-spacing -0.02em. Wraps to 3 lines at this width.
  - Sub-paragraph below (margin-top 16 px): **"Centralized quality assurance and test automation telemetry. Designed for high-density analytical environments."** — Inter 18/400, color `#C7D0DC`, line-height 1.5.
- **Bottom meta row (48 px from bottom, 48 px from left):**
  - Version chip: **"v1.0.4-stable"** — Geist Mono 12/400, padding 4 px 8 px, border `1 px solid #2A3347`, radius 4 px, background `#0B0F17`, color `#8A94A6`.
  - Separator: 16 px gap.
  - Status indicator: 8 px green dot `#34D399` + text **"All systems operational"** Inter 14/400, color `#8A94A6`.

#### Region 2 — RIGHT SIGN-IN PANEL (800 × 1024, x=800 y=0)

- **Background:** `#0B0F17` main canvas (darker than left panel — intentional contrast).
- **Form container:** centered both axes, max-width 384 px (`max-w-sm`), full content padding-aware.
- **Top of form (padding-top 128 px equivalent spacing from container top, centered):**
  - Heading **"Sign in to workspace"** — DM Sans 30/600, color `#F1F5F9`, text-align center, margin-bottom 8 px.
  - Sub-paragraph **"Enter your credentials to access the workbench."** — Inter 16/400, color `#C7D0DC`, text-align center.
- **Form block (margin-top 48 px from heading, vertical spacing 24 px between fields):**
  - **WORK EMAIL label:** Inter 12/600, uppercase, letter-spacing 0.05em, color `#8A94A6`, margin-bottom 8 px.
  - **Email input:** 48 px tall, background `#1A2233`, border `1 px solid #2A3347`, radius 4 px, padding-left 48 px (icon space), padding-right 16 px, color `#F1F5F9`, placeholder `"nexus.operator@company.com"` at `#8A94A6` 50% opacity. Mail glyph icon (Material `mail`, 20 px, color `#8A94A6`) absolute-positioned 12 px from left, vertically centered. Focus: border `#2DD4BF`, outline `1 px solid rgba(45,212,191,0.2)`.
  - **PASSWORD label row:** Inter 12/600 uppercase label `"PASSWORD"` color `#8A94A6` on left, and **"Forgot password?"** link on right — Inter 12/400, color `#2DD4BF` (teal), underline on hover.
  - **Password input:** same styling as email input but lock glyph icon (`lock`) and masked text (`••••••••••••`).
  - **Submit button (margin-top 32 px):** full-width, height 48 px, background `#2DD4BF` (Primary teal), color `#003732` (very dark teal for strong contrast — this is the only place we use a dark-teal text), Inter 16/600, radius 4 px. Content: label **"Authenticate"** + right-arrow glyph (`arrow_forward`, 20 px). Hover: `background rgba(45,212,191,0.9)`. Disabled: 50% opacity + cursor not-allowed.
- **Bottom link (margin-top 48 px, centered):** Inter 14/400, color `#8A94A6`, text reads **"Need emergency access? Contact Site Admin"**. The "Contact Site Admin" phrase is a link — color `#A78BFA` (Secondary violet), underline on hover. This is the ONE place violet appears on this frame — it's a secondary action.

### States

- **Normal:** Both fields editable, Authenticate button enabled.
- **Loading:** Authenticate button shows spinner + "Authenticating…" text, disabled.
- **Error (wrong credentials):** Red error message below Authenticate button — background `rgba(248,113,113,0.08)`, left-border `3 px solid #F87171`, text `"Invalid email or password. Try again or reset."` (Inter 13, color `#F87171`, padding 12 px 16 px, radius 4 px). Password field auto-cleared. Button returns to enabled state.
- **Error (system down):** Status row bottom-left of brand panel changes to: amber dot + "Partial outage — some features degraded" (amber `#FBBF24`) OR red dot + "Auth service unavailable" (red `#F87171`). Form becomes disabled during outage.
- **Success (single workspace):** Form fades out 200 ms → route to destination per role (F07 / F08a / F08b).
- **Success (multiple workspaces):** Form area replaced by a workspace-picker card: heading **"Which workspace?"** + list of workspace rows (each row: workspace glyph 32 × 32 gradient + name DM Sans 16/500 + env chip Geist Mono 11 + last-activity Inter 12 tertiary + chevron). Click row → destination.

### Accessibility
- Tab order: email → password → Forgot password link → Authenticate button → Contact Site Admin link.
- Focus ring: 2 px `#A78BFA` violet, offset 2 px (visible on all interactive elements).
- Color-not-only-signal: error uses red text + border + icon; status uses color + shape + text; Authenticate button has label, not just color.
- Screen reader: `<main>` wraps the form, `<form>` element used, email/password `<label>` associated via `for`/`id`, error messages in `role="alert"`, Contact Site Admin link has descriptive aria-label.
- Reduced motion: no spinner animation on submit — replace with static "Authenticating…" text and disabled state.

### Realistic data
- Placeholder email: `nexus.operator@company.com`
- Version chip: `v1.0.4-stable`
- Status: `All systems operational` (green dot)
- Brand tagline: `Operational Intelligence Platform.`
- Hero sub-paragraph: `Centralized quality assurance and test automation telemetry. Designed for high-density analytical environments.`

### Reference HTML (approved Stitch output — 2026-04-23)

Use this as the ground-truth render target. If regenerating, match this layout exactly. If iterating, preserve the left panel verbatim.

```html
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>QA Nexus — Sign In</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
</head>
<body class="bg-[#0B0F17] text-[#F1F5F9] h-screen w-full flex overflow-hidden font-['Inter']">
  <!-- LEFT BRAND PANEL (50%) -->
  <div class="hidden lg:flex w-1/2 h-full bg-[#111827] flex-col justify-between p-12 relative border-r border-[#2A3347]">
    <div class="absolute inset-0 z-0 opacity-20 bg-cover bg-center" style="background-image: url('[tech-line-pattern]');"></div>
    <div class="z-10 flex items-center gap-2">
      <span class="material-symbols-outlined text-[#2DD4BF] text-3xl">science</span>
      <span class="font-['DM_Sans'] text-2xl font-bold text-[#2DD4BF] tracking-tight">QA Nexus</span>
    </div>
    <div class="z-10 max-w-md">
      <h1 class="font-['DM_Sans'] text-5xl font-bold text-[#F1F5F9] mb-4 leading-tight">Operational Intelligence Platform.</h1>
      <p class="text-lg text-[#C7D0DC] leading-relaxed">Centralized quality assurance and test automation telemetry. Designed for high-density analytical environments.</p>
    </div>
    <div class="z-10 flex gap-4 items-center text-[#8A94A6]">
      <span class="font-['Geist_Mono'] text-xs border border-[#2A3347] px-2 py-1 rounded bg-[#0B0F17]">v1.0.4-stable</span>
      <span class="text-sm flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-[#34D399] inline-block"></span> All systems operational</span>
    </div>
  </div>
  <!-- RIGHT SIGN-IN PANEL (50%) -->
  <div class="w-full lg:w-1/2 h-full flex flex-col justify-center items-center p-6 relative bg-[#0B0F17]">
    <!-- Mobile header (only visible < lg breakpoint) -->
    <div class="lg:hidden absolute top-0 left-0 w-full p-6 flex items-center gap-2">
      <span class="material-symbols-outlined text-[#2DD4BF] text-2xl">science</span>
      <span class="font-['DM_Sans'] text-xl font-bold text-[#2DD4BF] tracking-tight">QA Nexus</span>
    </div>
    <div class="w-full max-w-sm">
      <div class="mb-12 text-center">
        <h2 class="font-['DM_Sans'] text-3xl font-semibold text-[#F1F5F9] mb-2">Sign in to workspace</h2>
        <p class="text-[#C7D0DC]">Enter your credentials to access the workbench.</p>
      </div>
      <form class="space-y-6">
        <!-- Email -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-[#8A94A6] uppercase tracking-wider" for="email">Work Email</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6] text-[20px]">mail</span>
            <input class="w-full bg-[#1A2233] border border-[#2A3347] rounded text-[#F1F5F9] pl-12 pr-4 py-3 focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]/20 transition-colors placeholder:text-[#8A94A6]/50" id="email" name="email" placeholder="nexus.operator@company.com" required type="email"/>
          </div>
        </div>
        <!-- Password -->
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="block text-xs font-semibold text-[#8A94A6] uppercase tracking-wider" for="password">Password</label>
            <a class="text-xs text-[#2DD4BF] hover:underline transition-colors" href="#">Forgot password?</a>
          </div>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6] text-[20px]">lock</span>
            <input class="w-full bg-[#1A2233] border border-[#2A3347] rounded text-[#F1F5F9] pl-12 pr-4 py-3 focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]/20 transition-colors placeholder:text-[#8A94A6]/50" id="password" name="password" placeholder="••••••••••••" required type="password"/>
          </div>
        </div>
        <!-- Submit -->
        <button class="w-full bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#003732] font-semibold py-3 px-6 rounded transition-colors flex items-center justify-center gap-2 mt-8" type="submit">
          Authenticate <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </form>
      <div class="mt-12 text-center">
        <p class="text-sm text-[#8A94A6]">
          Need emergency access? <a class="text-[#A78BFA] hover:underline transition-colors" href="#">Contact Site Admin</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

### Stitch prompt (copy-paste) — LOCKED to approved baseline

```
Design F06 — Sign In. Pre-auth entry. No rail, no top bar. Canvas 1600 × 1024.

This is an APPROVED BASELINE design. Render it faithfully — do not reinterpret the layout.

Two-panel 50/50 split:

LEFT PANEL (800 × 1024) — LOCKED, do not redesign:
- Background #111827, right border 1px #2A3347
- Abstract tech-line decorative pattern behind content at 20% opacity (circuit / signal-flow lines, low contrast)
- Top-left (48px padding): flask/beaker glyph (Material Symbols `science`) in teal #2DD4BF at 24px + "QA Nexus" wordmark DM Sans 24/700 in teal #2DD4BF
- Vertically centered hero (max-width 420px, left padding 48px):
  * Heading "Operational Intelligence Platform." — DM Sans 48/700, color #F1F5F9, line-height 1.1, letter-spacing -0.02em (wraps 3 lines)
  * Sub-paragraph "Centralized quality assurance and test automation telemetry. Designed for high-density analytical environments." — Inter 18/400, color #C7D0DC, line-height 1.5
- Bottom meta row (48px from bottom, 48px from left):
  * Version chip "v1.0.4-stable" — Geist Mono 12/400, padding 4px 8px, border 1px #2A3347, radius 4px, background #0B0F17, color #8A94A6
  * 16px gap
  * Status: 8px green dot #34D399 + "All systems operational" Inter 14/400 color #8A94A6

RIGHT PANEL (800 × 1024) — sign-in form:
- Background #0B0F17 (canvas, darker than left)
- Centered form, max-width 384px
- Top: heading "Sign in to workspace" DM Sans 30/600 center #F1F5F9 + margin-bottom 8px + sub "Enter your credentials to access the workbench." Inter 16/400 center #C7D0DC
- Margin-top 48px → form fields, 24px between fields:
  * WORK EMAIL label (Inter 12/600 uppercase tracking-wider color #8A94A6) + email input (bg #1A2233, border #2A3347, radius 4px, padding-left 48px for icon, height 48px, color #F1F5F9, placeholder "nexus.operator@company.com" at #8A94A6/50%, mail glyph 20px color #8A94A6 absolute left 12px). Focus: border #2DD4BF + ring 1px rgba(45,212,191,0.2)
  * PASSWORD label row: left "PASSWORD" (same Inter 12/600 uppercase), right "Forgot password?" link (Inter 12/400, color #2DD4BF teal, underline on hover) — same row via flex-between
  * Password input: same styling, lock glyph, masked text "••••••••••••"
- Margin-top 32px → Authenticate button: full-width 48px tall, bg #2DD4BF, color #003732 (dark-teal text for contrast), Inter 16/600, radius 4px. Content: "Authenticate" + arrow_forward glyph 20px. Hover: bg rgba(45,212,191,0.9)
- Margin-top 48px → centered text "Need emergency access? Contact Site Admin" (Inter 14/400 color #8A94A6, "Contact Site Admin" is a link in color #A78BFA violet with hover:underline)

States:
- Error: red message below button — bg rgba(248,113,113,0.08), left-border 3px #F87171, text "Invalid email or password. Try again or reset." Inter 13 color #F87171. Password field cleared.
- Loading: button shows spinner + "Authenticating…" disabled
- Success (single workspace): 200ms fade out → route to F07/F08a/F08b per role
- Success (multiple): form area replaced with workspace-picker card (heading "Which workspace?" + list of rows, each: workspace glyph 32px + name DM Sans 16/500 + env chip Geist Mono 11 + last-activity Inter 12)

Accessibility:
- Tab order: email → password → Forgot → Authenticate → Contact Site Admin
- Focus ring 2px #A78BFA violet, offset 2px
- Error in role="alert"
- Color never sole signal (error = color + icon + border + text)
- Reduced motion: static "Authenticating…" instead of spinner

Apply 01_SYSTEM.md design tokens VERBATIM. Do NOT use Material Design 3 color tokens. Do NOT extend Tailwind config. Hardcode every hex value. Primary = #2DD4BF teal. Secondary = #A78BFA violet. No tertiary. No orange. No glassmorphism. No landing-page hero style. This is operational tooling — calm and precise.

Product name = "QA Nexus" (never "Evidence Mesh" or "Workbench").

Canvas 1600 × 1024. No rail. No top bar. Pre-auth only.

Render as clean HTML + inline Tailwind arbitrary-value classes (bg-[#0B0F17] style, not extended config). Use Google Fonts for Inter, DM Sans, Geist Mono. Material Symbols Outlined for glyphs (science, mail, lock, arrow_forward).
```

---

## §2b. Frame F06b — Set / Reset Password (dual-mode, v2.2 NEW)

### Front matter
- **ID:** F06b
- **Added:** v2.2 (2026-04-24) — sibling to F06, covers the "click invite link" and "forgot password" flows
- **Title:** Set / Reset Password
- **Role gate:** None (token-bearer only — no authenticated session yet)
- **Canvas:** 1600 × 1024 (same 800/800 split as F06)
- **Shell:** Left Brand Panel (identical to F06) + Right Form Panel
- **Entry Points:**
  - **Mode A (Invite Setup):** User clicks magic link from invitation email → lands on F06b?token=xxx&mode=invite
  - **Mode B (Password Reset):** User clicks link from forgot-password email → lands on F06b?token=xxx&mode=reset
- **Exit Points:**
  - Mode A success → F07 First-Run Onboarding (first login)
  - Mode B success → F06 Sign In with email pre-filled + success toast
  - Any error → F06 Sign In with error banner

### Purpose
Handles two critical authentication moments with one shared shell: setting a password for the first time (after invitation) and resetting a forgotten password. Must feel trustworthy and consistent with F06 brand treatment since it's often a user's very first touch of QA Nexus. Both modes validate password strength, confirm match, and handle token expiry/invalidity with clear empty-state recovery paths.

### Content regions

**Left Brand Panel (800×1024) — IDENTICAL TO F06 LOCKED BASELINE**
- Evidence Mesh constellation background: 75 dots, 0.50 dot opacity, 0.22 line opacity, 90px connection distance, 4px anchor dots with glow, teal/violet-tinted connecting lines, canvas `#0B0F17`
- No eyebrow label, no copy overlay — atmosphere only (matches F06 post-lock treatment)

**Right Form Panel (800×1024)**

Top section (80px padding-top, 64px padding-x):
- QA Nexus logo (same as F06)

Context header (varies by mode):
- **Mode A (Invite):** "Welcome, **Priya**!" — DM Sans 32/40 weight 700 + sub "Set a password to activate your QA Nexus account." Inter 15/22 secondary
- **Mode B (Reset):** "Reset your password" — DM Sans 32/40 weight 700 + sub "Create a new password for `priya.s@iksula.com`." Inter 15/22 secondary (email in JetBrains Mono)

Form (max-width 400px, stacked, 16px gaps):
- **Field 1 — New password:** label "NEW PASSWORD *" Inter 11/16 uppercase tertiary letter-spaced · 48px input password-type with eye-toggle icon on right · teal focus ring
- **Field 2 — Confirm password:** label "CONFIRM PASSWORD *" · 48px input · validation: red inline error "Passwords don't match" below if mismatched

**Password Strength Card (raised bg, 12px radius, 16px padding, 140px tall — appears after first keystroke in Field 1):**
- Label: "PASSWORD STRENGTH" Inter 11/16 uppercase tertiary
- Strength meter: 4-segment bar 240px wide, 6px tall
  - Segment 1 red `#F87171` (weak)
  - Segment 2 amber `#FBBF24` (fair)
  - Segment 3 teal `#2DD4BF` (good)
  - Segment 4 green `#34D399` (strong)
  - Filled segments count based on entropy
- Strength label right of meter: "Weak" / "Fair" / "Good" / "Strong" (JetBrains Mono 12 matching semantic color)
- 4-line requirements checklist (Inter 12/18):
  - `○` → `✓` (tertiary → pass green) "8 or more characters"
  - `○` → `✓` "Uppercase letter (A–Z)"
  - `○` → `✓` "Number (0–9)"
  - `○` → `✓` "Special character (!@#$%^&*)"

**Primary CTA:**
- **Mode A:** "**Set password →**" teal primary 48px tall, full-width of form, bold, disabled until all requirements met + passwords match
- **Mode B:** "**Reset password →**" teal primary (same styling)

**Footer (below form, 24px top gap):**
- Token expiry indicator (amber if <2 hours remaining, tertiary otherwise): "Link expires in **23 hours 14 minutes**" — JetBrains Mono 12, with countdown updating live
- Mode B only: small "← Back to sign in" tertiary link (lets user abandon reset)

### States to depict in render

**Primary render: Mode A (Invite Setup) with mid-strength password typed:**
- Welcome header with user name
- First field filled (obscured), second field filled (matches)
- Strength meter 3/4 filled (teal, "Good")
- 3 of 4 requirements checked (8+ chars ✓, uppercase ✓, number ✓, special ○)
- Submit button enabled teal primary
- "Link expires in 23 hours 14 minutes" mono tertiary

**Secondary render: Thumbnail in top-left of form panel showing Mode B variant** (small 280×180 reference card, similar to F14m1's Add-mode thumbnail):
- Header: "MODE B · PASSWORD RESET"
- Sub: "Available from 'Forgot password' link on F06"
- Mini-preview of Reset header + "priya.s@iksula.com" mono + two password field skeletons
- Footer stub: "Reset password →" teal mini-button

### Error empty-states (document as design variants, render at least one inline)

**Expired token:**
- Full form replaced with centered empty-state card:
  - ⚠️ amber warn icon 48×48
  - Title: "**This link has expired**" DM Sans 20/28
  - Body: "Invitation links expire after 7 days. Ask **Yogesh M.** (your Lead) to resend, or request a new one." Inter 13/20 secondary
  - Buttons: "**Request new link**" teal primary + "Go to sign in →" tertiary ghost

**Already-used token:**
- Centered card: ✓ teal icon
  - Title: "**This link was already used**"
  - Body: "Your password has already been set. Sign in with your email and password."
  - Button: "**Go to sign in →**" teal primary

**Invalid token:**
- Centered card: ✕ red icon
  - Title: "**This link is invalid**"
  - Body: "The link may be malformed or the URL was copied incorrectly."
  - Button: "Go to sign in →" teal primary

**Success state (brief transitional):**
- Form replaces with centered card: ✓ green 48×48 + "**Password set successfully**" + "Signing you in…" Inter 13/20 tertiary + small teal progress spinner
- Auto-redirect after 1.5s: Mode A → F07, Mode B → F06 with email pre-filled

### Interactions

- Type in Field 1 → strength meter + requirements list animate in real time (debounced 150ms)
- Type in Field 2 → inline match validation after first full character (red error if mismatch)
- Click eye-toggle icon → toggles password visibility for that field only (default obscured)
- Click Set/Reset password → validates client-side first, then POSTs with token; loading spinner on button during submission
- Press Enter inside either field → submits if valid
- Click "Back to sign in" (Mode B) → F06 Sign In with the reset-email pre-filled

### Accessibility

- Focus order: email (if shown Mode B, usually pre-filled read-only) → password field → confirm field → eye-toggles → submit → footer links
- Strength meter + requirements list announced by screen reader (aria-live polite)
- Password visibility toggle announced ("Show password" / "Hide password")
- All form errors associated with their field via aria-describedby
- Submit button disabled state announced ("Submit disabled, complete password requirements")
- Color + icon (not color alone) for strength meter and requirements checkmarks
- 4.5:1 contrast on all text; teal focus rings 2px offset

### Realistic data

- Mode A: user "Priya S." invited to Iksula Returns + Iksula Commerce projects by Yogesh M. · invite link expires in 23h 14m · token `eyJhbGc...` (truncated mono)
- Mode B: existing user `priya.s@iksula.com` requested password reset · token expires in 1h (faster expiry for reset vs invite)
- Organization: Iksula Services Pvt Ltd
- Strength example: "RefundFlow2026!" = Strong, all 4 requirements ✓

### Anti-drift constraints

1. **Reuse F06 Left Brand Panel verbatim.** Same Evidence Mesh constellation, same constellation values (75 dots, 0.50/0.22 opacity, 90px distance, 4px anchors). Do not redesign the background.
2. **Primary = teal `#2DD4BF`** (Set/Reset password CTA, "Go to sign in" CTA on error cards, focus rings). Secondary = violet `#A78BFA` NOT used on this frame — no AI on auth pages.
3. **Password strength meter colors are semantic, not brand:** red/amber/teal/green map to Weak/Fair/Good/Strong using the semantic palette (`#F87171`, `#FBBF24`, `#2DD4BF`, `#34D399`). The "Good" tier uses teal — this is OK because teal is already the system-accent color and the meter reads as progress toward a system-approved state, not as an AI indicator.
4. **No SSO / no Google / no Microsoft buttons** — PM1 is email+password only. Setting a password is the only auth credential step.
5. **Token countdown** must show live (JS setInterval updates every minute). If <2 hours, amber warning color.
6. **No logged-in shell elements** (no top bar, no rail, no avatar). User is not yet authenticated.

### Stitch prompt (copy-paste)

```
You are designing F06b — Set / Reset Password, a dual-mode authentication page for QA Nexus PM1. It handles both invite-acceptance (Mode A: new user setting first password) and password reset (Mode B: existing user after forgot-password flow). Same shell, small copy differences. Canvas 1600×1024 with 800/800 split matching F06 Sign In.

LEFT BRAND PANEL (800×1024) — REUSE F06 VERBATIM: Evidence Mesh constellation on #0B0F17 canvas · 75 dots at 0.50 opacity · connecting lines at 0.22 opacity · 90px connection distance · 4px anchor dots with glow · teal #2DD4BF and violet #A78BFA tinted lines · no eyebrow label.

RIGHT FORM PANEL (800×1024):
- QA Nexus logo top-left
- Context header (render Mode A as primary): "Welcome, Priya!" DM Sans 32 bold + sub "Set a password to activate your QA Nexus account." Inter 15 secondary. Also render Mode B as a 280×180 thumbnail reference card in top-right of form panel showing "MODE B · PASSWORD RESET" for priya.s@iksula.com.
- Form max-width 400px: New password field (eye-toggle) + Confirm password field
- Password strength card (appears after typing): 4-segment meter (red/amber/teal/green) + "Good" label + 4-item requirements checklist (8+ chars ✓, uppercase ✓, number ✓, special ○)
- CTA: "Set password →" teal primary 48px full-width, enabled state (3 of 4 requirements met with strong match)
- Footer: "Link expires in 23 hours 14 minutes" JetBrains Mono tertiary + "Back to sign in" ghost link (Mode B only, not in Mode A render)

DESIGN TOKENS: Canvas #0B0F17, base #111827, raised #1A2233. Text primary #F1F5F9 / secondary #C7D0DC / tertiary #8A94A6. Primary teal #2DD4BF. Semantic red #F87171 / amber #FBBF24 / green #34D399. Typography: Inter (UI), DM Sans (headings 18+), JetBrains Mono (email, token countdown, mono identifiers).

ANTI-DRIFT: No SSO buttons. No violet on this frame (no AI on auth). No authenticated shell (no top bar / no rail / no avatar). Reuse F06 constellation exactly.

Validation checklist: (1) 1600×1024 split 800/800 · (2) Brand panel identical to F06 · (3) Welcome header with "Priya" in weight 700 + subcopy · (4) Mode B thumbnail reference top-right · (5) Two password fields with eye-toggles · (6) Strength meter 3/4 teal filled + "Good" label · (7) 4 requirements with 3 checked ✓ green · (8) Set password CTA enabled teal primary · (9) "Link expires in 23 hours 14 minutes" mono tertiary footer · (10) No SSO / no violet / no logged-in shell · (11) Focus rings on all interactives · (12) Semantic palette on strength meter, not AI violet

Generate ONLY this frame. Do not auto-generate any subsequent frame. After rendering, list the validation checklist and wait for my explicit approval.
```

---

## §3. Frame F07 — Workspace-Founder Onboarding (Lead/Admin founder only)

### Front matter
- **ID:** F07
- **Role gate:** Lead, Admin — ONLY the workspace founder (the person who creates the workspace). Invited Leads/Admins see F07b Mode C instead.
- **Canvas:** 1600 × 1024
- **Shell:** Top bar only (project switcher disabled, no left rail). Main canvas shows stepper + step content.
- **Trigger condition:** `user.first_login === true && user.onboarding_type === 'workspace_founder' && workspace.projects.length === 0`
- **Entry:** From F06b Mode A success (Day-0 bootstrap magic link) → F07
- **Exit routing (Pattern A — deferred, v2.2 canonical):** All data-source flows run AFTER Step 3 submits, not during Step 2. Selection in Step 2 is stored as wizard state only. On Step 3 submit:
  1. Backend atomically creates the project + sends team invites in a single transaction
  2. THEN routes to the data-source flow with `project_id` already in DB:
     - If Step 2 = "Connect to Jira" → F11a Step 1 Authorize → F11b → F11c → F09 Projects List
     - If Step 2 = "Upload files" → F12 Screen 2 (Upload Form, method pre-selected) → F13 Imported Files → F09
     - If Step 2 = "Start blank" → F09 Projects List directly (project appears empty)
  3. `first_login` flips to FALSE regardless of data-source completion
  4. If user abandons the Jira wizard mid-flow, the project + invites still exist — no orphaned state

### Purpose
Three-step stepper for the **workspace founder** (first Admin who sets up the workspace). Steps: (1) Create first project · (2) Choose data source · (3) Invite team. Steps 1–3 run in the wizard. Data-source flow (Jira OAuth / file upload) fires AFTER Step 3 submits so invites go out ASAP and project exists before any external-system flow begins. Invited Leads/Admins do NOT see F07 — they see F07b Mode C with a welcome + tour instead.

### Content regions

**Top bar (56px):** Project switcher disabled ("No project" placeholder, `#8A94A6`). All other slots grayed, opacity 0.4, tooltip "Available after first project creation."

**Main canvas (1328 × 912, padding 32px):**

1. **Question header (80px):** "Let's set up your first project and invite your team." (DM Sans 32/40) + "Follow 3 quick steps to get your team working in QA Nexus." (Inter 16/24, secondary). Margin-bottom 48px.

2. **Stepper (60px):** Three circles (40×40, background violet-500, content "1"/"2"/"3", Geist Mono 18/500 white, centered). When complete: background green `#34D399`, checkmark. Labels below ("Create Project" / "Choose Data Source" / "Invite Team", Inter 12/500, `#F1F5F9`). Connector lines (60px long, 1px, color `#3B4660`). When predecessor complete: color green. Inactive steps: opacity 0.4. Margin-bottom 48px.

3. **Active step content (700px, flex column):**

   **Step 1 — Create Project:**
   - Title: "1. Create your first project" (DM Sans 20/500)
   - Subtitle: "This is where you'll manage all test cases, runs, and defects for one product." (Inter 14/400, secondary)
   - Fields (16px gap):
     - **Project name** (required): label uppercase, "*" red, text input max 600px height 40px background raised border subtle focus: violet. Placeholder "e.g., Iksula Commerce". Async duplicate check: red border + error if duplicate. Margin-bottom 16px.
     - **Description** (optional): label uppercase, textarea 100% height 80px. Placeholder "What is this project for? (optional)". Character counter bottom-right "0 / 500" (Geist Mono 11, tertiary). Max 500 chars. Margin-bottom 16px.
     - **Project icon** (optional): label uppercase. Horizontal row 8 avatar options (40×40 each), letter + color gradient. Selected: 2px ring violet-500, others 1px border subtle. Auto-select first combo. Margin-bottom 16px.
     - **Jira project key** (optional): label uppercase. Text input max 300px, placeholder "e.g., COM, PAY, MOB" (uppercase). Hint: "If your team uses Jira, linking helps sync issues directly. (Optional)" (Inter 12/400, secondary). Validation on blur: green checkmark if valid, orange warning if not, gray "Not connected" if Jira not authorized. Margin-bottom 16px.
   - Button row (margin-top 32px): "Skip for now" (ghost, violet) | "Continue to Step 2" (primary, disabled if name empty).

   **Step 2 — Choose Data Source:**
   - Title: "2. Choose a data source" (DM Sans 20/500)
   - Subtitle: "How do you want to populate your first project?" (Inter 14/400, secondary)
   - Three radio cards (width 100% max 600px, height 120px, background raised `#1A2233`, border subtle, radius 8px, padding 16px, flex row):
     - **Option 1 — Connect to Jira:** Radio (left, 20×20, hollow, filled violet when selected) + title "Connect to Jira" (Inter 14/500) + description "Fetch issues, stories, and test plans from your existing Jira project. Bi-directional sync enabled." (Inter 13/400, secondary) + chip right "Recommended if you use Jira" (teal background 10%, border teal 28%, Inter 11/500). Hover: border violet, cursor pointer. Selected: border 2px violet, background violet 5% opacity. Margin-bottom 12px.
     - **Option 2 — Upload files:** Same layout, no chip. Description: "Drag and drop requirement docs, test cases from Excel/CSV, or export files from TestRail, Zephyr, Xray, qTest."
     - **Option 3 — Start blank:** Same layout. Description: "Create an empty project and add content as you go. Best for new teams or greenfield projects."
   - Button row (margin-top 32px): "Back to Step 1" (ghost) | "Continue to Step 3" (primary, label changes based on selection).

   **Step 3 — Invite Team:**
   - Title: "3. Invite your team" (DM Sans 20/500)
   - Subtitle: "Add team members to start collaborating. You can invite more later." (Inter 14/400, secondary)
   - Email chip input: label uppercase. Container width 100% max 600px, min-height 100px, background raised, border subtle, radius 8px, padding 10px 12px. Chips (each email): background overlay `#232C3F`, border subtle, padding 4px 10px, radius 16px, X icon right (click removes). Text input: transparent, border none, placeholder "Enter email and press Enter". User: type email → Enter → validate → add chip → clear. Invalid: tooltip "Invalid email format" red text. Margin-bottom 16px.
   - Role selector: label uppercase. Dropdown width 100% max 300px, background raised, border subtle, options "QA Engineer" (default) / "QA Lead" / "Admin" / "Stakeholder". Hint: "All invited users will receive this role. You can change roles individually after sending invites." (Inter 12/400, secondary). Margin-bottom 24px.
   - "Ready to invite:" section (if emails): list email + role pairs (email chip left, role label right Geist Mono 11, tertiary).
   - Button row (margin-top 32px): "Back to Step 2" (ghost) | "Create project & send invites" (primary, disabled if no emails optional).

### States
- **Normal:** Step 1 active, steps 2/3 inactive (opacity 0.4).
- **Step complete:** Circle green, checkmark, next step active, content fades (200ms).
- **Loading:** Spinner in button, all fields disabled, "Creating project…".
- **Success:** Stepper fades out, redirect F09, new project pinned/highlighted (200ms slide-in).
- **Error:** Error message red text + icon + left border, button normal.
- **Empty Step 3:** "Create project only" option if user skips invites.

### Accessibility
- Tab order: project name → description → icon picker → Jira key → back → next (step 1) → radio cards (step 2) → back → next → email input → role dropdown → invite list → back → finish.
- Focus ring: violet 2px, offset 2px.
- Color-not-only: Stepper uses color + icons + text; validation uses red + icon + border; radio uses border + background + text.
- Screen reader: `aria-current="step"` on stepper, form labels associated, error in `role="alert"`, radio `role="radio"` + `aria-checked`, chips `role="list"` + `aria-label="Remove [email]"`.
- Reduced motion: disable fade/in out, keep content visible.

### Realistic data
- Step 1: Project "Iksula Commerce", Description "E-commerce platform - test cases, runs, and defect management for mobile and web.", icon "I" (violet+teal), Jira key "COM".
- Step 2: "Connect to Jira" selected.
- Step 3: Priya S (priya.sharma@iksula.com, QA Engineer), Rahul K (rahul.kumar@iksula.com, QA Lead), Arjun M (arjun.mehta@iksula.com, QA Engineer).

### Stitch prompt
```
Design frame F07 - First-Run Onboarding. Three-step stepper for Lead/Admin creating first project and inviting team. QA Engineers skip directly to F08a.

Canvas 1600 × 1024. Shell: top bar only (project switcher "No project" disabled, all other slots grayed 0.4 opacity). No left rail (no projects yet).

Main canvas (padding 32px):
1. Question header (80px): "Let's set up your first project and invite your team." (DM Sans 32/40, primary) + "Follow 3 quick steps to get your team working in QA Nexus." (Inter 16/24, secondary, margin-top 8px). Margin-bottom 48px.

2. Stepper (60px horizontal):
   - 3 step circles (40×40 each), background violet-500, content "1"/"2"/"3" (Geist Mono 18/500, white, centered).
   - When complete: background green `#34D399`, checkmark icon.
   - Labels below: "Create Project" / "Choose Data Source" / "Invite Team" (Inter 12/500, primary).
   - Connector lines (60px long, 1px): color `#3B4660` inactive, green when predecessor complete.
   - Inactive steps: opacity 0.4, tertiary text.
   - Margin-bottom 48px.

3. Active step content (700px flexible, flex column):

   **Step 1 — Create Project:**
   - Title: "1. Create your first project" (DM Sans 20/500, primary)
   - Subtitle: "This is where you'll manage all test cases, runs, and defects for one product." (Inter 14/400, secondary)
   - Form (stack, 16px gap):
     a) Project name (required): label "Project name *" (Inter 12 uppercase, `#8A94A6`, red *), text input width 100% max 600px height 40px, background raised `#1A2233`, border subtle, padding 10px 12px, radius 8px, focus: border strong `#3B4660`. Placeholder "e.g., Iksula Commerce". Async duplicate check (debounce 300ms): red border + error below if duplicate. Margin-bottom 16px.
     b) Description (optional): label "Description" (uppercase, no *), textarea 100% height 80px, same styling. Character counter bottom-right "0 / 500" (Geist Mono 11, tertiary). Max 500 enforced. Margin-bottom 16px.
     c) Project icon: label "Project icon" (uppercase). Picker: 8 avatar options (40×40 each), letter + gradient color. Selected: 2px ring violet-500, others 1px subtle. Auto-select first combo. Margin-bottom 16px.
     d) Jira project key (optional): label "Jira project key" (uppercase, no *), text input width 100% max 300px, placeholder "e.g., COM, PAY, MOB" (uppercase). Hint: "If your team uses Jira, linking helps sync issues directly. (Optional)" (Inter 12/400, secondary). Validation on blur: green checkmark if valid, orange warning if not, gray "Not connected" if Jira not authorized. Margin-bottom 16px.
   - Button row (margin-top 32px): [ghost "Skip for now" violet border] [primary "Continue to Step 2" violet background, disabled if name empty].

   **Step 2 — Choose Data Source:**
   - Title: "2. Choose a data source" (DM Sans 20/500)
   - Subtitle: "How do you want to populate your first project?" (Inter 14/400, secondary)
   - Three radio cards (stack, 12px gap, width 100% max 600px, height 120px, background raised `#1A2233`, border subtle, radius 8px, padding 16px, flex row):
     a) Connect to Jira: radio circle (left, 20×20, hollow, filled violet selected) + title "Connect to Jira" (Inter 14/500, primary) + description "Fetch issues, stories, and test plans from your existing Jira project. Bi-directional sync enabled." (Inter 13/400, secondary, max-width 500px) + chip right "Recommended if you use Jira" (teal background 10%, border teal 28%, color teal, radius 16px, Inter 11/500). Hover: border violet, cursor pointer. Selected: border 2px violet, background linear-gradient violet 5%.
     b) Upload files: same layout, no chip. Description: "Drag and drop requirement docs, test cases from Excel/CSV, or export files from TestRail, Zephyr, Xray, qTest."
     c) Start blank: same layout. Description: "Create an empty project and add content as you go. Best for new teams or greenfield projects."
   - Button row (margin-top 32px): [ghost "Back to Step 1" violet] [primary label varies: "Next: Connect Jira" / "Next: Upload Files" / "Next: Invite Team" based on selection, disabled if no option].

   **Step 3 — Invite Team:**
   - Title: "3. Invite your team" (DM Sans 20/500)
   - Subtitle: "Add team members to start collaborating. You can invite more later." (Inter 14/400, secondary)
   - Email chip input: label "Team member emails" (Inter 12 uppercase, `#8A94A6`), container width 100% max 600px min-height 100px, background raised, border subtle, radius 8px, padding 10px 12px. Flex row wrap: chips (email, background overlay `#232C3F`, border subtle, padding 4px 10px, radius 16px, Inter 12/400, X icon right removes chip) + text input (transparent background, border none, Inter 14/400, placeholder "Enter email and press Enter"). Behavior: type email → Enter → validate format → add chip → clear input. Invalid: tooltip "Invalid email format." red text. Margin-bottom 16px.
   - Role selector: label "Default role for invites" (Inter 12 uppercase), dropdown width 100% max 300px, background raised, border subtle, padding 10px 12px, radius 8px. Options: "QA Engineer" (default) / "QA Lead" / "Admin" / "Stakeholder". Hint: "All invited users will receive this role. You can change roles individually after sending invites." (Inter 12/400, secondary). Margin-bottom 24px.
   - "Ready to invite:" section (if emails added): title (Inter 13/500, tertiary), list rows (email chip left + role Geist Mono 11 right), 12px gap.
   - Button row (margin-top 32px): [ghost "Back to Step 2" violet] [primary "Create project & send invites" violet, disabled if no emails (optional: user can create without invites). On click: POST /projects, show spinner "Creating project…", on success redirect to F09].

Transitions: Between steps, content fades (200ms accelerate), new step fades in (200ms decelerate), stepper updates (circle color/checkmark, connector animates green).

Design tokens: Canvas operate `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`. Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`. Brand: violet-500 `#A78BFA`, violet-600 `#8B5CF6`, teal-500 `#2DD4BF`. Semantic: pass green `#34D399`, fail red `#F87171`. Borders: subtle `#2A3347`, strong `#3B4660`. Typography: DM Sans (display), Inter (UI), Geist Mono (metrics).

States: Normal (step 1 active, 2/3 inactive opacity 0.4), Step complete (circle green, checkmark, next active), Loading (spinner, fields disabled, "Creating project…"), Success (fade out, F09 redirect), Error (error banner red, button normal).

Accessibility: Tab order project name → description → icon picker → Jira key → back → next (step 1) → radio cards (step 2) → back → next (step 2) → email input → role dropdown → invite list → back → finish. Focus ring violet 2px offset 2px. Color-not-only: stepper color + icons + text; validation red text + icon + border; radio border + background + text. Form labels associated. Error messages `role="alert"`. Radio options `role="radio"` + `aria-checked`. Email chips `role="list"` + items `role="listitem"`. Reduced motion: disable fade animations, keep content visible.

Realistic data: Step 1 project "Iksula Commerce", description "E-commerce platform...", icon "I" (violet+teal), Jira "COM". Step 2 "Connect to Jira" selected. Step 3 invites: Priya S (priya.sharma@iksula.com, QA Engineer), Rahul K (rahul.kumar@iksula.com, QA Lead), Arjun M (arjun.mehta@iksula.com, QA Engineer).

Apply 01_SYSTEM.md. Do NOT use Material Design 3 tokens. Hardcode hex. Primary=#2DD4BF, Secondary=#A78BFA. No tertiary. No left rail (no projects yet). Top bar slots disabled. PM1 M0/M1 delivery.
```

---

> **Split note (v2.6, 2026-04-24):** F07b was originally spec'd as a tri-mode frame covering QA Engineer / Stakeholder / Invited Lead-Admin in one shell. During review we decided each role deserves its own dedicated frame and validation pass, so F07b was split into three separate frames: **F07b** (Invited QA Engineer First-Run), **F07c** (Invited Stakeholder First-Run), **F07d** (Invited Lead/Admin First-Run). The three share the same shell structure (top bar, welcome header, workspace context strip, first-action picker pattern, skip link) — the differences are role-specific content in the middle region and destination routing per first-action card.

## §3b. Frame F07b — Invited QA Engineer First-Run (v2.2 NEW, split v2.6)

### Front matter
- **ID:** F07b
- **Added:** v2.2 (2026-04-24), split out v2.6 (was F07b Mode A)
- **Title:** Invited QA Engineer First-Run Onboarding
- **Role gate:** QA Engineer only (invited members — not the workspace founder)
- **Canvas:** 1600 × 1024
- **Shell:** Top bar (logo only, project switcher disabled, no rail yet) + single-screen welcome canvas
- **Trigger condition:** `user.first_login === true && user.role === 'QA Engineer' && user.onboarding_type === 'invited_member'` — fires exactly once per user
- **Entry Points:**
  - F06b Mode A success (invite setup complete) → F07b
  - F06 Sign In first login (if F06b was bypassed for manual password creation) → F07b
- **Exit Points:**
  - First-action Card 1 "Create your first test case" → F16a Test Case Editor (blank)
  - First-action Card 2 "Review pending AI suggestions" → F17 Test Case Library (filtered to A1 drafts)
  - First-action Card 3 "Explore the workspace" → F08a Home QA Engineer
  - Skip link → F08a Home QA Engineer

### Purpose
Fills the UX gap between F06b (password set) and F08a (data-dense Home) for newly-invited QA Engineers. Gives them a warm welcome, role confirmation, AI agent introduction (A1/A2/A4), and a first-action picker. Renders exactly once per user — after F07b, the user's `first_login` flag flips to false and all subsequent logins go directly to F08a.

**Siblings (split v2.6):**
- **F07c** — Invited Stakeholder First-Run (no AI agent tour, dashboard-focused instead)
- **F07d** — Invited Lead/Admin First-Run (same agent tour + Govern access note)

All three share the top-bar/welcome-header/workspace-context/first-action-picker pattern but differ in middle-region content and first-action routing.

### Content regions (single-screen, no wizard — vertical stack)

**Top Bar (56 px):**
- QA Nexus logo left
- No project switcher (user hasn't chosen a project context yet)
- Right: user avatar + name (e.g., "PS Priya S.") with no role-pill yet (role confirmation is part of the body content below)

**Region 1 — Welcome Header (200 px, 48px top padding, centered)**
- Large violet sparkle glyph ✨ (48×48) above heading
- Title: "**Welcome to QA Nexus, Priya!**" — DM Sans 32/40 weight 700, centered, primary · user name in weight 700 teal highlight
- Subtitle (Mode A): "You're a **QA Engineer** on Iksula Returns · Iksula Commerce" — Inter 15/22 tertiary, role name in weight 600 primary
- Subtitle (Mode B): "You're a **Stakeholder** on Iksula Returns · Iksula Commerce"
- Subtitle (Mode C): "You're a **QA Lead** on Iksula Returns · Iksula Commerce"
- Sub-subtitle: "Invited by **Yogesh M.** · 2 min ago" — Inter 12/18 tertiary

**Region 2 — Workspace Context Strip (60 px, raised bg, 12px radius, 16px padding, horizontal row)**
- Label "WORKSPACE" (Inter 11/16 uppercase tertiary) + "Iksula Services Pvt Ltd" (Inter 13/18 primary weight 500)
- Divider dot
- Label "INVITED BY" + "Yogesh M. (QA Lead)" with YM avatar 20×20
- Divider dot
- Label "PROJECTS" + "Iksula Returns · Iksula Commerce" primary
- Divider dot
- Label "FIRST LOGIN" + "Just now" mono tertiary

**Region 3 — AI Agent Tour (THIS IS THE QA ENGINEER AGENT TOUR)**

Header row (40px top gap):
- "MEET YOUR AI TEAMMATES" (Inter 11/16 uppercase tertiary letter-spaced)
- Sub: "You're in charge — AI suggests, you decide." Inter 13/20 secondary italic

3 agent cards in a row (each ~320 × 240 px, 24px gap, centered):

**Card 1 — A1 Test Case Generator**
- Top: ✨ violet sparkle 32×32 + "A1" violet pill mini (JetBrains Mono 11 uppercase)
- Title: "**Test Case Generator**" DM Sans 18/24 bold primary
- Description: "Drafts test cases from requirements, Figma mocks, and Jira stories. Generates step-by-step instructions in BDD or traditional format." Inter 13/20 secondary
- "YOU'LL" strip at bottom: "Review · Edit · Approve or send back for revision" Inter 12/18 primary weight 500
- Violet-accent border on hover

**Card 2 — A2 Duplicate Detection**
- Top: ✨ violet + "A2" pill
- Title: "**Duplicate Detection**"
- Description: "Scans test cases and flags semantic duplicates — even when wording differs. Prevents test bloat as your suite grows."
- "YOU'LL": "Approve the merge · Ignore the flag · Dismiss false positives"

**Card 3 — A4 Defect Intelligence**
- Top: ✨ violet + "A4" pill
- Title: "**Defect Intelligence**"
- Description: "5-Layer Root Cause Analysis on failures. Weighs stack trace (90%), environment (80%), config (60%), code (50%), data (40%) to pinpoint the real cause."
- "YOU'LL": "Triage faster · Trust the weighted signals · Override when context matters"

Below cards: "Learn more about AI Agents →" tertiary violet link → F26 Agents (but in PM1 this routes to an about page stub)

**Region 4 — First-Action Picker (3 cards row, 360 × 200 each, 24px gap, 48px top gap)**

Header row:
- "HOW DO YOU WANT TO START?" (Inter 11/16 uppercase tertiary)
- Right: "Skip setup — go to my queue →" tertiary link

3 cards:

Card 1 (teal accent) — "**Create your first test case**"
- Icon: pencil 32×32 teal
- Description: "Start with the blank editor. Use BDD or traditional format. A1 suggestions appear inline while authoring."
- Chip: "~5 min"
- CTA: "**Start creating →**" teal primary 40px full-width → F16a Test Case Editor (blank)

Card 2 (teal accent) — "**Review pending AI suggestions**"
- Icon: inbox 32×32 teal
- Description: "**4** A1-drafted test cases for RET-137 are awaiting your review. Accept, edit, or send back for revision."
- Chip: "~10 min · 4 items"
- CTA: "Open review queue →" teal primary → F17 Test Case Library (filtered to A1 drafts)

Card 3 (gray accent) — "**Explore the workspace first**"
- Icon: compass 32×32 tertiary
- Description: "Tour the home page, left rail, and mode toggle at your own pace. You can come back to actions anytime."
- Chip: "Self-paced"
- CTA: "Go to Home →" secondary ghost → F08a Home QA Engineer

**Region 5 — Skip / Continue Row (32 px, centered, 32px top gap)**
- Divider line with centered "OR" mono tertiary label
- "Skip and go to my queue →" tertiary teal link → F08a
- Small footer below: "You can access this tour again from Settings → Help" Inter 11/16 tertiary

### States to render
- Primary composition: full F07b view with AI agent tour + 3 first-action cards for Priya S. (QA Engineer)
- All elements populated with realistic data
- No thumbnails of other modes — F07c and F07d are separate frames now (split v2.6)

### Interactions
- Click any first-action card → routes as noted, marks `user.first_login = false`, onboarding never shows again
- Click "Skip and go to my queue →" → routes to F08a, still marks first_login = false
- Click "Learn more about AI Agents →" → routes to F26 (in PM1, a lightweight agents overview)
- Hover on agent cards → subtle violet border accent, slight elevation lift
- Mode toggle NOT visible (user is not in Operate/Review/Prove context yet)

### Accessibility
- Focus order: workspace context strip links → agent cards → first-action cards → skip link → help footer
- Agent cards announced with "AI agent A1, Test Case Generator. You will review, edit, and approve drafts."
- Role confirmation announced on page load (aria-live polite): "You are a QA Engineer on Iksula Returns and Iksula Commerce"
- Skip link is keyboard-first-reachable (tabindex 1) so power users can bypass immediately

### Realistic data
- User: Priya S. (QA Engineer) — avatar PS violet, new invite
- Workspace: Iksula Services Pvt Ltd
- Invited by: Yogesh M. (QA Lead) 2 min ago
- Projects: Iksula Returns, Iksula Commerce
- 4 pending A1 suggestions on RET-137 (matches F14 data)
- First-login timestamp: "Just now"

### Anti-drift constraints
1. **Primary = teal `#2DD4BF`** for first-action CTAs (Create / Open / Go). **Secondary = violet `#A78BFA`** for ✨ sparkles + A1/A2/A4 pills + agent-card border accents + "Learn more about AI Agents" link. NEVER on first-action CTAs.
2. NO project switcher in top bar (disabled state — user hasn't chosen project context yet).
3. NO left rail (user hasn't hit their Home yet).
4. NO mode toggle visible (no Operate/Review/Prove context yet).
5. Agent cards are descriptive only — clicking them does NOT start the agent workflow. Only the first-action picker cards route to real screens.
6. Skip link must be prominent and accessible — some users resent forced onboarding.
7. Role gate STRICT: F07b is QA Engineer ONLY. Stakeholders see F07c. Invited Leads/Admins see F07d. Workspace founders see F07.
8. Only renders ONCE per user (first_login flag).
9. No PM3 features (no SSO welcome, no A3/A5/VCG agent mentions — those ship in PM3).

### Stitch prompt (copy-paste)

```
You are designing F07b — Invited QA Engineer First-Run Onboarding for QA Nexus PM1. Single-screen welcome canvas (NOT a wizard). Canvas 1600 × 1024. Top bar with logo only (no project switcher, no rail, no mode toggle).

HERO (200px centered): violet ✨ 48×48 + "Welcome to QA Nexus, Priya!" DM Sans 32/700 + "You're a QA Engineer on Iksula Returns · Iksula Commerce" Inter 15 tertiary (role name in weight 600 primary) + "Invited by Yogesh M. · 2 min ago" Inter 12 tertiary

WORKSPACE STRIP (60px raised card): WORKSPACE · Iksula Services Pvt Ltd · INVITED BY · Yogesh M. (QA Lead) · PROJECTS · Iksula Returns · Iksula Commerce · FIRST LOGIN · Just now

AI AGENT TOUR (3 cards 320×240, 24px gap):
- A1 Test Case Generator (violet pill A1, sparkle) · "Drafts test cases from requirements, Figma mocks, Jira stories" · "YOU'LL: Review · Edit · Approve"
- A2 Duplicate Detection · "Scans for semantic duplicates even when wording differs" · "YOU'LL: Approve merge · Ignore · Dismiss false positives"
- A4 Defect Intelligence · "5-Layer RCA weighing stack 90% → env 80% → config 60% → code 50% → data 40%" · "YOU'LL: Triage faster · Trust signals · Override when needed"
Footer link: "Learn more about AI Agents →" violet tertiary

FIRST-ACTION PICKER (3 cards 360×200 row):
- Card 1 teal "Create your first test case" · pencil icon · "~5 min" · "Start creating →" teal primary → F16a
- Card 2 teal "Review pending AI suggestions" · inbox icon · "4 A1 drafts for RET-137 await review" · "~10 min · 4 items" · "Open review queue →" teal primary → F17
- Card 3 gray "Explore the workspace first" · compass · "Self-paced" · "Go to Home →" secondary ghost → F08a

SKIP ROW (bottom): Divider with OR label + "Skip and go to my queue →" tertiary teal link → F08a + "You can access this tour again from Settings → Help" Inter 11 tertiary footer

DESIGN TOKENS: Canvas #0B0F17, base #111827, raised #1A2233. Primary teal #2DD4BF · Secondary violet #A78BFA (AI-ONLY: ✨ + agent pills + agent-card borders + Learn-more link). Inter · DM Sans 20+ · JetBrains Mono (user name, timestamps, counts).

ANTI-DRIFT: No SSO. No left rail. No project switcher. No mode toggle. First-action CTAs are TEAL (system actions). Only ✨ and agent tour elements are violet. Skip link prominent. Role gate STRICT: F07b is QA Engineer ONLY — Stakeholders go to F07c, invited Leads/Admins go to F07d.

Validation: (1) 1600×1024 with top bar only · (2) Welcome header with Priya name + role confirmation + inviter + timestamp · (3) Workspace strip with 4 labeled fields · (4) 3 agent cards with A1/A2/A4 violet pills + violet sparkles · (5) 3 first-action cards with teal CTAs · (6) Skip link + help footer · (7) No authenticated shell beyond logo · (8) No violet on first-action CTAs · (9) Focus rings + tab order skip-first · (10) Role gate QA Engineer only (no thumbnails of other role variants)

Generate ONLY this frame. Wait for approval before next.
```

---

## §3c. Frame F07c — Invited Stakeholder First-Run (v2.2 NEW, split v2.6)

### Front matter
- **ID:** F07c
- **Added:** v2.2 (2026-04-24), split out v2.6 (was F07b Mode B)
- **Title:** Invited Stakeholder First-Run Onboarding
- **Role gate:** Stakeholder only (invited members — not the workspace founder)
- **Canvas:** 1600 × 1024
- **Shell:** Top bar (logo only, project switcher disabled, no rail yet) + single-screen welcome canvas. Shell is identical to F07b.
- **Trigger condition:** `user.first_login === true && user.role === 'Stakeholder' && user.onboarding_type === 'invited_member'`
- **Entry Points:**
  - F06b Mode A success (invite setup complete) → F07c
  - F06 Sign In first login (if F06b was bypassed) → F07c
- **Exit Points:**
  - First-action Card 1 "View AI Value dashboard" → F24 QA Value Dashboard (Prove mode ivory)
  - First-action Card 2 "Browse this week's reports" → F23 Reports (filtered to weekly)
  - First-action Card 3 "Explore the dashboard" → F08b Home Dashboard (Stakeholder view)
  - Skip link → F08b Home Dashboard

### Purpose
Stakeholders (PM, business, exec) don't work in the test execution flow — they consume outcomes. F07c replaces the QA Engineer agent tour with a **dashboard-focused tour** (AI Value / Reports / Approvals) and routes first-actions to outcome-focused views, not authoring tools.

### Content regions (only differences from F07b noted — rest is identical shell)

**Region 1 — Welcome Header:** Same as F07b, but role sub-line reads "You're a **Stakeholder** on Iksula Returns · Iksula Commerce" (role name in weight 600 primary).

**Region 2 — Workspace Context Strip:** Identical to F07b.

**Region 3 — Dashboard Tour (replaces AI Agent Tour)**
Header: "WHAT YOU'LL SEE" (Inter 11/16 uppercase tertiary) + sub "Your stakeholder view focuses on outcomes, not execution." italic secondary

3 dashboard cards (320 × 240 each, teal accent — NO violet, no AI agent pills):
- **Card 1 — QA Value Dashboard**
  - Top: 📊 teal icon 32×32 + "QA VALUE" teal pill mini
  - Title: "**AI Impact & ROI**" DM Sans 18/24 bold primary
  - Description: "Cost-avoidance metrics, agent-hour savings, defect-escape reduction. Updated live from team activity." Inter 13/20 secondary
  - "YOU'LL" strip: "Quantify ROI · Report to execs · Track quarterly trends"
- **Card 2 — Executive Reports**
  - Top: 📄 teal + "REPORTS" pill
  - Title: "**Sprint & Release Readiness**"
  - Description: "Weekly sprint reports, release-readiness RAG, trend charts. Auto-generated, review-ready."
  - "YOU'LL": "Review · Approve · Escalate blockers"
- **Card 3 — Approvals Queue**
  - Top: ✓ teal + "APPROVALS" pill
  - Title: "**Strategy Sign-offs**"
  - Description: "Test strategy docs and high-risk test plans awaiting your approval."
  - "YOU'LL": "Approve · Request changes · Comment"

Footnote below cards: "You won't see test execution or defect triage — those live with the QA team." Inter 12/18 tertiary italic

**Region 4 — First-Action Picker (3 cards)**
- Card 1 (teal) — "View AI Value dashboard" · icon: ROI chart · Chip: "~3 min" · CTA: "**Open dashboard →**" teal primary → F24
- Card 2 (teal) — "Browse this week's reports" · icon: document · Chip: "~5 min · 3 new" · CTA: "Open reports →" teal primary → F23 (filtered weekly)
- Card 3 (gray) — "Explore the dashboard first" · compass · Chip: "Self-paced" · CTA: "Go to Dashboard →" secondary ghost → F08b

**Region 5 — Skip Row:** Same as F07b, skip link → F08b.

### Realistic data
- User: Meera R. (Stakeholder, product manager) — avatar MR in semantic gray (PM persona)
- Invited by: Yogesh M. (QA Lead)
- Projects: Iksula Returns, Iksula Commerce
- 3 new reports this week
- Live AI Value: $28.4k cost avoidance YTD (sample)

### Anti-drift constraints
1. **Primary = teal `#2DD4BF`** for all CTAs. **Violet = NOT used on this frame** — Stakeholders don't work with AI agents directly, so no violet indicators needed. This is an important distinction from F07b/F07d where agent tour uses violet.
2. Shell identical to F07b (top bar, welcome header, workspace strip, skip row).
3. Middle region is the dashboard tour (not agent tour).
4. First-action destinations are outcome-focused (F24, F23, F08b) — never F16a/F17.
5. Role gate: Stakeholder only. Never Lead/Admin/QA Engineer.
6. Only renders ONCE per user (first_login flag).

### Stitch prompt (copy-paste)

```
You are designing F07c — Invited Stakeholder First-Run Onboarding for QA Nexus PM1. Single-screen welcome canvas. Canvas 1600 × 1024. Top bar with logo only (no project switcher, no rail, no mode toggle). Shell is identical to F07b but the middle region and first-action destinations differ because Stakeholders work with outcomes, not execution.

HERO (200px centered): teal ✓ 48×48 (not violet — no AI emphasis for Stakeholder) + "Welcome to QA Nexus, Meera!" DM Sans 32/700 + "You're a Stakeholder on Iksula Returns · Iksula Commerce" Inter 15 tertiary (role name weight 600 primary) + "Invited by Yogesh M. · 5 min ago" Inter 12 tertiary

WORKSPACE STRIP (60px raised card): WORKSPACE · Iksula Services Pvt Ltd · INVITED BY · Yogesh M. (QA Lead) · PROJECTS · Iksula Returns · Iksula Commerce · FIRST LOGIN · Just now

DASHBOARD TOUR (3 cards 320×240, 24px gap, TEAL accent — no violet):
- QA Value (teal pill "QA VALUE", ROI chart icon) · "AI Impact & ROI" · "Cost-avoidance metrics, agent-hour savings, defect-escape reduction. Live from team activity." · "YOU'LL: Quantify ROI · Report to execs · Track trends"
- Executive Reports (teal pill "REPORTS", document icon) · "Sprint & Release Readiness" · "Weekly reports, release RAG, trend charts. Auto-generated." · "YOU'LL: Review · Approve · Escalate"
- Approvals Queue (teal pill "APPROVALS", check icon) · "Strategy Sign-offs" · "Test strategy + high-risk test plans awaiting approval." · "YOU'LL: Approve · Request changes · Comment"
Footnote: "You won't see test execution or defect triage — those live with the QA team." tertiary italic

FIRST-ACTION PICKER (3 cards 360×200 row, all TEAL no violet):
- Card 1 teal "View AI Value dashboard" · ROI chart icon · "~3 min" · "Open dashboard →" teal primary → F24
- Card 2 teal "Browse this week's reports" · document icon · "~5 min · 3 new" · "Open reports →" teal primary → F23
- Card 3 gray "Explore the dashboard first" · compass · "Self-paced" · "Go to Dashboard →" secondary ghost → F08b

SKIP ROW (bottom): Divider with OR + "Skip and go to my dashboard →" tertiary teal → F08b + help footer

DESIGN TOKENS: Canvas #0B0F17, base #111827, raised #1A2233. Primary teal #2DD4BF (all CTAs + card accents). NO VIOLET ON THIS FRAME — Stakeholder flow is AI-adjacent, not AI-operational. Inter · DM Sans 20+ · JetBrains Mono (user name, timestamps, counts).

ANTI-DRIFT: No SSO. No left rail. No project switcher. No mode toggle. No violet anywhere (no agent tour). All CTAs teal. Role gate STRICT: F07c is Stakeholder ONLY.

Validation: (1) 1600×1024 with top bar only · (2) Welcome header with Meera name + Stakeholder role + inviter · (3) Workspace strip · (4) 3 dashboard cards (QA Value / Reports / Approvals) all teal-accented, NO violet · (5) Footnote about not seeing execution · (6) 3 first-action cards routing to F24/F23/F08b · (7) Skip link to F08b · (8) No authenticated shell · (9) No violet anywhere on this frame · (10) Focus rings

Generate ONLY this frame. Wait for approval.
```

---

## §3d. Frame F07d — Invited Lead/Admin First-Run (v2.2 NEW, split v2.6)

### Front matter
- **ID:** F07d
- **Added:** v2.2 (2026-04-24), split out v2.6 (was F07b Mode C)
- **Title:** Invited Lead/Admin First-Run Onboarding
- **Role gate:** Lead OR Admin — but ONLY when they were invited to an existing workspace (NOT the workspace founder). The founder sees F07 instead.
- **Canvas:** 1600 × 1024
- **Shell:** Top bar (logo only, project switcher disabled, no rail yet) + single-screen welcome canvas. Shell is identical to F07b/F07c.
- **Trigger condition:** `user.first_login === true && (user.role === 'Lead' || user.role === 'Admin') && user.onboarding_type === 'invited_member'`
- **Entry Points:**
  - F06b Mode A success (invite setup complete) → F07d
  - F06 Sign In first login (if F06b was bypassed) → F07d
- **Exit Points:**
  - First-action Card 1 "View team dashboard" → F08b Home Dashboard (full Lead/Admin view with Govern)
  - First-action Card 2 "Set up integrations" → F11a Jira Wizard Step 1
  - First-action Card 3 "Invite your teammates" → F27 Users & Roles + F27m1 Invite User Modal
  - Skip link → F08b Home Dashboard

### Purpose
Invited Leads and Admins get the SAME AI agent tour as QA Engineers (A1/A2/A4) because they work directly with agents too — they review, approve, and govern AI activity. F07d adds an extra "Govern access note" (you also have Govern + QA Value in the rail) and replaces the first-action picker destinations with leadership-focused entry points (team dashboard, integrations, teammate invites). Close sibling to F07b; main difference is the governance note + routing.

### Content regions (differences from F07b noted)

**Region 1 — Welcome Header:** Same as F07b, but role sub-line reads "You're a **QA Lead** on Iksula Returns · Iksula Commerce" (role in weight 600 primary) or "**Admin**" for Admin invitees. Sub-sub-line adds: "Plus access to **Govern** + **QA Value** sections" Inter 12/18 secondary with violet pill for "Lead+" badge.

**Region 2 — Workspace Context Strip:** Identical to F07b.

**Region 3 — AI Agent Tour:** IDENTICAL to F07b (same 3 cards: A1, A2, A4 with violet sparkles + pills). Leads work with the same agents as QA Engineers.

**Region 3b — Govern Access Strip (NEW, between agent tour and first-action picker, 56px):**
- Raised bg `#1A2233`, 1px subtle border, 12px radius, 16px padding, flex row
- Left: 🛡️ teal shield icon 24×24
- Primary text: "**You also have Govern access**" DM Sans 14/20 bold + "Agents · Integrations · Users & Roles · Settings & Audit" Inter 12/18 secondary
- Right: "Lead+" violet pill (the organizational/RBAC differentiator) + "QA Value" teal pill
- Subtitle below: "Use these to manage the team, approve agent policy, and audit system activity."

**Region 4 — First-Action Picker (3 cards)**
- Card 1 (teal) — "**View team dashboard**" · icon: dashboard · Chip: "~2 min" · CTA: "Open dashboard →" teal primary → F08b Lead/Admin view
- Card 2 (teal) — "**Set up integrations**" · icon: plug/link · Chip: "~5 min · Jira + Slack" · CTA: "Connect tools →" teal primary → F11a (Jira wizard)
- Card 3 (violet) — "**Invite your teammates**" · icon: people · Chip: "~3 min" · CTA: "**Invite people →**" — HERE WE MAKE AN EXCEPTION: this CTA is **teal-filled** (system action, not AI), but the card background has a subtle violet tint to signal the collaborative / people-management nature of the action. → F27 + F27m1 modal

Wait — correction for clarity: Card 3 CTA is TEAL (all first-action CTAs are teal). Card 3 accent color can be gray or teal, not violet. Don't introduce ambiguity.

(Corrected Card 3) — "**Invite your teammates**" · icon: people teal · Chip: "~3 min" · CTA: "Invite people →" teal primary → F27 + F27m1 (modal)

**Region 5 — Skip Row:** Same as F07b, skip link → F08b.

### Realistic data
- User: Ravi K. (QA Lead, invited as co-Lead by Yogesh) — avatar RK in Lead violet
- Invited by: Yogesh M. (Admin + QA Lead)
- Projects: Iksula Returns, Iksula Commerce, Iksula Mobile App (Ravi spans more projects than Priya)
- Govern access: Agents / Integrations / Users & Roles / Settings & Audit
- QA Value access: "Lead+" tier

### Anti-drift constraints
1. **Primary = teal** for all first-action CTAs. **Violet = AI-only** (agent pills, ✨ sparkles, "Learn more about AI Agents" link, "Lead+" organizational role pill). First-action CTAs are teal regardless of card accent.
2. Shell identical to F07b/F07c.
3. Agent tour is identical to F07b — Lead/Admin work with same agents.
4. NEW: Govern Access Strip (Region 3b) between agent tour and first-action picker.
5. First-action destinations are leadership-focused: F08b (team dashboard), F11a (integrations), F27+F27m1 (invites). Never F16a or F17 (those are for individual QA work).
6. Role gate: Lead or Admin, AND `onboarding_type === 'invited_member'`. Workspace founders see F07 instead.
7. Only renders ONCE per user.
8. No PM3 features (no SSO welcome, no A3/A5/VCG agent tour — those ship in PM3).

### Stitch prompt (copy-paste)

```
You are designing F07d — Invited Lead/Admin First-Run Onboarding for QA Nexus PM1. Single-screen welcome canvas. Canvas 1600 × 1024. Top bar with logo only. Shell identical to F07b, with added Govern Access Strip between agent tour and first-action picker. Depict Mode QA Lead with Ravi K. as the invited user.

HERO (200px centered): violet ✨ 48×48 + "Welcome to QA Nexus, Ravi!" DM Sans 32/700 + "You're a QA Lead on Iksula Returns · Iksula Commerce · Iksula Mobile App" Inter 15 tertiary (role weight 600 primary) + sub-sub "Plus access to Govern + QA Value sections" + Lead+ violet pill + QA Value teal pill + "Invited by Yogesh M. · 2 min ago"

WORKSPACE STRIP (60px): WORKSPACE · Iksula Services Pvt Ltd · INVITED BY · Yogesh M. (Admin + QA Lead) · PROJECTS · Iksula Returns · Iksula Commerce · Iksula Mobile App · FIRST LOGIN · Just now

AI AGENT TOUR (3 cards 320×240 identical to F07b): A1 + A2 + A4 with violet sparkles/pills + "YOU'LL" strips + "Learn more about AI Agents →" violet tertiary footer link.

GOVERN ACCESS STRIP (56px raised card, NEW for F07d): 🛡️ teal shield icon + "You also have Govern access" bold + "Agents · Integrations · Users & Roles · Settings & Audit" secondary list + right: Lead+ violet pill + QA Value teal pill + subtitle "Use these to manage the team, approve agent policy, and audit system activity."

FIRST-ACTION PICKER (3 cards 360×200 row, all TEAL CTAs):
- Card 1 teal "View team dashboard" · dashboard icon · "~2 min" · "Open dashboard →" teal primary → F08b
- Card 2 teal "Set up integrations" · plug icon · "~5 min · Jira + Slack" · "Connect tools →" teal primary → F11a
- Card 3 teal "Invite your teammates" · people icon · "~3 min" · "Invite people →" teal primary → F27 + F27m1 modal

SKIP ROW (bottom): Divider with OR + "Skip and go to my dashboard →" tertiary teal → F08b + help footer

DESIGN TOKENS: Canvas #0B0F17, base #111827, raised #1A2233. Primary teal #2DD4BF (all CTAs, Govern icon, QA Value pill). Secondary violet #A78BFA (AI-only: ✨, A1/A2/A4 pills, agent card borders, Lead+ organizational pill, "Learn more about AI Agents" link). Inter · DM Sans 20+ · JetBrains Mono.

ANTI-DRIFT: No SSO. No left rail. No project switcher. First-action CTAs TEAL (never violet — system actions). Govern strip is an informational banner, not interactive. Role gate STRICT: F07d is invited Lead/Admin ONLY — workspace founders go to F07.

Validation: (1) 1600×1024 top bar only · (2) Welcome header with Ravi + QA Lead role + Govern access sub-sub-line + Lead+ violet + QA Value teal pills · (3) Workspace strip with 3 projects · (4) 3 agent cards identical to F07b · (5) Govern Access Strip NEW between agent tour and first-action · (6) 3 first-action cards → F08b / F11a / F27+F27m1 · (7) Skip → F08b · (8) No SSO, no rail, no switcher · (9) Violet only on ✨ + agent pills + Lead+ pill + Learn-more link · (10) Focus rings

Generate ONLY this frame. Wait for approval.
```

---

## §4. Frame F08a — Home QA Engineer (personal queue)

### Front matter
- **ID:** F08a
- **Role gate:** QA Engineer only
- **Canvas:** 1600 × 1024
- **Shell:** Full (rail 272px + top bar 56px + main 1048px + evidence rail 380px)
- **Entry/Exit:** F06 (sign-in), rail Home, after workflow → F15, F17, F19, F20, F21, evidence rail drill-downs

### Purpose
Personal workbench for QA Engineers. Answers: "What needs your attention right now?" Shows assigned cases, active runs, release risk, AI suggestions, work queue with tabs, evidence rail with agent activity and pinned knowledge.

### Content regions

**Question header (64px, below top bar, padding 32px):**
- Left: "What needs your attention right now?" (DM Sans 32/40) + "Your work queue, active runs, and AI suggestions." (Inter 16/24, secondary, margin-top 8px).
- Right: Project glyph + "Iksula Commerce" (Inter 13/500, secondary, clickable) + date "2026-04-23 · Tuesday" (Geist Mono 11, tertiary) + "Synced 2m ago" (caption, tertiary, tooltip shows timestamp).
- Margin-bottom 32px.

**Outcome Board (4 columns, gap 16px, height 360px):**

- **Card 1 — Action Queue:** Title "Action Queue" (Inter 13/500 uppercase, `#8A94A6`), metric "12" (Geist Mono 28/32, primary), trend "+2 vs yesterday" (Geist Mono 12, teal `#2DD4BF`), sparkline 32px tall (last 7 days, green bars), CTA "Open queue →" (Inter 12/500, violet-400, click → F17).

- **Card 2 — Active Runs:** Title "Active Runs", metric "3 running" (Geist Mono 18/24), detail "2 passed, 1 in-progress" (Geist Mono 11, secondary), run meter (5 horizontal bars, green pass 60%, red fail 85%, purple running 100% pulsing), CTA "View runs →" (violet-400, click → F19).

- **Card 3 — Release Risk:** Title "Release Risk", metric "MEDIUM" (Geist Mono 18/24, amber `#FBBF24`), pill background amber 10%, border amber 28%, detail "4 critical defects, 87% pass rate" (Inter 12/400, secondary), hint "Based on current runs and defects in this sprint." (caption, tertiary), CTA "Review risks →" (violet-400, click → F20).

- **Card 4 — AI Narrative (Confidence Lane):** Title "AI Update", confidence lane 3px left border (green if ≥0.85, amber 0.60–0.85, red <0.60), card background slight gradient from lane color (5% opacity). Narrative: "A2 found 3 potential duplicates in your last batch of test cases. A4 identified a flaky test (SAY-901) based on recent failures. Review suggestions?" (Inter 14/20, primary, max 200px). Footer: "Confidence: 78%" (Geist Mono 11, secondary), teal dot 6px, "2 suggestions pending review" (Inter 11/400, secondary). CTA "Review AI suggestions →" (violet-400, click → evidence rail focus or F08a with rail pinned).

- Card styling (all): background base `#111827`, border subtle, radius 12px, padding 24px, hover: strong border, cursor pointer. Margin-bottom 48px.

Also update the Outcome Board region: each card's primary CTA is teal (#2DD4BF) not violet, per the updated primary/secondary convention.

**Region 4 — Personal Worklist (main canvas, below Outcome Board)**

Replaces the previous "work queue tabs + cards" approach with a dense worklist-row pattern inspired by 01-home.html reference.

Top: filter tabs (All / AI suggestions / Approvals / Defect triage / Runs mine) — Inter 12/500, active tab gets 2px teal bottom border + teal text; inactive gray.

Below tabs: worklist rows (height 56px, vertical gap 4px):
- **Left edge (12px):** 3px left Confidence Lane accent on AI-generated rows — violet-400 `#C4B5FD` for high confidence (≥0.85), warn `#FBBF24` for medium (0.60-0.85), fail `#F87171` for low (<0.60). Non-AI rows have no lane.
- **Checkbox (24×24):** bulk-select; enables a bulk-action bar on multi-select.
- **Status shape indicator (12×12):** circle=test case, triangle=defect, square=run, diamond=approval. Color = state (teal for done/approved, amber for needs-attention, red for failing/P0, violet for AI-pending-review).
- **Title block (flex-grow):**
  - Title Inter 14/500 color `#F1F5F9` — e.g. "A1 drafted 8 cases from ACM-881" / "PAY-1472 awaiting your triage" / "Sprint 42 run ready for review".
  - Sub-line Inter 12/400 color `#8A94A6` — source chip + project chip + age + owner avatar. E.g. "A1 · Iksula Commerce · 18m ago · priya.s".
- **Sparkline (right-aligned, 60×16):** 7-day trend of the underlying metric where relevant (pass rate, flake rate, defect age). Hidden if not applicable.
- **Quick actions (right, 3 icons, 28×28 each):** primary-action first (Accept/Approve for AI items, Review for defects, Start-run for runs), Pin, overflow menu (•••). Hover reveals action tooltips.
- **Row hover:** background `rgba(45,212,191,0.04)`, cursor pointer, right-arrow chevron appears at far right. Click row → drill into detail frame (F17/F22/F20).

Empty state: centered illustration + "Nothing in your queue right now. Generate test cases with A1 or pick up a run." + primary CTA `Generate with A1 →` routing to F16a.

**Evidence Rail (right side, 380 × 912, scrollable, background base `#111827`, border-left subtle, padding 24px):**

- **Section 1 — Recent Agent Activity (240px):** Title "Recent Agent Activity" (Inter 12/500 uppercase, `#8A94A6`). Cards (flex column, gap 12px):
  - Activity 1: Agent label "A1 Test Case Generator" (Inter 11/500, violet-400, dot indicator), Activity "Generated 4 test cases from Iksula Commerce PRD" (Inter 12/400, primary), Metadata "2h ago" (caption, tertiary). Evidence thread: 1px vertical line to next.
  - Activity 2: "A2 Duplicate Detection", "Flagged 2 potential duplicates in your recent batch", "1h ago". Thread continues.
  - Activity 3: "A4 Defect Intelligence", "Analyzed SAY-892, tagged as 'App' issue, 5-layer RCA available", "30m ago".
  - CTA "View all activity →" (Inter 12/500, violet-400, margin-top 12px, cursor pointer).

- **Section 2 — Suggested Next (200px):** Title "Suggested Next" (uppercase). Card: background raised `#1A2233`, border subtle, radius 8px, padding 12px. Heading "Review A2 duplicates" (Inter 13/500, primary), description "2 new cases flagged as potential duplicates. Quick merge or dismiss?" (Inter 12/400, secondary), button "Review now →" (Inter 12/500, violet-400, hover underline), confidence chip "High confidence" (background green 10%, border green 28%, color green, Geist Mono 10, radius 4px).

- **Section 3 — Pinned Knowledge (300px flexible):** Title "Pinned Knowledge" (uppercase). Articles (flex column, gap 12px):
  - Article 1: Category "KB · Test Plan" (Geist Mono 10, tertiary), title "Iksula Commerce — Q2 Test Strategy" (Inter 12/500, primary, violet-400 if unread), snippet "Key areas: checkout flow, payment retry, mobile responsiveness..." (caption, secondary, max 60 chars + ellipsis), metadata "Updated 3d ago" (caption). Click → F15.
  - Article 2: Category "KB · Automation Setup", title "Playwright setup for Iksula Commerce", snippet "Prerequisites, browser setup, CI integration steps...", metadata "Updated 1w ago".
  - CTA "Browse knowledge base →" (violet-400, margin-top 12px, cursor pointer).

### States
- **Normal:** All regions loaded, "All" tab active, evidence rail visible/scrollable.
- **Empty queue:** Outcome Board shows "0" or "—", queue shows "No items in your queue. Good job!" centered + CTAs "Browse knowledge base" / "Explore test cases".
- **Loading:** Skeleton placeholders (shimmer 200ms) on board metrics + queue rows (3–5 placeholders), evidence rail skeleton.
- **Error:** Red error banner top of canvas (background fail 10%, border fail 28%, text fail, padding 12px, radius 8px, icon + text + close/retry button). Cards show "—". User can retry or navigate.
- **Real-time update:** Run meter bars update color/height without full refresh, running bar pulsing continues.

### Accessibility
- Tab order: question header metadata → outcome board cards (L-R, T-B) → work queue tab strip → queue rows → evidence rail sections.
- Focus ring: violet 2px, offset 2px.
- Color-not-only: Release Risk uses color + text label + pill shape; running uses color + pulsing animation + text; AI confidence uses color lane + number + text + dot.
- Screen reader: `<main>`, `<header>`, `<section aria-labelledby="">` for Outcome Board, Work Queue, Evidence Rail. Cards `<article>`. Tab strip `role="tablist"`, tabs `role="tab"`, `aria-selected`, panels `role="tabpanel"`. Queue rows `role="button"` or `<button>`, `aria-label="[description] [status]"`. Evidence rail `<aside aria-label="Evidence rail">`.
- Reduced motion: disable skeleton shimmer, run meter pulse, thread animation.

### Realistic data
- Outcome: Action Queue 12 (+2), Active Runs 3 (2 passed, 1 in-progress), Release Risk MEDIUM (4 critical, 87% pass), AI Narrative A2+A4, 78% confidence.
- Queue (All, 8 items): rows as listed above.
- Evidence: A1 (2h ago), A2 (1h ago), A4 (30m ago). Suggested: Review A2 duplicates (high confidence). Pinned: "Iksula Commerce — Q2 Test Strategy" (3d), "Playwright setup" (1w).

### Stitch prompt
```
Design frame F08a - Home (QA Engineer personal queue). Personal dashboard for QA Engineers. Answers: "What needs your attention right now?"

Canvas 1600 × 1024. Shell: Full (left rail 272px + top bar 56px + main 1048px + evidence rail 380px). Apply left rail and top command bar per NAVIGATION_CONTRACT.md.

Layout:

1. Question Header (64px, below top bar, padding 32px):
   - Left: "What needs your attention right now?" (DM Sans 32/40, primary) + "Your work queue, active runs, and AI suggestions." (Inter 16/24, secondary, margin-top 8px).
   - Right (flex, gap 12px): Project glyph (24×24) + "Iksula Commerce" (Inter 13/500, secondary, clickable) + "2026-04-23 · Tuesday" (Geist Mono 11, tertiary) + "Synced 2m ago" (caption, tertiary, tooltip shows full timestamp).
   - Margin-bottom 32px.

2. Outcome Board (4 columns, gap 16px, height 360px):

   Card 1 — Action Queue:
   - Title: "Action Queue" (Inter 13/500 uppercase, `#8A94A6`)
   - Metric: "12" (Geist Mono 28/32, primary)
   - Trend: "+2 vs yesterday" (Geist Mono 12, teal-500)
   - Sparkline: 32px tall, last 7 days, green bars
   - CTA: "Open queue →" (Inter 12/500, violet-400, hover underline, click → F17)
   - Card: base background, border subtle, radius 12px, padding 24px, hover: strong border, cursor pointer, elevation.1.

   Card 2 — Active Runs:
   - Title: "Active Runs"
   - Metric: "3 running" (Geist Mono 18/24)
   - Detail: "2 passed, 1 in-progress" (Geist Mono 11, secondary)
   - Run meter: 5 horizontal bars, last 5 hours/runs. Green pass 60%, red fail 85%, purple running 100% (pulsing animation 120ms ease). Background raised `#1A2233`, gap 2px, radius 2px.
   - CTA: "View runs →" (violet-400, click → F19)

   Card 3 — Release Risk:
   - Title: "Release Risk"
   - Metric: "MEDIUM" (Geist Mono 18/24, amber `#FBBF24`)
   - Pill: background amber 10%, border amber 28%, text amber, radius 8px, padding 4px 12px
   - Detail: "4 critical defects, 87% pass rate" (Inter 12/400, secondary)
   - Hint: "Based on current runs and defects in this sprint." (caption, tertiary)
   - CTA: "Review risks →" (violet-400, click → F20)

   Card 4 — AI Narrative (Confidence Lane motif):
   - Title: "AI Update"
   - Confidence lane: 3px left-edge border. Green (≥0.85) `#34D399`, amber (0.60–0.85) `#FBBF24`, red (<0.60) `#F87171`.
   - Card background: slight gradient from lane color (5% opacity) fading right.
   - Narrative: "A2 found 3 potential duplicates in your last batch of test cases. A4 identified a flaky test (SAY-901) based on recent failures. Review suggestions?" (Inter 14/20, primary, max 200px width)
   - Footer (flex, gap 8px, margin-top 12px): "Confidence: 78%" (Geist Mono 11, secondary) + teal dot (6px circle `#2DD4BF`) + "2 suggestions pending review" (Inter 11/400, secondary)
   - CTA: "Review AI suggestions →" (Inter 12/500, violet-400, click → evidence rail focus or F08a with rail)

   All cards: base background `#111827`, border subtle `#2A3347`, radius 12px, padding 24px, hover: border strong `#3B4660`, cursor pointer, elevation.1 shadow.
   - Margin-bottom 48px.

3. Work Queue Section (flex column, margin-top 48px):
   - Header (flex, justify-between): "Work Queue" (DM Sans 18/24, primary) + subtitle "(All / AI suggestions / Approvals / Defect triage)" (Inter 13/400, tertiary) + right "8 items" (Geist Mono 11, secondary)
   - Tab strip (border-bottom 1px subtle `#2A3347`):
     - Tab 1: "All" (13 items) — badge "13" (background raised, color tertiary, Geist Mono 10, radius 4px)
     - Tab 2: "AI suggestions" (2 items)
     - Tab 3: "Approvals" (1 item)
     - Tab 4: "Defect triage" (5 items)
     - Tab styling: Inter 13/500, secondary initially, hover: primary, selected: primary + bottom border 2px violet-500 (replaces divider)
   - Queue list (flex column, gap 8px, max-height 300px, scrollable):
     - Row 1 — To author: Icon ✎ + "To author" (Inter 12/500, info blue `#60A5FA`). Title: "User registration flow — password reset email" (Inter 13/500, primary). Context: "Assigned to me · Due tomorrow · High priority" (caption, secondary, flex gap 8px). Right: "12 steps" (Geist Mono 11, tertiary) + "Created 3h ago" (caption). Click → F17.
     - Row 2 — Awaiting review: ⚡ + "Awaiting review" (warn amber `#FBBF24`). Title: "Mobile checkout payment flow". Context: "Reviewer: Rahul K · Due in 2h". Click → F17 review.
     - Row 3 — AI suggestion: 🤖 + "AI suggestion" (violet-400). Title: "A2 flagged: Duplicate case detected". Context: "Related to: SAY-901 checkout flow · Confidence 87%" (secondary, confidence badge green). Hint: "Review & merge or dismiss" (caption). Click → evidence rail or detail.
     - Row 4 — Running: ▶ + "Running" (violet-500, pulsing animation). Title: "Daily regression suite — Desktop Chrome". Context: "Started 5m ago · Estimated 12m remaining". Inline progress bar (60px wide, 2px, fill violet at 40%).
     - Row 5 — Triage needed: ⚠ + "Triage needed" (fail red `#F87171`). Title: "SAY-892: Checkout form doesn't disable after submit". Context: "Found in: Staging · By: Priya S · Severity: P2". Metrics: "0 comments · Unassigned". Click → F21.
     - Rows 6–8: similar, additional items.
   - Other tabs: same structure, filtered by category.
   - Margin-bottom 32px.

4. Evidence Rail (right side, 380 × 912, scrollable):
   - Background: base `#111827`, border-left subtle `#2A3347`, padding 24px.
   - Sections (flex column, gap 24px):

     Section 1 — Recent Agent Activity (240px):
     - Title: "Recent Agent Activity" (Inter 12/500 uppercase, `#8A94A6`)
     - Cards (flex column, gap 12px):
       - Activity 1: Agent label "A1 Test Case Generator" (Inter 11/500, violet-400, dot indicator) + Activity "Generated 4 test cases from Iksula Commerce PRD" (Inter 12/400, primary) + Metadata "2h ago" (caption, tertiary). Evidence thread: 1px vertical line to next.
       - Activity 2: "A2 Duplicate Detection" + "Flagged 2 potential duplicates in your recent batch" + "1h ago". Thread continues.
       - Activity 3: "A4 Defect Intelligence" + "Analyzed SAY-892, tagged as 'App' issue, 5-layer RCA available" + "30m ago".
     - CTA: "View all activity →" (Inter 12/500, violet-400, margin-top 12px, cursor pointer)

     Section 2 — Suggested Next (200px):
     - Title: "Suggested Next" (uppercase)
     - Card: background raised `#1A2233`, border subtle, radius 8px, padding 12px
       - Heading: "Review A2 duplicates" (Inter 13/500, primary)
       - Description: "2 new cases flagged as potential duplicates. Quick merge or dismiss?" (Inter 12/400, secondary)
       - Button: "Review now →" (Inter 12/500, violet-400, hover underline)
       - Confidence chip: "High confidence" (background green 10%, border green 28%, color green, Geist Mono 10, radius 4px)

     Section 3 — Pinned Knowledge (300px flexible):
     - Title: "Pinned Knowledge" (uppercase)
     - Articles (flex column, gap 12px):
       - Article 1: Category "KB · Test Plan" (Geist Mono 10, tertiary), title "Iksula Commerce — Q2 Test Strategy" (Inter 12/500, primary, violet-400 if unread), snippet "Key areas: checkout flow, payment retry, mobile responsiveness..." (caption, secondary, max 60 chars + ellipsis), metadata "Updated 3d ago" (caption). Click → F15.
       - Article 2: Category "KB · Automation Setup", title "Playwright setup for Iksula Commerce", snippet "Prerequisites, browser setup, CI integration steps...", metadata "Updated 1w ago".
     - CTA: "Browse knowledge base →" (violet-400, margin-top 12px, cursor pointer)

Design tokens: Canvas operate `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`. Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`. Brand: violet-500 `#A78BFA`, violet-600 `#8B5CF6`, teal-500 `#2DD4BF`. Semantic: pass `#34D399`, fail `#F87171`, warn `#FBBF24`, info `#60A5FA`. Borders: subtle `#2A3347`, strong `#3B4660`. Typography: DM Sans (display), Inter (UI), Geist Mono (metrics), JetBrains Mono (code).

Interactions: Keyboard `g h` (home), `Cmd+K`/`Ctrl+K` (search/filter), `Cmd+D`/`Ctrl+D` (dense mode), `Cmd+J`/`Ctrl+J` (toggle rail), Tab (cycle), Enter (activate). Click: outcome board cards navigate (F17, F19, F20, F08a-rail), work queue rows navigate or detail, tab switches filter, CTAs navigate/scroll, evidence rail cards open linked content. Hover: cards/rows raise, CTAs underline. Loading: skeleton placeholders on board + queue (shimmer 200ms).

States: Normal (all loaded, "All" tab active), Empty queue (0 items, "No items in your queue. Good job!" centered), Loading (skeletons), Error (red banner top), Real-time update (run meter bars update color/height).

Accessibility: Tab order question → outcome board → work queue tabs → rows → evidence rail. Focus ring violet 2px. Color-not-only: risk color + text + pill; running color + animation + text; AI confidence color lane + number + text + dot. SR: `<main>`, `<header>`, `<section>` landmarks, `role="tablist"` for tabs, `role="tab"` + `aria-selected`, `role="tabpanel"` for content, queue rows `role="button"` + `aria-label`. Reduced motion: disable skeleton shimmer, run meter pulse, thread animation.

Motifs: Question Header (DM Sans question + Inter answer). Outcome Board (4-card summary). Confidence Lane (3px left-edge color on AI card). Evidence Thread (1px vertical connector). Reference `Project_UI/preview/F08_Home_Command_Center.html` for Outcome Board + Evidence Thread layout. PM1 M5 delivery. Full shell. QA Engineer role-gated. Apply NAVIGATION_CONTRACT.md.

Do NOT use Material Design 3. Hardcode hex. Primary=#2DD4BF, Secondary=#A78BFA. No tertiary. No orange/yellow/coral/pink.

WORKLIST ROW PATTERN: Adopt the worklist-row pattern from 01-home.html — dense rows with Confidence Lane on AI items, checkbox + status shape + title + sub-line + sparkline + quick actions. 56px row height, 4px vertical gap. CTAs on rows (Approve / Review / Start run) are teal #2DD4BF. AI confidence pills and Confidence Lane are violet #A78BFA / #C4B5FD. Never use violet on a CTA button.
```

---

## §5. Frame F08b — Home / Dashboard (Lead / Admin / Stakeholder) ⭐ CRITICAL

### Front matter
- **ID:** F08b
- **Role gate:** Lead, Admin, Stakeholder
- **Canvas:** 1600 × 1024
- **Shell:** Full (rail 272px + top bar 56px + main 1048px + evidence rail 380px)
- **Entry/Exit:** F06 (sign-in), rail Home, after workflow → F09, F17, F19, F21, F23, F24 (AI Value CTA)

### Purpose
**CRITICAL:** Team dashboard for managers and leaders. Answers: "How is the team doing, and what needs approval?" Shows **AI Value strip** (business impact of agents), team-wide metrics, approvals queue, per-project cockpit tiles, and leadership indicators. **The AI Value strip is the single most important element and key visual differentiator on this frame — make it prominent, compelling, and visually dominant.**

### Content regions

**Question header (64px, below top bar, padding 32px):**
- Left: "How is the team doing, and what needs approval?" (DM Sans 32/40) + "Team metrics, AI impact, release readiness, and pending approvals." (Inter 16/24, secondary, margin-top 8px).
- Right: Project glyph + "Iksula Commerce" (Inter 13/500, secondary) + "Sprint 42 · 8d remaining" (Geist Mono 11) + "5 team members" (caption, tertiary).
- Margin-bottom 32px.

**AI Value Strip (120px, FOCAL POINT — spend 25-30% of total design weight here)**

Uses the KPI card pattern from 05-reports.html: big number DM Sans 36/700 + delta pill (▲/▼ with color) + inline sparkline 80×16 + formula footnote Inter 11/400 color `#94A3B8` below. 4 cards in a row: Time saved, Cost avoided, Defects caught early, ROI.

Background: linear-gradient(90deg, teal 5% opacity → violet 5% opacity). Border: teal 28% opacity, all edges. Radius: 12px. Padding: 20px. Elevation: 1 shadow. 4-column layout (flex, gap 16px).

- **Column 1 — Time Saved This Sprint:** Label "Time saved this sprint" (Inter 12/500 uppercase, `#8A94A6`), metric "184 h" (Geist Mono 36/700, teal-500), delta pill "▲ 23 h vs last sprint" (Inter 12/400, teal-500, green arrow), sparkline 80×16 (inline, teal line), breakdown "From A1 gen, A2 dedup, A4 RCA" (Geist Mono 10, tertiary, italic).

- **Column 2 — Cost Avoided:** Label "Cost avoided", metric "₹14.2 L" (Geist Mono 36/700, teal-500), delta pill + sparkline 80×16 (inline), note "Using cost-avoidance formula" (Inter 12/400, secondary), formula "Defects caught × stage multiplier: req=10, design=20, build=100, prod=1000" (Geist Mono 9, tertiary, italic).

- **Column 3 — Defects Caught Early:** Label "Defects caught early", metric "427" (Geist Mono 36/700, teal-500), delta pill, sparkline 80×16 (inline), note "Cost-weighted by severity" (Inter 12/400, secondary).

- **Column 4 — ROI:** Label "Return on investment", metric "8.2×" (Geist Mono 36/700, teal-500), delta pill, sparkline 80×16 (inline), provenance "Calculated from 2,341 A1 gens, 412 A2 flags, 89 A4 RCAs" (Geist Mono 10, tertiary, italic). CTA (margin-top 8px): "Open QA Value dashboard →" (Inter 12/500, teal-500, cursor pointer, hover underline, click → F24).

Strip styling: Labels tertiary gray, big numbers teal-500 (dominant), secondary text gray. Sparklines + delta pills teal. AI chips (A1 87% / A2 78% / A4 84%) stay violet `#A78BFA` because they represent AI agent work, not CTAs. **Primary CTAs like "Open QA Value dashboard" are teal `#2DD4BF` (regular nav action), never violet.**

Margin-bottom 32px.

**Outcome Board (4 columns, gap 16px, height 360px, TEAM-WIDE):**

- **Card 1 — Team Pass Rate:** Title "Team Pass Rate" (Inter 13/500 uppercase), metric "91.2%" (Geist Mono 32/36, primary), trend "↓ 1.3% vs last sprint" (Geist Mono 12, fail red `#F87171`), sparkline 32px (last 8 sprints, line primary, area violet 5%), detail "Based on 341 test runs this sprint" (caption, secondary), CTA "View runs →" (violet-400, click → F19).

- **Card 2 — Defect Trend:** Title "Defect Trend", metric "47 open" (Geist Mono 32/36), trend "↑ 8 vs last sprint" (fail red), breakdown "12 P0, 18 P1, 17 P2+" (caption), CTA "Triage defects →" (violet-400, click → F21).

- **Card 3 — Release RAG:** Title "Release Readiness", status "AMBER" (Geist Mono 24/28, warn amber `#FBBF24`), pill background amber 10%, border amber 28%. Criteria (below, margin-top 8px, flex column, gap 4px, max 200px):
  - "✓ Pass rate 91% (≥95% needed)" (Inter 12/400, secondary, green checkmark)
  - "✗ 12 P0 defects open (0 allowed)" (fail red X, fail red text)
  - "⚠ Coverage 82% (≥90% needed)" (warn amber icon, amber text)
  - CTA "Review gates →" (violet-400, click → F20).

- **Card 4 — Approvals Pending Me:** Title "Approvals Pending Me" (uppercase; Lead/Admin. Stakeholder: "Approvals pending your team"), metric "3 awaiting" (Geist Mono 28/32, primary), breakdown "2 strategies, 1 report" (caption), urgency "1 overdue (due 2h ago)" (fail red, caption, if true), CTA "Review approvals →" (violet-500, darker/bolder for urgency, click → scroll to approvals panel below).

Card styling: base background, border subtle, radius 12px, padding 24px, hover: strong border. Margin-bottom 48px.

**Project Cockpit (responsive grid, 2–3 columns, gap 16px):**

- Title "Project Cockpit" (DM Sans 18/24), subtitle "Status snapshot for each project you lead" (Inter 14/400, secondary, margin-top 4px). Margin-bottom 16px.

- Cockpit tiles (~300×200px): background raised `#1A2233`, border subtle, radius 12px, padding 16px. Top row (flex, justify-space-between): Project glyph + name (Inter 14/500, primary, ellipsis if long) | RAG pill (e.g., "GREEN", background green 10%, border green 28%, Geist Mono 10/500). Metrics grid (3 columns, gap 12px, margin-top 12px):
  - Open defects: label (caption) + "12" (Geist Mono 16, primary) + subtext (caption)
  - Pass rate: label + "87%" (green if ≥90%, amber if 70-89%, red if <70%) + subtext
  - Sprint progress: label + progress bar (40px×3px, fill violet 65%) + subtext
  - Bottom action (margin-top 12px): "View project →" (Inter 12/500, violet-400, click → F09 or project detail).

Example tiles: Iksula Commerce (GREEN), Iksula Payments (AMBER), Iksula Mobile App (RED). Margin-bottom 48px.

**Region — Approvals queue + team worklist**

Same worklist-row pattern as F08a Region 4, but scoped to Lead-facing items:
- Tabs: All approvals / Strategies / Reports / RTM changes / Role changes / Team defect triage
- Rows show:
  - Left edge Confidence Lane where AI-drafted (same color rules)
  - Status shape + state color
  - Title: "Priya S requested approval on Test Strategy for CHK-512" / "RTM update — 14 new test-to-req links"
  - Sub-line: submitter avatar + submitter name + timestamp + source project + AI-draft-confidence pill if applicable
  - Quick actions: Approve (teal), Request changes (neutral), Reject (fail red), Pin, overflow — right-aligned, 28×28 icons
  - Row hover expands inline with 3-line preview of the document being approved

Bulk approve available via header checkbox → bulk-action bar.

Margin-bottom 32px.

**Evidence Rail (right side, 380 × 912, scrollable, background base `#111827`, border-left subtle, padding 24px):**

- **Section 1 — Team Activity Snapshot (200px):** Title "Team Activity (Last 24h)" (Inter 12/500 uppercase, `#8A94A6`). Metrics (flex column, gap 8px, all Inter 12/400, primary):
  - "✓ 47 test cases authored"
  - "🔄 12 defects filed & fixed"
  - "▶ 3 test suites executed"
  - "📋 2 reports generated"
  - "🤖 A1 + A2 + A4 active" (violet-400)

- **Section 2 — Release Readiness Preview (240px):** Title "Release Readiness Snapshot" (uppercase). Card: background raised, border subtle, radius 8px, padding 12px. Status "AMBER — 2 gates failing" (Inter 13/500, amber text). Gates (flex column, gap 8px):
  - "✓ Pass rate 91% (target 95%)" (green checkmark, secondary text)
  - "✗ 12 P0 defects (target 0)" (red X, fail red text)
  - "✓ Coverage 82% (target 90%)" (yellow warning icon, amber text)
  - CTA "Full readiness report →" (violet-400, click → F20/F23).

- **Section 3 — Pinned Reports (300px flexible):** Title "Pinned Reports" (uppercase). Cards (flex column, gap 12px):
  - Card 1: Category "Report · Daily Status" (Geist Mono 10, tertiary), title "Daily Status — 2026-04-23" (Inter 12/500), snippet "5 cases run, 4 passed, 1 blocked..." (caption, max 60 chars), metadata "Generated 2h ago" (caption). Click → report detail.
  - Card 2: Category "Report · Sprint Sign-off", title "Sprint 42 Sign-off (in progress)", snippet "Coverage snapshot, risk summary...", metadata "Last updated 1h ago".
  - CTA "All reports →" (violet-400, click → F23).

### States
- **Normal:** All sections loaded, evidence rail visible.
- **Empty approvals:** Empty state centered.
- **Loading:** Skeleton placeholders (shimmer) on AI Value strip + board + approvals (critical path).
- **Error:** Red error banner top.
- **Stakeholder role:** Title "Approvals pending your team" (read-only), no action buttons.

### Accessibility
- Tab order: question → AI Value strip → outcome board → cockpit → approvals → evidence rail.
- Focus ring: violet 2px, offset 2px.
- Color-not-only: RAG color + text + pill + icons; overdue color + text + icon; AI metrics color + bars + numbers.
- Screen reader: `<main>`, `<header>`, `<section>` landmarks, cards `<article>`, buttons with labels, `role="alert"` for errors.
- Reduced motion: disable skeleton shimmer, sparkline animation.

### Realistic data
- AI Value: 184h saved, ₹14.2L cost avoided, A1 87%, A2 78%, A4 84%, 2,341 gens / 412 flags / 89 RCAs.
- Outcome: Team Pass Rate 91.2% (↓ 1.3%), Defects 47 (↑ 8, 12 P0), Release AMBER, Approvals 3 (2 strategies, 1 report, 1 overdue).
- Cockpit: Iksula Commerce (GREEN, 12 defects, 87%, 5 team), Iksula Payments (AMBER, 8 defects, 93%, 4 team), Iksula Mobile (RED, 23 defects, 78%, 6 team).
- Approvals: Q2 Strategy (Priya S, 3h), Release Report (Rahul K, 2h), RTM (Arjun M, 4h, overdue).
- Evidence: 47 cases, 12 defects, 3 suites, 2 reports, A1+A2+A4 active.

### Stitch prompt
```
Design frame F08b - Home / Dashboard (Lead / Admin / Stakeholder). Team dashboard for managers and leaders. Answers: "How is the team doing, and what needs approval?" **CRITICAL: The AI Value strip is the key visual and business differentiator on this frame. Make it prominent, well-designed, and compelling.**

Canvas 1600 × 1024. Shell: Full (left rail 272px + top bar 56px + main 1048px + evidence rail 380px). Apply left rail and top command bar per NAVIGATION_CONTRACT.md.

Layout:

1. Question Header (64px, padding 32px):
   - Left: "How is the team doing, and what needs approval?" (DM Sans 32/40, primary) + "Team metrics, AI impact, release readiness, and pending approvals." (Inter 16/24, secondary, margin-top 8px).
   - Right (flex, gap 12px): Project glyph + "Iksula Commerce" (Inter 13/500, secondary) + "Sprint 42 · 8d remaining" (Geist Mono 11) + "5 team members" (caption, tertiary).
   - Margin-bottom 32px.

2. **AI VALUE STRIP (height 120px, PROMINENT FOCAL POINT):**
   - Background: linear-gradient(90deg, teal 5% to violet 5%). Border: teal 28% all edges, radius 12px. Padding: 20px. Shadow: elevation.1.
   - 4-column layout (flex, gap 16px), each ~240px:

     **Column 1 — Time Saved This Sprint:**
     - Label: "Time saved this sprint" (Inter 12/500 uppercase, `#8A94A6`)
     - Metric: "184 h" (Geist Mono 32/36, teal-500, weight 500)
     - Trend: "▲ 23 h vs last sprint" (Inter 12/400, teal-500, green arrow)
     - Breakdown: "From A1 gen, A2 dedup, A4 RCA" (Geist Mono 10, tertiary, italic)

     **Column 2 — Cost Avoided:**
     - Label: "Cost avoided"
     - Metric: "₹14.2 L" (Geist Mono 32/36, teal-500)
     - Note: "Using cost-avoidance formula" (Inter 12/400, secondary)
     - Formula: "Defects caught × stage multiplier: req=10, design=20, build=100, prod=1000" (Geist Mono 9, tertiary, italic)

     **Column 3 — AI Acceptance Rates (3 stacked metrics):**
     - Label: "AI acceptance rates" (uppercase)
     - Submetric A1: "A1 gen accept" (Geist Mono 10) + bar (200px wide, 4px tall, background raised `#1A2233`, fill teal at 87%, radius 2px) + "87%" right (Geist Mono 11)
     - Submetric A2: "A2 dedup precision" + bar 78% + "78%"
     - Submetric A4: "A4 RCA helpfulness" + bar 84% + "84%"
     - Gap 8px between submetrics.

     **Column 4 — Data Provenance + CTA:**
     - Sparkline (top, 200×40px): "Weekly hours saved" label (Geist Mono 10), line chart (teal line, teal 10% area fill, grid subtle, X W1-W12 Geist Mono 8, Y 0/50/100/150/200 Geist Mono 8)
     - Provenance (margin-top 8px): "Calculated from 2,341 A1 gens, 412 A2 flags, 89 A4 RCAs" (Geist Mono 9, secondary, italic) — transparency that numbers are real.
     - CTA (margin-top 8px): "Open QA Value dashboard →" (Inter 12/500, teal-500, hover underline, click → F24)

   - Strip styling: Labels tertiary gray, metrics teal-500 (dominant), secondary text gray. Bars + sparkline primary teal. Visual weight: teal columns (1/2/3) dominant, column 4 secondary support.
   - Margin-bottom 32px.

3. Outcome Board (4 columns, gap 16px, height 360px) — TEAM-WIDE:

   Card 1 — Team Pass Rate:
   - Title: "Team Pass Rate" (Inter 13/500 uppercase, `#8A94A6`)
   - Metric: "91.2%" (Geist Mono 32/36, primary)
   - Trend: "↓ 1.3% vs last sprint" (Geist Mono 12, fail red `#F87171`)
   - Sparkline: 32px tall, last 8 sprints, line primary, area violet 5%
   - Detail: "Based on 341 test runs this sprint" (caption, secondary)
   - CTA: "View runs →" (violet-400, click → F19)

   Card 2 — Defect Trend:
   - Title: "Defect Trend"
   - Metric: "47 open" (Geist Mono 32/36)
   - Trend: "↑ 8 vs last sprint" (red, negative)
   - Breakdown: "12 P0, 18 P1, 17 P2+" (caption)
   - CTA: "Triage defects →" (violet-400, click → F21)

   Card 3 — Release RAG:
   - Title: "Release Readiness"
   - Status: "AMBER" (Geist Mono 24/28, warn amber `#FBBF24`)
   - Pill: background amber 10%, border amber 28%, radius 8px
   - Criteria (below, margin-top 8px, flex column, gap 4px, max 200px):
     - "✓ Pass rate 91% (≥95% needed)" (Inter 12/400, secondary, green check)
     - "✗ 12 P0 defects open (0 allowed)" (fail red X icon, fail red text)
     - "⚠ Coverage 82% (≥90% needed)" (warn amber icon, amber text)
   - CTA: "Review gates →" (violet-400, click → F20)

   Card 4 — Approvals Pending Me:
   - Title: "Approvals Pending Me" (uppercase; Lead/Admin. Stakeholder: "Approvals pending your team")
   - Metric: "3 awaiting" (Geist Mono 28/32, primary)
   - Breakdown: "2 strategies, 1 report" (caption)
   - Urgency: "1 overdue (due 2h ago)" (fail red, caption, if true)
   - CTA: "Review approvals →" (violet-500, darker+bolder for urgency, click → scroll approvals below)

   All cards: base background, border subtle, radius 12px, padding 24px, hover: strong border, cursor pointer, elevation.1.
   - Margin-bottom 48px.

4. Project Cockpit (responsive grid, 2–3 columns, gap 16px):
   - Title: "Project Cockpit" (DM Sans 18/24, primary)
   - Subtitle: "Status snapshot for each project you lead" (Inter 14/400, secondary, margin-top 4px)
   - Tiles (~300×200px each): background raised `#1A2233`, border subtle, radius 12px, padding 16px
     - Top row (flex, justify-space-between): Project glyph (24×24) + name (Inter 14/500, primary, ellipsis if long) | RAG pill (e.g., "GREEN", background green 10%, border green 28%, text green, Geist Mono 10/500)
     - Metrics grid (3 columns, gap 12px, margin-top 12px):
       - Column 1 — Open defects: Label (caption, secondary) + "12" (Geist Mono 16, primary) + "4 P0, 8 P1" (caption)
       - Column 2 — Pass rate: Label + "87%" (green if ≥90%, amber if 70-89%, red if <70%, Geist Mono 16) + "340 runs"
       - Column 3 — Sprint progress: Label + bar (40px×3px, fill violet 65%) + "8d left"
     - Bottom action (margin-top 12px): "View project →" (Inter 12/500, violet-400, click → F09 or project detail)
   - Example tiles: Iksula Commerce (GREEN, 12 defects, 87%, 65% progress), Iksula Payments (AMBER, 8 defects, 93%, 42%), Iksula Mobile (RED, 23 defects, 78%, 58%)
   - Margin-bottom 48px.

5. Approvals Queue Panel (max-height 350px, scrollable):
   - Title: "Approvals Awaiting You" (DM Sans 18/24, primary; Stakeholder: "Approvals pending your team")
   - Badge: "3 pending" (Geist Mono 12, secondary, inline)
   - Items (flex column, gap 12px):
     - Item 1 — Strategy: Icon 📋 + "Strategy" (Inter 12/500, info blue). Title: "Q2 Testing Strategy — Iksula Commerce" (Inter 13/500). Details: "Submitted by Priya S · 3h ago" (caption, secondary). Status badge: "Awaiting review" (amber background 10%, border amber, text amber, radius 4px, Inter 11/500). Action buttons right (Lead/Admin only): "Review" (violet background, canvas text, padding 6px 12px, radius 6px, Inter 11/500) + "Approve" (teal background). Stakeholder: no buttons, just "View" (violet-400). Hover: background raised, cursor pointer.
     - Item 2 — Report: Icon 📊 + "Report" (info blue). Title: "Release Readiness Report — Iksula Payments". Details: "Submitted by Rahul K · 2h ago". Status: "Awaiting review" (amber). Buttons same as Item 1.
     - Item 3 — RTM (overdue): Icon 🔗 + "RTM" (info blue, fail red if overdue). Title: "Requirements Traceability Matrix update" (fail red if overdue). Details: "Submitted by Arjun M · 4h ago · Overdue 1h" (fail red). Status badge: "OVERDUE" (red background 10%, border red, text red). Buttons: "Review" + "Approve" (darker red variant if overdue). Row highlight: subtle red background or red left border if overdue.
   - Empty state: "No approvals awaiting you. Great job staying on top of reviews!" (Inter 14/400, secondary, centered, 100px)
   - Margin-bottom 32px.

6. Evidence Rail (right side, 380×912, scrollable):
   - Background: base `#111827`, border-left subtle, padding 24px
   - Sections (flex column, gap 24px):

     Section 1 — Team Activity Snapshot (200px):
     - Title: "Team Activity (Last 24h)" (Inter 12/500 uppercase, `#8A94A6`)
     - Metrics (flex column, gap 8px, all Inter 12/400, primary):
       - "✓ 47 test cases authored"
       - "🔄 12 defects filed & fixed"
       - "▶ 3 test suites executed"
       - "📋 2 reports generated"
       - "🤖 A1 + A2 + A4 active" (violet-400)

     Section 2 — Release Readiness Preview (240px):
     - Title: "Release Readiness Snapshot" (uppercase)
     - Card: background raised, border subtle, radius 8px, padding 12px
       - Status: "AMBER — 2 gates failing" (Inter 13/500, amber)
       - Gates (flex column, gap 8px):
         - "✓ Pass rate 91% (target 95%)" (green check, secondary)
         - "✗ 12 P0 defects (target 0)" (red X, fail red)
         - "✓ Coverage 82% (target 90%)" (yellow warning, amber)
       - CTA: "Full readiness report →" (violet-400, click → F20/F23)

     Section 3 — Pinned Reports (300px flexible):
     - Title: "Pinned Reports" (uppercase)
     - Cards (flex column, gap 12px):
       - Card 1: Category "Report · Daily Status" (Geist Mono 10, tertiary), title "Daily Status — 2026-04-23" (Inter 12/500, primary), snippet "5 cases run, 4 passed, 1 blocked..." (caption, max 60 chars), metadata "Generated 2h ago" (caption). Click → detail.
       - Card 2: Category "Report · Sprint Sign-off", title "Sprint 42 Sign-off (in progress)", snippet "Coverage snapshot, risk summary...", metadata "Last updated 1h ago".
     - CTA: "All reports →" (violet-400, click → F23)

Design tokens: Canvas operate `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`. Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`. Brand: violet-500 `#A78BFA`, teal-500 `#2DD4BF`. Semantic: pass `#34D399`, fail `#F87171`, warn `#FBBF24`, info `#60A5FA`. Borders: subtle `#2A3347`, strong `#3B4660`. Typography: DM Sans, Inter, Geist Mono.

Interactions: Click cards navigate to frames (F19, F21, F20), AI Value CTA → F24, cockpit tiles → F09, approval items → detail/approve, evidence CTAs → F20/F23. Hover: cards/items raise, CTAs underline. Loading: skeleton on board + AI Value strip + approvals.

States: Normal (all loaded), Empty approvals (empty message), Loading (skeletons), Error (red banner), Stakeholder (read-only approvals).

Accessibility: Tab order question → AI Value → board → cockpit → approvals → evidence. Focus violet 2px. Color-not-only: RAG color + text + pill + icons; overdue color + text + icon; AI color + bars + numbers. SR: landmarks, cards `<article>`, buttons with labels, errors `role="alert"`. Reduced motion: disable skeleton shimmer.

Realistic data: AI Value 184h, ₹14.2L, A1 87% A2 78% A4 84%, 2,341/412/89. Team Pass 91.2%, Defects 47, Release AMBER, Approvals 3 (1 overdue). Cockpit: 3 projects with RAG/defects/pass/progress. Evidence: 47 cases, 12 defects, A1+A2+A4 active, Release AMBER, reports.

**PM1 M5/M6 delivery. Full shell. Lead/Admin/Stakeholder role-gated. AI Value strip is the visual focal point and key business differentiator.** Apply NAVIGATION_CONTRACT.md.

Do NOT use Material Design 3. Hardcode hex. Primary=#2DD4BF, Secondary=#A78BFA. No tertiary. No orange.

WORKLIST ROW PATTERN: Adopt the worklist-row pattern from 01-home.html — dense rows with Confidence Lane on AI items, checkbox + status shape + title + sub-line + sparkline + quick actions. 56px row height, 4px vertical gap. CTAs on rows (Approve / Review / Start run) are teal #2DD4BF. AI confidence pills and Confidence Lane are violet #A78BFA / #C4B5FD. Never use violet on a CTA button.
```

---

## §5b. Frame F08c — Home · Empty Project First-Run (Lead/Admin, v2.2 NEW)

### Front matter
- **ID:** F08c
- **Added:** v2.2 (2026-04-24) — covers the "Start blank" landing from F10 Create Project Modal
- **Role gate:** Lead, Admin only (only Lead/Admin can create projects in PM1)
- **Canvas:** 1600 × 1024
- **Shell:** Full (rail 240px + top bar 56px + main 1320px, optional evidence rail)
- **Entry/Exit:** F10 "Start blank" choice → F08c. From F08c: Card 1 "Start with Jira →" → F11a · Card 2 "Import files →" → F12 Screen 2 (upload form direct) · Card 3 "Start with AI →" → F12 Screen 2b (AI form) · "Create your first test case manually →" → F16a · Skip "Explore the empty project →" → F08b zero-state

### Purpose
Zero-state Home view a Lead/Admin lands on immediately after creating a new project with the "Start blank" option. Populated F08a/F08b assume a project with real data (KPI cards, worklists, Active Defects Board) — an empty project rendered in those layouts looks broken with zeros everywhere. F08c is the welcoming guided path to populate the project with source connections, uploads, or AI generation. Renders ONCE per project — after any setup action completes, F08c is permanently replaced by F08b.

### Content regions

**Welcome strip (120 px, soft teal→violet gradient bg):**
- Title: "**Iksula Returns** is ready. Let's get it set up." — DM Sans 28/36 bold primary, project name in weight 700
- Sub: "Just created **2 min ago** by Yogesh M. · Operate mode · `Sprint 42 Day 9 of 14`" — Inter 13/18 secondary, sprint code in JetBrains Mono
- Right: "Project ID: `ORG-IKS / PRJ-RET`" small mono tag on overlay bg

**Three setup cards row (centered, 3 × ~390×280px, 24px gap):**
- **Card 1 — "Connect a source"** (teal accent, primary path): link/plug icon teal 48×48 + "~2 min" mono chip + title + description mentioning Jira/Confluence/Figma + feature chips `Jira Cloud · Confluence · Figma · GitHub` + **teal primary "Start with Jira →"** button + "or connect Confluence, Figma, GitHub" tertiary link
- **Card 2 — "Upload materials"** (teal accent): upload-cloud teal 48×48 + "~30 sec" chip + description mentioning XLSX/CSV/PDF/MP4 + feature chips `XLSX · CSV · PDF · MP4/MOV` + **teal primary "Import files →"** + "or drag files anywhere on this page" tertiary
- **Card 3 — "Let AI create your first tests"** (violet accent, AI path): sparkle ✨ violet 48×48 with glow + "~1 min" chip + violet "Fast" pill + title + description mentioning A1 Test Case Generator + feature chips `BDD · Traditional · Gherkin · Clarifications` + **violet primary "Start with AI →"** (this IS a violet CTA — exception for AI path only) + "A1 needs input — you'll provide it on the next screen" tertiary

**Skip row (48px, 32px top gap from cards):**
- Divider line with centered "OR" label
- "Prefer to start from scratch?" + "**Create your first test case manually →**" tertiary link

**Setup checklist strip (80px, 40px top gap):**
- "SETUP CHECKLIST" uppercase mono tertiary · "**0 of 4** complete · first-run setup, dismissable anytime"
- 4 empty-circle items horizontal: ◯ Connect a source / upload materials · ◯ Create your first test case · ◯ Invite a teammate · ◯ Create your first test run
- Right: "Dismiss checklist" tertiary link

**Two empty-state tiles (side-by-side, 640×160 each, 60px top gap):**
- Tile 1 "Your queue is empty" — clipboard icon + "Tasks will appear here once you create test cases or connect a source."
- Tile 2 "Nothing's happened yet" — clock icon + "Activity shows up here as you and your team start working — test runs, defects, approvals."

### States
- Fresh empty project (zero data, counts all `(0)`, checklist 0 of 4)
- Mode toggle Operate active
- "NEW" teal-tinted pill visible on project switcher in top bar
- Hover on cards: border accent + elevation lift

### Accessibility
- Tab order: top bar → rail → welcome → Card 1 → Card 2 → Card 3 → skip link → checklist items → Dismiss
- Focus rings on all 3 cards + checklist items + skip link + CTAs
- Color + icon (not color alone) for status chips if any

### Realistic data
- Project: **Iksula Returns** (RET, newly created)
- User: Yogesh M. (QA Lead, avatar YM teal)
- Time: Just created 2 min ago
- Sprint: Sprint 42 Day 9 of 14
- Project ID: `ORG-IKS / PRJ-RET`
- Left rail counts all `(0)`; Automation Studio + Data & Mocks disabled with lock icons

### Anti-drift constraints
1. Reuse top bar (8-slot) + left rail (Lead/Admin with Govern + QA Value "Lead+" violet chip) from F08b VERBATIM.
2. Card 3 is the ONLY violet content in the main area. Cards 1 and 2 are teal.
3. "NEW" pill on project switcher is teal-tinted (`rgba(45, 212, 191, 0.16)` bg + teal text), 11px uppercase JetBrains Mono.
4. No PM3 features (no SSO, no API Token, no PAT).
5. Disabled Automation Studio + Data & Mocks rail items must show lock icons with tooltip "PM2+".

---

## §6. Frame F09 — Projects List

### Front matter
- **ID:** F09
- **Role gate:** All (shows user's accessible projects)
- **Canvas:** 1600 × 1024
- **Shell:** Full (rail 272px + top bar 56px + main 1048px, no evidence rail)
- **Entry/Exit:** F07 (onboarding done), F08a/F08b (Projects rail link), F06 (sign-in) → F08a/F08b (select project) | F10 (Create modal, Lead/Admin)

### Purpose
All projects user has access to, grouped by Pinned / Recently accessed / All (alphabetical). Lead/Admin see "+ New project" CTA opening F10. QA Engineers see empty state with invite message if no projects.

### Content regions

**Question header (64px, padding 32px):**
- Left: "Which project do you want to work on?" (DM Sans 32/40) + "Select a project to continue. You can switch anytime." (Inter 16/24, secondary).
- Right: "+ New project" button (violet-500, Inter 14/600, padding 10px 20px, radius 8px, hover: violet-600) — Lead/Admin only. QA Engineer: button absent or grayed with tooltip "Only Leads and Admins can create projects."
- Margin-bottom 32px.

**Search + Filter bar (40px, margin-bottom 24px):**
- Search input: placeholder "Search projects...", background raised, border subtle, padding 10px 12px, radius 8px, icon left (search, tertiary gray), focus: border strong.
- Filter dropdown: "All projects" label (hidden), options "All / Pinned / Owned by me / Archived", background raised, border subtle.

**Pinned / Recently accessed / All sections (3 columns, gap 16px):**

Each section titled (DM Sans 16/24), contains project cards (280×320px): background base `#111827`, border subtle, radius 12px, padding 16px. Top row (flex, justify-space-between): project glyph + name (Inter 14/600, max 140px ellipsis) | pin icon (24×24, filled solid teal-500, click toggles state). Metadata: env chip "main" (Geist Mono 10, overlay background), last activity "2h ago" (tertiary), sprint chip "Sprint 42" (violet 10% background), RAG pill. Metrics grid (3 columns): Open defects "12" (Geist Mono 14) + Pass rate "87%" (green/amber/red) + Team size "5". Role indicator "You are: QA Engineer" (Inter 11/400, secondary, color by role). Button row: Open button (violet-500, padding 6px 16px, click → project home).

Pinned section: pin icon filled. Recently accessed: pin icon hollow. All section: cards sorted A-Z, pin icon hollow initially, fills on hover.

Empty state: centered (min-height 400px), folder icon (64px, tertiary) or illustration, heading "No projects yet" (DM Sans 24/32), subtext "You don't belong to any projects. Ask a QA Lead or Admin to invite you." (Inter 14/20, secondary). CTA (Lead/Admin): "Create your first project" (primary, violet). Help (QA Engineer): "In the meantime, explore the Knowledge Base." (Inter 12/400, secondary, "Knowledge Base" underlined, click → F15).

### States
- **Normal:** Projects loaded, grouped by Pinned / Recent / All.
- **Search active:** Grid filters live (debounce 200ms), term visible in input.
- **Filter active:** Grid shows matching projects (combined with search).
- **Loading:** Skeleton placeholders (shimmer, 3–6 cards), input + filter disabled.
- **Empty:** Empty state centered.
- **Pin animation:** Card fades (100ms) + animates to target section (bounce 200ms), grid reflows.

### Accessibility
- Tab order: Create → Search → Filter → cards (L-R, T-B) → View all recent link.
- Focus ring: violet 2px.
- Color-not-only: RAG color + text + pill; role color + text; last activity icon + text; pin state icon + tooltip.
- Screen reader: `<main>`, `<header>`, `<section aria-labelledby="">` for Pinned/Recent/All, cards `<article role="button" aria-label="">`, search `<label>` + `<input>`, filter `<select aria-label="">`.
- Reduced motion: disable fade + bounce.

### Realistic data
- Pinned: Iksula Commerce (main, 2h, Sprint 42, GREEN, 12 defects, 87%, 5 team), Iksula Payments (staging, 5h, Sprint 42, AMBER, 8 defects, 93%, 4 team).
- Recent: Iksula Mobile App (main, 1d, Sprint 41, RED, 23 defects, 78%, 6 team).
- All: Iksula Commerce, Iksula Mobile App, Iksula Payments, Iksula Web (archived).

### Stitch prompt
```
Design frame F09 - Projects List. Project navigation where users select which project to work on. Cards grouped by Pinned / Recently accessed / All, searchable and filterable.

Canvas 1600 × 1024. Shell: Full (rail 272px + top bar 56px + main 1048px, no evidence rail). Apply NAVIGATION_CONTRACT.md.

Layout:

1. Question Header (64px, padding 32px):
   - Left: "Which project do you want to work on?" (DM Sans 32/40, primary) + "Select a project to continue. You can switch anytime." (Inter 16/24, secondary, margin-top 8px).
   - Right: Create Project button "➕ New project" (violet-500, Inter 14/600, padding 10px 20px, radius 8px, hover: violet-600) — **Lead/Admin only**. QA Engineer: absent or grayed + tooltip "Only Leads and Admins can create projects."
   - Margin-bottom 32px.

2. Search + Filter bar (40px, margin-bottom 24px):
   - Search input (flex-grow, max 400px): placeholder "Search projects...", background raised `#1A2233`, border subtle, padding 10px 12px, radius 8px, Inter 14/400, icon left (search, tertiary). Focus: border strong.
   - Filter dropdown (width 120px): "All projects" label (hidden), options "All / Pinned / Owned by me / Archived", background raised, border subtle, Geist Mono 11. On change: filter grid.

3. "Pinned" Section (if exist):
   - Title: "Pinned" (DM Sans 16/24, primary, margin-bottom 12px)
   - Grid: 3 columns (auto-wrap), gap 16px
   - Project cards (280×320px):
     - Background: base `#111827`, border subtle, radius 12px, padding 16px
     - Top row (flex, justify-space-between, margin-bottom 12px): Project glyph (32×32) + name (Inter 14/600, primary, max 140px ellipsis) | Pin icon (24×24, filled solid teal-500, cursor pointer, tooltip "Unpin", click → toggle pin)
     - Metadata row 1 (flex, gap 8px, margin-bottom 8px): Env chip "main" (Geist Mono 10, overlay background, border subtle, radius 4px, padding 2px 6px) + Last activity "Last active 2h ago" (Geist Mono 10, tertiary, tooltip shows exact timestamp)
     - Metadata row 2 (flex, gap 8px): Sprint chip "Sprint 42" (Geist Mono 10, violet 10% background, border violet 28%, color violet-400, radius 4px) + RAG pill (e.g., "GREEN", green 10% background, border green 28%, text green, Geist Mono 10/500)
     - Metrics grid (3 columns, gap 8px, margin-top 12px): "Open defects" + "12" (Geist Mono 14) + subtext | "Pass rate" + "87%" (green/amber/red) + subtext | "Team size" + "5" (Geist Mono 14)
     - Role indicator (margin-top 12px): "You are: QA Engineer" (Inter 11/400, secondary, color by role: violet=Lead, teal=Admin, blue=Engineer, gray=Stakeholder)
     - Action row (margin-top 12px, flex, gap 8px): Pin icon (filled) + "Open" button (Inter 12/500, violet-500, canvas text, padding 6px 16px, radius 6px, click → project home F08a/F08b) + three-dot menu (future: Settings, Archive, Leave)
     - Hover: border strong, shadow increase, cursor pointer
   - Margin-bottom 32px.

4. "Recently accessed" Section (if applicable):
   - Title: "Recently accessed" (DM Sans 16/24, margin-bottom 12px)
   - Grid: 3 columns, same card layout as Pinned
   - Max 6 cards; if more, truncate + "View all recent →" (violet-400)
   - Cards same as Pinned but pin icon hollow (not filled) and recent timestamp emphasized
   - Margin-bottom 32px.

5. "All projects" Section:
   - Title: "All projects" (DM Sans 16/24) + subtitle "(Alphabetical)" (Inter 13/400, tertiary)
   - Grid: 3 columns (auto-wrap), gap 16px, scrollable if many
   - Cards: same as Pinned/Recent, all listed alphabetically
   - Pin icon on each: hollow initially, fills on hover (animation 50ms)
   - Click pin: card moves to Pinned with fade-out (100ms) + bounce slide-in (200ms), grid reflows
   - Margin-bottom 32px.

6. Empty State (if user has no projects):
   - Centered on canvas (min-height 400px, flex column center):
     - Icon: 📁 folder outline (64px, tertiary) or illustration (400×200px)
     - Heading: "No projects yet" (DM Sans 24/32, primary)
     - Subtext: "You don't belong to any projects. Ask a QA Lead or Admin to invite you." (Inter 14/20, secondary, max-width 400px)
     - CTA (Lead/Admin only): "Create your first project" (primary button, violet, canvas text, padding 10px 20px, radius 8px, click → F10)
     - Help (QA Engineer): "In the meantime, explore the Knowledge Base." (Inter 12/400, secondary, "Knowledge Base" underlined link, click → F15).

Interactions: Keyboard `g p` (projects), `Cmd+K`/`Ctrl+K` (search focus), Tab (cycle cards), Enter (open). Click: search filters live (debounce 200ms), filter dropdown filters grid, card body navigates (F08a/F08b), pin icon toggles + animates, Open button navigates, Create Project opens F10. Hover: cards raise, pin fills, buttons darken. Loading: skeleton placeholders (shimmer, 3–6).

States: Normal (projects loaded), Search active (live filter), Filter active (filtered grid, combined with search), Loading (skeletons), Empty (empty state centered), Pin animation (fade + bounce).

Design tokens: Canvas operate `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`. Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`. Brand: violet-500 `#A78BFA`, violet-600 `#8B5CF6`, teal-500 `#2DD4BF`. Semantic: pass `#34D399`, fail `#F87171`, warn `#FBBF24`. Borders: subtle `#2A3347`, strong `#3B4660`. Typography: DM Sans, Inter, Geist Mono.

Accessibility: Tab order Create → search → filter → cards (L-R, T-B) → view all link. Focus violet 2px. Color-not-only: RAG color + text + pill; role color + text; activity icon + text; pin state icon + tooltip. SR: `<main>`, `<header>`, `<section aria-labelledby="">` for sections, cards `<article role="button" aria-label="">`, search + filter with labels. Reduced motion: disable fade + bounce.

Realistic data: Pinned Iksula Commerce (main, 2h, Sprint 42, GREEN, 12, 87%, 5), Iksula Payments (staging, 5h, AMBER, 8, 93%, 4). Recent Iksula Mobile (main, 1d, RED, 23, 78%, 6). All: Commerce, Mobile, Payments, Web (archived).

PM1 M0/M1. Full shell (rail + top bar). All roles (show accessible projects). Create button Lead/Admin only. Reference NAVIGATION_CONTRACT.md.

Do NOT use Material Design 3. Hardcode hex. Primary=#2DD4BF, Secondary=#A78BFA. No tertiary.
```

---

## §7. Frame F10 — Create Project Modal

### Front matter
- **ID:** F10
- **Role gate:** Lead, Admin only
- **Canvas:** 1120 × 860 (Stage Modal)
- **Shell:** Overlay on backdrop (blur 4px, centered)
- **Entry/Exit:** F09 (Project List "+ New project"), top bar Quick Create → F09 (after creation, new project pinned)

### Purpose
Single-step modal form to create a new project. Fill project identity (name, description, icon), optionally link Jira, select data source (Jira / Upload / Blank), optionally invite team. After creation, modal closes and user lands on F09 with new project visible.

### Content regions

**Modal container (1120 × 860, centered):**
Background: backdrop dark `#0B0F17` opacity 0.7, blur 4px. Modal: background raised `#1A2233`, border subtle, radius 12px, padding 40px, elevation.3 shadow. Close X (24×24, top-right at x=1080 y=20, secondary, cursor pointer, hover: primary).

**Header (60px, margin-bottom 24px):**
Left: "Create new project" (DM Sans 24/32). Right: X icon (secondary, cursor pointer, click closes).

**Form content (720px, scrollable if needed, flex column, gap 20px):**

**Section A — Project identity (200px):**
- Project name (required): Label "Project name *" (Inter 12 uppercase, `#8A94A6`, red *), text input width 100% height 40px background overlay border subtle, padding 10px 12px, radius 8px, focus: border strong. Placeholder "e.g., Iksula Commerce". Async duplicate check (debounce 300ms): red border + error "Project name already in use" if duplicate. Margin-bottom 16px.
- Description (optional): Label "Description" (uppercase, no *), textarea 100% height 80px, same styling. Placeholder "What is this project for? (optional)". Character counter bottom-right "0 / 500" (Geist Mono 11, tertiary), max 500 enforced. Margin-bottom 16px.

**Section B — Project icon (80px):**
- Field: Label "Project icon" (uppercase). Picker: 8 avatar options (40×40 each), letter + gradient. Selected: 2px ring violet-500, others 1px subtle. Auto-select first combo. Margin-bottom 24px.

**Section C — Jira integration (100px):**
- Field: Label "Jira project key" (uppercase, no *), text input width 100% height 40px, placeholder "e.g., COM, PAY, MOB" (uppercase). Hint "If your team uses Jira, linking helps sync issues directly. (Optional)" (Inter 12/400, secondary). Validation on blur: green checkmark if valid, orange warning if not, gray "Jira not connected" chip if OAuth missing. Margin-bottom 24px.

**Section D — Data source choice (120px):**
- Title above: "How would you like to populate this project?" (Inter 13/400, secondary). Three radio cards (width 100% max 600px, height 80px, background overlay `#232C3F`, border subtle, radius 8px, padding 12px, flex row):
  - **Option 1 — Connect to Jira:** Radio (left, 20×20, hollow, filled violet selected) + title "Connect to Jira" (Inter 13/500, primary) + description "Fetch issues, stories, and test plans from your existing Jira project. Bi-directional sync enabled." (Inter 12/400, secondary, max 400px) + chip right "Recommended if you use Jira" (teal 10% background, border teal 28%, teal text, radius 4px, Geist Mono 10). Hover: border violet, cursor pointer. Selected: border 2px violet, background violet 5%.
  - **Option 2 — Upload files:** Same, no chip. Description: "Drag and drop requirement docs, test cases from Excel/CSV, or export files from TestRail, Zephyr, Xray, qTest."
  - **Option 3 — Start blank:** Same. Description: "Create an empty project and add content as you go. Best for new teams or greenfield projects."
  - Margin-bottom 24px.

**Section E — Team invites (100px):**
- Email chip input: Label "Team members (optional)" (uppercase, no *). Container width 100% min-height 100px, background overlay, border subtle, radius 8px, padding 10px 12px, flex wrap (chips + input). Chips (email): background raised `#1A2233`, border subtle, padding 4px 10px, radius 16px, X right (click removes). Input: transparent, border none, placeholder "Enter email and press Enter". Behavior: type → Enter → validate → chip → clear. Invalid: tooltip "Invalid email format" red. Margin-bottom 16px.
- Role selector: Label "Default role for invites" (uppercase, no *). Dropdown width 100% height 40px, background overlay, border subtle, options "QA Engineer" (default) / "QA Lead" / "Admin" / "Stakeholder". Hint "All invited users will receive this role. You can change roles individually later." (Inter 12/400, secondary). Margin-bottom 24px.

**Footer (56px, flex justify-space-between, margin-top 24px):**
- Cancel button (ghost): background transparent, color secondary, border 1px secondary, text "Cancel" (Inter 14/500), padding 10px 24px, radius 8px, hover: color primary + border primary, click closes modal.
- Create Project button (primary): background violet-500, color canvas, text "Create project" (Inter 14/600), padding 10px 24px, radius 8px, hover: violet-600, disabled if name empty (opacity 0.5, cursor not-allowed). Click: validate → POST /projects. Loading: spinner + "Creating project…" + disabled. Success: fade out (200ms accelerate), redirect F09 (new project pinned). Error: error banner below header (red background 10%, border fail red, icon + text + close/retry).

### States
- **Normal:** Form open, fields editable, Create enabled.
- **Loading:** Spinner in button, all fields + cancel disabled.
- **Success:** Modal fades out, navigate F09.
- **Error:** Modal stays open, error banner, Create returns normal.
- **Validation error:** Field red border + error text, Create still enabled.

### Accessibility
- Tab order: name → description → icon picker → Jira key → radio cards (1/2/3) → email → role → Cancel → Create.
- Focus ring: violet 2px.
- Color-not-only: Validation red text + icon + border; radio selected border + background + text; Jira validation icon + text.
- Screen reader: `role="dialog"`, `aria-modal`, `aria-labelledby`, form labels, radio `role="radio"` + `aria-checked`, error `role="alert"`.
- Reduced motion: disable modal animation, validation pulse, letter-avatar updates.

### Realistic data
- Project name: "Iksula Commerce"
- Description: "E-commerce platform - test cases, runs, and defect management for mobile and web. Primary focus: checkout flow, payments, inventory sync."
- Icon: "I" (violet+teal)
- Jira key: "COM" (green checkmark, valid)
- Data source: "Connect to Jira" (selected)
- Invites: priya.sharma@iksula.com (QA Engineer), rahul.kumar@iksula.com (QA Lead)
- Default role: "QA Engineer"

### Stitch prompt
```
Design frame F10 - Create Project Modal. Single-step modal form for Lead/Admin to create a new project. Overlaid on F09 (Projects List) with blur and center positioning.

Canvas 1120 × 860 (stage modal, centered on 1600×1024 backdrop).

Modal styling:
- Backdrop: 1600×1024 fill, `#0B0F17` at 0.7 opacity, blur 4px.
- Modal: background raised `#1A2233`, border subtle 1px, radius 12px, padding 40px, shadow elevation.3.
- Close X: top-right x=1080 y=20, 24×24, secondary color, hover: primary.

Layout (flex column):

1. Header (60px, margin-bottom 24px):
   - Left: "Create new project" (DM Sans 24/32, primary).
   - Right: X icon (secondary, cursor pointer, closes modal).

2. Form Content (720px, scrollable if needed, flex column, gap 20px):

   **Section A — Project identity:**
   - Project name * (required): label "Project name *" (Inter 12 uppercase, `#8A94A6`, red *), text input width 100% max full, height 40px, background overlay `#232C3F`, border subtle, padding 10px 12px, radius 8px, focus: border strong `#3B4660`. Placeholder "e.g., Iksula Commerce". Async duplicate check (debounce 300ms): red border + error below if duplicate. Margin-bottom 16px.
   - Description (optional): label "Description" (uppercase, no *), textarea 100% height 80px, same styling. Placeholder "What is this project for? (optional)". Character counter bottom-right "0 / 500" (Geist Mono 11, tertiary). Max 500 enforced. Margin-bottom 16px.

   **Section B — Project icon:**
   - Label "Project icon" (uppercase). Picker: 8 avatar options (40×40 each), letter + gradient. Selected: 2px border violet-500, others 1px subtle. Auto-select first combo. Margin-bottom 24px.

   **Section C — Jira integration (optional):**
   - Label "Jira project key" (uppercase, no *), text input width 100%, height 40px, background overlay, border subtle, placeholder "e.g., COM, PAY, MOB" (uppercase). Hint: "If your team uses Jira, linking helps sync issues directly. (Optional)" (Inter 12/400, secondary). Validation on blur: workspace Jira OAuth authorized → fetch project metadata. Valid: green checkmark + Jira logo icon (right). Invalid/not found: orange warning triangle. Not connected: gray "Jira not connected" chip (click for auth flow, out of scope). Margin-bottom 24px.

   **Section D — Data source choice (required-ish):**
   - Title above: "How would you like to populate this project?" (Inter 13/400, secondary)
   - Radio card 1 — Connect to Jira: width 100%, height 80px, background overlay, border subtle, radius 8px, padding 12px, flex row. Radio button (20×20, hollow initially, filled violet selected) + content (flex column): title "Connect to Jira" (Inter 13/500, primary), description "Fetch issues, stories, and test plans from your existing Jira project. Bi-directional sync enabled." (Inter 12/400, secondary, max 400px) + chip right-side "Recommended if you use Jira" (Geist Mono 10, background teal 10%, border teal 28%, color teal, radius 4px, padding 4px 8px). Hover: border strong, cursor pointer. Selected: border 2px violet-500, background linear-gradient violet 5%.
   - Radio card 2 — Upload files: same layout, no chip. Description: "Drag and drop requirement docs, test cases from Excel/CSV, or export files from TestRail, Zephyr, Xray, qTest."
   - Radio card 3 — Start blank: same. Description: "Create an empty project and add content as you go. Best for new teams or greenfield projects."
   - Margin-bottom 24px.

   **Section E — Team invites (optional):**
   - Email chip input: label "Team members (optional)" (Inter 12 uppercase, no *). Container width 100%, min-height 100px, background overlay, border subtle, radius 8px, padding 10px 12px. Flex row wrap: chips (email, background raised `#1A2233`, border subtle, padding 4px 10px, radius 16px, Inter 12/400, X icon right removes chip) + text input (transparent background, border none, Inter 14/400, placeholder "Enter email and press Enter"). Behavior: type email → Enter → validate format → add chip → clear input. Invalid: tooltip "Invalid email format." red text. Margin-bottom 16px.
   - Default role for invites: label "Default role for invites" (Inter 12 uppercase, no *), dropdown width 100%, height 40px, background overlay, border subtle, padding 10px 12px, radius 8px. Options: "QA Engineer" (default) / "QA Lead" / "Admin" / "Stakeholder". Hint: "All invited users will receive this role. You can change roles individually later." (Inter 12/400, secondary). Margin-bottom 24px.

3. Footer (56px, flex justify-space-between, margin-top 24px):
   - Cancel button (ghost): background transparent, color secondary, border 1px secondary, text "Cancel" (Inter 14/500), padding 10px 24px, radius 8px. Hover: color primary, border primary. Click: close modal → F09.
   - Create project button (primary): background violet-500, color canvas, text "Create project" (Inter 14/600), padding 10px 24px, radius 8px. Hover: background violet-600. Disabled if name empty (opacity 0.5, cursor not-allowed). Click: POST /projects with {name, description, icon, jiraKey?, dataSource, inviteEmails[], defaultRole}. Loading: spinner + "Creating project…" + button disabled. Success: modal fades out (200ms accelerate), navigate F09 (new project pinned + optional toast "Project created!"). Error: modal stays, error banner below header (red background 10%, border fail red, icon + text + close/retry), Create button returns normal.

Interactions: Keyboard Escape (close), Tab (cycle fields), Shift+Tab (reverse), Enter on email (add chip). Click: X (close), Cancel (close), Create (submit), icon avatars (select), radio cards (select), email chip X (remove), role dropdown (select), Jira key blur (validate). Validation: project name (async duplicate, red border + error), Jira key (checkmark/warning/chip), email (tooltip invalid), data source (visual selection). Loading: spinner in button, fields disabled, Cancel disabled.

States: Normal (form open, editable, Create enabled), Loading (spinner, disabled), Success (fade out, F09), Error (banner stays, Create normal), Validation (field red + error, Create enabled).

Design tokens: Canvas operate `#0B0F17`, base `#111827`, raised `#1A2233`, overlay `#232C3F`. Text: primary `#F1F5F9`, secondary `#C7D0DC`, tertiary `#8A94A6`. Brand: violet-500 `#A78BFA`, violet-600 `#8B5CF6`, teal-500 `#2DD4BF`. Semantic: pass `#34D399`, fail `#F87171`. Borders: subtle `#2A3347`, strong `#3B4660`. Typography: DM Sans, Inter, Geist Mono.

Accessibility: Tab order name → description → icon → Jira key → data source radios (1/2/3) → email → role → Cancel → Create. Focus violet 2px. Color-not-only: validation red text + icon + border; radio border + background + text; Jira icon + text. SR: `role="dialog"`, `aria-modal`, `aria-labelledby="modal-title"`, form labels, radio `role="radio"` + `aria-checked`, error `role="alert"`, buttons with labels. Reduced motion: disable modal animation, validation pulse.

Realistic data: Name "Iksula Commerce", Description "E-commerce platform - test cases, runs, and defect management for mobile and web. Primary focus: checkout flow, payments, inventory sync.", Icon "I" (violet+teal), Jira key "COM" (valid, green check), Data source "Connect to Jira" (selected), Invites priya.sharma@iksula.com (QA Engineer), rahul.kumar@iksula.com (QA Lead), Default role "QA Engineer".

PM1 M0 delivery. Lead/Admin only. Stage modal overlay on F09 backdrop. Reference NAVIGATION_CONTRACT.md for top bar Quick Create integration.

Do NOT use Material Design 3. Hardcode hex. Primary=#2DD4BF, Secondary=#A78BFA. No tertiary.
```

---

## §8. Generation order recommendation

Generate frames in this sequence to validate shell + navigation contract + AI Value strip:
1. **F06** (Sign In) — validates dark theme, branding
2. **F07** (Onboarding) — validates top bar disabled state, stepper motif
3. **F08a** (Home QA Engineer) — validates full shell, evidence rail, confidence lane, outcome board
4. **F08b** (Home Lead/Admin) — **validate AI Value strip here, make it focal point**
5. **F09** (Projects List) — validates full shell, pin/sort mechanics
6. **F10** (Create Modal) — validates stage modal, form patterns

After F08b, pause and verify: AI Value strip prominent, all anti-drift constraints applied, no MD3 tokens, primary teal + secondary violet only.

---

**Total file length target: 2,200–2,800 lines (this document). All 6 frames consolidated with no duplication of 01_SYSTEM.md content. Each frame has Stitch prompt with anti-drift reminder. Ready to paste into Stitch for generation.**
