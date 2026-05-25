---
name: "design-os/ia/sitemap-variants"
description: "Generate 2-5 LATCH-diverse sitemap JSON variants from JTBD corpus; no styling fields (FID-02)"
stage: 2
mvp: true
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
---

# sitemap-variants — ATOM-05: LATCH-Diverse Sitemap Generator

Generates 2-5 LATCH-diverse sitemap variants from the Stage 1 JTBD corpus.
Each variant uses a distinct LATCH organizational scheme.

**FID-02:** Stage 2 is structure only. No colors, fonts, or styling fields on any
sitemap node. Text labels and hierarchy relationships only.

**Evidence grade:** Always `proto` in v2.0a. Tree-test results required for `validated`.

---

## Standalone bootstrap

When invoked directly (without a stage-1 bundle or prior context):

Ask the user these minimum questions before generating:
1. "What product are we mapping navigation for? Describe it in 2-3 sentences."
2. "What are the 3-5 primary user tasks (jobs-to-be-done) the navigation must support?"
3. "How many top-level sections feels right? (3-7 is typical)"

Do not generate sitemap variants until all 3 answers are received. The answers
replace the JTBD corpus that the `discover` workflow normally provides.

---

## Workflow procedure

Steps for invocation from within the `structure` workflow:

**1. Read JTBDs**

Primary source: parse `artifactsInventory` from `design/.handoff/stage-1-bundle.md`.
Extract all entries with paths matching `research/jobs/*.jtbd.md`.
Fallback: glob `design/research/jobs/*.jtbd.md` directly.

Extract the JTBD slug from each filename (e.g., `checkout.jtbd.md` → slug `checkout`).
These slugs must appear in at least one node label across all sitemap variants.

**2. Load LATCH reference**

Read `references/rosenfeld-ia.md` for the five LATCH organizational schemes:
- **Location**: geography, physical space, or map-based grouping
- **Alphabetical**: A-Z listing (works well when users know what they're looking for)
- **Time**: chronological order, history, recent-first
- **Category**: topical grouping by subject or function (most common)
- **Hierarchy**: organizational depth, parent-child relationships, object model

Each variant in this atom must use a different LATCH scheme.

**3. Generate sitemap variants**

For each variant:
- Choose a distinct LATCH scheme not used by other variants.
- Create `nodes` array. Each node must have:
  - `id`: unique string identifier (kebab-case, e.g., `checkout`, `search-results`)
  - `label`: human-readable section name (Title Case)
  - `parent`: (optional) id of the parent node
  - NO `color`, `font`, `backgroundColor`, `fontFamily`, `fontSize`, `fill`, `stroke`,
    or any visual styling field. The gate rejects these as FID-02 BLOCKER violations.
- Ensure every JTBD slug from step 1 is represented in at least one node `label`
  (case-insensitive substring match). The gate checks JTBD coverage.
- Every non-root node must have exactly one parent. Nodes with no parent and no
  children are "orphans" — the gate flags these as a WARNING.

Example (Category scheme):
```json
{
  "id": "v1-category",
  "scheme": "category",
  "nodes": [
    { "id": "home", "label": "Home" },
    { "id": "browse", "label": "Browse", "parent": "home" },
    { "id": "checkout", "label": "Checkout", "parent": "home" },
    { "id": "profile", "label": "Profile", "parent": "home" }
  ]
}
```

**4. Propagate worst provenance**

Read `provenanceWorstCase` from the stage-1 bundle frontmatter.
Set `worstProvenance` in the sitemap JSON frontmatter to this value.

**5. Validate each variant**

Validate the complete sitemap JSON against `schemas/dist/sitemap.v1.json`:
```bash
node bin/design-os.mjs validate --artifact sitemap --file <path>
```

If validation fails, fix the schema errors before proceeding. The most common
errors: missing required fields (`artifact`, `stage`, `schemaVersion`, `sourceHash`,
`generated`, `provenance`, `owner`, `lastReviewedAt`, `variants`) or extra styling
fields on nodes.
