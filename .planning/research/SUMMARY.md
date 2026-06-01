# Project Research Summary

**Project:** complete-design
**Domain:** SKILL.md package (agentskills.io v1) — design-process facilitator embedded in coding agents (Claude Code / Codex CLI / Cursor / Junie / Copilot)
**Researched:** 2026-05-24
**Confidence:** HIGH on spec/format/canon pinning; MEDIUM on infrastructure-load estimate (v1.5 phase length) and Stage 3/4 quality empirics; LOW on the existence of an external `skillgrade` package and the exact runtime behavior of the Codex 2% cap in mid-2026.

## Executive Summary

complete-design is **not** a typical web app. It is a Markdown + Node.js *skill package* that ships into the user's existing agent host and operationalizes the canonical 5-stage design process (Garrett spine: Strategy → Scope → Structure → Skeleton → Surface) with stage-typed artifacts in a `design/` directory, six first-class validation gates, and four evidence grades (VALIDATED / PROTO / INFERRED / MISSING). It ships zero React/Next/Vue — those frameworks appear only as (a) *adapter targets* for what the package emits into the user's repo and (b) *detected user-repo state* for the preview harness preserved from v1.0.1. The substrate is `design/` in the user's git tree (committed, designer-readable, AI-readable) plus `.complete-design/` for package state (manifest hash chain, manual-override capture, preview run state, decision log). The architectural contract is **"LLM picks, scripts emit"** — every output that must be deterministic (DTCG tokens, contrast measurements, XState code, screenshots) flows through Node ESM scripts in `assets/scripts/`, never inline LLM emission.

Expert practice in this space converges on a very small set of standards: agentskills.io v1 (Dec 2025) for distribution; W3C DTCG v2025.10 (first stable, Oct 2025) for tokens; Google DESIGN.md (Apache-2.0, April 2026) for the Stage 5 contract; Mermaid stateDiagram-v2 as the designer-readable IxD canon with XState v5 as the conditional engineering parallel; Excalidraw JSON for low-fi; OKLCH + Tailwind v4 `@theme` for color emission. Trust posture is itself a feature — never claim WCAG conformance (report measured contrast), never use synthetic personas as primary research (NN/g 2024 red line), never auto-publish to git (diff-by-default, `--apply` required), never lead with "AI" framing. The competitive moat is structural: per MRD §2.5 stage-coverage matrix verified across 17+ tools, **no competitor covers the full 5-stage row** — Lovable/v0/Bolt/Subframe/Claude Design/frontend-design cluster at Stage 5; Maze/Optimal Workshop at Stages 1-2; UIzard/Visily at Stage 3. The integrative play does not exist as a product.

The five highest-leverage risks are: (1) **Codex 2% trigger-metadata aggregate cap** (recall regression in 5+-package install state); (2) **synthetic-persona red line breach** via prompt injection or provenance leakage across artifacts; (3) **fidelity-cap leakage** — LLM leaking color into wireframes or `style-lite` claiming `gate/stage-5a-complete` (the codex BLOCKER from §16); (4) **context-window blowout** without disciplined `.handoff/stage-N-bundle.md` ingestion; (5) **GTM kill-risk** if Anthropic Labs ships a 5-stage equivalent inside Claude Design before GA. All five have concrete mitigations already specified in MRD §3.22, §3.23, §9.1, §11, §12 — but each mitigation must be *enforced in code*, not by honor system, before v2.0 GA. **Two researchers (Architecture, Pitfalls) independently surfaced that v1.5 infra is under-scoped at 3 weeks given the deliverables it must absorb (versioned schemas + migration tooling, handoff-bundle script + schema, host-compatibility matrix CI, aggregate coexistence eval, PII scanner, determinism golden CI, routing matrix scaffolding, Anthropic-watcher process, designer-readable Mermaid renderer); we recommend expanding v1.5 to 4 weeks and either compressing RC or slipping GA to week 15.** This is a roadmap-level conflict captured in §"Implications for Roadmap" below.

## Key Findings

### Recommended Stack

complete-design ships as a **pure Markdown + Node 22 LTS ESM** package; no bundlers, no frontend framework, no vector DB, no knowledge graph. Three stack layers must be kept distinct: (a) what complete-design itself ships, (b) what it generates into the user's repo, (c) what it detects/reads in the user's repo. Conflating these is the #1 architectural risk. Frontmatter parsed by `gray-matter`; YAML round-trip by `yaml` (NOT js-yaml); schema authoring in **Zod 4.4** with `zod-to-json-schema` to emit the versioned R24 schemas; runtime JSON Schema validation by `ajv` 8 + `ajv-formats`; OKLCH/contrast math by `culori` 4 ESM + `apca-w3` + `@bjornlu/wcag-contrast`; Playwright 1.60 for screenshot variants; `vitest` 2 for eval/golden tests; `axe-core` 4.11 for the accessibility CI gate. Preview adapters target Vite 6 / Next 15 (App Router only) / Astro 5. Detail in `STACK.md`.

