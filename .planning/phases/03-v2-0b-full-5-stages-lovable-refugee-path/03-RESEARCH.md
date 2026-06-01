# Phase 3: v2.0b — Full 5 Stages + Lovable Refugee Path - Research

**Researched:** 2026-05-25
**Domain:** Stage 3 (Excalidraw wireframes + structural diversity), Stage 4 (Mermaid stateDiagram-v2 + XState v5 dual-emit), Stage 5a/5b gate promotion, audit --reverse-engineer-stages (Lovable refugee path), v2.0a → v2.0b schema migration, new routing matrix completion
**Confidence:** HIGH — research draws from verified Phase 1+2 deliverables in-tree, all locked decisions in 03-CONTEXT.md, and 815-test passing baseline confirmed by 02-VERIFICATION.md.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-54:** LLM describes wireframe structure in skeleton IR → `excalidraw-render.mjs` emits valid Excalidraw JSON via `convertToExcalidrawElements()`. The LLM never hand-builds raw element JSON.
- **D-55:** `gate-stage-3.mjs` enforces structural diversity via 3-factor metric (bounding-box grid placement + element count delta + nesting depth ratio), minimum pairwise distance 0.35 between any two variants.
- **D-56:** `gate-stage-3.mjs` parses `.excalidraw` `elements[]` and rejects elements whose `strokeColor`, `backgroundColor`, or `fontFamily` deviate from Excalidraw defaults (`#1e1e1e`, `transparent`, `Virgil`). Deterministic, no LLM judgment.
- **D-57:** XState emit triggered deterministically from `interaction-spec.v1.json` frontmatter fields `asyncOperations`, `stateCount`, `hasConditionalTransitions` — all three must be true.
- **D-58:** Every screen produces `design/interactions/<screen>.diagram.mmd` (Mermaid stateDiagram-v2) as canonical designer-readable artifact. Max-2-retry repair loop via `mermaid-render.mjs` on validation failure.
- **D-59:** `gate-stage-4.mjs` checks (a) sitemap route coverage, (b) loading/empty/error/success states in every spec, (c) no undefined state targets in Mermaid diagram. All deterministic.
- **D-60:** `gate-stage-5a.mjs` promoted from hard-coded `not_runnable` to full gate when `design/interactions/*.spec.md` count ≥ 1. `not_runnable` preserved for empty `interactions/`.
- **D-61:** `gate-stage-5b.mjs` upgraded to hard-blocking `not_runnable` when any promoted component appears < 3× across `design/wireframes/` + `design/interactions/` combined.
- **D-62:** `audit --reverse-engineer-stages` accepts (a) local filesystem path or (b) live URL (`--source` flag). URL mode fetches and normalizes to temp dir. Output in `design/inferred/`.
- **D-63:** Stage inference runs Stage 4 → Stage 3 → Stage 2 → Stage 1 (reverse-topological).
- **D-64:** Every inferred artifact carries YAML frontmatter `provenance: "inferred"` + first-paragraph Markdown banner. `frontmatter-validate.mjs` enforces both in `design/inferred/`. `complete-design promote-inferred` CLI gates promotion to `design/`.
- **D-65:** `complete-design migrate --from 2.0a --to 2.0b` is idempotent and dry-run by default. Adds `wireframeRefs: []` to sitemap routes, `interactionNeeds: []` to personas, new artifact sections to MANIFEST.md.
- **D-66:** `new-product` route budget allocation: ingest ≤5k, discover ≤30k, structure ≤25k, sketch ≤25k, interact ≤30k, style ≤25k, systematize ≤10k = 150k total. Per-stage ceilings are independent (no headroom donation).
- **D-67:** `mature-app-refactor` route = Stage 2 audit + Stage 4 audit + Stage 5b systematize. Skips Stages 1, 3, 5a. Budget ≤45k.
- **D-68:** `audit --all-stages` findings sorted by `(severity_rank DESC, stage_num ASC)`. BLOCKER=4, ERROR=3, WARNING=2, INFO=1.
- **D-69:** `audit --new-feature` is a post-hoc validator. `design --route new-feature` is the forward workflow. They are distinct and complementary.
- **D-70:** Frost ≥3× check in `gate-stage-5b.mjs` promoted from `status: na` to hard BLOCKER. Existing CI test that asserted `status: na` must be replaced with adversarial fixture asserting BLOCKER.

### Claude's Discretion

- Wireframe file naming: `v1.excalidraw`…`v8.excalidraw` vs `alt-a.excalidraw`…`alt-h.excalidraw`
- `design/inferred/` sub-directory layout: mirror `design/` or flat `design/inferred/<stage-N>/`
- Structural diversity threshold tuning: 0.35 or 0.40 (calibrate from golden fixture)
- `audit --new-feature` feature-name flag shape: use `--feature <name>` for Commander consistency
- Stage 4 audit PR detector scoping: `design/interactions/` only for Phase 3 (no src/ scan)
- `state-machine-emit.mjs` internal IR format: use `interaction-spec.v1.json` schema as the IR

### Deferred Ideas (OUT OF SCOPE)

- Full 15-fixture acceptance suite (Phase 4, ACCEPT-01..09)
- GA launch artifact, 8 marketplaces cross-post (Phase 4, GTM-01..05)
- `axe-runner.mjs` WCAG run as Phase 4 release blocker (COST-10)
- Aggregate coexistence ≥0.80 release gate (Phase 4, TRIG-03)
- `complete-design-bridges` companion (v2.1+)
- Notion / Linear / Google Doc PRD ingestion (v2.1+)
- `--depth lightweight` global flag (NOT Phase 3)
- `lowfi/from-mermaid` atom (v2.1+)
- Cross-host parity below 0.10 scaffold floor (Phase 4)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WF-04 | `sketch` (Stage 3) workflow | D-54, D-55, D-56; §3 below |
| WF-05 | `interact` (Stage 4) workflow | D-57, D-58, D-59; §4 below |
| ATOM-08 | `lowfi/crazy-eights` atom | §3.1 skeleton IR format |
| ATOM-09 | `lowfi/converge` atom | §3.3 CHOICE.md pattern |
| ATOM-10 | `ixd/state-machine` atom | §4.2 dual-emit from single IR |
| ATOM-11 | `ixd/pattern-variants` atom | §4.1 Tidwell/APG mapping |
| ATOM-12 | `ixd/state-catalog` atom | §4.1 loading/empty/error/success |
| ATOM-15 | `system/scaffold-component` atom | §5, §8 route composition |
| FID-03 | Stage 3 Excalidraw fidelity cap | D-56; §3.2 default-value constants |
| FID-04 | Stage 4 Mermaid-only (no hi-fi) | D-58; §4.2 canonical artifact |
| FID-06 | Stage 5b Frost ≥3× recurrence | D-61, D-70; §5.2 count mechanism |
| ROUTE-01 | `new-product` full route | D-66; §8.1 budget allocation |
| ROUTE-03 | `mature-app-refactor` route | D-67; §8.2 composition |
| ROUTE-06 | `DS-extraction` / reverse-engineer | D-62, D-63, D-64; §6 |
| AUDIT-01 | Stage 1-4 PR detectors | §9 adversarial CI; new `stage-3-pr.mjs`, `stage-4-pr.mjs` |
| AUDIT-02 | `audit --all-stages` ranked report | D-68; §8.3 |
| AUDIT-04 | `audit --new-feature` | D-69; §8.4 |
| AUDIT-06 | `audit --reverse-engineer-stages` | D-62..D-64; §6 |
| AUDIT-07 | All inferred artifacts carry `provenance: inferred` | D-64; §6.3 |
| REF-03 | 12 new Stage 3+4 reference files | §12 bibliography |
| MVPB-01..10 | Full v2.0b MVP scope | mapped across §§3-9 |
| COST-03 | `sketch` p50 ≤25k | D-66; §8.1 |
| COST-04 | `interact` p50 ≤30k | D-66; §8.1 |
</phase_requirements>

---

## Summary

Phase 3 closes the full Garrett spine by delivering Stage 3 (Sketch/Crazy-8s) and Stage 4 (Interact/IxD) workflows, promoting Stage 5a/5b gates from lite/stub mode to fully runnable enforcement, adding the `audit --reverse-engineer-stages` Lovable-refugee path, and completing the three remaining routes in `dispatch.mjs`. The 815-test Phase 2 suite must remain green throughout.

The primary execution risk is Stage 3 structural diversity: the `wireframe-diversity.mjs` 3-factor metric (D-55) is novel and untested. It must be calibrated against a golden adversarial fixture of two near-identical wireframes before any other Stage 3 work is considered complete. The second risk is the Stage 5a gate modification — the existing `stage-5a-not-runnable-regression.test.ts` asserts `not_runnable` for ALL cases including when `interactions/` has content (see Phase 2 code review). Narrowing this test to "not_runnable when interactions/ empty" (D-60) is the single highest regression risk in the phase.

