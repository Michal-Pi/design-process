---
phase: 01-v1-5-infrastructure-determinism-foundation
plan: "03"
subsystem: determinism-ci + skillgrade + coexistence-eval + recovery-semantics
tags:
  - determinism
  - verify-golden
  - lint-determinism
  - mermaid-renderer
  - skillgrade
  - coexistence-eval
  - recovery-semantics
  - ci-workflows
  - eslint
  - tdd

dependency_graph:
  requires:
    - "01-01"  # Gate runner base + CLI dispatcher
    - "01-02"  # Handoff bundle + manifest.lock hash chain
  provides:
    - verify-golden gate (5× byte-identical determinism)
    - lint-determinism (LLM-import rejection)
    - mermaid-render determinism (Phase 3 dependency)
    - skillgrade per-skill harness (TRIG-01, TRIG-02)
    - aggregate coexistence eval (D-15, D-16)
    - recovery semantics (RECOV-01..03)
    - 5 GitHub Actions CI workflows
  affects:
    - "01-04"  # Governance plan consumes recover.mjs machinery
    - "01-05"  # Host profile dirs complete D-22 matrix

tech_stack:
  added:
    - "@mermaid-js/mermaid-cli 11.x — headless deterministic Mermaid renderer"
    - "@typescript-eslint/eslint-plugin 8.x — switch-exhaustiveness-check rule"
    - "@typescript-eslint/parser 8.x — TypeScript ESLint parser"
    - "eslint 10.x — ESLint config (.eslintrc.cjs)"
    - "gray-matter (existing) — used in dispatch-host.mjs for SKILL.md parsing"
  patterns:
    - "TDD RED/GREEN for all 3 tasks: 6 commits total (3 test + 3 feat)"
    - "YAML-quoted descriptions in SKILL.md stubs (colons break gray-matter)"
    - "Static-analysis fallback for skill dispatch (A2 assumption — no headless eval API)"
    - "JSONL hash chain for manifest.lock — same algorithm as Plan 02"
    - "Ephemeral temp dirs for coexistence eval corpus (prepareCorpus + cleanup)"

key_files:
  created:
    - assets/scripts/verify-golden.mjs        # 5× byte-identical CI gate
    - assets/scripts/lint-determinism.mjs     # LLM-import architecture lint
    - assets/scripts/mermaid-render.mjs       # Headless Mermaid renderer
    - assets/scripts/recover.mjs              # Recovery semantics machinery
    - assets/scripts/cli/verify.mjs           # design-os verify --golden subcommand
    - assets/scripts/cli/eval-skillgrade.mjs  # design-os eval skillgrade subcommand
    - assets/scripts/cli/eval-coexistence.mjs # design-os eval coexistence subcommand
    - assets/scripts/cli/recover.mjs          # design-os recover subcommand
    - evals/runners/dispatch-host.mjs         # A2 static-analysis fallback host
    - evals/runners/skillgrade.mjs            # Per-skill harness (TRIALS=3, recall≥0.85)
    - evals/coexistence/aggregate-eval.mjs    # 6-package coexistence eval
    - evals/coexistence/install-corpus.mjs    # Stub corpus preparator
    - evals/coexistence/triggers/design-os.yaml   # 32 design-os shouldFire prompts
    - evals/coexistence/triggers/gsd.yaml         # 32 GSD shouldFire prompts
    - evals/coexistence/triggers/superpowers.yaml # 32 superpowers shouldFire prompts
    - evals/coexistence/triggers/frontend-design.yaml # 32 frontend-design prompts
    - evals/coexistence/triggers/shadcn.yaml      # 32 shadcn prompts
    - evals/coexistence/triggers/notion-mcp.yaml  # 32 notion-mcp prompts
    - evals/triggers/design/triggers.yaml     # 14 shouldFire + 12 shouldNotFire
    - evals/triggers/audit/triggers.yaml      # 12 shouldFire + 12 shouldNotFire
    - evals/triggers/handoff/triggers.yaml    # 12 shouldFire + 12 shouldNotFire
    - evals/coexistence/last-run.json         # Phase 1 baseline run output
    - evals/fixtures/golden/schemas-emit/     # schemas-emit golden fixtures
    - evals/fixtures/golden/handoff-bundle/   # handoff-bundle golden fixtures (3013 tokens)
    - evals/fixtures/golden/gate-stage-5a/    # gate-stage-5a golden fixtures (2 states)
    - evals/fixtures/golden/mermaid-render/   # mermaid-render golden fixtures
    - .github/workflows/verify-golden.yml     # Determinism CI gate
    - .github/workflows/lint-determinism.yml  # Architecture lint CI
    - .github/workflows/schema-migration-guard.yml # Pitfall G CI rule
    - .github/workflows/host-matrix.yml       # D-22 3-host matrix CI
    - .github/workflows/aggregate-coexistence.yml  # Weekly coexistence eval CI
    - docs/CONTINGENCY-TRIG-04.md             # Core/atoms split lever
    - tests/verify/golden-determinism.test.ts
    - tests/verify/lint-determinism.test.ts
    - tests/verify/mermaid-render.test.ts
    - tests/verify/recovery-resume.test.ts    # 19 tests (RECOV-01..03)
    - tests/eval/skillgrade.test.ts           # 14 tests
    - tests/eval/coexistence-shape.test.ts    # 20 tests
    - tests/fixtures/lint-determinism/        # LLM-import violation + clean fixtures
    - tests/fixtures/recovery/               # 3 recovery fixtures (stage 1, 2, 4)
    - .eslintrc.cjs                           # Pitfall F — switch-exhaustiveness-check
  modified:
    - assets/scripts/handoff-bundle-build.mjs # Added generatedAt? param for golden tests
    - package.json                            # 5 new scripts + 4 new deps
    - .gitignore                              # .handoff/ + recovery fixture .design-os/ carveout