**Core technologies:**
- **agentskills.io v1 SKILL.md spec** — distribution unit; cross-host portability (Claude Code, Codex, Cursor, Junie, Copilot); ≤200 char descriptions, `name` + `description` required, `compatibility:` treated as best-effort not enforceable
- **Markdown + YAML 1.2 frontmatter (CommonMark)** — skill bodies, the entire `references/` canon corpus, and every emitted artifact in `design/`
- **Node 22 LTS + TypeScript 5.7 strict (compiled to ESM `.mjs`)** — deterministic emit scripts in `assets/scripts/`; users never run `npm install`; scripts are pre-bundled
- **Zod 4.4** — schema authoring → emit versioned JSON Schemas via `zod-to-json-schema` (R24 v1.5 prerequisite); validate at API/system boundaries per CLAUDE.md TS discipline
- **W3C DTCG v2025.10** — first stable token spec; media type `application/design-tokens+json`; primitive→semantic→component tiers; emitted at Stage 5b
- **Google DESIGN.md (April 2026, Apache-2.0)** — Stage 5b contract; emit with `$extensions.complete-design` namespace per MRD §3.6; spec stability over the 14-week window is the highest *format* risk (MEDIUM confidence)
- **Mermaid 11.15 + Excalidraw JSON + XState v5.20** — Stage 2/4 designer-readable diagrams (Mermaid canonical), Stage 3 low-fi (Excalidraw via `convertToExcalidrawElements`, never hand-built), Stage 4 engineering parallel (XState only when async + ≥3 states + conditional transitions)
- **Playwright 1.60 + Vite 6 / Next 15 / Astro 5 adapters** — preview harness preserved from v1.0.1: port manager, security sandbox, readiness probe, headless screenshot capture, Tailwind v4 + shadcn as default emit target
- **`culori` 4 + `apca-w3` + `@bjornlu/wcag-contrast`** — OKLCH/contrast math; report measured numbers, never "WCAG compliant"

**Explicitly NOT in the stack:** React/Next/Vue/Svelte inside complete-design itself (only as emit targets); vector DBs or knowledge graphs for `references/` (MRD §3.10 / §16 forbids; would break determinism + zero-infra principle); js-yaml for round-trip writes; ts-node; CommonJS; Tailwind v3; Node 18/21/23; Pages Router (App Router only).

### Expected Features

complete-design exposes 22 triggerable skills (7 workflows + 15 atoms) + 6 stage gates + 7 named routing matrix routes. Categorization is based on MRD §2.5 stage-coverage matrix (17+ tools verified empirically), all 26 active requirements in PROJECT.md, and the §16 codex acceptance record (69 cumulative findings, all accepted). Detail in `FEATURES.md`.

**Must have (table stakes — v2.0a):**
- SKILL.md package per agentskills.io v1 + per-skill description ≤200 chars + trigger discipline (recall ≥0.85, false-fire ≤0.15, aggregate coexistence ≥0.80 with 5+ packages)
- PRD ingestion (Markdown + YAML frontmatter; paste-text; Lenny-style interview fallback for empty PRDs)
- DTCG v2025.10 token emit + Google DESIGN.md compliance with `$extensions.complete-design`
- WCAG 2.2 AA contrast *measurement* (never conformance claim)
- Slop detection (`audit --slop-tells`), diff-by-default + `--apply`, citation-at-canon-granularity discipline
- Local dev-server preview (Vite/Next/Astro adapters preserved from v1.0.1 with Playwright)
- Decision log + hash chain + manual-override capture (preserved from v1.0.1)
- Multi-host compatibility: Claude Code host-first; Codex CLI + Cursor sequential-fallback
- Versioned JSON Schemas for persona / sitemap / MANIFEST / state-spec / AUDIT-REPORT / handoff-bundle (R24 v1.5 prerequisite)
- Partial-output recovery (R25, 100% scripted-test pass)
- Deterministic emit ("LLM picks, scripts emit" — P6/R13)

