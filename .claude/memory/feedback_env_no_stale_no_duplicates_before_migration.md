# BINDING RULE — Before any same-vendor env migration, audit `.env` for stale references AND duplicate keys

**Type:** feedback · **Filed:** Thu 2026-06-18 evening · **Banked by:** BE+1 (51st RC). **Trigger:** the Path C qa-nexus → qa-nexus-2 migration pre-flight surfaced a stale OLD `qa-nexus` `DATABASE_URL` still present in local `.env` PLUS a duplicate `DIRECT_URL` key. Caught BEFORE BE+1 ran `prisma migrate deploy` against the new project — i.e. caught **before** a destructive action against the wrong DB, not after.

## Rule

When migrating between same-vendor environments (Neon project → Neon project, Render service → Render service, S3 bucket → S3 bucket, ANY rename/clone/swap of the URL-tier values your app reads from env), **before any destructive action against the new environment**, audit every `.env` / `.env.local` / Render env var / GitHub Secret store the app reads from and confirm:

1. **NO stale references to the OLD environment** (no leftover `DATABASE_URL` pointing at the now-superseded project; no leftover `DIRECT_URL` / `R2_BUCKET` / etc. carrying the previous value).
2. **NO duplicate keys** (no two `DATABASE_URL=` lines, no two `DIRECT_URL=` lines, no `KEY=A` followed by `KEY=B`).

**Both checks together — not just one.** Stale-only audit misses dup-key bugs; dup-only audit misses stale-value bugs. Same-vendor migrations are the highest-risk class because the URL host/format looks "right enough" that grep-by-vendor doesn't catch the stale value.

## Why this exists (the case)

Thu 2026-06-18 evening. Path C executed: `qa-nexus` Neon project suspended on its per-project 100 CU-hr cap (49th RC); `qa-nexus-2` standing up in the same Neon org as the runtime DB; switch back planned post-Jul 1. Before E2E, BE+1 needed to run `prisma migrate deploy` + `prisma db seed` against `qa-nexus-2`.

In the migration pre-flight, BE+1 audited local `.env` and found TWO concurrent defects:

- **Stale reference:** `DATABASE_URL` still pointed at the OLD `qa-nexus` project (now suspended). If `migrate deploy` had run with that env, it would have either (a) failed with a connection-suspended error, (b) waited for Neon's quota-resume and then mutated the OLD project, or (c) — if the cap had been lifted — silently applied the migrations to the wrong DB. Failure mode (c) is the dangerous one.
- **Duplicate key:** `DIRECT_URL` appeared twice in `.env`. **Duplicate keys resolve differently across runners** — `dotenv` typically takes the LAST occurrence; some shell `set -a` + `source` semantics take the FIRST; Render's env-var UI deduplicates with last-wins; Prisma's CLI loader can differ from the app's runtime loader. So the value the migration would have used was **runner-dependent and silently inconsistent** with what the running app would later read — a class of bug that only manifests when the two values diverge (i.e. exactly during a migration).

The catch was **pre-destructive-action**, before any `prisma migrate deploy` ran. Caught-not-shipped. Phase D verdict gets to credit this as the second institutional win of the day (49th RC catch via Yogesh's "why Supabase?" + 51st RC catch via BE+1's pre-flight audit) — both were "ask the cheap question before the expensive action" in the discipline lineage.

## How to apply

Before any same-vendor env migration:

1. **Quote the source-of-truth.** Read the actual `.env` file (or Render env-var page, or GitHub Secrets list) — don't trust shell `printenv` or in-process `process.env` (those can lie about ordering + about whether they reflect file state).
2. **Stale check.** For every URL-tier or identifier-tier value, grep the OLD environment's distinguishing token (project name, ref, account ID, bucket name). Zero hits required before proceeding.
3. **Duplicate check.** Use `awk -F= '{print $1}' .env | sort | uniq -d` (or any dedupe scan). Zero duplicate keys required.
4. **Resolve dual-loader risk explicitly.** If the migration tool (e.g. `prisma migrate`) and the runtime app (e.g. NestJS) use different env loaders, document which loader's resolution wins for each key, and confirm they agree on the resolved value.
5. **Only THEN run the destructive action** (`migrate deploy`, `db seed`, env-var Save in Render, etc.).

Add the check to any future same-vendor-migration runbook (Supabase-failover plan B, Render-service-swap, R2-bucket-rename, anything in that class).

## Cross-references

- `feedback_verify_constraint_scope_before_expensive_workaround.md` (49th RC) — the question that triggered Path C and made this 51st RC reachable. Same "verify before expensive action" lineage.
- `feedback_stale_deploy_diagnosis_pattern.md` (41st RC) — sibling pattern at the deploy tier: "is the running bundle from the SHA I assume?" Same shape at a different layer: 41st = deploy state, 51st = env state.
- `feedback_deployed_bundle_baseurl_verification.md` (46th RC) — sibling at the FE-bundle tier: build-env-var inlined wrong → bundle calls wrong host. 51st extends the same discipline to the BE migration tier: env-var stale or dup → migration mutates wrong DB.
- `feedback_verify_api_paths_before_consumer_wiring.md` (33rd RC) — verify primary source (controller code) before prescribing paths. 51st generalizes to: verify primary source (the `.env` file itself, not the in-process echo) before destructive action.
- `feedback_institutional_memory_survives_in_vcs.md` (50th RC) — sibling discipline file from the same week.

## Ordinal note

**51st RC** (banked Thu 2026-06-18 evening, after Yogesh's earlier-Thu ordinal ruling fixed 49th = constraint-scope + 50th = institutional-memory). No collision; sequential. Banked by BE+1 per Yogesh's direction; this file authored by MAIN for the repo memory store + PR #287.

_Authored Thu 2026-06-18 evening before the Yogesh E2E. The catch was BE+1's; the lesson generalizes to every same-vendor migration class. Add it to any runbook that swaps URL-tier env values._
