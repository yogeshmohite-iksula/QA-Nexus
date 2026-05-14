# Visual Regression (VR) Suite — `apps/web/tests/visual/`

**Spec:** Day-18 evening brief. P0 tonight ahead of the M4 close (Sat 2026-05-16).

VR locks pixel-level FE rendering against canonical baselines on every
PR that touches `apps/web/**`. Sister to the existing `apps/e2e/`
Playwright suite (which exercises behavioural FE↔API flows, not pixel
diffs).

## Layout

```
apps/web/tests/visual/
├── README.md                  ← you are here
├── playwright.config.ts       ← VR-only config (chromium × 4 viewports)
├── home.spec.ts               ← template spec (F08 Home)
├── <frame>.spec.ts            ← additional specs (FE+1 adds these)
└── canonical/                 ← baseline PNGs (FE+1 owns; CI compares against these)
    └── F<NN>/<viewport>.png       (e.g. canonical/F08/320.png)
```

**Day-18 evening rebase note:** the original two-tier split (`canonical/`
+ `__screenshots__/`) collapsed into single-tier `canonical/` to pick up
FE+1's 12 baselines directly. The Playwright `snapshotPathTemplate`
resolves to `{testDir}/canonical/{arg}/{projectName}.png` where `{arg}`
is the frame slug (passed to `toHaveScreenshot('F08')`) and
`{projectName}` is the bare viewport name (`320` / `768` / `1024` /
`1440`). Run `pnpm test:visual --update-snapshots` to regenerate
baselines after intentional design changes.

## Viewports (per CLAUDE.md Hard Rule 12)

The `playwright.config.ts` ships 4 chromium projects, one per breakpoint:

| Project | Viewport   | Use case          |
| ------- | ---------- | ----------------- |
| 320     | 320 × 568  | iPhone SE         |
| 768     | 768 × 1024 | iPad portrait     |
| 1024    | 1024 × 768 | small desktop     |
| 1440    | 1440 × 900 | canonical desktop |

## Tolerance (canonized in config)

- `maxDiffPixelRatio: 0.01` — up to 1 % of pixels may differ
- `threshold: 0.2` — per-pixel color tolerance, normalized 0–1
- `animations: 'disabled'`, `caret: 'hide'` — eliminate transient noise

## Running

### Local (requires `pnpm dev` running on `:3000`)

```bash
pnpm --filter @qa-nexus/web test:visual
# Regenerate baselines (after intentional design change):
pnpm --filter @qa-nexus/web test:visual --update-snapshots
```

### CI

`.github/workflows/ci.yml` job `visual-regression` runs automatically on
PRs that touch `apps/web/**`. On diff failure, the diff PNGs are
uploaded as a workflow artifact (`vr-diff-<run-id>.zip`) so the reviewer
can download + inspect.

To make this a **required** check on `main` branch protection:

```bash
gh api -X PATCH /repos/yogeshmohite-iksula/QA-Nexus/branches/main/protection \
  -f required_status_checks[strict]=true \
  -F required_status_checks[contexts][]='visual-regression'
```

(Yogesh runs this manually after merge — see Day-18 EOD.)

## Adding a new VR spec

1. `cp home.spec.ts <frame>.spec.ts`
2. Update the `page.goto(...)` route + the snapshot file name
3. Run locally with `pnpm test:visual --update-snapshots` to seed
4. Inspect `__screenshots__/<frame>.spec.ts/*.png` against `canonical/`
5. Commit BOTH the spec AND the baselines (they MUST live together)

## VR_BASELINES_READY env-var gate

The template `home.spec.ts` is `test.skip()`ed until `VR_BASELINES_READY=1`
is set. This prevents an empty-baseline first run from false-failing CI.
FE+1 removes the skip in the seed PR that lands the canonical PNGs.

## Cross-references

- `apps/e2e/playwright.config.ts` — sister behavioural suite (NOT VR)
- `.github/workflows/ci.yml` — `visual-regression` job
- `.github/workflows/e2e.yml` — sister behavioural workflow
- CLAUDE.md Hard Rule 12 — RWD mandatory; VR enforces
- CLAUDE.md Hard Rule 13 — visual gate procedure (manual; VR automates)