**Should have (differentiators — the structural moat):**
- Garrett 5-plane spine operationalized 1:1 to user's stages
- Six first-class stage gates with 4 terminal states × 4 evidence grades
- Per-stage fidelity caps (Buxton discipline) — Stage 3 refuses styling; Stage 5a refuses hi-fi without state-maps; Stage 5b promotes on ≥3× recurrence
- Synthetic-persona red line (Stage 1 hard-blocks `VALIDATED` with synthetic-only data)
- `design/` directory as cross-stage artifact substrate (designer- and AI-readable, git-versioned)
- Compact stage-handoff bundles (`design/.handoff/stage-N-bundle.md` ~5-15k tokens) — context-window survival mechanism
- Job-routing matrix (7 routes; default ≠ all 5 stages) + per-route token budgets (design-bug ≤20k, new-feature ≤60k, new-product p50 ≤150k / p95 ≤220k)
- `audit --reverse-engineer-stages` (Lovable refugee path, v2.0b — primary persona feature)
- Crazy 8s as Excalidraw JSON with low-fi diversity enforcement (Stage 3 white space)
- XState v5 + Mermaid stateDiagram-v2 dual-emit (Stage 4 biggest white space; Mermaid canonical for designers)
- Microsoft HAX-18 audit (AI-products only) at Stage 4
- Polyglot adapters: Tailwind v4 / shadcn / plain CSS in core; Material/Vue/Svelte via `complete-design-bridges` (v2.1+)

**Defer (v2.1+ — explicit cessions per MRD §14):**
- Notion / Linear / Google Doc PRD ingestion (v2.1; Notion scope = Gaia Logic projects only per CLAUDE.md)
- Voice → PRD interview mode (v2.2; Whisper)
- Dovetail / Notably transcript ingestion (v2.2)
- i18n / RTL / CJK dedicated atom (v2.1)
- Optimal Workshop tree-test CSV (v2.1); Tokens Studio Figma export (v2.1)
- Storybook MCP via Chromatic (v2.1+)
- Broader hosts (Junie, Copilot) — host churn; ship after host APIs stabilize
- Enterprise audit dashboard (year-2+ sibling product, not OSS feature)

**Anti-features (strategic refusals, NOT just deferrals):** prompt → fully-shipped UI from scratch (Lovable/v0/Bolt own this); visual canvas editing (Subframe/Figma Make); hosting/deploy; hosted SaaS year-1; authoring the DESIGN.md or DTCG spec itself (Google/W3C own); synthetic personas as primary research; auto-publishing to git tree; WCAG conformance claims; generic "AI design" marketing framing.

### Architecture Approach

complete-design is an **agent-host SKILL.md package** orchestrating 7 workflows + 15 atoms via the host's Read/Write/Bash tools, backed by deterministic Node ESM emit scripts and a local Markdown canon corpus. The user-repo persistence surface splits into `design/` (committed cross-stage IR substrate) and `.complete-design/` (selectively committed package state: manifest hash chain, manual-overrides, preview run state, gitignored private logs/screenshots). The data-flow contract is **stitched-context subagent dispatch** — each stage workflow reads only `design/.handoff/stage-(N-1)-bundle.md` (~5-15k tokens) plus stage-scoped references; full upstream artifacts are loaded on-demand to verify specific claims. Six core architectural patterns (per `ARCHITECTURE.md`): (1) LLM picks / scripts emit; (2) stage-typed artifact substrate as IR; (3) compact handoff bundles; (4) evidence-graded validation gates as `(terminal-state, evidence-grade)` tuples; (5) stitched-context subagent dispatch with cross-host parity; (6) per-file commit policy + frontmatter-tagged artifacts.

**Major components:**
1. **`skills/` (22 SKILL.md units)** — 7 workflows (`ingest`/`discover`/`structure`/`sketch`/`interact`/`style`/`systematize` + cross-stage `audit`) and 15 atoms organized by stage; each carries `name`/`description`/`stage`/`gate`/`artifacts.reads`/`writes`/`composition`/`compatibility`/`mvp` frontmatter
2. **`assets/scripts/` (deterministic emit layer)** — Node ESM scripts the LLM cannot bypass: `oklch.mjs`, `contrast.mjs`, `dtcg-lint.mjs`, `design-md-validate.mjs`, `state-machine-emit.mjs`, `mermaid-render.mjs`, `excalidraw-validate.mjs`, `port-manager.mjs`, `playwright-runner.mjs`, `security-sandbox.mjs`, `variant-distance.mjs`, `handoff-bundle-build.mjs`, plus per-stage `gates/stage-N.mjs` and `audit/*.mjs` (slop-tells, per-stage PR detectors, reverse-engineer)
3. **`references/` (canon corpus)** — local Markdown organized by both stage and canon body (Garrett, Cooper, Torres, Klement, Rosenfeld, Buxton, Saffer, Frost, WCAG, DTCG, DESIGN.md) + 6 stage-gate operational checklists + PRD canon + slop-tells; no vector DB, no graph
4. **`schemas/` (v1.5 prerequisite)** — versioned JSON Schemas emitted from Zod via `zod-to-json-schema`: `persona.v1.json`, `sitemap.v1.json`, `manifest.v1.json`, `interaction-spec.v1.json`, `audit-report.v1.json`, `handoff-bundle.v1.json`
5. **`evals/` (CI-gated quality bar, co-equal with `skills/`)** — per-skill trigger suites (≥10 should-fire + ≥10 should-not-fire × 3 trials), golden output tests, 15-fixture end-to-end suite, adversarial tests (synthetic-persona block, fidelity-cap reject, color-leak canary, prompt-injection canary), aggregate coexistence eval with 5+ skill packages installed, per-stage handoff-bundle sufficiency tests
6. **User-repo persistence (`design/` + `.complete-design/`)** — `design/` carries stage-typed artifacts with required frontmatter (`artifact`/`stage`/`generated`/`schemaVersion`/`sourceHash`/`provenance`/`owner`/`lastReviewedAt`); `.gitignore` rejects raw transcripts, rejected wireframe variants, screenshots, `.complete-design/private/`; `.gitattributes` declares `design/*.json merge=ours` to bound merge-conflict pain

