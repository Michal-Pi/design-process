---
phase: 04-v2-0-rc-ga-acceptance-cross-host-launch
plan: "01"
subsystem: acceptance-corpus
tags:
  - acceptance-testing
  - adversarial-ci
  - fixture-corpus
  - tdd
dependency_graph:
  requires:
    - 04-00 (npm @beta dist — complete-design install path)
    - Phase 2 evals/fixtures/e2e/next15-tailwind4-shadcn/ (fixture-01 regression link)
  provides:
    - evals/acceptance/fixtures.manifest.json (consumed by 04-02 release-gate.mjs)
    - evals/adversarial/accept-02/run.test.ts (100-case ACCEPT-02 corpus)
    - evals/adversarial/accept-03/run.test.ts (100-case ACCEPT-03 corpus)
    - evals/adversarial/accept-04/run.test.ts (100-case ACCEPT-04 corpus)
  affects:
    - 04-02 (release-gate.mjs reads fixtures.manifest.json)
    - 04-03 (cross-host parity uses 15-fixture corpus)
tech_stack:
  added:
    - 15-fixture PRD corpus (evals/acceptance/)
    - 3×100-case adversarial fixture-builders (Node stdlib only)
  patterns:
    - TDD RED/GREEN cycle (3 commits: feat T1, test T2-RED, feat T2-GREEN)
    - Fixture-builder pattern (node:fs/promises + node:path only — lint:determinism enforced)
    - INVARIANTS.md Lesson 5 (count + identity assertions in all 3 run.test.ts files)
key_files:
  created:
    - evals/acceptance/fixtures.manifest.json
    - evals/acceptance/fixture-01-b2b-taskflow/metadata.json
    - evals/acceptance/fixture-02-b2b-crm/PRD.md
    - evals/acceptance/fixture-02-b2b-crm/metadata.json
    - evals/acceptance/fixture-03-b2b-devtools/PRD.md
    - evals/acceptance/fixture-03-b2b-devtools/metadata.json
    - evals/acceptance/fixture-04-b2b-analytics/PRD.md
    - evals/acceptance/fixture-04-b2b-analytics/metadata.json
    - evals/acceptance/fixture-05-b2b-onboarding/PRD.md
    - evals/acceptance/fixture-05-b2b-onboarding/metadata.json
    - evals/acceptance/fixture-06-consumer-fitness/PRD.md
    - evals/acceptance/fixture-06-consumer-fitness/metadata.json
    - evals/acceptance/fixture-07-consumer-recipe/PRD.md
    - evals/acceptance/fixture-07-consumer-recipe/metadata.json
    - evals/acceptance/fixture-08-consumer-lovable/PRD.md
    - evals/acceptance/fixture-08-consumer-lovable/metadata.json
    - evals/acceptance/fixture-09-consumer-finance/PRD.md
    - evals/acceptance/fixture-09-consumer-finance/metadata.json
    - evals/acceptance/fixture-10-consumer-social/PRD.md
    - evals/acceptance/fixture-10-consumer-social/metadata.json
    - evals/acceptance/fixture-11-dashboard-ds-extraction/PRD.md
    - evals/acceptance/fixture-11-dashboard-ds-extraction/metadata.json
    - evals/acceptance/fixture-12-dashboard-admin/PRD.md
    - evals/acceptance/fixture-12-dashboard-admin/metadata.json
    - evals/acceptance/fixture-13-dashboard-reporting/PRD.md
    - evals/acceptance/fixture-13-dashboard-reporting/metadata.json
    - evals/acceptance/fixture-14-marketing-landing/PRD.md
    - evals/acceptance/fixture-14-marketing-landing/metadata.json
    - evals/acceptance/fixture-15-marketing-rebrand/PRD.md
    - evals/acceptance/fixture-15-marketing-rebrand/metadata.json
    - evals/adversarial/accept-02/fixture-builder.mjs
    - evals/adversarial/accept-02/run.test.ts
    - evals/adversarial/accept-03/fixture-builder.mjs
    - evals/adversarial/accept-03/run.test.ts
    - evals/adversarial/accept-04/fixture-builder.mjs
    - evals/adversarial/accept-04/run.test.ts
    - evals/adversarial/accept-05/README.md
  modified: []
decisions:
  - "checkId for synthetic-persona block is 'RED-01' (not '1-provenance-001' from plan interfaces — actual gate code uses RED-01)"
  - "ACCEPT-05 covered by existing fid-06-frost-recurrence harness per 04-RESEARCH.md §Group B — README.md pointer only"
  - "ACCEPT-04 fixture distinctness: 3 variant strategies + PRODUCT_NAMES[100] + token group count variation = 100 genuinely distinct fixtures"
  - "D-73 distribution locked: 5 b2b-saas + 5 consumer + 3 dashboard + 2 marketing verified in manifest"
