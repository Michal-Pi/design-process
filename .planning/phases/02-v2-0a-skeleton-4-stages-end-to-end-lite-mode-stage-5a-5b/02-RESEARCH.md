# Phase 2: v2.0a Skeleton — Research

**Researched:** 2026-05-25
**Domain:** SKILL.md workflow authoring + deterministic Node ESM emit scripts + stage-gate implementation + adversarial CI + DTCG/DESIGN.md emit
**Confidence:** HIGH — all findings anchored to Phase 1 SUMMARY.md files (verified in-session), CONTEXT.md locked decisions (D-32..D-53), and project research corpus (ARCHITECTURE.md, PITFALLS.md, STACK.md)

---

<user_constraints>
## User Constraints (from 02-CONTEXT.md)

### Locked Decisions
D-32: Structured-frontmatter SKILL.md + numbered procedure body (agentskills.io v1 format).
D-33: Atom SKILL.md bodies have `## Standalone bootstrap` + `## Workflow procedure` dual sections.
D-34: One sub-agent per stage workflow; atoms invoked inline within the stage sub-agent context via `run-subagent.mjs`.
D-35: Auto-detect PRD via routing registry; fall back to Lenny 1-pager interview if absent or < 50 tokens structured content.
D-36: LLM-generated proto-personas using Indi Young thinking-style format; always `provenance: generated`; `ASSUMPTIONS.md` required co-artifact.
D-37: Synthetic-persona hard-block enforced by `gate-stage-1.mjs` (script), not LLM; `evidence: VALIDATED` requires at least one `provenance: "validated"` persona + non-empty `interviews/`.
D-38: `worstProvenance` propagates from persona citations into all downstream artifact frontmatter, enforced by `frontmatter-validate.mjs`.
D-39: `structure` workflow generates 2-5 LATCH-diverse sitemap variants via `ia/sitemap-variants` atom; user picks; `ia/flows-from-jobs` atom generates one Mermaid flowchart per JTBD.
D-40: `gate/stage-2-complete` checks: sitemap covers all JTBDs, no orphan nodes, Mermaid flows syntactically valid; returns `(pass_with_warnings, proto)` when no tree-test data.
D-41: `tokens/emit` atom reads user's `@theme` block / Tailwind config; extracts primitives; `tokens-project.mjs` emits DTCG v2025.10 JSON with three tiers (primitive, semantic, component).
D-42: All style-lite output labeled `stage: 5a-lite, evidence: INFERRED`; schema enforces this; `evidence: validated` rejected.
D-43: `gate/stage-5a-complete` is hard-coded to return `{kind: 'not_runnable', reason: 'stage-4-artifacts-absent'}` — NEVER override.
D-44: Component promotion requires ≥1 appearance in Stage 5a output; gate records count with `worstProvenance: inferred` note; Frost ≥3× deferred to Phase 3.
D-45: `audit --pr` uses `git diff --name-only HEAD~1` (or `$GITHUB_BASE_REF`) to enumerate changed files; routes each to the Stage 5a or 5b detector.
D-46: `audit --slop-tells` is fully deterministic regex matching; no LLM judgment.
D-47: `AUDIT-REPORT.md` validated against `schemas/dist/audit-report.v1.json`; finding ID schema `<stage>-<type>-<seq>`.
D-48: Adapter detection uses Phase 1 `registry.mjs` heuristics; Next 15 + Tailwind v4 + shadcn is primary fixture; plain-CSS fallback; `--adapter <name>` overrides.
D-49: Soft warn at p50 target; hard-stop with `--continue-anyway` prompt at 2× p50; post-hoc measurement in run-log.
D-50: Three adversarial CI suites: RED-05 (100 synthetic-persona prompts), RED-06 (≥10 injection canary), `worstProvenance` propagation.
D-51: `evidence: INFERRED` is the only schema-valid value for v2.0a Stage 5a/5b artifacts; `frontmatter-validate.mjs` enforces.
D-52: All writes stage into `.design-os/preview/run-<id>/` first; `--apply` flag required to copy to `design/` via `apply.mjs`.
D-53: Phase 2 ships Claude Code host-first; Codex CLI + Cursor exercise-tested via Phase 1 host-profile workspaces; each workflow SKILL.md includes `## Host fallback` section.

### Claude's Discretion
- Directory layout under `skills/workflows/` and `skills/atoms/`
- Structured log format for per-run token telemetry
- Fixture naming convention for adversarial CI suite
- `apply.mjs` implementation (fs.copyFile vs globby batch)
- `tokens-project.mjs` internal adapter dispatch (switch vs separate modules)
- Slop-tell pattern file format (hardcoded vs loaded from heuristics.md)

