---
phase: "02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b"
plan: "04"
subsystem: "stage-5b-gate + systematize-lite-workflow + design-md-emit"
tags:
  - stage-5b
  - gate-stage-5b
  - dtcg-component-tier
  - design-md
  - evidence-inferred
  - frost-d44
  - systematize-lite
  - skill-md
  - tdd
  - d44
  - d51
  - d52
  - d53

dependency_graph:
  requires:
    - "02-03-SUMMARY.md (tokens-project.mjs DTCG emit, tokens.json YAML frontmatter format)"
    - "01-01-SUMMARY.md (design-md-validate.mjs validateDesignMd interface, AJV pattern)"
    - "01-02-SUMMARY.md (gate-result GateResult discriminated union, base.mjs pattern)"
  provides:
    - "assets/scripts/gates/stage-5b.mjs (Phase 1 skeleton replaced with real business logic)"
    - "skills/workflows/systematize.md (W7-lite Stage 5b-lite systematize workflow SKILL.md)"
    - "tests/gates/stage-5b-lite.test.ts (11 unit tests for gate-stage-5b.mjs)"
    - "tests/gates/systematize-emit.test.ts (33 tests for SKILL.md validity + integration)"
  affects:
    - "02-05 (e2e fixture: systematize workflow is the final stage in the v2.0a e2e chain)"
    - "Phase 3 (gate-stage-5b.mjs will be promoted from pass_with_warnings to pass when Frost ≥3× enforcement is added)"

tech_stack:
  added: []
  patterns:
    - "Gate-safe DESIGN.md validation: inline AJV against design-md schema (no process.exit — safe for gate use)"
    - "YAML frontmatter + JSON body parse in gate: gray-matter extracts frontmatter, JSON.parse extracts body"
    - "Component-tier count: filter keys in DTCG component group that don't start with '$'"
    - "Findings shape: checkId/status/evidence per GateResult schema; INFO = status:na, ERROR/BLOCKER = status:fail"
    - "pass_with_warnings always carries warnings: string[] (lesson 1 from codex review)"
    - "Stage 5b-lite has no separate atoms (workflow body direct, per RESEARCH.md §3)"
    - "All CLI invocations in SKILL.md use node bin/design-os.mjs (lesson 2 from codex reviews)"

key_files:
  created:
    - "assets/scripts/gates/stage-5b.mjs (replaced Phase 1 skeleton)"
    - "skills/workflows/systematize.md"
    - "tests/gates/stage-5b-lite.test.ts"
    - "tests/gates/systematize-emit.test.ts"
  modified:
    - "tests/gates/per-stage-skeletons.test.ts (removed stage-5b from skeleton loop; added smoke test)"

key-decisions:
  - "Gate-safe DESIGN.md validation: created inline AJV validator in stage-5b.mjs rather than calling validateDesignMd (which calls process.exit on error). Safe for gate use."
  - "Findings shape uses checkId/status/evidence per GateResult Finding schema. Severity info encoded in evidence text and status (na=INFO, fail=BLOCKER/WARNING/ERROR)."
  - "5b-frost-001 finding uses status:na (informational) to enforce D-44: Frost ≥3× is NOT a gate blocker in v2.0a."
  - "Stage 5b-lite has empty composition.atoms per RESEARCH.md §3: workflow body implements steps directly."
  - "Cross-cutting follow-up: variants-preview.md atom does NOT have the --variant CLI form bug; it uses import-and-call pattern. Clean — no fix needed."
  - "F-04: DESIGN.md emit test deferred to T-02-05-B e2e validation because emit logic is in SKILL.md procedure body, not a standalone export."

requirements-completed:
  - WF-07
  - MVPA-04
  - COST-06

duration: "~35 minutes"
completed: "2026-05-25"
---

# Phase 02 Plan 04: Systematize-Lite Workflow + Stage 5b Gate Business Logic + DESIGN.md Emit Summary

**Stage 5b gate filled with component-promotion + DESIGN.md schema enforcement (D-44 Frost ≥3× deferred as INFO-only); systematize-lite SKILL.md (W7-lite) with 13-step procedure, TRUST-05 intake, and host fallback; 44 new tests.**