### Critical Pitfalls

1. **Codex 2% aggregate trigger-metadata cap breach** — 22 skills × ~200 chars fits in isolation but silently truncates once 5+ popular packages (GSD, Superpowers, frontend-design, shadcn, Notion-MCP) coexist. *Mitigation:* aggregate coexistence eval ≥0.80 enforced in CI from v1.5; per-skill front-loading of fire-condition keywords in first 100 chars; contingency split into `complete-design-core` + `complete-design-atoms` per MRD §12.
2. **Synthetic-persona red line breach via prompt injection or evidence-grade leakage** — LLMs are sycophantic (the NN/g + ACM papers complete-design honors are the same papers showing LLMs cave to social pressure). *Mitigation:* deterministic gate enforcement (`gate-stage-1.mjs` reads `persona.json` frontmatter `provenance:` and refuses `evidence: VALIDATED` if any persona is `generated` without linked interviews); provenance propagation requiring downstream artifacts to inherit `worstProvenance:`; adversarial + prompt-injection canary tests in CI; `USER_OVERRIDDEN` requires `--override-reason` flag + visible banner on every downstream artifact.
3. **Fidelity-cap leakage — `style-lite` claims full Stage 5a gate (codex §16 BLOCKER)** — sloppy implementation lets `style-lite` emit `(PASS, VALIDATED)` for `gate/stage-5a-complete` even though Stage 4 artifacts don't exist in v2.0a. *Mitigation:* gate runner hard-coded to return `not-runnable, reason: stage-4-artifacts-absent` when `design/interactions/` is empty; `evidence: INFERRED` is the only schema-allowed value for v2.0a Stage 5a/5b output; CI test asserts this on every v2.0a release; Excalidraw validator rejects color/font drift in Stage 3.
4. **Context-window blowout from raw-directory ingestion** — Stage 4+ on real projects easily exceeds 150k tokens before the new stage starts. *Mitigation:* handoff bundles are a workflow *contract*, not optimization — each stage reads `.handoff/stage-(N-1)-bundle.md` and is prohibited from reading raw upstream files except for explicit verification queries; per-bundle sufficiency eval gates release; p50/p95 budgets enforced in CI on 15-fixture suite.
5. **GTM kill-risk — Anthropic ships a 5-stage equivalent in Claude Design first** — MRD §12 lists this as Medium-likelihood, *Existential* impact. The 14-week timeline is the vulnerability window. *Mitigation:* v2.0a must be shippable standalone (4 stages end-to-end usable; do not wait for v2.0b for first distribution); differentiate on host-portability (Cursor/Codex/Junie — Claude Design is Claude-only) and cite-canon discipline; designated weekly watcher process on `anthropics/skills` + Anthropic blog from v1.5; Brad Frost intellectual-heritage outreach pre-launch; rapid-response GTM pivot to "interoperability with Claude Design" if Anthropic ships first.

Additional HIGH-severity pitfalls from `PITFALLS.md` that the roadmap must address: `design/` hygiene rot (PII/merge/bloat — needs PII scanner pre-commit hook + manifest reconciler + `.gitignore`/`.gitattributes` defaults in v1.5); determinism drift (no LLM imports in `assets/scripts/` — CI linter from v1.5); cost runaway p95 tail (per-stage AND total budgets in CI); schema versioning without migration tooling (`complete-design migrate` mandatory with every schema bump from v1.5); designer trust gap (never lead with "AI design"); process aversion (routing matrix is the on-ramp; `--depth lightweight` default; `design --route design-bug` is the 60-second eval entry point).

## Implications for Roadmap

