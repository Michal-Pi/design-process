---
name: "complete-design/interact"
description: "Stage 4: Enumerate loading/empty/error/success states per screen, map interaction patterns (Tidwell/APG), emit Mermaid stateDiagram-v2 + conditional XState v5."
type: workflow
stage: 4
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
  - Bash
artifacts:
  reads:
    - design/ia/sitemap.json
    - .complete-design/preview/<run-id>/stage-3-bundle.md
    - design/wireframes/*/CHOICE.md
  writes:
    - .complete-design/preview/<run-id>/interactions/<screen>.spec.md
    - .complete-design/preview/<run-id>/interactions/<screen>.diagram.mmd
    - .complete-design/preview/<run-id>/interactions/<screen>.machine.ts (conditional)
references:
  - "@${CLAUDE_SKILL_DIR}/references/saffer-microinteractions.md"
  - "@${CLAUDE_SKILL_DIR}/references/tidwell-patterns.md"
  - "@${CLAUDE_SKILL_DIR}/references/hax-18.md"
  - "@${CLAUDE_SKILL_DIR}/references/xstate-v5.md"
  - "@${CLAUDE_SKILL_DIR}/references/apg.md"
---

# W4: Interact — Stage 4 Interaction Design

Stage 4 enumerates UI states per screen, maps interaction patterns from canonical sources
(Tidwell, APG, Material 3), and produces a Mermaid stateDiagram-v2 as the designer-readable
canonical artifact. XState v5 machines are emitted conditionally (D-57 only).

## FID-04 Constraint

**Do NOT produce hi-fi interaction specs.** No color, no typography, no shadow specifications.
The Mermaid stateDiagram-v2 is the designer-readable canonical artifact. XState is the dev
artifact — emitted only when `asyncOperations:true AND stateCount≥3 AND hasConditionalTransitions:true`.
Violating FID-04 blocks the Stage 4 gate.

## Budget

≤30k tokens p50 (COST-04, D-66). Stage is bounded by state-catalog depth × screen count.
Do not enumerate more than 8 states per screen; add a `custom` type for screen-specific states.

## Procedure

1. **Read Stage 3 handoff bundle:**
   ```
   Read .complete-design/preview/<run-id>/stage-3-bundle.md
   ```
   Extract: screen list from sitemap, CHOICE.md selections, skeleton IR outputs.

2. **For each screen in sitemap.json, run the `ixd/state-catalog` atom:**
   ```
   Run complete-design/ixd/state-catalog atom for <screen>
   ```
   This produces `<screen>.spec.md` with YAML frontmatter including `asyncOperations`,
   `stateCount`, `hasConditionalTransitions`, and `states[]` array with required types.

3. **Map interaction patterns for each screen:**
   ```
   Run complete-design/ixd/pattern-variants atom for <screen>
   ```
   Produces `<screen>-patterns.md` with 3 candidate patterns from Tidwell/APG/Material 3.

4. **Emit state machine artifacts for each screen:**
   ```bash
   node bin/complete-design.mjs state-machine-emit \
     --spec .complete-design/preview/<run-id>/interactions/<screen>.spec.md \
     --output .complete-design/preview/<run-id>/interactions/ \
     --screen <screen>
   ```
   - Always produces `<screen>.diagram.mmd` (Mermaid stateDiagram-v2)
   - Conditionally produces `<screen>.machine.ts` (XState v5) per D-57 trigger

5. **Validate Mermaid output — max-2-retry repair loop:**
   If the script signals `repair-needed` (exit code 2), the Mermaid diagram failed validation.
   Correct the state transitions based on the validation error message and re-run step 4.
   **Maximum 2 retries.** If the third attempt fails, surface as a blocker to the user.

6. **Run Stage 4 gate:**
   ```bash
   node bin/complete-design.mjs gate --stage 4 --design-dir .complete-design/preview/<run-id>/
   ```
   Gate checks: (a) sitemap coverage, (b) loading/empty/error/success states present,
   (c) no open transitions. Fix any BLOCKER findings before proceeding.

7. **Build Stage 4→5a handoff bundle:**
   ```bash
   node bin/complete-design.mjs handoff-bundle --from 4 --to 5a --staged .complete-design/preview/<run-id>/
   ```

8. **Surface diff and await `--apply`:**
   ```bash
   node bin/complete-design.mjs diff --staged .complete-design/preview/<run-id>/
   ```
   Present the diff to the user. Wait for explicit `--apply` confirmation before writing to `design/`.

## INVARIANTS

- **INVARIANT-01:** Gate runs against `.complete-design/preview/<run-id>/` — never against `design/` directly.
- **INVARIANT-02:** `--apply` is required; never auto-write to `design/`.
- **INVARIANT-05:** No LLM calls inside `assets/scripts/`. Only the SKILL.md workflow body makes LLM choices.

## HAX-18 Note

If any screen has `asyncOperations:true` (AI product, data fetching, or ML-powered feature),
read `@${CLAUDE_SKILL_DIR}/references/hax-18.md` and cite relevant HAX-18 guidelines (G1, G7, G16) in the spec body.
The Stage 4 PR detector (`stage-4-pr.mjs`) flags missing HAX-18 citations as `4-pr-hax18-001`.
