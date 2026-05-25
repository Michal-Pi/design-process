---
name: "design-os/structure"
description: "Design IA: generate 2-5 LATCH-diverse sitemap variants, pick one, emit one Mermaid flowchart per job story, run Stage 2 gate"
stage: 2
gate: "gate/stage-2-complete"
artifacts:
  reads:
    - "design/.handoff/stage-1-bundle.md"
  writes:
    - "design/ia/sitemap.json"
    - "design/ia/flows/*.flow.mmd"
    - "design/.handoff/stage-2-bundle.md"
composition:
  atoms:
    - "ia/sitemap-variants"
    - "ia/flows-from-jobs"
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

# structure — Stage 2 Information Architecture Workflow

Runs the full Stage 2 IA workflow: LATCH-diverse sitemap generation, user selection,
per-JTBD Mermaid flowcharts, FID-02 enforcement, and Stage 2 gate evaluation.

**Fidelity discipline (FID-02):** Stage 2 is structure only. No colors, fonts, or
visual styling allowed in sitemap nodes or Mermaid flows. Any styling detected is
rejected by the gate as a BLOCKER. Text labels and hierarchy only.

**Trust posture:** Stage 2 evidence is always `proto` in v2.0a. `VALIDATED` grade
requires tree-test results from the `ia/tree-test-design` atom (v2.1).

**User decision required:** After generating sitemap variants, the workflow halts and
presents variants to the user for selection. Execution cannot continue without a pick.

---

## Procedure

**1. Read stage-1 handoff bundle**

Read `design/.handoff/stage-1-bundle.md`. If absent, halt with message:
"Run the `discover` workflow first to generate the Stage 1 handoff bundle."

Extract from the bundle:
- `artifactsInventory`: list of JTBD files (paths matching `research/jobs/*.jtbd.md`)
- `provenanceWorstCase`: propagate to sitemap frontmatter
- `goalAndScope`: context for navigation structure decisions

**2. Load LATCH reference**

Read `references/rosenfeld-ia.md` for the LATCH taxonomy:
- **L**ocation, **A**lphabetical, **T**ime, **C**ategory, **H**ierarchy
Each sitemap variant must use a different LATCH scheme. Consult this reference
before generating to ensure schemes are grounded in Rosenfeld's definitions.

**2a. Token budget pre-check (F-09)**

If `assets/scripts/cli/budget-check.mjs` exists:
```bash
node bin/design-os.mjs budget-check --stage structure --check pre
```
If the script is absent (ships in Plan 02-03), skip with warning:
"Budget pre-check skipped — budget-check.mjs not yet available."

**2b. Depth dispatch (F-07)**

Check for `--depth` flag:
- `--depth lightweight`: skip TRUST-05 intake; generate 2 variants (category + hierarchy);
  no diversity regeneration; proceed directly to step 4.
- `--depth full`: generate 5 variants; diversity check with ≥2 regeneration attempts;
  full TRUST-05 intake (all 3 questions required).
- Default (`--depth standard` or no flag): TRUST-05 intake (3 questions);
  generate 2-5 variants; 1 diversity regeneration attempt if any pair scores < 0.3.

**3. TRUST-05 intake (standard and full depth only)**

Before generating anything, ask the user these questions. Do NOT generate until
all 3 answers are received:

(a) "How many top-level sections should the product have? (3-7 is typical)"
(b) "Is this a content-heavy product (Time or Category LATCH) or a task-heavy product (Hierarchy)?"
(c) "Any navigation constraints? (e.g., mobile-first, single-page, wizard flow)"

Record all answers. They ground variant generation and prevent generic archetypes.

**4. Inline ATOM-05: Generate sitemap variants (ia/sitemap-variants)**

Using the stage-1 bundle JTBDs, personas, and TRUST-05 answers:
- Generate 2-5 LATCH-diverse sitemap variants (count per --depth dispatch).
- Each variant uses a different LATCH scheme (never repeat).
- Each variant covers all JTBDs from the stage-1 bundle — every JTBD slug must
  appear as a substring of at least one node label (case-insensitive).
- **FID-02 enforcement:** Text labels and hierarchy only. No `color`, `font`,
  `backgroundColor`, `fontFamily`, `fontSize`, or any visual styling field on any node.
  The gate rejects styling as a BLOCKER — not a warning.

Diversity check: if any two variants share the same LATCH scheme OR score
`sitemapStructuralDistance < 0.3`, regenerate the less structurally diverse one.
(1 regeneration attempt for --depth standard; 2 for --depth full.)

