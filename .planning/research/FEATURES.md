# Feature Research

**Domain:** SKILL.md package — design-process facilitator inside coding agents
**Researched:** 2026-05-24
**Confidence:** HIGH (grounded in MRD v2.0, validated against 2026 competitive matrix in §2.5)

## Scope and Method

This research validates the feature categorization for `design-os` — a SKILL.md package that operationalizes the canonical 5-stage design process (Research → IA → Low-Fi → Interaction → Hi-Fi+DS) inside Claude Code / Cursor / Codex. The MRD already enumerates 22 triggerable skills (7 workflows + 15 atoms) plus 6 stage gates, fidelity caps, evidence grading, and the `design/` directory convention. This document does NOT re-invent the feature list — it categorizes each MRD-defined feature against the 2026 market and tags it with complexity, MVP version, and dependencies.

**Categorization frame:**
- **Table stakes** = users (indie devs, Lovable refugees, PMs, designers) will not adopt without this; competitors already have it; missing it makes the product feel broken
- **Differentiator** = the substantive competitive moat; no full-row competitor exists on these (per MRD §2.5 stage-coverage matrix); these ARE the product
- **Anti-feature** = explicit out-of-scope per MRD §14; the discipline of NOT doing these is part of the trust posture

**Complexity scale:** S (≤1 week scoped), M (1-3 weeks), L (3-6 weeks)
**MVP markers:** `v2.0a` (weeks 4-8 skeleton) / `v2.0b` (weeks 9-12 full 5-stage) / `v2.1+` (deferred)

## Feature Landscape

### Table Stakes (Users Expect These)

Features any serious 2026 AI design/dev tool must ship. Missing any of these makes design-os look amateurish next to `frontend-design`, Lovable, v0, or Knapsack.

| Feature | Why Expected | Complexity | MVP | Notes |
|---------|--------------|------------|-----|-------|
| **SKILL.md package per agentskills.io v1 spec** | Standard distribution unit since Dec 2025; cross-host portability table stakes for any agent-resident tool | M | v2.0a | R1; per-skill `compatibility:` frontmatter; metadata under Codex 2% cap |
| **PRD ingestion (Markdown + YAML frontmatter)** | 30-40% better LLM extraction than prose; spec-driven dev cohort (GitHub Spec Kit, Amazon Kiro) made Markdown PRDs the default substrate | S | v2.0a | W0 `ingest`; also pasted text + interview-mode fallback |
| **DTCG v2025.10 token emit** | First stable W3C token spec (Oct 2025); Tokens Studio + Storybook MCP + Style Dictionary all converged on DTCG; emitting anything else looks ignorant | M | v2.0a | `tokens/emit` atom; primitive→semantic→component tiers per Curtis canon |
| **DESIGN.md (Google spec) compliance** | Released April 2026 as the open contract format; Anthropic skills#1008 explicitly requests support; competing on Stage 5 without it is suicidal | M | v2.0a | `$extensions.design-os` namespace per MRD §3.6 |
| **WCAG 2.2 AA contrast measurement** | Designer/dev expectation since 2024; never claim *conformance*, just measure contrast (Frontend Masters critique) | S | v2.0a | `contrast.mjs` script per R13; output measured number not pass/fail label |
| **Slop detection (`audit --slop-tells`)** | v1.0.1 invented this; community now expects it from any agent-design tool post-2025 vibe-coding backlash; rainbow gradients/Inter-default/glass-stack catalogs are common knowledge | M | v2.0a | Heuristics in `references/slop-tells/heuristics.md` |
| **Diff-by-default (`--apply` required)** | Gatekeeper-bypass fear is universal in 2026; every credible agent-resident tool requires explicit apply | S | v2.0a | Trust posture P-line; no auto-commit |
| **Trigger discipline (per-skill descriptions ≤200 chars, recall ≥0.85, false-fire ≤0.15)** | Codex 2% metadata cap is hard ceiling; skill packages that misfire degrade the host for everyone — community shames bad triggers | M | v2.0a | R15 + `skillgrade` CI per skill |
| **Local dev-server preview (Vite / Next / Astro adapters)** | Inherited table stakes from v1.0.1; Stage 5 without preview is hi-fi-by-faith; Playwright screenshots are now expected for any agent-side UI work | L | v2.0a | R13; preserved from v1.0.1; same security sandbox + port manager |
| **Decision log + hash chain + manual-override capture** | Established Claude Code skill pattern; teams won't adopt without auditability | M | v2.0a | R18; per-file frontmatter + `.gitattributes` merge strategy |
| **Citing every rule at canon granularity (Garrett §X, WCAG SC, etc.)** | Claude Design backlash made this table stakes — "trust me bro" outputs are rejected by designers in 2026 | S | v2.0a | Inline citation discipline; every emitted rule links to `references/` |
| **`audit --pr` mode (review PR for drift)** | Standard agent-resident-tool pattern in 2026; expected for any tool committing artifacts to git | M | v2.0a | W7; severity-ranked findings + fix recipes per v1.0.1 §6.4 |
| **Multi-host compatibility (Claude Code + Codex CLI + Cursor)** | Single-host packages get rejected from cross-marketplace cross-posts; sequential-fallback is the accepted pattern | M | v2.0a | R17; broader hosts deferred to v2.1+ |
| **JSON Schema validation for every artifact format** | Spec-driven dev cohort expects schemas; v1.5 prereq per R24 | M | v2.0a (v1.5 infra) | Persona, sitemap, MANIFEST, state-spec, AUDIT-REPORT |
| **Partial-output recovery (interrupt and resume from any stage)** | Inherited from agent-loop UX norms; users expect to ctrl-C and come back | M | v2.0a | R25; 100% scripted-test pass requirement |
| **Deterministic emit (LLM picks, scripts emit)** | Inherited table stakes from v1.0.1; community expects scripts to handle the deterministic parts | S | v2.0a | R13 + P6; `oklch.mjs`, `dtcg-lint.mjs`, etc. |

