---
artifact: handoff-bundle
schemaVersion: 1
stage: "1 → 2"
generated: "2026-05-25T00:00:00.000Z"
provenance: generated
owner: design-os/eval
lastReviewedAt: "2026-05-25T00:00:00.000Z"
sourceHash: sha256:a3b2c1d0e9f8070605040302010099887766554433221100aabbccddeeff0011
tokenCount: 4800
truncationWarning: null
provenanceWorstCase: generated
goalAndScope: >-
  Stage 1 → 2 handoff: persona research phase is complete with 3 proto-grade
  personas. Two primary thinking-style segments identified (The Overloaded IC
  and The Sprint Planner, both provenance:generated) plus one secondary inferred
  segment (The Async Worker, provenance:inferred). All persona provenance is
  proto-grade; ASSUMPTIONS.md documents every claim to validate. Stage 2 IA
  work must produce ≥2 LATCH-diverse sitemap variants grounded in the IC and
  Planner mental models, plus Mermaid user-flow diagrams per JTBD.
decisionsMade:
  - decision: "Three thinking-style segments identified; Overloaded IC is primary (generated)"
    terminalState: pass_with_warnings
    evidenceGrade: generated
  - decision: "Async Worker inferred from IC and Planner synthesis (inferred)"
    terminalState: pass_with_warnings
    evidenceGrade: inferred
  - decision: "Category and Hierarchy LATCH schemes recommended as Stage 2 starting variants"
    terminalState: pass_with_warnings
    evidenceGrade: inferred
openQuestions:
  - "Does the IC mental model align with task-based (JTBD) or topic-based (category) navigation? Stage 2 tree-test will answer."
  - "The Sprint Planner JTBD 2 (retrospect on velocity) — is this in-scope for Stage 2 IA or a reporting dashboard concern?"
  - "The Async Worker may need a distinct navigation mode; should it be a filter or a separate entry point?"
artifactsInventory:
  - path: upstream/personas.json
    brief: "3 personas: The Overloaded IC (generated) + The Sprint Planner (generated) + The Async Worker (inferred). 2 JTBDs each."
pointersToVerify:
  - "All persona provenance is generated/inferred — ASSUMPTIONS.md must exist before Stage 2 begins"
  - "Stage 2 Mermaid flows must map 1:1 to the JTBDs in upstream/personas.json"
  - "worstProvenance across all Stage 1 artifacts is 'generated' — downstream Stage 2 artifacts must declare worstProvenance:generated"
---

## Goal & scope

Stage 1 → 2 handoff covers the transition from thinking-style personas to information
architecture. Three personas from `upstream/personas.json` are the primary research
artifacts. They establish JTBDs that drive every sitemap and flow decision in Stage 2:

**The Overloaded IC** (provenance: generated):
1. Surface relevant context automatically when starting a task
2. Share mental models without a synchronous call
3. Find the canonical version of a decision from 6 months ago

**The Sprint Planner** (provenance: generated):
1. Plan and communicate two-week sprints without losing track of cross-team dependencies
2. Retrospect on past sprints to improve team velocity predictably

**The Async Worker** (provenance: inferred — derived from IC + Planner thinking styles):
1. Maintain deep focus despite asynchronous interruptions
2. Contribute meaningfully without attending every synchronous meeting

## Decisions made

**Decision 1: Three thinking-style segments (generated + inferred)**
Research synthesis identified two primary segments (IC and Planner) with a secondary
Async Worker inferred from their overlapping thinking patterns. Evidence grade: generated
for the first two, inferred for the third. All three are proto-grade pending real
interview validation.

**Decision 2: Async Worker inferred, not separately generated (inferred)**
Rather than generating a third independent persona, the Async Worker was derived
from patterns shared between the IC and the Planner (both value async work and
documentation). This reduces risk of duplicate/contradictory personas.

**Decision 3: Category and Hierarchy LATCH as Stage 2 starting variants (inferred)**
The IC's mental model suggests category-based navigation. The Planner's sprint-tracking
JTBDs suggest time-based navigation. A hierarchy variant is added to test depth vs breadth.
Evidence grade: inferred from thinking-style analysis.

## Open questions

1. The IC's JTBD #1 ("surface context when starting a task") conflicts with the
   Planner's dependency-tracking need. Is the entry point task-focused or
   project-focused? Stage 2 must test both with Optimal Workshop.

2. The Sprint Planner JTBD #2 (retrospect velocity) may be a reporting/analytics
   concern rather than a navigation concern. Stage 2 should determine whether
   this belongs in the IA scope or a future reporting dashboard.

3. The Async Worker's preference for written handoffs vs. synchronous meetings
   suggests a notification/subscription IA pattern that neither of the current
   LATCH schemes covers well. Consider adding a Hierarchy variant that puts
   subscription feeds at top-level navigation.

## Artifacts inventory

| Path | Brief |
|------|-------|
| `upstream/personas.json` | 3 personas: Overloaded IC (generated) + Sprint Planner (generated) + Async Worker (inferred); 6 JTBDs total |

## Pointers to verify

- All persona provenance is proto-grade (generated or inferred). Per RED-03,
  ASSUMPTIONS.md must exist in the Stage 1 design directory before Stage 2 begins.
  Gate will block if absent.
- Stage 2 Mermaid flows must map to each JTBD. Missing flows are gate warnings.
- worstProvenance across all Stage 1 artifacts is `generated`. Per D-38, all Stage 2
  artifacts citing Stage 1 personas must declare `worstProvenance: generated`.

## Provenance (worst-case)

Worst-case provenance across all Stage 1 artifacts: **generated**. Two of three personas
have `provenance: generated`. The Async Worker has `provenance: inferred`. The worst-case
is `generated` (more conservative than `inferred`). All downstream Stage 2 artifacts must
declare `worstProvenance: generated`.
