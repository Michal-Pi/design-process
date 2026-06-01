---
name: "complete-design/prd/parse-or-interview"
description: "Auto-detect existing PRD and parse it, or launch 5-7 question Lenny 1-pager interview if no PRD found"
stage: 0
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

# parse-or-interview — PRD Parse or Lenny Interview Atom (ATOM-01)

Auto-detects an existing PRD and parses it into structured frontmatter.
If no PRD is found (or it has < 50 tokens of substantive content), launches
the Lenny 1-pager interview framework to capture product intent.

**Implements:** D-35 (PRD auto-detect via registry signals), ATOM-01.

---

## Standalone bootstrap

Use this atom directly when you want to capture product intent without running
the full `ingest` workflow.

Before running, confirm:
1. "What project directory should I scan for an existing PRD?"
2. "Where should I write the output PRD.md?"
3. "Which depth: lightweight (minimal interview) or standard (full 5-7 questions)?"

---

## Workflow procedure

### Step A: Detect PRD

Scan for `PRD*.md` files in:
- Project root (`./`)
- `design/` directory
- Any path hinted by registry signals (package.json location)

**Check substantive content:** count tokens in structured sections
(problem_statement, target_users, success_metrics). If total > 50 tokens,
proceed to Parse mode.

### Step B (Parse mode): Extract structured content

Read the existing PRD. Extract and normalise:

```yaml
product_name: "<name>"
problem_statement: "<1-3 sentences>"
target_users: "<primary persona description>"
success_metrics: "<measurable outcomes>"
constraints: "<time, team, budget, or technical constraints>"
out_of_scope: "<explicit v1 exclusions>"
```

**If any field is missing:** ask one clarifying question per gap. Do not
fabricate missing fields.

Surface: "Found PRD: `<product_name>`. Parsed `<N>` structured fields."

### Step C (Interview mode): Lenny 1-pager interview

No PRD found or content is insufficient. Launch the interview:

**Question 1:** "What product are you building? (Name and one-line description)"

**Question 2:** "Who is the primary user? (Role, context, or persona type — not 'everyone')"

**Question 3:** "What problem does this product solve for them? (The specific pain or gap)"

**Question 4:** "What does success look like in 6 months? (A metric, milestone, or observable outcome)"

**Question 5:** "What are the biggest constraints? (Time, team size, budget, technical limitations)"

**Question 6:** "What is explicitly out of scope for v1? (Name 1-3 things you are NOT building)"

**Question 7 (optional):** "Are there existing tools or workarounds the user currently uses? (Competitive context)"

### Step D: Write structured PRD

Write the captured data to the output path with YAML frontmatter:

```yaml
artifact: prd
stage: 0
provenance: generated
evidence: proto
schemaVersion: 1
generated: <ISO timestamp>
```

Body:

```markdown
# <product_name>

## Problem Statement
<problem_statement>

## Target Users
<target_users>

## Success Metrics
<success_metrics>

## Constraints
<constraints>

## Out of Scope
<out_of_scope>
```

### Step E: Surface summary

Print 3-line summary:

```
Found/Created PRD: <product_name>.
Parsed <N> requirements.
Run `design --route <suggested-route>` to proceed.
```

Suggest route based on context:
- Existing `design/` with tokens.json → suggest `brand-refresh` or `design-bug`
- No `design/` directory → suggest `new-feature`
- Existing Lovable/v0 prototype signals → note `DS-extraction` ships in v2.0b

---

## Notes

- **provenance: generated** — PRD from interview mode. Downstream artifacts
  carry `evidence: proto` until user validates with real research.
- **provenance: validated** — Set manually if user has reviewed and confirmed
  the PRD against real user data or stakeholder sign-off.
- Never set `evidence: validated` automatically from interview output.
  Per D-35 red-line: the LLM interview produces `proto` grade only.
