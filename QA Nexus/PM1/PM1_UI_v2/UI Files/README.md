# QA Nexus PM1 UI — v2 Consolidated Package

**Built 2026-04-23 after v1 Stitch drift audit.** Only 5 files. Designed to fit Stitch's 5-file-at-a-time limit and prevent the Material Design 3 drift that ruined v1.

**Supersedes:** `../PM1_UI_v1_archive/` (29 files, drifted in Stitch).

---

## Package contents (5 files, paste into Stitch in this order)

| # | File | Purpose | Lines |
|---|---|---|---:|
| 1 | `01_SYSTEM.md` | Master Stitch prompt + full nav contract + exact hex tokens + hard constraints. **Paste this FIRST.** Stitch must echo the design language statement and confirm 7 lock-ins before generating any frame. | 370 |
| 2 | `02_ENTRY_AND_HOME.md` | F06 Sign In · F07 Onboarding · F08a Home QA Eng · **F08b Home Dashboard w/ AI Value strip** ⭐ · F09 Projects List · F10 Create Project modal | 976 |
| 3 | `03_SOURCE_AND_DOCS.md` | F11 Jira Connect · F12 Upload modal (ContextQA-pattern method chooser) · F13 Imported Files List · F14 Requirements · F15 Knowledge Base | 886 |
| 4 | `04_TEST_LIFECYCLE.md` | F16a Method Chooser · F16b A1 Generate · F16c Bulk Import · **F17 Test Case Library** ⭐ (three-panel flagship) · F18 Test Suites · F19 Run Console · F20 Run Results · F21 Defects Hub · **F22 Defect Detail** ⭐ (A4 5-Layer RCA) | 908 |
| 5 | `05_ANALYSE_AND_GOVERN.md` | F23 Reports · **F24 QA Value Dashboard** ⭐ (AI benefit analytics) · F25 Executive Dashboard (Prove mode) · F26 Agents · F27 Users & Roles · F28 Settings & Audit | 1,326 |

**Totals:** 5 files · 4,466 lines · **41 PM1 frames** (all 41 built and locked as of 2026-04-25; v2.10 added F28m1 + F26m1 for the Day-0 LLM configuration flow).

⭐ Critical differentiator frames: F08b (AI Value strip), F17 (three-panel library), F22 (A4 5-Layer RCA), F24 (QA Value Dashboard).

---

## How v2 fixes what v1 broke

v1 Stitch drift audit (`../PM1_UI_v1_archive/STITCH_DRIFT_AUDIT.md`) found 270 drift instances across 27 frames:

| v1 drift | v2 fix |
|---|---|
| Material Design 3 color tokens on 27/27 frames | Every Stitch prompt in files 02-05 has the explicit phrase *"Do NOT use Material Design 3 tokens. Do not extend Tailwind config. Hardcode hex values."* |
| Tertiary yellow/orange on 27/27 frames | §3.2 in `01_SYSTEM.md` lists forbidden colors explicitly; every file pinned-reminder repeats "no tertiary". |
| Project switcher missing on 27/27 frames | §4.1 slot 2 specifies project switcher dropdown as non-optional; every frame's Stitch prompt enforces 8 top bar slots. |
| Left rail different on 23/27 frames | `01_SYSTEM.md` §4.2 provides the exact rail structure; each of 02-05 repeats it in §1 Pinned Reminder. |
| Brand name wobble ("Evidence Mesh", "Workbench") on 5+ frames | §3.2 explicitly forbids alternate names; §4.2 rail top always shows "QA Nexus" wordmark. |
| Mode toggle missing on 17/27 frames | Top bar slot 7 is non-optional in the contract. |

**Root cause fix:** v1 stored each frame in a separate file. Stitch forgot the nav contract between files. v2 embeds a "Pinned Reminder" (§1) at the top of EVERY file so Stitch can't forget between generation sessions. The anti-MD3 phrase is also embedded in every individual Stitch prompt as belt-and-suspenders.

---

## Color palette (updated per user request)

- **Primary:** `#2DD4BF` teal — main CTAs, value indicators, approval flows, ROI, positive momentum
- **Secondary:** `#A78BFA` violet — **RESERVED FOR AI ONLY** (agent outputs, Confidence Lane, AI-draft badges)
- **Semantic:** pass `#34D399` · fail `#F87171` · warn `#FBBF24` · info `#60A5FA`
- **No tertiary color. No orange/yellow/coral/pink/olive.**

