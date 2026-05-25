# Thinking in Services / Mental Models — Indi Young (Thinking Styles)

<!-- design-os reference: indi-young-thinking-styles -->

## Purpose

Indi Young's thinking-styles framework (extended from mental model diagrams) defines how to
cluster users by cognitive patterns rather than demographics. Used in Stage 1 persona
generation and to frame the `provenance: generated` synthetic-persona red line.

## Citations

- Young, I. (2021). *Practical Empathy*; (2019). *Time to Listen*; (2023). *Thinking in Services*.
  indiyoung.com.
- "Demographic thinking creates labels; thinking-style thinking creates understanding."
  Persona JSON `type` field must use a behavioral cluster, not a demographic segment.
- Mental model diagram methodology: affinity-sorted tasks + behaviors define towers (clusters)
  independent of user type. Stage 1 synthesis maps interview data to towers before naming archetypes.
- Thinking styles vs. personas: thinking styles are more stable across time because they describe
  cognitive approaches, not job titles. Design-os personas use thinking-style framing in `approach` field.
- "Synthetic personas are not research." The red-line rule in TRUST-01: AI-generated personas
  are `provenance: generated`, never `VALIDATED`, require ASSUMPTIONS.md.
- Listening sessions methodology — 1:1 deep-listening rather than task observation. Stage 1
  research plan template references this as the preferred discovery format.

## How design-os uses it

- Stage 1 persona JSON: `approach` (thinking-style cluster) replaces demographic `type`.
- TRUST-01: synthetic persona red line. Indi Young's explicit position on AI-generated personas
  informs the `provenance: generated` not-runnable boundary.
- Gate-1 checklist: persona approach field must be behavior-grounded, not demographic.

## Drift watch

**Stability: HIGH** — Indi Young's framework evolves through blog posts on indiyoung.com, but
the core thinking-styles methodology is stable. No breaking changes expected.
