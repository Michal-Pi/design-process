---
artifact: handoff-bundle
schemaVersion: 1
stage: "3 → 4"
generated: "2025-01-25T16:00:00Z"
provenance: generated
owner: design-os
lastReviewedAt: "2025-01-25T16:00:00Z"
sourceHash: sha256:9f29e167dddf093c74a81d2d51dbce4178510a1bda4baa5dedf17a92a9f5f619
tokenCount: 3800
truncationWarning: null
provenanceWorstCase: validated
goalAndScope: >-
  Stage 3 → 4 handoff: low-fidelity wireframe phase represented by placeholder
  (Phase 1 baseline). Stage 4 interaction design must now specify state machines
  for the components identified in the wireframe flow. In Phase 3, the placeholder
  will be replaced by Excalidraw JSON and this bundle will be regenerated with
  real sourceHash and provenance. For Phase 1, structural-equivalence is the
  acceptance baseline per Open Q2.
decisionsMade:
  - decision: "SearchBox, ContextPanel, and KnowledgeBaseEntry identified as stateful components requiring XState machines"
    terminalState: pass
    evidenceGrade: inferred
  - decision: "Phase 1 placeholder accepted for wireframes; Phase 3 will ship real Excalidraw JSON"
    terminalState: pass
    evidenceGrade: inferred
openQuestions:
  - "SearchBox async loading states — should typeahead debounce at 200ms or 300ms? Stage 4 IxD spec will define."
  - "ContextPanel collapsed state — should it persist across sessions or reset per-tab?"
artifactsInventory:
  - path: upstream/wireframes.placeholder
    brief: "Phase 1 placeholder for Stage 3 low-fidelity wireframes; lists 4 planned screens"
pointersToVerify:
  - "Phase 3 will replace this placeholder with Excalidraw JSON; bundle must be regenerated at that point"
  - "Stage 4 IxD specs must map to screen-level wireframes when Phase 3 ships"
---

## Goal & scope

Stage 3 → 4 handoff covers the transition from low-fidelity wireframes to interaction
design. In Phase 1, wireframe artifacts are represented by `upstream/wireframes.placeholder`
which documents the planned screens. Phase 3 will replace this with real Excalidraw JSON
and regenerate this bundle.

Stage 4 must produce state machines for the three primary stateful components identified
in the wireframe phase:
1. SearchBox — drives the primary JTBD flow
2. ContextPanel — the "surfaced context" mechanism
3. KnowledgeBaseEntry — the content consumption component

Each component needs a Mermaid stateDiagram-v2 (canonical designer artifact) and,
where async + ≥3 states + conditional transitions apply, an XState v5 machine.

## Decisions made

**Decision 1: Three stateful components for Stage 4 (inferred)**
The wireframe flow reveals three components with non-trivial state requirements.
SearchBox has async loading, empty-state, and error-state. ContextPanel has collapsed,
expanded, loading, and loaded/error. KnowledgeBaseEntry has view, edit, saving,
saved, and conflict states. Evidence grade: inferred from placeholder screen list.

**Decision 2: Phase 1 placeholder accepted (inferred)**
The structural-equivalence baseline (Phase 1) accepts this placeholder. Semantic
equivalence checking (planned for Phase 4 calibration, per Open Q2) will require
real Excalidraw artifacts.

## Open questions

1. SearchBox debounce: 200ms vs 300ms for typeahead. This is an interaction detail
   that affects the machine's `searching` state definition. Stage 4 IxD spec resolves.

2. ContextPanel persistence: should the collapsed/expanded state persist across browser
   sessions via localStorage, or reset on each page load? Decision affects state machine
   initial state and XState context shape.

## Artifacts inventory

| Path | Brief |
|------|-------|
| `upstream/wireframes.placeholder` | Phase 1 placeholder listing planned Stage 3 screens; Phase 3 replaces with Excalidraw JSON |

## Pointers to verify

- This bundle must be regenerated when Phase 3 ships real wireframes. The sourceHash
  will change; current value reflects Phase 1 placeholder only.
- Stage 4 IxD specs must reference wireframe screens by name when Phase 3 ships.

## Provenance (worst-case)

Worst-case provenance across Stage 3 artifacts: **validated** (placeholder file has no
YAML frontmatter; gray-matter scanner returns empty data object; defaults to validated).
Phase 3 will surface real provenance for Excalidraw artifacts.
