---
artifact: handoff-bundle
schemaVersion: 1
stage: "2 → 5a"
generated: "2026-05-25T00:00:00.000Z"
provenance: generated
owner: complete-design
lastReviewedAt: "2026-05-25T00:00:00.000Z"
sourceHash: sha256:c07057faa52c19c1f4c5574cca96d149bbcee56a30e843234223a9324cf2ba1f
tokenCount: 3200
truncationWarning: null
provenanceWorstCase: generated
goalAndScope: >-
  Stage 2 → 5a handoff: information architecture phase complete. The sitemap
  (upstream/sitemap.json) provides two LATCH-diverse variants (category and
  hierarchy). Phase 2 (v2.0a) skips Stages 3 and 4, proceeding directly to
  Stage 5a (hi-fi variant generation). The selected category variant provides
  the structural model for hi-fi screen variants: 4 top-level categories covering
  all 3 JTBDs (browse-skills, checkout, track-progress). The hierarchy variant
  is retained as a tree-test comparison target for v2.1.
decisionsMade:
  - decision: "Category scheme (v1-category) chosen as primary nav model; hierarchy variant (v2-hierarchy) retained for tree-test comparison"
    terminalState: pass_with_warnings
    evidenceGrade: proto
  - decision: "Checkout JTBD covered under 'Checkout' section in both variants"
    terminalState: pass_with_warnings
    evidenceGrade: proto
  - decision: "12 nodes per variant — 4 top-level, 8 leaf nodes"
    terminalState: pass_with_warnings
    evidenceGrade: proto
openQuestions:
  - "Tree-test results not yet available — category vs hierarchy preference unconfirmed (v2.0a: always proto)"
  - "Mobile navigation pattern not determined; Stage 5a hi-fi variants should cover both desktop and mobile primary flow"
  - "Checkout flow Mermaid diagram covers the primary JTBD — additional edge-case flows deferred to v2.1"
artifactsInventory:
  - path: upstream/sitemap.json
    brief: "LATCH-diverse sitemap with category and hierarchy variants; Mermaid flow inline in v1-category variant; 3 JTBDs covered (browse-skills, checkout, track-progress)"
pointersToVerify:
  - "Two sitemap variants present (LATCH requirement); structural distance ≥ 0.5 (different LATCH schemes)"
  - "JTBD coverage: browse-skills → Browse Skills node, checkout → Checkout node, track-progress → Track Progress node"
  - "No color or font fields on any node (FID-02 compliance)"
  - "Mermaid flow in v1-category variant is syntactically valid (validates via mermaid-render.mjs)"
  - "Tree-test must run before Stage 5a gates in v2.1 (VALIDATED grade blocked until then)"
---

## Goal & scope

Stage 2 → 5a handoff covers the transition from information architecture directly to
hi-fi variant generation. Phase 2 (v2.0a) skips Stages 3 (low-fi wireframes) and
Stage 4 (interaction spec) per the v2.0a skeleton design decision. The sitemap
(`upstream/sitemap.json`) establishes the navigation model with two LATCH-diverse
variants — a category scheme (v1-category) and a hierarchy scheme (v2-hierarchy).

**v2.0a scope note:** The v2.0a skeleton takes the direct path Stage 1 → Stage 2
→ Stage 5a to validate the end-to-end workflow without the intermediate artifact
surface area of Stages 3 and 4. Stages 3 and 4 ship in Phase 3 (v2.0b).

## Stage 2 decisions

**Category variant selected** (`v1-category`): Groups content by functional purpose
(Skills, Learning, Checkout, Profile). The 4 top-level categories map directly to
the 3 JTBDs from the Stage 1 bundle: browse-skills → Skills → Browse Skills,
checkout → Checkout → Cart/Payment, track-progress → Learning → Track Progress.

**Hierarchy variant retained** (`v2-hierarchy`): The object-model hierarchy
(Discovery/Acquisition/Practice/Account) is kept as a structural alternative for
tree-test comparison in v2.1. It covers the same JTBDs via different groupings.

## JTBD coverage summary

| JTBD slug | Stage 2 sitemap node | Variant |
|-----------|---------------------|---------|
| browse-skills | Browse Skills (child of Skills) | v1-category |
| checkout | Checkout (top-level), Cart, Payment | v1-category + v2-hierarchy |
| track-progress | Track Progress (child of Learning) | v1-category |

## Stage 5a entry requirements

Stage 5a (hi-fi generation) receives:
1. The selected sitemap variant (v1-category) as navigation structure
2. The inline Mermaid flow from v1-category as the primary user flow reference
3. ProvenanceWorstCase: `generated` — all hi-fi output inherits this grade

Stage 5a must NOT use tree-test results or VALIDATED-grade IA evidence — those
are not available in v2.0a. The hi-fi output is `evidence: proto` throughout.
