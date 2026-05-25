---
phase: 01-v1-5-infrastructure-determinism-foundation
plan: "05"
subsystem: preview-harness-routing-watcher
tags:
  - preview-harness
  - port-manager
  - playwright-runner
  - security-sandbox
  - vite-adapter
  - next-adapter
  - astro-adapter
  - variant-distance
  - run-subagent
  - routing-registry
  - route-dispatcher
  - route-08-default
  - references-corpus
  - host-profiles
  - anthropic-watcher

dependency_graph:
  requires:
    - "01-01"  # CLI dispatcher auto-discovery contract
    - "01-02"  # Gate runner, manifest.lock
    - "01-04"  # SKILL.md skeletons (design, audit, handoff)
  provides:
    - port-manager with get-port@7 reserve + port.lock lifecycle (PREV-01)
    - playwright-runner with spawnAndProbe + ALLOWED_STATUSES (PREV-01)
    - security-sandbox permission boundary — isPathAllowed + scrubEnvForPreview (NO vm2)
    - 3 preview adapter scaffolds (Vite 6 / Next 15 / Astro 5) — prepare() API (PREV-02)
    - 6-axis variant-distance metric (Stage 5a preserved per PREV-05); Stage 3 stub deferred
    - run-subagent host detection + Claude Code best-effort + Codex/Cursor sequential fallback (D-23)
    - routing registry — 7 routes (4 implemented-stub + 3 not-yet-implemented) (D-21)
    - routing dispatcher — dispatchRoute() + suggestRoute() + ROUTE-08 default-not-all-5-stages
    - 12 mandatory MVPA-06 references under references/ (D-24, D-25, REF-01, REF-02)
    - 4 v1.5 gate checklists confirmed (stage-1, 2, 5a, 5b shipped by Plan 02 — Plan 05 does NOT add stage-3/4)
    - design SKILL.md body updated with Routes table + Default behavior + References section
    - 3 host-profile vitest workspaces (claude-code, codex-cli, cursor) (D-22)
    - Anthropic-Labs watcher (daily cron + heartbeat) + MAINTAINERS.md + RAPID-RESPONSE.md (D-30, D-31, GTM-06)
    - keyword-filter.mjs as unit-testable ESM module (6 keywords + design-stem heuristic)
  affects:
    - Phase 2 stage workflows can use preview harness (port allocation, adapter scaffolds)
    - Phase 2 routing dispatcher shape is established; Phase 2 plugs in real stage workflows
    - CI: Anthropic-Labs watcher live from Phase 1 week 1 (GTM-06 satisfied)
    - evals/hosts workspaces register for npm workspace tooling

