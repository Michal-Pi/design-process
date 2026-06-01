---
phase: 04-v2-0-rc-ga-acceptance-cross-host-launch
plan: "02"
subsystem: release-gate + axe-runner
tags:
  - release-engineering
  - acceptance-gate
  - accessibility-gate
  - tdd
  - wcag
dependency_graph:
  requires:
    - 04-01 (evals/acceptance/fixtures.manifest.json)
    - Phase 2 (culori 4.x, Playwright)
    - Phase 3 (runGate(), runAuditAllStages(), stage-3-pr.mjs, stage-4 codex fix e56a016)
  provides:
    - assets/scripts/release-gate.mjs (ACCEPT-01, COST-07, COST-10 orchestrator)
    - assets/scripts/cli/release-gate.mjs (CLI surface)
    - assets/scripts/axe-runner.mjs (ACCEPT-09, D-78 gate)
    - assets/scripts/cli/axe-runner.mjs (CLI surface)
    - schemas/dist/release-gate-result.v1.json (ajv validation schema)
    - .github/workflows/release-gate.yml (CI enforcement)
  affects:
    - 04-03 (cross-host parity uses release-gate output as baseline)
tech_stack:
  added:
    - axe-core ^4.11.0 (devDependency — WCAG AA contrast checking)
    - "@playwright/test" ^1.52.0 (devDependency — headless Chromium for axe-runner)
  patterns:
    - TDD RED/GREEN cycle (5 commits: T1-RED, T1-GREEN, T1-schema, T2-RED, T2-GREEN+CI)
    - INVARIANTS.md Lessons 1-7 upheld (gate result shape, CLI shape, staged path, ajv, identity, real surfaces, path containment)
    - Discriminated hard/soft gate separation (exit 1 ONLY for hard gates, AFTER writeFile)
    - Sequential Playwright browser instances per fixture (no shared instance — test isolation)
key_files:
  created:
    - assets/scripts/release-gate.mjs
    - assets/scripts/cli/release-gate.mjs
    - assets/scripts/axe-runner.mjs
    - assets/scripts/cli/axe-runner.mjs
    - schemas/src/release-gate-result.ts
    - schemas/dist/release-gate-result.v1.json
    - RELEASE-NOTES.md
    - .github/workflows/release-gate.yml
    - tests/release-gate/release-gate.test.ts
    - tests/axe-runner/axe-runner.test.ts
  modified:
    - assets/scripts/schemas/emit.mjs (added release-gate-result schema to pipeline)
    - schemas/dist/index.json (auto-updated by emit)
    - package.json (added axe-core + @playwright/test devDependencies)
    - package-lock.json
decisions:
  - "ACCEPT-06 uses inline mkdtemp fixture: 3 routes, 2 specs (→ 4-pr-spec-missing-001), 2 wireframe/CHOICE.md (→ 3-pr-choice-001). No permanent on-disk SC-5 fixture."
  - "Stage 2/3 wireframe gap findingId is '3-pr-choice-001' from stage-3-pr.mjs (NOT a '2-pr-*' pattern — stage-2-pr.mjs does not exist; wireframe coverage is Stage 3 PR detector's responsibility)"
  - "Hard gate exit happens AFTER writeFile(release-gate-results.json) per plan control flow — partial results always available for post-mortem"
  - "writeReleaseNotesDisclosure() called unconditionally regardless of hard gate outcome (T-04-02-05)"
  - "Sequential-fallback wall-clock caveat always written to RELEASE-NOTES.md regardless of CLAUDE_CODE_BIN state (P8 trust posture)"
  - "@playwright/test added as devDependency alongside axe-core — Playwright is required for headless Chromium, listed in CLAUDE.md tech stack, was not yet installed"
  - "div font-size uses 1rem (not 16px) to avoid false positives in test assertions for dimension token skip verification"
metrics:
  duration: "~75 minutes"
  completed_date: "2026-05-31"
  tasks_completed: 2
  files_created: 10
  files_modified: 4
  tests_added: 36
