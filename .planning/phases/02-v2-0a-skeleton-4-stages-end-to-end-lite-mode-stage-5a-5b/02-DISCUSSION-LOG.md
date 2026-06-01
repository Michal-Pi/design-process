# Phase 2: v2.0a — Discussion Log (auto-mode)

**Gathered:** 2026-05-25
**Mode:** `--auto` — recommended choices selected for all gray areas; user can override before `/gsd-plan-phase 2`.

---

## Workflow Body Authoring Style

**Question:** How should Phase 2 workflows and atoms be encoded? Options range from full prose skill bodies to structured frontmatter-driven spec files, to a hybrid approach.

**Options presented:**
- Option A — **Structured-frontmatter + numbered-procedure prose body (SKILL.md)** — standard agentskills.io v1 format; frontmatter declares stage/gate/artifact surfaces; body is sequential numbered Markdown steps.
- Option B — **Pure prose skill bodies** — body describes the workflow in narrative form with no step numbers; LLM exercises judgment on sequencing.
- Option C — **Structured frontmatter only; procedure encoded as a separate JSON spec file** — workflow body is minimal; all logic lives in a machine-readable spec file loaded at runtime.

**Auto-selected:** Option A — Structured-frontmatter + numbered-procedure prose body.

**Rationale:** Phase 1 already ships three SKILL.md skeletons (`skills/design.md`, `skills/audit.md`, `skills/handoff.md`) using exactly this pattern (Phase 1 Plan 04); the agentskills.io v1 spec mandates YAML frontmatter + Markdown body; Option B loses determinism of step ordering; Option C would require a new spec format not in the MRD. MRD §3.7/§3.8 describe all workflows in numbered-step format.

---

## Sub-Agent Dispatch Shape

**Question:** When the top-level `design` skill orchestrates a multi-stage run, should it spawn one sub-agent per stage, one sub-agent per atom, or a single monolithic "design sub-agent" that runs all stages?

**Options presented:**
- Option A — **One sub-agent per stage workflow** — each stage (ingest, discover, structure, style-lite, systematize-lite) runs as its own bounded sub-agent via `run-subagent.mjs`; atoms are inline steps within the stage sub-agent.
- Option B — **One sub-agent per atom** — finer granularity; each atom invocation spawns its own sub-agent.
- Option C — **Single monolithic sub-agent** — all stages run in one LLM turn; no sub-agent dispatch.

**Auto-selected:** Option A — one sub-agent per stage.

**Rationale:** Anti-Pattern 7 (ARCHITECTURE.md) explicitly names Option C as the failure mode ("context window dies, trigger description blows out"). Option B multiplies handoff overhead and breaks the stitched-context contract (ARCHITECTURE.md Pattern 5, MRD §3.9). Phase 1 `run-subagent.mjs` (Plan 05) implements the one-per-stage shape with Claude Code host-first + sequential Codex/Cursor fallback; Phase 2 uses it as-is.

---

## PRD Parse vs Interview-Mode Decision Tree

**Question:** Under what conditions should the `ingest` workflow parse an existing PRD file vs. launch the Lenny 1-pager interview mode?

**Options presented:**
- Option A — **Auto-detect via Phase 1 routing registry; fall back to interview if PRD absent or effectively empty (<50 tokens of structured content)** — transparent to user; produces a 3-line summary of what was found.
- Option B — **Always prompt the user first ("Do you have a PRD or should I interview you?")** — explicit user choice every time; slightly more friction.
- Option C — **Always require an explicit `--prd <path>` flag; interview mode only via `--interview` flag; no auto-detection** — maximum explicitness; breaks the "start a session and complete-design figures it out" UX.

**Auto-selected:** Option A — auto-detect with fallback.

**Rationale:** TRUST-05 requires a 3-5 question intake but not a redundant "do you have a PRD?" question when one is detectable. Phase 1 `registry.mjs` already has stack-detection heuristics; extending it to detect `PRD*.md` is trivial. MRD §3.7 W0 procedure starts with "Detect existing PRD" before "Launch interview if absent." Option C creates friction for the PM-with-existing-PRD persona who is one of the three primary segments (MRD §2.3).

---

## Persona Generation Engine and Synthetic-Persona Red Line Enforcement

**Question:** How should the `research/personas-proto` atom generate proto-personas, and how is the red line that blocks `VALIDATED` grade enforced beyond the Stage 1 gate?

