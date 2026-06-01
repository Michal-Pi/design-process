# Phase 2: v2.0a — Skeleton (4 stages end-to-end, lite-mode Stage 5a/5b) - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** `--auto` (recommended options selected for every gray area; user can review and amend before plan-phase)

<domain>
## Phase Boundary

Ship a standalone-distributable 4-stage skeleton (`ingest` → `discover` → `structure` → `style-lite` → `systematize-lite` + basic `audit`) that delivers end-to-end value from PRD to provisional `DESIGN.md` + DTCG tokens. The synthetic-persona red line and Stage 5a `not-runnable` gate must be enforced in code — not by honor system — so the package can be distributed independently if Anthropic Labs ships a competing 5-stage tool during weeks 9-12.

**In scope (4 stages + basic audit):**
1. **Stage 0 — `ingest`**: Markdown PRD parse or interview-mode (Lenny 1-pager fallback); frontmatter-validated `design/PRD.md` written; stage-0 handoff bundle emitted.
2. **Stage 1 — `discover`**: PRD-parse-or-interview + proto-persona generation with `provenance: generated` + `ASSUMPTIONS.md` + OST + JTBDs; `gate/stage-1-complete` runs deterministically, hard-blocking `evidence: VALIDATED` when only synthetic personas present.
3. **Stage 2 — `structure`**: LATCH-diverse sitemap variants (2-5) + Mermaid flowcharts per JTBD; `gate/stage-2-complete` runs; no colors or typography in IA diagrams (FID-02).
4. **Stage 5a-lite — `style`**: Provisional 3-variant hi-fi preview using the Phase 1 preview harness (Playwright + Vite/Next adapters); DTCG `tokens.json` labeled `stage: 5a-lite, evidence: INFERRED`; `gate/stage-5a-complete` hard-coded to return `not_runnable, reason: stage-4-artifacts-absent` (GATE-08, Pitfall 13 BLOCKER).
5. **Stage 5b-lite — `systematize`**: Component-promotion stub (counts occurrences in stage-5a output; Frost ≥3× recurrence deferred to Phase 3); DTCG emit to `design/tokens.json` + Google DESIGN.md emit to `design/DESIGN.md`; labeled `evidence: INFERRED`.
6. **Basic `audit`**: `--slop-tells` (deterministic linters), `--pr` diff walker (Stage 5a/5b detectors only), severity-ranked `AUDIT-REPORT.md` validated against `audit-report.v1.json`.
7. **4 of 7 routes**: `new-feature` (partial — delta Stage 2 + Stage 5a; skip-with-warning Stage 1), `design-bug` (Stage 5a-lite touch-up only), `brand-refresh` (Stages 5a+5b only), `PR-audit` (cross-stage `audit --pr`). Remaining routes remain `ROUTE_NOT_YET_IMPLEMENTED` stubs (Phase 1 dispatcher).
8. **Adapter detection**: Next 15 + Tailwind v4 + shadcn as the primary fixture target; Vite 6 and Astro 5 adapters also exercised (Phase 1 scaffolds).
9. **Adversarial CI**: RED-01..06 (100/100 synthetic-persona block, prompt-injection canary, `worstProvenance` propagation test).
10. **Cost gates**: `discover` p50 ≤30k, `structure` p50 ≤25k, `style` p50 ≤55k, `systematize` p50 ≤40k, `design-bug` ≤20k, `brand-refresh` ≤55k, `PR-audit` ≤15k.
11. **Cross-host scaffold**: Claude Code host-first passes; Codex CLI + Cursor sequential-fallback within 0.10 of host-first (formal gate at Phase 4; scaffold assured by Phase 1 host workspaces).

**Out of scope (Phase 3 — v2.0b):**
- Stage 3 `sketch` (Excalidraw Crazy-8s + structural diversity metric).
- Stage 4 `interact` (state catalog + pattern variants + XState v5 + HAX-18).
- Full `gate/stage-5a-complete` promotion from `not_runnable` to `PASS` (requires Stage 4 artifacts).
- `audit --reverse-engineer-stages` (Lovable refugee path).
- `new-product` full route; `mature-app-refactor` route; `DS-extraction` route.
- Frost ≥3× recurrence count enforcement (promoted from stub to gate in Phase 3).
- Stage 3 + Stage 4 reference corpus (Phase 3).
- Schema migration v2.0a → v2.0b (Phase 3).

**Out of scope full stop** (per PROJECT.md):
- React/Next/Vue inside the complete-design package itself.
- Vector DB / knowledge graph for `references/`.
- Hosted SaaS / dashboard.
- Notion / Linear / Google Doc PRD ingestion (v2.1).
- Voice → PRD interview mode (v2.2).

</domain>

<decisions>
## Implementation Decisions

### Workflow body authoring style (D-32 to D-33)

- **D-32: Structured-frontmatter SKILL.md with numbered procedure body.** Each workflow SKILL.md carries: frontmatter (`name`, `description` ≤200 chars, `stage:`, `gate:`, `artifacts.reads`, `artifacts.writes`, `composition`, `mvp: true`, `compatibility`, `allows-tools`); then a numbered Markdown procedure body (e.g., `1. Read design/.handoff/stage-N-bundle.md`, `2. Run atom X`, `3. Bash: node assets/scripts/...`, `4. Await user pick`). Each step is imperative prose the LLM executes sequentially. Rationale: the agentskills.io v1 spec uses YAML frontmatter + prose body; Phase 1's three SKILL.md skeletons (`skills/design.md`, `skills/audit.md`, `skills/handoff.md`) establish this exact pattern — Phase 2 workflows extend them without inventing a new format (SPINE-02, D-24, MRD §3.7).
- **D-33: Atom SKILL.md bodies are shorter procedure stubs with a standalone-bootstrap section.** Each atom body begins with a `## Standalone bootstrap` section (runs if `design/.handoff/` is absent — asks minimum questions) then the `## Workflow procedure` section. This dual-path is required by MRD §3.8's "standalone-capable atoms" requirement (ATOM-01..ATOM-14). Rationale: indie devs frequently invoke atoms directly without running the full workflow.

