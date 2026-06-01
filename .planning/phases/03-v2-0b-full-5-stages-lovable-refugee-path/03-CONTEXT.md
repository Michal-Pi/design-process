# Phase 3: v2.0b — Full 5 Stages + Lovable Refugee Path - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** `--auto` (recommended options selected for every gray area; user can review and amend before plan-phase)

<domain>
## Phase Boundary

Complete the full 5-stage complete-design pipeline by adding Stage 3 (Sketch/Low-Fi) and Stage 4 (Interact/IxD), promoting Stage 5a/5b from lite-mode to fully runnable gates, adding the `audit --reverse-engineer-stages` Lovable-refugee path, and implementing the `new-product` + `mature-app-refactor` + `DS-extraction` routes. This is the milestone that makes the package independently distributable as a genuine end-to-end tool — not just a skeleton — and fulfills the primary "Lovable refugee" persona need that was the raison d'être for moving the reverse-engineer feature from v2.1 to v2.0b.

**In scope (Phase 3 delivers):**

1. **Stage 3 — `sketch` workflow**: `lowfi/crazy-eights` atom (Crazy 8s procedure: 8 ideas in 8 minutes, 3+ structurally diverse variants), `lowfi/converge` atom (Decider convergence → `design/wireframes/<screen>/CHOICE.md`); Excalidraw JSON emit via `convertToExcalidrawElements()` programmatic API; `gate/stage-3-complete` that rejects <3 alternatives, flags fidelity-cap violations (no color/non-default fonts), and checks structural diversity ≥0.35; Stage 2→3 handoff bundle; references: `buxton-sketching`, `sprint-crazy-eights`, `shape-up-pitches`.

2. **Stage 4 — `interact` workflow**: `ixd/state-catalog` atom (enumerate loading/empty/error/success states per screen), `ixd/pattern-variants` atom (Tidwell / APG pattern mapping), `ixd/state-machine` atom (XState v5 conditional emit + Mermaid stateDiagram-v2 canonical artifact), HAX-18 audit hook; `gate/stage-4-complete` that checks state completeness + XState presence (only when async + ≥3 states + conditional transitions) + Mermaid for all screens; Stage 3→4 and Stage 4→5a handoff bundles; references: `saffer-microinteractions`, `tidwell-patterns`, `head-motion`, `hax-18`, `xstate-v5`, `apg`, `material-3`.

3. **Stage 5a/5b gate promotion**: `gate/stage-5a-complete` promoted from hard-coded `not_runnable` to a full runnable gate (GATE-07 / GATE-08 resolved); `gate/stage-5b-complete` upgraded from D-44 `status: na` stub to hard-blocking Frost ≥3× recurrence enforcement (FID-06).

4. **New routes**: `new-product` full route (all 5 stages, ≤150k tokens), `mature-app-refactor` route (Stage 2 audit + Stage 4 audit + Stage 5b, ≤45k), `DS-extraction` route (Stage 5b deep extraction, ≤60k — per ROUTE-06).

5. **`audit --reverse-engineer-stages`**: Accept cloned-repo path or live URL as input; normalize to filesystem; infer Stages 4→3→2→1 (reverse order, deepest signals first); emit every artifact with `provenance: inferred` + INFERRED disclaimer banners; surface gaps as ranked actionable list.

6. **Schema migration v2.0a → v2.0b**: Idempotent `complete-design migrate --from 2.0a --to 2.0b`; upgrades `sitemap.json` (adds Stage 3 cross-refs), `persona.json` (adds Stage 4 interaction needs), `MANIFEST.md` (registers new artifact types); dry-run by default, `--apply` to commit.

7. **`audit --all-stages`**: Unified ranked finding list across all 6 stage detectors (blocker DESC, stage ASC); supplies the Phase 3 ROADMAP Success Criterion 5 report.

8. **`audit --new-feature`**: Post-hoc validator for an existing named feature against all 5 stages; distinct from `design --route new-feature` (forward-generation workflow).

9. **12 new Stage 3+4 reference files** added to `references/`: `buxton-sketching.md`, `sprint-crazy-eights.md`, `shape-up-pitches.md`, `saffer-microinteractions.md`, `tidwell-patterns.md`, `head-motion.md`, `hax-18.md`, `xstate-v5.md`, `apg.md`, `material-3.md`, plus `wodtke-ia.md` and `spencer-card-sort.md` (REF-03, MRD §3.10).

10. **New scripts in `assets/scripts/`**: `excalidraw-render.mjs`, `mermaid-render.mjs` Stage 4 extension (already present for Stage 2; extend for stateDiagram-v2), `state-machine-emit.mjs`, `gates/stage-3.mjs`, `gates/stage-4.mjs`, `audit/stage-3-pr.mjs`, `audit/stage-4-pr.mjs`.

**Out of scope (Phase 3 boundary — do not implement):**
- Full 15-fixture acceptance suite (Phase 4, ACCEPT-01..09).
- GA launch artifact, 8 marketplaces cross-post (Phase 4, GTM-01..05).
- Formal cross-host within-0.10 parity release gate (Phase 4, DIST-05/06/07).
- `axe-runner.mjs` WCAG run as a Phase 4 release blocker (Phase 4, COST-10).
- Aggregate coexistence ≥0.80 release gate (Phase 4, TRIG-03).
- Designer and PM blind reviews (Phase 4).
- `complete-design-bridges` companion — Material Web, Vue, Svelte adapters (v2.1+).
- Notion / Linear / Google Doc PRD ingestion (v2.1+, §13 Q3).
- Voice → PRD interview mode (v2.2+, §13 Q6).

**Out of scope full stop (PROJECT.md constraints — not any phase):**
- React/Next/Vue inside complete-design itself.
- Vector DB / knowledge graph for `references/`.
- Hosted SaaS / dashboard.
- Figma DTCG export ingestion.

</domain>

<decisions>
## Implementation Decisions

### Excalidraw wireframe authoring method (D-54)