### Differentiators (Competitive Advantage)

Features that constitute the structural moat. Per MRD §2.5 stage-coverage matrix verified empirically across 17+ tools, **no competing product covers the full 5-stage row**. These ARE the differentiation. None are optional — drop any and the moat shrinks.

| Feature | Value Proposition | Complexity | MVP | Notes |
|---------|-------------------|------------|-----|-------|
| **Garrett's 5-plane spine operationalized 1:1 to user's 5 stages** | The frameworks (IDEO, d.school, Double Diamond, Sprint, Lean UX) exist as books not software; design-os is first to ship the canonical spine as a tool | L | v2.0a (skeleton) + v2.0b (full) | R2; every skill declares `stage:` frontmatter |
| **Six first-class stage gates with terminal states (PASS / PASS_WITH_WARNINGS / FAILED_AFTER_REPAIR / USER_OVERRIDDEN)** | The most under-documented part of canon — practitioners know intuitively, literature is scattered; formalizing checklists is the package's biggest single contribution | L | v2.0a (gates 1,2,5a,5b) + v2.0b (gates 3,4) | R4 + §3.22; runnable by workflow or `audit --stage N` |
| **Evidence-grading per gate (VALIDATED / PROTO / INFERRED / MISSING)** | Honestly handles solo-indie reality (no real users yet) without abandoning discipline; competitors either ignore rigor or force enterprise-grade research | M | v2.0a | R4 + §3.22; resolves §2.4 synthetic-persona policy without self-contradiction |
| **Per-stage fidelity caps (Buxton discipline) — Stage 3 refuses styled UI; Stage 4 refuses hi-fi without state-maps; Stage 5a refuses to render without Stage 4 inputs** | THE counter-cultural choice; every other AI design tool eagerly renders hi-fi; the discipline IS the product | M | v2.0a (cap 5a) + v2.0b (caps 3, 4) | R5 + §3.23; if LLM emits color/type at Stage 3, reject and regenerate |
| **Synthetic-persona red line (Stage 1 hard-blocks `VALIDATED` with synthetic-only data)** | NN/g 2024 + ACM Interactions 2026 + arXiv 63-paper review converged on this; competitors either ignore it or generate personas as primary research | M | v2.0a | R6 + §3.22 |
| **`design/` directory as cross-stage artifact substrate** | The "intermediate representation" that makes the pipeline reproducible; competitors keep state in app DBs or never commit; design-os makes design-as-code | L | v2.0a | R3 + §3.6; stage-typed file conventions + commit policy + frontmatter |
| **Compact stage-handoff bundles (`design/.handoff/stage-N-bundle.md` ~5-15k tokens each)** | Bounds context regardless of `design/` size; competitors blow context windows when "read all upstream" hits 5+ stages | M | v2.0a | R10; addresses the v2.0 codex-review HIGH finding on context survival |
| **Job-routing matrix — 7 named routes; default is NOT all 5 stages** | The on-ramp for process-averse indie devs and degradation path for mature-app work; competitors are either always-full or always-skip | M | v2.0a | R9 + §3.4a; routes: new-product, new-feature, mature-app-refactor, design-bug, brand-refresh, DS-extraction, PR-audit |
| **Per-route token budgets enforced (e.g., design-bug ≤20k, new-feature ≤60k, full new-product ≤150k p50 / ≤220k p95)** | Indie devs are cost-sensitive; 2026 discourse explicitly fears LLM bill blowouts; bounded budgets signal seriousness | M | v2.0a | R23; per-stage subagent dispatch with stitched context |
| **`audit --reverse-engineer-stages` (Lovable refugee path)** | Primary persona's raison d'être; reverse-engineers stages 1-4 from existing UI for the segment that bought into v0/Lovable and hit the 80/20 wall | L | v2.0b | R16 + §9.2; moved up from v2.1 per codex feedback |
| **Stage-specific `audit` detector logic (per-stage `--stage N --pr` modes)** | Cross-stage maintenance verb is unique; competitors' linters work at one stage only | M | v2.0a (5a/5b detectors) + v2.0b (1/2/3/4 detectors) | §6 detector table; route changes, JTBD orphans, state-machine drift, HAX-18 regressions |
| **Crazy 8s as Excalidraw JSON, low-fi-diversity-enforced** | Stage 3 white space — only UIzard/Visily play here and they're walled gardens; Excalidraw is git-diffable and free | L | v2.0b | W3 + `lowfi/crazy-eights` atom; deterministic distance metric rejects near-clones |
| **XState v5 state machines + Mermaid stateDiagram-v2 dual-emit** | Stage 4 is the BIGGEST white space (no competitor covers it); dual-emit serves engineering and design audiences without forcing one to read the other's format | L | v2.0b | W4 + `ixd/state-machine` atom; XState required only for async + ≥3 states + conditional transitions per Q2 |
| **Microsoft HAX 18 audit (AI products only) at Stage 4** | AI-product designers in 2026 expect HAX-18 reviewed; no AI-design tool ships this | M | v2.0b | Stage-4 gate component; per §3.22 |
| **Promote-to-system rule (component recur ≥3× before becoming system component)** | Frost rule of thumb operationalized; competitors over-systematize from one-offs | S | v2.0a (style-lite) + v2.0b (full) | R5; Stage 5b discipline |
| **Variant-distance metric (≥0.5 visual diversity) preserved from v1.0.1, extended to IA + Low-fi + IxD** | Variants that look the same are theater; the v1.0.1 metric is now applied at multiple stages | M | v2.0a | Stage 2 sitemap variants, Stage 3 wireframes, Stage 4 patterns, Stage 5a visuals |
| **Polyglot stack adapters (Tailwind v4, shadcn, plain CSS in core; Material/Vue/Svelte in `design-os-bridges` v2.1+)** | Most AI design tools lock to React + Tailwind; design-os emits what the user's stack consumes | M | v2.0a (core 3) + v2.1 (bridges) | R19 |
| **Interview mode (Lenny 1-pager) when PRD is empty** | Indie devs often start with an idea, not a doc; design-os converts via 5-7 question intake; competitors require pre-existing spec | S | v2.0a | W0 step 1; per §4 |
| **Aggregate coexistence eval (≥0.80 trigger recall with 5+ skill packages installed)** | Codex 2% cap math doesn't model real-world ecosystems; competitors test in isolation; design-os tests in coexistence | M | v2.0a (v1.5 infra) | R15 + §11 codex-review addition |
| **`audit --reverse-engineer` for Lovable refugees with backfill into stages 1-4** | The primary persona that the entire v2.0b roadmap targets; closing this loop = product-market fit signal | L | v2.0b | Same as `audit --reverse-engineer-stages` line above — listed twice in MRD; track as one feature |

