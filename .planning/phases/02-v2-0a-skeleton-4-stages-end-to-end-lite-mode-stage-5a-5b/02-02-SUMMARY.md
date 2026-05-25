---
phase: "02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b"
plan: "02"
subsystem: "stage-2-gate + structure-workflow + ia-atoms + sitemap-structural-distance"
tags:
  - stage-2-gate
  - fid-02
  - latch-diversity
  - sitemap-structural-distance
  - skill-md
  - tdd
  - jtbd-coverage
  - mermaid-validity
dependency_graph:
  requires:
    - "02-01-SUMMARY.md (stage-1 gate, discover workflow, worst-provenance pattern)"
    - "01-02-SUMMARY.md (gate runner base.mjs, stage-2.mjs skeleton)"
    - "01-05-SUMMARY.md (variant-distance.mjs, mermaid-render.mjs)"
  provides:
    - "assets/scripts/gates/stage-2.mjs (real business logic: JTBD coverage, FID-02, orphan, Mermaid)"
    - "assets/scripts/preview/variant-distance.mjs (extended with sitemapStructuralDistance)"
    - "skills/workflows/structure.md (W2 structure workflow SKILL.md)"
    - "skills/atoms/ia/sitemap-variants.md (ATOM-05)"
    - "skills/atoms/ia/flows-from-jobs.md (ATOM-06)"
    - "evals/bundles/fixtures/stage-2-to-5a/ (F-05 bundle fixture)"
  affects:
    - "02-03 through 02-05 (all Phase 2 plans consume stage-2 gate)"
    - "evals/bundles/ (6th fixture added to sufficiency eval)"
tech_stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle for gate business logic (same pattern as 02-01)"
    - "YAML-frontmatter hybrid upstream fixture (same pattern as stage-1-to-2)"
    - "sitemapStructuralDistance: scheme(0.5) + count-ratio(0.25) + Jaccard(0.25)"
    - "FID-02 split into 2-fidelity-001 (color) and 2-fidelity-002 (font) for distinct checkIds"
    - "Mermaid validity via renderMermaidFile() with tmpdir output + error capture"
key_files:
  created:
    - "assets/scripts/gates/stage-2.mjs (real implementation, Phase 1 skeleton replaced)"
    - "tests/gates/stage-2-latch.test.ts (12 tests covering all gate behaviors)"
    - "tests/ia/sitemap-structural-distance.test.ts (9 tests covering distance edge cases)"
    - "tests/fixtures/stage2-gate/ (7 fixture scenarios)"
    - "skills/workflows/structure.md (W2 workflow SKILL.md)"
    - "skills/atoms/ia/sitemap-variants.md (ATOM-05)"
    - "skills/atoms/ia/flows-from-jobs.md (ATOM-06)"
    - "evals/bundles/fixtures/stage-2-to-5a/bundle.md (F-05 stage-2-to-5a bundle)"
    - "evals/bundles/fixtures/stage-2-to-5a/upstream/sitemap.json (representative sitemap)"
  modified:
    - "assets/scripts/preview/variant-distance.mjs (sitemapStructuralDistance added)"
    - "tests/gates/per-stage-skeletons.test.ts (stage-2 moved from skeletons to real-gate section)"
    - "tests/handoff/sufficiency-structural.test.ts (fixture count 5→6)"
decisions:
  - "schemePenalty weight 0.5 (not 0.4) — ensures different LATCH schemes alone yield ≥0.5 diversity score (test-driven)"
  - "FID-02 split into two checkIds: 2-fidelity-001 (color-class) and 2-fidelity-002 (font-class)"
  - "Stage-2-to-5a fixture uses YAML-frontmatter hybrid format (same as stage-1-to-2) so sufficiency-structural.mjs can read provenance"
  - "per-stage-skeletons.test.ts: stage-2 removed from skeleton list, smoke test added (same pattern as stage-1 in Plan 02-01)"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-05-25"
  tasks: 2
  files_created: 9
  files_modified: 4
  tests_added: 27
  tests_total: 632
---

# Phase 02 Plan 02: Stage 2 Gate Business Logic + Structure Workflow SKILL.md + Sitemap Structural Distance Summary

