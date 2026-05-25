---
name: audit
description: "audit a PR / single stage / all stages for design slop, fidelity caps, evidence grade. Use for: PR review, design slop tells, reverse-engineer stages from Lovable / v0 / Bolt prototypes."
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

# Audit — Design quality auditor

## Status

**v1.5 skeleton** — Audit workflows ship in v2.0a (basic audit) and v2.0b (`--reverse-engineer-stages`). This skill registers the entry point and audit modes.

## Modes

| Mode | Status | Description |
|------|--------|-------------|
| `--pr` | stub | Audit a pull request for design slop |
| `--stage <N>` | stub | Audit a single stage's outputs |
| `--all` | stub | Full 5-stage audit pass |
| `--ci` | stub | CI mode: blocks on SEVERITY_HIGH findings |
| `--reverse-engineer-stages` | ROUTE_NOT_YET_IMPLEMENTED — ships in v2.0b | Infer stage artifacts from Lovable/v0/Bolt output |

## Fidelity Caps

The audit enforces stage-appropriate fidelity caps (CONTEXT.md §3.23):
- Stage 3 artifacts must not contain color/shadow/brand styling
- Stage 4 interaction specs must cite Radix step-role pattern or labeled house heuristic

## v2.0a placeholder

Full audit logic (gate checklist runners, fidelity-cap analysis, evidence-grade scoring) ships in v2.0a. This skeleton enables trigger evaluation and coexistence testing in v1.5.
