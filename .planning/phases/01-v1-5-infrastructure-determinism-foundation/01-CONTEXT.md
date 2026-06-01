# Phase 1: v1.5 — Infrastructure & Determinism Foundation - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** `--auto` (recommended options selected for every gray area; user can review and amend before plan-phase)

<domain>
## Phase Boundary

Land the deterministic infrastructure that every v2.0a and v2.0b workflow depends on — **before any user-facing workflow authoring begins**. Concretely:

1. **Versioned JSON Schemas** (R24) for `persona.json`, `sitemap.json`, `manifest.json`, `interaction-spec.json`, `audit-report.json`, **`handoff-bundle.json`** (gap surfaced during research) — authored in Zod, emitted via `zod-to-json-schema`, validated at runtime by `ajv`.
2. **Gate-runner machinery** — base class returning `(terminal-state, evidence-grade)` tuples, supporting the four terminal states (PASS / PASS_WITH_WARNINGS / FAILED_AFTER_REPAIR / USER_OVERRIDDEN) plus `not-runnable` (codex §16 BLOCKER prerequisite), persisting results to `.complete-design/manifest.lock`.
3. **Handoff-bundle script + schema** — `handoff-bundle-build.mjs` produces `design/.handoff/stage-N-bundle.md` (5-15k tokens) that downstream workflows consume in lieu of raw upstream directories. The context-window survival mechanism.
4. **Determinism golden CI** — `complete-design verify --golden` proves 5× byte-identical output from every `assets/scripts/*.mjs` emit script; lint rule rejects LLM-client imports inside `assets/scripts/`.
5. **Aggregate coexistence eval harness** + per-skill `skillgrade`-style trigger eval — recall ≥0.85, false-fire ≤0.15 per skill, aggregate ≥0.80 with 5 popular packages installed.
6. **PII scanner** (`complete-design scan --pii`) — pre-commit hook + standalone CLI.
7. **Routing-matrix scaffolding** — all 7 routes wired (4 implemented in v2.0a, 3 stubbed as `ROUTE_NOT_YET_IMPLEMENTED`).
8. **Host-compatibility matrix CI scaffold** — Claude Code passes fully; Codex CLI + Cursor sequential-fallback stubs in place.
9. **Reference corpus for Stages 0+1+2+5** — the 12 mandatory MVP references plus the 6 stage-gate operational checklists.
10. **Preview harness preserved from v1.0.1** — port manager, security sandbox, Playwright readiness probe, Vite 6 / Next 15 / Astro 5 adapter scaffolds.
11. **Schema migration tooling** (`complete-design migrate`) — must accompany every schema bump.
12. **Anthropic-Labs watcher process** — weekly monitoring of `anthropics/skills`, Anthropic blog, Claude Design release notes from week 1.
13. **Frontmatter validator + `.gitignore`/`.gitattributes` defaults + manifest reconciler + recovery prompts.**

**Out of scope for Phase 1** (delivered in Phase 2 v2.0a):
- Any of the 7 stage workflows (`ingest`, `discover`, `structure`, `style-lite`, `systematize-lite`, basic `audit`).
- The 9 v2.0a atoms (`prd/parse-or-interview`, `research/synthesize`, etc.).
- Stage workflows that *use* the gates — only the gate-runner base class is in Phase 1.
- `audit --reverse-engineer-stages` (Phase 3, v2.0b).

**Out of scope full stop** (per PROJECT.md):
- React/Next/Vue inside the package itself (only as emit targets).
- Vector DB / knowledge graph for `references/`.
- Hosted SaaS / dashboard.

</domain>

<decisions>
## Implementation Decisions

### Schema authoring & emit (D-01 to D-04)

