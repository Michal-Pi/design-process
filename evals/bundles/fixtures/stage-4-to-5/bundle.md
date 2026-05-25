---
artifact: handoff-bundle
schemaVersion: 1
stage: "4 → 5"
generated: "2025-01-30T17:00:00Z"
provenance: generated
owner: design-os
lastReviewedAt: "2025-01-30T17:00:00Z"
sourceHash: sha256:ba0fd42c91abafeb8cefc3f1c52477b75c1ce325439cf41d72a376527bfe6f3e
tokenCount: 3900
truncationWarning: null
provenanceWorstCase: validated
goalAndScope: >-
  Stage 4 → 5 handoff: interaction design phase represented by placeholder (Phase 1
  baseline). Stage 5 hi-fi and design system work (5a components, 5b tokens) must
  now consume the IxD specs to produce pixel-ready components with correct state
  variants. In Phase 3, the placeholder becomes real XState/Mermaid artifacts and
  this bundle will be regenerated. For Phase 1, structural-equivalence is the
  acceptance baseline per Open Q2.
decisionsMade:
  - decision: "Stage 5a gate returns not_runnable when interactions/ is empty — codex §16 BLOCKER resolved"
    terminalState: pass
    evidenceGrade: validated
  - decision: "Phase 1 placeholder accepted for interactions; Phase 3 will ship real IxD specs"
    terminalState: pass
    evidenceGrade: inferred
openQuestions:
  - "DTCG token tier structure for the design system — primitive/semantic/component tiers TBD in Stage 5b"
  - "Component recurrence threshold: 3× upstream rule (Frost) for atomic DS components"
artifactsInventory:
  - path: upstream/interactions.placeholder
    brief: "Phase 1 placeholder listing 3 planned IxD state machines; Phase 3 replaces with XState/Mermaid artifacts"
pointersToVerify:
  - "Stage 5a gate (GATE-07) will return not_runnable if interactions/ is empty — this is expected in Phase 1"
  - "Phase 3 must replace this placeholder with real IxD specs before Stage 5 work can begin for real"
  - "DTCG v2025.10 token tier structure must be established in Stage 5b before component scaffolding"
---

## Goal & scope

Stage 4 → 5 handoff covers the transition from interaction design to hi-fi and design
system production. In Phase 1, interaction artifacts are represented by
`upstream/interactions.placeholder`. Phase 3 ships real XState v5 machines and Mermaid
stateDiagram-v2 files.

Stage 5 has two tracks:
- **5a (component IxD):** Each stateful component from Stage 4 gets a hi-fi implementation
  with all state variants (idle, loading, error, empty-state, etc.)
- **5b (design system):** Token-driven design system using DTCG v2025.10 format; tokens
  organized in primitive → semantic → component tiers; emitted as `design/tokens.json`
  plus Tailwind v4 `@theme` blocks.

The Stage 5a gate is hardcoded to return `not_runnable` when `design/interactions/`
is empty or missing. This is the codex §16 BLOCKER fix shipped in Phase 1's gate runner.
In Phase 1, this means the Stage 5 gate will be `not_runnable` for this fixture.

## Decisions made

**Decision 1: Stage 5a gate returns not_runnable when interactions/ empty (validated)**
This is the GATE-07 + GATE-08 fix from codex §16. The gate does not return `pass` or
`failed_after_repair` for an empty IxD spec directory — it returns `not_runnable` with
reason `stage-4-artifacts-absent`. This prevents Phase 2 from silently skipping IxD
validation. Evidence grade: validated — this is a hard design decision in the gate runner.

**Decision 2: Phase 1 placeholder accepted (inferred)**
Structural-equivalence baseline for Phase 1 accepts the placeholder. The Stage 5a gate
will be `not_runnable` until Phase 3 ships real IxD artifacts.

## Open questions

1. DTCG token tier structure for Stage 5b. The primitive → semantic → component hierarchy
   needs to be established before scaffolding. SkillsOS's brand primitives are unknown at
   Phase 1; Stage 5b design decisions will resolve this.

2. Component recurrence threshold: Frost's atomic design rule requires a component to
   recur ≥3× upstream before it qualifies as an atomic design system component. GATE-06
   (FID-06) enforces this. Stage 5b gate will check recurrence.

## Artifacts inventory

| Path | Brief |
|------|-------|
| `upstream/interactions.placeholder` | Phase 1 placeholder for Stage 4 IxD artifacts; lists 3 state machines planned for Phase 3 |

## Pointers to verify

- Stage 5a gate will return `not_runnable` for this fixture (interactions/ empty).
  This is expected behavior, not a failure.
- When Phase 3 ships IxD specs, this bundle must be regenerated with real sourceHash
  and the IxD artifact paths in `artifactsInventory`.
- DTCG v2025.10 media type (`application/design-tokens+json`) must be used for all
  Stage 5b token file output.

## Provenance (worst-case)

Worst-case provenance across Stage 4 artifacts: **validated** (placeholder has no YAML
frontmatter; defaults to validated). Phase 3 IxD specs will introduce real provenance
data.
