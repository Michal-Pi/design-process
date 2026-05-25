# Requirements: design-os

**Defined:** 2026-05-24
**Core Value:** The 5-stage design process, operationalized as an agent-loop workflow with stage-typed artifacts in `design/` and validation gates between stages — so prototypes don't break at production scale.

## v1 Requirements

v1 = the v2.0 GA release (per MRD §10). Split into the v1.5-infra → v2.0a-skeleton → v2.0b-full chain. Every requirement here ships in one of those releases. v2.1+ scope sits in v2 Requirements below.

### Distribution & Compatibility

- [x] **DIST-01**: Package conforms to agentskills.io v1 SKILL.md spec (frontmatter: `name`, `description` ≤200 chars, `version`, `license: Apache-2.0`, `compatibility:`, `allowed-tools:`)
- [ ] **DIST-02**: 22 triggerable skills (7 workflows + 15 atoms) — total trigger metadata ≤5k chars
- [ ] **DIST-03**: Per-skill description ≤200 chars with 5+ trigger phrases, fire-condition keywords front-loaded in first 100 chars
- [ ] **DIST-04**: Claude Code is the host-first target (full subagent dispatch supported)
- [ ] **DIST-05**: Codex CLI runs sequential-fallback path with within-0.10 pass-rate of host-first
- [ ] **DIST-06**: Cursor runs sequential-fallback path with within-0.10 pass-rate of host-first
- [ ] **DIST-07**: Package distributes via the 8 named marketplaces (skills.sh, claudemarketplaces.com, mcpmarket.com, smithery.ai, lobehub, fastmcp.me, playbooks.com, Tessl Registry)

### Spine & Architecture

- [ ] **SPINE-01**: Architecture maps 1:1 to Garrett's 5 planes (Strategy / Scope / Structure / Skeleton / Surface)
- [ ] **SPINE-02**: Every workflow and atom declares `stage:` frontmatter (0 / 1 / 2 / 3 / 4 / 5a / 5b / cross-stage)
- [ ] **SPINE-03**: Six core architectural patterns implemented: (a) LLM picks / scripts emit, (b) stage-typed artifact substrate as IR, (c) compact handoff bundles, (d) evidence-graded validation gates, (e) stitched-context subagent dispatch with cross-host parity, (f) per-file commit policy + frontmatter-tagged artifacts
- [ ] **SPINE-04**: Data flow is strictly linear forward (PRD → S0 → S1 → … → S5b); upstream-mutation by downstream stages is an anti-pattern enforced in code

### `design/` Directory & Artifacts

- [ ] **ART-01**: `design/` directory is the user-facing cross-stage artifact substrate, committed to git
- [ ] **ART-02**: Per-file commit policy implemented (canonical summaries committed; rejected wireframes, raw transcripts, `.design-os/private/` gitignored)
- [x] **ART-03**: Per-artifact YAML frontmatter (`artifact`, `stage`, `generated`, `schemaVersion`, `sourceHash`, `provenance`, `owner`, `lastReviewedAt`)
- [ ] **ART-04**: `.gitattributes` declares `design/*.json merge=ours` to bound merge-conflict pain
- [ ] **ART-05**: PII scanner (`design-os scan --pii`) runs pre-commit and rejects transcripts/PII in committed paths
- [ ] **ART-06**: `.design-os/` package-internal state (manifest.lock hash chain, manual-overrides.json, preview run state, gitignored private logs/screenshots) per v1.0.1 commit policy
- [ ] **ART-07**: MANIFEST.md auto-maintained: links every artifact to its stage + downstream dependents

### Stage Validation Gates

- [x] **GATE-01**: Six stage gates implemented as deterministic Node ESM checklists: `gate/stage-1-complete`, `gate/stage-2-complete`, `gate/stage-3-complete`, `gate/stage-4-complete`, `gate/stage-5a-complete`, `gate/stage-5b-complete`
- [x] **GATE-02**: Each gate returns `(terminal-state, evidence-grade)` tuple persisted in `.design-os/manifest.lock`
- [x] **GATE-03**: Four terminal states supported: PASS / PASS_WITH_WARNINGS / FAILED_AFTER_REPAIR / USER_OVERRIDDEN
- [x] **GATE-04**: Four evidence grades supported: VALIDATED / PROTO / INFERRED / MISSING
- [x] **GATE-05**: `USER_OVERRIDDEN` requires `--override-reason` flag and propagates a visible banner to every downstream artifact
- [x] **GATE-06**: CI mode (`audit --ci`) blocks merges on configured severities (default: only BLOCKER)
- [x] **GATE-07**: Gate-runner base class supports `not-runnable` terminal state from day one (codex BLOCKER fix from §16)
- [ ] **GATE-08**: `gate/stage-5a-complete` returns `not-runnable, reason: stage-4-artifacts-absent` when `design/interactions/` is empty (CI-asserted on every v2.0a release)

