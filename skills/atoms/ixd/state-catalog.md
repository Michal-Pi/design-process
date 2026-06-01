---
name: "complete-design/ixd/state-catalog"
description: "Stage 4 atom: enumerate loading/empty/error/success states per screen, populate interaction-spec.v1.json frontmatter, cite HAX-18 if asyncOperations:true."
type: atom
stage: 4
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
references:
  - "@${CLAUDE_SKILL_DIR}/references/hax-18.md"
---

# Atom: ixd/state-catalog — ATOM-12

Enumerate all UI states for a given screen and emit a `.spec.md` file with
`interaction-spec.v1.json`-compatible YAML frontmatter.

## Procedure

Given a screen name (kebab-case, e.g., `dashboard`, `checkout-flow`):

1. **Enumerate required state types:** Every screen MUST have at least these four:
   - `loading` — screen fetching or processing data
   - `empty` — screen rendered but no content (zero-state, first-use)
   - `error` — failure state (network error, validation failure, permission denied)
   - `success` — primary happy-path state (data loaded, form submitted)

2. **Add screen-specific states as needed (type: `custom`):**
   Common additional states: `offline`, `permission-denied`, `rate-limited`, `timeout`,
   `partial` (some data loaded), `stale` (data loaded but outdated), `optimistic` (speculative UI).
   Add only states that are genuinely needed — do not enumerate exhaustively.

3. **Set frontmatter fields:**
   - `asyncOperations: boolean` — Set `true` ONLY if the screen fetches data, submits a form,
     or performs an async network operation. Static screens (e.g., static info pages) should
     use `asyncOperations: false`.
   - `stateCount: number` — Count of all states in the `states[]` array (required + custom).
   - `hasConditionalTransitions: boolean` — Set `true` if any transition depends on a condition
     (e.g., DONE → success vs DONE → error based on response).

4. **HAX-18 note (asyncOperations:true screens only):**
   If `asyncOperations: true`, read `@${CLAUDE_SKILL_DIR}/references/hax-18.md` and cite at least one relevant
   guideline in the spec body. Key guidelines:
   - G1: Make clear when the system uses AI features
   - G7: Support efficient invocation for AI features
   - G16: Convey confidence levels and AI limitations
   The `stage-4-pr.mjs` detector flags missing citations as `4-pr-hax18-001`.

5. **Emit `<screen>.spec.md`** to the staged output path:
   `.complete-design/preview/<run-id>/interactions/<screen>.spec.md`

## Output Format

```markdown
---
artifact: interaction-spec
stage: "4"
schemaVersion: 1
screen: <screen>
asyncOperations: <true|false>
stateCount: <N>
hasConditionalTransitions: <true|false>
sourceHash: sha256:<computed>
generated: "<ISO-8601 timestamp>"
provenance: generated
owner: <owner>
lastReviewedAt: "<ISO-8601 timestamp>"
mermaidStateDiagram: placeholder
states:
  - name: loading
    type: loading
  - name: empty
    type: empty
  - name: error
    type: error
  - name: success
    type: success
  # Additional custom states as needed
---

# <Screen> Interaction Spec

<Brief description of the screen's purpose and primary user task>

## State Descriptions

### loading
<What the user sees while data loads>

### empty
<What the user sees when there is no content>

### error
<What the user sees when an error occurs>

### success
<What the user sees in the primary happy path>

<!-- If asyncOperations:true, cite HAX-18 guidelines below -->
```