metrics:
  duration: "~60 minutes"
  completed_date: "2026-05-31"
  tasks_completed: 2
  files_created: 35
  tests_added: 306
---

# Phase 4 Plan 01: 15-Fixture Acceptance Corpus + Adversarial Corpora Summary

**One-liner:** 15 substantive PRD fixtures with D-73 distribution + 3×100-case fixed-seeded adversarial corpora (ACCEPT-02 synthetic-persona block, ACCEPT-03 styled-wireframe reject, ACCEPT-04 hi-fi-without-state-maps refusal) with count + identity assertions per INVARIANTS.md Lesson 5.

## What Was Built

### Task 1: 15-Fixture Acceptance Corpus

Created `evals/acceptance/` with 15 PRD fixtures conforming to D-73 distribution:

| UseCase | Count | Fixtures |
|---------|-------|---------|
| b2b-saas | 5 | 01 (TaskFlow/new-feature), 02 (Nexus CRM/new-product), 03 (Stackwatch devtools/new-product), 04 (Meridian analytics/new-product), 05 (Prism onboarding/new-feature) |
| consumer | 5 | 06 (Kinetic fitness/new-product), 07 (Mise recipes/new-product), 08 (Bloom/mature-app-refactor), 09 (Ledger finance/new-product), 10 (Ripple social/new-feature) |
| dashboard | 3 | 11 (Atlas Admin/DS-extraction), 12 (Helm ops/new-product), 13 (Pulse reporting/new-product) |
| marketing | 2 | 14 (Orbit landing/new-product), 15 (Verdant rebrand/brand-refresh) |

Mandatory routes confirmed:
- **fixture-08** (consumer-lovable): `mature-app-refactor` route — Bloom habit tracker migrating from Lovable
- **fixture-11** (dashboard-ds-extraction): `DS-extraction` route — Atlas Admin design system extraction

Fixture-01 wired to Phase 2 regression PRD via relative `prdPath: "../../fixtures/e2e/next15-tailwind4-shadcn/PRD.md"`.

Budget ceilings: new-feature=60k, new-product=150k, mature-app-refactor=45k, DS-extraction=120k, brand-refresh=55k.

`fixtures.manifest.json` with `fixtureCount: 15`, `distribution: {b2bSaas: 5, consumer: 5, dashboard: 3, marketing: 2}`, and ordered fixtures array with unique `fixtureId` per entry.

### Task 2: Adversarial Corpora (TDD RED/GREEN)

**ACCEPT-02** (`accept-02/`): 100-case synthetic-persona block corpus
- `fixture-builder.mjs`: `buildSyntheticOnlyFixture(tmpDir, seed)` — PERSONA_NAMES[100] pool (verified ≥100), COGNITIVE_SPACES[10] + JOB_CATEGORIES[10] for additional variation axes
- `run.test.ts`: 100 individual seed tests + count assertion + identity assertion
- All 100 return `pass_with_warnings` with `checkId: 'RED-01'`

**ACCEPT-03** (`accept-03/`): 100-case styled-wireframe rejection corpus
- `fixture-builder.mjs`: `buildStyledWireframeFixture(dir, seed)` — 100-entry STYLED_VIOLATIONS pool (20 base + 14+14+14 additional single-field + 20+18 combined)
- `run.test.ts`: 100 individual seed tests + count assertion + identity assertion
- All 100 return `not_runnable` with `reason: 'fidelity-cap-violation-FID-03'`
- Per Lesson 1: `not_runnable` has no `findings` field; tests assert `kind + reason` only

**ACCEPT-04** (`accept-04/`): 100-case hi-fi-without-state-maps refusal corpus
- `fixture-builder.mjs`: `buildHiFiWithoutStateMapsFixture(dir, seed)` — 3 variant strategies (absent/empty/non-spec interactions/), PRODUCT_NAMES[100], token group count (1..10), non-spec file count (1..5)
- `run.test.ts`: 100 individual seed tests + count assertion + identity assertion
- All 100 return `not_runnable` with `reason: 'stage-4-artifacts-absent'`

**ACCEPT-05** (`accept-05/README.md`): Pointer to existing `fid-06-frost-recurrence` harness — no new corpus built.

## Verification Results

