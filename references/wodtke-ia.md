---
stage: 2
topic: information-architecture
source: "Wodtke, C. & Govella, A. (2009). Information Architecture: Blueprints for the Web. New Riders. Wodtke, C. (2023). Information Architecture: Blueprints for the Web, 3rd ed. Peachpit Press."
tags:
  - information-architecture
  - card-sorting
  - affinity-diagramming
  - taxonomy
  - navigation
---

# Reference: Information Architecture — Blueprints for the Web (Wodtke)

**Authors:** Christina Wodtke & Austin Govella (2nd ed); Christina Wodtke (3rd ed)
**Citations:** Wodtke & Govella (2009) O'Reilly; Wodtke (2023) 3rd ed. Peachpit Press
**Stage:** 2 (IA cross-reference for reverse-engineer and structure workflows)

## Core Concepts

### Top-Down vs Bottom-Up IA

- **Top-down IA:** Start from organizational goals → define content categories → build navigation from strategy. Use when you have a clear product vision and are designing from scratch.
- **Bottom-up IA:** Start from existing content inventory → cluster via affinity diagram → derive categories bottom-up. Use for `audit --reverse-engineer-stages` and mature-app-refactor routes.

### Card Sorting Methodology

Card sorting surfaces the user's mental model for organizing content. Two modes:

1. **Open card sort:** Participants create their own categories. Use in Stage 2 discovery to find emergent groupings before committing to a sitemap structure.
2. **Closed card sort:** Participants sort into predefined categories. Use to validate an existing sitemap structure after initial design.

**Process:**
1. Write each content item on a card (physical or digital — Optimal Workshop, Maze)
2. Participants sort cards into groups that feel natural to them
3. Record groupings; compute similarity matrix (how often items appear together)
4. Cluster via dendrogram or affinity diagram

**When to use:** Stage 2 `structure` workflow — before committing `design/ia/sitemap.json`. Card sort results inform the route hierarchy.

### Affinity Diagramming

After card sorting, affinity diagramming clusters the raw groupings:
1. Write each grouping observation on a sticky note
2. Cluster similar observations spatially
3. Label clusters to name candidate categories
4. Refine until category labels are mutually exclusive and collectively exhaustive (MECE)

Output: a draft taxonomy that maps to sitemap.json route groupings.

### Content Inventory

Before designing IA, inventory existing content:
- URL + title + content type + owner + last updated
- Identify orphaned content (no inbound links)
- Identify gaps (content users expect but doesn't exist)

In `audit --reverse-engineer-stages`, the content inventory is the Stage 2 artifact that drives the IA inference.

### Taxonomy Design

Taxonomy = controlled vocabulary for content classification. Principles:
- **Polyhierarchy:** A content item can belong to multiple categories (e.g., "security" article in both "Engineering" and "Compliance")
- **Faceted navigation:** Multiple orthogonal classification axes (e.g., by topic AND by audience AND by format). Useful for large content libraries.
- **Scent of information:** Navigation labels must signal the content behind them. Users click links because they sense the information they need is there — weak labels kill navigation. Test with tree-testing (Spencer 2009).

### Scent of Information

From Peter Morville: "information foraging theory." Users browse like predators following prey trails. A navigation label has strong scent if:
- It matches the user's vocabulary (not internal jargon)
- It accurately predicts what the user will find
- It differentiates from sibling labels

In complete-design Stage 2: every sitemap route label should pass the scent test — would a user with the matching JTBD click this label expecting to find what they need?

## Application to complete-design

### Stage 2 `structure` workflow
- Use card sorting results (if available) to validate sitemap route groupings
- Apply top-down IA when forward-generating from PRD: strategy → scope → structure → skeleton
- Apply affinity diagram to cluster JTBDs into navigation sections before emitting `sitemap.json`

### `audit --reverse-engineer-stages`
- Use content inventory to enumerate existing routes from the prototype
- Apply bottom-up IA: cluster inferred routes → derive categories → emit reverse-engineered `sitemap.json` with `provenance: inferred`
- Every inferred category label is a hypothesis — mark with `> INFERRED` blockquote

## Key Quotations

> "Information architecture is the art and science of organizing and labeling websites, intranets, online communities, and software to support usability and findability." — Rosenfeld, Morville, Arango (IA4 — Wodtke extends this definition)

> "Navigation is a representation of the information architecture — a map of the information landscape." — Wodtke (2009)

## Relationship to Other References

- Complements @${CLAUDE_SKILL_DIR}/references/spencer-card-sort.md (hands-on card sorting process detail)
- Complements @${CLAUDE_SKILL_DIR}/references/rosenfeld-ia.md (academic IA depth)
- Stage 2 counterpart to @${CLAUDE_SKILL_DIR}/references/garrett-elements.md (Structure plane)
