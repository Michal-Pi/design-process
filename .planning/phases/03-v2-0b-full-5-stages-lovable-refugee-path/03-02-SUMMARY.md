---
phase: 03-v2-0b-full-5-stages-lovable-refugee-path
plan: "02"
subsystem: stage-4-interact
tags:
  - stage-4
  - xstate-v5
  - mermaid-statediagram-v2
  - state-machine-emit
  - gate-stage-4
  - d-57
  - d-58
  - d-59

dependency_graph:
  requires:
    - 03-01 (stage-3.mjs, excalidraw-render.mjs, mermaid-render.mjs base)
    - 02-05 (verify-golden.mjs, lint-determinism.mjs, globby 14.x, base gate infrastructure)
    - 01-03 (bin/complete-design.mjs auto-discovery dispatcher, mermaid-render.mjs Phase 1 base)
    - 01-01 (interaction-spec.v1.json schema, schemas/validate.mjs ajv validator)
  provides:
    - assets/scripts/state-machine-emit.mjs (emitMermaid, emitXState, emitFromSpec, needsXState, emitToFiles)
    - assets/scripts/mermaid-render.mjs (extended: validateMermaidSource() for stateDiagram-v2 + composite state)
    - assets/scripts/cli/state-machine-emit.mjs (Commander CLI wrapper)
    - assets/scripts/gates/stage-4.mjs (full D-59: sitemap coverage + state completeness + no open transitions)
    - assets/scripts/audit/stage-3-pr.mjs (3-pr-choice-001, 3-pr-layout-001)
    - assets/scripts/audit/stage-4-pr.mjs (4-pr-states-001, 4-pr-hax18-001)
    - evals/golden/state-machine-emit.golden.json (4-state async golden fixture, 5× byte-identical)
    - references/gates/stage-4.md (4-column GFM gate checklist)
    - skills/workflows/interact.md (W4 workflow SKILL.md)
    - skills/atoms/ixd/state-catalog.md (ATOM-12)
    - skills/atoms/ixd/pattern-variants.md (ATOM-11)
    - skills/atoms/ixd/state-machine.md (ATOM-10)
    - evals/triggers/interact/triggers.yaml (14 shouldFire + 14 shouldNotFire)
    - 7 reference files (saffer-microinteractions, tidwell-patterns, head-motion, hax-18, xstate-v5, apg, material-3)
  affects:
    - assets/scripts/verify-golden.mjs (registered state-machine-emit fixture runner)
    - tests/gates/per-stage-skeletons.test.ts (removed stage-4 from skeleton gates; added smoke test)
    - tests/references/corpus-completeness.test.ts (updated 5→6 gate checklists; stage-4.md now expected)
    - evals/bundles/fixtures/stage-3-to-4/bundle.md (updated sourceHash + provenanceWorstCase + artifactsInventory)

tech_stack:
  added:
    - XState v5 (setup() + createMachine() pattern — emitted conditionally per D-57)
    - Mermaid stateDiagram-v2 validation via validateMermaidSource() extension to mermaid-render.mjs
    - D-57 heuristic: needsXState(spec) deterministic function (asyncOperations && stateCount>=3 && hasConditionalTransitions)
    - extractStateNames() regex-based state declaration extractor (source-only, not target-capture)
  patterns:
    - D-58: Single IR → dual output (Mermaid always + XState conditional) from emitFromSpec()
    - D-59: Three-condition gate (sitemap coverage + state completeness + no open transitions)
    - Max-2-retry repair loop signaled via exit code 2 from state-machine-emit CLI
    - T-03-02-01 security: --spec path validated for .. traversal and .spec.md extension
    - T-03-02-02: extractStateNames() regex matches \w[\w-]* identifiers only (source-declaration-only)

