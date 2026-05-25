---
name: design
description: "Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug."
version: 0.1.0-v1.5
license: Apache-2.0
compatibility:
  - claude-code
  - codex-cli
  - cursor
allowed-tools:
  - Read
  - Write
  - Bash
---

# Design — 5-stage design orchestrator

## Status

**v1.5 skeleton** — Stage workflows ship in v2.0a. This skill registers the entry point and route dispatcher for the full 5-stage design process.

## Default behavior

**ROUTE-08:** When invoked without `--route`, design-os asks before running — the default
is NOT all 5 stages. The orchestrator suggests a route based on repo signals or asks a
brief intake. Never silently runs all 5 stages.

```bash
# Explicit route (recommended)
design-os design --route new-feature --design-dir ./design

# No route → prints suggestion + exits 0 (ROUTE-08)
design-os design --design-dir ./design
```

## Routes

The design skill dispatches to 7 named routes via `--route <name>`:

| Route | v1.5 Status | Budget (p50) | Description |
|-------|-------------|--------------|-------------|
| `new-feature` | implemented-stub | 60k tokens | Feature-scoped design (Stages 2, 4, 5a) |
| `design-bug` | implemented-stub | 20k tokens | Single-stage interaction/visual regression fix |
| `brand-refresh` | implemented-stub | 55k tokens | Token + surface refresh (Stages 5a, 5b) |
| `PR-audit` | implemented-stub | 15k tokens | Audit a PR for design regression |
| `new-product` | ROUTE_NOT_YET_IMPLEMENTED (v2.0b) | 150k tokens | Full 5-stage workflow for a greenfield product |
| `mature-app-refactor` | ROUTE_NOT_YET_IMPLEMENTED (v2.0b) | 45k tokens | Design-system extraction + refactor |
| `DS-extraction` | ROUTE_NOT_YET_IMPLEMENTED (v2.0b) | 120k tokens | Reverse-engineer stages from Lovable/v0 prototype |

## Gates

Stage-to-stage transitions require passing the corresponding gate checklist:

- `references/gates/stage-1.md` — Research → IA
- `references/gates/stage-2.md` — IA → Low-Fi
- `references/gates/stage-5a.md` — Interaction → Hi-Fi
- `references/gates/stage-5b.md` — Hi-Fi → Design System

Each gate returns a `(terminal-state, evidence-grade)` tuple persisted in `.design-os/manifest.lock`.

Note: Stage 3 + Stage 4 gate checklists ship in Phase 3 (v2.0b) alongside the gate runners.

## References

Canon references available under `references/` (each ≤2k tokens, citations not full quotes per D-24):

| File | Canon |
|------|-------|
| `references/garrett-elements.md` | Garrett 5-plane spine (Strategy/Scope/Structure/Skeleton/Surface) |
| `references/cooper-goodwin.md` | Goodwin goal-directed design + interaction framework |
| `references/torres-ost.md` | Torres Opportunity Solution Tree |
| `references/klement-jtbd.md` | Klement Jobs To Be Done statement format |
| `references/indi-young-thinking-styles.md` | Indi Young thinking-styles + synthetic-persona red line |
| `references/rosenfeld-ia.md` | Rosenfeld/Morville IA vocabulary (sitemap.json schema) |
| `references/dtcg-v2025-10.md` | W3C DTCG v2025.10 token format |
| `references/design-md.md` | Google DESIGN.md April 2026 (Stage 5b contract) |
| `references/wcag-2-2.md` | WCAG 2.2 contrast measurement (never claim conformance) |
| `references/radix-step-roles.md` | Radix step roles for accessible multi-step flows |
| `references/shadcn-tailwind-v4.md` | shadcn/ui + Tailwind v4 @theme projection |
| `references/prd/lenny-one-pager.md` | Lenny one-pager PRD (Stage 0 interview fallback) |

Gate checklists (v1.5 set — Stages 3+4 ship Phase 3):
- `references/gates/stage-1.md`, `stage-2.md`, `stage-5a.md`, `stage-5b.md`

## v2.0a placeholder

The full workflow body (route implementations, stage orchestration, subagent dispatch) ships in v2.0a. This skeleton registers the skill with a valid agentskills.io v1 frontmatter block and declares the route registry so trigger evaluation and coexistence testing can run against real frontmatter in v1.5.