### Deferred Ideas (OUT OF SCOPE)
Phase 3: Stage 3 sketch, Stage 4 interact, full gate/stage-5a-complete, audit --reverse-engineer-stages, Frost ≥3× gate, new-product full route, mature-app-refactor, DS-extraction, schema migration v2.0a → v2.0b, Stage 3+4 reference corpus.
Phase 4: 15-fixture acceptance suite, Codex/Cursor formal parity gate, designer/PM blind reviews.
v2.1+: Notion ingestion, tree-test CSV, design-os-bridges, Tokens Studio, Dovetail, voice PRD, i18n/RTL.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIST-04 | Claude Code is the host-first target (full subagent dispatch supported) | D-53 + `run-subagent.mjs` from Phase 1 Plan 05 |
| WF-01 | `ingest` (Stage 0) workflow — PRD parse + interview fallback | D-35; `registry.mjs` PRD-detect extension |
| WF-02 | `discover` (Stage 1) workflow — personas, JTBDs, OST, assumptions, gate-1 | D-36..D-38; `gate-stage-1.mjs` extension |
| WF-03 | `structure` (Stage 2) workflow — LATCH-diverse sitemaps, Mermaid flows, gate-2 | D-39..D-40; `mermaid-render.mjs` |
| WF-06 | `style` (Stage 5a lite) workflow — 3 variants, DTCG tokens, INFERRED labeling | D-41..D-43; `tokens-project.mjs` (new) |
| WF-07 | `systematize` (Stage 5b lite) workflow — component promotion stub, DESIGN.md emit | D-44; `design-md-validate.mjs` |
| WF-08 | `audit` (basic) — slop-tells + `--pr` Stage 5a/5b detectors + severity ranking | D-45..D-47 |
| WF-09 | All workflows support `--depth lightweight|standard|full` | Routing registry budgets per D-49 |
| ATOM-01 | `prd/parse-or-interview` atom (Stage 0) | D-35; Lenny 1-pager reference |
| ATOM-02 | `research/synthesize` atom (Stage 1) | Stage 1 handoff bundle composition |
| ATOM-03 | `research/personas-proto` atom (Stage 1, provenance enforcement) | D-36..D-37 |
| ATOM-04 | `research/build-ost` atom (Stage 1, Torres OST) | `references/torres-ost.md` |
| ATOM-05 | `ia/sitemap-variants` atom (Stage 2, LATCH-diverse) | D-39; `variant-distance.mjs` extension |
| ATOM-06 | `ia/flows-from-jobs` atom (Stage 2, Mermaid per JTBD) | D-39; `mermaid-render.mjs` |
| ATOM-13 | `hifi/variants-preview` atom (Stage 5a, preview + screenshot) | Phase 1 preview harness |
| ATOM-14 | `tokens/emit` atom (Stage 5b, DTCG → 3 adapters) | D-41; `tokens-project.mjs` |
| GATE-08 | `gate/stage-5a-complete` returns `not_runnable` when `design/interactions/` is empty | D-43; Phase 1 `stage-5a.mjs` already ships this |
| FID-01 | Stage 1 refuses solution-language output | Enforced in `research/personas-proto` atom procedure |
| FID-02 | Stage 2 sitemaps emit text + Mermaid boxes only; no colors, no typography | D-39; gate-2 checklist |
| FID-05 | Stage 5a refuses to render hi-fi when `design/interactions/` is empty | D-43; already in `gate-stage-5a.mjs` |
| RED-01 | Stage 1 hard-blocks `VALIDATED` when only synthetic personas present | D-37; `gate-stage-1.mjs` implementation |
| RED-02 | Every persona JSON carries `provenance:` frontmatter | D-36; `persona.v1.json` schema |
| RED-03 | `ASSUMPTIONS.md` required when `provenance: generated` present | D-36; gate-1 checklist |
| RED-04 | `worstProvenance` propagates downstream | D-38; `frontmatter-validate.mjs` extension |
| RED-05 | 100 adversarial prompts assert 100% block on synthetic-only Stage 1 | D-50; `evals/adversarial/` |
| RED-06 | Prompt-injection canary asserts red line cannot be bypassed | D-50; `evals/adversarial/` |
| ROUTE-02 | `new-feature` route (partial — delta Stage 2 + Stage 5a; skip-with-warning Stage 1) | `dispatch.mjs` extension |
| ROUTE-04 | `design-bug` route (Stage 5a-lite touch-up only) | `dispatch.mjs` extension |
| ROUTE-05 | `brand-refresh` route (Stages 5a+5b only) | `dispatch.mjs` extension |
| ROUTE-07 | `PR-audit` route (`audit --pr` cross-stage diff; ≤15k tokens) | D-45..D-47 |
| ROUTE-09 | User can pick route via `design --route <name>` | `dispatch.mjs` already ships this |
| AUDIT-01 | `audit` — Stage 5a/5b detectors only in v2.0a | D-45..D-46 |
| AUDIT-03 | `audit --slop-tells` deterministic linters | D-46; `slop-tells.mjs` (new) |
| AUDIT-05 | Finding IDs: `<stage>-<type>-<seq>` | D-47 |
| AUDIT-08 | `AUDIT-REPORT.md` validated against `audit-report.v1.json` | D-47; Plan 01-01 schema |
| ADAPT-01 | DTCG → Tailwind v4 `@theme` adapter | D-41; `tokens-project.mjs` |
| ADAPT-03 | DTCG → shadcn CSS vars + plain CSS adapter | D-41; `tokens-project.mjs` |
| MVPA-01..08 | Full v2.0a MVP scope deliverables | Addressed across D-32..D-53 |
| COST-01,02,05,06,08,09 | Per-stage and per-route token budgets enforced | D-49; tiktoken from `handoff-bundle-build.mjs` |
</phase_requirements>

---

## Summary

Phase 2 builds on a complete Phase 1 foundation (467 tests, 5/5 plans). The research question is not "what technology to use" — all stack pins are locked — but "how exactly do 22 locked decisions translate into implementable plans with clean dependency boundaries, predictable verification steps, and no gaps."

The central implementation challenge is the SKILL.md procedure body itself: each workflow must coordinate between LLM-side work (persona generation, sitemap design, token picking) and script-side emit (`tokens-project.mjs`, `gate-stage-1.mjs`, `apply.mjs`). Pattern 1 (LLM picks, scripts emit) and Pattern 3 (compact handoff bundles) are the load-bearing contracts; violating either in any workflow body creates a regression.

The synthetic-persona red line (RED-01..06) is the Phase 2 discipline moment. Stage 1's gate already has a skeleton in Phase 1's `gate-stage-1.mjs`; Phase 2 must fill in the provenance-checking business logic and create the 100-prompt adversarial corpus. The `frontmatter-validate.mjs` extension for `worstProvenance` propagation (D-38) is a cross-cutting concern that affects every workflow producing downstream artifacts.

**Primary recommendation:** Organize Phase 2 into five plans with a clear dependency DAG: (1) Stage 1 gate + adversarial CI + discover workflow; (2) structure workflow + Mermaid flows + stage-2 gate; (3) style-lite workflow + tokens-project.mjs + hifi/variants-preview atom; (4) systematize-lite workflow + DESIGN.md emit + stage-5b gate; (5) audit (slop-tells + --pr) + apply.mjs + cross-host scaffold + end-to-end fixture. Plans 1-2 are sequentially dependent; Plans 3-4 can run in parallel after Plan 2; Plan 5 depends on all of Plans 1-4.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Persona generation | LLM (subagent, Stage 1) | Script (gate enforcement) | LLM picks narrative; script validates provenance schema |
| Provenance enforcement | Script (`gate-stage-1.mjs`, `frontmatter-validate.mjs`) | — | Must be deterministic; LLM is adversarial here (RED-01..06) |
| Sitemap variant generation | LLM (Stage 2 subagent) | Script (`variant-distance.mjs` extension) | LLM generates candidates; script scores diversity |
| Mermaid flow emit | LLM picks JTBD flow shape; `mermaid-render.mjs` validates | — | Pattern 1; LLM can't be trusted to emit valid Mermaid syntax |
| DTCG token emit | Script (`tokens-project.mjs`) | LLM picks scale anchors | Pattern 1; deterministic emit required by golden tests |
| Adapter detection | Script (`registry.mjs` extension) | — | Deterministic heuristic; no LLM judgment needed |
| Slop-tell detection | Script (`slop-tells.mjs`) | — | Pattern 1; anti-Pattern 1 is LLM-based critique |
| PR diff walking | Script (`stage-5a-pr.mjs`, `stage-5b-pr.mjs`) | — | Bounded by git CLI; deterministic |
| Staging area write | Script (`apply.mjs`) | — | TRUST-02; `--apply` required before any `design/` write |
| Token budget tracking | Script (`handoff-bundle-build.mjs` tiktoken) | Run-log telemetry | D-49; soft/hard limits enforced by scripts |
| Adversarial CI | Script (gate invocation assertions) | Vitest test runner | RED-05/06 must be deterministic at the gate level |
| Host dispatch | `run-subagent.mjs` (host detection) | Workflow `## Host fallback` section | D-53; Claude Code host-first; sequential fallback for Codex/Cursor |

---

## Section 1: Phase Decomposition Strategy

### Dependency DAG

```
Plan 02-01 (Stage 1 gate + discover workflow + adversarial CI)
    │
    ↓
Plan 02-02 (Stage 2 gate + structure workflow + Mermaid flows)
    │
    ├── Plan 02-03 (style-lite workflow + tokens-project.mjs + hifi/variants-preview)
    │         │
    └──────────┤
              ↓
        Plan 02-04 (systematize-lite workflow + DESIGN.md emit + stage-5b gate)
              │
              ↓
        Plan 02-05 (audit + apply.mjs + ingest workflow + end-to-end fixture + cross-host)
```

