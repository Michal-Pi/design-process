---
phase: "02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b"
plan: "03"
subsystem: "style-lite-workflow + dtcg-tokens-emit + three-adapters + stage-5a-gate-regression"
tags:
  - dtcg-v2025-10
  - tokens-emit
  - three-adapters
  - stage-5a-lite
  - d-43-regression-guard
  - golden-tests
  - budget-check
  - skill-md
  - evidence-inferred
  - tdd
dependency_graph:
  requires:
    - "02-02-SUMMARY.md (stage-2 gate, structure workflow, stage-2-to-5a bundle)"
    - "01-02-SUMMARY.md (gate runner base.mjs, stage-5a.mjs hard-coded not_runnable)"
    - "01-03-SUMMARY.md (verify-golden.mjs, lint-determinism, ESLint switch-exhaustiveness-check)"
    - "01-05-SUMMARY.md (routing/registry.mjs detectStack, preview harness)"
  provides:
    - "assets/scripts/tokens-project.mjs (DTCG v2025.10 emit + 3 adapter paths)"
    - "assets/scripts/cli/budget-check.mjs (per-stage token budget enforcement)"
    - "skills/workflows/style.md (W6-lite Stage 5a workflow)"
    - "skills/atoms/tokens/emit.md (ATOM-14)"
    - "skills/atoms/hifi/variants-preview.md (ATOM-13)"
    - "evals/fixtures/golden/tokens-project/ (3 golden fixtures)"
    - "tests/tokens/tokens-project.test.ts (32 unit + golden tests)"
    - "tests/gates/stage-5a-not-runnable-regression.test.ts (5 D-43 CI guards)"
  affects:
    - "02-04 through 02-05 (systematize-lite and audit plans consume tokens-project.mjs)"
    - "verify-golden.mjs (extended with runTokensProjectFixtures)"
tech_stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle (same pattern as 02-01 and 02-02)"
    - "assertNever exhaustiveness check on adapter switch (D-48, ESLint switch-exhaustiveness-check)"
    - "canonicalize() recursive key-sort for deterministic DTCG JSON (same as schemas/emit.mjs)"
    - "YAML frontmatter + JSON body hybrid format for tokens.json (D-42 stage:5a-lite + evidence:INFERRED)"
    - "Tailwind v4 @theme merge: regex-inject into existing block vs. append new block (T-02-03-02)"
    - "Golden fixture determinism anchored by fixed generatedAt parameter (same as handoff-bundle)"
    - "stagingDir runId: deterministic when generatedAt provided, random otherwise (D-52)"
key_files:
  created:
    - "assets/scripts/tokens-project.mjs"
    - "assets/scripts/cli/budget-check.mjs"
    - "skills/workflows/style.md"
    - "skills/atoms/tokens/emit.md"
    - "skills/atoms/hifi/variants-preview.md"
    - "evals/fixtures/golden/tokens-project/input.json"
    - "evals/fixtures/golden/tokens-project/expected-shadcn.json"
    - "evals/fixtures/golden/tokens-project/expected-tailwind-v4.json"
    - "evals/fixtures/golden/tokens-project/expected-plain-css.json"
    - "tests/tokens/tokens-project.test.ts"
    - "tests/gates/stage-5a-not-runnable-regression.test.ts"
  modified:
    - "assets/scripts/verify-golden.mjs (runTokensProjectFixtures added)"
decisions:
  - "stagingDir uses deterministic run-ID from generatedAt for golden-test compatibility; random ID otherwise (D-52)"
  - "Semantic tier uses resolved OKLCH values not DTCG alias syntax — avoids alias-resolution ambiguity at consumer"
  - "Tailwind v4 @theme merge uses regex injection inside existing block (not two separate @theme blocks)"
  - "D-43 regression test: 3rd test asserts empty-interactions → not_runnable (v2.0a primary contract); Phase 1 'pass' for non-empty interactions is documented separately"
  - "budget-check.mjs supports tokensUsed/token_count/tokens field names for run-log flexibility"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-05-25"
  tasks: 2
  files_created: 11
  files_modified: 2
  tests_added: 37
  tests_total: 676
---

# Phase 02 Plan 03: Style-Lite Workflow + DTCG Tokens Emit + Three Adapter Paths + Stage 5a Gate Assertion Summary

**One-liner:** DTCG v2025.10 tokens-project.mjs with three adapter paths (shadcn CSS vars, Tailwind v4 @theme additive merge, plain :root) — evidence:INFERRED frontmatter enforced; golden tests confirm 5× byte-identical output; D-43 CI regression guard asserts gate-stage-5a.mjs is never modified; budget-check.mjs enforces per-stage token budgets; three Stage 5a-lite SKILL.md files shipped.

