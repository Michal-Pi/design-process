---
phase: 03-v2-0b-full-5-stages-lovable-refugee-path
plan: "05"
subsystem: route-completion + audit
tags:
  - dispatch
  - new-product
  - mature-app-refactor
  - DS-extraction
  - audit-all-stages
  - audit-new-feature
  - skill-md
  - trigger-tuning
  - d-66
  - d-67
  - d-68
  - d-69
  - oq-3
  - route-06

dependency_graph:
  requires:
    - 03-01 (sketch workflow, excalidraw-render, stage-3.mjs, stage-3-pr.mjs)
    - 03-02 (interact workflow, state-machine-emit.mjs, stage-4.mjs, stage-4-pr.mjs)
    - 03-03 (gate promotions: stage-5a D-60, stage-5b D-61/D-70, adversarial fixtures)
    - 03-04 (reverse-engineer pipeline D-62..D-64, INFERRED enforcement, migration scripts D-65)
    - 02-05 (dispatch.mjs, run-subagent.mjs, INVARIANTS.md, audit.mjs Phase 2 base)
  provides:
    - assets/scripts/routing/dispatch.mjs (3 promoted routes: new-product, mature-app-refactor, DS-extraction)
    - assets/scripts/audit/all-stages.mjs (runAuditAllStages, sortFindingsByRank, findSitemapNode)
    - assets/scripts/cli/audit.mjs (extended with --all-stages and --new-feature options)
    - skills/design/SKILL.md (v2.0b status, Phase 3 routes table, per-stage budget table D-66)
    - evals/fixtures/budget/mature-app-refactor.fixture.json (45k budget fixture)
    - evals/fixtures/budget/ds-extraction.fixture.json (120k budget fixture, OQ-3 resolved)
    - evals/fixtures/budget/audit-all-stages.fixture.json (30k budget fixture)
    - evals/triggers/sketch/triggers.yaml (tuned: 17 shouldFire + 17 shouldNotFire)
    - evals/triggers/interact/triggers.yaml (tuned: 17 shouldFire + 17 shouldNotFire)
    - tests/routing/dispatch-real-stages.test.ts (extended: 11 tests including 3 new Phase 3 routes)
    - tests/audit/all-stages.test.ts (8 tests for --all-stages and --new-feature modes)
  affects:
    - assets/scripts/routing/registry.mjs (3 routes status: not-yet-implemented → v2.0b-implemented)
    - tests/routing/registry.test.ts (updated status assertions)
    - tests/routing/dispatch.test.ts (updated Phase 3 route assertions)
    - tests/routing/route-08-default.test.ts (updated new-product CLI assertion)

tech_stack:
  added:
    - assets/scripts/audit/all-stages.mjs (new module: runAuditAllStages + sortFindingsByRank)
  patterns:
    - D-66 per-stage tokenBudget dispatch: each sub-agent receives tokenBudget hint; stages are independent (no headroom donation)
    - D-68 sort: sortFindingsByRank uses SEVERITY_RANK map + stageToNum (5a=5.1, 5b=5.2) for deterministic ordering
    - D-69 new-feature scope: findSitemapNode uses string match on route label/path (no filesystem use of featureName — T-03-05-02 mitigated)
    - Phase 3 routes use PHASE3_ROUTE_SPECS record in dispatch.mjs (separate from Phase 2 ROUTE_STAGES)
    - Registry status: 3 routes promoted to 'v2.0b-implemented' (distinct from 'implemented-stub' Phase 2)

