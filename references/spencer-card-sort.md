---
stage: 2
topic: card-sorting
source: "Spencer, D. (2009). Card Sorting: Designing Usable Categories. Rosenfeld Media."
tags:
  - card-sorting
  - information-architecture
  - usability
  - tree-testing
  - navigation
---

# Reference: Card Sorting — Designing Usable Categories (Spencer)

**Author:** Donna Spencer
**Citation:** Spencer, D. (2009). Card Sorting: Designing Usable Categories. Rosenfeld Media.
**Stage:** 2 (IA planning — card sorting methodology for Stage 2 structure workflow)

## Why Card Sorting

Card sorting reveals how users mentally organize content — not how the organization wants to present it. The gap between organizational mental models and user mental models is the primary source of IA failure ("the org chart published as navigation").

In complete-design Stage 2, card sorting results (when available from prior research) inform the sitemap.json route groupings before committing to the hierarchy.

## Types of Card Sorts

### Open Card Sort

Participants create their own categories and group cards how they see fit.

**When to use:**
- Early-stage discovery — you don't yet have a sitemap draft
- When user vocabulary is unknown or suspect
- When designing from scratch (Stage 2 `structure` workflow, first pass)

**Output:** Emergent category names in user vocabulary; similarity matrix showing which items cluster together.

**Analysis:**
- Count how often each card pair appears in the same group
- Use hierarchical cluster analysis (dendrogram) or affinity diagram to group similar items
- Examine category labels for vocabulary patterns

### Closed Card Sort

Participants sort cards into categories you have already defined.

**When to use:**
- Validating an existing sitemap — you have a hypothesis you want to test
- Later-stage refinement after an initial open sort
- `audit --new-feature`: verifying that a new feature fits into existing IA

**Output:** Success rates per card (how often it lands in the "correct" category); confusion matrix.

### Hybrid Sort

Participants sort into predefined categories but can create new ones if needed. Useful when you have a mostly-settled sitemap but suspect 1-2 categories need refinement.

## How to Run a Card Sort

### Preparation
1. Identify the content to be sorted (30-100 items is the practical range)
2. Write each item on a card with a clear, brief label (avoid internal jargon)
3. Recruit 15-20 participants representing the target user segment

### Facilitation
- In-person: physical index cards (sticky labels for categories in closed sort)
- Remote/digital: Optimal Workshop (OptimalSort), Maze, UXtweak
  - Note: Optimal Workshop CSV ingestion is deferred to complete-design v2.1+

### Analysis Steps
1. Build a similarity matrix: for each pair of cards, count how often they appeared in the same group across all participants
2. Normalize: divide by number of participants → similarity score 0–1
3. Cluster: use hierarchical clustering or visualize as a dendrogram
4. Validate: present top-N clusters to stakeholders; name each cluster

## Tree Testing (Follow-Up)

After card sorting → after designing the sitemap → validate with tree testing:

**Tree test:** Show participants a text-only representation of the navigation hierarchy and ask them to complete tasks ("Where would you go to find X?").

**Metrics:**
- Directness: % of participants who found the item without backtracking
- Success: % who found the correct location
- First click: where most participants clicked first (reveals expectation vs. design)

**Tool:** Optimal Workshop TreeJack (analysis of results via CSV export — v2.1+ for complete-design ingestion).

**complete-design usage:** After emitting `design/ia/sitemap.json` in Stage 2, tree testing (if run with a sample) provides the empirical basis for upgrading sitemap provenance from `INFERRED` to `validated`.

## Relationship to complete-design Workflows

### Stage 2 `structure` workflow
- If card sort results exist: import groupings into the sitemap.json route hierarchy
- If no card sort: use JTBD-derived affinity diagram (Wodtke 2009) as the sorting proxy
- Card sort results can upgrade persona/sitemap `evidence` from `INFERRED` to `proto` (partial research)

### `audit --reverse-engineer-stages`
- Card sorting is retrospective in the refugee path — the sitemap must be inferred from the existing prototype
- Flag: "This IA was reverse-engineered. Recommend open card sort with 5+ users to validate before promoting to `validated` evidence grade."

## Key Quotations

> "Card sorting doesn't tell you what your navigation should look like — it tells you how your users think about the content." — Spencer (2009)

> "The goal isn't to find the 'right' answer — it's to find groupings that work for your users, not groupings that make sense to the team." — Spencer (2009)

## Relationship to Other References

- Complements @${CLAUDE_SKILL_DIR}/references/wodtke-ia.md (taxonomy design and IA principles)
- Upstream of tree testing (Optimal Workshop — v2.1+ ingestion)
- Informs Stage 2 `sitemap.json` evidence grading (INFERRED → proto → validated)
