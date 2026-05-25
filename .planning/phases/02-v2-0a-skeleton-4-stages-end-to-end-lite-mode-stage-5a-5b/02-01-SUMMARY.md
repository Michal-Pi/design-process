---
phase: "02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b"
plan: "01"
subsystem: "stage-1-gate + discover-workflow + adversarial-ci"
tags:
  - stage-1-gate
  - provenance
  - synthetic-persona-red-line
  - adversarial-ci
  - skill-md
  - worst-provenance
dependency_graph:
  requires:
    - "01-02-SUMMARY.md (gate runner base.mjs + stage-1.mjs skeleton)"
    - "01-04-SUMMARY.md (frontmatter-validate.mjs + persona.v1.json schema)"
    - "01-03-SUMMARY.md (lint-determinism.mjs + vitest eval harness)"
  provides:
    - "assets/scripts/gates/stage-1.mjs (real provenance logic, D-37)"
    - "assets/scripts/frontmatter-validate.mjs (checkWorstProvenance export, D-38)"
    - "evals/adversarial/ (RED-05, RED-06, worstProvenance suites)"
    - "skills/workflows/discover.md (W1 discover workflow)"
    - "skills/atoms/research/{personas-proto,build-ost,synthesize}.md"
  affects:
    - "02-02 through 02-05 (all Phase 2 plans depend on Stage 1 gate)"
    - "evals/bundles/fixtures/stage-1-to-2/ (upstream bundle now representative)"
tech_stack:
  added:
    - "YAML frontmatter in .persona.json fixture files (gray-matter hybrid format)"
  patterns:
    - "TDD RED/GREEN cycle for gate business logic"
    - "Seed-based deterministic fixture builder (RED-05)"
    - "Documented attack-vector canary prompts (RED-06)"
    - "worstProvenance propagation via checkWorstProvenance export"
key_files:
  created:
    - "assets/scripts/gates/stage-1.mjs (real implementation)"
    - "assets/scripts/frontmatter-validate.mjs (extended with checkWorstProvenance)"
    - "tests/gates/stage-1-provenance.test.ts"
    - "tests/adversarial/frontmatter-worst-provenance.test.ts"
    - "evals/adversarial/red-05-synthetic-block/fixture-builder.mjs"
    - "evals/adversarial/red-05-synthetic-block/run.test.ts"
    - "evals/adversarial/red-06-injection-canary/prompts/001.txt through 010.txt"
    - "evals/adversarial/red-06-injection-canary/run.test.ts"
    - "evals/adversarial/worst-provenance/fixture/design/research/personas/*.persona.json"
    - "evals/adversarial/worst-provenance/fixture/design/research/synthesis.md"
    - "evals/adversarial/worst-provenance/run.test.ts"
    - "skills/workflows/discover.md"
    - "skills/atoms/research/personas-proto.md"
    - "skills/atoms/research/synthesize.md"
    - "skills/atoms/research/build-ost.md"
    - "tests/fixtures/stage1-gate/ (6 gate fixture scenarios)"
    - "tests/fixtures/worst-provenance/ (2 artifact fixtures + 2 persona fixtures)"
  modified:
    - "tests/gates/per-stage-skeletons.test.ts (updated for Phase 2 stage-1 behavior)"
    - "evals/bundles/fixtures/stage-1-to-2/upstream/personas.json (representative 3-persona bundle)"
    - "evals/bundles/fixtures/stage-1-to-2/bundle.md (correct provenanceWorstCase + sourceHash)"
    - "vitest.config.ts (added evals/adversarial/**/*.test.ts to include)"
    - ".github/workflows/host-matrix.yml (added adversarial CI job)"
decisions:
  - "D-37: synthetic-persona hard-block implemented as pure script (no LLM calls)"
  - "D-38: worstProvenance propagation enforced via checkWorstProvenance export"
  - "D-50: three adversarial CI suites (RED-05, RED-06, worstProvenance)"
  - "D-32: discover workflow SKILL.md uses agentskills.io v1 frontmatter + numbered procedure"
  - "D-33: atom SKILL.md files have standalone bootstrap + workflow procedure sections"
  - "D-53: host fallback section included in discover.md"
  - "TDD: per-stage-skeletons.test.ts split to preserve Phase 1 tests while documenting Phase 2 behavioral change"
