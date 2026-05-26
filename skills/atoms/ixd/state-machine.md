---
name: "design-os/ixd/state-machine"
description: "Stage 4 atom: invoke state-machine-emit to produce Mermaid stateDiagram-v2 (always) and conditional XState v5 machine, with max-2-retry repair on validation failure."
type: atom
stage: 4
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
  - Bash
references:
  - "@references/xstate-v5.md"
---

# Atom: ixd/state-machine — ATOM-10

Given a `<screen>.spec.md`, invoke `state-machine-emit` to produce the Mermaid stateDiagram-v2
canonical artifact and (conditionally) an XState v5 machine.

## Procedure

Given a screen name and a completed `.spec.md` in the staged output:

1. **Invoke state-machine-emit:**
   ```bash
   node bin/design-os.mjs state-machine-emit \
     --spec .design-os/preview/<run-id>/interactions/<screen>.spec.md \
     --output .design-os/preview/<run-id>/interactions/ \
     --screen <screen>
   ```

2. **Check exit code:**
   - Exit 0: Success. Both `.diagram.mmd` and (if triggered) `.machine.ts` are written.
   - Exit 1: Error (bad spec path, parse failure). Fix the spec and retry.
   - Exit 2: Repair needed. Mermaid validation failed.

3. **Repair loop (max 2 retries, exit code 2 only):**
   When the script exits with code 2:
   a. Read the validation error from stderr.
   b. Correct the state transitions in the spec (or fix the state names for consistency).
   c. Re-run step 1 with the corrected spec.
   d. If validation fails a third time, surface the error to the user — do not retry further.

4. **Confirm staged outputs:**
   - `.design-os/preview/<run-id>/interactions/<screen>.diagram.mmd` — always present after success
   - `.design-os/preview/<run-id>/interactions/<screen>.machine.ts` — present only if D-57 conditions met:
     `asyncOperations:true AND stateCount≥3 AND hasConditionalTransitions:true`

## D-57 XState Trigger (for reference)

XState is emitted IFF all three frontmatter fields in `.spec.md` are:
- `asyncOperations: true`
- `stateCount: ≥3`
- `hasConditionalTransitions: true`

For static screens (forms with no conditional branches, info pages), XState is intentionally
skipped — Mermaid stateDiagram-v2 is sufficient.

## Output

After this atom completes, the staged `interactions/` directory contains:

```
.design-os/preview/<run-id>/interactions/
  <screen>.spec.md          # State catalog (from state-catalog atom)
  <screen>.diagram.mmd      # Mermaid stateDiagram-v2 (always)
  <screen>.machine.ts       # XState v5 (conditional, D-57)
  <screen>-patterns.md      # Pattern variants (from pattern-variants atom)
```
