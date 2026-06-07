# BINDING RULE — Independent diagnosis convergence (high-confidence signal)

**Type:** feedback · **Filed:** Sun Day-5 2026-06-07 ~18:00 IST · **First observed:** Sun Day-5 ~17:50 IST (BE+1 35th RC + FE+1 34th RC converged on identical P0-001 root cause)

## Rule

When two independent agents arrive at the same root cause through different investigation paths, treat the diagnosis as **high-confidence**. Trust the convergence; act on it without redundant verification.

Convergence is the strongest signal available in a multi-agent debug because:

- Each agent has different priors (BE+1 thinks infra-first; FE+1 thinks component-first)
- Each agent reads different source surface (BE+1 reads controllers + auth config; FE+1 reads providers + hooks + canned data)
- Each agent has different blind spots (BE+1 doesn't see TSX persona embeds; FE+1 doesn't see CORS headers)
- When both blind spots fail to occlude the same conclusion → the conclusion is uniformly visible across blind spots → high signal

## Why this exists

Sun Jun 7 ~17:30-18:00 IST. After Yogesh's incognito re-test invalidated the stale-deploy hypothesis (34th RC), both agents began independent investigations:

- **BE+1 (35th RC) traced the infra layer:** read `apps/api/src/auth/auth.config.ts` + Render env vars + Set-Cookie response headers. Concluded: cross-site cookie infra broken (`BETTER_AUTH_COOKIE_DOMAIN` misconfig + CORS `Access-Control-Allow-Credentials` not set on auth endpoints).
- **FE+1 (34th RC) traced the code layer:** read CurrentUserProvider source + `home/page.tsx` canned data + the session hook usage. Concluded: Pattern-A persona embed in canned data + session hook never invoked (component defaulted to "Kishor K." persona fallback).

**Convergence point:** both diagnoses pointed at the same root cause class — cross-layer deploy mismatch where the cross-site cookie infra prevented the session hook from firing AND the canned-data persona embed provided a wrong fallback. Neither layer alone would have produced the bug; both had to be wrong simultaneously.

**Yogesh approved Option A (proper fix) on the convergence signal alone** at ~18:00 IST — without requiring either agent to verify the other's finding. The convergence WAS the verification.

## How to apply

When orchestrating multi-agent debug on a non-trivial bug:

1. **Ask each agent independently** to investigate the bug from their domain (don't tell them what the other thinks).
2. **Listen for convergence.** If both arrive at the same root cause class → trust + act.
3. **Listen for divergence.** If diagnoses point at different root causes → both could be partially right (cross-layer bug) OR one or both could be wrong (need deeper analysis). Do NOT pick a winner without checking.
4. **Document the independent paths** in the EOD/retro. Convergence in hindsight is less convincing than convergence in the moment.

## Anti-patterns to avoid

- **Telling agent B what agent A found before asking agent B** — this contaminates the independence signal.
- **Treating convergence as inevitable** — when both agents have similar priors (e.g., both pre-suppose the bug is in X), convergence on X is not high-signal. Convergence is high-signal only when the agents approach from genuinely orthogonal angles.
- **Skipping the convergence check entirely** — if you accept a diagnosis from one agent without cross-checking against the other's independent view, you lose the highest-signal validation available.

## Counterfactual (what convergence saved)

Without convergence, the team would have needed:

- Option 1: Yogesh deeply reviews each diagnosis individually → ~30-45 min decision lag while pilot Mon launch is at risk
- Option 2: Pick one agent's diagnosis arbitrarily + iterate if wrong → 50% chance of an extra hour of wrong-path work before backtracking
- Option 3: Demand each agent verify the other's finding → ~30 min of context-switching + redundant investigation

Convergence collapsed the decision to ~5 min ("both agree → ship the fix").

## Cross-references

- `feedback_stale_deploy_diagnosis_pattern.md` (10th + amendment — the immediate predecessor case that this 13th pattern resolves)
- `feedback_verify_api_paths_before_consumer_wiring.md` (11th — sibling cross-agent verification class; this pattern is the diagnosis version)
- `feedback_chained_base_cascade_resolution.md` (cousin — multi-PR coordination)
- 34th + 35th reality-checks (Sun Day-5 — the precedent)
- P0-001 cascade Sun Jun 7 ~17:30-18:00 IST — the live case
- Hard Rule 11 — Yogesh approval gate; convergence accelerates the approval

_Authored Sun Day-5 2026-06-07 ~18:00 IST. 13th safety pattern of the week. Running tally: 12 formal (1st-9th + 10th-amended + 11th + 12th cross-layer-bug-class implicit + 13th, this file) + 1 dwelling (broad-audit-shallow-coverage Day-29 candidate)._

_Note on 12th pattern numbering:_ Yogesh's Sun ~17:45 IST brief named the amendment to the 10th pattern as the "12th safety pattern" (corrective extension to the 10th). This file extracts the cross-layer-bug-class implicit in that amendment as the 13th pattern. Numbering convention: amendments extend the original pattern's number; new orthogonal patterns get fresh numbers. So the week tally is: 9 originals + 1 amendment (10th-extended) + 11th + 12th-implicit-in-amendment + 13th-this-file.