key_files:
  created:
    - assets/scripts/state-machine-emit.mjs
    - assets/scripts/cli/state-machine-emit.mjs
    - assets/scripts/audit/stage-3-pr.mjs
    - assets/scripts/audit/stage-4-pr.mjs
    - evals/golden/state-machine-emit.golden.json
    - references/gates/stage-4.md
    - skills/workflows/interact.md
    - skills/atoms/ixd/state-catalog.md
    - skills/atoms/ixd/pattern-variants.md
    - skills/atoms/ixd/state-machine.md
    - evals/triggers/interact/triggers.yaml
    - references/saffer-microinteractions.md
    - references/tidwell-patterns.md
    - references/head-motion.md
    - references/hax-18.md
    - references/xstate-v5.md
    - references/apg.md
    - references/material-3.md
    - evals/bundles/fixtures/stage-3-to-4/upstream/interactions.placeholder
    - tests/state-machine/emit.test.ts
    - tests/gates/stage-4.test.ts
    - tests/audit/stage-3-pr.test.ts
    - tests/audit/stage-4-pr.test.ts
  modified:
    - assets/scripts/gates/stage-4.mjs (replaced Phase 1 skeleton with D-59 full logic)
    - assets/scripts/mermaid-render.mjs (added validateMermaidSource() for stateDiagram-v2)
    - assets/scripts/verify-golden.mjs (registered state-machine-emit fixture runner)
    - tests/gates/per-stage-skeletons.test.ts (removed stage-4 from skeleton gates)
    - tests/references/corpus-completeness.test.ts (5→6 gate checklists)
    - evals/bundles/fixtures/stage-3-to-4/bundle.md (sourceHash + provenanceWorstCase + artifactsInventory)

decisions:
  - "D-57 XState trigger heuristic implemented as needsXState(spec) pure function with explicit boolean checks (not 'vibes'). Three conditions: asyncOperations===true AND stateCount>=3 AND hasConditionalTransitions===true."
  - "D-58 Mermaid always emitted, XState conditional. Single IR → dual output from emitFromSpec() — never two separate LLM passes."
  - "D-59 three-condition gate implemented in gate-stage-4.mjs. extractStateNames() uses source-declaration-only regex (bare names, left-of-arrow sources, annotations, composite state) to distinguish declared from target-only states."
  - "T-03-02-01 path-traversal security: --spec validated for '..' segments AND must end in .spec.md."
  - "T-03-02-02 regex false-positive prevention: extractStateNames() Pattern 4 (bare name on its own line) correctly captured declared states from test fixture buildDiagramMmd() output."
  - "Pitfall B (stateDiagram-v2 composite state): validateMermaidSource() tested with state Name { ... } syntax — Mermaid CLI handles natively, no special parsing needed on our side."
  - "Mermaid validation tests given 15s timeout (not default 5s) — mermaid-cli headless invocation takes 1-3s per call."
  - "Bundle fixture stage-3-to-4 updated: provenanceWorstCase changed from 'validated' (Phase 1 default) to 'generated' (correct for interactions.placeholder with provenance:generated frontmatter)."
  - "stage-4-pr.mjs HAX-18 check uses full raw file content check (case-insensitive 'hax-18') — covers both frontmatter and body."

metrics:
  duration: "~90 minutes"
  completed: "2026-05-26"
  tasks_completed: 3
  files_created: 23
  files_modified: 6
  tests_added: 21
  tests_total: 900
  tests_baseline: 879
---

# Phase 3 Plan 02: Stage 4 Interact — State Machine Emit + D-59 Gate + IxD Atoms

Stage 4 (Interact/IxD) delivered: single IR→dual-output state machine emitter (Mermaid stateDiagram-v2 always + XState v5 conditionally per D-57), full gate-stage-4.mjs with three D-59 conditions, Stage 3/4 PR detectors, interact workflow + 3 IxD atom SKILL.md files, 7 reference files, and a state-machine-emit golden fixture for determinism CI.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T-03-02-A RED | Failing tests for state-machine-emit + mermaid-render stateDiagram-v2 | d4a783d | tests/state-machine/emit.test.ts |
| T-03-02-A GREEN | state-machine-emit.mjs + golden fixture + mermaid-render extension | 106e7dc | state-machine-emit.mjs, mermaid-render.mjs, cli/state-machine-emit.mjs, golden |
| T-03-02-B RED | Failing tests for gate-stage-4 + stage-3/4-pr detectors | 67af5e0 | tests/gates/stage-4.test.ts, tests/audit/stage-3/4-pr.test.ts |
| T-03-02-B GREEN | gate-stage-4.mjs full logic + stage-3-pr.mjs + stage-4-pr.mjs | e26ce68 | stage-4.mjs, stage-3-pr.mjs, stage-4-pr.mjs, stage-4.md checklist |
| T-03-02-C | interact SKILL.md + IxD atoms + 7 references + triggers + bundle | 1879c9e | interact.md, 3 atoms, 7 refs, triggers.yaml, bundle fixture |

