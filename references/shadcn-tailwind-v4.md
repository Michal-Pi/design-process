# shadcn/ui + Tailwind CSS v4 Integration

<!-- design-os reference: shadcn-tailwind-v4 -->

## Purpose

shadcn/ui (copy-paste component library) + Tailwind CSS v4 (CSS-first `@theme`, OKLCH
defaults) is the primary generated-component target for design-os Stage 5a/5b. The
`cn()` utility, semantic color tokens, and `@theme` projection are canonical patterns.

## Citations

- shadcn/ui docs (2026 cohort). *Tailwind v4 integration*.
  https://ui.shadcn.com/docs/tailwind-v4
- Tailwind CSS v4.0 blog (Jan 2025). *Tailwind CSS v4.0*.
  https://tailwindcss.com/blog/tailwindcss-v4
- CSS-first config: `@theme { --color-primary: oklch(60% 0.2 270); }` replaces tailwind.config.js.
  Design-os DESIGN.md token section emits `@theme` blocks per DTCG semantic tier.
- `cn()` utility: `clsx(inputs) + twMerge(inputs)` pattern for class merging.
  All design-os generated components use `cn()` for className composition.
- Semantic color tokens: `bg-primary`, `text-destructive`, `ring-border` — never raw
  Tailwind colors like `bg-blue-500` in generated code (CLAUDE.md shadcn rule).
- `forwardRef` + `cn()` pattern for new component wrappers (never modify `components/ui/`).
- OKLCH defaults: Tailwind v4 ships P3 gamut colors via OKLCH; design-os `oklch.mjs`
  emits tokens in OKLCH format compatible with Tailwind v4 `@theme`.

## How design-os uses it

- Stage 5a component scaffolds: use shadcn/ui Tailwind v4 patterns by default.
- Stage 5b token emission: DTCG → Tailwind v4 `@theme` projection.
- DESIGN.md: token section uses OKLCH + semantic naming compatible with this pattern.

## Drift watch

**Stability: HIGH** — Tailwind v4.1 is stable (Apr 2025). shadcn confirms v4 compatibility.
Monitor tailwindcss.com and ui.shadcn.com for major version bumps; OKLCH projection is
standardized in CSS Color Level 4.