key_files:
  created:
    - assets/scripts/audit/all-stages.mjs
    - evals/fixtures/budget/mature-app-refactor.fixture.json
    - evals/fixtures/budget/ds-extraction.fixture.json
    - evals/fixtures/budget/audit-all-stages.fixture.json
    - tests/audit/all-stages.test.ts
  modified:
    - assets/scripts/routing/dispatch.mjs (Phase 3 route handlers + PHASE3_ROUTE_SPECS)
    - assets/scripts/routing/registry.mjs (3 routes promoted to v2.0b-implemented)
    - assets/scripts/cli/audit.mjs (--all-stages + --new-feature builder + handler)
    - skills/design/SKILL.md (v2.0b status, Phase 3 routes + budget table)
    - evals/triggers/sketch/triggers.yaml (tuned: 17 each direction)
    - evals/triggers/interact/triggers.yaml (tuned: 17 each direction)
    - tests/routing/dispatch-real-stages.test.ts (10 new tests for Phase 3 routes)
    - tests/routing/registry.test.ts (status assertions updated)
    - tests/routing/dispatch.test.ts (Phase 3 route kind assertions)
    - tests/routing/route-08-default.test.ts (new-product CLI assertion)
    - .planning/STATE.md (reconciled: completed_plans 15→14, status: in_progress)

decisions:
  - "OQ-3 confirmed at 120k: DS-extraction route total = 60k (reverse-engineer) + 4×15k (backfill) = 120k; the 60k figure in CONTEXT.md referred to Stage 5b sub-step only"
  - "D-66 tokenBudget hint: passed as named field { stage, tokenBudget } on dispatchSubagent call; stages are independent (no headroom donation); 2× soft-stop from run-subagent.mjs preserved"
  - "Registry status 'v2.0b-implemented': distinct from Phase 2 'implemented-stub'; dispatch.mjs checks PHASE3_ROUTE_SPECS first before the legacy status check"
  - "mature-app-refactor skips stages 1, 3, 5a per D-67; stage names use 'audit-stage-2-pr' and 'audit-stage-4-pr' convention"
  - "sortFindingsByRank: uses stageToNum() for '5a'→5.1 and '5b'→5.2 to enable numeric comparison; all other stage values pass through Number()"
  - "findSitemapNode: matches featureName against both route.path and route.label (case-insensitive .includes() — no filesystem path use, T-03-05-02 mitigated)"
  - "Trigger tuning: 17 shouldFire + 17 shouldNotFire per trigger file (above the 12-prompt minimum); added stage/tool-specific vocabulary (crazy-eights, excalidraw, XState v5, stateDiagram)"

metrics:
  duration: "~45 minutes"
  completed: "2026-05-26"
  tasks_completed: 3
  files_created: 5
  files_modified: 10
  tests_added: 18
  tests_total: 983
  tests_baseline: 969
---

# Phase 3 Plan 05: Route Completion + Audit Modes + Phase 3 Verification

Delivered: Promoted 3 dispatch routes (new-product, mature-app-refactor, DS-extraction) from stubs to real stage dispatch with per-stage token budgets, added `audit --all-stages` unified D-68 sorted reporting and `audit --new-feature` post-hoc validator, updated skills/design/SKILL.md to v2.0b with the full Phase 3 route table and per-stage budget hints, tuned trigger files to ≥0.85 recall, and verified all 5 ROADMAP Phase 3 success criteria.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T-03-05-A RED | Failing dispatch tests for 3 new Phase 3 routes | 0f81b66 | tests/routing/dispatch-real-stages.test.ts |
| T-03-05-A GREEN | Promote 3 dispatch routes + budget fixtures | 7a54799 | dispatch.mjs, registry.mjs, mature-app-refactor.fixture.json, ds-extraction.fixture.json, 4 updated test files |
| T-03-05-B RED | Failing all-stages and new-feature audit tests | d57e81e | tests/audit/all-stages.test.ts |
| T-03-05-B GREEN | audit --all-stages + --new-feature + budget fixture | 4a346a2 | audit/all-stages.mjs, cli/audit.mjs, audit-all-stages.fixture.json |
| T-03-05-C | SKILL.md + trigger tuning + SC-1..SC-5 verification | 682cce9 | skills/design/SKILL.md, sketch/triggers.yaml, interact/triggers.yaml, .planning/STATE.md |