### Sub-agent dispatch shape (D-34)

- **D-34: One sub-agent per stage workflow; atoms invoked inline within the stage's sub-agent context.** The top-level `design` skill (Phase 1 `skills/design.md` + `assets/scripts/routing/dispatch.mjs`) spawns a sub-agent per stage via `run-subagent.mjs` (Phase 1 Plan 05). Within each stage sub-agent, atoms are called sequentially as inline procedure steps — not as separate sub-agents. Rationale: (1) each stage fits within a single LLM context window when backed by the handoff bundle (~5-15k tokens) + stage-scoped references; (2) per-atom sub-agents would multiply handoff overhead and break the stitched-context contract (MRD §3.9, ARCHITECTURE.md Pattern 5); (3) Phase 1 `run-subagent.mjs` already implements the one-per-stage shape with Claude Code host-first + sequential Codex/Cursor fallback (Phase 1 Plan 05 D-23). Per-atom dispatch is an anti-pattern at this stage count (Anti-Pattern 7, ARCHITECTURE.md).

### PRD parse vs interview-mode decision tree (D-35)

- **D-35: Auto-detect: if `design/PRD.md` or a Markdown file matching `PRD*.md` exists in the repo root or `design/`, parse it; otherwise launch the Lenny 1-pager interview (5-7 question intake per TRUST-05).** The `prd/parse-or-interview` atom reads repo signals from the Phase 1 routing registry (`assets/scripts/routing/registry.mjs`) — if a PRD file is found, parse + frontmatter-validate it; if parsing produces < 50 tokens of structured content (i.e., the file is effectively empty), fall back to interview mode automatically. User receives a 3-line summary: "Found PRD.md — parsed N requirements. Run `design --route <suggested>` to proceed." No silent defaults (TRUST-05). Rationale: the `ingest` workflow's primary decision point; auto-detection covers the common case (PM with existing PRD) while interview-mode covers the indie-dev-with-an-idea case (MRD §3.4, WF-01, ATOM-01).

### Persona generation engine and synthetic-persona red line enforcement (D-36 to D-38)

- **D-36: LLM-generated proto-personas using Indi Young thinking-style format; always emitted with `provenance: generated`; `ASSUMPTIONS.md` is a required co-artifact.** The `research/personas-proto` atom invokes the LLM with a structured prompt template (loaded from `references/indi-young-thinking-styles.md` + persona JSON schema) and emits `design/research/personas/<name>.persona.json` with `provenance: "generated"` in frontmatter. `ASSUMPTIONS.md` is written in parallel listing every persona claim as an item to validate. The atom proceeds even without real interviews — but the evidence grade is `PROTO`, not `VALIDATED` (RED-02, RED-03, MRD §3.22).
- **D-37: The synthetic-persona hard-block is enforced by `gate-stage-1.mjs` (a script), not by the LLM.** `assets/scripts/gates/stage-1.mjs` (Phase 1 Plan 02) reads every `design/research/personas/*.persona.json`; if all personas have `provenance: "generated"` and `design/research/interviews/` is absent or empty, the gate returns `{kind: 'pass_with_warnings', evidence: 'proto'}` — never `{kind: 'pass', evidence: 'validated'}`. `evidence: VALIDATED` requires at least one persona with `provenance: "validated"` (linked to a non-empty `interviews/` subdirectory). This deterministic check cannot be bypassed by LLM prompting (Pitfall 2, RED-01, RED-05, ARCHITECTURE.md Anti-Pattern 3).
- **D-38: `worstProvenance` propagates from persona citations into `findings.md` and all downstream artifact frontmatter.** Every artifact that cites a persona (e.g., `design/research/findings.md`, `design/ia/sitemap.json`) inherits the lowest provenance of all cited personas as `worstProvenance:` in its own frontmatter. This is enforced by `assets/scripts/frontmatter-validate.mjs` (Phase 1 Plan 04) which rejects any downstream artifact that cites a `provenance: generated` persona without propagating `worstProvenance: generated`. RED-04, Pitfall 2 prevention.

### Sitemap + Mermaid flow generation (D-39 to D-40)

- **D-39: `structure` workflow generates 2-5 LATCH-diverse sitemap variants via `ia/sitemap-variants` atom; user picks one; `ia/flows-from-jobs` atom generates one Mermaid flowchart per JTBD.** The `ia/sitemap-variants` atom reads `design/.handoff/stage-1-bundle.md` and generates between 2 and 5 variants (default 3) — each using a different LATCH scheme (Location, Alphabetical, Time, Category, Hierarchy). Variant diversity is checked by extending the Phase 1 `variant-distance.mjs` with a sitemap-structural distance function (unique node groupings, depth ratio). Each variant is a `sitemap.json` candidate in `.complete-design/preview/variants/`. User picks one; it becomes `design/ia/sitemap.json`. Mermaid flowcharts are emitted per JTBD as `.flow.mmd` files and validated by the Phase 1 `mermaid-render.mjs` determinism path (Plan 03). No colors or typography in any IA output (FID-02, MRD §3.22 structure gate).
- **D-40: `gate/stage-2-complete` checks: sitemap covers all JTBDs, no orphan nodes, Mermaid flows are syntactically valid.** In v2.0a, tree-test data is absent, so the gate returns `(pass_with_warnings, proto)` if sitemap is present + JTBD-covered but no tree-test results exist. `evidence: VALIDATED` for Stage 2 requires tree-test results (v2.1+ atom `ia/tree-test-design`). This is the honest handling of the solo-indie reality per MRD §3.22 Stage 2 gate and GATE-04 evidence grades.

