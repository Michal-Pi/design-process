---
phase: 04-v2-0-rc-ga-acceptance-cross-host-launch
phase_number: 4
researched: 2026-05-26
domain: release-engineering + acceptance harness + GTM
confidence: HIGH
scope: inventory-and-integrate (ROADMAP Research-Flags: "no novel methodology required")
---

# Phase 4: v2.0 RC + GA — Research

**Researched:** 2026-05-26
**Domain:** Release engineering, acceptance harness, cross-host parity, GTM launch
**Confidence:** HIGH (all prior-phase infrastructure verified in code; new files are wrappers, not novel systems)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-71** — Reviewer recruitment is owner-driven, parallel to engineering. Phase 4 plans split into Track E (engineering) and Track R (recruitment/launch). Engineering planner does NOT block on reviewer recruitment.

**D-72** — Two-wave stealth-then-Frost launch sequence. Wave A (private, Week 1): repo public + private outreach to Brad Frost + Marty Cagan + 1-2 trusted reviewers. Wave B (public, Week 2): GTM-01 post + marketplaces + anthropics PR + named outreach.

**D-73** — 15-fixture acceptance suite, use-case-balanced: 5 B2B SaaS + 5 consumer + 3 dashboard + 2 marketing. Mandatory fixtures: 1 = existing Next 15 + TW4 + shadcn e2e fixture (Phase 2 plan 02-05); 1 = mature-app-refactor route; 1 = DS-extraction route. Remaining 12 = new-product + new-feature routes. ≥12/15 must pass all 5 gates per run.

**D-74** — Graduated cost-discipline gate. p50 ≤150k tokens: HARD BLOCK. p95 ≤220k (effective ceil 286k with 30% overshoot): SOFT (disclosure in CHANGELOG + README). Wall-clock p50 ≤8 min: SOFT (same 30% overshoot). Soft outcomes write to RELEASE-NOTES.md automatically.

**D-75** — Outreach packet is a Phase 4 engineering deliverable: `04-OUTREACH-PACKET.md` with 200-word recruitment message, 1-page scoring rubric, lightweight NDA template, 3 anonymized DESIGN.md + tokens.json bundles.

**D-76** — Adversarial CI corpus = fixed seeded, NOT regenerated. 100 cases per acceptance criterion stored as `evals/adversarial/<accept-id>/cases/*.case.json`. Cases added by hand when new attack patterns found; never auto-regenerated.

**D-77** — Cross-host parity: sampled approach. Claude Code = all 15 fixtures (host-first baseline). Codex CLI + Cursor = deterministic sample of 5 fixtures each. If sample falls outside 0.10 of host-first, escalate to full N=15 on that host.

**D-78** — axe-runner gate scope = 15-fixture suite generated outputs (DESIGN.md + tokens per fixture). Hard block if ANY of the 15 fail WCAG 2.2 AA contrast (≥4.5:1 normal, ≥3:1 large). No soft tolerance.

**D-79** — Anthropic-Labs watcher trigger conditions explicit. Severity 1 (interop pivot): Anthropic ships tool with ≥3 of {S2 sitemap, S3 wireframe, S4 state machine, S5b DTCG emit} AND ≥1 of {Apache-2.0/MIT, DESIGN.md consumer, runs in Claude Code}. Severity 2 (no pivot): S5b overlap only. Severity 3 (out of scope): hi-fi-only (Claude Design current state).

### Claude's Discretion

Per D-71 and D-73: Planner allocates owner-write time against engineering tasks for OQ-6 (PRD source mix). OQ-7 (anthropics PR timing in Wave B — probably first). OQ-8 (video production — identify dependencies/timeline). OQ-9 (outreach channel — owner preference). OQ-10 (marketplace automation vs manual — ROI check).

### Deferred Ideas (OUT OF SCOPE)

- Junie + Copilot host parity (v2.1 / design-os-bridges companion)
- 15-fixture suite expansion to 30+
- Live-LLM trigger eval in CI
- Bridges for Material Web / Vue / Svelte
- Notion / Linear / Google Doc PRD ingestion
- Multi-page URL crawl (depth > 1)
- Cross-AI peer review of release artifacts
- Cost discipline replan task if D-74 hard-gate hits (Phase 4 extension / v2.0.1)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIST-05 | Codex CLI sequential-fallback pass-rate within 0.10 of host-first | Group D: `cross-host-parity.mjs` driver using existing `evals/hosts/codex-cli/` workspace |
| DIST-06 | Cursor sequential-fallback pass-rate within 0.10 of host-first | Group D: same driver, `evals/hosts/cursor/` workspace |
| DIST-07 | Package distributes via 8 named marketplaces | Group G: marketplace manifest + `docs/RAPID-RESPONSE.md` already lists all 8 with per-marketplace emphasis copy |
| TRIG-03 | Aggregate coexistence eval ≥0.80 release gate | Group C: `evals/coexistence/aggregate-eval.mjs` exists; needs `continue-on-error: false` flip + real-package corpus upgrade |
| ACCEPT-01 | ≥12 of 15 fixture runs pass all 5 gates | Group A: 15 PRD fixtures + `release-gate.mjs` orchestrator |
| ACCEPT-02 | Synthetic-only Stage 1 hard-blocks 100/100 | Group B: `evals/adversarial/red-05-synthetic-block/` template → expand to 100 cases in `evals/adversarial/accept-02/cases/` |
| ACCEPT-03 | Stage 3 fidelity-cap rejects styled wireframes 100/100 | Group B: `evals/adversarial/fid-03-styled-wireframe/` template → 100 cases in `evals/adversarial/accept-03/cases/` |
| ACCEPT-04 | Stage 5a refuses hi-fi without state-maps 100/100 | Group B: new corpus `evals/adversarial/accept-04/cases/` following same fixture-builder pattern |
| ACCEPT-05 | Stage 5b ≥3× recurrence rule enforced in fixture | Group B: `evals/adversarial/fid-06-frost-recurrence/` template |
| ACCEPT-06 | `audit --all-stages` identifies Stage 2+4 gaps correctly | Reuses Phase 3 SC-5 fixture; just needs inclusion in `release-gate.mjs` run |
| ACCEPT-07 | Designer review (n≥5) — ≥4/5 positive | Group G (Track R): outreach packet D-75; human review, no engineering gate |
| ACCEPT-08 | PM review (n≥5) — ≥4/5 positive | Group G (Track R): same packet; human review |
| ACCEPT-09 | 100% WCAG 2.2 AA contrast on own examples via `axe-runner.mjs` | Group E: new `assets/scripts/axe-runner.mjs` using `axe-core` 4.11.x |
| COST-07 | Full `design` workflow p50 ≤150k / p95 ≤220k tokens | Group F: `release-gate.mjs` aggregates token counts from 15-fixture run |
| COST-10 | Wall-clock p50 ≤8 min for full 5 stages | Group F: `release-gate.mjs` records wall-clock via `Date.now()` wrapping dispatch calls |
| GTM-01 | Long-form launch post | Group G: Wave A deliverable (draft before Brad Frost feedback) |
| GTM-02 | 90-second video | Group G: owner production decision; engineering identifies no technical dependency |
| GTM-03 | Cross-post to 8 marketplaces | Group G: marketplace manifest in `docs/RAPID-RESPONSE.md` as template; execution Wave B |
| GTM-04 | Named outreach (Brad Frost, Marty Cagan) | Group G: `04-OUTREACH-PACKET.md`; Wave A for Frost, Wave B for Cagan |
| GTM-05 | PR to `anthropics/skills#1008` | Group G: OQ-7 — timing within Wave B (recommend: first action) |
| GTM-07 | Rapid-response pivot plan with explicit D-79 triggers | Group G: extend `docs/RAPID-RESPONSE.md` from Phase 1 stub |
</phase_requirements>