### Per-Stage Fidelity Caps (Buxton Discipline)

- [ ] **FID-01**: Stage 1 — refuses solution-language output; output describes user needs, not features
- [ ] **FID-02**: Stage 2 — sitemaps emit text + Mermaid boxes only; no colors, no typography
- [ ] **FID-03**: Stage 3 — Excalidraw validator rejects color/typography/styling drift; LLM emissions of styling regenerate up to repair-loop limit, then fail
- [ ] **FID-04**: Stage 4 — state diagrams are Mermaid stateDiagram-v2; no hi-fi visuals in interactive prototypes
- [ ] **FID-05**: Stage 5a — refuses to render hi-fi when `design/interactions/` is empty or incomplete
- [ ] **FID-06**: Stage 5b — promotes a component to system only when it appears ≥3× in upstream wireframes/interactions (Frost rule)

### Synthetic-Persona Red Line (NN/g)

- [ ] **RED-01**: Stage 1 hard-blocks `VALIDATED` evidence grade when only synthetic personas are present
- [ ] **RED-02**: Every persona JSON carries `provenance: generated|validated|inferred|missing` frontmatter
- [ ] **RED-03**: `ASSUMPTIONS.md` is a required parallel artifact when `provenance: generated` is present
- [ ] **RED-04**: Provenance propagates downstream: any artifact derived from a `PROTO`-grade upstream artifact inherits `worstProvenance:` and cannot grade above PROTO
- [ ] **RED-05**: Adversarial test suite asserts 100% block rate on synthetic-only Stage 1 completion across 100 prompts (CI-gated)
- [ ] **RED-06**: Prompt-injection canary asserts the red-line cannot be bypassed via creative prompting

### Workflows (7 + audit)

- [ ] **WF-01**: `ingest` (Stage 0) — Markdown PRD parse + frontmatter validation; paste-text path; interview fallback for empty PRDs (Lenny 1-pager)
- [ ] **WF-02**: `discover` (Stage 1) — generates personas, JTBDs, OST, assumptions, competitive landscape, interview guide; `gate/stage-1-complete` enforced
- [ ] **WF-03**: `structure` (Stage 2) — generates 2-5 sitemap variants (LATCH-diverse), Mermaid flows, optional tree-test design; `gate/stage-2-complete` enforced
- [ ] **WF-04**: `sketch` (Stage 3) — Crazy 8s with structural-diversity enforcement; Sprint Decider for convergence; Excalidraw JSON output; `gate/stage-3-complete` enforced
- [ ] **WF-05**: `interact` (Stage 4) — state catalogs, pattern variants with tradeoffs, XState v5 (only when async + ≥3 states + conditional), Mermaid stateDiagram-v2 (designer-readable), HAX-18 audit for AI products; `gate/stage-4-complete` enforced
- [ ] **WF-06**: `style` (Stage 5a) — preview-first variant exploration preserved from v1.0.1; 3 visual variants with 6-axis distance metric; `gate/stage-5a-complete` enforced (in v2.0b; lite mode in v2.0a)
- [ ] **WF-07**: `systematize` (Stage 5b) — promote-to-system rule, DTCG v2025.10 token emit, Google DESIGN.md emit with `$extensions.design-os`, Storybook stories; `gate/stage-5b-complete` enforced (in v2.0b; lite mode in v2.0a)
- [ ] **WF-08**: `audit` (cross-stage) — modes: `--stage N`, `--all-stages`, `--pr`, `--slop-tells`, `--new-feature`, `--reverse-engineer-stages`
- [ ] **WF-09**: Every workflow supports `--depth lightweight|standard|full`

### Atomic Skills (15)

- [ ] **ATOM-01**: `prd/parse-or-interview` (Stage 0)
- [ ] **ATOM-02**: `research/synthesize` (Stage 1)
- [ ] **ATOM-03**: `research/personas-proto` (Stage 1, Indi Young thinking-style format with provenance)
- [ ] **ATOM-04**: `research/build-ost` (Stage 1, Torres OST)
- [ ] **ATOM-05**: `ia/sitemap-variants` (Stage 2, LATCH-diverse)
- [ ] **ATOM-06**: `ia/flows-from-jobs` (Stage 2, Mermaid flowcharts per JTBD)
- [ ] **ATOM-07**: `ia/tree-test-design` (Stage 2, Optimal Workshop format — v2.1)
- [ ] **ATOM-08**: `lowfi/crazy-eights` (Stage 3, 8 Excalidraw JSON variants per screen)
- [ ] **ATOM-09**: `lowfi/converge` (Stage 3, Decider pick with rationale)
- [ ] **ATOM-10**: `ixd/state-machine` (Stage 4, XState v5 emit, conditional)
- [ ] **ATOM-11**: `ixd/pattern-variants` (Stage 4, 3 interaction-pattern variants with tradeoffs)
- [ ] **ATOM-12**: `ixd/state-catalog` (Stage 4, enumerate all states per component)
- [ ] **ATOM-13**: `hifi/variants-preview` (Stage 5a, generate + preview + screenshot in one atom)
- [ ] **ATOM-14**: `tokens/emit` (Stage 5b, DTCG → Tailwind v4 / shadcn / plain CSS / Style Dictionary projections)
- [ ] **ATOM-15**: `system/scaffold-component` (Stage 5b, full state set, consumes Stage 4 machine — v2.1 per MRD §3.8; pulled into v2.0b)

