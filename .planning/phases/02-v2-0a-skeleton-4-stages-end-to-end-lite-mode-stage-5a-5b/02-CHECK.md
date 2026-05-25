# Phase 2 Plan Check

**Checked:** 2026-05-25
**Verdict:** PASS-WITH-CONCERNS
**Plans reviewed:** 5
**Total tasks:** 10 (T-02-01-A, T-02-01-B, T-02-01-C, T-02-02-A, T-02-02-B, T-02-03-A, T-02-03-B, T-02-04-A, T-02-04-B, T-02-05-A, T-02-05-B, T-02-05-C) — 12 actual tasks across 5 plans

---

## Goal Coverage

| Success Criterion | Plans Delivering | Evidence | Status |
|---|---|---|---|
| SC-1: `design --route new-feature` on Next15+TW4+shadcn fixture → personas (provenance:generated + ASSUMPTIONS.md) + sitemap.json + Mermaid flows + tokens.json (DTCG) + DESIGN.md (evidence:INFERRED) + gate/stage-5a-complete returns not-runnable | 02-01 (personas/gate-1), 02-02 (sitemap/flows), 02-03 (tokens.json/stage-5a gate), 02-04 (DESIGN.md), 02-05 (dispatch wiring + e2e fixture) | T-02-01-A/C, T-02-02-A/B, T-02-03-A/B, T-02-04-A/B, T-02-05-B | COVERED |
| SC-2: Stage 1 gate hard-blocks VALIDATED 100/100 times on synthetic-only (RED-05); prompt-injection canary (RED-06); worstProvenance propagation | 02-01 | T-02-01-A, T-02-01-B | COVERED |
| SC-3: design-bug ≤20k, brand-refresh ≤55k, PR-audit ≤15k; per-stage budgets enforced by eval harness on 15-fixture run | 02-03 (budget-check.mjs), 02-05 (dispatch, audit) | T-02-03-A, T-02-05-A/B/C | PARTIALLY COVERED — see Finding F-03 |
| SC-4: `audit --pr` → severity-ranked AUDIT-REPORT.md (validated against audit-report.v1.json) with findingId, evidence pointer, fix recipe, suppression; `audit --slop-tells` flags rainbow/Inter/glass/three-column-grid | 02-05 | T-02-05-A, T-02-05-C | COVERED |
| SC-5: Claude Code triggers recall ≥0.85; Codex CLI + Cursor within 0.10 of host-first scaffold | 02-05 | T-02-05-B (host-profile tests, SKILL.md parsability) | PARTIALLY COVERED — see Finding F-02 |

---

## Decision Coverage

| Decision | Implementing Plan | Implementing Task(s) | Status |
|---|---|---|---|
| D-32: Structured-frontmatter SKILL.md + numbered procedure body | 02-01, 02-02, 02-03, 02-04, 02-05 | T-02-01-C, T-02-02-B, T-02-03-B, T-02-04-B, T-02-05-B | COVERED |
| D-33: Atom SKILL.md with ## Standalone bootstrap + ## Workflow procedure | 02-01, 02-02, 02-03, 02-05 | T-02-01-C, T-02-02-B, T-02-03-B, T-02-05-B | COVERED |
| D-34: One sub-agent per stage workflow; atoms inline | 02-01, 02-02, 02-05 | T-02-01-C, T-02-02-B, T-02-05-B | COVERED |
| D-35: Auto-detect PRD; fall back to Lenny 1-pager if absent or <50 tokens | 02-05 | T-02-05-B | COVERED |
| D-36: LLM proto-personas, Indi Young format, provenance:generated, ASSUMPTIONS.md required | 02-01 | T-02-01-A, T-02-01-C | COVERED |
| D-37: Synthetic-persona hard-block is gate-stage-1.mjs script, not LLM | 02-01 | T-02-01-A | COVERED |
| D-38: worstProvenance propagation via frontmatter-validate.mjs extension | 02-01 | T-02-01-A | COVERED |
| D-39: 2-5 LATCH-diverse sitemap variants; user picks; Mermaid per JTBD | 02-02 | T-02-02-A, T-02-02-B | COVERED |
| D-40: gate-stage-2: JTBD coverage, orphan-node, valid Mermaid; pass_with_warnings when no tree-test | 02-02 | T-02-02-A | COVERED |
| D-41: DTCG primitive→semantic→component; tokens-project.mjs; three adapters | 02-03 | T-02-03-A | COVERED |
| D-42: All style-lite output labeled stage:5a-lite, evidence:INFERRED; schema enforces | 02-03 | T-02-03-A, T-02-03-B | COVERED |
| D-43: gate/stage-5a-complete hard-coded not_runnable; DO NOT override | 02-03 | T-02-03-B (regression test) | COVERED |
| D-44: Component promotion ≥1× in Stage 5a; Frost ≥3× deferred to Phase 3 | 02-04 | T-02-04-A, T-02-04-B | COVERED |
| D-45: audit --pr uses git diff --name-only HEAD~1 or $GITHUB_BASE_REF | 02-05 | T-02-05-A, T-02-05-C | COVERED |
| D-46: audit --slop-tells is fully deterministic regex; no LLM | 02-05 | T-02-05-A | COVERED |
| D-47: AUDIT-REPORT.md validated against audit-report.v1.json; findingId schema | 02-05 | T-02-05-C | COVERED |
| D-48: Adapter detection uses registry.mjs; Next15+TW4+shadcn primary; plain-CSS fallback | 02-03, 02-05 | T-02-03-A, T-02-05-B | COVERED |
| D-49: Soft warn at p50; hard-stop at 2× p50 | 02-03, 02-05 | T-02-03-A (budget-check.mjs) | COVERED — see Finding F-03 |
| D-50: Three adversarial CI suites (RED-05, RED-06, worstProvenance) | 02-01 | T-02-01-B | COVERED |
| D-51: evidence:INFERRED only valid for v2.0a Stage 5a/5b; frontmatter-validate enforces | 02-01, 02-03, 02-04 | T-02-01-A, T-02-03-A, T-02-04-A | COVERED |
| D-52: Diff-by-default; all writes stage to .design-os/preview/; --apply via apply.mjs | 02-05 | T-02-05-A | COVERED |
| D-53: Claude Code host-first; Codex/Cursor exercise-tested; each SKILL.md has ## Host fallback | 02-01, 02-02, 02-03, 02-04, 02-05 | T-02-01-C, T-02-02-B, T-02-03-B, T-02-04-B, T-02-05-B | COVERED |

