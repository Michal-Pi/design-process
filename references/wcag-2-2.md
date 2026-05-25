# Web Content Accessibility Guidelines 2.2

<!-- design-os reference: wcag-2-2 -->

## Purpose

WCAG 2.2 (W3C, September 2023) defines contrast and perceivability requirements for
accessible UI. Design-os reports measured contrast ratios but never claims WCAG conformance
(TRUST-01 / P8 trust posture).

## Citations

- W3C WAI (2023-09-05). *Web Content Accessibility Guidelines (WCAG) 2.2*.
  https://www.w3.org/TR/WCAG22/
- SC 1.4.3 (Level AA): Text contrast ≥4.5:1 (normal text), ≥3:1 (large text ≥18pt / 14pt bold).
  Design-os `contrast.mjs` reports measured ratios using WCAG 2.2 math.
- SC 1.4.11 (Level AA): Non-text contrast ≥3:1 for UI components and focus indicators.
  Stage 5a gate includes a non-text contrast check citation.
- SC 2.4.12 (Level AAA): Focus appearance (minimum visible focus indicator). Mentioned in
  Stage 5a checklist as best-practice advisory only (AAA not required for AA).
- APCA: The Accessible Perceptual Contrast Algorithm is the proposed WCAG 3.0 method; design-os
  reports APCA alongside WCAG 2.2 ratios but treats WCAG 2.2 as the authoritative gate.

## How design-os uses it

- `contrast.mjs`: measures WCAG 2.2 AA ratios (4.5:1 / 3:1 thresholds) + APCA Lc values.
  Output format: "WCAG 2.2 AA contrast 4.7 (pass)" — never "WCAG-compliant" (TRUST-01).
- Stage 5a gate checklist: SC 1.4.3 + SC 1.4.11 items present.
- DESIGN.md: `contrastNote` field carries measured ratios, never conformance claims.

## Drift watch

**Stability: HIGH** — WCAG 2.2 is a W3C Recommendation (stable). WCAG 3.0 (Silver) is in
Working Draft; design-os will not adopt WCAG 3.0 requirements until they reach Recommendation
status. APCA measurement is supplementary only.