Canonical token file updated: `../Project_UI/PROJECT_UI_DESIGN_TOKENS.json` v1.1 with Primary/Secondary labels swapped to match.

---

## Usage flow

### Step 1 — Prime Stitch

1. Open a new Stitch project
2. Paste `01_SYSTEM.md` content as your first message
3. **Stitch must reply with:**
   - The design language statement verbatim (from §2)
   - Confirmation of the 7 lock-ins (§9)
   - The color palette echoed correctly (Primary teal, Secondary violet, NO tertiary)
4. If Stitch skips any of those confirmations or drifts (mentions MD3, mentions tertiary color, mentions "Evidence Mesh" as product), paste `01_SYSTEM.md` again and say: *"Echo §9 verbatim before continuing."*

### Step 2 — Generate frames file-by-file

Paste `02_ENTRY_AND_HOME.md` — generate F06 → F07 → F08a → F08b → F09 → F10.

**Critical checkpoint:** After F08b, verify:
- [ ] Brand name is "QA Nexus" (not "Evidence Mesh")
- [ ] Background is `#0B0F17` (not `#141219`)
- [ ] Top bar has project switcher dropdown in slot 2
- [ ] Left rail has Home + PLAN/AUTHOR/RUN/ANALYSE/GOVERN sections
- [ ] AI Value strip is visible and prominent
- [ ] No tertiary / yellow / orange colors anywhere

If any of those fail, re-paste `01_SYSTEM.md` + rewrite F08b before continuing.

Continue with 03 → 04 → 05 in order.

### Step 3 — Flagship frame validation

After these 4 frames, pause and visually verify before proceeding:

- **F08b** (in file 02) — AI Value strip prominent? Metrics have provenance footnotes? Teal primary, violet on AI chips only?
- **F17** (in file 04) — Three panels visible (suites tree / card grid / detail rail)? Sparklines on cards? Confidence Lane on AI drafts?
- **F22** (in file 04) — A4 5-Layer RCA accordion with all 5 layers (Stack 90 → Env 80 → Config 60 → Code 50 → Data 40)?
- **F24** (in file 05) — 4 hero metrics with provenance? Per-agent breakdown? Prove mode export visible?

---

## What NOT to do (learned from v1)

❌ Don't paste individual frame files — Stitch will generate each in isolation and forget the navigation contract between files.

❌ Don't skip `01_SYSTEM.md` — it's the prompt that locks Stitch onto our design system. Without it, Stitch falls back to Material Design 3 defaults.

❌ Don't iterate on a broken frame forever — if the first F06 generation shows MD3 tokens, wrong brand name, or missing project switcher, **regenerate from scratch** with `01_SYSTEM.md` re-pasted. Patching drift is slower than re-priming.

❌ Don't add tertiary/accent colors "for visual interest." The design system has exactly 2 brand colors + 4 semantic states. Period.

❌ Don't let Stitch use `primary-container`, `surface-tint`, `on-primary`, `tertiary`, `surface-bright`, or any Material Design 3 token. These are banned.

---

## If Stitch drifts mid-session

Paste these targeted corrections:

| Drift | Correction to paste |
|---|---|
| MD3 tokens appearing | *"Rewrite without Material Design 3 tokens. Use only: canvas #0B0F17, base #111827, raised #1A2233, overlay #232C3F, primary #2DD4BF, secondary #A78BFA, semantic states. No primary-container, no surface-tint."* |
| Tertiary color appearing | *"Rewrite. Remove tertiary color. Only 2 brand colors exist: Primary teal #2DD4BF and Secondary violet #A78BFA. Replace any tertiary use with neutral gray or appropriate semantic state."* |
| Brand name wobble | *"Rewrite. Product name is 'QA Nexus' — in the rail top, in page titles, everywhere. Never 'Evidence Mesh' or 'Workbench'. Evidence Mesh is the DESIGN SYSTEM name, not the product name."* |
| Missing project switcher | *"Rewrite top command bar. Slot 2 MUST be a project switcher dropdown: pill showing `[glyph] Iksula Commerce · main ▾`. Click opens project list + Create new project. Not a static pill."* |
| Wrong rail structure | *"Rewrite left rail per 01_SYSTEM.md §4.2. Sections in this order: Home · PLAN · AUTHOR · RUN · ANALYSE · GOVERN · pinned bottom Support + Account. No renaming, no reordering."* |