### Job-Routing Matrix (7 routes)

- [ ] **ROUTE-01**: `new-product` route — required stages 0,1,2,5a,5b; optional 3,4; budget ≤150k tokens
- [ ] **ROUTE-02**: `new-feature` route — required 2(delta),4,5a; skip-with-warning 1; budget ≤60k
- [ ] **ROUTE-03**: `mature-app-refactor` route — required 2(audit),4(audit),5b; skip 1,3,5a; budget ≤45k
- [ ] **ROUTE-04**: `design-bug` route — required 4(component catalog),5a(lite); skip 1,2,3,5b; budget ≤20k
- [ ] **ROUTE-05**: `brand-refresh` route — required 5a,5b; skip 1,2,3,4; budget ≤55k
- [ ] **ROUTE-06**: `DS-extraction` route (Lovable refugee) — `audit --reverse-engineer-stages` then backfill 1,2,4,5b; skip 0; budget ≤120k
- [ ] **ROUTE-07**: `PR-audit` route — `audit --pr` cross-stage diff; budget ≤15k
- [ ] **ROUTE-08**: Default ≠ all 5 stages; orchestrator suggests route from repo signals or asks for confirmation
- [ ] **ROUTE-09**: User can pick route via `design --route <name>` or invoke `design --full` for opt-in full path

### Compact Stage Handoff Bundles

- [x] **HAND-01**: `design/.handoff/stage-N-bundle.md` written at the end of each stage workflow (~5-15k tokens)
- [x] **HAND-02**: Versioned JSON Schema for handoff-bundle (R24 deliverable; v1.5 prerequisite)
- [ ] **HAND-03**: Next-stage workflows read only the bundle (+ stage-scoped references); raw upstream files only on explicit verification queries
- [x] **HAND-04**: Bundle-sufficiency eval gates release — Stage N+1 must produce equivalent output from bundle alone vs. full directory ingestion

### Anchor Formats

- [x] **FORMAT-01**: PRD = Markdown + YAML 1.2 frontmatter (CommonMark)
- [x] **FORMAT-02**: Personas = JSON with required frontmatter; sitemap = custom `$type` schema (DTCG-style); flows = Mermaid
- [x] **FORMAT-03**: Wireframes = Excalidraw JSON (pinned schema version; never `latest`)
- [x] **FORMAT-04**: Interaction specs = Markdown + XState v5 machine (when applicable); motion tokens DTCG-compatible
- [x] **FORMAT-05**: Tokens = W3C DTCG v2025.10 (`application/design-tokens+json`, primitive→semantic→component tiers)
- [x] **FORMAT-06**: DESIGN.md emit per Google spec (April 2026, Apache-2.0); `$extensions.design-os` namespace for design-os-specific data
- [x] **FORMAT-07**: `design-md-validate.mjs` supports schema version pinning to survive Google spec drift

### References Corpus

- [ ] **REF-01**: `references/` organized hybrid file-based (no vector DB, no knowledge graph) — by stage and canon body
- [ ] **REF-02**: Stage 0+1+2+5 reference corpus complete by end of v1.5 infra
- [ ] **REF-03**: Stage 3+4 reference corpus added in v2.0b (Buxton, Sprint Crazy 8s, Saffer microinteractions, Tidwell, head motion, HAX-18, XState v5, APG, Material 3)
- [ ] **REF-04**: Six stage-gate operational checklists (`references/gates/stage-N.md`) shipped before the corresponding stage workflow

### Preview & Determinism

- [ ] **PREV-01**: Preview harness preserved from v1.0.1 — port manager, security sandbox, Playwright 1.60 readiness probe, headless screenshot capture
- [ ] **PREV-02**: Adapter scaffolds for Vite 6 / Next 15 (App Router only) / Astro 5 user repos
- [ ] **PREV-03**: Determinism CI gate (`design-os verify --golden`) — 5× byte-identical script output on a fixed input set
- [ ] **PREV-04**: CI linter rejects LLM-client imports inside `assets/scripts/` (operationalizing "LLM picks, scripts emit")
- [ ] **PREV-05**: Variant-distance metric — visual-style 6-axis for Stage 5a (preserved from v1.0.1); separate structural-diversity metric for Stage 3 wireframes

### Trust Posture

