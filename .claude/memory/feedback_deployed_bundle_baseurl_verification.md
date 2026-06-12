# BINDING RULE — Verify the deployed bundle's API base URL on the live URL itself

**Type:** feedback · **Filed:** Fri night 2026-06-12 (~10:30 PM IST) · **Trigger:** Yogesh's 30-min Phase C click-through with DevTools Network on `qa-nexus-web.pages.dev` caught what 6 FE auditors + 4 BE auditors + cross-domain orchestration + cascade discipline + two-axis aggregation + CI smoke battery all missed.

## Rule

For any FE that consumes a cross-origin API, **the only verification that catches a wrong-API-base bundle is loading the live deployed URL in a real browser and watching the Network tab**. Source grep, route mocks, CI green, curl from CI environment, dev-server smoke, and even Playwright runs against the deploy URL **all look fine** when the bundle is silently calling `http://localhost:3001/api/projects` instead of `https://qa-nexus-api.onrender.com/api/projects`. Pattern A canned fallback **swallows the failure** — the surface renders correctly with fixtures, the request fails silently, the user sees the wrong data, and _every test passes_.

**The verification is non-optional and not substitutable.** Add it as a gate to any FE deploy that consumes a cross-origin API.

## Why this exists (the case)

Fri 2026-06-12. The whole week's machinery — BE+1 + FE+1 + MAIN, three parallel audits, conformance dashboards, two-axis tracking, batch-merge with cascade resolution, 9-PR consolidated deploy, smoke runs — produced a `🟢 merged + 🟢 CI green` picture on items like #269 F09 switcher, #274 F28 audit wire, #271/#276 F21 defects.

Then Yogesh opened `https://qa-nexus-web.pages.dev` in a browser, hit DevTools → Network → clicked the F09 switcher. The XHR went to **`http://localhost:3001/api/projects`** — not to `qa-nexus-api.onrender.com`. The request never left the machine. The FE's Option-B canned fallback (`PROJECTS_FALLBACK`) rendered, so the surface looked right; the wire was broken.

### Root cause (evidence-grounded, from grep)

- `apps/web/lib/api/users-api.ts:18-19` documents the contract: "`NEXT_PUBLIC_API_BASE_URL`... Defaults to `http://localhost:3001` for [local dev]."
- `apps/web/.env.example:9`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`.
- `getApiBaseURL()` is the shared resolver used by `users-api.ts` / `composer-api.ts` / `kb-upload-api.ts` / `projects-api.ts` (#269) / `defects-api.ts` (#271/#276) / `audit-api.ts` (#274).

**Therefore:** if `NEXT_PUBLIC_API_BASE_URL` is **not set in the Cloudflare Pages build environment**, the bundle inlines `http://localhost:3001` at build time — across every consumer at once. This is a **build-env config gap, not a code bug.** A single env-var fix + rebuild repairs every wired surface simultaneously.

### Why every other layer of the institutional machinery failed

| Verification we ran this week               | Why it didn't catch it                                                                                                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source grep / code review**               | The code is correct — `getApiBaseURL()` reads `process.env.NEXT_PUBLIC_API_BASE_URL` properly. Reading source can't see the build-time inline.                                                                             |
| **Route mocks / unit tests**                | The mock intercepts before the URL matters. By design they don't validate the base URL.                                                                                                                                    |
| **CI green (typecheck + lint + tests)**     | CI doesn't run with Cloudflare Pages' env config; the gap doesn't surface in CI's environment.                                                                                                                             |
| **Curl from CI environment**                | Curl was run against the API directly (`onrender.com/health`, `/api/projects`) — that verified the **API** was up, not that the **FE bundle was calling it**. Different question.                                          |
| **Playwright against deploy URL**           | Page renders → assertions pass on the rendered DOM. The DOM gets canned-fallback data and looks correct. Playwright tests don't fail when the network call quietly errors out into a fallback.                             |
| **Cross-domain orchestration audit (MAIN)** | The orchestration view said "BE endpoint exists, FE consumes it." Both were true _in source_. Neither MAIN nor either domain audit looked at the deployed bundle's actual outgoing URL.                                    |
| **Two-axis aggregation (43rd RC)**          | The framework was correct: `merged ✅` vs `live-verified ❌`. But "live-verified" was operationalized as Playwright + curl, neither of which catches this class. The 46th RC is the fix to _what counts as live-verified_. |

**The only verification that worked:** Yogesh opened the deployed FE in a browser, opened DevTools Network, clicked a button, and read the actual outgoing request URL.

## How to apply

For any FE that consumes a cross-origin API, before declaring a deploy "live-verified":

1. **Open the deployed URL in a real browser** (not CI, not curl, not Playwright headless — a browser you can click in).
2. **Open DevTools → Network** with **"Preserve log"** on and **filter by `Fetch/XHR`**.
3. **Sign in, then trigger every category of API call** that the audit claims wired (list, detail, mutate; one of each).
4. **For each request, read the URL column.** The host MUST be the production API origin (e.g. `qa-nexus-api.onrender.com`), NOT `localhost`, NOT a `pages.dev` self-call (unless rewrite-proxied — a separate architecture).
5. **For each request, read the status column.** A `200/201/204` confirms the request reached the API and returned. `404`, `CORS error`, `(failed) net::ERR_CONNECTION_REFUSED`, or no entry at all = wire is broken.
6. **Only after every category passes** can a wire-up item flip to `live-verified ✅`. Pattern A / Option B canned fallback **does not count as verification** — it is the very mechanism that hid the failure.

### When a wire fails this check

- **First hypothesis: build-time env-var gap.** Confirm the deploying hosting platform (Cloudflare Pages, Vercel, etc.) has the required `NEXT_PUBLIC_*` (or framework equivalent) set at build time, not runtime. A single env-var + rebuild fixes every consumer at once.
- **Second hypothesis: runtime resolver bug** (only if env-var is correct but bundle still points wrong). Unlikely; investigate `getApiBaseURL()` / equivalent.

### What changes in the dashboard

The `live-verified` column needs a stricter definition:

> **`live-verified` = (a) deployed URL loaded in a real browser, (b) the action that exercises the endpoint was clicked, (c) DevTools Network confirmed the outgoing URL matches the production API origin and returned 2xx.** Pattern A canned fallback does NOT count. Playwright pass does NOT count (necessary, not sufficient). CI curl against the API does NOT count (verifies API, not bundle wiring).

## Cross-references

- The 43rd RC `feedback_two_axis_aggregation_merged_vs_live_verified.md` — this 46th RC is **the precise operational definition of `live-verified` for FE-bundle wiring** that the 43rd RC framework needed.
- The 39th RC F18 over-claim — same shape (commit-message-as-verification fallacy). 46th RC extends it to CI-green-and-Playwright-pass as also insufficient when canned fallback is in play.
- The 41st RC live-shake-down-beats-static-audit — Yogesh's network-tab inspection is the canonical live shake-down for the wiring layer; this 46th RC formalizes it as a binding gate.
- `apps/web/lib/api/users-api.ts:18-19` + `apps/web/.env.example:9` — the contract documentation that made the localhost default an explicit (in-source) condition the operator should set at Cloudflare Pages.
- The shared `getApiBaseURL()` resolver — fixing once via build-env repairs every consumer.

_Authored Fri night 2026-06-12 immediately after the catch, before the dashboard correction + Phase D verdict reframing, so the rule lands with the case still fresh and the evidence (the grep showing localhost as the documented default) inline. The lesson is binding: a deploy with a cross-origin API is not "live-verified" until a human has watched the Network tab on the live URL._