---

## Summary

Phase 4 is release-engineering and launch — all novel infrastructure (gates, adversarial harness, coexistence eval, CLI dispatcher, host workspaces) was built in Phases 1-3. The research question is: "what do we wire together and what do we build from scratch?"

**Finding:** 7 of the 8 Phase 4 deliverable groups are integration tasks, not novel builds. The one genuinely new file is `axe-runner.mjs` (Group E) — axe-core does not yet exist in the project. Everything else wires existing infrastructure into release-gate orchestration.

**Critical state note from Phase 3 verification:** The `evals/coexistence/aggregate-eval.mjs` harness runs `continue-on-error: true` in CI (`.github/workflows/aggregate-coexistence.yml` line 36). Phase 4 MUST flip this to `continue-on-error: false` and replace the description-only stubs in `evals/coexistence/install-corpus.mjs` with real-package installs (or their best available approximations). The harness logic is correct; only the blocking gate and corpus authenticity are missing.

**Primary recommendation:** Build the 15 PRD fixtures first (ACCEPT-01 depends on them; adversarial corpora, axe-runner, cost gate, and outreach packet all depend on fixtures being runnable). Everything else follows in dependency order.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 15-fixture acceptance suite run | Node ESM script (`release-gate.mjs`) | CLI dispatcher (`bin/design-os.mjs`) | Pure scripted orchestration; no browser, no LLM client |
| Adversarial 100-case corpora generation | Static fixture files (`evals/adversarial/*/cases/`) | Test runner (`vitest`) | Fixed-seeded, not regenerated — determinism invariant |
| Aggregate coexistence release gate | Existing `evals/coexistence/aggregate-eval.mjs` | `.github/workflows/aggregate-coexistence.yml` | Harness already complete; CI workflow needs `continue-on-error: false` flip |
| Cross-host parity driver | New `assets/scripts/cross-host-parity.mjs` | `evals/hosts/{codex-cli,cursor}/` workspaces | Existing host-profile workspaces provide the test scaffold |
| axe-runner CI gate | New `assets/scripts/axe-runner.mjs` | Playwright runner (Phase 1) | New file; uses `axe-core` 4.11.x + Playwright for headless runs |
| Cost-discipline gate | `release-gate.mjs` aggregation logic | `assets/scripts/run-subagent.mjs` token tracking | `run-subagent.mjs` already records `tokenBudget` + `stage` in dispatch results |
| GTM launch artifacts | Markdown files (`.planning/phases/04-*/`) | `docs/RAPID-RESPONSE.md` (Phase 1 stub) | Non-code deliverables; no runtime tier |
| TRIG-03 blocking enforcement | `.github/workflows/aggregate-coexistence.yml` | `evals/coexistence/aggregate-eval.mjs` | Config change only (one line) |

---

## Group A — 15-Fixture Acceptance Suite (D-73, ACCEPT-01)

### Reuse

**`evals/fixtures/e2e/next15-tailwind4-shadcn/`** (Phase 2 plan 02-05) is the first of the 15 fixtures. Structure confirmed: `PRD.md` + `app/` + `components/` + `design/` + `next.config.mjs` + `package.json`. This is the "TaskFlow — Team Task Management App" PRD. It maps to use-case slot: **B2B SaaS** (fixture-01 of 5 B2B SaaS). [VERIFIED: codebase]

**`evals/fixtures/budget/`** contains 15 numbered `fixture-01/` through `fixture-15/` directories, each currently containing only `PRD.md` at the root. These were created as skeleton placeholders. [VERIFIED: codebase — `ls evals/fixtures/budget/fixture-01/` shows only `PRD.md`]

**`evals/fixtures/budget/mature-app-refactor.fixture.json`** (45k budget) and **`evals/fixtures/budget/ds-extraction.fixture.json`** (120k budget) define the route-specific budget ceilings for the mandatory route fixtures. These are NOT acceptance fixtures — they define per-route token ceilings for the cost gate. [VERIFIED: codebase]

**`evals/fixtures/budget/new-product-full.fixture.json`** (150k, 7-stage allocations) is the budget definition for the `new-product` route fixtures.

**Budget fixtures are orthogonal to acceptance fixtures.** The budget fixtures tell the cost gate what the ceiling is; the acceptance fixtures are the 15 PRDs + expected-output snapshots. They share the fixture infrastructure but serve different purposes.

### Build

**15 PRD specs** in `evals/acceptance/` (new directory) with the following distribution:

| Slot | Count | Route | Use-case | Stack | Source |
|------|-------|-------|----------|-------|--------|
| B2B SaaS 01 | 1 | `new-feature` | Team task mgmt (TaskFlow) | Next 15 + TW4 + shadcn | **REUSE**: `evals/fixtures/e2e/next15-tailwind4-shadcn/PRD.md` |
| B2B SaaS 02 | 1 | `new-product` | CRM dashboard | Next 15 + shadcn | Owner-written or PRD gallery |
| B2B SaaS 03 | 1 | `new-product` | Dev tooling SaaS | Vite + plain CSS | PRD gallery |
| B2B SaaS 04 | 1 | `new-product` | Internal analytics | Next 15 + TW4 | PRD gallery |
| B2B SaaS 05 | 1 | `new-feature` | Onboarding flow add | Next 15 + shadcn | Owner-written |
| Consumer 01 | 1 | `new-product` | Fitness tracking app | Vite + plain CSS | PRD gallery |
| Consumer 02 | 1 | `new-product` | Recipe/meal planner | Astro + plain CSS | PRD gallery |
| Consumer 03 | 1 | `mature-app-refactor` | Migration off Lovable prototype | **MANDATORY: mature-app-refactor route** | Owner-written (uses existing app code) |
| Consumer 04 | 1 | `new-product` | Personal finance tracker | Vite + TW4 | PRD gallery |
| Consumer 05 | 1 | `new-feature` | Social sharing feature | Next 15 + shadcn | Owner-written |
| Dashboard 01 | 1 | `DS-extraction` | Design-system extraction from prototype | **MANDATORY: DS-extraction route** | Owner-written (existing Lovable export) |
| Dashboard 02 | 1 | `new-product` | Admin ops dashboard | Next 15 + shadcn | PRD gallery |
| Dashboard 03 | 1 | `new-product` | Reporting + export dashboard | Next 15 + TW4 + shadcn | Owner-written |
| Marketing 01 | 1 | `new-product` | Landing page system | Astro + plain CSS | PRD gallery |
| Marketing 02 | 1 | `brand-refresh` | Rebrand token migration | Vite + TW4 | Owner-written |