The reverse-engineer pipeline is fundamentally lossy and must propagate `INFERRED` provenance through every artifact. The "loud disclaimer" is the non-negotiable trust posture — both frontmatter and Markdown banner are required (D-64). The `complete-design promote-inferred` CLI is the controlled upgrade path from `design/inferred/` to `design/`.

**Primary recommendation:** Execute Phase 3 in 5 plans following the Stage 3 → Stage 4 → Gate promotions → Reverse-engineer + Migration → Route completion wave structure. Wire Stage 3 structural diversity tests first and leave `stage-5a` gate modification for a dedicated plan with regression coverage.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Crazy-8s skeleton IR emit | LLM (SKILL.md body) | `excalidraw-render.mjs` (deterministic convert) | LLM picks layout; script emits valid JSON — Pattern 1 |
| Excalidraw JSON validation | `assets/scripts/gates/stage-3.mjs` | — | Deterministic gate per D-56 |
| Structural diversity check | `assets/scripts/wireframe-diversity.mjs` | `gate-stage-3.mjs` (calls it) | Separate module, not in `variant-distance.mjs` |
| State catalog enumeration | LLM (ixd/state-catalog atom) | `interaction-spec.v1.json` schema | LLM enumerates; schema validates at gate |
| Mermaid stateDiagram-v2 emit | `state-machine-emit.mjs` (from IR) | `mermaid-render.mjs` (validates/renders) | Deterministic emit from shared IR per D-58 |
| XState v5 emit | `state-machine-emit.mjs` (conditional) | — | Same IR, conditional on D-57 heuristic |
| Stage 4 completeness gate | `assets/scripts/gates/stage-4.mjs` | `globby` (filesystem) | D-59 three-condition check |
| Stage 5a full gate | `assets/scripts/gates/stage-5a.mjs` (extended) | — | D-60 conditional on interactions/ |
| Stage 5b Frost count | `assets/scripts/gates/stage-5b.mjs` (upgraded) | — | D-61/D-70 hard BLOCKER |
| Reverse-engineer inference | LLM sub-agents (per-stage) | `audit/reverse-engineer.mjs` (orchestrates) | Inference is LLM; orchestration is script |
| INFERRED disclaimer enforcement | `frontmatter-validate.mjs` (extended) | `complete-design promote-inferred` CLI | D-64 two-layer enforcement |
| Schema migration | `schemas/migrations/` (new scripts) | `complete-design migrate` CLI | D-65 idempotent migration chain |
| Route dispatch | `assets/scripts/routing/dispatch.mjs` (extended) | `budget-check.mjs` | Promotes 3 stubs to real dispatch |
| `audit --all-stages` | `assets/scripts/cli/audit.mjs` (extended) | per-stage detectors | D-68 sort key added to existing orchestrator |

---

## Standard Stack

### Core (unchanged from Phase 1+2 pins)

| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| `@excalidraw/excalidraw` | 0.18.x | `convertToExcalidrawElements()` API | VERIFIED in STACK.md; do NOT read `latest` at runtime |
| `mermaid` | 11.15.x | stateDiagram-v2 validation | Already in-tree via `mermaid-render.mjs` |
| `@mermaid-js/mermaid-cli` | 11.x | Headless SVG render | Already in-tree |
| `xstate` | 5.20.x | Machine emit target | `state-machine-emit.mjs` emits against this API |
| `globby` | 14.x | Gate filesystem walks | Already in-tree |
| `gray-matter` | 4.0.x | Frontmatter parse for gate checks | Already in-tree |
| `zod` | 4.4.x | Schema validation | Already in-tree |
| `playwright` | 1.60.x | URL-to-filesystem crawler for live URL inputs | Already in-tree |
| `commander` | 12.x | CLI `--source` + `--feature` flags | Already in-tree |

### New Phase 3 scripts (no new npm dependencies required)

All Phase 3 scripts are built from existing in-tree dependencies. No new `npm install` is needed.

---

## Architecture Patterns

### System Architecture Diagram (Phase 3 additions)

```
PRD → [Stage 0-2 handoff bundle] → sketch (Stage 3)
          ↓                             ↓
    crazy-eights atom             skeleton IR JSON
          ↓                             ↓
    8 skeleton IRs → excalidraw-render.mjs → 8 .excalidraw files
          ↓
    wireframe-diversity.mjs (pairwise structural distance ≥0.35)
          ↓
    gate-stage-3.mjs (FID-03 color check + diversity + count ≥3)
          ↓
    converge atom → CHOICE.md → stage-3-bundle.md
          ↓
    interact (Stage 4)
          ↓
    state-catalog atom → interaction-spec.v1.json (asyncOperations, stateCount, hasConditionalTransitions)
          ↓
    state-machine-emit.mjs → .diagram.mmd + (conditional) .machine.ts
          ↓
    mermaid-render.mjs (stateDiagram-v2 parse + validate + 2-retry repair)
          ↓
    gate-stage-4.mjs (coverage + states + no-open-transitions)
          ↓
    stage-4-bundle.md → gate-stage-5a.mjs (now FULL gate per D-60)

audit --reverse-engineer-stages:
    --source <local-path | live-URL>
          ↓
    URL mode → Playwright fetch → temp filesystem
          ↓
    reverse-engineer.mjs (orchestrates inference pipeline)
          ↓
    Stage 4 infer → Stage 3 infer → Stage 2 infer → Stage 1 infer
          ↓
    design/inferred/** (every artifact: provenance:inferred + INFERRED banner)
          ↓
    frontmatter-validate.mjs (enforces both layers in design/inferred/)
          ↓
    complete-design promote-inferred (controlled path to design/)

complete-design migrate --from 2.0a --to 2.0b:
    reads schemaVersion from each artifact
          ↓
    skips v2.0b artifacts (idempotent)
          ↓
    sitemap-v2.0a-to-v2.0b.mjs → adds wireframeRefs:[]
    persona-v2.0a-to-v2.0b.mjs → adds interactionNeeds:[]
    MANIFEST.md → adds stage3artifacts + stage4artifacts sections
          ↓
    dry-run: prints diff | --apply: writes + appendManifestLockEntry
```

### Recommended Project Structure (Phase 3 additions)

```
assets/scripts/
├── excalidraw-render.mjs       # NEW: skeleton IR → Excalidraw JSON
├── wireframe-diversity.mjs     # NEW: 3-factor structural distance metric
├── state-machine-emit.mjs      # ALREADY EXISTS (Phase 1 skeleton); Phase 3 implements it
├── gates/
│   ├── stage-3.mjs             # ALREADY EXISTS (skeleton); Phase 3 implements
│   ├── stage-4.mjs             # ALREADY EXISTS (skeleton); Phase 3 implements
│   ├── stage-5a.mjs            # ALREADY EXISTS; Phase 3 extends with conditional
│   └── stage-5b.mjs            # ALREADY EXISTS; Phase 3 upgrades Frost count
├── audit/
│   ├── stage-3-pr.mjs          # NEW: PR detector for Stage 3
│   ├── stage-4-pr.mjs          # NEW: PR detector for Stage 4
│   └── reverse-engineer.mjs    # NEW: Lovable refugee inference orchestrator
└── cli/
    ├── reverse-engineer.mjs    # NEW: `complete-design audit --reverse-engineer-stages`
    └── promote-inferred.mjs    # NEW: `complete-design promote-inferred`

schemas/migrations/
├── sitemap-v2.0a-to-v2.0b.mjs  # NEW: adds wireframeRefs:[]
└── persona-v2.0a-to-v2.0b.mjs  # NEW: adds interactionNeeds:[]

skills/workflows/
├── sketch.md                   # NEW: W3 full workflow
├── interact.md                 # NEW: W4 full workflow
└── audit.md                    # EXTENDED: --reverse-engineer-stages section

skills/atoms/
├── lowfi/crazy-eights.md       # NEW: ATOM-08
├── lowfi/converge.md           # NEW: ATOM-09
├── ixd/state-catalog.md        # NEW: ATOM-12
├── ixd/pattern-variants.md     # NEW: ATOM-11
├── ixd/state-machine.md        # NEW: ATOM-10
└── system/scaffold-component.md # NEW: ATOM-15

evals/adversarial/
├── fid-03-styled-wireframe/    # NEW: 100% FID-03 rejection suite
├── fid-06-frost-recurrence/    # NEW: Stage 5b BLOCKER fixture
└── inferred-disclaimer/        # NEW: `design/inferred/` banner enforcement

references/
├── buxton-sketching.md         # NEW (12 Stage 3+4 refs)
├── sprint-crazy-eights.md
├── shape-up-pitches.md
├── saffer-microinteractions.md
├── tidwell-patterns.md
├── head-motion.md
├── hax-18.md
├── xstate-v5.md
├── apg.md
├── material-3.md
├── wodtke-ia.md
└── spencer-card-sort.md
```

