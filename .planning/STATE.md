---
gsd_state_version: 1.0
milestone: v2.0b
milestone_name: v2.0b full 5-stage pipeline
status: in_progress
stopped_at: Phase 03 Plan 05 — executing route completion + audit modes + e2e fixture
last_updated: "2026-05-26T13:00:00.000Z"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 15
  completed_plans: 14
  percent: 93
---

# State: design-os

**Last updated:** 2026-05-26

## Project Reference

- **Project:** design-os
- **Core value:** The 5-stage design process, operationalized as an agent-loop workflow with stage-typed artifacts in `design/` and validation gates between stages — so prototypes don't break at production scale.
- **Current focus:** Phase 3 (v2.0b) — COMPLETE. Reverse-engineer pipeline (D-62/63/64), INFERRED two-layer enforcement, v2.0a→v2.0b migration scripts (D-65), promote-inferred CLI, frontmatter-validate Rule A/B, audit.md extended. 953 tests passing.
- **Mode:** standard (Horizontal Layers — infrastructure-heavy SKILL.md package work)
- **Granularity:** coarse (4 phases, 1-3 plans each)

## Current Position

- **Milestone:** v2.0 GA (14-week build window from 2026-05-24)
- **Phase:** 03 IN PROGRESS — v2.0b full 5-stage pipeline
- **Plan:** 05 executing (Phase 3 Plan 5 — route completion + audit modes: new-product/mature-app-refactor/DS-extraction dispatch + audit --all-stages + audit --new-feature + SKILL.md update + trigger tuning)
- **Next plan:** Phase 04 Plan 01 (RC / GA preparation) — after 03-05 + verifier pass
- **Status:** Phase 03 Plan 05 executing. 14/15 plans delivered so far. 969 tests passing (post-codex-review fixes).

**Progress:**

[█████████ ] 93% (Phase 3 Plan 5 executing)
Phase 1: [██████████] 100% (5/5 plans complete)
Phase 2: [██████████] 100% (5/5 plans complete)
Phase 3: [█████████ ] 80%  (4/5 plans — executing 03-05)
Phase 4: [          ] 0%   Not started (RC / GA preparation)

**Overall:** 14/15 plans delivered. 969 tests passing.

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| v1.5 length | 4 weeks | Not started |
| v2.0a end-to-end fixture pass | ≥12 of 15 runs | Not started |
| Synthetic-persona red line block | 100 / 100 | Not started |
| Stage 3 fidelity-cap reject | 100 / 100 | Not started |
| Stage 5a without state-maps refuse | 100 / 100 | Not started |
| Aggregate coexistence eval (5+ packages) | trigger recall ≥0.80 | Not started |
| Per-skill trigger recall | ≥0.85 | Not started |
| Per-skill false-trigger rate | ≤0.15 | Not started |
| Full `design` workflow cost p50 | ≤150k tokens | Not started |
| Full `design` workflow cost p95 | ≤220k tokens | Not started |
| Wall-clock full 5 stages p50 | ≤8 min | Not started |
| Designer review (n≥5) | ≥4 of 5 positive | Not started |
| PM review (n≥5) | ≥4 of 5 positive | Not started |
| WCAG 2.2 AA contrast on own examples | 100% pass | Not started |
| Phase 01 P01 | 90m | 3 tasks | 47 files |
| Phase 01 P02 | 180m | 3 tasks | 47 files |
| Phase 01 P03 | 81m | 3 tasks | 67 files | 241 tests |
| Phase 01 P04 | 19m | 3 tasks | 39 files |
| Phase 01 P05 | 16m | 3 tasks | 50 files | 155 tests |
| Phase 02 P01 | 60m | 3 tasks | 44 files | 139 tests added (605 total) |
| Phase 02 P02 | 45m | 2 tasks | 13 files | 27 tests added (639 total) |
| Phase 02 P03 | 25m | 2 tasks | 13 files | 37 tests added (676 total) |
| Phase 02 P04 | 35m | 2 tasks | 5 files | 41 tests added (719 total) |
| Phase 02 P05 | 90m | 3 tasks | 52 files | 91 tests added (810 total) |
| Phase 03 P01 | 75m | 3 tasks | 22 files | 53 tests added (868 total) |
| Phase 03 P02 | 90m | 3 tasks | 29 files | 21 tests added (900 total) |
| Phase 03 P03 | 75m | 3 tasks | 13 files | 16 tests added (916 total) |
| Phase 03 P04 | 90m | 2 tasks | 17 files | 37 tests added (953 total) |