---

## Requirement Coverage

| REQ-ID | Plan(s) | Task(s) | Status |
|---|---|---|---|
| DIST-04 | 02-05 | T-02-05-B | COVERED |
| WF-01 | 02-05 | T-02-05-B | COVERED |
| WF-02 | 02-01 | T-02-01-A, T-02-01-C | COVERED |
| WF-03 | 02-02 | T-02-02-A, T-02-02-B | COVERED |
| WF-06 (lite) | 02-03 | T-02-03-B | COVERED |
| WF-07 (lite) | 02-04 | T-02-04-B | COVERED |
| WF-08 (basic) | 02-05 | T-02-05-B, T-02-05-C | COVERED |
| WF-09 | 02-05 | T-02-05-B (dispatch) | PARTIALLY — see Finding F-07 |
| ATOM-01 | 02-05 | T-02-05-B | COVERED |
| ATOM-02 | 02-01 | T-02-01-C | COVERED |
| ATOM-03 | 02-01 | T-02-01-C | COVERED |
| ATOM-04 | 02-01 | T-02-01-C | COVERED |
| ATOM-05 | 02-02 | T-02-02-B | COVERED |
| ATOM-06 | 02-02 | T-02-02-B | COVERED |
| ATOM-13 | 02-03 | T-02-03-B | COVERED |
| ATOM-14 | 02-03 | T-02-03-A | COVERED |
| GATE-08 | 02-03 | T-02-03-B | COVERED |
| FID-01 | 02-01 | T-02-01-C (personas-proto FID-01 scan) | COVERED |
| FID-02 | 02-02 | T-02-02-A (gate-stage-2 FID-02 check) | COVERED |
| FID-05 | 02-03 | T-02-03-B (gate-stage-5a not_runnable) | COVERED |
| RED-01 | 02-01 | T-02-01-A | COVERED |
| RED-02 | 02-01 | T-02-01-A, T-02-01-C | COVERED |
| RED-03 | 02-01 | T-02-01-A | COVERED |
| RED-04 | 02-01 | T-02-01-A, T-02-01-B | COVERED |
| RED-05 | 02-01 | T-02-01-B | COVERED |
| RED-06 | 02-01 | T-02-01-B | COVERED |
| ROUTE-02 (partial) | 02-05 | T-02-05-B | COVERED |
| ROUTE-04 | 02-05 | T-02-05-B | COVERED |
| ROUTE-05 | 02-05 | T-02-05-B | COVERED |
| ROUTE-07 | 02-05 | T-02-05-A, T-02-05-C | COVERED |
| ROUTE-09 | 02-05 | T-02-05-B | COVERED |
| AUDIT-01 | 02-05 | T-02-05-A | COVERED (Stage 5a/5b detectors only per scope) |
| AUDIT-03 | 02-05 | T-02-05-A | COVERED |
| AUDIT-05 | 02-05 | T-02-05-C | COVERED |
| AUDIT-08 | 02-05 | T-02-05-C | COVERED |
| ADAPT-01 | 02-03 | T-02-03-A | COVERED |
| ADAPT-03 | 02-03 | T-02-03-A | COVERED |
| MVPA-01 | 02-05 | T-02-05-B (all 5 workflows + audit) | COVERED |
| MVPA-02 | 02-01..02-05 | distributed across plans (9 atoms) | COVERED — see Finding F-08 |
| MVPA-03 | 02-01..02-04 | stage-1/2/5a/5b gates | COVERED |
| MVPA-04 | 02-03, 02-04 | T-02-03-B, T-02-04-B | COVERED |
| MVPA-05 | 02-05 | T-02-05-B (4 routes) | COVERED |
| MVPA-06 | Phase 1 (12 refs already present) | — | COVERED (Phase 1 deliverable) |
| MVPA-07 | 02-03 | T-02-03-A | COVERED |
| MVPA-08 | 02-05 | T-02-05-B | COVERED |
| COST-01 | 02-03 (budget-check.mjs) | T-02-03-A | COVERED |
| COST-02 | 02-03 | T-02-03-A | COVERED |
| COST-05 | 02-03 | T-02-03-A, T-02-03-B | COVERED |
| COST-06 | 02-04 | T-02-04-B | COVERED |
| COST-08 | 02-05 | T-02-05-B | COVERED |
| COST-09 | 02-05 | T-02-05-C | COVERED |
| HAND-03 | 02-01..02-04 | workflow bodies read only bundle; T-02-01-C, T-02-02-B anti-pattern note | COVERED |

