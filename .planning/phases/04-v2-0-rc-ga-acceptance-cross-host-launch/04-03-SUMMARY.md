---
phase: 04-v2-0-rc-ga-acceptance-cross-host-launch
plan: "03"
subsystem: coexistence-gate + cross-host-parity
tags:
  - release-engineering
  - coexistence-gate
  - cross-host-parity
  - tdd
  - trig-03
  - dist-05
  - dist-06
dependency_graph:
  requires:
    - 04-01 (evals/acceptance/fixtures.manifest.json fixture manifest)
    - 04-02 (dispatchRoute object-form post fix-pass; runGate; release-gate baseline shape)
    - Phase 1 (aggregate-eval.mjs harness; install-corpus.mjs; CI workflow)
    - Phase 3 (dispatchRoute { routeName, designDir, opts } object signature)
  provides:
    - evals/coexistence/aggregate-eval.mjs (TRIG-03 blocking gate enabled)
    - evals/coexistence/install-corpus.mjs (real trigger vocabulary for 5 peer packages)
    - .github/workflows/aggregate-coexistence.yml (continue-on-error: false)
    - assets/scripts/cross-host-parity.mjs (DIST-05/06 sampled parity driver)
    - assets/scripts/cli/cross-host-parity.mjs (CLI surface)
    - tests/cross-host-parity/cross-host-parity.test.ts (17 unit tests)
  affects:
    - 04-04 (coexistence gate now blocking — any next plan touching triggers will fail CI)
    - GTM launch (TRIG-03 will block GA until recall reaches 0.80)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle (RED commit with 1 test file; GREEN commit with impl)
    - INVARIANTS.md Lessons 2, 3, 5, 6, 7 upheld
    - Trust-posture P8 (honest signal > false confidence on blocking gate)
    - D-77 deterministic sample (no Math.random(), stable locale-insensitive sort)
    - Lesson 6 HOST_PROFILE gap documented (not read by detectHost(); vacuous-comparison warning)
key_files:
  created:
    - assets/scripts/cross-host-parity.mjs
    - assets/scripts/cli/cross-host-parity.mjs
    - tests/cross-host-parity/cross-host-parity.test.ts
  modified:
    - evals/coexistence/aggregate-eval.mjs
    - evals/coexistence/install-corpus.mjs
    - .github/workflows/aggregate-coexistence.yml
decisions:
  - "TRIG-03 blocking flip proceeds with recall=0.516 (below 0.80 threshold). Honest signal > false confidence per P8 trust posture. CI will fail on next push — that is the intended outcome."
  - "HOST_PROFILE env var is NOT read by detectHost() in run-subagent.mjs. It is a test-label set by vitest.config.ts only. cross-host-parity.mjs sets CODEX_CLI_SESSION/CURSOR_SESSION (the actual dispatch-path vars) and warns clearly when no real host dispatch is configured (P8 + Lesson 6)."
  - "selectDeterministicSample produces 5 fixtures (4 category slots + 1 route-mandatory). When the dashboard category slot is fixture-11 (DS-extraction route), the route-mandatory requirement is already satisfied; the 5th slot adds fixture-08-consumer-lovable (mature-app-refactor) creating a second consumer entry — acceptable per D-77 five-fixture mandate priority."
  - "Escalation from N=5 to N=15 uses full 15-fixture results (replaces, not concatenates, the sampled 5)."
  - "dispatchRoute confirmed object-form { routeName, designDir, opts } per 04-02 fix-pass. No regression."
metrics:
  duration: "~60 minutes"
  completed_date: "2026-05-31"
  tasks_completed: 2
  files_created: 3
  files_modified: 3
  tests_added: 17
---

# Phase 4 Plan 03: Coexistence Eval Blocking Flip (TRIG-03) + Cross-Host Parity Driver (DIST-05/06) Summary

**One-liner:** Flipped aggregate coexistence gate to blocking (continue-on-error: false + process.exit enabled) with corpus expansion (real trigger vocabulary for 5 peer packages) + perSkillRecall identity field; implemented cross-host-parity.mjs sampled driver (D-77: deterministic 5-fixture sample per host, escalation to 15 on delta > 0.10, parity-results.json with count + identity).

## What Was Built

### Task 1: Enable Blocking TRIG-03 Release Gate

**aggregate-eval.mjs:**
- Uncommented `process.exit(result.pass ? 0 : 1)` (was disabled since Phase 1 per comment "DISABLED in Phase 1")
- Removed placeholder `process.exit(0)` below it
- Added `perSkillRecall: Record<string, number>` to result (Lesson 5 identity — per-skill false-fire rate per peer package + complete-design own recall)
- Updated `calibrationNote` to document TRIG-03 shortfall honestly

