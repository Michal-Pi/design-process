---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: complete-design/acceptance-corpus
---

# Atlas Admin — Design System Extraction from Lovable Prototype

## Context

Atlas Admin is an internal operations dashboard built by the Atlas platform team as a
Lovable prototype over 8 weeks. The tool is used by 45 internal operations staff to
manage customer onboarding workflows, SLA tracking, and escalation routing. The
prototype works and has organizational adoption — but it was generated without a design
system, and the platform team now needs to extract coherent tokens and component
specifications so they can build the next 8 dashboard modules consistently without
designer intervention on every new screen.

The Atlas Admin prototype has 12 primary screens built using Lovable's generation layer.
Visual patterns repeat but with subtle inconsistencies (4 different button border-radius
values, 3 different table row heights, 6 distinct gray shades used as backgrounds with no
semantic grouping). The operations team is requesting 8 additional dashboard modules
in Q3, and the platform team cannot scale designer-per-module at that rate.

## Current State (Pre-Extraction)

- 12 screens with recognizable Atlas visual language (indigo/slate palette, card-based
  layout, sidebar navigation) but no documented token system.
- Typography: 5 font-size values (12px, 14px, 16px, 20px, 28px) with inconsistent
  line-height and letter-spacing across components.
- Color system: 6 indigo shades + 3 slate shades hardcoded as hex values in inline styles
  and Tailwind arbitrary values ([#4F46E5], [#6366F1], etc.).
- Component inconsistencies: 3 card variants with different padding (12px, 16px, 20px);
  2 table styles (striped and bordered) used interchangeably without semantic reason.
- No documented state machine for the escalation routing workflow (the most complex
  interactive flow in the product).

## Goals

1. Extract a complete DTCG v2025.10 token set from the existing prototype — mapping
   all hardcoded color, typography, and spacing values to a primitive → semantic →
   component token hierarchy.
2. Produce a DESIGN.md contract that documents the 12 existing screen patterns so new
   modules can be built against the specification without visual inconsistency.
3. Specify the escalation routing interaction as a state machine (XState-compatible
   Mermaid stateDiagram-v2) so the engineering team has a formal spec before rebuilding
   that flow in the modular dashboard.
4. Backfill Stage 2 (IA) and Stage 4 (IxD) artifacts from inferred analysis of the
   prototype — the team skipped these stages during the Lovable build.

## Non-Goals

- New feature development — this is a formalization and extraction engagement only.
- Visual redesign — the Atlas visual identity is established and recognized internally;
  extraction preserves it, not replaces it.
- Full component library implementation (separate engineering deliverable post-extraction).
- Accessibility audit beyond documenting current contrast values (full audit is post-sprint).

## User Stories

**As a platform engineer building a new dashboard module**, I want to reference a
DESIGN.md that specifies which semantic token to use for table row backgrounds,
button variants, and card elevation so I can implement consistently without asking
the designer.

**As a designer onboarding to the Atlas platform**, I want a token system document
that explains the semantic naming rationale for each token group so I can extend the
system coherently rather than introducing new inconsistencies.

**As an engineering lead**, I want the escalation routing flow documented as a state
machine so the next sprint team has a testable behavioral specification before writing
any code.

## Success Metrics

- Token extraction completeness: ≥ 95% of hardcoded values in the 12 screens mapped
  to named semantic tokens in the extracted token set.
- Platform engineer adoption: ≥ 80% of Q3 module builds reference DESIGN.md as primary
  spec (surveyed after first 2 modules ship).
- State machine specification completeness: escalation routing has all states, transitions,
  and edge cases (timeout, reassignment, SLA breach) documented.
- Designer extension effort for new modules: ≤ 1 design day per module (vs. 3-4 days
  current without a token system).

## Constraints

- This is a DS-extraction route engagement — workflow starts with reverse-engineer-stages
  phase, then backfills Stages 2 and 4 from inferred artifacts.
- Source material: the Atlas Admin Lovable export (HTML/CSS/JS bundle) is available.
- Target token format: DTCG v2025.10.
- Budget ceiling: 120,000 tokens total (reverse-engineer + 4 backfill stages).
- Timeline: 3-week extraction sprint.
- Team: 1 designer, 1 platform engineer, no PM.
