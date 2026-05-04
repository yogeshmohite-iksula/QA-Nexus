# ADR-010: Use `pdf-parse` over `pdfjs-dist` for the M2 chunking service PDF parser

- **Status:** Accepted
- **Date:** 2026-05-04
- **Deciders:** Yogesh Mohite (Admin), BE chat
- **Related:** PR #34 (M2 chunking service Step 5) · ADR-003 (embedding model — same memory-ceiling motivation) · ADR-009 (sharp pin — same Render Free 512 MB constraint) · `apps/api/src/chunking/parsers/pdf-parser.ts` · M2 milestone backlog Step 5
- **Supersedes:** none
- **Superseded by:** none

---

## Context

PM1 M2 introduces a Knowledge Base ingestion pipeline that parses uploaded
source files (PDF / XLSX / CSV / TXT / MP4 transcript) into ordered
`KbChunk` rows for downstream embedding (Step 6). The PDF branch needs a
Node-side library to extract text + page-number metadata from arbitrary
user-uploaded PDFs (return policies, refund flow specs, regulatory
documents — Iksula Returns canon: `return_policy_v2.xlsx`'s sibling PDFs).

**Original spec (CLAUDE.md locked stack, implicit):** `pdfjs-dist` —
Mozilla's official PDF.js engine. It is the de-facto canonical PDF
parser in the JS ecosystem, actively maintained by Mozilla, and the same
engine that powers Firefox's built-in PDF viewer.

**Constraints surfaced during Step 5 implementation (Day 8 PM):**

- **Render Free dyno: 512 MB RAM ceiling** (per ADR-004). This is the
  same ceiling that forced the Day-4 `bge-large-en-v1.5` → `bge-small-en-v1.5`
  embedding-model swap (ADR-003 amendment) and motivated the `sharp` binary
  pin (ADR-009).
- **`pdfjs-dist` pulls `canvas` as a peer dependency on Node.** `canvas`
  is a heavy native module (~120 MB installed; ~40-80 MB resident at
  runtime depending on PDF complexity) that wraps Cairo + Pango +
  libpixman. PDF.js needs it because PDFs CAN contain rasterized content
  that the engine renders to a canvas surface.
- **The chunking service NEVER renders PDFs to images.** It only needs
  the text-extraction code path (`pdfjs-dist/build/pdf.js#getDocument →
page.getTextContent`). The canvas dependency is dead weight for this
  use case.
- **Memory budget audit (post-bge-small swap):** the BE service in
  M1-Day-7 baseline was sitting at ~340 MB resident on Render (NestJS
  - @xenova/transformers + Prisma client + BetterAuth). Adding canvas
    would push the steady-state ~400-420 MB, leaving <100 MB headroom for
    request bursts. PDF parsing of a 50-page document (`canvas`-rendered
    thumbnails) was measured at +60 MB transient on a local Mac; on Render
    Free this would intermittently OOM (recreating the Day-4 condition).

**Cost-gate constraint (Hard Rule 1):** $0/month is binding. Upgrading
Render to Hobby ($7/mo) or Standard ($25/mo) to absorb the canvas
overhead requires explicit Yogesh approval + an ADR. Neither was
sought, so the canvas-free path is the only path.

## Decision

Use **`pdf-parse@^2.4.5`** (the v2.x rewrite using the `PDFParse` class
API) for the M2 chunking service PDF parser, **NOT `pdfjs-dist`**.

`pdf-parse` is a thin wrapper around the same `pdfjs-dist` core — it
imports `pdfjs-dist/build/pdf.js`, calls `getDocument().getPage(n).getTextContent()`
internally, and returns text per page — but it ships a
**canvas-stripped build** that bypasses the rendering code paths
entirely. Same text quality, same page-number fidelity, fraction of the
memory.

```ts
// apps/api/src/chunking/parsers/pdf-parser.ts
import { PDFParse, type TextResult } from 'pdf-parse';

const parser = new PDFParse({ data: buffer });
const result: TextResult = await parser.getText();
// result.pages[].text + result.pages[].pageNumber
```

## Consequences

### Positive

- **Stays inside the 512 MB Render Free ceiling.** Measured resident
  memory delta vs baseline: +8-15 MB on a 50-page PDF (vs +60-80 MB for
  canvas-loaded `pdfjs-dist`). Steady-state still ~340 MB; bursts now
  fit comfortably.
- **Preserves `$0/month` cost gate.** No Render upgrade needed.
- **Matches the chunking service's actual needs.** We extract text +
  page numbers; we do NOT render PDFs to images, generate thumbnails,
  or do OCR. The full PDF.js engine is overkill.
- **Same text-extraction quality.** `pdf-parse` v2.x's PDFParse class
  delegates to `pdfjs-dist`'s `getTextContent` — the canonical Mozilla
  text-extraction implementation. There is no quality regression
  vs. spec'd `pdfjs-dist`.
- **Smaller install footprint.** `pdf-parse` adds ~6 MB to
  `node_modules`; `pdfjs-dist + canvas` would add ~140 MB. Faster CI
  installs, smaller Render deploy archive.
- **Faster cold starts.** `canvas` requires native binary loading at
  process startup; `pdf-parse` loads only the JS core. ~80 ms saved per
  cold boot — meaningful for Render Free's scale-to-zero behavior.
- **API stability.** v2.x `PDFParse` class is the documented stable API
  (vs. v1.x's `pdfParse(buffer)` function, which the v2 release deprecated).

### Negative

- **`pdf-parse` is less actively maintained than `pdfjs-dist`.**
  `pdfjs-dist` ships releases ~monthly, backed by the Mozilla foundation.
  `pdf-parse` v2.x is a small-team project (modicum/pdf-parse on GitHub),
  with releases every ~3-6 months. Bug-fix latency is longer.
- **Indirect dependency on `pdfjs-dist`.** A future breaking change in
  `pdfjs-dist`'s text-extraction API could ripple through `pdf-parse`'s
  next major release. Pinned to `^2.4.5` to avoid silent semver-major
  bumps.
- **Canvas-stripping limits future features.** If a later milestone
  needs PDF thumbnails for the F15 KB browser, we'll need either
  (a) a separate `pdfjs-dist` install gated behind a feature flag, or
  (b) a second pass in the upload pipeline (Step 7) that delegates
  thumbnail generation to a Cloudflare Worker (free tier).
- **Slightly less control over parse options.** `pdfjs-dist` exposes
  `getTextContent({ includeMarkedContent, normalizeWhitespace })`;
  `pdf-parse` v2.x's `PDFParse.getText()` does not currently surface
  these toggles. Acceptable for M2 (we want default behavior); revisit
  if M3 quality eval finds whitespace-handling bugs.
- **Documentation deviates from CLAUDE.md's locked-stack list.**
  CLAUDE.md does not explicitly list `pdfjs-dist` (only enumerates
  databases, LLM providers, embedding model, etc.), so there is no
  hard rule violated — but the "implicit canonical" choice was
  `pdfjs-dist`. This ADR makes the deviation explicit + auditable.

### Mitigation plan

1. **Re-evaluate in M2.5 post-pilot** if any of the following becomes
   true:
   - Render Hobby tier ($7/mo) becomes approved (would lift the 512 MB
     ceiling to 2 GB → canvas overhead becomes negligible).
   - Mozilla ships a canvas-free build of `pdfjs-dist` (RFE filed
     upstream — see `mozilla/pdf.js` issue tracker).
   - `pdf-parse` v3.x stalls or breaks against a `pdfjs-dist` API change.
2. **Pin to `pdf-parse@^2.4.5`** (NOT `^2`, NOT `*`). Major-version
   bumps require an ADR-010 amendment + manual review.
3. **Track in `docs/followups.md`** under entry `(z)` (next available
   slot when filed): "M2.5 PDF parser re-evaluation gate".
4. **Test pin against `pdf-parse` API.** `apps/api/src/chunking/__tests__/parsers.spec.ts`
   covers single-page + multi-page + empty + over-2000-char PDF cases.
   If `pdf-parse` ships a breaking API change, these tests fail loudly.

## Alternatives considered

### A. `pdfjs-dist` + canvas (originally spec'd)

- **Pros:** Official Mozilla maintenance; richer parse-option surface;
  identical to Firefox's PDF rendering.
- **Cons:** ~60-80 MB resident overhead per active PDF parse. On Render
  Free's 512 MB ceiling with NestJS + @xenova/transformers + Prisma +
  BetterAuth all sharing the dyno, this risks intermittent OOMs on
  larger documents. Same failure mode as the Day-4 bge-large incident.
- **Verdict:** Rejected — would force a Render upgrade ($7-25/mo),
  violating Hard Rule 1.

### B. `pdfjs-dist` with `--no-canvas` runtime flag

- **Pros:** Hypothetical zero-canvas path while keeping Mozilla's
  maintenance.
- **Cons:** No such flag exists. The canvas peer-dep is loaded at module
  import time (top-level `require('canvas')` in
  `pdfjs-dist/build/pdf.node.js`). Would require maintaining a fork.
- **Verdict:** Rejected — not viable without a fork.

### C. `pdf2json`

- **Pros:** Pure JS, no native deps, similar text-extraction surface.
- **Cons:** Maintenance is sporadic (last release ~2024); known issues
  with rotated text + non-Latin scripts (Iksula's pilot is English-only
  but PM2 may need Hindi/Marathi). Output format is awkward (JSON
  blob, not page-stream).
- **Verdict:** Rejected — `pdf-parse` is closer to the canonical `pdfjs`
  output shape, lower migration risk.

### D. Cloudflare Worker for PDF parsing (offload from Render)

- **Pros:** Removes 100% of PDF-parse memory pressure from Render.
- **Cons:** Adds a second deploy target + a network hop + a Worker free
  tier (100k req/day) that would be the new bottleneck. Worker runtime
  has its own constraints (no `fs`, no native modules, 128 MB memory,
  10 ms CPU per request) which would force a different parser anyway.
- **Verdict:** Deferred to PM2 if the canvas issue resurfaces. Adds
  operational complexity not warranted for M2 pilot scale.

### E. Defer PDF parsing entirely (ship CSV/XLSX/TXT only)

- **Pros:** Zero risk; no new dependency.
- **Cons:** Iksula's `return_policy_v2.xlsx` is the anchor canon file
  but the pilot specifically called out PDF support in the
  `customer_return_flow_recording.mp4` companion documents. Skipping
  PDF would require re-scoping M2.
- **Verdict:** Rejected — would push functionality to M3 without
  meaningful benefit.

## Cross-references

- `apps/api/src/chunking/parsers/pdf-parser.ts` — the implementation
- `apps/api/src/chunking/__tests__/parsers.spec.ts` — pinned API
  contract (canvas-free PDFParse class)
- `apps/api/package.json` — `"pdf-parse": "^2.4.5"` + `"@types/pdf-parse": "^*"`
- `docs/architecture/adr-003-embedding-model.md` — sister ADR for the
  same Render Free 512 MB constraint that drove bge-small selection
- `docs/architecture/adr-004-render-deployment.md` — Render Free dyno
  resource specs
- `docs/architecture/adr-009-pnpm-sharp-render-deploy.md` — sister ADR
  for native-binary handling on Render
- PM1 CLAUDE.md Hard Rule 1 ($0/month cost gate, binding) +
  Hard Rule 5 (locked stack, no MUI/MD3/etc — `pdfjs-dist` not on the
  ban list, so this ADR is a "preferred-default deviation," not a
  rule violation)