- **D-01:** **Zod-first single source of truth.** Each artifact type has one Zod source file (`schemas/src/persona.ts`, `schemas/src/sitemap.ts`, etc.). A build step (`assets/scripts/schemas/emit.mjs`) runs `zod-to-json-schema` and writes versioned JSON Schemas to `schemas/dist/persona.v1.json`, `schemas/dist/sitemap.v1.json`, etc. Rationale: single source of truth; refactor-safe; emits the runtime artifact the rest of the package consumes.
- **D-02:** **Versioning policy.** Schema major version bumps when a field changes type or becomes required; minor bumps add optional fields. v0.x not used — start at v1. The version travels in the filename (`persona.v1.json`) AND inside the schema's `$id` field for tooling that needs it.
- **D-03:** **Runtime validation.** `ajv` 8 + `ajv-formats` validates every workflow boundary (read or write of any canonical artifact). Validation failures surface a structured error including `schemaPath` + `dataPath` + the offending value — never silent.
- **D-04:** **Schema discovery.** A `schemas/index.json` manifest maps `artifact: persona|sitemap|...` → current version + dist-path. The frontmatter validator reads this manifest to pick the right schema; downstream code never hardcodes a schema path.

### Handoff-bundle generation (D-05 to D-08)

- **D-05:** **LLM-summarized body, deterministic frame.** Bundle bodies are LLM-summarized (the LLM "picks" what's salient about the upstream stage's output). The bundle's frontmatter, structure, schema, and token-budget enforcement are deterministic (script-emitted). The package boundary is `handoff-bundle-build.mjs` accepts a stage directory + LLM summary as input and emits the bundle in the canonical shape.
- **D-06:** **Token budget enforcement.** Token count is measured by `tiktoken` (cl100k_base — close enough for budget purposes across hosts); if a bundle exceeds 15k tokens, the script truncates the lowest-priority section and emits a `truncationWarning` in frontmatter. Floor is 3k tokens (below this we flag insufficient content).
- **D-07:** **Bundle schema sections.** Required: `Goal & scope`, `Decisions made (with terminal-state, evidence-grade)`, `Open questions`, `Artifacts inventory (paths + brief)`, `Pointers to verify` (where downstream LLMs can grab the raw artifact for verification queries), `Provenance (worst-case)`. Optional: `Risks surfaced`.
- **D-08:** **Bundle-sufficiency eval.** A v1.5-deliverable eval harness compares: Stage N+1 output produced from `bundle alone` vs `bundle + full upstream directory`. Acceptance: BLEU-like similarity ≥0.85 on a 5-fixture suite, OR domain-relevant divergences are explicitly tagged. (Methodology refinement is one of the research flags carried into Phase 1 planning.)

### Gate-runner API (D-09 to D-11)

- **D-09:** **Async function-based.** The gate base is an exported async function `runGate(stage, designDir, config) → GateResult`. `GateResult` is a discriminated union: `{kind: 'pass' | 'pass_with_warnings' | 'failed_after_repair' | 'user_overridden' | 'not_runnable', reason?, evidence?: 'validated' | 'proto' | 'inferred' | 'missing', findings: Finding[]}`. Rationale: Promise-based composes cleanly with the rest of the Node ESM emit layer; discriminated union catches missing handlers at type-check time.
- **D-10:** **Per-stage gates extend base.** Each stage gate (`assets/scripts/gates/stage-1.mjs`, …, `stage-5b.mjs`) imports the base and contributes stage-specific checklist items. Each item returns `{status: 'pass' | 'fail' | 'na', evidence, citation}` so terminal state aggregation is deterministic.
- **D-11:** **Override path.** `USER_OVERRIDDEN` requires `--override-reason "<text>"` flag at CLI invocation; reason is persisted in `manifest.lock` AND surfaces as a banner in every downstream artifact derived from this gate's stage (frontmatter field `overrideBanner: "..."`).

### Determinism CI gate (D-12 to D-14)

