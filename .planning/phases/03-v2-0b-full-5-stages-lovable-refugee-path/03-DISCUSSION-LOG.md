# Phase 3: v2.0b — Full 5 Stages + Lovable Refugee Path - Discussion Log

**Date:** 2026-05-25
**Mode:** `--auto` (all options auto-selected; user may amend before plan-phase)
**Gray areas identified:** 17
**Decisions produced:** D-54 through D-70 (17 decisions)

---

## Excalidraw wireframe authoring method

**Question:** How should the `lowfi/crazy-eights` atom produce valid `.excalidraw` files — should the LLM emit raw Excalidraw element JSON directly, or should it describe structure in an intermediate format that a script converts?

**Options presented:**
- Option A — LLM describes wireframe structure as a lightweight skeleton IR → `excalidraw-render.mjs` emits valid Excalidraw JSON via `convertToExcalidrawElements()` API
- Option B — LLM emits Mermaid diagram syntax → `@excalidraw/mermaid-to-excalidraw` converts to Excalidraw (lossy, limited to flow-chart shapes)
- Option C — LLM hand-builds raw Excalidraw element JSON directly (type/version/elements[] arrays)

**Auto-selected:** Option A

**Rationale:** STACK.md §(b) explicitly states "Generate via `convertToExcalidrawElements()` from skeleton format — do NOT hand-build raw element JSON." This is a firm MRD prohibition (Option C). Option B is tagged as a v2.1+ optional atom (`lowfi/from-mermaid`) in STACK.md supporting libraries — it does not handle the full Crazy 8s layout vocabulary. Option A matches the ARCHITECTURE.md Pattern 1 ("LLM picks, scripts emit") used consistently across DTCG token emit (Phase 2 `tokens-project.mjs`) and Mermaid render — a determinism contract that has been validated across Phases 1 and 2.

---

## Stage 3 structural diversity metric

**Question:** How should `gate-stage-3.mjs` verify that the ≥3 wireframe variants are genuinely structurally different and not near-clones?

**Options presented:**
- Option A — Reuse Phase 1's `variant-distance.mjs` 6-axis visual-style metric (color palette, type scale, border radius, shadow depth, motion profile, component density)
- Option B — Build a separate `wireframe-diversity.mjs` 3-factor structural metric (bounding-box grid placement distribution + element count delta ±30% bands + nesting depth ratio), minimum pairwise distance 0.35
- Option C — Delegate structural diversity assessment to an LLM judge at gate time (non-deterministic)

**Auto-selected:** Option B

**Rationale:** Option A is explicitly inapplicable — the 6-axis metric measures hi-fi visual variation (colors, typography, shadows) which are all absent at Stage 3 due to FID-03 greyscale enforcement. Reusing it would produce meaningless distances between greyscale wireframes. Option C violates ARCHITECTURE.md Pattern 1 (gates must be deterministic script-based, never LLM-judged — Anti-Pattern 3). Option B addresses ARCHITECTURE.md Risk 6 directly: "LLM produces 3+5 near-clones" is the named Stage 3 quality risk. ROADMAP Phase 3 Success Criterion 3 requires 100% rejection of near-clone variants. PITFALLS.md Pitfall 3 names "Generating Crazy 8s as 3+5 near-clones" as the Stage 3 anti-pattern.

---

## FID-03 styled wireframe detector implementation

**Question:** How should `gate-stage-3.mjs` enforce the FID-03 fidelity cap (no color, non-default fonts, styling in Stage 3 wireframes)?

**Options presented:**
- Option A — `gate-stage-3.mjs` parses each `.excalidraw` file's `elements[]` array and rejects elements with non-default `strokeColor`, `backgroundColor`, or `fontFamily` values deterministically
- Option B — LLM is instructed in the workflow body to never add styling, and a soft-warning is surfaced if styling is detected
- Option C — A separate standalone `fid-03-audit.mjs` script runs outside the gate, producing findings but not blocking

**Auto-selected:** Option A