**Options presented:**
- Option A — **LLM generates using Indi Young thinking-style prompt template loaded from `references/indi-young-thinking-styles.md`; enforcement is a script (`gate-stage-1.mjs`) that reads frontmatter `provenance:` field and refuses `evidence: VALIDATED` deterministically; `worstProvenance` propagated by `frontmatter-validate.mjs`** — script-enforced, not LLM-honor-system.
- Option B — **LLM generates personas AND grades them (LLM is trusted to self-apply the red line rule)** — simpler implementation; no separate gate logic needed.
- Option C — **LLM generates personas; a secondary LLM review call judges whether they are synthetic or validated** — adds an AI-based verification layer.

**Auto-selected:** Option A — script enforcement only.

**Rationale:** Options B and C both rely on LLM judgment for a rule the MRD explicitly calls out as requiring deterministic enforcement (ARCHITECTURE.md Anti-Pattern 3, Pitfall 2, RED-01, RED-05, RED-06). LLMs are sycophantic — the NN/g 2024 and ACM Interactions 2026 papers are precisely the literature complete-design honors. Phase 1 Plan 02 already ships `gate-stage-1.mjs` skeleton with the provenance-check shape. Option A is the only path consistent with MRD §3.22 + the adversarial CI requirement (100/100 block rate for RED-05).

---

## Sitemap + Mermaid Flow Generation

**Question:** How does the `structure` workflow walk PRD/persona/discover artifacts to emit `sitemap.json` and Mermaid flow diagrams?

**Options presented:**
- Option A — **Stage 1 handoff bundle only as primary input; LLM generates 2-5 LATCH-diverse sitemap variants; `ia/flows-from-jobs` atom generates one Mermaid flowchart per JTBD; all validated by `mermaid-render.mjs` determinism path from Phase 1** — bounded context via handoff bundle; diversity enforced via extended `variant-distance.mjs`.
- Option B — **Read raw `design/research/` directory in Stage 2 workflow** — more context for the LLM; higher quality potential.
- Option C — **Single sitemap generated (no variants); one consolidated flow covering all JTBDs** — simpler; faster; less discipline.

**Auto-selected:** Option A — handoff bundle only + LATCH-diverse variants.

**Rationale:** Option B is Anti-Pattern 2 (ARCHITECTURE.md) — "read all upstream artifacts" blows past the context budget at scale. Option C eliminates the sitemap-variants differentiator and the LATCH-diversity enforcement required by ATOM-05, WF-03, and MVPA-02. Phase 1 handoff bundle schema (`handoff-bundle.v1.json`) is designed to carry exactly the Stage 1 context a Stage 2 run needs. The `mermaid-render.mjs` determinism path from Phase 1 Plan 03 is the canonical render.

---

## Style-Lite Token Scaffolding

**Question:** How should DTCG primitive/semantic/component tiers be emitted from a Next 15 + Tailwind v4 + shadcn fixture, what makes them "provisional," and what OKLCH defaults apply?

**Options presented:**
- Option A — **`tokens/emit` atom detects the user's existing `@theme` block / Tailwind config; extracts primitives; LLM picks scale choices; `tokens-project.mjs` script emits validated DTCG v2025.10 JSON; output labeled `stage: 5a-lite, evidence: INFERRED`; OKLCH defaults generated by `oklch.mjs` when no palette detected** — deterministic emit via script; honest labeling.
- Option B — **LLM emits DTCG JSON directly in the workflow body, bypassing `tokens-project.mjs`** — faster to implement; non-deterministic.
- Option C — **Reuse the user's existing `tailwind.config.css` as-is; only emit a DESIGN.md without touching tokens** — lowest risk; skips the DTCG emit entirely.

**Auto-selected:** Option A — script-emit via `tokens-project.mjs` + LLM picks.

**Rationale:** Option B is Anti-Pattern 1 (ARCHITECTURE.md) — LLM emitting JSON directly breaks "LLM picks, scripts emit" and fails the `verify-golden` CI gate (Phase 1 Plan 03). Option C fails MVPA-01/MVPA-07 (DTCG + 3 adapters required in v2.0a). `oklch.mjs` and `contrast.mjs` already ship in Phase 1; `tokens-project.mjs` is a Phase 2 extension of the same deterministic-emit pattern. ADAPT-01, ADAPT-03, COST-05.

---

## Systematize-Lite Component Promotion

**Question:** What minimum signal qualifies a component for "promotion" in lite mode, without the Frost ≥3× recurrence enforcement that is deferred to Phase 3?