- [ ] **TRUST-01**: Package never claims WCAG conformance; output reports measured numbers (e.g., "WCAG 2.2 AA contrast 4.7 (pass)")
- [ ] **TRUST-02**: Diff-by-default; `--apply` flag required to write into the user's working tree
- [ ] **TRUST-03**: Every rule cites canon (Garrett §X, NN/g article, WCAG SC, Radix step role) or is labeled `house heuristic`
- [ ] **TRUST-04**: Package name, taglines, top-level skill names, README, and marketplace copy avoid "AI design" framing
- [ ] **TRUST-05**: Every stage workflow starts with a 3-5 question intake; no defaults silently picked

### Trigger Discipline (Codex 2% Cap)

- [ ] **TRIG-01**: Per-skill `skillgrade`-style eval suite — ≥10 should-fire prompts + ≥10 should-not-fire prompts × 3 trials
- [ ] **TRIG-02**: Per-skill trigger recall ≥0.85 in CI; false-trigger rate ≤0.15 in CI
- [ ] **TRIG-03**: Aggregate coexistence eval — trigger recall ≥0.80 when 5+ other popular Claude Code skill packages are installed alongside design-os
- [ ] **TRIG-04**: Contingency lever defined — split into `design-os-core` + `design-os-atoms` if Codex cap pressure rises

### Audit Verb (Cross-Stage)

- [ ] **AUDIT-01**: Per-stage detector logic (`audit --stage N --pr`) for stages 1-5b
- [ ] **AUDIT-02**: `audit --all-stages` runs every detector and surfaces gaps as a single ranked report
- [ ] **AUDIT-03**: `audit --slop-tells` library preserved from v1.0.1 (rainbow gradients, Inter-default, glass-stack, three-column-grid, etc.)
- [ ] **AUDIT-04**: `audit --new-feature` verifies a new feature passes through all 5 stages
- [ ] **AUDIT-05**: `audit --pr` diffs a PR against the design contract with structured findings (`findingId`, severity, evidence pointer, fix recipe, suppression option)
- [ ] **AUDIT-06**: `audit --reverse-engineer-stages` infers stages 1-4 from an existing Lovable/v0/Bolt prototype (Lovable refugee path) — shipped in v2.0b
- [ ] **AUDIT-07**: All reverse-engineered artifacts carry `provenance: inferred` and propagate `INFERRED` grade downstream
- [ ] **AUDIT-08**: AUDIT-REPORT.md output schema versioned and validated

### Persistence Split

- [ ] **PERSIST-01**: `design/` for artifacts (committed, designer-readable, AI-readable) vs `.design-os/` (package state, selectively committed)
- [ ] **PERSIST-02**: Decision log + hash chain + manual-override capture preserved from v1.0.1
- [x] **PERSIST-03**: Schema-migration tooling (`design-os migrate`) accompanies every schema bump from v1.5
- [ ] **PERSIST-04**: Recovery semantics — deleting `design/research/` triggers a confirm-before-regenerate prompt

### Polyglot Adapters

- [ ] **ADAPT-01**: Output adapters: Tailwind v4 / shadcn / plain CSS / Style Dictionary in core
- [ ] **ADAPT-02**: Material Web / Vue / Svelte output adapters via `design-os-bridges` (v2.1+)
- [ ] **ADAPT-03**: Input adapters: Markdown PRD, paste-text, interview mode in core
- [ ] **ADAPT-04**: Tokens Studio Figma export ingestion (v2.1)
- [ ] **ADAPT-05**: Optimal Workshop tree-test CSV ingestion (v2.1)

### v2.0a MVP Scope

- [ ] **MVPA-01**: 5 workflows shipped: `ingest`, `discover`, `structure`, `style` (lite), `systematize` (lite) + basic `audit`
- [ ] **MVPA-02**: 9 atoms shipped (per MRD §9.1)
- [ ] **MVPA-03**: 4 gates implemented (stage-1, stage-2, stage-5a-lite, stage-5b-lite)
- [ ] **MVPA-04**: `style-lite` / `systematize-lite` output labeled `stage: 5a-lite, evidence: INFERRED`; never claim `gate/stage-5a-complete: PASS` (codex BLOCKER fix)
- [ ] **MVPA-05**: 4 of 7 routes shipped: `design-bug`, `new-feature` (partial), `brand-refresh`, `PR-audit` — the on-ramps
- [ ] **MVPA-06**: 12 mandatory references encoded (`design-md`, `dtcg-v2025-10`, `wcag-2-2`, `radix-step-roles`, `shadcn-tailwind-v4`, `garrett-elements`, `cooper-goodwin`, `torres-ost`, `klement-jtbd`, `indi-young-thinking-styles`, `rosenfeld-ia`, `prd/lenny-one-pager`)
- [ ] **MVPA-07**: 3 stack adapters (`tailwind-v4`, `shadcn`, `plain-css`)
- [ ] **MVPA-08**: Claude Code host-first; Codex CLI + Cursor sequential-fallback scaffolded

### v2.0b Full 5-Stage Scope

