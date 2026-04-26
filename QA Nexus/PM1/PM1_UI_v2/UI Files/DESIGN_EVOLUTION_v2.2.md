# PM1_UI_v2 Design Evolution — v2.2 Consolidation (2026-04-24)

> **Purpose:** This document captures every design decision, frame addition, and convention locked during the 17-frame Claude Design build (F06 through F14m1). It supersedes prior guidance in 01_SYSTEM.md for anything listed below. Treat this file as the canonical change log from v2.0 → v2.2.

---

## 1. Frame Inventory — Updated from 23 to 37 Frames

**v2.0 inventory was nominally 23 frames (F06–F28), but was actually undercounting F16a/b/c as one line. During rendering and specification we:**
- Corrected the F16a/b/c undercount (these have always been 3 separate Test Case Editor variants)
- Split F11 into 3 sub-frames (Authorize / Map / Verify)
- Split F07b tri-mode into 3 separate frames: **F07b** (Invited QA Engineer), **F07c** (Invited Stakeholder), **F07d** (Invited Lead/Admin) — each role deserves a dedicated render and validation pass
- Added F06b (Set / Reset Password, dual-mode) to cover the invite-magic-link + forgot-password flows
- Added F08c (Home · Empty Project First-Run) to cover the "Start blank" landing from F10
- Added F14m1, F14m2, F14m3 modal companions for requirement CRUD
- Added F27m1 (Invite User Modal) for ongoing team invites after Day-0 bootstrap
- **Key role-gate clarifications:** F07 is ONLY for the workspace founder. All invited members see F07b / F07c / F07d based on their role. F07 Step 3 handles the ONE-TIME bulk invite during founder onboarding; F27m1 handles ALL subsequent invites.

**FINAL inventory (41 frames, 41 locked as of 2026-04-25) — PM1 UI is closed (v2.10).**

| ID | Name | Status | Provenance | Added in |
|---|---|---|---|---|
| F06 | Sign In | ✅ Locked | Claude Design | v2.0 |
| F06b | Set Password — Invite Setup | ✅ Locked | Claude Code | v2.3 (added) → v2.7 (split) |
| F06c | Reset Password — Forgot-Password flow | ✅ Locked | Claude Code | v2.7 (split) |
| F07 | Workspace-Founder Onboarding | ✅ Locked | Claude Design | v2.0 (scope clarified v2.2) |
| F07b | Invited QA Engineer First-Run Onboarding | ✅ Locked | Claude Code | v2.4 (added) → v2.6 (split) |
| F07c | Invited Stakeholder First-Run Onboarding | ✅ Locked | Claude Code | v2.6 (split) |
| F07d | Invited Lead/Admin First-Run Onboarding | ✅ Locked | Claude Code | v2.6 (split) |
| F08a | Home · QA Engineer | ✅ Locked | Claude Design | v2.0 |
| F08b | Home · Lead / Admin Dashboard | ✅ Locked | Claude Design | v2.0 |
| F08c | Home · Empty Project First-Run | ✅ Locked | Claude Design | v2.2 (NEW) |
| F09 | Projects List | ✅ Locked | Claude Design | v2.0 |
| F10 | Create Project Modal | ✅ Locked | Claude Design | v2.0 |
| F11 | Source Connect Jira · Step 1 Authorize | ✅ Locked | Claude Design | v2.1 split |
| F11b | Source Connect Jira · Step 2 Map | ✅ Locked | Claude Design | v2.1 split |
| F11c | Source Connect Jira · Step 3 Verify | ✅ Locked | Claude Design | v2.1 split |
| F12 | Upload Requirements / Test Cases Modal | ✅ Locked | Claude Design | v2.0 |
| F13 | Imported Files List | ✅ Locked | Claude Design | v2.0 |
| F14 | Requirements | ✅ Locked | Claude Design | v2.0 |
| F14m1 | Edit / Add Requirement Modal | ✅ Locked | Claude Design | v2.2 (NEW) |
| F14m2 | Link Test Case Modal | ✅ Locked | Claude Code | v2.2 (added) → v2.7-rapid |
| F14m3 | Convert to Jira Story Modal | ✅ Locked | Claude Code | v2.2 (added) → v2.7-rapid |
| F15 | Knowledge Base | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F16a | Test Case Method Chooser | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F16b | A1 Generate from Requirement | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F16c | Bulk Import Test Cases | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F17 | Test Case Library | ✅ Locked | Claude Design | v2.0 |
| F18 | Test Suites | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F18m1 | Edit Suite Modal | ✅ Locked | Claude Code | v2.8 (NEW, Option B) |
| F26m1 | Agent Model Assignment Modal | ✅ Locked | Claude Code | **v2.10 (NEW)** |
| F28m1 | LLM Provider Configuration Modal | ✅ Locked | Claude Code | **v2.10 (NEW)** |
| F19 | Run Console | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F20 | Run Results | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F21 | Defects Hub | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F22 | Defect Detail | ✅ Locked | Claude Design | v2.0 |
| F23 | Reports Studio | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F24 | QA Value Dashboard | ✅ Locked | Claude Design | v2.0 |
| F25 | Executive Dashboard (Prove mode) | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F26 | Agents | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F27 | Users & Roles | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |
| F27m1 | Invite User Modal | ✅ Locked | Claude Code | v2.5 (added) → v2.7-rapid |
| F28 | Settings & Audit | ✅ Locked | Claude Code | v2.0 → v2.7-rapid |