The MRD §10 proposes a 14-week roadmap: v1.5 infra (weeks 1-3) → v2.0a skeleton (weeks 4-8) → v2.0b full 5 stages (weeks 9-12) → RC (week 13) → GA (week 14). Two independent research streams (Architecture and Pitfalls) surfaced that v1.5 is **under-scoped at 3 weeks** given everything that must land before v2.0a workflow authoring can start safely. The recommended phase structure below preserves the MRD's a/b split (non-negotiable per codex BLOCKER §16) and explicitly resolves the v1.5 scope question.

### Phase 1: v1.5 — Infrastructure & Determinism Foundation (weeks 1-4, expanded from MRD §10's 3 weeks)

**Rationale:** Every v2.0a workflow depends on this phase delivering versioned schemas (R24), gate-runner machinery, the handoff-bundle script + schema (Pattern 3 in ARCHITECTURE.md — the context-window survival mechanism without which the full 5-stage run is impossible), determinism golden CI, aggregate coexistence eval harness, PII scanner, host-compatibility matrix CI scaffold, `.gitignore`/`.gitattributes` defaults, routing-matrix scaffolding, schema migration tooling, designer-readable Mermaid renderer, and the Anthropic-Labs watcher process. Building v2.0a workflows against unfrozen schemas, missing handoff bundles, or absent determinism CI is the kind of rework that kills timelines.

**Delivers:**
- Versioned JSON Schemas (R24) — persona, sitemap, MANIFEST, interaction-spec, audit-report, **handoff-bundle** (architecture gap surfaced)
- `assets/scripts/` deterministic emit core: `oklch.mjs`, `contrast.mjs`, `dtcg-lint.mjs`, `design-md-validate.mjs`, plus the gate-runner base class
- Handoff-bundle writer (`handoff-bundle-build.mjs`) + bundle-sufficiency eval harness
- Preview harness preserved from v1.0.1 (port manager, security sandbox, Playwright readiness, Vite/Next/Astro adapter spawning)
- `skillgrade`-style per-skill eval harness + aggregate coexistence eval corpus (≥5 popular packages installed: GSD, Superpowers, frontend-design, shadcn, Notion-MCP)
- `design/` governance: shipped `.gitignore` / `.gitattributes` defaults, PII scanner (`complete-design scan --pii`), manifest reconciler, frontmatter validator, schema migration template (`complete-design migrate`)
- Routing-matrix scaffolding (7 routes wired, even if only 4 implemented in v2.0a)
- Host-compatibility matrix CI scaffold (Claude Code passing fully; Codex CLI + Cursor scaffolded with sequential-fallback stubs)
- Mermaid stateDiagram-v2 designer-readable renderer (must exist before Stage 4 ships in v2.0b)
- Determinism CI gate (`complete-design verify --golden`): 5× byte-identical script output; linter rejects LLM-client imports in `assets/scripts/`
- Anthropic-Labs watcher process (named owner; weekly monitoring of `anthropics/skills` + Anthropic blog + Claude Design release notes)
- Adversarial test fixtures (synthetic-persona block, fidelity-cap color-leak canary, prompt-injection canary, override-reason missing)

**Addresses (features):** R1, R3 (governance + frontmatter), R4 (gate machinery), R10 (handoff bundles), R12 (references organization), R13 (preserved v1.0.1), R15 (trigger discipline + coexistence), R18 (persistence split), R24 (versioned schemas), R25 (partial-output recovery scaffolding).

**Avoids (pitfalls):** #1 aggregate cap; #4 context blowout; #6 determinism drift; `design/` hygiene rot; #8 schema migration; #13 `style-lite` BLOCKER (gate-runner architecture supports `not-runnable` terminal state from day one); #9 GTM kill-risk (watcher active from week 1).

### Phase 2: v2.0a — Skeleton (weeks 5-9, end-to-end value at 4 stages)

**Rationale:** Delivers shippable standalone value (the codex-validated MVP split protects against GTM kill-risk; v2.0a can be distributed independently if Anthropic Labs pressure rises during weeks 9-12). 4 of 6 gates implemented; Stages 3 + 4 deliberately deferred to v2.0b. The lite-mode honesty for Stage 5a/5b is **the** discipline marker.

**Delivers:**
- Workflows: `ingest` (W0), `discover` (W1), `structure` (W2), `style` (W5, **lite mode** — emits `evidence: INFERRED`, gate returns `not-runnable` for `stage-5a-complete`), `systematize` (W6, lite mode), basic `audit` (Stage 5a/5b detectors + slop-tells + `--pr`)
- Atoms (9): `prd/parse-or-interview`, `research/synthesize`, `research/personas-proto`, `research/build-ost`, `ia/sitemap-variants`, `ia/flows-from-jobs`, `hifi/variants-preview`, `tokens/emit`, plus the MANIFEST/handoff-bundle cross-stage utility
- Gates implemented: stage-1, stage-2, stage-5a (lite — hard-coded to refuse `PASS` without Stage 4 artifacts), stage-5b (lite)
- Adapters: tailwind-v4, shadcn (with CLAUDE.md `components/ui/` wrapper discipline), plain-css
- Routes implemented: 4 of 7 (`design-bug`, `new-feature` partial, `brand-refresh`, `PR-audit`) — the on-ramps; `new-product` full path remains opt-in
- Stage 1 synthetic-persona red-line test in CI (100/100 adversarial runs); fidelity-cap color-leak canary; prompt-injection canary

