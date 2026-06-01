---
name: "complete-design/systematize"
description: "Systematize-lite: scan Stage 5a tokens for component candidates, emit provisional DESIGN.md (evidence:INFERRED); Frost ≥3× deferred to v2.0b"
stage: "5b"
gate: "gate/stage-5b-complete"
artifacts:
  reads:
    - "design/.handoff/stage-5a-bundle.md"
    - "design/tokens.json"
  writes:
    - "design/DESIGN.md"
    - "design/.handoff/stage-5b-bundle.md"
composition:
  atoms: []
mvp: true
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
  - Bash
---

# systematize — Stage 5b-lite Systematize Workflow

Runs the Stage 5b-lite systematize workflow: scan Stage 5a `design/tokens.json` for component
candidates, emit a provisional `design/DESIGN.md` (Google DESIGN.md spec, April 2026),
and validate it with the Stage 5b gate.

**Note (Stage 5b-lite, v2.0a):** This workflow operates entirely on Stage 5a token data.
No Stage 3 (Excalidraw), Stage 4 (XState/Mermaid stateDiagram-v2), or Phase 3 artifacts are
required or referenced. The DESIGN.md is derived from tokens alone.

**Lite-mode contract (D-44, D-51, D-52):**
- DESIGN.md is labeled `evidence: INFERRED` — it is provisional, not validated.
- Frost ≥3× recurrence enforcement is deferred to Phase 3 (v2.0b). In v2.0a, the gate
  records the component count and notes the deferral without blocking on recurrence.
- All writes stage to `.complete-design/preview/` first. `--apply` required to write to `design/`.

**v2.0a expected gate result:** `pass_with_warnings, evidence: proto` — this is correct.
Full `pass` requires Phase 3 Stage 4 artifacts (Frost ≥3× verification).

---

## Procedure

1. **Read stage-5a handoff bundle.** Read `design/.handoff/stage-5a-bundle.md`. If absent,
   fall back to reading `design/tokens.json` directly. If neither file exists, halt:
   > "Run the `style` workflow first to generate `design/tokens.json`."

2. **Pre-check token budget.** Report the systematize budget before proceeding:
   ```
   Bash: node bin/complete-design.mjs budget-check --stage systematize --check pre
   ```
   The systematize budget is p50 ≤40k tokens (D-49). This is an informational check only;
   it exits 0 and does not block at the pre-check step.

3. **Load DESIGN.md reference.** Read `${CLAUDE_SKILL_DIR}/references/design-md.md` (Google DESIGN.md spec,
   April 2026). This defines required sections and frontmatter fields.

3a. **`--depth` dispatch (F-07):**
   - If `--depth lightweight`: skip TRUST-05 intake (steps 4a/4b); use defaults (tone:
     conversational, no existing component names). Proceed directly to step 5.
   - If `--depth full`: expand component scan to also read `design/ia/` artifacts for naming
     hints (sitemap node names may match component names); expand rationale sections.
   - Default (`--depth standard`): 2 questions (steps 4a/4b), standard component scan.

4. **TRUST-05 intake (standard/full only).** Ask EXACTLY these 2 questions. Do NOT emit
   DESIGN.md until the user responds:

   (a) "Are there any existing design system component names to preserve?
       List them (e.g., 'Button, InputField, Card') or type 'none'."

   (b) "What is the intended tone for the design rationale?
       Options: formal/technical, conversational/team-facing, or brief/bullet-points"

   Wait for user response. Parse answers before proceeding to step 5.

5. **Component scan.** Read `design/tokens.json`. Identify all component-tier token keys —
   these are the named keys under the top-level `"component"` group in the DTCG JSON body.

   Example: `{ "component": { "button": {...}, "input": {...}, "card": {...} } }`
   → component names: `button`, `input`, `card` (componentCount = 3)

   **D-44 threshold:** ≥1 appearance qualifies in v2.0a-lite. Record `componentCount`.
   If `componentCount === 0`, note: "No component-tier tokens found. DESIGN.md will be emitted
   with a stub Component decisions section. Add tokens under 'component' group in tokens.json
   to register promoted components."

   If user provided existing component names in step 4a, reconcile with found tokens (prefer
   user-supplied names; flag any mismatch for the user to resolve).

