---
name: "complete-design/system/scaffold-component"
description: "Stage 5b: Scaffold a component that recurs ≥3× — creates DTCG token entry, Mermaid diagram stub, and wiring notes."
type: atom
stage: 5b
compatibility:
  - claude-code
  - codex-cli
  - cursor
---

# Atom: scaffold-component (ATOM-15)

Scaffold a component into the design system. Only scaffold components that appear ≥3× in upstream wireframes and interaction specs. Gate will block if count < 3 (FID-06, D-70).

## Prerequisites

- Stage 5a gate must have passed (design/tokens.json with primitive + semantic tiers exists)
- The component must appear ≥3× across design/wireframes/ and design/interactions/

## Procedure

### Step 1 — Verify Frost recurrence (FID-06 gate check)

Verify the target component passes gate-stage-5b Frost recurrence check (≥3× in wireframes + interactions combined). Run:

```
node bin/complete-design.mjs gate --stage 5b --design-dir .complete-design/preview/<run-id>/
```

If the gate returns `failed_after_repair` with `reason: frost-recurrence-not-met`, the component does not yet appear ≥3×. Do not proceed — add the component to more wireframes or interaction specs first.

### Step 2 — Create DTCG token entry

Add a component-tier token entry to design/tokens.json. The component-tier key references primitive and semantic tokens established in Stage 5a:

```json
{
  "component": {
    "<component-name>": {
      "background": { "$type": "color", "$value": "{semantic.color.primary}" },
      "label": { "$type": "color", "$value": "{semantic.color.on-primary}" },
      "border-radius": { "$type": "dimension", "$value": "{primitive.space.xs}" }
    }
  }
}
```

### Step 3 — Create component scaffold file

Create design/components/<component-name>.md with wiring notes:

```markdown
# Component: <ComponentName>

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | required | Button label text |
| disabled | boolean | false | Disabled state |
| loading | boolean | false | Loading state |

## State Enum

- default: Normal interactive state
- loading: Async operation in progress
- disabled: Non-interactive
- error: Operation failed (if applicable)

## Accessibility

Pattern: @${CLAUDE_SKILL_DIR}/references/apg.md (button role, keyboard: Enter/Space activate)
Touch target: ≥44×44px per Material 3 (@${CLAUDE_SKILL_DIR}/references/material-3.md)
```

### Step 4 — Emit Mermaid component state stub

For stateful components (loading/disabled/default states), emit a minimal stateDiagram-v2:

```
stateDiagram-v2
  [*] --> default
  default --> loading : ACTIVATE
  loading --> default : SUCCESS
  loading --> error : FAIL
  error --> default : RETRY
  default --> disabled : DISABLE
  disabled --> default : ENABLE
```

Save to design/interactions/<component-name>.diagram.mmd.

## FID-06 Guidance

Only scaffold components that appear ≥3× in upstream wireframes and interaction specs. Gate will block if count < 3.

Reference: @${CLAUDE_SKILL_DIR}/references/apg.md (accessibility patterns), @${CLAUDE_SKILL_DIR}/references/material-3.md (component anatomy)