---

# Phase 4 Plan 02: release-gate.mjs Orchestrator + axe-runner.mjs WCAG Gate Summary

**One-liner:** release-gate.mjs 6-phase orchestrator (p50/p95 cost gate, ACCEPT-05/06 checks, ajv validation, hard/soft gate separation with RELEASE-NOTES.md disclosure) + axe-runner.mjs WCAG 2.2 AA contrast gate (OKLCH→hex via culori, Playwright+axe-core injection, passingFixtures/failingFixtures identity per Lesson 5) + release-gate.yml CI workflow.

## What Was Built

### Task 1: release-gate.mjs + CLI + Schema (TDD RED/GREEN/schema)

**Core orchestrator** (`assets/scripts/release-gate.mjs`):

Exported functions:
- `computePercentile(values, pct)` — floor-index percentile; throws on empty array
- `computeFixturePass(gateResults)` — ALL 6 gates must be pass/pass_with_warnings (Pitfall 1)
- `computeHardGate({ fixturePassCount, p50Tokens })` — both ACCEPT-01 + COST-07 checks
- `computeSoftGateDisclosures({ p95Tokens, wallClockP50Ms })` — p95>286000 or wallClock>624000
- `writeReleaseNotesDisclosure(findings, notesPath?)` — appends cost behavior block, always called
- `runReleaseGate(opts)` — 6-phase orchestrator (see control flow below)

**Control flow** (critical ordering from plan notes):
1. Phase 1: load manifest + path-traversal check (Lesson 7)
2. Phase 2: run each fixture — create stagingDir → dispatch → runGate all 6 stages → cleanup
3. Phase 3: compute p50/p95/wallClockP50 via computePercentile
4. Phase 4: compute hardGatePassed — DO NOT exit yet
5. Phase 5: compute softGateDisclosures → writeReleaseNotesDisclosure (unconditional)
6. Phase 6: runAccept05 (spawn vitest on fid-06) + runAccept06 (inline tmp fixture)
7. ajv-validate result BEFORE writeFile (Lesson 4 / T-04-02-02)
8. writeFile release-gate-results.json
9. IF !hardGatePassed: process.exit(1)

**ACCEPT-06 inline fixture** (no permanent on-disk fixture):
- mkdtemp(join(tmpdir(), 'accept06-'))
- 3 routes in sitemap: /checkout, /profile, /settings
- 2/3 spec files (omit /settings → `4-pr-spec-missing-001`)
- 2/3 wireframe/CHOICE.md (omit /settings → `3-pr-choice-001`)
- Asserts both findingIds; try/finally cleans up tmpDir

**CLI wrapper** (`assets/scripts/cli/release-gate.mjs`):
Commander flags: `--fixtures-dir`, `--output`, `--host`, `--dry-run`

**Zod schema** (`schemas/src/release-gate-result.ts`):
ReleaseGateResult with fixtureResults[], fixturePassCount, passingFixtureIds[], failingFixtureIds[], p50Tokens, p95Tokens, wallClockP50Ms, hardGatePassed, hardGateReason, softGateDisclosures[], accept05Pass, accept06Pass.

**RELEASE-NOTES.md**: Stub created; `writeReleaseNotesDisclosure` appends at run time.

### Task 2: axe-runner.mjs + CLI + CI Workflow (TDD RED/GREEN)

**Core runner** (`assets/scripts/axe-runner.mjs`):

Exported functions:
- `buildTokenScaffold(tokens)` — DTCG tokens → HTML with CSS custom properties + colored divs
- `buildAxeRunnerResult(results)` — builds `{ pass, fixtureCount, passingFixtures, failingFixtures }` (Lesson 5)
- `runAxeOnFixture(fixtureDir)` — Playwright chromium + axe.source injection, wcag2aa rules, color-contrast filter
- `runAxeRunner(opts)` — sequential 15-fixture run, exit 1 if ANY fails (D-78)

