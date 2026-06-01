# Information Architecture for the World Wide Web — Rosenfeld, Morville & Arango

<!-- complete-design reference: rosenfeld-ia -->

## Purpose

The "polar bear book" defines the canonical vocabulary for IA: organization systems,
labeling systems, navigation systems, and search systems. The sitemap.json schema and
Stage 2 IA checklist are grounded in this vocabulary.

## Citations

- Rosenfeld, L., Morville, P. & Arango, J. (2015). *Information Architecture*, 4th ed. O'Reilly.
- Ch.1, p.4: IA is the structural design of shared information environments. It makes content
  findable and understandable. Stage 2 sitemap.json captures the organization system.
- Ch.4, p.57: Organization systems — hierarchical, sequential, database. Sitemap `nodeType`
  field (hub | leaf | modal | external) maps to hierarchy topology.
- Ch.5, p.81: Labeling systems — the words we use in navigations must match users' mental models.
  Stage 2 gate: labels reviewed against Stage 1 persona mental-model vocabulary.
- Ch.7, p.107: Navigation systems — global, local, contextual, supplemental. Sitemap nodes include
  `navType` for global/local classification.
- Ch.9, p.143: Controlled vocabularies — the index terms that connect content. DTCG token names
  (semantic tier) are the complete-design controlled vocabulary for the Surface plane.

## How complete-design uses it

- Stage 2 sitemap.json: `nodeType`, `navType`, and `labelRationale` fields reflect Ch.4/5/7.
- Gate-2 checklist: label vocabulary reviewed against Stage 1 mental model data (§Ch.5).
- DESIGN.md token naming: semantic-tier names cite controlled-vocabulary principle (§Ch.9).

## Drift watch

**Stability: HIGH** — 4th edition 2015; IA vocabulary is stable. The 5th edition has been
discussed on the publisher site but not released as of May 2026.
