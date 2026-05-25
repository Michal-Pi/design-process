---
name: "design-os/research/synthesize"
description: "Synthesize JTBDs from persona thinking-styles; write synthesis.md with worstProvenance from cited personas (D-38)"
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

# synthesize — ATOM-02: Research Synthesizer

Synthesizes JTBDs from persona thinking styles and OST. Writes `design/research/jobs/`
JTBD files and `design/research/synthesis.md` with `worstProvenance` propagated from
the worst provenance of all cited personas (D-38).

---

## Standalone bootstrap

When invoked directly (without prior persona or OST files):

Ask the user:
1. "Describe the user archetype you want to synthesize JTBDs for."
2. "What cognitive space does this user operate in? (how they think about their problem)"
3. "What are their 2-3 guiding principles? (behavioral heuristics)"

If `design/research/personas/` exists, read those files instead of asking.

---

## Workflow procedure

Steps for invocation from within the `discover` workflow:

**1. Read source files**

Read all files matching `design/research/personas/*.persona.json`. For each persona,
extract: name, `thinkingStyle`, `jobsToBeDone` (if already populated), `provenance`.

Read `design/research/ost.mmd` if it exists — use the tactics as JTBD candidates.

**2. Load JTBD format reference**

Read `references/klement-jtbd.md` for the Klement JTBD statement format:
"When I [situation/context], I want to [motivation/goal], so I can [expected outcome]."

**3. Derive JTBDs**

For each persona, derive 1-2 JTBDs. Each JTBD must:
- Be grounded in the persona's `thinkingStyle.cognitiveSpace` and `guidingPrinciples`
- Use the Klement three-part format
- Reference the persona's name in a comment or attribution line
- Be solution-agnostic (no UI or feature references — FID-01)

Example JTBD (The Overloaded IC):
"When I am starting a new task, I want to surface relevant context automatically,
so I can spend cognitive energy on the task rather than on context reconstruction."

**4. Write JTBD files**

Write each JTBD to `design/research/jobs/<persona-slug>-<jtbd-n>.jtbd.md`:

```markdown
---
artifact: jtbd
stage: 1
persona: "<persona name>"
provenance: generated
---

# JTBD: <brief title>

When I **[situation]**, I want to **[motivation]**, so I can **[outcome]**.

## Context

[1-2 sentences grounding the JTBD in the persona's thinking style]

## Acceptance signal

[What observable behavior would confirm this JTBD is being met]
```

**5. Write synthesis document**

Write `design/research/synthesis.md` with YAML frontmatter:

```yaml
---
artifact: findings
stage: 1
generated: <ISO datetime>
owner: <project owner or 'design-os/discover'>
lastReviewedAt: <ISO datetime>
sourceHash: sha256:<hash>
worstProvenance: <computed worst provenance across all cited personas>
cites:
  - research/personas/<slug-1>.persona.json
  - research/personas/<slug-2>.persona.json
---
```

The `worstProvenance` field is the worst (most conservative) provenance value
across all cited personas:
- Precedence: 'missing' > 'generated' > 'inferred' > 'validated'
- Example: 2 generated + 1 validated → worstProvenance: generated

The synthesis body should include:
- Summary of key patterns across personas
- Cross-persona tensions (where personas have conflicting needs)
- Design principles derived from the JTBD analysis
- Competitive/analogous product observations (based on product description)
- Recommended Stage 2 IA starting points per JTBD

**6. Validate worstProvenance propagation**

If `assets/scripts/frontmatter-validate.mjs` is available:
```bash
node assets/scripts/frontmatter-validate.mjs --check-worst-provenance design/research/synthesis.md design/
```
Fix any validation errors before proceeding.

Note: the base dir argument must be `design/` (not `design/research/`). The `cites:` paths
in synthesis.md frontmatter are relative to `design/` (e.g., `research/personas/slug.persona.json`).
Passing `design/research/` as base would cause the validator to look for
`design/research/research/personas/...` which does not exist.