**Final tally: 39 of 39 locked. Provenance: 17 Claude Design + 22 Claude Code.**

**Claude Design (17, in `frame  html view/`):** F06, F07, F08a, F08b, F08c, F09, F10, F11, F11b, F11c, F12, F13, F14, F14m1, F17, F22, F24.

**Claude Code (24, in `frames - claude code build (PM1 v2.6-v2.8)/`):** F06b, F06c, F07b, F07c, F07d, F14m2, F14m3, F15, F16a, F16b, F16c, F18, F18m1, F19, F20, F21, F23, F25, F26, F27, F27m1, F28, **F28m1, F26m1** (added v2.10).

**Final tally: 41 of 41 locked. Provenance: 17 Claude Design + 24 Claude Code.**

---

## 2. Design System — Quiet Intelligence / Evidence Mesh (Finalized)

### 2.1 Primary / Secondary Color Rule (CRITICAL)

The most important convention solidified during the build: **teal is system, violet is AI**.

- **Primary = teal `#2DD4BF`** — every system CTA, confirm action, active state, selected-row accent, coverage bar at ≥67%, pass chip, link. Examples: "Save changes", "Link 2 tests", "Finish setup · Import 142 issues", "+ Import", "+ New Import", "View cases", selected-row left-accent bar.
- **Secondary = violet `#A78BFA`** — reserved EXCLUSIVELY for AI indicators and AI actions. Examples: "✨ Generate tests" (violet ghost on moderate-coverage rows, violet FILLED on 0-coverage rows where A1 is emphasized), A1 Suggestions tab pill, Evidence Rail "A1 SUGGESTS" block, violet ✨ sparkle icons, A1 live log timestamps, "✨ Polish with A1" helper, "✨ Draft more with A1" link, "Let AI Help" method card in F12, "Let AI create your first tests" card in F08c, Parent Epic chip outline (Epic = Requirement Group with AI-adjacent grouping semantics), the violet "LEAD" role pill (visual differentiator only), stepper-current-step pulse (F11).

**Important:** Save / Finish / Confirm / Import / Link are ALWAYS teal — they are system confirm actions, NOT AI actions. Only the `✨` sparkle-prefixed buttons and A1-indicator elements are violet.

This was a departure from earlier v1 conventions where violet was used more broadly. **All 39 locked frames observe this rule** — verified across both the Claude Design batch and the Claude Code Plan A batch.

### 2.2 Canvas + Surface Tokens (Hardcoded)

```css
--canvas:   #0B0F17;  /* deepest bg, behind everything */
--base:     #111827;  /* main content bg */
--raised:   #1A2233;  /* cards, rows */
--overlay:  #232C3F;  /* chips, tags, secondary surfaces */
```

### 2.3 Text Tokens