**Uses (stack):** Zod 4.4 schemas, gray-matter frontmatter parser, yaml round-trip writer, ajv 8 validation, culori + apca-w3 + @bjornlu/wcag-contrast, Playwright 1.60, Vite 6 / Next 15 adapters, Tailwind v4 `@theme` emit target, DTCG v2025.10, DESIGN.md emit per Google spec with `$extensions.complete-design` namespace.

**Implements (architecture):** Patterns 1 (LLM picks / scripts emit), 2 (stage-typed IR), 3 (handoff bundles — stage 1→2 and 2→5a-lite transitions), 4 (evidence-graded gates), 5 (stitched-context subagent dispatch — Claude Code host-first), 6 (per-file commit policy + frontmatter).

**Avoids (pitfalls):** #2 (Stage 1 deterministic gate + provenance propagation); #3 (Stage 5a `not-runnable` enforcement); #11 process aversion (4 on-ramp routes shipped before full path); #13 BLOCKER fixed in code; #10 designer trust (README + skill names + marketplace copy reviewed for "AI design" framing).

### Phase 3: v2.0b — Full 5 Stages + Lovable Refugee Path (weeks 10-12)

**Rationale:** Adds the biggest competitive white space (Stage 4 IxD — no competitor covers it) and the primary persona's raison d'être (`audit --reverse-engineer-stages` for Lovable refugees, moved up from v2.1 per codex feedback). Stage 3 (Sketch) is the highest-uncertainty L-complexity item because no existing competitor has shipped it; quality of LLM-generated Crazy 8s is the open empirical risk (codex flagged 3 + 5 near-clones; structural diversity eval is the mitigation).

**Delivers:**
- Workflows: `sketch` (W3 — Crazy 8s + Decider with structural diversity ≥0.5), `interact` (W4 — state catalog + pattern variants + XState + Mermaid + HAX-18), `audit --reverse-engineer-stages` mode (Lovable refugee path)
- Atoms (+6): `lowfi/crazy-eights`, `lowfi/converge`, `ixd/state-machine`, `ixd/pattern-variants`, `ixd/state-catalog`, `system/scaffold-component`
- Renderers: Excalidraw static-HTML viewer (`excalidraw-render.mjs`), Mermaid → SVG (`mermaid-render.mjs`), XState v5 code emitter (`state-machine-emit.mjs`)
- Gates implemented: stage-3 (Excalidraw color/font drift rejected; ≥3 alternatives via structural diversity; walkthrough complete), stage-4 (complete state set, async ops, HAX-18, motion rationale); Stage 5a/5b gates **promoted from lite to full**
- References (+12): stage-3 + stage-4 canon (Buxton, Sprint Crazy 8s, Saffer microinteractions, Tidwell, head motion, HAX-18, XState v5, APG, Material 3)
- Remaining routes: `mature-app-refactor`, `DS-extraction (Lovable refugee)`, full `new-product` opt-in path
- Schema migration: v2.0a → v2.0b for `sitemap.json` (Stage 3 cross-refs), `persona.json` (Stage 4 interaction needs), `MANIFEST.md` (new artifact types)

**Uses (stack):** Mermaid 11.15 + `@mermaid-js/mermaid-cli`, `@excalidraw/excalidraw` (pinned version), XState 5.20 with setup() pattern, axe-core 4.11 for HAX-18-adjacent accessibility checks.

**Implements (architecture):** Pattern 3 extended (3 new handoff bundles: 2→3, 3→4, 4→5a — the dependency chain never exercised before); Pattern 4 extended (stage-3/4 gates); Pattern 5 extended (cross-host subagent dispatch tested for the deeper context chain).

**Avoids (pitfalls):** #3 fidelity-cap leakage (Stage 4 gate enforces state-maps; Stage 5a refuses without state-maps; Stage 5b ≥3× recurrence); #12 XState overfit (Mermaid prioritized in gate validation + docs lead with Mermaid); Stage 3 quality (structural diversity eval); #12 Lovable refugee fidelity (all reverse-engineered artifacts carry `provenance: inferred` propagating to `INFERRED` grade downstream).

### Phase 4: v2.0 RC + GA (weeks 13-14)