## Performance

- **Duration:** ~35 minutes
- **Started:** 2026-05-25T16:48:00Z
- **Completed:** 2026-05-25T17:00:00Z
- **Tasks:** 2 (T-02-04-A + T-02-04-B)
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- **T-02-04-A (TDD):** `gate-stage-5b.mjs` filled in with real business logic — 7 behavior cases covering not_runnable, DESIGN.md absence (pass_with_warnings), schema failures (failed_after_repair), evidence:validated BLOCKER, component-tier counting, Frost INFO, and happy path.
- **T-02-04-B:** `skills/workflows/systematize.md` (W7-lite) ships with 13 numbered procedure steps, TRUST-05 intake (2 questions), --depth dispatch, correct CLI invocations, diff-by-default (D-52), and host fallback section (D-53).
- **D-44 honored:** Frost ≥3× is recorded as `5b-frost-001` finding with `status:na` (informational) — NOT enforced as a gate blocker. The frostNote is propagated to emitted DESIGN.md frontmatter for Phase 3 continuity.
- **D-51 enforced:** `evidence:INFERRED` is a BLOCKER check in both tokens.json (5b-evidence-001) and DESIGN.md (5b-evidence-002).
- **Codex review lessons applied:** `pass_with_warnings` carries `warnings: string[]`; CLI invocations use `node bin/design-os.mjs` not `cli/*.mjs` directly; findings use `checkId`/`status` shape.

## Task Commits

1. **T-02-04-A RED:** `4eb4cf4` (test(02-04): add RED phase — gate-stage-5b.mjs lite-mode tests)
2. **T-02-04-A GREEN:** `b731adf` (feat(02-04): implement gate-stage-5b.mjs lite-mode business logic)
3. **T-02-04-B:** `09a3841` (feat(02-04): systematize-lite workflow SKILL.md + emit tests)

## Files Created/Modified

- `/assets/scripts/gates/stage-5b.mjs` — Phase 1 skeleton replaced with real gate logic: tokens.json parse, component-tier count, DESIGN.md AJV validation, 5 finding IDs, buildResult() helper
- `/skills/workflows/systematize.md` — W7-lite, 13 steps, desc=140 chars, stage=5b, gate=gate/stage-5b-complete, TRUST-05 (2 questions), --depth dispatch, frostNote, evidence:INFERRED, ## Host fallback
- `/tests/gates/stage-5b-lite.test.ts` — 11 tests covering all 7 behavior cases + GateResult shape compliance
- `/tests/gates/systematize-emit.test.ts` — 33 tests: frontmatter validity, procedure body content (component scan, DESIGN.md emit, TRUST-05, --depth, CLI forms), gate integration (D-51 evidence enforcement)
- `/tests/gates/per-stage-skeletons.test.ts` (modified) — removed stage-5b from skeleton loop; added smoke test for exported function

## Decisions Made

- **Gate-safe AJV validation:** `validateDesignMd` from `design-md-validate.mjs` calls `process.exit(1)` on errors — unsafe for gate use. Created inline AJV validator with the same schema in `stage-5b.mjs`. This is the correct pattern for all gate-side validation.
- **Finding severity encoding:** The `Finding` schema uses `checkId`/`status`/`evidence`. Severity metadata (BLOCKER/ERROR/WARNING/INFO) is encoded in the `evidence` text and mapped to `status`: `na` for INFO (non-blocking), `fail` for ERROR/BLOCKER/WARNING. This matches the existing stage-1.mjs and stage-2.mjs pattern.
- **5b-frost-001 as `status:na`:** Per D-44, Frost ≥3× is informational only. Using `status:na` (not `status:fail`) ensures the gate does NOT block on component count. The finding is still surfaced in findings[] for Phase 3 promotion.
- **Empty composition.atoms:** Stage 5b-lite has no separate atoms per RESEARCH.md §3 ("No additional atoms: Stage 5b-lite is implemented directly in the workflow body"). The frontmatter carries `composition.atoms: []` — this is intentional, not a gap.
- **F-04 deferral documented:** DESIGN.md emit test is deferred to T-02-05-B e2e fixture because the emit logic is embedded in the SKILL.md procedure body, not a standalone scriptable export. The deferred rationale is documented in `systematize-emit.test.ts` header.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test regex for handoff-bundle CLI options failed on multi-line bash block**
- **Found during:** T-02-04-B (systematize-emit.test.ts first run)
- **Issue:** Test regex `/--from.*5a.*--to.*5b/i` expected options on the same line; the SKILL.md uses multi-line bash blocks where `--from` and `--to` appear on separate lines.
- **Fix:** Split regex into separate checks per option (`--from`, `--to`, `--design-dir`, `--body-file`) — each option is verified independently. The multi-line format is correct and consistent with style.md.
- **Files modified:** `tests/gates/systematize-emit.test.ts`
- **Commit:** `09a3841`

