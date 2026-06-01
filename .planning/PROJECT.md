# complete-design

## What This Is

A SKILL.md package (Claude Code / Cursor / Codex / Junie) that scaffolds the canonical 5-stage design process — Research → IA → Low-Fi → Interaction → Hi-Fi + Design System — inside the coding agent the user already uses. Unlike Lovable / v0 / Bolt / Subframe / Figma Make / Claude Design which all jump straight to Stage 5 hi-fi generation, complete-design walks the full Garrett spine (Strategy → Scope → Structure → Skeleton → Surface) with AI scaffolding at each stage and explicit validation gates between them.

## Core Value

**The 5-stage design process, operationalized as an agent-loop workflow with stage-typed artifacts in `design/` and validation gates between stages — so prototypes don't break at production scale.** If everything else fails, this must work: a user runs `design --route new-product` on a fresh PRD, and at the end has a real `design/` directory with research, IA, IxD, hi-fi, and a DESIGN.md contract — each stage gated, each gate cited to canon.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **R1 — Distribution unit.** Ship as an agentskills.io v1 SKILL.md package: ~22 triggerable skills (7 workflows + 15 atoms) under the Codex 2% trigger-metadata cap.
- [ ] **R2 — Garrett 5-plane spine.** Architecture maps 1:1 to user's 5 stages (Strategy / Scope / Structure / Skeleton / Surface). Every workflow and atom declares `stage:` frontmatter.
- [ ] **R3 — `design/` directory convention.** Stage-typed artifact substrate. Committed to git. Designer- and AI-readable. Per-file commit policy + frontmatter + `.gitattributes` merge strategy + raw-transcript gitignoring.
- [ ] **R4 — Stage validation gates.** Six first-class deterministic checklist gates (stage-1 through stage-5b) with four terminal states (PASS / PASS_WITH_WARNINGS / FAILED_AFTER_REPAIR / USER_OVERRIDDEN) and four evidence grades (VALIDATED / PROTO / INFERRED / MISSING).
- [ ] **R5 — Per-stage fidelity caps (Buxton discipline).** Stage 3 refuses styled UI; Stage 4 refuses hi-fi without complete state-maps; Stage 5a refuses to render hi-fi for components without state-maps; Stage 5b promotes to system only on ≥3× recurrence.
- [ ] **R6 — Synthetic-persona red line (NN/g).** Stage 1 hard-blocks `VALIDATED` grade with synthetic-only data; `PROTO` grade allowed with explicit `ASSUMPTIONS.md`; persona JSON always carries `provenance:`.
- [ ] **R7 — Workflow inventory (7 + audit).** `ingest` (Stage 0) → `discover` (1) → `structure` (2) → `sketch` (3) → `interact` (4) → `style` (5a) → `systematize` (5b) + cross-stage `audit`. Each workflow supports `--depth lightweight|standard|full`.
- [ ] **R8 — Atomic skills (15).** Per stage: 1 / 3 / 3 / 2 / 3 / 3, all with `mvp: true|false` flags and standalone bootstrap behaviour.
- [ ] **R9 — Job-routing matrix.** Seven named routes (new-product, new-feature, mature-app-refactor, design-bug, brand-refresh, DS-extraction, PR-audit) — each declares required/optional/skipped stages and per-route token budget. Default is *not* "all 5 stages."
- [ ] **R10 — Compact stage-handoff bundles.** `design/.handoff/stage-N-bundle.md` (~5-15k tokens per stage) replaces raw-directory ingestion to bound context regardless of `design/` size.
- [ ] **R11 — Anchor formats.** Markdown + YAML frontmatter (PRD); JSON personas; custom `$type` schema for `sitemap.json`; Mermaid for flows + state diagrams; Excalidraw JSON for wireframes; XState v5 for IxD machines (only required when async + ≥3 states + conditional transitions); Google DESIGN.md + W3C DTCG v2025.10 for tokens.
- [ ] **R12 — Knowledge architecture (`references/`).** Hybrid file-based, no vector DB. Mandatory canon corpus per stage + 6 stage-gate docs + PRD canon + slop-tells.
- [ ] **R13 — Preview & determinism (preserved from v1.0.1).** Local dev-server boot (Vite/Next/Astro adapters), Playwright readiness, port manager, security sandbox, deterministic emit (LLM picks, scripts emit: `oklch.mjs`, `contrast.mjs`, `dtcg-lint.mjs`, `design-md-validate.mjs`, `state-machine-emit.mjs`).
- [ ] **R14 — Trust posture.** Don't lead with AI; never claim WCAG conformance (report measured contrast); cite every rule at canon granularity; ask before generating; diff-by-default (`--apply` required); slop-detection first-class.
- [ ] **R15 — Trigger discipline (Codex 2% cap).** 22 skills × ~200-char descriptions ≈ ~5k chars metadata. Per-skill `skillgrade` CI: ≥10 should-fire + ≥10 should-not-fire prompts, 3 trials each. Trigger recall ≥0.85, false-trigger rate ≤0.15. Aggregate coexistence eval ≥0.80 with 5+ other skill packages installed.
- [ ] **R16 — `audit` cross-stage verb.** Per-stage detector logic (`audit --stage N --pr`), `--all-stages`, `--slop-tells`, `--new-feature`, `--pr`, plus `--reverse-engineer` (Lovable refugee path, shipped in v2.0b).
- [ ] **R17 — Host compatibility.** Claude Code host-first; Codex CLI + Cursor sequential-fallback; broader hosts (Junie, Copilot, etc.) deferred to v2.1+.
- [ ] **R18 — Persistence split.** `design/` (artifacts, committed) vs `.complete-design/` (package state, selectively committed) per v1.0.1 policy. Decision log + hash chain + manual-override capture preserved.
- [ ] **R19 — Polyglot adapters.** Inputs: Markdown PRD, paste, interview mode (Lenny 1-pager); v2.1 Notion/Linear/Google Doc; v2.2 Dovetail/Notably transcripts. Outputs: Tailwind v4 / shadcn / plain CSS in core; Material Web / Vue / Svelte via `complete-design-bridges` v2.1+.
- [ ] **R20 — v2.0a MVP scope.** 5 workflows (`ingest`, `discover`, `structure`, `style-lite`, `systematize-lite`) + 9 atoms + 4 gates (stage-1, stage-2, stage-5a, stage-5b). `style`/`systematize` ship in **lite** mode and explicitly do not claim `gate/stage-5a-complete` until Stage 4 ships.
- [ ] **R21 — v2.0b full 5-stage scope.** Adds `sketch` + `interact` workflows + 6 atoms + Excalidraw/Mermaid/XState renderers + stage-3 & stage-4 gates + `audit --reverse-engineer-stages` (Lovable refugee path, moved up from v2.1).
- [ ] **R22 — Acceptance criteria.** End-to-end fixture: `design` workflow runs PRD → DESIGN.md + tokens on a Next.js + Tailwind v4 + shadcn fixture with all 5 gates passing in ≥12 of 15 runs. Adversarial tests: synthetic-only Stage 1 hard-blocks (100%); Stage 3 fidelity-cap rejects styled wireframes (100%); Stage 5a refuses hi-fi without state-maps (100%).
- [ ] **R23 — Cost discipline.** `discover` p50 ≤30k; `structure` p50 ≤25k; `sketch` p50 ≤25k; `interact` p50 ≤30k; `style` p50 ≤55k; `systematize` p50 ≤40k. Full `design` workflow p50 ≤150k / p95 ≤220k tokens; new-feature route p50 ≤60k; design-bug route p50 ≤20k. Wall-clock p50 ≤8 min for full 5 stages.
- [ ] **R24 — Versioned JSON Schemas (v1.5 prerequisite).** Ship versioned schemas for `persona.json`, `sitemap.json`, `MANIFEST.md`, state specs, `AUDIT-REPORT.md` before v2.0a build starts.
- [ ] **R25 — Partial-output recovery.** User can interrupt `design` after any stage; partial outputs in `design/` are usable on their own; resumption from any stage boundary supported (100% scripted-test pass).
- [ ] **R26 — GTM launch artifact.** Primary hook ships at GA: long-form post *"The 5 design stages every AI tool skips — and why your prototype struggles past month 3"* with live demo + cross-post to 8 marketplaces + named outreach (Brad Frost, Marty Cagan as intellectual heritage, etc.) + PR to anthropics/skills#1008.