---

## Findings

### BLOCKING

**(F-01) [dependency_correctness] Plan 02-04 depends on 02-02 but has a hidden dependency on 02-03's tokens-project.mjs output**

- **Severity:** BLOCKING
- **Plan:** 02-04
- **Detail:** The `systematize.md` workflow body (T-02-04-B, step 5-6) reads `design/tokens.json` and invokes `node assets/scripts/cli/budget-check.mjs --stage systematize`. Both `tokens-project.mjs` (which emits `design/tokens.json` and its DTCG structure that gate-stage-5b.mjs parses) and `budget-check.mjs` are deliverables of Plan 02-03. Plan 02-04 only declares `depends_on: ["02-02"]`. If 02-03 and 02-04 execute in parallel, gate-stage-5b.mjs will attempt to parse DTCG component-tier structure that may not match the schema emitted by `tokens-project.mjs` (Plan 02-03). More critically, `budget-check.mjs` will not exist when 02-04 executes.
- **Fix:** Add `02-03` to Plan 02-04's `depends_on` list, making it `depends_on: ["02-02", "02-03"]`. Wave stays at 3 but must serialize 02-03 → 02-04. Alternatively, declare `budget-check.mjs` calls in the workflow body as `if script absent, skip with warning` (already partially noted in 02-01 discover workflow step 7 — but not in 02-04's systematize step 2). The dependency declaration is the clean fix.

---

**(F-02) [scope_sanity / SC-5] Cross-host scaffold is skeleton-only; SC-5 recall threshold (≥0.85 / within-0.10) is not verifiable from plan deliverables**