**2. [Rule 1 - Bug] Test for forbidden Stage 3/4 references matched legitimate disclaimer text**
- **Found during:** T-02-04-B (systematize-emit.test.ts first run)
- **Issue:** Test `/excalidraw/i` failed because the SKILL.md correctly says "No Stage 3 (Excalidraw)... artifacts are required" in its preamble — a legitimate disclaimer. The test was too broad.
- **Fix:** Narrowed regex to check for INVOCATIONS only (`import.*excalidraw`, `require.*excalidraw`, `@excalidraw`) rather than any mention. Disclaimer text is correct and intentional.
- **Files modified:** `tests/gates/systematize-emit.test.ts`
- **Commit:** `09a3841`

---

**Total deviations:** 2 auto-fixed (both Rule 1 — test logic bugs)
**Impact on plan:** Both fixes corrected test assertion logic — no code changes to gate or SKILL.md. Gate implementation and SKILL.md were correct from the start.

## Cross-cutting Follow-up (from Wave 4 brief)

**`skills/atoms/hifi/variants-preview.md` — `--variant` CLI bug check:**
Reviewed the atom. It does NOT use `node bin/design-os.mjs preview --variant` — it uses the import-and-call pattern directly (imports `spawnAndProbe` and `emitTokens` inline). The `--variant` form that was fixed in 02-03 codex review finding 3 only existed in `style.md` Step 7 (now fixed). `variants-preview.md` is clean. No fix needed.

## Known Stubs

None. The gate returns honest `pass_with_warnings evidence:proto` — this is the correct v2.0a terminal state, not a stub. The `frostNote` field is intentional per D-44.

## Threat Flags

No new threat surface introduced. All mitigations from the plan's STRIDE register applied:
- T-02-04-01 (DESIGN.md evidence field tampering): mitigated by 5b-evidence-002 BLOCKER in gate.
- T-02-04-02 (component count spoofing): accepted per D-44 — count is advisory INFO in v2.0a.
- T-02-04-03 (Frost ≥3× not enforced): accepted per D-44 — count recorded, deferral auditable via manifest.lock.

## TDD Gate Compliance

- RED gate commit: `4eb4cf4` (test(02-04): add RED phase)
- GREEN gate commit: `b731adf` (feat(02-04): implement gate-stage-5b.mjs lite-mode business logic)
- REFACTOR: not needed — implementation was clean from GREEN phase

Both required TDD gate commits are present in chronological order.

## Self-Check

Key files exist:
- FOUND: assets/scripts/gates/stage-5b.mjs
- FOUND: skills/workflows/systematize.md
- FOUND: tests/gates/stage-5b-lite.test.ts
- FOUND: tests/gates/systematize-emit.test.ts

Commits exist:
- FOUND: 4eb4cf4 (test: RED phase)
- FOUND: b731adf (feat: GREEN phase gate)
- FOUND: 09a3841 (feat: SKILL.md + emit tests)

Test count: 719 passing (678 baseline + 41 new)
lint-determinism: CLEAN
tsc --noEmit: clean
systematize.md description: 140 chars (≤200)

## Self-Check: PASSED

---

*Phase: 02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b*
*Completed: 2026-05-25*
