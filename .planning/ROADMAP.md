# Roadmap: design-os

**Created:** 2026-05-24
**Granularity:** coarse
**Project mode:** standard (Horizontal Layers — infrastructure-heavy SKILL.md package work)
**Core value:** The 5-stage design process, operationalized as an agent-loop workflow with stage-typed artifacts in `design/` and validation gates between stages — so prototypes don't break at production scale.

## Roadmap Notes

### Decision: v1.5 length — 4 weeks (not MRD §10's 3 weeks)

**Conflict:** MRD §10 proposes v1.5 = 3 weeks. Architecture research (`research/ARCHITECTURE.md` §"Build Order") and Pitfalls research (`research/PITFALLS.md` §"Pitfall-to-Phase Mapping") independently endorsed expanding v1.5 to 4 weeks. SUMMARY.md surfaced this as the highest-leverage roadmap conflict.

**Decision:** Phase 1 (v1.5) = **4 weeks**. Total timeline = **14 weeks** preserved by compressing Phase 3 (v2.0b) from 4 weeks → 3 weeks (Stages 3 + 4 + reverse-engineer + schema migration) and keeping Phase 4 (RC + GA) at 2 weeks.

**Rationale:**
- v1.5 must absorb 12+ infrastructure deliverables: versioned schemas (R24), gate-runner machinery with `not-runnable` terminal state (codex §16 BLOCKER prerequisite), handoff-bundle script + schema (Pattern 3 — the context-window survival mechanism), determinism golden CI, aggregate coexistence eval harness, PII scanner, host-compatibility matrix CI scaffold, `.gitignore`/`.gitattributes` defaults, routing-matrix scaffolding, schema migration tooling, designer-readable Mermaid renderer, Anthropic-Labs watcher.
- Building v2.0a workflows against unfrozen schemas, missing handoff bundles, or absent determinism CI is the kind of rework that kills timelines.
- Phase 3 compression is safe because the v2.0a → v2.0b dependency chain (Stages 3, 4, reverse-engineer) is well-scoped and the v1.5 foundation absorbs the long pole.
- Alternative (cut v2.0a scope) was rejected: v2.0a must be shippable standalone to mitigate GTM kill-risk (Pitfall 9) if Anthropic Labs ships a 5-stage equivalent during the build window.

### Phases derived from MRD §10 release skeleton (v1.5 → v2.0a → v2.0b → RC/GA)

Each release is itself a horizontal infrastructure layer (versioned schemas + Node ESM emit scripts + reference corpus + SKILL.md files + eval harness + preview adapters), as called out in the project mode briefing. The v2.0a / v2.0b split is non-negotiable per codex §16 BLOCKER.

## Phases

- [x] **Phase 1: v1.5 — Infrastructure & Determinism Foundation** — Versioned schemas, gate-runner machinery, handoff bundles, determinism CI, coexistence eval, PII scanner, host-matrix CI, routing scaffolding, Anthropic watcher. Foundation for everything downstream. (4 weeks) — COMPLETE 2026-05-25, 5/5 plans, 467 tests passing
- [x] **Phase 2: v2.0a — Skeleton (4 stages end-to-end, lite-mode Stage 5a/5b)** — 5 workflows + 9 atoms + 4 gates + 3 adapters + 4 routes. Shippable standalone. Synthetic-persona red line + lite-mode honesty enforced in code. (5 weeks) (completed 2026-05-25)
- [ ] **Phase 3: v2.0b — Full 5 Stages + Lovable Refugee Path** — Adds `sketch` + `interact` workflows, 6 atoms, Excalidraw/Mermaid/XState renderers, stage-3 + stage-4 gates, full Stage 5a/5b gates (lite→full promotion), `audit --reverse-engineer-stages`, schema migration v2.0a → v2.0b. (3 weeks)
- [ ] **Phase 4: v2.0 RC + GA — Acceptance, Cross-Host, Launch** — 15-fixture acceptance suite on Claude Code + Codex CLI + Cursor; aggregate coexistence ≥0.80 release gate; designer + PM blind reviews; cost budget enforcement; 100/100 adversarial runs; launch artifact + 8 marketplaces + Brad Frost / Cagan outreach + PR to anthropics/skills#1008. (2 weeks)

