---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/acceptance-corpus
---

# Verdant — Brand Refresh and Token Migration

## Context

Verdant is a B2C sustainability SaaS product (carbon footprint tracking for small
businesses) undergoing a brand refresh. The product was launched 3 years ago with a
first-generation visual identity: a flat, muted color palette, System UI / sans-serif
typography, and border-based UI patterns. The brand has grown but the visual identity
reads as "2020 SaaS" rather than "2026 sustainability-forward." A brand agency has
delivered a new visual direction: a warmer, earthy palette (terracotta + sage + off-white),
Inter Display for headings, Inter for body, and elevated card UI with subtle drop shadows.

The engineering team has a Vite 4 + Tailwind v3 codebase with hardcoded color values
scattered across 80+ component files. This PRD covers the design token migration: moving
from hardcoded values to a DTCG v2025.10 token system, upgrading from Tailwind v3 to
Tailwind v4 (CSS-first @theme), and implementing the new brand identity consistently
across the product without a full redesign of any functional flows.

## Current State

- 80+ component files using hardcoded Tailwind classes: `bg-green-600`, `text-gray-700`,
  `border-gray-200` — none referencing a semantic token system.
- Tailwind v3 config-file-based design tokens (extends.colors, extends.fontFamily) with
  ad-hoc naming: `brand`, `brand-light`, `brand-dark`, `brand-darker`.
- No documented type scale — font sizes range from `text-xs` to `text-4xl` applied
  inconsistently.
- No documented spacing scale beyond Tailwind defaults.
- Brand agency delivered: new color swatches (5 palette groups × 9 shades each), 2
  typeface selections, and a mood board. No code deliverables.

## Goals

1. Define a DTCG v2025.10 token set that encodes the new brand identity:
   primitive tier (45 color tokens from the 5 × 9 swatches), semantic tier (foreground,
   background, surface, border, interactive tokens), component tier (button, card, input,
   badge, chip).
2. Produce a Tailwind v4 CSS-first @theme configuration that maps the semantic token
   names to OKLCH values, replacing all hardcoded `bg-green-*` references.
3. Define a type scale (10 tokens: display-lg, display-sm, heading-xl through heading-xs,
   body-lg, body-sm, caption, label) that encodes the Inter Display + Inter pairing.
4. Migrate the 15 highest-traffic components (homepage, pricing, sign-up, dashboard
   landing, notification banner, button variants, input variants, card variants, badge,
   chip) to the new token system — demonstrating the migration pattern for the rest of
   the codebase.

## Non-Goals

- Functional changes to any screen — token migration only, no UX improvements.
- Full codebase migration (80+ components) — this plan covers the 15 highest-traffic
  components; the rest follow the established migration pattern.
- Dark mode — deferred to v2.0 (the brand system is light-mode-first for now).
- New brand assets (illustration style, iconography) — brand agency deliverable, not
  in this engineering scope.

## User Stories

**As a frontend engineer migrating a component**, I want a DESIGN.md that specifies the
exact semantic token name for every visual decision (e.g., `color.surface.elevated` for
elevated cards, `color.interactive.primary` for primary buttons) so I can migrate without
making visual guesses.

**As a designer reviewing migrated components**, I want the Tailwind v4 @theme to produce
pixel-accurate OKLCH values matching the brand agency's swatches so the final output
matches the approved direction.

**As a PM overseeing the rebrand**, I want the migration pattern to be documented clearly
enough that engineers can migrate the remaining 65 components in 3-4 sprints without
designer involvement so we can complete the rebrand without blocking the roadmap.

## Success Metrics

- Token system completeness: all 45 primitive colors, all semantic tokens, and component
  tokens for the 15 in-scope components defined in DESIGN.md.
- Migration accuracy: ≥ 95% of visual properties in the 15 migrated components using
  semantic tokens (not hardcoded values or Tailwind primitives).
- Tailwind v4 @theme alignment: OKLCH values in @theme produce WCAG-compliant contrast
  ratios for all foreground/background semantic token pairs.
- Engineer migration speed for remaining components: ≤ 2 hours per component (measured
  on the first 3 post-documentation migrations).
- Brand agency approval of 15 migrated components: ≥ 4.5/5.0 fidelity score.

## Constraints

- This is a brand-refresh route engagement — workflow focuses on token extraction from
  the existing Vite + Tailwind v3 codebase and the brand agency deliverables.
- Tech stack target: Vite 6 + Tailwind v4 (CSS-first @theme).
- Budget ceiling: 55,000 tokens total for the design formalization workflow.
- Timeline: 3-week brand-refresh sprint (token system week 1, migration of 15 components
  weeks 2-3).
- Team: 1 designer, 2 frontend engineers, no dedicated PM.
