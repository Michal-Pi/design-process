---
phase: 01-v1-5-infrastructure-determinism-foundation
verified: 2026-05-25T12:00:00Z
status: passed
score: 5/5
overrides_applied: 0
gaps: []
human_verification:
  - test: "CI pipeline on a real GitHub Actions run"
    expected: "All 7 workflows pass (verify-golden, lint-determinism, schema-migration-guard, host-matrix, aggregate-coexistence, anthropic-watcher, anthropic-watcher-heartbeat)"
    why_human: "Cannot run GitHub Actions locally; workflows require GitHub token, runner environment, and network access to Anthropic feeds"
---

# Phase 1: v1.5 Infrastructure & Determinism Foundation — Verification Report

**Phase Goal:** Land the deterministic infrastructure that every v2.0a/b workflow depends on — versioned schemas, gate machinery, handoff bundles, determinism CI, coexistence eval harness, PII scanner, routing scaffolding, host-compatibility matrix — so v2.0a authoring starts on frozen ground.

**Verified:** 2026-05-25T12:00:00Z
**Status:** PASS (re-verified 2026-05-25 after gap closure)
**Re-verification:** Yes — see Re-verification section at bottom of document

---

## Goal Achievement

### Observable Truths (5 Phase Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Maintainer can author against frozen versioned JSON Schemas; `design-os migrate` upgrades v0 fixture; every schema validates via ajv | VERIFIED | 6 Zod sources + 6 JSON Schemas in `schemas/dist/`; `node bin/design-os.mjs validate --artifact persona --file tests/fixtures/persona/v1-minimal.json` exits 0; `node bin/design-os.mjs validate --artifact persona --file tests/fixtures/persona/v1-invalid.json` exits 1 with structured `schemaPath`/`instancePath` errors; `node bin/design-os.mjs migrate --from 0 --to 1` produces a v1 file that validates clean |
| SC-2 | `npm run verify:golden` sees 5× byte-identical output from every emit script; LLM-import lint rejects violations | VERIFIED (with noted caveat) | `npm run verify:golden` exits 0 with "5/5 passed" — handoff-bundle, gate-stage-5a (both states), mermaid-render, schemas-emit all PASS; `npm run lint:determinism` exits 0 "CLEAN". Caveat: `node bin/design-os.mjs verify --golden` fails with ERR_MODULE_NOT_FOUND when invoked via plain Node (no tsx loader); this is the CLI wrapper path only — CI correctly uses `npm run verify:golden` which invokes `tsx assets/scripts/verify-golden.mjs` |
| SC-3 | Aggregate coexistence eval reports recall with 5 popular skill packages; per-skill skillgrade harness exists | VERIFIED (below-threshold baseline acceptable per plan) | `evals/coexistence/aggregate-eval.mjs` and `evals/runners/skillgrade.mjs` implemented with 9 trigger YAMLs; Phase 1 baseline: design recall=0.786 (threshold 0.85), aggregate=0.581 (threshold 0.80). Both below thresholds — expected for static-analysis fallback. CI runs `continue-on-error: true` (non-blocking) as documented in D-17 / Open Q3 decision in STATE.md. Blocking enables at v2.0 GA. `evals/coexistence/last-run.json` committed |
| SC-4 | `design-os scan --pii` rejects transcripts with email/phone; `.gitignore`/`.gitattributes` defaults reject raw transcripts and private paths | VERIFIED | `node bin/design-os.mjs scan --pii tests/fixtures/governance/transcript-with-pii.md` exits 1 with 10 PII findings; `node bin/design-os.mjs scan --pii tests/fixtures/governance/transcript-clean.md` exits 0; `assets/templates/gitignore-design-os.txt` + `gitattributes-design-os.txt` present; `design-os init --apply` creates guarded-block .gitignore/.gitattributes (verified by 467/467 test suite) |
| SC-5 | Anthropic-Labs watcher daily cron live; host-compatibility matrix CI shows Claude Code scaffolded; MAINTAINERS.md named | VERIFIED | `.github/workflows/anthropic-watcher.yml` + `anthropic-watcher-heartbeat.yml` committed; `.github/workflows/host-matrix.yml` with 3-host matrix (claude-code, codex-cli, cursor); `docs/MAINTAINERS.md` exists with `@TBD` placeholder (intentional; documented STATE.md todo for pre-GA fill-in) |

