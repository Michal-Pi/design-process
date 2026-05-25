---
phase: 01-v1-5-infrastructure-determinism-foundation
plan: "02"
subsystem: gate-runner + handoff-bundle + manifest.lock + eval-harness
tags:
  - gates
  - handoff-bundle
  - manifest-lock
  - tiktoken
  - structural-eval
  - tdd
dependency_graph:
  requires:
    - "01-01"  # Schemas Foundation — GateResult, HandoffBundleV1, validate() helper
  provides:
    - gate-runner base with 5-kind GateResult discriminated union
    - 6 per-stage gate skeletons (stage-1 through stage-5b)
    - stage-5a hardcoded not_runnable for empty interactions/ (GATE-07 + GATE-08)
    - manifest.lock SHA-256 hash chain (appendManifestLockEntry + verifyManifestLockChain)
    - 4 stage-gate checklists (stage-1, 2, 5a, 5b) in references/gates/
    - handoff-bundle pipeline (buildHandoffBundle, tiktoken budget, section-aware truncation)
    - bundle-sufficiency eval harness (structural-equivalence, 5 fixtures)
    - 3 auto-discovered CLI subcommands: gate, handoff-bundle, eval bundle-sufficiency
  affects:
    - "01-03"  # Plan 03 will add CI schema-migration-guard and ESLint exhaustiveness rule
    - "01-04"  # Plan 04 propagates overrideBanner into downstream artifact frontmatter
tech_stack:
  added:
    - tiktoken (cl100k_base encoder for token counting)
    - gray-matter (YAML frontmatter parsing in gates and eval harness)
    - yaml (eemeli/yaml, round-trip YAML writes in handoff-bundle-build.mjs)
  patterns:
    - TDD (RED commit then GREEN commit per task)
    - Discriminated union GateResult with 5 kinds — TS exhaustiveness enforced by Plan 03
    - SHA-256 append-only hash chain (JSONL, canonical key-sorted JSON)
    - Section-aware truncation with priority ordering (optional sections dropped first)
    - Auto-discovery CLI dispatcher (Plan 01 contract, no bin/design-os.mjs modification)
key_files:
  created:
    - assets/scripts/gates/base.mjs
    - assets/scripts/gates/_parse-checklist.mjs
    - assets/scripts/gates/stage-1.mjs
    - assets/scripts/gates/stage-2.mjs
    - assets/scripts/gates/stage-3.mjs
    - assets/scripts/gates/stage-4.mjs
    - assets/scripts/gates/stage-5a.mjs
    - assets/scripts/gates/stage-5b.mjs
    - assets/scripts/manifest-lock-append.mjs
    - assets/scripts/handoff-bundle-build.mjs
    - assets/scripts/cli/gate.mjs
    - assets/scripts/cli/handoff-bundle.mjs
    - assets/scripts/cli/eval-bundle-sufficiency.mjs
    - evals/bundles/sufficiency-structural.mjs
    - evals/bundles/fixtures/stage-0-to-1/upstream/PRD.md
    - evals/bundles/fixtures/stage-0-to-1/bundle.md
    - evals/bundles/fixtures/stage-1-to-2/upstream/personas.json
    - evals/bundles/fixtures/stage-1-to-2/bundle.md
    - evals/bundles/fixtures/stage-2-to-3/upstream/sitemap.json
    - evals/bundles/fixtures/stage-2-to-3/bundle.md
    - evals/bundles/fixtures/stage-3-to-4/upstream/wireframes.placeholder
    - evals/bundles/fixtures/stage-3-to-4/bundle.md
    - evals/bundles/fixtures/stage-4-to-5/upstream/interactions.placeholder
    - evals/bundles/fixtures/stage-4-to-5/bundle.md
    - references/gates/stage-1.md
    - references/gates/stage-2.md
    - references/gates/stage-5a.md
    - references/gates/stage-5b.md
    - schemas/src/finding.ts
    - schemas/src/manifest-lock-entry.ts
    - tests/gates/base.test.ts
    - tests/gates/stage-5a-not-runnable.test.ts
    - tests/gates/per-stage-skeletons.test.ts
    - tests/gates/override-banner.test.ts
    - tests/gates/manifest-lock-chain.test.ts
    - tests/handoff/bundle-frame.test.ts
    - tests/handoff/bundle-truncation.test.ts
    - tests/handoff/bundle-floor.test.ts
    - tests/handoff/sufficiency-structural.test.ts
    - tests/fixtures/bundles/llm-body-small.md
    - tests/fixtures/bundles/llm-body-oversized.md
    - tests/fixtures/bundles/llm-body-too-small.md
    - tests/fixtures/design-dirs/stage-1-complete/personas/p1.json
    - tests/fixtures/design-dirs/stage-1-complete/ASSUMPTIONS.md
    - tests/fixtures/design-dirs/stage-1-truncation-test/personas/p1.json
    - tests/fixtures/design-dirs/stage-1-truncation-test/ASSUMPTIONS.md
    - tests/fixtures/design-dirs/empty-interactions/interactions/.gitkeep
    - tests/fixtures/design-dirs/with-interactions/interactions/foo.md
    - tests/fixtures/design-dirs/no-interactions-dir/PRD.md
  modified:
    - assets/scripts/schemas/emit.mjs  # added finding + manifest-lock-entry to SCHEMAS map
    - schemas/dist/index.json           # added finding + manifest-lock-entry entries
    - schemas/dist/finding.v1.json      # new dist schema (emitted)
    - schemas/dist/manifest-lock-entry.v1.json  # new dist schema (emitted)
    - .gitignore                        # added test fixture .design-os/ and eval last-run.json