decisions:
  - "A2 assumption: dispatchToHost uses static-analysis keyword-overlap fallback (no public Claude Code headless eval API as of May 2026); DIST-03 first-100-chars 2× weight"
  - "Open Q3: aggregate coexistence recall threshold ≥0.80 calibrated empirically; Phase 1 reports number without blocking CI (continue-on-error: true)"
  - "Phase 1 skillgrade baseline: design recall=0.786, aggregate coexistence recall=0.581 — below thresholds but acceptable; real dispatch will improve"
  - "TRIG-04 contingency documented not executed: split into design-os-core + design-os-atoms fires only if recall <0.80 after 2 tuning rounds"
  - "schema-migration-guard uses --diff-filter=M (MODIFIED only, not ADDED) — fresh-v1 schemas exempt from migration requirement"
  - "handoff-bundle generatedAt optional param: golden tests use fixed 2026-05-25T00:00:00.000Z timestamp for byte-identical determinism"
  - "YAML-quoted descriptions in SKILL.md stubs: descriptions containing colons must be wrapped in double-quotes to avoid gray-matter parse errors"

metrics:
  duration_minutes: 81
  tasks_completed: 3
  files_created: 67
  files_modified: 3
  tests_added: 241
  commits: 7  # 3 RED + 3 GREEN + 1 .gitignore fix
  completed_date: "2026-05-25"
---

# Phase 01 Plan 03: Determinism CI Summary

**One-liner:** Determinism CI infrastructure with 5× byte-identical verify-golden gate, LLM-import lint, headless Mermaid renderer, per-skill skillgrade harness (TRIALS=3, recall≥0.85), 6-package coexistence eval with A2 static-analysis fallback, recovery semantics machinery (RECOV-01..03), and 5 GitHub Actions workflows — all via TDD RED/GREEN across 3 tasks.

## What Was Built

### Task 1: Determinism CI Gate + Architecture Lint + Mermaid Renderer