**Options presented:**
- Option A — **Any component appearing ≥1× in Stage 5a output artifacts is a promotion candidate; gate records the count; outputs carry `evidence: INFERRED` + a note: "Frost ≥3× not yet verified (requires Phase 3 Stage 4 artifacts)"** — honest placeholder; users see the caveat clearly.
- Option B — **Use a fixed threshold of ≥2× occurrences in Stage 5a output as a Phase 2 proxy for the Frost rule** — closer to the Frost rule than Option A; still deferred from full enforcement.
- Option C — **Do not promote any components in v2.0a; `systematize-lite` emits only tokens + DESIGN.md** — simplest; avoids a misleading promotion count; focuses on the token/DESIGN.md deliverable.

**Auto-selected:** Option A — ≥1× appearance with explicit `evidence: INFERRED` caveat.

**Rationale:** Option C loses the `systematize-lite` / component-promotion signal entirely, reducing the value of the `new-feature` and `brand-refresh` routes. Option B implies a ≥2× proxy threshold that has no canonical basis — worse than an honest "not yet enforced." Option A is honest per MVPA-04 (`systematize-lite` labeled `evidence: INFERRED`), consistent with the P12 trust posture, and sets up Phase 3 to simply flip the threshold to ≥3× as a gate upgrade. FID-06 deferred explicitly to Phase 3.

---

## Audit `--pr` Mechanics

**Question:** How should `audit --pr` walk PR diffs, what slop-tells fire, and what is the severity-ranking algorithm?

**Options presented:**
- Option A — **`git diff --name-only HEAD~1` (or `$GITHUB_BASE_REF`) enumerates changed files; each file routed to the Stage 5a or 5b detector in `assets/scripts/audit/`; only the latest available handoff bundle is loaded for context (not raw upstream artifacts); severity ranked BLOCKER > ERROR > WARNING > INFO; slop-tells include rainbow gradients, Inter-default, glass-stack, three-column-grid, `linear-gradient(3+ stops)`, `font-family: Inter` without a custom variable** — bounded cost; deterministic detectors.
- Option B — **LLM reviews the full PR diff and `design/` directory to identify issues** — higher coverage potential; non-deterministic; expensive.
- Option C — **Only check token-scope violations (e.g., raw hex values bypassing DTCG tokens); no slop-tell detection in `audit --pr`** — minimal; doesn't meet AUDIT-03 requirement.

**Auto-selected:** Option A — script-based diff walker with deterministic detectors.

**Rationale:** Option B is non-deterministic, violates Pattern 1 ("LLM picks, scripts emit"), and would blow the `PR-audit` route budget of ≤15k tokens (COST-09). Option C fails AUDIT-03 (slop-tells required). Option A bounds token cost via handoff bundle (not raw directory ingestion per Anti-Pattern 2) and uses the deterministic linter pattern established in Phase 1's `lint-determinism.mjs` and `slop-tells/heuristics.md`. AUDIT-05, AUDIT-08, MRD §6.

---

## Audit Report Format

**Question:** How should the `AUDIT-REPORT.md` finding ID schema, fix-recipe shape, and suppression file be structured?

**Options presented:**
- Option A — **Finding ID: `<stage>-<type>-<seq>` (e.g., `5a-slop-001`); fix-recipe: `{ title, evidence, severity: 'BLOCKER'|'ERROR'|'WARNING'|'INFO', fixRecipe, suppressWith }`; suppression: `.complete-design/audit-suppressions.json` with `{ findingId, reason, suppressedAt, suppressedBy }`; output validated against Phase 1 `schemas/dist/audit-report.v1.json`** — versioned schema already shipped; consistent with Phase 1 gate result shape.
- Option B — **Custom YAML report format with free-form notes per finding; no schema validation** — flexible; harder to parse programmatically.
- Option C — **GitHub annotations format (inline PR comments) as the primary report surface** — better UX in GitHub; loses the local `AUDIT-REPORT.md` artifact that other tools (e.g., CI, manifest reconciler) depend on.

**Auto-selected:** Option A — Phase 1 `audit-report.v1.json` schema + finding ID + suppression file.

**Rationale:** Phase 1 Plan 01 already ships `schemas/dist/audit-report.v1.json`; using it ensures Phase 2 audit output is schema-validated from day one (AUDIT-08). The `findingId` + severity + suppression pattern maps directly to MRD §6's "structured findings with findingId, severity, evidence pointer, stage origin, fix recipe, and suppression option." Option B loses machine-readability needed by CI mode. Option C can be added as an optional `--comment` flag (noted for Phase 4 launch) but the base report is Markdown + YAML in the repo.

---

## Adapter Detection Heuristic

**Question:** How should the workflow detect the user's stack (Next 15 + Tailwind v4 + shadcn) vs. requiring explicit declaration? What falls back for non-matching repos?