decisions:
  - "GATE-07+08: stage-5a hardcoded not_runnable from day one (codex §16 BLOCKER; never returns pass/fail for empty interactions/)"
  - "Open Q2 closed for Phase 1: structural-equivalence is the baseline; semantic similarity deferred to Phase 4 calibration"
  - "Parallel test interference: bundle-truncation.test.ts uses separate stage-1-truncation-test/ fixture dir to avoid .handoff/ cleanup collision with bundle-frame.test.ts"
  - "Pitfall F mitigation: TS discriminated union enforces exhaustiveness at compile time; Plan 03 must add ESLint @typescript-eslint/switch-exhaustiveness-check rule"
  - "Plan 03 CI rule for schema migration guard: carve-out for brand-new v1 schemas (finding, manifest-lock-entry) — no migration needed for net-new schemas"
  - "tiktoken cl100k_base for token counting; provenance scanner reads YAML frontmatter only (not JSON body fields) — JSON artifacts fall back to 'validated' worst-case"
metrics:
  duration_minutes: 180
  completed_date: "2026-05-25"
  tasks_completed: 3
  files_created: 47
  tests_added: 82
---

# Phase 01 Plan 02: Gate Runner + Handoff Bundle Summary

Built the gate-runner machinery (6 per-stage skeletons + manifest.lock SHA-256 hash chain), handoff-bundle pipeline (tiktoken cl100k_base, 3k floor, 15k ceiling, section-aware truncation), and bundle-sufficiency eval harness (structural-equivalence baseline for 5 stage-transition fixtures).

## What Was Built

### Task 1: Gate-runner base + 6 per-stage skeletons + manifest.lock hash chain

`runGate(stage, designDir, config)` is an async function returning a `GateResult` discriminated union with 5 kinds. The gate runner dispatches to per-stage functions via a string-keyed map.

Stage-5a is the most important: it hardcodes `not_runnable` when `design/interactions/` is empty or missing — the codex §16 BLOCKER fix from day one. This prevents Phase 2's lite mode from silently claiming a pass when no IxD artifacts exist.

The manifest.lock hash chain appends a JSONL entry per gate run. Each entry contains `seq`, `timestamp`, `stage`, `gate`, `result`, `sourceHash`, `prevHash`, and `entryHash` (all computed via canonical key-sorted SHA-256). Chain integrity is verifiable via `verifyManifestLockChain`. Tampering with any entry breaks all subsequent entries' `prevHash` continuity.