### Anti-Features (Deliberately NOT Building)

Per MRD §14 explicit cessions. These are NOT "we'd build if we had time" — they are strategic refusals. Each refusal is a positive value claim (trust, focus, discipline) and most also map to a competitor's existing strength.

| Anti-Feature | Why It Looks Appealing | Why We Refuse | Alternative We Provide |
|--------------|------------------------|---------------|------------------------|
| **Prompt → fully-shipped UI from scratch** | The market sees Lovable/v0/Bolt at $700M+ ARR and assumes that's the prize | Three of the dominant players already own this; we are *complementary*, not competitive; the 80/20 wall discourse proves the prize isn't where the market thinks | We integrate — design-os outputs DESIGN.md that v0/Lovable/Bolt prompts can consume |
| **Visual canvas editing** | Subframe + Figma Make make this look fun and viral | Wrong runtime — we live in the agent loop, not a browser canvas; building this duplicates Subframe and abandons our positioning | `design/wireframes/*.excalidraw` is git-diffable and AI-readable, no canvas needed |
| **Hosting / deploy** | Bundling deploy makes "complete workflow" easier to sell | Orthogonal to design process; the user owns runtime; conflates concerns and creates support burden | Output is files in the user's repo — they deploy however they already do |
| **Hosted SaaS (year-1)** | Recurring revenue, dashboards, user accounts | Trust gap; designer/dev community 2026 sentiment heavily favors OSS-in-your-repo; SaaS doubles the cost of distribution | OSS Apache-2.0; enterprise dashboard is a separate sibling product (year-2+) |
| **Synthetic personas as primary research** | "AI generates personas" is a real demand from solo founders with no users | NN/g 2024 red line; ACM Interactions 2026 + arXiv 63-paper review; trust collapse if violated; "AI replaces research" is a documented failure mode | `proto-mode` with `ASSUMPTIONS.md` flagged loudly; `PROTO` grade never `VALIDATED` without real evidence |
| **Authoring the DESIGN.md spec itself** | Owning the format is leverage | Google owns; competing on spec authorship is a 5-year political slog; adopting is faster | We emit per Google's spec + `$extensions.design-os` namespace |
| **Authoring the DTCG spec** | Same reasoning | W3C owns; same argument as above | We emit DTCG v2025.10 |
| **A figure-recognition vision generator (sketch→hi-fi from a photo)** | Demo-friendly; UIzard markets this hard | Vision pipelines are expensive, brittle, and not where the design-process gap lives; deferred indefinitely | Excalidraw JSON is the canonical sketch format; we work from structured input not pixels |
| **Replacing Dovetail / Maze / Optimal Workshop research repositories** | "All-in-one" sounds attractive | We don't have the R&D bandwidth, the network effects, or the data; doing this badly burns trust | Read their exports (Optimal Workshop CSV in v2.1; Dovetail/Notably transcripts in v2.2); never replace |
| **Replacing ProtoPie / Origami for advanced IxD** | Stage 4 is our biggest white space — temptation to push deeper | Advanced motion tooling has decades of investment we can't match; canonical Stage 4 is enough | Cover canonical IxD (state catalog + Mermaid + XState); leave advanced motion to ProtoPie/Origami |
| **Generic "AI design" marketing framing** | Easiest way to capture search traffic | Discourse poison post-2025; van Schneider signal; Frontend Masters critique; immediate designer rejection | Position as "design-process facilitator"; never lead with AI |
| **Claiming WCAG conformance** | Sounds authoritative on landing page | Liability + literally false (conformance is a process not a measurement); Frontend Masters and a11y community will pillory | Report measured contrast: "WCAG 2.2 AA contrast 4.7 (pass)" |
| **Auto-publishing to git tree** | Removes friction | Gatekeeper-bypass fear is universal in 2026; designers will refuse to install; one bad auto-commit kills trust | Diff-by-default; `--apply` required for every write |
| **Notion / Linear / Google Doc PRD ingestion (in v2.0)** | Many PMs live in these tools | Deferred to v2.1 to keep v2.0 surface small; integrations are API-fragile and we'd ship them half-broken | Paste-text + Markdown + interview-mode covers the wedge |
| **Voice → PRD interview mode** | Demo-friendly | Deferred to v2.2; Whisper integration is solvable but not MVP-blocking | Text-interview mode hits the same job |
| **i18n / RTL / CJK handling** | Globally relevant | Dedicated atom deferred to v2.1; treating it as an afterthought is worse than admitting it's not yet covered | Acknowledged gap in v2.0; explicit atom in v2.1 |