metrics:
  duration: "~60 minutes"
  completed_date: "2026-05-25"
  tasks: 3
  files_created: 38
  files_modified: 6
  tests_added: 139
  tests_total: 605
---

# Phase 02 Plan 01: Stage 1 Gate Business Logic + Discover Workflow + Adversarial CI Summary

**One-liner:** Stage 1 synthetic-persona red line enforced deterministically — gate-stage-1.mjs returns pass_with_warnings/proto on 100 synthetic-only fixtures and pass/validated only with real interview files, with computeWorstProvenance propagation and 10 documented injection-canary attack vectors that cannot bypass the filesystem-based check.

## What Was Built

### T-02-01-A: Stage 1 Gate Business Logic

Replaced the Phase 1 skeleton in `assets/scripts/gates/stage-1.mjs` with real provenance-checking business logic:

- `runStage1Gate(designDir, config)`: globs `research/personas/*.persona.json`, reads provenance from YAML frontmatter via gray-matter (missing frontmatter → 'missing'), returns:
  - `{kind:'not_runnable', reason:'no-personas-found'}` when no persona files exist
  - `{kind:'pass_with_warnings', evidence:'proto'}` + finding `1-provenance-001` (WARNING) when all personas are synthetic; adds finding `1-provenance-002` (ERROR) if ASSUMPTIONS.md is absent
  - `{kind:'pass', evidence:'validated'}` when ≥1 validated persona AND non-empty interviews/
  - `{kind:'pass_with_warnings', evidence:'proto'}` otherwise (mixed provenances, no validated interviews)

- `computeWorstProvenance(provenances[])`: exported pure function computing worst-case provenance with precedence order `missing > generated > inferred > validated`

Extended `assets/scripts/frontmatter-validate.mjs` with:
- `checkWorstProvenance(artifactPath, basedir)`: validates that artifacts citing persona files declare a `worstProvenance:` field no less conservative than the computed worst across cited personas (D-38, OF-02)

**Tests:** 24 unit tests in `tests/gates/stage-1-provenance.test.ts` and `tests/adversarial/frontmatter-worst-provenance.test.ts`. All passing. lint-determinism CLEAN on gates/. tsc --noEmit clean.

### T-02-01-B: Three Adversarial CI Suites + Bundle Fixture

**RED-05 (100 seeds):** `evals/adversarial/red-05-synthetic-block/`
- `fixture-builder.mjs`: exports `buildSyntheticOnlyFixture(tmpDir, seed)` — creates 2 synthetic personas (no interviews, no ASSUMPTIONS.md)
- `run.test.ts`: 100 test cases (seeds 0..99), all assert `pass_with_warnings` + `evidence:'proto'`
- Zero LLM calls; pure script tests

**RED-06 (10 canary prompts):** `evals/adversarial/red-06-injection-canary/`
- 10 attack-vector prompts (001.txt..010.txt) documenting injection attempts (domain-expert claims, definition redefinition, YAML injection, config abuse, emergent-behavior appeals, etc.)
- `run.test.ts`: 10 tests asserting gate returns `pass_with_warnings` regardless of prompt content because the check reads filesystem state, not prompt content

**worstProvenance propagation:** `evals/adversarial/worst-provenance/`
- 3-persona fixture (2 synthetic + 1 validated) + `synthesis.md` with `worstProvenance:generated`
- 5 tests asserting gate behavior and `checkWorstProvenance` validation

**Stage 1→2 bundle fixture:** Replaced placeholder `personas.json` with representative 3-persona bundle (2 generated + 1 inferred, 6 JTBDs, YAML frontmatter for gray-matter provenane detection). Fixed `bundle.md` with correct `provenanceWorstCase: generated` and recomputed `sourceHash`. Structural sufficiency eval passes all 5 fixtures.

