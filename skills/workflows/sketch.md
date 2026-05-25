---
name: "design-os/sketch"
description: "Stage 3: Generate ≥8 divergent wireframe concepts via Crazy 8s, converge on 1 with CHOICE.md. Excalidraw JSON emitted by script — never hand-built."
type: workflow
stage: 3
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
    - ".design-os/preview/<run-id>/stage-2-bundle.md"
  writes:
    - ".design-os/preview/<run-id>/wireframes/<screen>/skeleton-ir.json"
    - ".design-os/preview/<run-id>/wireframes/<screen>/v1.excalidraw"
    - ".design-os/preview/<run-id>/wireframes/<screen>/CHOICE.md"
cost:
  token_budget_p50: 25000
  token_budget_p95: 40000
  cost_code: COST-03
---

# sketch — W3 Stage 3 Low-Fidelity Wireframe Workflow

Generates ≥8 structurally-diverse wireframe concepts for a screen, converges to one
chosen variant via CHOICE.md, and validates the result with the Stage 3 gate.

**Fidelity constraint (FID-03):** All wireframes are strictly lo-fi. No colors, no fonts
other than Virgil (fontFamily: 1), no styling. The Excalidraw emitter enforces this.

**Script discipline (INVARIANT-05):** The LLM never writes raw Excalidraw element JSON.
Wireframes are described as skeleton IR objects and converted by `excalidraw-render.mjs`.

**Staged path (INVARIANT-01):** All outputs go to `.design-os/preview/<run-id>/` first.
The user explicitly runs `--apply` to commit to `design/`.

---

## Procedure

**Step 1: Read Stage 2 handoff bundle**

Read the Stage 2 → 3 handoff bundle from the staged path:

```
.design-os/preview/<run-id>/stage-2-bundle.md
```

Extract the list of screens and the chosen sitemap variant from
`artifactsInventory`. Identify the screen to wireframe in this session.

**Step 2: Run the Crazy 8s atom — produce 8 skeleton IR variants**

Follow `skills/atoms/lowfi/crazy-eights.md` (ATOM-08) to produce 8 skeleton IR objects,
each representing a structurally distinct layout approach for the target screen.

Emit the skeleton IR to:

```
.design-os/preview/<run-id>/wireframes/<screen>/skeleton-ir.json
```

The IR array must contain exactly 8 objects. Each must use a distinct layout axis
(card-list, hero+CTA, table, sidebar+content, bottom-nav, wizard, split-pane, dashboard).

**Step 3: Emit Excalidraw files from skeleton IR**

```bash
node bin/design-os.mjs excalidraw-render \
  --input .design-os/preview/<run-id>/wireframes/<screen>/skeleton-ir.json \
  --output .design-os/preview/<run-id>/wireframes/<screen>/ \
  --screen <screen>
```

Produces `v1.excalidraw` through `v8.excalidraw` in the screen directory.

**Step 4: Run Stage 3 gate (first pass — FID-03 + diversity check)**

```bash
node bin/design-os.mjs gate --stage 3 --staged .design-os/preview/<run-id>/
```

Expected outcomes:
- `pass`: proceed to Step 5.
- `not_runnable` (FID-03 violation): the emitter produced non-default colors/fonts.
  This should not happen if Step 3 used `excalidraw-render.mjs` correctly.
  Re-examine the skeleton IR and re-run Step 3.
- `failed_after_repair` with `3-diversity-001`: variants are too similar.
  Re-run Step 2 (crazy-eights) with more layout diversity, then Step 3.

The gate does NOT check CHOICE.md on this pass (CHOICE.md is absent — that is expected).
The gate will return `failed_after_repair` with `3-choice-001` — that is the expected
state before Step 5.

**Step 5: Run the Converge atom — produce CHOICE.md**

Follow `skills/atoms/lowfi/converge.md` (ATOM-09) to select one wireframe variant.

Emit CHOICE.md to:

```
.design-os/preview/<run-id>/wireframes/<screen>/CHOICE.md
```

**Step 6: Re-run Stage 3 gate to confirm CHOICE.md present**

```bash
node bin/design-os.mjs gate --stage 3 --staged .design-os/preview/<run-id>/
```

Expected outcome: `pass`. If still `failed_after_repair/3-choice-001`, verify the
CHOICE.md path matches `wireframes/<screen>/CHOICE.md`.

**Step 7: Build Stage 3 → 4 handoff bundle**

```bash
node bin/design-os.mjs handoff-bundle \
  --from 3 --to 4 \
  --staged .design-os/preview/<run-id>/
```

**Step 8: Surface diff and await user `--apply`**

Surface the file diff showing all new `.excalidraw` files and the CHOICE.md.
Do NOT write to `design/` until the user explicitly runs `--apply` (INVARIANT-02).

---

## INVARIANTS

- **INVARIANT-01:** Gate always runs against `.design-os/preview/<run-id>/`.
  Never run `gate --stage 3 --dir design/` — that gates AFTER the fact.
- **INVARIANT-02:** `--apply` is required. Auto-publishing to `design/` is forbidden.
- **INVARIANT-04:** This SKILL.md description is ≤200 characters (enforced by skillgrade CI).
- **INVARIANT-05:** `excalidraw-render.mjs` has no LLM imports. It is a pure transform.

---

## References

- @references/buxton-sketching.md — low-fi sketching as ideation discipline
- @references/sprint-crazy-eights.md — Crazy 8s rapid divergence method
- @references/shape-up-pitches.md — fat-marker sketches as appetite-bounded scope
