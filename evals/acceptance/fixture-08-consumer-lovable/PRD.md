---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: complete-design/acceptance-corpus
---

# Bloom — Habit Tracker: Migrating from Lovable Prototype to Production

## Context

Bloom is a consumer habit-tracking app built as a Lovable prototype over 6 weeks by a
solo founder. The app has 1,200 active users (acquired via Product Hunt launch) and
tracks daily habits with streaks, reminders, and a weekly reflection journal. The
prototype is working but the UI was generated rapidly in Lovable — it has no coherent
design system, inconsistent spacing and typography, hardcoded color values in 40+ places,
and interaction patterns that do not meet WCAG 2.2 AA contrast requirements.

The founder has decided to migrate to a production Next.js 15 + shadcn/ui codebase.
This PRD covers the design formalization phase: extracting a design system from the
existing prototype, standardizing the interaction patterns, and producing a DESIGN.md
contract that the engineering migration can implement consistently.

## Current State (Pre-Migration)

The existing Lovable-generated prototype has:
- 6 primary screens: Today view, Habit editor, Streak calendar, Weekly reflection,
  Settings, and Onboarding.
- Hardcoded hex colors (`#5C6BC0`, `#26A69A`, `#EF9A9A`) with no semantic naming.
- Custom CSS with 14 distinct font-size values, no type scale.
- Card components with 3 different border-radius values (8px, 12px, 16px) used
  inconsistently.
- Interaction: reminder notifications, habit check-in (long-press on mobile web), and
  streak recovery (7-day grace window) are all untested at edge cases.

## Goals

1. Extract a coherent DTCG v2025.10 token set from the existing prototype — mapping
   hardcoded values to semantic tokens (primitive → semantic → component tiers).
2. Standardize the 6 primary screens against the extracted tokens so the Next.js
   migration team has a single source of truth, not 40+ scattered overrides.
3. Document the 3 critical interaction patterns (habit check-in, streak recovery, weekly
   reflection entry) as XState-compatible state machine specs so the mobile web behavior
   is fully specified before the Next.js rebuild.
4. Produce a DESIGN.md contract that the migration team can implement without requiring
   designer involvement on every component.

## Non-Goals

- New features (social sharing, coach mode, etc.) — these are v2.0 roadmap items.
- The engineering migration itself — this PRD covers the design formalization only.
- Re-designing the core visual identity (the purple/teal palette is user-recognized; do
  not change it as part of formalization).
- Accessibility audit beyond WCAG 2.2 AA contrast (full WCAG audit is a post-migration
  task).

## User Stories

**As the engineering lead on the migration**, I want a DESIGN.md that specifies exact
token values for every visual element in the 6 screens so I can implement consistently
without asking the designer "what color is this?"

**As the solo founder**, I want the token extraction to preserve the visual identity
that users recognize (the purple/teal palette, the rounded card style) so the production
app does not feel like a different product.

**As a developer**, I want XState-compatible interaction specs for habit check-in and
streak recovery so edge cases (check-in after midnight, recovery during streak ≥ 30
days) are documented before I write the first line of code.

## Success Metrics

- Design token extraction completeness: ≥ 90% of hardcoded values in the prototype mapped
  to named semantic tokens in DESIGN.md.
- Interaction spec completeness: all 3 critical flows have state machine specs with
  entry/exit conditions and edge case states documented.
- Engineering team feedback (post-first-sprint using DESIGN.md): ≥ 4.0/5.0 clarity score.
- Contrast compliance: all foreground/background token pairs in DESIGN.md meet WCAG 2.2
  AA (≥ 4.5:1 for normal text, ≥ 3:1 for large text).

## Constraints

- This is a mature-app-refactor route engagement — Stage 1 (Research) and Stage 3 (Low-Fi)
  are skipped; the workflow starts with Stage 2 audit of the existing prototype.
- Source material: the Lovable export (HTML/CSS bundle) is available for audit.
- Target stack: Next.js 15 + shadcn/ui.
- Budget ceiling: 45,000 tokens total for the design formalization workflow.
- Timeline: 2-week design sprint before the engineering migration begins.