**CI:** Extended `host-matrix.yml` with adversarial CI job running `npx vitest run evals/adversarial/` on all 3 hosts.

### T-02-01-C: Discover Workflow + Three Atom SKILL.md Files

**`skills/workflows/discover.md`** (W1): 
- agentskills.io v1 frontmatter with all required fields (name, description ≤200 chars, stage:1, gate, artifacts.reads/writes, composition.atoms, mvp:true, compatibility, allows-tools)
- TRUST-05 5-question intake (standard/full depth; skipped for lightweight)
- Depth dispatch per F-07 (lightweight/standard/full)
- Inline ATOM-03 → ATOM-04 → ATOM-02 procedure steps with explicit FID-01 enforcement
- Gate invocation step referencing `gate.mjs --stage 1`
- Handoff bundle and manifest reconciliation steps
- `## Host fallback` section for Codex CLI / Cursor sequential execution (D-53)

**`skills/atoms/research/personas-proto.md`** (ATOM-03):
- `## Standalone bootstrap` section (direct invocation without stage-0 bundle)
- `## Workflow procedure` (invoked by discover workflow)
- Explicit YAML frontmatter format for persona file emission
- FID-01 solution-language scan with remediation documentation

**`skills/atoms/research/build-ost.md`** (ATOM-04):
- Torres OST format from `references/torres-ost.md`
- Mermaid `flowchart LR` emit with node ID naming convention
- Mermaid syntax validation via `mermaid-render.mjs`

**`skills/atoms/research/synthesize.md`** (ATOM-02):
- Klement JTBD format from `references/klement-jtbd.md`
- JTBD file format with frontmatter
- `synthesis.md` emission with `worstProvenance` propagation from cited personas
- `frontmatter-validate.mjs --check-worst-provenance` integration

All 4 files: gray-matter parseable, name present, description ≤200 chars, stage:1, mvp:true.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type annotation in .mjs file**
- **Found during:** T-02-01-A GREEN phase
- **Issue:** Used `const findings: Array<{...}>` TypeScript syntax inside a `.mjs` file, causing Rollup/Vite parse error
- **Fix:** Replaced with JSDoc annotation `/** @type {Array<...>} */` followed by `([])`
- **Files modified:** `assets/scripts/gates/stage-1.mjs`
- **Commit:** 604e0d5

**2. [Rule 3 - Blocking] vitest.config.ts didn't include evals/adversarial/ in test include pattern**
- **Found during:** T-02-01-B RED phase
- **Issue:** vitest `include` only covered `tests/**/*.test.ts`, so adversarial tests in `evals/adversarial/` were not discovered
- **Fix:** Extended `include` in `vitest.config.ts` to add `evals/adversarial/**/*.test.ts`
- **Files modified:** `vitest.config.ts`
- **Commit:** 1148b01

**3. [Rule 1 - Bug] per-stage-skeletons.test.ts tested Phase 1 skeleton behavior for stage-1**
- **Found during:** T-02-01-A (anticipated during planning)
- **Issue:** Existing test asserted `{kind:'pass', evidence:'inferred'}` for stage-1, which is the Phase 1 skeleton behavior that Plan 02-01 explicitly replaces
- **Fix:** Updated test to extract stage-1-specific assertions into new describe block testing real Phase 2 behavior; kept stages 2-5b skeleton assertions intact
- **Files modified:** `tests/gates/per-stage-skeletons.test.ts`
- **Commit:** 604e0d5

**4. [Rule 1 - Bug] Stage 1→2 bundle fixture had wrong provenanceWorstCase and sourceHash**
- **Found during:** T-02-01-C (discovered via sufficiency-structural.test.ts failure)
- **Issue:** Old bundle.md declared `provenanceWorstCase: validated`; new personas.json had no YAML frontmatter, so gray-matter couldn't read provenance; sourceHash was placeholder
- **Fix:** Added YAML frontmatter to personas.json with `provenance: generated`; fixed bundle.md `provenanceWorstCase: generated` and recomputed `sourceHash`
- **Files modified:** `evals/bundles/fixtures/stage-1-to-2/upstream/personas.json`, `evals/bundles/fixtures/stage-1-to-2/bundle.md`
- **Commit:** 037b961