- **Severity:** BLOCKING
- **Plan:** 02-05, T-02-05-B
- **Detail:** SC-5 requires "on Claude Code sees `design-os` triggers fire with recall ≥0.85 against the in-tree should-fire suite; on Codex CLI and Cursor the pass rate is within 0.10 of host-first." The plan's cross-host extension (T-02-05-B) only adds SKILL.md *file existence and parsability* checks to the host-profile workspaces. It does not extend the per-skill `skillgrade` trigger eval harness (which is the mechanism that measures recall). There is no task that runs the Phase 1 `skillgrade.mjs` harness against the new Phase 2 SKILL.md files to assert recall ≥0.85. This means SC-5's measurable truth — the recall number — cannot be confirmed by executing these plans.
- **Fix:** Add a task (or a sub-step in T-02-05-B) that: (a) adds `triggers.yaml` files for each new Phase 2 skill under `evals/triggers/<skill>/` (required by Phase 1's skillgrade harness per 01-03-SUMMARY context), and (b) runs `node assets/scripts/skillgrade.mjs` against the new skills to assert recall ≥0.85. Without `triggers.yaml` files, the skillgrade harness cannot fire. The RESEARCH.md noted "every new triggerable SKILL.md needs a `triggers.yaml` in `evals/triggers/<skill>/`" but no plan task creates these files. This is a gap between Phase 1's skillgrade architecture and Phase 2's plan.

---

### HIGH

**(F-03) [requirement_coverage / SC-3] 15-fixture eval harness for p50 measurement is not planned**

- **Severity:** HIGH
- **Plan:** 02-05 (no task covers this)
- **Detail:** ROADMAP SC-3 states "per-stage and per-route token budgets **verified by the eval harness on a 15-fixture run**." The budget enforcement mechanism (`budget-check.mjs`) is planned, but the 15-fixture CI suite that *measures* p50/p95 is referenced in RESEARCH.md §5 ("The 15-fixture CI suite in Plan 02-05 is the measurement harness") and noted in CONTEXT.md. However, no task in 02-05 creates a 15-fixture set. The e2e fixture created is a single Next15+TW4+shadcn fixture. Without 15 fixtures, the CI cannot verify p50 across a realistic distribution — `budget-check.mjs` can only check the run-log of a single run. The SC-3 truth "verified by eval harness on a 15-fixture run" is not deliverable.
- **Fix:** Either (a) add a task to create the 15-fixture suite (may be a scope issue — 15 minimal fixtures are lightweight), or (b) explicitly narrow SC-3's Phase 2 claim to "budget enforcement mechanism shipped; p50 measurement on 15-fixture suite is Phase 4" and update ROADMAP. Option (b) requires ROADMAP amendment, which is a user decision. Option (a) is the correct execution path within this phase.

**(F-04) [task_completeness] Plan 02-04 has no test coverage for DESIGN.md emit content quality; gate-stage-5b tests only validate gate logic, not the SKILL.md's DESIGN.md emit behavior**

- **Severity:** HIGH
- **Plan:** 02-04, T-02-04-B
- **Detail:** T-02-04-B creates `systematize.md` but has no test. The `<verify>` for T-02-04-B is purely structural: file existence + gray-matter parsability. There are no tests that verify (a) the DESIGN.md emit step correctly constructs the `$extensions.design-os` namespace, (b) the component scan step correctly identifies component-tier tokens from `design/tokens.json`, or (c) the DESIGN.md validates against `design-md.2026.04.json` after emit. The gate tests in T-02-04-A cover the gate logic but not the workflow body's produce-side behavior. If the DESIGN.md emit step generates malformed frontmatter, this will not be caught until an e2e run.
- **Fix:** Add a unit test in T-02-04-B (or a companion T-02-04-C task) that: imports the DESIGN.md emit logic (if extracted to a script), or creates a fixture test that runs the systematize workflow body's emit step and validates the output against `design-md.2026.04.json`. Alternatively, extend the e2e test in T-02-05-B to validate `design/DESIGN.md` structure after the full route completes.

**(F-05) [key_links_planned] Stage 2→5a bundle transition is planned but not the Stage 2→5a sufficiency eval**

- **Severity:** HIGH
- **Plan:** 02-02, 02-03
- **Detail:** RESEARCH.md §2 "Specific Ideas" states "Bundle-sufficiency eval must be extended for Stage 1→2 and Stage 2→5a transitions." Plan 02-01 replaces the Stage 1→2 bundle fixture (T-02-01-B). Plan 02-02 replaces the Stage 2→3 bundle fixture (T-02-02-B — note it uses `stage-2-to-3` naming, which is Phase 3 naming). However, Phase 2 skips Stages 3 and 4, so the relevant transition is Stage 2→5a (the bundle `structure` emits that `style` reads). No plan creates an `evals/bundles/fixtures/stage-2-to-5a/` fixture or runs the `bundle-sufficiency-eval.mjs` on this transition. The `stage-2-to-3` fixture in 02-02 may be a naming artifact but the actual Phase 2 path is 2→5a. If the Stage 2 handoff bundle is insufficient for the style workflow, this will only be discovered during Phase 2 e2e execution.
- **Fix:** In T-02-02-B, rename `stage-2-to-3` to `stage-2-to-5a` (or add the 5a variant) and add a verify step running `npx vitest run evals/bundles/` to confirm the bundle-sufficiency eval passes on this transition. Alternatively, add a task in 02-03 to create `evals/bundles/fixtures/stage-2-to-5a/` and run the sufficiency eval.

**(F-06) [task_completeness] Plan 02-05 T-02-05-B creates SKILL.md for `skills/design/SKILL.md` but the `design` skill's update is structurally under-specified**

- **Severity:** HIGH
- **Plan:** 02-05, T-02-05-B
- **Detail:** The Phase 1 `skills/design.md` is the top-level entry point. T-02-05-B updates `skills/design/SKILL.md` (note the path discrepancy — Phase 1 created `skills/design.md` per 01-04-SUMMARY, but Plan 02-05 references `skills/design/SKILL.md`). This is a potential file path inconsistency. More critically, the update task only adds "a Routes table" and updates the "Default behavior section" — there is no task that wires the top-level `design` SKILL.md dispatch to actually call `dispatch.mjs` for each route. The Phase 1 RESEARCH.md stated `dispatch.mjs` currently returns stubs; Plan 02-05 T-02-05-B extends `dispatch.mjs` with real `runSubagent` calls. But the `skills/design.md` workflow body must invoke `dispatch.mjs` — and no plan explicitly verifies this wiring end-to-end (the e2e test mocks `runSubagent`, so it doesn't exercise the actual path from `design --route new-feature` CLI invocation through `design.md` → `dispatch.mjs` → `runSubagent` → stage workflow SKILL.md).
- **Fix:** (a) Clarify the path: is it `skills/design.md` or `skills/design/SKILL.md`? Must match Phase 1. (b) Add a verify step to T-02-05-B that invokes the design CLI subcommand on the e2e fixture (not just mocked dispatch) and confirms route dispatch fires. Even a dry-run that checks the dispatch chain without executing LLM calls would suffice.

---

### MEDIUM

**(F-07) [requirement_coverage] WF-09 `--depth lightweight|standard|full` is declared but no plan implements the flag in workflow SKILL.md bodies**

- **Severity:** MEDIUM
- **Plan:** All plans (02-01 through 02-05)
- **Detail:** REQUIREMENTS.md WF-09: "Every workflow supports `--depth lightweight|standard|full`." All 5 workflow SKILL.md files have this as a phase 2 requirement. The CONTEXT.md research mentions it (RESEARCH.md Phase Requirements table) and dispatch.mjs is noted as handling routing budgets. However, no task in any plan explicitly implements the `--depth` flag in any workflow SKILL.md procedure body. The plans create workflow SKILL.md files without referencing `--depth` in their action descriptions. The requirement is listed in 02-05's requirements frontmatter but no task implements it.
- **Fix:** Add a `--depth` flag handler to each workflow's SKILL.md procedure body (or at minimum in the dispatch layer). At lightweight depth: skip the TRUST-05 intake questions and use defaults; truncate LATCH variants to 2 instead of 5; reduce persona count to 1. At full depth: expand variant count and run additional checks. This does not require a new task — it can be woven into the existing T-02-01-C, T-02-02-B, T-02-03-B, T-02-04-B action descriptions.

**(F-08) [requirement_coverage] MVPA-02 counts "9 atoms shipped" but plans deliver 8 atom SKILL.md files**

- **Severity:** MEDIUM
- **Plan:** All plans
- **Detail:** REQUIREMENTS.md MVPA-02: "9 atoms shipped (per MRD §9.1)." CONTEXT.md Phase Requirements lists 8 atoms for Phase 2: ATOM-01 (parse-or-interview), ATOM-02 (synthesize), ATOM-03 (personas-proto), ATOM-04 (build-ost), ATOM-05 (sitemap-variants), ATOM-06 (flows-from-jobs), ATOM-13 (hifi/variants-preview), ATOM-14 (tokens/emit). That is 8 atoms, not 9. MRD §9.1 is cited as the source. The RESEARCH.md §"New Phase 2 deliverables" lists exactly these 8 atom files. Either MVPA-02 counts an atom not listed in the Phase Requirements table (likely a counting error — the Phase Requirements excludes an atom that MRD §9.1 includes), or the plans undershoot by one. This is a potential coverage gap.
- **Fix:** Audit MRD §9.1's 9-atom list against the 8 atoms in the plan. If a 9th atom exists in MRD §9.1 (likely `hifi/variants-preview` is being counted differently, or there is a `research/competitive` atom), ensure it is covered or explicitly deferred with rationale.

**(F-09) [key_links_planned] The `budget-check.mjs` pre-check step in workflow bodies references a script delivered in Plan 02-03, but Plans 02-01 and 02-02 workflow bodies include the step with "if script absent, skip with warning" fallback — only 02-01 documents this fallback; 02-02 does not**

- **Severity:** MEDIUM
- **Plan:** 02-02, T-02-02-B
- **Detail:** Plan 02-01's `discover.md` step 7 explicitly documents "if script absent, skip with warning" for budget-check.mjs. Plan 02-02's `structure.md` workflow body (T-02-02-B) does not include a budget-check step at all — the action description lists no budget enforcement step despite `structure` having a p50 ≤25k budget (COST-02). Either the budget-check step is intentionally deferred to Plan 02-03 delivery and Plan 02-02 workflows don't check it, or the step is missing. The discover workflow and structure workflow both have p50 targets; structure should enforce them.
- **Fix:** Add budget-check pre/post steps to the `structure.md` workflow body action description in T-02-02-B with the "if script absent, skip with warning" fallback (same pattern as discover.md).

---

### LOW

**(F-10) [scope_discipline] Plan 02-02 bundle fixture uses `stage-2-to-3` path naming but Phase 2 skip directly from Stage 2 to Stage 5a**

- **Severity:** LOW
- **Plan:** 02-02, T-02-02-B
- **Detail:** `evals/bundles/fixtures/stage-2-to-3/` is the Phase 1 placeholder path. Phase 2 workflow chain is 2 → 5a (not 2 → 3). Creating `stage-2-to-3/bundle.md` as the Phase 2 bundle for the structure→style transition is a naming inconsistency that will confuse Phase 3 when Stage 3 is actually added. The bundle that `style.md` reads is described as `design/.handoff/stage-2-bundle.md` but the eval fixture path should be `stage-2-to-5a/`.
- **Fix:** Change `evals/bundles/fixtures/stage-2-to-3/` to `evals/bundles/fixtures/stage-2-to-5a/` in Plan 02-02. The Phase 1 placeholder `stage-2-to-3` was provisioned for a future that doesn't apply in Phase 2. Phase 3 will create `stage-2-to-3` when Stage 3 is built.

**(F-11) [task_completeness] Plan 02-03 T-02-03-A does not include DTCG schema validation against the actual W3C DTCG v2025.10 spec; it notes "use a simple structural check for $type/$value presence"**

- **Severity:** LOW
- **Plan:** 02-03, T-02-03-A
- **Detail:** The action states "extend [validate()] to handle DTCG format or use a simple structural check for $type/$value presence." The CONTEXT.md references `dtcg-lint.mjs` (Phase 1 — mentioned in RESEARCH.md §3 Stage 5a) as the DTCG validator. However, 01-01-SUMMARY.md does not list `dtcg-lint.mjs` as a Phase 1 deliverable — it appears in RESEARCH.md §3's description of Stage 5a but may not actually exist. If `dtcg-lint.mjs` is absent, the "simple structural check" fallback means DTCG v2025.10 compliance is not fully validated. The golden test validates structure byte-by-byte, but semantic DTCG compliance ($type values, group nesting) is not asserted.
- **Fix:** Confirm whether `dtcg-lint.mjs` was actually shipped by Phase 1 (it is not in 01-01-SUMMARY.md's file list). If absent, T-02-03-A should use ajv with the DTCG JSON Schema (available from the W3C spec) to validate emitted tokens. Document which validation path is used in the done criterion.

**(F-12) [anti-pattern check] The RED-06 test implementation makes the adversarial canary conceptually weak**

- **Severity:** LOW
- **Plan:** 02-01, T-02-01-B
- **Detail:** RED-06 prompt files (001.txt–010.txt) are intended to assert "prompt-injection canary asserts red line cannot be bypassed." The plan correctly notes: "the gate reads filesystem provenance state, not prompt content." The test asserts gate behavior, not LLM behavior — which is architecturally sound. However, this means RED-06 is not truly testing the *prompt-injection* threat: it tests that the gate is deterministic regardless of prompt content. The actual threat (an LLM being manipulated via prompts to write `provenance: validated` to a file, which the gate then reads) is not tested. This threat is harder to test deterministically, but the current implementation does not document this coverage gap.
- **Fix:** Add a comment in `run.test.ts` explicitly stating: "RED-06 tests gate determinism post-write. The upstream threat (LLM writing fraudulent provenance values) is mitigated by persona.v1.json schema validation at write time (ajv rejects invalid provenance enum) — documented in T-02-01-A." This closes the documentation gap without requiring new tests.

---

## Open Flag Resolution

| Flag | Status | Resolved In |
|---|---|---|
| OF-01: dispatchRoute Phase 2 extension shape | RESOLVED | 02-05 T-02-05-B — real runSubagent loop per route |
| OF-02: worstProvenance field placement (root-level YAML frontmatter) | RESOLVED | 02-01 T-02-01-A — action explicitly pins to root-level frontmatter |
| OF-03: Bundle sufficiency for Stage 1→2 and Stage 2→5a | PARTIALLY RESOLVED | 02-01 T-02-01-B (Stage 1→2 fixture), but Stage 2→5a fixture naming error in 02-02 — see F-05 |
| OF-04: apply.mjs conflict resolution (default overwrite + WARNING) | RESOLVED | 02-05 T-02-05-A |
| OF-05: RED-05 fixture format (pre-built design/ dirs, no LLM) | RESOLVED | 02-01 T-02-01-B |

---

## Dimension 8: Nyquist Compliance

SKIPPED — `nyquist_validation: false` in `.planning/config.json`.

## Dimension 7c: Architectural Tier Compliance

The Architectural Responsibility Map in RESEARCH.md defines clear tiers. Spot-checking plans:

- Provenance enforcement is correctly assigned to Script tier (gate-stage-1.mjs), not LLM.
- DTCG emit is correctly Script tier (tokens-project.mjs). LLM picks values; script emits.
- Slop-tell detection correctly Script tier. No LLM calls.
- PR diff walking correctly Script tier.
- Staging area writes correctly Script tier (apply.mjs).
- Host dispatch correctly in run-subagent.mjs Script tier.

No tier violations found.

## Dimension 10: CLAUDE.md Compliance

Spot-checking against CLAUDE.md rules:

- shadcn adapter correctly uses `components/` wrappers, never `components/ui/` (T-02-03-A explicitly states this; T-02-03-B anti-pattern note repeats it). PASS.
- Semantic color tokens (`bg-primary`, `text-destructive`) enforced in shadcn adapter. PASS.
- No `any` TypeScript — plans specify `unknown` and Zod validators at API boundaries. PASS.
- All AI API calls server-side (workflow SKILL.md bodies invoke scripts; no browser-side AI calls). PASS.
- Structured output validated against runtime schema (ajv at every boundary). PASS.
- No new dependencies without approval noted — plans reuse Phase 1 dependencies only. PASS.
- Diff-by-default (`--apply` required): D-52 enforced throughout. PASS.
- No modifications to auth/RLS. Not applicable. PASS.

---

## Recommendation

**REVISE PLANS** before execution.

Two blockers require plan revision before execution can proceed:

1. **F-01** (Plan 02-04 missing `02-03` in `depends_on`) — if 02-03 and 02-04 run in parallel (as currently specified), `budget-check.mjs` will not exist when 02-04 executes, and `gate-stage-5b.mjs` may be written against an undefined DTCG structure. Fix: add `"02-03"` to 02-04's `depends_on`.

2. **F-02** (SC-5 trigger recall threshold unverifiable) — no `triggers.yaml` files are planned for Phase 2 SKILL.md files. The Phase 1 `skillgrade.mjs` harness requires these to measure recall. Without them, SC-5's observable truth cannot be confirmed. Fix: add trigger eval file creation to T-02-05-B.

The three HIGH findings (F-03, F-04, F-05) are strongly recommended fixes but do not make the core workflow non-functional. F-03 (15-fixture suite) is a SC-3 measurement gap that makes the success criterion unverifiable as stated. F-05 (Stage 2→5a bundle naming) is a correctness issue that will cause the bundle-sufficiency eval to test the wrong transition.


---

## Re-check (Iteration 2)

**Re-checked:** 2026-05-25
**Iteration:** 2
**Commit reviewed:** b9e5dcb (per planner's iteration-1 summary)
**Plans re-read:** 02-01-PLAN.md through 02-05-PLAN.md (post-revision versions)

---

### Per-Finding Status

| Finding | Severity (iter-1) | Iter-2 Status | Evidence |
|---------|-------------------|---------------|---------|
| F-01: 02-04 hidden dep on 02-03 | BLOCKING | **CLOSED** | 02-04-PLAN.md frontmatter now has `depends_on: ["02-02", "02-03"]`, wave: 4. The wave table in 02-CHECK-RESPONSE.md matches. |
| F-02: SC-5 recall unverifiable | BLOCKING | **CLOSED** | 02-05-PLAN.md T-02-05-B files list includes 6 `evals/triggers/<skill>/triggers.yaml` files and `tests/eval/phase2-skillgrade.test.ts`; `done` criterion states "skillgrade recall ≥0.85 asserted for all 6 Phase 2 skills (SC-5 F-02 fix)"; SC-5 added to 02-05 `must_haves.truths`. |
| F-03: 15-fixture eval harness missing | HIGH | **CLOSED (partial — documented)** | T-02-05-C adds `evals/fixtures/budget/fixture-01..15/` (static PRD.md files) and `tests/budget/budget-p50-measurement.test.ts`. Test header explicitly states "full p50 measurement on 15 e2e runs is Phase 4 deliverable." The CHECK-RESPONSE.md documents this honestly. SC-3 partial coverage accepted. |
| F-04: DESIGN.md emit content untested | HIGH | **CLOSED** | T-02-04-B `files` list now includes `tests/gates/systematize-emit.test.ts`. Action description states: validate emitted DESIGN.md against `design-md.2026.04.json` via `validateDesignMd()`, assert `evidence:INFERRED` and `stage:5b-lite`. Fallback to T-02-05-B e2e is documented with rationale ("F-04: emit test deferred to T-02-05-B e2e validation if emit logic is not a standalone export"). |
| F-05: stage-2-to-3 naming mismatch | HIGH | **CLOSED** | 02-02-PLAN.md T-02-02-B files list and `done` criterion now use `stage-2-to-5a` throughout. Verify step includes `npx vitest run evals/bundles/` to confirm bundle-sufficiency eval. |
| F-06: skills/design/SKILL.md path + dispatch chain | HIGH | **CLOSED (partial)** | CHECK-RESPONSE.md confirms path confirmed via 01-04-SUMMARY. 02-05-PLAN.md T-02-05-B `done` criterion includes "dispatch chain wiring verified by import check (F-06)" and the `<verify>` block includes `node -e "import('./assets/scripts/routing/dispatch.mjs').then(m => m.dispatchRoute)..."`. The path `skills/design/SKILL.md` is in the files list. |
| F-07: `--depth` flag missing | MEDIUM | **CLOSED** | All five workflow procedure bodies (T-02-01-C, T-02-02-B, T-02-03-B, T-02-04-B, T-02-05-B) now contain `--depth dispatch` sections with lightweight/standard/full behavior. Confirmed in plan text. |
| F-08: MVPA-02 9-atom count discrepancy | MEDIUM | **DEFERRED (documented)** | Rationale in CHECK-RESPONSE.md: Phase 2 CONTEXT.md/RESEARCH.md are authoritative for 8 atoms; 9th atom discrepancy deferred to Phase 3 planning. Deliberate deferral with documented rationale — acceptable. |
| F-09: budget-check missing from structure.md | MEDIUM | **CLOSED** | T-02-02-B `done` criterion now includes "budget-check pre/post steps with absent-script fallback (F-09)". The procedure body description includes pre-check and post-check budget steps. |
| F-10: stage-2-to-3 naming (LOW) | LOW | **CLOSED** | Resolved as part of F-05. |
| F-11: DTCG simple structural check | LOW | **CLOSED** | T-02-03-A action description now documents: "confirm dtcg-lint.mjs NOT in 01-01-SUMMARY key_files; use ajv structural check with known DTCG v2025.10 `$type` enum; document path in test file header" with specific comment "DTCG validation: using structural ajv check (dtcg-lint.mjs not in Phase 1 deliverables per 01-01-SUMMARY — F-11)." |
| F-12: RED-06 conceptual weakness undocumented | LOW | **CLOSED** | T-02-01-B `done` criterion requires inline comment in run.test.ts explaining RED-06 tests gate determinism post-write; upstream LLM threat mitigated by ajv provenance enum validation. |

---

### SC Coverage Re-verification

| SC | Covering Plans/Tasks | Post-Iter-2 Status |
|----|---------------------|-------------------|
| SC-1 (end-to-end new-feature route → all 5 artifact types) | 02-01..02-05 (all tasks) | COVERED — e2e test in T-02-05-B asserts dispatch to 4 stages; all artifact types planned |
| SC-2 (Stage 1 gate RED-05/06 + worstProvenance) | 02-01 T-02-01-A/B | COVERED — 100 RED-05 tests, 10 RED-06 canary tests, worstProvenance fixture test |
| SC-3 (token budgets verified by eval harness on 15-fixture run) | 02-03, 02-05 T-02-05-C | PARTIALLY COVERED — budget enforcement mechanism ships; 15 static fixtures created; full e2e p50 measurement is Phase 4. Documented honestly in test file. |
| SC-4 (audit --pr + --slop-tells) | 02-05 T-02-05-A/C | COVERED — slop-tells detects 5 patterns; PR detectors for stage-5a/5b; AUDIT-REPORT.md validated |
| SC-5 (recall ≥0.85 for 6 skills) | 02-05 T-02-05-B | COVERED — 6 triggers.yaml files, phase2-skillgrade.test.ts, skillgrade.mjs run asserting ≥0.85 |

---

### Wave / Dependency Graph Re-verification

| Plan | Wave (revised) | Depends On | Valid? |
|------|---------------|------------|--------|
| 02-01 | 1 | [] | YES |
| 02-02 | 2 | [02-01] | YES |
| 02-03 | 3 | [02-02] | YES |
| 02-04 | 4 | [02-02, 02-03] | YES — F-01 fix confirmed |
| 02-05 | 5 | [02-01, 02-02, 02-03, 02-04] | YES — all predecessors declared |

No cycles. No forward references. Wave numbers are consistent with dependency depth. The CHECK-RESPONSE.md wave table matches the plan frontmatter.

---

### New Issues Discovered During Re-check

**NEW-01 [WARNING] ROADMAP.md Phase 4 section contains a copy of Phase 2's plan list**

- Severity: WARNING
- File: ROADMAP.md, Phase 4 section, "Plans:" subsection
- Detail: The Phase 4 "Plans:" subsection lists the same 5 plans as Phase 2 (`02-01-PLAN.md` through `02-05-PLAN.md`) — including the "(Phase 2 in progress)" parenthetical. This appears to be a copy-paste artifact from the roadmap authoring. Phase 4 plans are documented as TBD elsewhere in the roadmap and in the progress table. The inconsistency is cosmetic: it does not affect Phase 2 execution or plan correctness. However it would confuse Phase 4 planning kickoff.
- Fix: Remove the erroneous plan list from the Phase 4 "Plans:" section and replace with "Plans: TBD — planned after Phase 3 completes."

**NEW-02 [WARNING] T-02-04-B systematize-emit.test.ts has a soft-skip path that may defer test to Phase 2 e2e**

- Severity: WARNING
- Plan: 02-04, T-02-04-B
- Detail: The `<verify>` block for T-02-04-B ends with `2>/dev/null || echo "DEFERRED: emit test in T-02-05-B e2e"` — meaning if the test file does not yet exist or the emit logic is not extractable, the verify step silently passes. This is architecturally acceptable (the F-04 fix documents the deferral explicitly in the test file header), but it means T-02-04-B's completion can be falsely reported as successful without the emit test actually running. The `done` criterion correctly requires either the test to pass or a documented deferral to T-02-05-B, so the acceptance bar is correct — but the soft-skip in `<verify>` means execution CI will not catch a missing test file in T-02-04.
- Fix: Consider strengthening the verify block to at minimum assert the test file exists (`test -f tests/gates/systematize-emit.test.ts`) even if its test run is deferred. This ensures the file was created with the documented deferral comment, not simply skipped.

**No new BLOCKING issues found.**

---

### Deliberate Deferral Verification

**F-08 (MEDIUM — MVPA-02 9-atom count):** Rationale is present in 02-CHECK-RESPONSE.md section "Deliberate Deferrals." The discrepancy is attributed to MRD §9.1 vs. Phase 2 CONTEXT.md scope conflict. The CONTEXT.md and RESEARCH.md are the authoritative planning inputs for this phase. Rationale is documented. Deferral is appropriate.

**F-03 partial (SC-3 p50 measurement):** Rationale is present in 02-CHECK-RESPONSE.md. Phase 2 ships the harness structure; the full 15-run e2e measurement is Phase 4 per ROADMAP. The `budget-p50-measurement.test.ts` documents this contract with an explicit header comment. Deferral is appropriate and honest.

---

### Final Verdict

**PASS**

All two BLOCKING findings (F-01, F-02) and all four HIGH findings (F-03, F-04, F-05, F-06) are closed in the current plan files — verified in the actual plan text, not only in the CHECK-RESPONSE.md. The three MEDIUM findings (F-07, F-09) are closed. F-08 is deliberately deferred with documented rationale. The LOW findings (F-10, F-11, F-12) are all closed.

Two new WARNING-level issues were found (NEW-01: ROADMAP.md Phase 4 copy-paste artifact; NEW-02: T-02-04-B soft-skip verify path). Neither is blocking. Both are cosmetic or defensive-hardening level.

Wave structure is valid: 1→2→3→4→5, no cycles, all dependencies declared.

SC-1 through SC-5 are covered (SC-3 partially, with honest documentation of the Phase 4 handoff).

**Recommended next step: ADVANCE TO EXECUTION**