**One-liner:** Stage 2 FID-02 color/font rejection enforced deterministically via gate-stage-2.mjs — returns failed_after_repair (BLOCKER) on any styling field in sitemap nodes, pass_with_warnings/proto on valid LATCH-diverse sitemaps with Mermaid flows, and sitemapStructuralDistance scoring ensures 2-5 generated variants maintain ≥0.5 diversity before user selection.

## What Was Built

### T-02-02-A: gate-stage-2.mjs + sitemapStructuralDistance (TDD)

**RED phase** (commit `c2b40b5`): 21 failing tests across two test files + 7 fixture scenarios.

**GREEN phase** (commit `ab1b9db`): Full implementation.

**gate-stage-2.mjs** replaces the Phase 1 skeleton with:

1. `not_runnable` when `ia/sitemap.json` is absent (reason: `no-sitemap-found`)
2. **FID-02 check**: walks all variant nodes for styling fields
   - `2-fidelity-001`: color, backgroundColor, fill, stroke, style fields → `failed_after_repair`
   - `2-fidelity-002`: font, fontFamily, fontSize, fontWeight fields → `failed_after_repair`
   - Any FID-02 BLOCKER immediately returns `failed_after_repair` with `reason: 'fidelity-cap-violation'`
3. **JTBD coverage**: reads `artifactsInventory` from `.handoff/stage-1-bundle.md`; extracts `research/jobs/*.jtbd.md` slugs; checks each slug appears in ≥1 node label (case-insensitive substring match). Missing → finding `2-coverage-001` (fail)
4. **Orphan node check**: detects nodes with no parent and no children (excluding root). Algorithm: nodesWithParent set, nodesPointedAt set, natural root = first node without parent that IS pointed at. Orphans → finding `2-orphan-001` (fail)
5. **Mermaid validity**: globs `ia/flows/*.flow.mmd`; calls `renderMermaidFile()` for each; treats any render error as `failed_after_repair` with finding `2-mermaid-001`
6. **pass_with_warnings** (evidence: `proto`) when all checks pass; always includes tree-test warning (no VALIDATED grade in v2.0a)

**sitemapStructuralDistance** added to `variant-distance.mjs`:
- `schemePenalty`: 0.5 when schemes differ, 0.0 when same
- `countPenalty`: 0.25 × (|countA - countB| / max(countA, countB, 1))
- `labelPenalty`: 0.25 × Jaccard distance of top-level label sets
- Different LATCH schemes alone → ≥0.5 (covers the "same labels, different scheme" case)
- Identical sitemaps → 0.0

All 21 tests pass. lint-determinism CLEAN on gates/. tsc clean.

### T-02-02-B: Structure workflow + IA atoms + stage-2-to-5a fixture

**skills/workflows/structure.md** (W2 structure workflow):
- Frontmatter valid; description 124 chars (≤200); stage:2; gate:gate/stage-2-complete
- 13 numbered procedure steps including: handoff bundle read, LATCH reference load,
  budget pre-check with absent-script fallback (F-09), depth dispatch (F-07),
  TRUST-05 intake (3 questions, standard/full only), ATOM-05 sitemap generation,
  required user selection checkpoint, preview staging (D-52), ATOM-06 Mermaid generation,
  2-cycle repair loop, gate invocation via `node bin/design-os.mjs gate --stage 2`,
  handoff bundle build, manifest reconcile, diff-and-await-apply
- Dispatcher pattern: all CLI calls use `node bin/design-os.mjs <subcommand>` (Codex review lesson)
- Host fallback section for Codex/Cursor (D-53)

**skills/atoms/ia/sitemap-variants.md** (ATOM-05):
- Standalone bootstrap (3 questions before generating)
- Workflow procedure: JTBD extraction → LATCH reference → variant generation (FID-02
  enforcement explicit; orphan-node prevention documented) → provenance propagation
  → schema validation via CLI dispatcher

**skills/atoms/ia/flows-from-jobs.md** (ATOM-06):
- Standalone bootstrap
- Workflow procedure: JTBD extraction → per-JTBD `flowchart TD` generation (no stateDiagram-v2
  at Stage 2, no Excalidraw/XState — Stage 2 only per anti-pattern) → file write →
  mermaid-render validation + error reporting