- **D-54: LLM describes wireframe structure in a lightweight skeleton format → `excalidraw-render.mjs` programmatically emits valid Excalidraw JSON via `convertToExcalidrawElements()`.** The `lowfi/crazy-eights` atom produces 8 structured skeleton descriptions (one per Crazy 8 slot) in a JSON intermediate representation (`{ type, x, y, w, h, label, children }`). `excalidraw-render.mjs` translates each skeleton IR element into valid Excalidraw element objects via `convertToExcalidrawElements()` from `@excalidraw/excalidraw` 0.18+. The LLM never hand-builds raw element JSON with literal `type`, `version`, `elements[]` arrays — the STACK.md explicitly warns "do NOT hand-build raw element JSON." Rationale: (1) MRD STACK.md §(b) canonically forbids hand-building; (2) MVPB-03 + ARCHITECTURE.md Pattern 1 ("LLM picks, scripts emit") is the same determinism contract used for DTCG token emit and Mermaid render; (3) `@excalidraw/excalidraw` element schema has changed across 2025-2026 — programmatic emit via the library's own API is the only schema-safe path. New deliverable: `assets/scripts/excalidraw-render.mjs`.

### Stage 3 structural diversity metric (D-55)

- **D-55: `gate-stage-3.mjs` enforces structural diversity across the ≥3 wireframe variants using a 3-factor distance metric (bounding-box grid placement + element count delta + nesting depth ratio) with a minimum structural distance of 0.35 between any two variants.** The metric is applied by `assets/scripts/gates/stage-3.mjs` at gate time: it loads each `.excalidraw` file, computes a structural fingerprint (grid quadrant distribution of bounding boxes, total element count ±30% bands, max nesting depth ratio), and rejects the gate if any two variants have pairwise structural distance < 0.35. This metric is completely separate from Phase 1's 6-axis visual-style distance metric (`variant-distance.mjs`) which measures hi-fi visual variation — it must not be reused here because that metric measures color/typography/shadow variation (irrelevant to greyscale wireframes). Rationale: Phase 1 ARCHITECTURE.md Risk 6 ("LLM produces 3+5 near-clones") identifies this as the primary Stage 3 quality risk. ROADMAP Phase 3 Success Criterion 3 requires 100% rejection of near-clone variants. PITFALLS.md Pitfall 3 calls this a "Generating Crazy 8s as 3 + 5 near-clones" anti-pattern. A golden test fixture of two structurally-identical wireframes must fail the gate with an error listing pairwise distances.

### FID-03 styled wireframe detector (D-56)

- **D-56: `gate-stage-3.mjs` parses each `.excalidraw` file's `elements[]` array and rejects any element whose `strokeColor`, `backgroundColor`, or `fontFamily` deviates from Excalidraw's default values (`#1e1e1e`, `transparent`, `Virgil`).**  Detection logic is deterministic script-only — no LLM judgment involved. When the gate detects non-default values, it returns `{kind: 'not_runnable', reason: 'fidelity-cap-violation-FID-03', evidence: [list of violating elements]}`. The workflow body instructs: "If FID-03 rejection occurs, re-emit via `excalidraw-render.mjs` with the skeleton IR (which always uses default stroke/fill/font). Never attempt to directly edit the `.excalidraw` JSON to fix colors." This prevents the repair loop from accidentally re-introducing styled elements. Rationale: MRD §3.23 FID-03 cap; ARCHITECTURE.md Pattern 1 (deterministic enforcement); Pitfall 3 (fidelity-cap leakage — Stage 3 specific); MRD §9.3 "Stage 3 hard-blocks completion if LLM emits color/type/styling" is a named acceptance criterion.

### XState v5 emit trigger heuristic (D-57)

- **D-57: `gate-stage-4.mjs` makes the XState emit decision deterministically from structured signals in each screen's `design/interactions/<screen>.spec.md` frontmatter.** The frontmatter fields `asyncOperations: boolean`, `stateCount: number`, and `hasConditionalTransitions: boolean` are required fields in `interaction-spec.v1.json` (Phase 1 schema, already ships this spec). XState is emitted by `state-machine-emit.mjs` if and only if all three conditions are true: `asyncOperations: true` AND `stateCount ≥ 3` AND `hasConditionalTransitions: true`. If the condition is false, only the Mermaid stateDiagram-v2 artifact is produced. The trigger heuristic uses the existing schema field values — no second LLM inference at gate time. Rationale: MRD §3.22 gate/stage-4 "XState required only for components with async + ≥3 states + conditional transitions"; MRD §9.2 XState scope discipline; STACK.md "XState is the dev artifact alongside [Mermaid], not a replacement"; codex finding §16 "XState should not be primary designer artifact"; Pitfall 12 (XState overfits designers).

### Mermaid stateDiagram-v2 canonical artifact (D-58)

- **D-58: Every screen produces `design/interactions/<screen>.diagram.mmd` (Mermaid stateDiagram-v2) as the canonical designer-readable artifact, alongside `design/interactions/<screen>.spec.md`.** Screens with names containing spaces use kebab-case (e.g., `checkout-flow.diagram.mmd`). The Mermaid file is validated by `mermaid-render.mjs` (Phase 1) extended for `stateDiagram-v2` syntax; on validation failure, a max-2-retry repair loop is invoked (same pattern as Phase 1 Mermaid flowchart repair). `state-machine-emit.mjs` emits both the Mermaid `.diagram.mmd` and (conditionally per D-57) the XState `.machine.ts` from a single internal IR — they are never maintained independently. Rationale: MRD §3.22 "Mermaid stateDiagram-v2 is the designer-readable canonical artifact"; STACK.md §Alternatives "Mermaid stateDiagram-v2 as designer-readable + XState as dev artifact"; STACK.md open recommendation 6 ("emit both from one IR — don't force users to maintain two artifacts in sync"); Phase 1 `mermaid-render.mjs` is already in place (Plan 01-03).

### Stage 4 gate state-completeness check (D-59)

- **D-59: `gate-stage-4.mjs` checks three completeness conditions: (a) every route node in `design/ia/sitemap.json` has a corresponding `design/interactions/<screen>.spec.md`; (b) each `.spec.md` enumerates at least the four canonical state categories: loading, empty, error, success; (c) no transition in the Mermaid diagram targets an undefined state name.** Condition (a) is a filesystem check using `globby`. Condition (b) is a YAML frontmatter parse check against the `interaction-spec.v1.json` schema (Phase 1). Condition (c) is a textual parse of the `.diagram.mmd` using a regex-based state-name extractor (no full Mermaid AST parse needed — just capture `[stateName]` identifiers). On gate failure, a structured finding is returned per the audit-report schema with `findingId`, `stage: 4`, `severity`, and `fixRecipe`. Rationale: MRD §3.22 gate/stage-4 "complete state set; loading/empty/error/success required; no 'open' transition targets"; MVPB-08; ACCEPT-04 acceptance criterion.

