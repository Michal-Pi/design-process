---
artifact: handoff-bundle
schemaVersion: 1
stage: "2 → 3"
generated: "2025-01-20T15:00:00Z"
provenance: generated
owner: design-os
lastReviewedAt: "2025-01-20T15:00:00Z"
sourceHash: sha256:f17b2a0b551ff2ed2e87485f3ed485098b1e35463b138b43348efd96e022d5d7
tokenCount: 3700
truncationWarning: null
provenanceWorstCase: validated
goalAndScope: >-
  Stage 2 → 3 handoff: information architecture phase complete. The sitemap
  (upstream/sitemap.json) provides two LATCH-diverse variants (category and
  hierarchy). Stage 3 low-fidelity wireframes must now sketch the primary user
  flows identified in Stage 2, grounding each screen in the IC's mental model.
  Wireframes are produced as Excalidraw JSON in Phase 3; this bundle covers the
  Phase 1 structural baseline.
decisionsMade:
  - decision: "Category scheme (v1-category) chosen as primary nav model; hierarchy variant kept as tree-test comparison"
    terminalState: pass
    evidenceGrade: inferred
  - decision: "Search placed as top-level navigation item (not just utility bar)"
    terminalState: pass_with_warnings
    evidenceGrade: inferred
openQuestions:
  - "Tree-test results not yet available — category vs hierarchy preference unconfirmed"
  - "Mobile navigation pattern not determined; Stage 3 wireframes should sketch both desktop and mobile primary flow"
artifactsInventory:
  - path: upstream/sitemap.json
    brief: "LATCH-diverse sitemap with category and hierarchy variants; Mermaid flow for category variant"
pointersToVerify:
  - "Two sitemap variants exist (LATCH requirement); tree-test must run before Stage 3 gates"
  - "Mermaid flow in v1-category variant should be validated via mermaid-cli before Stage 3"
---

## Goal & scope

Stage 2 → 3 handoff covers the transition from information architecture to low-fidelity
wireframes. The sitemap (`upstream/sitemap.json`) establishes the navigation model with
two LATCH-diverse variants — a category scheme (v1-category) and a hierarchy scheme
(v2-hierarchy).

Stage 3 must translate the category variant into screen-by-screen wireframes covering
the primary JTBD flow: "Surface relevant context when starting a task." The wireframe
set should include the search results page, workspace overview, and the context panel.

In Phase 1 (current), wireframe artifacts are represented by a placeholder. Phase 3
will replace the placeholder with real Excalidraw JSON.

## Decisions made

**Decision 1: Category scheme as primary nav (inferred)**
The category variant aligns with the IC's mental model of topic-based knowledge
retrieval. Workspace, Knowledge Base, Search, and Settings map cleanly to the IC's
cognitive space. Evidence grade: inferred — tree-test results are pending.

**Decision 2: Search as top-level nav item (inferred, with warnings)**
Search is promoted to a top-level navigation item. This is a deliberate departure from
the "utility-bar-only" pattern seen in many enterprise tools. The IC's guiding principle
"speed of retrieval matters more than perfect organization" supports this. Warnings: may
create redundancy with a universal search shortcut. Tree-test should specifically probe
for this.

## Open questions

1. Tree-test results will determine whether category or hierarchy better matches the
   IC's mental model. Stage 3 wireframes should be prepared for either outcome.

2. Mobile navigation pattern is unresolved. Stage 3 should sketch at least one mobile
   primary-flow screen to surface constraints early.

## Artifacts inventory

| Path | Brief |
|------|-------|
| `upstream/sitemap.json` | LATCH-diverse sitemap with category (primary) and hierarchy (comparison) variants |

## Pointers to verify

- Two LATCH-diverse variants must be present (GATE-02 requirement). The sitemap has
  `v1-category` and `v2-hierarchy` satisfying this.
- The Mermaid flow in `v1-category` should be validated via mermaid-cli headless render
  before Stage 3 wireframe work begins.

## Provenance (worst-case)

Worst-case provenance across all Stage 2 artifacts: **validated** (sitemap JSON body
provenance is "inferred" but YAML frontmatter scanner does not find a YAML provenance
field). Stage 3 wireframes should note that the sitemap is inferred-grade.