**Options presented:**
- Option A — **Use Phase 1 `registry.mjs` heuristics (detect Next.js via `next.config.*`, Tailwind v4 via `@import "tailwindcss"` or `@theme` in CSS, shadcn via `components/ui/`); if detected, use the matching adapter; if not, fall back to plain-CSS adapter without error; `--adapter <name>` flag overrides detection** — automatic with fallback; uses existing Phase 1 machinery.
- Option B — **Require explicit `--adapter <name>` on every run; no auto-detection** — maximally explicit; breaks UX for the primary fixture target (Next 15 + Tailwind v4 + shadcn).
- Option C — **Detect stack once during `ingest` and write detected adapter to `.complete-design/config.json`; subsequent stages read that config** — caches the detection; adds a config-file maintenance burden.

**Auto-selected:** Option A — Phase 1 registry heuristics with plain-CSS fallback.

**Rationale:** Option B defeats the "inside the user's repo, no second tool" positioning. Option C introduces a stateful config file that could drift from reality. Option A reuses Phase 1 `registry.mjs` (Plan 05) which already performs exactly these heuristics for routing; extending it to adapter selection is minimal work. ADAPT-01, ADAPT-03, MVPA-07, MRD §3.15.

---

## Cost Gate Enforcement

**Question:** Where should per-stage token-budget checks fire — as hard caps before the stage starts, as soft warnings mid-stage, or only as post-hoc measurements in CI?

**Options presented:**
- Option A — **Soft warn at p50 target during run; hard-stop with user `--continue-anyway` prompt at 2× p50; post-hoc measurement recorded in run-log for CI eval** — user is in control; CI measures actuals; no silent truncation.
- Option B — **Hard cap at p50 target; stage fails if budget exceeded; no user override** — strict; may break real PRDs that legitimately need more tokens.
- Option C — **Only post-hoc measurement in CI; no in-run gates** — CI-only; no user feedback during a run; user discovers budget overrun in the next CI run.

**Auto-selected:** Option A — soft warn + hard stop at 2× p50 + post-hoc CI measurement.

**Rationale:** Option B would fail real-world use cases (a messy 40k-token PRD legitimately requires more Stage 0 context). Option C gives no in-run signal — users discover budget issues only in CI. Option A matches the Pitfall 7 mitigation strategy exactly: "hard cost ceiling: workflow asks user before exceeding stage budget by >20%; user can override with explicit confirmation, logged." The `tiktoken` encoder from Phase 1 Plan 02 is already integrated in `handoff-bundle-build.mjs`; extending it to stage-level budget tracking is incremental. COST-01/02/05/06/08/09, MRD §11 Success Criterion 3.

---

## Adversarial CI Fixture Set

**Question:** How should the RED-01..06 adversarial test suites be structured, and what exactly constitutes a "pass" for each?

**Options presented:**
- Option A — **Three focused suites in `evals/adversarial/`: (1) RED-05: 100 prompts feeding Stage 1 with synthetic-only data, assert 100% `{kind: 'pass_with_warnings', evidence: 'proto'}` from `gate-stage-1.mjs`; (2) RED-06: ≥10 injection-canary prompts explicitly asking LLM to label personas `VALIDATED`, assert 100% gate refusal; (3) `worstProvenance` propagation: Stage 1 run with mixed personas, assert all downstream artifact frontmatter carries `worstProvenance: generated` on synthetic-citing fields** — each suite maps to a specific failure mode; all deterministic at the gate script level.
- Option B — **Single combined adversarial run that exercises all red-line cases in sequence** — simpler to maintain; harder to diagnose individual failure modes.
- Option C — **Ad-hoc manual testing only; no automated adversarial CI suite in Phase 2** — defer to Phase 4 acceptance.

**Auto-selected:** Option A — three separate suites with 100% pass assertions.

**Rationale:** Phase 2 ROADMAP Success Criterion 2 explicitly requires: "Stage 1 gate hard-blocks `evidence: VALIDATED` 100/100 times when fed only synthetic personas (RED-05); prompt-injection canary asserts the red line cannot be bypassed (RED-06); every `findings.md` propagates `worstProvenance:`." Option C fails these criteria. Option B makes it impossible to attribute a failure to a specific red-line mechanism. The Phase 1 eval harness structure (Plan 03 `evals/adversarial/`) already provides the scaffolding. RED-01..RED-06, ACCEPT-02.

---

## Trust Posture Artifacts and `INFERRED` Labeling Discipline

**Question:** How is the `evidence: INFERRED` requirement enforced across all Stage 5a/5b artifacts, and how is the P12 red line carried end-to-end?

