# Option B Data-Wiring Plan — ready-to-execute once BE+1 catalog lands

**Status:** STANDBY. Core safety-net helper shipped (`apps/web/lib/api/fetch-with-fallback.ts`). The 4 endpoint files below are **NOT written yet** — they are gated on `docs/pilot-prep/2026-06-07-sun-api-shape-catalog.md` (Hard Rule 11: no invented shapes).
**Author:** FE+1 (cross-exec). Sun 2026-06-07.

---

## The safety net (DONE)

`fetchWithFallback<T>(path, fallback, { schema, timeoutMs, label })` — shape-agnostic:

- 3s `AbortController` timeout (configurable)
- `credentials: 'include'` (BetterAuth cookie)
- any failure (network / non-2xx / timeout / schema-mismatch) → `console.warn('[fetchWithFallback] <label>: <reason> → using canned-data')` → returns `fallback`
- **never throws** — caller always gets a usable `T`

This is what makes Option B carry Option-A-level zero-breakage risk.

---

## Catalog cross-check (do FIRST when catalog lands)

For each of the 4 endpoints, confirm from the catalog:

- [ ] Exact path (e.g. `/api/projects` vs `/api/workspace/projects`)
- [ ] Method (all 4 are GET)
- [ ] Auth requirement (session cookie vs bearer — `fetchWithFallback` sends cookie)
- [ ] Sample JSON response → matches our canned-data type? Note any field renames.
- [ ] Whether a Zod schema is published in `packages/shared` (preferred) — if not, skip `schema` opt and rely on TS cast + the canned-data fallback.

**If any shape diverges from canned-data → STOP, ping Yogesh** (don't silently remap).

---

## The 4 endpoint files (mechanical once catalog confirmed — ~15 min each)

Each is a thin wrapper: `fetchWithFallback(<path>, <canned-data>, { schema?, label })`.

### 1. `apps/web/lib/api/projects.ts` (F09 + project switcher)

- Fallback: the 5-project canon (currently hardcoded in `shell-topbar-widgets.tsx` `PROJECTS`). **Refactor: extract that array to canned-data so it's the shared fallback.**
- Consumer: `ProjectSwitcher` — `useEffect` fetch on mount, swap `PROJECTS` → fetched list.
- Empty (0 projects) → `EmptyState` "No projects yet" + "Create project".

### 2. `apps/web/lib/api/users.ts` (F27 roster)

- Fallback: `F27_TEAM_MEMBERS`.
- Consumer: `users-roles-page.tsx` `<TeamRoster data={...} />`.
- Verify 8 users render in canon order (Akshay Lead → Yogesh Admin → 6 QA).
- Empty (just Yogesh) → `EmptyState` "Just you for now" + "Invite users".

### 3. `apps/web/lib/api/audit-log.ts` (F28 audit section)

- Endpoint exists: `GET /api/audit` (confirmed in backend `audit.controller.ts`).
- Fallback: F28 audit canned-data.
- Render reverse-chronological. Empty → "No settings changes yet."

### 4. `apps/web/lib/api/llm-providers.ts` (F26m1 / F28m1 provider state)

- Endpoint exists: `GET /api/admin/llm-config` (confirmed `admin/llm-config.controller.ts`).
- Fallback: `F26M1_PROVIDER_CONFIG` / `F28M1_*`.
- Edit mode pre-fills from fetched provider settings.

---

## What is NOT in Option B scope (no endpoints exist — stays canned)

- F08 Home dashboard aggregate (no `/api/dashboard/home`)
- Agents aggregate + eval-history (only `POST /agents/a1-scribe/generate`)
- Invites list (no `/api/invites`)
- Settings non-audit sections (no `/api/settings`)

→ These stay on canned-data for Monday. (Sample-pill labelling = optional Task 4, deferrable.)

---

## Test coverage (already in PR #250 smoke suite)

- Test 12: project switcher shows 5 Iksula projects ✅ (passes against fallback OR live)
- Test 7: Users roster shows Akshay + Kishor ✅
- These are data-source-agnostic — they pass whether data comes from API or fallback, which is exactly the Option B guarantee. No new tests needed unless the catalog adds fields worth asserting.