### Style-lite token scaffolding (D-41 to D-43)

- **D-41: DTCG primitive → semantic → component tier emit from a Next 15 + Tailwind v4 + shadcn fixture via `tokens/emit` atom.** The `tokens/emit` atom reads the user's `tailwind.config.css` or CSS `@theme` block (detected by `assets/scripts/routing/registry.mjs`), extracts existing color/spacing/typography primitives, and emits `design/tokens.json` (DTCG v2025.10) with three tiers: `primitive` (raw OKLCH values), `semantic` (role-mapped aliases: `color.background`, `color.foreground`, `color.primary`, etc.), and `component` (shadcn-mapped component tokens). OKLCH defaults are generated by `oklch.mjs` (Phase 1) when no existing palette is detected. Contrast is measured by `contrast.mjs` (Phase 1). All three adapters (Tailwind v4 `@theme`, shadcn CSS vars, plain CSS `:root`) are emitted by `assets/scripts/tokens-project.mjs` (new script — Phase 2 deliverable). ADAPT-01, ADAPT-03, MVPA-07.
- **D-42: All style-lite output is labeled `stage: 5a-lite, evidence: INFERRED`.** The schema enforces `evidence: "inferred"` is the only allowed value for v2.0a Stage 5a/5b artifacts (MVPA-04). The schema validator at gate runtime rejects any `evidence: "validated"` or `evidence: "proto"` on 5a-lite artifacts. The README and in-workflow messaging explicitly communicate: "These are provisional artifacts. Full Stage 5a/5b completion requires Stage 4 interaction specs from v2.0b." (Pitfall 13, MRD §9.1 BLOCKER fix).
- **D-43: `gate/stage-5a-complete` is hard-coded to return `{kind: 'not_runnable', reason: 'stage-4-artifacts-absent'}` in v2.0a.** Phase 1 Plan 02 already ships this behavior in `assets/scripts/gates/stage-5a.mjs` (GATE-07, GATE-08). Phase 2 must not override it. A CI test asserts this on every v2.0a release build. The gate will be promoted from `not_runnable` to a full runnable checker in Phase 3 when Stage 4 artifacts exist.

### Systematize-lite component promotion (D-44)

- **D-44: Component promotion in v2.0a requires a component name to appear ≥1× in Stage 5a output artifacts (placeholder threshold — Frost ≥3× deferred).** The `systematize-lite` workflow scans `design/tokens.json` and the stage-5a preview artifacts for component names. Any component that appears is a promotion candidate. The gate records the count and flags with `worstProvenance: inferred` + note "Frost ≥3× recurrence not yet verified (requires Phase 3 Stage 4 artifacts)". This honest lite-mode behavior matches MVPA-04's `systematize-lite` labeling requirement. The Frost ≥3× rule is enforced as a hard gate only in Phase 3 (FID-06, Phase 3 v2.0b, ARCHITECTURE.md §Build Order).

### Audit `--pr` mechanics (D-45 to D-46)

- **D-45: `audit --pr` uses `git diff --name-only HEAD~1` (or the PR base ref from `$GITHUB_BASE_REF`) to enumerate changed files, then runs Stage 5a and 5b detectors against the diff.** The PR walker reads changed file paths and routes each to the relevant stage detector: files under `design/tokens.json` or `design/DESIGN.md` → Stage 5b detector; files under the user's `components/` or `src/` → Stage 5a detector (slop-tells + token-scope violations). The walker does NOT load all upstream artifacts — it reads only `design/.handoff/stage-5b-bundle.md` (or the latest available bundle) for context. This bounds token cost to the `PR-audit` route budget of ≤15k (COST-09, ROUTE-07).
- **D-46: Slop-tell detection in `audit --slop-tells` is fully deterministic — regex pattern matching against committed `design/` artifacts and user-repo CSS/TSX files.** The `assets/scripts/audit/slop-tells.mjs` script (new Phase 2 deliverable) encodes patterns from `references/slop-tells/heuristics.md` (Phase 1 Plan 05): rainbow gradients, Inter-default, glass-stack, three-column-grid, `linear-gradient` with 3+ colors, `font-family: Inter` without custom variable. No LLM judgment in slop-tell detection (Pitfall 6 prevention, AUDIT-03, ARCHITECTURE.md Pattern 1).

### Audit report format (D-47)

- **D-47: `AUDIT-REPORT.md` output is validated against `schemas/dist/audit-report.v1.json` (Phase 1 Plan 01) at every `audit` run.** Finding ID schema: `<stage>-<type>-<seq>` (e.g., `5a-slop-001`, `5b-token-002`). Fix-recipe shape: `{ title: string, evidence: string, severity: 'BLOCKER'|'ERROR'|'WARNING'|'INFO', fixRecipe: string, suppressWith: string }`. Suppression: a `.complete-design/audit-suppressions.json` file maps `findingId` → `{reason: string, suppressedAt: ISO date, suppressedBy: string}`. CI mode reads `.complete-design/ci.yaml`'s `blockOnSeverity` field (default: `BLOCKER` only). AUDIT-05, AUDIT-08, MRD §6.