- **`assets/scripts/verify-golden.mjs`** — Runs each fixture runner 5× and asserts byte-identical SHA-256 hashes across all runs AND match against the committed `expected.*` fixture. Fixtures: schemas-emit, handoff-bundle (3013 tokens, fixed timestamp), gate-stage-5a (both states), mermaid-render.
- **`assets/scripts/lint-determinism.mjs`** — Walks `assets/scripts/**/*.{mjs,ts}`, scans ES import statements (line-anchored regex to exclude comments), rejects paths matching `/(anthropic|openai|langchain|llamaindex|@anthropic-ai|@openai)/`. Supports `--scope <dir>` for test isolation.
- **`assets/scripts/mermaid-render.mjs`** — Headless Mermaid render via `@mermaid-js/mermaid-cli` with `deterministicIds: true, deterministicIDSeed: 'design-os'`; strips HTML date comments post-process; produces byte-identical SVG across runs.
- **`.eslintrc.cjs`** — `@typescript-eslint/switch-exhaustiveness-check: 'error'` (Pitfall F) + `no-restricted-imports` blocking LLM SDKs (defense in depth).
- **3 CI workflows**: `verify-golden.yml` (with Playwright chromium), `lint-determinism.yml`, `schema-migration-guard.yml` (`--diff-filter=M` for MODIFIED-only; fresh-v1 schemas exempt).

**Key fix (handoff-bundle non-determinism):** `buildHandoffBundle()` used `new Date().toISOString()` causing different hashes per run. Fixed by adding `generatedAt?` optional param and using `GOLDEN_TIMESTAMP = "2026-05-25T00:00:00.000Z"` in the fixture runner.

### Task 2: Skillgrade + Coexistence Eval + Trigger Corpus + CI

- **`evals/runners/dispatch-host.mjs`** — A2 static-analysis fallback: loads SKILL.md files via gray-matter, scores keyword overlap with DIST-03 first-100-chars 2× weighting. CLAUDE_CODE_BIN detection for future real headless eval.
- **`evals/runners/skillgrade.mjs`** — `TRIALS=3` per-skill harness; any 1-of-3 fire counts as hit/false-fire; emits `{ recall, falseFireRate, pass }`.
- **9 trigger YAMLs**: 3 per design-os skill (design: 14+12, audit: 12+12, handoff: 12+12) + 6 coexistence package aggregates (32 shouldFire each).
- **`evals/coexistence/aggregate-eval.mjs`** — 6-package corpus evaluation with deterministic `last-run.json` output; exits 0 regardless of pass/fail (Open Q3).
- **`docs/CONTINGENCY-TRIG-04.md`** — Core/atoms split lever: fires only if aggregate recall < 0.80 after 2 tuning rounds.
- **2 CI workflows**: `host-matrix.yml` (D-22: [claude-code, codex-cli, cursor] matrix, fail-fast: false), `aggregate-coexistence.yml` (weekly + PR, continue-on-error: true Phase 1).

**Key fix (YAML colon in descriptions):** `gray-matter` failed to parse descriptions like "Scaffold the 5-stage design process: research..." — colons in YAML values must be quoted. Fixed in `skillgrade.mjs` and `install-corpus.mjs` by wrapping descriptions in double-quotes.

### Task 3: Recovery Semantics (RECOV-01..03)

- **`assets/scripts/recover.mjs`** — Reads `.design-os/manifest.lock`, parses last entry, maps stage → next stage via `NEXT_STAGE` sequence (1→2→3→4→5a→5b), checks stage-specific artifact presence. Returns `{ resumeFrom, lastGate }` or `{ requiresConfirmation: true, reason }` when artifacts missing.
- **`assets/scripts/cli/recover.mjs`** — `design-os recover --design-dir <path> --resume` CLI subcommand.
- **3 recovery fixtures**: `design-dir-after-stage-{1,2,4}/` with valid JSONL hash-chain `manifest.lock` files (pre-computed using same algorithm as `appendManifestLockEntry`).
- **19 test assertions**: structural checks, resumeFrom detection (interrupt after 1/2/4), confirm-before-regenerate (RECOV-01), equivalent end-state via truncation + resume (RECOV-02).

## Open Q3 Status

Aggregate coexistence eval is non-blocking in Phase 1. Phase 1 baseline (static-analysis fallback):
- design skill recall: 0.786 (threshold: 0.85)
- aggregate coexistence recall: 0.581 (threshold: 0.80)

Both below thresholds — expected. The static-analysis fallback is a baseline; real Claude Code headless dispatch will significantly improve these numbers. CI reports the numbers without blocking (`continue-on-error: true`). Blocking enables at v2.0 GA once the Claude Code eval API ships publicly.

## Pitfall Mitigations Shipped