**Rationale:** Cross-host smoke + designer/PM acceptance + launch artifact + post-GA monitoring. The success-metrics gate per §11 is non-negotiable; failure here is recoverable but launch slips.

**Delivers:**
- Cross-host smoke: 15-fixture suite passes on Claude Code + Codex CLI + Cursor (within 0.10 of host-first pass rate)
- Aggregate coexistence eval ≥0.80 with 5+ packages — release blocker if fails
- Two-designer + two-PM blind reviews (≥4 of 5 rate as "doing it properly, not Lovable shortcut" per MRD §9.3)
- p95 cost ≤220k on 15-fixture suite; per-stage budgets enforced
- 100/100 adversarial runs: synthetic-persona block, fidelity-cap reject, prompt-injection canary, color-leak canary, Stage 5a-without-state-maps refusal
- Bundle sufficiency at all 5 stage transitions
- Launch artifact: softened hook ("The 5 design stages every AI tool skips — and why your prototype struggles past month 3") + 90s video + cross-post to 8 marketplaces + Brad Frost / Marty Cagan outreach (Cagan as intellectual heritage, not endorsement claim) + PR to `anthropics/skills#1008`
- Apache-2.0 license; OSS-canonical positioning

**Avoids (pitfalls):** #9 GTM (rapid-response plan documented + Anthropic-watcher signal-tested); #10 designer trust (adversarial designer-critic audit pre-launch); #11 process aversion (first-touch UX testing with 5+ indie devs; routing telemetry plumbed for post-GA iteration).

### Phase Ordering Rationale