## Phase Details

### Phase 1: v1.5 — Infrastructure & Determinism Foundation

**Goal:** Land the deterministic infrastructure that every v2.0a/b workflow depends on — versioned schemas, gate machinery, handoff bundles, determinism CI, coexistence eval harness, PII scanner, routing scaffolding, host-compatibility matrix — so v2.0a authoring starts on frozen ground.

**Depends on:** Nothing (first phase).

**Requirements:**
- DIST-01, DIST-02, DIST-03
- SPINE-01, SPINE-02, SPINE-03, SPINE-04
- ART-01, ART-02, ART-03, ART-04, ART-05, ART-06, ART-07
- GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07
- HAND-01, HAND-02, HAND-03, HAND-04
- FORMAT-01, FORMAT-02, FORMAT-03, FORMAT-04, FORMAT-05, FORMAT-06, FORMAT-07
- REF-01, REF-02, REF-04
- PREV-01, PREV-02, PREV-03, PREV-04, PREV-05
- TRUST-01, TRUST-02, TRUST-03, TRUST-04, TRUST-05
- TRIG-01, TRIG-02, TRIG-04
- PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04
- ROUTE-08
- SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07
- RECOV-01, RECOV-02, RECOV-03
- GTM-06

**Success Criteria** (what must be TRUE):
  1. A maintainer can author a new v2.0a workflow against frozen versioned JSON Schemas (persona, sitemap, MANIFEST, interaction-spec, audit-report, handoff-bundle) — every schema validates a fixture via `ajv`, every Zod source emits its JSON Schema via `zod-to-json-schema`, and `design-os migrate` upgrades a v0 fixture to v1 in CI.
  2. A maintainer running `design-os verify --golden` sees 5× byte-identical output from every `assets/scripts/*.mjs` emit script (`oklch`, `contrast`, `dtcg-lint`, `design-md-validate`, `handoff-bundle-build`, base gate-runner) on the v1.5 fixture set; CI linter rejects any LLM-client import inside `assets/scripts/`.
  3. A maintainer running the aggregate coexistence eval sees trigger recall ≥0.80 with 5 popular skill packages installed (GSD, Superpowers, frontend-design, shadcn, Notion-MCP); per-skill `skillgrade`-style harness reports recall ≥0.85 and false-fire ≤0.15 on the v1.5 in-tree skill stubs.
  4. A user running `design-os scan --pii` on a `design/research/interviews/` fixture sees the commit rejected when transcripts contain email/phone patterns; the shipped `.gitignore` / `.gitattributes` defaults reject rejected wireframe variants, raw transcripts, and `.design-os/private/` while preserving canonical artifacts.
  5. A maintainer can read this week's Anthropic-Labs watcher report (Claude Design release notes + `anthropics/skills` issues + Anthropic blog) and the host-compatibility matrix CI shows Claude Code fully passing with Codex CLI + Cursor scaffolded (even if not-yet fully passing) — the GTM kill-risk monitor (Pitfall 9) is live from week 1.

**Plans:** 5/5 plans executed (Phase 1 COMPLETE)

- [x] 01-01-PLAN.md — Schemas Foundation: 6 Zod sources + JSON Schema emit pipeline + ajv runtime validation + design-os migrate + design-md-validate version pinning (Wave 1)
- [x] 01-02-PLAN.md — Gate Runner + Handoff Bundle: base runGate with not_runnable + 6 per-stage skeletons + manifest.lock hash chain + tiktoken-budgeted handoff bundles + structural sufficiency eval + 4 stage-gate checklists (Wave 2)
- [x] 01-03-PLAN.md — Determinism CI + Eval Harness: verify --golden + lint-determinism + Mermaid renderer + skillgrade per-skill harness + aggregate coexistence eval + 5 CI workflows + recovery scripted test + ESLint exhaustiveness + Pitfall G schema-migration-guard (Wave 3)
- [x] 01-04-PLAN.md — design/ Governance + PII Scanner + Persistence: gitignore/gitattributes templates + design-os init + PII scanner with allowlist + pre-commit hook + MANIFEST.md reconciler + override-banner propagation + recovery prompt + SPINE linearity check + 3 SKILL.md skeletons + TRUST-POSTURE.md + COPY-REVIEW-CHECKLIST.md (Wave 3)
- [x] 01-05-PLAN.md — Preview Harness + Routing + References + Watcher: port-manager + Playwright runner + permission-boundary security sandbox (no vm2) + Vite/Next/Astro adapters + 6-axis variant-distance + run-subagent shim + 7-route registry with ROUTE-08 + 12 mandatory references + 3 host-profile workspaces + Anthropic-Labs watcher cron + heartbeat + MAINTAINERS.md + RAPID-RESPONSE.md (Wave 3)

