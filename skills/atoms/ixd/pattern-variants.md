---
name: "design-os/ixd/pattern-variants"
description: "Stage 4 atom: identify 3 candidate interaction patterns from Tidwell/APG/Material 3 with tradeoffs table and accessibility notes per screen."
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
  - "@${CLAUDE_SKILL_DIR}/references/tidwell-patterns.md"
  - "@${CLAUDE_SKILL_DIR}/references/apg.md"
  - "@${CLAUDE_SKILL_DIR}/references/material-3.md"
---

# Atom: ixd/pattern-variants — ATOM-11

For each screen, identify 3 candidate interaction patterns from canonical design references
and document them with a tradeoffs table and accessibility notes.

## Procedure

Given a screen name and its `<screen>.spec.md`:

1. **Read the screen's state catalog** from `.design-os/preview/<run-id>/interactions/<screen>.spec.md`.
   Identify the primary interaction type (form, list, data grid, navigation, dialog, etc.).

2. **Select 3 candidate patterns** from these canonical sources:
   - **Tidwell** ("Designing Interfaces" 3e): List Builder, Card Stack, Fill-in-the-Blanks,
     Responsive Disclosure, Progress Indicators, Inline Validation, Forgiving Format
   - **W3C APG** (Aria Patterns Guide): Combobox, Listbox, Menu Button, Dialog, Tabs, Accordion,
     Breadcrumb, Carousel, Date Picker, Disclosure, Feed, Grid, Link, Slider, Spinbutton, Switch,
     Table, Toolbar, Tree, Treegrid
   - **Material Design 3**: Bottom Sheets, Cards, Chips, Dialogs, FAB, Lists, Menus, Navigation Bar,
     Navigation Drawer, Navigation Rail, Progress Indicators, Search, Snackbars, Tabs, Time Pickers

3. **For each pattern, document:**
   - Name + source (Tidwell chapter, APG pattern URL, or Material 3 component name)
   - 2 pros, 2 cons
   - Accessibility note from APG (ARIA roles, keyboard interactions, focus management)
   - Fit score for this screen (high/medium/low)

4. **Emit `<screen>-patterns.md`** to `.design-os/preview/<run-id>/interactions/<screen>-patterns.md`

## Output Format

```markdown
# <Screen> Pattern Variants

Candidate interaction patterns for the <screen> screen.
Primary interaction type: <form|list|navigation|dialog|...>

## Pattern Option A: <Pattern Name>

**Source:** Tidwell §N / W3C APG — <pattern-name> / Material Design 3 — <component>
**Fit:** high | medium | low

### Tradeoffs

| Pros | Cons |
|------|------|
| <Pro 1> | <Con 1> |
| <Pro 2> | <Con 2> |

### Accessibility (W3C APG)

- **ARIA role:** `<role>`
- **Keyboard:** <Tab navigation, Enter to activate, Escape to dismiss, etc.>
- **Focus management:** <Where focus goes on open/close/select>

---

## Pattern Option B: <Pattern Name>
...

## Pattern Option C: <Pattern Name>
...

## Recommendation

**Selected:** Option <A|B|C> — <brief rationale (1 sentence)>
```
