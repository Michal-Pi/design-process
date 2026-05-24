# Phase 1: v1.5 — Infrastructure & Determinism Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 1-v1.5 Infrastructure & Determinism Foundation
**Mode:** `--auto` (Claude selected recommended option for every gray area; no AskUserQuestion shown to user)
**Areas discussed:** Schema authoring, Handoff-bundle generation, Gate-runner API, Determinism CI scope, Aggregate coexistence eval, PII scanner, Routing-matrix scaffolding, Host-compatibility matrix CI, Reference corpus, Schema migration & frontmatter, Anthropic-Labs watcher

---

## Schema authoring & emit

| Option | Description | Selected |
|--------|-------------|----------|
| Zod-first single source of truth with `zod-to-json-schema` emit | One Zod source per artifact type → emit versioned JSON Schema for runtime use | ✓ |
| Hand-author JSON Schema directly | Skip Zod; treat JSON Schema files as canonical | |
| TypeBox / @sinclair | Schema-as-TypeScript with built-in JSON Schema emit | |

**Auto-selected:** Zod-first. Aligns with STACK.md and user-level CLAUDE.md TS discipline (Zod for runtime boundary validation).

---

## Handoff-bundle generation

| Option | Description | Selected |
|--------|-------------|----------|
| LLM-summarized body inside deterministic frame | LLM "picks" salience; script enforces shape, schema, token budget | ✓ |
| Fully script-templated extraction | Deterministic extraction from artifacts; LLM not in the loop | |
| Fully LLM-authored | LLM produces the whole bundle including frame | |

**Auto-selected:** Hybrid (LLM picks, script frames) — matches the package's "LLM picks, scripts emit" architectural rule applied to summarization specifically.

---

## Gate-runner API

| Option | Description | Selected |
|--------|-------------|----------|
| Async function returning discriminated-union `GateResult` | Function-based; types catch missing handler at compile time | ✓ |
| Class with `.run()` method | OOP shape; harder to compose | |
| Sync CLI returning JSON to stdout | Simpler interop; loses type-safety | |

**Auto-selected:** async + discriminated union. Composes with Node ESM emit scripts; type-safe.

---

## Determinism CI gate scope

| Option | Description | Selected |
|--------|-------------|----------|
| Emit / lint / validate / build / gate scripts only | LLM-touched paths excluded; clear architectural boundary | ✓ |
| All `assets/scripts/` files | Maximum scope; includes scripts that delegate to LLM | |
| User-configurable allowlist | Flexible; risks deferred decisions becoming permanent debt | |

**Auto-selected:** Emit / lint / validate / build / gate scripts only. Pairs with the `lint-determinism.mjs` architecture rule that rejects LLM-client imports inside `assets/scripts/`.

---

## Aggregate coexistence eval composition

| Option | Description | Selected |
|--------|-------------|----------|
| Top 5 by install count (GSD, Superpowers, frontend-design, shadcn, Notion-MCP) | Most realistic mid-2026 coexistence scenario | ✓ |
| Synthetic 5-package skill stub corpus | Lower fidelity; easier to maintain | |
| User-configurable | Per-team realism; harder to use as a default release gate | |

**Auto-selected:** Top 5 by install count. SUMMARY.md explicitly recommends this set.

---

## PII scanner approach

| Option | Description | Selected |
|--------|-------------|----------|
| Regex-based + Luhn for credit cards + allowlist | Deterministic; zero-infra; auditable | ✓ |
| ML-based (Presidio / spaCy) | Higher recall on edge cases; adds infra | |
| Hybrid regex + ML | Most coverage; most cost | |

**Auto-selected:** Regex + Luhn + allowlist. Matches zero-infra principle (no vector DB, no model dependencies).

---

## Routing-matrix scaffolding scope

| Option | Description | Selected |
|--------|-------------|----------|
| Wire all 7 routes; stub 3 not in v2.0a scope | Clean v2.0a → v2.0b integration; trigger-discipline visible early | ✓ |
| Wire only the 4 routes shipped in v2.0a | Less code; routes added on-demand | |
| Wire all 7 with full implementations now | Pulls Phase 2/3 work into Phase 1 | |