### Out of Scope

- **Prompt → fully-shipped UI from scratch** — v0/Lovable/Bolt own this; we're complementary, not competitive.
- **Visual canvas editing** — Subframe / Figma Make territory.
- **Hosting / deploy** — orthogonal; user owns runtime.
- **Authoring the DESIGN.md spec itself** — Google owns; we adopt.
- **Authoring the DTCG spec** — W3C owns; we emit.
- **Branded design IP / licensed assets** — legal and not in scope.
- **Generating personas from synthetic data alone (as primary research)** — NN/g 2024 red line; package hard-blocks.
- **Replacing Dovetail / Maze / Optimal Workshop research repositories** — we read their exports, we don't replace them.
- **Replacing ProtoPie / Origami for advanced IxD** — we cover the canonical stage; advanced motion tooling stays elsewhere.
- **Hosted SaaS** — OSS only in v2.0; enterprise dashboard is a separate sibling product.
- **Figure-recognition vision generator** — deferred indefinitely.
- **Generic "AI design" marketing framing** — discourse poison; complete-design is positioned as a *design-process facilitator*, not an "AI design tool."
- **Notion / Linear / Google Doc PRD ingestion in v2.0** — deferred to v2.1.
- **Voice → PRD interview mode** — deferred to v2.2.
- **`extract --reverse-engineer-stages` in v2.0a** — moved to v2.0b (still within MVP), not v2.1.
- **i18n / RTL / CJK handling** — dedicated atom deferred to v2.1.

