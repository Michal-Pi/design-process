---
name: "complete-design/lowfi/converge"
description: "ATOM-09: Select one wireframe variant from Crazy 8s candidates; emit CHOICE.md with rationale and rejected-variant list."
stage: 3
type: atom
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
---

# converge — ATOM-09: Wireframe Convergence to CHOICE.md

Given ≥3 screened wireframe variants from `.complete-design/preview/<run-id>/wireframes/<screen>/`,
selects the single best variant and emits CHOICE.md.

---

## Standalone bootstrap

When invoked directly (without sketch workflow context):

Ask the user:
1. "Which screen are we converging on? (e.g., 'dashboard', 'checkout')"
2. "What is the primary task this screen must enable?"
3. "Which variants exist? (list filenames: v1.excalidraw … vN.excalidraw)"

---

## Workflow procedure

**1. Read available variants**

List all `.excalidraw` files in:
```
.complete-design/preview/<run-id>/wireframes/<screen>/
```

Each file is a variant produced by the crazy-eights atom.

**2. Evaluate each variant against the user task**

For each variant, assess:
- **Navigation clarity:** Is the primary user task immediately surfaced?
- **Information hierarchy:** Does the most important content get visual priority?
- **Cognitive load:** Is the layout scannable? Does it avoid forcing the user to read left-to-right?
- **Layout fit for the JTBD:** Does the structural pattern match how users think about the task?

Do not default to v1. Review all variants impartially.

**3. Select one variant**

Choose the variant that best serves the primary JTBD identified from the Stage 2 handoff bundle.

Your choice should reflect layout reasoning, not preference for a particular visual style
(since all variants are structurally identical at this fidelity).

**4. Emit CHOICE.md**

Write to:
```
.complete-design/preview/<run-id>/wireframes/<screen>/CHOICE.md
```

Required structure:

```markdown
---
artifact: wireframe-choice
stage: 3
schemaVersion: 1
---

## Selected Variant

<selected-filename> (e.g., v3.excalidraw)

## Rationale

<Two or more specific layout reasons for this selection. Reference named elements from
the IR — e.g., "sidebar navigation surfaces all JTBD entry points persistently (F4),
while the content pane provides context without navigation context-switching.">

## Rejected Variants

| Variant | Why Eliminated |
|---------|----------------|
| v1.excalidraw | <specific reason referencing a layout weakness> |
| v2.excalidraw | <specific reason> |
| ... | ... |
```

**Requirements:**
- `## Selected Variant` must name the exact filename (e.g., `v3.excalidraw`)
- `## Rationale` must cite ≥2 specific layout reasons (not vague: "looks cleaner")
- `## Rejected Variants` must list all non-selected variants with specific dismissal reasons
- Do not use generic praise ("most polished", "better design") — cite structural reasons

**5. Verification**

After emitting, confirm the gate passes:
```bash
node bin/complete-design.mjs gate --stage 3 --design-dir .complete-design/preview/<run-id>/
```

The gate checks `wireframes/**/CHOICE.md` exists. If the CHOICE.md path is correct,
the gate should return `pass`.

---

## CHOICE.md provenance

The CHOICE.md carries the executor's judgment. Per INVARIANT-03, it must NOT be set to
`evidence: validated` — the evidence grade is always `proto` until a human reviews.

The gate does not enforce provenance on CHOICE.md (it only checks presence), but
downstream humans and the AUDIT workflow will expect `proto` grade.