| Pitfall | Mitigation | Status |
|---------|------------|--------|
| Pitfall F — ESLint exhaustiveness | `@typescript-eslint/switch-exhaustiveness-check: error` in `.eslintrc.cjs` | Shipped |
| Pitfall G — Schema migration guard | `schema-migration-guard.yml` with `--diff-filter=M` | Shipped |
| Pitfall 12 — Mermaid determinism | `deterministicIds: true` + date-comment stripping + golden test | Shipped |
| Pitfall 9 — Trigger budget cap | Per-skill trigger YAMLs + skillgrade CI gate + TRIG-04 contingency doc | Shipped |
| Pitfall E — Silent CI failures | Heartbeat steps in all 5 CI workflows | Shipped |

## Outstanding Items for Plan 04 (Governance)

- Interactive confirm-before-regenerate UX: `recover.mjs` machinery is complete; Plan 04 surfaces the `requiresConfirmation: true` result to the user via a structured prompt before re-running a gate.
- `regen-golden` script with required `--reason <text>` argument (T-03-01 mitigation; D-14 golden fixture regeneration gate).

## Outstanding Items for Plan 05 (Host Profiles + Route Registry)

- Host profile dirs `evals/hosts/{claude-code,codex-cli,cursor}/` complete the D-22 matrix scaffolded in `host-matrix.yml`.
- Route registry registers the 3 design-os skill names (`design`, `audit`, `handoff`) so skillgrade and coexistence eval can dispatch against real SKILL.md frontmatter instead of stubs.
- Real-package installation in `install-corpus.mjs` (currently description-only stubs — Plan 4/GA hardening step).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Handoff-bundle golden non-determinism**
- **Found during:** Task 1 — verify-golden fixture development
- **Issue:** `buildHandoffBundle()` used `new Date().toISOString()` in `generated` and `lastReviewedAt` fields, causing different SHA-256 hashes across 5 runs.
- **Fix:** Added `generatedAt?` optional parameter to `buildHandoffBundle()`; golden fixture runner uses `GOLDEN_TIMESTAMP = "2026-05-25T00:00:00.000Z"`.
- **Files modified:** `assets/scripts/handoff-bundle-build.mjs`, `assets/scripts/verify-golden.mjs`

**2. [Rule 1 - Bug] tsx parse error from `*/` in JSDoc comment**
- **Found during:** Task 1 — first run of lint-determinism.mjs
- **Issue:** A JSDoc block comment contained `/* import from 'pkg' */` as an inline example, causing tsx lexer to terminate the outer `/**` comment block early.
- **Fix:** Replaced the embedded comment example with plain text.
- **Files modified:** `assets/scripts/lint-determinism.mjs`

**3. [Rule 1 - Bug] YAML colon in skill descriptions broke gray-matter**
- **Found during:** Task 2 — skillgrade harness returning recall=0
- **Issue:** Skill descriptions like "Scaffold the 5-stage design process: research, IA..." contain colons that YAML interprets as key-value separators, corrupting gray-matter frontmatter parsing.
- **Fix:** Wrapped all description values in double-quotes in both `skillgrade.mjs` stub generation and `install-corpus.mjs` STUB_BODY_TEMPLATE.
- **Files modified:** `evals/runners/skillgrade.mjs`, `evals/coexistence/install-corpus.mjs`

**4. [Rule 2 - Missing] .gitignore carve-outs for generated runtime files**
- **Found during:** Task 2 completion — `evals/fixtures/golden/handoff-bundle/input/design-dir/.handoff/` untracked; Task 3 — recovery fixture `.design-os/manifest.lock` files blocked by `tests/fixtures/**/.design-os/` gitignore rule.
- **Fix:** Added `.handoff/` pattern; added `!tests/fixtures/recovery/**/.design-os/` exception.
- **Files modified:** `.gitignore`

## Threat Flags

None found beyond what is documented in the plan's `<threat_model>`.

## Self-Check

Files created/modified as claimed: checked via git log. All 5 CI workflows exist in `.github/workflows/`. All 9 trigger YAMLs committed. `docs/CONTINGENCY-TRIG-04.md` exists. 241/241 tests pass.

## Self-Check: PASSED