**OQ-6 recommendation:** ~5 owner-written, ~8 from public PRD template galleries, ~2 from the mandatory route examples (mature-app-refactor + DS-extraction require real starting material). Sourcing strategy: use ProductPlan/Aha!/Notion template galleries for the non-route-specific PRDs; owner writes the route-specific ones where real source material is required. [ASSUMED — no specific PRD gallery was verified in this session]

**Expected-output snapshot format** per fixture: `evals/acceptance/<fixture-id>/expected/` containing:
- `DESIGN.md` — the expected Google DESIGN.md output (validated against `design-md.v2026.04.json` schema)
- `tokens.json` — expected DTCG tokens
- `gate-results.json` — expected terminal states for all 6 stage gates
- `metadata.json` — fixture metadata: `{ fixtureId, route, useCase, stack, budgetCeiling, seedLabel }`

These snapshots are not golden-test inputs (the LLM output is non-deterministic); they are the **structural contract** that the release-gate harness validates against (schema conformance + gate terminal states), not byte-equality.

---

## Group B — Adversarial CI 100-Case Corpora (D-76, ACCEPT-02/03/04/05)

### Reuse

**`evals/adversarial/red-05-synthetic-block/fixture-builder.mjs`** is the canonical template. [VERIFIED: codebase — lines 1-167]

Pattern extracted: `buildSyntheticOnlyFixture(tmpDir, seed)` writes a minimal `design/research/personas/` directory with 2 synthetic personas (seed 0-99 selects from `PERSONA_NAMES[100]` and `COGNITIVE_SPACES[10]` pools). No LLM calls. No `interviews/` directory. No `ASSUMPTIONS.md`.

**`evals/adversarial/fid-03-styled-wireframe/fixture-builder.mjs`** is the template for FID-03 adversarial. [VERIFIED: codebase — lines 1-193]

Pattern extracted: `buildFid03Fixtures(baseDir)` creates 20 styled + 20 clean `.excalidraw` fixture directories. Styled fixtures inject `STYLED_VIOLATIONS` array (20 variants: 7 strokeColor + 6 backgroundColor + 7 fontFamily). Confirms 100 cases could be expanded from 20 by extending the violations pool.

**`evals/adversarial/fid-06-frost-recurrence/`** and **`evals/adversarial/inferred-disclaimer/`** follow the same `fixture-builder.mjs` + `run.test.ts` pattern. [VERIFIED: codebase — directory listing]

### Build

**Corpus structure per acceptance criterion:**

```
evals/adversarial/accept-02/cases/   # ACCEPT-02: synthetic-persona block (100 cases)
evals/adversarial/accept-03/cases/   # ACCEPT-03: styled-wireframe reject (100 cases)
evals/adversarial/accept-04/cases/   # ACCEPT-04: hi-fi-without-state-maps refusal (100 cases)
evals/adversarial/accept-05/cases/   # ACCEPT-05: Frost ≥3× enforcement (spot fixture)
```

Each `cases/` directory holds 100 `case-NNN.case.json` files (zero-padded seed). Schema per case:

```json
{
  "seed": 0,
  "inputType": "synthetic-persona-block",
  "fixtureDir": ".design-os/preview/run-case-000/",
  "expectedGateResult": { "kind": "pass_with_warnings" },
  "expectedCheckId": "1-provenance-001",
  "expectBlock": true
}
```

**ACCEPT-02 (100 cases):** Reuse `buildSyntheticOnlyFixture(tmpDir, seed)` directly from `red-05-synthetic-block/fixture-builder.mjs`. Seed 0..99. Run `runStage1Gate(designDir)` and assert `result.kind !== 'pass'` (gate must NOT produce `pass` — it must surface `pass_with_warnings` with `1-provenance-001` finding). [VERIFIED: red-05 fixture-builder already generates 100-distinct seeds via PERSONA_NAMES pool of 100]

**ACCEPT-03 (100 cases):** Expand `buildFid03Fixtures` from 20 to 100 styled fixtures. Add `STYLED_VIOLATIONS` variants up to 100 distinct entries (extend with combined multi-field violations: e.g., both strokeColor + fontFamily non-default). Run `runStage3Gate(designDir)` and assert result includes `fid-03` findings.

**ACCEPT-04 (100 cases):** New `fixture-builder.mjs` pattern. `buildHiFiWithoutStateMapsFixture(tmpDir, seed)` — creates `design/` with Stage 5a artifacts but `design/interactions/` is empty or has 0 `.spec.md` files. Assert `runStage5aGate(designDir)` returns `{ kind: 'not_runnable', reason: 'stage-4-artifacts-absent' }` (Phase 1 `GATE-08` behavior). [VERIFIED: `gates/stage-5a.mjs` per 03-VERIFICATION.md SC-1 evidence `runFullStage5aChecklist` + `stage-4-artifacts-absent` not_runnable path]

**ACCEPT-05 (spot fixture, not 100 cases):** ACCEPT-05 requires the Frost ≥3× rule is "enforced and verifiable in fixture." The `evals/adversarial/fid-06-frost-recurrence/` harness already provides this via `countComponentRecurrences()`. Phase 4 runs the existing adversarial suite as part of `release-gate.mjs` rather than building a new 100-case corpus for ACCEPT-05. [VERIFIED: 03-VERIFICATION.md SC-3 "FID-06 adversarial 2/2"]

**INVARIANTS.md compliance for corpora:**
- Lesson 4 (ajv-validate): gate results are validated via `appendManifestLockEntry()` which calls ajv on the `GateResult` schema — the test runner asserts against the ajv-validated result shape.
- Lesson 5 (count + identity): each corpus uses a fixed seed pool; the test runner must assert BOTH count of blocked cases AND their specific `checkId` values.
- Lesson 1 (gate result shape): assert `result.kind` is not `'pass'` AND `result.findings[0].checkId` matches expected.

**Determinism invariant:** All 100 cases per corpus are fixed-seeded (D-76). The `run.test.ts` for each corpus mounts the fixture-builder in a temporary directory (via `fs.mkdtemp`) and asserts gate behavior without any LLM calls. This preserves `lint:determinism` — fixture-builders import only Node stdlib + internal gate functions, never LLM clients. [VERIFIED: red-05 `fixture-builder.mjs` imports only `node:fs/promises` and `node:path`]

---

## Group C — Aggregate Coexistence Release Gate (TRIG-03)

### Reuse

**`evals/coexistence/aggregate-eval.mjs`** — complete harness. [VERIFIED: codebase — full implementation, 193 lines]

What it currently does:
- `runAggregateCoexistenceEval()` — installs 6-package corpus, measures recall (design-os fires on own prompts) and false-fire rate (design-os fires on peer prompts), writes `evals/coexistence/last-run.json`, exits 0 always.
- `prepareCorpus(corpusDir)` from `install-corpus.mjs` — creates description-only stubs for all 5 peer packages (GSD, Superpowers, frontend-design, shadcn, Notion-MCP) + design-os itself.
- `RECALL_THRESHOLD = 0.80` and `FALSE_FIRE_THRESHOLD = 0.15` are defined and correct.
- The algorithm is correct; the missing piece is (a) blocking on failure and (b) real-package corpus.