### Adapter detection heuristic (D-48)

- **D-48: Adapter detection uses the Phase 1 routing registry heuristics; Next 15 + Tailwind v4 + shadcn is the primary fixture target; non-matching repos fall back to plain-CSS adapter without error.** `assets/scripts/routing/registry.mjs` (Phase 1 Plan 05) already detects Next.js via `next.config.*`, Tailwind v4 via `@import "tailwindcss"` or `@theme` in CSS, shadcn via `components/ui/`. If the user's repo matches Next 15 + Tailwind v4 + shadcn: use the shadcn adapter (emits wrapper components under `components/`, never modifies `components/ui/` per CLAUDE.md shadcn rules). If Tailwind v4 only: use the Tailwind adapter. Otherwise: fall back to plain-CSS adapter. No adapter is mandatory in v2.0a — explicit `--adapter <name>` flag overrides detection. Rationale: the eval fixture is Next 15 + Tailwind v4 + shadcn per ROADMAP Phase 2 Success Criterion 1; fallback ensures non-shadcn repos aren't blocked (ADAPT-01, ADAPT-03, MVPA-07, MRD §3.15).

### Cost gate enforcement (D-49)

- **D-49: Per-stage token budgets are enforced as soft-warn at p50 target and hard-stop with user confirmation at 2× p50 target.** Token counting uses the `tiktoken` cl100k_base encoder already integrated in Phase 1's `handoff-bundle-build.mjs`. At workflow start, each stage receives a budget hint in its sub-agent context. At stage completion, the run-log records actual token usage. If a stage's usage exceeds 2× its p50 target (e.g., `discover` > 60k tokens), the workflow halts, surfaces the usage to the user with a `--continue-anyway` prompt, and logs the event. p50 budgets per COST-01/02/05/06/08/09: `discover` 30k, `structure` 25k, `style` 55k, `systematize` 40k, `design-bug` route 20k, `brand-refresh` route 55k, `PR-audit` 15k. The 15-fixture CI suite measures p50/p95 per stage per PR (Pitfall 7, MRD §11 Success Criterion 3).

### Adversarial CI fixture set (D-50)

- **D-50: Three adversarial CI suites in `evals/adversarial/`: (1) RED-05 synthetic-persona block — 100 prompts feeding Stage 1 with synthetic-only data, assert 100% `pass_with_warnings` + `evidence: proto` (never `validated`); (2) RED-06 prompt-injection canary — corpus of ≥10 prompts explicitly asking the LLM to label personas `VALIDATED`, assert 100% refusal; (3) `worstProvenance` propagation test — Stage 1 run with mixed personas, assert all downstream artifacts carry `worstProvenance: generated` on their synthetic-persona-citing fields.** These suites are run as part of the Phase 2 CI matrix (existing `.github/workflows/` from Phase 1 extended). The adversarial fixtures use the eval harness structure established in Phase 1 Plan 03. RED-01..RED-06, ACCEPT-02, MRD §9.1 Phase 2 Success Criterion 2.

### Trust posture artifacts and `INFERRED` labeling discipline (D-51)

- **D-51: Every artifact derived from synthetic personas or from Stage 5a-lite carries `evidence: INFERRED` in its YAML frontmatter; `INFERRED` is the only schema-valid value for Stage 5a/5b artifacts in v2.0a.** The frontmatter validator (`assets/scripts/frontmatter-validate.mjs`, Phase 1 Plan 04) is extended to reject: (a) any `design/tokens.json` or `design/DESIGN.md` with `evidence: validated` in v2.0a; (b) any downstream Markdown artifact citing a `provenance: generated` persona without `worstProvenance: generated`. The P12 red line from MRD §3.3 ("AI as facilitator, never primary data source") is enforced by script, not by LLM discipline. MVPA-04, RED-02, RED-04, Pitfall 2 and Pitfall 13.

### Output write discipline (D-52)

- **D-52: Diff-by-default; all Phase 2 workflow writes stage into `.complete-design/preview/` first; `--apply` flag required to write into `design/`.** Every workflow SKILL.md body ends with a diff step: "Read the staged artifacts from `.complete-design/preview/run-<id>/`. If the user approves with `--apply`, call `assets/scripts/cli/apply.mjs` (new Phase 2 deliverable) to copy from staging to `design/` and write `design/.handoff/stage-N-bundle.md`." This extends the TRUST-02 / TRUST-05 pattern from Phase 1's SKILL.md skeletons to all Phase 2 workflow bodies. Note: the `complete-design init` command (Phase 1 Plan 04) already writes `.gitignore`/`.gitattributes` defaults; `apply.mjs` reuses those paths. MRD §3.6 per-file commit policy, PROJECT.md Trust posture constraint.

### Cross-host parity scaffolding (D-53)

- **D-53: Phase 2 ships working Claude Code host-first execution for all 4 stage workflows; Codex CLI and Cursor sequential-fallback paths are exercise-tested (not full-parity) via the Phase 1 host-profile vitest workspaces.** Each new Phase 2 workflow procedure body includes a `## Host fallback` section describing how to run the stage sequentially on Codex/Cursor (no subagent dispatch; `run-subagent.mjs` sequential path). The Phase 1 `evals/hosts/{claude-code,codex-cli,cursor}/` workspaces (Plan 05 D-22) run the fixture suite on all three hosts in CI; Phase 2 target is recall within 0.10 of Claude Code on the Codex/Cursor paths. Formal within-0.10 release gate is Phase 4; Phase 2 establishes the scaffold and closes the gap (DIST-04, MVPA-08, MRD Phase 2 Success Criterion 5).

