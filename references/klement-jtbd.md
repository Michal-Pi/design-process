# When Coffee and Kale Compete — Alan Klement (Jobs To Be Done)

<!-- design-os reference: klement-jtbd -->

## Purpose

Alan Klement's JTBD framework (demand-side sales / outcome-driven) defines how users "hire"
a product to make progress in their life. Used in Stage 1 to ensure personas are goal-oriented
and in Stage 0 to validate that the PRD's outcome is a genuine job-to-be-done.

## Citations

- Klement, A. (2018). *When Coffee and Kale Compete*. NY: Independently published.
- Ch.1, p.12: "People don't simply buy products; they hire them to help them make progress."
  The hiring/firing model changes how Stage 1 personas are written.
- Ch.2, p.29: The JTBD statement format: "When [situation], I want to [motivation], so I can
  [outcome]." Design-os persona JSON `jtbd` field uses this exact structure.
- Ch.3, p.51: Struggling moments are the richest discovery data — Stage 1 interview guide
  includes "tell me about the last time you struggled with…" prompts.
- Ch.4, p.72: Progress-making forces (push/pull/inertia/anxiety) — Stage 1 research synthesis
  uses this 4-force model to explain adoption intent.
- Ch.5, p.88: Switch interviews vs. new-user interviews — Stage 1 defaults to switch interviews
  (most revealing); pure new-user research is flagged with `provenance: generated`.

## How design-os uses it

- Stage 0 PRD: product outcome validated against a JTBD statement.
- Stage 1 persona JSON: `jtbd` field required (GATE-01 checklist item).
- Stage 1 gate: interview guide includes JTBD-structured questions.

## Drift watch

**Stability: HIGH** — 2018 book; JTBD framework is stable. Klement's writing on jtbd.info
evolves but does not change the core statement format.