Validate each variant against `schemas/dist/sitemap.v1.json`:
```bash
node bin/design-os.mjs validate --artifact sitemap --file <path>
```

**5. Present variants for user selection**

Present variants as a numbered list. For each variant, show:
- Variant number (1, 2, 3...)
- LATCH scheme name
- List of top-level section labels
- 1-sentence rationale for this organizational scheme

Example:
```
1. Category scheme
   Sections: Browse, Checkout, Profile, Help
   Rationale: Groups content by functional purpose — works well for
   task-driven products where users know what they want to do.

2. Hierarchy scheme
   Sections: Products > Categories > Items > Actions
   Rationale: Reflects the product's object model — works well when
   users need to understand relationships between content types.
```

Halt with message: "Please select a sitemap variant (enter the number) to proceed."
Do NOT continue until the user makes a selection.

**6. Stage to preview area**

Write the selected variant to `.design-os/preview/run-<timestamp>/sitemap.json`
(the staging area per D-52). Do NOT write to `design/ia/sitemap.json` yet —
that happens in step 12 after the user confirms.

**7. Inline ATOM-06: Generate Mermaid flows (ia/flows-from-jobs)**

For each JTBD in the stage-1 bundle:
- Generate one Mermaid `flowchart TD` diagram.
- Format: text nodes only. No `style`, `fill`, `color`, `stroke` directives.
  Good: `A[Start: Add to cart] --> B{Has account?}`
  Bad: `A[Start]:::myStyle` or `style A fill:#ff0000`
- Write to `design/ia/flows/<jtbd-slug>.flow.mmd` in the preview staging area.

**8. Validate Mermaid flows**

For each generated `.flow.mmd` file, attempt render:
```bash
node bin/design-os.mjs mermaid-render --input <path>.flow.mmd --output /dev/null
```

If validation fails, attempt up to 2 LLM repair cycles:
- Show the mermaid-render error message to the LLM context.
- Ask for a corrected version of the specific flow.
- Validate again.

If still invalid after 2 repair cycles, halt with:
"Mermaid flow for <jtbd-slug> could not be repaired after 2 cycles.
Error: <render error>. Please manually fix or simplify the flow and re-run."

**9. Run Stage 2 gate**

```bash
node bin/design-os.mjs gate --stage 2 --design-dir design/
```

Gate outcomes:
- `not_runnable`: sitemap or flow files not yet in `design/ia/` (expected before --apply).
  Proceed — this is normal at the preview stage.
- `pass_with_warnings`: expected outcome; surface all findings to the user for review.
  The proto evidence grade warning is always present (no tree-test in v2.0a).
- `failed_after_repair`: halt immediately. Surface all BLOCKER findings.
  Do NOT copy files to `design/ia/` until the gate passes.

**10. Build stage-2 handoff bundle**

```bash
node bin/design-os.mjs handoff-bundle-build --stage 2 --design-dir .design-os/preview/run-<timestamp>/
```

**11. Reconcile MANIFEST.md**

```bash
node bin/design-os.mjs manifest-md-reconcile --design-dir design/
```

**12. Present diff and await --apply**

Show a diff summary of all files staged in `.design-os/preview/run-<timestamp>/`:
- `sitemap.json`: selected variant with node count + LATCH scheme
- `ia/flows/`: list of flow files + JTBD names

Prompt: "Review the sitemap and flows above. Run with `--apply` to copy to `design/ia/`."
Do NOT write to `design/ia/` until the user confirms with `--apply`.

**13. Token budget post-check (F-09)**

If `assets/scripts/cli/budget-check.mjs` exists:
```bash
node bin/design-os.mjs budget-check --stage structure --check post
```
If absent, skip with the same warning as step 2a.

---

## Host fallback

For Codex CLI / Cursor (no subagent dispatch — sequential single-context execution):

Run steps 1-12 sequentially in a single context window. Replace all `node bin/design-os.mjs`
invocations with:
- Gate: `node assets/scripts/cli/gate.mjs` is registered via Commander — always use
  `node bin/design-os.mjs gate --stage 2 --design-dir design/` (the dispatcher).
- Validate: `node bin/design-os.mjs validate --artifact sitemap --file <path>`

The sub-agent sitemap generation (step 4) and flow generation (step 7) are inlined in
this context. If context window is at risk, truncate sitemap variant rationale to 2 words
each and omit step 11 (MANIFEST reconciliation). Core steps 1-9 are non-negotiable.