**`evals/coexistence/triggers/`** — exists (per directory listing `last-run.json` + `triggers/`). Trigger YAML files for each peer package exist.

**`.github/workflows/aggregate-coexistence.yml`** — CI workflow exists. Line 36: `continue-on-error: true`. [VERIFIED: codebase]

### Build

**Two changes, no new files:**

**Change 1 — Block on failure in CI:** In `.github/workflows/aggregate-coexistence.yml`, change `continue-on-error: true` to `continue-on-error: false`. Also add the step after `eval:coexistence` that `cat`s `last-run.json` and `exit 1` if `pass: false`. Alternatively, modify `aggregate-eval.mjs`'s main block to `process.exit(result.pass ? 0 : 1)` — the comment "DISABLED in Phase 1" at line 193 is the exact change needed. [VERIFIED: code comment at `aggregate-eval.mjs:193`]

**Change 2 — Real-package corpus (or best-available approximation):** The current `install-corpus.mjs` uses "description-only stubs" with keyword-overlap scoring via `dispatchToHost`'s static-analysis fallback. For TRIG-03 at GA, the corpus should use real SKILL.md files from each package. Two options:

- **Option A (recommended):** Download real SKILL.md files from each package's GitHub repository during CI (curl/wget, not npm install). Each package's SKILL.md is a single Markdown file — no node_modules required.
- **Option B (fallback):** Expand the description stubs to include the real trigger vocabulary from each package's trigger YAML (skills.sh provides public listings). The static-analysis fallback already handles this.

The `dispatchToHost` function in `evals/runners/dispatch-host.mjs` uses static-analysis keyword overlap as the primary dispatch mechanism (confirmed in Phase 1 — "A2 assumption: static-analysis keyword-overlap fallback, no public Claude Code headless eval API as of May 2026"). [VERIFIED: STATE.md Phase 01 Plan 03 decision "A2 assumption — dispatchToHost uses static-analysis keyword-overlap fallback"]

**CI integration:** `aggregate-coexistence.yml` already runs on `push: branches: ["main"]` and `pull_request`. For TRIG-03 as a release gate, it must also be a required check on the release tag workflow (new: `.github/workflows/release-gate.yml`).

---

## Group D — Cross-Host Parity Sampled (D-77, DIST-05/06)

### Reuse

**`evals/hosts/{claude-code,codex-cli,cursor}/`** — three host-profile workspaces exist. [VERIFIED: codebase]

Each workspace has:
- `host-profile.test.ts` — tests `detectHost()` and `dispatchSubagent()` behavior for that host profile
- `package.json` with `@design-os/evals-hosts-<host>` name and `vitest` devDep
- `vitest.config.ts` with `HOST_PROFILE=<host>` env set
- `codex-cli/` and `cursor/` also have `setup.ts` and `node_modules/`

The workspaces verify host detection and dispatch behavior but do NOT run the full 5-stage design workflow against the real host CLI (Phase 1 scaffolded this; Phase 4 wires the real comparison).

**`assets/scripts/run-subagent.mjs`** — `dispatchSubagent()` with `tokenBudget` + `stage` passthrough (03-05 codex P2 fix, commit `159e493`). [VERIFIED: codebase — full implementation]

`detectHost()` returns `'claude-code' | 'codex-cli' | 'cursor' | 'unknown'` based on env vars `CLAUDE_CODE_SESSION`, `CODEX_SESSION/CODEX_CLI_SESSION`, `CURSOR_SESSION/CURSOR_AGENT_SESSION`.

### Build

**`assets/scripts/cross-host-parity.mjs`** — new file. CLI shape per INVARIANT-02:

```javascript
export const command = {
  name: 'cross-host-parity',
  describe: 'Run sampled fixture suite against a target host and compare pass-rate to host-first baseline.',
  builder(cmd) {
    cmd.option('host', { choices: ['codex-cli', 'cursor'], required: true });
    cmd.option('sample', { type: 'number', default: 5 });
    cmd.option('baseline', { describe: 'Path to claude-code baseline results JSON' });
    cmd.option('output', { describe: 'Path to write parity-results.json' });
  },
  async handler(opts) { /* ... */ }
};
```

**Algorithm:**
1. Load the 15-fixture manifest from `evals/acceptance/`.
2. Select deterministic sample of `opts.sample` fixtures (1 from each use-case category: B2B SaaS, consumer, dashboard, marketing, + 1 route-mandatory).
3. For each sampled fixture: run the full dispatch chain via `dispatchSubagent()` with `HOST_PROFILE=<opts.host>` set.
4. Count pass-rate = (fixtures where all 5 gates pass) / sample_size.
5. Load baseline pass-rate from `opts.baseline` (the Claude Code result from `release-gate.mjs`).
6. Compute parity delta = |host_pass_rate - baseline_pass_rate|.
7. Exit 0 if delta ≤ 0.10. If delta > 0.10 AND `opts.sample < 15`, re-run with `sample=15` and re-evaluate. If still > 0.10, exit 1.
8. Write `parity-results.json` with measured pass-rates, delta, escalation status.

**Real LLM calls vs mocked:** Phase 1-3 adversarial tests are pure script tests with no LLM calls. Cross-host parity DOES need real host CLI calls to verify actual trigger behavior. [ASSUMED — this is the standard pattern for parity testing; no prior-phase code verified the real-CLI dispatch path because CLAUDE_CODE_BIN was never set in CI]

**CI strategy (no real API budget on every PR):** Cross-host parity is run only on:
- `workflow_dispatch` (manual trigger — before GA release)
- `push: branches: ["main"]` with `paths: ['skills/**', 'evals/triggers/**']` (trigger changes only)
- The `release-gate.yml` workflow (blocking release check)

Not run on every PR. The `host-matrix.yml` workflow (Phase 1) already runs `continue-on-error: true` for codex-cli and cursor — that behavior is preserved for per-PR checks. Cross-host parity as a HARD gate runs only at release time.

---

## Group E — axe-runner CI Gate (D-78, ACCEPT-09)

### Reuse

**Nothing** — `find` confirms `assets/scripts/axe-runner.mjs` does not exist. [VERIFIED: codebase — `find` returned no matches]

**Playwright runner** (`assets/scripts/cli/preview.mjs` and the Phase 1 Playwright readiness probe) — the Phase 1 preview harness spawns a dev server, waits for it to be ready, and captures screenshots via Playwright. The axe-runner does not need to spawn a dev server (it runs axe-core against the generated DESIGN.md / tokens output in-memory as DOM fragments, or against a minimal HTML scaffold for contrast measurement).

**`axe-core` 4.11.x** is listed in `CLAUDE.md` tech stack under `evals/CI harness`. [VERIFIED: CLAUDE.md] It is not yet in `package.json` (not a current devDependency — Phase 4 installs it).

### Build

**`assets/scripts/axe-runner.mjs`** — new file. CLI shape per INVARIANT-02:

```javascript
export const command = {
  name: 'axe-runner',
  describe: 'Run WCAG 2.2 AA contrast checks on 15-fixture acceptance outputs via axe-core.',
  builder(cmd) {
    cmd.option('fixtures-dir', { default: 'evals/acceptance' });
    cmd.option('output', { describe: 'Path to write axe-results.json' });
    cmd.option('fail-fast', { type: 'boolean', default: false });
  },
  async handler(opts) { /* ... */ }
};
```