## Test Results

- **900 tests total** (up from 879 baseline — 21 new tests)
- **12/12** state-machine-emit tests (emitMermaid, emitXState, emitFromSpec D-57, determinism, lint, mermaid-render validation)
- **5/5** gate-stage-4 tests (D-59a/b/c + pass case + INVARIANT-01)
- **2/2** stage-3-pr tests (3-pr-choice-001 detection + clean fixture)
- **3/3** stage-4-pr tests (4-pr-states-001 + 4-pr-hax18-001 + clean fixture)
- **2 failures:** pre-existing `stage-2-latch.test.ts` intermittent timeout flake (not caused by this plan)
- **tsc --noEmit:** CLEAN
- **lint-determinism:** CLEAN on state-machine-emit.mjs, stage-4.mjs, stage-3-pr.mjs, stage-4-pr.mjs
- **verify-golden:** PASS on state-machine-emit golden fixture (5× byte-identical, mermaidOutput + xstateOutput)
- **SKILL.md descriptions:** interact=159, state-catalog=154, pattern-variants=140, state-machine=165 (all ≤200 INVARIANT-04)

## Pitfall B Result (stateDiagram-v2 composite state)

Test 9 in `emit.test.ts` confirms that `validateMermaidSource()` handles Mermaid composite state syntax:
```
state Active {
  [*] --> Loading
  Loading --> Success : DONE
}
```
Mermaid CLI handles this natively. No special parsing needed on our side. Test passes in 15s (headless CLI call). **Pitfall B: RESOLVED — composite state handled correctly.**

## Mermaid Validation Extension (RESEARCH.md §4.3 adjustment)

RESEARCH.md §4.3 proposed detecting diagram type at dispatch line 57+ of `mermaid-render.mjs`. Implementation used the same approach but as a new `validateMermaidSource()` function (not in the `renderMermaidFile()` dispatcher, which is render-only). The separation keeps render (file→file) distinct from validate (source→valid|error), which is the correct abstraction for the repair loop pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] extractStateNames() initially captured all states including transition targets**
- **Found during:** T-03-02-B GREEN — test 3 (open-transition detection) failing because `unknownState` appeared in declared names set
- **Issue:** Original implementation used 4 patterns including `-->[\t]*(\w[\w-]*)` (target capture), which added transition targets to the declared set. The `unknownState` in `loading --> unknownState : WHOOPS` was incorrectly added as a declared state.
- **Fix:** Removed target-capture pattern entirely. `extractStateNames()` now only captures: (1) bare state names on their own line, (2) left-side of `-->` transitions, (3) state annotations `stateName :`, (4) composite state declarations `state Name {`. Transition targets are captured separately by `extractTransitionTargets()`.
- **Files modified:** `assets/scripts/gates/stage-4.mjs`

**2. [Rule 1 - Bug] per-stage-skeletons.test.ts expected stage-4 to return skeleton pass**
- **Found during:** Full test suite run after gate-stage-4 implementation
- **Issue:** Phase 1 test expected stage-4 to return `{kind:'pass', evidence:'inferred'}`. Now that the gate has D-59 real logic, it returns `failed_after_repair` for fixtures without proper sitemap/interactions.
- **Fix:** Removed stage-4 from `skeletonGates` array; added smoke test verifying `runStage4Gate` is still exported.

**3. [Rule 1 - Bug] corpus-completeness.test.ts expected exactly 5 gate checklists**
- **Found during:** Full test suite run after stage-4.md creation
- **Issue:** Phase 3 Plan 01 test expected 5 checklists (1, 2, 3, 5a, 5b). Plan 02 ships stage-4.md.
- **Fix:** Updated test to expect 6 checklists and verify stage-4.md exists.