## Context

- **Why now (2026):** Five concurrent shifts make this MRD timely. (1) The AI-prototyping cohort (v0, Lovable, Bolt) hit "the 80/20 wall" — Sourcetoad's audit of 1,645 Lovable apps found 10.3% shipped with critical user-data vulns; 2025 Stack Overflow survey says 76% of AI-codegen users hit unmaintainable-scale. (2) The canonical 5-stage design canon is settled and widely taught (Garrett, Cooper, Rosenfeld, Buxton, Saffer, Frost) yet **no tool operationalizes the full spine**. (3) agentskills.io v1 spec stabilized 2025-12-18. (4) W3C DTCG v2025.10 first stable token spec landed 2025-10-28. (5) Google open-sourced DESIGN.md April 2026 — Stage 5 contract anchor now exists.
- **Stage-coverage matrix:** verified empirically across 17+ tools. No competing product covers the full 5-stage row. Lovable / v0 / Bolt / Subframe / Stitch / Figma Make / Builder.io / Tempo / Claude Design / frontend-design / Knapsack IPE / Storybook MCP all cluster at Stage 5. Maze / Optimal Workshop own stages 1-2 in SaaS silos. UIzard / Visily own stage 3 in walled gardens. The integrative play does not exist as a product.
- **Primary segments:** indie devs building a new app; solo founders migrating off Lovable/v0/Bolt prototypes ("Lovable refugees"); PMs at startups with a PRD but no design work yet.
- **Prior work preserved from v1.0.1:** Stage 5 preview-first workflow (Vite/Next dev-server, Playwright screenshots, variant distance metric), DESIGN.md as Stage 5 anchor, DTCG tokens, critique gate with terminal states, persistence under `.complete-design/`, security/permissions, monorepo design, determinism verification, trigger discipline, host compatibility, GTM principles.
- **What's new in v2.0:** the spine pivot — from "design-contract layer with preview" to **Garrett's 5-plane spine**. Added Stages 1-4 (Research, IA, Low-Fi, IxD) as first-class. Six stage-gate checklists with evidence grades. Per-stage fidelity caps. Synthetic-persona red line. Job-routing matrix (7 routes). Compact stage-handoff bundles.
- **MVP wedge:** a working end-to-end run of `discover → structure → style` (Stages 1, 2, 5) for an indie building a new app. Stages 3-4 ship a few weeks later. This sequence delivers usable end-to-end value on day one while reserving the biggest unfilled niche (IxD) for the differentiation push.

## Constraints

