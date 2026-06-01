# Phase 1: v1.5 — Infrastructure & Determinism Foundation - Research

**Researched:** 2026-05-24
**Domain:** SKILL.md package infrastructure — versioned schemas, deterministic Node ESM emit, evidence-graded gates, handoff bundles, eval harness, preview harness
**Confidence:** HIGH on stack pins, ESM patterns, GitHub Actions cron, port management; MEDIUM on bundle-sufficiency-eval methodology (novel), aggregate coexistence eval (novel — no off-the-shelf tool); LOW on long-term stability of two locked deps (`zod-to-json-schema` is end-of-life as of Nov 2025 — see Open Questions Q1).

## Summary

Phase 1 is greenfield infrastructure for a Markdown + Node 22 LTS ESM package — **no React/Next/Vue** ships in this phase. The package boundary is `.claude/skills/`-installable; build-time deps live in the complete-design repo only. Phase 1 lands 13 deliverables in 4 weeks: versioned JSON Schemas (6 artifact types), gate-runner machinery with `not-runnable` terminal state, handoff-bundle script + sufficiency eval, determinism golden CI, aggregate coexistence eval harness, PII scanner, host-compatibility matrix CI scaffold, routing-matrix scaffolding for all 7 routes, references corpus for Stages 0+1+2+5, preview harness (port manager + security sandbox + Playwright readiness + Vite/Next/Astro adapter scaffolds), schema migration tooling, Anthropic-Labs watcher (weekly + daily cron), frontmatter validator + `.gitignore`/`.gitattributes` defaults + manifest reconciler + recovery prompts.

