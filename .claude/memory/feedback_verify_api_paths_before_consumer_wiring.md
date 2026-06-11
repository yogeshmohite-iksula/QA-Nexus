# BINDING RULE — Verify API paths/shapes BEFORE consumer wiring

**Type:** feedback · **Filed:** Sun Day-5 2026-06-07 ~17:00 IST · **First observed:** Sun Day-5 ~16:45 IST (BE+1 33rd reality-check on MAIN's prescribed endpoint catalog)

## Rule

When orchestrating cross-agent work, **NEVER prescribe API paths/shapes to a consumer agent (e.g., FE+1) without first verifying them against the producer's source code** (e.g., NestJS controllers in `apps/api/src/**`). Even one digit off (`/api/audit` vs `/api/audit-log`) or one envelope wrapper (`{ data: [...] }` vs raw `[...]`) wastes hours of consumer wiring + iteration.

## Why this exists

Sun Jun 7 ~16:30 IST. MAIN drafted a brief for FE+1 that prescribed 4 API paths + response shapes for the Option B endpoint wiring task. The brief was sent to BE+1 for sanity-check as part of the dual-track Sun work (seed + catalog).

BE+1's 33rd reality-check (~16:45 IST) read the actual NestJS controllers + DTO files and found **5 corrections** vs MAIN's prescribed catalog:

1. `/api/audit-log` → actual path `/api/audit/log` (MAIN guessed at the resource grouping)
2. Two endpoints listed for what was actually one composite endpoint (MAIN inflated the surface)
3. Wrong response envelope: prescribed `{ data: [...], total }` vs actual `{ rows: [...], pagination: { ... } }`
4. Missing required query param `projectKey` on one endpoint (MAIN forgot RBAC scoping)
5. Wrong field name in one DTO (`createdAt` vs `created_at` — snake-vs-camel inconsistency BE+1 caught)

All 5 were caught BEFORE FE+1 started wiring. Counterfactual cost: FE+1 would have written ~150-200 lines of fetcher code against the wrong shapes, hit failures during Playwright smoke (~30-60 min iteration window), and could have been still debugging at the 19:00 IST GO/NO-GO call — possibly delaying Mon launch.

## How to apply

When MAIN (or any orchestrator agent) writes an endpoint catalog for a consumer agent:

1. **Stop writing from memory or assumption.**
2. **Read the producer's actual source:** `apps/api/src/<resource>/<resource>.controller.ts` for the route decorator, and the DTO/Zod schema for the response shape. Use `Read` (not grep alone — you need the surrounding context).
3. **Cross-check against `packages/shared/src/schemas/`** — the Zod schemas are the binding contract per Hard Rule 10.
4. **Document the source paths in the catalog footer:** "verified against `apps/api/src/audit/audit.controller.ts` at SHA `<7-char>`."
5. **If you cannot read the source (e.g., file doesn't exist yet), say so explicitly** — DO NOT invent shapes. Mark the entry as "shape TBD pending producer ship."

## Specific anti-patterns to avoid

- Guessing REST resource grouping from frontend-side intuition (`/api/audit-log` because FE wants a "log" page; backend may have grouped under `/audit`)
- Assuming pagination envelope is `{ data, total }` (varies — could be `{ rows, pagination }`, `{ items, nextCursor }`, etc.)
- Forgetting scoping query params (most QA Nexus endpoints take `projectKey` for RBAC scoping)
- Inconsistent casing assumption — codebase has both snake_case (DB columns surfaced raw) and camelCase (Prisma-projected) DTOs
- Inflating endpoint count to "be safe" — one composite endpoint isn't two

## Cross-references

- `feedback_stale_deploy_diagnosis_pattern.md` (10th — sibling diagnostic rule for production bundles)
- `feedback_chained_base_cascade_resolution.md` (cousin — managing PR queue freshness; consumer wiring depends on producer PRs being merged)
- `packages/shared/src/schemas/` — Zod schemas are the binding contract
- Hard Rule 10 — All API endpoints have Zod schemas in `packages/shared`; FE imports same schemas for client-side validation
- Hard Rule 11 — When in doubt, ask Yogesh / verify against source
- PR #248 (BE+1's Sun audit + corrected catalog) — landed the verified endpoint catalog FE+1 actually wired against

_Authored Sun Day-5 2026-06-07 ~17:00 IST. 11th safety pattern of the week. Running tally: 10 formal (this + 9 prior) + 1 dwelling (broad-audit-shallow-coverage Day-29 candidate)._