**Options presented:**
- Option A — **Schema enforcement: `frontmatter-validate.mjs` (Phase 1 Plan 04) extended to reject `evidence: validated` or `evidence: proto` on Stage 5a-lite artifacts; `worstProvenance` propagation enforced by the same validator; README + workflow bodies carry explicit `evidence: INFERRED` messaging** — script-enforced at the schema level.
- Option B — **LLM-enforced: workflow body instructs LLM to always write `evidence: INFERRED`; no schema check** — relies on LLM compliance; fails the determinism principle.
- Option C — **No `evidence:` field enforcement; users see `evidence: INFERRED` as a suggestion, not a constraint** — not MVPA-04-compliant.

**Auto-selected:** Option A — schema enforcement via `frontmatter-validate.mjs`.

**Rationale:** The MRD's §9.1 BLOCKER fix says `style-lite`/`systematize-lite` "output labeled `stage: 5a-lite, evidence: INFERRED`; never claim `gate/stage-5a-complete: PASS`." Options B and C make this enforceable only by LLM discipline, which Pitfall 13 explicitly warns against: "the lite-mode labeling is a naming convention and a frontmatter label, not a deterministic gate." Phase 1 `frontmatter-validate.mjs` already supports strict/lenient mode and per-path rules. MVPA-04, RED-04, Pitfall 13.

---

## Output Write Discipline

**Question:** How should Phase 2 workflows write to the user's `design/` directory — via a staging area, directly, or via a dry-run diff?

**Options presented:**
- Option A — **All workflow writes stage into `.complete-design/preview/run-<id>/` first; diff is surfaced to the user; `--apply` flag required to copy staged artifacts to `design/`; `assets/scripts/cli/apply.mjs` handles the copy and triggers `manifest-reconcile.mjs`** — extends Phase 1 TRUST-02 pattern to all Phase 2 workflows.
- Option B — **Workflows write directly to `design/` but produce a `git diff` for review before the user commits** — simpler for the LLM to author; relies on user running `git diff`; bypasses the staging area established in Phase 1.
- Option C — **Dry-run mode by default (nothing written); separate `complete-design apply` command the user runs after review** — maximum safety; breaks the "preview + apply in one step" UX from Phase 1.

**Auto-selected:** Option A — `.complete-design/preview/` staging + `--apply` flag.

**Rationale:** TRUST-02 ("diff-by-default; `--apply` flag required to write into the user's working tree") and PROJECT.md Trust posture constraint ("never auto-publish to git tree") are non-negotiable. Phase 1 Phase 1 Plan 05 ships the preview harness with `.complete-design/preview/run-<id>/` staging already. Option B relies on the user knowing to `git diff` before committing. Option C separates the apply step from the preview in a confusing way. MRD §3.6 per-file commit policy, TRUST-02.

---

## Cross-Host Parity Scaffolding

**Question:** How much cross-host work should Phase 2 do to ensure Phase 4's within-0.10 parity gate is achievable, without doing Phase 4's acceptance work prematurely?

**Options presented:**
- Option A — **Phase 2 ships working Claude Code host-first execution; Codex CLI and Cursor sequential-fallback paths are exercise-tested via Phase 1 host-profile vitest workspaces; each workflow SKILL.md includes a `## Host fallback` section with sequential-step instructions for Codex/Cursor** — scaffold + smoke test; formal gate deferred to Phase 4.
- Option B — **Phase 2 achieves full cross-host parity for all 4 workflows before closing** — premature; extends Phase 2 scope significantly; Phase 4 is the correct gate.
- Option C — **Phase 2 only tests Claude Code; cross-host entirely deferred to Phase 4** — misses the Phase 1 host-profile infrastructure that already exists and needs to be exercised.

**Auto-selected:** Option A — Claude Code host-first + scaffold + exercise-test for Codex/Cursor.

**Rationale:** DIST-04 (Phase 2 requirement) = "Claude Code is the host-first target (full subagent dispatch supported)." MVPA-08 = "Claude Code host-first; Codex CLI + Cursor sequential-fallback scaffolded." ROADMAP Phase 2 Success Criterion 5 = "recall within 0.10 of host-first even though full parity is Phase 4." Option B would consume most of Phase 2's 5-week budget. Option C ignores the Phase 1 host-profile workspaces. Phase 1 Plan 05 D-22/D-23 establish exactly the scaffold Option A uses.

---

## Reviewed Todos

None — this is a fresh phase with no pre-existing todos to fold in.

---

*Discussion log for Phase 2: v2.0a Skeleton*
*Auto-mode — all decisions selected by orchestrator on 2026-05-25*
*User may override any decision before running `/gsd-plan-phase 2`*