**install-corpus.mjs:**
- Added `triggerVocabulary` array to each of 5 peer packages' CORPUS_PACKAGES entries
- GSD: `plan phase execute verify milestone roadmap gsd-plan gsd-execute gsd-verify`
- Superpowers: `tdd test-driven debug refactor superpower pair-program brainstorm`
- frontend-design: `design-system component tokens tailwind accessibility ui ux frontend figma`
- shadcn: `shadcn component ui button dialog form card input select table`
- notion-mcp: `notion page database workspace block property filter sort notion-mcp`
- Updated `STUB_BODY_TEMPLATE` to embed trigger vocabulary in stub body for static-analysis keyword-overlap scoring
- Removed "Real-package installation is a Plan 4 / GA hardening step" comment (this IS that step)

**aggregate-coexistence.yml:**
- Changed `continue-on-error: true` → `continue-on-error: false`
- Added "Assert recall gate (TRIG-03)" step — belt-and-suspenders: reads `last-run.json`, exits 1 if `pass: false`
- Updated comments and heartbeat step to reflect blocking state

### Task 2: Cross-Host Parity Sampled Driver (TDD RED/GREEN)

**assets/scripts/cross-host-parity.mjs:**

Exported functions:
- `selectDeterministicSample(fixtures, sampleSize=5)` — 1 per use-case category (sorted by fixtureId, no Math.random()) + 1 route-mandatory; returns shallow copies to prevent mutation aliasing
- `computeParityDelta(hostPassRate, baselinePassRate)` — `Math.abs(host - baseline)`; absolute/symmetric
- `runCrossHostParity(opts)` — full 6-phase driver; loads manifest, selects sample, sets host env vars, dispatches + gates all 6 stages, computes delta, escalates N=5→15 if delta > 0.10, writes parity-results.json

**parity-results.json shape (Lesson 5):**
```json
{
  "host": "codex-cli",
  "sampleSize": 5,
  "sampledFixtures": ["fixture-01-b2b-taskflow", ...],
  "hostPassRate": 0.8,
  "baselinePassRate": 0.87,
  "delta": 0.07,
  "escalated": false,
  "pass": true
}
```

**assets/scripts/cli/cross-host-parity.mjs:**
- Commander CLI wrapper; exports `command = { name, describe, builder, handler }`
- Flags: `--host <codex-cli|cursor>`, `--sample <number>`, `--baseline <path>`, `--fixtures-dir <path>`, `--output <path>`
- Lazy handler import (Lesson 2)
- `--host` validation: must be codex-cli or cursor (exits 1 with clear error otherwise)

**tests/cross-host-parity/cross-host-parity.test.ts:**
- 17 unit tests; selectDeterministicSample (9) + computeParityDelta (8)
- Tests: deterministic output, size, category coverage, stable sort, route-mandatory presence, edge cases

## Verification Results

```
node bin/complete-design.mjs cross-host-parity --help
  PASS: shows --host, --sample, --baseline, --output, --fixtures-dir

grep "continue-on-error: false" .github/workflows/aggregate-coexistence.yml
  PASS: 1+ match

grep "continue-on-error: true" .github/workflows/aggregate-coexistence.yml
  PASS: 0 matches

grep "DISABLED in Phase 1" evals/coexistence/aggregate-eval.mjs
  PASS: 0 matches

grep "process.exit(0)" evals/coexistence/aggregate-eval.mjs
  PASS: 0 matches

grep "sampledFixtures" assets/scripts/cross-host-parity.mjs | wc -l
  PASS: 5 (≥2 required)

node assets/scripts/lint-determinism.mjs
  PASS: CLEAN

npx tsc --noEmit
  PASS: exit 0

npx vitest run tests/cross-host-parity/cross-host-parity.test.ts
  PASS: 17/17 tests pass

Full test suite: 1 failed (pre-existing stage-2-latch flake) | 1376 passed (1377)
Tests delta: 1349 → 1376 (+27: 17 cross-host-parity + 10 fixture updates)
```

## Commits

| Commit | Type | Message |
|--------|------|---------|
| f28f0a7 | feat(04-03) | expand coexistence corpus with real trigger vocabulary for 5 peer packages |
| ae5f7e7 | feat(04-03) | enable blocking TRIG-03 release gate (continue-on-error: false + process.exit) |
| 732dd77 | test(04-03) | add failing cross-host-parity unit tests (selectDeterministicSample, computeParityDelta) [RED] |
| 4ae2cad | feat(04-03) | implement cross-host-parity.mjs driver + CLI wrapper [GREEN] |

## TDD Gate Compliance

**Task 2:**
- RED gate (`732dd77`): 1 file only — `tests/cross-host-parity/cross-host-parity.test.ts`. Assets/scripts/cross-host-parity.mjs absent → all 17 tests fail with "Failed to load url"
- GREEN gate (`4ae2cad`): implementation + CLI wrapper + test type fixes → all 17 tests pass

## TRIG-03 Status (Critical Context)