**evals/bundles/fixtures/stage-2-to-5a/** (F-05):
- `upstream/sitemap.json`: YAML-frontmatter hybrid format (gray-matter compatible);
  category + hierarchy LATCH variants; 12 nodes each; JTBDs checkout/browse-skills/track-progress
  all covered via node labels; no styling fields; worstProvenance:generated
- `bundle.md`: stage:"2 → 5a"; all 6 required sections; explains Phase 2 v2.0a direct
  Stage 2→5a path skipping Stages 3+4
- Bundle sufficiency eval: all 6 fixtures pass (structurallyEquivalent:true)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sitemapStructuralDistance formula: schemePenalty adjusted from 0.4 → 0.5**
- **Found during:** T-02-02-A GREEN phase (test failed: expected 0.4 ≥ 0.5)
- **Issue:** With same labels and different LATCH schemes, score was 0.4 (only schemePenalty fires). Test spec says "≥0.5". The plan says "location vs hierarchy (same labels) → ≥0.5"
- **Fix:** Increased schemePenalty weight from 0.4 to 0.5; reduced countPenalty and labelPenalty from 0.3 to 0.25 each (sum still caps at 1.0)
- **Files modified:** `assets/scripts/preview/variant-distance.mjs`
- **Commit:** `ab1b9db`

**2. [Rule 1 - Bug] per-stage-skeletons.test.ts: stage-2 skeleton assertions broken by Phase 2 implementation**
- **Found during:** T-02-02-B (full vitest suite run)
- **Issue:** Test expected `kind:"pass"` and `evidence:"inferred"` (Phase 1 skeleton returns). Phase 2 implementation now returns `not_runnable` or `pass_with_warnings`
- **Fix:** Same pattern as Plan 02-01 stage-1 fix — removed stage-2 from `skeletonGates` array; added `stage-2 gate (Phase 2 real implementation)` describe block with smoke test
- **Files modified:** `tests/gates/per-stage-skeletons.test.ts`
- **Commit:** `066f104`

**3. [Rule 1 - Bug] sufficiency-structural.test.ts hardcoded 5-fixture count broken by new fixture**
- **Found during:** T-02-02-B (full vitest suite run)
- **Issue:** Test asserted `toHaveLength(5)` but we added the 6th fixture (stage-2-to-5a)
- **Fix:** Updated count to 6 with explanatory comment (stage-2-to-5a is F-05 requirement)
- **Files modified:** `tests/handoff/sufficiency-structural.test.ts`
- **Commit:** `066f104`

**4. [Rule 2 - Missing] YAML-frontmatter hybrid format required for stage-2-to-5a fixture**
- **Found during:** T-02-02-B (bundle sufficiency eval returned provenance mismatch)
- **Issue:** Initial sitemap.json was pure JSON. `sufficiency-structural.mjs` reads provenance via `gray-matter`, which returns `data.provenance=undefined` on pure JSON files → defaults to "validated"
- **Fix:** Converted sitemap.json to YAML-frontmatter hybrid format (same as stage-1-to-2 upstream fixture); recomputed directory hash for bundle.md
- **Files modified:** `evals/bundles/fixtures/stage-2-to-5a/upstream/sitemap.json`, `evals/bundles/fixtures/stage-2-to-5a/bundle.md`
- **Commit:** `066f104`

## Known Stubs

None — all gate checks are real implementations. The `pass_with_warnings` tree-test warning is intentional (documented behavior: VALIDATED grade deferred to v2.1).

## Threat Flags

None. All files implement the threat mitigations from the plan's STRIDE register:
- T-02-02-01 (FID-02 tampering): mitigated by `checkFidelityCap()` in gate-stage-2.mjs
- T-02-02-02 (Mermaid DoS): mitigated by mermaid-render.mjs AbortSignal.timeout (Phase 1) + error capture in `validateMermaidFile()`
- T-02-02-03 (JTBD spoofing): accepted risk, documented in plan

## Codex-Review Fixes (2026-05-25)

Applied after Codex review session 019e5faa-b2ea-7161-9949-84e5c09767c9.

**Finding 1 (P1 BLOCKING): Structure workflow bypasses Stage 2 gate**
- **Issue:** Step 9 ran the gate against `design/` which is empty before `--apply`, so `not_runnable` was returned and execution continued unchecked.
- **Fix:** Step 9 now runs against `.design-os/preview/run-<timestamp>/` — the actual staged path. Clarified `not_runnable` means something went wrong in steps 6-8, not expected behavior.
- **Files modified:** `skills/workflows/structure.md`
- **Commit:** `17e9cc7`

**Finding 2 (P2 HIGH): Empty/malformed sitemap passes gate**
- **Issue:** `sitemap.variants ?? []` defaulted to `[]` and the gate passed without enforcing `minItems:1` or the full schema.
- **Fix:** Added `validateSitemapSchema()` using `Ajv2020` + `schemas/dist/sitemap.v1.json`. FID-02 runs first (before schema) so styling fields get actionable errors rather than "additional property not allowed". Schema check (2-schema-001) rejects schema violations; empty-variants guard (2-schema-002) is belt-and-suspenders.
- **New test fixtures:** `tests/fixtures/stage2-gate/empty-sitemap/`
- **Files modified:** `assets/scripts/gates/stage-2.mjs`, `tests/gates/stage-2-latch.test.ts`
- **Commits:** `e1be783`

**Finding 3 (P2 HIGH): JTBD-to-flow mapping not enforced**
- **Issue:** `globby` only found existing files; if flows were missing, no error was raised. Step 2 promised one flow per JTBD but never checked.
- **Fix:** Step 5b extracts JTBD slugs, lists `ia/flows/*.flow.mmd` filenames, compares. Any JTBD without a flow returns `failed_after_repair` with finding `2-flow-001` naming the missing slugs. Added flow files to existing fixtures (`missing-jtbd`, `orphan-node`, `valid-sitemap`) that need to pass this check.
- **New test fixtures:** `tests/fixtures/stage2-gate/missing-jtbd-flows/`
- **Files modified:** `assets/scripts/gates/stage-2.mjs`, `tests/gates/stage-2-latch.test.ts`, multiple existing fixtures
- **Commit:** `47a6bf7`

**Finding 4 (P2 HIGH): FID-02 styling on Mermaid flows not rejected**
- **Issue:** `mermaid-render.mjs` only validated syntax; flows with `style A fill:#ff0000`, `classDef`, or `:::className` passed the gate.
- **Fix:** Added `checkMermaidStyling()` scanning each `.flow.mmd` for `^style `, `^classDef `, and `:::[A-Za-z]` patterns. Runs before syntax validation to give precise line-level errors. Returns finding `2-fidelity-003` citing FID-02 with offending lines.
- **New test fixtures:** `tests/fixtures/stage2-gate/styled-mermaid-flow/`
- **Files modified:** `assets/scripts/gates/stage-2.mjs`, `tests/gates/stage-2-latch.test.ts`
- **Commit:** `b267faf`

**Post-fix metrics:** 639 tests passing (+7 from 632), 0 TypeScript errors, all 4 findings closed.

## Self-Check: PASSED

All key files exist:
- FOUND: assets/scripts/gates/stage-2.mjs
- FOUND: assets/scripts/preview/variant-distance.mjs
- FOUND: skills/workflows/structure.md
- FOUND: skills/atoms/ia/sitemap-variants.md
- FOUND: skills/atoms/ia/flows-from-jobs.md
- FOUND: tests/gates/stage-2-latch.test.ts
- FOUND: tests/ia/sitemap-structural-distance.test.ts
- FOUND: evals/bundles/fixtures/stage-2-to-5a/bundle.md

All commits exist:
- FOUND: c2b40b5 (test: RED phase)
- FOUND: ab1b9db (feat: GREEN phase)
- FOUND: 066f104 (feat: T-02-02-B)
- FOUND: 17e9cc7 (fix: Finding 1 — structure.md gate bypass)
- FOUND: e1be783 (fix: Finding 2 — empty/schema-invalid sitemap)
- FOUND: 47a6bf7 (fix: Finding 3 — JTBD-to-flow mapping)
- FOUND: b267faf (fix: Finding 4 — FID-02 Mermaid styling)