### Phase 2: v2.0a — Skeleton (4 stages end-to-end, lite-mode Stage 5a/5b)

**Goal:** Ship a standalone-distributable 4-stage skeleton (`ingest` → `discover` → `structure` → `style-lite` → `systematize-lite` + basic `audit`) that delivers end-to-end value from PRD to provisional DESIGN.md + DTCG tokens, with the synthetic-persona red line and Stage 5a `not-runnable` gate enforced in code — so the package is shippable independently if Anthropic Labs ships a competing 5-stage tool during weeks 9-12.

**Depends on:** Phase 1

**Requirements:**
- DIST-04
- WF-01, WF-02, WF-03, WF-06 (lite), WF-07 (lite), WF-08 (basic — slop-tells + `--pr` + Stage 5a/5b detectors), WF-09
- ATOM-01, ATOM-02, ATOM-03, ATOM-04, ATOM-05, ATOM-06, ATOM-13, ATOM-14
- GATE-08
- FID-01, FID-02, FID-05
- RED-01, RED-02, RED-03, RED-04, RED-05, RED-06
- ROUTE-02 (partial — new-feature delta + skip-with-warning), ROUTE-04, ROUTE-05, ROUTE-07, ROUTE-09
- AUDIT-01 (stage-5a/5b detectors only), AUDIT-03, AUDIT-05, AUDIT-08
- ADAPT-01, ADAPT-03
- MVPA-01, MVPA-02, MVPA-03, MVPA-04, MVPA-05, MVPA-06, MVPA-07, MVPA-08
- COST-01, COST-02, COST-05, COST-06, COST-08, COST-09

**Success Criteria** (what must be TRUE):
  1. A user runs `design --route new-feature` on a Next.js 15 + Tailwind v4 + shadcn fixture starting from a Markdown PRD; the workflow produces `design/research/personas/*.persona.json` (with `provenance: generated` + `ASSUMPTIONS.md`), `design/ia/sitemap.json` + Mermaid flows, provisional `design/tokens.json` (DTCG) + `design/DESIGN.md` labeled `evidence: INFERRED` — and `gate/stage-5a-complete` returns `not-runnable, reason: stage-4-artifacts-absent` (CI-asserted).
  2. The Stage 1 gate hard-blocks `evidence: VALIDATED` 100/100 times when fed only synthetic personas (RED-05 adversarial CI); a prompt-injection canary asserts the red line cannot be bypassed by creative prompting (RED-06); every `findings.md` propagates `worstProvenance:` from cited personas.
  3. A user invoking `design --route design-bug` completes a Stage 5a-lite touch-up under the 20k-token budget; `design --route brand-refresh` completes under 55k; `design --route PR-audit` completes under 15k — per-stage and per-route token budgets verified by the eval harness on a 15-fixture run with `discover` p50 ≤30k, `structure` p50 ≤25k, `style` p50 ≤55k, `systematize` p50 ≤40k.
  4. A user running `audit --pr` against a PR that renames a route or breaks a sitemap link receives a severity-ranked `AUDIT-REPORT.md` (validated against `audit-report.v1.json`) with `findingId`, evidence pointer, fix recipe, and suppression option; `audit --slop-tells` flags rainbow gradients / Inter-default / glass-stack / three-column-grid on a fixture seeded with slop.
  5. A user installing v2.0a on Claude Code sees `design-os` triggers fire with recall ≥0.85 against the in-tree should-fire suite; on Codex CLI and Cursor (sequential-fallback scaffolded) the pass rate is within 0.10 of host-first — even though full Codex/Cursor parity is a Phase 4 release gate, v2.0a ships the scaffold.

**Plans:** 5/5 plans complete