## What Was Built

### T-02-03-A: tokens-project.mjs + budget-check.mjs + golden fixtures (TDD)

**RED phase** (commit `c0e39ec`): 37 failing tests — 32 for tokens-project.mjs (all adapters, DTCG tiers, determinism, golden), 5 for D-43 regression guard.

**GREEN phase** (commit `44d653e`): Full implementation.

**tokens-project.mjs:**

1. `buildTokenTree()` constructs three-tier DTCG tree:
   - `primitive`: color (primary, background, foreground, border/derived, primary-foreground/derived, muted/derived, muted-foreground/derived) + 8-step spacing scale (0.5×–8× from spacingBase) + fontFamily
   - `semantic`: role-mapped aliases (resolved values, not DTCG alias syntax)
   - `component`: button (background, foreground, border-radius), input (border, background), card (background, border)

2. `canonicalize()` sorts keys recursively for deterministic JSON output.

3. `writeDtcgTokensJson()` writes YAML frontmatter + JSON body:
   - Frontmatter: `artifact: tokens`, `stage: 5a-lite`, `evidence: INFERRED`, `schemaVersion: 1`, `generated: <ISO>`
   - Body: canonical DTCG JSON with `$schema`, `$description`, three tier groups

4. Adapter dispatch (`switch + assertNever` — ESLint switch-exhaustiveness-check):
   - `shadcn`: emits `design-os-tokens.css` (shadcn naming: `--background`, `--foreground`, `--primary`, etc.) + sample `design-os-theme-provider.tsx` wrapper in `components/` subfolder (never `components/ui/`)
   - `tailwind-v4`: reads existing `app/globals.css`; if `@theme` block found → injects props inside it (additive only, T-02-03-02); if no `@theme` → appends; if no file → creates from scratch
   - `plain-css`: emits `:root {}` with OKLCH values (CSS Color 4)

5. Input validation: OKLCH color format guard on all three color inputs (T-02-03-01).

6. Staging dir uses deterministic `run-<generatedAt>` ID when `generatedAt` provided (golden test compatibility) — random ID otherwise (D-52).

**budget-check.mjs:**
- 7-stage budget table: discover(30k/60k), structure(25k/50k), style(55k/110k), systematize(40k/80k), design-bug(20k/40k), brand-refresh(55k/110k), PR-audit(15k/30k)
- Post-check reads last matching entry from run-log.jsonl (flexible field names: tokensUsed/token_count/tokens)
- Hard-stop exits 1; `--continue-anyway` logs warning but exits 0
- Pre-check: informational only, exits 0
- Auto-discovered by `bin/design-os.mjs`

**Golden fixtures:**
- `evals/fixtures/golden/tokens-project/input.json` — fixed seed with `generatedAt: 2026-05-25T00:00:00.000Z`
- `expected-shadcn.json` — full tokens.json with YAML frontmatter + DTCG body
- `expected-tailwind-v4.json` — globals.css with `@import "tailwindcss"` + `@theme {}` block
- `expected-plain-css.json` — `:root {}` CSS custom properties
- `verify-golden.mjs` extended with `runTokensProjectFixtures()` (5× byte-identical per adapter)

All 32 unit tests pass. lint-determinism CLEAN. tsc clean.

### T-02-03-B: Style workflow SKILL.md + atoms + D-43 CI regression

**commit `49e9227`**: Three SKILL.md files + D-43 regression guard (already committed in RED phase `c0e39ec`).

**skills/workflows/style.md** (W6-lite, Stage 5a):
- Frontmatter: name=`design-os/style`, description 144 chars, stage:5a, gate:gate/stage-5a-complete
- 11 numbered procedure steps:
  1. Read stage-2 handoff bundle (halt if absent)
  2. Budget pre-check via `node bin/design-os.mjs budget-check --stage style --check pre`
  3. Load DTCG/shadcn/WCAG references
  3a. `--depth` dispatch: lightweight/standard/full
  4. TRUST-05 intake (3 questions — brand personality, primary color, font preference)
  5. Palette selection + WCAG contrast reporting (measure, never claim)
  6. ATOM-14 inline: `node assets/scripts/tokens-project.mjs ...`
  7. ATOM-13 inline: 3 palette variants via preview harness, diversity check ≥0.15
  8. Budget post-check
  9. **D-43 gate step**: explicit `node bin/design-os.mjs gate --stage 5a --design-dir design/` with `not_runnable` expected messaging
  10. Handoff bundle build
  11. Diff + `--apply` step (D-52)
- Host fallback section: Codex CLI/Cursor sequential path, Playwright skip behavior (D-53)