**Rationale:** MRD §3.23 FID-03 is a fidelity cap, not a guideline — "gates must be deterministic, never LLM-dependent" (ARCHITECTURE.md Anti-Pattern 3). Option B is explicitly an anti-pattern: instructing the LLM to self-govern is Pitfall 3 ("fidelity-cap leakage"). MRD §9.3 GA acceptance criterion names "Stage 3 hard-blocks completion if LLM emits color/type/styling" as a literal acceptance test — the word "hard-blocks" requires a gate, not an advisory. Option C (outside the gate) could be bypassed if a user skips the audit step. The gate is the only reliable enforcement point. Excalidraw's default values are well-defined constants (`#1e1e1e` stroke, `transparent` fill, `Virgil` font) — deterministic comparison requires no heuristics.

---

## XState v5 emit trigger heuristic

**Question:** How should the system determine whether to emit an XState machine for a given screen's interaction spec, given the MRD rule "async + ≥3 states + conditional transitions"?

**Options presented:**
- Option A — LLM analyzes the spec.md and decides at generation time whether XState is warranted (LLM-judged emit)
- Option B — `gate-stage-4.mjs` reads structured frontmatter fields (`asyncOperations: boolean`, `stateCount: number`, `hasConditionalTransitions: boolean`) from `interaction-spec.v1.json` and applies the three-condition rule deterministically
- Option C — XState is always emitted for every screen to ensure completeness (emit unconditionally)

**Auto-selected:** Option B

**Rationale:** The `interaction-spec.v1.json` schema (Phase 1 Plan 01) already ships `asyncOperations`, `stateCount`, and `hasConditionalTransitions` as required frontmatter fields — the infrastructure for deterministic triggering exists without new schema work. Option A (LLM-judged) violates Anti-Pattern 3 (gate must be deterministic). Option C directly contradicts MRD §3.22, MRD §9.2, and the codex finding §16 "XState should not be primary designer artifact" — emitting XState unconditionally is precisely the overfitting-engineers-on-designers problem the MRD was revised to solve. STACK.md Alternatives table: "XState as primary — Never. Codex finding §16 + §3.22."

---

## Mermaid stateDiagram-v2 canonical artifact location and repair

**Question:** Where should the canonical Mermaid stateDiagram-v2 artifact for each screen live, and what happens when the Mermaid output fails validation?

**Options presented:**
- Option A — `design/interactions/<screen>.diagram.mmd` co-located with `design/interactions/<screen>.spec.md`; repair via `mermaid-render.mjs` validate loop (max 2 retries), kebab-case for space-containing screen names
- Option B — `design/interactions/<screen>/state-diagram.mmd` in a per-screen subdirectory with spec.md as sibling
- Option C — Mermaid is embedded inline in the spec.md frontmatter as a multi-line YAML field (no separate file)

**Auto-selected:** Option A

**Rationale:** The `design/` directory convention from Phase 1 (ARCHITECTURE.md) uses flat sibling files for co-located stage artifacts, not subdirectories — matching the existing `design/ia/*.flow.mmd` + `design/ia/sitemap.json` pattern from Phase 2. Option B creates a new naming convention that diverges from the established flat pattern. Option C embeds Mermaid in YAML which prevents headless rendering by `mermaid-render.mjs` (Phase 1, Plan 01-03). The Phase 1 `mermaid-render.mjs` max-2-retry repair loop is already the established repair pattern for Mermaid validation failures (Phase 1 Plan 01-03). STACK.md open recommendation 6 confirms that both Mermaid and XState must be emitted from the same IR — the `.diagram.mmd` file is the natural output target.

---

## Stage 4 gate state-completeness check

**Question:** How should `gate-stage-4.mjs` verify that the state catalog is complete enough to unblock Stage 5a?

**Options presented:**
- Option A — Gate checks only that every sitemap route has a `.spec.md` file (existence check only)
- Option B — Gate checks three conditions: (a) every sitemap route has a `.spec.md`, (b) each spec enumerates loading/empty/error/success states, (c) no Mermaid diagram transition targets an undefined state name
- Option C — LLM reviews the state catalog holistically and produces a completeness score; gate passes if score ≥ 0.8