---

## Section 3: Stage 3 (Sketch) Implementation Approach

### 3.1 Skeleton IR Format and `excalidraw-render.mjs`

The LLM produces 8 wireframe skeletons as a JSON array of IR objects. Each IR element has the shape:

```json
{
  "type": "rectangle" | "text" | "frame" | "group",
  "x": 0, "y": 0, "w": 300, "h": 200,
  "label": "Navigation Bar",
  "children": []
}
```

`excalidraw-render.mjs` translates each IR to valid Excalidraw element objects via `convertToExcalidrawElements()` from `@excalidraw/excalidraw` 0.18+. This is the ONLY script that writes `.excalidraw` files. The `lowfi/crazy-eights` SKILL.md body must say: "emit 8 skeleton IR objects, then invoke `node assets/scripts/excalidraw-render.mjs --input skeleton-ir.json --output design/wireframes/<screen>/`."

**Key enforcement:** The `lint-determinism.mjs` CI gate already passes in Phase 2 (815 tests). `excalidraw-render.mjs` must import zero LLM clients — pure `@excalidraw/excalidraw` transformation.

**Golden test:** `assets/scripts/excalidraw-render.mjs` requires a `.golden.json` fixture in `evals/golden/` for `verify-golden.mjs` (Phase 1 Plan 01-03 contract).

### 3.2 FID-03 Detector: Excalidraw Default Value Constants

Deterministic rejection based on element property comparison (D-56):

```javascript
const FID03_DEFAULTS = {
  strokeColor: '#1e1e1e',   // Excalidraw default stroke
  backgroundColor: 'transparent',  // Excalidraw default fill
  fontFamily: 1,            // Virgil = font family index 1 in Excalidraw
};

// In gate-stage-3.mjs:
for (const el of elements) {
  if (el.strokeColor && el.strokeColor !== FID03_DEFAULTS.strokeColor) {
    violations.push({ id: el.id, field: 'strokeColor', value: el.strokeColor });
  }
  if (el.backgroundColor && el.backgroundColor !== FID03_DEFAULTS.backgroundColor) {
    violations.push({ id: el.id, field: 'backgroundColor', value: el.backgroundColor });
  }
  if (el.fontFamily && el.fontFamily !== FID03_DEFAULTS.fontFamily) {
    violations.push({ id: el.id, field: 'fontFamily', value: el.fontFamily });
  }
}
if (violations.length > 0) {
  return { kind: 'not_runnable', reason: 'fidelity-cap-violation-FID-03', evidence: violations };
}
```

`not_runnable` is used (not `failed_after_repair`) because FID-03 violations require re-emission via `excalidraw-render.mjs`, not patch-repair of the JSON.

**Adversarial fixture:** `evals/adversarial/fid-03-styled-wireframe/` — LLM-seeded `.excalidraw` files with deliberate color injection. `run.test.ts` asserts 100% gate rejection. Pattern: same structure as `red-05-synthetic-block/` (Phase 2 Plan 02-01).

### 3.3 Structural Diversity Metric (D-55)

`assets/scripts/wireframe-diversity.mjs` computes pairwise structural distance across the ≥3 selected variants. The metric uses three factors:

**Factor 1 — Bounding-box grid placement:** Divide the wireframe canvas into a 3×3 grid. For each element, assign it to a cell. Compute the normalized distribution histogram across 9 cells. Distance = 1 − cosine_similarity(histA, histB).

**Factor 2 — Element count delta:** `|countA - countB| / max(countA, countB)`. Distance scales from 0 (identical count) to 1 (zero overlap). Bands: ≤5% = 0, ≤15% = 0.15, ≤30% = 0.40, >30% = 1.0 (simplified for gate speed).

**Factor 3 — Nesting depth ratio:** Average nesting depth across all elements (how many container layers). `|depthA - depthB| / max(depthA, depthB)`.