- **Infrastructure-first is forced by the deliverables:** schemas, gates, handoff bundles, determinism CI, coexistence eval all chain forward. Phase 1 cannot be skipped or trimmed.
- **v2.0a / v2.0b split is non-negotiable** per codex §16 BLOCKER. The split also de-risks GTM kill-scenario: v2.0a is shippable standalone if Anthropic Labs pressure rises.
- **Lovable refugee path (v2.0b, not v2.1)** is the primary-persona feature; it depends on all 5 forward-direction gates being implemented first, so v2.0b ordering of Stages 3 + 4 + reverse-engineer is forced.
- **Phase 1 expansion (4 weeks vs MRD §10's 3 weeks)** reflects the architecture + pitfalls research finding that v1.5 has absorbed substantial infrastructure load (handoff-bundle script + schema, host-matrix CI, coexistence eval, PII scanner, schema-migration tooling, routing scaffolding, Anthropic watcher, determinism linter, golden CI, Mermaid renderer, adversarial fixtures). Compressing this into 3 weeks risks v2.0a starting on unfrozen schemas.

### Conflict with MRD §10 — v1.5 Length

**Conflict surfaced by Architecture + Pitfalls research:** MRD §10 proposes 3 weeks for v1.5. The architecture and pitfalls research independently surface that v1.5 must absorb at least 12 distinct infrastructure deliverables. This is "high MEDIUM" complexity, not 3 weeks.

**Recommended resolution (carry into roadmap):** expand v1.5 to 4 weeks and either compress RC by parallelizing acceptance review with launch artifact prep, OR pull GA to week 15. The roadmapper should make this trade-off explicit during phase planning; ARCHITECTURE.md §"Build Order" explicitly endorses 4 weeks; PITFALLS.md §"Pitfall-to-Phase Mapping" maps 7 of 13 critical pitfalls to v1.5 prevention.

**Alternative if 14-week ceiling is firm:** cut scope from v2.0a (e.g., defer `audit --pr` mode to v2.0b) rather than shorten v1.5. Phase 1 deliverables are dependencies of Phase 2; Phase 2 features can be trimmed without breaking the chain.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1 v1.5 — Handoff-bundle schema + sufficiency eval design:** the bundle quality metric is novel; no off-the-shelf pattern exists. Needs `/gsd-research-phase` to design the metric and round-trip test.
- **Phase 1 v1.5 — Aggregate coexistence eval design:** novel; no existing tool tests trigger recall in multi-package state. The Codex 2% cap behavior in mid-2026 may differ from MRD's ~5k char assertion (MEDIUM confidence).
- **Phase 3 v2.0b — Stage 3 (Crazy 8s) structural diversity metric:** the v1.0.1 6-axis *visual-style* diversity metric does not apply to greyscale wireframes; a *structural* diversity metric is unprecedented. This is the v2.0b highest-risk item.
- **Phase 3 v2.0b — `audit --reverse-engineer-stages` inference fidelity:** reverse-inference from a rendered prototype is fundamentally lossy. Needs research on adversarial fixtures.
- **Phase 3 v2.0b — Google DESIGN.md spec stability:** MEDIUM confidence; spec explicitly says "may change" for animations / dark-mode / breakpoints. Continuous research, not one-shot.

Phases with standard patterns (skip research-phase):

- **Phase 2 v2.0a — Preview harness adapters (Vite 6 / Next 15 / Astro 5):** preserved from v1.0.1; well-documented.
- **Phase 2 v2.0a — DTCG v2025.10 emit + Tailwind v4 `@theme` projection:** specs are stable HIGH-confidence.
- **Phase 4 RC + GA — Cross-host smoke + acceptance:** the harness exists by v2.0b end; no novel methodology required.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major version pins verified via Context7 + official sources. MEDIUM on `skillgrade` package existence (treat as in-tree harness) and DESIGN.md schema stability over 14 weeks. |
| Features | HIGH | MRD §2.5 matrix verified across 17+ tools. MVP a/b split is codex-validated. MEDIUM on Stage 3/4 quality empirics. |
| Architecture | HIGH | MRD specifies the architecture in detail; research validates the shape, names the seams, surfaces 12 concrete risks with detection + prevention. Two explicit v1.5 gaps surfaced (handoff-bundle script; host-matrix CI scaffold). |
| Pitfalls | HIGH | Every pitfall traces to MRD §12 risk, codex §16 finding, or category-specific failure mode. MRD has 4 codex review passes (69 findings, all accepted). 13 critical pitfalls + technical-debt + integration + performance + security + UX + recovery strategies. |

**Overall confidence:** HIGH

### Gaps to Address

- **Codex 2% cap exact behavior in mid-2026** (MEDIUM): verify against current Codex CLI release at v1.5 kickoff. Mitigation already in scope: per-skill ≤200 chars; core/atoms split is the contingency lever.
- **`skillgrade` as external dependency vs. in-tree harness** (LOW external): no shipped OSS package by that name as of May 2026. Treat as in-tree harness plug-compatible with Anthropic skill-creator pattern. Phase 1 includes harness *design* as a distinct deliverable.
- **Google DESIGN.md schema stability over 14 weeks** (MEDIUM): weekly upstream watch from v1.5; `$extensions.complete-design` namespace fallback; `design-md-validate.mjs` must support schema version pinning.
- **Stage 3 Crazy 8s LLM quality empirics** (MEDIUM): if empirical pass rate is poor, expand v2.0b by 1 week or descope to MVP Stage 3 (single converged wireframe per screen).
- **v1.5 length conflict (3 vs 4 weeks)** (MEDIUM — methodological): Architecture and Pitfalls research independently endorse 4 weeks; MRD §10 proposes 3 weeks. Highest-leverage roadmap conflict.
- **Excalidraw element schema pinning** (MEDIUM): pin a tested version in v1.5; do NOT read `latest` at runtime.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `.planning/PROJECT.md`
- `complete-design-mrd-v2.md` — MRD v2.0 (§§2.4, 2.5, 3.4a–3.23, 5, 9 incl. §9.1 v2.0a BLOCKER fix, 10, 11, 12, 13, 14, 15, 16 codex acceptance record — 69 cumulative findings)
- agentskills.io v1 spec (stabilized 2025-12-18)
- W3C DTCG v2025.10 (2025-10-28)
- Google DESIGN.md GitHub repo (`google-labs-code/design.md`, April 2026, Apache-2.0)
- Tailwind CSS v4.0/v4.1 release blogs; Next.js 15 / Vite 6 / Astro 5 release blogs
- Playwright 1.60 release notes; Zod v4 docs + InfoQ
- Context7 `/statelyai/xstate` — XState 5.20 setup() pattern
- Excalidraw dev-docs — element schema + `convertToExcalidrawElements` API
- Anthropic skill-creator blog (2026) — eval/A-B/trigger-tuning pattern
- `~/.claude/CLAUDE.md`

### Secondary (MEDIUM confidence)
- NN/g 2024 *Synthetic Users*; ACM Interactions 2026 synthetic-user people-pleasing; arXiv Dec 2025 *Whose Personae?*
- Sourcetoad 1,645-app Lovable security audit; 2025 Stack Overflow 80/20 wall finding
- Brad Frost *Design systems in the time of AI*, *Agentic Design Systems in 2026*
- Addy Osmani *AI-Driven Prototyping: v0, Bolt, and Lovable Compared*
- van Schneider / Frontend Masters critique
- Anthropic frontend-design issue #1008

### Tertiary (LOW confidence — needs validation)
- `skillgrade` as a shipped OSS npm package — does not exist as of May 2026
- Codex 2% trigger metadata cap exact value in mid-2026
- Astro 5 vs Astro 6 stability for v2.0 GA
- VS Code Agent Skills GA timing (Copilot host)

---
*Research completed: 2026-05-24*
*Ready for roadmap: yes*