**Implementation design:**

```
For each of the 15 acceptance fixtures:
  1. Load DESIGN.md + tokens.json from the fixture's expected/ directory.
  2. Build a minimal HTML scaffold that embeds the token values as CSS custom properties
     and renders the color palette + typography scale as colored divs.
  3. Inject axe-core into the page via Playwright's page.addScriptTag().
  4. Run axe.run({ runOnly: { type: 'tag', values: ['wcag2aa'] } }).
  5. Filter for contrast violations: axe results with id 'color-contrast'.
  6. Record { fixtureId, violations: [...], contrastValues: {...} } per fixture.

Aggregate result:
  pass: violations.length === 0 for ALL 15 fixtures
  Write axe-results.json
  Exit 0 on pass, 1 on fail (hard block — no soft tolerance per D-78)
```

**INVARIANTS.md compliance:**
- INVARIANT-05 (no LLM imports): `axe-runner.mjs` imports only `axe-core`, `playwright`, Node stdlib. No LLM client.
- INVARIANT-07 (path-traversal): `fixtures-dir` option resolved via `path.resolve()` + confirm it starts within the project root before reading.

**Integration with Playwright:** axe-runner creates its own Playwright browser instance (separate from the preview runner). The preview runner spawns a dev server for user-facing preview; axe-runner builds minimal test HTML scaffolds in memory. These are independent paths — no hook required.

**`axe-core` API pattern:** [VERIFIED: CLAUDE.md lists `axe-core 4.11.x` as current; ASSUMED exact API shape from training data — requires verification at implementation time]

```javascript
import AxeBuilder from '@axe-core/playwright';
// or:
import { chromium } from '@playwright/test';
import axe from 'axe-core';
const page = await browser.newPage();
await page.setContent(htmlScaffold);
await page.addScriptTag({ content: axe.source });
const results = await page.evaluate(async () => {
  return await window.axe.run({ runOnly: { type: 'tag', values: ['wcag2aa'] } });
});
```

**Note on "own examples" scope (D-78):** axe-runner checks only the 15 acceptance fixture outputs — not user-generated outputs. The trust-posture boundary (P8) is preserved: design-os never claims WCAG compliance for user outputs; it only ensures its own demonstration artifacts pass.

---

## Group F — Cost-Discipline Release Gate (D-74, COST-07/COST-10)

### Reuse

**`assets/scripts/run-subagent.mjs`** — already records `tokenBudget` and `stage` in every dispatch result (commit `159e493`, Phase 3 codex P2 fix). [VERIFIED: codebase — `dispatchSubagent` returns `{ kind, tokenBudget, stage, ... }`]

**`assets/scripts/routing/dispatch.mjs`** — `PHASE3_ROUTE_SPECS` record provides per-stage `tokenBudget` values for all 3 Phase 3 routes. Phase 2 routes have separate dispatch specs. Together, all 7 routes have documented token allocations.

**Budget fixtures** (`evals/fixtures/budget/new-product-full.fixture.json` etc.) define the per-route ceiling contracts. These are NOT the measurement inputs — they are the expected ceiling assertions the cost gate checks against.

**`assets/scripts/cli/budget-check.mjs`** — Phase 2 budget checker. Supports `tokensUsed/token_count/tokens` field names for flexibility. Phase 4 `release-gate.mjs` calls this per-fixture and aggregates across the 15.

### Build

**`assets/scripts/release-gate.mjs`** — new orchestrator. CLI shape:

```javascript
export const command = {
  name: 'release-gate',
  describe: 'Run 15-fixture acceptance suite + cost gate + axe-runner + coexistence eval. Exit 0 only if all hard gates pass.',
  builder(cmd) {
    cmd.option('fixtures-dir', { default: 'evals/acceptance' });
    cmd.option('output', { describe: 'Path to release-gate-results.json' });
    cmd.option('host', { choices: ['claude-code', 'codex-cli', 'cursor'], default: 'claude-code' });
    cmd.option('dry-run', { type: 'boolean', default: false });
  },
  async handler(opts) { /* ... */ }
};
```

**Algorithm:**

```
Phase 1 — Run 15 fixtures:
  For each fixture in evals/acceptance/:
    record wallClockStart = Date.now()
    result = await dispatchRoute(fixture.route, fixture.prdPath, { tokenBudget: fixture.budgetCeiling })
    wallClockMs = Date.now() - wallClockStart
    gateResults = run all 5 stage gates against staged output
    fixturePass = all 6 gates PASS (or PASS_WITH_WARNINGS)
    tokensUsed = result.tokenBudget  // from dispatchSubagent return value
    record { fixtureId, fixturePass, tokensUsed, wallClockMs, gateResults }

Phase 2 — Compute p50/p95/wallClock:
  tokens = [tokensUsed for each fixture]
  p50 = percentile(tokens, 50)
  p95 = percentile(tokens, 95)
  wallClockP50 = percentile([wallClockMs], 50) / 60000  // convert to minutes

Phase 3 — Hard gate:
  ACCEPT-01: fixturePassCount >= 12  → exit 1 if not
  COST-07 p50: p50 <= 150000         → exit 1 if exceeded (D-74 HARD BLOCK)

Phase 4 — Soft gate (write to RELEASE-NOTES.md, do NOT exit 1):
  COST-07 p95: p95 <= 286000 (220k * 1.30)  → if exceeded, write disclosure
  COST-10: wallClockP50 <= 10.4 min          → if exceeded, write disclosure

Phase 5 — Run axe-runner:
  result = await runAxeRunner({ fixturesDir: opts.fixturesDir })
  if result.hasViolations → exit 1 (D-78 hard block)

Phase 6 — Write release-gate-results.json (sorted keys for determinism)
  Exit 0
```

**Wall-clock measurement honesty:** `Date.now()` wrapping the `dispatchSubagent()` call measures sub-agent dispatch latency, which includes network round-trips but excludes real LLM inference time (since dispatch returns `{ kind: 'sequential-fallback' }` in CI without `CLAUDE_CODE_BIN` set). [ASSUMED — the honest wall-clock measurement strategy depends on whether `CLAUDE_CODE_BIN` is set at release-gate time. If not set, wall-clock is dispatch overhead only, not real inference time. Planner must decide: (a) require `CLAUDE_CODE_BIN` for release-gate runs, or (b) document that wall-clock measurement is CI-infra latency only and record a caveat in RELEASE-NOTES.md.] This is the single most important open question for Group F.

**`RELEASE-NOTES.md` auto-write:** A function `writeReleaseNotesDisclosure(findings)` appends a structured block to `RELEASE-NOTES.md`:

```markdown
## v2.0 Cost Behavior (measured 2026-XX-XX)

| Metric | Target | Measured | Status |
|--------|--------|----------|--------|
| p50 tokens | ≤150k | Xk | PASS |
| p95 tokens | ≤220k (soft, ≤286k with tolerance) | Xk | [PASS/SOFT-DISCLOSED] |
| Wall-clock p50 | ≤8 min (soft, ≤10.4 min with tolerance) | X.X min | [PASS/SOFT-DISCLOSED] |
```