**Token scaffold**:
- Recursive DTCG walk via `collectColorTokens(tokens, prefix)`
- `culoriParse(oklch) + formatHex()` for OKLCH→hex conversion
- Skips tokens where parse returns undefined (defensive)
- Skips non-color $type tokens
- CSS custom properties in `:root { --token-<path>: <hex>; }`
- Colored divs: `background-color: var(--token-path); color: #000; padding: 0.5rem`

**axe-core injection pattern**:
- `require.resolve('axe-core')` → read source via `fs.readFileSync`
- `page.addScriptTag({ content: axeSource })`
- `page.evaluate(async () => window.axe.run({ runOnly: { type: 'tag', values: ['wcag2aa'] } }))`
- Filter violations for `id === 'color-contrast'`
- Browser closed after EACH fixture (no shared instance)

**CLI wrapper** (`assets/scripts/cli/axe-runner.mjs`):
Commander flags: `--fixtures-dir`, `--output`, `--fail-fast`

**CI workflow** (`.github/workflows/release-gate.yml`):
- Triggers: workflow_dispatch, push to v* tags, push to main with skills/evals/scripts changes
- Steps: checkout → Node 22 → npm ci → playwright install chromium → schemas:emit → adversarial corpora → axe-runner → release-gate (dry-run) → upload artifacts
- Zero `continue-on-error: true` entries

## Verification Results

```
node bin/complete-design.mjs release-gate --help
  PASS: shows 15-fixture + fixtures-dir + dry-run + host options

node bin/complete-design.mjs axe-runner --help
  PASS: shows contrast in description + fixtures-dir + output + fail-fast

npx vitest run tests/release-gate/release-gate.test.ts
  Test Files: 1 passed | Tests: 26 passed

npx vitest run tests/axe-runner/axe-runner.test.ts
  Test Files: 1 passed | Tests: 10 passed

schemas/dist/release-gate-result.v1.json: FOUND, contains "fixturePassCount"

grep -c "passingFixtures|failingFixtures" assets/scripts/axe-runner.mjs → 12 (≥2 ✓)
grep -c "continue-on-error" .github/workflows/release-gate.yml → 0 ✓

lint:determinism: CLEAN
tsc --noEmit: CLEAN (exit 0)

Full test suite: 1 failed (pre-existing stage-2-latch flake) | 92 passed (93)
Tests: 1 failed (pre-existing timeout) | 1349 passed (1350)
Test delta: 1312 → 1349 (+37: 26 release-gate + 10 axe-runner + 1 misc)
```

## Commits

| Commit | Type | Message |
|--------|------|---------|
| 0ee031e | test(04-02) | add failing release-gate unit tests (percentile, gate counting) [RED] |
| 9a16f47 | feat(04-02) | implement release-gate.mjs orchestrator + CLI wrapper [GREEN] |
| 7c41bd7 | feat(04-02) | add release-gate-result Zod schema + JSON Schema emit [schema] |
| de21599 | test(04-02) | add failing axe-runner unit tests (buildTokenScaffold, contrast violations) [RED] |
| ffa41f6 | feat(04-02) | implement axe-runner.mjs + CLI wrapper + release-gate.yml [GREEN] |

## TDD Gate Compliance

**Task 1:**
- RED gate (`0ee031e`): test file only — `assets/scripts/release-gate.mjs` absent in diff → all 26 tests fail with "Failed to load url"
- GREEN gate (`9a16f47`): implementation lands → all 26 tests pass
- SCHEMA commit (`7c41bd7`): Zod schema + JSON emit separate from impl commit