**Composite distance:** Equal weighting `(f1 + f2 + f3) / 3`. Minimum pairwise distance threshold = **0.35** (Claude's discretion allows 0.40; start with 0.35 and calibrate from the near-clone golden fixture).

**CRITICAL distinction from Phase 1:** `variant-distance.mjs` measures 6-axis visual-style distance (color palette, type scale, border radius, shadow depth, motion profile, component density) — these are all absent in greyscale wireframes. `wireframe-diversity.mjs` is a NEW file, never reuse `variant-distance.mjs` for Stage 3.

**Golden adversarial fixture:** Two structurally identical wireframes (same grid, same element count, same depth) must fail with pairwise distance ≈ 0.0 < 0.35. This is the calibration test.

### 3.4 Stage 3 Gate (`gate-stage-3.mjs`)

Three-condition checklist extending the Phase 1 skeleton:

1. **Count ≥3 picked variants:** Glob `design/wireframes/<screen>/*.excalidraw` (or staged path per INVARIANT-01).
2. **FID-03 check:** Call fidelity detector on each variant (§3.2). Return `not_runnable` with evidence on violation.
3. **Structural diversity:** Call `wireframe-diversity.mjs`. Return `failed_after_repair` if any pair < 0.35.
4. **CHOICE.md present:** `design/wireframes/<screen>/CHOICE.md` exists with a selection rationale.

Gate runs against staged path (INVARIANT-01 compliance). Returns `pass` when all conditions met.

**findingId pattern:** `3-fidelity-001`, `3-diversity-001`, `3-count-001` — compliant with the `^[A-Za-z0-9][A-Za-z0-9-]*-\d+$` pattern (INVARIANT-06).

### 3.5 Token Budget

`sketch` workflow budget: **≤25k tokens p50** (COST-03, D-66). The `budget-check.mjs` 7-stage table already has a `sketch` entry from Phase 1. Phase 3 sets the ceiling value: 25k soft-warn, 50k hard-stop.

---

## Section 4: Stage 4 (Interact) Implementation Approach

### 4.1 Workflow Structure

Three atoms compose the `interact` workflow:

1. **`ixd/state-catalog`** (ATOM-12): For each screen from the Stage 3 bundle, enumerate: loading, empty, error, success states + screen-specific states. Output: `design/interactions/<screen>.spec.md` with frontmatter matching `interaction-spec.v1.json` schema (already shipped in Phase 1). Required frontmatter fields already in schema: `asyncOperations: boolean`, `stateCount: number`, `hasConditionalTransitions: boolean`.

2. **`ixd/pattern-variants`** (ATOM-11): Map each screen to 3 candidate interaction patterns from Tidwell/APG corpus. Output: `design/interactions/<screen>-patterns.md` with tradeoffs. HAX-18 audit hook applies here for AI products (check `references/hax-18.md`).

3. **`ixd/state-machine`** (ATOM-10): Invoke `state-machine-emit.mjs` with the spec as IR. Produces `.diagram.mmd` always; produces `.machine.ts` conditionally per D-57 heuristic.

### 4.2 Dual-Emit from Single IR (`state-machine-emit.mjs`)

The Phase 1 skeleton `assets/scripts/state-machine-emit.mjs` exists but is unimplemented. Phase 3 fills it in.

**IR source:** `interaction-spec.v1.json` (already ships, Phase 1). Fields:
- `states[]`: array of state names + type (loading|empty|error|success|custom)
- `transitions[]`: `{ from, to, event }` triples
- `asyncOperations: boolean`
- `stateCount: number`
- `hasConditionalTransitions: boolean`

**Mermaid emit (always):**

```javascript
// emit stateDiagram-v2 from IR
function emitMermaid(spec) {
  const lines = ['stateDiagram-v2'];
  for (const t of spec.transitions) {
    lines.push(`  ${t.from} --> ${t.to} : ${t.event}`);
  }
  return lines.join('\n');
}
```

Mermaid output validated by `mermaid-render.mjs` extended for `stateDiagram-v2`. If validation fails, max-2-retry repair loop (same pattern as Phase 2 Mermaid flowchart repair in `gate-stage-2.mjs`). Repair: re-request from LLM with the validation error as context.

**XState emit (conditional per D-57):**

```javascript
// XState trigger: all three must be true
const needsXState =
  spec.asyncOperations === true &&
  spec.stateCount >= 3 &&
  spec.hasConditionalTransitions === true;
```

XState v5 `setup()` pattern from Context7 `/statelyai/xstate`:

```typescript
// Source: XState v5 docs — setup() pattern
import { setup, assign } from 'xstate';

export const screenMachine = setup({
  types: {
    context: {} as { data: null | unknown; error: null | string },
    events: {} as { type: 'SUBMIT' } | { type: 'DONE'; data: unknown } | { type: 'ERROR'; error: string }
  }
}).createMachine({
  initial: 'idle',
  context: { data: null, error: null },
  states: {
    idle: { on: { SUBMIT: 'loading' } },
    loading: {
      on: {
        DONE: { target: 'success', actions: assign({ data: ({ event }) => event.data }) },
        ERROR: { target: 'error', actions: assign({ error: ({ event }) => event.error }) }
      }
    },
    success: {},
    error: { on: { SUBMIT: 'loading' } }
  }
});
```

**Golden test:** `evals/golden/state-machine-emit.golden.json` — input IR → expected Mermaid + (conditional) XState output, verified by `verify-golden.mjs`.

### 4.3 Mermaid stateDiagram-v2 Validation Extension

`mermaid-render.mjs` currently handles flowchart and basic diagram types. Phase 3 extends the parser dispatch:

```javascript
// In mermaid-render.mjs — extend the diagram-type dispatch
const diagramType = source.trimStart().startsWith('stateDiagram-v2')
  ? 'stateDiagram-v2'
  : detectDiagramType(source);
```

Repair loop for `stateDiagram-v2` failures: same max-2-retry pattern already used for flowchart in Phase 2. The repair prompt provides the Mermaid validation error and requests a corrected diagram.

**State-name extractor for D-59(c):** Parse `[stateName]` identifiers from `.diagram.mmd` using regex — no full Mermaid AST parse:

```javascript
// Extract all state names from stateDiagram-v2
const stateNames = new Set([
  ...source.matchAll(/^\s*(\w[\w-]*)\s*$/gm),
  ...source.matchAll(/(\w[\w-]*)\s*-->/gm),
  ...source.matchAll(/-->\s*(\w[\w-]*)/gm)
].flat(1).map(m => m[1]).filter(Boolean));

// Find transitions targeting undefined states
for (const t of transitions) {
  if (!stateNames.has(t.target)) {
    findings.push({ type: 'open-transition', from: t.from, target: t.target });
  }
}
```

### 4.4 Stage 4 Gate (`gate-stage-4.mjs`)

Three-condition checklist (D-59), extending the Phase 1 skeleton:

**Condition (a):** For each route in `design/ia/sitemap.json`, verify `design/interactions/<screen>.spec.md` exists. Use `globby` — same pattern as `gate-stage-2.mjs` JTBD coverage check.

**Condition (b):** Parse frontmatter of each `.spec.md` via `gray-matter`. Verify `stateCategories` array includes `loading`, `empty`, `error`, `success` (or that `stateCount ≥ 4` and frontmatter enumerates them). Use `interaction-spec.v1.json` via `ajv` validation — schema already in `schemas/dist/`.

**Condition (c):** Parse `.diagram.mmd` via state-name extractor (§4.3). Verify no transition targets undefined states.

Returns `failed_after_repair` with structured findings per `audit-report.v1.json`. findingIds: `4-coverage-001`, `4-states-001`, `4-open-transition-001`.

### 4.5 Token Budget

`interact` workflow budget: **≤30k tokens p50** (COST-04, D-66). Soft-warn at 30k, hard-stop at 60k.

---

## Section 5: Stage 5a Promotion (lite → full)

### 5.1 Gate Modification Strategy

`assets/scripts/gates/stage-5a.mjs` currently hard-codes `not_runnable` for ALL cases, including when `interactions/` has real files. Phase 3 extends it with a conditional branch:

```javascript
export async function runStage5aGate(designDir) {
  const interactionsDir = join(designDir, 'interactions');

  if (!existsSync(interactionsDir)) {
    return { kind: 'not_runnable', reason: 'stage-4-artifacts-absent' };
  }

  const entries = await readdir(interactionsDir);
  const specFiles = entries.filter(f => f.endsWith('.spec.md'));

  // D-60: preserve not_runnable for empty interactions/ (v2.0a back-compat)
  if (specFiles.length === 0) {
    return { kind: 'not_runnable', reason: 'stage-4-artifacts-absent' };
  }

  // D-60: run FULL checklist when interactions/ is non-empty
  return runFullStage5aChecklist(designDir, specFiles);
}
```

**Full checklist (runFullStage5aChecklist):**
1. Every sitemap route has a state spec (filesystem check via `globby`)
2. `design/wireframes/*/CHOICE.md` exists for at least one screen
3. `design/tokens.json` is DTCG-valid (call `dtcg-lint.mjs`)
4. `tokens.json` frontmatter: `stage: 5a` (not `5a-lite`) and `evidence: proto|validated` (not `INFERRED`)

Returns `(pass, proto)` or `(pass_with_warnings, proto)` depending on warnings.

### 5.2 Regression Test Narrowing (CRITICAL)

The existing test file `tests/gates/stage-5a-not-runnable-regression.test.ts` has **three test cases that will break** after the D-60 modification:

1. `"returns not_runnable even when interactions/ HAS real files (v2.0a hard-code)"` — this explicitly asserts the hard-coded behavior that Phase 3 removes.
2. The test at line 100-114 also checks for the `GATE-07`/`GATE-08` comment markers — these should remain valid.

**Migration plan for the regression test:**
- Keep tests 1 and 2 (no interactions/ → not_runnable; empty interactions/ → not_runnable). These remain valid.
- Replace test 3 with: `"returns pass_with_warnings when interactions/ has real files (Phase 3 full gate)"` — create a fixture with valid `.spec.md` files + `sitemap.json` + `tokens.json` and assert the gate passes.
- Rename the test file from `stage-5a-not-runnable-regression.test.ts` to `stage-5a-gate.test.ts` or keep the name but update the describe block title to reflect the new scope.

**New test:** `tests/gates/stage-5a-full-gate.test.ts` covers the full checklist path (all four conditions, positive and negative).

---

## Section 6: `audit --reverse-engineer-stages` Pipeline

### 6.1 Input Normalization (D-62)

**Mode (a) — local path:** `--source ./path/to/prototype`. Validate path exists, pass directly to inference pipeline.

**Mode (b) — live URL:** `--source https://...`. Use Playwright (already in-tree) as the crawler:

```javascript
import { chromium } from 'playwright';

async function crawlUrlToFs(url, targetDir) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Capture DOM
  const html = await page.content();
  await fs.writeFile(join(targetDir, 'index.html'), html);

  // Capture linked CSS and JS (read-only, flat structure)
  const links = await page.$$eval('[href], [src]', els =>
    els.map(e => e.href || e.src).filter(Boolean)
  );
  for (const link of links) {
    if (link.startsWith('http')) {
      // fetch and save flat, sanitized filename
    }
  }
  await browser.close();
}
```

Playwright is already in-tree (Phase 1, Plan 01-05, `playwright-runner.mjs`). The URL crawler is a READ-ONLY extension — no new npm deps needed.

**Output directory:** `design/inferred/` — distinct from `design/` per D-62. NEVER writes to `design/` directly.

### 6.2 Stage Inference Order (D-63)

Inference runs in reverse-topological order: **Stage 4 → Stage 3 → Stage 2 → Stage 1**.

Each inference step is an LLM sub-agent invocation (via `run-subagent.mjs`):

| Inference Step | Input Signal | Output Artifact | Confidence |
|----------------|-------------|-----------------|------------|
| Stage 4 | Component source, async patterns, conditional renders | `design/inferred/interactions/<screen>.spec.md` | MEDIUM (structural signals) |
| Stage 3 | Stage 4 state catalog + component tree shape | `design/inferred/wireframes/<screen>/inferred.md` | LOW (structural reconstruction) |
| Stage 2 | Routing structure (Next.js App Router, React Router) | `design/inferred/ia/sitemap.json` | MEDIUM (routing is explicit) |
| Stage 1 | Copy, onboarding text, marketing content | `design/inferred/research/personas/` | LOW (weakest signal) |

Route detection for Stage 2: detect Next.js App Router (`app/` directory with `page.tsx` files), React Router (`<Routes>` in JSX), or file-based routing patterns. Same detection pattern as `registry.mjs detectStack()` already in-tree.

### 6.3 INFERRED Artifact Enforcement (D-64)

**Every artifact in `design/inferred/`** carries:

1. YAML frontmatter:
```yaml
provenance: "inferred"
inferredDisclaimer: "INFERRED — validate before treating as ground truth"
evidence: "INFERRED"
```

2. First paragraph of body (Markdown blockquote):
```markdown
> **INFERRED** — This artifact was reverse-engineered from an existing prototype.
> Treat all content as a starting hypothesis requiring validation. Do not merge
> into `design/` without reviewing and amending each section.
```

**`frontmatter-validate.mjs` extension:** Phase 3 adds a rule: any file under `design/inferred/` with `provenance: "inferred"` must have both the frontmatter field AND the Markdown banner. Missing either → validation failure.

**`complete-design promote-inferred` CLI:** New subcommand `assets/scripts/cli/promote-inferred.mjs`. Validates user has removed the `provenance: "inferred"` field and the INFERRED banner before copying from `design/inferred/<X>` to `design/<X>`. Blocks promotion if either is still present.

**Adversarial fixture:** `evals/adversarial/inferred-disclaimer/` — `design/inferred/` file without the banner. `run.test.ts` asserts `frontmatter-validate.mjs` rejects it.

### 6.4 Reverse-Engineer Pipeline Test

The `audit --reverse-engineer-stages` command should be testable with the existing `evals/fixtures/e2e/next15-tailwind4-shadcn/` fixture as source. The inferred output should be checked for provenance compliance, not for inference quality (inference quality is inherently LLM-dependent).

---

## Section 7: v2.0a → v2.0b Migration

### 7.1 Migration Script Architecture

`complete-design migrate --from 2.0a --to 2.0b` orchestrates two migration scripts in sequence:

1. **`schemas/migrations/sitemap-v2.0a-to-v2.0b.mjs`:** Reads `design/ia/sitemap.json`. Checks `schemaVersion`. If already v2.0b, skip. Otherwise, for each route node, add `wireframeRefs: []`.

2. **`schemas/migrations/persona-v2.0a-to-v2.0b.mjs`:** Reads each `design/research/personas/*.persona.json`. Adds `interactionNeeds: []` field.

3. **`MANIFEST.md` update:** Append `stage3artifacts:` and `stage4artifacts:` sections (initially empty).

After `--apply`: call `appendManifestLockEntry()` (already in-tree, Phase 1 Plan 01-02) to record the migration in the hash chain.

### 7.2 Idempotency Pattern

```javascript
// Pattern used in both migration scripts
const data = JSON.parse(content);
if (data.schemaVersion === '2.0b') {
  return { skipped: true, reason: 'already-migrated' };
}
// Apply delta...
data.schemaVersion = '2.0b';
```

Dry-run by default: print diff using a simple JSON diff (before/after) without writing files. `--apply` flag writes in-place. Same discipline as `apply.mjs` diff-by-default (D-52, INVARIANT-02 spirit).

### 7.3 Test Coverage

- Fixture: `evals/fixtures/migration/v2.0a-to-v2.0b/` containing a v2.0a `sitemap.json` and `persona.json`.
- Test asserts: dry-run prints diff without modifying files; `--apply` updates `schemaVersion` and adds delta fields; second run is a no-op.
- Existing v2.0a schema validation still passes after migration (backward compat: delta fields are optional additions).

---

## Section 8: Routes + `audit --all-stages` + `audit --new-feature`

### 8.1 `new-product` Full Route (D-66)

`dispatch.mjs` currently returns `route_not_yet_implemented` for `new-product`. Phase 3 wires the full 7-stage sequence:

```
ingest(≤5k) → discover(≤30k) → structure(≤25k) → sketch(≤25k) → interact(≤30k) → style(≤25k) → systematize(≤10k)
```

**Token budget reconciliation (D-66):** ROADMAP SC-5 says "sketch p50 ≤25k, interact p50 ≤30k, full design p50 ≤150k." D-66 allocates: 5+30+25+25+30+25+10 = 150k exactly. Style budget drops from Phase 2's ≤55k to ≤25k in the full-route context — this is intentional per D-66 (style is narrower downstream of a full stack). Systematize drops to ≤10k (the design system is largely complete from upstream tokens; this stage promotes components). The route handler passes `tokenBudget: N` in each handoff bundle preamble.

**Route regression:** Phase 2 routes `new-feature`, `design-bug`, `brand-refresh`, `PR-audit` are in production. The `dispatch.mjs` extension must not change their dispatch logic. Run the Phase 2 e2e route regression test (`tests/routing/dispatch-real-stages.test.ts`) against the extended dispatch.

### 8.2 `mature-app-refactor` Route (D-67)

Stage 2 audit + Stage 4 audit + Stage 5b systematize. Each audit invocation uses `audit --stage N --pr` bound to the existing `design/` directory. Budget ≤45k.

```javascript
// dispatch.mjs mature-app-refactor handler
case 'mature-app-refactor':
  return dispatchSubagent([
    { workflow: 'audit', args: '--stage 2 --pr', budget: 15_000 },
    { workflow: 'audit', args: '--stage 4 --pr', budget: 15_000 },
    { workflow: 'systematize', args: '', budget: 15_000 },
  ]);
```

Budget fixture: `evals/fixtures/budget/mature-app-refactor.fixture.json` (45k ceiling).

### 8.3 `DS-extraction` Route (ROUTE-06)

`audit --reverse-engineer-stages` as the core. Then backfills Stages 1, 2, 4, 5b from the inferred artifacts. Budget ≤120k (ROUTE-06; larger than `mature-app-refactor` because it includes inference).

Budget fixture: `evals/fixtures/budget/ds-extraction.fixture.json` (120k ceiling).

### 8.4 `audit --all-stages` (D-68)

Extends `assets/scripts/cli/audit.mjs` `runAudit()` to accept `--all-stages` flag. When set:
1. Run each per-stage detector (stages 1-5b) sequentially.
2. Collect all findings into a single array.
3. Sort by `(severity_rank DESC, stage_num ASC)`.
4. Emit unified `AUDIT-REPORT.md` validated against `audit-report.v1.json`.

New audit budget fixture: `evals/fixtures/budget/audit-all-stages.fixture.json`.

### 8.5 `audit --new-feature` (D-69)

Post-hoc validator. Takes `--feature <name>` (matching a sitemap route). Internally calls `audit --all-stages` scoped to that sitemap node and its children. Does NOT generate new artifacts. Returns `AUDIT-REPORT.md` scoped to the named feature.

```javascript
// audit.mjs --new-feature handler
const featureNode = findSitemapNode(sitemapJson, featureName);
const scopedDesignDir = scopeDesignDirToFeature(designDir, featureNode);
return runAuditAllStages({ designDir: scopedDesignDir });
```

---

## Section 9: Adversarial CI for Stages 3 + 4

### 9.1 FID-03 Adversarial Suite

Location: `evals/adversarial/fid-03-styled-wireframe/`

Pattern mirrors Phase 2 `red-05-synthetic-block/` structure:
- `fixture-builder.mjs`: generates `.excalidraw` files with deliberate color/font injection (e.g., `strokeColor: '#FF0000'`, `backgroundColor: '#0000FF'`, `fontFamily: 2` (Helvetica)).
- `run.test.ts`: asserts `gate-stage-3.mjs` returns `{ kind: 'not_runnable', reason: 'fidelity-cap-violation-FID-03' }` 100% of the time.

Minimum fixture size: 20 variants (red = FID-03, green = clean). Test asserts 20/20 rejection of styled variants and 20/20 pass of clean variants.

### 9.2 FID-06 Frost Recurrence Adversarial Suite

Location: `evals/adversarial/fid-06-frost-recurrence/`

Fixture: component `"Button"` appearing exactly 2× across `design/wireframes/` + `design/interactions/` (1 wireframe mention + 1 spec mention). Assert `gate-stage-5b.mjs` returns BLOCKER finding `5b-frost-002` with reason `"Component 'Button' appears 2× — requires ≥3 per Frost atomic design discipline (FID-06)."`.

This also updates the CI test that previously asserted `status: na` (the D-44 Phase 2 behavior) to assert BLOCKER.

### 9.3 INFERRED Disclaimer Adversarial Suite

Location: `evals/adversarial/inferred-disclaimer/`

Fixture: `design/inferred/research/personas/test.persona.json` with `provenance: "inferred"` but WITHOUT the `> **INFERRED**...` banner. Assert `frontmatter-validate.mjs` rejects the file.

---

## Section 10: Risks and Pitfalls

### Applying PITFALLS.md findings to Phase 3

| Pitfall | Phase 3 Manifestation | Mitigation |
|---------|----------------------|------------|
| **Pitfall 3: Fidelity-cap leakage** | Stage 3: LLM adds color to wireframes. Stage 5b: component promoted on <3×. | FID-03 deterministic gate (D-56). D-70 hard BLOCKER for Frost <3×. Adversarial CI in §9. |
| **Pitfall 7: Cost runaway** | Stage 3/4 highest-risk: Crazy-8s × 8 variants × N screens; XState repair loops. | D-66 independent per-stage ceilings. Max-2-retry repair loop (Phase 1 pattern). `budget-check.mjs` already in-tree. |
| **Pitfall 12: Lovable refugee fidelity** | `audit --reverse-engineer-stages` artifacts treated as authoritative. | D-64 two-layer disclaimer. `complete-design promote-inferred` CLI. Adversarial disclaimer test. |

### Phase 3-specific new pitfalls

**Pitfall A: Stage 5a regression test breaks during modification**
The test `stage-5a-not-runnable-regression.test.ts` line 52-98 explicitly asserts `not_runnable` EVEN when `interactions/` has real files. Modifying `stage-5a.mjs` for D-60 without first updating this test will cause a test failure that looks like the gate is broken rather than the test being outdated.
Prevention: Update the regression test in the SAME commit that modifies `stage-5a.mjs`. Never split these into separate commits.

**Pitfall B: Mermaid stateDiagram-v2 syntax is more complex than flowchart**
Phase 2's `mermaid-render.mjs` handles `flowchart` and similar. `stateDiagram-v2` introduces `[*]` start/end states, `state "label" as id` aliases, `--` note blocks, composite states (`state name { ... }`), and concurrency (`--`). The repair loop must handle these correctly.
Prevention: Build a `stateDiagram-v2` golden fixture that exercises composite states before implementing the repair loop. The `renderMermaidFile()` function already dispatches by diagram type (line 57+); extend the dispatch.

**Pitfall C: Excalidraw schema drift between research and ship**
`@excalidraw/excalidraw` 0.18 was the pin at research time. Between Phase 2 completion and Phase 3 ship, a patch could change element property names.
Prevention: Pin the exact version in `package.json` (`"@excalidraw/excalidraw": "0.18.x"` — not `^0.18`). Add a golden fixture test that fails on property name drift.

**Pitfall D: `design/inferred/` artifacts bleed into `design/`**
If a user manually copies files from `design/inferred/` to `design/` bypassing `promote-inferred`, the `provenance: "inferred"` field persists silently.
Prevention: `frontmatter-validate.mjs` extension already enforces that `design/` artifacts MUST NOT have `provenance: "inferred"`. The validator should reject any file in `design/` (outside `design/inferred/`) with this field.

**Pitfall E: XState emit triggered incorrectly**
If `interaction-spec.v1.json` frontmatter has `asyncOperations: true` for a simple component (e.g., a static FAQ accordion), XState is incorrectly emitted and designers are confused.
Prevention: `ixd/state-catalog` atom body must include explicit guidance: "Only set `asyncOperations: true` if the component fetches data or performs an async operation." The D-57 heuristic is deterministic; the discipline is in the LLM producing accurate frontmatter.

**Pitfall F: Near-clone wireframes passing the structural diversity check**
If the threshold calibration is wrong, 3 near-identical wireframes could pass the 0.35 minimum.
Prevention: The golden adversarial fixture of two near-identical wireframes (§3.3) must fail with distance ≈ 0.0. If it passes, the metric implementation is wrong. Calibrate before any other Stage 3 work.

**Pitfall G: `state-machine-emit.mjs` Golden Test missing**
The Phase 1 skeleton `state-machine-emit.mjs` exists but has no golden fixture. Phase 3 must add `evals/golden/state-machine-emit.golden.json` before the implementation, because `verify-golden.mjs` CI gate requires it.
Prevention: Create the golden fixture as the first task in the Stage 4 plan.

---

## Section 11: Phase Decomposition Strategy

### Wave Structure (5 plans, sequential)

Phase 3 uses 5 sequential plans (same structure as Phase 2). Parallelization is limited because Stage 4 depends on the Stage 3 IR format and `state-machine-emit.mjs`, and gate promotions depend on both stages being complete.

**Plan 03-01 — Stage 3 Core (Wave 1)**

Deliverables:
- `assets/scripts/excalidraw-render.mjs` (skeleton IR → Excalidraw JSON via `convertToExcalidrawElements()`)
- `assets/scripts/wireframe-diversity.mjs` (3-factor structural distance metric)
- `assets/scripts/gates/stage-3.mjs` implementation (fills Phase 1 skeleton)
- `skills/atoms/lowfi/crazy-eights.md` (ATOM-08)
- `skills/atoms/lowfi/converge.md` (ATOM-09)
- `skills/workflows/sketch.md` (W3)
- `evals/adversarial/fid-03-styled-wireframe/` (FID-03 rejection suite)
- 3 new reference files: `buxton-sketching.md`, `sprint-crazy-eights.md`, `shape-up-pitches.md`
- `evals/triggers/sketch/triggers.yaml`
- Golden fixtures: `excalidraw-render.golden.json`

REQ-IDs: WF-04, ATOM-08, ATOM-09, FID-03, MVPB-01, MVPB-03, MVPB-04, REF-03 (partial)

Gate: 815 + new Stage 3 tests all pass. FID-03 adversarial suite 100% pass. `wireframe-diversity.mjs` near-clone fixture correctly rejects at < 0.35.

**Plan 03-02 — Stage 4 Core (Wave 2)**

Deliverables:
- `assets/scripts/state-machine-emit.mjs` implementation (fills Phase 1 skeleton)
- `mermaid-render.mjs` extension for `stateDiagram-v2`
- `assets/scripts/gates/stage-4.mjs` implementation (fills Phase 1 skeleton)
- `assets/scripts/audit/stage-3-pr.mjs` (new screens without CHOICE.md; layout drift)
- `assets/scripts/audit/stage-4-pr.mjs` (new components without state catalog; async without loading/error)
- `skills/atoms/ixd/state-catalog.md` (ATOM-12)
- `skills/atoms/ixd/pattern-variants.md` (ATOM-11)
- `skills/atoms/ixd/state-machine.md` (ATOM-10)
- `skills/workflows/interact.md` (W4)
- 6 new reference files: `saffer-microinteractions.md`, `tidwell-patterns.md`, `head-motion.md`, `hax-18.md`, `xstate-v5.md`, `apg.md`, `material-3.md`
- `evals/triggers/interact/triggers.yaml`
- Golden fixtures: `state-machine-emit.golden.json`
- Handoff bundles: Stage 2→3 and Stage 3→4 bundle templates

REQ-IDs: WF-05, ATOM-10, ATOM-11, ATOM-12, FID-04, MVPB-01, MVPB-03, MVPB-04, MVPB-07, MVPB-08, REF-03 (complete)

Gate: All prior tests still pass. Stage 4 gate tests pass. `state-machine-emit.mjs` golden passes 5×.

**Plan 03-03 — Gate Promotions + ATOM-15 + Adversarial (Wave 3)**

Deliverables:
- `assets/scripts/gates/stage-5a.mjs` extended with full checklist (D-60)
- `assets/scripts/gates/stage-5b.mjs` upgraded to hard BLOCKER (D-61, D-70)
- `tests/gates/stage-5a-not-runnable-regression.test.ts` NARROWED (critical)
- `tests/gates/stage-5a-full-gate.test.ts` NEW
- `evals/adversarial/fid-06-frost-recurrence/` (D-70)
- `skills/atoms/system/scaffold-component.md` (ATOM-15)
- 3 new reference files: `wodtke-ia.md`, `spencer-card-sort.md` (completing REF-03)
- Budget fixture updates: `new-product-full.fixture.json` (150k)

REQ-IDs: FID-06, MVPB-02, MVPB-05, GATE-07/08 promotion

Gate: `stage-5a-not-runnable-regression.test.ts` 2 tests still pass (empty interactions/ cases). New full-gate tests pass. FID-06 adversarial suite asserts BLOCKER.

**Plan 03-04 — Reverse-Engineer + Migration (Wave 4)**

Deliverables:
- `assets/scripts/audit/reverse-engineer.mjs`
- `assets/scripts/cli/reverse-engineer.mjs` (CLI subcommand)
- `assets/scripts/cli/promote-inferred.mjs`
- `frontmatter-validate.mjs` extension for `design/inferred/` enforcement
- `schemas/migrations/sitemap-v2.0a-to-v2.0b.mjs`
- `schemas/migrations/persona-v2.0a-to-v2.0b.mjs`
- `evals/adversarial/inferred-disclaimer/` (D-64)
- `skills/workflows/audit.md` extended with `--reverse-engineer-stages` section

REQ-IDs: AUDIT-06, AUDIT-07, MVPB-06, MVPB-10, PERSIST-03

Gate: Inferred disclaimer adversarial suite passes. Migration dry-run and --apply tests pass. Idempotency test passes.

**Plan 03-05 — Route Completion + `audit --all-stages` + Triggers (Wave 5)**

Deliverables:
- `assets/scripts/routing/dispatch.mjs` extended: `new-product`, `mature-app-refactor`, `DS-extraction` promoted from stubs
- `assets/scripts/cli/audit.mjs` extended: `--all-stages` + `--new-feature` modes
- `skills/design.md` updated: route branches + token budget hints per D-66
- Budget fixtures: `mature-app-refactor.fixture.json` (45k), `ds-extraction.fixture.json` (120k), `audit-all-stages.fixture.json`
- `evals/triggers/sketch/` and `evals/triggers/interact/` tuned for recall ≥0.85
- Phase 2 dispatch regression suite passes unchanged (4 existing routes unaffected)

REQ-IDs: ROUTE-01, ROUTE-03, ROUTE-06, AUDIT-02, AUDIT-04, MVPB-09, COST-03, COST-04

Gate: All 5 criteria from ROADMAP Phase 3 success criteria verifiable. 4 Phase 2 routes still pass dispatch test. Per-stage budget fixtures validated.

### Mapping to ROADMAP Phase 3 Success Criteria

| SC | Description | Plans Delivering It |
|----|-------------|---------------------|
| SC-1 | `new-product --full` runs all 5 stages; Stage 5a gate returns PASS | Plans 03-01, 03-02, 03-03, 03-05 |
| SC-2 | Lovable refugee runs `DS-extraction` / `audit --reverse-engineer-stages`; all artifacts carry `provenance: inferred` + INFERRED banner | Plan 03-04 |
| SC-3 | Stage 3 gate rejects 100% styled wireframes; Stage 4 gate rejects without state-maps; Stage 5b promotes only at ≥3× | Plans 03-01, 03-02, 03-03 |
| SC-4 | `complete-design migrate --from 2.0a --to 2.0b` upgrades sitemap/persona/MANIFEST; v2.0a artifacts continue validating | Plan 03-04 |
| SC-5 | `audit --all-stages` identifies Stage 2+4 gaps as ranked list; `audit --new-feature` validates feature; route budgets hold | Plan 03-05 |

---

## Section 12: Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excalidraw JSON generation | Raw element arrays with `type`, `version`, `elements[]` | `convertToExcalidrawElements()` from `@excalidraw/excalidraw` 0.18+ | D-54; schema changes across releases; programmatic API is schema-safe |
| Mermaid stateDiagram-v2 parse | Custom regex AST | `mermaid-render.mjs` (extend existing dispatch) | Already validates and renders; repair loop already established for flowchart |
| XState machine emit | Inline string templates | `state-machine-emit.mjs` from single IR | Pattern 1 discipline; golden tests catch drift |
| Filesystem walking for gate checks | Manual `readdir` loops | `globby` 14.x (already in-tree) | Already handles gitignore, patterns, async |
| YAML frontmatter parse | Manual string split | `gray-matter` (already in-tree) | Handles multi-line values, edge cases |
| Schema validation at gate | Manual property checks | `ajv` 8.x + `interaction-spec.v1.json` (already in schemas/dist/) | Phase 1 infrastructure; gate checklists call `validateArtifact()` |
| Structural diversity visual metric | Reuse `variant-distance.mjs` | New `wireframe-diversity.mjs` | D-55; `variant-distance.mjs` measures hi-fi visual axes, not structural layout |
| Playwright URL fetching | `node-fetch` + cheerio | Playwright (already in-tree) | Already handles headless Chrome, network idle, asset discovery |

**Key insight:** Phase 3 primarily FILLS existing skeletons. `stage-3.mjs`, `stage-4.mjs`, and `state-machine-emit.mjs` are all Phase 1 skeleton files. The implementation approach is extend-not-rewrite.

---

## Section 13: State of the Art

| Old Approach (Phase 2) | Phase 3 Upgrade | Impact |
|------------------------|-----------------|--------|
| `gate-stage-5a.mjs` always returns `not_runnable` | Conditional: `not_runnable` when empty; full checklist when non-empty | SC-1 achieved; GATE-07/GATE-08 semantics preserved |
| `gate-stage-5b.mjs` returns `status: na` for Frost recurrence | Hard BLOCKER `not_runnable` when count < 3 | FID-06 enforced; D-70 delivers |
| `dispatch.mjs` returns `route_not_yet_implemented` for 3 routes | Full dispatch for all 7 routes | ROUTE-01, ROUTE-03, ROUTE-06 complete |
| `mermaid-render.mjs` handles flowchart only | Extended for `stateDiagram-v2` | Stage 4 canonical artifact validated |
| `state-machine-emit.mjs` skeleton | Full dual-emit from single IR | MVPB-03, MVPB-08 complete |
| No `design/inferred/` concept | `design/inferred/` with two-layer INFERRED enforcement | AUDIT-07, trust posture P15 |

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies To Phase 3 |
|-----------|--------------------|
| No React/Next/Vue inside complete-design itself | All Phase 3 scripts are Node ESM `.mjs`. No frontend framework. |
| Zod strict mode, no `any` | `state-machine-emit.mjs`, `wireframe-diversity.mjs` must use strict TS. |
| No LLM client imports in `assets/scripts/` | INVARIANT-05 enforced by `lint-determinism.mjs` — already CI-gated. |
| No `js-yaml` for round-trip writes | Use `yaml` (eemeli/yaml) for any YAML writes in migration scripts. |
| Never modify `components/ui/` files (shadcn) | Not applicable to Phase 3 deliverables. |
| Diff-by-default, `--apply` required | INVARIANT-02: all Phase 3 writes go to `.complete-design/preview/` or `design/inferred/`; never directly to `design/`. |
| Gate against staged path (INVARIANT-01) | Stage 3 and Stage 4 gates must accept `--staged` path, not read from `design/` directly. |
| SKILL.md descriptions ≤200 chars (INVARIANT-04) | New `sketch.md` and `interact.md` workflow descriptions must be ≤200 chars. |
| findingId pattern `^[A-Za-z0-9][A-Za-z0-9-]*-\d+$` (INVARIANT-06) | Stage 3: `3-fidelity-001`, `3-diversity-001`; Stage 4: `4-coverage-001`, `4-states-001`. |
| Never commit API keys, .env | Not applicable. |
| 815 tests passing (Phase 2 baseline) | All Phase 3 plans must preserve this baseline throughout. |

---

## Open Questions

### OQ-1: `stage-5a-not-runnable-regression.test.ts` line 100-114 — file content check
The test checks that `stage-5a.mjs` contains the strings `"GATE-07"`, `"GATE-08"`, and `"stage-4-artifacts-absent"`. After the D-60 modification, `stage-5a.mjs` MUST still contain `stage-4-artifacts-absent` (for the empty-interactions path) and the comment references. But the test checks for these strings in a context that might not match post-modification. The planner should decide: update this test to allow the new conditional logic while preserving the content checks.

**Recommendation:** Keep the content check assertions. They remain valid because the empty-interactions path still returns `stage-4-artifacts-absent`. No change needed to lines 100-114.

### OQ-2: `design/inferred/` sub-directory layout
Claude's discretion. Two options:
- Mirror `design/` structure: `design/inferred/ia/sitemap.json`, `design/inferred/research/personas/`
- Flat stage layout: `design/inferred/stage-4/`, `design/inferred/stage-2/`

**Recommendation:** Mirror `design/` structure. The `promote-inferred` CLI then copies with clear path equivalence: `design/inferred/ia/sitemap.json` → `design/ia/sitemap.json`. This makes the promotion path unambiguous.

### OQ-3: Token budget for `DS-extraction` route
D-62 in CONTEXT.md says budget ≤120k (ROUTE-06). But CONTEXT.md domain boundary says "DS-extraction route (Stage 5b deep extraction, ≤60k)." These are inconsistent (120k vs 60k).

**Resolution from CONTEXT.md §4 (domain boundary, line 20):** "DS-extraction route... budget ≤120k" — 120k is the correct value per D-67 context. The "≤60k" was a reference to `DS-extraction` in a different context. Use **120k**.

### OQ-4: Wireframe file naming (Claude's discretion)
`v1.excalidraw`…`v8.excalidraw` vs `alt-a.excalidraw`…`alt-h.excalidraw`.

**Recommendation:** Use `v1.excalidraw`…`v8.excalidraw` (numeric). `lowfi/converge` references the picked variant in `CHOICE.md` as `v3.excalidraw` (e.g.), which is clear and consistent with the gitignore pattern `design/wireframes/*/v{1,2,4..8}.excalidraw` (only `v3` + `CHOICE.md` committed per PITFALLS.md Pitfall 4 hygiene rule). Alphabetic naming would require updating the gitignore template.

### OQ-5: `audit --reverse-engineer-stages` URL crawler depth
The Playwright URL crawler (D-62 mode b) fetches root HTML + linked assets. Depth = 1 only. Multi-page apps with client-side routing need multiple pages fetched. Phase 3 scope: fetch root only + let the LLM infer routing from the JS bundle. Full multi-page crawl is a Phase 4 enhancement.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 2.x |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run tests/gates/stage-3*.test.ts tests/gates/stage-4*.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FID-03 | Gate rejects styled wireframes | adversarial | `npx vitest run evals/adversarial/fid-03-styled-wireframe/` | ❌ Wave 1 |
| FID-06 | Stage 5b blocks component at <3× | adversarial | `npx vitest run evals/adversarial/fid-06-frost-recurrence/` | ❌ Wave 3 |
| WF-04 | `sketch` workflow produces ≥3 diverse variants | unit | `npx vitest run tests/gates/stage-3.test.ts` | ❌ Wave 1 |
| WF-05 | `interact` workflow produces Mermaid + conditional XState | unit | `npx vitest run tests/gates/stage-4.test.ts` | ❌ Wave 2 |
| D-60 | Stage 5a returns PASS when interactions/ non-empty | unit | `npx vitest run tests/gates/stage-5a-full-gate.test.ts` | ❌ Wave 3 |
| D-60 | Stage 5a still returns not_runnable when interactions/ empty | regression | `npx vitest run tests/gates/stage-5a-not-runnable-regression.test.ts` | ✅ (modify) |
| D-70 | Stage 5b hard-BLOCKER when Frost <3× | adversarial | `npx vitest run evals/adversarial/fid-06-frost-recurrence/` | ❌ Wave 3 |
| D-64 | `design/inferred/` artifacts without banner rejected | adversarial | `npx vitest run evals/adversarial/inferred-disclaimer/` | ❌ Wave 4 |
| D-65 | Migration dry-run no-op; --apply upgrades schemaVersion | unit | `npx vitest run tests/migration/v2.0a-to-v2.0b.test.ts` | ❌ Wave 4 |
| AUDIT-02 | `audit --all-stages` sorts by (severity DESC, stage ASC) | unit | `npx vitest run tests/audit/all-stages.test.ts` | ❌ Wave 5 |
| ROUTE-01 | `new-product` route dispatches all 7 stages | unit | `npx vitest run tests/routing/dispatch-real-stages.test.ts` | ✅ (extend) |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/gates/ tests/audit/ tests/routing/`
- **Per wave merge:** `npx vitest run` (full suite — must remain ≥ phase start count)
- **Phase gate:** Full suite green + `tsc --noEmit` clean + `lint-determinism` clean before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `evals/adversarial/fid-03-styled-wireframe/run.test.ts` — covers FID-03
- [ ] `evals/adversarial/fid-06-frost-recurrence/run.test.ts` — covers FID-06, D-70
- [ ] `evals/adversarial/inferred-disclaimer/run.test.ts` — covers D-64
- [ ] `evals/golden/excalidraw-render.golden.json` — covers `verify-golden.mjs` for new script
- [ ] `evals/golden/state-machine-emit.golden.json` — covers `verify-golden.mjs` for new script
- [ ] `tests/gates/stage-3.test.ts` — covers gate-stage-3 unit tests
- [ ] `tests/gates/stage-4.test.ts` — covers gate-stage-4 unit tests
- [ ] `tests/gates/stage-5a-full-gate.test.ts` — covers D-60 full-checklist path
- [ ] `tests/migration/v2.0a-to-v2.0b.test.ts` — covers D-65 migration
- [ ] `tests/audit/all-stages.test.ts` — covers D-68 sort algorithm
- [ ] `evals/fixtures/budget/new-product-full.fixture.json` — 150k ceiling
- [ ] `evals/fixtures/budget/mature-app-refactor.fixture.json` — 45k ceiling
- [ ] `evals/fixtures/budget/ds-extraction.fixture.json` — 120k ceiling

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | `audit --reverse-engineer-stages` must NOT read auth modules / RLS policies per CLAUDE.md universal "never do" rule. Scope reverse-engineer to `components/`, `app/`, `pages/` only. |
| V5 Input Validation | yes | `--source` flag validates path exists / URL has scheme before crawl. `interaction-spec.v1.json` validated by `ajv` at gate time. |
| V6 Cryptography | no | `appendManifestLockEntry()` SHA-256 hash chain is integrity (not confidentiality). |

| Threat Pattern | STRIDE | Mitigation |
|----------------|--------|------------|
| `--source` path traversal (e.g., `--source /etc/passwd`) | Tampering | Validate path is inside the user's project root before crawl. |
| Playwright crawling auth endpoints | Information Disclosure | Scope URL crawler to static assets only; exclude `/api/`, `/auth/`, `.env*` paths. |
| `design/inferred/` write to wrong path | Tampering | `reverse-engineer.mjs` validates output dir is under `design/inferred/`. Never writes to `design/`. |
| INFERRED banner stripped before promote | Repudiation | `promote-inferred` checks for banner presence; blocks if still present AND `provenance: "inferred"` still in frontmatter. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `convertToExcalidrawElements()` API signature in `@excalidraw/excalidraw` 0.18+ accepts an array of skeleton objects and returns valid element arrays | §3.1 | `excalidraw-render.mjs` fails to produce valid JSON; must use lower-level element construction instead |
| A2 | Mermaid 11.15 `stateDiagram-v2` parser in `@mermaid-js/mermaid-cli` validates diagram syntax before rendering | §4.3 | Repair loop cannot detect syntax errors; may need to add a separate parse-only pass |
| A3 | XState 5.20 `setup()` pattern from Context7 matches the installed version in `package.json` | §4.2 | `state-machine-emit.mjs` emits TypeScript that doesn't compile against installed XState |
| A4 | Phase 2's 815 tests are deterministic and do not depend on wall-clock time or random seeds | Throughout | Phase 3 plan execution fails intermittently on green-baseline checks |

**If A1 fails:** Fall back to direct Excalidraw element construction with the documented element schema from `docs.excalidraw.com/docs/codebase/json-schema`. The gate test (golden fixture) will catch this in Wave 1.

---

## Sources

### Primary (HIGH confidence)

- `03-CONTEXT.md` — 17 locked decisions D-54..D-70 [VERIFIED: in-tree]
- `03-DISCUSSION-LOG.md` — auto-decision rationale [VERIFIED: in-tree]
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-05-SUMMARY.md` — Phase 2 final deliverables; 815 tests [VERIFIED: in-tree]
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-VERIFICATION.md` — PASS-WITH-CONCERNS; D-43 confirmed [VERIFIED: in-tree]
- `assets/scripts/gates/stage-5a.mjs` — D-43 hard-code confirmed, lines 52-62 [VERIFIED: in-tree]
- `tests/gates/stage-5a-not-runnable-regression.test.ts` — all three test cases confirmed; narrowing plan documented [VERIFIED: in-tree]
- `assets/scripts/gates/stage-3.mjs`, `stage-4.mjs` — Phase 1 skeletons confirmed [VERIFIED: in-tree]
- `assets/scripts/mermaid-render.mjs` — Phase 1 implementation; `renderMermaidFile()` confirmed; stateDiagram-v2 extension point at line 57+ [VERIFIED: in-tree]
- `skills/workflows/INVARIANTS.md` — 6 invariants confirmed; INVARIANT-01 gate-against-staged-path applies to Stage 3/4 gates [VERIFIED: in-tree]
- `.planning/research/STACK.md` — Excalidraw 0.18+; Mermaid 11.15; XState 5.20; Node 22 LTS [VERIFIED: in-tree]
- `.planning/research/ARCHITECTURE.md` — Pattern 1 (LLM picks / scripts emit); Anti-Pattern 2 (no raw-dir ingestion); Risk 6 (Stage 3 near-clones); Risk 12 (Lovable refugee fidelity) [VERIFIED: in-tree]
- `.planning/research/PITFALLS.md` — Pitfall 3 (fidelity-cap leakage); Pitfall 7 (cost runaway); Pitfall 12 (refugee fidelity) [VERIFIED: in-tree]
- `complete-design-mrd-v2.md` §3.22, §3.23, §6, §9.2, §9.3, §16 [ASSUMED from training; cross-verified against locked decisions in CONTEXT.md]

### Secondary (MEDIUM confidence)

- STACK.md Excalidraw docs reference: `https://docs.excalidraw.com/docs/codebase/json-schema` — `convertToExcalidrawElements()` API [CITED: STACK.md]
- STACK.md Mermaid stateDiagram-v2 reference: `https://mermaid.js.org/syntax/stateDiagram.html` [CITED: STACK.md]
- Context7 `/statelyai/xstate` — XState 5.20 `setup()` pattern [CITED: STACK.md]

### Tertiary (LOW confidence — phase-specific claims)

- The exact Excalidraw default values (`#1e1e1e`, `transparent`, `fontFamily: 1`) — these are constants that could change between 0.18 patch versions [ASSUMED]. The golden fixture test will verify or refute at Wave 1.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all libraries are Phase 1+2 pins; no new dependencies required
- Architecture: HIGH — Phase 3 fills Phase 1 skeletons; patterns are established
- Pitfalls: HIGH — specific regression risks identified from in-tree code inspection (stage-5a test narrowing, stateDiagram-v2 syntax complexity, structural diversity calibration)

**Research date:** 2026-05-25
**Valid until:** 2026-06-22 (30 days; stable stack)