- **D-12:** **Scope.** `complete-design verify --golden` runs every script in `assets/scripts/` whose path matches `(emit|lint|validate|build|gate)` AND that has a sibling `*.golden.json` fixture. Each script runs 5× on the same input and asserts byte-identical output. LLM-touched paths are explicitly excluded.
- **D-13:** **Architecture lint.** A separate lint script (`assets/scripts/lint-determinism.mjs`) walks `assets/scripts/` and rejects any import path matching `(anthropic|openai|langchain|llamaindex|@anthropic-ai|@openai)`. Runs in CI as a hard gate.
- **D-14:** **Golden fixture management.** Fixtures live in `evals/fixtures/golden/<script>/`. Regenerating a fixture requires an explicit `npm run regen-golden -- --script <name> --reason "<text>"`; the reason is committed alongside the fixture diff (audit trail).

### Aggregate coexistence eval (D-15 to D-17)

- **D-15:** **5-package corpus.** The aggregate eval installs complete-design alongside: GSD (`get-shit-done`), Superpowers (`superpowers`), `frontend-design` (Anthropic, 277k+ installs), `shadcn` MCP, Notion MCP. Rationale: these are the most-installed Claude Code skill packages in mid-2026 per skills.sh telemetry.
- **D-16:** **Eval methodology.** A `triggers.yaml` corpus holds ≥30 should-fire prompts for complete-design' own skills and ≥30 should-fire prompts for the 5 coexisting packages. The harness measures recall on complete-design' skills with all 5 packages installed (no isolation). Threshold: ≥0.80. Methodology refinement is the second research flag.
- **D-17:** **Per-skill `skillgrade`-style harness.** In-tree, plug-compatible with Anthropic's skill-creator pattern. Each skill ships `triggers.yaml` with ≥10 should-fire + ≥10 should-not-fire prompts × 3 trials. CI gates: recall ≥0.85, false-fire ≤0.15.

### PII scanner (D-18 to D-20)