- **Tech stack — distribution:** SKILL.md package per agentskills.io v1 spec. Compatibility: claude-code, codex-cli, cursor, junie, copilot (host-first Claude Code; sequential-fallback Codex + Cursor).
- **Tech stack — assets:** Vite + Next + Astro adapters for preview; Playwright for screenshots; Excalidraw JSON, Mermaid, XState v5 as artifact formats; DTCG v2025.10 for tokens; Google DESIGN.md spec.
- **Tech stack — references corpus:** organized by stage + canon body. Local Markdown only (no vector DB, no knowledge graph in v2).
- **Trigger budget:** Codex 2% metadata cap — ≤24 triggerable skills total; per-skill descriptions ≤200 chars. Per-skill `skillgrade` CI gates regressions.
- **Cost budget:** see R23. Full `design` workflow ≤150k tokens p50, ≤220k p95. Stage-bounded subagent dispatch with stitched context to avoid context-window blowouts.
- **Timeline:** 14 weeks to GA. v1.5 infra weeks 1-3 → v2.0a skeleton weeks 4-8 → v2.0b full 5 stages weeks 9-12 → RC week 13 → GA week 14.
- **License:** Apache-2.0.
- **Trust posture (non-negotiable):** never claim WCAG conformance; never use synthetic personas as primary research; never auto-publish to git tree (diff-by-default, `--apply` required); never lead with "AI" framing.
- **Determinism:** LLM picks; scripts emit. Golden tests + decision log + hash chain + `complete-design verify --golden` CI gate.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Spine = Garrett's 5 planes (not IDEO / d.school / Double Diamond / Lean UX) | Maps 1:1 to user's 5 stages; discrete artifacts and validation per plane; structural not procedural; most other frameworks borrow from it implicitly | — Pending |
| `design/` directory as cross-stage artifact substrate (not `.complete-design/DESIGN.md` only) | Stage-typed files chain across stages; designer- and AI-readable; reproducible pipeline; version-controllable | — Pending |
| Stage validation gates first-class, with four-tier evidence grades (VALIDATED / PROTO / INFERRED / MISSING) | The most under-documented part of canon; honestly handles the solo-indie reality without abandoning discipline | — Pending |
| Hard fidelity caps per stage (Buxton discipline) — Stage 3 refuses styling, Stage 4 refuses hi-fi without state-maps | Counter-cultural; every other AI design tool eagerly renders hi-fi; the discipline IS the product | — Pending |
| Synthetic-persona red line (Stage 1 hard-blocks `VALIDATED` grade with synthetic-only data) | NN/g 2024 / ACM Interactions 2026 finding; buys designer trust; prevents the "AI replaces research" failure mode | — Pending |
| Job-routing matrix (7 routes) — default is NOT all 5 stages | Process-averse indie devs need an on-ramp; mature-app work needs degradation paths; codex feedback | — Pending |
| MVP split into v2.0a (4 stages, lite mode) + v2.0b (full 5 stages + Lovable-refugee path) | Each release is shippable; v2.0a delivers end-to-end value in 8 weeks; v2.0b closes the biggest white space (IxD) and the primary persona (Lovable refugee) | — Pending |
| `style-lite` / `systematize-lite` in v2.0a do NOT claim `gate/stage-5a-complete` | Codex BLOCKER fix — Stage 5a gate requires Stage 4 artifacts which v2.0a doesn't ship; honesty over false claims | — Pending |
| XState only required for components with async + ≥3 states + conditional transitions; Mermaid stateDiagram-v2 is the canonical designer-readable artifact | Codex feedback — XState as primary would overfit engineering audience | — Pending |
| Compact stage-handoff bundles (`design/.handoff/stage-N-bundle.md`) replace raw-directory ingestion | Codex feedback — "read all upstream artifacts" doesn't scale past a few stages; bounds context regardless of `design/` size | — Pending |
| Don't lead with "AI" framing; position as "design-process facilitator" | van Schneider signal; Frontend Masters critique; designer trust gap; aligns with discourse direction post-2025 vibe-coding backlash | — Pending |
| Launch hook softened from "What every AI design tool gets wrong" to "The 5 design stages every AI tool skips" | Codex feedback — softer framing avoids antagonizing Vercel/v0 specifically while preserving the substantive critique | — Pending |
| Distribution = SKILL.md package (not standalone CLI, not VS Code extension) | Inside the user's repo, in their agent, on their existing LLM subscription; no second tool, no double-billing, no context-switch (v1.0.1 advantage preserved) | — Pending |
| Year-1 monetization = zero; distribution dominates | OSS-first; vendor sponsorship + consulting + course as plausible year-2 paths; enterprise design-process-compliance SKU sketched for year-2+ | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-24 after initialization*