- [ ] **MVPB-01**: Workflows added: `sketch`, `interact`
- [ ] **MVPB-02**: 6 atoms added: `lowfi/crazy-eights`, `lowfi/converge`, `ixd/state-machine`, `ixd/pattern-variants`, `ixd/state-catalog`, `system/scaffold-component`
- [ ] **MVPB-03**: Excalidraw renderer + Mermaid renderer + XState code emitter shipped in `assets/scripts/`
- [ ] **MVPB-04**: Stage-3 and Stage-4 gates implemented
- [ ] **MVPB-05**: Stage-5a / 5b gates promoted from `-lite` to full
- [ ] **MVPB-06**: `audit --reverse-engineer-stages` mode shipped (Lovable refugee path)
- [ ] **MVPB-07**: Stage 3 risk-triggered (per routing matrix); not default on every route
- [ ] **MVPB-08**: XState v5 machine required only for components with async + ≥3 states + conditional transitions; otherwise spec.md state catalog + Mermaid stateDiagram-v2 is canonical
- [ ] **MVPB-09**: Remaining routes shipped: `mature-app-refactor`, `DS-extraction (Lovable refugee)`, `new-product` full
- [ ] **MVPB-10**: Schema migration v2.0a → v2.0b for `sitemap.json`, `persona.json`, `MANIFEST.md`

### Acceptance Criteria

- [ ] **ACCEPT-01**: `design` end-to-end runs PRD → DESIGN.md + tokens on Next.js + Tailwind v4 + shadcn fixture with all 5 gates passing in ≥12 of 15 runs
- [ ] **ACCEPT-02**: Synthetic-only Stage 1 hard-blocks at 100% across 100 adversarial runs
- [ ] **ACCEPT-03**: Stage 3 fidelity-cap rejects styled wireframes at 100% across 100 adversarial runs
- [ ] **ACCEPT-04**: Stage 5a refuses to render hi-fi without complete state-maps at 100% across 100 adversarial runs
- [ ] **ACCEPT-05**: Stage 5b ≥3× recurrence rule enforced and verifiable in fixture
- [ ] **ACCEPT-06**: `audit --all-stages` correctly identifies gaps in a fixture project missing Stage 2 + Stage 4 work
- [ ] **ACCEPT-07**: Designer review (n≥5) — ≥4 of 5 rate output as "this is what doing it properly looks like, not Lovable shortcut"
- [ ] **ACCEPT-08**: PM review (n≥5) — ≥4 of 5 rate PRD-to-design pipeline as "produces artifacts I'd actually share with engineering"
- [ ] **ACCEPT-09**: A11y conformance on own examples — 100% pass WCAG 2.2 AA contrast via `axe-runner.mjs` CI

### Cost Discipline

- [ ] **COST-01**: `discover` p50 ≤30k tokens (lightweight depth)
- [ ] **COST-02**: `structure` p50 ≤25k tokens
- [ ] **COST-03**: `sketch` p50 ≤25k tokens
- [ ] **COST-04**: `interact` p50 ≤30k tokens
- [ ] **COST-05**: `style` p50 ≤55k tokens (preserves v1.0.1 budget)
- [ ] **COST-06**: `systematize` p50 ≤40k tokens
- [ ] **COST-07**: Full `design` workflow p50 ≤150k tokens; p95 ≤220k tokens
- [ ] **COST-08**: `new-feature` route p50 ≤60k tokens
- [ ] **COST-09**: `design-bug` route p50 ≤20k tokens
- [ ] **COST-10**: Wall-clock p50 ≤8 min for full 5 stages

### Versioned Schemas (v1.5 Prerequisite)

- [x] **SCHEMA-01**: `persona.v1.json` schema authored in Zod, emitted via `zod-to-json-schema`
- [x] **SCHEMA-02**: `sitemap.v1.json` schema
- [x] **SCHEMA-03**: `manifest.v1.json` schema
- [x] **SCHEMA-04**: `interaction-spec.v1.json` schema
- [x] **SCHEMA-05**: `audit-report.v1.json` schema
- [x] **SCHEMA-06**: `handoff-bundle.v1.json` schema
- [x] **SCHEMA-07**: Runtime validation via `ajv` 8 + `ajv-formats` at every workflow boundary

### Partial-Output Recovery

- [ ] **RECOV-01**: User can interrupt `design` after any stage; partial outputs in `design/` are usable on their own
- [ ] **RECOV-02**: Resumption from any stage boundary supported (scripted test: interrupt after stages 1, 2, 4; resume → equivalent end-state)
- [ ] **RECOV-03**: 100% scripted-test pass rate (CI-gated)

### GTM (Launch Artifact)