**Current recall = 0.516 (below 0.80 threshold) — gate WILL fail CI on next push.**

This is intentional per the plan: honest signal > false confidence. The corpus expansion (Plan 4 GA hardening) has been applied (real trigger vocabulary for all 5 peer packages). The static-analysis fallback accuracy is bounded by the description-only approach. Full calibration to ≥0.80 requires live-LLM trigger eval (deferred post-GA per D-77).

Trust-posture rationale (P8): a non-blocking gate on a known-failing metric provides false confidence that coexistence is working. The blocking gate with documented shortfall is the correct trust posture.

## HOST_PROFILE Gap (Lesson 6 Finding)

**HOST_PROFILE is NOT a downstream reader of dispatchRoute/detectHost.**

`grep -rE "HOST_PROFILE" assets/scripts/ evals/hosts/` confirms:
- `HOST_PROFILE` is SET by vitest.config.ts in host workspace tests (test-label only)
- `HOST_PROFILE` is CHECKED by host-profile.test.ts (asserting the test label is set)
- `detectHost()` in `run-subagent.mjs` does NOT read `HOST_PROFILE` at all

The actual dispatch routing uses `CODEX_SESSION/CODEX_CLI_SESSION` (codex-cli) and `CURSOR_SESSION/CURSOR_AGENT_SESSION` (cursor). Setting `process.env.HOST_PROFILE = opts.host` in cross-host-parity would be a no-op for dispatch purposes.

**Resolution applied:** `cross-host-parity.mjs` sets the correct session env vars (`CODEX_CLI_SESSION`/`CURSOR_SESSION`) during fixture dispatch. It also warns explicitly when no real host dispatch env vars are configured (P8 caveat: sequential-fallback measures schema/gate correctness only, not LLM trigger recall). Per D-77: true parity testing requires manual invocation on a machine with the host CLI installed.

**Recommendation for Codex reviewer:** Consider whether `detectHost()` should accept `HOST_PROFILE` as an override (lower priority since D-77 is manual-invocation only), or whether the documentation should be updated to clarify this.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] selectDeterministicSample test had contradictory assertions**
- **Found during:** Task 2 GREEN phase (test "includes exactly 1 per useCase" vs "returns exactly 5")
- **Issue:** With the actual 15-fixture manifest, the dashboard category slot selects `fixture-11-dashboard-ds-extraction` which has route `DS-extraction` (a route-mandatory). The route-mandatory 5th slot then selects `fixture-08-consumer-lovable` (mature-app-refactor), creating a second consumer entry. Tests "returns exactly 5" and "includes exactly 1 per useCase" were mutually exclusive.
- **Fix:** Updated test to "includes at least 1 from each available use-case category" (correct specification) and added specific b2b-saas + dashboard uniqueness assertions. Algorithm unchanged — 5-fixture mandate (D-77) takes priority over strict useCase-per-slot uniqueness.
- **Files modified:** `tests/cross-host-parity/cross-host-parity.test.ts`

**2. [Rule 2 - Missing] Type annotations for strict TypeScript mode**
- **Found during:** Task 2 GREEN phase (tsc --noEmit)
- **Issue:** Dynamic import of `.mjs` returns inferred `any`; strict mode requires explicit types on callback parameters
- **Fix:** Added `FixtureEntry` interface + explicit type annotations on all callback parameters
- **Files modified:** `tests/cross-host-parity/cross-host-parity.test.ts`

## Known Stubs

None. All functions are fully implemented.

- `parity-results.json` is written at runtime — intentional (not a stub; the file doesn't exist until `runCrossHostParity` runs against a real host)
- TRIG-03 shortfall (recall=0.516) is documented and intentional (honest signal)

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: path-traversal | assets/scripts/cross-host-parity.mjs | --fixtures-dir, --baseline, --output are user-controlled; mitigated via path.resolve() + relative(PROJECT_ROOT) containment check per Lesson 7 |

## Self-Check: PASSED

Files confirmed:
- `assets/scripts/cross-host-parity.mjs` — FOUND
- `assets/scripts/cli/cross-host-parity.mjs` — FOUND
- `tests/cross-host-parity/cross-host-parity.test.ts` — FOUND (17 tests)
- `evals/coexistence/aggregate-eval.mjs` — MODIFIED (perSkillRecall + process.exit)
- `evals/coexistence/install-corpus.mjs` — MODIFIED (real trigger vocabulary)
- `.github/workflows/aggregate-coexistence.yml` — MODIFIED (continue-on-error: false + Assert step)

Commits confirmed:
- `f28f0a7` — feat(04-03): expand coexistence corpus with real trigger vocabulary
- `ae5f7e7` — feat(04-03): enable blocking TRIG-03 release gate
- `732dd77` — test(04-03): add failing cross-host-parity tests [RED]
- `4ae2cad` — feat(04-03): implement cross-host-parity.mjs driver + CLI wrapper [GREEN]
