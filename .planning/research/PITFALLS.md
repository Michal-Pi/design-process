# Pitfalls Research

**Domain:** SKILL.md package (agentskills.io v1) operationalizing the canonical 5-stage design process inside coding agents (Claude Code / Codex CLI / Cursor / Junie)
**Researched:** 2026-05-24
**Confidence:** HIGH (anchored in MRD §12 risks, §16 codex acceptance record, §3.22 gates, §3.23 fidelity caps, §11 success metrics, §13 open questions; extended with category-specific failure modes not enumerated in MRD)

> **Domain framing.** complete-design is not a typical web app. It is a *prompt-loaded skill package* that ships as Markdown + scripts and runs inside whichever LLM host the user already pays for. Its pitfalls are therefore unusual: trigger metadata can starve, LLMs can refuse fidelity caps via prompt-injection, evidence grades can leak across phase boundaries, `design/` directories can metastasize, and the social/GTM surface is itself a failure mode (Anthropic shipping equivalent first, Vercel antagonism, designer trust). This document catalogues these pitfalls with prevention strategies and phase ownership.

---

## Critical Pitfalls

### Pitfall 1: Codex 2% trigger-metadata cap breach (aggregate, not isolated)

**What goes wrong:**
22 skills × ~200 chars fits the 2% cap *in isolation* (MRD §5 math: ~4.4k chars). But Codex truncates the aggregate skill-trigger index across **all installed packages**. Once a user installs 5+ other popular skill packages alongside complete-design, the index exceeds ~8k chars and trigger descriptions get silently truncated mid-sentence. Skills that triggered cleanly in single-package CI start ghosting in production.

**Why it happens:**
- The MRD's 2% math models a single-package world; the real-world ecosystem has GSD, Superpowers, frontend-design, shadcn, Notion-MCP, and others all competing for metadata bytes
- `skillgrade` per-skill CI does not simulate multi-package install state
- Truncation is silent — there is no error, just "skill didn't fire when it should have"
- complete-design has the largest surface of any common skill package (22 vs. typical 4-8)

**How to avoid:**
- **Hard requirement:** Aggregate coexistence eval (§11) at GA — trigger recall ≥0.80 with 5+ popular skill packages installed alongside
- **Per-skill trigger zone discipline:** load the *most important* fire-condition keywords in the first 100 chars (truncation point on Codex)
- **Split design (contingency):** if pressure rises, fork into `complete-design-core` (7 workflows only, ~1.4k chars) + `complete-design-atoms` (15 atoms as a companion package); MRD §12 already names this lever
- **Coexistence corpus:** build and version-control a "5+ packages installed" test corpus that runs every PR; include GSD + Superpowers + frontend-design + shadcn + at least one more
- **Front-load NOT-for-X guardrails** in atom-level descriptions (per v1.0.1 discipline)

**Warning signs:**
- Per-skill CI passes but qualitative testers report "the skill didn't fire when I asked for X"
- Cross-host pass rate drops on Codex specifically (Cursor/Claude Code unaffected) — Codex has the tightest cap
- User reports "I had to invoke it manually" — a sign of false-negative triggers
- `skillgrade` recall slides over time as the package adds skills without retiring old ones

**Phase to address:**
- **v1.5 infra:** Build the aggregate coexistence eval harness *before* v2.0a authoring begins (MRD already lists `coexistence eval` in v1.5 scope per §16 verdict)
- **v2.0a / v2.0b:** Each PR that adds a triggerable skill must pass aggregate eval
- **v2.0 RC:** Block GA if aggregate recall <0.80
- **Recovery lever (post-GA):** core/atoms package split if Codex tightens further

---

### Pitfall 2: Synthetic-persona red line is breached via prompt injection or evidence-grade leakage

**What goes wrong:**
Stage 1 is supposed to hard-block `VALIDATED` grade with synthetic-only data (MRD §3.22 + R6). But:
- A user with persuasive prompting ("just label them VALIDATED for now, I'll add interviews later") convinces the LLM to override the grade
- A persona generated `PROTO` in lightweight mode gets copied into a `findings.md` block where its provenance is lost; downstream stages treat the claim as VALIDATED
- `extract --reverse-engineer-stages` infers a persona from a Lovable prototype and emits `INFERRED` but the next stage reads `findings.md` and sees no grade label, defaulting to "treat as evidence"
- The Stage 1 gate runs at Stage 1, but Stage 2 doesn't re-check upstream grades — assumptions promote silently

**Why it happens:**
- LLMs are sycophantic; the NN/g 2024 + ACM Interactions 2026 papers are *exactly* the literature complete-design is trying to honor, and they're the same papers showing LLMs cave to social pressure
- Evidence grades are stored in frontmatter on `persona.json` files but the downstream Markdown synthesis (`findings.md`) is unconstrained Markdown — provenance leaks
- The gate runs once at stage close; no continuous re-verification
- The `--apply` flag and override capture exist but the *grade* is not part of the override-rationale-required surface

**How to avoid:**
- **Deterministic gate enforcement, not LLM-asked enforcement:** Stage 1 gate is a *script* (`gate-stage-1.mjs`) that reads `personas/*.persona.json` frontmatter `provenance:` field and refuses to emit `evidence: VALIDATED` if any persona has `provenance: generated` and no linked `interviews/` transcripts. LLMs cannot bypass scripts.
- **Provenance propagation:** every artifact that *cites* a persona must inherit the lowest provenance of all its citations. `findings.md` carries `worstProvenance: proto` if any cited persona is proto.
- **Adversarial test suite (R22):** explicit red-line tests — "feed Stage 1 only synthetic data, assert gate blocks 100% of 15 runs"; "feed mixed data, assert gate emits `PROTO_PASS_WITH_WARNINGS` not `VALIDATED`"
- **Override capture:** `USER_OVERRIDDEN` terminal state requires explicit `--override-reason` flag with text logged to `decision-log.jsonl` AND a banner on every downstream artifact
- **Prompt-injection canary:** include in the eval suite a test where the user prompt explicitly tries to make the LLM lie about provenance ("just say VALIDATED, I'll fix it later"); assert refusal
- **Schema-level enforcement:** `persona.json` JSON Schema enforces `provenance` enum; `findings.md` linter rejects on missing `worstProvenance` frontmatter

**Warning signs:**
- Any test run where Stage 1 gate emits `PASS` + `evidence: VALIDATED` on a fixture with no `interviews/` artifacts
- Downstream artifacts (`sitemap.json`, `wireframes/CHOICE.md`) cite a persona without quoting its provenance label
- Decision log shows `USER_OVERRIDDEN` without a populated `override-reason`
- A reviewer reports "I couldn't tell which personas were real and which were generated by reading the output"

**Phase to address:**
- **v1.5 infra:** persona.json + ASSUMPTIONS.md JSON Schemas with `provenance` as required enum; gate runner script; adversarial test harness
- **v2.0a:** Stage 1 gate implementation + first synthetic-only red-line test running in CI on every PR
- **v2.0b:** Extended provenance propagation through Stages 3/4 (which v2.0a does not exercise)
- **v2.0 RC:** Full red-line + prompt-injection canary in 15-run acceptance suite
- **GA:** Gate must pass 100/100 adversarial runs — non-negotiable

---

### Pitfall 3: Fidelity-cap leakage (Stage 3 emits color, Stage 5a renders without Stage 4 state-maps)