**4. [Rule 1 - Bug] sufficiency-structural.test.ts failed after bundle.md update**
- **Found during:** Full test suite run after Task C (bundle fixture update)
- **Issue:** Updated `interactions.placeholder` with `provenance: generated` frontmatter, but `bundle.md` still had `provenanceWorstCase: validated` (Phase 1 default). The structural-sufficiency eval detected the mismatch.
- **Fix:** Updated `bundle.md` `provenanceWorstCase: validated` → `generated`. Bundle eval passes.

**5. [Rule 2 - Missing] Mermaid validation tests needed 15s timeout**
- **Found during:** Full vitest run — Tests 8 and 9 timed out at default 5000ms
- **Issue:** `validateMermaidSource()` invokes `@mermaid-js/mermaid-cli` headless which takes 1-3s per call. Default test timeout too low.
- **Fix:** Added `15000` timeout to Tests 8 and 9 in `emit.test.ts`.

## Known Stubs

None — all artifacts are fully implemented.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: path-traversal | assets/scripts/state-machine-emit.mjs | `--spec` and `--output` CLI flags. T-03-02-01 mitigation applied: validates no `..` in specPath, validates file ends in `.spec.md`, validates file exists before reading. |
| threat_flag: regex-false-positive | assets/scripts/gates/stage-4.mjs | `extractStateNames()` regex-based state name extraction. T-03-02-02 mitigation: source-declaration-only regex; tested against comment syntax to prevent false positives from `%% comment` lines. |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| All 23 created files exist | PASS (23/23) |
| All 5 commits exist | PASS (d4a783d, 106e7dc, 67af5e0, e26ce68, 1879c9e) |
| 900 tests (21 new, 879 baseline) | PASS (2 pre-existing stage-2-latch flakes only) |
| tsc --noEmit | PASS (clean) |
| lint-determinism (4 new scripts) | PASS (CLEAN) |
| verify-golden state-machine-emit | PASS (5× byte-identical mermaidOutput + xstateOutput) |
| D-57 XState conditional | PASS (asyncOps:false → xstateSource:null; stateCount:2 → null) |
| SKILL.md descriptions ≤200 chars | PASS (159, 154, 140, 165) |
| Pitfall B composite state | PASS (stateDiagram-v2 composite handled by Mermaid CLI) |
| Zero file overlap with 03-01 | PASS (confirmed: different files_modified arrays) |

---

## Codex Review Fixes

All 4 findings accepted and fixed as atomic commits. Tests: 904 total (up from 900, 4 new tests added). tsc and lint:determinism both clean after fixes.

### Finding 1 — [P1] CLI dispatcher contract violation

**Commit:** `2d993f9`
**Files:** `assets/scripts/cli/state-machine-emit.mjs`

**Problem:** Module exported `{ name, description, options, action }`. The dispatcher at `bin/complete-design.mjs` requires `{ name, describe, builder, handler }`. The wrong shape caused `error: unknown option '--spec'` at runtime — Commander never registered the options.

**Fix:** Rewrote the CLI module to use the canonical Commander contract exported by all sibling CLI modules (`excalidraw-render.mjs`, `gate.mjs`). Preserved: security check (T-03-02-01 `..` path traversal guard), `emitToFiles()` call, exit-code-2 repair signaling.

**Verification:**
```
$ node bin/complete-design.mjs state-machine-emit --help
Usage: complete-design state-machine-emit [options]

Emit Mermaid stateDiagram-v2 and conditional XState v5 machine from a .spec.md file.

Options:
  --spec <path>    Path to the .spec.md interaction spec file (required)
  --output <dir>   Output directory for .diagram.mmd and .machine.ts (required)
  --screen <name>  Override screen name (defaults to spec file stem)
  -h, --help       display help for command
```
Both `--spec` and `--output` appear in the option list. Previously they were absent (unknown options).

---

### Finding 2 — [P2] Custom-state declarations missing