- [x] 02-01-PLAN.md — Stage 1 gate business logic + discover workflow SKILL.md + three atoms (personas-proto, synthesize, build-ost) + adversarial CI suites RED-05/06 + worstProvenance propagation (Wave 1)
- [x] 02-02-PLAN.md — Stage 2 gate business logic + structure workflow SKILL.md + two atoms (sitemap-variants, flows-from-jobs) + sitemap structural distance + Mermaid repair loop (Wave 2)
- [x] 02-03-PLAN.md — Style-lite workflow SKILL.md + tokens-project.mjs DTCG emit + three adapter paths (shadcn/Tailwind v4/@theme/plain CSS) + budget-check.mjs + stage-5a gate regression CI (Wave 3)
- [x] 02-04-PLAN.md — Systematize-lite workflow SKILL.md + stage-5b gate business logic + DESIGN.md emit + Frost ≥3× deferred per D-44 (Wave 4, after 02-03 — depends on budget-check.mjs + tokens-project.mjs)
- [x] 02-05-PLAN.md — Audit scripts (slop-tells + PR detectors) + apply.mjs + ingest workflow + parse-or-interview atom + dispatch.mjs real wiring for 4 routes + 6 triggers.yaml + skillgrade eval + 15-fixture budget suite + Next15/Tailwind4/shadcn e2e fixture (Wave 5)

### Phase 3: v2.0b — Full 5 Stages + Lovable Refugee Path

**Goal:** Close the full Garrett spine by shipping Stages 3 (Sketch) and 4 (Interact) — the biggest competitive white space — plus `audit --reverse-engineer-stages` (the primary persona's raison d'être for Lovable refugees), promote Stage 5a/5b gates from lite to full, and migrate v2.0a `design/` directories to the v2.0b schema cleanly.

**Depends on:** Phase 2

**Requirements:**
- WF-04, WF-05
- ATOM-08, ATOM-09, ATOM-10, ATOM-11, ATOM-12, ATOM-15
- FID-03, FID-04, FID-06
- ROUTE-01 (full new-product opt-in path), ROUTE-03, ROUTE-06
- AUDIT-01 (stage 1-4 detectors added), AUDIT-02, AUDIT-04, AUDIT-06, AUDIT-07
- REF-03
- MVPB-01, MVPB-02, MVPB-03, MVPB-04, MVPB-05, MVPB-06, MVPB-07, MVPB-08, MVPB-09, MVPB-10
- COST-03, COST-04

**UI hint:** yes

**Success Criteria** (what must be TRUE):
  1. A user runs `design --route new-product --full` on a fresh PRD; the workflow completes all 5 stages with the picked-variant trail visible — Stage 3 wireframes are Excalidraw JSON with `≥3` structurally diverse alternatives (rejected variants gitignored), Stage 4 ships `design/interactions/<screen>.spec.md` + Mermaid stateDiagram-v2 as the designer-readable canonical artifact + XState v5 machine only where async + ≥3 states + conditional transitions, and full `gate/stage-5a-complete` now returns `PASS` (no longer `not-runnable`).
  2. A Lovable / v0 / Bolt refugee runs `design --route DS-extraction` (or `audit --reverse-engineer-stages`) against an existing prototype; the workflow infers Stages 1-4 with every artifact carrying `provenance: inferred` and propagating `INFERRED` grade downstream — and the loud "this is INFERRED, validate before treating as ground truth" disclaimer surfaces on every output.
  3. The Stage 3 gate rejects 100% of styled wireframes (color or non-default font in `.excalidraw`) on the adversarial fidelity-cap suite; the Stage 4 gate rejects hi-fi without complete state-maps; the Stage 5b gate promotes a component to the design system only when it recurs ≥3× in upstream wireframes/interactions (Frost rule, count-enforced not vibe-enforced).
  4. A user with a v2.0a `design/` directory runs `design-os migrate --from 2.0a --to 2.0b`; `sitemap.json` gains Stage 3 cross-refs, `persona.json` gains Stage 4 interaction needs, `MANIFEST.md` records new artifact types — and every existing v2.0a artifact continues to validate against its frozen schema while v2.0b workflows read the upgraded versions.
  5. A user runs `audit --all-stages` on a project missing Stage 2 + Stage 4 work; the report correctly identifies both gaps as a single ranked list (ACCEPT-06 prerequisite); `audit --new-feature` verifies a new feature passes through all 5 stages; `mature-app-refactor` (Stage 2 audit + Stage 4 audit + Stage 5b only) and full `new-product` budgets stay within `sketch` p50 ≤25k, `interact` p50 ≤30k, full `design` p50 ≤150k.