```css
--text-primary:   #F1F5F9;  /* headings, key values */
--text-secondary: #C7D0DC;  /* body text */
--text-tertiary:  #8A94A6;  /* labels, helpers, timestamps */
```

### 2.4 Semantic Colors

```css
--pass: #34D399;  /* completed, ✓ valid, 100% coverage, green status */
--fail: #F87171;  /* failed, error, P0 critical, defect chip */
--warn: #FBBF24;  /* in progress, pending action, P1 high, flaky */
```

### 2.5 Chip Color Maps (Strict)

**Priority chips:**
- P0 Critical → fail red `#F87171`
- P1 High → warn amber `#FBBF24`
- P2 Medium → teal `#2DD4BF`
- P3 Low → tertiary gray

**Status chips:**
- Draft → tertiary
- Active → teal
- Done → pass green
- Blocked → fail red

**Coverage bars:**
- 100% → pass green
- ≥67% → teal primary
- 33–66% → warn amber
- <33% → fail red
- 0% → overlay gray (with "No coverage yet" tertiary label)

**Run status:**
- Pass → green
- Fail → red
- Flaky → amber
- Not run → tertiary

### 2.6 Atlassian Issue Type Dots (Jira-synced data)

- Story → blue 10×10 dot
- Bug → red dot
- Epic → purple dot
- Task → green dot
- Sub-task → light purple dot

Used in F11b, F13 file icons, F14 requirement cards, F14m2 test case rows.

### 2.7 File-Type Icon Colors

- XLSX / XLS → green
- CSV → teal
- PDF → red
- MP4 / MOV / MPEG → violet (maps to A1/AI feel; also because video = "richer input")
- HTML → overlay gray
- FIG (Figma) → violet with triangle glyph

### 2.8 Typography Conventions

- **Inter** — ALL UI body text, labels, buttons, descriptions
- **DM Sans** — display headings 18px+ (page titles, modal titles, card titles, big percentages, hero text)
- **JetBrains Mono** — system identifiers and values: requirement IDs (`RET-142`, `REQ-034`), test case IDs (`TC-RET-401`), defect IDs (`DEF-087`), import IDs (`#242`), sprint codes (`Sprint 42`), custom field keys (`customfield_10020`), URLs (`iksula.atlassian.net`), project IDs (`ORG-IKS / PRJ-RET`), timestamps (`09:41 AM`, `10:12:14`), file sizes (`1.8 MB`, `240 KB`, `12.4 MB`), percentages (`67%`, `100%`), counts and fractions (`8/12`, `3 of 3`), latency metrics (`312ms`, `1.8s`).

DM Sans and Inter are both Google Fonts. JetBrains Mono is also free. Note: earlier brief mentioned Geist Mono — final canon is **JetBrains Mono** (established from F11a onwards).

---

## 3. UX Patterns Canonized During Build

### 3.1 Modal Size Canon

| Modal type | Dimensions | Used in |
|---|---|---|
| Stage Modal (large, complex) | 1120 × 860 | F10, F11a/b/c, F12 |
| Edit Modal (focused single entity) | 960 × 720 | F14m1 |
| Picker Modal (multi-select list) | 720 × 640 | F14m2 |
| Confirm Modal (lightweight, deferred) | 480 × 360 | F14m3 (when built) |

All modals use scrim `rgba(0, 0, 0, 0.72)` + blur(4px) over the underlying page dimmed at 35 % opacity.

### 3.2 Evidence Rail Pattern

A persistent 280 px right-side panel shown when an item is selected in a list or table. Used in:
- F13 (import detail with live A1 log)
- F14 (requirement detail with coverage + A1 suggestions + traceability)
- F17 (test case detail)
- F22 (defect detail / 5-Layer RCA accordion)

Evidence Rail structure: overlay bg, 56 px header with ID + NEW/status pill + close ×, scrollable body with blocks (metadata strip, progress/coverage card, file list, A1 log, linked items, actions footer).

### 3.3 Activity Sidebar Pattern

A 280 px right-side timeline panel for multi-step operations (distinct from Evidence Rail). Used in:
- F11a/b/c wizard (Integration History timeline with teal/violet pulsing dots)
- F13 Evidence Rail (live A1 generation log)

