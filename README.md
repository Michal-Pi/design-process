# design-os

**The 5-stage design process, operationalized as an agent-loop workflow.**

Stop jumping straight to hi-fi. design-os walks through Research → IA → Low-Fi → Interaction → Hi-Fi + Design System, with stage-typed artifacts and validation gates between every step — so your prototypes do not break at production scale.

[![npm version](https://img.shields.io/npm/v/design-os.svg)](https://www.npmjs.com/package/design-os)
[![Node 22+](https://img.shields.io/badge/node-%3E%3D22-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)
[![Status: GA](https://img.shields.io/badge/status-GA-brightgreen)](https://www.npmjs.com/package/design-os)

---

## What it is

design-os is a [SKILL.md](https://agentskills.io/specification) package for Claude Code, Codex CLI, and Cursor. Once installed, it teaches your coding agent to guide you through the full Garrett spine — Strategy → Scope → Structure → Skeleton → Surface — before touching a component. Each stage produces structured artifacts (`design/` directory); each transition is gated by checks that catch issues a LLM prompt loop without structure routinely misses.

The key difference from Lovable, v0, Bolt, Subframe, Figma Make, and Claude Design: those tools start at the surface (hi-fi generation). design-os starts at the strategy layer and does not let you skip. Prototypes built this way hold up when the design system team, the PM, and the accessibility reviewer all look at the same artifact.

This is version 2.0.0 (GA). All 5 stages are implemented and gate-verified across the acceptance corpus.

---

## Quick start

```bash
# 1. Install design-os globally
npm i -g design-os

# 2. Copy the SKILL.md package into your Claude Code skills directory
design-os install

# 3. Restart Claude Code (close and reopen, or run /reload-skills if available)

# 4. In a fresh session, prompt Claude:
#    "Walk me through designing X using the 5-stage process"
```

Claude Code will pick up the skill automatically. No config files to edit. No `npm ci`. No `git clone`.

---

## What you get

After `design-os install`, your agent knows four design routes:

- **new-product** — full Stages 1–5b for a product being built from scratch
- **new-feature** — Stages 2, 4, 5a for a feature added to an existing app
- **mature-app-refactor** — Stages 1, 2, 4, 5a, 5b for fixing accumulated IA + design debt
- **DS-extraction** — Stage 5b only, reverse-engineering a design system from existing components

Each route emits structured artifacts:

| Stage | Artifact | Format |
|-------|----------|--------|
| 1 — Research | personas, JTBD, assumptions | JSON + Markdown |
| 2 — IA | sitemap, user flows | JSON + Mermaid flowchart |
| 3 — Low-Fi | wireframe sketches | Excalidraw JSON |
| 4 — Interaction | state machines, spec sheets | Mermaid stateDiagram-v2, XState v5 |
| 5a — Hi-Fi | screenshots, variants | Playwright + Excalidraw |
| 5b — Design System | design tokens, DESIGN.md | DTCG v2025.10 + Google DESIGN.md |

---

## Trust posture

design-os never claims WCAG conformance — it reports measured contrast ratios. It never uses synthetic personas as primary research — it marks generated personas as `provenance: proto` and requires you to validate them. It never auto-publishes to your git tree — all output lands in `.design-os/preview/` first, and you run `--apply` to commit. The references corpus ([`references/`](./references/)) cites canon: Garrett, Wodtke, Saffer, Cagan, Frost.

---

## Status

**GA — v2.0.0**

- All 5 pipeline stages implemented and gate-verified.
- 1395 tests passing (tsc clean; lint-determinism clean).
- Coexistence eval calibration ongoing toward the 0.80 GA threshold.
- Released after 4 internal phases + multi-pass code review.

See [ROADMAP.md](.planning/ROADMAP.md) for the full Phase 4 plan.

---

## Documentation

- [CLAUDE.md](./CLAUDE.md) — technology stack, project constraints, conventions
- [skills/design/SKILL.md](./skills/design/SKILL.md) — the skill body Claude Code reads
- [references/](./references/) — reference corpus (Garrett, Wodtke, Saffer, Frost, Cagan)
- [.planning/](.planning/) — execution history, decisions, verifier results

---

## Contributing

Issues and PRs welcome at [github.com/Michal-Pi/design-process](https://github.com/Michal-Pi/design-process). A MAINTAINERS.md guide will be published with v2.0 GA.

---

## License

[Apache-2.0](./LICENSE) — Copyright 2026 Michal Pilawski