**Task 2:**
- RED gate (`de21599`): test file only — `assets/scripts/axe-runner.mjs` absent → all 10 tests fail with "Failed to load url"
- GREEN gate (`ffa41f6`): implementation + CLI + CI workflow → all 10 tests pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @playwright/test not installed; plan requires Playwright for axe-runner**
- **Found during:** Task 2 implementation (axe-runner requires browser for axe-core injection)
- **Issue:** `@playwright/test` not in package.json devDependencies; Playwright not installable without adding it. The plan specifies `page.addScriptTag({ content: axeSource })` which requires Playwright.
- **Fix:** Added `@playwright/test ^1.52.0` as devDependency alongside `axe-core ^4.11.0`. Playwright is explicitly in CLAUDE.md tech stack (§Playwright 1.60.x). The plan constraint "only axe-core ^4.11.x" refers to axe-core as the new functional dep; Playwright was already planned as a required tool.
- **Files modified:** `package.json`, `package-lock.json`

**2. [Rule 1 - Bug] Stage 2 gap findingId is '3-pr-choice-001' not '2-pr-*'**
- **Found during:** Task 1 ACCEPT-06 implementation (reading stage-3-pr.mjs + all-stages.mjs)
- **Issue:** The plan's ACCEPT-06 assertion `findings.some(f => f.checkId?.startsWith('2-pr-'))` would NEVER match. There is no `stage-2-pr.mjs` in the codebase. The wireframe/CHOICE.md coverage check is implemented in `stage-3-pr.mjs` which emits `findingId: '3-pr-choice-001'`. The all-stages.mjs calls `detectStage3PrIssues` for this check.
- **Fix:** ACCEPT-06 asserts `f.findingId === '3-pr-choice-001'` (actual value from stage-3-pr.mjs) instead of `f.checkId?.startsWith('2-pr-')` (plan's incorrect fuzzy match).
- **Files modified:** `assets/scripts/release-gate.mjs` (runAccept06 function)

**3. [Rule 1 - Bug] div font-size: 16px clashed with dimension token test assertion**
- **Found during:** Task 2 GREEN phase (test `skips non-color tokens ($type !== color)` failed)
- **Issue:** buildTokenScaffold divs used `font-size: 16px` which matched the spacing dimension token test's `$value: '16px'` causing `expect(html).not.toContain('16px')` to fail.
- **Fix:** Changed div styling to `font-size: 1rem` (rem units instead of px) so `16px` no longer appears in the scaffold HTML.
- **Files modified:** `assets/scripts/axe-runner.mjs`

## Known Stubs

None. All functions are fully implemented. RELEASE-NOTES.md is an intentional stub — it's designed to be populated at run time by `writeReleaseNotesDisclosure()`.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: path-traversal | assets/scripts/release-gate.mjs | --fixtures-dir is user-controlled; mitigated via path.resolve() + relative() containment check |
| threat_flag: path-traversal | assets/scripts/axe-runner.mjs | --fixtures-dir is user-controlled; same mitigation pattern |

(Both mitigations implemented per T-04-02-06 in plan threat register. No new unmitigated surfaces.)

## Self-Check: PASSED

Files confirmed:
- `assets/scripts/release-gate.mjs` — FOUND
- `assets/scripts/cli/release-gate.mjs` — FOUND
- `assets/scripts/axe-runner.mjs` — FOUND
- `assets/scripts/cli/axe-runner.mjs` — FOUND
- `schemas/src/release-gate-result.ts` — FOUND
- `schemas/dist/release-gate-result.v1.json` — FOUND (contains fixturePassCount)
- `RELEASE-NOTES.md` — FOUND
- `.github/workflows/release-gate.yml` — FOUND (0 continue-on-error)
- `tests/release-gate/release-gate.test.ts` — FOUND (26 tests)
- `tests/axe-runner/axe-runner.test.ts` — FOUND (10 tests)

Commits confirmed:
- `0ee031e` — test(04-02): add failing release-gate unit tests [RED]
- `9a16f47` — feat(04-02): implement release-gate.mjs orchestrator + CLI wrapper [GREEN]
- `7c41bd7` — feat(04-02): add release-gate-result Zod schema + JSON Schema emit [schema]
- `de21599` — test(04-02): add failing axe-runner unit tests [RED]
- `ffa41f6` — feat(04-02): implement axe-runner.mjs + CLI wrapper + release-gate.yml [GREEN]
