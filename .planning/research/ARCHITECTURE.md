# Architecture Research

**Domain:** Agent-host SKILL.md package (design-process facilitator) — workflows + atoms + references + deterministic scripts, persisted via stage-typed artifacts in `design/` and package state in `.complete-design/`
**Researched:** 2026-05-24
**Confidence:** HIGH — the MRD (complete-design-mrd-v2.md) specifies the architecture in detail; this document validates the shape, names the seams, and surfaces risks the MRD glossed over

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    HOST AGENT (Claude Code / Codex CLI / Cursor)     │
│                    — owns LLM, file I/O, Bash, tool dispatch         │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ skill trigger (200-char description match)
                            ↓
┌──────────────────────────────────────────────────────────────────────┐
│                  complete-design SKILL.md PACKAGE (22 skills)              │
│                                                                       │
│  ┌──────────────────┐  ┌─────────────────────────────────────────┐  │
│  │   Workflows (7)  │  │           Atoms (15)                    │  │
│  │  ingest/discover │→ │  prd/parse-or-interview, research/*,    │  │
│  │  structure/sketch│  │  ia/*, lowfi/*, ixd/*, hifi/*,          │  │
│  │  interact/style  │  │  tokens/emit, system/scaffold-component │  │
│  │  systematize+audit  └─────────────────────────────────────────┘  │
│  └────────┬─────────┘                                                │
│           │ reads/writes via Read/Write/Bash                          │
│  ┌────────┴──────────────────────────────────────────────────────┐  │
│  │              assets/scripts/ (deterministic emit layer)        │  │
│  │  oklch · contrast · dtcg-lint · design-md-validate ·          │  │
│  │  state-machine-emit · mermaid-render · excalidraw-render ·    │  │
│  │  port-manager · playwright-runner · security-sandbox ·        │  │
│  │  eval-harness · skillgrade                                     │  │
│  └────────────────────────┬───────────────────────────────────────┘  │
│                           │                                            │
│  ┌────────────────────────┴────────────────────┐  ┌────────────────┐ │
│  │       references/ (canon corpus)            │  │ gates/ (6)     │ │
│  │  garrett · cooper · torres · klement ·      │  │ stage-1..5b   │ │
│  │  rosenfeld · buxton · saffer · frost ·      │  │ checklists +  │ │
│  │  wcag · dtcg · design-md · slop-tells       │  │ evidence-grade│ │
│  └─────────────────────────────────────────────┘  └───────────────┘ │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ Read/Write
                            ↓
┌──────────────────────────────────────────────────────────────────────┐
│        USER REPO — TWO PERSISTENCE SURFACES                          │
│                                                                       │
│  ┌──────────────────────────────┐  ┌────────────────────────────┐  │
│  │  design/  (committed)        │  │  .complete-design/ (selective)   │  │
│  │  ─ MANIFEST.md               │  │  ─ manifest.lock (hash    │  │
│  │  ─ PRD.md                    │  │     chain)                 │  │
│  │  ─ research/personas/        │  │  ─ manual-overrides.json   │  │
│  │  ─ research/jobs/            │  │  ─ preview/run-<id>/       │  │
│  │  ─ ASSUMPTIONS.md            │  │     port.lock, _imports/   │  │
│  │  ─ ia/sitemap.json + flows/  │  │  ─ private/ (gitignored)   │  │
│  │  ─ wireframes/<screen>/      │  │     run-log.jsonl,         │  │
│  │  ─ interactions/*.spec.md +  │  │     decision-log.jsonl,    │  │
│  │     *.machine.ts             │  │     screenshots/           │  │
│  │  ─ tokens.json (DTCG)        │  │  ─ ci.yaml                 │  │
│  │  ─ DESIGN.md (Google spec)   │  └────────────────────────────┘  │
│  │  ─ components/, storybook/   │                                    │
│  │  ─ .handoff/stage-N-bundle.md│  ← compact 5-15k token bundles    │
│  │  ─ AUDIT-REPORT.md           │                                    │
│  └──────────────────────────────┘                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **SKILL.md frontmatter** | Trigger description (≤200 chars), stage:, gate:, artifacts.reads/writes, composition, compatibility flags | YAML frontmatter at top of each `.md` skill file per agentskills.io v1 |
| **SKILL.md procedure body** | Numbered procedure: read `.handoff/stage-(N-1)-bundle.md` → invoke atoms or scripts → write artifacts → run gate → write next handoff bundle | Markdown with explicit Read/Write/Bash steps; LLM is the operator, not the renderer |
| **Workflows (7)** | End-to-end stage runners: `ingest` (S0), `discover` (S1), `structure` (S2), `sketch` (S3), `interact` (S4), `style` (S5a), `systematize` (S5b), plus cross-stage `audit` | Each workflow is one SKILL.md; calls atoms via stitched-context subagent dispatch |
| **Atoms (15)** | Single-purpose skills invocable standalone (with bootstrap from `design/`) or composed inside a workflow | Per stage: 1/3/3/2/3/3 atoms; each atom carries `mvp:` flag |
| **`assets/scripts/`** | Deterministic emitters & validators. **LLM picks; scripts emit.** Token math, contrast checks, schema validation, state-machine code generation, preview boot, screenshot capture, evals | Node ESM modules (`.mjs`); invoked from skills via `Bash`; pure (no LLM calls) |
| **`references/` corpus** | Stage-organized canon (Garrett, Cooper, Rosenfeld, Buxton, Saffer, Frost, WCAG, DTCG, DESIGN.md) + 6 stage-gate checklists + PRD canon + slop-tells | Local Markdown files (no vector DB, no graph); loaded on-demand via Read |
| **`design/` (artifact substrate)** | The cross-stage IR: stage-typed user-facing artifacts. Committed to git. Schema-validated. Frontmatter-tagged with `provenance:`, `evidence:`, `sourceHash:` | Mixed JSON (personas, sitemap, tokens) + Markdown (findings, JTBDs, spec) + Mermaid + Excalidraw JSON + TypeScript (XState) |
| **`design/.handoff/`** | Compact ~5-15k-token per-stage bundles. **The context-window survival mechanism.** Each stage reads only the previous bundle, not the raw upstream directory | Auto-written Markdown at the end of each stage workflow |
| **`.complete-design/` (package state)** | Manifest hash chain, manual-override capture, preview/run state, decision log, screenshots — selectively committed per v1.0.1 commit policy | `manifest.lock` (hash chain), `manual-overrides.json`, `private/*.jsonl`, `preview/run-<id>/port.lock` |
| **Gate runner** | Executes a stage-gate checklist; returns `(terminal-state, evidence-grade)` tuple — PASS/PASS_WITH_WARNINGS/FAILED_AFTER_REPAIR/USER_OVERRIDDEN × VALIDATED/PROTO/INFERRED/MISSING | Pure script per gate (`gates/stage-N.mjs`) reading `design/` + frontmatter; emits structured report |
| **Host compatibility layer** | Claude Code host-first; Codex CLI + Cursor sequential-fallback. Per-host adapter for tool dispatch differences (Claude subagents vs. Codex linear, Cursor session model) | Branch logic in workflow bodies; CI matrix runs `skillgrade` on all three hosts |
| **Trigger metadata index** | The flattened ≤5k char registry of all 22 skill descriptions — what hosts truncate against the 2% cap | `manifest.json` aggregates frontmatter; skillgrade eval gates regressions per-skill + aggregate coexistence with 5+ other packages |
| **Eval harness** | Per-skill should-fire / should-not-fire trigger tests, golden-output tests, end-to-end 15-run fixture suite, adversarial tests (synthetic-persona block, fidelity-cap reject, cross-stage discipline) | `evals/` directory; Node test runner; CI-gated; produces metrics for §11 success metrics |

---

## Recommended Project Structure

```
complete-design/                          # repo root (the package)
├── manifest.json                   # aggregate registry of all skills (auto-built)
├── package.json                    # Node tooling for assets/scripts
├── README.md                       # OSS-grade entry point
├── LICENSE                         # Apache-2.0
│
├── skills/                         # the 22 triggerable SKILL.md units
│   ├── design.md                   # top-level orchestrator (route-aware)
│   ├── workflows/
│   │   ├── ingest.md               # Stage 0
│   │   ├── discover.md             # Stage 1
│   │   ├── structure.md            # Stage 2
│   │   ├── sketch.md               # Stage 3 (v2.0b)
│   │   ├── interact.md             # Stage 4 (v2.0b)
│   │   ├── style.md                # Stage 5a (lite-mode in v2.0a)
│   │   ├── systematize.md          # Stage 5b (lite-mode in v2.0a)
│   │   └── audit.md                # cross-stage maintenance
│   └── atoms/
│       ├── prd/parse-or-interview.md
│       ├── research/synthesize.md
│       ├── research/personas-proto.md
│       ├── research/build-ost.md
│       ├── ia/sitemap-variants.md
│       ├── ia/flows-from-jobs.md
│       ├── ia/tree-test-design.md  (v2.1)
│       ├── lowfi/crazy-eights.md   (v2.0b)
│       ├── lowfi/converge.md       (v2.0b)
│       ├── ixd/state-machine.md    (v2.0b)
│       ├── ixd/pattern-variants.md (v2.0b)
│       ├── ixd/state-catalog.md    (v2.0b)
│       ├── hifi/variants-preview.md
│       ├── tokens/emit.md
│       └── system/scaffold-component.md  (v2.1)
│
├── assets/
│   └── scripts/                    # deterministic emitters (LLM picks; scripts emit)
│       ├── oklch.mjs               # color math (preserved from v1.0.1)
│       ├── contrast.mjs            # WCAG contrast measure
│       ├── dtcg-lint.mjs           # DTCG v2025.10 schema validity
│       ├── design-md-validate.mjs  # Google DESIGN.md spec validity
│       ├── state-machine-emit.mjs  # XState v5 code generation
│       ├── mermaid-render.mjs      # Mermaid → SVG/HTML for preview (v2.0b)
│       ├── excalidraw-render.mjs   # Excalidraw JSON → static HTML viewer (v2.0b)
│       ├── tokens-project.mjs      # DTCG → Tailwind v4 / shadcn / plain-CSS
│       ├── port-manager.mjs        # preview dev-server port allocation
│       ├── playwright-runner.mjs   # readiness + screenshot capture
│       ├── security-sandbox.mjs    # transcript/PII isolation, brand-asset rules
│       ├── variant-distance.mjs    # v1.0.1 6-axis diversity metric
│       ├── handoff-bundle-build.mjs # compose design/.handoff/stage-N-bundle.md
│       ├── gates/
│       │   ├── stage-1.mjs         # checklist + evidence-grade resolver
│       │   ├── stage-2.mjs
│       │   ├── stage-3.mjs         (v2.0b)
│       │   ├── stage-4.mjs         (v2.0b)
│       │   ├── stage-5a.mjs
│       │   └── stage-5b.mjs
│       └── audit/
│           ├── slop-tells.mjs      # v1.0.1 library
│           ├── stage-N-pr.mjs      # per-stage PR detectors
│           └── reverse-engineer.mjs  # Lovable refugee path (v2.0b)
│
├── references/                     # canon corpus (Markdown only, organized by stage)
│   ├── garrett-elements/
│   ├── cooper-goodwin/
│   ├── torres-ost/
│   ├── klement-jtbd/
│   ├── indi-young-thinking-styles/
│   ├── rosenfeld-ia/
│   ├── wodtke-ia/                  (v2.0b)
│   ├── spencer-card-sort/          (v2.0b)
│   ├── buxton-sketching/           (v2.0b)
│   ├── sprint-crazy-eights/        (v2.0b)
│   ├── shape-up-pitches/           (v2.0b)
│   ├── saffer-microinteractions/   (v2.0b)
│   ├── tidwell-patterns/           (v2.0b)
│   ├── head-motion/                (v2.0b)
│   ├── hax-18/                     (v2.0b)
│   ├── xstate-v5/                  (v2.0b)
│   ├── design-md/
│   ├── dtcg-v2025-10/
│   ├── wcag-2-2/
│   ├── radix-step-roles/
│   ├── shadcn-tailwind-v4/
│   ├── apg/                        (v2.0b)
│   ├── material-3/                 (v2.0b)
│   ├── frost-atomic/
│   ├── kholmatova-systems/
│   ├── curtis-token-tiers/
│   ├── gates/                      # the package's biggest contribution
│   │   ├── stage-1.md              # saturation, behavioral personas, outcomes-as-metrics
│   │   ├── stage-2.md              # tree-test thresholds, sitemap coverage, no orphans
│   │   ├── stage-3.md              # ≥3 alternatives, fidelity cap, walkthrough complete
│   │   ├── stage-4.md              # complete state set, async ops, HAX 18, motion rationale
│   │   ├── stage-5a.md             # variant diversity ≥0.5, contrast, two-reviewer viability
│   │   └── stage-5b.md             # DTCG validity, WCAG 2.2 AA, design-code parity
│   ├── prd/
│   │   ├── cagan-discovery.md
│   │   ├── singer-shape-up.md
│   │   ├── bezos-pr-faq.md
│   │   ├── lenny-one-pager.md
│   │   ├── yien-staged.md
│   │   ├── lean-ux-canvas.md
│   │   └── spec-driven.md
│   └── slop-tells/heuristics.md
│
├── schemas/                        # v1.5 prerequisite — versioned JSON Schemas
│   ├── persona.v1.json
│   ├── sitemap.v1.json
│   ├── manifest.v1.json
│   ├── interaction-spec.v1.json
│   ├── audit-report.v1.json
│   └── handoff-bundle.v1.json
│
├── evals/                          # CI-gated quality bar
│   ├── triggers/<skill>/triggers.yaml      # ≥10 should-fire + ≥10 should-not-fire
│   ├── golden/                              # determinism golden outputs
│   ├── fixtures/                            # Next + Tailwind v4 + shadcn end-to-end
│   ├── adversarial/                         # synthetic-persona block, fidelity-cap reject
│   ├── coexistence/                         # 5+ other packages installed corpus
│   └── runners/                             # eval-harness Node scripts
│
├── adapters/                       # polyglot output projections (v1.0.1 preserved)
│   ├── tailwind-v4/
│   ├── shadcn/
│   └── plain-css/
│
└── .github/workflows/              # CI: skillgrade, golden, end-to-end fixture
```

### Structure Rationale

- **`skills/` flat-by-role:** Hosts discover skills by frontmatter; the directory layout is a human convenience. Splitting `workflows/` and `atoms/` makes the 7+15 mental model visible. Nested route folders (e.g., `atoms/research/`) match the skill `name:` prefix and the artifact path under `design/`.
- **`assets/scripts/` as the deterministic seam:** P6 ("LLM picks; scripts emit") is the architectural contract. Every output that must be reproducible (tokens, contrast, schemas, state machines, screenshots) goes through a script. Skills do not perform code-emit in the LLM body. CI verifies via golden tests.
- **`references/` organized by stage AND by author:** Two indexes for one corpus. A workflow reads stage-scoped (`references/gates/stage-1.md`); an atom may need canon-scoped (`references/torres-ost/`). Stage-gate references live under `references/gates/` because they are operational checklists, not reading material.
- **`schemas/` as a top-level v1.5 prerequisite:** The MRD §16 BLOCKER-adjacent finding was "custom schemas not ship-ready." Schemas must precede every v2.0a workflow because gates depend on them, frontmatter validation depends on them, and the handoff bundle structure depends on them.
- **`design/` lives in user's repo, not the package:** The substrate is *output*, never bundled. `evals/fixtures/` contains example `design/` trees for testing.
- **`.complete-design/` selective commit:** `manifest.lock` and `manual-overrides.json` are committed (team needs them); `private/`, `preview/run-<id>/`, screenshots are gitignored (PII + bulk).
- **`evals/` co-equal with `skills/`:** Trigger discipline is non-negotiable (R15). The 15-run end-to-end fixture, adversarial tests, coexistence eval gate every release. Treating `evals/` as a top-level peer signals the discipline.

---

## Architectural Patterns

### Pattern 1: LLM Picks, Scripts Emit (Determinism Seam)

**What:** The LLM produces *decisions* (which variant, which pattern, which token value, which screen). Scripts produce *artifacts* (DTCG JSON, contrast measurements, XState machine code, contrast-checked palettes). The seam is enforced by skill procedures that route emit through `Bash` calls to `assets/scripts/`, never through inline `Write` of computed values.

**When to use:** Any output that must (a) round-trip identically across runs, (b) validate against a schema, or (c) be testable via golden output.

**Trade-offs:** Forces upfront investment in scripts (v1.5 weeks 1-3); pays back as the only way to keep cross-host parity (Codex, Cursor, Claude Code can't agree on numeric outputs from LLMs); essential to pass `complete-design verify --golden` CI gate.

**Example (skill procedure body fragment):**
```markdown
5. User picks variant V (from the 3 rendered options).
6. Bash: node assets/scripts/tokens-project.mjs \
     --variant V \
     --in .complete-design/preview/run-<id>/variant-V.json \
     --target tailwind-v4 \
     --out design/tokens.json
7. Bash: node assets/scripts/dtcg-lint.mjs --in design/tokens.json
8. Bash: node assets/scripts/contrast.mjs --tokens design/tokens.json \
     --report .complete-design/private/contrast-report.json
```

### Pattern 2: Stage-Typed Artifact Substrate as Intermediate Representation (IR)

**What:** `design/` is the package's IR. Each stage reads stage-N artifacts and writes stage-(N+1) artifacts in opinionated locations with opinionated schemas. The graph of file-reads ↔ file-writes encodes the design process. Nothing in skill bodies hard-codes inter-stage state — all of it flows through named files.

**When to use:** Whenever a stage workflow needs upstream context, OR when an atom is invoked standalone (it bootstraps from `design/`, falling back to interview mode if files are missing).

**Trade-offs:** Adds repo hygiene burden (governance per §3.6); adds schema-version migration burden (per `schemaVersion:` frontmatter); but: makes the pipeline reproducible, recoverable, partial-output-usable, and team-handoff-friendly (a designer can read `design/research/` without running the package).

**Example (atom frontmatter):**
```yaml
artifacts:
  reads:  [ design/research/personas/*.persona.json, design/PRD.md ]
  writes: [ design/ia/sitemap.json, design/ia/flows/*.flow.mmd ]
```

### Pattern 3: Compact Handoff Bundles (Context-Window Survival)

**What:** At the end of every stage workflow, `assets/scripts/handoff-bundle-build.mjs` synthesizes `design/.handoff/stage-N-bundle.md` (~5-15k tokens) containing only the minimum the next stage needs: persona summaries, JTBD list, picked sitemap delta, picked wireframe rationale, state-catalog summary. The next stage reads the bundle, not the raw directory. Full artifacts are loaded on-demand when the LLM needs to verify a specific claim.

**When to use:** Every stage transition in the full `design --route new-product` run. The full 5-stage run is impossible without it (raw artifacts at Stage 5 with 5 stages of upstream would exceed any context window).

**Trade-offs:** Bundle quality is now a first-class quality bar (a bad bundle starves Stage N+1); requires its own eval (per-bundle fidelity test against raw artifacts); adds one script and one schema. But: this is the difference between "works on toy PRDs" and "works on real products."

**Example (bundle structure):**
```markdown
---
artifact: handoff-bundle
stage: 2 → 3
schemaVersion: 1
sourceHash: <sha256 of design/ia/ at write time>
---

# Stage 2 → Stage 3 Handoff

## Personas (summary, full JSON at design/research/personas/)
- Maya (indie dev, behavioral persona, evidence: PROTO)
- ...

## JTBDs (count: 7; primary: 3)
- "When starting a new app, I want to..., so I can..."

## Picked Sitemap (full JSON at design/ia/sitemap.json)
- Top-level: home, dashboard, settings (3 sections)
- LATCH scheme: Category
- Tree test: not yet run

## Flows requiring wireframes
1. onboarding (5 screens)
2. core-loop (4 screens)
3. settings (2 screens)
```

### Pattern 4: Evidence-Graded Validation Gates

**What:** Each gate returns a `(terminal-state, evidence-grade)` tuple — not a binary pass/fail. Terminal states (PASS / PASS_WITH_WARNINGS / FAILED_AFTER_REPAIR / USER_OVERRIDDEN) describe procedural outcome; evidence grades (VALIDATED / PROTO / INFERRED / MISSING) describe the truth-grounding of the artifact. The tuple is recorded in `.complete-design/manifest.lock` and propagates to downstream gates (Stage 2 can be `(PASS, PROTO)` because Stage 1 was `PROTO`).

**When to use:** Every stage close. Also at `audit --stage N`.

**Trade-offs:** More complex than pass/fail; users may be confused by two axes; but: this is the package's biggest discipline win (R6 — synthetic-persona red line, R4 — the gates themselves). It honestly handles the solo-indie reality without abandoning rigor.

**Example (manifest.lock entry):**
```json
{
  "stage": "1",
  "gateRun": "2026-05-24T12:34:56Z",
  "terminalState": "PASS_WITH_WARNINGS",
  "evidenceGrade": "PROTO",
  "checks": {
    "behavioralPersona": "pass",
    "outcomesAsMetrics": "pass",
    "ostPruned": "pass",
    "syntheticOnlyHardWarning": "warning"
  },
  "userOverride": null,
  "sourceHash": "sha256:..."
}
```

### Pattern 5: Stitched-Context Subagent Dispatch

**What:** Workflows do not run all 5 stages in one LLM turn. Each stage workflow dispatches via Claude Code subagents (host-first), Codex CLI sequential sub-tasks (fallback), or Cursor session boundaries. Each subagent receives only the relevant `.handoff/` bundle + stage-specific references, not the full `design/`. Cost ceiling per workflow is enforced (§R23). The orchestrator (top-level `design` skill) coordinates but never holds all stage contexts at once.

**When to use:** All `design --full` and `design --route new-product` runs. Optional for single-atom invocations.

**Trade-offs:** Cross-host parity is hardest here (Claude subagents ≠ Codex sub-tasks ≠ Cursor sessions); sequential fallback is slower but more portable. Aggregate coexistence eval (≥0.80 with 5+ packages) must be re-verified per host.

### Pattern 6: Per-File Commit Policy + Frontmatter-Tagged Artifacts

**What:** Every canonical artifact in `design/` carries YAML frontmatter (`artifact:`, `stage:`, `generated:`, `schemaVersion:`, `sourceHash:`, `provenance:`, `owner:`, `lastReviewedAt:`). The `.gitignore` excludes rejected wireframe variants, raw transcripts, screenshots, and `.complete-design/private/`. The `.gitattributes` declares `design/*.json merge=ours` to bound merge-conflict pain.

**When to use:** Always. Repo hygiene is a HIGH-severity risk per the codex review (PII, merge conflicts, noisy diffs, bloat).

**Trade-offs:** Frontmatter adds parsing overhead (mitigated by JSON-Schema validators); requires user education in the README; but: this is the difference between "designers love it" and "designers refuse to merge our PRs."

---

## Data Flow

### Request Flow (full new-product route)

```
User invokes `design --route new-product` on a fresh repo
    ↓
design skill (top-level orchestrator)
    ↓ classify route, confirm with user
    ↓ check repo signals: PRD.md? design/ exists? branches stable?
    ↓
ingest (Stage 0)
    ↓ reads: PRD.md (or interview mode if absent)
    ↓ writes: design/PRD.md (normalized)
    ↓ writes: design/.handoff/stage-0-bundle.md
    ↓
discover (Stage 1) — subagent dispatch
    ↓ reads: design/.handoff/stage-0-bundle.md + references/garrett, cooper, torres, klement
    ↓ atoms: research/personas-proto, research/build-ost, research/synthesize
    ↓ writes: design/research/personas/*.persona.json
    ↓ writes: design/research/jobs/*.jtbd.md
    ↓ writes: design/research/findings.md, competitive.md, ost.mmd
    ↓ writes: design/ASSUMPTIONS.md (if synthetic-only or PROTO)
    ↓ run: assets/scripts/gates/stage-1.mjs → (state, grade)
    ↓ writes: .complete-design/manifest.lock entry
    ↓ writes: design/.handoff/stage-1-bundle.md
    ↓
structure (Stage 2) — subagent dispatch
    ↓ reads: design/.handoff/stage-1-bundle.md + references/rosenfeld, wodtke
    ↓ atoms: ia/sitemap-variants, ia/flows-from-jobs
    ↓ writes: design/ia/sitemap.json + flows/*.flow.mmd
    ↓ run: assets/scripts/gates/stage-2.mjs
    ↓ writes: design/.handoff/stage-2-bundle.md
    ↓
sketch (Stage 3) [v2.0b; skipped on most routes]
    ↓ atoms: lowfi/crazy-eights, lowfi/converge
    ↓ writes: design/wireframes/<screen>/v{1..8}.excalidraw + CHOICE.md
    ↓ writes: design/.handoff/stage-3-bundle.md
    ↓
interact (Stage 4) [v2.0b]
    ↓ atoms: ixd/state-catalog, ixd/pattern-variants, ixd/state-machine
    ↓ writes: design/interactions/<screen>.spec.md + .machine.ts
    ↓ writes: design/interactions/motion-tokens.json
    ↓ writes: design/.handoff/stage-4-bundle.md
    ↓
style (Stage 5a) — subagent dispatch
    ↓ atoms: hifi/variants-preview
    ↓ scripts: oklch, contrast, port-manager, playwright-runner
    ↓ user picks 1 variant
    ↓ writes: .complete-design/preview/run-<id>/ (rendered, screenshotted)
    ↓ writes: design/.handoff/stage-5a-bundle.md
    ↓
systematize (Stage 5b) — subagent dispatch
    ↓ atoms: tokens/emit, system/scaffold-component
    ↓ scripts: dtcg-lint, design-md-validate, tokens-project
    ↓ writes: design/tokens.json (DTCG)
    ↓ writes: design/DESIGN.md (Google spec)
    ↓ writes: design/components/*.tsx, design/storybook/*.stories.tsx
    ↓ run: assets/scripts/gates/stage-5b.mjs
    ↓
Final: design/MANIFEST.md updated; .complete-design/manifest.lock sealed;
       diff presented to user; --apply required to land.
```

### State Management

```
.complete-design/manifest.lock  ← append-only hash chain of every gate run
       ↑
       └── written by every gate runner; verified by `complete-design verify --golden`

design/.handoff/stage-N-bundle.md  ← compact stage-output summary
       ↑                              read by stage N+1
       └── written at end of every stage workflow

.complete-design/manual-overrides.json  ← user edits to generated artifacts
       ↑                            preserved across regen
       └── captured by Pattern 6 frontmatter `sourceHash:` mismatch

.complete-design/private/decision-log.jsonl  ← every "user picked variant X" decision
       └── never committed; rebuilds on demand
```

### Key Data Flows

1. **PRD → Stage N → Stage N+1 (linear forward):** The dominant flow. Each stage reads `.handoff/stage-(N-1)-bundle.md`, may dip into `design/` on-demand to verify a claim, writes its artifacts, runs gate, writes `.handoff/stage-N-bundle.md`. Read-only verification of upstream is allowed; mutation of upstream is forbidden in forward runs (use `audit --stage N --repair` for that).
2. **`audit --stage N --pr` (cross-stage backward):** PR contains code changes (new routes, new components). Detector reads the PR diff + `design/.handoff/stage-N-bundle.md` + relevant `design/` artifacts, emits `design/AUDIT-REPORT.md` with severity-ranked findings. Does NOT mutate `design/`.
3. **`audit --reverse-engineer` (Lovable refugee, v2.0b):** Reads existing prototype (no `design/` yet), runs static analysis + LLM inference per stage, writes inferred `design/research/`, `design/ia/`, etc. with `provenance: inferred` frontmatter. The reverse of flow #1.
4. **Atomic invocation (standalone bootstrap):** Atom is triggered by user prompt (e.g., "create a sitemap for these JTBDs"). Atom reads available `design/` artifacts; if missing, asks the minimum questions to bootstrap; writes its single artifact + runs the relevant gate atomically. Standalone atoms do NOT write `.handoff/` bundles (those are workflow responsibilities).
5. **Preview/render loop (Stage 5a, preserved from v1.0.1):** `hifi/variants-preview` spawns local dev server via `port-manager.mjs` (per stack adapter), Playwright captures screenshots, screenshots are diffed against variant-distance metric, user picks. Preview state lives in `.complete-design/preview/run-<id>/` and is reaped on next run.
6. **Gate-rerun flow:** User edits `design/` artifact by hand; `sourceHash:` mismatch detected on next workflow run; manual-overrides captured; relevant downstream gates re-run (if Stage 2 sitemap changed by hand, Stage 3+ gates may regress to needing re-evaluation).

---

## Build Order (validates MRD §10 with gaps surfaced)

The MRD proposes a 14-week roadmap. Validated and annotated:

### v1.5 — Infrastructure (weeks 1-3): VALIDATED with one addition

| Component | Why it must come first | Gap surfaced |
|-----------|------------------------|--------------|
| Versioned JSON Schemas (persona, sitemap, manifest, interaction-spec, audit-report, **handoff-bundle**) | Gates can't validate without schemas; frontmatter can't be checked without schemas; per-stage bundles need their own schema | MRD §16 lists handoff-bundle implicitly — call it out explicitly as a v1.5 deliverable |
| `references/gates/stage-{1,2,5a,5b}.md` checklists + `assets/scripts/gates/stage-{1,2,5a,5b}.mjs` runners | Without gate runners, "gate-driven" is aspirational. Stage-3 and stage-4 gates can be drafted in v1.5 but implemented in v2.0b | OK |
| Preview harness (Vite/Next/Astro adapters, port manager, Playwright readiness, security sandbox) | v1.0.1 preserved; Stage 5a depends on it | OK |
| `manifest.json` aggregator + `skillgrade` per-skill eval + aggregate coexistence eval | Trigger discipline (R15) is non-negotiable; CI must be green before v2.0a build starts | OK |
| Eval harness (`evals/`) including adversarial tests | The synthetic-persona block (R6) and fidelity-cap reject (P11) need adversarial fixtures BEFORE the workflows that they test exist — they are part of the spec, not an afterthought | OK |
| Determinism: golden tests, decision-log writer, hash-chain writer | `complete-design verify --golden` CI gate must work before v2.0a | OK |
| References for stages 0+1+2+5 (core canon) | Workflows depend on them; references for stages 3+4 deferred to v2.0b | OK |
| **NEW: `handoff-bundle-build.mjs` and `handoff-bundle.v1.json` schema** | This is the context-window survival mechanism (Pattern 3). The MRD §3.6 mentions it but §10 doesn't list it. Without it, v2.0a cannot run end-to-end. | **GAP — must be a v1.5 deliverable** |
| **NEW: Host-compatibility adapter scaffold + host-matrix CI** | Sequential fallback for Codex/Cursor is the difference between R17 met and not-met. v1.5 should produce the matrix CI even if only Claude Code host is fully passing. | **GAP — flagged for v1.5** |

### v2.0a — Skeleton (weeks 4-8): VALIDATED with one risk

Workflows: `ingest`, `discover`, `structure`, `style` (lite mode), `systematize` (lite mode), basic `audit`.

Atoms (9): `prd/parse-or-interview`, `research/synthesize`, `research/personas-proto`, `research/build-ost`, `ia/sitemap-variants`, `ia/flows-from-jobs`, `hifi/variants-preview`, `tokens/emit`, plus 1 cross-stage utility.

Gates (4 implemented): stage-1, stage-2, stage-5a, stage-5b — but `style-lite` / `systematize-lite` **do not claim** `gate/stage-5a-complete` (MRD §9.1 BLOCKER fix). Output is labeled `(state, evidence: INFERRED)`.

**Risk:** The MRD says "v2.0a delivers end-to-end value." It does, but only if the lite-mode honesty is communicated clearly to users. Otherwise users will perceive v2.0a as a "broken" Stage 5 path. Mitigation: explicit `lite-mode` warning copy in skill bodies + README.

### v2.0b — Full 5 stages (weeks 9-12): VALIDATED

Workflows (+2): `sketch`, `interact`. Plus `audit --reverse-engineer-stages` mode (moved from v2.1).

Atoms (+6): `lowfi/crazy-eights`, `lowfi/converge`, `ixd/state-machine`, `ixd/pattern-variants`, `ixd/state-catalog`, `system/scaffold-component`.

Renderers: Excalidraw static-HTML viewer, Mermaid → SVG, XState v5 code emitter.

Gates (+2): stage-3, stage-4. Full `gate/stage-5a-complete` now claimable.

References (+12): stage-3 and stage-4 canon.

### v2.0 RC (week 13) + GA (week 14): VALIDATED

- Cross-host smoke
- Two-designer + two-PM blind reviews per success metrics §11
- Coexistence eval ≥0.80 with 5+ other packages installed
- Launch artifact ready per §7.2 (post + 90s video + tertiary hook + 8 marketplace cross-posts + PR to anthropics/skills#1008)

### Build-Order Dependency Graph

```
Schemas ──────────────────────┐
                              ↓
References (stages 0+1+2+5) ──┼─→ Gate runners (stages 1,2,5a,5b)
                              │                ↓
Preview harness ──────────────┤        Eval harness (adversarial + golden)
(port-manager, Playwright,    │                ↓
 security-sandbox)            │        Workflows (v2.0a: ingest/discover/structure
                              │        /style-lite/systematize-lite/audit-basic)
Handoff-bundle script ────────┘                ↓
                                       Atoms (9 for v2.0a)
                                                ↓
                                       Host-compatibility matrix CI
                                                ↓
                                       v2.0a RELEASE
                                                ↓
References (stages 3+4) ──────────────────────┐
                                              ↓
Excalidraw/Mermaid/XState renderers ─────────→ Gate runners (stages 3,4)
                                                ↓
                                       Workflows (sketch, interact)
                                                ↓
                                       Atoms (+6 for v2.0b)
                                                ↓
                                       audit --reverse-engineer
                                                ↓
                                       v2.0b RELEASE
                                                ↓
                                       Cross-host smoke + designer/PM reviews
                                                ↓
                                       v2.0 GA + launch artifact
```

---

## Scaling Considerations

This is a SKILL.md package, not a SaaS. "Scaling" here means: scaling across project sizes, across users, and across host ecosystems.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Solo indie, 1 repo, 1 PRD** | v2.0a out-of-box. `--depth lightweight` mode (~60min). Handoff bundles compact enough that the whole 5-stage run fits in a single Claude Code session. |
| **Series-B team, 1 monorepo, 5 apps with separate design/** | Per-app `design/` directories (preserved from v1.0.1 §3.20). Each app gets its own `.handoff/`, its own manifest.lock. `audit --new-feature --app=<name>` scopes to one app's contract. |
| **OSS install base 30k → 150k users** | Coexistence eval (≥0.80 with 5+ packages) is the critical scaling metric — not server load, not LLM cost (user pays). Aggregate `manifest.json` size must stay under Codex 2% cap; split into core (workflows) + companion (atoms) if pressure rises per R14 mitigation. |
| **Series-B regulated industry (year-2+ enterprise SKU)** | Audit dashboard sibling product reads `.complete-design/manifest.lock` chains across many repos. Out of scope for v2.0; architectural seam preserved (hash chain is append-only, audit-report schema is versioned). |

### Scaling Priorities

1. **First bottleneck — context-window survival on full 5-stage run.** Mitigation: handoff bundles (Pattern 3). Already designed; needs eval evidence (per-bundle fidelity test).
2. **Second bottleneck — trigger collision when 5+ skill packages are installed.** Mitigation: per-skill ≤200 char description discipline + aggregate coexistence eval. Already a CI metric; regression = release blocker.
3. **Third bottleneck — `design/` directory bloat in long-lived projects.** Mitigation: per-file commit policy + `.gitignore` rules for rejected variants/transcripts/screenshots + schema versioning. Already designed in §3.6; needs explicit migration runner script when `schemaVersion` bumps.
4. **Fourth bottleneck — cross-host parity (Claude Code vs Codex vs Cursor subagent dispatch).** Mitigation: matrix CI + sequential-fallback adapters. Hardest engineering problem; v1.5 must produce a working scaffold even if Codex/Cursor parity is incomplete at v2.0a.

---

## Anti-Patterns

### Anti-Pattern 1: LLM Emits Final Artifacts

**What people do:** Skill body asks LLM to "generate the tokens.json" or "write the DTCG file" inline.

**Why it's wrong:** LLM-generated JSON drifts run-to-run, fails determinism golden tests, fails cross-host parity, can't be schema-validated without a separate pass, can't be `--golden`-verified. Breaks P6.

**Do this instead:** LLM emits *decisions* (variant pick, scale choice, palette anchor). Skill body invokes `assets/scripts/tokens-project.mjs` via Bash; the script emits validated DTCG JSON.

### Anti-Pattern 2: "Read All Upstream Artifacts" Stage Workflow

**What people do:** Stage 5 workflow body says "read design/research/, design/ia/, design/wireframes/, design/interactions/, then synthesize."

**Why it's wrong:** Blows past context window by Stage 3+ on real projects. Was the v1.0 → v1.0.1 → v2.0 critique that triggered handoff bundles. MRD §3.6 explicitly addresses this.

**Do this instead:** Read `design/.handoff/stage-(N-1)-bundle.md` only. Verify specific claims by dipping into raw files on-demand. Bundle quality is the new responsibility.

### Anti-Pattern 3: Synthetic Personas Marked as VALIDATED

**What people do:** LLM generates personas without primary research; gate returns `(PASS, VALIDATED)`.

**Why it's wrong:** Violates the NN/g 2024 / ACM Interactions 2026 synthetic-persona red line (R6, P12). Erodes designer trust — the single most important moat. Adversarial test in `evals/adversarial/` will fail.

**Do this instead:** Gate enforces: synthetic-only data → grade is `PROTO`, never `VALIDATED`. `ASSUMPTIONS.md` is the gating artifact. Mixed data grades the validated subset only.

### Anti-Pattern 4: Stage 5 Generates Hi-Fi Without Stage 4 State-Maps

**What people do:** User runs `--skip-to style` or v2.0a runs Stage 5a without Stage 4 work; skill emits hi-fi components.

**Why it's wrong:** Buxton discipline violation (P11). The whole positioning is "every other tool does this; we don't."

**Do this instead:** In v2.0a, label output as `style-lite` / `evidence: INFERRED`; do NOT claim `gate/stage-5a-complete`. In v2.0b, refuse to render hi-fi for components with empty `design/interactions/`; require explicit `--lite-mode` flag or fail with a clear message.

### Anti-Pattern 5: Workflow Mutates Upstream Stage Artifacts

**What people do:** Stage 4 workflow notices a sitemap gap and rewrites `design/ia/sitemap.json` mid-run.

**Why it's wrong:** Breaks the "stages are linear forward" contract; corrupts upstream gate state; invalidates `sourceHash:` for many downstream artifacts; surprise-edits are exactly what the manual-override capture flow was designed to prevent.

**Do this instead:** Stage N can only WRITE stage-N artifacts. Detected upstream gaps surface as findings in the gate output (`PASS_WITH_WARNINGS`) and route the user to `audit --stage 2 --repair`.

### Anti-Pattern 6: Vector DB / Knowledge Graph for `references/`

**What people do:** "Wouldn't it be faster to embed all references and query semantically?"

**Why it's wrong:** R12 explicitly rules this out for v2. Adds a runtime dependency users can't satisfy in a SKILL.md install; embedding-drift breaks reproducibility; LLM context can already load relevant references via Read. The corpus is small (~30 references).

**Do this instead:** Stage-organized Markdown corpus; skills load specific references by path; on-demand retrieval via `Read`.

### Anti-Pattern 7: One Mega-Workflow for the Whole 5-Stage Run

**What people do:** Single SKILL.md body runs all 5 stages in one LLM turn.

**Why it's wrong:** Context window dies, trigger description blows out the 200-char budget, gate failures can't be isolated, user can't interrupt-and-resume per R25.

**Do this instead:** Top-level `design` skill orchestrates; each stage is its own skill; subagent dispatch (Claude Code host-first); sequential fallback (Codex/Cursor). Pattern 5.

### Anti-Pattern 8: Commit Everything in `design/` By Default

**What people do:** `design/` written; user does `git add design/` and commits 80MB of Excalidraw variants + transcripts + screenshots.

**Why it's wrong:** Repo bloat; PII leakage (transcripts); merge conflicts; designers refuse to PR-review. MRD §3.6 governance addresses this; the codex review flagged it as HIGH.

**Do this instead:** Ship `.gitignore` and `.gitattributes` as part of `ingest`. Rejected wireframe variants gitignored. Raw transcripts gitignored. Screenshots in `.complete-design/private/`. Per-file commit policy enforced via a `complete-design check-hygiene` script.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Playwright** | Local install via npx; controlled by `assets/scripts/playwright-runner.mjs`; readiness probe + screenshot capture | Preserved from v1.0.1; deterministic via fixed viewport + frozen clock |
| **Vite / Next / Astro dev-server** | Per-stack adapter spawns dev-server in `.complete-design/preview/run-<id>/`; port allocated by `port-manager.mjs` | v1.0.1 preserved; stack detected by repo signals |
| **Excalidraw renderer (v2.0b)** | Static HTML page with embedded Excalidraw library + JSON; served by preview harness | No live editing in MVP; designer opens locally in editor |
| **Mermaid renderer** | `mermaid-cli` invoked via Bash; SVG output | Used at Stage 2 (flowcharts), Stage 4 (state diagrams) |
| **XState v5 (v2.0b)** | `state-machine-emit.mjs` generates TypeScript machine definitions; LLM picks pattern, script emits code | Only required for components with async + ≥3 states + conditional transitions |
| **Optimal Workshop (v2.1)** | CSV import of tree-test results into `design/ia/tree-test.csv` | Export-only integration; no API call from package |
| **Dovetail / Notably (v2.2)** | Transcript ingestion; PII guards | Local Markdown only in v2.0 MVP |
| **Notion / Linear / Google Docs (v2.1)** | PRD URL ingestion via MCP / API | Notion MCP scope: Gaia Logic projects only per CLAUDE.md user instruction; user-config gate for non-Gaia |
| **Storybook MCP / Chromatic (v2.1+)** | Component manifest publish from `design/components/` and `design/storybook/` | Deferred to v2.1+ |
| **`skills.sh` + 7 other marketplaces** | Cross-post manifest from §7.3; pure metadata — no runtime dependency | GTM-time, not runtime |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Workflow ↔ Atom | Workflow `Bash`-invokes atom via skill name; atom reads `design/` for bootstrap | Stitched-context (Pattern 5); atom standalone-capable |
| Skill ↔ `assets/scripts/` | `Bash node assets/scripts/<name>.mjs ...` | Pure scripts (no LLM); deterministic |
| Skill ↔ `references/` | `Read references/<path>` on-demand | No vector DB; stage-scoped + canon-scoped indexes |
| Skill ↔ `design/` | `Read` for upstream context (via handoff bundle preferentially); `Write` for own-stage artifacts only | Anti-Pattern 5 forbids upstream mutation |
| Skill ↔ `.complete-design/manifest.lock` | Append-only via `assets/scripts/gates/*.mjs` | Hash chain verified by `complete-design verify --golden` |
| Gate runner ↔ Workflow | Workflow `Bash`-invokes gate; gate emits `(state, grade)` JSON; workflow renders terminal state | Pattern 4 |
| Stage N ↔ Stage N+1 | Via `design/.handoff/stage-N-bundle.md` (compact) + on-demand `design/` reads | Pattern 3 |
| Package ↔ Host (Claude Code) | SKILL.md trigger description; host invokes; subagent dispatch native | Primary host (R17) |
| Package ↔ Host (Codex CLI) | Sequential sub-task fallback; same artifacts | R17 fallback; matrix CI |
| Package ↔ Host (Cursor) | Session-bounded sequential fallback | R17 fallback; matrix CI |

---

## Architectural Risks (concrete failure modes)

### Risk 1: Context-window blowout on full `design --route new-product` (HIGH)

**Failure mode:** Stage 4 or Stage 5 workflow reads handoff bundle that is too summarized; LLM misses a critical persona need or interaction state; downstream artifact regresses. OR: handoff bundle is too verbose; context fills before the stage completes.

**Why it happens:** Bundle quality has no eval yet. The 5-15k token target is aspirational. Bundle is auto-generated by a script; the script's heuristics for "what does the next stage need" are unverified.

**Detection:** Add `evals/bundles/per-stage-fidelity.test.mjs` — round-trip test: generate bundle, run downstream stage from bundle only vs from raw artifacts, compare gate outcomes.

**Prevention:** Treat handoff bundle as a first-class artifact with its own schema (`handoff-bundle.v1.json`), its own eval, and its own quality metric in §11. Already flagged as a v1.5 gap above.

### Risk 2: Evidence-grade gate logic ambiguity (HIGH)

**Failure mode:** User runs Stage 1 with 1 real interview + 4 synthetic personas; gate returns `(PASS_WITH_WARNINGS, PROTO_PASS_WITH_WARNINGS)`. The compound state is documented in MRD §3.22 but not in a single source of truth; gate runner implementations may diverge.

**Why it happens:** Two-dimensional state space (4 terminal × 4 evidence = 16 combinations) plus the special "PROTO_PASS_WITH_WARNINGS" hybrid for mixed data is non-trivial. Different gates (stage-1 vs stage-5b) may evolve different conventions.

**Detection:** Adversarial test suite per gate covering all 16 combinations. Cross-gate state-propagation test: Stage 1 returns `PROTO`, Stage 2 should not return `VALIDATED` without new real evidence.

**Prevention:** Single canonical `gate-runner.mjs` base that all stage gates extend. State table as a versioned JSON document referenced by every gate. Eval per gate per combination.

### Risk 3: `design/` directory hygiene at scale (HIGH)

**Failure mode:** 6 months into a project, `design/` has 200+ files, schemas have bumped from v1 to v2, half the personas are stale, transcripts leaked into git via a misconfigured `.gitignore`.

**Why it happens:** No migration tooling. No staleness detection. No PII scanner. The governance rules in §3.6 are documented but not enforced by scripts.

**Detection:** `complete-design check-hygiene` script (must be a v1.5 deliverable) + CI hook + `audit --hygiene` mode.

**Prevention:**
- Schema migration runner: `complete-design migrate --from v1 --to v2`.
- PII scanner over `design/research/` (regex + LLM-assisted) at `ingest` time.
- Staleness check: `lastReviewedAt` > 90 days → warning at next `audit` run.
- `.gitignore` and `.gitattributes` written by `ingest` workflow with idempotent merge.

### Risk 4: Schema versioning + migration (HIGH)

**Failure mode:** v2.1 changes `sitemap.json` schema (e.g., adds card-sort metadata fields); existing `design/` from v2.0 users breaks; migration is manual.

**Why it happens:** Versioned schemas (R24) cover the format, not the migration path. Frontmatter has `schemaVersion:` but no automatic upgrader.

**Detection:** Set up schema-version compatibility matrix as a CI test from v1.5.

**Prevention:**
- Every schema bump ships with a `migrations/v(N) → v(N+1).mjs` script.
- `complete-design migrate` runs the chain.
- `manifest.json` records the package version that generated each artifact; mismatch triggers migration prompt.

### Risk 5: Cross-host subagent dispatch divergence (HIGH)

**Failure mode:** v2.0a works on Claude Code; Codex CLI runs the workflows but sequential sub-tasks lose context between stages; Cursor session boundaries break handoff bundle continuity.

**Why it happens:** Sequential fallback is fundamentally different from Claude Code's parallel subagent dispatch. The handoff bundle bridges the gap but the gate runner outputs (manifest.lock writes) may race or duplicate across hosts.

**Detection:** Matrix CI runs the 15-run end-to-end fixture suite on all three hosts.

**Prevention:**
- Workflow bodies are deterministic-by-construction (no implicit parallelism in skill instructions).
- Manifest.lock writes go through a single script that file-locks.
- Coexistence eval baseline established on each host independently before declaring R17 met.

### Risk 6: Stage-3 (Sketch) low quality from LLM Crazy-8s (MEDIUM)

**Failure mode:** LLM generates 8 Excalidraw wireframes; 3 are decent, 5 are near-clones. Convergence is trivial because diversity is fake. v2.0b ships, designers reject.

**Why it happens:** Crazy 8s is human ideation discipline; LLMs default to safe variants.

**Detection:** Stage-3 diversity eval (separate from v1.0.1's 6-axis visual-style metric — this is a *structural* metric: layout placement, grouping, hierarchy).

**Prevention:** Codex review flagged this. §3.22 gate clarified — "≥3 alternatives" enforced via structural diversity check. Reject low-diversity batches and regenerate with explicit "try fundamentally different approaches" prompt.

### Risk 7: XState as primary IxD artifact alienates designers (MEDIUM — already mitigated)

**Failure mode:** Stage 4 outputs only XState v5 machines; designers can't read them; package perceived as engineering tool.

**Why it happens:** Original v2.0 draft had this; codex caught it.

**Mitigation (already in MRD):** Mermaid stateDiagram-v2 is the canonical designer-readable artifact. XState only required when async + ≥3 states + conditional transitions. Validated in §3.22 / §9.2.

### Risk 8: Trigger description coexistence regression (MEDIUM)

**Failure mode:** User installs complete-design + 5 other popular skill packages; some complete-design triggers no longer fire because aggregate description metadata exceeds Codex 2% cap or competing skills' descriptions match user prompts better.

**Detection:** Aggregate coexistence eval per §11 (NEW metric).

**Prevention:** Per-skill description budget (≤200 chars) + per-skill should-not-fire prompts + aggregate corpus eval gating release. If pressure rises: split into core + companion packages (R14 mitigation).

### Risk 9: Partial-output recovery breaks downstream (MEDIUM)

**Failure mode:** User runs `design`, interrupts after Stage 2, edits `design/ia/sitemap.json` by hand, re-runs from Stage 3. Stage 3 reads stale `design/.handoff/stage-2-bundle.md`; downstream gates regress silently.

**Why it happens:** Handoff bundles cache. Manual edit of upstream invalidates the bundle.

**Detection:** `sourceHash:` frontmatter on every artifact + bundle hash dependency tracking + R25 scripted-test pass.

**Prevention:**
- Every bundle records the hashes of artifacts it summarized.
- On stage-N start, verify hashes; if mismatched, rebuild the bundle from raw artifacts before proceeding.
- Manual-override capture flow (preserved from v1.0.1) records the user edit explicitly.

### Risk 10: Synthetic-persona policy + indie frustration (MEDIUM — already mitigated)

**Failure mode:** Indie dev with no users runs Stage 1; gate blocks `VALIDATED`; user thinks the package is broken.

**Mitigation (already in MRD):** `--proto-mode` flag is permitted; gate returns `(PASS, PROTO)` not `(FAILED, *)`; `ASSUMPTIONS.md` is the explicit honest path forward. Clear messaging required in workflow body + README.

### Risk 11: Audit cross-stage detector quality (MEDIUM)

**Failure mode:** `audit --stage 2 --pr` misses a real sitemap drift (false negative) or flags benign route renames (false positive).

**Why it happens:** Detector logic per §6 is specified but not yet implemented; quality depends on heuristics + LLM judgment.

**Detection:** Per-stage adversarial fixture suite for `audit` (planted regressions, planted false-flags).

**Prevention:** Per-stage detector has its own should-flag / should-not-flag eval set in `evals/audit/<stage>/`. CI-gated.

### Risk 12: Lovable refugee reverse-engineering fidelity (MEDIUM-HIGH)

**Failure mode:** `audit --reverse-engineer-stages` infers personas / IA / state-maps from an existing Lovable prototype; inferred artifacts are plausible but wrong; user trusts them; downstream stages compound the error.

**Why it happens:** Reverse-inference is fundamentally lossy. The prototype contains visual + structural signals but no underlying *why*.

**Detection:** All reverse-engineered artifacts must carry `provenance: inferred` (which propagates to all downstream gates as `INFERRED` grade). Adversarial test: feed known prototype with known PRD; compare inferred personas to actual personas; require human-graded plausibility ≥ baseline.

**Prevention:**
- Loud "this is INFERRED — validate before treating as ground truth" messaging.
- v2.0b feature; tested in v2.0b adversarial suite.
- `audit --reverse-engineer` output always paired with assumptions to validate.

---

## Sources

- `/Users/pilawski/My_projects/skillsos/Design Docs Frontend/complete-design-mrd-v2.md` — §3.5 spine, §3.6 directory + governance, §3.7 workflows, §3.8 atoms, §3.9 composition contract, §3.10 references, §3.11-3.21 preserved infra, §3.22 gates, §3.23 fidelity caps, §9 MVP scope, §10 roadmap, §12 risks, §16 codex acceptance record
- `/Users/pilawski/My_projects/skillsos/Design Docs Frontend/.planning/PROJECT.md` — R1-R26 requirements + key decisions
- agentskills.io v1 spec (stabilized 2025-12-18) — SKILL.md frontmatter contract, four-tier reference hierarchy, host compatibility
- W3C DTCG v2025.10 (Oct 2025) — token schema canon
- Google DESIGN.md spec (April 2026) — Stage 5 contract format
- Garrett, *Elements of UX*, 2nd ed. (2011) — spine canon
- v1.0.1 preserved patterns: preview-first workflow, variant-distance metric, decision log, hash chain, manual-override capture, security sandbox, port manager, host compatibility, monorepo design, trigger discipline

---
*Architecture research for: complete-design SKILL.md package (agent-host design-process facilitator)*
*Researched: 2026-05-24*