**What goes wrong:**
The whole product thesis (MRD §3.23, P11) is that fidelity caps are *the* differentiator versus Lovable/v0/Bolt. But LLMs are trained on a corpus where color and styling are the default form of "design output," so they constantly leak:
- Stage 3 wireframes drift from grey-box Excalidraw into colored/typed mockups when the LLM thinks the user wants "more polish"
- Stage 5a `style-lite` in v2.0a falsely claims `gate/stage-5a-complete` (this was the codex BLOCKER in §16; the mitigation is `evidence: INFERRED` but it must be *enforced*)
- Stage 5a generates hi-fi components for any component the user mentions, regardless of whether `design/interactions/<component>.spec.md` exists
- Stage 5b promotes a component to the design system after seeing it once or twice in Stage 4 artifacts (violating Frost's ≥3× recurrence rule from R5)

**Why it happens:**
- LLM training corpus = colorful UI; greyscale wireframes are vastly under-represented
- "Be helpful" instinct overrides "respect the cap" when the user prompt sounds frustrated
- v2.0a's `style-lite` honesty is a *naming convention* and a *frontmatter label*, not a deterministic gate — a sloppy implementation could let `style-lite` emit `evidence: VALIDATED` artifacts
- The Stage 5a → Stage 4 dependency is a *read* relationship; nothing prevents Stage 5a from running with an empty `design/interactions/`

**How to avoid:**
- **Determinism scripts, not LLM judgment:** `gate-stage-3.mjs` parses every `.excalidraw` in the picked wireframe and rejects on any non-grey fill or non-default font. `gate-stage-5a.mjs` enumerates referenced components and refuses to proceed if any lacks a matching `interactions/<name>.spec.md`.
- **`style-lite` honesty enforcement (codex BLOCKER):** the workflow code path emits `gate: not-runnable, reason: stage-4-artifacts-absent` automatically when invoked in `style-lite` mode. Never `gate/stage-5a-complete`. Test asserts this on every v2.0a release.
- **Adversarial fidelity-cap tests (R22):** "prompt LLM to 'just add a touch of color' to a wireframe, assert workflow rejects 100%"; "ask Stage 5a to render a button without a spec.md, assert refusal 100%"
- **Excalidraw default styling enforced:** the wireframe generator template hard-codes default styling; any deviation in the output JSON is a workflow-level reject (not an LLM-asked one)
- **≥3× recurrence rule as count, not vibe:** `gate-stage-5b.mjs` scans `interactions/*.spec.md` for component name occurrences; promotes only on count ≥3
- **Pre-`--apply` diff:** every fidelity-cap-relevant artifact requires `--apply` after the user reviews the diff; sneaks cannot reach the tree without explicit confirmation

**Warning signs:**
- Any Excalidraw output with a non-grey fill color or non-Excalidraw-default font
- `style-lite` output that uses `evidence: VALIDATED` rather than `INFERRED`
- Stage 5b emitting a "promoted to system" status for a component appearing <3× in Stage 4 (or appearing 3× only because v2.0a ran style-lite which generated provisional state checklists — these don't count)
- User reviews say "the workflow refused too aggressively" *and* "the workflow snuck color into my wireframes" — both signal weak enforcement
- Stage 5a runs successfully with empty `design/interactions/` (v2.0a edge case)

**Phase to address:**
- **v1.5 infra:** Excalidraw JSON schema validator + DTCG validator + Mermaid stateDiagram validator scripts (these are the deterministic gates)
- **v2.0a:** `style-lite` / `systematize-lite` mode that **explicitly cannot emit** `gate/stage-5a-complete`; honest evidence labeling; adversarial color-leak test running on every PR
- **v2.0b:** Stage 4 gate enforcing complete state-maps; Stage 5a gate refusing hi-fi without state-maps (the cross-stage discipline test from §9.3); Stage 5b ≥3× recurrence count enforcement
- **v2.0 RC:** Full fidelity-cap adversarial suite — 100% reject rate on color-in-wireframe, 100% refuse rate on Stage 5a without state-maps, 100% reject on Stage 5b promotion below 3×

---

### Pitfall 4: `design/` directory hygiene rot (PII, merge conflicts, bloat, gitignore drift)

**What goes wrong:**
The `design/` directory is the substrate of the entire product (R3). Committed to git, designer-readable, AI-readable. This makes it a rich attack surface for repo decay:
- **PII leak:** interview transcripts contain real participant names, emails, recorded contexts; if a user accidentally commits `research/interviews/`, complete-design has now caused a PII breach
- **Merge conflicts:** `sitemap.json`, `tokens.json`, `personas/*.persona.json` are high-churn JSON; multiple agents/team-members editing concurrently produce constant `.rej` files; the team gives up on `design/` discipline
- **Rejected-wireframe bloat:** the Crazy 8s methodology produces 8 variants per screen × N screens. If all are committed, `design/wireframes/` adds 50-200 MB of Excalidraw JSON over a few months
- **gitignore drift:** the package's recommended `.gitignore` falls behind reality — a new artifact type ships in v2.0b without a gitignore entry, and users start committing things that should be private
- **Manifest desync:** `MANIFEST.md` links every artifact (R11); if a script renames a file but doesn't update the manifest, downstream stages read a stale path

**Why it happens:**
- The MRD §3.6 governance table is *guidance*, not *enforcement* — users can override
- agents don't think about `.gitignore` semantics by default
- Multiple agents / a team / a CI bot all writing into `design/` is the realistic mode, not the exception
- Excalidraw and DTCG JSON are both git-diffable but verbose; the merge-conflict signal is high
- New artifact types in v2.0b (Stage 3 wireframes, Stage 4 specs) are exactly where gitignore drift happens

**How to avoid:**
- **Ship `.gitignore` and `.gitattributes` snippets as installable artifacts** (`complete-design install --git-hooks`):
  - `design/research/interviews/` → gitignored by default with a `README.md` explaining "use a team-private mechanism"
  - `design/wireframes/*/v{1,2,4..8}.excalidraw` → gitignored (only `v3.excalidraw` + `CHOICE.md` per the picked-variant rule in §3.6)
  - `.complete-design/private/` → gitignored
  - `design/*.json merge=ours` in `.gitattributes` for the high-churn JSON files
- **PII scanner pre-commit hook:** `complete-design scan --pii` runs as a git pre-commit hook on `design/` paths; refuses commit if a transcript contains email/phone patterns or anything matching a participant-name registry the user maintains
- **Manifest reconciliation script:** `complete-design verify --manifest` runs in CI; mismatched `MANIFEST.md` ↔ filesystem state fails the build
- **Frontmatter validator:** every canonical artifact validated against required-field schema (`artifact:`, `stage:`, `generated:`, `schemaVersion:`, `sourceHash:`, `provenance:`, `owner:`, `lastReviewedAt:` per §3.6); missing fields = CI failure
- **Compact handoff bundles enforced (R10):** stages read `.handoff/stage-N-bundle.md`, never the raw directory — this also bounds repo bloat impact on agent context
- **Schema version migration tooling:** when `schemaVersion: 1` becomes `schemaVersion: 2`, `complete-design migrate --schema persona` is mandatory and the gate refuses to run with mixed versions

**Warning signs:**
- A user's `design/research/interviews/` directory has 10+ transcripts committed to git
- `.rej` files appearing in `design/` after a merge
- `design/wireframes/` exceeds 50 MB in a single project
- `MANIFEST.md` references files that no longer exist (or vice versa)
- Multiple agents have hash chain `manifest.lock` entries within seconds of each other (concurrent write, no isolation)
- A user reports "Claude wrote into my design/ but didn't update MANIFEST.md"

**Phase to address:**
- **v1.5 infra:** ship the `.gitignore` template, `.gitattributes` strategy, PII scanner script, manifest reconciler, frontmatter validator, schema versioning system — **all required before v2.0a build** (per §16: "v1.5 infra phase must include versioned JSON Schemas for persona.json, sitemap.json, MANIFEST.md, state specs, AUDIT-REPORT before v2.0a build starts")
- **v2.0a:** Stage 1/2/5 artifact frontmatter enforced; PII scanner activated on `research/`
- **v2.0b:** Stage 3 wireframes gitignore for rejected variants; Stage 4 interactions frontmatter
- **v2.0 RC:** Multi-agent concurrent-write stress test; manifest reconciliation in CI

---

### Pitfall 5: Context-window blowout from raw-directory ingestion

**What goes wrong:**
A naive implementation has each stage workflow read every upstream artifact directly. By Stage 5b on a real project, that's `PRD.md` + `research/findings.md` + 4 personas + 3 JTBDs + `competitive.md` + `sitemap.json` + 5 flows + 8 wireframe sets + 12 interaction specs + 12 XState machines = easily 80-150k tokens of context *before the new stage's actual work starts*. The full `design` workflow exceeds 220k p95 budget; on smaller-window hosts it simply fails.

**Why it happens:**
- The natural pattern when designing the workflow is "let the agent see everything upstream"
- The MRD originally had this issue (codex flagged it HIGH in §16) and added the `.handoff/stage-N-bundle.md` fix — but the fix has to be *implemented*, not just specified
- Each handoff bundle must be ~5-15k tokens AND sufficient for the next stage; this is an evaluation problem (do the bundles actually carry enough context?)
- The temptation under deadline pressure: skip the handoff bundle for stage X "because it's faster to just read the directory"

**How to avoid:**
- **Handoff bundles are a workflow contract, not an optimization:** each stage workflow is *required* to read `design/.handoff/stage-N-bundle.md` and *prohibited* from reading raw upstream files except for explicit verification queries
- **Bundle sufficiency eval:** for each handoff bundle, the eval suite must show "Stage N+1 produces equivalent output from bundle alone vs. from raw directory" — if quality degrades, the bundle is under-specified
- **Per-stage cost budgets enforced in CI (R23 / §11):** `discover` p50 ≤30k, full `design` p50 ≤150k, p95 ≤220k. Run the 15-fixture suite per PR; block merge on budget violation
- **Subagent dispatch:** each stage runs as a bounded subagent with stitched context (v1.0.1 pattern, MRD §12 mitigation); the orchestrator doesn't carry every stage's context
- **Bundle versioning:** `.handoff/stage-N-bundle.md` has a schemaVersion; if a downstream stage expects v2 and gets v1, the workflow fails fast with a `migrate` suggestion
- **Cost telemetry telemetry:** run-log captures actual token counts per stage; p95 tail-cost reported separately from p50 (codex feedback §16 / §11)

**Warning signs:**
- Any stage workflow's source code that reads `design/research/interviews/*` or `design/wireframes/*/v*.excalidraw` directly (instead of via the handoff bundle)
- p95 cost ≥ 2× p50 — signals long-tail context inflation
- A stage's run-log shows >20k tokens of context loaded before the first generation call
- Users report "complete-design just stops in the middle of stage 4"
- A handoff bundle update breaks the downstream stage — sufficiency was incidental

**Phase to address:**
- **v1.5 infra:** define the `.handoff/stage-N-bundle.md` schema; ship the bundle-writer script; build the bundle-sufficiency eval harness
- **v2.0a:** Stage 1→2 and Stage 2→5a-lite handoff bundles, with sufficiency eval passing in CI
- **v2.0b:** Stage 2→3 and 3→4 and 4→5a handoff bundles (the dependency chain that's never been exercised before)
- **v2.0 RC:** p95 budget enforcement on 15-fixture suite; bundle sufficiency at all 5 stage transitions

---

### Pitfall 6: Determinism drift — "LLM picks, scripts emit" eroded in implementation

**What goes wrong:**
MRD P6 and R13 say *LLM picks, scripts emit*: `oklch.mjs`, `contrast.mjs`, `dtcg-lint.mjs`, `design-md-validate.mjs`, `state-machine-emit.mjs`. The whole trust posture (P3, P8, P14) and the Subframe lever depend on this. But:
- A developer under deadline lets the LLM "just emit the tokens directly" because the script is annoying to wire up
- A new script (`mermaid-emit.mjs`, `excalidraw-validate.mjs`) ships in v2.0b but is gated by an LLM "review" call — non-deterministic
- The golden test fixture passes once and then is never re-validated against drift; six months later it silently fails
- `complete-design verify --golden` is in CI but the golden has been regenerated from the latest run instead of from a frozen baseline
- LLM emits JSON that "almost" matches DTCG v2025.10, and the linter is too lenient

**Why it happens:**
- Determinism is invisible — when it works, no one notices; when it slips, the slippage is gradual
- Refactoring an LLM-emit to a script-emit is more work than the reverse, so refactors go the wrong direction
- DTCG / DESIGN.md / XState schemas evolve (v2025.10 → v2026.X); maintaining the linter is ongoing work
- Golden tests are brittle and tempting to "just regenerate" when they fail

**How to avoid:**
- **Architecture rule (non-negotiable):** every script under `assets/scripts/` is pure Node, no LLM calls. Reviews enforce this. PRs that import an LLM client in a script-emit file are rejected.
- **Golden test discipline:** the golden fixture is frozen at v1.5 GA; regenerating it requires a `golden-regenerate: <reason>` commit message + CODEOWNERS approval
- **Determinism CI gate:** `complete-design verify --golden` runs the full `design` workflow on the fixture 5 times; all 5 emit-script outputs must be byte-identical (LLM picks can vary; emit must not)
- **Schema-pinning:** DTCG v2025.10, DESIGN.md spec hash, XState v5 schema version are all pinned in `references/`; bump = explicit migration PR
- **`design-md-validate.mjs` strictness:** the validator rejects on *any* spec deviation, not just structural; the LLM cannot produce a "creative" DESIGN.md
- **Slop-detection as deterministic linter (v1.0.1 preserved):** `audit --slop-tells` runs as scripts on lints, not as LLM critique

**Warning signs:**
- Any file under `assets/scripts/` that imports `@anthropic-ai/sdk` or `openai` or similar
- `complete-design verify --golden` runs but the assertion is "outputs are similar" rather than "outputs are byte-identical"
- A PR commit message contains "regenerated golden" without a documented reason
- DTCG output that uses a feature not in v2025.10 (forward-compat creep)
- A user reports "the token output is different every run"
- Hash chain (`manifest.lock`) shows different hashes across runs of the same fixture

**Phase to address:**
- **v1.5 infra:** ship the `oklch.mjs`, `contrast.mjs`, `dtcg-lint.mjs`, `design-md-validate.mjs`, `state-machine-emit.mjs` scripts; lock golden fixtures; CI determinism gate
- **v2.0a:** New emit scripts (`tokens-emit.mjs`) inherit the architecture rule; golden updated to cover Stage 5a-lite output
- **v2.0b:** `mermaid-emit.mjs`, `excalidraw-validate.mjs`, `xstate-emit.mjs` added with the same discipline
- **v2.0 RC:** 5×-identical-output check across all 15 fixture runs; any non-determinism blocks GA

---

### Pitfall 7: Cost runaway — p95 tail-cost discipline

**What goes wrong:**
The cost budget (R23 / §11) is p50 ≤150k tokens for the full `design` workflow. But §11 codex feedback explicitly flagged that p50-only hides tail-cost reality. The risk:
- p50 hits ≤150k on the 15-fixture suite (which is curated) but p95 hits ≤300k on real user PRDs (which are messier)
- A single user with a 40k-token PRD blows the budget on Stage 0 ingest alone
- Stage 4 XState generation explodes when the LLM hallucinates additional states and self-corrects (multiple repair cycles)
- The `audit --all-stages` cross-stage workflow blows past budget on a project that's been using complete-design for months (deep `design/` directory)
- Indie users on Claude/Codex personal subscriptions see their billing spike; they uninstall and post negatively

**Why it happens:**
- LLM cost has long-tailed distributions — p50 is misleading
- The fixture suite represents well-formed inputs, not adversarial reality
- Repair loops (v1.0.1 max-2-repair pattern) can chain when validation is strict
- Token cost is invisible until the bill arrives

**How to avoid:**
- **Per-stage AND total budgets, p50 AND p95 (already in §11):**
  - p50 ≤150k / p95 ≤220k for full `design` workflow
  - Per-stage budgets enforced separately so one stage can't eat another's
  - Per-route budgets in the routing matrix (§3.4a) — design-bug route caps at 20k
- **Hard cost ceiling:** workflow asks user before exceeding stage budget by >20%; user can override with explicit confirmation, logged
- **Adversarial PRD eval:** the 15-fixture suite includes a deliberately messy 40k-token PRD; budget enforcement applies even there
- **Repair-loop cap (v1.0.1 preserved):** max 2 repair cycles; if validation still fails, return `FAILED_AFTER_REPAIR` rather than infinite loop
- **`--depth lightweight` mode (R7):** the cheapest path; should be the default suggestion for indie users
- **Budget-tier model option (v1.0.1):** Haiku/Sonnet/Opus tier choice; defaults Haiku for ingest, Sonnet for synthesis, Opus only when explicitly asked
- **Run-cost telemetry visible:** each workflow run prints token usage at the end; user knows what it cost

**Warning signs:**
- p95 cost more than 2× p50 (red flag for tail behavior)
- A single fixture run that exceeds budget by ≥50%
- Repair-loop count averaging ≥1.5 per stage (excessive retries)
- User complaints about "this got expensive"
- Telemetry shows `audit --all-stages` averaging >100k on real projects

**Phase to address:**
- **v1.5 infra:** cost-telemetry harness in the eval suite; budget-violation CI gate
- **v2.0a:** p50/p95 measurement enabled across all 4 v2.0a workflows; budget gate in CI
- **v2.0b:** Add Stage 3/4 budgets; the new stages are the highest-risk for tail cost (Crazy 8s, XState repairs)
- **v2.0 RC:** Year-1 target verification (p50 ≤120k, p95 ≤175k); adversarial PRD coverage

---

### Pitfall 8: Schema versioning without migration story

**What goes wrong:**
`persona.json`, `sitemap.json`, `MANIFEST.md`, state specs, `AUDIT-REPORT.md` all have schemas (R24, §16). The MRD calls these out as a v1.5 prerequisite — but versioning is more than "ship v1." When v2.0b ships and `sitemap.json` schema needs a new field for Stage 3 cross-references, existing user projects break.

**Why it happens:**
- "Versioned schema" gets implemented as `schemaVersion: 1` in frontmatter; the migration story is deferred
- v2.0b's new artifacts have implicit dependencies on Stage 1/2 schema shape that the original schema didn't know about
- Users who installed v2.0a now have `design/` directories with v1 schemas; on `complete-design update`, their projects don't upgrade
- A workflow update silently expects a field that v1 didn't have; runs fail with cryptic errors

**How to avoid:**
- **Migration scripts shipped with every schema bump:** `complete-design migrate --schema sitemap --from 1 --to 2` is mandatory tooling
- **Schema-version negotiation:** every gate runner reads `schemaVersion:` from frontmatter and refuses to run on unknown versions with a clear "run `migrate` first" error
- **Backward-compat policy:** schemas can only add optional fields within a major version; required-field additions require a major bump + migration
- **CI test for migration:** every schema bump PR must include a fixture with the prior version + assertion that `migrate` upgrades correctly
- **Deprecation window:** when v3 schema ships, v2 supported with deprecation warning for 1 minor release; v1 is removal-eligible

**Warning signs:**
- A schema PR that bumps `schemaVersion` without a migration script
- A user reports "ran `complete-design update`, now my project doesn't work"
- A v2.0b workflow that crashes on a v2.0a-generated `design/` because the schema differs
- Lack of fixtures covering "project initialized at vX, ran at vY"

**Phase to address:**
- **v1.5 infra:** ship `persona.json` / `sitemap.json` / `MANIFEST.md` / state-spec / `AUDIT-REPORT.md` as versioned schemas with explicit v1; ship the migration script template; ship a "v0 → v1 migration" fixture (even if v0 is hypothetical) to prove the harness works
- **v2.0a:** any schema change between v2.0a-beta and v2.0a-GA goes through migration
- **v2.0b:** v2.0a → v2.0b migration for sitemap.json (Stage 3 cross-refs), persona.json (Stage 4 interaction needs), MANIFEST.md (new artifact types) — *required* fixtures verifying upgrade
- **v2.0 RC:** documented migration matrix for every schema; CI ensures all listed migrations work

---

### Pitfall 9: GTM kill-risk — Anthropic ships a 5-stage equivalent first

**What goes wrong:**
MRD §12 names "Anthropic ships a 5-stage equivalent in Claude Design" as Medium-likelihood, **Existential** impact. Claude Design is exactly the right team to do this; they have distribution, training data, brand. If they ship `claude-design-stages` before complete-design GA, the wedge is gone.

**Why it happens:**
- The canonical 5-stage process is not proprietary IP — anyone can implement it
- Anthropic Labs ships fast; "the obvious next step from Claude Design" is the 5 stages
- The timeline (14 weeks to GA per MRD §10) is the window of vulnerability
- Designer trust in Anthropic is high; their brand executes the same wedge faster than complete-design's distribution

**How to avoid:**
- **Ship faster:** v2.0a (4 stages, weeks 1-8) is end-to-end usable on its own; do not wait for full v2.0 to start distribution
- **Differentiate on host-portability (MRD §12 mitigation):** complete-design runs on Cursor, Codex CLI, Junie, Copilot — Claude Design ships on Claude only. The portability story is non-overlapping.
- **Differentiate on cite-canon discipline:** Claude Design has a backlash issue (MRD §2.4 — "Cite every rule at granularity" was added because of Claude Design's failure). Lead with citation rigor and synthetic-persona red line.
- **Track Anthropic Labs weekly (MRD §12):** designated watcher monitors `anthropics/skills`, Anthropic blog, Claude Design release notes; if they ship competitive, the GTM artifact pivots to "interoperability with Claude Design" rather than displacement
- **DESIGN.md compliance and DTCG output:** make complete-design the *reference implementation* of these standards; even if Anthropic ships first, complete-design interoperates
- **Open-source license (Apache-2.0):** removes a moat Anthropic might choose not to cross; complete-design is the OSS canonical version
- **Brad Frost outreach (MRD §7.4):** intellectual heritage endorsement de-risks the "Anthropic owns the design conversation" framing

**Warning signs:**
- Anthropic Labs announces design-process improvements / multi-stage workflow in Claude Design
- A blog post or roadmap from Anthropic mentions "stages" or "Garrett" or "DESIGN.md authoring"
- An Anthropic skill package appears in `anthropics/skills` with research / IA / IxD scope
- Brad Frost or NN/g cite Claude Design rather than complete-design when discussing stage-aware AI tools

**Phase to address:**
- **v1.5 infra:** designated watcher process; v2.0a scope-cut readiness if shipping pressure rises
- **v2.0a:** shippable on its own (4 stages, end-to-end value) — do not wait for v2.0b for first distribution
- **v2.0b:** Lovable refugee path is unique to complete-design (Anthropic unlikely to ship `extract --reverse-engineer` from competitor outputs); double down here
- **v2.0 RC + GA:** rapid response plan if Anthropic announces overlap during the launch window

---

### Pitfall 10: Designer trust gap — perceived as "AI design tool"

**What goes wrong:**
MRD §2.4 is the trust-gap table; every line is a known designer objection to AI design tools. Even with every mitigation in place, complete-design can still be *perceived* as a slop-generator because the marketplace is full of bad faith AI design pitches. The result:
- Designers reject the tool on first read of the README
- Frontend Masters / Smashing Magazine / Brad Frost don't engage because they assume it's another GPT-wrapper
- The launch artifact (MRD §7.2) gets piled-on as "yet another AI design tool"
- Indie devs install the package but the *target* designer audience (Jordan in MRD §3.3) never adopts

**Why it happens:**
- The discourse around AI design is poisoned post-2025 vibe-coding backlash
- "AI design" framing is a known anti-pattern but the product is in fact AI-leveraging
- Designers have been burned by tools that promise process and deliver slop
- The synthetic-persona red line is a credibility play but is invisible until the user has tried Stage 1

**How to avoid:**
- **Position as "design-process facilitator," never "AI design tool" (MRD R14, P9, §2.4):** every README, tagline, marketplace listing, and outreach email
- **Lead with canon citation:** every example in marketing shows citations to Garrett / NN/g / WCAG / Radix — not "the AI suggested"
- **Show, don't tell (MRD §2.4):** preview/variants demo > prose pitch
- **Synthetic-persona red line is the headline (not the footnote):** demonstrate the hard-block in marketing materials; designers care
- **Brad Frost intellectual-heritage outreach (MRD §7.4):** before launch, before any marketing post
- **Cagan reframe (MRD §16):** complementary to build-to-learn discovery, not replacement; don't claim Cagan endorsement (codex called this out as not defensible)
- **Adversarial Frontend Masters / Smashing audit:** brief a designer-critic on the package pre-launch; surface "what would a hostile designer reviewer say?" and respond before launch
- **Never use the phrase "AI design":** package name (complete-design), all skill names, all docs avoid the term; "design-process," "stage-typed," "validation gates" are the vocabulary

**Warning signs:**
- Early user feedback contains "this is another GPT wrapper" or "AI design slop"
- A respected designer publishes a negative read on the launch artifact
- The launch post antagonizes Vercel/Anthropic specifically (codex flagged this in §16; the softened hook is the fix)
- README's first paragraph contains "AI" more than twice
- Outreach to Brad Frost / Marty Cagan does not land

**Phase to address:**
- **v1.5 infra:** README + marketplace copy written and reviewed for "AI design" framing; package name and all skill names finalized
- **v2.0a:** Marketing copy, README examples, demo videos all reviewed for trust-posture compliance
- **v2.0b:** Brad Frost outreach pre-launch; adversarial designer-critic audit
- **v2.0 RC:** Designer review acceptance (MRD §9.3 — ≥4 of 5 designers rate as "doing it properly, not Lovable shortcut")
- **GA:** Launch artifact published with softened hook ("The 5 design stages every AI tool skips — and why your prototype struggles past month 3"); cross-post manifest executed

---

### Pitfall 11: Process aversion — 5-stage discipline feels heavy; indie devs bail

**What goes wrong:**
MRD §12 names this High-likelihood, Medium-impact. The 5-stage process *is* heavier than `lovable.dev "build me a landing page"`. Indie devs are process-averse; if their first encounter with complete-design is "you must complete Stage 1 interviews before you can generate UI," they uninstall.

**Why it happens:**
- The wedge product (Lovable / v0) delivers instant gratification; complete-design deliberately doesn't
- The full `design` workflow at p50 ≤150k tokens / ≤8 minutes wall-clock is real friction
- Indie devs evaluating skills install 5-10 packages and try each for 60 seconds; complete-design looks slow

**How to avoid:**
- **Job-routing matrix (MRD §3.4a) IS the on-ramp:** 7 named routes; default is *not* "all 5 stages"
  - `design-bug` route: ≤20k tokens, single stage — the "60-second eval" entry point
  - `new-feature` route: ≤60k tokens, 3 stages — the moderate-commitment path
  - `design --route new-product` is the full path, explicit opt-in
- **Lightweight depth mode (R7):** every workflow supports `--depth lightweight` (~60 min total for full 5 stages per MRD persona Maya); make this the default for first run
- **First-touch UX optimization:** the very first `design` invocation should produce a usable artifact within 90 seconds; not a 30-minute interview
- **Skip-with-warning escape hatch:** every gate supports `USER_OVERRIDDEN` with logged rationale; designers can bail without losing work
- **The Lovable refugee path (v2.0b) as the indie on-ramp:** `audit --reverse-engineer-stages` runs against an existing prototype — instant value, no greenfield commitment
- **Documentation tone:** docs lead with "start with `design --route design-bug`," never "start with `design --route new-product`"
- **Telemetry-driven iteration post-launch:** which route do new installs use first? Optimize for that path

**Warning signs:**
- First-week retention <30% (proxy: skills.sh metric for "ran skill at least 3 times")
- User reports "I gave up after the questionnaire"
- Routing matrix telemetry shows `--route new-product` usage <10% of total
- Documentation analytics show users dropping at the "Stage 1 begins with interviews" section

**Phase to address:**
- **v1.5 infra:** routing matrix scaffolding; `--depth lightweight` plumbing
- **v2.0a:** 4 of the 7 routes implemented (`design-bug`, `new-feature` partial, `brand-refresh`, `PR audit`) — these are the on-ramps; full `new-product` path is the deepest commitment
- **v2.0b:** Remaining routes including `DS extraction (Lovable refugee)` — the highest-leverage on-ramp
- **v2.0 RC:** First-touch UX testing with 5+ indie devs

---

### Pitfall 12: XState v5 overfits engineering audience; designers can't read the canonical IxD artifact

**What goes wrong:**
MRD §3.22 + §9.2 + §16 + §13 Q2 — codex flagged that XState v5 as the primary IxD artifact alienates designers. The mitigation is: Mermaid stateDiagram-v2 is the designer-readable canonical artifact; XState is required only for components with async + ≥3 states + conditional transitions. This is the correct decision; the pitfall is *implementation drift away from it*.

**Why it happens:**
- XState is more "correct" engineering-wise; an enthusiast contributor may push to elevate it
- The XState code emitter is more sophisticated than the Mermaid emitter; the team puts more effort into XState
- Examples in docs lead with XState because it's the more "impressive" artifact
- The Stage 4 gate checks XState fidelity strictly but Mermaid only structurally; XState becomes the de facto canonical

**How to avoid:**
- **Designer-readable Mermaid as the canonical artifact:** the Stage 4 gate's `VALIDATED` check is the Mermaid stateDiagram-v2 + spec.md, not the XState machine
- **XState is conditional:** the gate triggers XState-required for async + ≥3 states + conditional transitions only; simpler components emit Mermaid + spec.md only
- **Documentation rule:** every Stage 4 example in docs leads with Mermaid; XState is the second example only
- **Mermaid renderer quality:** the Mermaid renderer must produce diagrams a designer would actually read — clear labels, no engineering jargon, layout coherence
- **Two-designer review (MRD §9.3):** explicitly ask "could you read the IxD output and understand the behavior?" — if XState is dominant, they say no
- **XState test gate is opt-in:** Stage 4 gate runs Mermaid validation always; XState validation only when XState is required by the gate trigger conditions

**Warning signs:**
- Documentation examples lead with XState
- Stage 4 gate triggers XState even for simple components (mis-triggered "required" condition)
- Designer review feedback: "I couldn't read the state machine output"
- The Mermaid renderer is under-tested vs. XState

**Phase to address:**
- **v1.5 infra:** Mermaid stateDiagram-v2 renderer with designer-readable layout
- **v2.0a:** N/A (Stage 4 not in v2.0a)
- **v2.0b:** Stage 4 gate prioritizes Mermaid; XState as the conditional secondary artifact; documentation examples lead with Mermaid; two-designer review asks the readability question
- **v2.0 RC:** Designer review feedback on Stage 4 output

---

### Pitfall 13: `style-lite` / `systematize-lite` claim full Stage 5a/5b gate completion (the v2.0a BLOCKER)

**What goes wrong:**
This is the **codex BLOCKER from §16**. The fix in §9.1 is `style-lite` / `systematize-lite` modes that emit `evidence: INFERRED` and explicitly do *not* claim `gate/stage-5a-complete`. The pitfall: sloppy implementation that uses the lite-mode artifact path but emits a `PASS` terminal state on the gate.

**Why it happens:**
- "It almost passes the gate" temptation under deadline
- The lite-mode labeling is a frontmatter convention; nothing inherently prevents the gate runner from claiming `PASS`
- A future maintainer who doesn't know the history removes the "lite" guardrail
- Marketing pressure: "v2.0a closes the design loop end-to-end" — almost true, but only with the asterisk

**How to avoid:**
- **The gate runner in v2.0a is hard-coded to refuse `PASS` for Stage 5a/5b:** `gate-stage-5a.mjs` checks for the presence of `design/interactions/<all-components>.spec.md`; in v2.0a, this directory doesn't exist, so the gate returns `not-runnable, reason: stage-4-artifacts-absent`. This is enforced in code, not honor system.
- **`evidence: INFERRED` is the only allowed value for v2.0a Stage 5a/5b output:** schema enforced
- **README + marketing language:** v2.0a is described as "the skeleton that produces *provisional* visual and DS artifacts; full Stage 5a/5b completion requires Stage 4 from v2.0b"
- **Test coverage:** v2.0a CI includes "assert `gate/stage-5a-complete` is `not-runnable`" — explicit
- **Migration story:** when v2.0b ships, users who ran v2.0a `style-lite` on a project can re-run with full Stage 4 and the gate flips to `PASS`; the lite artifacts are upgrade-able, not throwaway

**Warning signs:**
- A test where v2.0a `style-lite` output has `gate: stage-5a-complete, terminal-state: PASS`
- README copy claims "v2.0a is end-to-end design"
- Marketing materials show a Stage 5a output without the "lite" / "INFERRED" disclaimer
- A user assumes v2.0a's output is production-ready and ships it

**Phase to address:**
- **v1.5 infra:** gate runner architecture established with `not-runnable` terminal state available
- **v2.0a:** hard-coded refusal; CI test; documentation honesty — this is **the** v2.0a discipline
- **v2.0b:** lite artifacts upgrade-able to full when Stage 4 artifacts appear
- **v2.0 RC:** acceptance criteria explicitly tests "v2.0a output cannot claim full Stage 5a gate"

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Skipping schema versioning ("just ship v1") | Saves 2 days of migration tooling | First schema bump breaks every user's `design/` | **Never** for shipped artifacts; v1.5 infra phase explicitly requires versioning per §16 |
| Letting LLM emit DTCG JSON directly (skip `dtcg-lint.mjs`) | Faster initial workflow | Non-deterministic output; violates P6; trust-posture damage | Never; the entire Subframe-lever positioning depends on script emit |
| Reading raw `design/` directory in a workflow (skip handoff bundle) | Simpler stage workflow | p95 blows past 220k; v2.0b breaks at scale | Only in `audit --all-stages` where the cross-stage view is the point — and even then, bounded subagents |
| Generating Crazy 8s as 3 + 5 near-clones | Looks like 8 variants in output | Stage 3 gate's "≥3 alternatives" rule is vacuous; designer trust gap | Never; codex §16 explicitly flagged this — variants must pass low-fi diversity eval |
| `style-lite` claims `gate/stage-5a-complete` to look complete | v2.0a looks "done" | BLOCKER from codex; designer dishonesty | **Never**; this is the §16 BLOCKER |
| Trigger description over 200 chars on a skill | Better natural-language triggering in isolation | Aggregate metadata cap breach in real-world install state | Never; 200 chars is the cap per R15 |
| Skipping `audit --slop-tells` in CI | Faster CI | Slop ships to users; v1.0.1 trust posture eroded | Never; preserved from v1.0.1 |
| Letting users commit `research/interviews/` | Familiar git flow | PII risk; legal exposure | Never; gitignored by default |
| XState machine for every Stage 4 component | "More rigorous" output | Designer audience overfit per §16; XState is conditional | Never as default; required only for async + ≥3 states + conditional transitions |
| Hardcoding DTCG v2025.10 spec without schemaVersion field | Faster validator | Cannot migrate to v2026.X | Never; references/ pins are versioned |
| Synthetic personas labeled `VALIDATED` "just for demo" | Demo looks polished | Red line breach; gates lose meaning | Never; even demos use proto + ASSUMPTIONS.md |
| Skipping bundle-sufficiency eval for a stage | Faster ship | Stage degrades silently when raw-directory pattern is replaced | Acceptable only at v1.5 milestone with explicit follow-up gate |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| **Claude Code (host-first)** | Assume CLAUDE.md tool restrictions apply to skill execution | Skill execution honors host's tool gating; complete-design must call out which tools each workflow needs and degrade gracefully |
| **Codex CLI (sequential-fallback)** | Test only against Claude Code; assume Codex behaves identically | MRD §11 — cross-host pass rate within 0.10 of host-first; explicit Codex eval. Codex 2% cap is tighter than Claude. |
| **Cursor (sequential-fallback)** | Assume Cursor's MCP server install state is empty | Cursor users often have many MCPs; aggregate coexistence eval includes Cursor-typical configs |
| **Junie / Copilot (v2.1+ deferred)** | Promise v2.0 compatibility | Explicit "v2.1+" in marketing; do not test against these in v2.0 |
| **Notion MCP (Gaia Logic scope only per CLAUDE.md)** | Use Notion MCP outside Gaia Logic projects | MRD §4 + CLAUDE.md — Notion ingestion deferred to v2.1; even in v2.1, scope-respect Gaia Logic restriction |
| **Linear / Google Doc PRD ingestion** | Build now | Explicit v2.1 deferral per MRD §4 |
| **Dovetail / Notably transcripts** | Build the integration in v2.0 | Explicit v2.2 deferral per MRD §13 Q3 |
| **Storybook MCP** | Couple tightly to Chromatic's specific impl | Storybook 10.3 React-first; depends on Chromatic MCP stability; v2.1+ per MRD §13 Q7 |
| **Excalidraw JSON format** | Treat as opaque blob | It's MIT-licensed JSON; complete-design emits and validates it via script — `excalidraw-validate.mjs` |
| **DTCG v2025.10** | Forward-compat features (slip into v2026.X usage) | Spec-pin to v2025.10; bump = explicit migration PR |
| **Google DESIGN.md spec** | Author the spec ourselves | Cession in MRD §14 — Google owns; complete-design emits compliant output |
| **shadcn/ui** | Modify `components/ui/` files directly (per CLAUDE.md) | Wrap, don't modify; complete-design generates components into a parallel path or as wrappers |
| **Tailwind v4** | Assume v4 stable; use new features | Pinned reference in v2.0a `references/shadcn-tailwind-v4` |
| **XState v5** | Use v5-only patterns when v4 still common | v5 is the pinned reference; emit compatible code per stately schema |
| **GSD (within `.planning/`)** | Run Superpowers TDD outside GSD phases | CLAUDE.md GSD↔Superpowers tiebreaker — GSD owns `.planning/`; Superpowers within phases |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| **Raw-directory ingestion** at each stage | p95 cost > 2× p50; agent context-window errors | `.handoff/stage-N-bundle.md` per stage; bounded subagents | Stage 4+ on real projects (multiple months of design/ growth) |
| **Excalidraw bloat** from committing all variants | repo grows >100 MB in design/ | `.gitignore` rejected variants by default | Solo dev ships 3+ months of design work |
| **Concurrent `design/` writes from multiple agents** | merge conflicts, `.rej` files in `design/` | Per-stage owner field in frontmatter; `.gitattributes merge=ours`; CI manifest reconciliation | Team adoption (multiple PMs/designers/agents) |
| **XState machine repair loops** | Stage 4 cost spikes 3-4× expected | Max 2 repair cycles per v1.0.1 pattern; `FAILED_AFTER_REPAIR` terminal state | Components with non-trivial async behavior |
| **`audit --all-stages` on deep design/** | 100k+ tokens; slow wallclock | Bounded subagent dispatch; per-stage subaudits stitched | Projects > 3 months old |
| **Slop-tell detection as LLM critique** | Inconsistent results; high cost | `audit --slop-tells` runs deterministic linters (v1.0.1 pattern) | Any time slop-detection is treated as LLM-judgment |
| **Trigger metadata aggregation** | Skills fail to fire when other packages installed | 200-char descriptions; aggregate coexistence eval ≥0.80 | 5+ skill packages installed (typical power-user state) |
| **Repair loops on `dtcg-lint.mjs` failures** | Stage 5b cost explodes | Hard fail after 2 retries; emit `FAILED_AFTER_REPAIR` | LLM hallucinates DTCG syntax; happens regularly without script-emit |
| **15-fixture eval suite latency** | CI takes >30 min | Parallelize per-fixture; cache references/ corpus | When suite grows to 20+ fixtures |
| **`design --route new-product` full path** | 8 min wallclock; 150k tokens | Default to lightweight depth; explicit `--depth full` opt-in | Indie user runs full path on first try |

---

## Security Mistakes

Design-os is a skill package, not a service. The security surface is narrower than typical apps but specific.

| Mistake | Risk | Prevention |
|---|---|---|
| **Committing `research/interviews/*.transcript.md` with real participant PII** | PII breach; legal exposure; trust collapse | `.gitignore` by default; `complete-design scan --pii` pre-commit hook; explicit team-private mechanism documented |
| **Logging full `decision-log.jsonl` to a public repo** | Internal design rationale exposed | `.complete-design/private/` is gitignored per v1.0.1 commit policy |
| **Letting `--apply` write into git tree without diff review** | Unreviewed changes to design contract | Diff-by-default per MRD R14; `--apply` required; preview before commit |
| **Running `complete-design install --git-hooks` without showing what's installed** | Surprise hook installation; user loses control | `install` is opt-in, shows hook content, requires `--yes` confirmation |
| **Stage 5a generating components that bypass `components/ui/` (shadcn projects)** | CLAUDE.md violation: shadcn projects require wrappers | Stack adapter detects shadcn; generates wrappers only |
| **Raw transcript content sent to LLM during ingest** | PII leaves the user's machine to the LLM provider | Stage 0 ingest summarizes locally where possible; LLM-call content explicit and reviewable |
| **`run-log.jsonl` capturing full prompts including pasted secrets** | Secret leak via decision log | Log redaction filter (mask `*_KEY`, `*_SECRET`, `*_TOKEN` patterns); user-reviewable before any non-gitignored log persistence |
| **`complete-design update` running scripts from untrusted sources** | Supply chain | Package is Apache-2.0; updates go via host (Claude Code / Codex CLI / Cursor) skill-package install path; no autonomous network fetch |
| **MANIFEST.md trust** | Manifest references arbitrary paths | Manifest links validated against allow-listed `design/` paths only |
| **`audit --reverse-engineer` reading arbitrary repo content** | Reading auth modules, env files | Reverse-engineer scoped to UI surface (components/, app/, pages/); auth modules / RLS policies explicitly excluded per CLAUDE.md "never modify the auth module" rule |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---|---|---|
| **First-run shows a 5-stage interview wall** | Indie dev uninstalls in 60 sec | Suggest `--route design-bug` or `--route new-feature` for first run; full route is opt-in |
| **Gate refusal without remediation steps** | User stuck; "your stage failed, fix it" with no actionable guidance | Each gate failure emits a `repair recipe` per v1.0.1 §6.4 — specific files to add / change |
| **Stage 1 demands real interviews before allowing any progress** | User has no interviews and cannot proceed | `--proto-mode` works; emits `PROTO` grade with ASSUMPTIONS.md; user proceeds with explicit hypothesis-grade warning |
| **Wireframe variants all look the same** | Stage 3 feels like ceremony | Diversity eval enforced; Crazy 8s must pass low-fi diversity metric (codex flagged this) |
| **Hi-fi output uses "AI design" aesthetic (gradients, glass, Inter)** | Designers reject as slop | `audit --slop-tells` runs as part of Stage 5a; rejects on detection |
| **WCAG claim "compliant"** | Frontend Masters / a11y community pile-on | Per P8: report measured contrast, never "compliant" — output is "contrast 4.7 (passes AA at 4.5)" |
| **Output looks like Lovable** | Differentiation invisible; segment migration fails | Variant diversity ≥0.5 (v1.0.1 metric); two-reviewer forced-choice ≥2/3 variants viable |
| **No partial-output recovery** | User loses 30 min of work on a crash | R25 / §11 — interrupt-and-resume from any stage; partial outputs usable standalone; scripted test |
| **Synthetic-persona warnings are quiet** | User doesn't realize their personas aren't validated | Loud `PROTO` banners on every downstream artifact; ASSUMPTIONS.md prominently emitted |
| **Override capture (`USER_OVERRIDDEN`) too easy** | Users override gates without understanding cost | Override requires explicit rationale; downstream artifacts carry an override banner |
| **`--apply` accidentally writes** | Unreviewed changes in git tree | Default is diff; `--apply` is explicit; never the default |
| **Confusing the routing matrix** | User picks wrong route; wastes 60k tokens | Orchestrator suggests route based on repo signals + asks confirmation per §3.4a |

---

## "Looks Done But Isn't" Checklist

Things that *look* like v2.0a / v2.0b is complete but aren't — verify these explicitly before phase transitions.

- [ ] **Trigger metadata fits Codex 2% cap in isolation:** OK, but verify aggregate coexistence eval ≥0.80 with 5+ packages installed
- [ ] **`style-lite` workflow runs end-to-end:** OK, but verify it emits `not-runnable` for `gate/stage-5a-complete` and `evidence: INFERRED` for the artifact
- [ ] **Stage 1 gate emits `PASS` on a project with personas:** OK, but verify it emits `PROTO_PASS_WITH_WARNINGS` if any persona has `provenance: generated` and no linked interview transcripts
- [ ] **`design/` directory is created on first run:** OK, but verify `.gitignore` and `.gitattributes` are also installed and reject committing `research/interviews/`
- [ ] **DTCG output validates:** OK, but verify it's byte-identical across 5 runs of the same input (determinism)
- [ ] **Stage 3 wireframes are Excalidraw JSON:** OK, but verify the validator rejects color/font drift (try to inject some via prompt)
- [ ] **Stage 5a generates hi-fi components:** OK, but verify it refuses (in v2.0b) if `design/interactions/<component>.spec.md` is missing
- [ ] **`audit --all-stages` runs:** OK, but verify it uses bounded subagents and doesn't exceed context budget on a deep `design/`
- [ ] **All 7 routes are listed in docs:** OK, but verify each route is actually implemented and the orchestrator suggests them based on repo signals
- [ ] **15-fixture eval suite passes:** OK, but verify p95 cost ≤220k (not just p50 ≤150k)
- [ ] **`skillgrade` per-skill recall ≥0.85:** OK, but verify aggregate coexistence eval ≥0.80
- [ ] **Schemas are versioned:** OK, but verify migration scripts exist and pass for v0→v1 and v1→v2 transitions
- [ ] **Crazy 8s generates 8 variants:** OK, but verify they pass the low-fi diversity eval (not 3 + 5 clones)
- [ ] **Stage 4 emits XState machine:** OK, but verify Mermaid stateDiagram-v2 is also emitted and is treated as canonical for designers
- [ ] **README avoids "AI design":** OK, but also verify all 22 skill names + all 8 marketplace listings + all 3 launch hooks comply
- [ ] **Synthetic-persona red-line test passes:** OK, but verify prompt-injection canary also passes (LLM refuses when asked nicely to lie)
- [ ] **`design --route new-product` works:** OK, but verify a fresh indie user starts with `--route design-bug` or `--route new-feature`, not the full path
- [ ] **`audit --reverse-engineer-stages` works on a Lovable export:** OK, but verify it infers `INFERRED` grade and emits ASSUMPTIONS.md for everything it didn't see direct evidence for
- [ ] **PII scanner catches obvious cases:** OK, but verify it runs as a pre-commit hook (not just manually)
- [ ] **`MANIFEST.md` is generated:** OK, but verify it stays in sync — CI manifest reconciliation passes
- [ ] **Determinism golden tests pass:** OK, but verify the golden is frozen at v1.5 GA and any regeneration is flagged in git history
- [ ] **Two-designer review at v2.0 RC:** OK, but verify *which* designers (one B2B, one consumer per §3.22) and ≥4 of 5 rating
- [ ] **Brad Frost outreach drafted:** OK, but verify it lands before GA, not after
- [ ] **Anthropic Labs is monitored weekly:** OK, but verify a named owner is assigned and the watchpoint is in `.planning/` or equivalent

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| **Codex 2% cap breach (aggregate)** | MEDIUM | (1) Audit which skills are firing falsely / not firing; (2) Truncate descriptions for atoms first (workflows take priority); (3) If still failing, split into `complete-design-core` + `complete-design-atoms` packages per MRD §12 mitigation |
| **Synthetic-persona red line breach in shipped version** | HIGH | (1) Patch release with deterministic gate fix; (2) Audit all `decision-log.jsonl` entries from prior runs for `USER_OVERRIDDEN` Stage 1 grades; (3) Notify affected users; (4) Public post explaining the fix (trust recovery) |
| **Fidelity-cap leak (color in wireframes)** | MEDIUM | (1) Patch the Excalidraw validator; (2) Re-run `audit --slop-tells` on affected projects; (3) Document the leak case in slop-tell library |
| **`design/` PII leak (committed transcript)** | HIGH | (1) `git rm` + force-push (irreversible with rewrite); (2) Notify affected participants per GDPR if applicable; (3) Patch `.gitignore` defaults; (4) Pre-commit hook for PII detection |
| **Context-window blowout shipped** | MEDIUM | (1) Identify which stage exceeds budget; (2) Patch the workflow to use handoff bundle; (3) Add the failing fixture to eval suite |
| **Determinism slip (LLM emitting tokens directly)** | LOW (if caught early) / HIGH (if shipped wide) | (1) Refactor the offending workflow to use scripts; (2) Re-run golden tests; (3) Add architecture rule to CI (linter rejects LLM imports in `assets/scripts/`) |
| **Cost overrun shipped** | MEDIUM | (1) Patch with `--depth lightweight` default; (2) Add adversarial PRD to fixture; (3) Public communication if user bills affected |
| **Schema migration broken** | HIGH | (1) Ship migration patch; (2) Document manual fallback; (3) Pin schema version in references/ until migration validated |
| **Anthropic ships competitive product** | HIGH (existential) | (1) Pivot GTM messaging to "interoperability with Claude Design"; (2) Double down on host-portability (Cursor/Codex/Junie); (3) Lean into Lovable refugee path (Anthropic unlikely to ship this); (4) Brad Frost endorsement for OSS canonical positioning |
| **Designer trust collapse (slop accusations)** | HIGH | (1) Designer-critic audit; (2) Public response addressing specific critiques; (3) Lean into citation rigor + synthetic-persona red line in marketing |
| **Indie users bail on first run** | MEDIUM | (1) Audit routing matrix telemetry; (2) Make `--route design-bug` the first-touch default; (3) Reduce lightweight depth wallclock to ≤2 min for first run |
| **XState dominates over Mermaid in Stage 4** | MEDIUM | (1) Refactor gate to prioritize Mermaid; (2) Re-shoot Stage 4 demo videos with Mermaid lead; (3) Update docs |
| **`style-lite` claims `gate/stage-5a-complete`** | HIGH (codex BLOCKER) | (1) Patch the gate runner with `not-runnable` enforcement; (2) Audit shipped runs; (3) Re-test the v2.0a acceptance suite |

---

## Pitfall-to-Phase Mapping

How roadmap phases address each pitfall.

| # | Pitfall | Prevention Phase | Verification |
|---|---|---|---|
| 1 | Trigger metadata aggregate cap | **v1.5 infra** (eval harness) → **v2.0 RC** (≥0.80 enforced) | Aggregate coexistence eval in CI with 5+ packages installed |
| 2 | Synthetic-persona red line breach | **v1.5 infra** (schemas + gate runner) → **v2.0a** (gate + adversarial test) → **GA** (100/100 red-line) | Adversarial test: synthetic-only data → assert gate blocks; prompt-injection canary; provenance propagation test |
| 3 | Fidelity-cap leakage | **v1.5 infra** (validators) → **v2.0a** (`style-lite` honesty + color-leak test) → **v2.0b** (Stage 4 gate enforcing state-maps; Stage 5a refusal without state-maps) | Adversarial tests in §9.3: 100% reject styled wireframes, 100% refuse Stage 5a without state-maps, 100% reject Stage 5b below ≥3× |
| 4 | `design/` hygiene rot | **v1.5 infra** (`.gitignore` + `.gitattributes` + PII scanner + frontmatter validator + manifest reconciler + schemas) | PII scanner pre-commit hook; manifest CI; frontmatter validator |
| 5 | Context-window blowout | **v1.5 infra** (handoff bundle schema + writer + sufficiency eval) → **v2.0a/b** (per-transition bundles) → **v2.0 RC** (p95 budget enforcement) | Bundle sufficiency eval at every stage transition; p95 ≤220k on 15-fixture suite |
| 6 | Determinism drift | **v1.5 infra** (emit scripts + golden + architecture rule) → ongoing in each phase | 5×-identical-output check; linter rejects LLM imports in `assets/scripts/` |
| 7 | Cost runaway (p95 tail) | **v1.5 infra** (telemetry) → **v2.0a/b** (per-stage budgets) → **v2.0 RC** (p95 enforcement) | p50/p95 budgets per stage; adversarial PRD in fixture |
| 8 | Schema versioning / migration | **v1.5 infra** (versioned schemas + migration template) → **v2.0a/b** (migrations on every schema bump) | Migration fixture per schema bump; CI test |
| 9 | Anthropic ships first (GTM kill-risk) | **v1.5 infra** (watcher process) → **v2.0a** (ship as standalone value) → **GA** (rapid-response plan) | Weekly Anthropic Labs monitoring; v2.0a shippable independently |
| 10 | Designer trust gap | **v1.5 infra** (copy review) → **v2.0a/b** (compliance) → **v2.0 RC** (designer review) → **GA** (Brad Frost outreach) | "AI design" framing absent from README + skills + marketplaces + hooks; designer review ≥4/5 |
| 11 | Process aversion (indie bail) | **v1.5 infra** (routing scaffolding) → **v2.0a** (4 routes shipped) → **v2.0b** (Lovable refugee path) → **v2.0 RC** (first-touch UX testing) | Routing telemetry post-GA; first-touch usability with 5+ indies |
| 12 | XState overfit | **v1.5 infra** (Mermaid renderer) → **v2.0b** (Stage 4 gate prioritizes Mermaid) → **v2.0 RC** (designer review of IxD output) | Designer review: "could you read the state machine?" ≥4/5 |
| 13 | `style-lite` claims full gate (codex BLOCKER) | **v1.5 infra** (gate runner architecture) → **v2.0a** (hard-coded refusal + CI test) | CI test: `gate/stage-5a-complete` returns `not-runnable` in v2.0a; `evidence: INFERRED` enforced |

---

## Pitfalls Surfaced Beyond MRD §12 / §16

The MRD's risks table (§12) and codex acceptance record (§16) are comprehensive but focus on shipping-blockers. This research extends with operational pitfalls the MRD treats as solved but that are easy to regress:

- **Aggregate trigger-metadata cap** (Pitfall 1) — MRD R15 has the eval; this pitfall is the *operational reality* of regression once complete-design grows or competitors ship overlapping packages
- **Provenance propagation across artifacts** (Pitfall 2) — MRD §3.22 has evidence grades on artifacts but does not explicitly require *downstream* artifacts to inherit worst-case provenance; this is a leak path
- **`style-lite` enforcement vs. labeling** (Pitfall 13) — MRD §9.1 fixes the BLOCKER by *labeling*; this pitfall demands the labeling be *enforced in code*
- **Handoff bundle sufficiency** (Pitfall 5) — MRD §3.6 introduces the bundle but does not require sufficiency eval; without it, the bundle could be too thin and Stage N+1 quality degrades silently
- **Schema migration story** (Pitfall 8) — MRD §16 + R24 list versioned schemas as a v1.5 prerequisite but do not name migration scripts; this pitfall adds the migration tooling requirement
- **PII pre-commit hook** (Pitfall 4) — MRD §3.6 gitignores transcripts; this pitfall extends with a scanner that *catches* a user trying to commit a transcript anyway
- **Determinism architecture rule** (Pitfall 6) — MRD P6 / R13 say "LLM picks, scripts emit"; this pitfall hardens with a CI linter that rejects LLM-client imports inside `assets/scripts/`
- **Override banner propagation** (Pitfall 2 + 13) — MRD §3.22 captures `USER_OVERRIDDEN` rationale in decision log; this pitfall adds a *visible banner* on every downstream artifact so reviewers see the override
- **First-touch UX optimization** (Pitfall 11) — MRD §3.4a routing matrix is the on-ramp; this pitfall demands that first-run telemetry verify the on-ramp actually works
- **XState/Mermaid documentation ordering** (Pitfall 12) — MRD §16 fixed XState dominance in the spec; this pitfall extends to *documentation example ordering* (lead with Mermaid)

---

## Sources

- **Primary:** complete-design-mrd-v2.md (§2.4 trust gap, §3.4a job-routing matrix, §3.6 design/ governance, §3.22 stage gates + evidence grades, §3.23 fidelity caps, §5 trigger discipline, §9.1 v2.0a style-lite BLOCKER fix, §9.3 acceptance criteria, §11 success metrics with p95 + coexistence eval, §12 risks table, §13 open questions, §16 codex acceptance record — all 21 v2.0 findings + 69 cumulative)
- **Primary:** .planning/PROJECT.md (R1-R26 requirements; key decisions table)
- **Codebase context:** CLAUDE.md (`/Users/pilawski/.claude/CLAUDE.md`) — stack architecture, Memory MCP scope, Notion Gaia Logic scope, shadcn rules, universal "never do" list, test/refactoring discipline
- **Domain literature (referenced in MRD §19):** Garrett *Elements of UX* 2e; NN/g *Synthetic Users* 2024 + *State of UX 2026*; ACM Interactions synthetic-user people-pleasing 2026; arXiv *Whose Personae?* Dec 2025; Frost *AI and Design Systems* course; Sourcetoad 1,645-app Lovable security audit; 2025 Stack Overflow 80/20 wall finding; Buxton *Sketching User Experiences*; Klement JTBD format; W3C DTCG v2025.10; Google DESIGN.md spec
- **Skill-package ecosystem:** agentskills.io v1 spec stabilized 2025-12-18; Codex 2% trigger cap behavior; skill-coexistence patterns from frontend-design, GSD, Superpowers, shadcn, Notion-MCP installs
- **Confidence:** HIGH — every pitfall traces to either an explicit MRD risk/finding, a stated codex review concern, or a category-specific failure mode in the SKILL.md / LLM-tooling domain. Confidence is HIGH because the MRD itself has been through 4 codex review passes (69 cumulative findings, all accepted) and represents an unusually mature pre-build artifact.

---
*Pitfalls research for: complete-design v2.0 (SKILL.md package operationalizing the canonical 5-stage design process)*
*Researched: 2026-05-24*