## Accumulated Context

### Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-24 | v1.5 = 4 weeks (not MRD §10's 3 weeks) | Architecture + Pitfalls research independently endorsed 4 weeks; v1.5 must absorb 12+ infrastructure deliverables including handoff-bundle schema and host-matrix CI (gaps surfaced during research). Total 14 weeks preserved by compressing Phase 3 (v2.0b) from 4 → 3 weeks. |
| 2026-05-24 | v2.0a / v2.0b split preserved | Non-negotiable per codex §16 BLOCKER. v2.0a must be shippable standalone to mitigate GTM kill-risk (Pitfall 9). |
| 2026-05-24 | `audit --reverse-engineer-stages` moved up from v2.1 to v2.0b (Phase 3) | Primary persona feature; Lovable refugee path is the highest-leverage on-ramp. |
| 2026-05-24 | XState v5 is conditional, Mermaid stateDiagram-v2 is canonical at Stage 4 | Codex §16 feedback — XState as primary overfits engineering audience. Designer-readable Mermaid renderer is a Phase 1 deliverable. |
| 2026-05-24 | 4 IDs deferred from v1 phase mapping (ATOM-07, ADAPT-02, ADAPT-04, ADAPT-05) | All flagged "(v2.1)" or "(v2.1+)" inline in REQUIREMENTS.md. Tracked but not in v2.0 GA roadmap. |
| 2026-05-24 | Project mode = standard (Horizontal Layers) | Infrastructure-heavy SKILL.md package work; each release (v1.5 → v2.0a → v2.0b → RC/GA) is itself a horizontal layer with internal stage workflows. |