**5. [Rule 1 - Bug] worstProvenance adversarial test incorrectly expected 1-provenance-001 for mixed-persona fixture**
- **Found during:** T-02-01-B
- **Issue:** Test expected finding `1-provenance-001` for a fixture with 2 synthetic + 1 validated persona; but finding 001 is only emitted in the `allSynthetic` branch (every persona generated/missing)
- **Fix:** Updated adversarial test to assert the correct behavior: mixed provenances without interviews → `pass_with_warnings` but no 001 finding
- **Files modified:** `evals/adversarial/worst-provenance/run.test.ts`
- **Commit:** 1148b01

## Known Stubs

None. All plan goals are fully implemented — no placeholder content that prevents the plan's goal from being achieved.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| No new threats | — | All new code reads local filesystem; no network endpoints; no auth paths added. gate-stage-1.mjs reads only persona files in designDir. frontmatter-validate.mjs extension reads local paths only. |

The threat mitigations from the plan's threat model were all implemented:
- T-02-01 (Spoofing via provenance field): gray-matter reads frontmatter only; missing frontmatter → 'missing' (most conservative)
- T-02-02 (Tampering with persona provenance): schema validates at write time; gate treats unknown values as 'missing'  
- T-02-03 (Elevation via worstProvenance): checkWorstProvenance exit-1 on missing/under-conservative value; enforced in CI

## Test Results

| Suite | Tests | Result |
|-------|-------|--------|
| tests/gates/stage-1-provenance.test.ts | 18 | PASS |
| tests/adversarial/frontmatter-worst-provenance.test.ts | 6 | PASS |
| evals/adversarial/red-05-synthetic-block/run.test.ts | 100 | PASS |
| evals/adversarial/red-06-injection-canary/run.test.ts | 10 | PASS |
| evals/adversarial/worst-provenance/run.test.ts | 5 | PASS |
| Full suite (all files) | 605 | PASS (47 files) |

## Requirements Implemented

WF-02 (discover workflow), ATOM-02 (synthesize), ATOM-03 (personas-proto), ATOM-04 (build-ost),
RED-01..RED-06 (adversarial CI suites), FID-01 (solution-language scan in personas-proto)

## Self-Check: PASSED

All created files verified to exist:
- assets/scripts/gates/stage-1.mjs ✓
- assets/scripts/frontmatter-validate.mjs (checkWorstProvenance export) ✓
- tests/gates/stage-1-provenance.test.ts ✓
- tests/adversarial/frontmatter-worst-provenance.test.ts ✓
- evals/adversarial/red-05-synthetic-block/fixture-builder.mjs ✓
- evals/adversarial/red-05-synthetic-block/run.test.ts ✓
- evals/adversarial/red-06-injection-canary/prompts/001.txt..010.txt ✓
- evals/adversarial/red-06-injection-canary/run.test.ts ✓
- evals/adversarial/worst-provenance/run.test.ts ✓
- skills/workflows/discover.md ✓
- skills/atoms/research/personas-proto.md ✓
- skills/atoms/research/synthesize.md ✓
- skills/atoms/research/build-ost.md ✓

All commits verified:
- 93f1657: test(02-01) RED phase ✓
- 604e0d5: feat(02-01) gate + frontmatter-validate ✓
- 1148b01: feat(02-01) adversarial CI ✓
- 037b961: feat(02-01) SKILL.md files + bundle fix ✓

## Post-Review Fixes (Codex Review 02-01)

Four P2 (HIGH-severity) bugs identified by Codex review were addressed with atomic commits after plan completion.

