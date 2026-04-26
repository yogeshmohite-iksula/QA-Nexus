# QA Nexus PM1 — Claude Code Kickoff Prompt

> **How to use this file:** On Day 1 of the M0 build, after `cd`-ing into your project root in your terminal, copy the entire contents of section [§ THE PROMPT](#the-prompt) below and paste it as your first message to Claude Code (CLI or VS Code plugin). Claude will enter plan mode, read all the binding docs, summarize back to you, then walk through tooling setup, skill activation, and the M0 task list.
>
> **File path note:** Paste this into Claude Code with your working directory set to wherever you've put the `QA Nexus/` folder. The prompt assumes paths like `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` are reachable from the current directory. Adjust the relative paths in the prompt if your folder layout differs.
>
> **Before starting tomorrow morning, complete the [Pre-flight checklist](#pre-flight-checklist-do-this-tonight-or-monday-morning) at the bottom of this file.**

---

## The prompt

Copy everything between the two horizontal lines below into Claude Code.

---

I am Yogesh Mohite, **Sr QA at Iksula Services Pvt Ltd**, and I hold the **Admin role on QA Nexus** (deployer-admin per the Day-0 bootstrap model — Admin RBAC inherits Lead permissions; my organizational title remains Sr QA). Today is Day 1 of the M0 build for **QA Nexus PM1** — an AI-native QA management platform. PM1 is the first of four phases (PM1 → PM2 → PM3 → PM4) targeting v1 GA on **2026-09-21** (18-week build, Mondays through Fridays). The pilot user base is **8 internal Iksula users**: Akshay Panchal (QA Lead), me (Sr QA + Admin), and 6 QA Engineers — Kishor Kadam, Nitin Gomle, Nadim Siddiqui, Govind Daware, Mohanraj K., Sagar Todankar — working **10 AM – 10 PM** local time.

**STOP before doing anything else.** Enter plan mode. Do not write code, create files, edit configurations, or invoke any skills until I explicitly approve the plan you produce in Phase 0.5 below. Phases must run in order. If you hit ambiguity, ask me — never guess.

---

## Hard constraints (binding for every decision below)

These are non-negotiable for the entire 18-week PM1 build:

1. **$0/month total infrastructure spend** for the duration of the pilot. Any decision that would force a paid component requires my explicit written approval first.
2. **Free / OSI-approved open-source only** for software components. Hosted services may be used if they have a free tier that fits our scale (Groq, Gemini, Cloudflare, Neon, Render, Resend, Grafana Cloud, UptimeRobot, GitHub Actions).
3. **Binding spec is `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` v8.1 + `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` v2.1.** Project-level `QA Nexus/PRD/PRD.md` v2.10 and `QA Nexus/ERD/ERD.md` v2.6 describe the eventual PM2-PM4 self-hosted vision; do NOT use them as PM1 binding.
4. **41 of 41 UI frames are LOCKED** in `QA Nexus/PM1/PM1_UI_v2/` — never modify the HTML files. Translate them faithfully to React components.
5. **Locked tech stack (do NOT propose alternatives without my approval):** Next.js 15, React 19, Tailwind CSS 4, shadcn/ui + Sonner, lucide-react, react-hook-form, Zod, Framer Motion, TanStack Query v5, TipTap, NestJS 10, Prisma 5, BetterAuth, `@xenova/transformers` (in-process embeddings), Groq SDK, `@google/generative-ai` (Gemini fallback), Postgres 15 + pgvector on Neon free, Cloudflare Pages free, Render free, Cloudflare R2 free, Resend free, Grafana Cloud free, Better Stack free, UptimeRobot free, GitHub + GitHub Actions.
6. **Explicitly DROPPED for PM1 (do NOT install or propose):** FastAPI, Ollama, Gemma 4 self-host, Redis, Valkey, BullMQ, ioredis, Neo4j, Graphiti, Keycloak, Vault, pgvectorscale, LangSmith, MUI, Chakra UI, Mantine, Material Design 3 tokens.
7. **Anti-drift design discipline:** teal `#2DD4BF` is reserved for system actions only; violet `#A78BFA` is reserved for AI surfaces only; no tertiary colors; all design tokens are declared in `tailwind.config.ts` and never extended.
8. **Audit log:** every state-changing operation writes one row to the HMAC-SHA256 chained `audit_log` table (see PM1_ERD §3.13).
9. **Iksula data canon** (use consistently in seeds, fixtures, demo data): active project = "Iksula Returns" (key: RET); Sprint 42, Day 9 of 14; Release = R-2026-04-PaymentV2; team (8) = Akshay Panchal (QA Lead), Yogesh Mohite (Sr QA + Admin), Kishor Kadam (QA Engineer), Nitin Gomle (QA Engineer), Nadim Siddiqui (QA Engineer), Govind Daware (QA Engineer), Mohanraj K. (QA Engineer), Sagar Todankar (QA Engineer).

---

## Phase 0 — Read and understand (do this first; do NOT proceed past Phase 0.5 without my approval)

**Reading order goes from BROAD (full PM1–PM4 program) → NARROW (PM1 binding spec) → ACTIONABLE (M0 Day-1 task list).** This is intentional: you need to understand *why* PM1 is scoped the way it is before diving into the binding details, so the architectural decisions you make today don't create migration debt for PM2/PM3/PM4 later.

The project is split into 4 phases: **PM1 (= MVP, the current build) · PM2 (v1.5, self-healing + mobile + visual + on-prem) · PM3 (v2, low-code + governance + enterprise) · PM4 (v2+, multi-tenant SaaS + career intelligence)**. We're building PM1 only — but read PM2-PM4 context first so you know what's coming.

After each file or group, give me a 2-3 bullet summary and confirm understanding before moving to the next. Use the file tools (Read), not WebFetch. Do not skim where indicated to read in full.

---

### Stage A — Full project context (PM1–PM4 program vision)

These describe the entire 18-month PM1-PM4 program. Read them in full to understand the strategic arc, the 11-agent program (A1–A8 + VCG + APT + others), the 7-layer architecture progression (L1 platform → L7 career intelligence), and why PM1 was scoped to this specific MVP.

#### 0.1 — Project-level PRD (full read)

1. `QA Nexus/PRD/PRD.md` — project-level **v2.10**, the full PM1-PM4 product requirements. Pay attention to:
   - §1-§3 vision, problem statement, strategic context
   - §6 personas (Junior QA, Senior QA, QA Lead, Stakeholder, etc.) and how they evolve across phases
   - §9 Functional Requirements FR-001 through FR-064 with phase tags [PM1] / [PM2] / [PM3] / [PM4]
   - §15 Delivery Roadmap (full PM1-PM4 timeline)
   - Final changelog entries v2.9 (PM1 free-OSS lock) and v2.10 (Day-0 LLM config flow added)

#### 0.2 — Project-level ERD (full read)

2. `QA Nexus/ERD/ERD.md` — project-level **v2.6**, full PM1-PM4 engineering spec with architecture diagrams. Pay attention to:
   - §3.0 PM1 ↔ Project-level architecture relationship table (CRITICAL — this maps the simplification PM1 makes vs. the eventual PM2-PM4 self-hosted state)
   - §3.2 C4 L2 Container Diagram (PM2-PM4 vision with all components)
   - §3.4 Deployment Topology (PM2-PM4 multi-region)
   - §3.5–§3.8 Sequence diagrams for A1, A4, Jira, Day-0 bootstrap
   - §3.12 Agent Orchestration showing all 11 agents (A1-A8, VCG, APT) and which phase ships each
   - §4 Component Architecture CO-001 through CO-037 (PM1 ships ~CO-001 to CO-018)
   - §5 Data Model — TB-001 through TB-036 (PM1 ships TB-001 through TB-021)

#### 0.3 — Strategic foundation (read in full)

3. `QA Nexus/QA_Nexus_Master_Brainstorm.md` — strategic brainstorm. Focus on:
   - §13 Tech Stack (NOTE: top of §13 has a PM1 redirect block; the section below describes PM2-PM4 vision)
   - §17 Roadmap (full 18-month plan)
   - §21 UI Design Journey appendix (design canon: teal=system, violet=AI, etc.)
4. `QA Nexus/project_analysis.md` — meta-analysis of project state. Focus on §4 Locked Technical Decisions (top has PM1 redirect; section below describes PM2-PM4 vision).

#### 0.4 — Full milestone roadmap (M0–M18)

5. `QA Nexus/Milestone/MILESTONE_REGISTRY.md` — the canonical 18-month roadmap. Read the M0-M18 overview table to understand what each milestone ships and when. PM1 = M0–M6; PM2 = M7–M12; PM3 = M13–M18; PM4 = ongoing.
6. Skim (don't read in full) `QA Nexus/Milestone/M7/` through `M18/` folder names + first 20 lines of each milestone .md to understand what comes AFTER PM1 GA. This prevents you from building PM1 architecture that blocks PM2-PM4 evolution.

---

### Stage B — PM1 binding spec (the actual build target)

NOW shift focus to PM1 only. Everything below this line OVERRIDES the project-level docs above for PM1 implementation decisions. Project-level docs were context; PM1 docs are binding.

#### 0.5 — PM1 PRD (read in full — BINDING)

7. `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` — PM1 product requirements, **v8.1**. Pay special attention to:
   - §1 Document Control table (scope, build window, agents, stack)
   - §1.1 Revision Notes — particularly the v8.1 entry explaining the Day-0 LLM config flow gap and how F28m1 + F26m1 were added
   - §6 Users, Personas, and Primary Scenarios
   - §9 Functional Requirements (FR-001 through ~FR-064 — note PM1 ships FR-001..062; FR-063/064 are PM3 M17 deferred)
   - §10 Non-Functional Requirements (especially NFR-001 page load, NFR-002 API latency, NFR-003 agent latency)
   - §11 Core Workflows (W-001 through W-008)
   - §12 Solution Overview, especially §12.3 Technology Direction (the locked stack)
   - §15 Delivery Roadmap (M0–M6 schedule)
   - §20 Launch Checklist (binding)

#### 0.6 — PM1 ERD (read in full — BINDING)

8. `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` — PM1 engineering spec, **v2.1**. Read in full. Pay attention to:
   - §1.1 Architectural principles (10 binding principles)
   - §2 PM1 Inventory at a Glance (3 agents, 21 tables, 29 endpoints, 41 frames, 7 milestones)
   - §3 Solution Architecture & System Design Diagrams (13 mermaid diagrams: C4 L1/L2/L3, deployment topology, sequence diagrams for A1 Generation / A4 RCA / Jira Sync / Day-0 Bootstrap, state machines for Defect / TestRun / TestCase, agent orchestration topology, PII data flow)
   - §4 PM1 Component Architecture (CO-001 through CO-018)
   - §5 PM1 Data Model — full schemas for TB-001 through TB-021. **Pay special attention to TB-019 `llm_provider`, TB-020 `llm_provider_model`, TB-021 `agent_model_assignment`** (added v2.1 to support F28m1 + F26m1).
   - §6 PM1 API Contracts — EP-001 through EP-029. **Endpoints EP-026 through EP-029** are the new LLM provider config endpoints.
   - §7 PM1 Agents (A1, A2, A4 specs with latency budgets, eval gates, acceptance criteria)
   - §8 PM1 Infrastructure (binding, 8 subsections covering Postgres, hosting, security, etc.)
   - §10 PM1 Acceptance Gates (12 binding criteria — read every word)
   - §11 Decisions LOCKED (Q-PM1-01 through Q-PM1-20)

#### 0.7 — PM1 design system + 41 frames (read in full)

9. `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md` — locked design system. Read in full. Confirm:
   - Hardcoded design tokens (--canvas, --base, --raised, --overlay, --teal, --violet, semantic colors)
   - Typography canon (Inter / DM Sans / JetBrains Mono)
   - Anti-drift discipline (no MD3, no tertiary, no extended Tailwind config beyond locked palette)
   - 8-slot top bar contract
   - 6-section left rail structure
   - Modal size canon (Picker 720×640, Edit 960×720, Stage 1120×860, Confirm 480×360)
10. `QA Nexus/PM1/PM1_UI_v2/UI Files/DESIGN_EVOLUTION_v2.2.md` — design history through **v2.10** (final). Skim the change log to understand what was decided when. The v2.10 entry explains why F28m1 + F26m1 were added.
11. `QA Nexus/PM1/PM1_UI_v2/UI Files/README.md` — frame inventory + paste order for the 5 Stitch source files.
12. List the 41 frames:
    - 17 in `QA Nexus/PM1/PM1_UI_v2/frame  html view/` (Claude Design rendered) — note the directory name has TWO SPACES between "frame" and "html view"
    - 24 in `QA Nexus/PM1/PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/` (Claude Code rendered, including F28m1 + F26m1 from v2.10)
    - Confirm 17 + 24 = 41

---

### Stage C — Day-1 actionable (M0 task list)

#### 0.8 — M0 task list (read in full — this is your day-1 backlog)

13. `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` — **BINDING M0 task list** (~270 hours, 22 tasks, $0/month target). Use this, NOT the older `Milestone_M0_Setup.md` which has the redirect note pointing back to v8. The v8 list has 3 phases:
    - Phase 1 Bootstrapping (Days 1–3): MS0-T001 through MS0-T009
    - Phase 2 Hosting (Days 4–6): MS0-T010 through MS0-T019
    - Phase 3 Core API + first React shells (Days 7–10): MS0-T020 through MS0-T031
    Note the 19 acceptance criteria (MS0-AC001 through MS0-AC019) — these are the M0 exit gates.

#### 0.9 — Future PM1 milestones M1–M6 (read redirect notes only)

These are the milestones that come after M0. Each .md has a v8.1 redirect note at top — read those notes, not the v1.0 task lists below them (the v1.0 task IDs are useful as a starting backlog but the stack lines must be reconciled to v8.1 before assigning sprints).

14. `QA Nexus/PM1/PM1_milestone/M1/Milestone_M1_Users_Roles.md` — Auth + RBAC + 4-role matrix
15. `QA Nexus/PM1/PM1_milestone/M2/Milestone_M2_Docs_KB.md` — Doc Catalog + KB + embeddings via @xenova
16. `QA Nexus/PM1/PM1_milestone/M3/Milestone_M3_Test_Cases_AI.md` — Test Cases + A1 + A2 (LLM stack matters most here)
17. `QA Nexus/PM1/PM1_milestone/M4/Milestone_M4_Runs_Defects_Jira.md` — Runs + Defects + A4 5-Layer RCA + Jira sync
18. `QA Nexus/PM1/PM1_milestone/M5/Milestone_M5_Automation_Basic_Reports_MVP_Launch.md` — Reports + pilot launch
19. `QA Nexus/PM1/PM1_milestone/M6/Milestone_M6_Full_Reports_GA.md` — 12 GA acceptance gates

---

## Phase 0.5 — Summary checkpoint (wait for my approval here)

After reading the above, produce the following summary in your reply. Be concise and concrete:

1. **Identity confirmation:** Re-state who I am, the project, and the build window in 2 lines.
2. **Locked PM1 tech stack:** List in 8-10 lines the binding stack across frontend, backend, data, LLM, embeddings, hosting, observability, dev tools.
3. **What's IN scope for M0** (from `Milestone_M0_Setup_v8.md`): list the 22 task IDs grouped by phase.
4. **What's OUT of scope for PM1** (deferred to PM2+): 8-10 bullets covering FastAPI, Redis, BullMQ, Ollama self-host, Keycloak, Graphiti, etc.
5. **Day-0 LLM config flow walkthrough:** Trace the 8-step Admin journey: Sign In (F06) → Home (F08b) → Settings (F28) → Integrations Health → "+ Add LLM Provider" (F28m1) → paste Groq key → Test connection → enable models → Save → Agents (F26) → "Configure model" on A1 card (F26m1) → assign Primary/Long-context/Fallback → Run sample test → Save & activate → A1 first generation works on F14.
6. **41-frame inventory:** Confirm 17 + 24 = 41 (with the two folder paths).
7. **Top 3 risks I should worry about for M0:** Render free dyno cold-start during business hours; Neon free 0.5 GB ceiling; Groq free RPD on 70B+ models capped at 1,000/day.
8. **Inconsistencies you found** across docs, if any. Be honest — better to surface now than mid-build.

**STOP. Wait for me to type "approved, proceed" before starting Phase 1.** If I want changes, I'll respond with corrections.

---

## Phase 1 — Tooling install (after my approval)

Set up the development environment. Run commands in order; verify each before the next.

### 1.1 — Verify base tools

```bash
node --version        # expect: v20.x LTS
pnpm --version        # if missing: npm i -g pnpm
git --version
gh --version          # if missing: brew install gh (macOS)
gh auth status        # if not logged in: gh auth login
```

If any are missing, install them and confirm versions before proceeding.

### 1.2 — Install MCP servers

Run `claude mcp list` to see what's already installed. Then install the missing ones from this PM1-specific list:

| MCP | Install command | Why for QA Nexus |
|---|---|---|
| **github** | `claude mcp add github` | Repo creation, PR review, issue tracking |
| **sequential-thinking** | `claude mcp add @modelcontextprotocol/server-sequential-thinking` | Multi-step planning across the 22 M0 tasks |
| **context7** | `claude mcp add @upstash/context7-mcp` | Up-to-date docs for Next.js 15, React 19, Tailwind 4, NestJS 10, Prisma 5 |
| **postgres** | `claude mcp add @modelcontextprotocol/server-postgres "$NEON_DATABASE_URL"` | Schema introspection + pgvector validation against Neon |
| **filesystem** | usually pre-installed | Standard file ops |
| **playwright** | `claude mcp add @microsoft/mcp-server-playwright` | E2E smoke tests (MS0-T031) and ongoing dogfood |

**Skip these even if Tech-project-forge-skill suggests them** (PM1 doesn't need them; adding them is wasted setup time):
- ❌ Linear MCP — we use Jira via OAuth 3LO inside the app, not Claude
- ❌ Slack MCP — Slack is an outgoing webhook from the app, not Claude integration
- ❌ Notion / Confluence MCP — Confluence is an in-app read integration

After install, restart Claude Code and run `claude mcp list` again to verify all 6 are listed and healthy.

### 1.3 — Verify Tech-project-forge-skill is installed

I already ran `npx skills add yogeshcodeshare/Tech-project-forge-skill -y -g` before this session. Verify the skill is available by running:

```bash
ls ~/.claude/skills/ | grep -i tech-project
```

If missing, install it now:
```bash
npx skills add yogeshcodeshare/Tech-project-forge-skill -y -g
```

The skill provides:
- 5-phase project bootstrap workflow (Discover → Plan → Setup → DX → Validation → Build Guidance)
- 19 automated configuration steps in Phase 2
- 32 binary validation assertions in Phase 4
- Templates: 180+ permission rules, security hooks (block-dangerous.sh, audit-log.sh), CI/CD YAML, memory system seeds, 3 subagents (changelog-updater, frontend-tester, retro-agent), 14 slash commands

### 1.4 — Add Claude Code hooks

Create `.claude/hooks/` in the project root with these files. Show me the content of each before saving — I'll approve.

```
.claude/hooks/
├── pre-tool-use/
│   ├── block-dangerous.sh         # from Tech-project-forge-skill template, drop in as-is
│   ├── enforce-design-tokens.sh   # PM1-CUSTOM (write fresh — see spec below)
│   └── enforce-pm1-stack.sh       # PM1-CUSTOM (write fresh — see spec below)
├── post-tool-use/
│   └── audit-log.sh               # from Tech-project-forge-skill template
└── prompt-submit/
    └── load-binding-context.sh    # PM1-CUSTOM (write fresh — see spec below)
```

**`enforce-design-tokens.sh` spec:**
- Triggers on Edit / Write tool calls touching `apps/web/**/*.{ts,tsx,css}`
- Greps for forbidden patterns: `bg-orange-`, `bg-yellow-`, `bg-pink-`, `bg-cyan-`, `bg-rose-`, `text-tertiary` outside the locked palette, `primary-container`, `surface-tint`, `on-primary`, `surface-bright`, `tertiary-container`, any HSL/RGB/HEX color value not in the design tokens (whitelist: `#0B0F17`, `#111827`, `#1A2233`, `#232C3F`, `#2A3347`, `#3B4660`, `#F1F5F9`, `#C7D0DC`, `#8A94A6`, `#2DD4BF`, `#A78BFA`, `#34D399`, `#F87171`, `#FBBF24`, `#60A5FA`, `#FAFAF8` for F25 Prove mode)
- Exit 1 with a clear error message listing the offending line(s) and the design system reference

**`enforce-pm1-stack.sh` spec:**
- Triggers on Edit / Write to `package.json` or `pnpm-lock.yaml`
- Forbidden top-level dependencies: `bullmq`, `ioredis`, `redis`, `@redis/*`, `@neo4j/*`, `neo4j-driver`, `ollama`, `@vercel/postgres` (use Neon directly), `langchain` (we use direct Groq SDK + lightweight gateway), `langsmith`, `mui`, `@mui/*`, `chakra-ui`, `@chakra-ui/*`, `mantine`, `@mantine/*`, `daisyui`, `material-tailwind`
- Required dependencies present: `next` (15.x), `react` (19.x), `tailwindcss` (4.x), `@xenova/transformers`, `groq-sdk`, `@google/generative-ai`, `prisma`, `@prisma/client`, `better-auth`, `zod`, `react-hook-form`, `framer-motion`, `@tanstack/react-query`, `lucide-react`, `sonner`, `@tiptap/react`, `@nestjs/core`, `@nestjs/websockets`
- Exit 1 if any forbidden found or any required missing

**`load-binding-context.sh` spec:**
- Runs at the start of every Claude Code session
- Echoes a system note: "Reading PM1_PRD v8.1 + PM1_ERD v2.1 as binding. Free-OSS criterion is locked. $0/month cost gate is binding. 41 frames locked. Project-level PRD/ERD describe PM2-PM4 vision — do NOT use as PM1 binding."
- Optionally prepends file paths to PM1_PRD.md and PM1_ERD.md so Claude knows where to look first

After creating the hooks, run `chmod +x .claude/hooks/**/*.sh` and confirm they fire on a test edit (e.g., try adding `bg-orange-400` to a temp file and verify the hook blocks it).

### 1.5 — Initialize global memory file

Create `CLAUDE.md` at the project root with binding context that Claude Code loads automatically. Content:

```markdown
# QA Nexus PM1 — CLAUDE.md

## Binding spec
- PM1 product spec: `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` v8.1
- PM1 engineering spec: `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` v2.1
- PM1 design system: `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md`
- M0 task list: `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md`

## Hard rules (do not violate)
1. $0/month cost gate is binding
2. Free / OSI-approved OSS only
3. Never modify the 41 locked HTML frames in `PM1_UI_v2/frame  html view/` and `PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/`
4. Never add Material Design 3 tokens, tertiary colors, or extend Tailwind config beyond locked palette
5. Never put API keys in the repo (.env in .gitignore; use Render env vars + GitHub Secrets)
6. All state-changing operations write to HMAC-SHA256 chained `audit_log` table
7. Defer to PM1_PRD v8.1 / PM1_ERD v2.1 as binding; project-level PRD/ERD describe PM2-PM4 vision
8. When in doubt, ask Yogesh — never guess

## Locked tech stack (PM1)
[same locked stack as in Hard Constraints above]

## Iksula data canon
[same as in Hard Constraints above]
```

---

## Phase 2 — Activate Tech-project-forge-skill (after Phase 1 is verified clean)

Invoke the skill with trigger: **"Set up my project from PRD and ERD."**

Pass these arguments / context to the skill:

```
PRD source:        QA Nexus/PM1/PM1_PRD/PM1_PRD.md (v8.1)
ERD source:        QA Nexus/PM1/PM1_ERD/PM1_ERD.md (v2.1)
Milestone source:  QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md
Repo name:         qa-nexus
Repo visibility:   private
Monorepo manager:  pnpm workspaces
Workspace layout:
  apps/web         (Next.js 15 frontend)
  apps/api         (NestJS 10 backend)
  packages/shared  (Zod schemas, shared types)
Stack overrides:   See "Tech stack constraints" below — pass these as binding constraints to the skill so it does NOT propose alternatives.
Cost cap:          $0/month
Pilot scale:       8 users, 12 hrs/day, 22 working days/month
```

**Tech stack constraints to pass to the skill (binding):**
- Frontend: Next.js 15 + React 19 + Tailwind CSS 4 + shadcn/ui + Sonner + lucide-react + react-hook-form + Zod + Framer Motion + TanStack Query v5 + TipTap
- Backend: single NestJS 10 service (REST + WebSocket), Prisma 5, BetterAuth (Postgres adapter), Zod, `@xenova/transformers` (in-process embeddings, Qwen3-Embedding-0.6B), Groq SDK, `@google/generative-ai`
- Database: PostgreSQL 15 + pgvector on Neon free
- Object storage: Cloudflare R2 free with presigned upload URLs
- LLM: Groq free API (gpt-oss-120b primary, llama-4-scout long-context, gpt-oss-20b fast layers) + Gemini 2.5 Flash fallback
- Embeddings: Qwen3-Embedding-0.6B in-process (no Python service)
- Email: Resend free
- Hosting: Cloudflare Pages (frontend) + Render free Hobby (API) + Neon free (DB) + UptimeRobot keep-alive
- Observability: OpenTelemetry SDK + Grafana Cloud free + Better Stack alerting
- CI/CD: GitHub Actions
- Eval (engineering only, not user-facing): DeepEval on Colab Free
- Internal QA: Playwright for E2E

**Skill phases — what I expect to happen:**

- **Phase 0 (Discover):** Skill reads the binding specs and confirms the stack matches what's listed above. **If the skill's stack detection disagrees with PM1_PRD v8.1 §12.3, defer to PM1_PRD and tell me about the disagreement.**
- **Phase 1 (Plan):** Skill generates a `PROJECT_SPEC.md` and milestone plan. **Cross-check the generated plan against `Milestone_M0_Setup_v8.md` and reconcile.** If the skill's plan has tasks not in the v8 list, ask me before adding. If the skill's plan is missing v8 tasks (especially MS0-T017 for Groq + Gemini API keys, MS0-T023 for LLM gateway, MS0-T024 for embedding service), add them.
- **Phase 2 (Setup):** Skill executes 19 automated configuration steps (GitHub repo, env files, design system, CLAUDE.md, docs, hooks, MCPs, slash commands, settings, security rules, CI/CD, Docker, README, milestones, security hardening, code review tools, memory system, compound learnings, subagents).
  - **Important checkpoints during Phase 2:**
    - Before creating GitHub repo: confirm `qa-nexus` name and private visibility.
    - Before generating `tailwind.config.ts`: ensure it includes the locked PM1 design tokens from `01_SYSTEM.md` and excludes any other plugin/theme.
    - Before installing dependencies: run `enforce-pm1-stack.sh` against the proposed `package.json`.
    - Before writing the GitHub Actions workflow: confirm it uses pnpm (not npm/yarn) and covers FE + API + shared package.
- **Phase 3 (DX):** Skill installs plugins (Context Mode, Superpowers, Code Simplifier).
- **Phase 4 (Validation):** Skill runs 32 assertions. **Add my 12 PM1-specific assertions** to the validation set:
  1. `package.json` does NOT contain bullmq, ioredis, redis, fastify, ollama, neo4j-driver, mui, chakra-ui, mantine
  2. `package.json` DOES contain Next.js 15, React 19, Tailwind 4, shadcn-ui, Sonner, @xenova/transformers, groq-sdk
  3. `tailwind.config.ts` declares the locked design tokens and no other colors
  4. 41 HTML frame files present in the two locked folders (count exactly)
  5. All hooks in `.claude/hooks/` are executable and tested
  6. `CLAUDE.md` at repo root contains the binding spec references
  7. LLM gateway has primary→fallback retry tested with mocked 429 (jest unit test)
  8. BetterAuth Postgres adapter configured (NOT Redis adapter)
  9. UptimeRobot ping URL configured for `/health` (5-min interval)
  10. Neon database has pgvector extension enabled (NOT pgvectorscale)
  11. R2 presigned-URL flow tested with a > 1 MB upload bypassing the API dyno
  12. Cost gate: total monthly spend = $0 confirmed (no credit card on any provider)
- **Phase 5 (Build Guidance):** Skill provides workflow patterns. **Cross-check against my `Milestone_M0_Setup_v8.md` priority order.**

**If the skill suggests anything that conflicts with the binding constraints**, STOP, tell me what conflict you see, and ask before deciding. Do not silently let the skill override the spec.

---

## Phase 3 — Repo bootstrap (work the M0_v8.md task list)

Follow `Milestone_M0_Setup_v8.md` exactly. Work the tasks in priority order:

### Days 1-3 (Bootstrap, ~70 hours)

- MS0-T001 Repo + monorepo setup
- MS0-T002 Next.js 15 web scaffold
- MS0-T003 NestJS 10 API scaffold
- MS0-T004 Shared package (Zod schemas)
- MS0-T005 GitHub Actions CI
- MS0-T006 Pre-commit hooks (husky + lint-staged + commitlint)
- MS0-T007 README + onboarding doc
- MS0-T008 `.env.example` files (every required env var documented)
- MS0-T009 Local dev with Docker Compose (optional Postgres for offline dev)

After Day 3, run the smoke test: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm build` should all pass on a fresh clone.

### Days 4-6 (Hosting, ~60 hours)

- MS0-T010 Cloudflare Pages project
- MS0-T011 Render free service for API
- MS0-T012 Neon Postgres project + pgvector
- MS0-T013 Cloudflare R2 bucket + CORS
- MS0-T014 Resend email config
- MS0-T015 UptimeRobot keep-alive
- MS0-T016 Custom domain (decide: free `*.cloudflare-pages.dev` or buy domain)
- MS0-T017 Groq + Gemini API keys
- MS0-T018 Backup automation (weekly pg_dump to R2 cron)
- MS0-T019 Grafana Cloud + Better Stack

After Day 6, verify all 7 free-tier services are healthy and the deploy pipeline auto-deploys on push to main.

### Days 7-10 (Core API + first React shells, ~140 hours)

- MS0-T020 Prisma schema + migrations (TB-001 through TB-021, with HNSW indexes for pgvector)
- MS0-T021 BetterAuth integration (Postgres adapter, magic link via Resend)
- MS0-T022 RBAC guard (4 roles)
- MS0-T023 LLM gateway module (Groq primary → Gemini fallback)
- MS0-T024 Embedding service (`@xenova/transformers` Qwen3-Embedding-0.6B)
- MS0-T025 Health endpoint
- MS0-T026 WebSocket gateway scaffold
- MS0-T027 Audit log service (HMAC-SHA256 chain)
- MS0-T028 F06 Sign In page (translate locked HTML to React)
- MS0-T029 F06b Set Password page
- MS0-T030 F07 Founder Onboarding scaffold
- MS0-T031 E2E smoke test (Playwright: load FE → sign in → magic link → land on F07)

After Day 10, run the M0 acceptance criteria checklist (MS0-AC001 through MS0-AC019). All 19 must pass before M0 closes.

---

## Phase 4 — Hard rules and conflict resolution (apply throughout)

### Hard rules (do not violate)

1. **Never modify the 41 locked HTML frames.** Translate them to React components in `apps/web/src/app/**` instead. Reference them with comments like `// Implements F06 Sign In · see PM1_UI_v2/frame  html view/F06 Sign In.html`.
2. **Never add a paid component without my explicit written approval.** Even a $5/mo upgrade requires an ADR and my sign-off. The cost gate is $0/month for PM1.
3. **Never add Material Design 3 tokens, tertiary colors, or extend Tailwind config** beyond the locked palette. The `enforce-design-tokens.sh` hook will catch this; respect its decision.
4. **Never put API keys, OAuth secrets, or session tokens in the repo.** `.env` is in `.gitignore`. Provider keys go in Render env vars. CI keys go in GitHub Secrets.
5. **All non-trivial changes write to the audit log** (HMAC-SHA256 chain via `audit_log` table — see PM1_ERD §3.13).
6. **Reference the binding spec for every architectural decision.** If a question isn't covered, ask me before deciding. Don't guess and refactor later.
7. **Use pnpm, not npm or yarn.** All install/script commands assume pnpm.
8. **Use TypeScript strict mode** in both apps. No `any` types without a `// FIXME` comment and a Linear-style ticket.
9. **All API endpoints have Zod schemas** in `packages/shared`. Frontend imports the same schemas for client-side validation.
10. **Run `enforce-pm1-stack.sh` and `enforce-design-tokens.sh` before every commit** (already wired via husky pre-commit hook from MS0-T006).

### Conflict resolution

When the skill, an MCP, a stack default, or a documentation source disagrees with the binding spec, follow this priority:

1. `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` v8.1 — ALWAYS HIGHEST
2. `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` v2.1
3. `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md`
4. `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md` (design)
5. Tech-project-forge-skill output
6. MCP server suggestions
7. Library defaults (Next.js, NestJS, etc.)

If items 1-4 conflict with each other, raise the conflict to me for a decision — do not auto-resolve. Items 5-7 always lose to 1-4.

---

## Phase 5 — Communication preferences (how I want you to talk to me)

- **Concise and concrete.** Use file paths, line numbers, exact commands. Avoid "I'll do X" — show me what you're going to do, then do it.
- **Surface inconsistencies and risks early.** It's faster to fix a wrong assumption now than after you've built on it.
- **Use plan mode liberally.** For any non-trivial change, propose the plan first, wait for my "approved, proceed", then execute.
- **Cite sources.** When you make a decision based on PM1_PRD or PM1_ERD, cite the section. When you base it on Context7 docs (for fast-moving libraries like Next.js 15 / React 19 / Tailwind 4), say so.
- **No "let me think out loud" detours.** Decide, act, summarize.
- **When you complete a task, run the relevant validation gate** and report the result before moving on.
- **At end of each working day** (5 PM IST), give me a 5-line status: tasks completed, tasks in flight, blockers, what tomorrow looks like, free-tier quota usage if relevant.

---

## What I expect from you right now (after pasting this prompt)

1. Acknowledge you've read this entire prompt and that you understand the binding constraints.
2. Run Phase 0 reading in order. Summarize each file as you go (2-3 bullets each).
3. Produce the Phase 0.5 summary (8 sections).
4. Wait for my "approved, proceed".
5. Then run Phase 1 (tooling install).
6. Verify each step works before the next.

**Do NOT write code, create files outside `.claude/hooks/`, generate the `tailwind.config.ts`, or invoke Tech-project-forge-skill until I approve the Phase 0.5 summary.**

Begin Phase 0 now.

---

(End of prompt. Everything below this line is reference material for Yogesh, not part of the prompt itself.)

---

# Reference material (for Yogesh, not part of the prompt to Claude)

## Pre-flight checklist (do this tonight or Monday morning)

Before pasting the prompt above into Claude Code tomorrow:

- [ ] **Generate API keys** (both free, no credit card):
  - Groq: visit `console.groq.com/keys`, sign up with email, generate key, save in password manager
  - Gemini: visit `aistudio.google.com`, sign up with Google, generate API key, save in password manager
- [ ] **GitHub repo planning:** Decide if you want a personal GitHub account or an Iksula org account for the repo. Note the planned repo name `qa-nexus`.
- [ ] **Cloudflare account:** Create one if you don't have it (free tier is what we use). Verify email.
- [ ] **Email for free-tier services:** Use a single team email (e.g. `qa-nexus-pilot@iksula.com`) so the team can share access to Render, Neon, Resend dashboards.
- [ ] **Local environment:** Node 20 LTS + pnpm + git + GitHub CLI installed. Run `node --version`, `pnpm --version`, `git --version`, `gh auth status`.
- [ ] **VS Code extensions:** ESLint, Prettier, Tailwind CSS IntelliSense, Prisma, Mermaid Markdown Preview.
- [ ] **Project folder:** Decide where on your machine to put the project. Plan to manually copy the `QA Nexus/` folder into your project root tomorrow.
- [ ] **Tech-project-forge-skill installed:** Run `npx skills add yogeshcodeshare/Tech-project-forge-skill -y -g` once if not already done.

## How to use the prompt above

1. Tomorrow morning, open Terminal and `cd` to your project directory (after you've copied `QA Nexus/` folder into it).
2. Open Claude Code: `claude` (or use the VS Code plugin and start a new chat).
3. Open this file (`CLAUDE_KICKOFF_PROMPT.md`) in another window.
4. Copy everything between the two `---` lines marking the start and end of "The prompt" section above.
5. Paste into Claude Code. Send.
6. Claude will start Phase 0 reading. Wait for the Phase 0.5 summary.
7. Review the summary carefully. If anything is wrong, correct Claude. If correct, type "approved, proceed".
8. Claude will run Phase 1 (tooling install). Approve each MCP install prompt as it comes.
9. After Phase 1, Claude will run Phase 2 (skill activation). Watch for any skill output that conflicts with PM1_PRD/PM1_ERD — Claude is instructed to surface these to you.
10. After Phase 2 is verified clean, Claude moves to Phase 3 (M0 task list execution). This is where actual code gets written.

## Day-end status template (Claude will use this)

Each day at 5 PM IST, Claude should report:

```
=== Day X status (YYYY-MM-DD) ===
Completed today: MS0-T00X · MS0-T00Y · MS0-T00Z
In flight: MS0-T0AA (paused on Y)
Blockers: [list or "none"]
Tomorrow: MS0-T0BB · MS0-T0CC
Free-tier quota: Groq 47/1000 RPD · Gemini 12/1500 RPD · Neon 2.3/100 CU-hr · Render 4.2/750 hr
Cost so far this month: $0.00 ✓
```

## When things go wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| Claude proposes installing FastAPI / Redis / etc. | `enforce-pm1-stack.sh` hook missing or skill output not constraint-checked | Stop, paste the hard rules section to Claude, re-run |
| Render free dyno cold-start during demo | UptimeRobot ping not active | Reconfigure the 5-min ping; verify with curl |
| Neon DB shows "paused" mid-query | scale-to-zero auto-suspend kicked in | First query after idle takes ~500ms; acceptable for pilot. If unacceptable, upgrade to Launch tier ($19/mo) — but get my approval first. |
| Groq returns 429 rate-limited | Hit 1,000/day cap on 70B+ models | Verify gateway fell back to Gemini 2.5 Flash automatically. Check `agent_run` rows for `status='fallback_used'`. |
| Frontend deploy fails on Cloudflare Pages | Build command misconfigured | Check `pnpm install && pnpm build --filter=web` in CF Pages settings |
| Hook blocks legitimate code | Whitelist needed for new color/dep | Do NOT bypass the hook. Discuss with me first; we either add to whitelist (with rationale logged) or fix the code. |

## Glossary (for the team)

- **PM1** — Phase 1 of the QA Nexus program (= MVP = v1 GA, 18 weeks, 2026-04-27 → 2026-09-21)
- **A1, A2, A4** — the 3 PM1 AI agents (Test Generator, Dedup, RCA)
- **F##** — UI frame number, see `PM1_UI_v2/UI Files/01_SYSTEM.md` Appendix B
- **TB-###** — database table ID, see `PM1_ERD/PM1_ERD.md` §5
- **EP-###** — API endpoint ID, see `PM1_ERD/PM1_ERD.md` §6
- **MS0-T###** — M0 task ID, see `PM1_milestone/M0/Milestone_M0_Setup_v8.md` §3
- **MS0-AC###** — M0 acceptance criterion, see `PM1_milestone/M0/Milestone_M0_Setup_v8.md` §4
- **NFR-###** — non-functional requirement, see PM1_PRD §10
- **HMAC-SHA256 chain** — append-only audit log where each row's hash includes the previous row's hash; tamper-evident
- **Pattern A (deferred routing)** — F07 Step 2 data-source choice is wizard state only; data-source flows fire AFTER Step 3 atomic commit
- **5-Layer RCA** — A4's signature output: Stack (90%) → Env (80%) → Config (60%) → Code (50%) → Data (40%)

---

**End of CLAUDE_KICKOFF_PROMPT.md**

Last updated: 2026-04-25 late · matches PM1_PRD v8.1 + PM1_ERD v2.1 + 41 frames locked + M0_v8.md task list + Tech-project-forge-skill v1.4
