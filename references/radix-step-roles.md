# Radix UI — Step / Wizard Roles for Component Scaffolding

<!-- design-os reference: radix-step-roles -->

## Purpose

Radix UI's primitive role taxonomy (specifically step/wizard roles) informs how design-os
generates accessible component scaffolds for multi-step flows in Stage 5a. The Radix
pattern is the canonical reference for `role="group"`, `aria-current="step"`, and
linear step navigation.

## Citations

- Radix UI documentation. *Stepper / Wizard patterns*.
  https://www.radix-ui.com/primitives
- `aria-current="step"` on the active step element; `aria-current` for non-active steps
  must be absent or `false`. Stage 5a scaffold generator follows this pattern.
- Compound component pattern: Stepper.Root + Stepper.Item + Stepper.Trigger + Stepper.Content.
  Design-os component scaffold uses this shape for any multi-step flow.
- Focus management: when advancing to a new step, focus moves to the new step's heading or
  first focusable element. Design-os IxD machine includes focus management transitions.
- Progress bar vs. step indicator: `role="progressbar"` (numeric progress) vs.
  `role="list"` / `role="listitem"` (step indicator). Design-os defaults to `role="list"`.

## How design-os uses it

- Stage 5a component scaffolds: multi-step flows use Radix step-role patterns.
- Stage 4 IxD machines: focus management transitions cite this reference.
- Gate-5a checklist: step accessibility item cites Radix step-roles pattern.

## Drift watch

**Stability: HIGH** — Radix UI primitives are stable and follow WAI-ARIA patterns.
Monitor radix-ui.com changelog; breaking changes to step roles are unlikely but track
`@radix-ui/react-*` semver major bumps.