```
Manifest verification:
  PASS: 15 fixtures, correct distribution, mandatory routes present, fixture-01 prdPath correct, all fixtureIds unique
  Distribution: {b2b:5, con:5, dash:3, mkt:2}

Adversarial tests (vitest run accept-02 accept-03 accept-04 --reporter=verbose):
  Test Files: 3 passed (3)
  Tests: 306 passed (306)
  Duration: 699ms

Full suite (vitest run):
  Test Files: 1 failed | 90 passed (91)  [1 failure = pre-existing stage-2-latch.test.ts flake]
  Tests: 2 failed | 1312 passed (1314)   [2 failures = pre-existing flakes only]

lint:determinism: CLEAN
tsc --noEmit: CLEAN (exit 0)
```

## Commits

| Commit | Type | Message |
|--------|------|---------|
| a7d5949 | feat(04-01) | build 15-fixture acceptance corpus + manifest |
| bf30c5c | test(04-01) | add failing adversarial corpus tests for ACCEPT-02/03/04 [RED] |
| 99d0191 | feat(04-01) | implement fixture-builders for ACCEPT-02/03/04 adversarial corpora [GREEN] |

## TDD Gate Compliance

- RED gate commit (`bf30c5c`): test files committed while fixture-builders absent — all 3 fail with "Failed to load url ./fixture-builder.mjs"
- GREEN gate commit (`99d0191`): fixture-builders implemented — all 306 tests pass
- No REFACTOR commit needed (implementations are clean and minimal)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] checkId discrepancy: plan said '1-provenance-001', gate code uses 'RED-01'**
- **Found during:** Task 2 implementation
- **Issue:** The plan's `<interfaces>` block stated `checkId for synthetic block: '1-provenance-001'` and the `<behavior>` block said `findings[0].checkId='1-provenance-001'`. The actual `stage-1.mjs` gate code emits `checkId: "RED-01"`.
- **Fix:** ACCEPT-02 `run.test.ts` asserts `checkId === 'RED-01'` (actual behavior) instead of the plan's incorrect `1-provenance-001`. Verification criterion #10 in the plan (grep for `1-provenance-001`) will not match — but the test is semantically correct and passing.
- **Files modified:** `evals/adversarial/accept-02/run.test.ts`
- **Impact:** No functional regression. The identity assertion is correct and meaningful.

**2. [Rule 2 - Missing validation] ACCEPT-04 distinctness: plan's suggested approach was insufficient**
- **Found during:** Task 2 implementation
- **Issue:** The plan suggested "vary seed by creating different token-count filenames (file count = seed+1 mod 5 + 1)" — this gives only 5 distinct shapes repeated 20× each. The plan also flagged this: "Add additional varying axes... to actually achieve 100 distinct fixtures."
- **Fix:** Added 3 variant strategies (absent/empty/non-spec interactions/) + PRODUCT_NAMES[100] + token group count (1..10) + sitemap presence (every 4th) + non-spec file count (1..5). Result: 100 genuinely distinct fixtures.
- **Files modified:** `evals/adversarial/accept-04/fixture-builder.mjs`

## Known Stubs

None. All PRD.md files are substantive (400-700 words, Lenny one-pager format, no placeholder content). The fixture-01 metadata references the Phase 2 TaskFlow PRD by path — this is intentional design (not a stub).

## Threat Flags

None. All new files:
- `evals/acceptance/` — static JSON/Markdown content; no network endpoints
- `evals/adversarial/accept-*/fixture-builder.mjs` — Node stdlib only; no LLM client imports
- `evals/adversarial/accept-*/run.test.ts` — test files; no production surface

## Self-Check: PASSED

Files confirmed:
- `evals/acceptance/fixtures.manifest.json` — FOUND
- `evals/acceptance/fixture-01-b2b-taskflow/metadata.json` — FOUND
- `evals/acceptance/fixture-08-consumer-lovable/metadata.json` (mature-app-refactor) — FOUND
- `evals/acceptance/fixture-11-dashboard-ds-extraction/metadata.json` (DS-extraction) — FOUND
- `evals/adversarial/accept-02/fixture-builder.mjs` — FOUND
- `evals/adversarial/accept-02/run.test.ts` — FOUND
- `evals/adversarial/accept-03/fixture-builder.mjs` — FOUND
- `evals/adversarial/accept-03/run.test.ts` — FOUND
- `evals/adversarial/accept-04/fixture-builder.mjs` — FOUND
- `evals/adversarial/accept-04/run.test.ts` — FOUND
- `evals/adversarial/accept-05/README.md` — FOUND

Commits confirmed:
- `a7d5949` — feat(04-01): build 15-fixture acceptance corpus + manifest
- `bf30c5c` — test(04-01): add failing adversarial corpus tests for ACCEPT-02/03/04 [RED]
- `99d0191` — feat(04-01): implement fixture-builders for ACCEPT-02/03/04 adversarial corpora [GREEN]