- [ ] **GTM-01**: Long-form launch post: "The 5 design stages every AI tool skips — and why your prototype struggles past month 3"
- [ ] **GTM-02**: 90-second video showing 3 variants per stage (sitemap / wireframe / state-machine / visual)
- [ ] **GTM-03**: Cross-post to 8 marketplaces (skills.sh, claudemarketplaces.com, mcpmarket.com, smithery.ai, lobehub, fastmcp.me, playbooks.com, Tessl Registry)
- [ ] **GTM-04**: Named outreach: Brad Frost (design-systems-as-AI-context heritage); Marty Cagan (build-to-learn intellectual heritage, not endorsement claim)
- [ ] **GTM-05**: PR submitted to `anthropics/skills#1008` for DESIGN.md consume/produce support
- [ ] **GTM-06**: Anthropic-Labs watcher process active from v1.5 (weekly monitoring of `anthropics/skills` + Anthropic blog + Claude Design release notes)
- [ ] **GTM-07**: Rapid-response GTM pivot plan documented (interoperability with Claude Design if Anthropic ships a 5-stage equivalent first)

## v2 Requirements

Deferred to v2.1 / v2.2 per MRD §10 and §13. Tracked but not in the current roadmap.

### Polyglot Input Adapters (v2.1)

- **POLY-01**: Notion PRD URL ingestion (via Notion MCP — Gaia Logic projects only per CLAUDE.md)
- **POLY-02**: Linear spec URL ingestion (Linear API)
- **POLY-03**: Google Doc URL ingestion (Drive API)
- **POLY-04**: Optimal Workshop tree-test CSV ingestion

### Polyglot Output Adapters (v2.1)

- **POLY-05**: Material Web adapter via `design-os-bridges`
- **POLY-06**: Vue adapter via `design-os-bridges`
- **POLY-07**: Svelte adapter via `design-os-bridges`

### Voice + Transcript Ingestion (v2.2)

- **VOICE-01**: Voice → PRD interview mode (Whisper integration)
- **VOICE-02**: Dovetail interview-transcript ingestion
- **VOICE-03**: Notably interview-transcript ingestion

### Broader Hosts (v2.1+)

- **HOST-01**: Junie host parity
- **HOST-02**: Copilot host parity (depends on VS Code Agent Skills GA)
- **HOST-03**: Tokens Studio Figma export ingestion
- **HOST-04**: Storybook MCP via Chromatic integration

### Premium / Enterprise (year 2+)

- **PREM-01**: Premium reference packs (style codifiers, industry-specific patterns)
- **PREM-02**: Enterprise design-process compliance SKU (verifies every PR passed all 5 stages — regulated industries)
- **PREM-03**: Enterprise audit dashboard (sibling product, not OSS feature)

### Misc Deferred

- **MISC-01**: i18n / RTL / CJK dedicated atom (v2.1)
- **MISC-02**: Stage 1 saturation as `VALIDATED`-grade check with ≥6 transcripts loaded + thematic coding

## Out of Scope

Explicit exclusions. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Prompt → fully-shipped UI from scratch | Lovable / v0 / Bolt own this; design-os positioned as complementary, not competitive |
| Visual canvas editing | Subframe / Figma Make own this |
| Hosting / deploy | Orthogonal; user owns runtime |
| Authoring the DESIGN.md spec | Google owns; we adopt and emit |
| Authoring the DTCG spec | W3C owns; we emit |
| Branded design IP / licensed assets | Legal scope, not technical |
| Synthetic personas as primary research | NN/g 2024 red line; package hard-blocks |
| Replacing Dovetail / Maze / Optimal Workshop | We read their exports, not replace |
| Replacing ProtoPie / Origami | Advanced motion tooling stays elsewhere |
| Hosted SaaS (year-1) | OSS only; enterprise dashboard is sibling product |
| Figure-recognition vision generator | Deferred indefinitely |
| Generic "AI design" marketing framing | Discourse poison; positioned as "design-process facilitator" |
| WCAG conformance claims | Frontend Masters critique; we report measured contrast only |
| Auto-publishing to git tree | Designer gatekeeper-bypass fear; `--apply` always required |
| Vector DB / knowledge graph for `references/` | MRD §3.10 forbids; would break determinism + zero-infra |
| React / Next / Vue / Svelte inside the package itself | design-os is Markdown + Node ESM only; frameworks are emit targets, not dependencies |

## Traceability

Populated by `gsd-roadmapper` on 2026-05-24 after ROADMAP.md creation.

**Phase legend:**
- **Phase 1** = v1.5 — Infrastructure & Determinism Foundation (weeks 1-4)
- **Phase 2** = v2.0a — Skeleton (weeks 5-9)
- **Phase 3** = v2.0b — Full 5 Stages + Lovable Refugee Path (weeks 10-12)
- **Phase 4** = v2.0 RC + GA (weeks 13-14)
- **v2.1** = deferred (tracked under v2 Requirements above)