## Feature Dependencies

```
Stage 0 (ingest)
    └──required by──> Stage 1 (discover)
                          └──required by──> Stage 2 (structure)
                                                └──required by──> Stage 3 (sketch) [v2.0b]
                                                |                     └──required by──> Stage 4 (interact) [v2.0b]
                                                |                                          └──required by──> Stage 5a (style) [FULL]
                                                |                                                                └──required by──> Stage 5b (systematize)
                                                └──required by──> Stage 5a-lite (style-lite) [v2.0a only]
                                                                      └──required by──> Stage 5b-lite (systematize-lite) [v2.0a only]

design/ directory convention
    └──substrate-for──> ALL workflows
    └──required by──> stage-handoff bundles
                          └──required by──> bounded-context invocations across stages

Stage gates
    └──depend on──> JSON schemas for artifacts (R24, v1.5 prereq)
    └──depend on──> evidence-grading machinery
    └──depend on──> per-file frontmatter conformance

Job-routing matrix
    └──required by──> per-route token budgets
    └──enables──> Stage skipping with documented `MISSING` grade

audit --reverse-engineer-stages [v2.0b]
    └──depends on──> all 5 stage gates being implemented (forward direction first)
    └──depends on──> Stage 4 state-catalog atom (to infer state-maps from existing prototype)

DTCG emit
    └──required by──> DESIGN.md generation (Stage 5b)
    └──required by──> tokens/emit atom

XState v5 emit [v2.0b]
    └──ALTERNATIVE to──> Mermaid stateDiagram-v2 (dual emit; XState only required for async + ≥3 states + conditional transitions)

Variant-distance metric (v1.0.1, preserved)
    └──required by──> Stage 2 sitemap variants diversity
    └──required by──> Stage 3 Crazy 8s diversity
    └──required by──> Stage 5a visual variants diversity (original v1.0.1 use)

Preview/dev-server (Vite/Next/Astro adapters)
    └──required by──> Stage 5a hi-fi variant preview
    └──required by──> Stage 3 Excalidraw static viewer
    └──required by──> Stage 4 interactive prototype rendering (optional)
```