Per trust-posture P8: REPORTS measured, never claims. [CITED: CLAUDE.md trust posture + D-74]

---

## Group G — GTM Track R (D-71, D-72, D-75, D-79)

### Reuse

**`docs/RAPID-RESPONSE.md`** — Phase 1 stub (01-04). [VERIFIED: codebase] The current stub has the 72-hour response plan, marketplace copy variants for all 8 marketplaces, and outreach list with Brad Frost + Marty Cagan framing. It is missing the D-79 trigger conditions (Severity 1/2/3 with explicit feature overlap counts).

**`docs/MAINTAINERS.md`** — exists with `@TBD` placeholder for primary maintainer. [VERIFIED: codebase]

**`evals/coexistence/install-corpus.mjs`** — defines the 5 peer packages and their descriptions. This also functions as the source of truth for which packages appear in the marketplace cross-post (same 5 packages validate design-os in coexistence with, aligning the GTM narrative with the technical evidence).

### Build

**`04-OUTREACH-PACKET.md`** (in `.planning/phases/04-v2-0-rc-ga-acceptance-cross-host-launch/`) per D-75:

```markdown
# design-os v2.0 — Reviewer Outreach Packet

## Recruitment Message (200 words)
[...]

## Scoring Rubric
### Designer rubric (5-point Likert)
"This is what doing it properly looks like, not a Lovable shortcut." — strongly agree / agree / neutral / disagree / strongly disagree
Free-form prompts: [3 prompts]

### PM rubric (5-point Likert)
"Produces artifacts I'd actually share with engineering." — [...]
Free-form prompts: [3 prompts]

## Lightweight NDA Template
[CC-licensed, no exclusivity claims]

## Anonymized Sample Outputs (3 bundles)
Attached after 15-fixture dry-run passes.
```

**Extended `docs/RAPID-RESPONSE.md`** per D-79: Add before the existing "72-Hour Response" section:

```markdown
## Trigger Conditions (D-79)

### Severity 1 — Interop Pivot (invoke within 72 hours)
Anthropic Labs ships a tool with ≥3 of:
  - Stage 2 sitemap generation
  - Stage 3 wireframe generation
  - Stage 4 state machine generation
  - Stage 5b DTCG token emission
AND ≥1 of:
  - Open-source under Apache-2.0 or MIT
  - DESIGN.md spec consumer
  - Runs in Claude Code (`.claude/skills/` distribution)

Pivot: reposition as "bridge between Claude Design and DESIGN.md spec consumers"

### Severity 2 — No pivot needed
Anthropic ships a tool with S5b overlap only (token emission, no design process spine)

### Severity 3 — Out of scope
Anthropic ships hi-fi-only generator (Claude Design current state as of May 2026)
```

**GTM-01 post draft:** Per D-72, the post draft is a Wave A deliverable — drafted BEFORE Brad Frost feedback, submitted for his review during Wave A. It is then revised based on feedback before Wave B publication. Recommend the planner schedule the draft in Wave A Week 1 alongside the outreach packet.

**OQ-7 — anthropics PR timing:** Recommend first action in Wave B. Rationale: the PR to `anthropics/skills#1008` signals "this is built for the DESIGN.md spec" — submitting it first establishes technical provenance before the public post amplifies the claim. [ASSUMED — per D-72 context "probably first"]

**OQ-10 — Marketplace cross-post automation:** Recommend manual for v2.0 GA. Rationale: 8 marketplaces × 5-10 fields = ~80 field inputs. A script would require API keys for each marketplace (not all have public APIs). Manual copy-paste from a structured manifest file (one Markdown table per marketplace listing all required fields) is lower total effort than scripting 8 different submission flows. Create `docs/MARKETPLACE-MANIFEST.md` as a structured template; the owner executes during Wave B. [ASSUMED — marketplace API availability not verified]

**OQ-8 — GTM-02 video production:** No technical dependency from design-os engineering. Identify: video needs the 15-fixture suite to produce screenshots (3 variants per stage — sitemap / wireframe / state-machine / visual). So the video is a Wave B deliverable (after 15-fixture suite passes). Owner records against the accepted fixture outputs.

---

## Cross-Cutting: INVARIANTS.md Compliance for All Phase 4 Code

For each new Phase 4 file, INVARIANTS.md lessons apply:

| Lesson | Phase 4 Application | Applies To |
|--------|---------------------|------------|
| 1 (GateResult shape) | `release-gate.mjs` must call gates via `runGate()` in `base.mjs` and receive ajv-validated `GateResult`. Do not access `result.kind` before ajv validation. | `release-gate.mjs` |
| 2 (CLI export shape) | All new CLI files must export `command = { name, describe, builder, handler }`. Verify via `node bin/design-os.mjs <cmd> --help` before writing docs. | `release-gate.mjs`, `cross-host-parity.mjs`, `axe-runner.mjs` |
| 3 (staged path) | `release-gate.mjs` runs gates against `.design-os/preview/<run-id>/` NOT against a live `design/` directory. The 15-fixture run creates ephemeral staging dirs per fixture. | `release-gate.mjs` |
| 4 (ajv-validate) | `release-gate.mjs` validates `parity-results.json` and `axe-results.json` via ajv before writing. `release-gate-results.json` is also ajv-validated against a new schema. | `release-gate.mjs`, `axe-runner.mjs`, `cross-host-parity.mjs` |
| 5 (count + identity) | The 15-fixture pass count gate asserts ≥12 by count AND lists the identity (fixtureId) of each passing/failing fixture. `axe-runner.mjs` asserts contrast pass by fixture identity, not just global pass boolean. | `release-gate.mjs`, `axe-runner.mjs` |
| 6 (real CLI flags) | Verify `node bin/design-os.mjs release-gate --help`, `cross-host-parity --help`, `axe-runner --help` before committing docs or plans that reference these flags. | All three new CLI files |
| 7 (path-traversal) | `--fixtures-dir` in `release-gate.mjs` and `axe-runner.mjs` must `path.resolve()` the value and verify it starts within the project root before any `readdir`/`readFile`. | `release-gate.mjs`, `axe-runner.mjs` |

---

## Determinism Invariant Preservation

`lint-determinism.mjs` blocks LLM client imports in `assets/scripts/`. Phase 4 new files:

| File | LLM import? | Status |
|------|-------------|--------|
| `assets/scripts/release-gate.mjs` | NO — orchestrates via `dispatchSubagent()` (shim only) | SAFE |
| `assets/scripts/cross-host-parity.mjs` | NO — routes via `dispatchSubagent()` | SAFE |
| `assets/scripts/axe-runner.mjs` | NO — uses `axe-core` + Playwright only | SAFE |
| `evals/adversarial/accept-02/.../fixture-builder.mjs` | NO — pure Node stdlib | SAFE |
| `evals/adversarial/accept-03/.../fixture-builder.mjs` | NO — pure Node stdlib | SAFE |
| `evals/adversarial/accept-04/.../fixture-builder.mjs` | NO — pure Node stdlib | SAFE |