- **D-18:** **Regex-based, not ML.** Pattern set covers: email addresses (RFC 5322 subset), US/E.164 phone numbers, SSN, credit-card numbers (Luhn-validated), IPv4 addresses, common name patterns inside transcript-style headers (`Interviewer:`, `Participant:`, `User:`). Rationale: deterministic; no model dependency; zero-infra principle.
- **D-19:** **Pre-commit hook + CLI.** Hook installed via `npm run install-hooks` (opt-in for users; complete-design' own CI uses it). Standalone CLI `complete-design scan --pii [path]` runs anytime. Default scans `design/research/interviews/` and any `transcript*.md` matched by glob.
- **D-20:** **Allowlist.** Users can mark a file safe via `.complete-design/pii-allowlist.json` (file-path + content-hash). Hook re-scans and rejects if hash drifts.

### Routing-matrix scaffolding (D-21)

- **D-21:** **All 7 routes wired, 4 implemented in v2.0a.** The orchestrator entry point (`skills/design/SKILL.md` body) recognizes `--route <name>` for all 7 names. Phase 1 ships route registry + dispatcher; route bodies for `mature-app-refactor`, `DS-extraction`, full `new-product` are stub functions that exit cleanly with `ROUTE_NOT_YET_IMPLEMENTED — ships in v2.0b`. Rationale: clean v2.0a → v2.0b integration; route docs are visible to the LLM trigger discipline even before stage workflows ship.

### Host-compatibility matrix CI (D-22 to D-23)

- **D-22:** **In-repo `vitest` workspaces, three host profiles.** `evals/hosts/claude-code/` (full subagent dispatch — passes fully), `evals/hosts/codex-cli/` (sequential-fallback stub), `evals/hosts/cursor/` (sequential-fallback stub). Each profile re-runs the same fixture suite; targets within 0.10 of host-first pass rate (formal target for v2.0 GA, scaffolded in v1.5).
- **D-23:** **Sub-agent dispatch shim.** The `complete-design run-subagent <prompt>` helper detects host at runtime — uses native Task dispatch on Claude Code, falls back to sequential script execution on Codex/Cursor. v1.5 ships the helper + Claude Code path; sequential fallback gets minimum-viable implementation (just enough to satisfy fixture suite).

### Reference corpus (D-24 to D-26)

- **D-24:** **Condensed Markdown with canon citations** (not full quotes). Each reference file in `references/` is ≤2k tokens; citation pointers (`Garrett §4.1, p.62`) replace verbatim quotes. Rationale: copyright-safe; maintainable; LLM reads citations and can ask Context7 / web for the source if it needs deeper context.
- **D-25:** **Phase 1 ships Stage 0+1+2+5 references** per MVPA-06: `design-md`, `dtcg-v2025-10`, `wcag-2-2`, `radix-step-roles`, `shadcn-tailwind-v4`, `garrett-elements`, `cooper-goodwin`, `torres-ost`, `klement-jtbd`, `indi-young-thinking-styles`, `rosenfeld-ia`, `prd/lenny-one-pager` + the 4 v1.5-applicable gate-checklists (`gates/stage-1.md`, `gates/stage-2.md`, `gates/stage-5a.md`, `gates/stage-5b.md`).
- **D-26:** **`references/gates/` checklist format.** Each gate checklist is a Markdown table with columns `Check`, `Required for PASS`, `Required for VALIDATED grade`, `Citation`. Gate-runner reads the relevant table at runtime.

### Schema migration & frontmatter validation (D-27 to D-29)

- **D-27:** **Per-script migrations.** `schemas/migrations/v0-to-v1.mjs` style; one script per major version transition per artifact type. `complete-design migrate --from <v> --to <v> [--path <design-dir>]` invokes the appropriate chain.
- **D-28:** **Frontmatter validator strictness.** Strict for canonical artifacts in `design/` (reject if any required field missing or unknown field present); lenient for `.complete-design/private/` (warn only). Strict mode is the default; opt-out via `--lenient` flag for legacy migrations.
- **D-29:** **`.gitignore` / `.gitattributes` defaults.** Shipped as a `assets/templates/gitignore-complete-design.txt` + `gitattributes-complete-design.txt` pair. `complete-design init` writes them into the user's repo (or appends to existing files); CI ensures the complete-design' own repo uses them.

### Anthropic-Labs watcher (D-30 to D-31)

- **D-30:** **Hybrid: weekly manual review + GitHub Actions cron.** A maintainer owns the weekly Friday review (named in `MAINTAINERS.md`). A GitHub Actions workflow runs daily, polls the `anthropics/skills` GitHub release feed + Anthropic blog RSS + Claude Design release notes, and opens an issue tagged `competitive-watch` if novel keywords (`5-stage`, `design process`, `IA`, `wireframe`, `state machine`, `audit`) appear in titles. Rationale: cheap automation + accountable human.
- **D-31:** **Rapid-response template.** A `docs/RAPID-RESPONSE.md` template (positioning pivot, marketplace copy variants, outreach list) lives in the repo. If a competitive 5-stage launch is detected, the maintainer fills the template and ships within 72h.

### Claude's Discretion

- Exact directory tree under `assets/scripts/` (e.g., should gates be `scripts/gates/` or top-level `scripts/`).
- Choice of `pino` vs `winston` vs raw `console.error` for structured logging — defer to Phase 1 planner per existing Node 22 LTS norms.
- Whether to use `pnpm` workspaces or `npm` workspaces for `evals/` host profiles — defer to planner.
- Whether the `schemas/dist/` directory commits to git (consistent regen) or is `.gitignore`'d with a CI build (cleaner diff) — planner decides per CI cost.
- Test framework: `vitest` 2 was specified in STACK.md; planner confirms.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project (mandatory)
- `.planning/PROJECT.md` — project context, core value, 26 active requirements, constraints, key decisions
- `.planning/REQUIREMENTS.md` — full v1 REQ-IDs with traceability mapping (56 IDs assigned to Phase 1)
- `.planning/ROADMAP.md` — 4-phase structure with Phase 1 deliverables list, success criteria, depends-on chain
- `.planning/STATE.md` — project memory and v1.5 length decision rationale
- `.planning/config.json` — granularity=coarse, parallelization=true, commit_docs=true, model_profile=quality

### Research (mandatory — informs every Phase 1 decision)
- `.planning/research/SUMMARY.md` — synthesis of stack, features, architecture, pitfalls; v1.5 length conflict (3 vs 4 weeks) resolution
- `.planning/research/STACK.md` — pinned versions (Node 22 LTS, TypeScript 5.7+, Zod 4.4, Playwright 1.60, etc.) and explicit "do not use" list
- `.planning/research/FEATURES.md` — table stakes / differentiators / anti-features categorization with MVP version flags
- `.planning/research/ARCHITECTURE.md` — 13 components, 6 patterns, build order, 12 risks with detection + prevention
- `.planning/research/PITFALLS.md` — 13 critical pitfalls with phase mapping; 7 of 13 land on v1.5

### Source-of-truth MRD
- `complete-design-mrd-v2.md` §3.5 (Garrett 5-plane spine), §3.6 (`design/` directory + governance), §3.9 (composition contract), §3.10 (knowledge architecture / references), §3.16 (recovery/versioning), §3.18 (security/permissions), §3.19 (determinism verification), §3.22 (stage-validation gates), §3.23 (fidelity caps), §9.1 (v2.0a MVP scope incl. the `style-lite` BLOCKER fix), §10 (roadmap), §11 (success metrics — for CI eval thresholds), §16 (codex acceptance record — 21 v2.0 findings, all accepted)

### External specifications (cited at canon granularity per P4)
- agentskills.io v1 SKILL.md spec — https://agentskills.io/specification — distribution unit
- W3C DTCG v2025.10 — https://www.w3.org/community/design-tokens/ — token spec for Stage 5b emit; pin v2025.10
- Google DESIGN.md — https://github.com/google-labs-code/design.md — Stage 5 contract; pin schema version in `design-md-validate.mjs`; Apache-2.0
- Anthropic skill-creator pattern — https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills — eval/A-B/trigger-tuning analog for `skillgrade`-style harness

### User-level constitution
- `~/.claude/CLAUDE.md` — user-level Claude operating rules (Stack architecture, GSD↔Superpowers tiebreaker, precedence rules, TS discipline, AI integration discipline, Universal "never do" list, Read-only multi-model review)
- `CLAUDE.md` (project root) — generated GSD workflow guidance

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **None — Phase 1 is greenfield infrastructure.** No `assets/scripts/`, `references/`, `schemas/`, or `skills/` directories exist yet. Phase 1 establishes them.
- v1.0.1 preview harness (port manager, security sandbox, Playwright readiness, variant-distance metric, dev-server adapters for Vite/Next/Astro) is referenced from the MRD §3.11+ but **not present in the current repo** — it is preserved-from-v1.0.1 as a design pattern, not as inherited code. Phase 1 must (re-)specify and (re-)implement it from the v1.0.1 documentation. SUMMARY.md §"Roadmap Implications" calls this out explicitly as a "treat v1.5 as the explicit re-spec phase, not 'preserved verbatim'" note.

### Established Patterns (from user-level CLAUDE.md)

- **TS discipline (CLAUDE.md):** strict mode, no `any` (use `unknown` + type guards), Zod for runtime validation at boundaries, no `@ts-ignore` without documented reason.
- **AI integration (CLAUDE.md):** all AI API calls server-side; structured output validated against runtime schema; graceful degradation if AI call fails. Phase 1 has no AI API calls itself (those land in Phase 2 workflows) — but the patterns apply when the gate-runner integrates with skill-driven LLM steps.
- **Commit conventions (CLAUDE.md):** Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, etc.); one logical change per commit; never commit secrets / `.env` / credentials.
- **Universal "never do" (CLAUDE.md):** never install new dependencies without explicit approval — Phase 1 dependency list (Node 22, TypeScript 5.7+, Zod 4.4, ajv 8, `gray-matter`, `yaml`, `culori` 4, `apca-w3`, `@bjornlu/wcag-contrast`, Playwright 1.60, `vitest` 2, `axe-core` 4.11, `tiktoken`, `zod-to-json-schema`) is locked here via STACK.md and counts as explicit approval; planner does not need to re-ask per dependency.
- **shadcn rules (CLAUDE.md):** apply only if `components/ui/` exists. Phase 1 does not touch frontend; rules don't fire.

