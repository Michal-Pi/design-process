# Tidwell: Designing Interfaces Patterns

**Stage:** 4 (Interact)
**Topic:** Interaction pattern catalog — reusable solutions to common UI design problems

## Summary

Jenifer Tidwell, Charles Brewer, and Aynne Valencia's catalog documents recurring interaction
patterns organized by user goal. Each pattern has a name, context, solution, and visual examples.

## Key Patterns for Stage 4

**List Builder** — Allow users to create an ordered or unordered list from a set of options.
States: empty list, adding item, list with items, reordering. Use for multi-select flows.

**Card Stack** — Display content items as visual cards that can be scrolled, swiped, or dismissed.
States: loading, empty (no cards), populated, dismissing. Good for feeds and recommendations.

**Fill-in-the-Blanks** — Display a sentence or phrase with blanks that users fill in to configure.
States: unfilled, partially filled, complete, validation error. Reduces cognitive load vs forms.

**Responsive Disclosure** — Reveal form fields progressively as the user fills in earlier fields.
States: initial (minimal), disclosed (expanded), error (per-field). Reduces form complexity.

**Progress Indicators** — Show how far along a multi-step process the user is.
States: initial, in-progress (step N of M), complete, error on step. Use for wizards, uploads.

**Inline Validation** — Validate form fields as the user types or leaves a field (not on submit).
States: untouched, valid, invalid (with message). Reduces error recovery time.

**Forgiving Format** — Accept data in multiple formats and normalize it silently.
Example: phone numbers as (555) 123-4567 or 5551234567. Reduces user friction.

## When to Use

Match the primary interaction type of the screen to the appropriate pattern:
- Data entry → Fill-in-the-Blanks, Inline Validation, Forgiving Format
- Content consumption → Card Stack, List Builder
- Multi-step task → Progress Indicators, Responsive Disclosure

## Citations

Tidwell, J., Brewer, C., & Valencia, A. (2020). *Designing Interfaces: Patterns for Effective
Interaction Design* (3rd ed.). O'Reilly Media. ISBN: 978-1492051961