Structure: "INTEGRATION HISTORY" or similar uppercase mono header, vertical timeline with colored 8 px dots + vertical connector line, each entry = mono timestamp + Inter body + semantic color (teal complete, violet pulsing current, gray pending). Bottom "Webhook Health" or status chip.

### 3.4 Wizard Pattern (3-Step with Stepper)

F11a/b/c established the canonical wizard pattern:
- Stage Modal 1120 × 860
- 120 px stepper header (circles: pass-green check for completed, violet pulse for current, gray outline for future; connectors color to current step)
- 620 px middle content region (ONLY THIS CHANGES between sub-frames)
- 280 px Activity Sidebar on right (consistent across all sub-frames, progressively updates)
- 120 px footer with step label + context line + Back / Cancel / Next CTA

Wizards SHOULD be split into sub-frames (Fna, Fnb, Fnc) rather than rendered as a single frame with state switches.

### 3.5 Welcome Strip + Setup Cards Pattern (F08c)

For first-run / empty-state surfaces:
- 120 px welcome strip with subtle teal→violet gradient background
- 3 large setup cards in a row (each ~390 × 280 px) — Card 1 + Card 2 teal (system paths), Card 3 violet (AI path)
- Skip-to-blank link row below
- Setup checklist strip (4 items with empty circles)
- Empty-state tiles where data cards would live in the populated view

### 3.6 Method Chooser Pattern (ContextQA-inspired, F12)

Three-card grid that asks "how do you want to do this?":
- Card 1 violet: "Let AI Help"
- Card 2 teal: "Upload Files" (or equivalent direct action)
- Card 3 gray: "Create Manually" (escape hatch)

Each card: accent color dot + title + description + feature chip row + CTA button + meta chip (duration estimate).

When entering from a context that already specified the method (e.g., F10 "Upload files" → F12), skip the method chooser and land directly on the downstream form. Show the method chooser as a small 320 × 220 thumbnail reference panel to indicate the alternate entry path.

### 3.7 Sync Warning Banner (Jira-synced entities, F14m1)

When editing a Jira-synced entity, render an amber-tinted warning banner at the top of the form:
- Background: `rgba(251, 191, 36, 0.10)` with 1 px warn border
- ⚠️ icon + "Changes sync to Jira — edits push bidirectionally to `RET-###` on `iksula.atlassian.net`. Uncheck 'Sync changes' to edit locally only."
- Sync toggle ON (teal) by default

### 3.8 Locked/Disabled Row Pattern (F14m2)

When showing items in a list that can't be re-selected (already linked, already imported, etc.):
- Keep the checkbox visually checked
- Add 🔒 lock icon tertiary next to the checkbox
- Add "Already linked" or similar tertiary annotation in the row's right margin
- Don't grayscale the row — just use the lock + annotation to signal unavailability

### 3.9 Selected-State Indicator (rows in lists with Evidence Rail)

When a row is selected and its detail is shown in the Evidence Rail:
- 4 px teal left-accent bar
- Card/row bg tinted `rgba(45, 212, 191, 0.04)` — subtle, not dominant
- Only one row selected at a time

### 3.10 Collapsible Sections

For long forms with advanced fields (F14m1 Tags & Links, Custom Fields), use collapsible sections with uppercase mono headers + right-aligned counts + chevron ⌃ toggle. Default collapsed for Advanced fields; expanded for primary fields.

---

## 4. Realistic Data Canon (Anchored during build)

### 4.1 Projects in the Iksula Services workspace

| Key | Name | Status | Notes |
|---|---|---|---|
| CART | Iksula Commerce | main (teal, healthy) | Previously connected |
| PAY | Iksula Payments | staging (amber) | Previously connected |
| AUTH | Iksula Mobile App | main (green) | Previously connected |
| **RET** | **Iksula Returns** | new (just created) | **Primary demo project for the build** |
| OPS | Iksula Internal Ops | available (not connected) | Seen only in F11b project picker |

### 4.2 Jira Instance