### Integration Points

- The package boundary with the user's repo is **read** only in Phase 1 (preview harness reads adapter targets; PII scanner reads `design/research/`). **Write** to the user's repo first happens in Phase 2's `style` and `systematize` workflows (and even then, diff-by-default + `--apply` required per TRUST-02).
- Phase 1 deliverables live in two trees: (a) **package source** under `assets/scripts/`, `schemas/`, `references/`, `skills/`, `evals/`; (b) **user-repo artifacts** the package *expects to write/read* in Phase 2+: `design/<stage>/`, `design/.handoff/`, `.complete-design/`. Phase 1 ships only (a); (b) is exercised by tests/fixtures.

</code_context>

<specifics>
## Specific Ideas

- **The v1.5 length decision (4 weeks, not 3) is locked at the roadmap level.** Phase 1 planner should size the work to four weeks and is explicitly authorized to push back if Phase 1 plans imply more than 4 weeks — the trade-off in that scenario is descope, not slip.
- **Codex §16 BLOCKER fix is a Phase 1 prerequisite, not a Phase 2 deliverable.** The gate-runner base class MUST support `not-runnable` as a terminal state from day one. Phase 2's `style-lite`/`systematize-lite` then *use* this mechanism; it is not invented in Phase 2.
- **Handoff-bundle schema is the architecture's single biggest novelty.** Per ARCHITECTURE.md the bundle-sufficiency eval methodology is the #1 research flag for Phase 1 planning. Treat it as an open empirical question, not a settled design.
- **The aggregate coexistence eval is the #2 research flag.** No off-the-shelf tool tests trigger recall in a multi-package install state. Phase 1 ships the methodology + harness; v2.0 GA enforces the ≥0.80 threshold as a release gate.
- **Anthropic-Labs watcher is live from week 1 of Phase 1 — not week 1 of Phase 2.** This is the GTM kill-risk mitigation (Pitfall 9, MRD §12 Existential). The maintainer doing the weekly review is named in `MAINTAINERS.md`; the daily GitHub Actions cron lands in CI in Phase 1.