Every decision across 11 areas is **locked in CONTEXT.md** — research drives *how* to implement, not *what* to choose. The four research flags that came in (bundle-sufficiency eval methodology, aggregate coexistence eval methodology, `skillgrade`-style harness, Excalidraw schema pinning) are addressed in concrete patterns below. One critical surprise emerged: **`zod-to-json-schema` (the package named in D-01) was deprecated November 2025 — Zod 4 has built-in `z.toJSONSchema()` that the planner should use instead.** This is a non-blocking adjustment to a locked decision (D-01's *intent* — Zod-first single source emitting versioned JSON Schemas — is preserved; only the *implementation library* changes).

**Primary recommendation:** Adopt the recommended Phase 1 plan decomposition below (5 plans: schemas-foundation, gate-and-handoff-runner, determinism-and-eval-CI, design-governance-and-PII, preview-harness-and-routing-scaffolding). Each is sized to one week. The cross-cutting Anthropic-Labs watcher is a small additive deliverable folded into Plan 5.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema authoring & emit (D-01 to D-04):**
- **D-01:** Zod-first single source of truth. Each artifact type has one Zod source file (`schemas/src/persona.ts`, etc.). A build step (`assets/scripts/schemas/emit.mjs`) runs `zod-to-json-schema` and writes versioned JSON Schemas to `schemas/dist/persona.v1.json`, etc. [VERIFIED: see Open Q1 — `zod-to-json-schema` is EOL as of Nov 2025; Zod 4's built-in `z.toJSONSchema()` preserves D-01's intent and is the recommended substitute.]
- **D-02:** Versioning policy. Schema major version bumps when a field changes type or becomes required; minor bumps add optional fields. v0.x not used — start at v1. Version travels in filename (`persona.v1.json`) AND inside schema's `$id` field.
- **D-03:** Runtime validation. `ajv` 8 + `ajv-formats` validates every workflow boundary. Validation failures surface a structured error including `schemaPath` + `dataPath` + the offending value — never silent.
- **D-04:** Schema discovery. A `schemas/index.json` manifest maps `artifact: persona|sitemap|...` → current version + dist-path. Frontmatter validator reads this manifest; downstream code never hardcodes a schema path.

**Handoff-bundle generation (D-05 to D-08):**
- **D-05:** LLM-summarized body, deterministic frame. Bundle bodies are LLM-summarized; the bundle's frontmatter, structure, schema, and token-budget enforcement are deterministic (script-emitted). Package boundary is `handoff-bundle-build.mjs` accepts a stage directory + LLM summary as input and emits the bundle in the canonical shape.
- **D-06:** Token budget enforcement via `tiktoken` (cl100k_base — close enough for budget purposes across hosts); if a bundle exceeds 15k tokens, the script truncates the lowest-priority section and emits a `truncationWarning` in frontmatter. Floor is 3k tokens.
- **D-07:** Bundle schema sections. Required: `Goal & scope`, `Decisions made (with terminal-state, evidence-grade)`, `Open questions`, `Artifacts inventory (paths + brief)`, `Pointers to verify`, `Provenance (worst-case)`. Optional: `Risks surfaced`.
- **D-08:** Bundle-sufficiency eval. A v1.5-deliverable eval harness compares: Stage N+1 output produced from `bundle alone` vs `bundle + full upstream directory`. Acceptance: BLEU-like similarity ≥0.85 on a 5-fixture suite, OR domain-relevant divergences are explicitly tagged. (Methodology refinement carried in Research Flag #1 below.)

**Gate-runner API (D-09 to D-11):**
- **D-09:** Async function-based. Base is exported async function `runGate(stage, designDir, config) → GateResult`. `GateResult` is a discriminated union: `{kind: 'pass' | 'pass_with_warnings' | 'failed_after_repair' | 'user_overridden' | 'not_runnable', reason?, evidence?: 'validated' | 'proto' | 'inferred' | 'missing', findings: Finding[]}`.
- **D-10:** Per-stage gates extend base. Each stage gate (`assets/scripts/gates/stage-1.mjs`, …, `stage-5b.mjs`) imports the base and contributes stage-specific checklist items. Each item returns `{status: 'pass' | 'fail' | 'na', evidence, citation}`.
- **D-11:** Override path. `USER_OVERRIDDEN` requires `--override-reason "<text>"` flag at CLI invocation; reason is persisted in `manifest.lock` AND surfaces as a banner in every downstream artifact (`overrideBanner: "..."` frontmatter).

**Determinism CI gate (D-12 to D-14):**
- **D-12:** Scope. `complete-design verify --golden` runs every script in `assets/scripts/` whose path matches `(emit|lint|validate|build|gate)` AND that has a sibling `*.golden.json` fixture. 5× byte-identical output. LLM-touched paths explicitly excluded.
- **D-13:** Architecture lint. A separate `assets/scripts/lint-determinism.mjs` walks `assets/scripts/` and rejects any import path matching `(anthropic|openai|langchain|llamaindex|@anthropic-ai|@openai)`. Runs in CI as a hard gate.
- **D-14:** Golden fixture management. Fixtures live in `evals/fixtures/golden/<script>/`. Regenerating requires explicit `npm run regen-golden -- --script <name> --reason "<text>"`; reason committed alongside fixture diff (audit trail).

**Aggregate coexistence eval (D-15 to D-17):**
- **D-15:** 5-package corpus. The aggregate eval installs complete-design alongside: GSD (`get-shit-done`), Superpowers (`superpowers`), `frontend-design` (Anthropic, 277k+ installs), `shadcn` MCP, Notion MCP.
- **D-16:** Eval methodology. A `triggers.yaml` corpus holds ≥30 should-fire prompts for complete-design' own skills and ≥30 should-fire prompts for the 5 coexisting packages. Recall threshold: ≥0.80 with all 5 packages installed.
- **D-17:** Per-skill `skillgrade`-style harness. In-tree, plug-compatible with Anthropic's skill-creator pattern. Each skill ships `triggers.yaml` with ≥10 should-fire + ≥10 should-not-fire prompts × 3 trials. CI gates: recall ≥0.85, false-fire ≤0.15.

**PII scanner (D-18 to D-20):**
- **D-18:** Regex-based, not ML. Pattern set: email addresses (RFC 5322 subset), US/E.164 phone numbers, SSN, credit-card numbers (Luhn-validated), IPv4 addresses, common name patterns inside transcript-style headers (`Interviewer:`, `Participant:`, `User:`).
- **D-19:** Pre-commit hook + CLI. Hook installed via `npm run install-hooks` (opt-in). Standalone CLI `complete-design scan --pii [path]`. Default scans `design/research/interviews/` and any `transcript*.md` matched by glob.
- **D-20:** Allowlist. Users mark a file safe via `.complete-design/pii-allowlist.json` (file-path + content-hash). Hook re-scans and rejects if hash drifts.

**Routing-matrix scaffolding (D-21):** All 7 routes wired, 4 implemented in v2.0a. Phase 1 ships route registry + dispatcher; route bodies for `mature-app-refactor`, `DS-extraction`, full `new-product` are stub functions that exit cleanly with `ROUTE_NOT_YET_IMPLEMENTED — ships in v2.0b`.

**Host-compatibility matrix CI (D-22 to D-23):**
- **D-22:** In-repo `vitest` workspaces, three host profiles. `evals/hosts/claude-code/` (full subagent dispatch), `evals/hosts/codex-cli/` (sequential-fallback stub), `evals/hosts/cursor/` (sequential-fallback stub). Targets within 0.10 of host-first pass rate.
- **D-23:** Sub-agent dispatch shim. `complete-design run-subagent <prompt>` helper detects host at runtime — uses native Task dispatch on Claude Code, falls back to sequential script execution on Codex/Cursor. v1.5 ships the helper + Claude Code path; sequential fallback gets minimum-viable implementation.

**Reference corpus (D-24 to D-26):**
- **D-24:** Condensed Markdown with canon citations (not full quotes). Each reference file in `references/` is ≤2k tokens; citation pointers (`Garrett §4.1, p.62`) replace verbatim quotes.
- **D-25:** Phase 1 ships Stage 0+1+2+5 references per MVPA-06: `design-md`, `dtcg-v2025-10`, `wcag-2-2`, `radix-step-roles`, `shadcn-tailwind-v4`, `garrett-elements`, `cooper-goodwin`, `torres-ost`, `klement-jtbd`, `indi-young-thinking-styles`, `rosenfeld-ia`, `prd/lenny-one-pager` + the 4 v1.5-applicable gate-checklists (`gates/stage-1.md`, `gates/stage-2.md`, `gates/stage-5a.md`, `gates/stage-5b.md`).
- **D-26:** `references/gates/` checklist format. Each gate checklist is a Markdown table with columns `Check`, `Required for PASS`, `Required for VALIDATED grade`, `Citation`. Gate-runner reads the relevant table at runtime.

**Schema migration & frontmatter validation (D-27 to D-29):**
- **D-27:** Per-script migrations. `schemas/migrations/v0-to-v1.mjs` style; one script per major version transition per artifact type. `complete-design migrate --from <v> --to <v> [--path <design-dir>]` invokes the appropriate chain.
- **D-28:** Frontmatter validator strictness. Strict for canonical artifacts in `design/` (reject if any required field missing or unknown field present); lenient for `.complete-design/private/` (warn only). Strict mode is the default; opt-out via `--lenient` flag.
- **D-29:** `.gitignore` / `.gitattributes` defaults shipped as `assets/templates/gitignore-complete-design.txt` + `gitattributes-complete-design.txt` pair. `complete-design init` writes them into the user's repo (or appends to existing); CI ensures the complete-design repo uses them.

**Anthropic-Labs watcher (D-30 to D-31):**
- **D-30:** Hybrid: weekly manual review + GitHub Actions cron. Maintainer named in `MAINTAINERS.md`. GitHub Actions workflow runs daily, polls `anthropics/skills` GitHub release feed + Anthropic blog RSS + Claude Design release notes, opens an issue tagged `competitive-watch` if novel keywords (`5-stage`, `design process`, `IA`, `wireframe`, `state machine`, `audit`) appear in titles.
- **D-31:** Rapid-response template. A `docs/RAPID-RESPONSE.md` template (positioning pivot, marketplace copy variants, outreach list) lives in the repo.

### Claude's Discretion

- Exact directory tree under `assets/scripts/` (e.g., should gates be `scripts/gates/` or top-level `scripts/`).
- Choice of `pino` vs `winston` vs raw `console.error` for structured logging — defer to Phase 1 planner per existing Node 22 LTS norms.
- Whether to use `pnpm` workspaces or `npm` workspaces for `evals/` host profiles — defer to planner. **Recommended: `npm` workspaces** (see Architecture Patterns: Project Structure rationale below). Rationale: Phase 1 has only 3 workspace projects (`evals/hosts/{claude-code,codex-cli,cursor}/`), well below pnpm's break-even point (10+ packages). npm workspaces ship with Node 22 LTS — zero extra install for users. The complete-design repo is the only place workspaces are used; users never see them.
- Whether the `schemas/dist/` directory commits to git (consistent regen) or is `.gitignore`'d with a CI build (cleaner diff) — planner decides per CI cost. **Recommended: commit `schemas/dist/`** so the package can be installed without a build step on the user's machine. CI verifies regen-determinism via golden test.
- Test framework: `vitest` 2 confirmed (STACK.md HIGH confidence; vitest 2 has stable workspace/projects config — note: workspace renamed to `projects` in vitest 3.2, planner may use either).

### Deferred Ideas (OUT OF SCOPE)

- Tokens Studio Figma export ingestion — v2.1
- Optimal Workshop tree-test CSV ingestion — v2.1
- Dovetail / Notably interview-transcript ingestion — v2.2
- Notion / Linear / Google Doc PRD ingestion — v2.1
- Voice → PRD interview mode (Whisper) — v2.2
- `complete-design-bridges` (Material Web / Vue / Svelte adapters) — v2.1
- Storybook MCP via Chromatic — v2.1
- Enterprise design-process-compliance SKU — year-2+
- VS Code Copilot host parity — v2.1+
- Junie host parity — v2.1+
- `audit --reverse-engineer-stages` — Phase 3 (v2.0b)
- Stage 3 structural-diversity metric design — Phase 3
- Reverse-engineer fidelity adversarial fixtures — Phase 3
- React/Next/Vue inside the package itself — out of scope full stop (PROJECT.md)
- Vector DB / knowledge graph for `references/` — out of scope full stop (PROJECT.md)
- Hosted SaaS / dashboard — out of scope full stop (PROJECT.md)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIST-01 | Package conforms to agentskills.io v1 SKILL.md spec | Standard Stack (agentskills.io v1 spec, gray-matter for frontmatter) |
| DIST-02 | 22 triggerable skills total trigger metadata ≤5k chars | Architecture Pattern: Trigger Discipline; eval harness in Plan 3 |
| DIST-03 | Per-skill description ≤200 chars, 5+ trigger phrases, keywords in first 100 chars | Eval harness validates; see Skillgrade-Style Harness pattern |
| SPINE-01..04 | Garrett 5-plane spine; `stage:` frontmatter; 6 architectural patterns; linear forward data flow | Architecture Patterns 1-6 below |
| ART-01..07 | `design/` substrate + per-file commit policy + frontmatter + .gitattributes + PII scanner + `.complete-design/` + MANIFEST.md | `design/`-governance plan (Plan 4) |
| GATE-01..07 | 6 stage gates as Node ESM checklists; `(terminal-state, evidence-grade)` tuple persisted in `manifest.lock`; 4 terminal states; 4 evidence grades; `USER_OVERRIDDEN` + `--override-reason` + downstream banner; `audit --ci` blocks on severities; `not-runnable` from day one | Gate-and-handoff-runner plan (Plan 2); Code Examples below |
| HAND-01..04 | `design/.handoff/stage-N-bundle.md` ~5-15k tokens; versioned JSON Schema; next-stage reads only bundle; bundle-sufficiency eval | Handoff-bundle pattern below; Bundle-Sufficiency Eval Methodology (Research Flag #1) |
| FORMAT-01..07 | PRD = MD + YAML 1.2; Personas = JSON; sitemap custom `$type`; flows = Mermaid; Wireframes = Excalidraw JSON (pinned); IxD = MD + XState v5; Tokens = DTCG v2025.10; DESIGN.md per Google spec; `design-md-validate.mjs` supports schema version pinning | Standard Stack table + Format pinning |
| REF-01, REF-02, REF-04 | `references/` hybrid file-based no vector DB by stage and canon body; Stage 0+1+2+5 reference corpus complete by end of v1.5; 6 stage-gate operational checklists | References Corpus plan (Plan 5) per D-24/D-25/D-26 |
| PREV-01..05 | Preview harness preserved from v1.0.1 — port manager, security sandbox, Playwright 1.60 readiness probe, headless screenshot; Vite 6 / Next 15 / Astro 5 adapter scaffolds; determinism CI gate; CI linter rejects LLM imports; variant-distance metric (6-axis preserved) | Preview-harness plan (Plan 5); Code Examples (Port Manager, Playwright Readiness) |
| TRUST-01..05 | Never claim WCAG conformance; diff-by-default + `--apply`; cite canon; avoid "AI design" framing; 3-5 question intake | Architecture pattern: Trust Posture; copy review checklist in Plan 4 |
| TRIG-01, TRIG-02, TRIG-04 | Per-skill `skillgrade` eval; recall ≥0.85, false-trigger ≤0.15; contingency split lever | Skillgrade-Style Harness pattern; eval CI plan |
| PERSIST-01..04 | `design/` vs `.complete-design/` split; decision log + hash chain + manual-override capture preserved from v1.0.1; schema migration tooling; recovery semantics (confirm-before-regenerate) | Plan 4 + manifest.lock hash-chain pattern in Code Examples |
| ROUTE-08 | Default ≠ all 5 stages; orchestrator suggests route from repo signals or asks confirmation | Routing-matrix scaffold plan (Plan 5) |
| SCHEMA-01..07 | 6 versioned JSON Schemas + runtime validation via ajv 8 + ajv-formats | Plan 1 schemas-foundation |
| RECOV-01..03 | Interrupt-after-any-stage; resume-from-any-boundary; 100% scripted-test pass | Plan 4: recovery prompts + sourceHash mismatch detection |
| GTM-06 | Anthropic-Labs watcher process active from v1.5 | Plan 5: GitHub Actions cron pattern (Code Examples) |
</phase_requirements>

## Architectural Responsibility Map

complete-design is a Markdown + Node ESM package that runs inside a host agent. It has no traditional client/server tiers. The "tier" model below is adapted to its actual layers:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema authoring (Zod sources) | Package build-time | — | Zod TS sources live in `schemas/src/`; compiled to JSON Schemas at build, never at runtime in user repo |
| Schema runtime validation | Package scripts (Node ESM) | — | `ajv` 8 in every `assets/scripts/*.mjs` that reads or writes `design/` artifacts |
| Gate-runner execution | Package scripts (Node ESM) | — | Pure Node; no LLM calls in `assets/scripts/`; enforced by lint-determinism.mjs |
| LLM-summarized bundle bodies | Host agent (LLM) | Package scripts (frame) | LLM picks salient content (D-05); script enforces deterministic frame + token budget |
| `design/` artifact persistence | User repo (git-tracked) | — | Committed cross-stage IR; designer- and AI-readable |
| `.complete-design/` package state | User repo (selective git) | — | manifest.lock committed; private/ gitignored per v1.0.1 |
| Preview dev-server spawn | User repo runtime | Package scripts (orchestration) | Vite/Next/Astro run in user's repo; Node script manages lifecycle |
| Trigger metadata (SKILL.md) | Host agent (skill index) | — | Host owns trigger dispatch; package supplies frontmatter |
| Subagent dispatch | Host agent (Claude Code) | Package scripts (fallback shim) | Claude Code native Task; Codex/Cursor get sequential-fallback shim |
| Eval harness | Package CI (GitHub Actions) | — | Runs in complete-design's own CI, not user's repo |
| Anthropic-Labs watcher | Package CI (GitHub Actions cron) | Maintainer (human) | Daily automated polling + weekly human review per D-30 |
| PII scanner pre-commit hook | User repo (git hook) | Package scripts (logic) | Hook installed opt-in; logic shipped in package |

**Why this matters:** Phase 1 has no risk of misassigning "auth to client" — it has different misassignment risks. The top risk is **putting LLM calls inside `assets/scripts/`** (violates D-13 determinism lint). The lint-determinism.mjs script (Plan 3) detects this.

## Standard Stack

### Core (verified against npm registry + Context7 where available)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 22 LTS | Runtime for all `assets/scripts/*.mjs` | [VERIFIED: STACK.md confirmed Node 22.21.0 present locally; Vite 6 requires Node 20+] |
| TypeScript | 5.7.x | Strict mode for `schemas/src/*.ts` + adapter source | [CITED: STACK.md HIGH confidence; CLAUDE.md TS discipline] |
| Zod | 4.4.x | Schema authoring (D-01) | [VERIFIED: Zod 4 stable; built-in `.toJSONSchema()` method (zod.dev/json-schema)] |
| ajv | 8.x | Runtime JSON Schema validation (D-03) | [VERIFIED: ajv supports Draft 2020-12, default Zod 4 toJSONSchema target] |
| ajv-formats | 3.x | Format validators (email/date/uri) for ajv 8 | [CITED: ajv.js.org/packages/ajv-formats.html] |
| gray-matter | 4.0.x | Parse YAML frontmatter (read-only) | [CITED: STACK.md HIGH] |
| yaml (eemeli/yaml) | 2.x | YAML 1.2 round-trip writer (preserves comments) | [CITED: STACK.md; js-yaml does not round-trip cleanly] |
| tiktoken | 1.0.x (`tiktoken` npm) | cl100k_base token counting for D-06 | [VERIFIED: WASM-backed; 421ms for large batches; ESM-compatible. Package: `tiktoken` (not `@dqbd/tiktoken` which is the older fork)] |
| culori | 4.x (ESM) | OKLCH / contrast math | [VERIFIED: STACK.md HIGH] |
| apca-w3 | latest | APCA contrast measurement | [CITED: STACK.md HIGH] |
| @bjornlu/wcag-contrast | latest | WCAG 2.2 contrast ratio measurement | [CITED: STACK.md HIGH] |
| Playwright | 1.60.x (`@playwright/test`) | Preview screenshot + readiness probe | [CITED: STACK.md HIGH; Node 22 matrix tested] |
| vitest | 2.x | Unit + golden test runner | [CITED: STACK.md HIGH; workspace renamed to `projects` in v3.2, both compatible with Phase 1 needs] |
| tsx | 4.x | Run TS during dev (`tsx schemas/src/...`) | [CITED: STACK.md HIGH] |
| axe-core | 4.11.x | A11y CI gate (Phase 1: installed but exercised in Phase 2+ workflows) | [VERIFIED: npm 4.11.4 current] |
| commander | 12.x | CLI parsing for `assets/scripts/*.mjs` | [CITED: STACK.md] |
| pino | 9.x | Structured logging to `.complete-design/private/run-log.jsonl` (D-claude-discretion; recommended) | [CITED: STACK.md] |
| globby | 14.x | File discovery for `design/` walking | [CITED: STACK.md] |
| semver | 7.x | `schemaVersion` comparison | [CITED: STACK.md] |
| get-port | 7.x | TCP port allocation for preview harness | [VERIFIED: sindresorhus/get-port; built-in in-process locking 15-30s; `reserve` option for long lifetimes] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mermaid-js/mermaid-cli | 11.x | Headless Mermaid render (designer-readable Mermaid renderer per Pitfall 12) | Phase 1 ships the renderer; Stage 4 ships in Phase 3 |
| @excalidraw/excalidraw | **pin 0.18.0** | Excalidraw element schema reference | [VERIFIED: v0.18.0 introduced `baseline` removal; pin exact version to survive 2025-2026 schema changes — see Pitfalls] |
| zod-to-json-schema | **DEPRECATED — use Zod 4's `z.toJSONSchema()` instead** | (intended emit step in D-01) | [VERIFIED: zod-to-json-schema npm page declares "no longer actively maintained" as of Nov 2025; Zod 4 has native `z.toJSONSchema()` targeting Draft 2020-12 by default] — see Open Q1 |
| zod-validation-error | 3.x | Friendly error messages from Zod failures | Optional; recommended for D-03 structured error surface |
| husky | 9.x | git hooks runner for PII pre-commit (D-19) | Plan 4 |
| lint-staged | 15.x | Run PII scan on staged files only | Optional; complements husky for performance |
| dotenv | (none — Phase 1 has no secrets) | — | Skip; Phase 1 needs no env vars |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `tiktoken` npm | `js-tiktoken` (pure JS) | Pure JS is slower (~2.5×) but works in any runtime; tiktoken (WASM) is faster, Node-only — recommend for Phase 1 |
| Zod 4 `z.toJSONSchema()` | `@alcyone-labs/zod-to-json-schema` fork (still maintained) | Fork preserves D-01 implementation literally; Zod-native is forward-compatible and zero-dep. Recommend Zod-native. |
| `get-port` | `portfinder` | `portfinder` is older and lacks the in-process lock that prevents EADDRINUSE races during parallel preview spawns. `get-port` (sindresorhus) is the modern choice. |
| `vm2` for security sandbox | `isolated-vm`, Docker, or **no untrusted code execution** | [VERIFIED: vm2 has had a "steady stream of sandbox escapes" — CVE-2026-22709 + 11 advisories in early 2026; project maintainer recommends migration]. **Recommendation: Phase 1 security sandbox should NOT execute arbitrary user code at all.** The "sandbox" is a permission boundary (forbid reads outside allowed paths, forbid network calls during preview boot). See Security Sandbox Threat Model below. |
| npm workspaces | pnpm workspaces | pnpm faster + better filtering, but pnpm requires users install pnpm; complete-design already uses npm. With only 3 workspace projects in Phase 1, npm wins on zero-extra-install. Revisit at Phase 4 if eval matrix grows. |
| `husky` | `simple-git-hooks` | husky is more popular; simple-git-hooks is zero-dep. Either works; husky's broader docs win for OSS adoption. |

**Installation (one block — verified versions; Phase 1 build-time only):**

```bash
# In the complete-design repo, after Phase 1 init:

# Core
npm install -E zod@^4.4 ajv@^8 ajv-formats@^3 gray-matter@^4 yaml@^2 \
  tiktoken@^1 culori@^4 apca-w3@latest @bjornlu/wcag-contrast@latest \
  semver@^7 globby@^14 pino@^9 commander@^12 get-port@^7

# Render / preview (Mermaid renderer ships Phase 1; Excalidraw consumed Phase 3)
npm install -E mermaid@^11.15 @mermaid-js/mermaid-cli@^11.15 \
  @excalidraw/excalidraw@0.18.0

# Dev
npm install -ED typescript@^5.7 tsx@^4 vitest@^2 \
  @playwright/test@^1.60 axe-core@^4.11 \
  eslint@^9 @typescript-eslint/eslint-plugin@^8 @typescript-eslint/parser@^8 \
  prettier@^3 husky@^9 lint-staged@^15

# One-time:
npx playwright install --with-deps chromium
npx husky init
```

**Version verification:** Run `npm view <pkg> version` before committing the lockfile. Locked versions above were validated against npm registry findings during research (May 2026). Zod 4.4.x ships Draft 2020-12 by default. tiktoken (`tiktoken` package, not `@dqbd/tiktoken`) is the actively-maintained current import.

## Architecture Patterns

### System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│  HOST AGENT (Claude Code primary; Codex CLI / Cursor sequential)      │
│  - Skill index (≤5k chars trigger metadata)                           │
│  - LLM execution (Read/Write/Bash tools)                              │
│  - Subagent dispatch (Claude Code native Task; others sequential)     │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ matches SKILL.md frontmatter trigger
                                ↓
┌───────────────────────────────────────────────────────────────────────┐
│  complete-design PACKAGE (installed into .claude/skills/ or host equivalent)│
│                                                                        │
│  skills/             (Phase 1: design.md orchestrator stub only;       │
│   ├ design.md         workflows ship Phase 2+)                         │
│   └ workflows/                                                         │
│      └ … (stubs)                                                       │
│                                                                        │
│  assets/scripts/    ← DETERMINISTIC SEAM (NO LLM IMPORTS, enforced     │
│   ├ schemas/                                  by lint-determinism.mjs) │
│   │  ├ emit.mjs              ← Zod → versioned JSON Schemas            │
│   │  └ migrate.mjs           ← v0→v1, future v1→v2 chain               │
│   ├ gates/                                                             │
│   │  ├ base.mjs              ← runGate(stage, dir, cfg) → GateResult   │
│   │  ├ stage-1.mjs                                                     │
│   │  ├ stage-2.mjs                                                     │
│   │  ├ stage-5a.mjs          ← always returns not-runnable in v2.0a    │
│   │  └ stage-5b.mjs                                                    │
│   ├ handoff-bundle-build.mjs ← deterministic frame; LLM body in        │
│   │                            bundle.body field; tiktoken budget      │
│   ├ frontmatter-validate.mjs ← strict for design/, lenient for         │
│   │                            .complete-design/private/                     │
│   ├ manifest-reconcile.mjs   ← MANIFEST.md ↔ filesystem state          │
│   ├ pii-scan.mjs             ← regex set + Luhn + allowlist            │
│   ├ port-manager.mjs         ← wraps get-port + .complete-design/preview/    │
│   │                            run-<id>/port.lock                      │
│   ├ playwright-runner.mjs    ← readiness probe via Playwright          │
│   │                            webServer pattern                       │
│   ├ security-sandbox.mjs     ← path allow-list + spawn env scrub       │
│   ├ run-subagent.mjs         ← host detect + Claude Code Task /        │
│   │                            sequential fallback                     │
│   ├ verify-golden.mjs        ← 5× byte-identical check                 │
│   ├ lint-determinism.mjs     ← rejects LLM-client imports              │
│   ├ oklch.mjs                ← color math (v1.0.1 preserved)           │
│   ├ contrast.mjs             ← WCAG 2.2 measure (never claim)          │
│   ├ dtcg-lint.mjs            ← DTCG v2025.10 validity                  │
│   └ design-md-validate.mjs   ← Google DESIGN.md spec validity          │
│                                                                        │
│  schemas/                                                              │
│   ├ src/                     (Zod TS sources)                          │
│   │  ├ persona.ts                                                      │
│   │  ├ sitemap.ts                                                      │
│   │  ├ manifest.ts                                                     │
│   │  ├ interaction-spec.ts                                             │
│   │  ├ audit-report.ts                                                 │
│   │  └ handoff-bundle.ts                                               │
│   ├ dist/                    (committed; emitted by schemas/emit.mjs)  │
│   │  ├ persona.v1.json                                                 │
│   │  ├ … (5 more)                                                      │
│   │  └ index.json            ← D-04 discovery manifest                 │
│   └ migrations/                                                        │
│      └ v0-to-v1.mjs          ← template; real migrations ship per bump │
│                                                                        │
│  references/                                                           │
│   ├ garrett-elements/        (≤2k tokens, citations not quotes)        │
│   ├ cooper-goodwin/                                                    │
│   ├ … (12 mandatory MVPA-06)                                           │
│   ├ gates/                                                             │
│   │  ├ stage-1.md            (table: Check | PASS | VALIDATED | Cite)  │
│   │  ├ stage-2.md                                                      │
│   │  ├ stage-5a.md                                                     │
│   │  └ stage-5b.md                                                     │
│   └ prd/lenny-one-pager.md                                             │
│                                                                        │
│  evals/                                                                │
│   ├ fixtures/                                                          │
│   │  ├ golden/<script>/      ← *.golden.json per D-12                  │
│   │  └ bundles/<stage>/      ← 5-fixture bundle-sufficiency suite      │
│   ├ adversarial/             ← (Phase 2+ populated; folder exists now) │
│   ├ triggers/<skill>/triggers.yaml ← ≥10 fire / ≥10 not-fire           │
│   ├ coexistence/                                                       │
│   │  ├ install-corpus.mjs    ← installs GSD + Superpowers + …          │
│   │  └ aggregate-eval.mjs    ← recall ≥0.80                            │
│   ├ hosts/                   ← vitest workspaces; D-22                 │
│   │  ├ claude-code/                                                    │
│   │  ├ codex-cli/                                                      │
│   │  └ cursor/                                                         │
│   └ runners/                                                           │
│      └ skillgrade.mjs        ← per-skill harness                       │
│                                                                        │
│  assets/templates/                                                     │
│   ├ gitignore-complete-design.txt                                            │
│   └ gitattributes-complete-design.txt                                        │
│                                                                        │
│  docs/                                                                 │
│   ├ MAINTAINERS.md           ← watcher owner per D-30                  │
│   └ RAPID-RESPONSE.md        ← template per D-31                       │
│                                                                        │
│  .github/workflows/                                                    │
│   ├ verify-golden.yml        ← determinism CI gate (D-12)              │
│   ├ lint-determinism.yml     ← D-13 architecture lint                  │
│   ├ host-matrix.yml          ← matrix per D-22                         │
│   ├ aggregate-coexistence.yml← per D-15/D-16                           │
│   └ anthropic-watcher.yml    ← daily cron per D-30                     │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ Read/Write (TRUST-02 diff-by-default)
                                ↓
┌───────────────────────────────────────────────────────────────────────┐
│  USER REPO (target of Phase 1 outputs at Phase 2 runtime; Phase 1     │
│  exercises these paths only via fixtures in evals/fixtures/)          │
│                                                                        │
│  design/                                                               │
│   ├ MANIFEST.md                                                        │
│   ├ PRD.md, research/, ia/, …                                          │
│   └ .handoff/stage-N-bundle.md                                         │
│                                                                        │
│  .complete-design/                                                           │
│   ├ manifest.lock            (hash chain)                              │
│   ├ manual-overrides.json                                              │
│   ├ pii-allowlist.json       (D-20)                                    │
│   └ private/ (gitignored)                                              │
│      ├ decision-log.jsonl                                              │
│      ├ run-log.jsonl                                                   │
│      └ preview/run-<id>/port.lock                                      │
└───────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

See the diagram above. Reference rationale:

- **`assets/scripts/` flat-ish, with `gates/` and `schemas/` subfolders:** `gates/` is grouped because all 6 share a base; `schemas/` is grouped because it has emit + migrate subscripts. Other scripts are top-level for shallow imports.
- **`schemas/src/` separate from `schemas/dist/`:** Zod TS sources in `src/`; emitted JSON Schemas in `dist/`. `dist/` is committed (recommendation from "Claude's Discretion" above) so installs work without a build step.
- **`evals/hosts/` as npm workspaces:** 3 child packages (`claude-code`, `codex-cli`, `cursor`) each with their own `package.json` so vitest's `projects` config can target them independently.
- **`.github/workflows/` separate workflow per concern:** verify-golden, lint-determinism, host-matrix, aggregate-coexistence, anthropic-watcher. Don't combine — failure isolation matters.

### Pattern 1: LLM Picks, Scripts Emit — enforced via lint

**What:** Every output that must round-trip identically is emitted by a Node ESM script under `assets/scripts/`. LLM produces *decisions* (which variant, which value); scripts produce *artifacts* (JSON, contrast, code). The lint script (`lint-determinism.mjs`) walks `assets/scripts/` AST and rejects any import path matching the D-13 regex.

**When to use:** Every deterministic emit script.

**Example lint enforcement (Plan 3 deliverable):**
```javascript
// assets/scripts/lint-determinism.mjs
// Source: D-13 + Pitfall 6 prevention
import { globby } from 'globby';
import { readFile } from 'node:fs/promises';

const FORBIDDEN = /(anthropic|openai|langchain|llamaindex|@anthropic-ai|@openai)/;

const files = await globby(['assets/scripts/**/*.{mjs,ts}']);
const violations = [];
for (const file of files) {
  const src = await readFile(file, 'utf8');
  const importLines = src.matchAll(/^(import|from)\s+['"]([^'"]+)['"]/gm);
  for (const m of importLines) {
    if (FORBIDDEN.test(m[2])) violations.push({ file, import: m[2] });
  }
}
if (violations.length) {
  console.error('Determinism violation: LLM client imports in assets/scripts/');
  for (const v of violations) console.error(`  ${v.file}: ${v.import}`);
  process.exit(1);
}
```

### Pattern 2: Zod-First Single Source → JSON Schemas

**What:** Each artifact type has one Zod TS source. A build step emits Draft 2020-12 JSON Schemas to `schemas/dist/`. `index.json` maps `artifact: persona → schemas/dist/persona.v1.json`. **Use Zod 4's built-in `z.toJSONSchema()` (not the deprecated `zod-to-json-schema` package — see Open Q1).**

**Example (`schemas/src/persona.ts`):**
```typescript
// Source: D-01, Zod 4 docs (zod.dev/json-schema)
import { z } from 'zod';

export const PersonaV1 = z.object({
  artifact: z.literal('persona'),
  stage: z.literal('1'),
  schemaVersion: z.literal(1),
  name: z.string(),
  provenance: z.enum(['generated', 'validated', 'inferred', 'missing']),
  sourceHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  generated: z.iso.datetime(),
  owner: z.string().email(),
  lastReviewedAt: z.iso.datetime(),
  // Indi-Young thinking-style fields
  thinkingStyle: z.object({
    cognitiveSpace: z.string(),
    emotionalReactions: z.array(z.string()),
    guidingPrinciples: z.array(z.string())
  }),
  // RED-04 carrier
  worstProvenance: z.enum(['generated', 'validated', 'inferred', 'missing']).optional()
}).meta({
  $id: 'https://complete-design.dev/schemas/persona.v1.json',
  title: 'Persona (Stage 1)',
  description: 'Indi-Young thinking-style format with NN/g provenance gating'
});

export type PersonaV1Type = z.infer<typeof PersonaV1>;
```

**Example emit step (`assets/scripts/schemas/emit.mjs`):**
```javascript
// Source: D-01 (Zod 4 built-in alternative to deprecated zod-to-json-schema)
import { writeFile, mkdir } from 'node:fs/promises';
import { z } from 'zod';
import { PersonaV1 } from '../../schemas/src/persona.ts';
// ... other schemas

const SCHEMAS = {
  persona: { schema: PersonaV1, version: 1 },
  // sitemap, manifest, interaction-spec, audit-report, handoff-bundle
};

const index = { schemas: {} };
await mkdir('schemas/dist', { recursive: true });
for (const [name, { schema, version }] of Object.entries(SCHEMAS)) {
  const json = z.toJSONSchema(schema, { target: 'draft-2020-12' });
  const path = `schemas/dist/${name}.v${version}.json`;
  await writeFile(path, JSON.stringify(json, null, 2) + '\n');
  index.schemas[name] = { version, path };
}
await writeFile('schemas/dist/index.json', JSON.stringify(index, null, 2) + '\n');
```

### Pattern 3: Discriminated-Union Gate Result

**What:** D-09's gate-result type is enforced by TS's exhaustiveness checking at every call site. The base `runGate` is async; per-stage gates extend by composition (not class inheritance).

**Example (`assets/scripts/gates/base.mjs` + type contract):**
```typescript
// Source: D-09, D-10 (in schemas/src/gate-result.ts for shared type)
import { z } from 'zod';

export const GateResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('pass'),                 evidence: z.enum(['validated', 'proto', 'inferred']), findings: z.array(z.unknown()) }),
  z.object({ kind: z.literal('pass_with_warnings'),   evidence: z.enum(['validated', 'proto', 'inferred']), findings: z.array(z.unknown()), warnings: z.array(z.string()) }),
  z.object({ kind: z.literal('failed_after_repair'),  reason: z.string(), findings: z.array(z.unknown()) }),
  z.object({ kind: z.literal('user_overridden'),      reason: z.string(), overrideBanner: z.string(), findings: z.array(z.unknown()) }),
  z.object({ kind: z.literal('not_runnable'),         reason: z.string() }) // GATE-07
]);
export type GateResultT = z.infer<typeof GateResult>;

export async function runGate(stage, designDir, config) {
  // Per-stage gates import this base and return GateResultT
  // ...
}
```

**Per-stage gate (`assets/scripts/gates/stage-5a.mjs`) — note v2.0a hardcoded behavior:**
```javascript
// Source: D-09, Codex §16 BLOCKER (GATE-07), Pitfall 13
import { existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';

export async function runStage5aGate(designDir, config) {
  const interactionsDir = `${designDir}/interactions`;
  // GATE-07 + GATE-08: hardcoded refusal when Stage 4 absent
  if (!existsSync(interactionsDir) || readdirSync(interactionsDir).length === 0) {
    return {
      kind: 'not_runnable',
      reason: 'stage-4-artifacts-absent'
    };
  }
  // Phase 1 only ships the refusal path; full check ships Phase 3 (lite→full promotion)
  // ... full check logic in Phase 3
}
```

### Pattern 4: Handoff Bundle — Deterministic Frame, LLM Body

**What:** `handoff-bundle-build.mjs` accepts a stage directory + an LLM-summarized body, validates the frame against `handoff-bundle.v1.json`, counts tokens via `tiktoken`, truncates lowest-priority section if >15k, emits a `truncationWarning` if it did so, refuses (flagged) if <3k.

**Example skeleton (`assets/scripts/handoff-bundle-build.mjs`):**
```javascript
// Source: D-05, D-06, D-07
import { encoding_for_model } from 'tiktoken';
import { stringify } from 'yaml';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const enc = encoding_for_model('gpt-4'); // cl100k_base; close enough for budget per D-06
const MAX_TOKENS = 15000;
const MIN_TOKENS = 3000;

// Body sections in PRIORITY order; truncate from the bottom up
const REQUIRED_SECTIONS = [
  'Goal & scope',
  'Decisions made',
  'Open questions',
  'Artifacts inventory',
  'Pointers to verify',
  'Provenance (worst-case)'
];
const OPTIONAL_SECTIONS = ['Risks surfaced']; // first to drop

export async function buildHandoffBundle({
  stageFrom, stageTo, designDir, llmSummaryBody
}) {
  // Compute sourceHash of all upstream files (D-claude-discretion; deterministic)
  const sourceHash = await hashDirectory(designDir);

  // Section-aware truncation
  const sections = parseSections(llmSummaryBody);
  let body = renderSections(sections, REQUIRED_SECTIONS, OPTIONAL_SECTIONS);
  let tokens = enc.encode(body).length;
  let truncationWarning = null;
  if (tokens > MAX_TOKENS) {
    sections.dropped = sections.dropped || [];
    // Drop optional first, then truncate longest required
    truncationWarning = truncate(sections, MAX_TOKENS, enc);
    body = renderSections(sections, REQUIRED_SECTIONS, OPTIONAL_SECTIONS);
    tokens = enc.encode(body).length;
  }
  if (tokens < MIN_TOKENS) {
    return { error: 'insufficient-content', tokens, floor: MIN_TOKENS };
  }

  const frontmatter = {
    artifact: 'handoff-bundle',
    schemaVersion: 1,
    stage: `${stageFrom} → ${stageTo}`,
    generated: new Date().toISOString(),
    sourceHash,
    tokenCount: tokens,
    truncationWarning
  };
  const out = `---\n${stringify(frontmatter)}---\n\n${body}\n`;
  await writeFile(
    `${designDir}/.handoff/stage-${stageFrom}-bundle.md`,
    out
  );
  return { ok: true, tokens, truncationWarning };
}
```

### Pattern 5: manifest.lock as Append-Only Hash Chain

**What:** Every gate run appends a JSON line to `.complete-design/manifest.lock`. Each entry contains `prevHash` of the previous entry + `entryHash` of this entry's canonical-serialized content. Tampering is detectable via `complete-design verify --golden`.

**Example entry (one line per gate run):**
```json
{"seq":12,"timestamp":"2026-05-24T12:34:56.789Z","stage":"1","gate":"stage-1","result":{"kind":"pass_with_warnings","evidence":"proto","findings":[],"warnings":["synthetic-only-no-interviews"]},"sourceHash":"sha256:abc…","prevHash":"sha256:def…","entryHash":"sha256:ghi…"}
```

**Canonicalization:** Keys sorted alphabetically before hash; `entryHash = sha256(JSON.stringify(canonicalize({...entry, entryHash: undefined})))`. This is the JS-runtime-determinism pitfall that other-language reimplementations would hit; Phase 1 stays pure-Node so it's straightforward.

### Pattern 6: Subagent Dispatch Shim

**What:** `run-subagent.mjs` detects host at runtime via env vars / capability probes. On Claude Code, it returns a function that invokes the native Task tool. On Codex CLI / Cursor, it returns a sequential-fallback that spawns the workflow inline.

**Phase 1 deliverable:** the shim + Claude Code path fully implemented; sequential fallback minimum-viable (passes fixture suite, not optimized).

```javascript
// assets/scripts/run-subagent.mjs
// Source: D-23
function detectHost() {
  if (process.env.CLAUDE_CODE_SESSION) return 'claude-code';
  if (process.env.CODEX_SESSION) return 'codex-cli';
  if (process.env.CURSOR_SESSION) return 'cursor';
  return 'unknown';
}

export async function dispatchSubagent({ prompt, tools, context }) {
  const host = detectHost();
  if (host === 'claude-code') {
    // Native dispatch — actual implementation reads stdin/stdout protocol of host
    return await claudeCodeTask({ prompt, tools, context });
  }
  // Codex / Cursor / unknown: sequential fallback
  return await sequentialFallback({ prompt, tools, context });
}
```

### Anti-Patterns to Avoid

- **LLM emits final artifacts.** Forbidden by D-13 lint. Use Pattern 1.
- **Reading raw `design/` directory in a stage workflow** (instead of `.handoff/stage-(N-1)-bundle.md`). Phase 2 enforces; Phase 1 ships the bundle script + sufficiency eval.
- **Using `js-yaml` for round-trip writes.** Use `yaml` (eemeli/yaml) v2.
- **Using `zod-to-json-schema` (deprecated Nov 2025).** Use Zod 4's built-in `z.toJSONSchema()`.
- **Using `vm2` for security sandbox.** vm2 has 11+ CVEs in early 2026. Phase 1's security sandbox is a *permission boundary* (path allow-list + spawn env scrub), not arbitrary-code execution. See Security Domain below.
- **Hand-rolling tiktoken** ("just count words"). Use `tiktoken` (WASM). Token counts diverge significantly from word counts on real PRDs.
- **Treating `compatibility:` SKILL.md frontmatter as enforced.** Per STACK.md it is best-effort, not enforceable. Document, don't depend.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Regex or split-based parser | `gray-matter` | Battle-tested; handles edge cases (multi-line strings, escapes) |
| YAML frontmatter round-trip writing | js-yaml + manual reformatting | `yaml` (eemeli/yaml) v2 | js-yaml does NOT preserve comments or quoting; round-trip writes corrupt files |
| JSON Schema validation | Hand-rolled type checks | `ajv` 8 + `ajv-formats` 3 | Draft 2020-12 support; format validators (email/date/uri); error paths |
| Zod → JSON Schema emission | Custom traversal | Zod 4's `z.toJSONSchema()` (NOT deprecated `zod-to-json-schema`) | Built-in to Zod 4.4; targets Draft 2020-12 by default; zero deps |
| Token counting | Word count × 1.3 heuristic | `tiktoken` (cl100k_base) | OpenAI-canonical; 15-30% accuracy gap vs word count on PRDs |
| TCP port allocation for preview | `let port = 3000; tryBind()` retry loop | `get-port` (sindresorhus) | Built-in in-process lock prevents parallel-spawn EADDRINUSE races |
| Dev-server readiness probe | `setTimeout(5000)` | Playwright `webServer` `url` option (allowed: 2xx/3xx/400-403) | Eliminates flakiness; cited Playwright pattern |
| Hash chain canonicalization | `JSON.stringify(obj)` | Sorted-key canonical JSON | JS object key order is insertion-dependent; non-canonical hashes diverge across runs |
| Credit-card validation | Regex alone | Luhn algorithm + 13-19 digit regex | Regex alone has high false-positive rate; Luhn checksum filters 90%+ of randomly-formed false matches |
| Email regex | Hand-rolled "good enough" | RFC 5322 subset (e.g., `^[^\s@]+@[^\s@]+\.[^\s@]+$`) — or `validator.js` for the full standard | Hand-rolled regexes typically miss `+` aliases, dotted local parts, IDN. Subset above is intentional per D-18 (regex-based, not ML). |
| Phone number detection | US-only regex | libphonenumber-js OR E.164 regex `\+?[1-9]\d{1,14}` + US `\d{3}-?\d{3}-?\d{4}` | Phase 1's allowlist (D-20) lets users mark false-positives; perfection isn't required |
| RSS/Atom polling | `node-fetch` + custom parse loop | `rss-to-issues` GitHub Action OR `fast-xml-parser` + dedupe via issue title | rss-to-issues handles "create issue iff not already exists"; lower-maintenance |
| Sandbox for "untrusted code" | `vm2` or `node:vm` | **No untrusted code execution in Phase 1** | vm2 is exploit-ridden (CVE-2026-22709 + 11 advisories early 2026); `node:vm` is explicitly NOT a sandbox per official docs. Phase 1's "sandbox" is a permission boundary. |
| Skill trigger eval harness | "If it triggers in my tests, ship" | In-tree `skillgrade.mjs` modeled on Anthropic skill-creator (D-17) | Per-skill eval discipline; recall ≥0.85, false-fire ≤0.15; 3-trial averaging smooths LLM stochasticity |
| Aggregate coexistence eval | Single-package CI | In-tree corpus that installs 5 packages, runs trigger recall | No off-the-shelf tool exists (research flag #2 below); novel methodology |
| `manifest.lock` integrity | Trust file contents | Hash chain (sha256 prev → curr) | Detects tampering; v1.0.1 pattern preserved |

**Key insight:** complete-design has 13 categories of "don't hand-roll" because it's an unusual domain — token counting, port allocation, hash chains, RSS polling all have battle-tested libraries that beat a one-evening implementation. The combined library load (≈25 deps) is modest because all are Node ESM and tree-shake cleanly.

## Common Pitfalls

(Phase 1 prevents 7 of the 13 critical pitfalls from PITFALLS.md; the others ship in Phase 2+.)

### Pitfall A: Zod 4 `.toJSONSchema()` emits unexpected schema shape because of "optional vs nullable" subtlety

**What goes wrong:** Zod 4's `toJSONSchema` on `z.string().optional()` may produce `{ type: ['string', 'null'] }` instead of marking the field as not-required (an open issue #4164 was reported but resolved). If the planner uses Zod 3 patterns, schemas drift.

**Why it happens:** Zod 4 changed semantics around optionals.

**How to avoid:** Always test the emit output against a fixture; D-12 golden test covers this. Use `z.optional()` for "may be absent" and `z.nullable()` for "may be null".

**Warning signs:** Validation rejects fixtures that should pass; `dataPath` errors point to fields that were never declared required.

### Pitfall B: tiktoken token count differs from host's actual count

**What goes wrong:** Bundle is "15k tokens by tiktoken" but Claude tokenizes differently; bundle is actually 16k in-host and truncated by the host.

**Why it happens:** Tiktoken uses cl100k_base (OpenAI); hosts use their own tokenizers.

**How to avoid:** Per D-06, cl100k_base is "close enough for budget purposes." Reserve a 10% safety margin — treat 15k as 13.5k effective ceiling. Document the gap in the bundle schema's frontmatter as advisory.

**Warning signs:** Bundle reads in Phase 2 fail with "context exceeded" even though `tokenCount: 14500`.

### Pitfall C: Excalidraw schema drift across versions (the explicit research flag)

**What goes wrong:** Phase 3 ships Stage 3 (Sketch) wireframes. If `@excalidraw/excalidraw` was tracked as `latest`, the schema may have moved (v0.18 removed `ExcalidrawTextElement.baseline`).

**Why it happens:** Excalidraw is pre-1.0; major API/schema changes ship in minor versions.

**How to avoid:** Phase 1 pins **`@excalidraw/excalidraw@0.18.0`** in package.json. Phase 1 doesn't ship the Excalidraw validator (Phase 3 does), but the pin lives in Phase 1's package.json so dev workflows match what Phase 3 will use.

**Warning signs:** Validator written in Phase 3 fails on Phase 2 fixtures because element shape drifted.

### Pitfall D: PII scanner false positives on natural Markdown content

**What goes wrong:** `Interviewer: Maya said …` is the literal transcript pattern; the PII scanner treats anything after `Interviewer:` as PII. But a designer note in `findings.md` that says `When the interviewer asked …` (descriptive, not header) gets flagged.

**Why it happens:** Regex-based detection (D-18) can't distinguish "header introducing speaker" from "noun phrase referring to a role."

**How to avoid:** PII regex for transcript headers requires `^Interviewer:` (line-start, not anywhere in line). The allowlist (D-20) handles edge cases that remain.

**Warning signs:** Users disable the hook because it cries wolf.

### Pitfall E: GitHub Actions cron drift / missed novel keywords

**What goes wrong:** The anthropic-watcher cron silently fails (rate limit, deleted feed, schema change) and the team thinks "no news is good news."

**Why it happens:** GitHub Actions doesn't surface cron failures by default; RSS feeds disappear.

**How to avoid:** Watcher workflow has a "heartbeat" — opens an issue (or comments on a tracking issue) every run, even when there's nothing to report. Missed heartbeats are detectable.

**Warning signs:** No `competitive-watch` issues for 3+ weeks despite known Anthropic activity in the space.

### Pitfall F: `not-runnable` semantics confused with `failed_after_repair`

**What goes wrong:** A workflow assumes any non-PASS terminal state is a failure; `not_runnable` (which means "prerequisites absent") is treated as broken.

**Why it happens:** D-09 defines 5 kinds (`pass | pass_with_warnings | failed_after_repair | user_overridden | not_runnable`); downstream code may pattern-match on "is it pass?" and treat all other states identically.

**How to avoid:** Type contract in `schemas/src/gate-result.ts` uses TS discriminated union; every consumer must exhaustively handle all 5 cases. ESLint rule `@typescript-eslint/switch-exhaustiveness-check` enforces.

**Warning signs:** Stage 5a in v2.0a reports "broken" to users instead of "waiting on Stage 4."

### Pitfall G: Schema migration script forgotten on a bump

**What goes wrong:** Plan adds `worstProvenance` field to `persona.v2`; users with v1 personas hit a hard validation error.

**Why it happens:** D-27 mandates per-script migrations, but enforcement depends on PR discipline.

**How to avoid:** CI test: any PR that changes a file in `schemas/src/` must also touch a file in `schemas/migrations/` (or skip with `[schema-no-migrate]` commit message tag + reviewer approval). Lightweight CODEOWNERS-equivalent rule.

**Warning signs:** First user upgrade after v1.5 GA breaks.

## Code Examples

(Selected high-leverage patterns. Code references official sources where possible.)

### Port Manager with cross-process safety

```javascript
// assets/scripts/port-manager.mjs
// Source: get-port npm docs (sindresorhus/get-port)
import getPort from 'get-port';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { mkdirSync } from 'node:fs';

const PREFERRED = [5173, 3000, 4321]; // Vite, Next, Astro defaults

export async function allocatePort(runId, designOsDir = '.complete-design') {
  const runDir = `${designOsDir}/preview/run-${runId}`;
  mkdirSync(runDir, { recursive: true });
  const lockPath = `${runDir}/port.lock`;
  // Avoid in-process re-use; `reserve` keeps the lock for the process lifetime
  const port = await getPort({ port: PREFERRED, reserve: true });
  await writeFile(lockPath, JSON.stringify({ port, pid: process.pid, allocated: new Date().toISOString() }));
  return { port, release: async () => { if (existsSync(lockPath)) await unlink(lockPath); } };
}
```

### Playwright Readiness Probe (Vite/Next/Astro shared shape)

```javascript
// assets/scripts/playwright-runner.mjs
// Source: Playwright webServer docs (playwright.dev/docs/test-webserver)
// Adapted for direct programmatic use (not via Playwright config)
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

export async function spawnAndProbe({ command, args, cwd, env, port, readyUrl, timeoutMs = 30000 }) {
  const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const startedAt = Date.now();
  // Allowed ready statuses per Playwright convention: 2xx, 3xx, 400, 401, 402, 403
  const ALLOWED = (s) => (s >= 200 && s < 400) || [400, 401, 402, 403].includes(s);
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(readyUrl, { signal: AbortSignal.timeout(1000) });
      if (ALLOWED(res.status)) return { ready: true, pid: child.pid, kill: () => child.kill('SIGTERM') };
    } catch { /* not ready yet */ }
    await sleep(250);
  }
  child.kill('SIGTERM');
  throw new Error(`Dev server did not become ready within ${timeoutMs}ms at ${readyUrl}`);
}
```

### Security Sandbox — Permission Boundary (NOT vm-based)

```javascript
// assets/scripts/security-sandbox.mjs
// Threat model: Phase 1 does NOT execute arbitrary user code in a sandbox.
// The "sandbox" enforces (1) path allow-listing for reads/writes, (2) env scrub
// for spawned dev servers, (3) network restriction during preview boot.
import { resolve, relative } from 'node:path';

const READ_ALLOWLIST = ['design/', 'design/.handoff/', '.complete-design/', 'PRD.md'];
const WRITE_ALLOWLIST = ['design/', '.complete-design/'];

export function isPathAllowed(absPath, mode /* 'read' | 'write' */, projectRoot) {
  const rel = relative(projectRoot, resolve(absPath));
  if (rel.startsWith('..')) return false; // outside repo
  const list = mode === 'write' ? WRITE_ALLOWLIST : READ_ALLOWLIST;
  return list.some((prefix) => rel === prefix || rel.startsWith(prefix));
}

export function scrubEnvForPreview(env) {
  // Strip secrets before spawning user dev server
  const out = { ...env };
  for (const key of Object.keys(out)) {
    if (/_(KEY|SECRET|TOKEN|PASSWORD)$/i.test(key)) delete out[key];
  }
  return out;
}
```

### PII Regex Set + Luhn Check (D-18)

```javascript
// assets/scripts/pii-scan.mjs
// Source: D-18 + Luhn algorithm reference (datacheck.dev/blog/luhn-algorithm-credit-card-validation.html)
const EMAIL    = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
const PHONE_US = /\b(\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const PHONE_E164 = /\b\+[1-9]\d{6,14}\b/g;
const SSN      = /\b\d{3}-\d{2}-\d{4}\b/g;
const IPV4     = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const CC_CANDIDATE = /\b\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d(?:[ -]*?\d)?(?:[ -]*?\d)?(?:[ -]*?\d)?\b/g;
const TRANSCRIPT_HEADER = /^(Interviewer|Participant|User|Respondent|Moderator):\s/gm;

function luhn(digits) {
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}

export function scanForPII(text) {
  const findings = [];
  for (const m of text.matchAll(EMAIL)) findings.push({ type: 'email', value: m[0], index: m.index });
  for (const m of text.matchAll(PHONE_US)) findings.push({ type: 'phone-us', value: m[0], index: m.index });
  for (const m of text.matchAll(PHONE_E164)) findings.push({ type: 'phone-e164', value: m[0], index: m.index });
  for (const m of text.matchAll(SSN)) findings.push({ type: 'ssn', value: m[0], index: m.index });
  for (const m of text.matchAll(IPV4)) findings.push({ type: 'ipv4', value: m[0], index: m.index });
  for (const m of text.matchAll(CC_CANDIDATE)) {
    const digits = m[0].replace(/[^\d]/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhn(digits)) {
      findings.push({ type: 'credit-card', value: m[0], index: m.index });
    }
  }
  for (const m of text.matchAll(TRANSCRIPT_HEADER)) findings.push({ type: 'transcript-header', value: m[0], index: m.index });
  return findings;
}
```

### GitHub Actions Cron for Anthropic-Labs Watcher (D-30)

```yaml
# .github/workflows/anthropic-watcher.yml
# Source: D-30 + rss-to-issues GitHub Action docs (marketplace)
name: Anthropic-Labs Watcher
on:
  schedule:
    - cron: '37 7 * * *'  # daily 07:37 UTC; offset prime to dodge cron storms
  workflow_dispatch: {}

jobs:
  poll-feeds:
    runs-on: ubuntu-latest
    steps:
      - name: Poll anthropics/skills releases
        uses: dsaltares/fetch-gh-release-asset@master
        # ... alternative: direct curl + jq diff against last-seen tag
      - name: Open competitive-watch issue on novel keywords
        uses: actions/github-script@v7
        with:
          script: |
            const KEYWORDS = ['5-stage', 'design process', '5 design stages', ' IA ', 'wireframe', 'state machine', 'audit', 'Garrett'];
            // 1. Fetch anthropics/skills latest release titles via REST
            // 2. Fetch Anthropic blog RSS
            // 3. Fetch Claude Design release notes (best available endpoint)
            // 4. Filter for any title matching any KEYWORD
            // 5. For each match: check if an issue with title prefix [competitive-watch] already exists; if not, create one tagged competitive-watch
            // ... implementation per D-30
      - name: Heartbeat (Pitfall E prevention)
        uses: actions/github-script@v7
        with:
          script: |
            // Comment on a sticky tracking issue with "Watcher ran $DATE; novel hits: $N"
            // Missing heartbeat detectable by separate cron job that alerts maintainer
```

### Aggregate Coexistence Eval Methodology (Research Flag #2)

The methodology is novel — no off-the-shelf tool tests trigger recall in multi-package install state. Recommended pattern (Plan 3 deliverable):

```javascript
// evals/coexistence/aggregate-eval.mjs
// Source: D-15, D-16 + research findings on Anthropic skill-creator eval framework
// (claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)
//
// Step 1: Install corpus
//   In a clean ephemeral skill directory (.test-skills/), install:
//     - complete-design (this package, fresh build)
//     - GSD (get-shit-done)
//     - Superpowers
//     - frontend-design (Anthropic)
//     - shadcn (MCP server, not the UI lib)
//     - Notion MCP
// Step 2: Build trigger prompt corpus
//   triggers.yaml across 6 packages: ≥30 should-fire per package = ≥180 total
// Step 3: For each prompt:
//   - Run host (Claude Code) headlessly via the host's eval mode (or Anthropic
//     skill-creator's eval sub-agent pattern adapted for this purpose)
//   - Record: which skill (if any) fired
// Step 4: Score recall on complete-design's own should-fire prompts:
//   recall = correct_design_os_fires / total_design_os_should_fire
//   Threshold: ≥0.80 (D-16)
// Step 5: Score precision on should-not-fire prompts targeting other packages:
//   false_fire_rate = design_os_fires_on_others / total_other_should_fire
//   Threshold: ≤0.15 aggregate (consistent with D-17 per-skill threshold)
// Step 6: Emit JSON report to evals/coexistence/last-run.json; CI fails if
//   recall <0.80 OR false_fire_rate >0.15.
//
// Note (Anthropic skill-creator informed): triggering has a ceiling around
// ~46% recall that prose-only optimization can't break. The ≥0.80 threshold
// in D-16 is therefore aggressive — calibrate during Phase 1; if empirics
// show systemic miss patterns, the contingency (TRIG-04: split into
// complete-design-core + complete-design-atoms) is the planned lever.
```

### Bundle-Sufficiency Eval Methodology (Research Flag #1)

The methodology is novel — D-08 specifies "BLEU-like similarity ≥0.85 on a 5-fixture suite" but the comparator is undefined. Recommended pattern (Plan 2 deliverable):

```javascript
// evals/bundles/per-stage-fidelity.test.mjs
// Source: D-08, research findings on LLM summarization evaluation
// (Microsoft eval-metrics docs; AWS LLM-summarization-eval blog)
//
// For each fixture (5 total covering stages 0→1, 1→2, 2→3, 3→4, 4→5):
//   A. Run downstream stage workflow with `--input-mode bundle-only`
//      → produces output O_bundle
//   B. Run downstream stage workflow with `--input-mode full-directory`
//      → produces output O_full
//   C. Compute similarity:
//      Primary metric: BERTScore semantic similarity (recommended over BLEU
//      per multiple eval-metrics sources — n-gram overlap is misleading on
//      structured outputs; semantic similarity matches the "did the next
//      stage learn the same thing?" question better).
//      Secondary metric: structural-equivalence (gate decisions match,
//      evidence grade matches, artifact-types-emitted set equality)
//   D. Accept if BERTScore ≥0.85 AND structural-equivalence = TRUE,
//      OR explicitly tag domain-relevant divergences per D-08
//
// Alternative if BERTScore is too heavy (requires loading a BERT model in CI):
// fall back to embedding-cosine via OpenAI text-embedding-3-small — pure HTTP,
// no model bundle, but adds an LLM dependency to CI.
//
// Recommend: implement structural-equivalence first (cheap, deterministic);
// only add semantic-similarity if structural-equivalence proves too lenient.
// This is calibratable during the Phase 1 eval-design week.
```

### Skillgrade-Style Harness Skeleton (D-17)

```javascript
// evals/runners/skillgrade.mjs
// Source: D-17 + Anthropic skill-creator eval pattern (claude.com/blog/...)
import { parse as parseYAML } from 'yaml';
import { readFile } from 'node:fs/promises';

const TRIALS = 3;

export async function runSkillgrade(skillName, triggersPath) {
  const triggers = parseYAML(await readFile(triggersPath, 'utf8'));
  // triggers.yaml shape:
  // shouldFire: [{ prompt, why? }, ...]
  // shouldNotFire: [{ prompt, why? }, ...]
  let hits = 0, falseFires = 0;
  const total = { fire: triggers.shouldFire.length, notFire: triggers.shouldNotFire.length };

  for (const { prompt } of triggers.shouldFire) {
    let firedAtLeastOnce = false;
    for (let t = 0; t < TRIALS; t++) {
      const result = await dispatchToHost(prompt); // host eval-mode adapter
      if (result.firedSkill === skillName) firedAtLeastOnce = true;
    }
    if (firedAtLeastOnce) hits++;
  }
  for (const { prompt } of triggers.shouldNotFire) {
    for (let t = 0; t < TRIALS; t++) {
      const result = await dispatchToHost(prompt);
      if (result.firedSkill === skillName) { falseFires++; break; } // any 1-of-3 fire counts
    }
  }
  const recall = hits / total.fire;
  const falseFireRate = falseFires / total.notFire;
  return {
    skill: skillName,
    recall, falseFireRate,
    pass: recall >= 0.85 && falseFireRate <= 0.15
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `zod-to-json-schema` npm package | Zod 4's built-in `z.toJSONSchema()` | Nov 2025 (package EOL) | D-01's intent preserved; implementation library swap recommended |
| `vm2` for in-process sandboxing | Permission-boundary-only "sandboxing" (no untrusted-code execution); isolated-vm if absolutely required | Jan 2026 (CVE-22709 + 11 advisories) | Phase 1 security sandbox is a path/env permission layer, not a vm |
| `js-yaml` for round-trip | `yaml` (eemeli/yaml) v2 | Stable for years; still routinely misused | Avoids frontmatter corruption on rewrite |
| Vitest `workspace` config key | `projects` config key (same shape) | Vitest 3.2 (functionally equivalent) | Either works in Phase 1; pin one |
| `ts-node` for TS scripts | `tsx` | Long resolved; flagged here because legacy projects still use ts-node | `tsx` is ESM-native, faster, simpler |
| `portfinder` | `get-port` (sindresorhus) | `get-port` has in-process locking | Avoids parallel-spawn race conditions |
| `@dqbd/tiktoken` (older fork) | `tiktoken` (current OpenAI-canonical npm) | Both ESM/WASM; tiktoken is the active package | Use `tiktoken` for current docs + WASM perf |

**Deprecated/outdated:**
- `zod-to-json-schema` — EOL Nov 2025; use Zod 4 built-in (still works but no further maintenance).
- `vm2` — exploit-ridden; do not adopt for any new code paths.
- `json-schema-to-zod` — EOL March 2026 (not needed for Phase 1 since we author Zod sources; flagged here for completeness).
- `js-yaml` (round-trip only) — use `yaml` v2 instead.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Codex 2% trigger metadata cap is still ~5k chars in May 2026 | Standard Stack + Eval methodology | MEDIUM — if cap tightened, contingency lever (TRIG-04 core/atoms split) is in scope; calibrate at Phase 1 kickoff per MRD §11 |
| A2 | Anthropic's skill-creator harness has NOT shipped as a standalone OSS package by Phase 1 kickoff | Skillgrade-Style Harness pattern | LOW — if it has shipped, adopt it; our harness is plug-compatible by design |
| A3 | Google DESIGN.md schema is stable for the 14-week build window | FORMAT-06 + design-md-validate.mjs design | MEDIUM — `$extensions.complete-design` namespace is the fallback if schema drifts (per MRD §3.6) |
| A4 | BERTScore is implementable in CI without heavy model bundling, OR the structural-equivalence metric is sufficient alone | Bundle-Sufficiency Eval Methodology | MEDIUM — structural-equivalence is the cheap baseline; semantic similarity is the calibration step. Plan 2 should treat this as a 1-week design+prototype work-stream, not "drop-in metric" |
| A5 | `tiktoken` (cl100k_base) is close enough to Claude's tokenizer that 10% safety margin is sufficient | Pattern 4 + Pitfall B | LOW — Anthropic publishes no exact tokenizer; if drift is high, the truncationWarning surfaces it before bundle hits the host |
| A6 | The 4-week budget is sufficient for 5 plans of work | Recommended Decomposition | MEDIUM — CONTEXT.md explicitly authorizes pushback; if the plan implies >4 weeks, descope (don't slip) |
| A7 | npm workspaces (not pnpm) is sufficient for 3 host-profile child packages | Project Structure | LOW — break-even point per research is ~10 packages; trivially migrable to pnpm later if eval matrix grows |

**Status:** All 7 assumptions are flagged for the planner. None block planning; most should be validated during Plan 1/Plan 2 kickoff.

## Open Questions

1. **`zod-to-json-schema` is deprecated — does D-01's locked decision need amendment?**
   - What we know: Zod 4's built-in `z.toJSONSchema()` produces equivalent output (Draft 2020-12 by default), is maintained, and is zero-dep beyond Zod itself. D-01's *intent* (Zod-first single source) is preserved.
   - What's unclear: Whether the planner needs to surface this back to the user (the decision named the package by name) or can quietly swap.
   - Recommendation: Planner should annotate in PLAN.md that D-01 uses `z.toJSONSchema()` rather than the named `zod-to-json-schema` package, citing the EOL announcement. No further user confirmation needed — this is a "library died after the decision was locked" case, and the decision's spirit is honored.

2. **Bundle-sufficiency eval comparator: structural-only vs structural+semantic?**
   - What we know: D-08 names "BLEU-like similarity ≥0.85" but multiple eval-metrics sources flag BLEU as misleading for structured outputs.
   - What's unclear: Whether structural-equivalence alone meets D-08's spirit, or whether semantic similarity (BERTScore / embedding cosine) is also required.
   - Recommendation: Plan 2 implements structural-equivalence first as the deterministic baseline. Semantic-similarity is a stretch deliverable in Plan 2 OR a Phase 4 calibration step. Either way, Phase 1's 5-fixture suite is in scope.

3. **Aggregate coexistence eval recall threshold (≥0.80) calibration**
   - What we know: Anthropic's research notes "triggering has a ceiling around ~46% recall that prose-only optimization can't break."
   - What's unclear: Whether ≥0.80 is achievable on 5-package coexistence, or whether it requires the core/atoms split (TRIG-04 contingency) from day one.
   - Recommendation: Plan 3 builds the harness; Plan 3 also tests the threshold empirically before declaring CI green. If empirics show <0.80 even on optimized prompts, escalate to user before locking the v2.0a release gate. (This is a Phase 4 gate, not a Phase 1 gate, so Phase 1 has time.)

4. **Anthropic-Labs watcher keyword set tuning**
   - What we know: D-30 lists 6 keywords (`5-stage`, `design process`, `IA`, `wireframe`, `state machine`, `audit`).
   - What's unclear: false-positive rate on real Anthropic blog cadence (e.g., "audit" likely fires on many security-adjacent posts).
   - Recommendation: Ship with the 6 keywords + a heuristic (require ≥2 keywords in title OR 1 keyword + "design" stem in body). Tune in week 2 based on first week's hits.

5. **`design-md-validate.mjs` schema version pinning concrete contract (FORMAT-07)**
   - What we know: FORMAT-07 says "supports schema version pinning to survive Google spec drift."
   - What's unclear: Whether complete-design pins to one DESIGN.md version per package release, or supports a range (CLI flag `--design-md-version`).
   - Recommendation: Phase 1 pins one version (the version at v1.5 GA — likely April 2026 release as named in PROJECT.md key decisions); Plan 1 leaves a `--design-md-version <semver>` flag in the CLI signature for forward-compat but only the pinned version is implemented.

## Environment Availability

Phase 1 has no external service dependencies beyond standard Node.js toolchain and GitHub Actions runner. Verified:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All `assets/scripts/*.mjs` | ✓ | v22.21.0 (≥22 LTS required) | — |
| npm | Build, deps | ✓ | 10.9.4 | — |
| npx | One-off CLI invocations | ✓ | 10.9.4 | — |
| GitHub Actions runner | All CI workflows (D-12, D-13, D-22, D-30) | ✓ (assumed; standard for OSS repo) | — | None — required |
| `git` | Hash-chain manifest.lock, hooks | ✓ (assumed) | — | None — required |
| `gh` CLI | Optional for marketplace cross-posts (Phase 4) | ✓ (assumed per CLAUDE.md) | — | Manual fallback documented |
| Chromium (for Playwright) | Preview readiness probe | ✗ (one-time install) | — | `npx playwright install --with-deps chromium` — documented in install block above |

**Missing dependencies with no fallback:** None for Phase 1 core. Chromium is install-time, not build-time, and falls under "documented install step."

**Missing dependencies with fallback:** None.

## Security Domain

(Phase 1 has limited security surface — it's a build-time package, no live services. ASVS categories below reflect Phase 1's narrow attack surface.)

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 1 has no auth surface (no servers, no API keys in shipped code) |
| V3 Session Management | no | Phase 1 has no sessions |
| V4 Access Control | yes (limited) | `security-sandbox.mjs` enforces path allow-list for reads/writes into user repo (PERSIST-01 + PREV-01) |
| V5 Input Validation | yes | Every `design/` artifact validated against versioned JSON Schema via ajv 8 (SCHEMA-07) |
| V6 Cryptography | yes (limited) | manifest.lock uses SHA-256 hash chain (Pattern 5); no key management; no encryption (artifacts are committed cleartext by design) |
| V7 Errors & Logging | yes | pino structured logging to `.complete-design/private/run-log.jsonl`; secret redaction filter masks `*_KEY`, `*_SECRET`, `*_TOKEN` patterns (PITFALLS Security Mistakes) |
| V8 Data Protection | yes | PII scanner (D-18); pre-commit hook (D-19); allowlist (D-20); `.gitignore` defaults (D-29) for `research/interviews/` and `.complete-design/private/` |
| V9 Communication | no | Phase 1 makes no outbound network calls except (a) GitHub Actions cron polling RSS/release feeds, (b) `npm install` build-time |
| V10 Malicious Code | yes (critical) | D-13 lint-determinism.mjs rejects LLM client imports inside `assets/scripts/`; CI gate is a hard fail. Prevents accidental introduction of remote-code-fetch patterns. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| PII leak via committed transcript | Information Disclosure | `.gitignore` defaults + PII scanner pre-commit hook (D-18/D-19) |
| Supply-chain attack via dep update | Tampering | Package-lock committed; `npm ci` in CI; consider Snyk / Dependabot for OSS hygiene |
| Determinism drift (LLM call sneaks into emit script) | Tampering / Repudiation | `lint-determinism.mjs` rejects LLM imports inside `assets/scripts/`; CI hard gate (D-13) |
| Manifest tampering | Tampering | SHA-256 hash chain in manifest.lock; `complete-design verify --golden` validates chain |
| User-repo data exfiltration via preview spawn | Information Disclosure | `security-sandbox.mjs` scrubs env (strips `*_KEY` etc.) before spawning Vite/Next/Astro |
| Sandbox-escape via `vm2` | Elevation of Privilege | **Don't use vm2.** Phase 1's "sandbox" is permission boundary only. (Pitfalls research + vm2 CVE record) |
| Token-budget overrun → host context truncation | Denial of Service | tiktoken-based pre-check + 10% safety margin + `truncationWarning` frontmatter (Pitfall B) |
| RSS feed poisoning (Anthropic watcher fed fake titles) | Tampering | Acceptable Phase 1 risk; watcher creates an issue for human review — not auto-action |
| Schema confusion attack (old schema accepted as new) | Tampering | `schemaVersion:` frontmatter required; ajv refuses on mismatch; D-27 migrations required |

**Phase 1 trust posture summary:** Phase 1 ships code that runs in the user's repo at Phase 2+ runtime. It has no remote API surface. Top threats are (1) PII leakage from misconfigured `.gitignore` (mitigated by D-29 + scanner), (2) determinism erosion via LLM-call introduction (mitigated by D-13 lint), (3) supply-chain via deps (mitigated by lockfile + CI `npm ci`). The narrow surface is itself a security feature.

## Recommended Plan Decomposition (planner advisory — not binding)

Five plans, sized for the 4-week budget. Plan 1 and Plan 5 can partially parallelize; Plans 2-4 depend on Plan 1's schemas.

| # | Plan name | Week | Requirements covered | Depends on |
|---|-----------|------|----------------------|-----------|
| 1 | Schemas Foundation | W1 | SCHEMA-01..07, FORMAT-01..07, DIST-01..03 (SKILL.md frontmatter schema), PERSIST-03 (migration template) | none |
| 2 | Gate Runner + Handoff Bundle | W2 | GATE-01..07, HAND-01..04, ROUTE-08 (route registry uses GateResult types), GTM-06 prep (watcher feeds gate dispatch types) | Plan 1 |
| 3 | Determinism CI + Eval Harness | W3 | PREV-03, PREV-04, PREV-05, TRIG-01, TRIG-02, TRIG-04, RECOV-01..03 (scripted-test pass) | Plans 1+2 |
| 4 | `design/` Governance + PII Scanner | W3-W4 | ART-01..07, PERSIST-01..04, TRUST-01..05, REF-01, REF-02, REF-04, SPINE-01..04 | Plan 1 |
| 5 | Preview Harness + Routing Scaffolding + Anthropic Watcher | W4 | PREV-01, PREV-02, GTM-06, ROUTE-08 (dispatcher stubs) | Plans 1+2 |

Each plan is ~1 week. Total: 4 weeks (Plans 3 + 4 overlap mid-W3, supported by parallelization). The Mermaid renderer (Pitfall 12 mitigation) belongs in Plan 3 (it's deterministic emit infrastructure used in Phase 3, but the renderer code must land in Phase 1 per Roadmap detail).

## Sources

### Primary (HIGH confidence)

- `.planning/research/STACK.md` — pinned versions, Context7-verified
- `.planning/research/ARCHITECTURE.md` — 13 components, 6 patterns, 12 risks
- `.planning/research/PITFALLS.md` — 13 critical pitfalls; Phase 1 prevents 7
- `.planning/research/SUMMARY.md` — cross-research synthesis
- `.planning/REQUIREMENTS.md` — 56 Phase-1 REQ-IDs verified in traceability table
- `.planning/ROADMAP.md` Phase 1 detail — success criteria
- `.planning/STATE.md` — v1.5 = 4-week decision rationale
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-CONTEXT.md` — 31 D-IDs across 11 areas
- `complete-design-mrd-v2.md` §3.6, §3.9, §3.10, §3.16, §3.19, §3.22, §9.1, §10, §16
- [Zod v4 JSON Schema docs](https://zod.dev/json-schema) — `z.toJSONSchema()`, Draft 2020-12 default target
- [npm: zod-to-json-schema](https://www.npmjs.com/package/zod-to-json-schema) — EOL announcement November 2025
- [Ajv JSON Schema validator](https://ajv.js.org/) — Draft 2020-12 support
- [Playwright webServer docs](https://playwright.dev/docs/test-webserver) — readiness probe via `url` option; allowed status codes
- [get-port (sindresorhus)](https://github.com/sindresorhus/get-port) — in-process lock + `reserve` option
- [npm: tiktoken](https://www.npmjs.com/package/tiktoken) — WASM cl100k_base; ESM compatible
- [@mermaid-js/mermaid-cli GitHub](https://github.com/mermaid-js/mermaid-cli) — `import { run } from '@mermaid-js/mermaid-cli'`
- [Excalidraw v0.18.0 release notes](https://newreleases.io/project/github/excalidraw/excalidraw/release/v0.18.0) — `baseline` removal
- [Vitest projects (formerly workspace)](https://vitest.dev/guide/projects) — Phase 1 host matrix config

### Secondary (MEDIUM confidence)

- [Anthropic skill-creator eval pattern blog](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) — pattern source for `skillgrade.mjs`
- [Holistic AI: LLM summarization metrics](https://www.holisticai.com/blog/llm-summarization-metrics) — BERTScore recommended over BLEU
- [Microsoft eval metrics playbook](https://learn.microsoft.com/en-us/ai/playbook/technology-guidance/generative-ai/working-with-llms/evaluation/list-of-eval-metrics) — comprehensive metrics taxonomy
- [rss-to-issues GitHub Action](https://github.com/marketplace/actions/rss-to-issues) — daily cron + issue-dedup pattern
- [Luhn algorithm in JavaScript](https://datacheck.dev/blog/luhn-algorithm-credit-card-validation.html) — pure-JS implementation
- [Pasquale Pillitteri: Claude Code Skills 2.0 Evals](https://pasqualepillitteri.it/en/news/341/claude-code-skills-2-0-evals-benchmarks-guide) — 4-mode skill-creator (Create / Eval / Improve / Benchmark)
- [Building tamper-evident audit log with SHA-256 hash chains](https://dev.to/veritaschain/building-a-tamper-evident-audit-log-with-sha-256-hash-chains-zero-dependencies-h0b) — manifest.lock pattern
- [The Hacker News: Critical vm2 sandbox escape](https://thehackernews.com/2026/01/critical-vm2-nodejs-flaw-allows-sandbox.html) — January 2026 CVE-22709
- [Riza: isolated-vm alternative](https://riza.io/compare/isolated-vm-alternative) — Phase 1 security sandbox rationale (don't use vm2)
- [pnpm vs npm workspaces 2026](https://tech-insider.org/pnpm-vs-npm-2026/) — workspace break-even analysis

### Tertiary (LOW confidence — needs validation during Plan 1 kickoff)

- Codex 2% cap exact value in May 2026 — calibrate at Phase 1 W1 kickoff per Open Q1+ flag in MRD §11
- Anthropic skill-creator harness as a standalone OSS package — none shipped as of May 2026; if it ships during Phase 1, adopt
- Google DESIGN.md schema stability over 14 weeks — MEDIUM per STACK.md; weekly watch from D-30

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against npm registry, Context7, Zod 4 docs, Playwright release notes
- Architecture patterns: HIGH — ARCHITECTURE.md validates the shapes; Phase 1 patterns drawn directly from MRD §3.x
- Pitfalls: HIGH — 7 of 13 critical pitfalls from PITFALLS.md map to Phase 1 prevention; this research extended with 7 additional Phase-1-specific pitfalls (A-G)
- Bundle-sufficiency eval methodology: MEDIUM — Research Flag #1 is genuinely open; pattern recommended above, calibration is a Plan 2 work-stream
- Aggregate coexistence eval methodology: MEDIUM — Research Flag #2 is novel; pattern recommended above, threshold calibration is a Phase 1 W3 deliverable
- Anthropic watcher implementation: HIGH — rss-to-issues + custom keyword filter is straightforward
- PII scanner regex set: HIGH — patterns are well-established; allowlist handles edge cases

**Research date:** 2026-05-24
**Valid until:** 2026-06-23 (30 days for stable infrastructure deps; 7 days for `tiktoken` / Excalidraw / shadcn / Anthropic skill-creator which move faster)

---
*Phase 1 research for: complete-design v1.5 Infrastructure & Determinism Foundation*
*Researched: 2026-05-24*