### Critical Dependency Notes

- **Stage gates depend on JSON schemas (R24).** Schemas must ship in v1.5 infra phase BEFORE v2.0a workflow build starts. This is non-negotiable per codex review — building gates against unfrozen schemas is the kind of rework that kills timelines.
- **Stage 5a *full gate* depends on Stage 4 artifacts.** This is the v2.0a BLOCKER codex caught. Resolved by `style-lite` / `systematize-lite` mode in v2.0a that does NOT claim `gate/stage-5a-complete` — output labeled `evidence: INFERRED`. Full gate gated to v2.0b.
- **`audit --reverse-engineer-stages` (v2.0b) depends on all 5 forward-direction gates.** You can't reverse-engineer into stages whose validation criteria don't exist yet.
- **All workflows depend on the `design/` directory convention + handoff bundles.** Per-file commit policy + frontmatter conformance + `.gitattributes` must be locked in v1.5 infra.
- **Evidence grading is orthogonal to terminal state.** A gate can return `(PASS_WITH_WARNINGS, PROTO)` — both axes recorded in `manifest.lock`.
- **Job-routing matrix is the on-ramp.** No stage is *unconditionally* required; the route decides. This is what unlocks indie-dev adoption — they don't have to commit to all 5 stages.

## MVP Definition

The MRD's v2.0a / v2.0b split is non-negotiable per codex review. Reproduced here with rationale for each cut.

### Launch With (v2.0a — weeks 4-8, the skeleton)

The minimum end-to-end product: PRD → Discover → Structure → Style-lite → Systematize-lite. Skips the most novel stages (Sketch + Interact) to ship the spine + 4 of 6 gates first.

**Workflows (5):**
- [ ] `ingest` (W0) — PRD parse + interview-mode fallback — *essential PRD on-ramp*
- [ ] `discover` (W1) — Stage 1 with proto-personas + OST + assumptions — *delivers the synthetic-persona red line*
- [ ] `structure` (W2) — Stage 2 sitemap + flows — *delivers the IA white space*
- [ ] `style` (W5, lite mode) — Stage 5a hi-fi preview, labeled `evidence: INFERRED` because Stage 4 doesn't ship yet — *preserves v1.0.1 advantage*
- [ ] `systematize` (W6, lite mode) — Stage 5b tokens + DESIGN.md, labeled `evidence: INFERRED` — *delivers DTCG + DESIGN.md compliance*
- [ ] `audit` (W7, basic — Stage 5a/5b detectors + slop-tells + `--pr`) — *delivers maintainability*

