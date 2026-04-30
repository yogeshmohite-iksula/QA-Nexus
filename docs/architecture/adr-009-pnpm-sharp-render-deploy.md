# ADR-009: Pin sharp ≥0.33.5 to ship native binary on Render

- **Status:** Accepted
- **Date:** 2026-04-30
- **Deciders:** Yogesh Mohite (Admin), MAIN session
- **Related:** ADR-003 (embedding model choice — `Xenova/bge-large-en-v1.5` via `@xenova/transformers` → sharp transitive) · `docs/deploy/render-runbook.md` · Day-4 afternoon hotfix-4
- **Supersedes:** none
- **Superseded by:** none

---

## Context

Day-4 afternoon's Render deployment surfaced a four-part boot regression chain:

1. **Hotfix-1 (`c5eb339`)** — `NestOtelLogger extends Logger` → fix: `extends ConsoleLogger`
2. **Hotfix-2 (`4acaf4a`)** — `LLMGatewayService.onModuleInit` threw on missing env vars → fix: graceful deferred mode
3. **Hotfix-3 (`852ea72`)** — `package.json` had two `pnpm` keys; last-key-wins silently dropped `onlyBuiltDependencies` → fix: merge into single key
4. **Hotfix-4 (this ADR)** — Even with the merged allowlist correctly applied, `sharp@0.32.6` STILL failed to materialize its native binary on Render Linux x64. `/health` continued reporting:

   ```json
   "embedding": {
     "status": "deferred",
     "reason": "Cannot find module '../build/Release/sharp-linux-x64.node'",
     "model_id": "Xenova/bge-large-en-v1.5"
   }
   ```

## Diagnosis

Sharp 0.32.x ships its native binary via a `postinstall` script that downloads + extracts a platform-specific tarball (`sharp-linux-x64.tar.br` etc). Three failure modes for that script on Render:

1. **`pnpm install --frozen-lockfile`** is documented to skip post-install scripts of un-allowlisted deps, but in practice the interaction with `onlyBuiltDependencies` was inconsistent — the script appeared to be allowed but the binary still wasn't materialized.
2. **Render's build environment** runs as a non-privileged user without internet access from the script context — even when allowed, the download could silently fail.
3. **pnpm 10's content-addressable store** caches the install output; once a "broken" install was cached for `sharp@0.32.6` it would persist across rebuilds.

The fix space:

| Option                                      | Pros                                                                                                                                                                                                  | Cons                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Drop `--frozen-lockfile`                    | Allows scripts to fire freely                                                                                                                                                                         | Loses lockfile drift detection; slow builds |
| Force `pnpm rebuild sharp` in build command | Targeted                                                                                                                                                                                              | Already tried; still failed                 |
| Bump sharp to `^0.33.5` (this ADR)          | Sharp 0.33 (Nov 2023) **decoupled the binary from postinstall** — it's now a sibling package (`@img/sharp-linux-x64`) that pnpm installs via the regular dependency graph; no script execution needed | None observed in PM1 stack                  |

## Decision

Pin `sharp` to `^0.33.5` via root `pnpm.overrides`. The override forces all transitive resolutions (currently just `@xenova/transformers@^2.17.2`) to use 0.33.5 regardless of declared peer ranges.

```json
"pnpm": {
  "overrides": {
    "zod": "^3.25.76",
    "sharp": "^0.33.5"
  }
}
```

`@xenova/transformers@^2.17.2` is documented to support both sharp 0.32 and 0.33; no compat issue observed in 81/81 jest unit tests after the bump.

## Consequences

### Positive

- **Deploy-side native binary materializes via the regular dep graph.** No postinstall script needed → no script-policy interaction.
- **`onlyBuiltDependencies` allowlist still works** — kept in package.json as belt-and-suspenders for prisma + sharp + xenova + onnxruntime.
- **Smoke test (`apps/api/test/smoke/health.e2e-spec.ts`) catches future regressions.** If anyone bumps sharp BACK below 0.33 or removes the override, the next deploy's smoke run will fail with a clear pointer to this ADR.
- **No code change in `EmbeddingService`** — the deferred-mode plumbing from hotfix-2 is preserved as a defense-in-depth fallback for the OOM-on-free-dyno case.

### Negative / accepted trade-offs

- **Slightly larger node_modules** (~50 MB vs sharp 0.32, due to per-platform sharp-libvips packages). Not a concern at Render's 512 MB free dyno because the unused platforms (`@img/sharp-darwin-arm64`, etc.) are pruned by pnpm's `optionalDependencies` filter.
- **One more pinned major version to track** — when Sharp 1.x lands (or @xenova/transformers ships its own image-decoder), revisit this override. Add the review item to `.claude/locked-deps.json` if/when sharp becomes a direct dep.

### Neutral

- **Local dev unchanged.** Sharp 0.33 has the same API surface for our usage (`@xenova/transformers` is the only consumer; we don't call sharp directly).
- **`docs/deploy/render-runbook.md`** Build Command stays as-is — `pnpm rebuild sharp` is now redundant but harmless (no-op when binary is already in place).

## Verification

1. **Local install** — `pnpm install` runs sharp 0.33.5's `install: Done` confirming the native binary is materialized via the dep graph (visible in install output).
2. **Unit tests** — 81/81 jest green.
3. **Production smoke** — once Render auto-redeploys (~5 min after push):
   ```bash
   PROD_SMOKE_URL=https://qa-nexus-api.onrender.com \
     pnpm --filter @qa-nexus/api test:smoke
   ```
   Expected: `embedding.status === "up"` with `warm: true`, all 5 live assertions pass.

## Cross-references

- `docs/architecture/adr-003-embedding-model.md` — original model choice (BAAI/bge-large-en-v1.5 via xenova)
- `package.json` — `pnpm.overrides.sharp` pin
- `apps/api/test/smoke/health.e2e-spec.ts` — regression test
- `docs/deploy/render-runbook.md` — Build Command reference
- Sharp 0.33 release notes — <https://github.com/lovell/sharp/releases/tag/v0.33.0> (the "decoupled prebuilt binaries" entry is the relevant change)