**Auto-selected:** Option B

**Rationale:** MRD §3.22 gate/stage-4 checklist is explicit: "complete state set; loading/empty/error/success required; no 'open' transition targets." Option A is underspecified relative to the MRD requirement. Option C violates Anti-Pattern 3 (deterministic gate). Condition (b) maps directly to the `interaction-spec.v1.json` `stateCategories` required array field. Condition (c) requires only a textual `[stateName]` regex parse of the `.diagram.mmd` — no full AST parse is needed. All three checks are O(n) filesystem + text operations within the Phase 1 gate runner framework. MVPB-08 + ACCEPT-04 name this as a named acceptance criterion.

---

## Stage 5a lite-to-full gate promotion

**Question:** What should trigger `gate-stage-5a-complete` to transition from its Phase 2 hard-coded `not_runnable` behavior to a full runnable gate?

**Options presented:**
- Option A — Gate is promoted when `design/interactions/` is non-empty (contains at least one `.spec.md`); the `not_runnable` path is preserved for empty `interactions/`; full checklist runs when non-empty
- Option B — Gate is promoted only when ALL sitemap routes have a corresponding `.spec.md` (complete coverage required to run any Stage 5a work)
- Option C — A new `--force-stage-5a` CLI flag overrides the gate regardless of state

**Auto-selected:** Option A

**Rationale:** ROADMAP Phase 3 Success Criterion 1 states "`design --route new-product --full` runs all 5 stages; Stage 5a gate returns PASS (not not_runnable)" — the primary Phase 3 deliverable. Phase 2 D-43 explicitly deferred this promotion to Phase 3: "The gate will be promoted from not_runnable to a full runnable checker in Phase 3 when Stage 4 artifacts exist." Option B is too strict for incremental workflows where a designer starts with 2 screens — forcing 100% coverage would prevent partial runs. Option C bypasses the gate entirely, which violates the "gates as first-class discipline" principle (MRD §3.22). Option A preserves the Phase 2 BLOCKER fix for users who have no Stage 4 artifacts at all (v2.0a behavior unchanged) while enabling the full gate for users who have begun Stage 4 work.

---

## Frost ≥3× recurrence enforcement mechanism

**Question:** How should the Frost ≥3× recurrence rule (FID-06) be enforced in `gate-stage-5b-complete` — and should the count be persisted or computed fresh at each gate run?

**Options presented:**
- Option A — Persisted counter in `.design-os/private/component-recurrence.json`, incremented each time a component appears in a Stage 5a run; gate checks the persisted total
- Option B — Per-gate-run filesystem count: `gate-stage-5b.mjs` scans `design/wireframes/` + `design/interactions/` at gate time, counts component name occurrences, blocks any component with count < 3
- Option C — Frost ≥3× rule is implemented as a soft warning (severity: WARNING) rather than a BLOCKER, allowing designers to override

**Auto-selected:** Option B

**Rationale:** A persisted counter (Option A) creates a stale-data problem — if the designer deletes wireframes, the counter doesn't decrease, and the gate can approve a component that no longer appears 3×. Option B is a pure filesystem truth-at-gate-time check, eliminating staleness. Option C violates FID-06 (a fidelity cap, not a guideline) and contradicts Phase 2 D-44: "Frost ≥3× recurrence enforced as a hard gate only in Phase 3." MRD §3.23 Stage 5b fidelity cap is unambiguous. Pitfall 3 names Stage 5b recurrence count enforcement as a required mitigation. The per-run scan is O(n) across `design/wireframes/` and `design/interactions/` — well within gate runtime budget.

---

## Reverse-engineer input normalization

**Question:** What input formats should `audit --reverse-engineer-stages` accept, and how should they be normalized before stage inference?