| Requirement | Phase | Status |
|-------------|-------|--------|
| DIST-01 | Phase 1 | Complete |
| DIST-02 | Phase 1 | Pending |
| DIST-03 | Phase 1 | Pending |
| DIST-04 | Phase 2 | Pending |
| DIST-05 | Phase 4 | Pending |
| DIST-06 | Phase 4 | Pending |
| DIST-07 | Phase 4 | Pending |
| SPINE-01 | Phase 1 | Pending |
| SPINE-02 | Phase 1 | Pending |
| SPINE-03 | Phase 1 | Pending |
| SPINE-04 | Phase 1 | Pending |
| ART-01 | Phase 1 | Pending |
| ART-02 | Phase 1 | Pending |
| ART-03 | Phase 1 | Complete |
| ART-04 | Phase 1 | Pending |
| ART-05 | Phase 1 | Pending |
| ART-06 | Phase 1 | Pending |
| ART-07 | Phase 1 | Pending |
| GATE-01 | Phase 1 | Done |
| GATE-02 | Phase 1 | Done |
| GATE-03 | Phase 1 | Done |
| GATE-04 | Phase 1 | Done |
| GATE-05 | Phase 1 | Done |
| GATE-06 | Phase 1 | Done |
| GATE-07 | Phase 1 | Done |
| GATE-08 | Phase 2 | Pending |
| FID-01 | Phase 2 | Pending |
| FID-02 | Phase 2 | Pending |
| FID-03 | Phase 3 | Pending |
| FID-04 | Phase 3 | Pending |
| FID-05 | Phase 2 | Pending |
| FID-06 | Phase 3 | Pending |
| RED-01 | Phase 2 | Pending |
| RED-02 | Phase 2 | Pending |
| RED-03 | Phase 2 | Pending |
| RED-04 | Phase 2 | Pending |
| RED-05 | Phase 2 | Pending |
| RED-06 | Phase 2 | Pending |
| WF-01 | Phase 2 | Pending |
| WF-02 | Phase 2 | Pending |
| WF-03 | Phase 2 | Pending |
| WF-04 | Phase 3 | Pending |
| WF-05 | Phase 3 | Pending |
| WF-06 | Phase 2 | Pending |
| WF-07 | Phase 2 | Pending |
| WF-08 | Phase 2 | Pending |
| WF-09 | Phase 2 | Pending |
| ATOM-01 | Phase 2 | Pending |
| ATOM-02 | Phase 2 | Pending |
| ATOM-03 | Phase 2 | Pending |
| ATOM-04 | Phase 2 | Pending |
| ATOM-05 | Phase 2 | Pending |
| ATOM-06 | Phase 2 | Pending |
| ATOM-07 | v2.1 (deferred) | Deferred |
| ATOM-08 | Phase 3 | Pending |
| ATOM-09 | Phase 3 | Pending |
| ATOM-10 | Phase 3 | Pending |
| ATOM-11 | Phase 3 | Pending |
| ATOM-12 | Phase 3 | Pending |
| ATOM-13 | Phase 2 | Pending |
| ATOM-14 | Phase 2 | Pending |
| ATOM-15 | Phase 3 | Pending |
| ROUTE-01 | Phase 3 | Pending |
| ROUTE-02 | Phase 2 | Pending |
| ROUTE-03 | Phase 3 | Pending |
| ROUTE-04 | Phase 2 | Pending |
| ROUTE-05 | Phase 2 | Pending |
| ROUTE-06 | Phase 3 | Pending |
| ROUTE-07 | Phase 2 | Pending |
| ROUTE-08 | Phase 1 | Pending |
| ROUTE-09 | Phase 2 | Pending |
| HAND-01 | Phase 1 | Done |
| HAND-02 | Phase 1 | Done |
| HAND-03 | Phase 1 | Pending |
| HAND-04 | Phase 1 | Done |
| FORMAT-01 | Phase 1 | Complete |
| FORMAT-02 | Phase 1 | Complete |
| FORMAT-03 | Phase 1 | Complete |
| FORMAT-04 | Phase 1 | Complete |
| FORMAT-05 | Phase 1 | Complete |
| FORMAT-06 | Phase 1 | Complete |
| FORMAT-07 | Phase 1 | Complete |
| REF-01 | Phase 1 | Pending |
| REF-02 | Phase 1 | Pending |
| REF-03 | Phase 3 | Pending |
| REF-04 | Phase 1 | Pending |
| PREV-01 | Phase 1 | Pending |
| PREV-02 | Phase 1 | Pending |
| PREV-03 | Phase 1 | Pending |
| PREV-04 | Phase 1 | Pending |
| PREV-05 | Phase 1 | Pending |
| TRUST-01 | Phase 1 | Pending |
| TRUST-02 | Phase 1 | Pending |
| TRUST-03 | Phase 1 | Pending |
| TRUST-04 | Phase 1 | Pending |
| TRUST-05 | Phase 1 | Pending |
| TRIG-01 | Phase 1 | Pending |
| TRIG-02 | Phase 1 | Pending |
| TRIG-03 | Phase 4 | Pending |
| TRIG-04 | Phase 1 | Pending |
| AUDIT-01 | Phase 2 | Pending |
| AUDIT-02 | Phase 3 | Pending |
| AUDIT-03 | Phase 2 | Pending |
| AUDIT-04 | Phase 3 | Pending |
| AUDIT-05 | Phase 2 | Pending |
| AUDIT-06 | Phase 3 | Pending |
| AUDIT-07 | Phase 3 | Pending |
| AUDIT-08 | Phase 2 | Pending |
| PERSIST-01 | Phase 1 | Pending |
| PERSIST-02 | Phase 1 | Pending |
| PERSIST-03 | Phase 1 | Complete |
| PERSIST-04 | Phase 1 | Pending |
| ADAPT-01 | Phase 2 | Pending |
| ADAPT-02 | v2.1 (deferred) | Deferred |
| ADAPT-03 | Phase 2 | Pending |
| ADAPT-04 | v2.1 (deferred) | Deferred |
| ADAPT-05 | v2.1 (deferred) | Deferred |
| MVPA-01 | Phase 2 | Pending |
| MVPA-02 | Phase 2 | Pending |
| MVPA-03 | Phase 2 | Pending |
| MVPA-04 | Phase 2 | Pending |
| MVPA-05 | Phase 2 | Pending |
| MVPA-06 | Phase 2 | Pending |
| MVPA-07 | Phase 2 | Pending |
| MVPA-08 | Phase 2 | Pending |
| MVPB-01 | Phase 3 | Pending |
| MVPB-02 | Phase 3 | Pending |
| MVPB-03 | Phase 3 | Pending |
| MVPB-04 | Phase 3 | Pending |
| MVPB-05 | Phase 3 | Pending |
| MVPB-06 | Phase 3 | Pending |
| MVPB-07 | Phase 3 | Pending |
| MVPB-08 | Phase 3 | Pending |
| MVPB-09 | Phase 3 | Pending |
| MVPB-10 | Phase 3 | Pending |
| ACCEPT-01 | Phase 4 | Pending |
| ACCEPT-02 | Phase 4 | Pending |
| ACCEPT-03 | Phase 4 | Pending |
| ACCEPT-04 | Phase 4 | Pending |
| ACCEPT-05 | Phase 4 | Pending |
| ACCEPT-06 | Phase 4 | Pending |
| ACCEPT-07 | Phase 4 | Pending |
| ACCEPT-08 | Phase 4 | Pending |
| ACCEPT-09 | Phase 4 | Pending |
| COST-01 | Phase 2 | Pending |
| COST-02 | Phase 2 | Pending |
| COST-03 | Phase 3 | Pending |
| COST-04 | Phase 3 | Pending |
| COST-05 | Phase 2 | Pending |
| COST-06 | Phase 2 | Pending |
| COST-07 | Phase 4 | Pending |
| COST-08 | Phase 2 | Pending |
| COST-09 | Phase 2 | Pending |
| COST-10 | Phase 4 | Pending |
| SCHEMA-01 | Phase 1 | Complete |
| SCHEMA-02 | Phase 1 | Complete |
| SCHEMA-03 | Phase 1 | Complete |
| SCHEMA-04 | Phase 1 | Complete |
| SCHEMA-05 | Phase 1 | Complete |
| SCHEMA-06 | Phase 1 | Complete |
| SCHEMA-07 | Phase 1 | Complete |
| RECOV-01 | Phase 1 | Pending |
| RECOV-02 | Phase 1 | Pending |
| RECOV-03 | Phase 1 | Pending |
| GTM-01 | Phase 4 | Pending |
| GTM-02 | Phase 4 | Pending |
| GTM-03 | Phase 4 | Pending |
| GTM-04 | Phase 4 | Pending |
| GTM-05 | Phase 4 | Pending |
| GTM-06 | Phase 1 | Pending |
| GTM-07 | Phase 4 | Pending |

**Coverage:**
- v1 active requirements: **142** (146 total v1 IDs minus 4 v2.1-deferred: ATOM-07, ADAPT-02, ADAPT-04, ADAPT-05)
- Mapped to phases: **142 / 142** ✓
- Orphaned: **0** ✓
- Duplicated (mapped to >1 phase): **0** ✓
- v2.1-deferred (tracked but not in v2.0 GA roadmap): **4** (ATOM-07, ADAPT-02, ADAPT-04, ADAPT-05)

**Phase distribution:**
- Phase 1 (v1.5): 56 requirements
- Phase 2 (v2.0a): 47 requirements
- Phase 3 (v2.0b): 25 requirements
- Phase 4 (RC + GA): 22 requirements (some Phase-2 IDs also have Phase-4 verification touchpoints noted in ROADMAP.md success criteria; the table records primary delivery phase only)

---
*Requirements defined: 2026-05-24*
*Traceability populated: 2026-05-24 after roadmap creation*