---

## File version history

| Date | Version | What changed |
|---|---|---|
| **2026-04-25 (late)** | **v2.10** | **Day-0 LLM configuration flow added — F28m1 + F26m1.** Inventory grew 39 → **41 frames** (17 Claude Design + 24 Claude Code). Triggered by gap analysis: with API keys (Groq, Gemini, etc.) now in the stack, Admin/Lead need a UI to configure providers, fetch available models, and assign them per-agent — none of the 39 covered this. **F28m1 LLM Provider Configuration** (Stage 1120×860, opens from F28 → "+ Add Provider"): two-pane layout with provider directory (Groq, Gemini connected; OpenRouter/Cerebras/OpenAI/Anthropic/Kimi/Mistral/Together/Fireworks/Custom available) + API key field + prominent teal "Test connection" + 11-model checkbox list with violet "Used by" agent assignment pills. **F26m1 Agent Model Assignment** (Edit 960×760, opens from F26 agent card → "Configure model"): violet AI-surface header, agent summary, three model dropdowns (Primary teal-accent / Long-context / Fallback) populated from F28m1's enabled pool, read-only routing rules card, sample test panel. **PM1 inventory now closed at 41 of 41 frames.** |
| **2026-04-25** | **v2.9** | **Folder reorganization:** 22 Claude Code-built frames moved to `frames - claude code build (PM1 v2.6-v2.8)/` (F06b, F06c, F07b, F07c, F07d, F14m2, F14m3, F15, F16a, F16b, F16c, F18, F18m1, F19, F20, F21, F23, F25, F26, F27, F27m1, F28). Original `frame  html view/` reserved for the 17 Claude Design-rendered frames going forward. Final provenance recorded: 17 Claude Design + 22 Claude Code = 39 total. |
| **2026-04-25** | **v2.8** | **F18m1 Edit Suite Modal added** (Option B from "do we need additional modals before F19?" review). Stage Modal 720×760 with danger zone for archive/restore. Frame count 38 → 39. PM1 inventory now closed at 39 frames. **All 39 frames built and locked.** |
| **2026-04-25** | **v2.7-rapid** | **Plan A executed in single Claude Code session** — built 19 remaining pending frames sequentially: F07b/c/d (3 invited first-run variants) → F14m2/m3 → F15 → F16a/b/c → F18 → F19 → F20 → F21 → F23 → F25 (Prove mode ivory canvas) → F26 (largest at 64 KB, violet-saturated agents) → F27 → F27m1 → F28 (final, 58 KB with HMAC-SHA256 audit chain). Each frame verified via screenshot and corrected before proceeding. Anti-drift discipline held: teal=system, violet=AI, no Material Design 3, hardcoded tokens. |
| 2026-04-24 | v2.7 | F06b dual-mode split into F06b (Set Password / Invite Setup) + F06c (Reset Password / Forgot-Password flow). Same split rationale as F07b → F07b/c/d. Both HTMLs rendered via Claude Code. Mode B thumbnail reference pattern removed. Frame count 37 → 38. Locked 17 → 19. |
| 2026-04-24 | v2.6 | F07b tri-mode split into F07b / F07c / F07d (QA Engineer / Stakeholder / Invited Lead-Admin). Frame count corrected 32 → 37 (fixes prior F16a/b/c undercount + adds 2 from F07b split). |
| 2026-04-24 | v2.5 | F07 Pattern A deferred routing canonized (Step 2 defers data-source flow until after Step 3 atomic commit). F27m1 Invite User Modal added for ongoing invites post-bootstrap. Frame count 31 → 32. |
| 2026-04-24 | v2.4 | F07b Invited Team First-Run Onboarding (tri-mode: QA Engineer / Stakeholder / Invited Lead-Admin) added to close UX gap between F06b password-set and F08a/F08b Home. F07 scope clarified as workspace-founder-only. Frame count 30 → 31. |
| 2026-04-24 | v2.3 | F06b Set / Reset Password added to cover invite magic-link + forgot-password flows (reuses F06 Brand Panel). Frame count 29 → 30. |
| 2026-04-24 | v2.2 | Frame count grew from 23 → 29. F11 split into F11a/F11b/F11c (Jira wizard 3 steps). F08c added (Home Empty Project — Start blank landing). F14m1 / F14m2 / F14m3 added (Requirement CRUD modals). Design system formally canonized: teal=system, violet=AI (binding). Realistic data canon anchored to Iksula Returns (RET) flow. PM3 M17 Jira auth alternatives propagated to PRD + ERD + Milestone. 17 of 29 frames locked via Claude Design. See `DESIGN_EVOLUTION_v2.2.md` for full change log. |
| 2026-04-23 | v2.0 | Initial v2 — 5-file consolidated package with pinned reminders in every file. Primary/Secondary label swap (Primary=teal, Secondary=violet). Supersedes v1. |
| 2026-04-23 | v1.0 | v1 archived to `../PM1_UI_v1_archive/` — 29 separate files. Failed in Stitch due to MD3 drift; see `../PM1_UI_v1_archive/STITCH_DRIFT_AUDIT.md`. |