**Plans:** 5 plans (Wave 1: 03-01 + 03-02 parallel, Wave 2: 03-03 + 03-04 parallel, Wave 3: 03-05)

- [x] 03-01-PLAN.md — Stage 3 (Sketch): excalidraw-render.mjs + wireframe-diversity.mjs + gate-stage-3.mjs + FID-03 adversarial CI + sketch workflow + crazy-eights + converge atoms (Wave 1)
- [x] 03-02-PLAN.md — Stage 4 (Interact): state-machine-emit.mjs + mermaid-render stateDiagram-v2 + gate-stage-4.mjs + stage-3/4-pr.mjs + interact workflow + IxD atoms + 7 references (Wave 1, parallel)
- [ ] 03-03-PLAN.md — Gate Promotions: stage-5a.mjs full gate (D-60) + stage-5b.mjs Frost BLOCKER (D-70) + FID-06 adversarial + ATOM-15 scaffold-component (Wave 2)
- [ ] 03-04-PLAN.md — Reverse-Engineer + Migration: audit --reverse-engineer-stages + INFERRED enforcement + promote-inferred + v2.0a→v2.0b migration scripts (Wave 2, parallel)
- [ ] 03-05-PLAN.md — Route Completion + Audit: dispatch.mjs (new-product/mature-app-refactor/DS-extraction) + audit --all-stages + audit --new-feature + design SKILL.md update (Wave 3)

### Phase 4: v2.0 RC + GA — Acceptance, Cross-Host, Launch

**Goal:** Validate the full package against the §11 / R22 acceptance criteria across Claude Code + Codex CLI + Cursor, enforce the aggregate coexistence eval ≥0.80 release gate, complete designer + PM blind reviews, ship the launch artifact + cross-post to 8 marketplaces + named outreach + PR to anthropics/skills#1008, and reach GA — so design-os is the OSS canonical 5-stage design-process facilitator with measurable trust posture.

**Depends on:** Phase 3

**Requirements:**
- DIST-05, DIST-06, DIST-07
- TRIG-03
- ACCEPT-01, ACCEPT-02, ACCEPT-03, ACCEPT-04, ACCEPT-05, ACCEPT-06, ACCEPT-07, ACCEPT-08, ACCEPT-09
- COST-07, COST-10
- GTM-01, GTM-02, GTM-03, GTM-04, GTM-05, GTM-07

**Success Criteria** (what must be TRUE):
  1. The 15-fixture acceptance suite (PRD → DESIGN.md + tokens on Next.js + Tailwind v4 + shadcn) passes all 5 gates in ≥12 of 15 runs on Claude Code; Codex CLI and Cursor sequential-fallback paths pass within 0.10 of host-first (DIST-05, DIST-06).
  2. Aggregate coexistence eval reports trigger recall ≥0.80 with 5+ popular skill packages installed alongside design-os (TRIG-03) — this is the release gate; failure blocks GA. Adversarial CI shows 100/100 block rate on synthetic-only Stage 1 (ACCEPT-02), 100/100 reject rate on Stage 3 styled wireframes (ACCEPT-03), 100/100 refusal rate on Stage 5a without state-maps (ACCEPT-04), Stage 5b ≥3× recurrence enforced in fixture (ACCEPT-05).
  3. Two designers and two PMs (n≥5 each per success metric) complete blind reviews — ≥4 of 5 designers rate the output as "this is what doing it properly looks like, not Lovable shortcut" (ACCEPT-07); ≥4 of 5 PMs rate the PRD-to-design pipeline as "produces artifacts I'd actually share with engineering" (ACCEPT-08); axe-runner CI shows 100% pass on WCAG 2.2 AA contrast measurement on the package's own examples (ACCEPT-09).
  4. The launch artifact ships: long-form post "The 5 design stages every AI tool skips — and why your prototype struggles past month 3" (softened hook per codex feedback, GTM-01), 90-second video showing 3 variants per stage (GTM-02), cross-post manifest executed on 8 marketplaces (GTM-03, DIST-07), named outreach to Brad Frost and Marty Cagan delivered (GTM-04, Cagan framed as intellectual heritage not endorsement claim), PR submitted to anthropics/skills#1008 for DESIGN.md consume/produce support (GTM-05), and the rapid-response GTM pivot plan to "interoperability with Claude Design" is documented and ready if Anthropic ships overlap during the launch window (GTM-07).
  5. Cost discipline holds at GA: full `design` workflow p50 ≤150k tokens / p95 ≤220k tokens on the 15-fixture suite (COST-07), wall-clock p50 ≤8 minutes for full 5 stages (COST-10) — both verified on the cross-host matrix with per-stage budgets continuing to hold from Phases 2-3.