### Finding 1: stage-1.mjs pass_with_warnings result schema violation
- **Commit:** cc8974c `fix(02-01): correct stage-1 gate pass_with_warnings result shape per GateResult schema`
- **Root cause:** `pass_with_warnings` findings used `{id, severity, message}` — old shape not matching `GateResult` schema which requires `{checkId, status, evidence?, citation?}`. Also missing required `warnings: string[]` array.
- **Fix:** Rewrote all finding objects to use `checkId`/`status`; added `warnings` array to all `pass_with_warnings` return paths. Updated existing tests to use `f.checkId`/`f.status`. Added schema compliance tests validating `GateResult.parse()` round-trip.
- **Tests affected:** stage-1-provenance.test.ts (updated 2 tests, added 2 schema compliance tests)

### Finding 2: ASSUMPTIONS.md check misses mixed-provenance case (RED-03 bypass)
- **Commit:** 8a7d4aa `fix(02-01): enforce ASSUMPTIONS.md for any generated persona (RED-03)`
- **Root cause:** RED-03 check was inside the `allSynthetic` branch only. A dir with 1 generated + 1 validated persona + populated `interviews/` + no `ASSUMPTIONS.md` returned `pass/validated`, bypassing the synthetic-claim disclosure requirement.
- **Fix:** Hoisted `assumptionsMissing` check before any branch — fires whenever `hasGenerated === true`. Mixed dirs without ASSUMPTIONS.md now return `pass_with_warnings/proto` with RED-03 finding.
- **Fixture added:** `tests/fixtures/stage1-gate/mixed-provenance-no-assumptions/` (1 generated + 1 validated + interview)
- **Tests added:** `tests/gates/stage-1-mixed-provenance.test.ts` (4 tests)

### Finding 3: synthesize.md atom uses wrong base path for checkWorstProvenance
- **Commit:** 62eb30a `fix(02-01): resolve cited personas from design root in synthesize atom`
- **Root cause:** `synthesize.md` invoked `--check-worst-provenance design/research/synthesis.md design/research/`. The `cites:` paths in synthesis.md frontmatter are relative to `design/` (e.g., `research/personas/slug.persona.json`). Passing `design/research/` as base resolves to `design/research/research/personas/...` — file not found, provenance defaults to `missing`, gate rejects valid syntheses.
- **Fix:** Changed invocation to pass `design/` as base dir. Added explanatory note in synthesize.md.
- **Tests added:** 2 adversarial tests in `frontmatter-worst-provenance.test.ts` (correct base dir validates, wrong base dir fails — regression guard)

### Finding 4: discover.md invokes cli modules directly instead of via dispatcher
- **Commit:** 08a9e50 `fix(02-01): invoke design-os CLI dispatcher instead of cli/*.mjs directly in discover workflow`
- **Root cause:** `gate.mjs` exports a `command` object for Commander registration — running `node assets/scripts/cli/gate.mjs` directly exits without invoking the handler. The workflow step 8 and host-fallback section both used the direct invocation, silently skipping the gate.
- **Fix:** Replaced both occurrences with `node bin/design-os.mjs gate --stage 1 --design-dir design/`. Verified `node bin/design-os.mjs gate --stage 1 --design-dir <path>` returns a real `GateResult` JSON object.
- **Retained:** `budget-check.mjs` and `apply.mjs` direct references — these scripts don't exist yet (ship in future plans) and have no dispatcher registration to replace.

## Cross-cutting follow-up

No other Phase 2 workflow files had the same direct `cli/*.mjs` invocation pattern — `discover.md` is the only workflow file in Phase 2. The `budget-check.mjs` and `apply.mjs` patterns in `discover.md` steps 7 and 11 reference scripts that will be registered as dispatcher commands when they ship (future plans). Those lines were not changed.

## Post-Review Test Results

| Suite | Tests | Result |
|-------|-------|--------|
| tests/gates/stage-1-provenance.test.ts | 20 (+2 from schema compliance) | PASS |
| tests/gates/stage-1-mixed-provenance.test.ts | 4 (new) | PASS |
| tests/adversarial/frontmatter-worst-provenance.test.ts | 8 (+2 base-dir regression) | PASS |
| Full suite (all files) | 613 (+8) | PASS (48 files) |
| tsc --noEmit | — | PASS (exit 0) |