---

## Final inventory — 41 of 41 frames locked (as of 2026-04-25)

**By provenance (17 Claude Design + 22 Claude Code = 39):**

**Claude Design rendered (17 frames in `frame  html view/`):**
✅ F06 Sign In · F07 Workspace-Founder Onboarding · F08a Home QA Engineer · F08b Home Dashboard · F08c Home Empty Project · F09 Projects List · F10 Create Project · F11 Jira Authorize · F11b Jira Map · F11c Jira Verify · F12 Upload Modal · F13 Imported Files · F14 Requirements · F14m1 Edit Requirement Modal · F17 Test Case Library · F22 Defect Detail · F24 QA Value Dashboard

**Claude Code rendered (22 frames in `frames - claude code build (PM1 v2.6-v2.8)/`):**
✅ F06b Set Password (Invite) · F06c Reset Password · F07b Invited QA Engineer · F07c Invited Stakeholder · F07d Invited Lead/Admin · F14m2 Link Test Case · F14m3 Convert to Jira Story · F15 Knowledge Base · F16a Test Case Method Chooser · F16b A1 Generate · F16c Bulk Import · F18 Test Suites · F18m1 Edit Suite Modal · F19 Run Console · F20 Run Results · F21 Defects Hub · F23 Reports Studio · F25 Executive Dashboard (Prove mode) · F26 Agents · F27 Users & Roles · F27m1 Invite User Modal · F28 Settings & Audit

⬜ **Pending: 0** — PM1 UI inventory is closed.

---

## Folder layout (post v2.9 reorganization)

```
PM1_UI_v2/
├── frame  html view/                              ← 17 Claude Design frames (clean for future Design work)
├── frames - claude code build (PM1 v2.6-v2.8)/    ← 22 Claude Code frames (Plan A output)
├── Design Tokens/
│   └── PROJECT_UI_DESIGN_TOKENS.json              ← v1.1 (Primary teal / Secondary violet)
└── UI Files/                                       ← This folder (5 Stitch source files + change logs)
    ├── 01_SYSTEM.md
    ├── 02_ENTRY_AND_HOME.md
    ├── 03_SOURCE_AND_DOCS.md
    ├── 04_TEST_LIFECYCLE.md
    ├── 05_ANALYSE_AND_GOVERN.md
    ├── DESIGN_EVOLUTION_v2.2.md                    ← Full change log v2.0 → v2.9
    └── README.md                                   ← This file
```

**Why the split?** When Claude Design renders fresh frames in the future (touch-up pass or new variants), they go into `frame  html view/` cleanly. The Claude Code build artifacts are isolated so the two production tracks don't collide.

---

## Next actions

1. **Optional Claude Design touch-up pass** on the 22 Claude Code frames — apply final visual polish (motion timing, micro-interactions, edge-case empty states) where higher fidelity is needed for stakeholder demos. The Claude Code frames are functionally complete and design-system-compliant; touch-up is purely a fidelity bump.
2. **PM2 frame work begins** with the inventory closed. PM2 scope adds the items listed in §22 of the master brainstorm (advanced agents, web testing, mobile testing prep). PM2 frame inventory will start fresh in `PM2_UI/` when planning kicks off.
3. Engineering implementation of M0-M5 milestones now has fully-locked UI references. Each frame ID maps to the corresponding Stitch source file (02-05) and the rendered HTML in either of the two frame folders above.

For every new frame (PM2+), apply the binding conventions from `01_SYSTEM.md` Appendix C and the realistic data canon from `DESIGN_EVOLUTION_v2.2.md` §4.
