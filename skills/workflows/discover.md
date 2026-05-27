---
name: "design-os/discover"
description: "Design research: generate proto-personas, synthesize job stories and OST from PRD, run Stage 1 provenance gate"
stage: 1
gate: "gate/stage-1-complete"
artifacts:
  reads:
    - "design/.handoff/stage-0-bundle.md"
  writes:
    - "design/research/personas/*.persona.json"
    - "design/research/jobs/*.jtbd.md"
    - "design/research/ost.mmd"
    - "design/ASSUMPTIONS.md"
    - "design/.handoff/stage-1-bundle.md"
composition:
  atoms:
    - "research/personas-proto"
    - "research/build-ost"
    - "research/synthesize"
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

# discover — Stage 1 Research Workflow

Runs the full Stage 1 research workflow: TRUST-05 intake, proto-persona generation,
OST construction, JTBD synthesis, and Stage 1 gate evaluation.

**Fidelity discipline (FID-01):** Stage 1 is problem-space only. No UI, screens,
buttons, or solution references allowed in persona content. Any solution-language
found in generated content is automatically removed.

**Trust posture:** Never claims VALIDATED grade without real interview files.
All synthetic-persona output is labeled `provenance: generated` and `evidence: proto`.

---

## Procedure

**1. Read stage-0 handoff bundle**

Read `design/.handoff/stage-0-bundle.md`. If absent, check for `design/PRD.md`
directly. If neither exists, halt with message:
"Run design-os ingest first (or create design/PRD.md with your product requirements)."

**2. Load reference files**

Read the following references to ground persona generation and synthesis:
- `${CLAUDE_SKILL_DIR}/references/garrett-elements.md` — Stage 1 = Strategy plane (user needs, product objectives)
- `${CLAUDE_SKILL_DIR}/references/indi-young-thinking-styles.md` — Indi Young thinking-style format for personas
- `${CLAUDE_SKILL_DIR}/references/torres-ost.md` — Torres Opportunity Solution Tree format
- `${CLAUDE_SKILL_DIR}/references/klement-jtbd.md` — Klement Jobs To Be Done statement format

**2a. Depth dispatch (F-07)**

Check for `--depth` flag:
- `--depth lightweight`: skip TRUST-05 intake; use 1 persona, 2 JTBDs; proceed to step 4.
- `--depth full`: expand to 5 intake questions, 3-4 personas, 4-5 JTBDs.
- Default (no flag or `--depth standard`): 3-5 intake questions, 2-3 personas, 2-4 JTBDs.

**3. TRUST-05 intake (standard and full depth only)**

Before generating anything, ask the user these questions. Do NOT proceed until
they respond:

(a) "What is the core user problem this product solves?"
(b) "Who are the 2-3 user archetypes you have in mind? (brief descriptions, or 'not sure yet')"
(c) "What prior user research exists? (interviews, surveys, analytics — or 'none')"
(d) "What channels or contexts do users encounter this product in?"
(e) "Any accessibility or internationalisation constraints?"

Record all answers. They ground persona generation and reduce hallucinated claims.

**4. Inline ATOM-03: Generate proto-personas (research/personas-proto)**

Using the intake answers and `${CLAUDE_SKILL_DIR}/references/indi-young-thinking-styles.md`:
- Generate 2-3 proto-personas using Indi Young thinking-style format.
  Each persona must include: `cognitiveSpace`, `emotionalReactions`, `guidingPrinciples`.
- Write each persona to `design/research/personas/<slug>.persona.json` with YAML frontmatter:
  ```
  artifact: persona
  stage: "1"
  schemaVersion: 1
  provenance: generated
  worstProvenance: generated
  generated: <ISO datetime>
  owner: <from intake or 'design-os/discover'>
  ```
- Write `design/ASSUMPTIONS.md` listing every specific claim made about each persona
  as a numbered item to validate with real users.
- **FID-01 enforcement:** Scan generated persona content for solution-language patterns
  (e.g., "button", "modal", "screen", "UI", "app feature", "dashboard"). If found,
  remove them and note: "FID-01: Solution references removed — Stage 1 is problem-space only."

**5. Inline ATOM-04: Build Opportunity Solution Tree (research/build-ost)**

Using the personas and `${CLAUDE_SKILL_DIR}/references/torres-ost.md`:
- For each persona, identify 1-2 primary objectives (outcomes they seek).
- Structure a Torres OST: Objectives → Strategies → Tactics.
- Emit as Mermaid flowchart to `design/research/ost.mmd` (flowchart LR format).
  Example structure:
  ```mermaid
  flowchart LR
    O1[Objective: Reduce cognitive overhead]
    S1[Strategy: Surface context proactively]
    T1[Tactic: Pre-meeting context cards]
    O1 --> S1 --> T1
  ```

**6. Inline ATOM-02: Synthesize JTBDs (research/synthesize)**

Using the personas, OST, and `${CLAUDE_SKILL_DIR}/references/klement-jtbd.md`:
- For each persona, derive 1-2 JTBDs in Klement format:
  "When I [situation], I want to [motivation], so I can [expected outcome]."
- Write each JTBD to `design/research/jobs/<slug>.jtbd.md`.
- Write `design/research/synthesis.md` with YAML frontmatter:
  ```
  artifact: findings
  stage: 1
  worstProvenance: generated
  cites: [research/personas/<slug>.persona.json, ...]
  ```
  The `worstProvenance` field propagates from the worst persona provenance (D-38).
  Synthesize key patterns, competitive landscape observations, and design principles
  derived from the JTBD analysis.

**7. Token cost check**

```bash
node assets/scripts/cli/budget-check.mjs --stage discover --check post
```

If the script is absent (ships in Plan 02-05), skip with warning:
"budget-check.mjs not yet available — skipping cost gate. Plan 02-05 ships this."

**8. Run Stage 1 gate**

```bash
node bin/design-os.mjs gate --stage 1 --design-dir design/
```

- If `result.kind === 'not_runnable'`: halt with message and list what is missing.
- If `result.kind === 'pass_with_warnings'`: surface findings to user:
  "Stage 1 complete (proto-grade). Findings: [list findings]. Real user research
  (interviews in design/research/interviews/) will unlock VALIDATED grade."
- If `result.kind === 'pass'` and `result.evidence === 'validated'`: congratulate:
  "Stage 1 complete (VALIDATED grade). Proceed to Stage 2."

**9. Build Stage 1 handoff bundle**

```bash
node assets/scripts/handoff-bundle-build.mjs --stage 1 --design-dir design/
```

This writes `design/.handoff/stage-1-bundle.md` for Stage 2 consumption.

**10. Update MANIFEST.md**

```bash
node assets/scripts/manifest-md-reconcile.mjs --design-dir design/
```

**11. Present artifacts for review**

Display the staged artifacts from `design/research/` and `design/.handoff/stage-1-bundle.md`
for user review. Await `--apply` flag before writing to `design/`.

If the user approves: run `node assets/scripts/cli/apply.mjs --stage 1 --design-dir design/`
to finalize the artifacts.

---

## Host fallback

For Codex CLI / Cursor (no subagent dispatch — sequential single-context execution):

Run steps 1-11 sequentially in a single context window. Replace step 8 Bash invocation
with direct execution: `node bin/design-os.mjs gate --stage 1 --design-dir design/`
(no parallel execution). The sub-agent dispatch in step 4-6 is inline in this context.
Ensure the context window is not exceeded; if persona generation causes context bloat,
truncate persona descriptions to 3 bullet points each and continue.