Plans 02-03 and 02-04 share no files; they CAN run in parallel once Plan 02-02 completes if the team has parallel capacity (config.json `parallelization: true`). Plan 02-05 requires all prior plans because the end-to-end fixture exercises all stages.

### Plan-to-Success-Criteria Coverage

| Plan | Primary Success Criterion | REQ-IDs Addressed |
|------|--------------------------|-------------------|
| 02-01 | SC-2: Stage 1 gate blocks 100/100 synthetic-only (RED-05); `worstProvenance` propagation | WF-02, ATOM-02..04, GATE-08 skeleton, RED-01..06 |
| 02-02 | SC-1 partial: discovers workflow + structure produces sitemap.json + flows | WF-03, ATOM-05..06, FID-02, HAND-03 |
| 02-03 | SC-1 + SC-3: style-lite workflow runs under 55k tokens; DTCG emit + preview | WF-06, ATOM-13..14, ADAPT-01/03, COST-05 |
| 02-04 | SC-1 completion: DESIGN.md + systematize-lite completes the PRD → artifacts chain | WF-07, MVPA-04, COST-06 |
| 02-05 | SC-1 (end-to-end), SC-3 (all budgets), SC-4 (audit working), SC-5 (cross-host scaffold) | WF-01/08, AUDIT-01/03/05/08, DIST-04, D-52, D-53 |

### Testable Deliverables per Plan

Each plan delivers exactly one thing a human reviewer can verify end-to-end:

- **02-01**: Run `gate --stage 1` on a fixture with synthetic-only personas → asserts `pass_with_warnings` + `evidence: proto`; adversarial corpus of 100 prompts all return the same.
- **02-02**: Run `design --route new-feature` on the eval fixture through Stage 2 only → `design/ia/sitemap.json` + `design/ia/flows/*.flow.mmd` exist and are schema-valid.
- **02-03**: Run `design --route brand-refresh` → `design/tokens.json` (DTCG) + `.design-os/preview/run-<id>/` screenshots exist; `gate/stage-5a-complete` returns `not_runnable`.
- **02-04**: Run `design --route brand-refresh` end-to-end → `design/DESIGN.md` emitted, validates against `design-md.2026.04.json`; `gate/stage-5b-complete` returns `pass_with_warnings`.
- **02-05**: Run `design --route new-feature` on the Next 15 + Tailwind v4 + shadcn fixture from PRD to `design/` → all artifacts exist; `audit --pr` returns severity-ranked `AUDIT-REPORT.md`; cross-host smoke on Codex/Cursor sequential paths passes within 0.10.

---

## Section 2: Workflow Architecture

### How SKILL.md Files Compose

**Top-level `skills/design.md`** (Phase 1 skeleton — Phase 2 extends the body):
- Reads repo signals via `registry.mjs` to suggest a route (ROUTE-08 already implemented)
- Dispatches to the stage sub-agent via `run-subagent.mjs` per D-34
- Each stage workflow lives at `skills/workflows/<stage>.md`

**Workflow SKILL.md structure** (D-32):
```yaml
---
name: "design-os/<stage>"
description: "<≤200 chars, trigger-phrase-front-loaded>"
stage: <N>
gate: gate/stage-N-complete
artifacts:
  reads: [design/.handoff/stage-N-1-bundle.md, ...]
  writes: [design/<stage-outputs>/..., design/.handoff/stage-N-bundle.md]
composition:
  atoms: [<atom1>, <atom2>, ...]
mvp: true
compatibility: [claude-code, codex-cli, cursor]
allows-tools: [Read, Write, Bash]
---

## Workflow procedure

1. Read `design/.handoff/stage-N-1-bundle.md`
2. Load stage-scoped references
3. TRUST-05 intake: ask 3-5 questions before generating
4. [Inline atom steps]
5. Bash: node assets/scripts/gates/stage-N.mjs --design-dir <path>
6. Bash: node assets/scripts/handoff-bundle-build.mjs --stage N --design-dir <path>
7. Bash: node assets/scripts/manifest-reconcile.mjs --design-dir <path>
8. Present diff to user; await --apply

## Host fallback
[Sequential steps for Codex/Cursor without subagent dispatch]
```

**Atom SKILL.md structure** (D-33):
```yaml
---
name: "design-os/<stage>/<atom>"
description: "<≤200 chars>"
stage: <N>
mvp: true
---

## Standalone bootstrap
[Reads available design/ artifacts; if absent, asks minimum questions]

## Workflow procedure
[Numbered steps invoked inline by the stage workflow]
```

### Phase 1 Dispatcher Integration

Phase 1 `dispatch.mjs` currently returns `{ kind: 'route_stub_dispatched', status: 'implemented-stub' }` for the 4 implemented routes without executing stage workflows. Phase 2 must replace the stub return with actual calls to `run-subagent.mjs` for each required stage. The integration point is:

```javascript
// dispatch.mjs — Phase 2 replaces the stub return with:
const stageResults = [];
for (const stage of route.requiredStages) {
  const result = await runSubagent({
    prompt: `skills/workflows/${stageWorkflowName}.md`,
    context: { designDir, bundlePath: `design/.handoff/stage-${prevStage}-bundle.md` },
  });
  stageResults.push(result);
}
```

[VERIFIED: `assets/scripts/routing/dispatch.mjs` in-session review, 2026-05-25]

### Gate Runner Integration

Phase 1's `runGate(stage, designDir, config)` in `assets/scripts/gates/base.mjs` dispatches to per-stage functions. Phase 2 extends `stage-1.mjs` and `stage-2.mjs` with real checklist logic. The pattern:

1. Each workflow SKILL.md procedure ends with: `Bash: node assets/scripts/cli/gate.mjs --stage N --design-dir <path>`
2. `gate.mjs` CLI calls `runGate()` which calls the per-stage function
3. Result is written to `manifest.lock` via `appendManifestLockEntry()`
4. If result is `failed_after_repair` or `not_runnable`, workflow halts and surfaces message

The `stage-5a.mjs` behavior (hard-coded `not_runnable` for empty `interactions/`) is already live from Phase 1 Plan 02. Phase 2 must NOT touch it.

### Handoff Bundle Flow

Between each stage, `handoff-bundle-build.mjs` synthesizes `design/.handoff/stage-N-bundle.md` with tiktoken cl100k_base budget enforcement (3k floor, 15k ceiling). Phase 2 must add the Stage 1→2 and Stage 2→5a transition bundles to the sufficiency eval (`evals/bundles/fixtures/`). The Phase 1 fixtures already include placeholder entries for `stage-1-to-2` and `stage-2-to-3` — Phase 2 replaces placeholders with real upstream content.

[VERIFIED: `evals/bundles/fixtures/stage-1-to-2/` and `evals/bundles/fixtures/stage-2-to-3/` exist, 2026-05-25]

---