**Atoms (9):**
- [ ] `prd/parse-or-interview`
- [ ] `research/synthesize`
- [ ] `research/personas-proto`
- [ ] `research/build-ost`
- [ ] `ia/sitemap-variants`
- [ ] `ia/flows-from-jobs`
- [ ] `hifi/variants-preview` (collapses v1.0.1 preview/render+serve+screenshot into one atom)
- [ ] `tokens/emit`
- [ ] 1 cross-stage utility (likely the `design/` MANIFEST + handoff bundle generator)

**Gates (4):** stage-1, stage-2, stage-5a (lite), stage-5b (lite)

**Adapters (3):** tailwind-v4, shadcn, plain-css

**Infrastructure (v1.5, weeks 1-3, must land before v2.0a build):**
- [ ] Versioned JSON schemas for persona, sitemap, MANIFEST, state-spec, AUDIT-REPORT
- [ ] Preview harness (Vite / Next dev-server boot, Playwright readiness, port manager, security sandbox)
- [ ] Variant-distance metric + repair-loop test
- [ ] Evidence-graded gate runner machinery
- [ ] `skillgrade` CI + aggregate coexistence eval
- [ ] `design/` directory governance (commit policy, frontmatter, `.gitattributes`)

### Add After Validation (v2.0b — weeks 9-12, full 5 stages)

Adds the biggest white space (IxD) and the primary persona's raison d'être (Lovable refugee path).

**Workflows (+3):**
- [ ] `sketch` (W3) — Stage 3 Crazy 8s + Decider — *opens Buxton discipline; Stage 3 cap enforced*
- [ ] `interact` (W4) — Stage 4 state catalog + pattern variants + XState + Mermaid + HAX-18 — *the biggest white space*
- [ ] `audit --reverse-engineer-stages` (added mode on W7) — *Lovable refugee path; primary persona*

**Atoms (+6):**
- [ ] `lowfi/crazy-eights`
- [ ] `lowfi/converge`
- [ ] `ixd/state-machine`
- [ ] `ixd/pattern-variants`
- [ ] `ixd/state-catalog`
- [ ] `system/scaffold-component`

**Gates (+2):** stage-3, stage-4 (plus stage-5a/5b promoted from lite to full)

**Renderers added to `assets/scripts/`:** Excalidraw static viewer, Mermaid renderer (`mermaid.mjs`), XState code emitter (`state-machine-emit.mjs`)

### Future Consideration (v2.1+)

Each defer reason is in the MRD; reproduced for roadmap completeness.

- [ ] **`extract`-Lovable-refugee polish** — refine the v2.0b first cut once usage data is in
- [ ] **Notion / Linear / Google Doc PRD ingestion** — API-fragile; ship when stable (Notion only in Gaia Logic scope per CLAUDE.md)
- [ ] **Optimal Workshop tree-test CSV ingestion** — nice-to-have; not blocking
- [ ] **Tokens Studio Figma export ingestion** — bridge to designer Figma workflow
- [ ] **`design-os-bridges` (Material Web, Vue, Svelte adapters)** — broaden stack coverage
- [ ] **Broader hosts (Junie, Copilot, etc.)** — host churn; ship after host APIs stabilize
- [ ] **Dovetail / Notably transcript ingestion** (v2.2) — research-tool integration
- [ ] **Voice → PRD interview mode** (v2.2) — Whisper integration; non-MVP-blocking
- [ ] **i18n / RTL / CJK dedicated atom** — acknowledged gap; explicit atom in v2.1
- [ ] **Storybook MCP via Chromatic integration** — depends on Chromatic MCP stability
- [ ] **Enterprise audit dashboard** (year-2+) — separate sibling product, not OSS feature
- [ ] **Premium style packs** (year-2+) — monetization path; not feature creep

## Feature Prioritization Matrix

