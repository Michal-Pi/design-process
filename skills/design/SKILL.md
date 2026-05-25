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

## Routes

The design skill dispatches to 7 named routes via `--route <name>`:

| Route | Status | Description |
|-------|--------|-------------|
| `new-product` | stub | Full 5-stage workflow for a new product |
| `new-feature` | stub | Feature-scoped design (Stages 1–4) |
| `design-audit` | stub | Audit existing design for stage compliance |
| `brand-refresh` | stub | Token + surface refresh starting from Stage 5b |
| `design-bug` | stub | Single-stage regression fix |
| `mature-app-refactor` | ROUTE_NOT_YET_IMPLEMENTED — ships in v2.0b | |
| `DS-extraction` | ROUTE_NOT_YET_IMPLEMENTED — ships in v2.0b | |

Default route: if `--route` is omitted, the orchestrator infers from repo signals or asks a 3-5 question intake (TRUST-05 — no silent defaults).

## Gates

Stage-to-stage transitions require passing the corresponding gate checklist:

- `references/gates/stage-1.md` — Research → IA
- `references/gates/stage-2.md` — IA → Low-Fi
- `references/gates/stage-5a.md` — Interaction → Hi-Fi
- `references/gates/stage-5b.md` — Hi-Fi → Design System

Each gate returns a `(terminal-state, evidence-grade)` tuple persisted in `.design-os/manifest.lock`.

## v2.0a placeholder

The full workflow body (route implementations, stage orchestration, subagent dispatch) ships in v2.0a. This skeleton registers the skill with a valid agentskills.io v1 frontmatter block and declares the route registry so trigger evaluation and coexistence testing can run against real frontmatter in v1.5.