Four stage-gate checklists created in `references/gates/` (stages 1, 2, 5a, 5b) with the canonical 4-column GFM table format (`Check | Required for PASS | Required for VALIDATED grade | Citation`). Stages 3/4 ship in Phase 3 per D-25.

**Tests:** 47 assertions across 5 files (base, stage-5a-not-runnable, per-stage-skeletons, override-banner, manifest-lock-chain).

### Task 2: Handoff-bundle pipeline

`buildHandoffBundle({ stageFrom, stageTo, designDir, llmSummaryBody })` produces a Markdown file with deterministic YAML frontmatter (validated against `handoff-bundle.v1.json` via ajv) and the LLM body inlined.

Token budget enforced via tiktoken cl100k_base:
- Under 3k tokens → returns `{ error: 'insufficient-content', tokens, floor: 3000 }`, writes nothing
- Over 15k tokens → drops optional `Risks surfaced` first, then truncates tail of `Pointers to verify` repeatedly until within budget; records `truncationWarning`
- 3k–15k → writes bundle with `truncationWarning: null`

Parallel test interference between `bundle-frame.test.ts` and `bundle-truncation.test.ts` was solved by giving the truncation test its own isolated fixture directory (`stage-1-truncation-test/`).

**Tests:** 25 assertions across 3 files (bundle-frame, bundle-truncation, bundle-floor).

### Task 3: Bundle-sufficiency eval + 5 stage-transition fixtures

`runStructuralSufficiencyEval()` walks 5 fixture pairs and checks structural equivalence per fixture:
1. Every upstream file path appears in `bundle.artifactsInventory`
2. `bundle.provenanceWorstCase` matches the actual worst provenance in upstream YAML frontmatter
3. `bundle.sourceHash` matches a recomputed hash of `upstream/`

The 5 fixtures span all stage transitions with realistic-but-minimal upstream artifacts:
- `stage-0-to-1`: PRD.md (validated provenance)
- `stage-1-to-2`: personas.json (persona schema compliant)
- `stage-2-to-3`: sitemap.json (LATCH-diverse, 2 variants)
- `stage-3-to-4`: wireframes.placeholder (Phase 3 will replace with Excalidraw JSON)
- `stage-4-to-5`: interactions.placeholder (Phase 3 will replace with XState/Mermaid)

sourceHash values in all bundle.md files are exact matches (computed from the upstream/ directories at fixture creation time). All 5 fixtures pass structural equivalence.

**Tests:** 10 assertions (sufficiency-structural.test.ts).

## Open Q2 Disposition

**Closed for Phase 1.** Structural-equivalence is the deterministic baseline for bundle sufficiency. Semantic similarity (BLEU-like scoring, LLM-as-judge) is deferred to Phase 4 calibration per the locked acceptance criterion in D-08. The Phase 1 eval harness establishes the measurement scaffold that Phase 4 will upgrade.

## Pitfall F Mitigation Note

The 5-kind GateResult discriminated union (`pass | pass_with_warnings | failed_after_repair | user_overridden | not_runnable`) is enforced at compile time by TypeScript's discriminated union narrowing. However, switch-exhaustiveness checking (catching missing cases at build time) requires the ESLint rule `@typescript-eslint/switch-exhaustiveness-check`. **Plan 03 must add this rule** to the ESLint config before per-stage gates receive real business logic in Phase 2.

## New Shared Types for Downstream Plans

| Type | Schema | Consumers |
|------|--------|-----------|
| `Finding` | `schemas/dist/finding.v1.json` | Plans 03, 04 — CI gate reports, audit artifacts |
| `ManifestLockEntry` | `schemas/dist/manifest-lock-entry.v1.json` | Plans 03, 04 — manifest.lock verification, audit trail |

## Outstanding Items for Plan 03