### Stage 5a lite→full gate promotion (D-60)

- **D-60: `gate-stage-5a-complete` (`assets/scripts/gates/stage-5a.mjs`) is promoted from its Phase 2 `not_runnable` hard-code to a full checklist gate when `design/interactions/` is non-empty and contains at least one screen spec.** The promotion logic: at gate entry, if `design/interactions/*.spec.md` count === 0, return the existing `{kind: 'not_runnable', reason: 'stage-4-artifacts-absent'}` (preserving Phase 2's BLOCKER fix for v2.0a). If count ≥ 1, run the full Stage 5a checklist: (1) every sitemap route has a state spec; (2) `design/wireframes/*/CHOICE.md` exists for at least one screen; (3) `design/tokens.json` is DTCG-valid; (4) evidence in tokens.json is no longer `stage: 5a-lite` — it is `stage: 5a, evidence: (proto|validated)`. The CI assertion from Phase 2 (`gate-5a returns not_runnable for empty interactions/`) must be updated to allow both behaviors based on `interactions/` content. Rationale: ROADMAP Phase 3 Success Criterion 1 ("Stage 5a gate returns PASS, not not_runnable"); GATE-07; GATE-08; MRD §9.1 BLOCKER fix was "full gate gated to v2.0b"; D-43 Phase 2 decision explicitly deferred this to Phase 3.

### Frost ≥3× recurrence enforcement (D-61)

- **D-61: `gate-stage-5b-complete` (`assets/scripts/gates/stage-5b.mjs`) is upgraded from D-44's `status: na` informational note to a hard-blocking `{kind: 'not_runnable', reason: 'frost-recurrence-not-met'}` when any promoted component appears fewer than 3 times across `design/wireframes/` and `design/interactions/` combined.** The count is computed at gate time by `stage-5b.mjs`: it scans `.excalidraw` files for component label occurrences and `.spec.md` files for component name references (case-insensitive), totals them per component, and returns a per-component recurrence map. Components with count < 3 are blocked from promotion; they appear in the gate result as `findings` with `severity: BLOCKER` and `fixRecipe: "Component '<name>' appears <n>× — requires ≥3 per Frost atomic design discipline (FID-06)."` This is a per-gate-run count, not a persisted counter — the gate recomputes from the current filesystem state on each invocation. Rationale: FID-06; D-44 Phase 2 CONTEXT.md explicitly states "Frost ≥3× recurrence enforced as a hard gate only in Phase 3"; MRD §3.23 Stage 5b fidelity cap; Pitfall 3 "fidelity-cap leakage — Stage 5b recurrence count enforcement required".

### Reverse-engineer input normalization (D-62)

- **D-62: `audit --reverse-engineer-stages` accepts two input modes: (a) a local filesystem path to a cloned repo (`--source ./path/to/prototype`), or (b) a live URL (`--source https://...`) which is fetched and normalized to a temporary directory using a read-only URL-to-filesystem crawler before inference begins.** In mode (b), the crawler fetches the root HTML, discovers linked assets (CSS, JS, image src), and writes them flat into a temp dir — it does NOT clone git history or install node_modules. After normalization, both modes feed the same inference pipeline. The `--source` flag is required; no default source is assumed. The inferred output directory is `design/inferred/` (a separate tree from `design/` to avoid polluting committed workflow artifacts). Rationale: ROUTE-06 (DS-extraction supports "refugee with source access"); AUDIT-06 (refugee with live app only); ARCHITECTURE.md reverse-engineer flow; MRD §6 `audit --reverse-engineer` description includes "Takes an existing Lovable/v0/Bolt prototype" without specifying local-only input.

### Reverse-engineer stage inference order (D-63)

- **D-63: Stage inference runs in reverse-topological order: Stage 4 → Stage 3 → Stage 2 → Stage 1.** Stage 4 (interaction patterns) is inferred first because state machines are the most structurally distinctive signal in component source code — loading/error/empty/success states can be detected from async patterns + conditional renders. Stage 3 (wireframe structure) is inferred from the Stage 4 state catalog + component tree shape. Stage 2 (IA/sitemap) is inferred from the routing structure (file-based routing for Next.js App Router, React Router config, etc.). Stage 1 (personas/JTBDs) is inferred last from copy, onboarding text, and marketing content — the weakest inference signal. Every inferred artifact receives `provenance: "inferred"` frontmatter (D-64). The inference order matches ARCHITECTURE.md §Key Data Flows and ensures that each inference step can use richer structural signals from the step before it. Rationale: AUDIT-07 ("all artifacts carry `provenance: inferred`"); PITFALLS.md Pitfall 12 ("Lovable refugee reverse-engineering fidelity — fundamentally lossy"); MRD §6 detector logic.

### INFERRED artifact trust posture (D-64)

- **D-64: Every artifact emitted by `audit --reverse-engineer-stages` carries BOTH a YAML frontmatter field AND a visible Markdown banner.** (1) YAML frontmatter: `provenance: "inferred"`, `inferredDisclaimer: "INFERRED — validate before treating as ground truth"`, `evidence: "INFERRED"`. (2) First line of every artifact body: `> ⚠️ **INFERRED** — This artifact was reverse-engineered from an existing prototype. Treat all content as a starting hypothesis requiring validation. Do not merge into \`design/\` without reviewing and amending each section.` The `frontmatter-validate.mjs` (Phase 1) is extended to enforce: any file in `design/inferred/` with `provenance: "inferred"` must have both the frontmatter field and the Markdown banner; any attempt to copy a `design/inferred/` file into `design/` without removing `provenance: "inferred"` is blocked by a new CLI subcommand `complete-design promote-inferred`. Rationale: MRD §6 "loud disclaimer on every output"; AUDIT-07; PITFALLS.md Pitfall 12 "all artifacts must carry `provenance: inferred`"; MRD §9.2 "loud disclaimer on every output"; trust posture P15.

### v2.0a → v2.0b migration strategy (D-65)

- **D-65: `complete-design migrate --from 2.0a --to 2.0b` is idempotent and dry-run by default.** The migration script reads each artifact's `schemaVersion` frontmatter field. If the artifact is already at v2.0b schema, it is skipped with no changes. If it is at v2.0a schema, only the specific delta fields are added: (a) `sitemap.json` gains a `wireframeRefs` array field per route node (Stage 3 cross-ref, initially empty `[]`); (b) `persona.json` gains an `interactionNeeds` array field (Stage 4 interaction behaviors, initially empty `[]`); (c) `MANIFEST.md` front matter gains `stage3artifacts` and `stage4artifacts` enumeration sections (initially empty). Without `--apply`, the script prints a diff of what would change. With `--apply`, it writes in-place and appends a `manifest.lock` entry via `appendManifestLockEntry`. Rationale: PERSIST-03; MVPB-10; Pitfall 8 ("schema migration without story — breaking the design/ contract for existing users"); Phase 2 D-65 is the Phase 3 implementation of the migration path noted in Phase 2 CONTEXT.md `<deferred>`.

### new-product full-route token budget allocation (D-66)

- **D-66: The `new-product` route enforces per-stage token ceilings that sum to ≤150k p50.** Stage budgets: `ingest` ≤5k, `discover` ≤30k, `structure` ≤25k, `sketch` ≤25k, `interact` ≤30k, `style` ≤25k, `systematize` ≤10k = 150k total. Stages that complete under budget do NOT donate headroom to later stages — each ceiling is independent. This prevents the "cost runaway" pitfall (Pitfall 7) where an expensive Stage 3 or Stage 4 run inflates the remaining budget for downstream stages. The `dispatch.mjs` route handler passes each sub-agent a `tokenBudget: N` hint in the handoff bundle preamble. The `run-subagent.mjs` 2× soft-stop (Phase 2 D-49) is preserved — if a stage exceeds 2× its ceiling, the workflow halts for user confirmation. Rationale: COST-03 (`sketch` p50 ≤25k); COST-04 (`interact` p50 ≤30k); COST-07 (full 5-stage `design` p50 ≤150k); MRD §9.3 cost targets; ARCHITECTURE.md Risk 12 (Stage 3/4 highest-risk for tail cost).

### `mature-app-refactor` route definition (D-67)

- **D-67: The `mature-app-refactor` route runs Stage 2 audit → Stage 4 audit → Stage 5b systematize, skipping Stages 1, 3, and 5a.** Specifically: (a) `audit --stage 2 --pr` (detect IA drift vs. committed `sitemap.json`; orphan screens; flow divergence); (b) `audit --stage 4 --pr` (detect missing state catalogs; async operations without loading/error/empty/retry; HAX-18 regressions); (c) `systematize` workflow scoped to qualifying components only (Frost ≥3× enforced). Total budget ≤45k tokens. This route is appropriate for mature products that already have established IA and want to fill interaction gaps and extract a design system — not rebuild from scratch. `dispatch.mjs` maps `--route mature-app-refactor` to this three-step sequence, returning `ROUTE_NOT_YET_IMPLEMENTED` stubs for any sub-step not yet built before Phase 3. Rationale: ROUTE-03; MRD §3.4a routing matrix (mature-app-refactor = required stages 2+4+5b; optional/skipped: 1, 3, 5a); MRD §9.2 "Stage 3 is risk-triggered, not default" (skipped on refactor routes).

### `audit --all-stages` ranking algorithm (D-68)

- **D-68: `audit --all-stages` produces a single unified ranked finding list sorted by severity DESC then stage ASC (earlier stage findings rank higher within the same severity tier).** Sort key: `(severity_rank DESC, stage_num ASC)` where severity_rank values are BLOCKER=4, ERROR=3, WARNING=2, INFO=1. Within the same severity tier, a missing Stage 2 IA finding ranks above a missing Stage 4 interaction finding — the rationale being that upstream gaps invalidate more downstream work. Each finding preserves its `findingId`, `stage`, `evidence pointer`, and `fixRecipe` from the underlying per-stage detector (D-47 schema). The output is a single `AUDIT-REPORT.md` validated against `audit-report.v1.json`, with a summary section grouping findings by stage. Rationale: AUDIT-02; ROADMAP Phase 3 Success Criterion 5 ("audit --all-stages identifies Stage 2+4 gaps as ranked list"); MRD §6 stage-specific detector logic.

### `audit --new-feature` vs `design --route new-feature` distinction (D-69)

- **D-69: `audit --new-feature --feature <name>` is a post-hoc validator; `design --route new-feature` is the forward-generation workflow. They are complementary, not alternatives.** `audit --new-feature` takes an existing feature name (matching a route in `design/ia/sitemap.json`) and verifies that all 5 stage artifacts exist and are internally consistent for that feature — it does not generate any new artifacts. `design --route new-feature` generates the full artifact set from scratch using the delta-only scope (Stage 2 delta + Stage 5a delta, per Phase 2 CONTEXT.md domain boundary). A user who has already run `design --route new-feature` can later run `audit --new-feature` to verify nothing has drifted. `audit --new-feature` is implemented as a specialized mode of `audit --all-stages` scoped to a single sitemap node and its children. Rationale: AUDIT-04 (audit --new-feature post-hoc validator); ROUTE-02 (design --route new-feature forward workflow); MRD §3.7 W7 audit verb semantics.

### Phase 2 D-44 Frost ≥3× gate upgrade (D-70)

- **D-70: The Frost ≥3× recurrence check in `gate-stage-5b.mjs` is promoted from `status: na` (informational observation in Phase 2) to `{kind: 'not_runnable', reason: 'frost-recurrence-not-met'}` (hard BLOCKER) in Phase 3.** This is the explicit resolution of Phase 2 D-44's deferred item: "Frost ≥3× recurrence enforced as a hard gate only in Phase 3." The CI test that was previously asserting `status: na` must be updated to assert `{kind: 'not_runnable'}` when recurrence < 3. A new adversarial fixture in `evals/adversarial/fid-06-frost-recurrence/` must assert the gate blocks a component that appears only twice. Rationale: FID-06; D-44 Phase 2 CONTEXT.md; ROADMAP Phase 3 Success Criterion 3 ("Stage 5b ≥3× count-enforced"); Pitfall 3 "fidelity-cap leakage" section.

### Claude's Discretion

The following lower-stakes implementation decisions are left to the Phase 3 planner without requiring further stakeholder input:

- **Wireframe file naming convention within `design/wireframes/<screen>/`**: whether variants are named `v1.excalidraw`…`v8.excalidraw` (numeric) or `alt-a.excalidraw`…`alt-h.excalidraw` (alphabetic). Either is consistent; planner picks based on how `lowfi/converge` refers to the chosen variant in `CHOICE.md`.
- **`design/inferred/` sub-directory layout**: whether the reverse-engineer output mirrors `design/` structure (e.g., `design/inferred/research/`, `design/inferred/ia/`) or uses a flat `design/inferred/<stage-N>/` layout. The `provenance: inferred` frontmatter is what matters; directory layout is secondary.
- **Structural diversity threshold tuning**: whether the minimum pairwise distance threshold is 0.35 or 0.40. The Phase 3 planner should run the golden test fixture (two near-identical wireframes) and calibrate; both are defensible.
- **`audit --new-feature` feature-name flag shape**: whether the CLI uses `--feature <name>` (kebab-case, consistent with other `--stage` flags) or a positional argument. Use the `--feature <name>` form to stay consistent with Commander's existing option pattern.
- **Stage 4 audit PR detector scoping**: whether `audit --stage 4 --pr` processes only files in `design/interactions/` or also user-repo `src/` component files with async patterns. Starting with `design/interactions/` only keeps Phase 3 scope tight; the broader src/ scan can be Phase 4.
- **`state-machine-emit.mjs` internal IR format**: whether the shared IR between Mermaid and XState emit is a plain JSON object or a Zod-validated struct. Use the existing `interaction-spec.v1.json` schema as the IR — it already ships from Phase 1.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project (mandatory)
- `.planning/PROJECT.md` — project mission, core value, all 26 active requirements, constraints, key decisions
- `.planning/REQUIREMENTS.md` — full REQ-IDs; Phase 3 IDs: WF-04, WF-05, ATOM-08..12, ATOM-15, FID-03, FID-04, FID-06, ROUTE-01, ROUTE-03, ROUTE-06, AUDIT-01 (Stage 1-4 detectors), AUDIT-02, AUDIT-04, AUDIT-06, AUDIT-07, REF-03, MVPB-01..10, COST-03, COST-04
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria (5 numbered), depends-on Phase 2
- `.planning/STATE.md` — project memory; Phase 2 decisions D-32..D-53 (all implemented); 815 tests passing after Phase 2
- `.planning/config.json` — granularity=coarse, parallelization=true

### Research (mandatory)
- `.planning/research/SUMMARY.md` — Phase 3 high-risk flags: Stage 3 structural diversity metric (unprecedented), reverse-engineer fidelity (fundamentally lossy), DESIGN.md spec stability (MEDIUM confidence)
- `.planning/research/STACK.md` — Excalidraw JSON schema + `convertToExcalidrawElements()` API; Mermaid 11.15 stateDiagram-v2; XState 5.20.x setup() pattern; Node 22 LTS; all version pins
- `.planning/research/FEATURES.md` — Stage 3 (Crazy 8s + Excalidraw, Complexity L, P2), Stage 4 (XState v5 + Mermaid dual-emit, Complexity L, P2), reverse-engineer (Complexity L, P2), HAX-18 audit (Complexity M, P2)
- `.planning/research/ARCHITECTURE.md` — Patterns 1-6; Risk 6 (Stage 3 near-clone LLM quality), Risk 12 (Lovable refugee fidelity); Anti-Patterns 1-8; Stage 3+4 handoff bundles (2→3, 3→4, 4→5a) are new dependency chains
- `.planning/research/PITFALLS.md` — Pitfall 3 (fidelity-cap leakage — Stage 3 + Stage 5b recurrence), Pitfall 7 (cost runaway — Stage 3/4 highest-risk), Pitfall 12 (Lovable refugee fidelity — `provenance: inferred` required on all artifacts)

### Phase 1 deliverables (do not re-implement)
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-01-SUMMARY.md` — Schemas Foundation: `z.toJSONSchema()` (NOT `zod-to-json-schema` — EOL); `ajv strict: false`; `schemas/dist/` committed; `interaction-spec.v1.json` ships `asyncOperations`, `stateCount`, `hasConditionalTransitions` fields
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-02-SUMMARY.md` — Gate Runner: `runGate()` base; `stage-5a.mjs` hard-codes `not_runnable` (Phase 3 extends this, never overwrites the base); `handoff-bundle-build.mjs`; `manifest.lock` SHA-256 chain
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-03-SUMMARY.md` — Determinism CI: `mermaid-render.mjs` (extend for stateDiagram-v2 in Phase 3); `verify-golden.mjs`; `lint-determinism.mjs`; `skillgrade.mjs`
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-04-SUMMARY.md` — Governance + PII: `frontmatter-validate.mjs` (extend for `provenance: inferred` enforcement in Phase 3); `TRUST-01..05` docs; SKILL.md skeletons
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-05-SUMMARY.md` — Preview Harness + Routing: `variant-distance.mjs` (6-axis visual-style metric — do NOT reuse for wireframe structural diversity; build separate metric); `run-subagent.mjs`; `dispatch.mjs` (add new routes without changing existing stubs)

### Phase 2 deliverables (do not re-implement)
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-01-SUMMARY.md` — Stage 0 `ingest` workflow + `prd/parse-or-interview` atom
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-02-SUMMARY.md` — Stage 1 `discover` workflow + persona atoms + OST + JTBD
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-03-SUMMARY.md` — Stage 2 `structure` workflow + sitemap variants + Mermaid flowcharts
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-04-SUMMARY.md` — Stage 5a/5b lite workflows + DTCG token emit + slop-tells + `apply.mjs`
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-05-SUMMARY.md` — Audit workflow completion: `slop-tells.mjs`, `stage-5a-pr.mjs`, `stage-5b-pr.mjs`, `apply.mjs`, `audit.mjs`, 6 SKILL.md workflow files, 6 trigger YAML files, 15 budget fixtures, `INVARIANTS.md`; `dispatch.mjs` unimplemented routes return `route_not_yet_implemented` (Phase 3 promotes these)
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-VERIFICATION.md` — PASS-WITH-CONCERNS; 815 tests passing; GATE-07/08 `not_runnable` enforcement confirmed; Phase 3 must update CI assertion to allow full-runnable behavior per D-60

### MRD (specific sections — mandatory for Stage 3+4 implementation)
- `complete-design-mrd-v2.md` §3.7 W3 (sketch) — Crazy 8s procedure, Decider convergence, Excalidraw output format
- `complete-design-mrd-v2.md` §3.7 W4 (interact) — state catalog, pattern variants, XState conditional emit, HAX-18
- `complete-design-mrd-v2.md` §3.22 — Stage 3 gate (≥3 alternatives, structural diversity, fidelity cap, walkthrough complete); Stage 4 gate (complete state set, XState only for async + ≥3 states + conditional, Mermaid canonical)
- `complete-design-mrd-v2.md` §3.23 — FID-03 (Stage 3 no color/type/styling), FID-04 (Stage 4 Mermaid only, no hi-fi), FID-06 (Stage 5b Frost ≥3× recurrence)
- `complete-design-mrd-v2.md` §3.10 — Stage 3+4 mandatory references (buxton-sketching, sprint-crazy-eights, shape-up-pitches, saffer-microinteractions, tidwell-patterns, head-motion, hax-18, xstate-v5, apg, material-3)
- `complete-design-mrd-v2.md` §6 — `audit --reverse-engineer` full semantics; stage-specific detector logic per mode
- `complete-design-mrd-v2.md` §9.2 — v2.0b full scope, XState scope discipline, references +12, `audit --reverse-engineer-stages` moved from v2.1 to v2.0b
- `complete-design-mrd-v2.md` §9.3 — GA acceptance criteria including "Stage 3 hard-blocks if LLM emits color/type/styling" (named acceptance test); "Stage 5a refuses without Stage 4 inputs"
- `complete-design-mrd-v2.md` §16 — Codex acceptance record; key findings: Crazy 8s quality (Risk 6 → structural diversity eval); XState not primary designer artifact; Lovable refugee as primary persona (moved to v2.0b); Stage 3 risk-triggered not mandatory

### External specifications
- Excalidraw JSON schema + `convertToExcalidrawElements()` — https://docs.excalidraw.com/docs/codebase/json-schema (pin `@excalidraw/excalidraw` 0.18+ in package.json; do not read `latest` at runtime)
- Mermaid 11.15 stateDiagram-v2 — https://mermaid.js.org/syntax/stateDiagram.html
- XState v5.20.x setup() pattern — Context7 `/statelyai/xstate` (verified)
- Microsoft HAX-18 guidelines — in `references/hax-18.md` (Phase 3 deliverable; cite Amershi et al. CHI 2019)
- Buxton *Sketching User Experiences* — in `references/buxton-sketching.md` (Phase 3 deliverable)
- Sprint Crazy 8s — in `references/sprint-crazy-eights.md` (Phase 3 deliverable)
- W3C APG (Aria Patterns Guide) — in `references/apg.md` (Phase 3 deliverable)

### Artifact schemas (Phase 1, already committed)
- `schemas/dist/interaction-spec.v1.json` — `asyncOperations`, `stateCount`, `hasConditionalTransitions` fields (D-57 trigger source)
- `schemas/dist/handoff-bundle.v1.json` — Stage 2→3, 3→4, 4→5a bundle format (same schema; new `stage` values)
- `schemas/dist/audit-report.v1.json` — `findingId` format; `severity` enum; `fixRecipe` field (D-59, D-68 use this)
- `schemas/dist/sitemap.v1.json` — `wireframeRefs` field added in v2.0b migration (D-65)
- `schemas/dist/persona.v1.json` — `interactionNeeds` field added in v2.0b migration (D-65)

</canonical_refs>

<code_context>
## Existing Code Insights

### What Phase 1 provides (do not re-implement)

**From Plan 01-01 (Schemas Foundation):**
- `bin/complete-design.mjs` — auto-discovery dispatcher; Phase 3 adds subcommands by dropping `.mjs` under `assets/scripts/cli/` only
- `assets/scripts/schemas/validate.mjs` — `validateArtifact(schema, data)` at every workflow boundary; use for `interaction-spec.v1.json` validation
- `assets/scripts/schemas/migrate.mjs` — `migrateArtifact()` chain; Phase 3 adds `sitemap-v2.0a-to-v2.0b.mjs` and `persona-v2.0a-to-v2.0b.mjs` migration scripts
- `assets/scripts/design-md-validate.mjs` — `validateDesignMd(path)` — unchanged in Phase 3
- `assets/scripts/frontmatter-validate.mjs` — Phase 3 extends to enforce `provenance: inferred` + INFERRED banner in `design/inferred/`; also adds `complete-design promote-inferred` CLI subcommand

**From Plan 01-02 (Gate Runner + Handoff Bundle):**
- `assets/scripts/gates/base.mjs` — `runGate(stage, designDir, config) → GateResult`; Phase 3 fills in `stage-3.mjs` and `stage-4.mjs` checklists from skeletons
- `assets/scripts/gates/stage-5a.mjs` — CURRENTLY hard-codes `not_runnable` for empty `design/interactions/`; Phase 3 extends this with the full checklist when `interactions/` is non-empty (D-60) — modify the existing file's conditional logic, do not rewrite from scratch
- `assets/scripts/gates/stage-5b.mjs` — CURRENTLY returns D-44 informational stub; Phase 3 upgrades the Frost recurrence check to a hard BLOCKER (D-61, D-70)
- `assets/scripts/handoff-bundle-build.mjs` — `buildHandoffBundle(stage, ...)` already supports arbitrary stage values; Phase 3 calls it for stages 3, 4 to emit `stage-2-bundle.md`, `stage-3-bundle.md`, `stage-4-bundle.md`
- `assets/scripts/manifest-lock-append.mjs` — `appendManifestLockEntry()` — call after every v2.0b migration apply (D-65)

**From Plan 01-03 (Determinism CI + Eval Harness):**
- `assets/scripts/mermaid-render.mjs` — currently handles `flowchart` and basic diagram types; Phase 3 extends it to handle `stateDiagram-v2` syntax (not a new file — extend the existing parser dispatch)
- `assets/scripts/verify-golden.mjs` — Phase 3 adds `.golden.json` fixtures for Excalidraw emit + XState emit + Mermaid stateDiagram-v2 emit
- `assets/scripts/lint-determinism.mjs` — Phase 3 scripts (`excalidraw-render.mjs`, `state-machine-emit.mjs`) must comply; no LLM client imports
- `assets/scripts/skillgrade.mjs` — Phase 3 adds `evals/triggers/sketch/triggers.yaml` and `evals/triggers/interact/triggers.yaml`

**From Plan 01-04 (Governance + PII):**
- `assets/scripts/spine-linearity.mjs` — Stage 3+4 artifacts must not carry forward-stage `dependsOn`; Phase 3 artifacts respect the linearity contract
- `assets/scripts/manifest-reconcile.mjs` — call after Phase 3 migration `--apply` to rebuild `design/MANIFEST.md`
- `skills/design.md`, `skills/audit.md` — Phase 2 filled out the bodies; Phase 3 extends `design.md` for the new routes and `audit.md` for `--reverse-engineer-stages`

**From Plan 01-05 (Preview Harness + Routing):**
- `assets/scripts/preview/variant-distance.mjs` — **DO NOT USE** for Stage 3 structural diversity; this is the 6-axis hi-fi visual-style metric. Phase 3 builds a separate `assets/scripts/wireframe-diversity.mjs`
- `assets/scripts/run-subagent.mjs` — use for Stage 3 and Stage 4 sub-agent dispatch (same one-per-stage pattern as Phase 2)
- `assets/scripts/routing/dispatch.mjs` — Phase 3 promotes `new-product`, `mature-app-refactor`, `DS-extraction` from `ROUTE_NOT_YET_IMPLEMENTED` stubs to full implementations

### What Phase 2 provides (do not re-implement)

**From Phase 2 Plans 01-05:**
- `skills/workflows/ingest.md`, `discover.md`, `structure.md`, `style.md`, `systematize.md`, `audit.md` — all 6 workflow SKILL.md files; Phase 3 adds `sketch.md` and `interact.md`, and extends `audit.md` body with `--reverse-engineer-stages` section
- `assets/scripts/audit/slop-tells.mjs`, `stage-5a-pr.mjs`, `stage-5b-pr.mjs` — slop-tell and Stage 5 PR detectors; Phase 3 adds `stage-3-pr.mjs` and `stage-4-pr.mjs`
- `assets/scripts/cli/apply.mjs` — diff-by-default copy from `.complete-design/preview/` to `design/`; Phase 3 extends to handle `design/inferred/` → `design/` promotion via `complete-design promote-inferred` command
- `assets/scripts/tokens-project.mjs` — DTCG emit; unchanged in Phase 3
- 15 budget fixtures in `evals/fixtures/budgets/` — Phase 3 adds `new-product-full.fixture.json` (150k ceiling), `mature-app-refactor.fixture.json` (45k ceiling), `ds-extraction.fixture.json` (60k ceiling)
- `INVARIANTS.md` (Phase 2 Plan 05 deliverable) — 6 cross-cutting invariants; Phase 3 implementation must not violate any invariant, especially "gate-against-staged-path footgun"

### New Phase 3 deliverables (do not exist yet)

**Workflow SKILL.md files:**
- `skills/workflows/sketch.md` (W3) — Crazy 8s → Decider → Excalidraw emit → Stage 3 gate
- `skills/workflows/interact.md` (W4) — state catalog → pattern variants → state machine emit (Mermaid + conditional XState) → HAX-18 audit → Stage 4 gate
- Updated `skills/design.md` — add `new-product`, `mature-app-refactor`, `DS-extraction` route branches; update token budget hints per D-66

**Atom SKILL.md files:**
- `skills/atoms/lowfi/crazy-eights.md` (ATOM-08)
- `skills/atoms/lowfi/converge.md` (ATOM-09)
- `skills/atoms/ixd/state-catalog.md` (ATOM-10)
- `skills/atoms/ixd/pattern-variants.md` (ATOM-11)
- `skills/atoms/ixd/state-machine.md` (ATOM-12)
- `skills/atoms/system/scaffold-component.md` (ATOM-15)

**New `assets/scripts/` files:**
- `assets/scripts/excalidraw-render.mjs` — skeleton IR → Excalidraw JSON via `convertToExcalidrawElements()`; FID-03 validator; golden test fixture required
- `assets/scripts/wireframe-diversity.mjs` — 3-factor structural distance metric (D-55); rejects pairwise distance < 0.35; golden test fixture required
- `assets/scripts/state-machine-emit.mjs` — single IR → both Mermaid stateDiagram-v2 AND (conditionally) XState v5 machine; golden test fixture required
- `assets/scripts/gates/stage-3.mjs` — Crazy 8s completeness + FID-03 check + structural diversity gate
- `assets/scripts/gates/stage-4.mjs` — state completeness + XState trigger + Mermaid present gate
- `assets/scripts/audit/stage-3-pr.mjs` — detects new screens without CHOICE.md; significant layout drift
- `assets/scripts/audit/stage-4-pr.mjs` — detects new components without state catalog; async without loading/error; HAX-18 regressions
- `assets/scripts/cli/reverse-engineer.mjs` — `complete-design audit --reverse-engineer-stages` CLI subcommand
- `assets/scripts/cli/promote-inferred.mjs` — validates + moves `design/inferred/<X>` → `design/<X>` after user amends `provenance`

**Migration scripts:**
- `schemas/migrations/sitemap-v2.0a-to-v2.0b.mjs` — adds `wireframeRefs: []` per route node
- `schemas/migrations/persona-v2.0a-to-v2.0b.mjs` — adds `interactionNeeds: []`

**Reference files (12 new, Phase 3 deliverables):**
- `references/buxton-sketching.md`, `references/sprint-crazy-eights.md`, `references/shape-up-pitches.md`
- `references/saffer-microinteractions.md`, `references/tidwell-patterns.md`, `references/head-motion.md`
- `references/hax-18.md`, `references/xstate-v5.md`, `references/apg.md`, `references/material-3.md`
- `references/wodtke-ia.md`, `references/spencer-card-sort.md`

**Adversarial CI fixtures:**
- `evals/adversarial/fid-03-styled-wireframe/` — prompt corpus instructing LLM to add color to wireframes; assert 100% FID-03 gate rejection
- `evals/adversarial/fid-06-frost-recurrence/` — component appearing only 2×; assert Stage 5b gate blocks
- `evals/adversarial/inferred-disclaimer/` — `design/inferred/` artifact without banner; assert `frontmatter-validate.mjs` rejects

### Integration points and constraints

- All Phase 3 scripts must pass `lint-determinism.mjs` — no LLM client imports in `assets/scripts/`
- `excalidraw-render.mjs` and `state-machine-emit.mjs` require `.golden.json` fixtures for `verify-golden.mjs`
- Every new triggerable SKILL.md needs `evals/triggers/<skill>/triggers.yaml` for the `skillgrade` harness
- `gate-stage-5a.mjs` extension must preserve the `not_runnable` return path for empty `design/interactions/` — only add the full-checklist path as an else branch (CI test from Phase 2 must still pass)
- The Stage 2→3 and Stage 3→4 handoff bundles must be tested with the `evals/` bundle-sufficiency eval harness (Phase 1 Plan 02 methodology)
- `dispatch.mjs` route promotion: when adding `new-product`, check that the Phase 2 four-route regression suite (new-feature, design-bug, brand-refresh, PR-audit) still passes unmodified

</code_context>

<specifics>
## Specific Ideas

- **The `audit --reverse-engineer-stages` "loud disclaimer" is the North Star for the Lovable refugee path.** Every artifact in `design/inferred/` must carry both the frontmatter field and the Markdown blockquote. A user running `complete-design audit --reverse-engineer-stages --source ./my-lovable-app` should feel "this is clearly labeled as a starting hypothesis" — not "this is the authoritative design record." The trust posture is P15 from the MRD.

- **`excalidraw-render.mjs` must be the only path that produces `.excalidraw` files.** No workflow body should ever instruct the LLM to write raw Excalidraw JSON directly. The SKILL.md body for `sketch` must say: "emit the 8 wireframe skeletons as skeleton IR objects, then invoke `node assets/scripts/excalidraw-render.mjs --input skeleton-ir.json --output design/wireframes/<screen>/`." This maintains the Pattern 1 ("LLM picks, scripts emit") discipline from Phases 1+2.

- **Structural diversity at Stage 3 is the primary quality gate.** Without it, the LLM will produce 3-5 near-identical layout variants and users will correctly perceive Stage 3 as ceremonial rather than genuinely divergent. The `wireframe-diversity.mjs` 0.35 threshold test must have a golden adversarial fixture (two wireframes that are near-identical) that fails the gate before any other Stage 3 work is considered done.

- **The Stage 4 dual-emit (Mermaid + XState) must be a single IR → two output path.** Never instruct the LLM to produce Mermaid syntax in one pass and XState schema in another. `state-machine-emit.mjs` takes one internal state catalog IR and produces both outputs deterministically. STACK.md open recommendation 6 is explicit: "emit both from one IR — don't force users to maintain two artifacts in sync."

- **Phase 2's 815-test suite must continue to pass throughout Phase 3.** No regressions. The `gate-stage-5a.mjs` update (D-60) is the highest regression risk — the existing CI assertion for `not_runnable` must be narrowed to "returns not_runnable WHEN interactions/ is empty" rather than "always returns not_runnable."

- **The three new routes (`new-product`, `mature-app-refactor`, `DS-extraction`) must not break the four Phase 2 routes.** The Phase 3 planner must run the existing Phase 2 route regression suite before declaring Phase 3 complete.

- **Schema migration `--from 2.0a --to 2.0b` dry-run is the onboarding story for existing users.** Per Pitfall 8 ("schema migration without story"), any user who ran v2.0a must be able to run `complete-design migrate --from 2.0a --to 2.0b` and see exactly what will change before any files are touched.

</specifics>

<deferred>
## Deferred Ideas

These appeared during Phase 3 context gathering but belong in Phase 4 or v2.1+:

### Phase 4 (v2.0 RC + GA)
- Full 15-fixture acceptance suite on Claude Code + Codex CLI + Cursor (ACCEPT-01..09).
- Aggregate coexistence trigger eval ≥0.80 as a release blocker (TRIG-03; Phase 1 harness runs the eval, Phase 4 enforces the gate).
- Codex CLI and Cursor within-0.10 pass rate formal release gate (DIST-05/06/07).
- Designer review (≥4 of 5 "this is doing it properly") and PM review (≥4 of 5 "I'd share with engineering") — MRD §9.3 GA acceptance criterion.
- `axe-runner.mjs` WCAG 2.2 AA contrast on own examples — 100% pass as GA release blocker (COST-10).
- Cost p50/p95 validation on 15-fixture suite for full `design` workflow — the p95 ≤220k target is a Phase 4 release blocker per MRD §11.
- GA launch artifact ("The 5 design stages every AI tool skips...") + 8 marketplaces cross-post + Brad Frost / Cagan outreach + PR to `anthropics/skills#1008` (GTM-01..05, GTM-07).
- `design` workflow wall-clock p50 ≤8 minutes formal measurement on 15-fixture suite (MRD §11).

### v2.1+
- Notion + Linear + Google Doc PRD ingestion (§13 Q3 deferred).
- Tree-test CSV ingestion from Optimal Workshop (§13 Q8).
- Tokens Studio Figma export ingestion (§13 Q9).
- i18n / RTL / CJK handling (§10 roadmap, dedicated atom per v1.0.1 plan).
- `complete-design-bridges` companion — Material Web, Vue, Svelte adapters (MRD §3.15, MRD §10).
- `@excalidraw/mermaid-to-excalidraw` Stage 3 seed from Mermaid — the `lowfi/from-mermaid` atom (STACK.md supporting libraries; v2.1+).
- Cross-host parity hardening below the current 0.10 scaffold floor — full parity engineering for Cursor + Codex (DIST-06/07).

### Scope notes for Phase 3 planner
- The `--depth lightweight` global flag (MRD §12 "~60min total") is NOT Phase 3. It appeared in the risk table but is not in the Phase 3 ROADMAP criteria. Defer to Phase 4 or v2.1.
- `--proto-mode` for Stage 1 (allows solo-indie completion without research but flags loudly) was implemented in Phase 2 D-36/D-37. Phase 3 does not change its behavior.
- The "partial-output recovery" metric (MRD §11) — "user can interrupt after any stage and resume" — the machinery (`recover.mjs`, Phase 1 Plan 03) already ships. Phase 3 must test interrupt-and-resume for the new Stage 3 and Stage 4 paths as part of the adversarial CI suite, but the formal metric validation is Phase 4.

</deferred>