**Options presented:**
- Option A — Accept only a local cloned-repo path (`--source ./path/to/prototype`); require the user to clone the repo first
- Option B — Accept both local path AND live URL; normalize URL inputs to a temporary filesystem tree via a read-only URL-to-filesystem crawler before inference
- Option C — Accept only a live URL (fetched to temp dir); require users without source access to export their app

**Auto-selected:** Option B

**Rationale:** The primary "Lovable refugee" persona splits into two sub-profiles: (a) a dev who has the source code locally (can clone, has access), and (b) a dev who only has the live deployed URL (no git access to the Lovable-generated repo). ROUTE-06 and AUDIT-06 both address refugee workflows — forcing option A excludes profile (b); Option C excludes profile (a). Option B handles both with a single `--source` flag. The URL crawler is read-only, writes only to a temp dir, and passes the same normalized filesystem tree to the inference pipeline. This is a well-bounded addition with no impact on the deterministic script layer.

---

## Reverse-engineer stage inference order

**Question:** In what order should `audit --reverse-engineer-stages` infer the design stages from an existing prototype?

**Options presented:**
- Option A — Forward order: Stage 1 → Stage 2 → Stage 3 → Stage 4 (mirror the design workflow order)
- Option B — Reverse order: Stage 4 → Stage 3 → Stage 2 → Stage 1 (deepest structural signals inferred first, shallowest last)
- Option C — All stages in parallel (independent inference, then reconcile)

**Auto-selected:** Option B

**Rationale:** Stage 4 (interaction patterns) yields the highest-fidelity structural signal from source code — async state patterns, conditional renders, loading/error/empty/success branches are directly readable from component logic. Inferring Stage 3 (wireframe structure) from the Stage 4 state catalog is more accurate than inferring it from visual layout alone. Stage 2 (IA/sitemap) follows from the routing structure which is confirmed by the Stage 4 screen inventory. Stage 1 (personas/JTBDs) is inferred last from the weakest signals (copy, onboarding text). This sequence matches ARCHITECTURE.md §Key Data Flows for the reverse-engineer flow. Option A would infer Stage 1 from copy first, but Stage 1 personas are the most lossy inference — starting there and propagating errors forward degrades all downstream inferences. Option C parallelizes inferences that are actually dependent (Stage 3 benefits from Stage 4 output).

---

## INFERRED artifact trust posture enforcement

**Question:** How "loud" should the `provenance: inferred` disclaimer be on reverse-engineered artifacts, and how should it be enforced?

**Options presented:**
- Option A — Both YAML frontmatter field AND a visible Markdown blockquote banner at the top of every artifact body; `frontmatter-validate.mjs` enforces both; `design-os promote-inferred` CLI subcommand gates the path from `design/inferred/` to `design/`
- Option B — YAML frontmatter field only (`provenance: inferred`); no Markdown banner; rely on the color-coded CLI output to communicate inferred status
- Option C — A single top-of-file comment (`<!-- INFERRED: validate before use -->`) that can be easily stripped

**Auto-selected:** Option A

**Rationale:** MRD §6 says "loud disclaimer on every output"; MRD §9.2 repeats "loud disclaimer on every output." The word "loud" is specific — it must be visible in the artifact itself, not only in CLI output (Option B) or easily-stripped comments (Option C). The two-layer approach (frontmatter + Markdown banner) ensures the disclaimer survives copy-paste, Git diff review, and any tool that reads the file directly. AUDIT-07 requires all reverse-engineered artifacts carry `provenance: inferred`. The `design-os promote-inferred` CLI subcommand is the controlled path from `design/inferred/` to `design/` — it validates the user has reviewed and amended each section before the `provenance: inferred` is cleared.

---

## v2.0a → v2.0b migration strategy

**Question:** How should the `design-os migrate --from 2.0a --to 2.0b` command handle existing v2.0a artifacts without breaking them?

