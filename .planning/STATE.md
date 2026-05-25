---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: length — 4 weeks
status: completed
last_updated: "2026-05-25T14:25:09.777Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 10
  completed_plans: 6
  percent: 60
---

# State: design-os

**Last updated:** 2026-05-25

## Project Reference

- **Project:** design-os
- **Core value:** The 5-stage design process, operationalized as an agent-loop workflow with stage-typed artifacts in `design/` and validation gates between stages — so prototypes don't break at production scale.
- **Current focus:** Phase 2 (v2.0a Skeleton) — Plan 01 COMPLETE. Stage 1 gate + adversarial CI + discover workflow shipped. Plans 02-05 remain.
- **Mode:** standard (Horizontal Layers — infrastructure-heavy SKILL.md package work)
- **Granularity:** coarse (4 phases, 1-3 plans each)

## Current Position

- **Milestone:** v2.0 GA (14-week build window from 2026-05-24)
- **Phase:** 02 IN PROGRESS — v2.0a Skeleton (Plan 01 of 5 complete)
- **Next plan:** Phase 02 Plan 02
- **Plan:** 01 complete (Phase 2 Plan 1 delivered)
- **Status:** Phase 02 Plan 01 complete; ready for Phase 02 Plan 02

**Progress:**

[██████░░░░] 60%
Phase 1: [██████████] 100% (5/5 plans complete)
Phase 2: [██░░░░░░░░] 20%  (1/5 plans complete)
Phase 3: [          ] 0%   Not started
Phase 4: [          ] 0%   Not started

**Overall:** Phase 1 complete; Phase 2 in progress (1/5).

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
| Phase 02 P01 | 60m | 3 tasks | 44 files |

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

### Todos (next session)

- [ ] Fill in @TBD maintainer placeholder in docs/MAINTAINERS.md before v2.0 GA
- [ ] Begin Phase 02 — v2.0a Skeleton (first Stage workflow, style-lite + systematize-lite)
- [ ] Run keyword-filter week-2 calibration based on first week's Anthropic watcher hits (Open Q4)

### Blockers

None. Phase 1 complete; ready for Phase 2.

### Recently Validated

None yet — ship to validate.

### Recently Invalidated

None yet.

## Session Continuity

### Last Session

- **Date:** 2026-05-25
- **Activity:** Phase 01 Plan 05 (Preview + Routing + Watcher). Port manager, Playwright runner, security sandbox (permission boundary, no vm2), Vite/Next/Astro adapters, variant-distance 6-axis metric, run-subagent shim, routing registry (7 routes), ROUTE-08 dispatcher, 12 mandatory MVPA-06 references, design SKILL.md body update, 3 host-profile vitest workspaces, Anthropic-Labs watcher (daily cron + heartbeat), MAINTAINERS.md + RAPID-RESPONSE.md, keyword-filter ESM module. 155 new tests. 467/467 total passing. Phase 1 COMPLETE.
- **Artifacts produced:**
  - `assets/scripts/` port-manager.mjs, playwright-runner.mjs, security-sandbox.mjs, run-subagent.mjs
  - `assets/scripts/preview/` vite-adapter.mjs, next-adapter.mjs, astro-adapter.mjs, variant-distance.mjs
  - `assets/scripts/routing/` registry.mjs, dispatch.mjs
  - `assets/scripts/cli/` preview.mjs, design.mjs
  - `references/` 12 MVPA-06 reference files (garrett, cooper-goodwin, torres-ost, klement-jtbd, indi-young, rosenfeld-ia, dtcg, design-md, wcag-2-2, radix-step-roles, shadcn-tailwind-v4, prd/lenny-one-pager)
  - `evals/hosts/` claude-code/, codex-cli/, cursor/ (package.json, vitest.config.ts, host-profile.test.ts each)
  - `evals/watcher/keyword-filter.mjs`
  - `.github/workflows/` anthropic-watcher.yml, anthropic-watcher-heartbeat.yml
  - `docs/` MAINTAINERS.md, RAPID-RESPONSE.md
- **Decisions captured:** Stage 3+4 checklist deferral, no-vm2 sandbox, keyword-filter regex fix, ROUTE-08 prompt-and-exit pattern, run-subagent adapter pattern.

### Next Session

- **Likely activity:** Phase 02 Plan 01 — v2.0a Skeleton (first Stage workflow).
- **Required reading at session start:**
  - `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-05-SUMMARY.md`
  - Phase 02 PLAN.md (to be created by `/gsd-plan-phase 2`)

---
*State initialized: 2026-05-24 after roadmap creation*