All 100-case adversarial corpora use fixed-seed fixture-builders with no LLM calls. The `run.test.ts` for each corpus runs gates against the built fixtures — gates are also pure Node scripts with no LLM calls (per INVARIANT-05). [VERIFIED: red-05 fixture-builder imports `node:fs/promises` + `node:path` only]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 22 LTS | All scripts | ✓ | Per `.nvmrc`/package engines | Node 20 LTS acceptable |
| Playwright (Chromium) | axe-runner.mjs | ✓ | 1.60.x (Phase 1 installed) | — |
| axe-core 4.11.x | axe-runner.mjs | ✗ — not in package.json yet | — | Must install as devDep |
| `CLAUDE_CODE_BIN` | real LLM dispatch in release-gate | ✗ — not set in CI | — | Without it, wall-clock measures dispatch overhead only; SC-1 requires manual verification |
| Real Codex CLI | cross-host-parity.mjs | ✗ — not in CI | — | Sequential-fallback path covers schema/gate tests; real parity check needs manual invocation |
| Real Cursor | cross-host-parity.mjs | ✗ — not in CI | — | Same as Codex CLI |

**Missing dependencies with no fallback:**
- `axe-core` — must be added via `npm install --save-dev axe-core@4.11.x` before `axe-runner.mjs` can run. [VERIFIED: CLAUDE.md lists version; not found in any package.json scan]

**Missing dependencies with fallback:**
- Real CLI hosts (Codex, Cursor) — parity checks use sequential-fallback for schema/gate assertions in CI; real trigger-recall comparison requires manual invocation on a developer machine with CODEX_CLI_SESSION or CURSOR_SESSION set.
- `CLAUDE_CODE_BIN` — release-gate harness can compute cost metrics from `tokenBudget` values in dispatch results even without real LLM dispatch; wall-clock requires real dispatch for honest measurement.

---

## Common Pitfalls

### Pitfall 1: Counting Pass/Fail by Fixture Rather Than by Gate
**What goes wrong:** `release-gate.mjs` counts fixtures where `gate.kind === 'pass'` rather than where ALL 6 gates pass. A fixture where Stage 3 is `PASS_WITH_WARNINGS` and Stage 5b is `PASS` counts as a pass even if Stage 4 is `FAILED_AFTER_REPAIR`.
**How to avoid:** Count a fixture as passing only if every `GateResult.kind` is in `['pass', 'pass_with_warnings']`. `FAILED_AFTER_REPAIR` and `NOT_RUNNABLE` are failures for the ≥12/15 count.
**INVARIANTS.md Lesson 5:** Count by identity (gate stage names) not just aggregate boolean.

### Pitfall 2: Flipping `continue-on-error` Without Upgrading the Corpus
**What goes wrong:** Flip `aggregate-coexistence.yml` to blocking, and the static-analysis fallback returns recall < 0.80 because the description-only stubs don't capture the real trigger vocabulary of each package.
**How to avoid:** Before flipping to blocking, verify the current recall number from `evals/coexistence/last-run.json`. If recall < 0.80, expand the corpus stubs (Option A: fetch real SKILL.md files) before flipping.

### Pitfall 3: Wall-Clock Measurement Without Real LLM Dispatch
**What goes wrong:** `release-gate.mjs` reports wall-clock p50 of 200ms because `dispatchSubagent()` returns `{ kind: 'sequential-fallback' }` in CI without `CLAUDE_CODE_BIN` — this is dispatch overhead, not real inference time.
**How to avoid:** Document this limitation explicitly in `RELEASE-NOTES.md`. The p50 ≤8 min gate for COST-10 can only be verified honestly on a machine with `CLAUDE_CODE_BIN` set. Per P8 trust posture: report measured (sequential-fallback latency), not claimed (projected inference time).

### Pitfall 4: axe-runner Checking DESIGN.md Prose Instead of Rendered Colors
**What goes wrong:** axe-core's contrast checker needs rendered DOM with actual CSS color values. Running axe against the raw DESIGN.md Markdown file detects no colors.
**How to avoid:** `axe-runner.mjs` builds a minimal HTML scaffold that embeds `tokens.json` values as CSS custom properties (use `culori` for OKLCH → hex conversion for browser rendering) and renders colored divs before running axe.

### Pitfall 5: Adversarial Corpus Cases Triggering `lint:determinism`
**What goes wrong:** If a `fixture-builder.mjs` imports a module that transitively imports an LLM client (e.g., via `dispatchSubagent`), `lint:determinism` blocks CI.
**How to avoid:** Adversarial fixture-builders import ONLY Node stdlib (`node:fs/promises`, `node:path`). They do NOT call `dispatchSubagent` or any gate function that imports it. They build filesystem fixtures; the `run.test.ts` file imports gate functions and calls them on the built fixtures.

### Pitfall 6: Outreach Packet Samples Pulled Before Fixture Suite Passes
**What goes wrong:** D-75 requires the outreach packet to include "3 anonymized DESIGN.md + tokens.json bundles drawn from the 15-fixture suite (after the suite passes its first dry-run)." If the packet is drafted before the fixtures run, the samples may not reflect the final output quality.
**How to avoid:** Planner schedules the outreach packet as TWO tasks: (a) draft message + rubric + NDA template (Wave A start), (b) attach anonymized samples after 15-fixture dry-run passes (Wave A end / Wave B start).

---

## State of the Art (Prior Phase Decisions Carried Forward)

| Old State | Current State | When Changed | Impact on Phase 4 |
|-----------|--------------|-------------|-------------------|
| Coexistence eval: non-blocking (`continue-on-error: true`) | Phase 4: must flip to blocking | Phase 1 design (Open Q3) | One-line CI change; corpus quality determines whether it actually passes |
| Token budget: documentation-only | Budget preamble in subagent prompt (`buildBudgetPreamble()`) | Phase 3 codex P2 fix, commit `159e493` | `release-gate.mjs` can trust dispatch return values carry budget context |
| Host parity: scaffolded but not enforced | Phase 4: sampled + escalation enforced | Phase 1 scaffold → Phase 4 gate | `cross-host-parity.mjs` is new; host workspaces are not |
| `RAPID-RESPONSE.md`: generic trigger ("≥3 overlap") | Phase 4: explicit D-79 Severity 1/2/3 triggers | Phase 1 stub → Phase 4 extension | Adds specificity without rewriting the document |
| `axe-runner.mjs`: planned but not shipped | Phase 4: must be built from scratch | Phase 3 verification confirms: does not exist | One new file; `axe-core` must be added as devDep |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PRD template galleries (ProductPlan, Aha!, Notion) are viable sources for 8 of the 15 acceptance fixture PRDs. Owner writes the 5 route-specific and 2 network-dependent fixtures. | Group A | If galleries don't have relevant B2B SaaS / consumer / dashboard PRDs, owner write burden increases. Medium risk. |
| A2 | `@axe-core/playwright` or inline `axe.source` injection is the correct approach for headless axe-core runs against minimal HTML scaffolds. | Group E | If axe-core requires a different Playwright integration pattern, the implementation differs but the goal is achievable. Low risk — axe-core 4.x API is stable. |
| A3 | Marketplace cross-post is best done manually (structured manifest → owner copy-pastes). No verified API availability for the 8 marketplaces. | Group G | If any marketplace provides a CLI/API, automation is possible; manual is always the fallback. Low risk. |
| A4 | Wall-clock measurement via `Date.now()` wrapping `dispatchSubagent()` is honest only with `CLAUDE_CODE_BIN` set. Without it, the measurement is dispatch overhead, not inference time. | Group F | If the planner assumes wall-clock is measured without real dispatch, the COST-10 gate is misleading. HIGH risk — must be addressed in plan. |
| A5 | The existing description-only stubs in `install-corpus.mjs` may return recall < 0.80 when used as the blocking gate corpus. Exact number unknown until run against real trigger YAML. | Group C | If current recall is already ≥0.80 with static-analysis fallback, no corpus upgrade needed. If < 0.80, upgrade required before flipping to blocking. Medium risk. |