Priorities reflect both market need and MVP scope decision. P1 = ship in v2.0a; P2 = ship in v2.0b; P3 = defer to v2.1+.

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| SKILL.md package + agentskills.io v1 compliance | HIGH | MEDIUM | P1 |
| `ingest` workflow + interview mode | HIGH | LOW | P1 |
| `discover` (Stage 1) + synthetic-persona red line | HIGH | MEDIUM | P1 |
| `structure` (Stage 2) + sitemap variants | HIGH | MEDIUM | P1 |
| `style-lite` (Stage 5a) + preview harness | HIGH | HIGH (preserved from v1.0.1) | P1 |
| `systematize-lite` (Stage 5b) + DTCG + DESIGN.md | HIGH | MEDIUM | P1 |
| Stage gates 1, 2, 5a (lite), 5b (lite) + evidence grading | HIGH | HIGH | P1 |
| `design/` directory + governance + handoff bundles | HIGH | MEDIUM | P1 |
| Job-routing matrix (7 routes) | HIGH | MEDIUM | P1 |
| Slop detection + `audit --pr` + `audit --slop-tells` | MEDIUM | MEDIUM | P1 |
| Variant-distance metric (preserved) | MEDIUM | LOW (inherited) | P1 |
| Trigger discipline + `skillgrade` CI + coexistence eval | HIGH | MEDIUM | P1 |
| Versioned JSON schemas (v1.5 prereq) | HIGH | MEDIUM | P1 |
| Partial-output recovery | MEDIUM | MEDIUM | P1 |
| `sketch` (Stage 3) + Crazy 8s + fidelity cap | HIGH | HIGH | P2 |
| `interact` (Stage 4) + state catalog + XState + Mermaid | HIGH | HIGH | P2 |
| HAX-18 audit for AI products | MEDIUM | LOW | P2 |
| Stage gates 3, 4 (and promotion of 5a/5b from lite to full) | HIGH | MEDIUM | P2 |
| `audit --reverse-engineer-stages` (Lovable refugee path) | HIGH | HIGH | P2 |
| Excalidraw / Mermaid / XState renderers | MEDIUM | MEDIUM | P2 |
| Notion / Linear / Google Doc PRD ingestion | MEDIUM | MEDIUM | P3 |
| `design-os-bridges` (Material/Vue/Svelte) | MEDIUM | MEDIUM | P3 |
| Optimal Workshop CSV + Tokens Studio import | LOW | LOW | P3 |
| Voice → PRD interview mode | LOW | MEDIUM | P3 |
| i18n / RTL / CJK atom | MEDIUM | MEDIUM | P3 |
| Storybook MCP via Chromatic | MEDIUM | MEDIUM | P3 |
| Enterprise audit dashboard | HIGH (enterprise) | HIGH | P3 (sibling product) |

## Competitor Feature Analysis

Validated against MRD §2.5 stage-coverage matrix. Key insight: no competitor covers the full row; each is dominant in one or two columns.