</specifics>

<deferred>
## Deferred Ideas

These came up as relevant but belong in later phases or v2.1+:

- **Tokens Studio Figma export ingestion** — designer-side workflow; v2.1.
- **Optimal Workshop tree-test CSV ingestion** — for Stage 2 validation; v2.1 atom `ia/tree-test-design`.
- **Dovetail / Notably interview-transcript ingestion** — v2.2.
- **Notion / Linear / Google Doc PRD ingestion** — v2.1; CLAUDE.md restricts Notion to Gaia Logic projects.
- **Voice → PRD interview mode** (Whisper) — v2.2.
- **`complete-design-bridges` (Material Web / Vue / Svelte adapters)** — sibling package; v2.1.
- **Storybook MCP via Chromatic integration** — v2.1.
- **Enterprise design-process-compliance SKU** — separate sibling product; year-2+.
- **VS Code Copilot host parity** — depends on VS Code Agent Skills GA; v2.1+.
- **Junie host parity** — host churn; v2.1+ once host APIs stabilize.
- **`audit --reverse-engineer-stages`** — primary persona feature; Phase 3 (v2.0b) — does NOT land in v1.5 infra.
- **Stage 3 structural-diversity metric design** — Phase 3 deep research (the metric is unprecedented; v1.0.1's 6-axis visual-style metric does not apply to greyscale wireframes).
- **Reverse-engineer fidelity adversarial fixtures** — Phase 3 research.

### Reviewed Todos (not folded)
- (none — no todos existed at phase initialization)

</deferred>

---

*Phase: 1-v1.5 Infrastructure & Determinism Foundation*
*Context gathered: 2026-05-24*