---

## Open Questions

1. **Wall-clock measurement strategy for COST-10**
   - What we know: `dispatchSubagent()` returns `{ kind: 'sequential-fallback' }` in CI without `CLAUDE_CODE_BIN`. Wall-clock measured this way is dispatch overhead only (~1ms), not real LLM inference.
   - What's unclear: Does the planner intend for `release-gate.mjs` to run with real LLM dispatch (requiring `CLAUDE_CODE_BIN` = a real `claude` binary on the CI runner), or does it document the wall-clock gap in RELEASE-NOTES.md and reserve real measurement for manual SC-1 verification?
   - Recommendation: Adopt the same pattern as Phase 3 SC-1 (manually verified on clean laptop). Document COST-10 measurement as "requires real dispatch; CI measures sequential-fallback latency only."

2. **Coexistence corpus before blocking: verify current recall first**
   - What we know: `evals/coexistence/last-run.json` has the last measured recall. The file exists from Phase 1 CI runs.
   - What's unclear: Is current recall already ≥0.80 with the static-analysis fallback?
   - Recommendation: First task of Group C plan = read `last-run.json` and decide if corpus upgrade is needed before the blocking flip.

3. **ACCEPT-05 scope: spot fixture vs 100-case corpus**
   - What we know: REQUIREMENTS.md says "Stage 5b ≥3× recurrence rule enforced and verifiable in fixture" — no explicit 100-case requirement (unlike ACCEPT-02/03/04).
   - What's unclear: Does the planner want a 100-case corpus for ACCEPT-05 or is the existing `fid-06-frost-recurrence` harness sufficient?
   - Recommendation: Treat ACCEPT-05 as a spot fixture (2 cases: one under 3× recurrences → blocked; one ≥3× → passes). The existing harness covers this. Add to `release-gate.mjs` run without a new 100-case corpus.

---

## Sources

### Primary (HIGH confidence — verified in codebase)
- `evals/coexistence/aggregate-eval.mjs` — full harness implementation [VERIFIED]
- `evals/coexistence/install-corpus.mjs` — corpus prep with description-only stubs [VERIFIED]
- `evals/adversarial/red-05-synthetic-block/fixture-builder.mjs` — adversarial fixture template [VERIFIED]
- `evals/adversarial/fid-03-styled-wireframe/fixture-builder.mjs` — FID-03 fixture template [VERIFIED]
- `assets/scripts/run-subagent.mjs` — `dispatchSubagent` + `tokenBudget` passthrough [VERIFIED]
- `assets/scripts/gates/base.mjs` — `runGate` + `appendManifestLockEntry` + `GateResult` [VERIFIED]
- `assets/scripts/routing/registry.mjs` — 7-route registry with all budgets [VERIFIED]
- `assets/scripts/routing/dispatch.mjs` — PHASE3_ROUTE_SPECS per-stage budgets [VERIFIED via SUMMARY]
- `evals/hosts/{claude-code,codex-cli,cursor}/` — three host-profile workspaces [VERIFIED]
- `bin/design-os.mjs` — auto-discovery CLI dispatcher (INVARIANT-02 pattern) [VERIFIED]
- `.github/workflows/aggregate-coexistence.yml` — `continue-on-error: true` at line 36 [VERIFIED]
- `.github/workflows/host-matrix.yml` — matrix strategy for 3 hosts [VERIFIED]
- `docs/RAPID-RESPONSE.md` — Phase 1 stub with 8-marketplace copy [VERIFIED]
- `evals/fixtures/e2e/next15-tailwind4-shadcn/PRD.md` — TaskFlow PRD (fixture-01 slot) [VERIFIED]
- `evals/fixtures/budget/new-product-full.fixture.json`, `mature-app-refactor.fixture.json`, `ds-extraction.fixture.json` — route budget fixtures [VERIFIED]
- `skills/workflows/INVARIANTS.md` — 7 lessons-forward [VERIFIED]
- `.planning/phases/03-v2-0b-full-5-stages-lovable-refugee-path/03-VERIFICATION.md` — SC-1..SC-5 evidence [VERIFIED]
- `.planning/phases/03-v2-0b-full-5-stages-lovable-refugee-path/03-05-SUMMARY.md` — codex P2 Finding 3 commit `159e493` [VERIFIED]
- `CLAUDE.md` — axe-core 4.11.x listed in tech stack [VERIFIED]

### Secondary (MEDIUM confidence)
- `install-corpus.mjs` comment: "Real-package installation is a Plan 4 / GA hardening step" — confirms Phase 4 owns the corpus upgrade [CITED: in-code comment]
- `aggregate-eval.mjs:193` comment: "process.exit(result.pass ? 0 : 1) — DISABLED in Phase 1" — confirms Phase 4 owns the blocking flip [CITED: in-code comment]
- Open Q3 resolution in STATE.md: "v2.0 GA enables blocking once threshold calibrated per Open Q3" [CITED: STATE.md Phase 01 Plan 03 decision]

### Tertiary (ASSUMED — flagged)
- PRD gallery sourcing strategy (A1)
- axe-core Playwright integration pattern (A2)
- Marketplace API availability (A3)
- Wall-clock measurement strategy (A4)
- Current coexistence recall value (A5)

---

## Metadata

**Confidence breakdown:**
- Group A (15-fixture suite): HIGH — fixture-01 (Next15/TW4/shadcn) verified; budget fixtures verified; skeleton fixtures 02-15 confirmed as PRD-only stubs; distribution formula comes from locked D-73.
- Group B (adversarial corpora): HIGH — existing fixture-builder patterns fully verified; 100-case expansion is mechanical.
- Group C (coexistence gate): HIGH — harness complete; two-line change to make blocking; corpus upgrade path clear.
- Group D (cross-host parity): MEDIUM — host workspaces verified; `cross-host-parity.mjs` algorithm is derived from D-77; real-CLI dispatch path is ASSUMED since `CLAUDE_CODE_BIN` was never set in Phase 1-3 CI.
- Group E (axe-runner): MEDIUM — `axe-core` 4.11.x API shape assumed from training data; integration pattern with Playwright verified against Phase 1 runner architecture.
- Group F (cost gate): HIGH — `run-subagent.mjs` token recording verified; graduation formula from D-74 is locked; wall-clock gap is flagged (A4).
- Group G (GTM): HIGH for engineering deliverables; ASSUMED for marketplace automation ROI and outreach channel preference (owner decisions).

**Research date:** 2026-05-26
**Valid until:** 2026-06-09 (stable infrastructure; 14-day window before Phase 4 execution begins)

---

## RESEARCH COMPLETE