## Section 3: Stage-by-Stage Implementation Approach

### Stage 0 — `ingest` (W0, ATOM-01)

**Inputs:** User's repo (scanned by `registry.mjs`), optional `PRD.md` or `PRD*.md`

**Outputs:** `design/PRD.md` (normalized, frontmatter-validated), `design/.handoff/stage-0-bundle.md`

**LLM vs script boundary:**
- Script: `registry.mjs` detects existing PRD file (deterministic filesystem scan)
- Script: `frontmatter-validate.mjs` validates emitted `design/PRD.md`
- Script: `init.mjs` creates `design/` directory structure if absent
- LLM: Lenny 1-pager interview questions (if no PRD), PRD normalization

**Gate invocation:** No gate at Stage 0 in v2.0a (gate-0 is not in scope); handoff bundle emitted.

**Token budget:** No explicit p50 target for Stage 0; ingest is a pass-through. Lenny interview mode is 5-7 questions × ~200 tokens each ≈ 1-2k tokens. PRD parse is bounded by PRD size.

**Atoms:** `prd/parse-or-interview` (ATOM-01)

**Key detail:** `design-os init` call from Phase 1 `init.mjs` is invoked first to create `.gitignore`/`.gitattributes` defaults if absent (D-52 prerequisite — staging area needs `.design-os/preview/` to exist).

### Stage 1 — `discover` (W1, ATOM-02..04)

**Inputs:** `design/.handoff/stage-0-bundle.md` + `references/garrett-elements.md` + `references/cooper-goodwin.md` + `references/torres-ost.md` + `references/klement-jtbd.md` + `references/indi-young-thinking-styles.md`

**Outputs:**
- `design/research/personas/<name>.persona.json` (schema: `persona.v1.json`; `provenance: generated`)
- `design/research/jobs/<name>.jtbd.md` (Klement format)
- `design/research/findings.md` + `competitive.md` + `ost.mmd`
- `design/ASSUMPTIONS.md` (required when any persona has `provenance: generated`)
- `design/.handoff/stage-1-bundle.md`

**LLM vs script boundary:**
- LLM: persona narrative content, JTBD formulation, OST synthesis, findings synthesis
- Script: `gate-stage-1.mjs` — reads `personas/*.persona.json` frontmatter, enforces provenance rule
- Script: `frontmatter-validate.mjs` — validates `worstProvenance` propagation in `findings.md`
- Script: `handoff-bundle-build.mjs` — emits bundle within 15k token ceiling

**Gate invocation:** `design-os gate --stage 1 --design-dir <path>`