1. **ESLint `@typescript-eslint/switch-exhaustiveness-check`** — required before real gate business logic in Phase 2 (Pitfall F mitigation)
2. **CI schema-migration-guard rule** — PRs touching `schemas/src/` must touch `schemas/migrations/`, with a carve-out for net-new schemas (no v0 predecessor; `finding` and `manifest-lock-entry` are net-new v1 schemas and require no migration)
3. **`design-os verify --golden` CI gate** — Plan 03 runs this against gate + handoff-bundle scripts to enforce determinism

## Outstanding Items for Plan 04

- **`overrideBanner` propagation** — Plan 04 propagates the `overrideBanner` string from `GateResult.user_overridden` into downstream artifact frontmatter so auditors can see the override trail in every artifact produced after an override

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Parallel test interference between bundle-frame and bundle-truncation tests**
- **Found during:** Task 2 testing
- **Issue:** Both test files used `STAGE1_COMPLETE_DIR` as designDir and both had `afterAll` cleanup that deleted `.handoff/`. When running in parallel, one test's cleanup deleted the directory the other was reading.
- **Fix:** Created a separate `stage-1-truncation-test/` fixture directory and renamed the constant in `bundle-truncation.test.ts` to `TRUNCATION_TEST_DIR`. Each test now has isolated fixture dirs.
- **Files modified:** `tests/handoff/bundle-truncation.test.ts`, added `tests/fixtures/design-dirs/stage-1-truncation-test/`
- **Commit:** 472e236

**2. [Rule 1 - Bug] CLI import path wrong in eval-bundle-sufficiency.mjs**
- **Found during:** Task 3 CLI verification
- **Issue:** Import path `../../evals/bundles/sufficiency-structural.mjs` resolved relative to `assets/scripts/cli/` as `assets/evals/...` — module not found.
- **Fix:** Changed to `../../../evals/bundles/sufficiency-structural.mjs` (correct: 3 levels up).
- **Files modified:** `assets/scripts/cli/eval-bundle-sufficiency.mjs`
- **Commit:** 1b0f81f

**3. [Rule 1 - Bug] Pass logic in sufficiency-structural.mjs: tagged-divergence path returned pass=true for intentionally broken fixture**
- **Found during:** Task 3 testing (divergence detection test failed)
- **Issue:** Original logic `pass = allEquivalent || allDivergencesTagged` — since all divergences had `tagged: true` always, a broken bundle still returned pass=true.
- **Fix:** Simplified to `pass = allEquivalent`. Divergences are still recorded in the report (the "explicitly tagged" requirement) but pass reflects actual structural correctness.
- **Files modified:** `evals/bundles/sufficiency-structural.mjs`
- **Commit:** 1b0f81f

**4. [Rule 2 - Missing functionality] llm-body fixtures had insufficient token counts**
- **Found during:** Task 2 fixture creation
- **Issue:** Initial llm-body-small.md had only 646 tokens; oversized had only 3077 despite 19k characters (tiktoken compresses repetitive text aggressively).
- **Fix:** Regenerated fixtures with diverse vocabulary (phonetic alphabet, animal names, design system terms) to reach 4545 tokens (small) and 17641 tokens (oversized).
- **Files modified:** `tests/fixtures/bundles/llm-body-small.md`, `tests/fixtures/bundles/llm-body-oversized.md`
- **Commit:** 472e236

## Known Stubs

None. All 5 stage-transition fixtures are intentionally minimal but complete; placeholders for wireframes and interactions are documented as Phase 3 targets with explicit notes in both the placeholder files and bundle.md artifacts.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes at trust boundaries beyond what is documented in the plan's threat model.

## Self-Check: PASSED

- Task 1 commit 3b595b9: exists in git log
- Task 2 commit 472e236: exists in git log
- Task 3 commit 1b0f81f: exists in git log
- All 9 test files exist and pass (82 assertions)
- tsc --noEmit: clean
- CLI `eval bundle-sufficiency`: pass=true
- CLI `gate --stage 5a --design-dir empty-interactions`: kind=not_runnable
- CLI `gate --stage 1 --override-reason "shipping anyway"`: kind=user_overridden