tech_stack:
  added:
    - get-port@7 (already in package.json; used with reserve:true pattern)
    - npm workspaces (evals/hosts/* — zero extra install, Node 22 LTS built-in)
  patterns:
    - Permission boundary pattern (isPathAllowed + scrubEnvForPreview) — no vm2 (CVE-2026-22709)
    - Playwright webServer ALLOWED_STATUSES convention (2xx/3xx/400-403)
    - AbortSignal.timeout(1000) for per-probe fetch timeout
    - Adapter pattern for host dispatch shim (swappable interface per D-23)
    - Discriminated union on dispatchRoute result kind ('route_stub_dispatched' | 'route_not_yet_implemented' | 'unknown_route')
    - ROUTE-08: exit 0 with prompt when --route not given (never silently run all 5 stages)
    - 6-axis Euclidean distance for Stage 5a visual-style comparison (preserved from v1.0.1)
    - Keyword filter heuristic: ≥2 keywords OR (1 keyword + design-stem in body)

key_files:
  created:
    - assets/scripts/port-manager.mjs
    - assets/scripts/playwright-runner.mjs
    - assets/scripts/security-sandbox.mjs
    - assets/scripts/preview/vite-adapter.mjs
    - assets/scripts/preview/next-adapter.mjs
    - assets/scripts/preview/astro-adapter.mjs
    - assets/scripts/preview/variant-distance.mjs
    - assets/scripts/run-subagent.mjs
    - assets/scripts/routing/registry.mjs
    - assets/scripts/routing/dispatch.mjs
    - assets/scripts/cli/preview.mjs
    - assets/scripts/cli/design.mjs
    - references/garrett-elements.md
    - references/cooper-goodwin.md
    - references/torres-ost.md
    - references/klement-jtbd.md
    - references/indi-young-thinking-styles.md
    - references/rosenfeld-ia.md
    - references/dtcg-v2025-10.md
    - references/design-md.md
    - references/wcag-2-2.md
    - references/radix-step-roles.md
    - references/shadcn-tailwind-v4.md
    - references/prd/lenny-one-pager.md
    - evals/hosts/claude-code/package.json
    - evals/hosts/claude-code/vitest.config.ts
    - evals/hosts/claude-code/host-profile.test.ts
    - evals/hosts/codex-cli/package.json
    - evals/hosts/codex-cli/vitest.config.ts
    - evals/hosts/codex-cli/host-profile.test.ts
    - evals/hosts/cursor/package.json
    - evals/hosts/cursor/vitest.config.ts
    - evals/hosts/cursor/host-profile.test.ts
    - evals/watcher/keyword-filter.mjs
    - .github/workflows/anthropic-watcher.yml
    - .github/workflows/anthropic-watcher-heartbeat.yml
    - docs/MAINTAINERS.md
    - docs/RAPID-RESPONSE.md
    - tests/preview/port-manager.test.ts
    - tests/preview/playwright-runner.test.ts
    - tests/preview/security-sandbox.test.ts
    - tests/preview/variant-distance.test.ts
    - tests/routing/registry.test.ts
    - tests/routing/dispatch.test.ts
    - tests/routing/route-08-default.test.ts
    - tests/references/corpus-completeness.test.ts
    - tests/hosts/profiles.test.ts
    - tests/watcher/keyword-filter.test.ts
  modified:
    - skills/design/SKILL.md (Routes table + Default behavior + References section added to body)
    - package.json (workspaces field + npm workspace entries for 3 evals/hosts/* dirs)

decisions:
  - "Stage 3 + Stage 4 gate checklists NOT shipped in Phase 1 per checker Warning 1. D-25 locks only 4 v1.5 gate checklists (stage-1, 2, 5a, 5b shipped by Plan 02). Stage 3 + Stage 4 checklists ship Phase 3."
  - "Security sandbox is a permission boundary (isPathAllowed + scrubEnvForPreview) — vm2 explicitly NOT used (CVE-2026-22709)."
  - "keyword-filter designers regex: /\\bdesign(?:ers?|ed|ing|s)?\\b/i covers designers (design+ers) in body text."
  - "routing test: Object.values(ROUTES) typed as unknown from mjs import; cast to Record<string,any> with eslint-disable comment."
  - "ROUTE-08: no --route → suggestRoute() + formatRoute08Prompt() → print + exit 0. Never silently runs all 5 stages."

metrics:
  duration: "~16 minutes"
  completed: "2026-05-25"
  tasks: 3
  files: 50
  tests_added: 155
  tests_total: 467
---

# Phase 01 Plan 05: Preview + Routing + Watcher Summary

Preview harness infrastructure (port manager, Playwright readiness probe, permission-boundary security sandbox, Vite 6 / Next 15 / Astro 5 adapters, 6-axis variant-distance metric, subagent dispatch shim), routing registry for all 7 routes with ROUTE-08 default-not-all-5-stages dispatcher, 12 mandatory MVPA-06 references corpus, 3 host-profile vitest workspaces, and Anthropic-Labs watcher (daily cron + heartbeat + MAINTAINERS + RAPID-RESPONSE) — 155 new assertions, all 467 passing. Phase 1 complete.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 RED | Failing tests: port-manager, playwright-runner, security-sandbox, variant-distance | 8056732 | 4 test files |
| 1 GREEN | port-manager + playwright-runner + security-sandbox + adapters + variant-distance + run-subagent + cli/preview | a1dd383 | 9 source files |
| 2 RED | Failing tests: routing registry, dispatch, ROUTE-08, corpus-completeness | d6e6c0e | 4 test files |
| 2 GREEN | routing/registry + routing/dispatch + cli/design + 12 references + SKILL.md update | 8705bdf | 16 files |
| 3 RED | Failing tests: host-profiles, keyword-filter | 4d8b5e9 | 2 test files |
| 3 GREEN | 3 host workspaces + keyword-filter + watcher workflows + MAINTAINERS + RAPID-RESPONSE | 0e12314 | 16 files |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] keyword-filter design-stem regex did not match "designers"**
- **Found during:** Task 3 GREEN (test failure: matchesWatcherCriteria returned false for body containing "designers")
- **Issue:** `/\bdesign(?:ed|er|ing|s)?\b/i` — "designers" = `design` + `ers`; the `s` alternative only matches `design` + `s`, not `design` + `ers`
- **Fix:** Changed to `/\bdesign(?:ers?|ed|ing|s)?\b/i` covering `designer/designers` variants
- **Files modified:** `evals/watcher/keyword-filter.mjs`
- **Commit:** 0e12314

**2. [Rule 1 - Bug] routing/registry.test.ts TypeScript TS18046 — Object.values(ROUTES) typed as unknown**
- **Found during:** Task 2 GREEN (tsc --noEmit reported TS18046 on `r.status` and `route.requiredStages`)
- **Issue:** `ROUTES` imported from an `.mjs` file without type declarations; `Object.values()` returns `unknown[]` in strict mode
- **Fix:** Added `as Record<string, any>` cast with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments per CLAUDE.md TS discipline
- **Files modified:** `tests/routing/registry.test.ts`
- **Commit:** 0e12314

### Design Decisions Confirmed

**Stage 3 + Stage 4 gate checklists deferred to Phase 3 (checker Warning 1)**

Per PLAN.md notes and D-25, Plan 05 does NOT ship `references/gates/stage-3.md` or `references/gates/stage-4.md`. The v1.5 gate-checklist set is fixed at 4 (stage-1, 2, 5a, 5b — all shipped by Plan 02). The corpus-completeness test asserts exactly 4 gate checklists exist, and asserts stage-3.md + stage-4.md do NOT exist. Stage 3 + Stage 4 checklists ship in Phase 3 alongside the gate runners.

## Open Questions Disposition

- **Q4:** Keyword filter ships with 6 keywords + ≥2 keyword or 1 keyword + design-stem heuristic. Calibration in week 2 based on first week's false-positive / false-negative rate. The filter correctly handles the key disambiguation: `audit` alone with a non-design body is rejected; `audit` in a design-context title/body is matched.

## Pitfall Mitigations

- **Pitfall E (watcher heartbeat):** `anthropic-watcher-heartbeat.yml` detects missed cron runs (runs 1h after the watcher, checks last run age > 26h, opens an issue if missed).
- **Pitfall 9 / GTM kill-risk monitor:** Anthropic-Labs watcher is live from Phase 1 week 1 per STATE.md todo. Daily cron + maintainer placeholder in MAINTAINERS.md.

## Stage 3 Structural-Diversity Metric

Explicitly deferred to Phase 3 per project research flag: "Stage 3 structural-diversity metric design — Phase 3 deep research (the metric is unprecedented; v1.0.1's 6-axis visual-style metric does not apply to greyscale wireframes)." Phase 1 ships `STAGE_3_STRUCTURAL_DEFERRED = true` constant + a `stage3StructuralDistance()` stub that throws with an informative message referencing Phase 3.

## Phase 1 Wrap-Up Status

Plan 05 completes Phase 1 (v1.5 Infrastructure & Determinism Foundation). All 5 plans delivered:

| Plan | Subsystem | Tests |
|------|-----------|-------|
| 01-01 | Schemas foundation + CLI dispatcher | ~100 |
| 01-02 | Gate runner + handoff bundle | ~70 |
| 01-03 | Determinism CI + coexistence eval | ~71 |
| 01-04 | Governance + PII | 71 |
| 01-05 | Preview + routing + watcher | 155 |
| **Total** | | **467** |

All 7 Phase-1 pitfalls mitigated:
- Pitfall A (Zod optional/nullable test) — Plan 01
- Pitfall B (tiktoken safety margin) — Plan 02
- Pitfall C (Excalidraw pin) — Plan 01 package.json
- Pitfall D (PII line-start anchor) — Plan 04
- Pitfall E (watcher heartbeat) — **Plan 05**
- Pitfall F (ESLint exhaustiveness) — Plan 03
- Pitfall G (schema-migration-guard CI) — Plan 03

Requirements satisfied by Plan 05: DIST-02, DIST-03, PREV-01, PREV-02, PREV-05, REF-01, REF-02, REF-04, ROUTE-08, GTM-06

**Phase 2 (v2.0a Skeleton) can begin.** All Phase 1 infrastructure is complete; downstream blockers cleared.

## Known Stubs

The following items are intentional stubs in Phase 1 (documented as deferred):
1. `stage3StructuralDistance()` in `variant-distance.mjs` — throws; Phase 3 deliverable
2. `ROUTE_NOT_YET_IMPLEMENTED` routes (new-product, mature-app-refactor, DS-extraction) — Phase 3 / v2.0b
3. `run-subagent.mjs` Claude Code path — best-effort with `CLAUDE_CODE_BIN` env; documented as "interface may change, adapter pattern keeps shim swappable"
4. `docs/MAINTAINERS.md` owner — `@TBD` placeholder; project owner fills in before GA

None of these stubs prevent Plan 05's plan goal. The preview harness, routing dispatcher, references corpus, host workspaces, and watcher are all fully functional at the Phase 1 level.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information-disclosure | assets/scripts/security-sandbox.mjs | New env-scrub boundary T-05-01; mitigated by scrubEnvForPreview() (tested) |
| threat_flag: path-traversal | assets/scripts/security-sandbox.mjs | T-05-02; mitigated by isPathAllowed() relative-path check (tested) |
| threat_flag: spoofing | .github/workflows/anthropic-watcher.yml | T-05-05 RSS feed injection accepted risk; watcher opens issues for human review only |

## Self-Check: PASSED

Key files verified to exist:
- assets/scripts/port-manager.mjs: FOUND
- assets/scripts/playwright-runner.mjs: FOUND
- assets/scripts/security-sandbox.mjs: FOUND
- assets/scripts/preview/vite-adapter.mjs: FOUND
- assets/scripts/preview/next-adapter.mjs: FOUND
- assets/scripts/preview/astro-adapter.mjs: FOUND
- assets/scripts/preview/variant-distance.mjs: FOUND
- assets/scripts/run-subagent.mjs: FOUND
- assets/scripts/routing/registry.mjs: FOUND
- assets/scripts/routing/dispatch.mjs: FOUND
- assets/scripts/cli/preview.mjs: FOUND
- assets/scripts/cli/design.mjs: FOUND
- references/garrett-elements.md: FOUND
- references/prd/lenny-one-pager.md: FOUND
- evals/hosts/claude-code/package.json: FOUND
- evals/hosts/codex-cli/vitest.config.ts: FOUND
- evals/hosts/cursor/host-profile.test.ts: FOUND
- evals/watcher/keyword-filter.mjs: FOUND
- .github/workflows/anthropic-watcher.yml: FOUND
- .github/workflows/anthropic-watcher-heartbeat.yml: FOUND
- docs/MAINTAINERS.md: FOUND
- docs/RAPID-RESPONSE.md: FOUND

All commits verified:
- 8056732: FOUND (test(01-05): RED Task 1)
- a1dd383: FOUND (feat(01-05): Task 1 GREEN)
- d6e6c0e: FOUND (test(01-05): RED Task 2)
- 8705bdf: FOUND (feat(01-05): Task 2 GREEN)
- 4d8b5e9: FOUND (test(01-05): RED Task 3)
- 0e12314: FOUND (feat(01-05): Task 3 GREEN)

Full test suite: 467/467 PASS
Plan 05 tests: 155/155 PASS