**Auto-selected:** Wire all 7, stub the 3 not in v2.0a scope (`ROUTE_NOT_YET_IMPLEMENTED`).

---

## Host-compatibility matrix CI mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| In-repo `vitest` workspaces with 3 host profiles | Local; no external infra; matches workspaces pattern from STACK.md | ✓ |
| Hosted multi-runner (e.g., GitHub Actions per host) | Closer to real hosts; slower; needs secrets | |
| Manual smoke test per host | Cheapest; not CI-gated | |

**Auto-selected:** In-repo `vitest` workspaces. Claude Code passes fully; Codex CLI + Cursor stubbed with sequential-fallback.

---

## Reference corpus authoring depth

| Option | Description | Selected |
|--------|-------------|----------|
| Condensed Markdown ≤2k tokens + canon citations | Copyright-safe; maintainable; LLM can deepen via Context7 if needed | ✓ |
| Full canon excerpts | Maximum information; copyright + bloat risk | |
| Citation-only stubs | Smallest footprint; relies heavily on Context7 / external lookups | |

**Auto-selected:** Condensed + citations. P4 ("Sourced opinions, cited at rule granularity") satisfied without copyright exposure.

---

## Schema migration & frontmatter validation

| Option | Description | Selected |
|--------|-------------|----------|
| Per-script migrations + strict frontmatter validator (with lenient flag for legacy) | Auditable; minimizes blast radius of schema bumps | ✓ |
| Single all-in-one migration script per release | Easier to invoke; harder to test individually | |
| No migrations; bump major version and break | Simplest; punishes users | |

**Auto-selected:** Per-script migrations + strict frontmatter validator. Aligns with the "schema versioning without migration tooling is a HIGH-severity pitfall" finding from PITFALLS.md.

---

## Anthropic-Labs watcher mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: weekly named-maintainer review + daily GitHub Actions cron | Accountable human + cheap automation | ✓ |
| Manual weekly review only | Cheapest; relies entirely on human reliability | |
| Fully automated agent (Claude scheduled) | Highest cost; no human accountability | |

**Auto-selected:** Hybrid. The watcher mitigates Pitfall 9 (GTM kill-risk, MRD §12 Existential); accountable maintainer + cheap cron is the right balance.

---

## Claude's Discretion

The following decisions were left to the Phase 1 planner (downstream agent) because they are implementation-level, not strategic:

- Exact directory layout under `assets/scripts/` (e.g., flat vs `scripts/gates/`, `scripts/emit/`).
- Logging library — `pino` / `winston` / raw `console.error` per existing Node 22 LTS norms.
- `pnpm` workspaces vs `npm` workspaces for `evals/` host profiles.
- Whether `schemas/dist/` commits to git or is regenerated in CI.
- Test framework — `vitest` 2 was specified in STACK.md; planner confirms.

## Deferred Ideas

Captured for future phases (not in scope for Phase 1):

- Tokens Studio Figma export ingestion → v2.1
- Optimal Workshop tree-test CSV ingestion → v2.1 (atom `ia/tree-test-design`)
- Dovetail / Notably interview-transcript ingestion → v2.2
- Notion / Linear / Google Doc PRD ingestion → v2.1 (Notion limited to Gaia Logic per CLAUDE.md)
- Voice → PRD interview mode (Whisper) → v2.2
- `design-os-bridges` (Material Web / Vue / Svelte adapters) → v2.1 sibling package
- Storybook MCP via Chromatic integration → v2.1
- Enterprise design-process-compliance SKU → year-2+ sibling product
- VS Code Copilot host parity → v2.1+ (depends on VS Code Agent Skills GA)
- Junie host parity → v2.1+ (host churn)
- `audit --reverse-engineer-stages` → Phase 3 (v2.0b) — explicitly NOT in v1.5
- Stage 3 structural-diversity metric design → Phase 3 deep research
- Reverse-engineer fidelity adversarial fixtures → Phase 3 research
