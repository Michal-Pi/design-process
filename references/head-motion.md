# Head et al.: Motion Design Guidelines

**Stage:** 4 (Interact)
**Topic:** Purpose-driven animation — timing, easing, reduced-motion accessibility

## Summary

Material Motion Design and the prefers-reduced-motion media query specification establish
principles for meaningful animation in interfaces. Motion should serve a communicative purpose,
never decorate.

## Core Principles

**1. Purpose-Driven Motion** — Every animation must communicate something:
- Spatial relationships (where an element came from, where it goes)
- Causality (this button caused that panel to appear)
- Hierarchy (this modal is above the page content)
- State change (loading → complete)

**2. Timing Functions** — Use easing curves that feel natural:
- `ease-in-out` (standard): element moves, slows at destination
- `ease-out` (enter): elements entering the screen decelerate
- `ease-in` (exit): elements leaving the screen accelerate
- Linear: only for looping animations (loading spinners)

**3. Duration Guidelines**
- Simple transitions (fade, color): 100–200ms
- Element movements (slide, expand): 250–400ms
- Complex sequences: ≤500ms (longer feels sluggish)
- Never animate layout-affecting properties repeatedly

**4. Reduced-Motion Respect (WCAG 2.3 SC 2.3.3)**
Always honor `prefers-reduced-motion: reduce`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```
Some users (vestibular disorders, epilepsy risk) experience physical harm from motion.
This is not optional — it is a WCAG 2.2 Level AA requirement as of August 2023.

## Anti-Patterns

- Decorative animations that add no information
- Animations longer than 500ms on user-triggered interactions
- Motion that cannot be disabled
- Animating layout (width/height) — use transform instead

## Citations

Material Design: *Motion — Principles*. Google Material Design documentation.
https://m3.material.io/styles/motion/overview

WCAG 2.3.3 Animation from Interactions (Level AAA note: prefers-reduced-motion is
Level AA in WCAG 2.2 via SC 2.3.3 extended scope).
https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