### Claude's Discretion

The following lower-stakes implementation decisions are left to the Phase 2 planner without requiring further stakeholder input:

- **Directory layout under `skills/workflows/` and `skills/atoms/`**: e.g., whether atom files are at `skills/atoms/research/personas-proto.md` or `skills/atoms/research--personas-proto.md` — either consistent convention works; match Phase 1 skeleton patterns.
- **Structured log format for per-run token telemetry**: whether `run-log.jsonl` (Phase 1 `pino` pattern) records a `tokenUsage` field per stage or a separate `token-budget.jsonl` file — planner picks the simpler path.
- **Fixture naming convention for adversarial CI suite**: e.g., `evals/adversarial/red-05-synthetic-block/prompt-001.txt` vs. `evals/adversarial/synthetic-persona/prompts/001.txt` — planner chooses a consistent naming scheme.
- **`apply.mjs` implementation**: whether it uses `fs.copyFile` per artifact or a `globby`-driven batch copy — planner picks based on Phase 1 `globby` v14 precedent.
- **`tokens-project.mjs` internal adapter dispatch**: whether adapters are in a `switch` on adapter-name or as separate imported modules per adapter — planner follows the `routing/registry.mjs` discriminated-union pattern from Phase 1 for consistency.
- **Slop-tell pattern file format**: whether `slop-tells.mjs` hardcodes patterns or loads from `references/slop-tells/heuristics.md` at runtime — loadable is more maintainable; planner decides based on CI speed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project (mandatory)
- `.planning/PROJECT.md` — project mission, core value, all 26 active requirements, constraints, key decisions
- `.planning/REQUIREMENTS.md` — full v1 REQ-IDs; focus on Phase 2 IDs: DIST-04; WF-01,02,03,06,07,08,09; ATOM-01..06,13,14; GATE-08; FID-01,02,05; RED-01..06; ROUTE-02,04,05,07,09; AUDIT-01,03,05,08; ADAPT-01,03; MVPA-01..08; COST-01,02,05,06,08,09
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria (5 numbered), depends-on Phase 1
- `.planning/STATE.md` — project memory, accumulated context, Phase 1 decisions
- `.planning/config.json` — granularity=coarse, parallelization=true

### Research (mandatory — informs every Phase 2 decision)
- `.planning/research/SUMMARY.md` — synthesis of all research; phase 2 described as "standard patterns" (no additional research-phase needed)
- `.planning/research/STACK.md` — pinned versions; see especially Tailwind v4, shadcn, DTCG v2025.10, Mermaid 11.15, Playwright 1.60
- `.planning/research/FEATURES.md` — table stakes / differentiators / anti-features; MVP v2.0a section
- `.planning/research/ARCHITECTURE.md` — Patterns 1-6 (all exercised in Phase 2); Risks 1-12; Anti-Patterns 1-8 (especially AP-2, AP-3, AP-4, AP-5)
- `.planning/research/PITFALLS.md` — Pitfalls 2 (synthetic-persona), 3 (fidelity-cap leakage), 5 (context-window), 6 (determinism), 7 (cost), 11 (process aversion), 13 (style-lite BLOCKER) — all Phase 2 ownership