6. **Emit `design/DESIGN.md`.** Write the DESIGN.md to the staging area:
   `.complete-design/preview/run-<timestamp>/DESIGN.md`

   The DESIGN.md must conform to the Google DESIGN.md spec (April 2026). Required structure:

   **Frontmatter:**
   ```yaml
   ---
   name: "<product/feature name from PRD or user-supplied>"
   tokens: <token count estimate — use 5000 as default>
   version: "2026.04"
   $extensions:
     complete-design:
       evidence: "INFERRED"
       stage: "5b-lite"
       generatedBy: "complete-design/systematize"
       componentCount: <N>
       frostNote: "Frost ≥3× recurrence not yet verified — Phase 3 (v2.0b)"
   ---
   ```

   **Required body sections (Markdown):**

   ```markdown
   ## Typography rationale

   <Summarize font family, weight, and size decisions from tokens.json.
   Reference the fontFamily and fontSize tokens from the primitive tier.>

   ## Color system rationale

   <Summarize primary, background, foreground, and semantic color decisions from tokens.json.
   Report measured WCAG 2.2 AA contrast ratios. Never claim compliance — report measurements.
   Example: "Primary (#oklch value): WCAG 2.2 AA contrast 4.7:1 against background (pass threshold 4.5:1).">

   ## Spacing rationale

   <Summarize spacing scale from tokens.json (primitive.spacing tier).
   Describe the base unit and scale multipliers.>

   ## Component decisions

   <List each promoted component with a 1-sentence rationale.
   For each component found in the component tier of tokens.json:
   - **<ComponentName>**: Promoted from component tier (≥1 appearance in Stage 5a output, v2.0a threshold).
     Token coverage: background, foreground, border-radius (or whichever tokens are present).
   
   If componentCount === 0: "No component-tier tokens found. Add component tokens to tokens.json
   for component promotion. Frost ≥3× recurrence tracking ships in Phase 3.">
   ```

   Tone: apply the user's choice from step 4b (formal/technical vs. conversational/team-facing).

7. **Validate DESIGN.md.** Confirm the emitted DESIGN.md passes the schema validator:
   ```
   Bash: node bin/complete-design.mjs design-md-validate --file .complete-design/preview/run-<timestamp>/DESIGN.md
   ```
   If validation fails:
   - Attempt one LLM repair cycle: re-read the error, fix the specific failing field(s), re-emit.
   - If repair fails a second time, halt: "DESIGN.md schema validation failed after 1 repair
     attempt. Failing field(s): <errors>. Please review ${CLAUDE_SKILL_DIR}/references/design-md.md for schema details."
   - Maximum 1 repair cycle (D-52 trust posture: do not silently loop).

8. **Update tokens.json component tier (if needed).** If user provided component names in
   step 4a that are NOT yet in `design/tokens.json`'s component tier, add stub entries:
   ```json
   "component": {
     "<UserComponentName>": {
       "background": { "$type": "color", "$value": "oklch(60% 0.15 260)" },
       "foreground": { "$type": "color", "$value": "oklch(10% 0.0 0)" }
     }
   }
   ```
   Then re-emit tokens.json to the staging area via tokens-project.mjs.

9. **Post-check token budget.** Check usage after DESIGN.md emit:
   ```
   Bash: node bin/complete-design.mjs budget-check --stage systematize --check post
   ```
   If this exits 1 (exceeded 2× p50 = 80k tokens hard-stop), inform user:
   > "Token usage exceeded 80k (2× p50). Re-run with --continue-anyway to proceed."

9.5. **Stage recurrence evidence.** Before invoking the gate, copy the upstream wireframe
    and interaction evidence files from `design/` into the staged preview directory so that
    the Frost recurrence scan (`gate-stage-5b.mjs`) can find them:
    ```
    Bash: node bin/complete-design.mjs stage-recurrence-evidence \
      --source-design-dir design/ \
      --staged-dir .complete-design/preview/run-<timestamp>/
    ```
    where `<timestamp>` is the run-id from step 6.

    **Why:** The gate runs against the staged path (INVARIANT-01). Without this step,
    only `tokens.json` and `DESIGN.md` are present in the staged dir — `wireframes/`
    and `interactions/` are absent. `countComponentRecurrences()` scores every component
    at 0 and returns a false-positive `frost-recurrence-not-met` BLOCKER even when
    the source `design/` has ample upstream Frost evidence. This step copies only
    `wireframes/**/*.excalidraw` and `interactions/*.spec.md` — the two file types
    consumed by the Frost scan — without touching `design/` directly.

    If `design/wireframes/` and `design/interactions/` do not yet exist (v2.0a lite
    users who have not yet run Stages 3–4), the command exits cleanly with
    `skippedDirs: ["wireframes", "interactions"]` — the gate then proceeds with 0
    component occurrences, which triggers the Frost BLOCKER only if component-tier
    tokens exist in `tokens.json`. This is the correct behavior: a user who has not
    run Stages 3–4 cannot promote components.