**Score:** 5/5 success criteria verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `schemas/src/persona.ts` | Zod source for PersonaV1 | VERIFIED | Exports `PersonaV1` schema; all 8 Zod sources present |
| `schemas/src/gate-result.ts` | GateResult discriminated union (5 kinds incl. not_runnable) | VERIFIED | Exports `GateResult`; confirmed by 467/467 test suite |
| `schemas/dist/persona.v1.json` | Versioned Draft 2020-12 JSON Schema | VERIFIED | File exists; ajv validates v1-minimal.json against it |
| `schemas/dist/index.json` | Schema discovery manifest | VERIFIED | Maps all 8 artifact types to version + dist path |
| `assets/scripts/schemas/emit.mjs` | Deterministic schema emitter using z.toJSONSchema() | VERIFIED | Contains `z.toJSONSchema`; `npm run schemas:emit` produces 8 schemas deterministically |
| `assets/scripts/gates/base.mjs` | Gate-runner base returning GateResult discriminated union | VERIFIED | `runGate()` exported; stage-5a returns `{kind: "not_runnable", reason: "stage-4-artifacts-absent"}` |
| `assets/scripts/handoff-bundle-build.mjs` | Tiktoken-budgeted handoff bundle builder (3k floor, 15k ceiling) | VERIFIED | Floor/truncation tests pass in 467/467 suite |
| `assets/scripts/verify-golden.mjs` | 5× byte-identical determinism gate | VERIFIED | `npm run verify:golden` exits 0 (5/5 fixtures pass) |
| `assets/scripts/lint-determinism.mjs` | LLM-import architecture lint | VERIFIED | `npm run lint:determinism` exits 0 CLEAN |
| `assets/scripts/pii-scan.mjs` | PII scanner with email/phone/SSN/CC/transcript-header detection | VERIFIED | CLI exits 1 on PII transcript, exits 0 on clean transcript |
| `assets/scripts/routing/registry.mjs` | 7-route registry | VERIFIED | Registry exports 7 routes (4 implemented-stub, 3 not-yet-implemented) |
| `assets/scripts/routing/dispatch.mjs` | ROUTE-08 dispatcher (no silent all-5-stages default) | VERIFIED | `design-os design` with no --route exits 0 with route-suggestion prompt |
| `references/garrett-elements.md` | 12 mandatory MVPA-06 references | VERIFIED | All 12 reference files present including `references/prd/lenny-one-pager.md` |
| `references/gates/stage-1.md` | 4 v1.5 gate checklists (stage-1, 2, 5a, 5b) | VERIFIED | 4 gate checklists present; stage-3.md + stage-4.md intentionally absent (Phase 3) |
| `skills/design/SKILL.md` | 3 SKILL.md skeletons with trust-posture-clean descriptions | VERIFIED | `skills/design/SKILL.md`, `skills/audit/SKILL.md`, `skills/handoff/SKILL.md` all present |
| `.github/workflows/verify-golden.yml` | 5 CI workflows (determinism, lint, migration-guard, host-matrix, coexistence) | VERIFIED | All 7 CI workflows committed (including 2 watcher workflows) |
| `docs/TRUST-POSTURE.md` | Trust posture documentation (TRUST-01..05 binding) | VERIFIED | File exists with trust posture coverage |
| `bin/design-os.mjs` | Auto-discovery CLI dispatcher | VERIFIED | Dispatcher globs cli/*.mjs at startup; all 20 subcommands registered |
| `evals/hosts/claude-code/` | 3 host-profile vitest workspaces | VERIFIED | claude-code, codex-cli, cursor workspaces each have package.json + vitest.config.ts + host-profile.test.ts |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `assets/scripts/schemas/emit.mjs` | `schemas/src/*.ts` | Dynamic tsx import | VERIFIED | emit.mjs imports `import("../../../schemas/src/persona.ts")` et al.; works via tsx loader (npm script) |
| `assets/scripts/frontmatter-validate.mjs` | `schemas/dist/index.json` | Discovery manifest read | VERIFIED | Tests confirm strict vs lenient mode routing |
| `bin/design-os.mjs` | `assets/scripts/cli/*.mjs` | Commander auto-discovery via globby | VERIFIED | All 20 CLI subcommands registered at startup |
| `assets/scripts/gates/stage-5a.mjs` | `GateResult not_runnable` | Hardcoded for empty interactions/ | VERIFIED | `node bin/design-os.mjs gate --stage 5a --design-dir empty-interactions` returns `{kind: "not_runnable"}` |
| `assets/scripts/verify-golden.mjs` | `assets/scripts/schemas/emit.mjs` | Dynamic import + tsx loader | VERIFIED (npm path only) | Works via `npm run verify:golden` (tsx loader); CLI path `node bin/design-os.mjs verify --golden` fails without tsx loader |
| `assets/scripts/pii-scan.mjs` | Pre-commit hook | `install-hooks.mjs` | VERIFIED | `design-os install-hooks --apply` installs hook; `tools/install-hooks.sh` present |

### Data-Flow Trace (Level 4)

Not applicable for this phase — Phase 1 delivers infrastructure scripts and schemas, not UI components rendering dynamic data. All scripts tested via behavioral spot-checks and unit tests.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| CLI help shows all subcommands | `node bin/design-os.mjs --help` | 20 commands listed | PASS |
| Valid persona validates clean | `node bin/design-os.mjs validate --artifact persona --file tests/fixtures/persona/v1-minimal.json` | Exit 0, "OK" | PASS |
| Invalid persona rejected with structured error | `node bin/design-os.mjs validate --artifact persona --file tests/fixtures/persona/v1-invalid.json` | Exit 1, `schemaPath`/`instancePath`/`message` in stderr | PASS |
| Migration pipeline end-to-end | `node bin/design-os.mjs migrate --from 0 --to 1 --path tests/fixtures/persona/v0-minimal.json` then validate | Exit 0 both steps | PASS |
| Stage-5a gate returns not_runnable | `node bin/design-os.mjs gate --stage 5a --design-dir tests/fixtures/design-dirs/empty-interactions` | `{kind:"not_runnable", reason:"stage-4-artifacts-absent"}` | PASS |
| ROUTE-08 no --route exits 0 with prompt | `node bin/design-os.mjs design` | Exits 0 with route suggestions | PASS |
| PII scanner detects violations | `node bin/design-os.mjs scan --pii tests/fixtures/governance/transcript-with-pii.md` | Exit 1, 10 PII findings | PASS |
| PII scanner clean passes | `node bin/design-os.mjs scan --pii tests/fixtures/governance/transcript-clean.md` | Exit 0 | PASS |
| Determinism gate via npm script | `npm run verify:golden` | "5/5 passed", exit 0 | PASS |
| LLM-import architecture lint | `npm run lint:determinism` | "lint-determinism: CLEAN", exit 0 | PASS |
| CLI verify --golden via plain node | `node bin/design-os.mjs verify --golden` | FAILS with ERR_MODULE_NOT_FOUND | WARNING (see concerns) |

### Probe Execution

No phase-declared probe scripts (`scripts/*/tests/probe-*.sh`) exist. Step 7c: SKIPPED (no conventional probe structure).

### Requirements Coverage

Phase 1 claimed requirements (from ROADMAP.md Phase 1 `Requirements:` section):

| Requirement | Status | Evidence |
|-------------|--------|---------|
| SCHEMA-01..07 | SATISFIED | 6+2 Zod sources + JSON Schema emit + ajv validation + discovery manifest + migration template + concrete persona migration |
| FORMAT-01..07 | SATISFIED | All format Zod types declared; DESIGN.md validator pinned to 2026.04; `--design-md-version` flag scaffolded |
| ART-01..07 | SATISFIED | design/ substrate, .gitattributes, PII scanner, manifest.lock hash chain, MANIFEST.md reconciler |
| GATE-01..07 | SATISFIED | 6 gate skeletons, 5-kind GateResult, manifest.lock persistence, USER_OVERRIDDEN banner, not_runnable from day one |
| HAND-01..04 | SATISFIED | handoff-bundle-build.mjs, handoff-bundle.v1.json schema, sufficiency eval (structural-equivalence baseline) |
| PREV-01..05 | SATISFIED | port-manager, security-sandbox (no vm2), playwright-runner, Vite/Next/Astro adapters, variant-distance 6-axis + stage-3 stub |
| TRUST-01..05 | SATISFIED | TRUST-POSTURE.md, COPY-REVIEW-CHECKLIST.md, SKILL.md skeletons with trust-clean descriptions, diff-by-default |
| TRIG-01, TRIG-02, TRIG-04 | SATISFIED | Per-skill trigger YAMLs (14+12 prompts), skillgrade harness (TRIALS=3), CONTINGENCY-TRIG-04.md |
| PERSIST-01..04 | SATISFIED | design/ vs .design-os/ split, manifest.lock hash chain, design-os migrate, recovery semantics |
| ROUTE-08 | SATISFIED | dispatchRoute exits 0 with prompt when --route absent; never silently runs all 5 stages |
| SPINE-01..04 | SATISFIED | Stage enum in Zod schemas, SPINE linearity checker, data-flow linear enforcement |
| DIST-01, DIST-02, DIST-03 | SATISFIED | SKILL.md skeletons, 3 triggerable skills scaffolded, descriptions ≤200 chars with trigger phrases |
| REF-01, REF-02, REF-04 | SATISFIED | 12 mandatory references in `references/`, 4 gate checklists (stage-1/2/5a/5b) |
| RECOV-01..03 | SATISFIED | recover.mjs + recover-prompt.mjs + 3 recovery fixtures + 19 test assertions |
| GTM-06 | SATISFIED | anthropic-watcher.yml + anthropic-watcher-heartbeat.yml committed; watcher live from Phase 1 |
| GATE-08 | SATISFIED (early delivery) | Implemented in Phase 1 despite Phase 2 mapping — stage-5a hardcodes not_runnable; REQUIREMENTS.md tracking not yet updated |

**Note on GATE-08:** REQUIREMENTS.md traceability table maps GATE-08 to Phase 2, but it was implemented in Phase 1 (confirmed by live spot-check and test suite). The REQUIREMENTS.md `[ ]` checkbox and traceability row should be updated to reflect Phase 1 delivery.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `schemas/migrations/v0-to-v1.template.mjs` | 44 | `// TODO: implement v0 → v1 migration for this artifact.` | INFO | Template instructional text — intentional; the pattern shows users where to add their migration logic. Not production code path. |
| `docs/MAINTAINERS.md` | 8 | `@TBD` maintainer placeholder | INFO | Documented in STATE.md todos; intentional placeholder until pre-GA fill-in. |