### Phase 1 deliverables (what Phase 2 BUILDS ON — do not re-spec)
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-01-SUMMARY.md` — Schemas Foundation: 6 Zod sources, JSON Schema emit pipeline, `ajv` runtime validation, `complete-design migrate`, `design-md-validate` version pinning, auto-discovery CLI dispatcher. Key: `z.toJSONSchema()` (NOT `zod-to-json-schema` — EOL); `ajv strict: false` required; `schemas/dist/` committed to git.
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-02-SUMMARY.md` — Gate Runner + Handoff Bundle: `runGate()` base with 5-kind `GateResult` discriminated union; 6 per-stage gate skeletons; `stage-5a.mjs` already hard-codes `not_runnable` for empty `interactions/`; `manifest.lock` SHA-256 hash chain; 4 stage-gate checklists (stage-1,2,5a,5b); `handoff-bundle-build.mjs` with tiktoken budget + section-aware truncation; bundle-sufficiency eval harness.
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-03-SUMMARY.md` — Determinism CI + Eval Harness: `verify-golden` (5× byte-identical); `lint-determinism` (no LLM imports in `assets/scripts/`); `mermaid-render.mjs` determinism; `skillgrade` per-skill harness; aggregate coexistence eval; recovery semantics; 5 GitHub Actions CI workflows; ESLint switch-exhaustiveness-check.
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-04-SUMMARY.md` — Governance + PII + Persistence: PII scanner (Luhn, E.164, transcript headers); `.gitignore`/`.gitattributes` templates; `complete-design init`; SPINE-04 linearity checker; MANIFEST.md reconciler; override-banner propagation; 3 SKILL.md skeletons (`design`, `audit`, `handoff`); TRUST-01..05 docs.
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-05-SUMMARY.md` — Preview Harness + Routing + Watcher: `port-manager.mjs`; `playwright-runner.mjs`; `security-sandbox.mjs` (permission boundary, no vm2); `vite-adapter.mjs`, `next-adapter.mjs`, `astro-adapter.mjs`; `variant-distance.mjs` (6-axis); `run-subagent.mjs` (host-detection + Claude Code + sequential fallback); routing `registry.mjs` + `dispatch.mjs` (ROUTE-08 enforced); 12 MVPA-06 references; 3 host-profile vitest workspaces; Anthropic-Labs watcher (daily cron + heartbeat); `MAINTAINERS.md`; `RAPID-RESPONSE.md`.

### Source-of-truth MRD (specific sections)
- `complete-design-mrd-v2.md` §3.5 — Garrett spine; every workflow and atom maps to a plane
- `complete-design-mrd-v2.md` §3.6 — `design/` directory structure + per-file commit policy + frontmatter schema + handoff bundle format
- `complete-design-mrd-v2.md` §3.7 — workflow inventory (W0-W6 + audit); procedure steps for `ingest`, `discover`, `structure`, `style`, `systematize`
- `complete-design-mrd-v2.md` §3.8 — atom inventory; 9 v2.0a atoms + frontmatter fields
- `complete-design-mrd-v2.md` §3.9 — composition contract (artifact frontmatter `reads/writes/emits`)
- `complete-design-mrd-v2.md` §3.10 — references architecture (local Markdown only, no vector DB, stage-organized)
- `complete-design-mrd-v2.md` §3.22 — stage-validation gates (evidence grades, terminal states, per-gate checklists); the Stage 1 and Stage 2 gate requirements are the canonical spec for D-37 and D-40
- `complete-design-mrd-v2.md` §3.23 — fidelity caps per stage; Stage 2 no-color/no-typography rule (FID-02); Stage 5a lite-mode labeling
- `complete-design-mrd-v2.md` §9.1 — v2.0a MVP scope including the `style-lite` BLOCKER fix; the 9-atom list; 4-gate list; success criteria for the 4 routes
- `complete-design-mrd-v2.md` §10 — roadmap; v2.0a weeks 4-8 (now weeks 5-9 per Phase 1 expansion)
- `complete-design-mrd-v2.md` §16 — codex acceptance record; key for D-37 (synthetic-persona script enforcement), D-41 (token emit), D-43 (not_runnable gate), D-53 (cross-host scaffold)

### External specifications (cited at canon granularity)
- agentskills.io v1 SKILL.md spec — https://agentskills.io/specification — frontmatter fields + procedure body format
- W3C DTCG v2025.10 — https://www.designtokens.org/tr/2025.10/format/ — token schema; primitive→semantic→component tiers; `$type` field
- Google DESIGN.md — https://github.com/google-labs-code/design.md — Stage 5 contract; `$extensions.complete-design` namespace; pinned to 2026.04 by Phase 1's `design-md-validate.mjs`
- Indi Young *Practical Empathy* — thinking-style format for persona generation; in `references/indi-young-thinking-styles.md`
- Torres OST format — in `references/torres-ost.md`
- Rosenfeld/Morville/Arango IA + LATCH — in `references/rosenfeld-ia.md`
- Klement JTBD format — in `references/klement-jtbd.md`

### Artifact schemas shipped by Phase 1
- `schemas/dist/persona.v1.json` — `provenance` enum required; `worstProvenance` field; `evidence` grade
- `schemas/dist/sitemap.v1.json` — LATCH scheme field; no styling fields
- `schemas/dist/audit-report.v1.json` — `findings[]` with `findingId`, `severity`, `fixRecipe`, `suppressWith`
- `schemas/dist/handoff-bundle.v1.json` — 6 required sections; token count 3k-15k
- `schemas/dist/design-md.2026.04.json` — pinned Google DESIGN.md schema

</canonical_refs>

<code_context>
## Existing Code Insights

### What Phase 1 provides (do not re-implement)

**From Plan 01-01 (Schemas Foundation):**
- `bin/complete-design.mjs` — auto-discovery CLI dispatcher; Phase 2 adds subcommands by dropping `.mjs` files under `assets/scripts/cli/` only
- `assets/scripts/schemas/validate.mjs` — `validateArtifact(schema, data)` returns structured errors; use this at every workflow boundary
- `assets/scripts/schemas/migrate.mjs` — `migrateArtifact(artifact, fromVersion, toVersion)` chains migrations
- `assets/scripts/design-md-validate.mjs` — validates `DESIGN.md` against pinned 2026.04 schema; `validateDesignMd(path)` export
- `assets/scripts/frontmatter-validate.mjs` — strict mode for `design/` paths, lenient for `.complete-design/private/`

**From Plan 01-02 (Gate Runner + Handoff Bundle):**
- `assets/scripts/gates/base.mjs` — `runGate(stage, designDir, config) → GateResult`; all 5 kinds supported
- `assets/scripts/gates/stage-1.mjs` through `stage-5b.mjs` — skeleton gate implementations; Phase 2 fills in checklist items
- `assets/scripts/gates/stage-5a.mjs` — ALREADY hard-codes `not_runnable` for empty `design/interactions/`; Phase 2 must NOT override this
- `assets/scripts/manifest-lock-append.mjs` — `appendManifestLockEntry(designDir, entry)` + `verifyManifestLockChain(designDir)`
- `assets/scripts/handoff-bundle-build.mjs` — `buildHandoffBundle(stage, designDir, llmSummary)` → writes `design/.handoff/stage-N-bundle.md`; tiktoken budget + section-aware truncation
- `assets/scripts/cli/gate.mjs` — `complete-design gate --stage N` CLI command; Phase 2 stage workflows invoke via this

**From Plan 01-03 (Determinism CI + Eval Harness):**
- `assets/scripts/verify-golden.mjs` — `complete-design verify --golden`; Phase 2 emit scripts must add corresponding `.golden.json` fixtures
- `assets/scripts/lint-determinism.mjs` — rejects LLM client imports in `assets/scripts/`; Phase 2 scripts must comply
- `assets/scripts/mermaid-render.mjs` — headless Mermaid → SVG via `@mermaid-js/mermaid-cli`; deterministic render path
- `assets/scripts/skillgrade.mjs` — per-skill trigger eval harness; Phase 2 adds `triggers.yaml` per new skill
- `assets/scripts/coexistence-eval.mjs` — aggregate coexistence eval with 5-package corpus
- `assets/scripts/recover.mjs` — interrupt-and-resume machinery; Phase 2 workflows call this on partial completion
- Phase 1 established ESLint with `@typescript-eslint/switch-exhaustiveness-check`; Phase 2 discriminated unions must have exhaustive case handling

**From Plan 01-04 (Governance + PII):**
- `assets/scripts/pii-scanner.mjs` — scans `design/research/interviews/` pre-commit
- `assets/scripts/spine-linearity.mjs` — rejects forward-stage `dependsOn` in artifact frontmatter
- `assets/scripts/manifest-reconcile.mjs` — rebuilds `design/MANIFEST.md` from filesystem; Phase 2 workflows call this after writes
- `assets/scripts/override-banner-propagate.mjs` — injects `overrideBanner` into downstream artifacts after `USER_OVERRIDDEN` gate
- `assets/scripts/init.mjs` — `complete-design init`; Phase 2 ingest workflow calls this if `design/` doesn't exist
- `skills/design.md`, `skills/audit.md`, `skills/handoff.md` — Phase 1 SKILL.md skeletons; Phase 2 extends the bodies

**From Plan 01-05 (Preview Harness + Routing + Watcher):**
- `assets/scripts/port-manager.mjs` — port allocation with `port.lock` lifecycle; Phase 2 `style` workflow uses this
- `assets/scripts/playwright-runner.mjs` — `spawnAndProbe()` + screenshot capture; Phase 2 `hifi/variants-preview` atom uses this
- `assets/scripts/security-sandbox.mjs` — `isPathAllowed()` + `scrubEnvForPreview()`; wrap all preview spawns
- `assets/scripts/preview/vite-adapter.mjs`, `next-adapter.mjs`, `astro-adapter.mjs` — `prepare(designDir, projectRoot)` API
- `assets/scripts/preview/variant-distance.mjs` — 6-axis Stage 5a visual-style distance metric
- `assets/scripts/run-subagent.mjs` — `runSubagent(prompt, context)` with host detection
- `assets/scripts/routing/registry.mjs` — `detectStack(projectRoot)` returns adapter signals; `suggestRoute(signals)`
- `assets/scripts/routing/dispatch.mjs` — `dispatchRoute(route, designDir, projectRoot)`; ROUTE-08 enforced
- `references/` — 12 MVPA-06 references already present: `garrett-elements.md`, `cooper-goodwin.md`, `torres-ost.md`, `klement-jtbd.md`, `indi-young-thinking-styles.md`, `rosenfeld-ia.md`, `dtcg-v2025-10.md`, `design-md.md`, `wcag-2-2.md`, `radix-step-roles.md`, `shadcn-tailwind-v4.md`, `prd/lenny-one-pager.md`
- `evals/hosts/claude-code/`, `evals/hosts/codex-cli/`, `evals/hosts/cursor/` — host-profile vitest workspaces

### New Phase 2 deliverables (not in Phase 1)

Phase 2 must create the following that do not yet exist:

**Workflow SKILL.md files (under `skills/workflows/` and `skills/atoms/`):**
- `skills/workflows/ingest.md` (W0), `discover.md` (W1), `structure.md` (W2), `style.md` (W5-lite), `systematize.md` (W6-lite), `audit.md` (basic)
- `skills/atoms/prd/parse-or-interview.md` (ATOM-01), `research/synthesize.md` (ATOM-02), `research/personas-proto.md` (ATOM-03), `research/build-ost.md` (ATOM-04), `ia/sitemap-variants.md` (ATOM-05), `ia/flows-from-jobs.md` (ATOM-06), `hifi/variants-preview.md` (ATOM-13), `tokens/emit.md` (ATOM-14)

**New `assets/scripts/` emit/lint scripts:**
- `assets/scripts/tokens-project.mjs` — DTCG → Tailwind v4 `@theme` + shadcn CSS vars + plain CSS (D-41; three adapters)
- `assets/scripts/audit/slop-tells.mjs` — deterministic slop-tell pattern matcher (D-46)
- `assets/scripts/audit/stage-5a-pr.mjs` — Stage 5a PR diff detector
- `assets/scripts/audit/stage-5b-pr.mjs` — Stage 5b PR diff detector
- `assets/scripts/cli/apply.mjs` — copy from `.complete-design/preview/run-<id>/` to `design/` after `--apply` (D-52)
- Per-stage gate checklist extensions in `assets/scripts/gates/stage-1.mjs`, `stage-2.mjs` (flesh out checklist items from Phase 1 skeletons)

**Updated `skills/design.md`:** extend Phase 1 skeleton body to handle the 4 implemented routes

**`evals/adversarial/`:** RED-05 (100 synthetic-persona prompts), RED-06 (≥10 injection canary prompts), `worstProvenance` propagation fixture (D-50)

**`evals/fixtures/`:** Next 15 + Tailwind v4 + shadcn end-to-end fixture for Phase 2 Success Criterion 1

### Integration points and constraints

- Phase 2 scripts in `assets/scripts/` must pass `lint-determinism.mjs` — no LLM client imports
- Every new emit script needs a `*.golden.json` fixture for `verify-golden.mjs`
- Every new triggerable SKILL.md needs a `triggers.yaml` in `evals/triggers/<skill>/` for the `skillgrade` harness
- Gate checklist extensions in `stage-1.mjs` and `stage-2.mjs` must extend the Phase 1 base class (`runGate`) without overriding the `not_runnable` behavior in `stage-5a.mjs`
- All writes to `design/` must use `--apply` path; no direct `Write` calls in workflow bodies to user-facing paths
- Concurrent writes to `design/` from multiple agents must go through `manifest-lock-append.mjs` (file-lock semantics from Phase 1)

</code_context>

<specifics>
## Specific Ideas

- **The Phase 2 "shippable standalone" requirement is the North Star.** Every implementation decision should be evaluated against: "Can a user run `design --route new-feature` end-to-end on a Next.js 15 + Tailwind v4 + shadcn repo and get a real `design/tokens.json` + `design/DESIGN.md` labeled `evidence: INFERRED`, with the Stage 1 gate hard-blocking synthetic-only personas?" If yes, Phase 2 is complete.
- **Do NOT touch `assets/scripts/gates/stage-5a.mjs` to remove the `not_runnable` guard.** This is the §16 BLOCKER fix from Phase 1. It was deliberately hard-coded. Phase 2 must not weaken it. A CI test asserts it on every v2.0a build.
- **The eval fixture (Next 15 + Tailwind v4 + shadcn) is the reference.** Phase 2 must ship a working fixture in `evals/fixtures/` that the 5 Phase 2 workflows can run end-to-end. The fixture does not need to be a full production app — a minimal PRD + a Next App Router scaffold is sufficient for the eval.
- **Workflow SKILL.md bodies must include intake() per TRUST-05** — every workflow asks 3-5 questions at the start; no silent defaults. Phase 1 Plan 04 established this requirement for all stage workflows. The intake questions are the "show, don't tell" discipline moment.
- **The `audit --slop-tells` and `audit --pr` modes are table stakes for v2.0a.** Per FEATURES.md, slop detection is now expected from any agent-side design tool. Phase 2 must ship at minimum the rainbow-gradient, Inter-default, glass-stack, and three-column-grid detectors. These are fast to implement as regex patterns and provide immediate signal for the launch demo.
- **Bundle-sufficiency eval must be extended for Stage 1→2 and Stage 2→5a transitions.** Phase 1 Plan 02 shipped the bundle-sufficiency eval harness and methodology. Phase 2 must add fixtures for these two transitions (Stage 0→1 bundle is trivial; Stage 1→2 and Stage 2→5a are the new handoff paths). The eval must pass BEFORE Phase 2 declares itself complete.

</specifics>

<deferred>
## Deferred Ideas

These came up as relevant to Phase 2 but belong in later phases or v2.1+:

### Phase 3 (v2.0b)
- Stage 3 `sketch` workflow + `lowfi/crazy-eights` + `lowfi/converge` atoms + Excalidraw renderer + structural diversity metric.
- Stage 4 `interact` workflow + `ixd/state-catalog` + `ixd/pattern-variants` + `ixd/state-machine` atoms + XState v5 emit + HAX-18 audit.
- `audit --reverse-engineer-stages` (Lovable refugee path) — depends on all 5 forward-direction gates.
- Frost ≥3× recurrence rule as a hard gate in `gate/stage-5b-complete` (Phase 3 — `gate-stage-5b.mjs` checklist item).
- Full `gate/stage-5a-complete` promotion from `not_runnable` to full runnable (requires Stage 4 artifacts from Phase 3).
- `mature-app-refactor` route, `DS-extraction` route, full `new-product` route.
- Stage 3 + Stage 4 reference corpus (12 additional references: Buxton, Sprint Crazy 8s, Saffer microinteractions, Tidwell, head motion, HAX-18, XState v5, APG, Material 3, Wodtke, Spencer, Frost atomic).
- Schema migration v2.0a → v2.0b for `sitemap.json` (Stage 3 cross-refs), `persona.json` (Stage 4 interaction needs), `MANIFEST.md` (new artifact types).

### Phase 4 (v2.0 RC + GA)
- Full 15-fixture acceptance suite on Claude Code + Codex CLI + Cursor.
- Aggregate coexistence eval ≥0.80 as a release blocker (Phase 1 ships harness; Phase 4 enforces the gate).
- Codex CLI and Cursor within-0.10 pass rate (formal release gate).
- Designer and PM blind reviews.
- Cost p50/p95 validation on 15-fixture suite for full `design` workflow.
- Launch artifact + 8 marketplaces + Brad Frost / Cagan outreach + PR to `anthropics/skills#1008`.

### v2.1+
- Notion / Linear / Google Doc PRD ingestion (Notion scope restricted to Gaia Logic projects per CLAUDE.md).
- Optimal Workshop tree-test CSV ingestion (`ia/tree-test-design` atom).
- `complete-design-bridges` (Material Web / Vue / Svelte adapters).
- Tokens Studio Figma export ingestion.
- Dovetail / Notably interview-transcript ingestion (v2.2).
- Voice → PRD interview mode via Whisper (v2.2).
- i18n / RTL / CJK dedicated atom.
- Storybook MCP via Chromatic.
- Junie + Copilot broader host parity.
- Enterprise audit dashboard (year-2+ sibling product).

### Reviewed Todos (from STATE.md)
- `@TBD` maintainer placeholder in `docs/MAINTAINERS.md` — still deferred; fill before v2.0 GA.
- Week-2 keyword-filter calibration for Anthropic watcher (Open Q4 from Phase 1) — ongoing; no Phase 2 action needed.

</deferred>

---

*Phase: 02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b*
*Context gathered: 2026-05-25*