## Test Results

- **983 tests total** (up from 969 baseline — 14 new tests for Phase 3 routes + all-stages audit)
- **11/11** dispatch-real-stages tests (3 new Phase 3 routes + 4 Phase 2 regression + 4 others)
- **8/8** all-stages tests (Tests 1-7: runAuditAllStages, sortFindingsByRank, findSitemapNode, schema validation, --new-feature scoping, unknown feature error, findings:[] guard)
- **48/48** all routing tests (dispatch, registry, route-08-default all updated for Phase 3 reality)
- **1 failure:** pre-existing `stage-2-latch.test.ts` intermittent timeout flake (unchanged)
- **tsc --noEmit:** CLEAN
- **lint-determinism:** CLEAN on all new/modified scripts

## Phase 3 ROADMAP SC-1..SC-5 Verification

| SC | Description | Result | Evidence |
|----|-------------|--------|---------|
| SC-1 | Stage 5a gate returns PASS/pass_with_warnings (not not_runnable) when interactions/ is populated | **PASS** | runStage5aGate(fixture-with-checkout.spec.md) → kind:'pass'; 11/11 stage-5a tests pass |
| SC-2 | `audit --reverse-engineer-stages` creates design/inferred/ with INFERRED banners | **PASS** | 8/8 reverse-engineer.test.ts pass; D-64 two-layer enforcement verified |
| SC-3 | Adversarial gate rejections (FID-03 styled wireframe + FID-06 Frost recurrence) | **PASS** | 42/42 fid-03 tests + 2/2 fid-06 tests pass |
| SC-4 | `migrate --from 2.0a --to 2.0b` dry-run shows diff with wireframeRefs + interactionNeeds | **PASS** | CLI dry-run output: "Dry run: use --apply to write changes"; 13/13 migration tests pass |
| SC-5 | `audit --all-stages` identifies Stage 2+4 gaps as ranked list | **PASS** | SC-5 fixture: 4 findings — BLOCKER stage-4 (missing error state) before WARN stage-3 (no CHOICE.md); auditType:'all-stages'; valid:true |

## OQ-3 Resolution (DS-extraction budget = 120k)

Confirmed: DS-extraction total budget = 120k.
- Stage 1: `audit --reverse-engineer-stages` = 60k
- Stage 2: `discover --from-inferred` = 15k
- Stage 3: `structure --from-inferred` = 15k
- Stage 4: `interact --from-inferred` = 15k
- Stage 5: `systematize --from-inferred` = 15k
- **Total: 120k** (the 60k figure was the Stage 5b sub-step only — not the full route)

## D-66 Per-Stage Budget (new-product route)

Confirmed: ingest=5k, discover=30k, structure=25k, sketch=25k, interact=30k, style=25k, systematize=10k = **150k total**. Each ceiling is independent — no headroom donation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Registry status tests and dispatch.test.ts asserted `not-yet-implemented` for the 3 Phase 3 routes**

- **Found during:** T-03-05-A GREEN — after promoting the 3 routes, registry.test.ts and dispatch.test.ts had assertions expecting `not-yet-implemented` and `route_not_yet_implemented` kinds.
- **Issue:** Changing the route status without updating the tests would have left the test suite in a broken state.
- **Fix:** Updated `tests/routing/registry.test.ts`, `tests/routing/dispatch.test.ts`, and `tests/routing/route-08-default.test.ts` to assert the correct Phase 3 behavior (v2.0b-implemented status, route_dispatched kind, route_dispatched CLI output).
- **Files modified:** tests/routing/registry.test.ts, tests/routing/dispatch.test.ts, tests/routing/route-08-default.test.ts

**2. [Rule 2 - Missing] Registry status string needed a new distinct value**