**Options presented:**
- Option A — Idempotent migration with dry-run by default: reads `schemaVersion` frontmatter, skips already-migrated artifacts, applies only the delta fields (`wireframeRefs`, `interactionNeeds`, new MANIFEST.md sections), prints diff without `--apply`, writes in-place with `--apply`
- Option B — Destructive migration: rewrites all artifacts to v2.0b schema without dry-run option, requiring the user to commit before running
- Option C — Migration is the user's responsibility; provide docs only, no automated migration command

**Auto-selected:** Option A

**Rationale:** PITFALLS.md Pitfall 8 names "schema migration without story" explicitly: "breaking the design/ directory contract for existing users is a distribution-level trust failure." Option B's destructive approach is a guaranteed trust failure for any user who has in-flight v2.0a work. Option C abandons the PERSIST-03 requirement entirely. Idempotency is the safe invariant: running the migration twice produces the same result as running it once. The dry-run-by-default pattern is consistent with Phase 2 D-52's diff-by-default discipline (every design-os write is diff-first, `--apply` to commit). MVPB-10 requires a migration command. The `appendManifestLockEntry` call on `--apply` maintains the SHA-256 hash chain integrity.

---

## new-product full-route token budget allocation

**Question:** How should the 150k total token budget for the `new-product` full route be allocated across 7 stages, and should under-budget stages donate headroom to later stages?

**Options presented:**
- Option A — Dynamic allocation: each stage receives its p50 ceiling; unused tokens are pooled and available for subsequent stages
- Option B — Fixed per-stage ceilings that sum to ≤150k; no headroom donation across stages; each stage operates within its own independent ceiling
- Option C — Single 150k pool with no per-stage ceilings; stages consume from the shared pool until it's exhausted

**Auto-selected:** Option B

**Rationale:** COST-03 (`sketch` p50 ≤25k), COST-04 (`interact` p50 ≤30k), COST-07 (full design p50 ≤150k) are independent per-stage budget requirements in REQUIREMENTS.md — they are not derived from the total. Option A's pooling means a runaway Stage 3 (Pitfall 7 names Stage 3/4 as "highest-risk for tail cost") could consume the entire budget before Stage 5 begins. Option C has no per-stage protection at all. The Phase 2 D-49 soft-warn at p50 / hard-stop at 2× pattern is preserved within each stage's independent ceiling. MRD §11 adds a p95 ≤220k total ceiling — fixed per-stage ceilings make p95 predictable; dynamic pooling makes p95 unpredictable by construction.

---

## `mature-app-refactor` route definition

**Question:** Which stages should the `mature-app-refactor` route include, and what is its total token budget?

**Options presented:**
- Option A — Stage 2 audit + Stage 4 audit + Stage 5b systematize; skip Stages 1, 3, 5a; budget ≤45k
- Option B — Full 5-stage run with `--depth lightweight` mode to reduce ceremony for mature apps
- Option C — Stage 4 audit only + Stage 5b systematize; skip Stages 1, 2, 3, 5a; budget ≤30k

**Auto-selected:** Option A

**Rationale:** MRD §3.4a routing matrix explicitly defines `mature-app-refactor` as requiring Stages 2+4+5b and skipping Stages 1, 3, 5a. ROUTE-03 in REQUIREMENTS.md maps to this routing. Option B contradicts MRD §9.2 "Stage 3 is risk-triggered, not default; for mature-app-refactor routes, Stage 3 is skipped with no warning (it would be ceremony)." Option C skips Stage 2 IA drift detection which is often the primary reason a mature app needs refactoring (IA drift accumulates over time). The ≤45k budget is consistent with Phase 2's route budget patterns: `design-bug` ≤20k, `new-feature` delta ≤60k — mature-app-refactor is a mid-range route.

---

## `audit --all-stages` ranking algorithm

**Question:** How should findings from all 6 stage detectors be sorted in the unified `audit --all-stages` report?

**Options presented:**
- Option A — Severity DESC only (blocker → error → warning → info), with no secondary sort key
- Option B — Severity DESC then stage ASC (earlier stage findings rank higher within the same severity tier, since upstream gaps invalidate more downstream work)
- Option C — Stage ASC then severity DESC (earlier stages first, severity as secondary within each stage)

