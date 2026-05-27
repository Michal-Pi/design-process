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

**v2.0b** — All 7 routes fully wired with real stage dispatch. Stages 3 (sketch) and 4
(interact) are live. `audit --all-stages` and `audit --new-feature` post-hoc validator added.

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

### Phase 2 routes (v2.0a)

| Route | Status | Stages | Budget (p50) | Description |
|-------|--------|--------|--------------|-------------|
| `new-feature` | implemented | discover → structure → style-5a → systematize-5b | 60k tokens | Feature-scoped design starting from Stage 1 research |
| `design-bug` | implemented | style-5a | 20k tokens | Stage 5a touch-up for a visual or token regression |
| `brand-refresh` | implemented | style-5a → systematize-5b | 55k tokens | Token + surface refresh (Stages 5a + 5b lite) |
| `PR-audit` | implemented | audit --pr | 15k tokens | Audit a PR for Stage 5a/5b design regressions |

### Phase 3 routes (v2.0b)

| Route | Stages run | Budget p50 | Use case |
|-------|-----------|-----------|---------|
| `new-product` | ingest→discover→structure→sketch→interact→style→systematize | ≤150k | Fresh PRD, full 5-stage design |
| `mature-app-refactor` | audit stage-2 + audit stage-4 + systematize | ≤45k | Existing product, fill IA + IxD gaps + extract DS |
| `DS-extraction` | audit --reverse-engineer-stages + backfill | ≤120k | Lovable/v0/Bolt refugee with prototype |

### Per-stage token budget (D-66) — `new-product` route

Per-stage ceilings are independent — stages do NOT donate unused budget to later stages.
The 2× soft-stop from Phase 2 (run-subagent.mjs) is preserved.

| Stage | Workflow | Budget (p50) |
|-------|----------|-------------|
| ingest | `${CLAUDE_SKILL_DIR}/workflows/ingest.md` | ≤5k |
| discover | `${CLAUDE_SKILL_DIR}/workflows/discover.md` | ≤30k |
| structure | `${CLAUDE_SKILL_DIR}/workflows/structure.md` | ≤25k |
| sketch | `${CLAUDE_SKILL_DIR}/workflows/sketch.md` | ≤25k |
| interact | `${CLAUDE_SKILL_DIR}/workflows/interact.md` | ≤30k |
| style | `${CLAUDE_SKILL_DIR}/workflows/style.md` | ≤25k |
| systematize | `${CLAUDE_SKILL_DIR}/workflows/systematize.md` | ≤10k |
| **Total** | | **≤150k** |

## Gates

Stage-to-stage transitions require passing the corresponding gate checklist:

- `${CLAUDE_SKILL_DIR}/references/gates/stage-1.md` — Research → IA
- `${CLAUDE_SKILL_DIR}/references/gates/stage-2.md` — IA → Low-Fi
- `${CLAUDE_SKILL_DIR}/references/gates/stage-5a.md` — Interaction → Hi-Fi
- `${CLAUDE_SKILL_DIR}/references/gates/stage-5b.md` — Hi-Fi → Design System

Each gate returns a `(terminal-state, evidence-grade)` tuple persisted in `.design-os/manifest.lock`.

Note: Stage 3 + Stage 4 gate checklists ship in Phase 3 (v2.0b) alongside the gate runners.

## References

Canon references available under `${CLAUDE_SKILL_DIR}/references/` (each ≤2k tokens, citations not full quotes per D-24):

| File | Canon |
|------|-------|
| `${CLAUDE_SKILL_DIR}/references/garrett-elements.md` | Garrett 5-plane spine (Strategy/Scope/Structure/Skeleton/Surface) |
| `${CLAUDE_SKILL_DIR}/references/cooper-goodwin.md` | Goodwin goal-directed design + interaction framework |
| `${CLAUDE_SKILL_DIR}/references/torres-ost.md` | Torres Opportunity Solution Tree |
| `${CLAUDE_SKILL_DIR}/references/klement-jtbd.md` | Klement Jobs To Be Done statement format |
| `${CLAUDE_SKILL_DIR}/references/indi-young-thinking-styles.md` | Indi Young thinking-styles + synthetic-persona red line |
| `${CLAUDE_SKILL_DIR}/references/rosenfeld-ia.md` | Rosenfeld/Morville IA vocabulary (sitemap.json schema) |
| `${CLAUDE_SKILL_DIR}/references/dtcg-v2025-10.md` | W3C DTCG v2025.10 token format |
| `${CLAUDE_SKILL_DIR}/references/design-md.md` | Google DESIGN.md April 2026 (Stage 5b contract) |
| `${CLAUDE_SKILL_DIR}/references/wcag-2-2.md` | WCAG 2.2 contrast measurement (never claim conformance) |
| `${CLAUDE_SKILL_DIR}/references/radix-step-roles.md` | Radix step roles for accessible multi-step flows |
| `${CLAUDE_SKILL_DIR}/references/shadcn-tailwind-v4.md` | shadcn/ui + Tailwind v4 @theme projection |
| `${CLAUDE_SKILL_DIR}/references/prd/lenny-one-pager.md` | Lenny one-pager PRD (Stage 0 interview fallback) |

Gate checklists (v1.5 set — Stages 3+4 ship Phase 3):
- `${CLAUDE_SKILL_DIR}/references/gates/stage-1.md`, `${CLAUDE_SKILL_DIR}/references/gates/stage-2.md`, `${CLAUDE_SKILL_DIR}/references/gates/stage-5a.md`, `${CLAUDE_SKILL_DIR}/references/gates/stage-5b.md`

## Related skills

- `design-os/ingest` — Stage 0: PRD ingestion and Lenny 1-pager interview
- `design-os/discover` — Stage 1: Research, personas, JTBD
- `design-os/structure` — Stage 2: Sitemap, flows
- `design-os/style` — Stage 5a: DTCG tokens, palette, preview variants
- `design-os/systematize` — Stage 5b: Component promotion, DESIGN.md emit
- `design-os/audit` — Cross-stage: slop-tells + PR diff audit
