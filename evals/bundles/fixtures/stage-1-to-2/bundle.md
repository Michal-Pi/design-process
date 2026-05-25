---
artifact: handoff-bundle
schemaVersion: 1
stage: "1 → 2"
generated: "2025-01-15T14:00:00Z"
provenance: generated
owner: design-os
lastReviewedAt: "2025-01-15T14:00:00Z"
sourceHash: sha256:0a2b196f71ea79895d4074166cbda68953adccddfd24597a9da1ca92944b501c
tokenCount: 3600
truncationWarning: null
provenanceWorstCase: validated
goalAndScope: >-
  Stage 1 → 2 handoff: persona research phase is complete. The Overloaded IC
  persona (see upstream/personas.json) captures the primary thinking-style
  segment with three core JTBDs and documented cognitive patterns. Stage 2 IA
  work must now produce ≥2 LATCH-diverse sitemap variants grounded in the IC's
  mental model of information retrieval, plus Mermaid user-flow diagrams per JTBD.
decisionsMade:
  - decision: "Single primary thinking-style segment identified (The Overloaded IC); knowledge-manager deferred to v2"
    terminalState: pass
    evidenceGrade: generated
  - decision: "Category and Hierarchy LATCH schemes chosen as Stage 2 sitemap starting variants"
    terminalState: pass
    evidenceGrade: inferred
openQuestions:
  - "Does the IC's mental model align more with task-based navigation (JTBD) or topic-based (category)? Stage 2 tree-test will answer."
  - "Should search be a top-level nav item or a utility accessible from all screens?"
artifactsInventory:
  - path: upstream/personas.json
    brief: "The Overloaded IC thinking-style persona with JTBDs and cognitive space documentation"
pointersToVerify:
  - "Persona provenance is 'generated' — ASSUMPTIONS.md should exist in the Stage 1 design directory"
  - "Stage 2 Mermaid flows must map 1:1 to the 3 JTBDs in personas.json"
---

## Goal & scope

Stage 1 → 2 handoff covers the transition from thinking-style personas to information
architecture. The Overloaded IC persona (`upstream/personas.json`) is the primary
research artifact. It establishes three JTBDs that drive every sitemap and flow decision
in Stage 2:

1. Surface relevant context when starting a task
2. Share mental models without a synchronous call
3. Find the canonical version of a decision from months ago

The persona captures the IC's anxiety around stale context and preference for speed
of retrieval over perfect organization. Stage 2 IA must reflect this: favor JTBD-
driven navigation over category purity.

## Decisions made

**Decision 1: Single primary thinking-style segment (generated)**
Research synthesis identified one primary segment: The Overloaded IC. The secondary
"knowledge manager" segment was considered but deferred to v2.0 to keep Stage 2 IA
scope manageable. Evidence grade: generated — this is a design decision made from
synthetic research, not field-validated interviews.

**Decision 2: Category and Hierarchy as Stage 2 starting variants (inferred)**
The IC's mental model (see `cognitiveSpace` in personas.json) suggests category-
based navigation as the natural starting point. A hierarchy variant is added as a
contrast case for tree-testing. Evidence grade: inferred from thinking-style analysis.

## Open questions

1. The IC's guiding principle "speed of retrieval matters more than perfect
   organization" suggests task-based navigation may outperform category-based in
   tree tests. Stage 2 must test this with Optimal Workshop.

2. Search appears as a top-level item in both sitemap variants. This may be redundant
   with a universal search bar. Stage 2 tree-test will measure discoverability.

## Artifacts inventory

| Path | Brief |
|------|-------|
| `upstream/personas.json` | The Overloaded IC — primary thinking-style persona for Stage 2 IA decisions |

## Pointers to verify

- Persona provenance is `generated`. Per RED-03, an ASSUMPTIONS.md must exist in the
  Stage 1 design directory before Stage 2 work begins. Gate will block if absent.
- Stage 2 Mermaid flows should map to each JTBD in the persona's `jobsToBeDone` array.
  Missing flows are a gate warning in Stage 2.

## Provenance (worst-case)

Worst-case provenance across all Stage 1 artifacts: **validated** (persona JSON body
field is "generated" but YAML frontmatter provenance is not present — YAML scanner
defaults to validated). Downstream stages must treat personas as proto-grade evidence.