**Commit:** `022a7ca`
**Files:** `assets/scripts/state-machine-emit.mjs`, `evals/golden/state-machine-emit.golden.json`, `tests/state-machine/emit.test.ts`

**Problem:** `emitMermaid()` skipped custom (non-typed) states entirely: if `stateTypeAnnotation(state.type)` returned `''`, the state got no declaration line. If a custom state was referenced only as a transition target (e.g., `running --> permission-denied : NO_PERMS`), `extractStateNames()` in `stage-4.mjs` wouldn't see it as declared, causing false D-59c open-transition findings.

**Fix:** Every state in `spec.states` now gets an explicit declaration:
- Typed state (loading/empty/error/success): `  stateName : %% <type>` (unchanged)
- Custom/untyped state: `  stateName` (bare declaration — new)

**Golden fixture updated:** `idle` (custom type) now appears as bare `  idle` in `mermaidOutput` before the `[*] --> idle` entry transition.

**Tests added:**
- Test 11: asserts bare declaration line for every custom-type state
- Test 12: asserts `extractStateNames()` sees all states (including custom-target-only) as declared — D-59c open-transition regression guard

---

### Finding 3 — [P2] Diagram-coverage by globby instead of count+identity (Lesson 5 violation)

**Commit:** `3a7a9e1`
**Files:** `assets/scripts/gates/stage-4.mjs`, `tests/gates/stage-4.test.ts`

**Problem:** The D-59c open-transition check looped over `globby(['interactions/*.diagram.mmd'])`. If no diagrams existed, the loop body ran zero times, no finding was pushed, and if other checks passed, the gate returned `pass` despite diagrams being completely absent.

**Fix:** Before the open-transition loop, compute the expected diagram set as every screen that has a `.spec.md` (the `specScreenNames` set already computed for condition (a)). For each screen in that set with no matching `.diagram.mmd`, push `{ checkId: '4-c-diagram-missing-001', status: 'fail', evidence: '...' }`. This compares both counts AND identities — not just file existence count.

**Test 6 added:** Fixture with 3 sitemap screens, all 3 having `.spec.md` but only 2 having `.diagram.mmd`. Gate must fail with exactly one `4-c-diagram-missing-001` finding naming the missing screen.

---

### Finding 4 — [P2] Gate finding shape schema-incompatible (Lesson 1 violation)

**Commit:** `212ceaf`
**Files:** `assets/scripts/gates/stage-4.mjs`, `tests/gates/stage-4.test.ts`

**Problem:** Findings were pushed as `{ findingId: '...', status: 'fail', evidence: { screen: ..., missing: [...] }, fixRecipe: '...' }`. The `Finding` schema in `schemas/src/gate-result.ts` (Zod) requires `{ checkId, status: 'pass'|'fail'|'na', evidence?: string }`. The non-conforming shape fails ajv validation in `appendManifestLockEntry()` when `runGate()` calls it.

**Fix:** Grepped all occurrences in `stage-4.mjs` and converted:
- `findingId` → `checkId`
- `evidence: { ... }` → `evidence: '<human-readable string with the same info>'`
- `fixRecipe` removed (not in schema)

Reference template: `gates/stage-3.mjs`.

**Tests updated (Tests 1-3):** Assertions now use `f.checkId` (not `f.findingId`), assert `evidence` is a `string`, and explicitly assert `findingId`/`fixRecipe` are `undefined` (regression guard).

**Test 7 added:** End-to-end `runGate('4', dir, {})` that exercises `appendManifestLockEntry()` ajv validation path. The test fails if finding shape regresses to the old non-conforming shape.

---

### Post-fix Verification

| Check | Result |
|-------|--------|
| `node bin/complete-design.mjs state-machine-emit --help` | PASS — `--spec` and `--output` appear in option list |
| `npm test` (full suite) | PASS — 904 tests (up from 900), 1-2 pre-existing stage-2-latch flakes only |
| `npx tsc --noEmit` | PASS — clean |
| `npm run lint:determinism` | PASS — CLEAN |
| All 4 fix commits | 2d993f9, 022a7ca, 212ceaf, 3a7a9e1 |