**skills/atoms/tokens/emit.md** (ATOM-14):
- Standalone bootstrap: 3 questions before generating
- Workflow procedure: detectStack → tokens-project.mjs invoke → DTCG structure validate → return result
- D-51 evidence:INFERRED documentation

**skills/atoms/hifi/variants-preview.md** (ATOM-13):
- Standalone bootstrap: 3 questions
- Workflow procedure: tokens read → 3 variants (±10% L) → port-manager → Playwright spawnAndProbe → scrubEnvForPreview → diversity check
- Non-blocking preview failure (T-02-03-05 accept)
- Host fallback: Playwright skip on Codex/Cursor

**tests/gates/stage-5a-not-runnable-regression.test.ts** (D-43 CI guard):
5 tests asserting gate-stage-5a.mjs behavior:
1. No interactions/ → not_runnable (baseline)
2. Empty interactions/ → not_runnable
3. Empty interactions/ with mkdir → not_runnable (D-43 primary contract)
4. Regression: stage-5a.mjs contains GATE-07/GATE-08 comments (identity marker)
5. GateResult shape valid: `kind:not_runnable`, `reason:string`, no `evidence` field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict-mode `Array#[index]` possibly undefined**
- **Found during:** T-02-03-A (tsc --noEmit after GREEN phase)
- **Issue:** Three instances of `bodyMatch[1]` where TypeScript strict mode flags the tuple index as possibly undefined, even after null checks.
- **Fix:** Changed to optional chaining + nullish coalescing: `bodyMatch?.[1] ?? content`
- **Files modified:** `tests/tokens/tokens-project.test.ts`
- **Commit:** `44d653e`

**2. [Rule 2 - Missing] Semantic tier used DTCG alias syntax — could cause consumer resolution issues**
- **Found during:** T-02-03-A design review during implementation
- **Issue:** Initial design used DTCG alias syntax `{primitive.color.background.$value}` in semantic tier. DTCG alias resolution is optional in consumers; emitting resolved values is simpler and avoids runtime errors.
- **Fix:** Semantic tier emits resolved OKLCH values (same as computed from primitive), not alias strings. Documented rationale in decisions.
- **Files modified:** `assets/scripts/tokens-project.mjs`
- **Commit:** `44d653e`

## Known Stubs

None — all tokens are emitted with real OKLCH values. The `evidence:INFERRED` label is intentional (D-42 contract), not a stub. The `hifi/variants-preview.md` atom procedure references `node bin/design-os.mjs preview --variant` which is a Phase 1 preview harness CLI path — that CLI command exists (`assets/scripts/cli/preview.mjs`).

## Threat Flags

None new. All mitigations from the plan's STRIDE register applied:
- T-02-03-01 (OKLCH input tampering): mitigated by OKLCH format guard in emitTokens()
- T-02-03-02 (globals.css tampering): mitigated by additive-only @theme merge (never removes tokens)
- T-02-03-03 (preview env disclosure): documented in hifi/variants-preview.md (scrubEnvForPreview)
- T-02-03-04 (WCAG conformance claim): style.md procedure explicitly says "report, never claim"
- T-02-03-05 (Playwright timeout): accepted — hifi/variants-preview.md logs warning and continues

## TDD Gate Compliance

- RED gate commit: `c0e39ec` (test(02-03): add RED phase)
- GREEN gate commit: `44d653e` (feat(02-03): implement tokens-project.mjs)
- REFACTOR: not needed — code was clean from GREEN phase

Both required TDD gate commits are present in chronological order.

## Self-Check: PASSED

Key files exist:
- FOUND: assets/scripts/tokens-project.mjs
- FOUND: assets/scripts/cli/budget-check.mjs
- FOUND: skills/workflows/style.md
- FOUND: skills/atoms/tokens/emit.md
- FOUND: skills/atoms/hifi/variants-preview.md
- FOUND: evals/fixtures/golden/tokens-project/input.json
- FOUND: evals/fixtures/golden/tokens-project/expected-shadcn.json
- FOUND: evals/fixtures/golden/tokens-project/expected-tailwind-v4.json
- FOUND: evals/fixtures/golden/tokens-project/expected-plain-css.json
- FOUND: tests/tokens/tokens-project.test.ts
- FOUND: tests/gates/stage-5a-not-runnable-regression.test.ts

Commits exist:
- FOUND: c0e39ec (test: RED phase)
- FOUND: 44d653e (feat: GREEN phase)
- FOUND: 49e9227 (feat: SKILL.md files)

Test count: 676 passing (639 baseline + 37 new)
lint-determinism: CLEAN
tsc --noEmit: clean
SKILL.md descriptions: style.md 144 chars, tokens/emit.md 134 chars, hifi/variants-preview.md 119 chars (all ≤200)