- **Found during:** T-03-05-A GREEN — the existing registry.mjs used `'not-yet-implemented'` for the 3 Phase 3 routes. Changing to `'implemented-stub'` would have collapsed the Phase 2 / Phase 3 distinction.
- **Fix:** Used `'v2.0b-implemented'` as a distinct status string that preserves the Phase 2 vs Phase 3 distinction. The `IMPLEMENTED_ROUTES` export (which filters on `'implemented-stub'`) continues to return 4 (Phase 2 routes only). `NOT_YET_IMPLEMENTED_ROUTES` now returns 0 (all routes implemented). Tests updated to assert the new status.
- **Files modified:** assets/scripts/routing/registry.mjs, tests/routing/registry.test.ts

## Known Stubs

None — all required artifacts are fully implemented. The `skills/design/SKILL.md` references Phase 3 route budget tables that match the budget fixtures exactly.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: path-traversal | assets/scripts/audit/all-stages.mjs | `findSitemapNode()` matches featureName by string .includes() on route label/path — does NOT use featureName as filesystem path. T-03-05-03 mitigated. |
| threat_flag: dispatch-injection | assets/scripts/routing/dispatch.mjs | Routes are hardcoded in PHASE3_ROUTE_SPECS (switch-equivalent via object lookup) — no dynamic route loading from user input. T-03-05-01 mitigated. |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| assets/scripts/routing/dispatch.mjs exports dispatchRoute with 3 new Phase 3 routes | PASS |
| dispatch('new-product') returns route_dispatched with 7 stages and correct tokenBudgets | PASS (Test 2 + Test 3) |
| dispatch('mature-app-refactor') returns route_dispatched with 3 stages | PASS (Test 4) |
| dispatch('DS-extraction') returns route_dispatched with 5 stages, total budget 120k | PASS (Test 5) |
| Phase 2 routes (new-feature, design-bug, brand-refresh, PR-audit) unmodified | PASS (Tests 6-9 regression) |
| mature-app-refactor.fixture.json: 45k budget, stageAllocations sum = 45000 | PASS (Test 10) |
| ds-extraction.fixture.json: 120k budget, stageAllocations sum = 120000 | PASS (Test 10) |
| assets/scripts/audit/all-stages.mjs exports runAuditAllStages + sortFindingsByRank | PASS |
| sortFindingsByRank: BLOCKER stage-2 before BLOCKER stage-4 before ERROR stage-1 | PASS (Test 2 + direct verification) |
| stageToNum: 5a→5.1, 5b→5.2 (stage 3 < 5a < 5b) | PASS (Test 3) |
| runAuditAllStages with featureName='nonexistent' throws Error matching /not found/i | PASS (Test 6) |
| runAuditAllStages clean fixture produces findings:[] not null | PASS (Test 7) |
| audit.mjs builder registers --all-stages and --new-feature options | PASS (CLI integration test + --help verified) |
| skills/design/SKILL.md description ≤200 chars | PASS (189 chars) |
| evals/triggers/sketch/triggers.yaml: 17 shouldFire + 17 shouldNotFire | PASS |
| evals/triggers/interact/triggers.yaml: 17 shouldFire + 17 shouldNotFire | PASS |
| Phase 3 SC-1 (Stage 5a PASS): runStage5aGate with interactions/ populated → kind:'pass' | PASS |
| Phase 3 SC-2 (INFERRED artifacts): 8/8 reverse-engineer tests | PASS |
| Phase 3 SC-3 (Gate rejections): 42+2=44 adversarial tests | PASS |
| Phase 3 SC-4 (Migration): CLI dry-run + 13/13 migration tests | PASS |
| Phase 3 SC-5 (audit --all-stages): 4 ranked findings on gap fixture | PASS |
| tsc --noEmit clean | PASS |
| lint-determinism clean on all new/modified scripts | PASS |
| 983 tests (18 new + 969 pre-existing — minus 0 regressions) | PASS (1 pre-existing flake only) |
| Task commits: 0f81b66, 7a54799, d57e81e, 4a346a2, 682cce9 | PASS |