- [Phase ?]: D-01 substitution: zod-to-json-schema EOL Nov 2025 replaced by Zod 4 z.toJSONSchema()
- [Phase ?]: Ajv strict: false required — Zod-emitted discriminatedUnion schemas conflict with ajv strict mode
- [Phase ?]: schemas/dist committed to git — .gitignore scoped to /dist/ root only
- [Phase ?]: FORMAT-07 DESIGN.md pinned to 2026.04; unsupported --design-md-version exits 1
- [Phase 01 Plan 02]: GATE-07+08: stage-5a hardcoded not_runnable for empty interactions/ (codex §16 BLOCKER fix)
- [Phase 01 Plan 02]: Open Q2 closed for Phase 1 — structural-equivalence is the baseline; semantic similarity deferred to Phase 4
- [Phase 01 Plan 02]: Plan 03 must add ESLint @typescript-eslint/switch-exhaustiveness-check (Pitfall F mitigation)
- [Phase 01 Plan 02]: tiktoken cl100k_base for token counting; JSON-body provenance not readable by YAML scanner (falls back to 'validated')
- [Phase 01 Plan 03]: A2 assumption — dispatchToHost uses static-analysis keyword-overlap fallback (no public Claude Code headless eval API as of May 2026)
- [Phase 01 Plan 03]: Open Q3 — aggregate coexistence recall threshold ≥0.80 calibrated empirically; Phase 1 non-blocking (continue-on-error: true); blocking enables at v2.0 GA
- [Phase 01 Plan 03]: YAML-quoted descriptions in SKILL.md stubs — colons in frontmatter values must be wrapped in double-quotes for gray-matter
- [Phase 01 Plan 03]: handoff-bundle generatedAt optional param — golden tests use fixed 2026-05-25T00:00:00.000Z timestamp for byte-identical determinism
- [Phase 01 Plan 03]: schema-migration-guard uses --diff-filter=M (MODIFIED only) — fresh-v1 schemas (ADDED) exempt from migration requirement
- [Phase ?]: Phase 01 Plan 04 decisions captured
- [Phase ?]: [Phase 01 Plan 04]: PHONE_E164 regex removed leading backslash-b anchor; backslash-b before + non-word char never matches. Fixed to slash+[1-9]d{6,14}b
- [Phase ?]: [Phase 01 Plan 04]: SPINE linter resolves dependsOn paths from design dir root, not artifact dir (SPINE-04 correctness fix)
- [Phase ?]: [Phase 01 Plan 04]: MANIFEST.md reconciler uses fixed timestamp for byte-identical determinism (same pattern as Plan 03 golden tests)
- [Phase ?]: [Phase 01 Plan 04]: CLI scan positional path read from process.argv — Commander handler only exposes named flags not positional args
- [Phase 01 Plan 05]: Stage 3 + Stage 4 gate checklists NOT shipped Phase 1 per checker Warning 1 — D-25 locks only 4 v1.5 checklists (stage-1,2,5a,5b shipped Plan 02); Stage 3+4 ship Phase 3
- [Phase 01 Plan 05]: Security sandbox = permission boundary only (isPathAllowed + scrubEnvForPreview); vm2 explicitly NOT used (CVE-2026-22709)
- [Phase 01 Plan 05]: keyword-filter design-stem regex covers designers (design+ers) — /\bdesign(?:ers?|ed|ing|s)?\b/i
- [Phase 01 Plan 05]: ROUTE-08 enforced — no --route → suggestRoute() + formatRoute08Prompt() + exit 0; never silently runs all 5 stages
- [Phase 01 Plan 05]: run-subagent Claude Code path is best-effort with CLAUDE_CODE_BIN; adapter pattern keeps shim swappable per D-23
- [Phase 02 Plan 01]: D-37 implemented as pure Node.js script; gate reads YAML frontmatter provenance via gray-matter; missing frontmatter treated as 'missing' (most conservative)
- [Phase 02 Plan 01]: D-38 implemented via checkWorstProvenance export from frontmatter-validate.mjs; cites[] array in artifact frontmatter drives persona-provenance inheritance
- [Phase 02 Plan 01]: RED-05/06 adversarial tests are pure script tests with no LLM calls; 100 seed-based fixtures + 10 documented injection attack vectors; all 115 adversarial tests pass
- [Phase 02 Plan 01]: per-stage-skeletons.test.ts updated to reflect Phase 2 stage-1 behavioral change; stages 2-5b skeleton assertions preserved intact
- [Phase 02 Plan 01]: YAML frontmatter added to upstream/personas.json bundle fixture (gray-matter hybrid format) so sufficiency-structural eval can read provenance
- [Phase 02 Plan 03]: tokens-project.mjs stagingDir uses deterministic run-<generatedAt> ID for golden-test compatibility; random ID otherwise (D-52)
- [Phase 02 Plan 03]: DTCG semantic tier emits resolved OKLCH values not DTCG alias syntax — avoids consumer-side alias resolution complexity
- [Phase 02 Plan 03]: Tailwind v4 @theme merge injects inside existing block (regex injection) — never creates duplicate @theme blocks (T-02-03-02)
- [Phase 02 Plan 03]: budget-check.mjs supports tokensUsed/token_count/tokens field names for run-log flexibility across different log producers
- [Phase 02 Plan 04]: Gate-safe DESIGN.md validation: inline AJV in stage-5b.mjs (validateDesignMd calls process.exit — unsafe for gate use); same design-md schema validated inline
- [Phase 02 Plan 04]: 5b-frost-001 finding uses status:na (informational) for D-44 compliance — Frost ≥3× NOT a gate blocker in v2.0a; status:fail would incorrectly block the gate
- [Phase 02 Plan 04]: Stage 5b-lite has empty composition.atoms — workflow body implements steps directly per RESEARCH.md §3 (no per-atom sub-agents for Stage 5b-lite)
- [Phase 02 Plan 04]: F-04 deferred: DESIGN.md emit test deferred to T-02-05-B e2e fixture — emit logic is in SKILL.md procedure body (not a standalone export)
- [Phase 02 Plan 05]: heuristics.md format = YAML-in-fenced-code-block (avoids pipe collision with regex alternation in Markdown tables)
- [Phase 02 Plan 05]: findingId pattern relaxed from ^[A-Z]+-\d+$ to ^[A-Za-z0-9][A-Za-z0-9-]*-\d+$ to allow 5a-slop-001 style IDs
- [Phase 02 Plan 05]: audit-report schema extended with optional auditType field; severity WARNING maps to WARN in schema enum
- [Phase 02 Plan 05]: A2 static-analysis fallback for skillgrade recall; LLM-based gate deferred to Phase 4 GA release gate
- [Phase 02 Plan 05]: dispatch.mjs unimplemented routes (new-product, mature-app-refactor, DS-extraction) return route_not_yet_implemented — v2.0b scope
- [Phase 03 Plan 02]: D-57 needsXState() pure function: asyncOperations===true AND stateCount>=3 AND hasConditionalTransitions===true; XState v5 setup() pattern with sorted output for determinism
- [Phase 03 Plan 02]: D-58 single-IR dual-output: emitFromSpec() returns { mermaidSource, xstateSource: string|null }; same spec object drives both emitters
- [Phase 03 Plan 02]: D-59(c) extractStateNames() source-declaration-only: captures bare names, left-of-arrow sources, annotations, composite declarations — does NOT capture transition targets (right of -->); extractTransitionTargets() is separate
- [Phase 03 Plan 02]: sufficiency-structural eval: provenanceWorstCase in bundle.md must match worst provenance of upstream artifacts; interactions.placeholder with provenance:generated required bundle.md update validated→generated
- [Phase 03 Plan 02]: mermaid-render.mjs validateMermaidSource() dispatches on diagram type (stateDiagram-v2 vs flowchart); composite state syntax handled natively by Mermaid CLI
- [Phase 03 Plan 02]: Tests 8/9 (mermaid-cli headless) require 15000ms timeout in vitest — @mermaid-js/mermaid-cli takes 1-3s per invocation in full suite
- [Phase 03 Plan 03]: D-60 stage-5a conditional gate: if interactions/ has ≥1 .spec.md → run 4-condition checklist; else → not_runnable/stage-4-artifacts-absent (OQ-1 TDD atomic)
- [Phase 03 Plan 03]: D-70 Frost BLOCKER uses failed_after_repair/frost-recurrence-not-met (not not_runnable — additionalProperties:false blocks findings on not_runnable)
- [Phase 03 Plan 03]: Frost counter priority: schema-violation hasBlocker checked before frostBlockers — Phase 2 tests depend on schema-violation taking precedence
- [Phase 03 Plan 03]: Frost search uses case-insensitive String.includes() (NOT regex) — prevents regex special-char bypass; counts both .excalidraw element.label and .spec.md body text
- [Phase 03 Plan 03]: Vacuous Frost pass: 0 component-tier tokens in tokens.json → Frost check skipped entirely (no components to verify)
- [Phase 03 Plan 04]: D-64 INFERRED two-layer enforcement: YAML frontmatter provenance:inferred + inferredDisclaimer + evidence:INFERRED AND Markdown body `> **INFERRED** — ...` blockquote banner — both layers required; frontmatter-only invisible to LLM readers; body-only strippable by copy-paste
- [Phase 03 Plan 04]: Rule A regex `/>\s*\*\*INFERRED\*\*/i` matches any occurrence in gray-matter parsed body — adversarial fixture must not contain the pattern even in commentary text
- [Phase 03 Plan 04]: skipSchemaValidation option added to validateFrontmatter() — allows INFERRED rule testing on non-schema artifact types (design-doc) without hitting process.exit(1)
- [Phase 03 Plan 04]: Playwright dynamically imported inside crawlUrlToFs() — prevents test failures when Playwright browsers not available in CI
- [Phase 03 Plan 04]: v2.0a/v2.0b migration uses STRING schemaVersions ('2.0a', '2.0b') NOT integers — distinct from existing v0→v1 integer chain; invoked via run-v2.0a-to-v2.0b.mjs directly (not through discoverMigrations() auto-discovery glob)
- [Phase 03 Plan 04]: promote-inferred path computation uses relative(inferredDir, absFilePath) to compute target in design/ — mirrors OQ-2 directory structure