10. **Gate invocation.** Run the Stage 5b gate against the **staged preview path** (not `design/`).
    Use the run-id captured in step 6:
    ```
    Bash: node bin/complete-design.mjs gate --stage 5b --design-dir .complete-design/preview/run-<timestamp>/
    ```
    where `<timestamp>` is the run-id captured when the staged output was written in step 6.

    **Why staged path:** The gate must evaluate the output that will be applied — evaluating
    `design/` at this point would check a stale or empty directory, letting malformed staged
    output bypass the gate (see codex review finding F-01 pattern across structure/style/systematize).

    **Expected result: `pass_with_warnings, evidence: proto`** — this is the CORRECT v2.0a result.

    Surface the gate output to the user. If any `failed_after_repair` findings are returned,
    surface the specific finding IDs and messages; do NOT proceed to step 11 until resolved.

    If `pass_with_warnings` returned, confirm:
    > "Stage 5b gate: pass_with_warnings (evidence: proto). This is the correct v2.0a result.
    > Full Stage 5b (Frost ≥3× verification + complete Stage 4 artifacts) ships in v2.0b."

11. **Build handoff bundle.** Write the stage-5b handoff bundle:
    ```
    # Create body file with stage-5b summary
    Bash: echo "<summary of DESIGN.md sections, component names, and lite-mode caveats>" > /tmp/stage-5b-body.md
    ```
    Then:
    ```
    Bash: node bin/complete-design.mjs handoff-bundle \
      --from 5a \
      --to 5b \
      --design-dir design/ \
      --body-file /tmp/stage-5b-body.md
    ```

12. **Update MANIFEST.md.** Reconcile the design directory manifest after writing DESIGN.md:
    ```
    Bash: node bin/complete-design.mjs manifest-md --design-dir design/
    ```

13. **Present staged artifacts and await --apply.** Show the staged artifacts in
    `.complete-design/preview/run-<timestamp>/`:
    - `DESIGN.md` (Google DESIGN.md spec, evidence:INFERRED)
    - Updated `tokens.json` (if component tier was updated in step 8)

    Summarize key decisions:
    - Component names promoted
    - Typography, color, spacing rationale summary
    - Gate result: `pass_with_warnings, evidence: proto`

    If user approves with `--apply`:
    ```
    Bash: node bin/complete-design.mjs apply --design-dir design/
    ```

    **Completion message** (required per D-51 trust posture):
    > "Systematize-lite complete. `design/DESIGN.md` and `design/tokens.json` are labeled
    > `evidence: INFERRED`. This is a provisional design spec derived from Stage 5a token
    > data alone. Full Stage 5b (Frost ≥3× recurrence verification, complete component
    > system) ships in v2.0b (Phase 3). Do not treat this as a final design spec."

---

## Host fallback

For **Codex CLI** and **Cursor** (no subagent dispatch — sequential path, D-53):

Run each step above as direct Bash commands. The `node bin/complete-design.mjs` dispatcher
handles all subcommands. No parallel subagent dispatch is used — steps execute one at a time.

**Step 7 (validation):** If `node bin/complete-design.mjs design-md-validate --file ...` is not
available, validate manually: open the emitted DESIGN.md and confirm `name`, `tokens`, and
`version: "2026.04"` are present in the frontmatter, and `evidence: "INFERRED"` is set under
`$extensions.complete-design`.

**Step 10 (gate):** Run the gate against the staged preview path (not `design/`):
`node bin/complete-design.mjs gate --stage 5b --design-dir .complete-design/preview/run-<timestamp>/`
using the run-id captured in step 6. Expected output: `{ kind: 'pass_with_warnings', evidence: 'proto' }`.

**Codex CLI note:** Use `--depth lightweight` to skip TRUST-05 intake (steps 4a/4b) when
context is limited. Token budget stays within the systematize p50 ≤40k limit with 2 questions
omitted; the DESIGN.md will use sensible defaults for tone and component naming.

**Cursor note:** The `manifest-md` step (step 12) requires Bash access; if Cursor's Bash
tool is unavailable, skip it — the manifest will be reconciled on the next `complete-design init`
or next workflow run.