Gate business logic (Phase 2 fills in `stage-1.mjs` skeleton):
```javascript
// In runStage1Gate(designDir):
const personaFiles = glob(`${designDir}/research/personas/*.persona.json`);
const allSynthetic = personaFiles.every(p => p.provenance === 'generated');
const interviewsExist = existsSync(`${designDir}/research/interviews/`) &&
                        readdirSync(`${designDir}/research/interviews/`).length > 0;
if (allSynthetic && !interviewsExist) {
  return { kind: 'pass_with_warnings', evidence: 'proto',
           findings: [{ id: '1-provenance-001', severity: 'WARNING',
                        message: 'All personas synthetic — VALIDATED grade blocked' }] };
}
// Mixed: grade = 'proto' unless at least one validated persona
const worstProvenance = computeWorstProvenance(personaFiles);
return { kind: 'pass', evidence: worstProvenance === 'validated' ? 'validated' : 'proto', findings: [] };
```

**Token budget:** p50 ≤30k (COST-01). Hard-stop at 60k (2× p50, D-49).

**Atoms:** `research/personas-proto` (ATOM-03) → `research/build-ost` (ATOM-04) → `research/synthesize` (ATOM-02)

### Stage 2 — `structure` (W2, ATOM-05..06)

**Inputs:** `design/.handoff/stage-1-bundle.md` + `references/rosenfeld-ia.md`

**Outputs:**
- `design/ia/sitemap.json` (schema: `sitemap.v1.json`; LATCH scheme annotated; `worstProvenance` from Stage 1)
- `design/ia/flows/<flow-name>.flow.mmd` (one per JTBD; validated by `mermaid-render.mjs`)
- `design/.handoff/stage-2-bundle.md`

**LLM vs script boundary:**
- LLM: generates 2-5 LATCH-diverse sitemap JSON candidates, selects per user pick
- LLM: generates Mermaid flowchart source text per JTBD (text only)
- Script: `variant-distance.mjs` extension — structural diversity check on sitemap candidates (new Phase 2 addition to existing 6-axis visual metric)
- Script: `mermaid-render.mjs` — validates Mermaid syntax (headless render via `@mermaid-js/mermaid-cli`); rejects invalid syntax, triggers LLM repair (max 2 repair cycles)
- Script: `gate-stage-2.mjs` — checklist: sitemap covers all JTBDs, no orphan nodes, flows valid

**FID-02 enforcement:** Gate-2 checklist includes a structural check: if any `sitemap.json` node has `color` or `font` fields, gate returns `failed`. This must be added to the Stage 2 checklist in `references/gates/stage-2.md` and enforced by `gate-stage-2.mjs`.

**Gate invocation:** `design-os gate --stage 2 --design-dir <path>`

**Token budget:** p50 ≤25k (COST-02). Hard-stop at 50k.

**Atoms:** `ia/sitemap-variants` (ATOM-05) → user picks → `ia/flows-from-jobs` (ATOM-06)

### Stage 5a-lite — `style` (W6-lite, ATOM-13..14 partial)

**Inputs:** `design/.handoff/stage-2-bundle.md` + user's `tailwind.config.css` / CSS `@theme` block (detected by `registry.mjs`) + `references/shadcn-tailwind-v4.md` + `references/dtcg-v2025-10.md` + `references/wcag-2-2.md`

**Outputs:**
- `.design-os/preview/run-<id>/` — 3 hi-fi preview variants (screenshots via Playwright)
- `design/tokens.json` (DTCG v2025.10, 3 tiers; `stage: 5a-lite, evidence: INFERRED`)
- `design/.handoff/stage-5a-bundle.md`

**LLM vs script boundary:**
- LLM: picks color palette anchors, scale decisions (font size ratio, spacing scale, radius choice)
- Script: `tokens-project.mjs` (new Phase 2 deliverable) — emits validated DTCG JSON from LLM-picked values; three adapter outputs: Tailwind v4 `@theme` block, shadcn CSS vars, plain `:root` CSS
- Script: `oklch.mjs` (Phase 1) — OKLCH ↔ sRGB conversion
- Script: `contrast.mjs` (Phase 1) — WCAG contrast measurement (reported, never claimed)
- Script: `port-manager.mjs` + `playwright-runner.mjs` (Phase 1) — preview spawn + screenshot
- Script: `variant-distance.mjs` (Phase 1) — 6-axis visual-style diversity check on 3 variants
- Script: `gate-stage-5a.mjs` (Phase 1) — already hard-coded `not_runnable`; DO NOT MODIFY

**`tokens-project.mjs` implementation notes:**
- Reads adapter signal from `registry.mjs` `detectStack()` return
- Adapter dispatch: discriminated union on adapter name (matching `registry.mjs` pattern)
- Validates emitted DTCG JSON against `schemas/dist/sitemap.v1.json` ... actually against DTCG spec via `dtcg-lint.mjs` (Phase 1 already ships this as a lint gate)
- Three emitted files: `design/tokens.json` (DTCG), `app/globals.css` (`@theme` block), an optional `design/tokens.css` (plain `:root`)
- All emitted artifacts carry `stage: 5a-lite, evidence: INFERRED` in frontmatter

**Token budget:** p50 ≤55k (COST-05). Hard-stop at 110k.

**Atoms:** `tokens/emit` (ATOM-14) → `hifi/variants-preview` (ATOM-13)

### Stage 5b-lite — `systematize` (W7-lite)

**Inputs:** `design/.handoff/stage-5a-bundle.md` + `design/tokens.json`

**Outputs:**
- `design/DESIGN.md` (Google DESIGN.md spec, April 2026; `$extensions.design-os`; `evidence: INFERRED`)
- `design/tokens.json` updated with component-tier tokens (DTCG component tier)
- `design/.handoff/stage-5b-bundle.md`

**LLM vs script boundary:**
- LLM: selects component names from Stage 5a preview artifacts; writes DESIGN.md narrative sections
- Script: `design-md-validate.mjs` (Phase 1) — validates against `design-md.2026.04.json`; rejects on spec deviation
- Script: `dtcg-lint.mjs` (Phase 1) — validates component tier additions to `tokens.json`
- Script: `gate-stage-5b.mjs` — checklist: DTCG valid, DESIGN.md valid, at least one component promoted

**Component promotion (D-44):** `systematize-lite` workflow scans `design/tokens.json` for component-tier token references and Stage 5a preview artifacts for component names. Any component appearing ≥1× is a candidate. Gate records count. `note: "Frost ≥3× not yet verified"` emitted per D-44.

**Token budget:** p50 ≤40k (COST-06). Hard-stop at 80k.

**No additional atoms:** Stage 5b-lite is implemented directly in the workflow body (no new v2.0a atoms for systematize).

### Basic `audit` (W8-basic)

**Inputs (--slop-tells):** User's CSS/TSX files in `components/` or `src/`, `design/tokens.json`

**Inputs (--pr):** `git diff --name-only HEAD~1` output + `design/.handoff/stage-5b-bundle.md`

**Outputs:** `design/AUDIT-REPORT.md` (validated against `audit-report.v1.json`)

**LLM vs script boundary:** Fully deterministic — zero LLM calls in audit. Pattern 1 strict.

**Token budget (PR-audit route):** p50 ≤15k (COST-09); hard-stop at 30k.

---

## Section 4: Synthetic-Persona Red Line Enforcement (RED-01..06)

### Architecture

The red line is enforced at three layers, none of which involves LLM judgment:

**Layer 1 — Schema (already ships from Phase 1):**
`schemas/dist/persona.v1.json` requires `provenance` enum (`generated|validated|inferred|missing`). Any persona JSON without this field fails `ajv` validation at write time.

**Layer 2 — Gate script (`gate-stage-1.mjs`):**
Phase 2 fills in the skeleton with provenance-checking logic. Key invariant: if `allSynthetic && !interviewsExist` → return `pass_with_warnings, evidence: proto`. The LLM cannot bypass this because it is a Node script reading filesystem state, not an LLM prompt.

**Layer 3 — Frontmatter propagation (`frontmatter-validate.mjs` extension):**
Phase 2 extends Phase 1's strict-mode validator to enforce: any `design/research/findings.md` or `design/ia/sitemap.json` that cites a persona must carry `worstProvenance:` in its frontmatter. If absent → exit 1. The extension adds a "provenance citation check" mode invoked by passing `--check-worst-provenance` flag.

### Adversarial CI Suite (D-50)

**Suite RED-05 — 100 synthetic-persona block prompts:**
- Location: `evals/adversarial/red-05-synthetic-block/`
- Structure: 100 `.txt` prompt files each feeding Stage 1 with only synthetic data
- Assertion: each prompt → `runStage1Gate(designDir)` returns `{kind: 'pass_with_warnings', evidence: 'proto'}` (NEVER `{kind: 'pass', evidence: 'validated'}`)
- Implementation: vitest test iterates over prompt corpus, constructs minimal synthetic-only fixture, invokes gate script directly (no LLM call needed — gate is pure script)

**Suite RED-06 — ≥10 injection canary prompts:**
- Location: `evals/adversarial/red-06-injection-canary/`
- Structure: ≥10 `.txt` prompts explicitly asking LLM to label personas VALIDATED or override the gate
- Assertion: `runStage1Gate(designDir)` called on a fixture built from each canary run returns `pass_with_warnings` (the gate cannot be bypassed by prompt content)
- Key insight: these tests assert gate behavior, not LLM behavior — the gate is script-only

**Suite worstProvenance propagation:**
- Location: `evals/adversarial/worst-provenance/`
- Structure: Stage 1 run fixture with 2 synthetic + 1 validated persona; downstream `findings.md`
- Assertion: `findings.md` frontmatter contains `worstProvenance: generated`

**Test runner integration:**
Extend `.github/workflows/host-matrix.yml` (Phase 1) with an adversarial CI job. Alternatively, add `evals/adversarial/` to the vitest workspace pattern in `vitest.config.ts`. Adversarial tests run on every PR via the existing CI matrix.

---

## Section 5: Cost Gate Telemetry

### Per-Stage Budget Enforcement

Phase 1's `handoff-bundle-build.mjs` already integrates tiktoken cl100k_base for bundle token counting. Phase 2 extends this with **stage-level budget tracking** in the workflow procedure bodies:

**At stage start:** Each stage workflow reads its budget hint from the route registry:
```javascript
// In stage workflow body (Bash step):
node assets/scripts/cli/budget-check.mjs --stage discover --route new-feature --check pre
```

**At stage completion:** Run-log entry records actual tokens:
```javascript
// In handoff-bundle-build.mjs (already writes bundle):
// Phase 2 addition: write token telemetry to pino run-log
logger.info({ stage, tokensUsed, budgetP50, budgetHardStop }, 'stage-complete');
```

**Soft warn (p50 target exceeded):** The workflow SKILL.md procedure includes a step: "If tokens recorded in run-log exceed p50 budget, print a NOTICE and continue." This is surfaced to the user as informational.

**Hard stop (2× p50 exceeded):** The `dispatch.mjs` stage loop (Phase 2 extension) checks run-log after each stage. If `tokensUsed > 2 * budgetP50`, dispatch halts and prompts: `"Stage N used Xk tokens (budget: Yk). Continue? [--continue-anyway / --abort]"`. This log entry is written to `decision-log.jsonl`.

**Run-log format:** Extend existing `pino` pattern from Phase 1 SKILL.md skeletons. The structured log format (Claude's Discretion) can be either a `tokenUsage` field per stage in the existing `run-log.jsonl`, or a parallel `token-budget.jsonl`. The simpler path is adding `tokenUsage` to existing run-log entries (no new file).

**CI measurement:** The 15-fixture CI suite (Phase 2 `evals/fixtures/`) records p50/p95 per stage per PR by parsing `run-log.jsonl` after each fixture run. The CI gate fails on `p50 > budgetP50` for any stage. [ASSUMED: the 15-fixture suite ships in Plan 02-05; p95 measurement requires multiple runs of the same fixture to be meaningful — the suite runs each fixture once per CI pass, making p95 a Phase 4 measurement across multiple CI runs]

### Where Tiktoken Lives

`handoff-bundle-build.mjs` (Phase 1) owns tiktoken. Phase 2 does not add a new tiktoken import. Instead, stages call `handoff-bundle-build.mjs` which returns `tokenCount` in its result object; the dispatch layer reads this count to check against budget. This avoids duplicating the token-counting logic.

---

## Section 6: Adapter Detection Heuristic

Phase 1 `assets/scripts/routing/registry.mjs` ships `detectStack(projectRoot)` with the following signal set (verified in-session from the file):

### Detection Decision Tree

```
detectStack(projectRoot):
  1. next.config.* exists? → nextjs: true
     • Read package.json devDeps for "next" version → nextMajor: 15|14|...
  2. CSS file contains "@import \"tailwindcss\"" OR "@theme" keyword?
     → tailwindV4: true  (v4 CSS-first)
  3. File at components/ui/ exists AND contains shadcn component signatures?
     → shadcn: true
  4. Vite? → vite.config.* exists → vite: true
  5. Astro? → astro.config.* exists → astro: true

Adapter selection (D-48):
  IF nextjs && tailwindV4 && shadcn → adapter: 'shadcn'
  ELIF tailwindV4 → adapter: 'tailwind-v4'
  ELIF nextjs || vite || astro → adapter: 'plain-css'
  ELSE → adapter: 'plain-css' (universal fallback)

Override: if --adapter <name> flag present → use that; skip detection
```

[VERIFIED: `assets/scripts/routing/registry.mjs` in-session review, 2026-05-25]

### Signal Reliability Notes

- **`@import "tailwindcss"` in CSS**: Tailwind v4 CSS-first config; `@theme` keyword is the `@theme { }` block. The heuristic looks for either in `*.css` files. Tailwind v3 uses a JS config file without `@theme` → reliably distinguishes v4 from v3. [CITED: STACK.md `shadcn/ui — Tailwind v4 docs` section]
- **`components/ui/` existence**: shadcn/ui installs components here by convention. The heuristic is a directory existence check + spot-check for recognizable shadcn exports (e.g., `"use client"` + `cn()` import pattern). [ASSUMED: this pattern is reliable for standard shadcn/ui installations; users with unusual directory structures may need `--adapter shadcn` override]
- **Plain-CSS fallback**: No adapter is mandatory. Any repo that doesn't match gets plain CSS. The user can override with `--adapter`. This ensures non-standard repos aren't blocked.

### `tokens-project.mjs` Adapter Dispatch

The new `tokens-project.mjs` script (Phase 2 deliverable) imports adapter signal from `detectStack()` and uses a discriminated union dispatch (matching `registry.mjs` pattern per Claude's Discretion):

```javascript
// tokens-project.mjs adapter dispatch:
switch (adapterSignal) {
  case 'shadcn':    return emitShadcnAdapter(tokens, outputDir);   // CSS vars + cn() wrapper
  case 'tailwind-v4': return emitTailwindV4Adapter(tokens, outputDir); // @theme block
  case 'plain-css': return emitPlainCssAdapter(tokens, outputDir);  // :root vars
  default: return assertNever(adapterSignal); // ESLint switch-exhaustiveness-check
}
```

Each adapter emits:
1. `design/tokens.json` — canonical DTCG v2025.10 source (all adapters)
2. Adapter-specific projection file (location varies by adapter)
3. Returns `{ tokensPath, projectionPath, adapterUsed }` for the workflow to log

---

## Section 7: Audit `--pr` Mechanics

### PR Diff Walker Architecture (D-45..D-47)

```
audit --pr
    │
    ├── git diff --name-only HEAD~1  (or $GITHUB_BASE_REF for CI)
    │       ↓ list of changed file paths
    │
    ├── Route each path:
    │   ├── design/tokens.json or design/DESIGN.md
    │   │       → stage-5b-pr.mjs detector
    │   ├── components/** or src/**  (CSS/TSX files)
    │   │       → stage-5a-pr.mjs detector
    │   └── Other files → no Stage 5a/5b finding
    │
    ├── Load context:
    │   └── design/.handoff/stage-5b-bundle.md (or latest available)
    │       (NOT raw design/ directory — Anti-Pattern 2 prevention)
    │
    ├── Run slop-tells.mjs on CSS/TSX changed files
    │
    └── Serialize findings → AUDIT-REPORT.md
            → validate against schemas/dist/audit-report.v1.json
```

### `slop-tells.mjs` Pattern Set (D-46)

The deterministic slop-tell patterns (AUDIT-03 table stakes for v2.0a):

| Pattern | Regex | Finding ID | Severity |
|---------|-------|-----------|----------|
| Rainbow gradient | `linear-gradient\s*\([^)]*(?:red|orange|yellow|green|blue|purple).*(?:red|orange|yellow|green|blue|purple)` | `5a-slop-001` | ERROR |
| Inter default (no custom var) | `font-family:\s*['"]?Inter['"]?(?!\s*,\s*var\()` | `5a-slop-002` | WARNING |
| Glass-stack pattern | `backdrop-filter.*blur|background.*rgba.*0\.[0-4]\)` | `5a-slop-003` | WARNING |
| Three-column grid | `grid-template-columns.*repeat\(3` | `5a-slop-004` | INFO |
| Linear gradient 3+ stops | `linear-gradient\s*\([^)]*,\s*[^,)]+,\s*[^,)]+,\s*[^,)]` | `5a-slop-005` | WARNING |

[ASSUMED: the exact regex patterns above are illustrative; the canonical source is `references/slop-tells/heuristics.md` which Phase 1 Plan 05 created. Phase 2 should load patterns from that file at runtime vs hardcoding — loadable is more maintainable; planner decides.]

### `stage-5a-pr.mjs` Detector

Checks CSS/TSX diff files for:
- Token scope violations: raw hex values (`#[0-9a-fA-F]{3,6}`) instead of DTCG token variables
- Class name drift: hard-coded Tailwind color classes (`bg-blue-500`) instead of semantic tokens
- Missing DESIGN.md reference in component JSDoc

### `stage-5b-pr.mjs` Detector

Checks `design/tokens.json` diff for:
- Token removed from DTCG (regression)
- `evidence:` field changed from `INFERRED` (would violate D-51)
- Schema version mismatch

### Severity Ranking

Finding severity follows AUDIT-08 schema: `BLOCKER` > `ERROR` > `WARNING` > `INFO`. The `AUDIT-REPORT.md` output lists findings sorted by severity descending, then by finding ID. CI mode reads `.design-os/ci.yaml`'s `blockOnSeverity` field (default: `BLOCKER` only).

### Suppression File

`.design-os/audit-suppressions.json` (D-47):
```json
{
  "suppressions": [
    {
      "findingId": "5a-slop-002",
      "reason": "Inter is our intentional brand font — we use a custom variable",
      "suppressedAt": "2026-05-25T10:00:00Z",
      "suppressedBy": "design-lead"
    }
  ]
}
```

---

## Section 8: Risks and Pitfalls

### Phase 2 Pitfall Ownership (from PITFALLS.md)

Seven of the thirteen pitfalls land in Phase 2:

**Pitfall 2 — Synthetic-persona red line breach** (CRITICAL for Phase 2)
Phase 2 fills in the gate-1 business logic and creates the adversarial CI corpus. The gate is now tested for real, not skeletal. Risk: gate business logic has an edge case (e.g., fails to detect a `provenance: generated` field nested inside a JSON object rather than in YAML frontmatter). Prevention: RED-05 corpus of 100 prompts exercises the gate against diverse persona JSON structures, not just the happy path.

**Pitfall 3 — Fidelity-cap leakage** (BLOCKER for `style-lite`)
`stage-5a.mjs` already hard-codes `not_runnable`. Phase 2 must ensure the `style-lite` SKILL.md procedure body never calls `design-os gate --stage 5a --assert-pass` or any variant that expects a `PASS` return. The CI test `evals/adversarial/` should include an assertion: "invoke brand-refresh route end-to-end; assert gate-stage-5a returns not_runnable." [VERIFIED: D-43 and Phase 1 `stage-5a.mjs` already ship the hard-coded behavior]

**Pitfall 5 — Context-window blowout** (Phase 2 new transition: Stage 1→2, Stage 2→5a)
The bundle sufficiency eval for these two transitions must pass before Phase 2 declares complete. Phase 1 ships placeholder fixtures (`stage-1-to-2/upstream/personas.json`); Phase 2 must replace placeholders with real representative content and verify sufficiency.

**Pitfall 6 — Determinism drift in `tokens-project.mjs`**
New Phase 2 script that emits DTCG JSON. Must pass `lint-determinism.mjs` (no LLM imports). Must have a `.golden.json` fixture added to `evals/fixtures/golden/tokens-project/`. Golden tests run via `verify-golden.mjs` CI gate.

**Pitfall 7 — Cost runaway**
Phase 2 introduces per-stage budget enforcement (Section 5). The 15-fixture suite in Plan 02-05 is the measurement harness. Risk: the `style` stage runs a Playwright preview (spawns a dev server), which adds wall-clock time but minimal tokens. Token budget ≤55k for style is achievable; the wall-clock constraint (p50 ≤8 min for full 5 stages) is more at risk. The fixture should use the minimal Next 15 scaffold, not a production app.

**Pitfall 11 — Process aversion**
Phase 2 implements 4 of the 7 routes. The `design-bug` route (≤20k tokens, Stage 5a-lite only) is the 60-second on-ramp. This route must be implemented and tested first within Plan 02-03 to validate the on-ramp UX.

**Pitfall 13 — `style-lite` claims full Stage 5a completion** (BLOCKER — already enforced)
Already hard-coded in Phase 1. Phase 2 adds the CI assertion test and ensures all workflow messaging uses `evidence: INFERRED` language throughout. The frontmatter extension (D-51) in `frontmatter-validate.mjs` is the schema-level enforcement.

### New Pitfall Identified During Research

**Pitfall NEW-1 — Mermaid flowchart syntax errors blocking Stage 2**
Stage 2 emits Mermaid flowcharts per JTBD. The LLM can produce syntactically invalid Mermaid (e.g., using characters that Mermaid's lexer rejects, or missing `graph TD` declarations). `mermaid-render.mjs` already handles deterministic rendering, but Phase 2 needs a repair loop: on invalid syntax, feed the error back to the LLM for correction (max 2 repair cycles per the v1.0.1 pattern). If still invalid after 2 cycles → `gate-stage-2` returns `failed_after_repair`. This behavior must be specified in the `structure` workflow SKILL.md procedure body.

**Pitfall NEW-2 — `tokens-project.mjs` Tailwind v4 `@theme` import path ambiguity**
The user's CSS file structure may use `@import "tailwindcss"` in one file and `@theme {}` in another. The `detectStack()` heuristic currently looks for these patterns in any CSS file. Phase 2 must ensure `tokens-project.mjs` identifies the correct file to write the `@theme` block into (typically `app/globals.css` for Next 15 App Router). If no `globals.css` exists, create it. If it exists and already has an `@theme` block, merge (not replace) the design-os tokens. [ASSUMED: the merge strategy for existing `@theme` blocks needs to be specified; conservative default is to write to a separate `design/tokens.css` and let the user manually import it]

---

## Section 9: Open Research Flags

The following items are genuine unknowns the planner must nail down:

**OF-01 — `dispatchRoute()` Phase 2 extension shape**
The exact API surface for plugging real stage workflows into `dispatch.mjs` is not fully specified. Phase 1 returns a stub object; Phase 2 needs to call `run-subagent.mjs` per stage. The open question: does dispatch call `dispatchSubagent()` for each stage in a loop, or does the top-level `design` SKILL.md body call each stage workflow directly? The current `run-subagent.mjs` is "best-effort" on Claude Code (checks `CLAUDE_CODE_BIN` env var). The planner should specify whether Phase 2 wires real subagent dispatch or keeps a sequential-in-process invocation pattern that calls stage workflow logic directly.

**OF-02 — `worstProvenance` propagation scope**
D-38 says `frontmatter-validate.mjs` extension enforces `worstProvenance` on `findings.md` and `sitemap.json`. The exact YAML frontmatter field path in these artifacts where `worstProvenance` must appear is not specified in D-38 or MRD §3.6. The planner must pin this: `worstProvenance:` at the artifact root level in the YAML frontmatter block (i.e., same level as `artifact:`, `stage:`, `generated:`).

**OF-03 — Bundle sufficiency eval for Stage 1→2 and Stage 2→5a**
Phase 1 ships structural-sufficiency eval with placeholder fixtures. Phase 2 must define what "sufficient" means for the Stage 1→2 bundle specifically: how many personas, how many JTBDs, what portion of `findings.md` must appear in the bundle? The current `sufficiency-structural.mjs` checks file path inventory and provenance only. Phase 2 may need to add a "key artifacts present" check for the specific fields needed by Stage 2 (JTBD count, persona summary presence).

**OF-04 — `apply.mjs` conflict resolution**
D-52 says `apply.mjs` copies from `.design-os/preview/run-<id>/` to `design/`. If a file already exists in `design/` (e.g., from a previous run), the behavior is not specified. Options: (a) always overwrite, (b) diff and prompt, (c) create `.bak` file. The planner should specify: default is overwrite with a WARNING logged to `run-log.jsonl`; a `--no-overwrite` flag aborts if conflicts exist.

**OF-05 — Adversarial suite trigger mechanism**
RED-05 specifies 100 prompts. These prompts feed Stage 1 and assert gate behavior. But the current adversarial suite shape (from Phase 1 `evals/adversarial/`) is not documented with a fixture format beyond what Plan 02-05 would define. The planner must specify: each RED-05 fixture is a pre-built `design/` directory with synthetic-only personas already written (no LLM call needed to populate) → gate is invoked directly → assert gate result. This makes RED-05 a pure script test that runs fast and deterministically.

---

## Section 10: Bibliography

### Phase 1 Summaries (verified in-session)

- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-01-SUMMARY.md` — Schemas Foundation: `z.toJSONSchema()`, ajv strict:false, auto-discovery CLI, `frontmatter-validate.mjs`
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-02-SUMMARY.md` — Gate Runner + Handoff Bundle: `runGate()` 5-kind discriminated union, `stage-5a.mjs` not_runnable, tiktoken cl100k_base, bundle sufficiency eval
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-03-SUMMARY.md` — Determinism CI: `verify-golden.mjs`, `lint-determinism.mjs`, `mermaid-render.mjs`, skillgrade, adversarial eval structure, ESLint switch-exhaustiveness-check
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-04-SUMMARY.md` — Governance + PII: `pii-scanner.mjs`, `init.mjs`, `SKILL.md` skeletons, TRUST-01..05, `frontmatter-validate.mjs` strict/lenient modes
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-05-SUMMARY.md` — Preview Harness + Routing: `port-manager.mjs`, `playwright-runner.mjs`, `security-sandbox.mjs`, 3 preview adapters, `variant-distance.mjs`, `run-subagent.mjs`, `registry.mjs`, `dispatch.mjs`, 12 references, 3 host-profile workspaces

### Planning Documents (verified in-session)

- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-CONTEXT.md` — 22 locked decisions D-32..D-53
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-DISCUSSION-LOG.md` — auto-mode rationale for each decision
- `.planning/PROJECT.md` — R1-R26 active requirements
- `.planning/ROADMAP.md` — Phase 2 success criteria SC-1..SC-5, 5-week budget
- `.planning/REQUIREMENTS.md` — Full REQ-ID list; Phase 2 IDs confirmed
- `.planning/research/ARCHITECTURE.md` — 6 patterns, 8 anti-patterns, 12 architectural risks
- `.planning/research/PITFALLS.md` — 13 pitfalls; Phase 2 owns pitfalls 2, 3, 5, 6, 7, 11, 13
- `.planning/research/SUMMARY.md` — Executive summary; standard stack confirmed HIGH confidence
- `.planning/config.json` — `parallelization: true`, `nyquist_validation: false`, `granularity: coarse`

### Source Files (verified in-session)

- `assets/scripts/gates/stage-1.mjs` — Phase 1 skeleton (Phase 2 fills business logic)
- `assets/scripts/routing/registry.mjs` — `detectStack()` 5-signal adapter heuristic
- `assets/scripts/routing/dispatch.mjs` — `dispatchRoute()` + `suggestRoute()` + ROUTE-08
- `assets/scripts/run-subagent.mjs` — host detection + Claude Code best-effort + sequential fallback
- `assets/scripts/handoff-bundle-build.mjs` — tiktoken cl100k_base + section-aware truncation

### MRD Sections (local file at `design-os-mrd-v2.md`)

- §3.5 — Garrett spine table (stage → artifact mapping)
- §3.6 — `design/` directory convention + per-file commit policy + frontmatter schema
- §3.7 — Workflow inventory (W0-W6 + audit) with procedure steps
- §3.8 — Atom inventory; 9 v2.0a atoms + frontmatter fields
- §3.9 — Composition contract (artifact frontmatter reads/writes/emits)
- §3.10 — References architecture (local Markdown, no vector DB)
- §3.22 — Stage-validation gates (evidence grades, terminal states)
- §3.23 — Fidelity caps (FID-01..06)
- §9.1 — v2.0a MVP scope including style-lite BLOCKER fix
- §10 — Roadmap (v2.0a = weeks 4-8)
- §16 — Codex review acceptance record (D-37, D-41, D-43, D-53 canonical sources)

### External Specifications

- agentskills.io v1 spec — https://agentskills.io/specification — SKILL.md frontmatter + procedure body format [CITED]
- W3C DTCG v2025.10 — https://www.designtokens.org/tr/2025.10/format/ — primitive→semantic→component tiers [CITED]
- Google DESIGN.md — https://github.com/google-labs-code/design.md — `$extensions.design-os` namespace [CITED]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 15-fixture CI suite measures p50/p95 by running each fixture once per CI pass; p95 is a multi-run metric meaningful only in Phase 4 | §5 Cost Gate | If Phase 2 CI suite runs each fixture multiple times, the CI runtime cost increases substantially |
| A2 | shadcn/ui detection via `components/ui/` existence + `cn()` import pattern is reliable for standard installations | §6 Adapter Detection | Non-standard shadcn setups (custom component dir) would fall back to tailwind-v4 adapter; user must `--adapter shadcn` override |
| A3 | `worstProvenance` appears at YAML frontmatter root level in downstream artifacts | §9 Open Flag OF-02 | If placed at a nested path, `frontmatter-validate.mjs` extension must parse deeper — adds complexity |
| A4 | Slop-tell regex patterns are loaded from `references/slop-tells/heuristics.md` at runtime (not hardcoded) | §7 Audit | If hardcoded, patterns cannot be updated without a code change; loadable is more maintainable |
| A5 | `apply.mjs` overwrites existing `design/` files by default with a WARNING log entry | §9 Open Flag OF-04 | If overwrite is surprising to users, it may destroy manual edits to design artifacts |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.
Claims A1-A5 require planner/user confirmation before execution.

---

## Environment Availability

Phase 2 adds no new external runtime dependencies beyond what Phase 1 ships. All required tools are available:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts | ✓ | 22 LTS (per Phase 1 package.json) | — |
| Playwright / Chromium | `hifi/variants-preview` atom | ✓ | 1.60.x (Phase 1 CI installs) | `--skip-preview` flag |
| `@mermaid-js/mermaid-cli` | `mermaid-render.mjs` | ✓ | 11.x (Phase 1 Plan 03) | — |
| tiktoken | Bundle token counting | ✓ | Phase 1 Plan 02 | — |
| vitest | Test runner | ✓ | 2.x (Phase 1) | — |
| git CLI | `audit --pr` diff walking | ✓ | System git | — |

**Missing dependencies with no fallback:** None.

---

## Metadata

**Confidence breakdown:**
- Phase decomposition: HIGH — based on verified Phase 1 deliverables and locked D-32..D-53
- Workflow architecture: HIGH — `dispatch.mjs`, `run-subagent.mjs`, gate skeletons verified in-session
- Stage implementation approach: HIGH for Stages 0/1/2; MEDIUM for Style-lite/Systematize-lite (adapter interactions not fully exercised yet)
- Adversarial CI structure: HIGH — pattern directly extends Phase 1 eval harness
- Cost gate telemetry: MEDIUM — tiktoken integration point is clear; run-log format is Claude's Discretion
- Adapter detection: HIGH — `registry.mjs` source verified in-session
- Audit mechanics: HIGH — D-45..D-47 precisely specified

**Research date:** 2026-05-25
**Valid until:** 2026-07-01 (30-day window; stack is stable)