| Feature | Lovable / v0 / Bolt | Subframe | Anthropic frontend-design | Knapsack IPE | Maze / Optimal Workshop | Our Approach |
|---------|---------------------|----------|---------------------------|--------------|------------------------|--------------|
| 5-stage spine | Skips 1-4 | Skips 1-4 | Stage 5 only | Stage 5 + governance | Stages 1-2 only | Full 5-stage operationalized via `design` workflow |
| Stage validation gates | None | None | None | None (governance is post-hoc) | Test-based but not staged | Six first-class gates with terminal states + evidence grades |
| Fidelity caps | None — eagerly hi-fi | Canvas-driven | Hi-fi default | Component-system focus | N/A | Hard caps Stage 3 → 5a; Buxton discipline |
| Synthetic personas | Default behavior | N/A | N/A | N/A | Maze allows | Hard-blocks `VALIDATED`; `PROTO` only |
| Cross-stage artifacts in git | App state, not artifacts | Canvas exports | None standardized | Component manifests | SaaS silos | `design/` directory convention; stage-typed files committed |
| DESIGN.md compliance | No | No | No (per anthropics/skills#1008) | No | No | Emit per Google spec + `$extensions.design-os` |
| DTCG v2025.10 emit | Partial (some emit Tailwind tokens) | Partial | Partial | Full | N/A | Full primitive→semantic→component tier emit |
| Slop detection | None | None | Partial | None | N/A | First-class `audit --slop-tells` from v1.0.1 |
| Lovable refugee reverse-engineer | N/A (they ARE Lovable) | Partial via canvas | Could but not designed for it | N/A | N/A | `audit --reverse-engineer-stages` (v2.0b) — primary persona feature |
| Host portability | Vendor-locked SaaS | Vendor SaaS | Anthropic-only | Vendor SaaS | Vendor SaaS | Claude Code + Codex + Cursor; broader hosts v2.1+ |
| Live preview | Yes (their core) | Yes (canvas) | Limited | No | No | Yes (Vite/Next/Astro adapters) — preserved from v1.0.1 |
| Visual canvas editing | No | YES (their core) | No | No | No | NO — explicit anti-feature |
| Hosting / deploy | YES | No | No | No | No | NO — explicit anti-feature |
| Trigger discipline (skill-grade) | N/A (not skill packages) | N/A | Partial | N/A | N/A | Per-skill ≥0.85 recall + ≤0.15 false-fire + coexistence eval |
| Trust posture (cite canon, don't claim WCAG, diff-by-default) | None | Partial | Partial | Partial | Partial | Comprehensive — every rule cited; never claim conformance; never auto-commit |

## Confidence Assessment

- **Categorization confidence: HIGH.** The MRD has been through 4 codex review passes (69 cumulative findings, all accepted) and the v2.0 stage-coverage matrix was empirically verified across 17+ tools. The differentiator list maps 1:1 to white space confirmed in the matrix.
- **Anti-feature confidence: HIGH.** Each anti-feature is documented in §14 with a specific competitor or risk; none are speculative.
- **MVP split confidence: HIGH.** The v2.0a/v2.0b split was the explicit codex-review fix to the Stage 5a-gate BLOCKER. Reverting it re-introduces the contradiction.
- **Complexity estimates: MEDIUM.** Inherited from v1.0.1 timing data (preview harness, variant metric, audit detectors) and codex-validated MVP scoping. Stage 3 (Crazy 8s) and Stage 4 (XState + state catalog) are the highest-uncertainty L-complexity items because no existing competitor has shipped them — there's no baseline to estimate against.
- **Open uncertainty:** the *quality* of generated Crazy 8s wireframes (codex flagged "LLM produces 3 + 5 near-clones") — the diversity metric exists but the empirical pass rate of Stage 3 gate on real prompts is the key v2.0b risk.

## Sources

Primary:
- `/Users/pilawski/My_projects/skillsos/Design Docs Frontend/design-os-mrd-v2.md` — MRD v2.0 (§§2.5, 3.4a, 3.7, 3.8, 3.22, 3.23, 9, 14, 16) — authoritative for feature inventory and categorization
- `/Users/pilawski/My_projects/skillsos/Design Docs Frontend/.planning/PROJECT.md` — Active requirements (R1-R26)

Market validation (cited in MRD §2.1, §2.5):
- Sourcetoad 1,645 Lovable app security audit (10.3% critical user-data vulns)
- 2025 Stack Overflow Developer Survey — 76% AI-codegen 80/20 wall finding
- NN/g 2024 — *Synthetic Users: If, When, and How to Use AI-Generated "Research"*
- ACM Interactions 2026 — synthetic-user people-pleasing study
- arXiv Dec 2025 — *Whose Personae?* 63-paper synthetic-persona review
- W3C DTCG v2025.10 (Oct 28, 2025) — first stable token spec
- Google DESIGN.md (April 2026) — Stage 5 contract anchor
- Anthropic agentskills.io v1 spec (Dec 18, 2025)
- anthropics/skills#1008 — DESIGN.md consume/produce request

Competitive landscape (stage-coverage matrix in MRD §2.5):
- Lovable, v0, Bolt, Subframe, Stitch, Figma Make, Builder.io Visual Copilot, Tempo Labs, UIzard, Visily, Maze AI, Optimal Workshop AI, Notion AI, Claude Design (Anthropic), `frontend-design` (Anthropic — 277k installs), Knapsack IPE, Supernova, Storybook MCP / Chromatic, ChatPRD, Productboard AI

Trust-posture sources (cited in MRD §2.4):
- Brad Frost — *Design systems in the time of AI*, *Agentic Design Systems in 2026*
- Addy Osmani — *AI-Driven Prototyping: v0, Bolt, and Lovable Compared*
- van Schneider, Frontend Masters critique (AI-framing rejection signals)

---
*Feature research for: design-os v2.0 — 5-stage design-process facilitator SKILL.md package*
*Researched: 2026-05-24*
