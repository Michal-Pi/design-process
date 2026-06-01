---
name: "complete-design/research/personas-proto"
description: "Generate 2-3 proto-personas using Indi Young thinking-style format; always provenance:generated; ASSUMPTIONS.md required"
stage: 1
mvp: true
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
---

# personas-proto — ATOM-03: Proto-Persona Generator

Generates proto-personas using Indi Young thinking-style format. Always emits
`provenance: generated` — synthetic personas are never VALIDATED grade.
`ASSUMPTIONS.md` is a required co-artifact documenting every claim to validate.

**FID-01:** Solution references (screens, buttons, modals, features) are removed
from persona content. Stage 1 is problem-space only.

---

## Standalone bootstrap

When invoked directly (without a stage-0 bundle or prior context):

Ask the user these minimum questions before generating:
1. "What product are we designing? Describe it in 2-3 sentences."
2. "What user problems does it solve? Give the top 2-3 pain points."
3. "Who uses it? Name 2-3 user types even if rough."

Proceed only after receiving answers. Do not generate personas from silence.

---

## Workflow procedure

Steps for invocation from within the `discover` workflow:

**1. Check for existing personas**

Read `design/ASSUMPTIONS.md` if it exists. If existing personas are present in
`design/research/personas/`, append to them rather than replacing — unless explicitly
instructed to regenerate.

**2. Load persona format reference**

Read `${CLAUDE_SKILL_DIR}/references/indi-young-thinking-styles.md` to ground the persona structure.
Each persona requires three thinking-style fields:
- `cognitiveSpace`: how they mentally organize and process their domain
- `emotionalReactions`: feelings evoked by the problem space
- `guidingPrinciples`: behavioral heuristics that drive their decisions

**3. Generate proto-personas**

Generate 2-3 personas. Each persona must:
- Be named with a descriptive archetype label (e.g., "The Sprint Planner")
- Include `cognitiveSpace`, `emotionalReactions` (array), `guidingPrinciples` (array)
- Include at least 1 JTBD (job-to-be-done) in Klement format
- Be grounded in the intake answers — not generic archetypes

**4. Write persona files**

Write each persona to `design/research/personas/<slug>.persona.json` with YAML frontmatter:

```
---
artifact: persona
stage: "1"
schemaVersion: 1
provenance: generated
worstProvenance: generated
generated: <ISO datetime>
owner: <project owner or 'complete-design/discover'>
lastReviewedAt: <ISO datetime>
sourceHash: sha256:<hash of content>
---
{
  "name": "<archetype label>",
  "jobsToBeDone": ["<JTBD 1>", "<JTBD 2>"],
  "thinkingStyle": {
    "cognitiveSpace": "<cognitive framing>",
    "emotionalReactions": ["<reaction 1>", "<reaction 2>"],
    "guidingPrinciples": ["<principle 1>", "<principle 2>"]
  }
}
```

**5. Write ASSUMPTIONS.md**

Write `design/ASSUMPTIONS.md` listing every specific claim made about each persona:

```markdown
# ASSUMPTIONS.md

All claims below are unvalidated hypotheses derived from synthetic research.
Validate with real user interviews before upgrading evidence grade.

## The Sprint Planner
- [ ] Prioritizes visibility of cross-team dependencies (INFERRED from problem framing)
- [ ] Uses manual status aggregation today (INFERRED from pain-point description)
```

**6. FID-01 enforcement**

Scan generated persona content for solution-language patterns. If any of the
following appear: "button", "modal", "screen", "UI", "app feature", "dashboard",
"navigation", "click", "tap", "swipe", "interface element" — remove them and
document the removal:
"FID-01: Removed solution reference '[term]' from [persona name] — Stage 1 is problem-space only."