### Todos (next session)

- [ ] Fill in @TBD maintainer placeholder in docs/MAINTAINERS.md before v2.0 GA
- [ ] Run keyword-filter week-2 calibration based on first week's Anthropic watcher hits (Open Q4)
- [ ] Phase 04 Plan 01 — RC / GA preparation (trigger eval, coexistence eval, axe runner, release packaging)

### Blockers

None. Phase 2 complete; ready for Phase 3.

### Recently Validated

None yet — ship to validate.

### Recently Invalidated

None yet.

## Session Continuity

### Last Session

- **Date:** 2026-05-26
- **Activity:** Phase 03 Plan 04 — Reverse-engineer pipeline (D-62/63/64): runReverseEngineer() Stage 4→3→2→1 inference, shouldExcludeUrl(), crawlUrlToFs() Playwright depth=1 dynamic import. INFERRED two-layer enforcement: Rule A (design/inferred/ missing banner) + Rule B (bleed prevention) in frontmatter-validate.mjs. promote-inferred CLI with path-traversal guard. v2.0a→v2.0b migration scripts (sitemap wireframeRefs, persona interactionNeeds, MANIFEST stage3/4artifacts). audit.md extended with --reverse-engineer-stages section + --new-feature stub. 9 adversarial tests for INFERRED enforcement.
- **Stopped at:** Phase 03 Plan 04 — all 2 TDD tasks complete (A: reverse-engineer + B: migration scripts)
- **Artifacts produced:**
  - `assets/scripts/audit/reverse-engineer.mjs` (runReverseEngineer, shouldExcludeUrl, crawlUrlToFs, INFERRED_BANNER, INFERRED_FRONTMATTER)
  - `assets/scripts/cli/reverse-engineer.mjs` (CLI wrapper)
  - `assets/scripts/cli/promote-inferred.mjs` (promote-inferred CLI + promoteInferredFile)
  - `assets/scripts/frontmatter-validate.mjs` (extended: Rule A + Rule B + skipSchemaValidation option)
  - `schemas/migrations/sitemap-v2.0a-to-v2.0b.mjs` (addWireframeRefsToRoute, dry-run, idempotent)
  - `schemas/migrations/persona-v2.0a-to-v2.0b.mjs` (interactionNeeds delta)
  - `schemas/migrations/manifest-v2.0a-to-v2.0b.mjs` (gray-matter + eemeli/yaml round-trip)
  - `schemas/migrations/run-v2.0a-to-v2.0b.mjs` (orchestrator)
  - `tests/audit/reverse-engineer.test.ts` (9 tests)
  - `evals/adversarial/inferred-disclaimer/fixture-builder.mjs` + `run.test.ts` (adversarial INFERRED)
  - `tests/migration/v2.0a-to-v2.0b.test.ts` (13 tests)
  - `evals/fixtures/migration/v2.0a-to-v2.0b/` (3 v2.0a fixture files)
  - `skills/workflows/audit.md` (extended --reverse-engineer-stages + --new-feature stub)
  - `.planning/phases/03-v2-0b-full-5-stages-lovable-refugee-path/03-04-SUMMARY.md`
- **Final state:** 953 tests passing | tsc clean | lint-determinism CLEAN

### Next Session

- **Likely activity:** Phase 04 Plan 01 — RC / GA preparation
- **Required reading at session start:**
  - `.planning/phases/03-v2-0b-full-5-stages-lovable-refugee-path/03-04-SUMMARY.md`
  - Phase 04 Plan 01 PLAN.md (if it exists)

---
*State initialized: 2026-05-24 after roadmap creation*
