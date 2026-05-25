---
name: handoff
description: "Build a compact handoff bundle (5-15k tokens) from a stage's design/<stage>/ outputs for the next stage's workflow. Use when crossing stage boundaries."
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

# Handoff — Stage-boundary bundle builder

## Status

**v1.5 skeleton** — Handoff bundle pipeline ships in Plan 02 (v1.5). This skill wraps `handoff-bundle-build.mjs` as an agent-invocable entry point.

## What it does

The handoff skill compresses a stage's `design/<stage>/` directory into a compact bundle (5–15k tokens) that the next stage's workflow can consume in lieu of the raw upstream directory. This is the context-window survival mechanism for multi-stage workflows.

### Bundle sections

| Section | Required | Description |
|---------|----------|-------------|
| Goal & scope | yes | What this stage produced and why |
| Decisions made | yes | Terminal states + evidence grades from gate runs |
| Open questions | yes | Unresolved items the next stage must address |
| Artifacts inventory | yes | All file paths with 1-line briefs |
| Pointers to verify | yes | Where downstream LLMs can grab raw artifacts |
| Provenance (worst-case) | yes | Confidence floor for the bundle |
| Risks surfaced | optional | Dropped first if truncation needed |

## v2.0a placeholder

Full route integration (deciding which upstream stage to bundle, triggering the LLM summary, storing to `design/.handoff/stage-N-bundle.md`) ships in v2.0a when stage workflows are available. This skeleton enables trigger evaluation in v1.5.