**Plans:** TBD — planned after Phase 3 completes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. v1.5 — Infrastructure & Determinism Foundation | 5/5 | Complete | 2026-05-25 |
| 2. v2.0a — Skeleton (4 stages, lite Stage 5a/5b) | 5/5 | Complete   | 2026-05-25 |
| 3. v2.0b — Full 5 Stages + Lovable Refugee Path | 2/5 | In Progress | - |
| 4. v2.0 RC + GA — Acceptance, Cross-Host, Launch | 0/0 | Not started | - |

## Coverage

**v1 active requirements:** 142 distinct REQ-IDs across 26 PROJECT.md R-numbered requirements (DIST-* ×7, SPINE-* ×4, ART-* ×7, GATE-* ×8, FID-* ×6, RED-* ×6, WF-* ×9, ATOM-* ×15, ROUTE-* ×9, HAND-* ×4, FORMAT-* ×7, REF-* ×4, PREV-* ×5, TRUST-* ×5, TRIG-* ×4, AUDIT-* ×8, PERSIST-* ×4, ADAPT-* ×5, MVPA-* ×8, MVPB-* ×10, ACCEPT-* ×9, COST-* ×10, SCHEMA-* ×7, RECOV-* ×3, GTM-* ×7).

**Phase mapping:** every active v1 requirement maps to exactly one phase (verified below in Traceability section of REQUIREMENTS.md). Four IDs are v2.1-deferred per REQUIREMENTS.md inline annotations and excluded from v1 phase mapping: **ATOM-07** (tree-test-design, v2.1), **ADAPT-02** (Material/Vue/Svelte bridges, v2.1+), **ADAPT-04** (Tokens Studio Figma export, v2.1), **ADAPT-05** (Optimal Workshop CSV, v2.1).

**Coverage:** v1 active mapped = 142 / 142 (excluding the 4 v2.1-deferred IDs). No orphaned v1 requirements. No requirement mapped to more than one phase.

## Research Flags

Phases likely to benefit from `/gsd-research-phase` before planning:

- **Phase 1 v1.5** — Handoff-bundle schema + sufficiency eval design (novel metric, no off-the-shelf pattern); aggregate coexistence eval design (no existing tool tests trigger recall in multi-package state; Codex 2% cap behavior in mid-2026 may differ from MRD's ~5k char assertion).
- **Phase 3 v2.0b** — Stage 3 (Crazy 8s) structural diversity metric (the v1.0.1 6-axis *visual-style* metric does not apply to greyscale wireframes; a *structural* metric is unprecedented and the v2.0b highest-risk item); `audit --reverse-engineer-stages` inference fidelity (reverse-inference from a rendered prototype is fundamentally lossy); Google DESIGN.md spec drift watch (animations / dark-mode / breakpoints flagged "may change").

Phases with standard patterns (research-phase optional):

- **Phase 2 v2.0a** — Preview harness adapters (Vite 6 / Next 15 / Astro 5) preserved from v1.0.1; DTCG v2025.10 emit + Tailwind v4 `@theme` projection (specs stable HIGH-confidence).
- **Phase 4 RC + GA** — Cross-host smoke + acceptance harness exists by Phase 3 end; no novel methodology required.

---
*Roadmap created: 2026-05-24*
*Granularity: coarse (4 phases, 1-3 plans each)*