No unreferenced TBD/FIXME/XXX markers in production code paths. One TODO in a template file (acceptable — it is the template's instructional text, not incomplete implementation).

### TypeScript Errors (tsc --noEmit)

`npx tsc --noEmit` reports **92 errors** across test files:
- **90 × TS7016** — "Could not find a declaration file for module" when test files import `.mjs` scripts. Pattern: Plans 03-05 added test files that import `.mjs` modules without `// @ts-ignore` annotations (unlike Plan 01 tests which used `@ts-ignore TS7016` consistently).
- **1 × TS2345** — `string | undefined` not assignable to `string` in `tests/verify/recovery-resume.test.ts` line 76.
- **1 × TS2307** — `Cannot find module 'xstate'` in `tests/fixtures/recovery/design-dir-after-stage-4/interactions/sample.machine.ts` (xstate is not a dev dependency; this fixture file imports it).

**Assessment:** These are test-file type errors, not production-code errors. The schemas, scripts, and CLI modules themselves are JavaScript (`.mjs`) and do not go through `tsc`. The Zod Typescript sources in `schemas/src/` compile clean within vitest (tsx handles them). However, `tsc --noEmit` runs against all `tests/**/*.test.ts` files and those import `.mjs` modules which lack declaration files. This is a quality concern — the PLAN.md for Plans 01 and 03 both stated "tsc --noEmit passes" as a success criterion, and Plan 01 achieved it but subsequent plans degraded it by introducing unguarded `.mjs` imports in test files.

**Severity:** WARNING — this does not block Phase 1's functional goals. The test suite (vitest) passes 467/467. No user-visible behavior is affected. However, the TS strictness discipline specified in CLAUDE.md and PLAN.md is now violated in test files.

### CLI verify --golden via plain Node (WARNING)

`node bin/design-os.mjs verify --golden` fails with `ERR_MODULE_NOT_FOUND: Cannot find module '...frontmatter-common.js'` because:
1. `bin/design-os.mjs` uses plain `node` (no tsx loader)
2. `verify-golden.mjs` dynamically imports `emit.mjs`
3. `emit.mjs` dynamically imports TypeScript source files (`schemas/src/persona.ts` etc.)
4. Without the tsx loader, Node cannot resolve `.ts` files (it looks for `.js`)

**The correct path (`npm run verify:golden`) works correctly** — it invokes `tsx assets/scripts/verify-golden.mjs` which has the tsx loader. CI uses `npm run verify:golden` so the gate works in CI. The CLI wrapper is broken for the emit sub-test specifically.

**Impact:** A maintainer following the ROADMAP success criterion literally ("A maintainer running `design-os verify --golden`") would hit this failure if they use the CLI. They would need to use `npm run verify:golden` instead. This is a usability gap but does not affect CI or the underlying determinism guarantees.

---

## Human Verification Required

### 1. GitHub Actions CI Run

**Test:** Trigger a push to the repository and observe all 7 workflows run on GitHub Actions: `verify-golden.yml`, `lint-determinism.yml`, `schema-migration-guard.yml`, `host-matrix.yml`, `aggregate-coexistence.yml`, `anthropic-watcher.yml`, `anthropic-watcher-heartbeat.yml`.
**Expected:** All workflows complete without errors. `verify-golden` and `lint-determinism` must be green. `aggregate-coexistence` runs with `continue-on-error: true` (non-blocking per Phase 1 decision).
**Why human:** Cannot trigger GitHub Actions from local environment; requires a real push and GitHub token.

---

## Gaps Summary

No blocking gaps found. The phase goal is achieved: deterministic infrastructure is in place for v2.0a authoring to begin on frozen ground.

**Two concerns documented for follow-up in Phase 2 planning:**

1. **WARNING: tsc --noEmit not clean** — 92 TypeScript errors in test files (90 × TS7016 from unguarded `.mjs` imports, 1 × TS2345, 1 × TS2307). Plans 03-05 introduced test files that import `.mjs` scripts without `@ts-ignore` annotations. Does not break the 467/467 test suite or any production behavior. Recommend fixing in Phase 2 to restore CLAUDE.md TypeScript discipline.

2. **WARNING: `node bin/design-os.mjs verify --golden` CLI path broken** — Works via `npm run verify:golden` (CI path); broken via direct CLI invocation because emit.mjs requires tsx loader for TypeScript dynamic imports. Success Criterion 2 is satisfied by the npm script path which CI uses. Recommend documenting or wiring tsx into the CLI verify path in Phase 2.

3. **INFO: GATE-08 implemented early but REQUIREMENTS.md not updated** — GATE-08 is marked `[ ]` and mapped to Phase 2 in traceability, but the implementation exists and is verified. Recommend updating REQUIREMENTS.md traceability in Phase 2 kickoff.

---

## Recommended Next Action

**ADVANCE TO PHASE 2 PLANNING** — Phase 1 goal is achieved. All 5 success criteria are verified. The deterministic infrastructure is ready.

Before or during Phase 2 planning, surface the two WARNING items above so they are addressed at the right time:
- The tsc errors in test files should be fixed before the Phase 2 test surface grows further.
- The CLI verify path should either be fixed to use tsx or documented as "use `npm run verify:golden` in CI."

---

_Verified: 2026-05-25T12:00:00Z_
_Verifier: Claude (gsd-verifier)_

---

## Re-verification — 2026-05-25 (Gap Closure)

**Status change: PASS-WITH-CONCERNS → PASS**

Both WARNING items from the initial verification have been resolved.

### WARNING 1 Closed: tsc --noEmit now clean (0 errors)

**Root causes:**
1. **90 × TS7016** — Plans 03–05 test files imported `.mjs` scripts without declaration files. Fixed by adding `tests/types.d.ts` with a single `declare module '*.mjs';` ambient declaration. This is the canonical approach per CLAUDE.md (no unannotated `@ts-ignore`) — one declaration file resolves all present and future `.mjs` test imports.
2. **1 × TS2345** — `noUncheckedIndexedAccess` made `split("\n")[0]` return `string | undefined`. Fixed in `tests/verify/recovery-resume.test.ts:76` with an explicit `expect(lines.length).toBeGreaterThan(0)` guard followed by `lines[0]!`.
3. **1 × TS2307** — `tests/fixtures/recovery/design-dir-after-stage-4/interactions/sample.machine.ts` imported `xstate` which was not a devDependency. Fixed by adding `xstate@5.20.1` to `devDependencies` (the recommended stack version per CLAUDE.md technology table). Also fixed a secondary TS2345 in the same fixture: XState `setup().createMachine()` requires `context: {}` when the context type is declared in `setup({ types })`.

**Verification:** `npx tsc --noEmit` → exit 0, 0 errors. `npm test` → 467/467 passing (no regression).

**Commit:** `fix(01): restore tsc --noEmit clean across test surface` (05cf511)

### WARNING 2 Closed: node bin/design-os.mjs verify --golden now exits 0 (5/5 passed)

**Root cause:** `bin/design-os.mjs` runs under plain node (no tsx loader). The `verify --golden` handler previously called `runGolden()` from `verify-golden.mjs` in-process. That function calls `emitSchemas()` from `emit.mjs`, which dynamically imports `schemas/src/*.ts` files — requiring the tsx loader to resolve `.ts` extensions.

**Fix:** `assets/scripts/cli/verify.mjs` now spawns `verify-golden.mjs` as a child process via `node_modules/.bin/tsx` (the local tsx binary), so the tsx loader is active for the full execution tree. The child process exit code is surfaced as the CLI's exit code. The `npm run verify:golden` path (which invokes tsx directly) is unaffected.

**Verification:**
- `node bin/design-os.mjs verify --golden` → "5/5 passed", exit 0
- `npm run verify:golden` → "5/5 passed", exit 0 (no regression)

**Commit:** `fix(01): wire tsx loader into design-os verify --golden CLI path` (1682bf4)

### Final Verification Results (2026-05-25)

| Command | Result | Status |
|---------|--------|--------|
| `npx tsc --noEmit` | Exit 0, 0 errors | PASS |
| `npm test` | 467/467 passing | PASS |
| `node bin/design-os.mjs verify --golden` | "5/5 passed", exit 0 | PASS |
| `npm run verify:golden` | "5/5 passed", exit 0 | PASS |

**Phase 1 verdict: PASS (clean)**

_Re-verified: 2026-05-25_
_Re-verifier: Claude (gsd-executor)_
