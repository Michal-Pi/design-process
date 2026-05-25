# Google DESIGN.md — April 2026 Open-Source Release

<!-- design-os reference: design-md -->

## Purpose

Google DESIGN.md (Apache-2.0, github.com/google-labs-code/design.md) is a Markdown + YAML
frontmatter format for capturing design decisions and token contracts in a repo file.
Design-os emits DESIGN.md as the Stage 5b contract artifact.

## Citations

- Google Labs (2026-04). *DESIGN.md specification*, Apache-2.0.
  https://github.com/google-labs-code/design.md
- Frontmatter fields: `version`, `tokens` (DTCG-aligned YAML block), `rationale` (free text).
  Design-os extends with `$extensions.design-os` carrying `generatedAt`, `schemaVersion`,
  `provenance`, `routeName`.
- DESIGN.md integrates with Google Stitch for AI-assisted token projection. Design-os uses
  a compatible subset; no Stitch dependency required.
- Schema note: animations, dark-mode, and breakpoints sections are under active discussion
  upstream as of April 2026. Design-os defers those sections to Phase 3 (v2.0b).
- Apache-2.0 license — compatible with design-os Apache-2.0 distribution.

## How design-os uses it

- Stage 5b artifact: `design-md-validate.mjs` validates emitted DESIGN.md against pinned
  April 2026 schema version (FORMAT-07 pin; unsupported `--design-md-version` exits 1).
- `$extensions.design-os` namespace carries structured provenance metadata (PERSIST-01).
- Token section aligns to DTCG v2025.10 semantic tier.

## Drift watch

**Stability: MEDIUM** — Schema is Apache-2.0 and evolving. Upstream may add animations/
dark-mode/breakpoints sections. Design-os pins the April 2026 release (FORMAT-07) and
uses `design-md-validate.mjs --design-md-version` to detect drift. Monitor
github.com/google-labs-code/design.md releases weekly (Anthropic-Labs watcher extended
to cover this repository from v2.0 GA).