- Domain: `iksula.atlassian.net`
- Auth method PM1: OAuth 2.0 3LO only
- Auth methods PM3 M17: +API Token + Email, +PAT (on-prem), +custom OAuth, +per-project
- Workspace: 12 projects visible

### 4.3 Users / Team

- **Yogesh M.** — QA Lead (primary persona, owns most actions) — avatar YM teal
- Priya S. — QA Engineer — avatar PS violet
- Rahul K. — QA Engineer — avatar RK warm
- Arjun M. — QA Engineer — avatar AM tan
- Neha D. — QA Engineer — avatar ND red
- Rohan K. — QA Engineer — avatar RK2 warm variant

### 4.4 Sprint Context

- Current: **Sprint 42** — Day 9 of 14
- Future: Sprint 43 (for forward-dated requirements)

### 4.5 Sample Data

**Files (uploaded in import #242):**
- `return_policy_v2.xlsx` — 1.8 MB — 34 requirements extracted
- `legacy_refund_test_cases.csv` — 240 KB — 12 test cases found
- `customer_return_flow_recording.mp4` — 12.4 MB — no A1 generation (video)

**Import IDs:**
- `#241` — RET Jira sync, completed, 142 issues imported
- `#242` — file upload, IN PROGRESS (23%, ~47s remaining, 8 A1 drafts so far)
- `#240` — figma_mocks_checkout.fig, Pending Action (OAuth re-auth needed)
- `#239` — q2_sprint_42_stories.xlsx, Completed, 34 cases (A1)
- `#238` — confluence_auth_module_prd.html, Failed (403 Forbidden)
- `#237` — bulk_defect_export.csv, Completed, 0 cases (defects only)
- `#236` — customer_flow_demo.mp4, Completed, 0 cases (no A1)
- `#235` — cart_regression_suite.xlsx, Completed, 89 cases

**Requirement IDs:**
- Jira-synced: `RET-142`, `RET-139`, `RET-137`, `RET-136`, etc.
- Uploaded: `REQ-034`, `REQ-033`, `REQ-032`
- Epic: `RET-E-12 · Refund system`
- Defect: `DEF-087`

**Test case IDs:**
- Linked to RET-142: `TC-RET-401`, `TC-RET-402`, `TC-RET-403` (covered), `TC-RET-404` (gap), + 4 more
- A1 drafts: `TC-RET-405`, `TC-RET-411`
- Other: `TC-RET-418`, `TC-RET-423`

**Project ID format:** `ORG-IKS / PRJ-RET`

**Timestamps anchored:**
- OAuth authorized: `09:41 AM`
- Workspace detected: `09:42 AM`
- Mapping saved: `09:43 AM`
- Test fetch / Verifying: `09:44 AM`
- Import #242 started: `10:12 AM`
- A1 log stream: `10:12:14`, `10:12:16`, `10:12:19`, `10:12:22`, etc.

### 4.6 Integration Health Defaults

- Connection latency: `312ms`
- Webhook: Registers on save · 2-min fallback poll
- Field mapping: 8 / 8 valid · 3 auto-mapped · 5 standard
- Sync Mode: Bidirectional · QA Nexus ↔ Jira · comments mirrored

---

## 5. Role Gating (Finalized)

| Frame | All Roles View | Lead / Admin Only | QA Engineer Restrictions |
|---|---|---|---|
| F06 Sign In | ✅ | — | — |
| F07 Onboarding | ✅ | — | — |
| F08a Home QA | QA Engineer only | — | Hides Govern + QA Value |
| F08b Home Dashboard | ✅ | Reads Lead | Hides Govern |
| **F08c Home Empty** | — | ✅ (only Lead/Admin can create projects) | Hidden |
| F09 Projects List | ✅ | — | Can view all; Lead/Admin can create new |
| F10 Create Project | — | ✅ | Hidden |
| **F11a/b/c Jira Wizard** | — | ✅ | Hidden |
| F12 Upload Modal | ✅ | — | — |
| F13 Imported Files | ✅ | Delete only | — |
| F14 Requirements | ✅ | Edit any / Convert to Jira / Delete | Edit own only |
| **F14m1 Edit Requirement** | ✅ (own only) | Edit any | — |
| **F14m2 Link Test Case** | ✅ | — | — |
| F17 Test Case Library | ✅ | Bulk actions | — |
| F22 Defect Detail | ✅ | Close / Reopen | — |
| F24 QA Value | — | ✅ (Lead+) | Hidden — shows "Lead+" violet pill in rail |

Stakeholder / External persona: hides Govern section; shares QA Engineer view elsewhere.

---

## 6. PM3 Scope Additions (Already Propagated to PRD / ERD / Milestones)

During the F11 build, we confirmed PM1 uses OAuth 2.0 3LO only, and decided PM3 M17 would add the auth alternatives. Those updates landed in:

- **PRD.md** — added FR-063 (multi-method Jira auth), FR-064 (on-prem Server/DC PAT), M17 row expansion, L1 component refinement, Deferred list update
- **ERD.md** — TB-013 jira_integrations schema expanded (auth_method ENUM, project_id nullable, api_token_encrypted, api_user_email, custom_oauth_provider_id, self_signed_cert_trusted, last_test_connection_* fields, CHECK constraint), new TB-013b jira_custom_oauth_providers table, EP-006b/c/d/e endpoints, Auth Method Matrix, PM3 flow notes
- **MILESTONE_REGISTRY.md** — M17 row expanded to include Jira auth alternatives
- **Milestone_M17_Enterprise_Auth_Slack.md** — frontmatter, H1, Key Deliverables, Success Criteria updated

No further work needed on those files for the PM3 scope.

---

## 7. Deferred / Open Items

- **F14m3 Convert to Jira Story Modal** — lightweight confirmation + field mapping preview. Can ship as a generic confirm pattern without a dedicated design frame unless stakeholder demo demands it.
- **F08c mini-CTA thumbnail polish** — the "Create requirement" stub inside the F14m1 Add-mode thumbnail landed subtle; considered acceptable.
- **A1 suggestions tab on F14** — rendered as a filter state with violet NEW pill; may warrant a distinct visual hero in later iterations.
- **Frames not yet rendered (as of v2.2):** F15, F16a, F16b, F16c, F18, F19, F20, F21, F23, F25, F26, F27, F28 (12 remaining at the time of v2.2 freeze).
- **Claude Design quota** — paused here, 17/29 frames locked at v2.2. Subsequent rendering picked up via Claude Code per Plan A (see v2.7-rapid below). All 39 frames now locked.

---

### Final state (v2.10, 2026-04-25)

**PM1 UI inventory closed at 41 of 41 frames.** v2.10 added F28m1 + F26m1 to cover the Day-0 LLM configuration flow. Subsequent UI work belongs to PM2 scope (advanced agents, web testing, mobile testing prep) and lives in a fresh `PM2_UI/` folder.

- **Provenance:** 17 Claude Design + 24 Claude Code = 41 total.
- **Folder layout:** Claude Design frames in `frame  html view/`, Claude Code frames in `frames - claude code build (PM1 v2.6-v2.8)/`. Future Claude Design touch-up passes write to the original `frame  html view/` folder without conflict.
- **Anti-drift verification:** Every frame audited for the binding rules (teal=system, violet=AI, no MD3, hardcoded tokens, 8-slot top bar, 6-section left rail, realistic Iksula data canon). All 39 pass.

---

## 8. Version History

| Version | Date | Change |
|---|---|---|
| v2.0 | 2026-04-22 | Initial 5-file consolidation (01–05) from 29-file PM1_UI v1 → 23 frames |
| v2.1 | 2026-04-24 (AM) | F11 split into F11a/F11b/F11c (3 sub-frames) |
| v2.2 | 2026-04-24 (PM) | F08c, F14m1, F14m2, F14m3 added. Teal=system / violet=AI rule formally canonized. Realistic data anchored to Iksula Returns flow. PM3 Jira auth alternatives fully propagated. |
| v2.3 | 2026-04-24 (EOD) | F06b Set / Reset Password (dual-mode) added to cover invite-magic-link + forgot-password flows. Reuses F06 Left Brand Panel. Handles Mode A (invite setup for new users → routes to F07 or F07b) and Mode B (password reset → routes to F06 with email pre-filled). Password strength meter with 4-tier semantic palette + 4-item requirements checklist + live token countdown. Error states designed: expired token, already-used token, invalid token. No SSO, no violet — auth pages are AI-free. |
| v2.4 | 2026-04-24 (late EOD) | F07b Invited Team First-Run Onboarding (tri-mode) added to close the UX gap between F06b password set and F08a/F08b Home for invited members. F07 scope clarified as workspace-founder-only (person who creates the workspace). F07b handles the 3 invited-member flows: Mode A QA Engineer (AI agent tour of A1/A2/A4 + first-action picker routing to F16a / F17 / F08a), Mode B Stakeholder (dashboard tour + first-action picker routing to F24 / F23 / F08b), Mode C Invited Lead/Admin (agent tour + Govern-access note + first-action picker routing to F08b / F11a / F27). Render depicts Mode A as primary with Mode B and Mode C as 280×160 dimmed thumbnail reference panels in the welcome header corners. Renders once per user (first_login flag). |
| v2.5 | 2026-04-24 (late-late EOD) | F07 Pattern A deferred routing canonized + F27m1 Invite User Modal added. Pattern A: F07 Step 2 (data source choice) is radio-only wizard state; no external routing fires during Step 2. After Step 3 submit, backend atomically creates project + sends invites in one transaction, then routes to F11a (Jira), F12 (Upload), or F09 (Blank). User can abandon Jira/Upload mid-flow without losing project or invites. F27m1 handles ongoing invites AFTER Day-0 bootstrap — per-user role override, per-user project assignment, Senior QA organizational label, existing-user detection, 720×640 picker modal pattern matching F14m2. Distinct from F07 Step 3 (one-time founder bulk invite with default-role only). Lead inviters cannot assign Admin role (RBAC gate). Frame count 31 → 32. |
| v2.6 | 2026-04-24 (deep EOD) | F07b tri-mode split into 3 separate frames: F07b Invited QA Engineer, F07c Invited Stakeholder, F07d Invited Lead/Admin. Each role now has its own dedicated frame, render, and validation pass — matching the F11 split pattern rather than the multi-mode thumbnail pattern. F07c omits the AI agent tour entirely (Stakeholders don't work with agents operationally) and uses NO violet on the frame. F07b and F07d share the A1/A2/A4 agent tour; F07d adds a Govern Access Strip between the agent tour and first-action picker. Frame count correction 32 → 37: (a) split F07b adds F07c + F07d (+2), (b) prior F16a/b/c undercount correction (+3 — these have always been 3 Test Case Editor variants but were counted collectively in v2.0). Net: 5 additional frames surfaced in the inventory. |
| v2.7 | 2026-04-24 (late night) | F06b dual-mode split into 2 separate frames: F06b Set Password (Invite Setup — new user activating account via invite magic link) + F06c Reset Password (existing user via forgot-password flow). Same split rationale as F07b → F07b/c/d: each auth path gets a dedicated route, URL, and rendered HTML. F06b renders "Welcome, Priya!" with Good/3-of-4 strength. F06c renders "Reset your password" with the target email identifier (`priya.s@iksula.com`), Strong/4-of-4 strength (reset passwords expected to be stronger), 58-minute expiry with amber warning dot (tight 1-hour reset window vs 7-day invite), and a "← Back to sign in" tertiary escape link. Both reuse F06 brand panel verbatim. Mode B thumbnail reference pattern removed entirely — replaced by two clean standalone frames. Frame count 37 → 38. Locked count jumps 17 → 19 (F06b + F06c both rendered via Claude Code). |
| **v2.7-rapid** | **2026-04-25** | **Plan A executed in single Claude Code session.** Built the 19 remaining pending frames sequentially: F07b → F07c → F07d (Invited first-run trio) → F14m2 (Link Test Case Modal, 720×640 picker) → F14m3 (Convert to Jira Story Modal, 480×360 confirm) → F15 (Knowledge Base, 9 KB cards + AI Answer Preview Card) → F16a (Test Case Method Chooser, Stage Modal 1120×860 with 3 method cards) → F16b (A1 Generate from Requirement, Phase 3 Review state with 4-phase stepper) → F16c (Bulk Import Test Cases, A2 Dedup Scan) → F18 (Test Suites, 9 suite cards across 3 health states) → F19 (Run Console, live-state 4-zone with pulsing live pill) → F20 (Run Results, A4 RCA Intelligence block 342% headline) → F21 (Defects Hub, 10-row defect list + A4 RCA preview rail) → F23 (Reports Studio, inline SVG line chart + cluster callout) → F25 (Executive Dashboard, **Prove mode ivory canvas #FAFAF8** — only frame to flip workspace chrome) → F26 (Agents, largest frame at 64 KB, violet-saturated control plane) → F27 (Users & Roles, 6-row team table + role matrix) → F27m1 (Invite User Modal, email chip input + per-user table) → F28 (Settings & Audit, 6 PM1 tabs + 2 PM3+ preview, **HMAC-SHA256 immutable audit chain**, 10-row searchable table). Each frame verified via screenshot before proceeding. Anti-drift discipline held across all 19. Frame count unchanged 38 → 38 at this checkpoint; v2.8 added F18m1. |
| **v2.8** | **2026-04-25** | **F18m1 Edit Suite Modal added** (Option B from "do we need additional modals before F19?" review). Stage Modal 720×760 cloning the F14m1 pattern with a danger zone (Archive/Restore semantics). Tag-chip × buttons enlarged to 20×20 with stroke-width 3 to match F27m1 fix. F-number leaks scrubbed from user-visible copy ("in F17" → "in the Test Case Library"; "Hides from F18 grid" → "Hides from the Test Suites view"). Frame count 38 → 39. **PM1 inventory closed.** |
| **v2.9** | **2026-04-25** | **Folder reorganization for clean handoff.** 22 Claude Code-built frames moved from `frame  html view/` to a new sibling folder `frames - claude code build (PM1 v2.6-v2.8)/`. The original `frame  html view/` folder now contains only the 17 Claude Design frames, reserved for future Claude Design touch-up rendering. Final provenance recorded: 17 Claude Design + 22 Claude Code = 39 total. README.md, 01_SYSTEM.md, PRD.md, project_analysis.md updated to reflect the closed inventory and folder split. |
| **v2.10** | **2026-04-25 (late)** | **Day-0 LLM configuration flow added — 2 new modals (F28m1 + F26m1).** Inventory grew 39 → **41 frames** (17 Claude Design + **24** Claude Code). Triggered by user gap analysis: with API keys now in the stack (Groq, Gemini, etc.), Admin/Lead need a UI to configure providers, fetch models, and assign them per-agent — none of the 39 covered this. **F28m1 LLM Provider Configuration Modal** (Stage 1120×860, opens from F28 Integrations Health → "+ Add Provider"): two-pane layout, provider directory with 2 connected (Groq + Gemini) and 9 available (OpenRouter, Cerebras, OpenAI/ChatGPT, Anthropic Claude, Kimi/Moonshot, Mistral AI, Together AI, Fireworks AI, Custom OpenAI-compat), right pane with API key + endpoint + prominent teal "Test connection" button + free-tier callout + 11-model list with checkboxes and violet "Used by" agent assignment pills. **F26m1 Agent Model Assignment Modal** (Edit 960×760, opens from F26 Agents → "Configure model" on agent card): violet AI-surface header, agent summary card with eval/latency/runs stats, three model dropdowns (Primary teal-accent / Long-context / Fallback) populated from F28m1's enabled pool, read-only routing rules card with 3 numbered rules (prompt_tokens > 100K → Long-context; 429/503/timeout → Fallback; otherwise → Primary), sample test panel with realistic Iksula REQ-088 3DS prompt and inline result. Both modals follow locked design discipline (teal=system, violet=AI, no MD3, hardcoded tokens), both use `min-height: 0` flex pattern for internal scroll, both have absolute-positioned backdrops on 1600×1024 canvas. Future-proof: new providers added by appending to F28m1 directory list (no schema change). **PM1 inventory now closed at 41 of 41 frames.** |