**Auto-selected:** Option B

**Rationale:** AUDIT-02 requires the all-stages report surface gaps as a ranked list. ROADMAP Phase 3 Success Criterion 5 states "audit --all-stages identifies Stage 2+4 gaps as ranked list." The tiebreaker between Options A and B: when a Stage 2 IA gap and a Stage 4 interaction gap are both `ERROR` severity, Option A leaves the ordering undefined (or arbitrary by insertion order), while Option B surfaces the Stage 2 gap first — correctly, because fixing the Stage 2 gap may eliminate the Stage 4 gap (downstream artifacts depend on upstream). Option C prioritizes stage over severity, which means an INFO finding in Stage 1 appears before a BLOCKER in Stage 4 — obviously wrong. The combined sort key `(severity_rank DESC, stage_num ASC)` is the natural order for a design-process repair queue.

---

## `audit --new-feature` vs `design --route new-feature` distinction

**Question:** Is `audit --new-feature` a post-hoc validator, a forward-generation shorthand, or something else? How is it different from `design --route new-feature`?

**Options presented:**
- Option A — `audit --new-feature` is post-hoc validation only: checks existing `design/` artifacts for completeness against a named feature without generating new artifacts; complementary to `design --route new-feature` (forward workflow)
- Option B — `audit --new-feature` is a shorthand for `design --route new-feature --dry-run`: it previews what would be generated without writing files
- Option C — `audit --new-feature` replaces `design --route new-feature`: a single command that both validates and fills gaps in one pass

**Auto-selected:** Option A

**Rationale:** AUDIT-04 defines `audit --new-feature` as a post-hoc validator specifically. ROUTE-02 defines `design --route new-feature` as the forward-generation workflow. MRD §3.7 W7 audit verb semantics: "audit checks existing artifacts for gaps; design generates new artifacts." Conflating them (Options B or C) blurs the trust posture boundary — users need to know definitively which tool modifies their `design/` directory and which does not. The TRUST-05 discipline (diff-by-default, `--apply` required to write) applies only to forward-generation commands. A post-hoc validator that doesn't write any files is a simpler, lower-risk operation that can be run safely at any time without the `--apply` gate.

---

## Phase 2 D-44 Frost ≥3× gate upgrade

**Question:** When Phase 3 upgrades the Frost ≥3× check from `status: na` to a hard BLOCKER, how should the existing Phase 2 CI assertion be updated?

**Options presented:**
- Option A — Update the existing CI assertion to assert `{kind: 'not_runnable', reason: 'frost-recurrence-not-met'}` when recurrence < 3; add adversarial fixture in `evals/adversarial/fid-06-frost-recurrence/`; update `INVARIANTS.md` to document the promoted gate
- Option B — Add a new CI test for the BLOCKER behavior and leave the old Phase 2 test in place as a "legacy mode" flag test
- Option C — Annotate the existing `status: na` test as a known deviation and add the BLOCKER behavior only in the full-run acceptance suite (Phase 4)

**Auto-selected:** Option A

**Rationale:** D-44 in Phase 2 CONTEXT.md is unambiguous: "Frost ≥3× recurrence enforced as a hard gate only in Phase 3." Phase 3 MUST deliver this promotion — it is a named Phase 3 deliverable, not a Phase 4 item. Option B creates "legacy mode" ambiguity that would mislead future maintainers about which behavior is canonical. Option C defers a Phase 3 requirement to Phase 4, contradicting the Phase 3 scope. The `INVARIANTS.md` update (Phase 2 Plan 05 deliverable) documents all cross-cutting invariants — the Frost gate promotion is a cross-cutting change that must be recorded there. An adversarial fixture is required because this is a security-posture change (a gate that previously did not block now blocks), and CI must cover the failure case explicitly.

---

## Reviewed Todos

None — this is a fresh phase with no carry-over review items.
