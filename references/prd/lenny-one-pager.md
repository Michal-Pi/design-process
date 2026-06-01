# Lenny's One-Pager PRD Format

<!-- complete-design reference: prd/lenny-one-pager -->

## Purpose

Lenny Rachitsky's one-pager PRD format (from Lenny's Newsletter) is the fallback PRD
structure when no existing PRD is present in the repo. Stage 0 interview mode fills in
this template. The format is intentionally concise (single page) to minimize token cost.

## Citations

- Rachitsky, L. (2022, updated 2024). *How to write a PRD*. Lenny's Newsletter.
  https://www.lennysnewsletter.com/p/how-to-write-a-good-prd
- Section structure: Problem, Why now, Who, What (not how), Metrics, Constraints, Open questions.
  Design-os PRD.md uses this as the minimal required scaffold (7 sections).
- "The best PRD fits on one page." — token budget principle: Stage 0 PRD should be ≤2k tokens
  (complete-design enforces ≤3k tokens for full PRD.md).
- Problem section: one sentence describing the user's struggle + the consequence if unsolved.
  Maps to JTBD struggling moment (Klement §Ch.3, p.51).
- Metrics section: ≤3 north-star metrics. Each metric must be measurable and time-bound.
  Design-os GATE-01 checks PRD.md for the Metrics section presence.
- "Open questions are the most valuable section of the PRD" — unresolved questions drive
  Stage 1 research agenda; they appear as `openQuestions` in persona JSON.

## How complete-design uses it

- Stage 0 (Strategy): if no PRD exists, `complete-design design --route new-product` launches
  interview mode using this template as the question guide.
- PRD.md schema: 7 required sections validated by `frontmatter-validate.mjs`.
- Gate-0 checklist (Phase 2): Problem + Metrics sections required for gate PASS.

## Drift watch

**Stability: HIGH** — Lenny's format is a newsletter post, not a living spec. Updates are
additive (new sections suggested) not breaking. The 7-section core is stable.
